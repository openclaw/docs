---
read_when:
    - Compreendendo como a pilha de garantia de qualidade se integra
    - Estendendo qa-lab, qa-channel ou um adaptador de transporte
    - Adicionando cenários de QA baseados no repositório
    - Criando automação de QA de maior realismo em torno do painel do Gateway
summary: 'Visão geral da pilha de QA: qa-lab, qa-channel, cenários baseados no repositório, faixas de transporte ao vivo, adaptadores de transporte e relatórios.'
title: Visão geral de QA
x-i18n:
    generated_at: "2026-04-30T09:45:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: b62a5081fc2b67333f2ec6f3469e97043f048d5912858b9d8cc565c2e5fc8de2
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

A pilha privada de QA foi criada para exercitar o OpenClaw de uma forma mais realista,
moldada por canais, do que um único teste unitário consegue.

Partes atuais:

- `extensions/qa-channel`: canal de mensagens sintético com superfícies de DM,
  canal, thread, reação, edição e exclusão.
- `extensions/qa-lab`: UI de depuração e barramento de QA para observar a transcrição,
  injetar mensagens de entrada e exportar um relatório em Markdown.
- `extensions/qa-matrix`, plugins executores futuros: adaptadores de transporte ao vivo que
  conduzem um canal real dentro de um Gateway de QA filho.
- `qa/`: assets de seed mantidos no repositório para a tarefa inicial e cenários
  de QA de referência.

## Superfície de comandos

Todo fluxo de QA roda sob `pnpm openclaw qa <subcommand>`. Muitos têm aliases de script `pnpm qa:*`;
ambas as formas são compatíveis.

