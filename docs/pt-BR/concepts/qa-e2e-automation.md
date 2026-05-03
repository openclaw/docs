---
read_when:
    - Compreendendo como a pilha de QA se encaixa
    - Estendendo qa-lab, qa-channel ou um adaptador de transporte
    - Adicionando cenários de QA baseados em repositório
    - Criando automação de QA de maior realismo em torno do painel do Gateway
summary: 'Visão geral da pilha de QA: qa-lab, qa-channel, cenários baseados no repositório, faixas de transporte ao vivo, adaptadores de transporte e relatórios.'
title: Visão geral da garantia de qualidade
x-i18n:
    generated_at: "2026-05-03T21:30:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1446fddb00855634d34662a0a47be1e5054a9e7bfed5bc9ae21185d87094d8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

A pilha privada de QA serve para exercitar o OpenClaw de uma forma mais realista,
moldada por canal, do que um único teste unitário consegue.

Peças atuais:

- `extensions/qa-channel`: canal de mensagens sintético com superfícies de DM,
  canal, thread, reação, edição e exclusão.
- `extensions/qa-lab`: UI de depuração e barramento de QA para observar a transcrição,
  injetar mensagens de entrada e exportar um relatório em Markdown.
- `extensions/qa-matrix`, plugins executores futuros: adaptadores de transporte ao vivo que
  conduzem um canal real dentro de um Gateway de QA filho.
- `qa/`: assets iniciais mantidos no repo para a tarefa de kickoff e cenários
  baseline de QA.
- [Mantis](/pt-BR/concepts/mantis): verificação ao vivo antes e depois para bugs que
  precisam de transportes reais, capturas de tela do navegador, estado de VM e evidências de PR.

## Superfície de comandos

Todo fluxo de QA roda em `pnpm openclaw qa <subcommand>`. Muitos têm aliases de script `pnpm qa:*`;
ambas as formas são suportadas.

