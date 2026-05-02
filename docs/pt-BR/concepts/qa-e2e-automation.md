---
read_when:
    - Entendendo como a pilha de QA funciona em conjunto
    - Estendendo qa-lab, qa-channel ou um adaptador de transporte
    - Adicionando cenários de controle de qualidade baseados no repositório
    - Criando automação de QA com maior realismo para o painel do Gateway
summary: 'Visão geral da pilha de QA: qa-lab, qa-channel, cenários respaldados pelo repositório, faixas de transporte ao vivo, adaptadores de transporte e relatórios.'
title: Visão geral de QA
x-i18n:
    generated_at: "2026-05-02T20:45:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1cba04d6624bb1e0fc54105bd836f16ada0ba1cc1de9ab7065b90220e23bdf
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

A pilha privada de QA serve para exercitar o OpenClaw de uma forma mais realista,
com formato de canal, do que um único teste unitário consegue.

Peças atuais:

- `extensions/qa-channel`: canal de mensagens sintético com superfícies de DM, canal, conversa encadeada,
  reação, edição e exclusão.
- `extensions/qa-lab`: interface de depuração e barramento de QA para observar a transcrição,
  injetar mensagens de entrada e exportar um relatório em Markdown.
- `extensions/qa-matrix`, futuros plugins executores: adaptadores de transporte ao vivo que
  conduzem um canal real dentro de um Gateway de QA filho.
- `qa/`: ativos iniciais mantidos pelo repositório para a tarefa de início e cenários de QA
  de linha de base.

## Superfície de comando

Todo fluxo de QA executa sob `pnpm openclaw qa <subcommand>`. Muitos têm aliases de script `pnpm qa:*`;
ambas as formas são compatíveis.

