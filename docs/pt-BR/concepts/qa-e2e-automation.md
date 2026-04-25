---
read_when:
    - Estendendo qa-lab ou qa-channel
    - Adicionando cenários de QA apoiados pelo repositório
    - Criando automação de QA com maior realismo em torno do painel do Gateway
summary: Estrutura da automação privada de QA para qa-lab, qa-channel, cenários com seed e relatórios de protocolo
title: Automação de QA E2E
x-i18n:
    generated_at: "2026-04-25T13:44:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a49e0954845355667617c85340281b6dc1b043857a76d7b303cc0a8b2845a75
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

A pilha privada de QA foi criada para exercitar o OpenClaw de uma forma mais realista,
com formato de canal, do que um único teste de unidade consegue.

Peças atuais:

- `extensions/qa-channel`: canal de mensagens sintético com superfícies de DM, canal, thread,
  reação, edição e exclusão.
- `extensions/qa-lab`: UI de depuração e barramento de QA para observar a transcrição,
  injetar mensagens de entrada e exportar um relatório em Markdown.
- `qa/`: recursos com seed apoiados pelo repositório para a tarefa inicial e cenários
  básicos de QA.

O fluxo atual do operador de QA é um site de QA em dois painéis:

- Esquerda: painel do Gateway (Control UI) com o agente.
- Direita: QA Lab, mostrando a transcrição em estilo Slack e o plano do cenário.

Execute com:

```bash
pnpm qa:lab:up
```

Isso compila o site de QA, inicia a lane do Gateway com suporte de Docker e expõe a
página do QA Lab, onde um operador ou loop de automação pode dar ao agente uma
missão de QA, observar o comportamento real do canal e registrar o que funcionou,
falhou ou permaneceu bloqueado.

Para uma iteração mais rápida da UI do QA Lab sem reconstruir a imagem Docker a cada vez,
inicie a pilha com um bundle do QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantém os serviços Docker em uma imagem pré-compilada e monta por bind
`extensions/qa-lab/web/dist` no contêiner `qa-lab`. `qa:lab:watch`
recompila esse bundle em cada alteração, e o navegador recarrega automaticamente quando o hash
do recurso do QA Lab muda.

Para uma lane de smoke do Matrix com transporte real, execute:

```bash
pnpm openclaw qa matrix
```

Essa lane provisiona um homeserver Tuwunel descartável no Docker, registra
usuários temporários de driver, SUT e observador, cria uma sala privada, e então executa
o plugin real do Matrix dentro de um processo filho do Gateway de QA. A lane de transporte ao vivo mantém
a configuração do processo filho restrita ao transporte em teste, de modo que o Matrix funcione sem
`qa-channel` na configuração do processo filho. Ela grava os artefatos do relatório estruturado e
um log combinado de stdout/stderr no diretório de saída de QA do Matrix selecionado. Para
capturar também a saída de compilação/inicialização externa de `scripts/run-node.mjs`, defina
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` para um arquivo de log local ao repositório.
O progresso do Matrix é impresso por padrão. `OPENCLAW_QA_MATRIX_TIMEOUT_MS` limita
a execução completa, e `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` limita a limpeza para que uma finalização
travada do Docker informe o comando exato de recuperação em vez de ficar presa.

Para uma lane de smoke do Telegram com transporte real, execute:

```bash
pnpm openclaw qa telegram
```

Essa lane usa um grupo privado real do Telegram em vez de provisionar um
servidor descartável. Ela exige `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, além de dois bots distintos no mesmo
grupo privado. O bot SUT deve ter um nome de usuário do Telegram, e a observação
bot para bot funciona melhor quando ambos os bots têm o modo Bot-to-Bot Communication
ativado no `@BotFather`.
O comando sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
você quiser artefatos sem um código de saída de falha.
O relatório e o resumo do Telegram incluem RTT por resposta, da
requisição de envio da mensagem do driver até a resposta observada do SUT, começando pelo canário.

Antes de usar credenciais ao vivo compartilhadas, execute:

```bash
pnpm openclaw qa credentials doctor
```

O doctor verifica o ambiente do broker Convex, valida as configurações de endpoint e verifica
o alcance de admin/list quando o segredo do mantenedor está presente. Ele informa apenas
o status de definido/ausente para segredos.

Para uma lane de smoke do Discord com transporte real, execute:

