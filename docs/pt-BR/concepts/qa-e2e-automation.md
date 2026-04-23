---
read_when:
    - Estender qa-lab ou qa-channel
    - Adicionar cenários de QA com suporte do repositório
    - Criar automação de QA com maior realismo em torno do painel do Gateway
summary: Estrutura da automação privada de QA para qa-lab, qa-channel, cenários com seed e relatórios de protocolo
title: Automação E2E de QA
x-i18n:
    generated_at: "2026-04-23T14:02:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967a74d2e70b042e9443c5ec954902b820d2e5a22cbecd9be74af13b9085553
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automação E2E de QA

A pilha privada de QA foi feita para exercitar o OpenClaw de uma forma mais
realista e com formato de canal do que um único teste unitário consegue.

Peças atuais:

- `extensions/qa-channel`: canal sintético de mensagens com superfícies de DM, canal, thread,
  reação, edição e exclusão.
- `extensions/qa-lab`: UI de depuração e barramento de QA para observar a transcrição,
  injetar mensagens de entrada e exportar um relatório em Markdown.
- `qa/`: assets com suporte do repositório para a tarefa inicial e cenários
  básicos de QA.

O fluxo atual do operador de QA é um site de QA em dois painéis:

- Esquerda: painel do Gateway (UI de controle) com o agente.
- Direita: QA Lab, mostrando a transcrição em estilo Slack e o plano do cenário.

Execute com:

```bash
pnpm qa:lab:up
```

Isso compila o site de QA, inicia a lane do gateway com suporte de Docker e expõe a
página do QA Lab, onde um operador ou loop de automação pode dar ao agente uma
missão de QA, observar o comportamento real do canal e registrar o que funcionou,
o que falhou ou o que permaneceu bloqueado.

Para iteração mais rápida da UI do QA Lab sem reconstruir a imagem Docker toda vez,
inicie a pilha com um bundle do QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantém os serviços Docker em uma imagem pré-compilada e faz bind-mount de
`extensions/qa-lab/web/dist` no contêiner `qa-lab`. `qa:lab:watch`
recompila esse bundle quando há mudanças, e o navegador recarrega automaticamente quando o hash
do asset do QA Lab muda.

Para uma lane de smoke Matrix com transporte real, execute:

```bash
pnpm openclaw qa matrix
```

Essa lane provisiona um homeserver Tuwunel descartável no Docker, registra
usuários temporários de driver, SUT e observador, cria uma sala privada e então executa
o Plugin Matrix real dentro de um filho de gateway de QA. A lane de transporte ativa mantém
a configuração filha limitada ao transporte em teste, então o Matrix é executado sem
`qa-channel` na configuração filha. Ela grava os artifacts de relatório estruturado e
um log combinado de stdout/stderr no diretório de saída de QA Matrix selecionado. Para
capturar também a saída externa de compilação/inicialização de `scripts/run-node.mjs`, defina
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` para um arquivo de log local ao repositório.

Para uma lane de smoke Telegram com transporte real, execute:

```bash
pnpm openclaw qa telegram
```

Essa lane usa um grupo privado real do Telegram em vez de provisionar
um servidor descartável. Ela exige `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, além de dois bots distintos no mesmo
grupo privado. O bot SUT precisa ter um nome de usuário do Telegram, e a observação entre bots
funciona melhor quando ambos os bots têm o modo Bot-to-Bot Communication
habilitado no `@BotFather`.
O comando retorna um código diferente de zero quando algum cenário falha. Use `--allow-failures` quando
quiser os artifacts sem um código de saída de falha.
O relatório e o resumo do Telegram incluem RTT por resposta, medido desde a requisição
de envio da mensagem do driver até a resposta observada do SUT, começando pelo canário.

As lanes de transporte ativo agora compartilham um contrato menor em vez de cada uma inventar
seu próprio formato de lista de cenários:

`qa-channel` continua sendo a suíte ampla de comportamento sintético do produto e não faz parte
da matriz de cobertura de transporte ativo.

