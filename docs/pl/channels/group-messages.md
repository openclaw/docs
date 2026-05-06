---
read_when:
    - Konfigurowanie konkretnie grup WhatsApp
    - Zmiana trybów aktywacji WhatsApp (`mention` a `always`)
    - Dostrajanie kluczy sesji grupowych WhatsApp lub kontekstu oczekujących wiadomości
sidebarTitle: WhatsApp groups
summary: Obsługa wiadomości grupowych WhatsApp — aktywacja, listy dozwolonych, sesje i wstrzykiwanie kontekstu
title: Wiadomości grupowe WhatsApp
x-i18n:
    generated_at: "2026-05-06T09:02:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 489f04ea9f4d0954f77eee4590d609383d5dc987eaaea5eb121b454620a2d0fe
    source_path: channels/group-messages.md
    workflow: 16
---

W przypadku modelu grup międzykanałowych (Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo) zobacz [Grupy](/pl/channels/groups). Ta strona opisuje zachowanie specyficzne dla WhatsApp dodane do tego modelu: aktywację, listy dozwolonych grup, klucze sesji dla poszczególnych grup oraz wstrzykiwanie kontekstu oczekujących wiadomości.

Cel: pozwolić OpenClaw działać w grupach WhatsApp, wybudzać się tylko po wywołaniu i utrzymywać ten wątek oddzielnie od osobistej sesji DM.

<Note>
`agents.list[].groupChat.mentionPatterns` jest też używane przez Telegram, Discord, Slack i iMessage. W konfiguracjach z wieloma agentami ustaw je dla każdego agenta albo użyj `messages.groupChat.mentionPatterns` jako globalnej wartości zastępczej.
</Note>

## Zachowanie

- Tryby aktywacji: `mention` (domyślny) albo `always`. `mention` wymaga wywołania (rzeczywiste wzmianki @ w WhatsApp przez `mentionedJids`, bezpieczne wzorce regex albo E.164 bota w dowolnym miejscu tekstu). `always` wybudza agenta przy każdej wiadomości, ale powinien odpowiadać tylko wtedy, gdy może wnieść realną wartość; w przeciwnym razie zwraca dokładny cichy token `NO_REPLY` / `no_reply`. Domyślne wartości można ustawić w konfiguracji (`channels.whatsapp.groups`) i nadpisać dla każdej grupy przez `/activation`. Gdy ustawiono `channels.whatsapp.groups`, działa to również jako lista dozwolonych grup (dodaj `"*"`, aby zezwolić na wszystkie).
- Polityka grup: `channels.whatsapp.groupPolicy` kontroluje, czy wiadomości grupowe są akceptowane (`open|disabled|allowlist`). `allowlist` używa `channels.whatsapp.groupAllowFrom` (wartość zastępcza: jawne `channels.whatsapp.allowFrom`). Domyślnie jest to `allowlist` (zablokowane, dopóki nie dodasz nadawców).
- Sesje dla poszczególnych grup: klucze sesji wyglądają jak `agent:<agentId>:whatsapp:group:<jid>`, więc polecenia takie jak `/verbose on`, `/trace on` albo `/think high` (wysłane jako samodzielne wiadomości) są ograniczone do tej grupy; osobisty stan DM pozostaje nietknięty. Heartbeat jest pomijany dla wątków grupowych.
- Wstrzykiwanie kontekstu: wiadomości grupowe **tylko oczekujące** (domyślnie 50), które _nie_ uruchomiły przebiegu, są poprzedzane sekcją `[Chat messages since your last reply - for context]`, a linia wyzwalająca znajduje się pod `[Current message - respond to this]`. Wiadomości już obecne w sesji nie są wstrzykiwane ponownie.
- Ujawnianie nadawcy: każda partia grupowa kończy się teraz znacznikiem `[from: Sender Name (+E164)]`, aby Pi wiedziało, kto mówi.
- Wiadomości efemeryczne/jednorazowego wyświetlenia: rozpakowujemy je przed wyodrębnieniem tekstu/wzmianek, więc wywołania wewnątrz nich nadal uruchamiają działanie.
- Systemowy prompt grupy: w pierwszej turze sesji grupowej (oraz zawsze, gdy `/activation` zmienia tryb) wstrzykujemy krótki opis do promptu systemowego, np. `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` Jeśli metadane nie są dostępne, nadal informujemy agenta, że to czat grupowy.

