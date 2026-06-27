---
read_when:
    - Praca nad reakcjami w dowolnym kanale
    - Zrozumienie, jak reakcje emoji różnią się między platformami
summary: Semantyka narzędzi reakcji we wszystkich obsługiwanych kanałach
title: Reakcje
x-i18n:
    generated_at: "2026-06-27T18:29:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2dc9575eaeb79a56ca82ee491c2974e9984b1a12999762b1532ca9affdbbd72f
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
- Ustaw `remove: true`, aby usunąć konkretną emoji (wymaga niepustego `emoji`).
- W kanałach obsługujących reakcje statusu ustawienie `trackToolCalls: true` dla
  reakcji pozwala środowisku uruchomieniowemu używać tej wiadomości z reakcją do kolejnych reakcji
  postępu narzędzi w tej samej turze.

## Zachowanie kanałów

<AccordionGroup>
  <Accordion title="Discord i Slack">
    - Puste `emoji` usuwa wszystkie reakcje bota na wiadomości.
    - `remove: true` usuwa tylko określoną emoji.

  </Accordion>

  <Accordion title="Google Chat">
    - Puste `emoji` usuwa reakcje aplikacji na wiadomości.
    - `remove: true` usuwa tylko określoną emoji.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - Tylko dodawanie reakcji: `emoji` jest wymagane i nie może być puste.
    - Usuwanie reakcji nie jest jeszcze obsługiwane; wywołania z `remove: true` (lub pustym `emoji`) są odrzucane z jasnym błędem zamiast cicho nic nie robić.
    - Wymaga zarejestrowania bota Talk z funkcją `reaction` (zobacz [dokumentację kanału Nextcloud Talk](/pl/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - Puste `emoji` usuwa reakcje bota.
    - `remove: true` również usuwa reakcje, ale nadal wymaga niepustego `emoji` do walidacji narzędzia.

  </Accordion>

  <Accordion title="WhatsApp">
    - Puste `emoji` usuwa reakcję bota.
    - `remove: true` jest wewnętrznie mapowane na puste emoji (nadal wymaga `emoji` w wywołaniu narzędzia).
    - WhatsApp ma jedno miejsce na reakcję bota na wiadomość; aktualizacje reakcji statusu zastępują to miejsce zamiast nakładać wiele emoji.

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

  <Accordion title="iMessage">
    - Reakcje wychodzące to tapbacki iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize` i `question`).
    - Powiadomienia o przychodzących tapbackach są kontrolowane przez `channels.imessage.reactionNotifications`: `"off"` je wyłącza, `"own"` (domyślnie) emituje zdarzenia, gdy użytkownicy reagują na wiadomości utworzone przez bota, a `"all"` emituje zdarzenia dla wszystkich tapbacków od autoryzowanych nadawców.

  </Accordion>
</AccordionGroup>

## Poziom reakcji

Konfiguracja `reactionLevel` dla kanału kontroluje, jak szeroko agent używa reakcji. Wartości to zwykle `off`, `ack`, `minimal` lub `extensive`.

- [Telegram reactionLevel](/pl/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/pl/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Ustaw `reactionLevel` na poszczególnych kanałach, aby dostroić, jak aktywnie agent reaguje na wiadomości na każdej platformie.

## Powiązane

- [Wysyłanie przez agenta](/pl/tools/agent-send) — narzędzie `message`, które zawiera `react`
- [Kanały](/pl/channels) — konfiguracja specyficzna dla kanału
