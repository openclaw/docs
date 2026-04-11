---
read_when:
    - Estendendo qa-lab ou qa-channel
    - Adicionando cenários de QA com suporte do repositório
    - Criando automação de QA de maior realismo em torno do painel do Gateway
summary: Formato da automação privada de QA para qa-lab, qa-channel, cenários com seed e relatórios de protocolo
title: Automação E2E de QA
x-i18n:
    generated_at: "2026-04-11T02:44:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5427b505e26bfd542e984e3920c3f7cb825473959195ba9737eff5da944c60d0
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automação E2E de QA

A pilha privada de QA foi feita para exercitar o OpenClaw de uma forma mais realista,
com formato de canal, do que um único teste unitário consegue.

Peças atuais:

- `extensions/qa-channel`: canal de mensagens sintético com superfícies de DM, canal, thread,
  reação, edição e exclusão.
- `extensions/qa-lab`: UI de depuração e barramento de QA para observar a transcrição,
  injetar mensagens de entrada e exportar um relatório em Markdown.
- `qa/`: recursos com seed no repositório para a tarefa inicial e cenários básicos
  de QA.

O fluxo atual do operador de QA é um site de QA com dois painéis:

- Esquerda: painel do Gateway (Control UI) com o agente.
- Direita: QA Lab, mostrando a transcrição em estilo Slack e o plano do cenário.

Execute com:

```bash
pnpm qa:lab:up
```

Isso compila o site de QA, inicia a faixa do gateway com Docker e expõe a
página do QA Lab, onde um operador ou loop de automação pode dar ao agente uma
missão de QA, observar o comportamento real do canal e registrar o que funcionou,
falhou ou permaneceu bloqueado.

Para uma iteração mais rápida da UI do QA Lab sem recompilar a imagem Docker a cada vez,
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
dos recursos do QA Lab muda.

Para uma faixa smoke do Matrix com transporte real, execute:

```bash
pnpm openclaw qa matrix
```

Essa faixa provisiona um homeserver Tuwunel descartável no Docker, registra
usuários temporários de driver, SUT e observador, cria uma sala privada e depois executa
o plugin real do Matrix dentro de um processo filho de QA do gateway. A faixa de transporte ativo mantém
a configuração do processo filho restrita ao transporte em teste, então o Matrix é executado sem
`qa-channel` na configuração do processo filho.

Para uma faixa smoke do Telegram com transporte real, execute:

```bash
pnpm openclaw qa telegram
```

Essa faixa usa um grupo privado real do Telegram em vez de provisionar um
servidor descartável. Ela exige `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, além de dois bots distintos no mesmo
grupo privado. O bot SUT precisa ter um nome de usuário no Telegram, e a
observação entre bots funciona melhor quando ambos os bots têm o modo Bot-to-Bot Communication Mode
ativado no `@BotFather`.

As faixas de transporte ativo agora compartilham um contrato menor em vez de cada uma inventar
seu próprio formato de lista de cenários:

`qa-channel` continua sendo a suíte ampla de comportamento sintético do produto e não faz parte
da matriz de cobertura de transporte ativo.

| Faixa    | Canary | Controle por menção | Bloqueio por allowlist | Resposta de nível superior | Retomada após reinício | Acompanhamento em thread | Isolamento de thread | Observação de reação | Comando help |
| -------- | ------ | ------------------- | ---------------------- | -------------------------- | ---------------------- | ------------------------ | ------------------- | -------------------- | ------------ |
| Matrix   | x      | x                   | x                      | x                          | x                      | x                        | x                   | x                    |              |
| Telegram | x      |                     |                        |                            |                        |                          |                     |                      | x            |

Isso mantém `qa-channel` como a suíte ampla de comportamento do produto, enquanto Matrix,
Telegram e futuros transportes ativos compartilham uma checklist explícita de contrato de transporte.

Para uma faixa em VM Linux descartável sem colocar o Docker no caminho de QA, execute:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Isso inicializa um guest novo do Multipass, instala dependências, compila o OpenClaw
dentro do guest, executa `qa suite` e depois copia o relatório e o
resumo normais de QA de volta para `.artifacts/qa-e2e/...` no host.
Ele reutiliza o mesmo comportamento de seleção de cenários que `qa suite` no host.
Execuções da suíte no host e no Multipass executam vários cenários selecionados em paralelo
com workers isolados do gateway por padrão, até 64 workers ou a quantidade de cenários
selecionados. Use `--concurrency <count>` para ajustar a quantidade de workers, ou
`--concurrency 1` para execução serial.
Execuções ativas encaminham as entradas de autenticação de QA compatíveis que são práticas para o
guest: chaves de provedor baseadas em variáveis de ambiente, o caminho da configuração do provedor ativo de QA e
`CODEX_HOME` quando presente. Mantenha `--output-dir` sob a raiz do repositório para que o guest
possa gravar de volta pelo workspace montado.

## Seeds com suporte do repositório

Os recursos com seed ficam em `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Eles ficam intencionalmente no git para que o plano de QA seja visível tanto para humanos quanto para o
agente. A lista básica deve continuar ampla o suficiente para cobrir:

- chat em DM e em canal
- comportamento de thread
- ciclo de vida de ações de mensagem
- callbacks de cron
- recuperação de memória
- troca de modelo
- handoff de subagente
- leitura do repositório e da documentação
- uma pequena tarefa de build, como Lobster Invaders

## Relatórios

`qa-lab` exporta um relatório de protocolo em Markdown a partir da linha do tempo observada no barramento.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que permaneceu bloqueado
- Quais cenários de acompanhamento valem a pena adicionar

Para verificações de caráter e estilo, execute o mesmo cenário em vários refs de modelos ativos
e escreva um relatório em Markdown avaliado:

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

O comando executa processos filhos locais do gateway de QA, não Docker. Os cenários de avaliação de caráter
devem definir a persona por meio de `SOUL.md` e depois executar turnos normais do usuário,
como chat, ajuda no workspace e pequenas tarefas de arquivo. O modelo candidato
não deve ser informado de que está sendo avaliado. O comando preserva cada transcrição completa,
registra estatísticas básicas da execução e depois pede aos modelos juízes em modo fast com
raciocínio `xhigh` para classificar as execuções por naturalidade, vibe e humor.
Use `--blind-judge-models` ao comparar provedores: o prompt do juiz ainda recebe
cada transcrição e status de execução, mas os refs candidatos são substituídos por rótulos neutros
como `candidate-01`; o relatório mapeia as classificações de volta para os refs reais após a
análise.
As execuções dos candidatos usam por padrão thinking `high`, com `xhigh` para modelos OpenAI que
oferecem suporte. Substitua um candidato específico inline com
`--model provider/model,thinking=<level>`. `--thinking <level>` ainda define um
fallback global, e o formato antigo `--model-thinking <provider/model=level>` é
mantido por compatibilidade.
Os refs de candidatos da OpenAI usam por padrão o modo fast para que o processamento prioritário seja usado
quando o provedor oferecer suporte. Adicione `,fast`, `,no-fast` ou `,fast=false` inline quando
um único candidato ou juiz precisar de uma substituição. Passe `--fast` somente quando quiser
forçar o modo fast para todos os modelos candidatos. As durações de candidatos e juízes são
registradas no relatório para análise de benchmark, mas os prompts dos juízes dizem explicitamente
para não classificar por velocidade.
As execuções de modelos candidatos e juízes usam por padrão concorrência 16. Reduza
`--concurrency` ou `--judge-concurrency` quando os limites do provedor ou a pressão no gateway local
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
