---
read_when:
    - Praca z reakcjami w dowolnym kanale
    - Zrozumienie, jak reakcje emoji różnią się między platformami
summary: Semantyka narzędzia reakcji we wszystkich obsługiwanych kanałach
title: Reakcje
x-i18n:
    generated_at: "2026-04-24T09:37:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 58d9a85114e715fd1813a4d662b02a6b8b9cad9a8eea9c63d024a933ba573a65
    source_path: tools/reactions.md
    workflow: 15
---

Agent może dodawać i usuwać reakcje emoji do wiadomości za pomocą narzędzia `message`
z akcją `react`. Zachowanie reakcji różni się w zależności od kanału.

## Jak to działa

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` jest wymagane podczas dodawania reakcji.
- Ustaw `emoji` na pusty ciąg (`""`), aby usunąć reakcję/reakcje bota.
- Ustaw `remove: true`, aby usunąć określone emoji (wymaga niepustego `emoji`).

## Zachowanie kanałów

<AccordionGroup>
  <Accordion title="Discord i Slack">
    - Puste `emoji` usuwa wszystkie reakcje bota na wiadomości.
    - `remove: true` usuwa tylko wskazane emoji.

  </Accordion>

  <Accordion title="Google Chat">
    - Puste `emoji` usuwa reakcje aplikacji na wiadomości.
    - `remove: true` usuwa tylko wskazane emoji.

  </Accordion>

  <Accordion title="Telegram">
    - Puste `emoji` usuwa reakcje bota.
    - `remove: true` również usuwa reakcje, ale nadal wymaga niepustego `emoji` do walidacji narzędzia.

  </Accordion>

  <Accordion title="WhatsApp">
    - Puste `emoji` usuwa reakcję bota.
    - `remove: true` jest wewnętrznie mapowane na puste emoji (nadal wymaga `emoji` w wywołaniu narzędzia).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Wymaga niepustego `emoji`.
    - `remove: true` usuwa tę konkretną reakcję emoji.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Użyj narzędzia `feishu_reaction` z akcjami `add`, `remove` i `list`.
    - Dodawanie/usuwanie wymaga `emoji_type`; usuwanie wymaga także `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Powiadomienia o reakcjach przychodzących są kontrolowane przez `channels.signal.reactionNotifications`: `"off"` je wyłącza, `"own"` (domyślnie) emituje zdarzenia, gdy użytkownicy reagują na wiadomości bota, a `"all"` emituje zdarzenia dla wszystkich reakcji.

  </Accordion>
</AccordionGroup>

## Poziom reakcji

Konfiguracja `reactionLevel` dla danego kanału określa, jak szeroko agent używa reakcji. Typowe wartości to `off`, `ack`, `minimal` lub `extensive`.

- [Telegram reactionLevel](/pl/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/pl/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Ustaw `reactionLevel` dla poszczególnych kanałów, aby dostroić aktywność reakcji agenta na wiadomości na każdej platformie.

## Powiązane

- [Agent Send](/pl/tools/agent-send) — narzędzie `message`, które zawiera `react`
- [Kanały](/pl/channels) — konfiguracja specyficzna dla kanału
