---
read_when:
    - Estendendo qa-lab ou qa-channel
    - Adicionando cenários de QA respaldados pelo repositório
    - Criando automação de QA mais realista em torno do painel do Gateway
summary: Formato da automação de QA privada para qa-lab, qa-channel, cenários com seed e relatórios de protocolo
title: Automação de QA E2E
x-i18n:
    generated_at: "2026-04-13T05:41:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4a4f5c765163565c95c2a071f201775fd9d8d60cad4ff25d71e4710559c1570
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automação de QA E2E

A pilha privada de QA foi feita para exercitar o OpenClaw de uma forma mais realista,
com formato de canal, do que um único teste unitário consegue.

Partes atuais:

- `extensions/qa-channel`: canal de mensagens sintético com superfícies de DM, canal, thread,
  reação, edição e exclusão.
- `extensions/qa-lab`: UI de depuração e barramento de QA para observar a transcrição,
  injetar mensagens recebidas e exportar um relatório em Markdown.
- `qa/`: recursos de seed respaldados pelo repositório para a tarefa inicial e
  cenários básicos de QA.

O fluxo atual do operador de QA é um site de QA com dois painéis:

- Esquerda: painel do Gateway (Control UI) com o agente.
- Direita: QA Lab, mostrando a transcrição em estilo Slack e o plano de cenário.

Execute com:

```bash
pnpm qa:lab:up
```

Isso compila o site de QA, inicia a lane de Gateway com Docker em segundo plano e expõe a
página do QA Lab onde um operador ou loop de automação pode dar ao agente uma
missão de QA, observar o comportamento real do canal e registrar o que funcionou,
falhou ou permaneceu bloqueado.

Para uma iteração mais rápida da UI do QA Lab sem reconstruir a imagem Docker toda vez,
inicie a pilha com um bundle do QA Lab montado por bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantém os serviços Docker em uma imagem pré-compilada e faz bind mount de
`extensions/qa-lab/web/dist` no contêiner `qa-lab`. `qa:lab:watch`
recompila esse bundle quando houver mudanças, e o navegador recarrega automaticamente quando o hash
do recurso do QA Lab muda.

Para uma lane de smoke Matrix com transporte real, execute:

```bash
pnpm openclaw qa matrix
```

Essa lane provisiona um homeserver Tuwunel descartável em Docker, registra
usuários temporários de driver, SUT e observador, cria uma sala privada e então executa
o Plugin Matrix real dentro de um processo filho do Gateway de QA. A lane de transporte ao vivo mantém
a configuração filha limitada ao transporte em teste, para que o Matrix funcione sem
`qa-channel` na configuração filha.

Para uma lane de smoke Telegram com transporte real, execute:

```bash
pnpm openclaw qa telegram
```

Essa lane usa um grupo privado real do Telegram em vez de provisionar um servidor
descartável. Ela requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, além de dois bots distintos no mesmo
grupo privado. O bot SUT precisa ter um nome de usuário no Telegram, e a observação
entre bots funciona melhor quando ambos os bots têm o Modo de Comunicação Bot-to-Bot
ativado no `@BotFather`.

As lanes de transporte ao vivo agora compartilham um contrato menor em vez de cada uma
inventar seu próprio formato de lista de cenários.

`qa-channel` continua sendo a suíte ampla de comportamento sintético do produto e não faz parte
da matriz de cobertura de transporte ao vivo.

| Lane     | Canary | Bloqueio por menção | Bloqueio por allowlist | Resposta de nível superior | Retomada após reinício | Follow-up em thread | Isolamento de thread | Observação de reação | Comando de ajuda |
| -------- | ------ | ------------------- | ---------------------- | -------------------------- | ---------------------- | ------------------- | -------------------- | ------------------- | ---------------- |
| Matrix   | x      | x                   | x                      | x                          | x                      | x                   | x                    | x                   |                  |
| Telegram | x      |                     |                        |                            |                        |                     |                      |                     | x                |

Isso mantém `qa-channel` como a suíte ampla de comportamento do produto, enquanto Matrix,
Telegram e futuros transportes ao vivo compartilham uma checklist explícita de contrato
de transporte.

Para uma lane descartável de VM Linux sem colocar Docker no caminho do QA, execute:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Isso inicializa um guest Multipass novo, instala as dependências, compila o OpenClaw
dentro do guest, executa `qa suite` e depois copia o relatório e
resumo normais de QA de volta para `.artifacts/qa-e2e/...` no host.
Ele reutiliza o mesmo comportamento de seleção de cenários que `qa suite` no host.
As execuções da suíte no host e no Multipass executam vários cenários selecionados em paralelo
com workers de Gateway isolados por padrão, até 64 workers ou a contagem de cenários
selecionada. Use `--concurrency <count>` para ajustar a contagem de workers, ou
`--concurrency 1` para execução serial.
As execuções ao vivo encaminham as entradas de autenticação de QA compatíveis que são práticas para o
guest: chaves de provedor baseadas em variáveis de ambiente, o caminho de configuração do provedor ao vivo de QA e
`CODEX_HOME` quando presente. Mantenha `--output-dir` sob a raiz do repositório para que o guest
possa gravar de volta pelo workspace montado.