| Lane     | Canary | Gating de menção | Bloco por allowlist | Resposta de nível superior | Retomada após reinício | Acompanhamento em thread | Isolamento de thread | Observação de reação | Comando help |
| -------- | ------ | ---------------- | ------------------- | -------------------------- | ---------------------- | ------------------------ | -------------------- | -------------------- | ------------ |
| Matrix   | x      | x                | x                   | x                          | x                      | x                        | x                    | x                    |              |
| Telegram | x      |                  |                     |                            |                        |                          |                      |                      | x            |

Isso mantém `qa-channel` como a suíte ampla de comportamento do produto, enquanto
Matrix, Telegram e futuros transportes ativos compartilham uma checklist explícita
de contrato de transporte.

Para uma lane descartável de VM Linux sem trazer o Docker para o caminho de QA, execute:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Isso inicializa um guest novo do Multipass, instala dependências, compila o OpenClaw
dentro do guest, executa `qa suite` e então copia o relatório e o resumo normais de QA
de volta para `.artifacts/qa-e2e/...` no host.
Ele reutiliza o mesmo comportamento de seleção de cenários de `qa suite` no host.
Execuções de suíte no host e no Multipass executam vários cenários selecionados em paralelo
com workers de gateway isolados por padrão. `qa-channel` usa por padrão concorrência
4, limitada pela contagem de cenários selecionados. Use `--concurrency <count>` para ajustar
a quantidade de workers, ou `--concurrency 1` para execução serial.
O comando retorna um código diferente de zero quando algum cenário falha. Use `--allow-failures` quando
quiser os artifacts sem um código de saída de falha.
Execuções ativas encaminham as entradas de autenticação de QA compatíveis que são práticas para o
guest: chaves de provider baseadas em env, o caminho de configuração do provider ativo de QA e
`CODEX_HOME`, quando presente. Mantenha `--output-dir` sob a raiz do repositório para que o guest
possa gravar de volta pelo workspace montado.

## Seeds com suporte do repositório

