---
read_when:
    - Konfigurowanie konkretnie grup WhatsApp
    - Zmiana trybów aktywacji WhatsApp (`mention` vs `always`)
    - Dostrajanie kluczy sesji grupy WhatsApp lub kontekstu oczekujących wiadomości
sidebarTitle: WhatsApp groups
summary: Obsługa wiadomości grupowych WhatsApp — aktywacja, listy dozwolonych, sesje i wstrzykiwanie kontekstu
title: Wiadomości grupowe WhatsApp
x-i18n:
    generated_at: "2026-06-27T17:10:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 790866fd959b43d94b745082f3c90920b81c0a016492e9e164c600663f1b2eee
    source_path: channels/group-messages.md
    workflow: 16
---

Model grup międzykanałowych (Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo) opisuje [Grupy](/pl/channels/groups). Ta strona omawia zachowanie specyficzne dla WhatsApp nad tym modelem: aktywację, listy dozwolonych grup, klucze sesji dla poszczególnych grup oraz wstrzykiwanie kontekstu oczekujących wiadomości.

Cel: pozwolić OpenClaw działać w grupach WhatsApp, wybudzać się tylko po wywołaniu i utrzymywać ten wątek oddzielnie od osobistej sesji DM.

<Note>
`agents.list[].groupChat.mentionPatterns` jest też używane przez Telegram, Discord, Slack i iMessage. W konfiguracjach wieloagentowych ustaw je dla każdego agenta albo użyj `messages.groupChat.mentionPatterns` jako globalnego ustawienia awaryjnego.
</Note>

## Zachowanie

- Tryby aktywacji: `mention` (domyślnie) lub `always`. `mention` wymaga wywołania (rzeczywiste wzmianki @ w WhatsApp przez `mentionedJids`, bezpieczne wzorce regex albo E.164 bota w dowolnym miejscu tekstu). `always` wybudza agenta przy każdej wiadomości, ale powinien odpowiedzieć tylko wtedy, gdy może wnieść realną wartość; w przeciwnym razie zwraca dokładny cichy token `NO_REPLY` / `no_reply`. Wartości domyślne można ustawić w konfiguracji (`channels.whatsapp.groups`) i nadpisać dla grupy przez `/activation`. Gdy ustawione jest `channels.whatsapp.groups`, działa też jako lista dozwolonych grup (dodaj `"*"`, aby zezwolić na wszystkie).
- Polityka grup: `channels.whatsapp.groupPolicy` kontroluje, czy wiadomości grupowe są akceptowane (`open|disabled|allowlist`). `allowlist` używa `channels.whatsapp.groupAllowFrom` (awaryjnie: jawne `channels.whatsapp.allowFrom`). Domyślnie jest to `allowlist` (blokowane, dopóki nie dodasz nadawców).
- Sesje dla poszczególnych grup: klucze sesji mają postać `agent:<agentId>:whatsapp:group:<jid>`, więc polecenia takie jak `/verbose on`, `/trace on` lub `/think high` (wysłane jako samodzielne wiadomości) są ograniczone do tej grupy; osobisty stan DM pozostaje nienaruszony. Heartbeat jest pomijany dla wątków grupowych.
- Wstrzykiwanie kontekstu: **tylko oczekujące** wiadomości grupowe (domyślnie 50), które _nie_ uruchomiły przebiegu, są poprzedzane nagłówkiem `[Chat messages since your last reply - for context]`, a linia wyzwalająca znajduje się pod `[Current message - respond to this]`. Wiadomości już obecne w sesji nie są wstrzykiwane ponownie.
- Ujawnianie nadawcy: każda partia grupowa kończy się teraz `[from: Sender Name (+E164)]`, więc OpenClaw wie, kto mówi.
- Efemeryczne/jednorazowego wyświetlenia: odpakowujemy je przed wyodrębnieniem tekstu/wzmianek, więc wywołania w ich treści nadal uruchamiają działanie.
- Systemowy prompt grupy: przy pierwszym kroku sesji grupowej (i za każdym razem, gdy `/activation` zmieni tryb) wstrzykujemy do promptu systemowego krótki opis, taki jak `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` Jeśli metadane nie są dostępne, nadal informujemy agenta, że to czat grupowy.

