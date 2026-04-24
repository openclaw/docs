---
read_when:
    - Estendendo qa-lab ou qa-channel
    - Adicionando cenários de QA com suporte do repositório
    - Criando automação de QA com maior realismo em torno do dashboard do Gateway
summary: Formato da automação privada de QA para qa-lab, qa-channel, cenários com seed e relatórios de protocolo
title: Automação E2E de QA
x-i18n:
    generated_at: "2026-04-24T05:48:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbde51169a1572dc6753ab550ca29ca98abb2394e8991a8482bd7b66ea80ce76
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

A pilha privada de QA foi feita para exercitar o OpenClaw de uma forma mais realista,
com formato de canal, do que um único teste de unidade consegue.

Peças atuais:

- `extensions/qa-channel`: canal de mensagens sintético com superfícies de DM, canal, thread,
  reação, edição e exclusão.
- `extensions/qa-lab`: interface de depuração e barramento de QA para observar a transcrição,
  injetar mensagens de entrada e exportar um relatório Markdown.
- `qa/`: assets com seed mantidos no repositório para a tarefa inicial e cenários
  base de QA.

O fluxo atual do operador de QA é um site de QA com dois painéis:

- Esquerda: dashboard do Gateway (Control UI) com o agente.
- Direita: QA Lab, mostrando a transcrição em estilo Slack e o plano do cenário.

Execute com:

```bash
pnpm qa:lab:up
```

Isso gera o site de QA, inicia a lane do gateway com suporte de Docker e expõe a
página do QA Lab, onde um operador ou loop de automação pode dar ao agente uma
missão de QA, observar o comportamento real do canal e registrar o que funcionou,
falhou ou permaneceu bloqueado.

Para uma iteração mais rápida na interface do QA Lab sem reconstruir a imagem Docker a cada vez,
inicie a pilha com um bundle do QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantém os serviços Docker em uma imagem pré-construída e faz bind-mount de
`extensions/qa-lab/web/dist` no contêiner `qa-lab`. `qa:lab:watch`
reconstrói esse bundle quando há mudanças, e o navegador faz reload automático quando o hash do asset do QA Lab muda.

Para uma lane smoke real de transporte do Matrix, execute:

```bash
pnpm openclaw qa matrix
```