| Comando                                             | Finalidade                                                                                                                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autoverificação de QA incluída; grava um relatório em Markdown.                                                                                                        |
| `qa suite`                                          | Executa cenários mantidos pelo repositório contra a lane do Gateway de QA. Aliases: `pnpm openclaw qa suite --runner multipass` para uma VM Linux descartável.          |
| `qa coverage`                                       | Imprime o inventário de cobertura de cenários em markdown (`--json` para saída de máquina).                                                                            |
| `qa parity-report`                                  | Compara dois arquivos `qa-suite-summary.json` e grava o relatório de paridade agentivo.                                                                                |
| `qa character-eval`                                 | Executa o cenário de QA de personagem em vários modelos ao vivo com um relatório julgado. Consulte [Relatórios](#reporting).                                           |
| `qa manual`                                         | Executa um prompt avulso contra a lane do provedor/modelo selecionado.                                                                                                 |
| `qa ui`                                             | Inicia a interface de depuração de QA e o barramento local de QA (alias: `pnpm qa:lab:ui`).                                                                             |
| `qa docker-build-image`                             | Compila a imagem Docker de QA pré-preparada.                                                                                                                           |
| `qa docker-scaffold`                                | Grava um scaffold de docker-compose para o painel de QA + lane do Gateway.                                                                                             |
| `qa up`                                             | Compila o site de QA, inicia a pilha apoiada por Docker e imprime a URL (alias: `pnpm qa:lab:up`; a variante `:fast` adiciona `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Inicia apenas o servidor do provedor AIMock.                                                                                                                           |
| `qa mock-openai`                                    | Inicia apenas o servidor do provedor `mock-openai` ciente de cenários.                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | Gerencia o pool compartilhado de credenciais Convex.                                                                                                                   |
| `qa matrix`                                         | Lane de transporte ao vivo contra um homeserver Tuwunel descartável. Consulte [QA do Matrix](/pt-BR/concepts/qa-matrix).                                                    |
| `qa telegram`                                       | Lane de transporte ao vivo contra um grupo privado real do Telegram.                                                                                                   |
| `qa discord`                                        | Lane de transporte ao vivo contra um canal de guild privado real do Discord.                                                                                           |

## Fluxo do operador

O fluxo atual do operador de QA é um site de QA com dois painéis:

- Esquerda: painel do Gateway (interface de controle) com o agente.
- Direita: QA Lab, mostrando a transcrição no estilo Slack e o plano de cenário.

Execute com:

```bash
pnpm qa:lab:up
```

Isso compila o site de QA, inicia a lane do Gateway apoiada por Docker e expõe a
página do QA Lab em que um operador ou loop de automação pode dar ao agente uma
missão de QA, observar o comportamento real do canal e registrar o que funcionou, falhou ou
permaneceu bloqueado.

Para iteração mais rápida na interface do QA Lab sem recompilar a imagem Docker a cada vez,
inicie a pilha com um pacote do QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantém os serviços Docker em uma imagem pré-compilada e monta por bind
`extensions/qa-lab/web/dist` no contêiner `qa-lab`. `qa:lab:watch`
recompila esse pacote ao mudar, e o navegador recarrega automaticamente quando o hash de ativos do QA Lab
muda.

Para um smoke local de rastreamento OpenTelemetry, execute:

```bash
pnpm qa:otel:smoke
```

Esse script inicia um receptor local de rastreamento OTLP/HTTP, executa o cenário de QA
`otel-trace-smoke` com o plugin `diagnostics-otel` ativado, depois
decodifica os spans protobuf exportados e confirma o formato crítico para release:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` e `openclaw.message.delivery` devem estar presentes;
chamadas de modelo não devem exportar `StreamAbandoned` em turnos bem-sucedidos; IDs diagnósticos brutos e
atributos `openclaw.content.*` devem ficar fora do rastreamento. Ele grava
`otel-smoke-summary.json` ao lado dos artefatos da suíte de QA.

O QA de observabilidade permanece apenas para checkout de código-fonte. O tarball npm omite
intencionalmente o QA Lab, então lanes de release Docker de pacote não executam comandos `qa`. Use
`pnpm qa:otel:smoke` a partir de um checkout de código-fonte compilado ao alterar a instrumentação
de diagnósticos.

Para uma lane de smoke Matrix com transporte real, execute:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

A referência completa da CLI, o catálogo de perfis/cenários, variáveis de ambiente e o layout de artefatos para esta lane ficam em [QA do Matrix](/pt-BR/concepts/qa-matrix). Em resumo: ela provisiona um homeserver Tuwunel descartável no Docker, registra usuários temporários de driver/SUT/observador, executa o Plugin Matrix real dentro de um Gateway de QA filho limitado a esse transporte (sem `qa-channel`) e então grava um relatório em Markdown, resumo JSON, artefato de eventos observados e log de saída combinado em `.artifacts/qa-e2e/matrix-<timestamp>/`.

Para lanes de smoke Telegram e Discord com transporte real:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Ambas miram um canal real preexistente com dois bots (driver + SUT). Variáveis de ambiente obrigatórias, listas de cenários, artefatos de saída e o pool de credenciais Convex estão documentados na [referência de QA do Telegram e Discord](#telegram-and-discord-qa-reference) abaixo.

Antes de usar credenciais ao vivo em pool, execute:

```bash
pnpm openclaw qa credentials doctor
```

O doctor verifica o ambiente do broker Convex, valida as configurações de endpoint e verifica a acessibilidade de admin/lista quando o segredo de mantenedor está presente. Ele relata apenas o status definido/ausente para segredos.

## Cobertura de transporte ao vivo

Lanes de transporte ao vivo compartilham um contrato em vez de cada uma inventar seu próprio formato de lista de cenários. `qa-channel` é a suíte sintética ampla de comportamento do produto e não faz parte da matriz de cobertura de transporte ao vivo.

| Lane     | Canary | Controle por menção | Bot para bot | Bloqueio por lista de permissão | Resposta de nível superior | Retomada após reinício | Acompanhamento em conversa encadeada | Isolamento de conversa encadeada | Observação de reação | Comando de ajuda | Registro de comando nativo |
| -------- | ------ | ------------------- | ------------ | ------------------------------- | -------------------------- | ---------------------- | ------------------------------------ | -------------------------------- | -------------------- | ---------------- | -------------------------- |
| Matrix   | x      | x                   | x            | x                               | x                          | x                      | x                                    | x                                | x                    |                  |                            |
| Telegram | x      | x                   | x            |                                 |                            |                        |                                      |                                  |                      | x                |                            |
| Discord  | x      | x                   | x            |                                 |                            |                        |                                      |                                  |                      |                  | x                          |

Isso mantém `qa-channel` como a suíte ampla de comportamento do produto, enquanto Matrix,
Telegram e futuros transportes ao vivo compartilham uma checklist explícita de contrato de transporte.

Para uma lane de VM Linux descartável sem colocar Docker no caminho de QA, execute:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Isso inicializa um convidado Multipass novo, instala dependências, compila o OpenClaw
dentro do convidado, executa `qa suite` e então copia o relatório e
resumo normais de QA de volta para `.artifacts/qa-e2e/...` no host.
Ele reutiliza o mesmo comportamento de seleção de cenários que `qa suite` no host.
Execuções da suíte no host e no Multipass executam vários cenários selecionados em paralelo
com workers isolados de Gateway por padrão. `qa-channel` usa concorrência
4 por padrão, limitada pela contagem de cenários selecionados. Use `--concurrency <count>` para ajustar
a contagem de workers, ou `--concurrency 1` para execução serial.
O comando sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
você quiser artefatos sem um código de saída de falha.
Execuções ao vivo encaminham as entradas de autenticação de QA compatíveis que são práticas para o
convidado: chaves de provedor baseadas em ambiente, o caminho de configuração do provedor ao vivo de QA e
`CODEX_HOME` quando presente. Mantenha `--output-dir` sob a raiz do repositório para que o convidado
possa gravar de volta pelo workspace montado.

## Referência de QA do Telegram e Discord

Matrix tem uma [página dedicada](/pt-BR/concepts/qa-matrix) por causa da quantidade de cenários e do provisionamento de homeserver apoiado por Docker. Telegram e Discord são menores — um punhado de cenários cada, sem sistema de perfis, contra canais reais preexistentes — então a referência deles fica aqui.

### Flags compartilhadas da CLI

Ambas as lanes são registradas por meio de `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e aceitam as mesmas flags:

| Flag                                  | Padrão                                                    | Descrição                                                                                                             |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | Executa somente este cenário. Repetível.                                                                              |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Onde relatórios/resumo/mensagens observadas e o log de saída são gravados. Caminhos relativos são resolvidos em relação a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Raiz do repositório ao invocar a partir de um cwd neutro.                                                             |
| `--sut-account <id>`                  | `sut`                                                     | ID de conta temporária dentro da configuração do Gateway de QA.                                                       |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` ou `live-frontier` (o legado `live-openai` ainda funciona).                                             |
| `--model <ref>` / `--alt-model <ref>` | padrão do provedor                                        | Referências dos modelos primário/alternativo.                                                                         |
| `--fast`                              | desativado                                                | Modo rápido do provedor, quando houver suporte.                                                                       |
| `--credential-source <env\|convex>`   | `env`                                                     | Consulte [pool de credenciais Convex](#convex-credential-pool).                                                       |
| `--credential-role <maintainer\|ci>`  | `ci` em CI, caso contrário `maintainer`                   | Função usada quando `--credential-source convex`.                                                                     |

Ambos saem com código diferente de zero em qualquer cenário com falha. `--allow-failures` grava artefatos sem definir um código de saída de falha.

### QA do Telegram

```bash
pnpm openclaw qa telegram
```

Tem como alvo um grupo privado real do Telegram com dois bots distintos (driver + SUT). O bot SUT deve ter um nome de usuário do Telegram; a observação de bot para bot funciona melhor quando ambos os bots têm o **Bot-to-Bot Communication Mode** ativado no `@BotFather`.

Env obrigatório quando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — ID numérico do chat (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opcional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` mantém os corpos das mensagens em artefatos de mensagens observadas (o padrão redige).

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

Tem como alvo um canal de guilda privado real do Discord com dois bots: um bot driver controlado pelo harness e um bot SUT iniciado pelo Gateway OpenClaw filho por meio do Plugin Discord incluído. Verifica o tratamento de menções no canal e se o bot SUT registrou o comando nativo `/help` no Discord.

Env obrigatório quando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — deve corresponder ao ID de usuário do bot SUT retornado pelo Discord (caso contrário, a trilha falha rapidamente).

Opcional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mantém os corpos das mensagens em artefatos de mensagens observadas.

Cenários (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

Artefatos de saída:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — corpos redigidos, a menos que `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.

### Pool de credenciais Convex

As trilhas do Telegram e do Discord podem alugar credenciais de um pool Convex compartilhado em vez de ler as env vars acima. Passe `--credential-source convex` (ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); o QA Lab adquire uma concessão exclusiva, envia Heartbeats durante a execução e a libera no encerramento. Os tipos do pool são `"telegram"` e `"discord"`.

Formatos de payload que o broker valida em `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` deve ser uma string numérica de chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

As env vars operacionais e o contrato do endpoint do broker Convex estão em [Testes → Credenciais compartilhadas do Telegram via Convex](/pt-BR/help/testing#shared-telegram-credentials-via-convex-v1) (o nome da seção é anterior ao suporte ao Discord; a semântica do broker é idêntica para ambos os tipos).

## Seeds apoiados pelo repositório

Os assets de seed ficam em `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Eles estão intencionalmente no git para que o plano de QA fique visível tanto para humanos quanto para o agente.

`qa-lab` deve continuar sendo um executor Markdown genérico. Cada arquivo Markdown de cenário é a fonte da verdade para uma execução de teste e deve definir:

- metadados do cenário
- metadados opcionais de categoria, capacidade, trilha e risco
- referências de docs e código
- requisitos opcionais de Plugin
- patch opcional de configuração do Gateway
- o `qa-flow` executável

A superfície de runtime reutilizável que dá suporte ao `qa-flow` pode continuar genérica e transversal. Por exemplo, cenários Markdown podem combinar helpers do lado do transporte com helpers do lado do navegador que controlam a Control UI embutida por meio da costura `browser.request` do Gateway, sem adicionar um executor de caso especial.

Os arquivos de cenário devem ser agrupados por capacidade do produto, e não por pasta da árvore de código. Mantenha os IDs de cenário estáveis quando os arquivos forem movidos; use `docsRefs` e `codeRefs` para rastreabilidade da implementação.

A lista de baseline deve permanecer ampla o suficiente para cobrir:

- chat por DM e canal
- comportamento de threads
- ciclo de vida de ações de mensagem
- callbacks de Cron
- recuperação de memória
- troca de modelo
- transferência para subagente
- leitura de repositório e leitura de docs
- uma pequena tarefa de build, como Lobster Invaders

## Trilhas de mock de provedor

`qa suite` tem duas trilhas locais de mock de provedor:

- `mock-openai` é o mock OpenClaw ciente de cenários. Ele permanece a trilha de mock determinística padrão para QA apoiado pelo repositório e gates de paridade.
- `aimock` inicia um servidor de provedor baseado em AIMock para cobertura experimental de protocolo, fixtures, gravação/reprodução e caos. Ele é aditivo e não substitui o dispatcher de cenários `mock-openai`.

A implementação das trilhas de provedor fica em `extensions/qa-lab/src/providers/`. Cada provedor é dono de seus padrões, inicialização de servidor local, configuração de modelo do Gateway, necessidades de preparação de auth-profile e flags de capacidade live/mock. O código compartilhado da suíte e do Gateway deve rotear pelo registro de provedores em vez de ramificar por nomes de provedores.

## Adaptadores de transporte

`qa-lab` possui uma costura de transporte genérica para cenários de QA em Markdown. `qa-channel` é o primeiro adaptador nessa costura, mas o alvo de design é mais amplo: canais reais ou sintéticos futuros devem se conectar ao mesmo executor de suíte em vez de adicionar um executor de QA específico de transporte.

No nível de arquitetura, a divisão é:

- `qa-lab` possui execução genérica de cenários, concorrência de workers, gravação de artefatos e relatórios.
- O adaptador de transporte possui configuração do Gateway, prontidão, observação de entrada e saída, ações de transporte e estado de transporte normalizado.
- Arquivos de cenário Markdown em `qa/scenarios/` definem a execução de teste; `qa-lab` fornece a superfície de runtime reutilizável que os executa.

### Adicionar um canal

Adicionar um canal ao sistema de QA em Markdown exige exatamente duas coisas:

1. Um adaptador de transporte para o canal.
2. Um pacote de cenários que exercita o contrato do canal.

Não adicione uma nova raiz de comando QA de nível superior quando o host compartilhado `qa-lab` puder possuir o fluxo.

`qa-lab` possui a mecânica do host compartilhado:

- a raiz do comando `openclaw qa`
- inicialização e encerramento da suíte
- concorrência de workers
- gravação de artefatos
- geração de relatório
- execução de cenário
- aliases de compatibilidade para cenários `qa-channel` mais antigos

Plugins de executor possuem o contrato de transporte:

- como `openclaw qa <runner>` é montado abaixo da raiz compartilhada `qa`
- como o Gateway é configurado para esse transporte
- como a prontidão é verificada
- como eventos de entrada são injetados
- como mensagens de saída são observadas
- como transcritos e estado de transporte normalizado são expostos
- como ações apoiadas por transporte são executadas
- como reset ou limpeza específicos de transporte são tratados

A barra mínima de adoção para um novo canal:

1. Mantenha `qa-lab` como dono da raiz compartilhada `qa`.
2. Implemente o executor de transporte na costura de host compartilhado `qa-lab`.
3. Mantenha a mecânica específica de transporte dentro do Plugin executor ou do harness do canal.
4. Monte o executor como `openclaw qa <runner>` em vez de registrar um comando raiz concorrente. Plugins de executor devem declarar `qaRunners` em `openclaw.plugin.json` e exportar um array `qaRunnerCliRegistrations` correspondente de `runtime-api.ts`. Mantenha `runtime-api.ts` leve; CLI lazy e execução de runner devem ficar atrás de entrypoints separados.
5. Escreva ou adapte cenários Markdown nos diretórios temáticos `qa/scenarios/`.
6. Use os helpers genéricos de cenário para novos cenários.
7. Mantenha os aliases de compatibilidade existentes funcionando, a menos que o repositório esteja fazendo uma migração intencional.

A regra de decisão é estrita:

- Se o comportamento puder ser expresso uma vez em `qa-lab`, coloque-o em `qa-lab`.
- Se o comportamento depender de um transporte de canal, mantenha-o nesse Plugin executor ou harness de Plugin.
- Se um cenário precisar de uma nova capacidade que mais de um canal possa usar, adicione um helper genérico em vez de uma ramificação específica de canal em `suite.ts`.
- Se um comportamento só fizer sentido para um transporte, mantenha o cenário específico de transporte e deixe isso explícito no contrato do cenário.

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

Aliases de compatibilidade continuam disponíveis para cenários existentes — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — mas a criação de novos cenários deve usar os nomes genéricos. Os aliases existem para evitar uma migração de flag day, não como o modelo daqui em diante.

## Relatórios

`qa-lab` exporta um relatório de protocolo em Markdown a partir da linha do tempo do barramento observado.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que permaneceu bloqueado
- Quais cenários de acompanhamento vale a pena adicionar

Para o inventário de cenários disponíveis — útil ao dimensionar trabalhos de acompanhamento ou conectar um novo transporte — execute `pnpm openclaw qa coverage` (adicione `--json` para saída legível por máquina).

Para verificações de personagem e estilo, execute o mesmo cenário em várias refs de modelos live
e grave um relatório Markdown julgado:

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
devem definir a persona por meio de `SOUL.md` e então executar turnos comuns de usuário,
como chat, ajuda no workspace e pequenas tarefas de arquivo. O modelo candidato não deve
ser informado de que está sendo avaliado. O comando preserva cada transcrição completa,
registra estatísticas básicas da execução e então pede aos modelos juízes em modo rápido com
raciocínio `xhigh`, quando suportado, que classifiquem as execuções por naturalidade, vibe e humor.
Use `--blind-judge-models` ao comparar provedores: o prompt do juiz ainda recebe
todas as transcrições e status de execução, mas as refs candidatas são substituídas por
rótulos neutros como `candidate-01`; o relatório mapeia as classificações de volta para as refs reais após
a análise.
Execuções candidatas usam `high` thinking por padrão, com `medium` para GPT-5.5 e `xhigh`
para refs de avaliação OpenAI mais antigas que o suportam. Sobrescreva um candidato específico inline com
`--model provider/model,thinking=<level>`. `--thinking <level>` ainda define um
fallback global, e a forma mais antiga `--model-thinking <provider/model=level>` é
mantida para compatibilidade.
Refs candidatas OpenAI usam modo rápido por padrão para que o processamento prioritário seja usado onde
o provedor o suporta. Adicione `,fast`, `,no-fast` ou `,fast=false` inline quando um
único candidato ou juiz precisar de uma sobrescrita. Passe `--fast` apenas quando quiser
forçar o modo rápido para todos os modelos candidatos. As durações de candidatos e juízes são
registradas no relatório para análise de benchmark, mas os prompts dos juízes dizem explicitamente
para não classificar por velocidade.
Execuções de modelos candidatos e juízes usam concorrência 16 por padrão. Reduza
`--concurrency` ou `--judge-concurrency` quando limites do provedor ou pressão no Gateway local
tornarem uma execução ruidosa demais.
Quando nenhum `--model` candidato é passado, a avaliação de personagem usa por padrão
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando nenhum `--model` é passado.
Quando nenhum `--judge-model` é passado, os juízes usam por padrão
`openai/gpt-5.5,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Docs relacionados

- [QA de matriz](/pt-BR/concepts/qa-matrix)
- [Canal de QA](/pt-BR/channels/qa-channel)
- [Testes](/pt-BR/help/testing)
- [Painel](/pt-BR/web/dashboard)