Os assets de seed ficam em `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Eles ficam intencionalmente no git para que o plano de QA seja visível tanto para humanos quanto para o
agente.

`qa-lab` deve continuar sendo um executor genérico de Markdown. Cada arquivo Markdown de cenário é
a fonte da verdade para uma execução de teste e deve definir:

- metadados do cenário
- metadados opcionais de categoria, capacidade, lane e risco
- refs de documentação e de código
- requisitos opcionais de Plugin
- patch opcional de configuração do gateway
- o `qa-flow` executável

A superfície de runtime reutilizável que dá suporte a `qa-flow` pode continuar genérica
e transversal. Por exemplo, cenários em Markdown podem combinar helpers do lado do transporte
com helpers do lado do navegador que dirigem a UI de controle incorporada pela
seam `browser.request` do Gateway sem adicionar um executor especial para o runner.

Os arquivos de cenário devem ser agrupados por capacidade do produto e não por pasta da
árvore de código-fonte. Mantenha IDs de cenário estáveis quando arquivos forem movidos; use `docsRefs` e `codeRefs`
para rastreabilidade de implementação.

A lista de baseline deve permanecer ampla o suficiente para cobrir:

- chat por DM e por canal
- comportamento de thread
- ciclo de vida de ação de mensagem
- callbacks de cron
- recuperação de memória
- troca de modelo
- handoff de subagente
- leitura de repositório e leitura de documentação
- uma pequena tarefa de compilação, como Lobster Invaders

## Lanes de mock de provider

`qa suite` tem duas lanes locais de mock de provider:

- `mock-openai` é o mock do OpenClaw sensível a cenário. Ele continua sendo a
  lane de mock determinística padrão para QA com suporte do repositório e gates de paridade.
- `aimock` inicia um servidor de provider com suporte de AIMock para cobertura experimental de protocolo,
  fixture, gravação/reprodução e caos. É aditivo e não substitui o dispatcher de cenário
  `mock-openai`.

A implementação de lanes de provider fica em `extensions/qa-lab/src/providers/`.
Cada provider é dono de seus padrões, inicialização de servidor local, configuração de modelo do gateway,
necessidades de preparação de perfil de autenticação e flags de capacidade ativa/mock. O código compartilhado
da suíte e do gateway deve rotear pelo registro de providers em vez de ramificar por nomes
de provider.

## Adaptadores de transporte

`qa-lab` é dono de uma seam genérica de transporte para cenários de QA em Markdown.
`qa-channel` é o primeiro adaptador nessa seam, mas o objetivo do design é mais amplo:
futuros canais reais ou sintéticos devem se conectar ao mesmo runner da suíte
em vez de adicionar um runner de QA específico do transporte.

No nível de arquitetura, a separação é:

- `qa-lab` é dono da execução genérica de cenários, concorrência de workers, gravação de artifacts e geração de relatórios.
- o adaptador de transporte é dono da configuração do gateway, prontidão, observação de entrada e saída, ações de transporte e estado normalizado do transporte.
- arquivos de cenário em Markdown sob `qa/scenarios/` definem a execução de teste; `qa-lab` fornece a superfície de runtime reutilizável que os executa.

A orientação de adoção voltada a mantenedores para novos adaptadores de canal fica em
[Testes](/pt-BR/help/testing#adding-a-channel-to-qa).

## Relatórios

`qa-lab` exporta um relatório de protocolo em Markdown a partir da linha do tempo do barramento observado.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que permaneceu bloqueado
- Quais cenários de acompanhamento vale a pena adicionar

Para verificações de caráter e estilo, execute o mesmo cenário em vários refs de modelo ativos
e grave um relatório em Markdown avaliado:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
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

O comando executa processos filhos locais de gateway de QA, não Docker. Cenários de avaliação de caráter
devem definir a persona por meio de `SOUL.md` e então executar turnos normais de usuário,
como chat, ajuda no workspace e pequenas tarefas com arquivos. O modelo candidato
não deve ser informado de que está sendo avaliado. O comando preserva cada transcrição completa,
registra estatísticas básicas de execução e então pede aos modelos juízes em modo rápido com
raciocínio `xhigh` para classificar as execuções por naturalidade, vibe e humor.
Use `--blind-judge-models` ao comparar providers: o prompt do juiz ainda recebe
cada transcrição e status de execução, mas os refs candidatos são substituídos por rótulos neutros
como `candidate-01`; o relatório remapeia as classificações para os refs reais após o
parsing.
Execuções candidatas usam por padrão raciocínio `high`, com `xhigh` para modelos OpenAI que
oferecem suporte. Substitua um candidato específico inline com
`--model provider/model,thinking=<level>`. `--thinking <level>` ainda define um
fallback global, e a forma antiga `--model-thinking <provider/model=level>` é
mantida por compatibilidade.
Refs candidatos OpenAI usam por padrão o modo rápido para que o processamento prioritário seja usado
onde o provider oferece suporte. Adicione `,fast`, `,no-fast` ou `,fast=false` inline quando um
único candidato ou juiz precisar de substituição. Passe `--fast` apenas quando quiser
forçar o modo rápido para todos os modelos candidatos. As durações de candidato e juiz são
registradas no relatório para análise de benchmark, mas os prompts dos juízes dizem explicitamente
para não classificar por velocidade.
Execuções de modelo candidato e de juiz usam por padrão concorrência 16. Reduza
`--concurrency` ou `--judge-concurrency` quando limites do provider ou pressão no gateway local
deixarem a execução ruidosa demais.
Quando nenhum `--model` candidato é passado, a avaliação de caráter usa por padrão
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando nenhum `--model` é passado.
Quando nenhum `--judge-model` é passado, os juízes usam por padrão
`openai/gpt-5.4,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentação relacionada

- [Testes](/pt-BR/help/testing)
- [Canal QA](/pt-BR/channels/qa-channel)
- [Dashboard](/pt-BR/web/dashboard)
