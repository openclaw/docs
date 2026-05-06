---
read_when:
    - Você quer fazer uma pergunta rápida à parte sobre a sessão atual
    - Você está implementando ou depurando o comportamento BTW entre clientes
summary: Perguntas paralelas efêmeras com /btw
title: A propósito, perguntas secundárias
x-i18n:
    generated_at: "2026-05-06T09:15:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 356c9817001ba77271c671d20b45640f9d8178ced178aa5390375a79fc97eb6d
    source_path: tools/btw.md
    workflow: 16
---

`/btw` permite fazer uma pergunta lateral rápida sobre a **sessão atual** sem
transformar essa pergunta em histórico normal de conversa. `/side` é um alias.

Ele é modelado com base no comportamento de `/btw` do Claude Code, mas adaptado
ao Gateway e à arquitetura multicanal do OpenClaw.

## O que ele faz

Quando você envia:

```text
/btw what changed?
```

O OpenClaw:

1. captura um snapshot do contexto da sessão atual,
2. executa uma chamada separada ao modelo **sem ferramentas**,
3. responde apenas à pergunta lateral,
4. deixa a execução principal intacta,
5. **não** grava a pergunta ou resposta BTW no histórico da sessão,
6. emite a resposta como um **resultado lateral ao vivo**, em vez de uma mensagem normal do assistente.

O modelo mental importante é:

- mesmo contexto de sessão
- consulta lateral separada de uma única vez
- sem chamadas de ferramentas
- sem poluição do contexto futuro
- sem persistência de transcrição

## O que ele não faz

`/btw` **não**:

- cria uma nova sessão durável,
- continua a tarefa principal inacabada,
- executa ferramentas ou loops de ferramentas de agente,
- grava dados da pergunta/resposta BTW no histórico de transcrição,
- aparece em `chat.history`,
- sobrevive a um recarregamento.

Ele é intencionalmente **efêmero**.

## Como o contexto funciona

BTW usa a sessão atual apenas como **contexto de fundo**.

Se a execução principal estiver ativa no momento, o OpenClaw captura um snapshot
do estado atual das mensagens e inclui o prompt principal em andamento como
contexto de fundo, enquanto instrui explicitamente o modelo a:

- responder apenas à pergunta lateral,
- não retomar nem concluir a tarefa principal inacabada,
- não emitir chamadas de ferramentas nem pseudochamadas de ferramentas.

Isso mantém o BTW isolado da execução principal, mas ainda ciente do assunto da
sessão.

## Modelo de entrega

BTW **não** é entregue como uma mensagem normal de transcrição do assistente.

No nível do protocolo do Gateway:

- o chat normal do assistente usa o evento `chat`
- BTW usa o evento `chat.side_result`

Essa separação é intencional. Se BTW reutilizasse o caminho normal do evento
`chat`, os clientes o tratariam como histórico de conversa regular.

Como BTW usa um evento ao vivo separado e não é reproduzido a partir de
`chat.history`, ele desaparece após o recarregamento.

## Comportamento por superfície

### TUI

Na TUI, BTW é renderizado inline na visualização da sessão atual, mas permanece
efêmero:

- visualmente distinto de uma resposta normal do assistente
- dispensável com `Enter` ou `Esc`
- não reproduzido no recarregamento

### Canais externos

Em canais como Telegram, WhatsApp e Discord, BTW é entregue como uma resposta
única claramente identificada, porque essas superfícies não têm um conceito de
sobreposição efêmera local.

A resposta ainda é tratada como um resultado lateral, não como histórico normal
da sessão.

### UI de controle / web

O Gateway emite BTW corretamente como `chat.side_result`, e BTW não é incluído
em `chat.history`, portanto o contrato de persistência já está correto para a web.

A UI de controle atual ainda precisa de um consumidor dedicado de
`chat.side_result` para renderizar BTW ao vivo no navegador. Até que esse
suporte do lado do cliente seja implementado, BTW é um recurso no nível do
Gateway com comportamento completo na TUI e em canais externos, mas ainda não é
uma UX completa no navegador.

## Quando usar BTW

Use `/btw` quando quiser:

- um esclarecimento rápido sobre o trabalho atual,
- uma resposta lateral factual enquanto uma execução longa ainda está em andamento,
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

Não use `/btw` quando quiser que a resposta se torne parte do contexto de
trabalho futuro da sessão.

Nesse caso, pergunte normalmente na sessão principal em vez de usar BTW.

## Relacionado

<CardGroup cols={2}>
  <Card title="Comandos de barra" href="/pt-BR/tools/slash-commands" icon="terminal">
    Catálogo de comandos nativos e diretivas de chat.
  </Card>
  <Card title="Níveis de raciocínio" href="/pt-BR/tools/thinking" icon="brain">
    Níveis de esforço de raciocínio para a chamada ao modelo da pergunta lateral.
  </Card>
  <Card title="Sessão" href="/pt-BR/concepts/session" icon="comments">
    Chaves de sessão, histórico e semântica de persistência.
  </Card>
  <Card title="Comando steer" href="/pt-BR/tools/steer" icon="arrow-right">
    Injete uma mensagem de direcionamento na execução ativa sem encerrá-la.
  </Card>
</CardGroup>