## Przykład konfiguracji (WhatsApp)

Dodaj blok `groupChat` do `~/.openclaw/openclaw.json`, aby wywołania po nazwie wyświetlanej działały nawet wtedy, gdy WhatsApp usuwa wizualny znak `@` z treści tekstu:

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

- Regexy są niewrażliwe na wielkość liter i używają tych samych zabezpieczeń safe-regex co inne powierzchnie regex w konfiguracji; nieprawidłowe wzorce oraz niebezpieczne zagnieżdżone powtórzenia są ignorowane.
- WhatsApp nadal wysyła kanoniczne wzmianki przez `mentionedJids`, gdy ktoś stuknie kontakt, więc awaryjne użycie numeru rzadko jest potrzebne, ale stanowi przydatne zabezpieczenie.

### Polecenie aktywacji (tylko właściciel)

Użyj polecenia czatu grupowego:

- `/activation mention`
- `/activation always`

Tylko numer właściciela (z `channels.whatsapp.allowFrom` albo własny E.164 bota, jeśli nie ustawiono) może to zmienić. Wyślij `/status` jako samodzielną wiadomość w grupie, aby zobaczyć bieżący tryb aktywacji.

## Jak używać

1. Dodaj swoje konto WhatsApp (to, na którym działa OpenClaw) do grupy.
2. Napisz `@openclaw …` (albo dołącz numer). Tylko nadawcy z listy dozwolonych mogą je uruchomić, chyba że ustawisz `groupPolicy: "open"`.
3. Prompt agenta będzie zawierał ostatni kontekst grupy oraz końcowy znacznik `[from: …]`, aby mógł zwrócić się do właściwej osoby.
4. Dyrektywy na poziomie sesji (`/verbose on`, `/trace on`, `/think high`, `/new` albo `/reset`, `/compact`) dotyczą tylko sesji tej grupy; wysyłaj je jako samodzielne wiadomości, aby zostały zarejestrowane. Twoja osobista sesja DM pozostaje niezależna.

## Testowanie / weryfikacja

- Ręczny test podstawowy:
  - Wyślij wywołanie `@openclaw` w grupie i potwierdź odpowiedź odnoszącą się do nazwy nadawcy.
  - Wyślij drugie wywołanie i sprawdź, czy blok historii został dołączony, a następnie wyczyszczony w kolejnej turze.
- Sprawdź logi Gateway (uruchom z `--verbose`), aby zobaczyć wpisy `inbound web message` pokazujące `from: <groupJid>` oraz sufiks `[from: …]`.

## Znane uwagi

- Heartbeat jest celowo pomijany dla grup, aby uniknąć hałaśliwych transmisji.
- Tłumienie echa używa połączonego ciągu partii; jeśli wyślesz identyczny tekst dwa razy bez wzmianek, tylko pierwszy otrzyma odpowiedź.
- Wpisy magazynu sesji pojawią się jako `agent:<agentId>:whatsapp:group:<jid>` w magazynie sesji (domyślnie `~/.openclaw/agents/<agentId>/sessions/sessions.json`); brakujący wpis oznacza po prostu, że grupa nie uruchomiła jeszcze żadnego przebiegu.
- Wskaźniki pisania w grupach podążają za `agents.defaults.typingMode`. Gdy widoczne odpowiedzi używają domyślnego trybu tylko dla narzędzia wiadomości, pisanie domyślnie zaczyna się natychmiast, aby członkowie grupy widzieli, że agent pracuje, nawet jeśli nie zostanie opublikowana automatyczna odpowiedź końcowa. Jawna konfiguracja trybu pisania nadal ma pierwszeństwo.

## Powiązane

- [Grupy](/pl/channels/groups)
- [Routing kanałów](/pl/channels/channel-routing)
- [Grupy rozgłoszeniowe](/pl/channels/broadcast-groups)
