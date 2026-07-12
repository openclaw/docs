---
read_when:
    - Você quer fazer uma pergunta rápida à parte sobre a sessão atual
    - Você está implementando ou depurando o comportamento do BTW em diferentes clientes
summary: Perguntas paralelas efêmeras com /btw
title: A propósito, perguntas paralelas
x-i18n:
    generated_at: "2026-07-12T15:41:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 338a54d0e15ec90aebaeeaee551559a26f1437f7b6dcdde4a4b1e63347ad0759
    source_path: tools/btw.md
    workflow: 16
---

`/btw` (alias `/side`) faz uma pergunta paralela rápida sobre a **sessão
atual** sem adicioná-la ao histórico da conversa. Ele é baseado no `/btw` do
Claude Code, adaptado ao Gateway e à arquitetura multicanal do OpenClaw.

```text
/btw o que mudou?
/side o que significa este erro?
```

## O que ele faz

1. Captura um snapshot da sessão atual como contexto em segundo plano (incluindo
   qualquer prompt da execução principal em andamento).
2. Executa uma consulta paralela separada e única, instruindo o modelo a responder apenas à
   pergunta paralela e a não retomar nem direcionar a tarefa principal.
3. Entrega a resposta como um resultado paralelo em tempo real, não como uma mensagem normal do assistente.
4. Nunca grava a pergunta nem a resposta no histórico da sessão ou em `chat.history`.

A execução principal, se houver uma ativa, permanece inalterada.

Para sessões do harness Codex, o BTW cria uma ramificação da thread ativa do app-server
Codex em uma thread filha efêmera, em vez de executar uma chamada separada ao provedor. Isso
mantém intactos o OAuth do Codex e o comportamento nativo de ferramentas/threads, e a thread
ramificada mantém a política de aprovação, o sandbox e a superfície nativa de ferramentas
atuais da thread pai. A thread ramificada recebe um prompt de limite informando ao modelo que
tudo o que vem antes é contexto de referência herdado, não instruções ativas,
e que somente as mensagens após o limite estão ativas. `/btw` exige uma
thread Codex existente; envie primeiro uma mensagem normal.

Para aliases de runtime da CLI, o BTW invoca o backend da CLI responsável no modo de pergunta
paralela única: ele fornece o contexto sanitizado da conversa a uma nova invocação da CLI
com o agrupamento de ferramentas e o estado reutilizável da sessão desativados e adiciona
quaisquer flags para não retomar/não usar ferramentas compatíveis com o backend. Runtimes diretos
(que não sejam da CLI) usam uma chamada direta e única ao provedor.

## O que ele não faz

`/btw` não cria uma sessão durável, não continua a tarefa principal inacabada,
não persiste dados da pergunta/resposta no histórico da transcrição e não sobrevive a um recarregamento.

## Modelo de entrega

O chat normal do assistente usa o evento `chat` do Gateway. O BTW usa um evento
`chat.side_result` separado para que os clientes não o confundam com o
histórico normal da conversa. Como ele não é reproduzido a partir de `chat.history`,
desaparece após o recarregamento.

## Comportamento nas interfaces

| Interface         | Comportamento                                                                                                                                                                                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TUI               | Renderizado em linha no registro do chat, visivelmente distinto de uma resposta normal, podendo ser dispensado com `Enter` ou `Esc`.                                                                                                                                                                           |
| Canais externos   | Entregue como uma resposta única claramente identificada (Telegram, WhatsApp e Discord não têm uma sobreposição efêmera local).                                                                                                                                                                         |
| Interface de controle / web | Renderizado como um painel flutuante "Chat paralelo" fixado à thread. As respostas se acumulam como turnos, e um campo "Acompanhamento" faz a próxima pergunta paralela. Fechar (`Esc` ou o X) mantém a conversa e a reabre na próxima resposta; o botão da lixeira a descarta e interrompe uma execução pendente. |

## Popup de seleção (Interface de controle)

Destacar texto dentro de uma mensagem de chat na Interface de controle abre um pequeno
popup de seleção com duas ações:

- **Mais detalhes** envia imediatamente uma pergunta `/btw` implícita, solicitando que o
  modelo explique o texto destacado no contexto da sessão
  atual. A resposta chega ao painel flutuante de chat paralelo.
- **Perguntar no chat paralelo** preenche previamente o campo de composição com um rascunho `/btw` que cita o
  texto destacado para que você possa digitar sua própria pergunta sobre ele.

Ambas as ações seguem a semântica normal de `/btw`: a pergunta e a resposta ficam fora
do histórico da sessão, e a execução principal permanece inalterada.

## Quando usá-lo

Use `/btw` para obter um esclarecimento rápido, uma resposta factual paralela enquanto uma execução longa
ainda está em andamento ou uma resposta temporária que não deve entrar no contexto futuro
da sessão.

```text
/btw qual arquivo estamos editando?
/btw resuma a tarefa atual em uma frase
/btw quanto é 17 * 19?
```

Para qualquer informação que você queira que faça parte do futuro contexto de trabalho
da sessão, faça a pergunta normalmente na sessão principal.

## Relacionados

<CardGroup cols={2}>
  <Card title="Comandos de barra" href="/pt-BR/tools/slash-commands" icon="terminal">
    Catálogo de comandos nativos e diretivas de chat.
  </Card>
  <Card title="Níveis de raciocínio" href="/pt-BR/tools/thinking" icon="brain">
    Níveis de esforço de raciocínio para a chamada ao modelo da pergunta paralela.
  </Card>
  <Card title="Sessão" href="/pt-BR/concepts/session" icon="comments">
    Chaves de sessão, histórico e semântica de persistência.
  </Card>
  <Card title="Comando de direcionamento" href="/pt-BR/tools/steer" icon="arrow-right">
    Injeta uma mensagem de direcionamento na execução ativa sem encerrá-la.
  </Card>
</CardGroup>
