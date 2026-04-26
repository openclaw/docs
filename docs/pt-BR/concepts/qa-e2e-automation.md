---
read_when:
    - Estendendo qa-lab ou qa-channel
    - Adicionando cenários de QA com suporte do repositório
    - Criando automação de QA com maior realismo em torno do painel do Gateway
summary: Formato da automação privada de QA para qa-lab, qa-channel, cenários com seed e relatórios de protocolo
title: automação E2E de QA
x-i18n:
    generated_at: "2026-04-26T11:27:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3803f2bc5cdf2368c3af59b412de8ef732708995a54f7771d3f6f16e8be0592b
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

A stack privada de QA foi feita para exercitar o OpenClaw de um modo mais realista,
com formato de canal, do que um único teste unitário consegue.

Peças atuais:

- `extensions/qa-channel`: canal de mensagens sintético com superfícies de DM, canal, thread,
  reação, edição e exclusão.
- `extensions/qa-lab`: UI de depuração e barramento de QA para observar a transcrição,
  injetar mensagens de entrada e exportar um relatório em Markdown.
- `qa/`: recursos de seed com suporte do repositório para a tarefa inicial e cenários
  básicos de QA.

O fluxo atual do operador de QA é um site de QA com dois painéis:

- Esquerda: painel do Gateway (Control UI) com o agente.
- Direita: QA Lab, mostrando a transcrição em estilo Slack e o plano do cenário.

Execute com:

```bash
pnpm qa:lab:up
```

Isso faz build do site de QA, inicia a lane do gateway com suporte de Docker e expõe a
página do QA Lab, na qual um operador ou loop de automação pode dar ao agente uma
missão de QA, observar o comportamento real do canal e registrar o que funcionou, falhou ou
permaneceu bloqueado.

Para iterar mais rapidamente na UI do QA Lab sem reconstruir a imagem Docker a cada vez,
inicie a stack com um bundle do QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantém os serviços Docker em uma imagem pré-compilada e monta por bind
`extensions/qa-lab/web/dist` no contêiner `qa-lab`. `qa:lab:watch`
recompila esse bundle quando há alterações, e o navegador recarrega automaticamente quando o hash
do recurso do QA Lab muda.

Para um smoke local de rastreamento OpenTelemetry, execute:

```bash
pnpm qa:otel:smoke
```

Esse script inicia um receptor local de rastros OTLP/HTTP, executa o
cenário de QA `otel-trace-smoke` com o Plugin `diagnostics-otel` ativado, depois
decodifica os spans protobuf exportados e valida o formato crítico para release:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` e `openclaw.message.delivery` precisam estar presentes;
chamadas de modelo não devem exportar `StreamAbandoned` em rodadas bem-sucedidas; IDs diagnósticos brutos e
atributos `openclaw.content.*` devem ficar fora do rastro. Ele grava
`otel-smoke-summary.json` ao lado dos artefatos da suíte de QA.

Para uma lane smoke de Matrix com transporte real, execute:

```bash
pnpm openclaw qa matrix
```

Essa lane provisiona um homeserver Tuwunel descartável em Docker, registra
usuários temporários de driver, SUT e observador, cria uma sala privada, depois executa
o Plugin Matrix real dentro de um filho do gateway de QA. A lane de transporte ao vivo mantém
a configuração filha restrita ao transporte em teste, então execuções Matrix funcionam sem
`qa-channel` na configuração filha. Ela grava os artefatos de relatório estruturado e
um log combinado de stdout/stderr no diretório de saída de QA Matrix selecionado. Para
capturar também a saída externa de build/inicialização de `scripts/run-node.mjs`, defina
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` para um arquivo de log local ao repositório.
O progresso do Matrix é impresso por padrão. `OPENCLAW_QA_MATRIX_TIMEOUT_MS` limita
a execução completa, e `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` limita a limpeza, para que um
encerramento de Docker travado informe o comando exato de recuperação em vez de ficar travado.

Para uma lane smoke de Telegram com transporte real, execute:

```bash
pnpm openclaw qa telegram
```