## Przykład konfiguracji (WhatsApp)

Dodaj blok `groupChat` do `~/.openclaw/openclaw.json`, aby wywołania nazwą wyświetlaną działały nawet wtedy, gdy WhatsApp usuwa wizualne `@` z treści tekstu:

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

- Regexy nie rozróżniają wielkości liter i używają tych samych zabezpieczeń safe-regex co inne powierzchnie regex w konfiguracji; nieprawidłowe wzorce i niebezpieczne zagnieżdżone powtórzenia są ignorowane.
- WhatsApp nadal wysyła kanoniczne wzmianki przez `mentionedJids`, gdy ktoś stuknie kontakt, więc awaryjne użycie numeru rzadko jest potrzebne, ale stanowi użyteczną siatkę bezpieczeństwa.

### Polecenie aktywacji (tylko właściciel)

Użyj polecenia czatu grupowego:

- `/activation mention`
- `/activation always`

Tylko numer właściciela (z `channels.whatsapp.allowFrom` albo własny E.164 bota, gdy nie ustawiono) może to zmienić. Wyślij `/status` jako samodzielną wiadomość w grupie, aby zobaczyć bieżący tryb aktywacji.

## Jak używać

1. Dodaj swoje konto WhatsApp (to, na którym działa OpenClaw) do grupy.
2. Napisz `@openclaw …` (albo dołącz numer). Tylko nadawcy z listy dozwolonych mogą go uruchomić, chyba że ustawisz `groupPolicy: "open"`.
3. Prompt agenta będzie zawierać ostatni kontekst grupy oraz końcowy znacznik `[from: …]`, aby mógł zwrócić się do właściwej osoby.
4. Dyrektywy na poziomie sesji (`/verbose on`, `/trace on`, `/think high`, `/new` lub `/reset`, `/compact`) dotyczą tylko sesji tej grupy; wyślij je jako samodzielne wiadomości, aby zostały zarejestrowane. Twoja osobista sesja DM pozostaje niezależna.

## Testowanie / weryfikacja

- Ręczny smoke test:
  - Wyślij wywołanie `@openclaw` w grupie i potwierdź odpowiedź, która odnosi się do nazwy nadawcy.
  - Wyślij drugie wywołanie i sprawdź, że blok historii został dołączony, a następnie wyczyszczony przy kolejnym kroku.
- Sprawdź logi Gateway (uruchom z `--verbose`), aby zobaczyć wpisy `inbound web message` pokazujące `from: <groupJid>` oraz sufiks `[from: …]`.

## Znane kwestie

- Heartbeat jest celowo pomijany dla grup, aby uniknąć hałaśliwych transmisji.
- Tłumienie echa używa połączonego ciągu partii; jeśli wyślesz identyczny tekst dwa razy bez wzmianek, odpowiedź otrzyma tylko pierwszy.
- Wpisy magazynu sesji pojawią się jako `agent:<agentId>:whatsapp:group:<jid>` w magazynie sesji (`~/.openclaw/agents/<agentId>/sessions/sessions.json` domyślnie); brak wpisu oznacza po prostu, że grupa nie uruchomiła jeszcze przebiegu.
- Wskaźniki pisania w grupach podążają za `agents.defaults.typingMode`. Gdy widoczne odpowiedzi są włączone tylko w trybie narzędzia wiadomości, pisanie domyślnie zaczyna się natychmiast, aby członkowie grupy widzieli, że agent pracuje, nawet jeśli nie zostanie opublikowana automatyczna odpowiedź końcowa. Jawna konfiguracja trybu pisania nadal ma pierwszeństwo.

## Powiązane

- [Grupy](/pl/channels/groups)
- [Routing kanałów](/pl/channels/channel-routing)
- [Grupy rozgłoszeniowe](/pl/channels/broadcast-groups)
