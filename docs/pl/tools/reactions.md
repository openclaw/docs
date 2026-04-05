---
read_when:
    - Praca nad reakcjami w dowolnym kanale
    - Zrozumienie, jak reakcje emoji różnią się między platformami
summary: Semantyka narzędzia reakcji we wszystkich obsługiwanych kanałach
title: Reakcje
x-i18n:
    generated_at: "2026-04-05T14:09:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9af2951eee32e73adb982dbdf39b32e4065993454e9cce2ad23b27565cab4f84
    source_path: tools/reactions.md
    workflow: 15
---

# Reakcje

Agent może dodawać i usuwać reakcje emoji na wiadomościach za pomocą narzędzia `message`
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
- Ustaw `emoji` na pusty ciąg (`""`), aby usunąć reakcję(e) bota.
- Ustaw `remove: true`, aby usunąć określone emoji (wymaga niepustego `emoji`).

## Zachowanie w kanałach

<AccordionGroup>
  <Accordion title="Discord and Slack">
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
    - Przychodzące powiadomienia o reakcjach są kontrolowane przez `channels.signal.reactionNotifications`: `"off"` je wyłącza, `"own"` (domyślnie) emituje zdarzenia, gdy użytkownicy reagują na wiadomości bota, a `"all"` emituje zdarzenia dla wszystkich reakcji.
  </Accordion>
</AccordionGroup>

## Poziom reakcji

Konfiguracja `reactionLevel` dla danego kanału kontroluje, jak szeroko agent używa reakcji. Typowe wartości to `off`, `ack`, `minimal` lub `extensive`.

- [Telegram reactionLevel](/pl/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/pl/channels/whatsapp#reactions) — `channels.whatsapp.reactionLevel`

Ustaw `reactionLevel` dla poszczególnych kanałów, aby dostroić, jak aktywnie agent reaguje na wiadomości na każdej platformie.

## Powiązane

- [Agent Send](/tools/agent-send) — narzędzie `message`, które zawiera `react`
- [Channels](/pl/channels) — konfiguracja specyficzna dla kanału
