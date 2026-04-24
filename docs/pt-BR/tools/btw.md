---
read_when:
    - Você quer fazer uma pergunta lateral rápida sobre a sessão atual
    - Você está implementando ou depurando o comportamento de BTW entre clientes
summary: Perguntas laterais efêmeras com /btw
title: Perguntas laterais BTW
x-i18n:
    generated_at: "2026-04-24T06:15:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e8b74f82356a1ecc38b2a2104b3c4616ef4530d2ce804910b24666c4932169e
    source_path: tools/btw.md
    workflow: 15
---

`/btw` permite fazer uma pergunta lateral rápida sobre a **sessão atual** sem
transformar essa pergunta em histórico normal da conversa.

Ele é modelado a partir do comportamento `/btw` do Claude Code, mas adaptado à arquitetura de Gateway e múltiplos canais do OpenClaw.

## O que ele faz

Quando você envia:

```text
/btw what changed?
```

O OpenClaw:

1. tira um snapshot do contexto da sessão atual,
2. executa uma chamada de modelo separada **sem ferramentas**,
3. responde apenas à pergunta lateral,
4. deixa a execução principal intacta,
5. **não** grava a pergunta ou resposta BTW no histórico da sessão,
6. emite a resposta como um **resultado lateral ao vivo**, em vez de uma mensagem normal do assistente.

O modelo mental importante é:

- mesmo contexto de sessão
- consulta lateral isolada de execução única
- sem chamadas de ferramenta
- sem poluição de contexto futuro
- sem persistência em transcrição

## O que ele não faz

`/btw` **não**:

- cria uma nova sessão durável,
- continua a tarefa principal inacabada,
- executa ferramentas ou loops de ferramentas do agente,
- grava dados de pergunta/resposta BTW no histórico da transcrição,
- aparece em `chat.history`,
- sobrevive a um reload.

Ele é intencionalmente **efêmero**.

## Como o contexto funciona

BTW usa a sessão atual apenas como **contexto de fundo**.

Se a execução principal estiver ativa no momento, o OpenClaw tira um snapshot do estado atual da mensagem
e inclui o prompt principal em andamento como contexto de fundo, enquanto
instrui explicitamente o modelo a:

- responder apenas à pergunta lateral,
- não retomar nem concluir a tarefa principal inacabada,
- não emitir chamadas de ferramenta nem pseudochamadas de ferramenta.

Isso mantém BTW isolado da execução principal, mas ainda o torna ciente do tema da sessão.

## Modelo de entrega

BTW **não** é entregue como uma mensagem normal do assistente na transcrição.

No nível do protocolo do Gateway:

- o chat normal do assistente usa o evento `chat`
- BTW usa o evento `chat.side_result`

Essa separação é intencional. Se BTW reutilizasse o caminho normal do evento `chat`,
os clientes o tratariam como histórico normal da conversa.

Como BTW usa um evento ao vivo separado e não é reproduzido a partir de
`chat.history`, ele desaparece após reload.

## Comportamento por superfície

### TUI

Na TUI, BTW é renderizado inline na visualização da sessão atual, mas continua
efêmero:

- visivelmente distinto de uma resposta normal do assistente
- pode ser dispensado com `Enter` ou `Esc`
- não é reproduzido em reload

### Canais externos

Em canais como Telegram, WhatsApp e Discord, BTW é entregue como uma
resposta isolada claramente rotulada, porque essas superfícies não têm um conceito local de overlay efêmero.

A resposta ainda é tratada como resultado lateral, não como histórico normal da sessão.

### UI de Controle / web

O Gateway emite BTW corretamente como `chat.side_result`, e BTW não é incluído
em `chat.history`, então o contrato de persistência já está correto para a web.

A UI de Controle atual ainda precisa de um consumidor dedicado de `chat.side_result` para
renderizar BTW ao vivo no navegador. Até que esse suporte do lado do cliente seja entregue, BTW é um recurso em nível de Gateway com comportamento completo em TUI e canais externos, mas ainda não uma UX completa no navegador.

## Quando usar BTW

Use `/btw` quando você quiser:

- um esclarecimento rápido sobre o trabalho atual,
- uma resposta factual lateral enquanto uma execução longa ainda está em andamento,
- uma resposta temporária que não deve passar a fazer parte do contexto futuro da sessão.

Exemplos:

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Quando não usar BTW

Não use `/btw` quando quiser que a resposta passe a fazer parte do
contexto futuro de trabalho da sessão.

Nesse caso, pergunte normalmente na sessão principal em vez de usar BTW.

## Relacionado

- [Comandos slash](/pt-BR/tools/slash-commands)
- [Níveis de Thinking](/pt-BR/tools/thinking)
- [Sessão](/pt-BR/concepts/session)
