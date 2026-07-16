---
read_when:
    - Konfigurowanie konkretnie grup WhatsApp
    - Zmiana trybów aktywacji WhatsApp (`mention` a `always`)
    - Dostosowywanie kluczy sesji grupowych WhatsApp lub kontekstu oczekujących wiadomości
sidebarTitle: WhatsApp groups
summary: Obsługa wiadomości grupowych WhatsApp — aktywacja, listy dozwolonych, sesje i wstrzykiwanie kontekstu
title: Wiadomości grupowe WhatsApp
x-i18n:
    generated_at: "2026-07-16T18:03:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bd1adb379a4cae4ee9b4b9950d7519e62e1fc0e72ece25ec1b337ee3cb803cda
    source_path: channels/group-messages.md
    workflow: 16
---

W przypadku modelu grup międzykanałowych (Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo) zobacz [Grupy](/pl/channels/groups). Ta strona opisuje zachowanie specyficzne dla WhatsApp, które uzupełnia ten model: aktywację, listy dozwolonych grup, klucze sesji poszczególnych grup oraz wstrzykiwanie kontekstu oczekujących wiadomości.

Cel: umożliwić OpenClaw działanie w grupach WhatsApp, aktywowanie się tylko po wywołaniu oraz utrzymywanie tego wątku oddzielnie od osobistej sesji wiadomości bezpośrednich.

<Note>
`agents.list[].groupChat.mentionPatterns` jest współdzielone z bramkowaniem wzmianek w pozostałych kanałach. W konfiguracjach wieloagentowych należy ustawić je osobno dla każdego agenta albo użyć `messages.groupChat.mentionPatterns` jako globalnej wartości rezerwowej. Jeśli nie ustawiono żadnej z tych opcji, wzorce są wyprowadzane z nazwy lub emoji tożsamości agenta.
</Note>

## Zachowanie

- Tryby aktywacji: `mention` (domyślny) lub `always`. `mention` wymaga wywołania: rzeczywistej wzmianki @ w WhatsApp (`mentionedJids`), skonfigurowanego wzorca wyrażenia regularnego, cyfr numeru E.164 bota w dowolnym miejscu tekstu albo cytowanej odpowiedzi na jedną z wiadomości bota (z wyjątkiem konfiguracji samodzielnego czatu ze współdzielonym numerem). `always` aktywuje agenta przy każdej wiadomości, ale wstrzyknięta instrukcja grupowa nakazuje mu odpowiadać tylko wtedy, gdy wnosi to wartość, a w przeciwnym razie zwracać dokładnie token ciszy `NO_REPLY` (bez rozróżniania wielkości liter). Wartości domyślne pochodzą z konfiguracji (`channels.whatsapp.groups` `requireMention`) i można je zastąpić dla poszczególnych grup za pomocą `/activation`.
- Lista dozwolonych grup: gdy ustawiono `channels.whatsapp.groups`, przyjmowane są tylko wymienione identyfikatory JID grup (należy uwzględnić `"*"`, aby zezwolić na wszystkie); wiadomości z grup spoza listy są odrzucane ze wskazówką w dzienniku.
- Zasady grup: `channels.whatsapp.groupPolicy` określa, czy wiadomości grupowe są akceptowane (`open|disabled|allowlist`). `allowlist` używa `channels.whatsapp.groupAllowFrom` (wartość rezerwowa: jawne `channels.whatsapp.allowFrom`). Wartością domyślną jest `allowlist` (zablokowane do czasu dodania nadawców).
- Sesje poszczególnych grup: klucze sesji mają postać `agent:<agentId>:whatsapp:group:<jid>` (konta inne niż domyślne dodają `:thread:whatsapp-account-<accountId>`), dlatego dyrektywy takie jak `/verbose on`, `/trace on` lub `/think high` (wysyłane jako samodzielne wiadomości) są ograniczone do danej grupy; stan osobistej sesji wiadomości bezpośrednich pozostaje nietknięty.
- Wstrzykiwanie kontekstu: **wyłącznie oczekujące** wiadomości grupowe (domyślnie 50), które _nie_ uruchomiły agenta, są poprzedzane nagłówkiem `[Chat messages since your last reply - for context]`, a wiersz wyzwalający znajduje się pod `[Current message - respond to this]`. Okno oczekujących wiadomości jest czyszczone po uruchomieniu; wiadomości znajdujące się już w sesji nie są ponownie wstrzykiwane.
- Przypisanie nadawcy: każdy wiersz grupowy zawiera etykietę nadawcy w kopercie wiadomości, np. `[WhatsApp <groupJid> <timestamp>] Alice (+447700900123): text`, a tożsamość nadawcy oraz temat i członkowie grupy są przekazywani w niezaufanym bloku metadanych konwersacji.
- Wiadomości efemeryczne/jednorazowe: opakowania są usuwane przed wyodrębnieniem tekstu i wzmianek, dlatego zawarte w nich wywołania nadal uruchamiają agenta.
- Systemowa instrukcja grupy: pierwsza tura sesji grupowej (oraz każda tura po zmianie trybu przez `/activation`) wstrzykuje do instrukcji systemowej wskazówki dotyczące aktywacji (`Activation: trigger-only ...` lub `Activation: always-on ...` oraz „zwracaj się do konkretnego nadawcy”). Zawsze uwzględniane są trwałe wskazówki dotyczące dostarczania wiadomości na czacie grupowym („Jesteś na czacie grupowym WhatsApp...”)

