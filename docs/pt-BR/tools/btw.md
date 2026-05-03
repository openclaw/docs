---
read_when:
    - Você quer fazer uma pergunta rápida à parte sobre a sessão atual
    - Você está implementando ou depurando o comportamento de BTW entre clientes
summary: Perguntas secundárias efêmeras com /btw
title: A propósito, perguntas secundárias
x-i18n:
    generated_at: "2026-05-03T21:38:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: f09ee066c02d31c9fbd66de1922f7a03fe2b48f1ba2c969c65551376e92c80d4
    source_path: tools/btw.md
    workflow: 16
---

`/btw` permite fazer uma pergunta lateral rápida sobre a **sessão atual** sem
transformar essa pergunta em histórico normal da conversa. `/side` é um alias.

Ele foi modelado a partir do comportamento de `/btw` do Claude Code, mas adaptado
ao Gateway e à arquitetura multicanal do OpenClaw.

## O que ele faz

Quando você envia:

```text
/btw what changed?
```

OpenClaw:

1. captura um instantâneo do contexto da sessão atual,
2. executa uma chamada separada ao modelo **sem ferramentas**,
3. responde apenas à pergunta lateral,
4. deixa a execução principal intacta,
5. **não** grava a pergunta ou a resposta BTW no histórico da sessão,
6. emite a resposta como um **resultado lateral ao vivo**, e não como uma mensagem normal do assistente.

O modelo mental importante é:

- mesmo contexto da sessão
- consulta lateral separada e única
- sem chamadas de ferramenta
- sem poluição de contexto futuro
- sem persistência no transcript

## O que ele não faz

`/btw` **não**:

- cria uma nova sessão durável,
- continua a tarefa principal inacabada,
- executa ferramentas ou loops de ferramentas de agente,
- grava dados de pergunta/resposta BTW no histórico do transcript,
- aparece em `chat.history`,
- sobrevive a um recarregamento.

Ele é intencionalmente **efêmero**.

## Como o contexto funciona

BTW usa a sessão atual apenas como **contexto de fundo**.

Se a execução principal estiver ativa, o OpenClaw captura um instantâneo do estado
atual das mensagens e inclui o prompt principal em andamento como contexto de
fundo, enquanto instrui explicitamente o modelo a:

- responder apenas à pergunta lateral,
- não retomar nem concluir a tarefa principal inacabada,
- não emitir chamadas de ferramenta nem pseudochamadas de ferramenta.

Isso mantém o BTW isolado da execução principal, ao mesmo tempo em que o torna
ciente do assunto da sessão.

## Modelo de entrega

BTW **não** é entregue como uma mensagem normal de transcript do assistente.

No nível do protocolo do Gateway:

- o chat normal do assistente usa o evento `chat`
- o BTW usa o evento `chat.side_result`

Essa separação é intencional. Se o BTW reutilizasse o caminho normal do evento
`chat`, os clientes o tratariam como histórico de conversa regular.

Como o BTW usa um evento ao vivo separado e não é reproduzido a partir de
`chat.history`, ele desaparece após o recarregamento.

## Comportamento nas superfícies

### TUI

Na TUI, o BTW é renderizado em linha na visualização da sessão atual, mas permanece
efêmero:

- visualmente distinto de uma resposta normal do assistente
- dispensável com `Enter` ou `Esc`
- não reproduzido no recarregamento

### Canais externos

Em canais como Telegram, WhatsApp e Discord, o BTW é entregue como uma resposta
única claramente rotulada, porque essas superfícies não têm um conceito local de
sobreposição efêmera.

A resposta ainda é tratada como resultado lateral, não como histórico normal da sessão.

### Interface de controle / web

O Gateway emite o BTW corretamente como `chat.side_result`, e o BTW não é incluído
em `chat.history`, portanto o contrato de persistência já está correto para web.

A interface de controle atual ainda precisa de um consumidor dedicado de
`chat.side_result` para renderizar o BTW ao vivo no navegador. Até que esse suporte
do lado do cliente seja implementado, o BTW é um recurso no nível do Gateway com
comportamento completo na TUI e em canais externos, mas ainda não é uma UX de
navegador completa.

## Quando usar BTW

Use `/btw` quando você quiser:

- um esclarecimento rápido sobre o trabalho atual,
- uma resposta factual lateral enquanto uma execução longa ainda está em andamento,
- uma resposta temporária que não deve se tornar parte do contexto futuro da sessão.

Exemplos:

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Quando não usar BTW

Não use `/btw` quando quiser que a resposta se torne parte do contexto de trabalho
futuro da sessão.

Nesse caso, pergunte normalmente na sessão principal em vez de usar BTW.

## Relacionado

- [Comandos de barra](/pt-BR/tools/slash-commands)
- [Níveis de pensamento](/pt-BR/tools/thinking)
- [Sessão](/pt-BR/concepts/session)
