---
read_when:
    - Trabalhando com reações em qualquer canal
    - Entendendo como as reações com emojis variam entre plataformas
summary: Semântica da ferramenta de reação em todos os canais compatíveis
title: Reações
x-i18n:
    generated_at: "2026-05-03T21:39:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99008cdaf1fa7462bbe72066be7c404880df237a79d3deba01bffe00083c1e34
    source_path: tools/reactions.md
    workflow: 16
---

O agente pode adicionar e remover reações com emoji em mensagens usando a ferramenta `message`
com a ação `react`. O comportamento das reações varia por canal e transporte.

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
- Em canais compatíveis com reações de status, `trackToolCalls: true` em uma
  reação permite que o runtime use essa mensagem reagida para reações subsequentes de
  progresso de ferramentas durante o mesmo turno.

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

  <Accordion title="Telegram">
    - `emoji` vazio remove as reações do bot.
    - `remove: true` também remove reações, mas ainda requer um `emoji` não vazio para validação da ferramenta.

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` vazio remove a reação do bot.
    - `remove: true` é mapeado internamente para emoji vazio (ainda requer `emoji` na chamada da ferramenta).

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
    - As notificações de reações recebidas são controladas por `channels.signal.reactionNotifications`: `"off"` as desativa, `"own"` (padrão) emite eventos quando usuários reagem a mensagens do bot, e `"all"` emite eventos para todas as reações.

  </Accordion>
</AccordionGroup>

## Nível de reação

A configuração `reactionLevel` por canal controla a amplitude com que o agente usa reações. Os valores normalmente são `off`, `ack`, `minimal` ou `extensive`.

- [reactionLevel do Telegram](/pt-BR/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [reactionLevel do WhatsApp](/pt-BR/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Defina `reactionLevel` em canais individuais para ajustar o quão ativamente o agente reage a mensagens em cada plataforma.

## Relacionado

- [Envio do agente](/pt-BR/tools/agent-send) — a ferramenta `message` que inclui `react`
- [Canais](/pt-BR/channels) — configuração específica de canal
