---
read_when:
    - Zmienianie reguł wiadomości grupowych lub wzmianek
summary: Zachowanie i konfiguracja obsługi wiadomości grupowych WhatsApp (mentionPatterns są współdzielone między powierzchniami)
title: Wiadomości grupowe
x-i18n:
    generated_at: "2026-04-30T09:36:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb7713f83b3bf309336c4b09add17835b13facb17a5a1e3db48c25d892988ee4
    source_path: channels/group-messages.md
    workflow: 16
---

Cel: pozwolić Clawdowi przebywać w grupach WhatsApp, budzić się tylko po wywołaniu i utrzymywać ten wątek oddzielnie od osobistej sesji DM.

<Note>
`agents.list[].groupChat.mentionPatterns` jest też używane przez Telegram, Discord, Slack i iMessage. Ten dokument koncentruje się na zachowaniu specyficznym dla WhatsApp. W konfiguracjach wieloagentowych ustaw `agents.list[].groupChat.mentionPatterns` dla każdego agenta albo użyj `messages.groupChat.mentionPatterns` jako globalnej wartości awaryjnej.
</Note>

## Bieżąca implementacja (2025-12-03)

- Tryby aktywacji: `mention` (domyślny) albo `always`. `mention` wymaga wywołania (rzeczywistych wzmianek @ z WhatsApp przez `mentionedJids`, bezpiecznych wzorców regex albo numeru E.164 bota gdziekolwiek w tekście). `always` budzi agenta przy każdej wiadomości, ale powinien on odpowiadać tylko wtedy, gdy może dodać znaczącą wartość; w przeciwnym razie zwraca dokładny cichy token `NO_REPLY` / `no_reply`. Wartości domyślne można ustawić w konfiguracji (`channels.whatsapp.groups`) i nadpisać dla każdej grupy przez `/activation`. Gdy `channels.whatsapp.groups` jest ustawione, działa też jako lista dozwolonych grup (dodaj `"*"`, aby zezwolić na wszystkie).
- Zasady grup: `channels.whatsapp.groupPolicy` kontroluje, czy wiadomości grupowe są akceptowane (`open|disabled|allowlist`). `allowlist` używa `channels.whatsapp.groupAllowFrom` (wartość awaryjna: jawne `channels.whatsapp.allowFrom`). Domyślnie jest to `allowlist` (zablokowane do czasu dodania nadawców).
- Sesje dla poszczególnych grup: klucze sesji wyglądają jak `agent:<agentId>:whatsapp:group:<jid>`, więc polecenia takie jak `/verbose on`, `/trace on` albo `/think high` (wysłane jako samodzielne wiadomości) są ograniczone do tej grupy; stan osobistego DM pozostaje nietknięty. Mechanizm Heartbeat jest pomijany dla wątków grupowych.
- Wstrzykiwanie kontekstu: **tylko oczekujące** wiadomości grupowe (domyślnie 50), które _nie_ uruchomiły przebiegu, są poprzedzane nagłówkiem `[Chat messages since your last reply - for context]`, a linia wyzwalająca trafia pod `[Current message - respond to this]`. Wiadomości już obecne w sesji nie są wstrzykiwane ponownie.
- Ujawnianie nadawcy: każda grupa wsadowa kończy się teraz znacznikiem `[from: Sender Name (+E164)]`, aby Pi wiedział, kto mówi.
- Wiadomości efemeryczne/view-once: odpakowujemy je przed wyodrębnieniem tekstu/wzmianek, więc wywołania w nich nadal uruchamiają agenta.
- Prompt systemowy grupy: przy pierwszej turze sesji grupowej (i za każdym razem, gdy `/activation` zmienia tryb) wstrzykujemy do promptu systemowego krótką informację, taką jak `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Jeśli metadane nie są dostępne, nadal informujemy agenta, że jest to czat grupowy.

## Przykład konfiguracji (WhatsApp)

Dodaj blok `groupChat` do `~/.openclaw/openclaw.json`, aby wywołania po nazwie wyświetlanej działały nawet wtedy, gdy WhatsApp usuwa wizualne `@` z treści tekstu:

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

- Wyrażenia regex nie rozróżniają wielkości liter i używają tych samych zabezpieczeń safe-regex co inne powierzchnie regex konfiguracji; nieprawidłowe wzorce i niebezpieczne zagnieżdżone powtórzenia są ignorowane.
- WhatsApp nadal wysyła kanoniczne wzmianki przez `mentionedJids`, gdy ktoś dotknie kontaktu, więc awaryjny numer rzadko jest potrzebny, ale stanowi przydatne zabezpieczenie.

### Polecenie aktywacji (tylko właściciel)

Użyj polecenia czatu grupowego:

- `/activation mention`
- `/activation always`

Tylko numer właściciela (z `channels.whatsapp.allowFrom` albo własny numer E.164 bota, gdy ta wartość nie jest ustawiona) może to zmienić. Wyślij `/status` jako samodzielną wiadomość w grupie, aby zobaczyć bieżący tryb aktywacji.

## Jak używać

1. Dodaj swoje konto WhatsApp (to, na którym działa OpenClaw) do grupy.
2. Napisz `@openclaw …` (albo dołącz numer). Tylko nadawcy z listy dozwolonych mogą go uruchomić, chyba że ustawisz `groupPolicy: "open"`.
3. Prompt agenta będzie zawierał ostatni kontekst grupy oraz końcowy znacznik `[from: …]`, aby mógł zwrócić się do właściwej osoby.
4. Dyrektywy poziomu sesji (`/verbose on`, `/trace on`, `/think high`, `/new` albo `/reset`, `/compact`) dotyczą tylko sesji tej grupy; wyślij je jako samodzielne wiadomości, aby zostały zarejestrowane. Twoja osobista sesja DM pozostaje niezależna.

## Testowanie / weryfikacja

- Ręczny smoke test:
  - Wyślij wywołanie `@openclaw` w grupie i potwierdź odpowiedź, która odnosi się do nazwy nadawcy.
  - Wyślij drugie wywołanie i sprawdź, czy blok historii jest dołączony, a następnie czyszczony przy kolejnej turze.
- Sprawdź logi Gateway (uruchom z `--verbose`), aby zobaczyć wpisy `inbound web message` pokazujące `from: <groupJid>` oraz sufiks `[from: …]`.

## Znane kwestie

- Mechanizm Heartbeat jest celowo pomijany dla grup, aby uniknąć hałaśliwych emisji.
- Tłumienie echa używa połączonego ciągu wsadowego; jeśli wyślesz identyczny tekst dwa razy bez wzmianek, tylko pierwszy otrzyma odpowiedź.
- Wpisy magazynu sesji pojawią się jako `agent:<agentId>:whatsapp:group:<jid>` w magazynie sesji (domyślnie `~/.openclaw/agents/<agentId>/sessions/sessions.json`); brak wpisu oznacza po prostu, że grupa nie uruchomiła jeszcze przebiegu.
- Wskaźniki pisania w grupach są zgodne z `agents.defaults.typingMode`. Gdy widoczne odpowiedzi używają domyślnego trybu tylko narzędzia wiadomości, pisanie domyślnie zaczyna się natychmiast, więc członkowie grupy widzą, że agent pracuje, nawet jeśli nie zostanie opublikowana automatyczna odpowiedź końcowa. Jawna konfiguracja trybu pisania nadal ma pierwszeństwo.

## Powiązane

- [Grupy](/pl/channels/groups)
- [Routing kanałów](/pl/channels/channel-routing)
- [Grupy rozgłoszeniowe](/pl/channels/broadcast-groups)
