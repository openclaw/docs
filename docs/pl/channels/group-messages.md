---
read_when:
    - Zmiana zasad wiadomości grupowych lub wzmianek
summary: Zachowanie i konfiguracja obsługi wiadomości grupowych w WhatsApp (`mentionPatterns` są współdzielone między interfejsami)
title: Wiadomości grupowe
x-i18n:
    generated_at: "2026-04-24T08:57:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: f67ed72c0e61aef18a529cb1d9dbc98909e213352ff7cbef93fe4c9bf8357186
    source_path: channels/group-messages.md
    workflow: 15
---

# Wiadomości grupowe (kanał internetowy WhatsApp)

Cel: pozwolić Clawdowi przebywać w grupach WhatsApp, budzić się tylko po wywołaniu i utrzymywać ten wątek oddzielnie od sesji prywatnych wiadomości DM.

Uwaga: `agents.list[].groupChat.mentionPatterns` jest teraz używane także przez Telegram/Discord/Slack/iMessage; ten dokument koncentruje się na zachowaniu specyficznym dla WhatsApp. W konfiguracjach wieloagentowych ustaw `agents.list[].groupChat.mentionPatterns` dla każdego agenta osobno (lub użyj `messages.groupChat.mentionPatterns` jako globalnego ustawienia awaryjnego).

## Bieżąca implementacja (2025-12-03)

- Tryby aktywacji: `mention` (domyślny) lub `always`. `mention` wymaga wywołania (rzeczywistych wzmianek WhatsApp @ przez `mentionedJids`, bezpiecznych wzorców regex lub numeru E.164 bota w dowolnym miejscu tekstu). `always` budzi agenta przy każdej wiadomości, ale powinien on odpowiadać tylko wtedy, gdy może wnieść istotną wartość; w przeciwnym razie zwraca dokładnie cichy token `NO_REPLY` / `no_reply`. Wartości domyślne można ustawić w konfiguracji (`channels.whatsapp.groups`) i nadpisać dla każdej grupy przez `/activation`. Gdy ustawione jest `channels.whatsapp.groups`, działa ono także jako lista dozwolonych grup (dodaj `"*"`, aby zezwolić na wszystkie).
- Zasady grup: `channels.whatsapp.groupPolicy` kontroluje, czy wiadomości grupowe są akceptowane (`open|disabled|allowlist`). `allowlist` używa `channels.whatsapp.groupAllowFrom` (ustawienie awaryjne: jawne `channels.whatsapp.allowFrom`). Domyślnie jest to `allowlist` (blokada, dopóki nie dodasz nadawców).
- Sesje per grupa: klucze sesji mają postać `agent:<agentId>:whatsapp:group:<jid>`, więc polecenia takie jak `/verbose on`, `/trace on` lub `/think high` (wysyłane jako samodzielne wiadomości) są ograniczone do tej grupy; stan prywatnych wiadomości DM pozostaje nietknięty. Heartbeaty są pomijane dla wątków grupowych.
- Wstrzykiwanie kontekstu: grupowe wiadomości **tylko oczekujące** (domyślnie 50), które _nie_ wywołały uruchomienia, są dodawane na początku pod nagłówkiem `[Chat messages since your last reply - for context]`, a linia wywołująca pod `[Current message - respond to this]`. Wiadomości już obecne w sesji nie są wstrzykiwane ponownie.
- Pokazywanie nadawcy: każda partia grupowa kończy się teraz ciągiem `[from: Sender Name (+E164)]`, aby Pi wiedział, kto mówi.
- Wiadomości efemeryczne/view-once: rozpakowujemy je przed wyodrębnieniem tekstu/wzmianek, więc wywołania w ich wnętrzu nadal uruchamiają reakcję.
- Prompt systemowy grupy: przy pierwszej turze sesji grupowej (oraz zawsze, gdy `/activation` zmienia tryb) wstrzykujemy do promptu systemowego krótki opis, taki jak `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Jeśli metadane nie są dostępne, nadal informujemy agenta, że to czat grupowy.

## Przykład konfiguracji (WhatsApp)

Dodaj blok `groupChat` do `~/.openclaw/openclaw.json`, aby wywołania nazwą wyświetlaną działały nawet wtedy, gdy WhatsApp usuwa wizualny znak `@` z treści wiadomości:

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

- Wyrażenia regex nie rozróżniają wielkości liter i używają tych samych zabezpieczeń safe-regex co inne powierzchnie konfiguracji regex; nieprawidłowe wzorce i niebezpieczne zagnieżdżone powtórzenia są ignorowane.
- WhatsApp nadal wysyła kanoniczne wzmianki przez `mentionedJids`, gdy ktoś stuknie kontakt, więc ustawienie awaryjne z numerem jest rzadko potrzebne, ale stanowi przydatne zabezpieczenie.

### Polecenie aktywacji (tylko właściciel)

Użyj polecenia czatu grupowego:

- `/activation mention`
- `/activation always`

Tylko numer właściciela (z `channels.whatsapp.allowFrom` lub własny numer E.164 bota, jeśli nie jest ustawiony) może to zmienić. Wyślij `/status` jako samodzielną wiadomość w grupie, aby zobaczyć bieżący tryb aktywacji.

## Jak używać

1. Dodaj swoje konto WhatsApp (to, na którym działa OpenClaw) do grupy.
2. Napisz `@openclaw …` (lub podaj numer). Tylko nadawcy z listy dozwolonych mogą go uruchomić, chyba że ustawisz `groupPolicy: "open"`.
3. Prompt agenta będzie zawierał ostatni kontekst grupy oraz końcowy znacznik `[from: …]`, aby mógł zwrócić się do właściwej osoby.
4. Dyrektywy na poziomie sesji (`/verbose on`, `/trace on`, `/think high`, `/new` lub `/reset`, `/compact`) dotyczą tylko sesji tej grupy; wysyłaj je jako samodzielne wiadomości, aby zostały zarejestrowane. Twoja osobista sesja DM pozostaje niezależna.

## Testowanie / weryfikacja

- Ręczny test smoke:
  - Wyślij wywołanie `@openclaw` w grupie i potwierdź odpowiedź, która odnosi się do nazwy nadawcy.
  - Wyślij drugie wywołanie i sprawdź, czy blok historii zostanie dołączony, a następnie wyczyszczony w kolejnej turze.
- Sprawdź logi Gateway (uruchom z `--verbose`), aby zobaczyć wpisy `inbound web message` pokazujące `from: <groupJid>` oraz sufiks `[from: …]`.

## Znane kwestie

- Heartbeaty są celowo pomijane dla grup, aby uniknąć hałaśliwych rozgłoszeń.
- Tłumienie echa używa połączonego ciągu partii; jeśli wyślesz identyczny tekst dwa razy bez wzmianek, odpowiedź zostanie wygenerowana tylko dla pierwszego przypadku.
- Wpisy magazynu sesji będą widoczne jako `agent:<agentId>:whatsapp:group:<jid>` w magazynie sesji (`~/.openclaw/agents/<agentId>/sessions/sessions.json` domyślnie); brak wpisu oznacza po prostu, że grupa jeszcze nie wywołała uruchomienia.
- Wskaźniki pisania w grupach podążają za `agents.defaults.typingMode` (domyślnie: `message`, gdy nie ma wzmianki).

## Powiązane

- [Grupy](/pl/channels/groups)
- [Routing kanałów](/pl/channels/channel-routing)
- [Grupy rozgłoszeniowe](/pl/channels/broadcast-groups)