| Comando                                             | Finalidade                                                                                                                                                             |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autoverificação de QA incluída; escreve um relatório em Markdown.                                                                                                      |
| `qa suite`                                          | Executa cenários mantidos no repositório contra a lane do Gateway de QA. Aliases: `pnpm openclaw qa suite --runner multipass` para uma VM Linux descartável.           |
| `qa coverage`                                       | Imprime o inventário de cobertura de cenários em markdown (`--json` para saída de máquina).                                                                            |
| `qa parity-report`                                  | Compara dois arquivos `qa-suite-summary.json` e escreve o relatório agentic da barreira de paridade.                                                                   |
| `qa character-eval`                                 | Executa o cenário de QA de personagem em vários modelos ao vivo com um relatório julgado. Veja [Relatórios](#reporting).                                               |
| `qa manual`                                         | Executa um prompt avulso contra a lane do provedor/modelo selecionado.                                                                                                 |
| `qa ui`                                             | Inicia a UI de depuração de QA e o barramento de QA local (alias: `pnpm qa:lab:ui`).                                                                                   |
| `qa docker-build-image`                             | Constrói a imagem Docker de QA pré-preparada.                                                                                                                          |
| `qa docker-scaffold`                                | Escreve um scaffold docker-compose para o painel de QA + lane de Gateway.                                                                                              |
| `qa up`                                             | Constrói o site de QA, inicia a pilha apoiada por Docker, imprime a URL (alias: `pnpm qa:lab:up`; a variante `:fast` adiciona `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Inicia apenas o servidor do provedor AIMock.                                                                                                                           |
| `qa mock-openai`                                    | Inicia apenas o servidor do provedor `mock-openai` ciente de cenários.                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | Gerencia o pool compartilhado de credenciais Convex.                                                                                                                   |
| `qa matrix`                                         | Lane de transporte ao vivo contra um homeserver Tuwunel descartável. Veja [QA Matrix](/pt-BR/concepts/qa-matrix).                                                           |
| `qa telegram`                                       | Lane de transporte ao vivo contra um grupo privado real do Telegram.                                                                                                   |
| `qa discord`                                        | Lane de transporte ao vivo contra um canal de guilda privado real do Discord.                                                                                          |

## Fluxo do operador

O fluxo atual do operador de QA é um site de QA em dois painéis:

- Esquerda: painel do Gateway (UI de controle) com o agente.
- Direita: QA Lab, mostrando a transcrição em estilo Slack e o plano de cenário.

Execute com:

```bash
pnpm qa:lab:up
```

Isso constrói o site de QA, inicia a lane de Gateway apoiada por Docker e expõe a
página do QA Lab onde um operador ou loop de automação pode dar ao agente uma
missão de QA, observar o comportamento real do canal e registrar o que funcionou,
falhou ou permaneceu bloqueado.

Para iterar mais rápido na UI do QA Lab local sem reconstruir a imagem Docker a cada vez,
inicie a pilha com um bundle do QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantém os serviços Docker em uma imagem pré-construída e monta por bind
`extensions/qa-lab/web/dist` no contêiner `qa-lab`. `qa:lab:watch`
reconstrói esse bundle ao mudar, e o navegador recarrega automaticamente quando o hash
do asset do QA Lab muda.

Para um smoke local de rastreamento OpenTelemetry, execute:

```bash
pnpm qa:otel:smoke
```

Esse script inicia um receptor de rastreamento OTLP/HTTP local, executa o
cenário de QA `otel-trace-smoke` com o plugin `diagnostics-otel` habilitado, depois
decodifica os spans protobuf exportados e valida o formato crítico para release:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` e `openclaw.message.delivery` devem estar presentes;
chamadas de modelo não devem exportar `StreamAbandoned` em turnos bem-sucedidos; IDs diagnósticos brutos e
atributos `openclaw.content.*` devem permanecer fora do rastreamento. Ele escreve
`otel-smoke-summary.json` ao lado dos artefatos da suíte de QA.

QA de observabilidade permanece apenas para checkout de código-fonte. O tarball npm omite
intencionalmente o QA Lab, então lanes de release Docker de pacote não executam comandos `qa`. Use
`pnpm qa:otel:smoke` a partir de um checkout de código-fonte construído ao alterar a instrumentação
de diagnósticos.

Para uma lane de smoke Matrix com transporte real, execute:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

A referência completa da CLI, o catálogo de perfis/cenários, as variáveis de ambiente e o layout de artefatos desta lane ficam em [QA Matrix](/pt-BR/concepts/qa-matrix). Em resumo: ela provisiona um homeserver Tuwunel descartável no Docker, registra usuários temporários driver/SUT/observador, executa o plugin Matrix real dentro de um Gateway de QA filho limitado a esse transporte (sem `qa-channel`) e então escreve um relatório em Markdown, resumo JSON, artefato de eventos observados e log de saída combinado em `.artifacts/qa-e2e/matrix-<timestamp>/`.

Para lanes de smoke Telegram e Discord com transporte real:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Ambas miram um canal real preexistente com dois bots (driver + SUT). Variáveis de ambiente obrigatórias, listas de cenários, artefatos de saída e o pool de credenciais Convex estão documentados em [Referência de QA para Telegram e Discord](#telegram-and-discord-qa-reference) abaixo.

Antes de usar credenciais ao vivo em pool, execute:

```bash
pnpm openclaw qa credentials doctor
```

O doctor verifica o ambiente do broker Convex, valida as configurações de endpoint e verifica a alcançabilidade de admin/list quando o segredo de mantenedor está presente. Ele relata apenas o status definido/ausente dos segredos.

## Cobertura de transporte ao vivo

Lanes de transporte ao vivo compartilham um contrato em vez de cada uma inventar seu próprio formato de lista de cenários. `qa-channel` é a suíte ampla de comportamento de produto sintético e não faz parte da matriz de cobertura de transporte ao vivo.

| Lane     | Canary | Gating por menção | Bot para bot | Bloqueio por allowlist | Resposta de nível superior | Retomada após reinício | Follow-up de thread | Isolamento de thread | Observação de reação | Comando de ajuda | Registro de comando nativo |
| -------- | ------ | ----------------- | ------------ | ---------------------- | -------------------------- | ---------------------- | ------------------- | -------------------- | -------------------- | ---------------- | -------------------------- |
| Matrix   | x      | x                 | x            | x                      | x                          | x                      | x                   | x                    | x                    |                  |                            |
| Telegram | x      | x                 | x            |                        |                            |                        |                     |                      |                      | x                |                            |
| Discord  | x      | x                 | x            |                        |                            |                        |                     |                      |                      |                  | x                          |

Isso mantém `qa-channel` como a suíte ampla de comportamento de produto, enquanto Matrix,
Telegram e futuros transportes ao vivo compartilham uma checklist explícita de contrato de transporte.

Para uma lane de VM Linux descartável sem trazer Docker para o caminho de QA, execute:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Isso inicializa um guest Multipass novo, instala dependências, constrói o OpenClaw
dentro do guest, executa `qa suite` e então copia o relatório e o resumo normais de QA
de volta para `.artifacts/qa-e2e/...` no host.
Ele reutiliza o mesmo comportamento de seleção de cenários que `qa suite` no host.
Execuções de suíte no host e no Multipass executam vários cenários selecionados em paralelo
com workers de Gateway isolados por padrão. `qa-channel` usa por padrão concorrência
4, limitada pela contagem de cenários selecionados. Use `--concurrency <count>` para ajustar
a contagem de workers ou `--concurrency 1` para execução serial.
O comando sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
quiser artefatos sem um código de saída de falha.
Execuções ao vivo encaminham as entradas de autenticação de QA compatíveis que são práticas para o
guest: chaves de provedor baseadas em env, o caminho de configuração do provedor ao vivo de QA e
`CODEX_HOME` quando presente. Mantenha `--output-dir` sob a raiz do repositório para que o guest
possa escrever de volta pelo workspace montado.

## Referência de QA para Telegram e Discord

Matrix tem uma [página dedicada](/pt-BR/concepts/qa-matrix) por causa da contagem de cenários e do provisionamento de homeserver apoiado por Docker. Telegram e Discord são menores — alguns cenários cada, sem sistema de perfis, contra canais reais preexistentes — então a referência deles fica aqui.

### Flags compartilhadas da CLI

Ambas as lanes se registram por meio de `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e aceitam as mesmas flags:

| Flag                                  | Padrão                                                   | Descrição                                                                                                           |
| ------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                        | Execute somente este cenário. Repetível.                                                                           |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Onde relatórios/resumo/mensagens observadas e o log de saída são gravados. Caminhos relativos são resolvidos em relação a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                          | Raiz do repositório ao invocar a partir de um cwd neutro.                                                           |
| `--sut-account <id>`                  | `sut`                                                    | Id de conta temporária dentro da configuração do Gateway de QA.                                                     |
| `--provider-mode <mode>`              | `live-frontier`                                          | `mock-openai` ou `live-frontier` (`live-openai` legado ainda funciona).                                             |
| `--model <ref>` / `--alt-model <ref>` | padrão do provedor                                       | Referências do modelo principal/alternativo.                                                                        |
| `--fast`                              | desativado                                               | Modo rápido do provedor onde houver suporte.                                                                        |
| `--credential-source <env\|convex>`   | `env`                                                    | Consulte [pool de credenciais do Convex](#convex-credential-pool).                                                  |
| `--credential-role <maintainer\|ci>`  | `ci` em CI, caso contrário `maintainer`                  | Função usada quando `--credential-source convex`.                                                                   |

Ambos saem com valor diferente de zero em qualquer cenário com falha. `--allow-failures` grava artefatos sem definir um código de saída com falha.

### QA do Telegram

```bash
pnpm openclaw qa telegram
```

Tem como alvo um grupo privado real do Telegram com dois bots distintos (driver + SUT). O bot SUT deve ter um nome de usuário do Telegram; a observação bot-para-bot funciona melhor quando ambos os bots têm o **Bot-to-Bot Communication Mode** habilitado em `@BotFather`.

Env obrigatório quando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — id numérico do chat (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opcional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` mantém corpos de mensagens nos artefatos de mensagens observadas (o padrão é redigir).

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
- `telegram-qa-summary.json` — inclui RTT por resposta (envio do driver → resposta SUT observada), começando pelo canário.
- `telegram-qa-observed-messages.json` — corpos redigidos, a menos que `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA do Discord

```bash
pnpm openclaw qa discord
```

Tem como alvo um canal de guilda privado real do Discord com dois bots: um bot driver controlado pelo harness e um bot SUT iniciado pelo Gateway filho do OpenClaw por meio do plugin Discord incluído. Verifica o tratamento de menções no canal e se o bot SUT registrou o comando nativo `/help` no Discord.

Env obrigatório quando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — deve corresponder ao id de usuário do bot SUT retornado pelo Discord (caso contrário, a lane falha rapidamente).

Opcional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mantém corpos de mensagens nos artefatos de mensagens observadas.

Cenários (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

Artefatos de saída:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — corpos redigidos, a menos que `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.

### Pool de credenciais do Convex

As lanes do Telegram e do Discord podem alugar credenciais de um pool compartilhado do Convex em vez de ler as variáveis de env acima. Passe `--credential-source convex` (ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); o QA Lab adquire um aluguel exclusivo, envia Heartbeats durante a execução e o libera no encerramento. Os tipos do pool são `"telegram"` e `"discord"`.

Formatos de payload que o broker valida em `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` deve ser uma string de id de chat numérico.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

As variáveis de env operacionais e o contrato do endpoint do broker do Convex ficam em [Testes → Credenciais compartilhadas do Telegram via Convex](/pt-BR/help/testing#shared-telegram-credentials-via-convex-v1) (o nome da seção é anterior ao suporte ao Discord; a semântica do broker é idêntica para ambos os tipos).

## Seeds apoiadas pelo repositório

Os ativos de seed ficam em `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Eles estão intencionalmente no git para que o plano de QA seja visível tanto para humanos quanto para o agente.

`qa-lab` deve permanecer um executor genérico de markdown. Cada arquivo markdown de cenário é a fonte da verdade para uma execução de teste e deve definir:

- metadados do cenário
- metadados opcionais de categoria, capacidade, lane e risco
- referências de docs e código
- requisitos opcionais de plugin
- patch opcional de configuração do Gateway
- o `qa-flow` executável

A superfície de runtime reutilizável que sustenta `qa-flow` pode permanecer genérica e transversal. Por exemplo, cenários markdown podem combinar auxiliares do lado do transporte com auxiliares do lado do navegador que conduzem a Control UI incorporada por meio da seam `browser.request` do Gateway, sem adicionar um executor de caso especial.

Arquivos de cenário devem ser agrupados por capacidade do produto, em vez de pasta da árvore de origem. Mantenha os IDs de cenário estáveis quando arquivos forem movidos; use `docsRefs` e `codeRefs` para rastreabilidade da implementação.

A lista de baseline deve permanecer ampla o suficiente para cobrir:

- chat por DM e canal
- comportamento de thread
- ciclo de vida de ações de mensagem
- callbacks de cron
- recuperação de memória
- troca de modelo
- handoff para subagente
- leitura de repositório e leitura de docs
- uma pequena tarefa de build, como Lobster Invaders

## Lanes de mock de provedor

`qa suite` tem duas lanes locais de mock de provedor:

- `mock-openai` é o mock OpenClaw consciente de cenários. Ele permanece a lane de mock determinística padrão para QA apoiado pelo repositório e gates de paridade.
- `aimock` inicia um servidor de provedor apoiado por AIMock para cobertura experimental de protocolo, fixtures, gravação/reprodução e caos. Ele é aditivo e não substitui o despachante de cenários `mock-openai`.

A implementação da lane de provedor fica em `extensions/qa-lab/src/providers/`. Cada provedor é dono de seus padrões, inicialização do servidor local, configuração de modelo do Gateway, necessidades de preparação de auth-profile e flags de capacidade live/mock. O código compartilhado da suíte e do Gateway deve rotear pelo registro de provedores em vez de ramificar por nomes de provedores.

## Adaptadores de transporte

`qa-lab` possui uma seam de transporte genérica para cenários de QA em markdown. `qa-channel` é o primeiro adaptador nessa seam, mas o alvo de design é mais amplo: canais futuros reais ou sintéticos devem se conectar ao mesmo executor de suíte em vez de adicionar um executor de QA específico de transporte.

No nível da arquitetura, a divisão é:

- `qa-lab` possui execução genérica de cenários, concorrência de workers, gravação de artefatos e relatórios.
- O adaptador de transporte possui configuração do Gateway, prontidão, observação de entrada e saída, ações de transporte e estado de transporte normalizado.
- Arquivos de cenário markdown em `qa/scenarios/` definem a execução do teste; `qa-lab` fornece a superfície de runtime reutilizável que os executa.

### Adicionar um canal

Adicionar um canal ao sistema de QA em markdown exige exatamente duas coisas:

1. Um adaptador de transporte para o canal.
2. Um pacote de cenários que exercite o contrato do canal.

Não adicione uma nova raiz de comando QA de nível superior quando o host compartilhado `qa-lab` puder possuir o fluxo.

`qa-lab` possui a mecânica do host compartilhado:

- a raiz do comando `openclaw qa`
- inicialização e teardown da suíte
- concorrência de workers
- gravação de artefatos
- geração de relatórios
- execução de cenários
- aliases de compatibilidade para cenários `qa-channel` mais antigos

Plugins de executor possuem o contrato de transporte:

- como `openclaw qa <runner>` é montado abaixo da raiz compartilhada `qa`
- como o Gateway é configurado para esse transporte
- como a prontidão é verificada
- como eventos de entrada são injetados
- como mensagens de saída são observadas
- como transcrições e estado de transporte normalizado são expostos
- como ações apoiadas por transporte são executadas
- como reset ou limpeza específica de transporte é tratado

A barra mínima de adoção para um novo canal:

1. Mantenha `qa-lab` como dono da raiz compartilhada `qa`.
2. Implemente o executor de transporte na seam do host compartilhado `qa-lab`.
3. Mantenha a mecânica específica de transporte dentro do plugin de executor ou harness do canal.
4. Monte o executor como `openclaw qa <runner>` em vez de registrar um comando raiz concorrente. Plugins de executor devem declarar `qaRunners` em `openclaw.plugin.json` e exportar um array `qaRunnerCliRegistrations` correspondente de `runtime-api.ts`. Mantenha `runtime-api.ts` leve; a CLI lazy e a execução do executor devem permanecer atrás de entrypoints separados.
5. Crie ou adapte cenários markdown nos diretórios temáticos `qa/scenarios/`.
6. Use os auxiliares de cenário genéricos para novos cenários.
7. Mantenha os aliases de compatibilidade existentes funcionando, a menos que o repositório esteja fazendo uma migração intencional.

A regra de decisão é estrita:

- Se o comportamento puder ser expresso uma vez em `qa-lab`, coloque-o em `qa-lab`.
- Se o comportamento depender de um transporte de canal, mantenha-o nesse plugin de executor ou harness de plugin.
- Se um cenário precisar de uma nova capacidade que mais de um canal possa usar, adicione um auxiliar genérico em vez de uma ramificação específica de canal em `suite.ts`.
- Se um comportamento só fizer sentido para um transporte, mantenha o cenário específico de transporte e deixe isso explícito no contrato do cenário.

### Nomes de auxiliares de cenário

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

Aliases de compatibilidade permanecem disponíveis para cenários existentes — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — mas a criação de novos cenários deve usar os nomes genéricos. Os aliases existem para evitar uma migração de uma só vez, não como o modelo daqui para frente.

## Relatórios

`qa-lab` exporta um relatório de protocolo em Markdown a partir da linha do tempo do bus observado.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que permaneceu bloqueado
- Quais cenários de acompanhamento vale a pena adicionar

Para obter o inventário de cenários disponíveis — útil ao dimensionar trabalhos de acompanhamento ou conectar um novo transporte — execute `pnpm openclaw qa coverage` (adicione `--json` para uma saída legível por máquina).

Para verificações de personagem e estilo, execute o mesmo cenário em várias referências de modelo live
e escreva um relatório Markdown julgado:

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

O comando executa processos filhos locais do QA Gateway, não Docker. Cenários de avaliação de personagem
devem definir a persona por meio de `SOUL.md` e, em seguida, executar turnos comuns de usuário,
como chat, ajuda no workspace e pequenas tarefas de arquivo. O modelo candidato
não deve ser informado de que está sendo avaliado. O comando preserva cada transcrição
completa, registra estatísticas básicas da execução e, então, pede aos modelos juízes em modo rápido com
raciocínio `xhigh`, quando suportado, que classifiquem as execuções por naturalidade, vibe e humor.
Use `--blind-judge-models` ao comparar provedores: o prompt do juiz ainda recebe
todas as transcrições e status de execução, mas as refs candidatas são substituídas por
rótulos neutros como `candidate-01`; o relatório mapeia as classificações de volta para as refs reais após
a análise.
Execuções candidatas usam `high` thinking por padrão, com `medium` para GPT-5.5 e `xhigh`
para refs de avaliação mais antigas da OpenAI que ofereçam suporte a isso. Sobrescreva um candidato específico em linha com
`--model provider/model,thinking=<level>`. `--thinking <level>` ainda define um
fallback global, e a forma mais antiga `--model-thinking <provider/model=level>` é
mantida para compatibilidade.
Refs candidatas da OpenAI usam modo rápido por padrão para que o processamento prioritário seja usado onde
o provedor oferecer suporte. Adicione `,fast`, `,no-fast` ou `,fast=false` em linha quando um
único candidato ou juiz precisar de uma sobrescrita. Passe `--fast` somente quando quiser
forçar o modo rápido para todos os modelos candidatos. As durações de candidatos e juízes são
registradas no relatório para análise de benchmark, mas os prompts dos juízes dizem explicitamente
para não classificar por velocidade.
Execuções de modelos candidatos e juízes usam concorrência 16 por padrão. Reduza
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

- [QA de matriz](/pt-BR/concepts/qa-matrix)
- [Canal de QA](/pt-BR/channels/qa-channel)
- [Testes](/pt-BR/help/testing)
- [Painel](/pt-BR/web/dashboard)
