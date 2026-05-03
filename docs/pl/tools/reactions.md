---
read_when:
    - Praca z reakcjami w dowolnym kanale
    - Jak reakcje emoji różnią się między platformami
summary: Semantyka narzędzia reakcji we wszystkich obsługiwanych kanałach
title: Reakcje
x-i18n:
    generated_at: "2026-05-03T21:38:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99008cdaf1fa7462bbe72066be7c404880df237a79d3deba01bffe00083c1e34
    source_path: tools/reactions.md
    workflow: 16
---

Agent może dodawać i usuwać reakcje emoji na wiadomościach za pomocą narzędzia `message`
z akcją `react`. Zachowanie reakcji różni się w zależności od kanału i transportu.

## Jak to działa

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` jest wymagane podczas dodawania reakcji.
- Ustaw `emoji` na pusty ciąg (`""`), aby usunąć reakcję lub reakcje bota.
- Ustaw `remove: true`, aby usunąć określone emoji (wymaga niepustego `emoji`).
- Na kanałach obsługujących reakcje statusu `trackToolCalls: true` w reakcji
  pozwala środowisku uruchomieniowemu używać tej wiadomości z reakcją do kolejnych
  reakcji postępu narzędzia w tej samej turze.

## Zachowanie kanałów

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - Puste `emoji` usuwa wszystkie reakcje bota na wiadomości.
    - `remove: true` usuwa tylko określone emoji.

  </Accordion>

  <Accordion title="Google Chat">
    - Puste `emoji` usuwa reakcje aplikacji na wiadomości.
    - `remove: true` usuwa tylko określone emoji.

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

Konfiguracja `reactionLevel` dla poszczególnych kanałów kontroluje, jak szeroko agent używa reakcji. Wartości to zwykle `off`, `ack`, `minimal` lub `extensive`.

- [Telegram reactionLevel](/pl/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/pl/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Ustaw `reactionLevel` na poszczególnych kanałach, aby dostosować, jak aktywnie agent reaguje na wiadomości na każdej platformie.

## Powiązane

- [Wysyłanie agenta](/pl/tools/agent-send) — narzędzie `message`, które obejmuje `react`
- [Kanały](/pl/channels) — konfiguracja specyficzna dla kanału