Essa lane usa um grupo privado real do Telegram em vez de provisionar um
servidor descartável. Ela exige `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, além de dois bots distintos no mesmo
grupo privado. O bot SUT precisa ter um nome de usuário do Telegram, e a observação entre bots
funciona melhor quando ambos os bots têm o modo Bot-to-Bot Communication ativado
no `@BotFather`.
O comando sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
você quiser artefatos sem um código de saída de falha.
O relatório e o resumo do Telegram incluem RTT por resposta, da requisição de envio da
mensagem do driver até a resposta observada do SUT, começando pelo canário.

Antes de usar credenciais ao vivo em pool, execute:

```bash
pnpm openclaw qa credentials doctor
```

O doctor verifica o env do broker Convex, valida as configurações de endpoint e verifica
o alcance de admin/list quando o segredo do mantenedor está presente. Ele relata apenas
o status definido/ausente dos segredos.

Para uma lane smoke de Discord com transporte real, execute:

```bash
pnpm openclaw qa discord
```

Essa lane usa um canal real privado de guild do Discord com dois bots: um
bot driver controlado pelo harness e um bot SUT iniciado pelo gateway filho
do OpenClaw por meio do Plugin Discord incluído. Ela exige
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
e `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` ao usar credenciais por env.
A lane verifica o tratamento de menções no canal e confere se o bot SUT
registrou o comando nativo `/help` no Discord.
O comando sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
você quiser artefatos sem um código de saída de falha.

As lanes de transporte ao vivo agora compartilham um contrato menor em vez de cada uma inventar
seu próprio formato de lista de cenários:

`qa-channel` continua sendo a suíte ampla e sintética de comportamento do produto e não faz parte
da matriz de cobertura de transporte ao vivo.

| Lane     | Canary | Gate de menção | Bloco de allowlist | Resposta de nível superior | Retomada após reinício | Acompanhamento em thread | Isolamento de thread | Observação de reação | Comando help | Registro de comando nativo |
| -------- | ------ | -------------- | ------------------ | -------------------------- | ---------------------- | ------------------------ | -------------------- | -------------------- | ------------ | -------------------------- |
| Matrix   | x      | x              | x                  | x                          | x                      | x                        | x                    | x                    |              |                            |
| Telegram | x      | x              |                    |                            |                        |                          |                      |                      | x            |                            |
| Discord  | x      | x              |                    |                            |                        |                          |                      |                      |              | x                          |

Isso mantém `qa-channel` como a suíte ampla de comportamento do produto, enquanto
Matrix, Telegram e futuros transportes ao vivo compartilham uma checklist explícita
de contrato de transporte.

Para uma lane de VM Linux descartável sem colocar Docker no caminho do QA, execute:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Isso inicializa um guest Multipass novo, instala dependências, faz build do OpenClaw
dentro do guest, executa `qa suite` e depois copia o relatório e o
resumo normais de QA de volta para `.artifacts/qa-e2e/...` no host.
Ele reutiliza o mesmo comportamento de seleção de cenários que `qa suite` no host.
Execuções da suíte no host e no Multipass executam vários cenários selecionados em paralelo
com workers de gateway isolados por padrão. `qa-channel` usa concorrência 4 por padrão,
limitada pela quantidade de cenários selecionados. Use `--concurrency <count>` para ajustar
a quantidade de workers, ou `--concurrency 1` para execução serial.
O comando sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
você quiser artefatos sem um código de saída de falha.
Execuções ao vivo encaminham as entradas de autenticação de QA compatíveis que são práticas para o
guest: chaves de provider por env, o caminho de configuração de provider ao vivo de QA e
`CODEX_HOME` quando presente. Mantenha `--output-dir` sob a raiz do repositório para que o guest
possa gravar de volta por meio do workspace montado.

## Seeds com suporte do repositório

Os recursos de seed ficam em `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Eles ficam intencionalmente no git para que o plano de QA seja visível tanto para humanos quanto para o
agente.

`qa-lab` deve continuar sendo um executor genérico de Markdown. Cada arquivo Markdown de cenário é
a fonte da verdade para uma execução de teste e deve definir:

- metadados do cenário
- metadados opcionais de categoria, capacidade, lane e risco
- refs de docs e código
- requisitos opcionais de Plugin
- patch opcional de configuração do gateway
- o `qa-flow` executável

A superfície de runtime reutilizável que dá suporte ao `qa-flow` pode continuar genérica
e transversal. Por exemplo, cenários em Markdown podem combinar helpers do lado do transporte
com helpers do lado do navegador que dirigem a Control UI embutida por meio da
seam `browser.request` do Gateway sem adicionar um executor especial por caso.

Arquivos de cenário devem ser agrupados por capacidade do produto em vez de por pasta da árvore
de código-fonte. Mantenha os IDs de cenário estáveis quando os arquivos mudarem de lugar; use `docsRefs` e `codeRefs`
para rastreabilidade de implementação.

A lista básica deve permanecer ampla o suficiente para cobrir:

- chat por DM e canal
- comportamento de thread
- ciclo de vida de ações de mensagem
- callbacks de cron
- recuperação de memória
- troca de modelo
- handoff de subagente
- leitura de repositório e leitura de docs
- uma pequena tarefa de build, como Lobster Invaders

