---
read_when:
    - Trabalhando com reações em qualquer canal
    - Entendendo como as reações com emoji diferem entre plataformas
summary: Semântica da ferramenta de reação em todos os canais compatíveis
title: Reações
x-i18n:
    generated_at: "2026-06-27T18:18:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2dc9575eaeb79a56ca82ee491c2974e9984b1a12999762b1532ca9affdbbd72f
    source_path: tools/reactions.md
    workflow: 16
---

O agente pode adicionar e remover reações de emoji em mensagens usando a ferramenta `message`
com a ação `react`. O comportamento das reações varia conforme o canal e o transporte.

## Como funciona

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` é obrigatório ao adicionar uma reação.
- Defina `emoji` como uma string vazia (`""`) para remover a(s) reação(ões) do bot.
- Defina `remove: true` para remover um emoji específico (requer `emoji` não vazio).
- Em canais que oferecem suporte a reações de status, `trackToolCalls: true` em uma
  reação permite que o runtime use essa mensagem reagida para reações de progresso
  de ferramentas subsequentes durante o mesmo turno.

## Comportamento por canal

<AccordionGroup>
  <Accordion title="Discord e Slack">
    - `emoji` vazio remove todas as reações do bot na mensagem.
    - `remove: true` remove apenas o emoji especificado.

  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` vazio remove as reações do app na mensagem.
    - `remove: true` remove apenas o emoji especificado.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - Apenas adição de reações: `emoji` é obrigatório e deve ser não vazio.
    - A remoção de reações ainda não é compatível; chamadas com `remove: true` (ou `emoji` vazio) são rejeitadas com um erro claro, em vez de não fazerem nada silenciosamente.
    - Requer que o bot do Talk esteja registrado com o recurso `reaction` (consulte a [documentação do canal Nextcloud Talk](/pt-BR/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - `emoji` vazio remove as reações do bot.
    - `remove: true` também remove reações, mas ainda requer um `emoji` não vazio para validação da ferramenta.

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` vazio remove a reação do bot.
    - `remove: true` é mapeado internamente para emoji vazio (ainda requer `emoji` na chamada da ferramenta).
    - O WhatsApp tem um slot de reação do bot por mensagem; atualizações de reação de status substituem esse slot em vez de empilhar vários emoji.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Requer `emoji` não vazio.
    - `remove: true` remove essa reação de emoji específica.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Use a ferramenta `feishu_reaction` com as ações `add`, `remove` e `list`.
    - Adicionar/remover requer `emoji_type`; remover também requer `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - As notificações de reação recebidas são controladas por `channels.signal.reactionNotifications`: `"off"` as desativa, `"own"` (padrão) emite eventos quando usuários reagem a mensagens do bot, e `"all"` emite eventos para todas as reações.

  </Accordion>

  <Accordion title="iMessage">
    - Reações de saída são tapbacks do iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize` e `question`).
    - As notificações de tapback recebidas são controladas por `channels.imessage.reactionNotifications`: `"off"` as desativa, `"own"` (padrão) emite eventos quando usuários reagem a mensagens criadas pelo bot, e `"all"` emite eventos para todos os tapbacks de remetentes autorizados.

  </Accordion>
</AccordionGroup>

## Nível de reação

A configuração `reactionLevel` por canal controla a abrangência com que o agente usa reações. Os valores normalmente são `off`, `ack`, `minimal` ou `extensive`.

- [reactionLevel do Telegram](/pt-BR/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [reactionLevel do WhatsApp](/pt-BR/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Defina `reactionLevel` em canais individuais para ajustar o quanto o agente reage ativamente a mensagens em cada plataforma.

## Relacionado

- [Agent Send](/pt-BR/tools/agent-send) — a ferramenta `message` que inclui `react`
- [Canais](/pt-BR/channels) — configuração específica por canal