Essa lane provisiona um homeserver Tuwunel descartável em Docker, registra
usuários temporários de driver, SUT e observador, cria uma sala privada, e então executa
o Plugin real do Matrix dentro de um processo filho de gateway de QA. A lane de transporte ao vivo mantém
a configuração filha restrita ao transporte em teste, então o Matrix é executado sem
`qa-channel` na configuração filha. Ela grava os artefatos estruturados de relatório e
um log combinado de stdout/stderr no diretório de saída de QA do Matrix selecionado. Para
capturar também a saída de build/launcher externa de `scripts/run-node.mjs`, defina
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` para um arquivo de log local do repositório.

Para uma lane smoke real de transporte do Telegram, execute:

```bash
pnpm openclaw qa telegram
```

Essa lane usa um grupo privado real do Telegram em vez de provisionar um servidor descartável. Ela
requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, além de dois bots distintos no mesmo
grupo privado. O bot SUT deve ter um nome de usuário no Telegram, e a observação bot-a-bot funciona melhor quando ambos os bots têm Bot-to-Bot Communication Mode
habilitado no `@BotFather`.
O comando sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
quiser artefatos sem um código de saída de falha.
O relatório e o resumo do Telegram incluem RTT por resposta, do request de envio
da mensagem do driver até a resposta observada do SUT, começando pelo canário.

Para uma lane smoke real de transporte do Discord, execute:

```bash
pnpm openclaw qa discord
```

Essa lane usa um canal real de servidor privado do Discord com dois bots: um
bot driver controlado pelo harness e um bot SUT iniciado pelo gateway filho do
OpenClaw por meio do Plugin empacotado do Discord. Ela requer
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
e `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` ao usar credenciais por env.
A lane verifica o tratamento de menção no canal e confere se o bot SUT
registrou o comando nativo `/help` no Discord.
O comando sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
quiser artefatos sem um código de saída de falha.

As lanes de transporte ao vivo agora compartilham um contrato menor em vez de cada uma inventar
sua própria forma de lista de cenários:

`qa-channel` continua sendo a suíte ampla sintética de comportamento do produto e não faz parte
da matriz de cobertura de transporte ao vivo.

| Lane     | Canary | Exigência de menção | Bloqueio por allowlist | Resposta de nível superior | Retomada após reinício | Follow-up em thread | Isolamento de thread | Observação de reação | Comando help | Registro de comando nativo |
| -------- | ------ | ------------------- | ---------------------- | -------------------------- | ---------------------- | ------------------- | -------------------- | -------------------- | ------------ | -------------------------- |
| Matrix   | x      | x                   | x                      | x                          | x                      | x                   | x                    | x                    |              |                            |
| Telegram | x      | x                   |                        |                            |                        |                     |                      |                      | x            |                            |
| Discord  | x      | x                   |                        |                            |                        |                     |                      |                      |              | x                          |

Isso mantém `qa-channel` como a suíte ampla de comportamento do produto, enquanto Matrix,
Telegram e futuros transportes ao vivo compartilham uma checklist explícita de contrato de transporte.

Para uma lane descartável em VM Linux sem colocar Docker no caminho do QA, execute:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Isso inicializa um guest novo do Multipass, instala dependências, gera o OpenClaw
dentro do guest, executa `qa suite` e depois copia o relatório e
resumo normais de QA de volta para `.artifacts/qa-e2e/...` no host.
Ele reutiliza o mesmo comportamento de seleção de cenário de `qa suite` no host.
Execuções de suíte no host e no Multipass executam vários cenários selecionados em paralelo
com workers de gateway isolados por padrão. `qa-channel` usa concorrência 4 por padrão,
limitada pela quantidade de cenários selecionados. Use `--concurrency <count>` para ajustar
a quantidade de workers, ou `--concurrency 1` para execução serial.
O comando sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
quiser artefatos sem um código de saída de falha.
Execuções ao vivo encaminham as entradas de autenticação de QA compatíveis que são práticas para o
guest: chaves de provedor por env, o caminho da configuração de provedor ao vivo de QA e
`CODEX_HOME` quando presente. Mantenha `--output-dir` sob a raiz do repositório para que o guest
possa gravar de volta pelo workspace montado.

## Seeds com suporte do repositório

Assets de seed ficam em `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Eles ficam intencionalmente no git para que o plano de QA seja visível tanto para humanos quanto para o
agente.

`qa-lab` deve continuar sendo um executor genérico de Markdown. Cada arquivo Markdown de cenário é
a fonte da verdade para uma execução de teste e deve definir:

- metadados do cenário
- metadados opcionais de categoria, capacidade, lane e risco
- referências de docs e código
- requisitos opcionais de Plugin
- patch opcional de configuração do gateway
- o `qa-flow` executável

A superfície de runtime reutilizável que sustenta `qa-flow` pode continuar genérica
e transversal. Por exemplo, cenários em Markdown podem combinar helpers do lado do
transporte com helpers do lado do browser que dirigem a Control UI embutida pelo
seam `browser.request` do Gateway sem adicionar um executor com caso especial.

Arquivos de cenário devem ser agrupados por capacidade do produto, e não por pasta
da árvore de código-fonte. Mantenha IDs de cenário estáveis quando arquivos forem movidos; use `docsRefs` e `codeRefs`
para rastreabilidade de implementação.

A lista base deve continuar ampla o suficiente para cobrir:

- chat em DM e canal
- comportamento de thread
- ciclo de vida de ações de mensagem
- callbacks de Cron
- recall de memória
- troca de modelo
- handoff de subagente
- leitura de repositório e de documentação
- uma pequena tarefa de build, como Lobster Invaders

## Lanes de mock de provedor

`qa suite` tem duas lanes locais de mock de provedor:

- `mock-openai` é o mock do OpenClaw orientado por cenário. Ele continua sendo a
  lane de mock determinística padrão para QA com suporte do repositório e gates de paridade.
- `aimock` inicia um servidor de provedor com suporte de AIMock para cobertura experimental de protocolo,
  fixture, gravação/replay e caos. É aditivo e não substitui o despachante de cenários `mock-openai`.