## Seeds respaldados pelo repositório

Os recursos de seed ficam em `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Eles ficam intencionalmente no git para que o plano de QA seja visível tanto para humanos quanto para o
agente.

`qa-lab` deve continuar sendo um executor genérico de Markdown. Cada arquivo Markdown de cenário é
a fonte de verdade para uma execução de teste e deve definir:

- metadados do cenário
- referências de documentação e código
- requisitos opcionais de Plugin
- patch opcional de configuração do Gateway
- o `qa-flow` executável

A superfície de runtime reutilizável que dá suporte ao `qa-flow` pode continuar genérica
e transversal. Por exemplo, cenários em Markdown podem combinar helpers do lado do transporte
com helpers do lado do navegador que controlam a Control UI embutida por meio da superfície
`browser.request` do Gateway sem adicionar um executor com caso especial.

A lista básica deve continuar ampla o suficiente para cobrir:

- chat em DM e canal
- comportamento de thread
- ciclo de vida de ações de mensagem
- callbacks de Cron
- recuperação de memória
- troca de modelo
- handoff para subagente
- leitura do repositório e da documentação
- uma pequena tarefa de build como Lobster Invaders

## Adaptadores de transporte

`qa-lab` é dono de uma superfície de transporte genérica para cenários de QA em Markdown.
`qa-channel` é o primeiro adaptador nessa superfície, mas o alvo do design é mais amplo:
futuros canais reais ou sintéticos devem se conectar ao mesmo executor de suíte
em vez de adicionar um executor de QA específico por transporte.

No nível de arquitetura, a divisão é:

- `qa-lab` é dono da execução genérica de cenários, concorrência de workers, gravação de artefatos e relatórios.
- o adaptador de transporte é dono da configuração do gateway, prontidão, observação de entrada e saída, ações de transporte e estado de transporte normalizado.
- os arquivos de cenário em Markdown sob `qa/scenarios/` definem a execução de teste; `qa-lab` fornece a superfície de runtime reutilizável que os executa.

A orientação de adoção voltada para mantenedores para novos adaptadores de canal fica em
[Testing](/pt-BR/help/testing#adding-a-channel-to-qa).

## Relatórios

`qa-lab` exporta um relatório de protocolo em Markdown a partir da linha do tempo observada no barramento.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que permaneceu bloqueado
- Quais cenários de acompanhamento valem a pena adicionar

Para verificações de caráter e estilo, execute o mesmo cenário em várias refs de modelos ao vivo
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

O comando executa processos filhos locais do Gateway de QA, não Docker. Os cenários de avaliação de caráter
devem definir a persona por meio de `SOUL.md` e então executar turnos normais de usuário,
como chat, ajuda com workspace e pequenas tarefas em arquivos. O modelo candidato não
deve ser informado de que está sendo avaliado. O comando preserva cada transcrição
completa, registra estatísticas básicas da execução e então pede aos modelos julgadores em modo fast com
raciocínio `xhigh` para classificar as execuções por naturalidade, vibe e humor.
Use `--blind-judge-models` ao comparar provedores: o prompt do julgador ainda recebe
cada transcrição e status de execução, mas as refs dos candidatos são substituídas por rótulos
neutros como `candidate-01`; o relatório mapeia as classificações de volta para as refs reais após
a análise.
As execuções dos candidatos usam `high` thinking por padrão, com `xhigh` para modelos OpenAI que
oferecem suporte. Substitua um candidato específico inline com
`--model provider/model,thinking=<level>`. `--thinking <level>` ainda define um
fallback global, e o formato antigo `--model-thinking <provider/model=level>` é
mantido por compatibilidade.
As refs candidatas OpenAI usam o modo fast por padrão para que o processamento prioritário seja usado onde
o provedor oferecer suporte. Adicione `,fast`, `,no-fast` ou `,fast=false` inline quando um
candidato ou julgador específico precisar de uma substituição. Passe `--fast` apenas quando quiser
forçar o modo fast para todos os modelos candidatos. As durações de candidatos e julgadores são
registradas no relatório para análise de benchmark, mas os prompts dos julgadores dizem explicitamente
para não classificar pela velocidade.
As execuções dos modelos candidatos e julgadores usam concorrência 16 por padrão. Reduza
`--concurrency` ou `--judge-concurrency` quando limites do provedor ou pressão no Gateway local
tornarem uma execução barulhenta demais.
Quando nenhum candidato `--model` é passado, a avaliação de caráter usa por padrão
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando nenhum `--model` é passado.
Quando nenhum `--judge-model` é passado, os julgadores usam por padrão
`openai/gpt-5.4,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentação relacionada

- [Testing](/pt-BR/help/testing)
- [QA Channel](/pt-BR/channels/qa-channel)
- [Dashboard](/web/dashboard)
