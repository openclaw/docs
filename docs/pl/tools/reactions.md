---
read_when:
    - Praca z reakcjami w dowolnym kanale
    - Zrozumienie różnic w reakcjach emoji na różnych platformach
summary: Semantyka narzędzia reakcji we wszystkich obsługiwanych kanałach
title: Reakcje
x-i18n:
    generated_at: "2026-07-12T15:40:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e148a93edbcfbe997075f6e9e191667ec257f76fa48162688fd1f333479661f0
    source_path: tools/reactions.md
    workflow: 16
---

Agent dodaje i usuwa reakcje emoji za pomocą akcji `react` narzędzia `message`.
Zachowanie różni się w zależności od kanału.

## Jak to działa

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- Parametr `emoji` jest wymagany podczas dodawania reakcji.
- Ustaw `emoji` na pusty ciąg (`""`), aby usunąć reakcję lub reakcje bota w
  kanałach, które to obsługują.
- Ustaw `remove: true`, aby usunąć jedno określone emoji (wymaga niepustego
  `emoji`).
- W kanałach z reakcjami statusowymi ustawienie `trackToolCalls: true` w reakcji
  pozwala środowisku wykonawczemu ponownie używać wiadomości z tą reakcją do
  kolejnych reakcji informujących o postępie narzędzia w ramach tej samej tury.

## Zachowanie kanałów

<AccordionGroup>
  <Accordion title="Discord i Slack">
    - Puste `emoji` usuwa z wiadomości wszystkie reakcje bota.
    - `remove: true` usuwa tylko określone emoji.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - Obsługiwane jest tylko dodawanie reakcji: `emoji` jest wymagane i nie może być puste.
    - Usuwanie reakcji nie jest jeszcze powiązane z wywołaniem usuwania; `remove: true` jest odrzucane z jawnym błędem zamiast bezgłośnie nie wykonywać żadnej operacji.
    - Wymaga bota Talk zarejestrowanego z funkcją `reaction` (zobacz [dokumentację kanału Nextcloud Talk](/pl/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - Puste `emoji` usuwa reakcje bota.
    - `remove: true` również usuwa reakcje, ale walidacja narzędzia nadal wymaga niepustego `emoji`.

  </Accordion>

  <Accordion title="WhatsApp">
    - Puste `emoji` usuwa reakcję bota.
    - `remove: true` jest wewnętrznie mapowane na puste emoji (wywołanie narzędzia nadal wymaga `emoji`).
    - WhatsApp ma jedno miejsce na reakcję bota dla każdej wiadomości; wysłanie nowej reakcji zastępuje poprzednią zamiast dodawać wiele emoji.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Wymaga niepustego `emoji` zarówno podczas dodawania, jak i usuwania.
    - `remove: true` usuwa określoną reakcję emoji.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Używa tej samej akcji `react` co inne kanały (dodawanie, usuwanie i wyświetlanie listy za pomocą identyfikatorów reakcji na wiadomość), a nie osobnego narzędzia.
    - Dodawanie wymaga niepustego `emoji` (mapowanego na `emoji_type` platformy Feishu, np. `SMILE`, `THUMBSUP`, `HEART`).
    - `remove: true` wymaga niepustego `emoji` i usuwa własną reakcję bota odpowiadającą temu typowi emoji.
    - Puste `emoji` z `clearAll: true` usuwa z wiadomości wszystkie reakcje bota.

  </Accordion>

  <Accordion title="Signal">
    - Powiadomieniami o reakcjach przychodzących steruje `channels.signal.reactionNotifications`: `"off"` je wyłącza, `"own"` (wartość domyślna) emituje zdarzenia, gdy użytkownicy reagują na wiadomości bota, `"all"` emituje zdarzenia dla wszystkich reakcji, a `"allowlist"` emituje zdarzenia tylko dla nadawców z `channels.signal.reactionAllowlist`.

  </Accordion>

  <Accordion title="iMessage">
    - Reakcje wychodzące to tapbacki iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize` i `question`); aby dodać reakcję, `emoji` musi być mapowane na jeden z tych rodzajów.
    - `remove: true` bez rozpoznanego rodzaju tapbacka usuwa wszystkie rodzaje tapbacków; z rozpoznanym rodzajem usuwa tylko ten jeden.

  </Accordion>
</AccordionGroup>

## Poziom reakcji

Ustawienie `reactionLevel` dla poszczególnych kanałów ogranicza częstotliwość
wysyłania przez agenta własnych reakcji. Wartości: `off`, `ack`, `minimal` lub
`extensive`.

- [Powiadomienia o reakcjach w Telegramie](/pl/channels/telegram#feature-reference) — `channels.telegram.reactionLevel` (domyślnie `minimal`)
- [Poziom reakcji w WhatsAppie](/pl/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel` (domyślnie `minimal`)
- [Reakcje w Signal](/pl/channels/signal#reactions-message-tool) — `channels.signal.reactionLevel` (domyślnie `minimal`)

## Powiązane

- [Wysyłanie przez agenta](/pl/tools/agent-send) — narzędzie `message`, które zawiera akcję `react`
- [Kanały](/pl/channels) — konfiguracja właściwa dla poszczególnych kanałów