```bash
pnpm openclaw qa discord
```

Essa lane usa um canal real privado de servidor do Discord com dois bots: um
bot de driver controlado pelo harness e um bot SUT iniciado pelo Gateway
filho do OpenClaw por meio do plugin incluído do Discord. Ela exige
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
e `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` ao usar credenciais por variável de ambiente.
A lane verifica o tratamento de menções do canal e checa se o bot SUT registrou
o comando nativo `/help` no Discord.
O comando sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
você quiser artefatos sem um código de saída de falha.

As lanes de transporte ao vivo agora compartilham um contrato menor em vez de cada uma inventar
seu próprio formato de lista de cenários:

`qa-channel` continua sendo a suíte ampla de comportamento sintético do produto e não faz parte
da matriz de cobertura de transporte ao vivo.

| Lane     | Canary | Controle por menção | Bloqueio por allowlist | Resposta de nível superior | Retomada após reinício | Acompanhamento em thread | Isolamento de thread | Observação de reação | Comando help | Registro de comando nativo |
| -------- | ------ | ------------------- | ---------------------- | -------------------------- | ---------------------- | ------------------------ | -------------------- | -------------------- | ------------ | -------------------------- |
| Matrix   | x      | x                   | x                      | x                          | x                      | x                        | x                    | x                    |              |                            |
| Telegram | x      | x                   |                        |                            |                        |                          |                      |                      | x            |                            |
| Discord  | x      | x                   |                        |                            |                        |                          |                      |                      |              | x                          |

Isso mantém `qa-channel` como a suíte ampla de comportamento do produto, enquanto Matrix,
Telegram e futuros transportes ao vivo compartilham uma checklist explícita de contrato de transporte.

Para uma lane de VM Linux descartável sem colocar o Docker no caminho do QA, execute:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Isso inicializa um guest novo do Multipass, instala dependências, compila o OpenClaw
dentro do guest, executa `qa suite` e então copia o relatório e o resumo normais de QA
de volta para `.artifacts/qa-e2e/...` no host.
Ele reutiliza o mesmo comportamento de seleção de cenários que `qa suite` no host.
Execuções da suíte no host e no Multipass executam vários cenários selecionados em paralelo
com workers isolados do Gateway por padrão. `qa-channel` usa concorrência 4 por padrão,
limitada pela contagem de cenários selecionados. Use `--concurrency <count>` para ajustar
a quantidade de workers, ou `--concurrency 1` para execução serial.
O comando sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
você quiser artefatos sem um código de saída de falha.
Execuções ao vivo encaminham as entradas compatíveis de autenticação de QA que são práticas para o
guest: chaves de provedor baseadas em variável de ambiente, o caminho de configuração do provedor ao vivo de QA e
`CODEX_HOME` quando presente. Mantenha `--output-dir` sob a raiz do repositório para que o guest
possa gravar de volta por meio do workspace montado.

## Seeds apoiadas pelo repositório