## Przykład konfiguracji (WhatsApp)

Zapewnij działanie wywołań przy użyciu nazwy wyświetlanej, nawet jeśli WhatsApp usuwa widoczny znak `@` z treści tekstowej:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
      historyLimit: 50, // okno kontekstu oczekujących wiadomości grupowych (domyślnie 50)
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Uwagi:

- Wyrażenia regularne nie rozróżniają wielkości liter i korzystają z tych samych zabezpieczeń bezpiecznych wyrażeń regularnych co pozostałe miejsca konfiguracji używające wyrażeń regularnych; nieprawidłowe wzorce i niebezpieczne zagnieżdżone powtórzenia są ignorowane.
- WhatsApp nadal wysyła kanoniczne wzmianki za pośrednictwem `mentionedJids`, gdy ktoś dotknie kontaktu, dlatego wartość rezerwowa oparta na numerze jest rzadko potrzebna, ale stanowi przydatne zabezpieczenie.
- Okno oczekującego kontekstu jest ustalane w kolejności `channels.whatsapp.accounts.<id>.historyLimit` → `channels.whatsapp.historyLimit` → `messages.groupChat.historyLimit` → 50.

### Polecenie aktywacji (tylko właściciel)

Należy użyć polecenia czatu grupowego:

- `/activation mention`
- `/activation always`

Może to zmienić wyłącznie numer właściciela (z `channels.whatsapp.allowFrom` albo własny numer E.164 bota, jeśli ta opcja nie jest ustawiona); `/activation` wysłane przez kogokolwiek innego jest ignorowane i zapisywane wyłącznie jako kontekst. Aby wyświetlić bieżący tryb aktywacji, należy wysłać `/status` jako samodzielną wiadomość w grupie.

## Sposób użycia

1. Dodaj konto WhatsApp (to, na którym działa OpenClaw) do grupy.
2. Napisz `@openclaw ...` (lub uwzględnij numer). Tylko nadawcy z listy dozwolonych mogą wywołać agenta, chyba że ustawiono `groupPolicy: "open"`.
3. Instrukcja agenta zawiera oczekujący kontekst grupowy oraz wiersze z etykietami nadawców, dzięki czemu agent może zwrócić się do właściwej osoby.
4. Dyrektywy sesji (`/verbose on`, `/trace on`, `/think high`, `/new` lub `/reset`, `/compact`) dotyczą wyłącznie sesji danej grupy; należy wysyłać je jako samodzielne wiadomości, aby zostały zarejestrowane. Osobista sesja wiadomości bezpośrednich pozostaje niezależna.

## Testowanie / weryfikacja

- Ręczny test podstawowy:
  - Wyślij wywołanie `@openclaw` w grupie i potwierdź otrzymanie odpowiedzi odwołującej się do nazwy nadawcy.
  - Wyślij drugie wywołanie i sprawdź, czy uwzględniono blok historii, a następnie czy został on wyczyszczony w kolejnej turze.
- Sprawdź dzienniki Gateway (uruchamiając z `--verbose`) pod kątem wpisów `inbound web message` zawierających `from: <groupJid>` oraz treść z etykietą nadawcy.

## Znane kwestie

- Heartbeat działa w głównej sesji agenta; sesje grupowe nigdy nie otrzymują uruchomień Heartbeat.
- Mechanizm pomijania echa zapamiętuje połączoną instrukcję (historię i bieżącą wiadomość) dla każdej sesji, aby dostarczone wiadomości własne bota nie wyzwalały go ponownie; identyczna powtórzona partia może zostać pominięta jako echo.
- Wpisy magazynu sesji mają postać `agent:<agentId>:whatsapp:group:<jid>` w magazynie sesji SQLite poszczególnych agentów; brak wpisu oznacza jedynie, że grupa nie wyzwoliła jeszcze uruchomienia.
- Wskaźniki pisania są zgodne z `session.typingMode` / `agents.defaults.typingMode`. Gdy dla widocznych odpowiedzi włączono tryb korzystający wyłącznie z narzędzia wiadomości, pisanie domyślnie rozpoczyna się natychmiast, dzięki czemu członkowie grupy widzą, że agent pracuje, nawet jeśli nie zostanie opublikowana automatyczna odpowiedź końcowa. Jawna konfiguracja trybu pisania nadal ma pierwszeństwo.

## Powiązane

- [Grupy](/pl/channels/groups)
- [Trasowanie kanałów](/pl/channels/channel-routing)
- [Grupy rozgłoszeniowe](/pl/channels/broadcast-groups)