## Lanes mock de provider

`qa suite` tem duas lanes locais de mock de provider:

- `mock-openai` é o mock do OpenClaw com reconhecimento de cenário. Ele continua sendo a
  lane mock determinística padrão para QA com suporte do repositório e parity gates.
- `aimock` inicia um servidor de provider com suporte de AIMock para cobertura experimental de protocolo,
  fixture, record/replay e caos. Ele é aditivo e não substitui o dispatcher de cenários
  `mock-openai`.

A implementação da lane de provider fica em `extensions/qa-lab/src/providers/`.
Cada provider controla seus padrões, inicialização de servidor local, configuração de modelo do gateway,
necessidades de preparação de perfil de autenticação e flags de capacidade live/mock. O código
compartilhado da suíte e do gateway deve rotear pelo registro de providers em vez de ramificar
por nomes de provider.

## Adaptadores de transporte

`qa-lab` é proprietário de uma seam genérica de transporte para cenários de QA em Markdown.
`qa-channel` é o primeiro adaptador nessa seam, mas o objetivo do design é mais amplo:
canais futuros, reais ou sintéticos, devem se conectar ao mesmo executor da suíte
em vez de adicionar um executor de QA específico do transporte.

No nível da arquitetura, a divisão é:

- `qa-lab` é proprietário da execução genérica de cenários, concorrência de workers, gravação de artefatos e relatórios.
- o adaptador de transporte é proprietário da configuração do gateway, prontidão, observação de entrada e saída, ações de transporte e estado de transporte normalizado.
- arquivos de cenário Markdown em `qa/scenarios/` definem a execução de teste; `qa-lab` fornece a superfície de runtime reutilizável que os executa.

A orientação de adoção voltada para mantenedores para novos adaptadores de canal fica em
[Testes](/pt-BR/help/testing#adding-a-channel-to-qa).

## Relatórios

`qa-lab` exporta um relatório de protocolo em Markdown a partir da linha do tempo observada do barramento.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que permaneceu bloqueado
- Que cenários de acompanhamento vale a pena adicionar

Para verificações de caráter e estilo, execute o mesmo cenário em vários refs de modelo ao vivo
e grave um relatório em Markdown avaliado:

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
devem definir a persona por meio de `SOUL.md` e depois executar rodadas comuns de usuário,
como chat, ajuda no workspace e pequenas tarefas com arquivos. O modelo candidato
não deve ser informado de que está sendo avaliado. O comando preserva cada transcrição completa,
registra estatísticas básicas da execução e depois pede aos modelos juízes em modo rápido com
raciocínio `xhigh`, quando compatível, que classifiquem as execuções por naturalidade, vibe e humor.
Use `--blind-judge-models` ao comparar providers: o prompt do juiz ainda recebe
cada transcrição e status da execução, mas refs candidatos são substituídos por rótulos
neutros como `candidate-01`; o relatório mapeia as classificações de volta para refs reais após
a análise.

As execuções candidatas usam `high` thinking por padrão, com `medium` para GPT-5.5 e `xhigh`
para refs de avaliação OpenAI mais antigas que oferecem suporte. Substitua um candidato específico inline com
`--model provider/model,thinking=<level>`. `--thinking <level>` ainda define um fallback global,
e a forma mais antiga `--model-thinking <provider/model=level>` é mantida por compatibilidade.
Refs candidatas da OpenAI usam fast mode por padrão para que o processamento prioritário seja usado
quando o provider oferecer suporte. Adicione `,fast`, `,no-fast` ou `,fast=false` inline quando um
único candidato ou juiz precisar de uma substituição. Passe `--fast` apenas quando quiser
forçar o fast mode para todos os modelos candidatos. As durações de candidatos e juízes são
registradas no relatório para análise de benchmark, mas os prompts dos juízes dizem explicitamente
para não classificar por velocidade.
As execuções de modelos candidatos e juízes usam concorrência 16 por padrão. Reduza
`--concurrency` ou `--judge-concurrency` quando limites do provider ou pressão no gateway local
deixarem a execução muito ruidosa.
Quando nenhum `--model` candidato é passado, a avaliação de caráter usa por padrão
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando nenhum `--model` é passado.
Quando nenhum `--judge-model` é passado, os juízes usam por padrão
`openai/gpt-5.5,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentação relacionada

- [Testes](/pt-BR/help/testing)
- [Canal QA](/pt-BR/channels/qa-channel)
- [Painel](/pt-BR/web/dashboard)