A implementação da lane de provedor fica em `extensions/qa-lab/src/providers/`.
Cada provedor é responsável por seus padrões, inicialização de servidor local,
configuração de modelo do gateway, necessidades de preparação de perfil de autenticação
e flags de capacidade live/mock. Código compartilhado de suíte e gateway deve rotear pelo registro de provedores em vez de ramificar por nomes de provedores.

## Adaptadores de transporte

`qa-lab` é responsável por um seam genérico de transporte para cenários de QA em Markdown.
`qa-channel` é o primeiro adaptador nesse seam, mas o alvo de design é mais amplo:
futuros canais reais ou sintéticos devem se conectar ao mesmo executor de suíte
em vez de adicionar um executor de QA específico do transporte.

No nível de arquitetura, a divisão é:

- `qa-lab` é responsável por execução genérica de cenários, concorrência de workers, gravação de artefatos e relatórios.
- o adaptador de transporte é responsável por configuração do gateway, prontidão, observação de entrada e saída, ações de transporte e estado de transporte normalizado.
- arquivos de cenário em Markdown sob `qa/scenarios/` definem a execução do teste; `qa-lab` fornece a superfície de runtime reutilizável que os executa.

A orientação de adoção para mantenedores de novos adaptadores de canal fica em
[Testing](/pt-BR/help/testing#adding-a-channel-to-qa).

## Relatórios

`qa-lab` exporta um relatório de protocolo em Markdown a partir da linha do tempo observada do barramento.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que permaneceu bloqueado
- Quais cenários de acompanhamento vale a pena adicionar

Para verificações de caráter e estilo, execute o mesmo cenário em várias referências de modelo ao vivo
e grave um relatório Markdown avaliado:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

O comando executa processos filhos locais do gateway de QA, não Docker. Cenários de avaliação de caráter
devem definir a persona por meio de `SOUL.md`, depois executar turnos normais de usuário
como chat, ajuda com workspace e pequenas tarefas de arquivo. Não se deve dizer ao
modelo candidato que ele está sendo avaliado. O comando preserva cada transcrição
completa, registra estatísticas básicas de execução e então pede aos modelos juízes em modo rápido com
raciocínio `xhigh`, quando compatível, para classificar as execuções por naturalidade, vibe e humor.
Use `--blind-judge-models` ao comparar provedores: o prompt do juiz ainda recebe
cada transcrição e status de execução, mas as referências candidatas são substituídas por
rótulos neutros como `candidate-01`; o relatório mapeia as classificações de volta para as referências reais após
o parsing.
As execuções candidatas usam `high` thinking por padrão, com `medium` para GPT-5.4 e `xhigh`
para referências antigas de avaliação da OpenAI que ofereçam suporte. Sobrescreva um candidato específico inline com
`--model provider/model,thinking=<level>`. `--thinking <level>` continua definindo um fallback global, e a forma antiga `--model-thinking <provider/model=level>` é
mantida por compatibilidade.
Referências candidatas da OpenAI usam fast mode por padrão para que o processamento prioritário seja usado onde
o provedor oferecer suporte. Adicione `,fast`, `,no-fast` ou `,fast=false` inline quando um
único candidato ou juiz precisar de uma sobrescrita. Passe `--fast` apenas quando quiser
forçar fast mode para todos os modelos candidatos. As durações de candidatos e juízes são
registradas no relatório para análise de benchmark, mas os prompts dos juízes dizem explicitamente
para não classificar por velocidade.
Execuções de modelos candidatos e juízes usam concorrência 16 por padrão. Reduza
`--concurrency` ou `--judge-concurrency` quando limites do provedor ou pressão no gateway local
tornarem uma execução barulhenta demais.
Quando nenhum `--model` candidato é passado, a avaliação de caráter usa por padrão
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando nenhum `--model` é passado.
Quando nenhum `--judge-model` é passado, os juízes usam por padrão
`openai/gpt-5.4,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentação relacionada

- [Testing](/pt-BR/help/testing)
- [QA Channel](/pt-BR/channels/qa-channel)
- [Dashboard](/pt-BR/web/dashboard)