Os recursos com seed ficam em `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Eles ficam intencionalmente no git para que o plano de QA seja visível tanto para humanos quanto para
o agente.

`qa-lab` deve permanecer um executor genérico de Markdown. Cada arquivo Markdown de cenário é
a fonte da verdade para uma execução de teste e deve definir:

- metadados do cenário
- metadados opcionais de categoria, recurso, lane e risco
- referências de documentação e código
- requisitos opcionais de plugin
- patch opcional de configuração do Gateway
- o `qa-flow` executável

A superfície de runtime reutilizável que sustenta `qa-flow` pode continuar genérica
e transversal. Por exemplo, cenários em Markdown podem combinar helpers do lado do
transporte com helpers do lado do navegador que controlam a Control UI incorporada por meio da
superfície `browser.request` do Gateway sem adicionar um executor com caso especial.

Os arquivos de cenário devem ser agrupados por recurso do produto, e não pela pasta da árvore
do código-fonte. Mantenha os IDs dos cenários estáveis quando os arquivos forem movidos; use `docsRefs` e `codeRefs`
para rastreabilidade da implementação.

A lista básica deve permanecer ampla o suficiente para cobrir:

- chat por DM e por canal
- comportamento de thread
- ciclo de vida de ações de mensagem
- callbacks de Cron
- recuperação de memória
- troca de modelo
- handoff para subagente
- leitura de repositório e leitura de documentação
- uma pequena tarefa de compilação, como Lobster Invaders

## Lanes de mock de provedor

`qa suite` tem duas lanes locais de mock de provedor:

- `mock-openai` é o mock do OpenClaw com reconhecimento de cenário. Ele continua sendo a
  lane de mock determinística padrão para QA apoiado pelo repositório e parity gates.
- `aimock` inicia um servidor de provedor com suporte do AIMock para cobertura experimental de protocolo,
  fixture, gravação/reprodução e caos. É aditivo e não substitui o despachante de cenários
  `mock-openai`.

A implementação da lane de provedor fica em `extensions/qa-lab/src/providers/`.
Cada provedor é responsável por seus padrões, inicialização do servidor local, configuração do modelo do Gateway,
necessidades de preparação de perfil de autenticação e flags de capacidade live/mock. O código
compartilhado da suíte e do Gateway deve passar pelo registro de provedores em vez de ramificar pelos
nomes dos provedores.

## Adaptadores de transporte

`qa-lab` é o dono de uma superfície de transporte genérica para cenários de QA em Markdown.
`qa-channel` é o primeiro adaptador nessa superfície, mas o objetivo do design é mais amplo:
canais futuros, reais ou sintéticos, devem se conectar ao mesmo executor de suíte
em vez de adicionar um executor de QA específico para transporte.

No nível de arquitetura, a divisão é:

- `qa-lab` é o dono da execução genérica de cenários, concorrência de workers, gravação de artefatos e relatórios.
- o adaptador de transporte é o dono da configuração do Gateway, prontidão, observação de entrada e saída, ações de transporte e estado de transporte normalizado.
- arquivos de cenário em Markdown em `qa/scenarios/` definem a execução de teste; `qa-lab` fornece a superfície de runtime reutilizável que os executa.

A orientação de adoção voltada a mantenedores para novos adaptadores de canal fica em
[Testing](/pt-BR/help/testing#adding-a-channel-to-qa).

## Relatórios

`qa-lab` exporta um relatório de protocolo em Markdown a partir da linha do tempo observada do barramento.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que permaneceu bloqueado
- Quais cenários de acompanhamento valem a pena adicionar

Para verificações de caráter e estilo, execute o mesmo cenário em várias referências
de modelo ao vivo e grave um relatório em Markdown avaliado:

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

O comando executa processos filhos locais do Gateway de QA, não Docker. Cenários de avaliação de caráter
devem definir a persona por meio de `SOUL.md` e então executar turnos comuns de usuário,
como chat, ajuda de workspace e pequenas tarefas com arquivos. O modelo candidato
não deve ser informado de que está sendo avaliado. O comando preserva cada transcrição
completa, registra estatísticas básicas da execução e então pede aos modelos juízes em modo fast com
raciocínio `xhigh`, quando compatível, que classifiquem as execuções por naturalidade, vibe e humor.
Use `--blind-judge-models` ao comparar provedores: o prompt do juiz ainda recebe
cada transcrição e status de execução, mas as referências dos candidatos são substituídas por
rótulos neutros, como `candidate-01`; o relatório mapeia as classificações de volta para as referências reais após a análise.
As execuções candidatas usam `high` thinking por padrão, com `medium` para GPT-5.4 e `xhigh`
para referências de avaliação OpenAI mais antigas que ofereçam suporte. Substitua um candidato específico inline com
`--model provider/model,thinking=<level>`. `--thinking <level>` ainda define um fallback global, e o formato antigo `--model-thinking <provider/model=level>` é mantido por compatibilidade.
Referências candidatas da OpenAI usam modo fast por padrão para que o processamento prioritário seja usado onde
o provedor oferecer suporte. Adicione `,fast`, `,no-fast` ou `,fast=false` inline quando um
único candidato ou juiz precisar de uma substituição. Passe `--fast` somente quando quiser
forçar o modo fast para todos os modelos candidatos. As durações de candidatos e juízes são
registradas no relatório para análise de benchmark, mas os prompts dos juízes dizem explicitamente
para não classificar por velocidade.
As execuções dos modelos candidatos e juízes usam concorrência 16 por padrão. Reduza
`--concurrency` ou `--judge-concurrency` quando limites do provedor ou pressão no Gateway local
deixarem a execução muito ruidosa.
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
