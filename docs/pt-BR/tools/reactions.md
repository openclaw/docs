---
read_when:
- Trabalhando com reações em qualquer canal
- Understanding how emoji reactions differ across platforms
summary: Semântica da tool de reação em todos os canais compatíveis
title: Reações
x-i18n:
  generated_at: '2026-04-24T06:18:10Z'
  refreshed_at: '2026-04-28T05:14:37Z'
  model: gpt-5.4
  provider: openai
  source_hash: 58d9a85114e715fd1813a4d662b02a6b8b9cad9a8eea9c63d024a933ba573a65
  source_path: tools/reactions.md
  workflow: 15
---

O agente pode adicionar e remover reações com emoji em mensagens usando a tool `message`
com a ação `react`. O comportamento das reações varia por canal.

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
    - `remove: true` também remove reações, mas ainda exige `emoji` não vazio para validação da tool.
  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` vazio remove a reação do bot.
    - `remove: true` é mapeado internamente para emoji vazio (ainda exige `emoji` na chamada da tool).
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Exige `emoji` não vazio.
    - `remove: true` remove a reação daquele emoji específico.
  </Accordion>

  <Accordion title="Feishu/Lark">
    - Use a tool `feishu_reaction` com as ações `add`, `remove` e `list`.
    - Adicionar/remover exige `emoji_type`; remover também exige `reaction_id`.
  </Accordion>

  <Accordion title="Signal">
    - Notificações de reação de entrada são controladas por `channels.signal.reactionNotifications`: `"off"` as desabilita, `"own"` (padrão) emite eventos quando usuários reagem a mensagens do bot, e `"all"` emite eventos para todas as reações.
  </Accordion>
</AccordionGroup>

## Nível de reação

A configuração `reactionLevel` por canal controla quão amplamente o agente usa reações. Os valores normalmente são `off`, `ack`, `minimal` ou `extensive`.

- [Telegram reactionLevel](/pt-BR/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/pt-BR/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Defina `reactionLevel` em canais individuais para ajustar o quão ativamente o agente reage a mensagens em cada plataforma.

## Relacionado

- [Agent Send](/pt-BR/tools/agent-send) — a tool `message` que inclui `react`
- [Canais](/pt-BR/channels) — configuração específica por canal
