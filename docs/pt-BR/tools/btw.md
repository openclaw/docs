---
read_when:
    - Você quer fazer uma pergunta rápida à parte sobre a sessão atual
    - Você está implementando ou depurando o comportamento de BTW entre clientes
summary: Perguntas paralelas efêmeras com /btw
title: A propósito, perguntas paralelas
x-i18n:
    generated_at: "2026-06-27T18:13:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf97c17fb02c2464b1d1b31cfec652d52c60be6ce0cad25eaf32a9c080843ef2
    source_path: tools/btw.md
    workflow: 16
---

`/btw` permite fazer uma pergunta lateral rápida sobre a **sessão atual** sem
transformar essa pergunta em histórico normal de conversa. `/side` é um alias.

Ele é modelado a partir do comportamento de `/btw` do Claude Code, mas adaptado à
arquitetura de Gateway e multicanal do OpenClaw.

## O que ele faz

Quando você envia:

```text
/btw what changed?
```

O OpenClaw:

1. captura um instantâneo do contexto da sessão atual,
2. executa uma consulta lateral efêmera separada,
3. responde apenas à pergunta lateral,
4. deixa a execução principal intacta,
5. **não** grava a pergunta nem a resposta do BTW no histórico da sessão,
6. emite a resposta como um **resultado lateral ao vivo**, em vez de uma mensagem normal do assistente.

O modelo mental importante é:

- mesmo contexto de sessão
- consulta lateral separada e única
- mesmo transporte de harness nativo quando a sessão usa um harness nativo
- sem poluição de contexto futuro
- sem persistência de transcrição

Para sessões de harness do Codex, o BTW permanece dentro do Codex ao bifurcar a thread
ativa do app-server como uma thread lateral efêmera. Isso mantém o OAuth do Codex e o comportamento
de thread nativa intactos, ao mesmo tempo em que isola a resposta lateral da transcrição
pai. Assim como o `/side` do Codex, a thread lateral mantém as permissões atuais do Codex
e a superfície de ferramentas nativas, com proteções que instruem o modelo a não
tratar o trabalho herdado da thread pai como instruções ativas.

Para aliases de runtime da CLI, o BTW usa o backend da CLI proprietário no modo de pergunta lateral
em vez de recorrer a uma chamada direta ao provedor. O OpenClaw semeia contexto de
conversa sanitizado em uma nova invocação única da CLI, desabilita o agrupamento de ferramentas
MCP do OpenClaw e o estado reutilizável de sessão da CLI para essa invocação, e permite que o
backend adicione quaisquer flags nativas da CLI de não retomar ou sem ferramentas que ele suporte. Runtimes diretos
não CLI mantêm o caminho direto de execução única.

## O que ele não faz

`/btw` **não**:

- cria uma nova sessão durável,
- continua a tarefa principal inacabada,
- grava dados de pergunta/resposta do BTW no histórico da transcrição,
- aparece em `chat.history`,
- sobrevive a um recarregamento.

Ele é intencionalmente **efêmero**.

## Como o contexto funciona

O BTW usa a sessão atual apenas como **contexto de fundo**.

Se a execução principal estiver ativa no momento, o OpenClaw captura um instantâneo do estado atual das mensagens
e inclui o prompt principal em andamento como contexto de fundo, enquanto
instrui explicitamente o modelo a:

- responder apenas à pergunta lateral,
- não retomar nem concluir a tarefa principal inacabada,
- não direcionar a conversa pai.

Isso mantém o BTW isolado da execução principal, ao mesmo tempo em que o deixa ciente do assunto
da sessão.

## Modelo de entrega

O BTW **não** é entregue como uma mensagem normal de transcrição do assistente.

No nível do protocolo do Gateway:

- o chat normal do assistente usa o evento `chat`
- o BTW usa o evento `chat.side_result`

Essa separação é intencional. Se o BTW reutilizasse o caminho normal do evento `chat`,
os clientes o tratariam como histórico regular de conversa.

Como o BTW usa um evento ao vivo separado e não é reproduzido a partir de
`chat.history`, ele desaparece após recarregar.

## Comportamento nas superfícies

### TUI

Na TUI, o BTW é renderizado inline na visualização da sessão atual, mas permanece
efêmero:

- visualmente distinto de uma resposta normal do assistente
- dispensável com `Enter` ou `Esc`
- não reproduzido ao recarregar

### Canais externos

Em canais como Telegram, WhatsApp e Discord, o BTW é entregue como uma
resposta avulsa claramente rotulada, porque essas superfícies não têm um conceito local
de sobreposição efêmera.

A resposta ainda é tratada como um resultado lateral, não como histórico normal da sessão.

### Control UI / web

O Gateway emite o BTW corretamente como `chat.side_result`, e o BTW não é incluído
em `chat.history`, portanto o contrato de persistência já está correto para a web.

A Control UI atual ainda precisa de um consumidor dedicado de `chat.side_result` para
renderizar o BTW ao vivo no navegador. Até que esse suporte do lado do cliente seja entregue, o BTW é um
recurso no nível do Gateway com comportamento completo na TUI e em canais externos, mas ainda não
uma UX completa no navegador.

## Quando usar o BTW

Use `/btw` quando você quiser:

- uma explicação rápida sobre o trabalho atual,
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

## Quando não usar o BTW

Não use `/btw` quando quiser que a resposta se torne parte do contexto de trabalho
futuro da sessão.

Nesse caso, pergunte normalmente na sessão principal em vez de usar BTW.

## Relacionados

<CardGroup cols={2}>
  <Card title="Slash commands" href="/pt-BR/tools/slash-commands" icon="terminal">
    Catálogo de comandos nativos e diretivas de chat.
  </Card>
  <Card title="Thinking levels" href="/pt-BR/tools/thinking" icon="brain">
    Níveis de esforço de raciocínio para a chamada do modelo de pergunta lateral.
  </Card>
  <Card title="Session" href="/pt-BR/concepts/session" icon="comments">
    Chaves de sessão, histórico e semântica de persistência.
  </Card>
  <Card title="Steer command" href="/pt-BR/tools/steer" icon="arrow-right">
    Injete uma mensagem de direcionamento na execução ativa sem encerrá-la.
  </Card>
</CardGroup>