| Comando                                             | Finalidade                                                                                                                                                             |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autoverificação de QA incluída; grava um relatório em Markdown.                                                                                                        |
| `qa suite`                                          | Executa cenários mantidos no repo contra a faixa do Gateway de QA. Aliases: `pnpm openclaw qa suite --runner multipass` para uma VM Linux descartável.                 |
| `qa coverage`                                       | Imprime o inventário de cobertura de cenários em markdown (`--json` para saída de máquina).                                                                            |
| `qa parity-report`                                  | Compara dois arquivos `qa-suite-summary.json` e grava o relatório de paridade agentic.                                                                                 |
| `qa character-eval`                                 | Executa o cenário de QA de personagem em vários modelos ao vivo com um relatório julgado. Veja [Relatórios](#reporting).                                               |
| `qa manual`                                         | Executa um prompt único contra a faixa do provedor/modelo selecionado.                                                                                                 |
| `qa ui`                                             | Inicia a UI de depuração de QA e o barramento local de QA (alias: `pnpm qa:lab:ui`).                                                                                   |
| `qa docker-build-image`                             | Cria a imagem Docker de QA pré-preparada.                                                                                                                             |
| `qa docker-scaffold`                                | Grava um scaffold de docker-compose para o painel de QA + faixa do Gateway.                                                                                            |
| `qa up`                                             | Cria o site de QA, inicia a pilha com Docker e imprime a URL (alias: `pnpm qa:lab:up`; a variante `:fast` adiciona `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Inicia apenas o servidor do provedor AIMock.                                                                                                                          |
| `qa mock-openai`                                    | Inicia apenas o servidor do provedor `mock-openai` ciente de cenários.                                                                                                |
| `qa credentials doctor` / `add` / `list` / `remove` | Gerencia o pool compartilhado de credenciais do Convex.                                                                                                                |
| `qa matrix`                                         | Faixa de transporte ao vivo contra um homeserver Tuwunel descartável. Veja [QA do Matrix](/pt-BR/concepts/qa-matrix).                                                       |
| `qa telegram`                                       | Faixa de transporte ao vivo contra um grupo privado real do Telegram.                                                                                                  |
| `qa discord`                                        | Faixa de transporte ao vivo contra um canal real de guild privada do Discord.                                                                                          |
| `qa mantis`                                         | Executor de verificação antes e depois para bugs de transporte ao vivo, com o primeiro cenário de reações de status do Discord. Veja [Mantis](/pt-BR/concepts/mantis).       |

## Fluxo do operador

O fluxo atual do operador de QA é um site de QA em dois painéis:

- Esquerda: painel do Gateway (Control UI) com o agente.
- Direita: QA Lab, mostrando a transcrição parecida com Slack e o plano de cenário.

Execute com:

```bash
pnpm qa:lab:up
```

Isso cria o site de QA, inicia a faixa do Gateway com Docker e expõe a
página do QA Lab, onde um operador ou loop de automação pode dar ao agente uma
missão de QA, observar o comportamento real do canal e registrar o que funcionou, falhou ou
permaneceu bloqueado.

Para uma iteração mais rápida da UI do QA Lab sem recriar a imagem Docker a cada vez,
inicie a pilha com um bundle do QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantém os serviços Docker em uma imagem pré-criada e monta por bind
`extensions/qa-lab/web/dist` no contêiner `qa-lab`. `qa:lab:watch`
recria esse bundle quando há alterações, e o navegador recarrega automaticamente quando o hash dos assets do QA Lab
muda.

Para um smoke local de trace do OpenTelemetry, execute:

```bash
pnpm qa:otel:smoke
```

Esse script inicia um receptor local de trace OTLP/HTTP, executa o cenário de QA
`otel-trace-smoke` com o plugin `diagnostics-otel` habilitado, depois
decodifica os spans protobuf exportados e valida o formato crítico para release:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` e `openclaw.message.delivery` devem estar presentes;
chamadas de modelo não devem exportar `StreamAbandoned` em turnos bem-sucedidos; IDs diagnósticos brutos e
atributos `openclaw.content.*` devem ficar fora do trace. Ele grava
`otel-smoke-summary.json` ao lado dos artefatos da suíte de QA.

A QA de observabilidade permanece apenas para checkout do código-fonte. O tarball npm omite intencionalmente
o QA Lab, então as faixas de release Docker de pacote não executam comandos `qa`. Use
`pnpm qa:otel:smoke` a partir de um checkout de código-fonte compilado ao alterar a instrumentação de
diagnósticos.

Para uma faixa de smoke do Matrix com transporte real, execute:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

A referência completa da CLI, o catálogo de perfis/cenários, as env vars e o layout de artefatos dessa faixa ficam em [QA do Matrix](/pt-BR/concepts/qa-matrix). Em resumo: ela provisiona um homeserver Tuwunel descartável no Docker, registra usuários temporários de driver/SUT/observer, executa o plugin real do Matrix dentro de um Gateway de QA filho escopado para esse transporte (sem `qa-channel`), depois grava um relatório em Markdown, resumo JSON, artefato de eventos observados e log de saída combinado em `.artifacts/qa-e2e/matrix-<timestamp>/`.

Para faixas de smoke do Telegram e Discord com transporte real:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Ambas miram um canal real preexistente com dois bots (driver + SUT). Env vars obrigatórias, listas de cenários, artefatos de saída e o pool de credenciais do Convex estão documentados na [referência de QA do Telegram e Discord](#telegram-and-discord-qa-reference) abaixo.

Antes de usar credenciais ao vivo em pool, execute:

```bash
pnpm openclaw qa credentials doctor
```

O doctor verifica o ambiente do broker Convex, valida configurações de endpoint e verifica a acessibilidade de admin/list quando o segredo de mantenedor está presente. Ele relata apenas o status definido/ausente para segredos.

## Cobertura de transporte ao vivo

As faixas de transporte ao vivo compartilham um contrato em vez de cada uma inventar seu próprio formato de lista de cenários. `qa-channel` é a ampla suíte sintética de comportamento de produto e não faz parte da matriz de cobertura de transporte ao vivo.

| Faixa    | Canary | Controle por menção | Bot para bot | Bloqueio de allowlist | Resposta de nível superior | Retomada após reinício | Acompanhamento de thread | Isolamento de thread | Observação de reação | Comando de ajuda | Registro de comando nativo |
| -------- | ------ | ------------------- | ------------ | --------------------- | -------------------------- | ---------------------- | ------------------------ | -------------------- | -------------------- | ---------------- | -------------------------- |
| Matrix   | x      | x                   | x            | x                     | x                          | x                      | x                        | x                    | x                    |                  |                            |
| Telegram | x      | x                   | x            |                       |                            |                        |                          |                      |                      | x                |                            |
| Discord  | x      | x                   | x            |                       |                            |                        |                          |                      |                      |                  | x                          |

Isso mantém `qa-channel` como a ampla suíte de comportamento de produto, enquanto Matrix,
Telegram e futuros transportes ao vivo compartilham uma checklist explícita de contrato de transporte.

Para uma faixa de VM Linux descartável sem trazer o Docker para o caminho de QA, execute:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Isso inicializa um guest Multipass novo, instala dependências, compila o OpenClaw
dentro do guest, executa `qa suite` e depois copia o relatório e o
resumo normais de QA de volta para `.artifacts/qa-e2e/...` no host.
Ele reutiliza o mesmo comportamento de seleção de cenários que `qa suite` no host.
Execuções da suíte no host e no Multipass executam vários cenários selecionados em paralelo
com workers isolados de Gateway por padrão. `qa-channel` usa concorrência padrão
4, limitada pela contagem de cenários selecionados. Use `--concurrency <count>` para ajustar
a contagem de workers, ou `--concurrency 1` para execução serial.
O comando sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
quiser artefatos sem um código de saída de falha.
Execuções ao vivo encaminham as entradas de autenticação de QA suportadas que são práticas para o
guest: chaves de provedor baseadas em env, o caminho de configuração do provedor ao vivo de QA e
`CODEX_HOME` quando presente. Mantenha `--output-dir` sob a raiz do repo para que o guest
possa gravar de volta pelo workspace montado.

## Referência de QA do Telegram e Discord

Matrix tem uma [página dedicada](/pt-BR/concepts/qa-matrix) por causa de sua contagem de cenários e provisionamento de homeserver com Docker. Telegram e Discord são menores — um punhado de cenários cada, sem sistema de perfis, contra canais reais preexistentes — então a referência deles fica aqui.

### Flags compartilhadas da CLI

Ambas as faixas são registradas por meio de `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e aceitam as mesmas flags:

| Sinalizador                          | Padrão                                                    | Descrição                                                                                                                    |
| ------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | Execute apenas este cenário. Repetível.                                                                                      |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Onde relatórios/resumo/mensagens observadas e o log de saída são gravados. Caminhos relativos são resolvidos em relação a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Raiz do repositório ao invocar de um cwd neutro.                                                                              |
| `--sut-account <id>`                  | `sut`                                                     | ID temporário da conta dentro da configuração do Gateway de QA.                                                               |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` ou `live-frontier` (`live-openai` legado ainda funciona).                                                       |
| `--model <ref>` / `--alt-model <ref>` | padrão do provedor                                        | Refs do modelo primário/alternativo.                                                                                         |
| `--fast`                              | desativado                                                | Modo rápido do provedor onde houver suporte.                                                                                  |
| `--credential-source <env\|convex>`   | `env`                                                     | Veja [pool de credenciais do Convex](#convex-credential-pool).                                                               |
| `--credential-role <maintainer\|ci>`  | `ci` em CI, caso contrário `maintainer`                   | Papel usado quando `--credential-source convex`.                                                                              |

Ambos saem com código diferente de zero em qualquer cenário com falha. `--allow-failures` grava artefatos sem definir um código de saída com falha.

### QA do Telegram

```bash
pnpm openclaw qa telegram
```

Tem como alvo um grupo privado real do Telegram com dois bots distintos (driver + SUT). O bot SUT precisa ter um nome de usuário do Telegram; a observação bot a bot funciona melhor quando ambos os bots têm o **Bot-to-Bot Communication Mode** habilitado em `@BotFather`.

Env obrigatório quando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — ID numérico do chat (string).
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

Artefatos de saída:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — inclui RTT por resposta (envio do driver → resposta SUT observada) começando pelo canário.
- `telegram-qa-observed-messages.json` — corpos redigidos, a menos que `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA do Discord

```bash
pnpm openclaw qa discord
```

Tem como alvo um canal de guilda privado real do Discord com dois bots: um bot driver controlado pelo harness e um bot SUT iniciado pelo Gateway filho do OpenClaw por meio do Plugin Discord incluído. Verifica o tratamento de menções no canal, se o bot SUT registrou o comando nativo `/help` no Discord e cenários opcionais de evidência do Mantis.

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
- `discord-status-reactions-tool-only` — cenário opcional do Mantis. Executa sozinho porque alterna o SUT para respostas de guilda sempre ativas e apenas por ferramentas com `messages.statusReactions.enabled=true`; em seguida, captura uma linha do tempo de reações REST mais um artefato visual HTML/PNG.

Execute o cenário de reações de status do Mantis explicitamente:

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
- `discord-qa-reaction-timelines.json` e `discord-status-reactions-tool-only-timeline.png` quando o cenário de reações de status é executado.

### Pool de credenciais do Convex

As lanes do Telegram e do Discord podem alugar credenciais de um pool Convex compartilhado em vez de ler as env vars acima. Passe `--credential-source convex` (ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); o QA Lab adquire uma locação exclusiva, envia Heartbeat para ela durante a execução e a libera no desligamento. Os tipos de pool são `"telegram"` e `"discord"`.

Formatos de payload que o broker valida em `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` deve ser uma string de chat-id numérica.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

As env vars operacionais e o contrato do endpoint do broker Convex ficam em [Testes → Credenciais compartilhadas do Telegram via Convex](/pt-BR/help/testing#shared-telegram-credentials-via-convex-v1) (o nome da seção é anterior ao suporte ao Discord; a semântica do broker é idêntica para ambos os tipos).

## Seeds baseadas em repositório

Os ativos de seed ficam em `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Eles estão intencionalmente no git para que o plano de QA fique visível tanto para humanos quanto para o
agente.

`qa-lab` deve permanecer um runner genérico de markdown. Cada arquivo de cenário em markdown é
a fonte da verdade para uma execução de teste e deve definir:

- metadados do cenário
- metadados opcionais de categoria, capacidade, lane e risco
- refs de docs e código
- requisitos opcionais de Plugin
- patch opcional de configuração do Gateway
- o `qa-flow` executável

A superfície reutilizável de runtime que sustenta o `qa-flow` pode permanecer genérica
e transversal. Por exemplo, cenários em markdown podem combinar helpers do lado do transporte
com helpers do lado do navegador que controlam a Control UI incorporada por meio do
seam `browser.request` do Gateway sem adicionar um runner de caso especial.

Os arquivos de cenário devem ser agrupados por capacidade do produto, não por pasta da árvore
de código-fonte. Mantenha os IDs dos cenários estáveis quando arquivos forem movidos; use `docsRefs` e `codeRefs`
para rastreabilidade da implementação.

A lista de baseline deve permanecer ampla o bastante para cobrir:

- DM e chat de canal
- comportamento de thread
- ciclo de vida de ação de mensagem
- callbacks Cron
- recuperação de memória
- troca de modelo
- handoff de subagente
- leitura de repositório e leitura de docs
- uma pequena tarefa de build, como Lobster Invaders

## Lanes de mock de provedor

`qa suite` tem duas lanes locais de mock de provedor:

- `mock-openai` é o mock do OpenClaw consciente de cenários. Ele permanece como a lane de mock
  determinística padrão para QA baseada em repositório e gates de paridade.
- `aimock` inicia um servidor de provedor baseado em AIMock para cobertura experimental de protocolo,
  fixture, gravação/replay e caos. Ele é aditivo e não
  substitui o dispatcher de cenários `mock-openai`.

A implementação de lanes de provedor fica em `extensions/qa-lab/src/providers/`.
Cada provedor possui seus padrões, inicialização de servidor local, configuração de modelo do Gateway,
necessidades de staging de perfil de autenticação e flags de capacidade live/mock. O código compartilhado de suíte e
Gateway deve rotear pelo registro de provedores em vez de fazer branching por
nomes de provedores.

## Adaptadores de transporte

`qa-lab` possui um seam genérico de transporte para cenários de QA em markdown. `qa-channel` é o primeiro adaptador nesse seam, mas o alvo de design é mais amplo: canais reais ou sintéticos futuros devem se conectar ao mesmo runner de suíte em vez de adicionar um runner de QA específico de transporte.

No nível de arquitetura, a divisão é:

- `qa-lab` possui execução genérica de cenários, concorrência de workers, gravação de artefatos e relatórios.
- O adaptador de transporte possui configuração do Gateway, prontidão, observação de entrada e saída, ações de transporte e estado de transporte normalizado.
- Arquivos de cenário em markdown sob `qa/scenarios/` definem a execução do teste; `qa-lab` fornece a superfície reutilizável de runtime que os executa.

### Adicionando um canal

Adicionar um canal ao sistema de QA em markdown requer exatamente duas coisas:

1. Um adaptador de transporte para o canal.
2. Um pacote de cenários que exercita o contrato do canal.

Não adicione uma nova raiz de comando de QA de nível superior quando o host compartilhado `qa-lab` puder possuir o fluxo.

`qa-lab` possui a mecânica do host compartilhado:

- a raiz de comando `openclaw qa`
- inicialização e teardown da suíte
- concorrência de workers
- gravação de artefatos
- geração de relatório
- execução de cenários
- aliases de compatibilidade para cenários `qa-channel` antigos

Plugins de runner possuem o contrato de transporte:

- como `openclaw qa <runner>` é montado sob a raiz compartilhada `qa`
- como o Gateway é configurado para esse transporte
- como a prontidão é verificada
- como eventos de entrada são injetados
- como mensagens de saída são observadas
- como transcripts e estado de transporte normalizado são expostos
- como ações baseadas em transporte são executadas
- como reset ou limpeza específica do transporte é tratado

A barra mínima de adoção para um novo canal:

1. Mantenha `qa-lab` como proprietário da raiz compartilhada `qa`.
2. Implemente o runner de transporte no seam do host compartilhado `qa-lab`.
3. Mantenha mecânicas específicas do transporte dentro do Plugin de runner ou harness do canal.
4. Monte o runner como `openclaw qa <runner>` em vez de registrar um comando raiz concorrente. Plugins de runner devem declarar `qaRunners` em `openclaw.plugin.json` e exportar um array `qaRunnerCliRegistrations` correspondente de `runtime-api.ts`. Mantenha `runtime-api.ts` leve; CLI lazy e execução de runner devem ficar atrás de entrypoints separados.
5. Crie ou adapte cenários em markdown nos diretórios temáticos `qa/scenarios/`.
6. Use os helpers genéricos de cenário para novos cenários.
7. Mantenha aliases de compatibilidade existentes funcionando, a menos que o repositório esteja fazendo uma migração intencional.

A regra de decisão é estrita:

- Se o comportamento puder ser expresso uma vez em `qa-lab`, coloque-o em `qa-lab`.
- Se o comportamento depender de um transporte de canal, mantenha-o nesse Plugin de runner ou harness de Plugin.
- Se um cenário precisar de uma nova capacidade que mais de um canal possa usar, adicione um helper genérico em vez de um branch específico de canal em `suite.ts`.
- Se um comportamento só fizer sentido para um transporte, mantenha o cenário específico do transporte e explicite isso no contrato do cenário.

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

`qa-lab` exporta um relatório de protocolo em Markdown a partir da linha do tempo observada do bus.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que permaneceu bloqueado
- Quais cenários de acompanhamento valem a pena adicionar

Para o inventário dos cenários disponíveis — útil ao dimensionar trabalho de acompanhamento ou conectar um novo transporte — execute `pnpm openclaw qa coverage` (adicione `--json` para saída legível por máquina).

Para verificações de personagem e estilo, execute o mesmo cenário em vários refs de modelos
ao vivo e escreva um relatório julgado em Markdown:

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

O comando executa processos filhos do Gateway de QA local, não Docker. Cenários de avaliação de personagem
devem definir a persona por meio de `SOUL.md` e então executar turnos comuns de usuário,
como chat, ajuda no workspace e pequenas tarefas de arquivo. O modelo candidato não deve
ser informado de que está sendo avaliado. O comando preserva cada transcrição completa,
registra estatísticas básicas da execução e então pede aos modelos juízes, em modo rápido com
raciocínio `xhigh` quando houver suporte, que classifiquem as execuções por naturalidade, tom e humor.
Use `--blind-judge-models` ao comparar provedores: o prompt do juiz ainda recebe
cada transcrição e status de execução, mas refs candidatos são substituídos por
rótulos neutros como `candidate-01`; o relatório mapeia as classificações de volta aos refs reais após
o parsing.
As execuções candidatas usam `high` thinking por padrão, com `medium` para GPT-5.5 e `xhigh`
para refs de avaliação mais antigos da OpenAI que têm suporte. Sobrescreva um candidato específico inline com
`--model provider/model,thinking=<level>`. `--thinking <level>` ainda define um
fallback global, e a forma antiga `--model-thinking <provider/model=level>` é
mantida para compatibilidade.
Refs candidatos da OpenAI usam modo rápido por padrão para que o processamento prioritário seja usado quando
o provedor tiver suporte. Adicione `,fast`, `,no-fast` ou `,fast=false` inline quando um
único candidato ou juiz precisar de uma sobrescrita. Passe `--fast` somente quando quiser
forçar o modo rápido para todos os modelos candidatos. As durações de candidatos e juízes são
registradas no relatório para análise de benchmark, mas os prompts dos juízes dizem explicitamente
para não classificar por velocidade.
As execuções de modelos candidatos e juízes usam concorrência 16 por padrão. Reduza
`--concurrency` ou `--judge-concurrency` quando limites do provedor ou pressão no Gateway
local tornarem uma execução ruidosa demais.
Quando nenhum `--model` candidato é passado, a avaliação de personagem usa por padrão
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando nenhum `--model` é passado.
Quando nenhum `--judge-model` é passado, os juízes usam por padrão
`openai/gpt-5.5,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentos relacionados

- [Matriz de QA](/pt-BR/concepts/qa-matrix)
- [Canal de QA](/pt-BR/channels/qa-channel)
- [Testes](/pt-BR/help/testing)
- [Painel](/pt-BR/web/dashboard)
