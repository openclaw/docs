---
read_when:
    - Estendendo qa-lab ou qa-channel
    - Adicionando cenários de QA com suporte do repositório
    - Criando automação de QA de maior realismo em torno do painel do Gateway
summary: Estrutura privada de automação de QA para qa-lab, qa-channel, cenários com seed e relatórios de protocolo
title: Automação E2E de QA
x-i18n:
    generated_at: "2026-04-12T23:28:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9fe27dc049823d5e3eb7ae1eac6aad21ed9e917425611fb1dbcb28ab9210d5e
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automação E2E de QA

A stack privada de QA foi criada para exercitar o OpenClaw de uma forma mais realista,
com formato de canal, do que um único teste unitário consegue.

Peças atuais:

- `extensions/qa-channel`: canal de mensagens sintético com superfícies de DM, canal, thread,
  reação, edição e exclusão.
- `extensions/qa-lab`: interface de depuração e barramento de QA para observar a transcrição,
  injetar mensagens de entrada e exportar um relatório em Markdown.
- `qa/`: recursos seed com suporte do repositório para a tarefa inicial e cenários
  de QA de linha de base.

O fluxo atual do operador de QA é um site de QA com dois painéis:

- Esquerda: painel do Gateway (Control UI) com o agente.
- Direita: QA Lab, mostrando a transcrição em estilo Slack e o plano do cenário.

Execute com:

```bash
pnpm qa:lab:up
```

Isso compila o site de QA, inicia a lane do gateway com Docker e expõe a
página do QA Lab, onde um operador ou loop de automação pode dar ao agente uma
missão de QA, observar o comportamento real do canal e registrar o que funcionou, falhou
ou continuou bloqueado.

Para uma iteração mais rápida da interface do QA Lab sem recompilar a imagem Docker a cada vez,
inicie a stack com um bundle do QA Lab montado por bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantém os serviços Docker em uma imagem pré-compilada e faz bind mount de
`extensions/qa-lab/web/dist` no contêiner `qa-lab`. `qa:lab:watch`
recompila esse bundle quando há mudanças, e o navegador recarrega automaticamente quando o hash
do recurso do QA Lab muda.

Para uma lane de smoke de Matrix com transporte real, execute:

```bash
pnpm openclaw qa matrix
```

Essa lane provisiona um homeserver Tuwunel descartável no Docker, registra
usuários temporários de driver, SUT e observador, cria uma sala privada, e então executa
o Plugin real do Matrix dentro de um processo filho do gateway de QA. A lane de transporte ao vivo mantém
a configuração do processo filho limitada ao transporte em teste, de modo que o Matrix funcione sem
`qa-channel` na configuração do processo filho.

Para uma lane de smoke de Telegram com transporte real, execute:

```bash
pnpm openclaw qa telegram
```

Essa lane usa um grupo privado real do Telegram em vez de provisionar um
servidor descartável. Ela exige `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, além de dois bots distintos no mesmo
grupo privado. O bot SUT deve ter um nome de usuário no Telegram, e a observação
entre bots funciona melhor quando ambos os bots têm o modo de comunicação Bot-to-Bot
habilitado no `@BotFather`.

As lanes de transporte ao vivo agora compartilham um contrato menor em vez de cada uma
inventar seu próprio formato de lista de cenários:

`qa-channel` continua sendo a suíte ampla de comportamento sintético do produto e não faz parte
da matriz de cobertura de transporte ao vivo.

| Lane     | Canary | Bloqueio por menção | Bloqueio por allowlist | Resposta de nível superior | Retomada após reinício | Follow-up em thread | Isolamento de thread | Observação de reação | Comando de ajuda |
| -------- | ------ | ------------------- | ---------------------- | -------------------------- | ---------------------- | ------------------- | -------------------- | -------------------- | ---------------- |
| Matrix   | x      | x                   | x                      | x                          | x                      | x                   | x                    | x                    |                  |
| Telegram | x      |                     |                        |                            |                        |                     |                      |                      | x                |

Isso mantém `qa-channel` como a suíte ampla de comportamento do produto, enquanto Matrix,
Telegram e futuros transportes ao vivo compartilham uma checklist explícita de contrato
de transporte.

Para uma lane descartável de VM Linux sem trazer o Docker para o fluxo de QA, execute:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Isso inicializa um guest novo do Multipass, instala dependências, compila o OpenClaw
dentro do guest, executa `qa suite` e então copia o relatório e o resumo normais de QA
de volta para `.artifacts/qa-e2e/...` no host.
Ele reutiliza o mesmo comportamento de seleção de cenário que `qa suite` no host.
As execuções da suíte no host e no Multipass executam vários cenários selecionados em paralelo
com workers isolados de gateway por padrão, até 64 workers ou a contagem de cenários
selecionados. Use `--concurrency <count>` para ajustar a quantidade de workers, ou
`--concurrency 1` para execução serial.
Execuções ao vivo encaminham as entradas de autenticação de QA compatíveis que são práticas
para o guest: chaves de provedor via env, o caminho da configuração do provedor ao vivo de QA e
`CODEX_HOME` quando presente. Mantenha `--output-dir` sob a raiz do repositório para que o guest
possa gravar de volta por meio do workspace montado.

## Seeds com suporte do repositório

Os recursos seed ficam em `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Eles ficam intencionalmente no git para que o plano de QA seja visível tanto para humanos quanto para
o agente.

