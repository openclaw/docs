---
read_when:
    - Você quer fazer uma pergunta rápida à parte sobre a sessão atual
    - Você está implementando ou depurando o comportamento BTW entre clientes
summary: Perguntas secundárias efêmeras com /btw
title: A propósito, perguntas secundárias
x-i18n:
    generated_at: "2026-05-11T20:36:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: fba82915b0a8f59d20073dac5c159c4aff4e81ccb1be5979be521212e22c493a
    source_path: tools/btw.md
    workflow: 16
---

`/btw` permite fazer uma pergunta lateral rápida sobre a **sessão atual** sem
transformar essa pergunta em histórico de conversa normal. `/side` é um alias.

Ele é inspirado no comportamento de `/btw` do Claude Code, mas adaptado ao
Gateway e à arquitetura multicanal do OpenClaw.

## O que ele faz

Quando você envia:

```text
/btw what changed?
```

O OpenClaw:

1. captura um instantâneo do contexto da sessão atual,
2. executa uma consulta lateral efêmera separada,
3. responde somente à pergunta lateral,
4. deixa a execução principal intacta,
5. **não** grava a pergunta ou a resposta BTW no histórico da sessão,
6. emite a resposta como um **resultado lateral ao vivo** em vez de uma mensagem normal do assistente.

O modelo mental importante é:

- mesmo contexto da sessão
- consulta lateral separada de uma única execução
- mesmo transporte nativo do harness quando a sessão usa um harness nativo
- nenhuma poluição de contexto futuro
- nenhuma persistência de transcrição

Para sessões com harness do Codex, o BTW permanece dentro do Codex ao bifurcar a thread ativa do
app-server como uma thread lateral efêmera. Isso mantém intactos o OAuth do Codex e o comportamento de
thread nativa, enquanto ainda isola a resposta lateral da transcrição pai.
Assim como o `/side` do Codex, a thread lateral mantém as permissões atuais do Codex
e a superfície de ferramentas nativa, com salvaguardas que orientam o modelo a não
tratar o trabalho herdado da thread pai como instruções ativas. Runtimes que não são Codex
mantêm o caminho direto mais antigo de uma única execução.

## O que ele não faz

`/btw` **não**:

- cria uma nova sessão durável,
- continua a tarefa principal inacabada,
- grava dados de pergunta/resposta BTW no histórico da transcrição,
- aparece em `chat.history`,
- sobrevive a um recarregamento.

Ele é intencionalmente **efêmero**.

## Como o contexto funciona

O BTW usa a sessão atual apenas como **contexto de fundo**.

Se a execução principal estiver ativa no momento, o OpenClaw captura um instantâneo do estado atual das mensagens
e inclui o prompt principal em andamento como contexto de fundo, enquanto
diz explicitamente ao modelo:

- responda somente à pergunta lateral,
- não retome nem conclua a tarefa principal inacabada,
- não direcione a conversa pai.

Isso mantém o BTW isolado da execução principal, ao mesmo tempo em que o deixa ciente do assunto
da sessão.

## Modelo de entrega

O BTW **não** é entregue como uma mensagem normal de transcrição do assistente.

No nível do protocolo do Gateway:

- o chat normal do assistente usa o evento `chat`
- o BTW usa o evento `chat.side_result`

Essa separação é intencional. Se o BTW reutilizasse o caminho normal do evento `chat`,
os clientes o tratariam como histórico de conversa regular.

Como o BTW usa um evento ao vivo separado e não é reproduzido a partir de
`chat.history`, ele desaparece após o recarregamento.

## Comportamento de superfície

### TUI

Na TUI, o BTW é renderizado em linha na visualização da sessão atual, mas permanece
efêmero:

- visualmente distinto de uma resposta normal do assistente
- dispensável com `Enter` ou `Esc`
- não reproduzido ao recarregar

### Canais externos

Em canais como Telegram, WhatsApp e Discord, o BTW é entregue como uma
resposta avulsa claramente rotulada, porque essas superfícies não têm um conceito local
de sobreposição efêmera.

A resposta ainda é tratada como um resultado lateral, não como histórico normal da sessão.

### UI de controle / web

O Gateway emite o BTW corretamente como `chat.side_result`, e o BTW não é incluído
em `chat.history`, portanto o contrato de persistência já está correto para a web.

A UI de controle atual ainda precisa de um consumidor dedicado de `chat.side_result` para
renderizar o BTW ao vivo no navegador. Até que esse suporte do lado do cliente seja lançado, o BTW é um
recurso no nível do Gateway com comportamento completo na TUI e em canais externos, mas ainda não
uma UX completa no navegador.

## Quando usar BTW

Use `/btw` quando você quiser:

- uma clarificação rápida sobre o trabalho atual,
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

Não use `/btw` quando quiser que a resposta se torne parte do
contexto de trabalho futuro da sessão.

Nesse caso, pergunte normalmente na sessão principal em vez de usar BTW.

## Relacionado

<CardGroup cols={2}>
  <Card title="Comandos de barra" href="/pt-BR/tools/slash-commands" icon="terminal">
    Catálogo de comandos nativos e diretivas de chat.
  </Card>
  <Card title="Níveis de pensamento" href="/pt-BR/tools/thinking" icon="brain">
    Níveis de esforço de raciocínio para a chamada do modelo da pergunta lateral.
  </Card>
  <Card title="Sessão" href="/pt-BR/concepts/session" icon="comments">
    Chaves de sessão, histórico e semântica de persistência.
  </Card>
  <Card title="Comando de direcionamento" href="/pt-BR/tools/steer" icon="arrow-right">
    Injeta uma mensagem de direcionamento na execução ativa sem encerrá-la.
  </Card>
</CardGroup>
