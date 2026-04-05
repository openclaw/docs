---
read_when:
    - Zmiana reguł wiadomości grupowych lub wzmianek
summary: Zachowanie i konfiguracja obsługi wiadomości grupowych w WhatsApp (mentionPatterns są współdzielone między powierzchniami)
title: Wiadomości grupowe
x-i18n:
    generated_at: "2026-04-05T13:43:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2543be5bc4c6f188f955df580a6fef585ecbfc1be36ade5d34b1a9157e021bc5
    source_path: channels/group-messages.md
    workflow: 15
---

# Wiadomości grupowe (kanał internetowy WhatsApp)

Cel: pozwolić Clawd działać w grupach WhatsApp, wybudzać się tylko po pingnięciu i utrzymywać ten wątek oddzielnie od osobistej sesji DM.

Uwaga: `agents.list[].groupChat.mentionPatterns` jest teraz używane także przez Telegram/Discord/Slack/iMessage; ten dokument koncentruje się na zachowaniu specyficznym dla WhatsApp. W konfiguracjach wieloagentowych ustaw `agents.list[].groupChat.mentionPatterns` dla każdego agenta (lub użyj `messages.groupChat.mentionPatterns` jako globalnego ustawienia zapasowego).

## Bieżąca implementacja (2025-12-03)

- Tryby aktywacji: `mention` (domyślnie) lub `always`. `mention` wymaga pingnięcia (rzeczywiste WhatsApp @-wzmianki przez `mentionedJids`, bezpieczne wzorce regex lub numer E.164 bota w dowolnym miejscu tekstu). `always` wybudza agenta przy każdej wiadomości, ale powinien on odpowiadać tylko wtedy, gdy może wnieść sensowną wartość; w przeciwnym razie zwraca dokładny cichy token `NO_REPLY` / `no_reply`. Wartości domyślne można ustawić w konfiguracji (`channels.whatsapp.groups`) i nadpisać dla każdej grupy przez `/activation`. Gdy ustawione jest `channels.whatsapp.groups`, działa to również jako allowlista grup (uwzględnij `"*"`, aby zezwolić na wszystkie).
- Polityka grup: `channels.whatsapp.groupPolicy` określa, czy wiadomości grupowe są akceptowane (`open|disabled|allowlist`). `allowlist` używa `channels.whatsapp.groupAllowFrom` (ustawienie zapasowe: jawne `channels.whatsapp.allowFrom`). Domyślnie jest to `allowlist` (zablokowane, dopóki nie dodasz nadawców).
- Sesje per grupa: klucze sesji mają postać `agent:<agentId>:whatsapp:group:<jid>`, więc polecenia takie jak `/verbose on` lub `/think high` (wysyłane jako samodzielne wiadomości) są ograniczone do tej grupy; stan osobistego DM pozostaje nietknięty. Heartbeaty są pomijane dla wątków grupowych.
- Wstrzykiwanie kontekstu: grupowe wiadomości **tylko oczekujące** (domyślnie 50), które _nie_ uruchomiły wykonania, są poprzedzane sekcją `[Chat messages since your last reply - for context]`, a linia wyzwalająca sekcją `[Current message - respond to this]`. Wiadomości już obecne w sesji nie są wstrzykiwane ponownie.
- Ujawnianie nadawcy: każda partia grupowa kończy się teraz `[from: Sender Name (+E164)]`, aby Pi wiedziało, kto mówi.
- Ephemeral/view-once: rozpakowujemy je przed wyodrębnieniem tekstu/wzmianek, więc pingnięcia wewnątrz nich nadal wywołują uruchomienie.
- Prompt systemowy grupy: przy pierwszej turze sesji grupowej (oraz zawsze, gdy `/activation` zmienia tryb) wstrzykujemy krótki fragment do promptu systemowego, taki jak `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Jeśli metadane nie są dostępne, nadal informujemy agenta, że to czat grupowy.

## Przykład konfiguracji (WhatsApp)

Dodaj blok `groupChat` do `~/.openclaw/openclaw.json`, aby pingnięcia nazwą wyświetlaną działały nawet wtedy, gdy WhatsApp usuwa wizualny znak `@` z treści wiadomości:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Uwagi:

- Regexy są niewrażliwe na wielkość liter i używają tych samych zabezpieczeń safe-regex co inne powierzchnie konfiguracyjne regexów; nieprawidłowe wzorce i niebezpieczne zagnieżdżone powtórzenia są ignorowane.
- WhatsApp nadal wysyła kanoniczne wzmianki przez `mentionedJids`, gdy ktoś stuknie kontakt, więc zapasowe dopasowanie po numerze rzadko jest potrzebne, ale stanowi przydatne zabezpieczenie.

### Polecenie aktywacji (tylko właściciel)

Użyj polecenia czatu grupowego:

- `/activation mention`
- `/activation always`

Tylko numer właściciela (z `channels.whatsapp.allowFrom` lub własny numer E.164 bota, jeśli nie jest ustawiony) może to zmienić. Wyślij `/status` jako samodzielną wiadomość w grupie, aby zobaczyć bieżący tryb aktywacji.

## Jak używać

1. Dodaj swoje konto WhatsApp (to, na którym działa OpenClaw) do grupy.
2. Napisz `@openclaw …` (lub dołącz numer). Tylko nadawcy z allowlisty mogą to wywołać, chyba że ustawisz `groupPolicy: "open"`.
3. Prompt agenta będzie zawierał ostatni kontekst grupy oraz końcowy znacznik `[from: …]`, aby mógł zwrócić się do właściwej osoby.
4. Dyrektywy na poziomie sesji (`/verbose on`, `/think high`, `/new` lub `/reset`, `/compact`) dotyczą tylko sesji tej grupy; wysyłaj je jako samodzielne wiadomości, aby zostały zarejestrowane. Twoja osobista sesja DM pozostaje niezależna.

## Testowanie / weryfikacja

- Ręczny smoke test:
  - Wyślij ping `@openclaw` w grupie i potwierdź odpowiedź, która odnosi się do nazwy nadawcy.
  - Wyślij drugi ping i sprawdź, czy blok historii został dołączony, a potem wyczyszczony w następnej turze.
- Sprawdź logi gateway (uruchomione z `--verbose`), aby zobaczyć wpisy `inbound web message` pokazujące `from: <groupJid>` oraz sufiks `[from: …]`.

## Znane kwestie

- Heartbeaty są celowo pomijane dla grup, aby uniknąć hałaśliwych rozgłoszeń.
- Tłumienie echa używa połączonego ciągu partii; jeśli wyślesz identyczny tekst dwa razy bez wzmianek, odpowiedź zostanie wygenerowana tylko na pierwszy.
- Wpisy w magazynie sesji będą widoczne jako `agent:<agentId>:whatsapp:group:<jid>` w magazynie sesji (`~/.openclaw/agents/<agentId>/sessions/sessions.json` domyślnie); brak wpisu oznacza tylko, że grupa nie wywołała jeszcze wykonania.
- Wskaźniki pisania w grupach są zgodne z `agents.defaults.typingMode` (domyślnie: `message`, gdy nie ma wzmianki).