`qa-lab` deve continuar sendo um executor genérico de Markdown. Cada arquivo Markdown de cenário é
a fonte da verdade para uma execução de teste e deve definir:

- metadados do cenário
- referências de documentação e código
- requisitos opcionais de Plugin
- patch opcional de configuração do gateway
- o `qa-flow` executável

A lista de linha de base deve permanecer ampla o suficiente para cobrir:

- chat em DM e em canal
- comportamento de thread
- ciclo de vida de ações de mensagem
- callbacks de Cron
- recuperação de memória
- troca de modelo
- handoff para subagente
- leitura do repositório e da documentação
- uma pequena tarefa de build, como Lobster Invaders

## Adaptadores de transporte

`qa-lab` é responsável por uma interface genérica de transporte para cenários de QA em Markdown.
`qa-channel` é o primeiro adaptador nessa interface, mas o objetivo do design é mais amplo:
canais futuros, reais ou sintéticos, devem se conectar ao mesmo executor de suíte
em vez de adicionar um executor de QA específico para cada transporte.

No nível de arquitetura, a divisão é:

- `qa-lab` é responsável pela execução genérica de cenários, concorrência de workers, gravação de artefatos e relatórios.
- o adaptador de transporte é responsável pela configuração do gateway, prontidão, observação de entrada e saída, ações de transporte e estado de transporte normalizado.
- arquivos Markdown de cenário em `qa/scenarios/` definem a execução de teste; `qa-lab` fornece a superfície de runtime reutilizável que os executa.

A orientação de adoção voltada para maintainers para novos adaptadores de canal está em
[Testing](/pt-BR/help/testing#adding-a-channel-to-qa).

## Relatórios

`qa-lab` exporta um relatório de protocolo em Markdown a partir da linha do tempo observada no barramento.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que continuou bloqueado
- Quais cenários de follow-up valem a pena adicionar

Para verificações de caráter e estilo, execute o mesmo cenário em várias referências de modelo ao vivo
e gere um relatório em Markdown avaliado:

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

O comando executa processos filhos locais do gateway de QA, não Docker. Cenários de avaliação
de caráter devem definir a persona por meio de `SOUL.md` e então executar turnos comuns de usuário,
como chat, ajuda de workspace e pequenas tarefas com arquivos. O modelo candidato
não deve ser informado de que está sendo avaliado. O comando preserva cada transcrição
completa, registra estatísticas básicas da execução e então solicita aos modelos juízes em modo rápido com
raciocínio `xhigh` que classifiquem as execuções por naturalidade, vibe e humor.
Use `--blind-judge-models` ao comparar provedores: o prompt do juiz ainda recebe
cada transcrição e status da execução, mas as referências candidatas são substituídas por rótulos neutros
como `candidate-01`; o relatório mapeia as classificações de volta para as referências reais após
a análise.
As execuções de candidatos usam `high` thinking por padrão, com `xhigh` para modelos OpenAI que
o suportam. Substitua um candidato específico inline com
`--model provider/model,thinking=<level>`. `--thinking <level>` continua definindo um fallback
global, e o formato antigo `--model-thinking <provider/model=level>` é mantido por
compatibilidade.
As referências candidatas da OpenAI usam modo rápido por padrão para que o processamento prioritário
seja usado quando o provedor oferecer suporte. Adicione `,fast`, `,no-fast` ou `,fast=false` inline quando
um único candidato ou juiz precisar de uma substituição. Passe `--fast` somente quando quiser
forçar o modo rápido para todos os modelos candidatos. As durações de candidatos e juízes são
registradas no relatório para análise de benchmark, mas os prompts dos juízes dizem explicitamente
para não classificar por velocidade.
As execuções de modelos candidatos e juízes usam concorrência 16 por padrão. Reduza
`--concurrency` ou `--judge-concurrency` quando limites do provedor ou pressão no gateway local
tornarem a execução muito ruidosa.
Quando nenhum `--model` candidato é informado, a avaliação de caráter usa por padrão
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando nenhum `--model` é informado.
Quando nenhum `--judge-model` é informado, os juízes usam por padrão
`openai/gpt-5.4,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentação relacionada

- [Testing](/pt-BR/help/testing)
- [QA Channel](/pt-BR/channels/qa-channel)
- [Dashboard](/web/dashboard)
