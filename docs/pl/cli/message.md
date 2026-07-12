---
read_when:
    - Dodawanie lub modyfikowanie akcji CLI wiadomości
    - Zmiana zachowania kanału wychodzącego
summary: Dokumentacja CLI dla `openclaw message` (wysyłanie i działania kanału)
title: Wiadomość
x-i18n:
    generated_at: "2026-07-12T14:55:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2d1cca9be7cfa7625cac3e440ecb5847d9fab9c545c9267a41a2f99c26c514b
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Jedno polecenie wychodzące do wysyłania wiadomości i wykonywania działań kanałów w
Discord, Google Chat, iMessage, Matrix, Mattermost (plugin), Microsoft Teams,
Signal, Slack, Telegram i WhatsApp.

```bash
openclaw message <subcommand> [flags]
```

## Wybór kanału

- `--channel <name>` jest wymagane, jeśli skonfigurowano więcej niż jeden kanał;
  jeśli skonfigurowano dokładnie jeden kanał, jest on kanałem domyślnym.
- Wartości: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  (Mattermost wymaga pluginu).
- Cele z prefiksem kanału (na przykład `discord:channel:123`) wskazują
  plugin będący właścicielem bez jawnego podawania `--channel`.

## Formaty celu (`-t, --target`)

| Kanał               | Format                                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Discord             | `channel:<id>`, `user:<id>`, wzmianka `<@id>` lub sam identyfikator liczbowy (traktowany jako identyfikator kanału)   |
| Google Chat         | `spaces/<spaceId>` lub `users/<userId>`                                                                                |
| iMessage            | uchwyt, `chat_id:<id>`, `chat_guid:<guid>` lub `chat_identifier:<id>`                                                  |
| Mattermost (plugin) | `channel:<id>`, `user:<id>`, `@username` lub sam identyfikator (traktowany jako kanał)                                 |
| Matrix              | `@user:server`, `!room:server` lub `#alias:server`                                                                      |
| Microsoft Teams     | `conversation:<id>` (`19:...@thread.tacv2`), sam identyfikator konwersacji lub `user:<aad-object-id>`                  |
| Signal              | `+E.164`, `group:<id>`, `uuid:<id>`, `username:<name>`/`u:<name>` lub dowolna z tych wartości z prefiksem `signal:`   |
| Slack               | `channel:<id>` lub `user:<id>` (sam identyfikator jest traktowany jako kanał)                                          |
| Telegram            | identyfikator czatu, `@username` lub cel tematu forum: `<chatId>:topic:<topicId>` (albo `--thread-id <topicId>`)       |
| WhatsApp            | E.164, JID grupy (`...@g.us`) lub JID kanału/newslettera (`...@newsletter`)                                            |

Wyszukiwanie nazw kanałów: w przypadku dostawców z katalogiem (Discord/Slack/itp.)
nazwy takie jak `Help` lub `#help` są rozwiązywane za pomocą pamięci podręcznej
katalogu, a w razie braku wpisu w pamięci podręcznej wykonywane jest wyszukiwanie
w aktywnym katalogu, jeśli dostawca je obsługuje.

## Wspólne flagi

Każde działanie akceptuje: `--channel <name>`, `--account <id>`, `--json`,
`--dry-run`, `--verbose`. Działania wymagające miejsca docelowego akceptują również
`-t, --target <dest>`.

## Rozwiązywanie SecretRef

`openclaw message` rozwiązuje odwołania SecretRef kanałów przed wykonaniem działania,
z możliwie najwęższym zakresem:

- zakres kanału, gdy ustawiono `--channel` (lub wywnioskowano go z celu z prefiksem)
- zakres konta, gdy ustawiono również `--account`
- wszystkie skonfigurowane kanały, gdy nie ustawiono żadnej z tych opcji

Nierozwiązane odwołania SecretRef w niepowiązanych kanałach nigdy nie blokują
działania skierowanego do konkretnego celu; nierozwiązane odwołanie SecretRef
w wybranym kanale lub koncie powoduje bezpieczne przerwanie działania.

## Działania

### Podstawowe

| Działanie       | Kanały                                                                                                          | Wymagane                                                       | Uwagi                                                                                                                                                                                                                                                                                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `send`          | Discord, Google Chat, iMessage, Matrix, Mattermost (plugin), Microsoft Teams, Signal, Slack, Telegram, WhatsApp | `--target` oraz jedno z `--message`/`--media`/`--presentation` | Zobacz [Wysyłanie](#send) poniżej.                                                                                                                                                                                                                                                                                                                                     |
| `poll`          | Discord, Matrix, Microsoft Teams, Telegram, WhatsApp                                                            | `--target`, `--poll-question`, `--poll-option` (wielokrotnie)  | Zobacz [Ankieta](#poll) poniżej.                                                                                                                                                                                                                                                                                                                                       |
| `react`         | Discord, Matrix, Nextcloud Talk, Signal, Slack, Telegram, WhatsApp                                              | `--message-id`, `--target`                                     | `--emoji`, `--remove` (wymaga `--emoji`; pomiń tę opcję, aby usunąć własne reakcje tam, gdzie jest to obsługiwane; zobacz [Reakcje](/pl/tools/reactions)). WhatsApp: `--participant`, `--from-me`. Reakcje w grupach Signal wymagają `--target-author` lub `--target-author-uuid`. Nextcloud Talk pozwala tylko dodawać reakcje; `--remove` powoduje błąd. |
| `reactions`     | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `--limit`.                                                                                                                                                                                                                                                                                                                                                            |
| `read`          | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`, `--message-id`, `--before`, `--after`. Discord: `--around`, `--include-thread`. Slack: `--message-id` odczytuje konkretny znacznik czasu; połącz z `--thread-id`, aby odczytać dokładną odpowiedź w wątku.                                                                                                                                                       |
| `edit`          | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--message`, `--target`                        | Wątki forum Telegram używają `--thread-id`.                                                                                                                                                                                                                                                                                                                           |
| `delete`        | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--target`                                     |                                                                                                                                                                                                                                                                                                                                                                       |
| `pin` / `unpin` | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `unpin` akceptuje również `--pinned-message-id` (Microsoft Teams: identyfikator zasobu przypięcia/listy przypięć, a nie identyfikator wiadomości czatu).                                                                                                                                                                                                                |
| `pins` (lista)  | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`.                                                                                                                                                                                                                                                                                                                                                            |
| `permissions`   | Discord, Matrix                                                                                                 | `--target`                                                     | Matrix: dostępne tylko wtedy, gdy szyfrowanie jest włączone i działania weryfikacyjne są dozwolone.                                                                                                                                                                                                                                                                   |
| `search`        | Discord                                                                                                         | `--guild-id`, `--query`                                        | `--channel-id`, `--channel-ids` (wielokrotnie), `--author-id`, `--author-ids` (wielokrotnie), `--limit`.                                                                                                                                                                                                                                                              |
| `member info`   | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--user-id`                                                    | `--guild-id` (Discord).                                                                                                                                                                                                                                                                                                                                               |

### Wysyłanie

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`: dołącza obraz, plik audio, film lub dokument (ścieżkę
  lokalną albo URL).
- `--presentation <json>`: współdzielony ładunek z blokami `text`, `context`,
  `divider`, `chart`, `table`, `buttons` i `select`, renderowany zgodnie
  z możliwościami kanału. Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation).
- `--delivery <json>`: ogólne preferencje dostarczania, na przykład `{"pin":
true}`. `--pin` jest skrótem dla przypiętego dostarczenia, jeśli kanał je
  obsługuje.
- `--reply-to <id>`, `--thread-id <id>` (temat forum Telegram; znacznik czasu
  wątku Slack, to samo pole co `--reply-to`).
- `--force-document` (Telegram, WhatsApp): wysyła obrazy, pliki GIF i filmy jako
  dokumenty, aby uniknąć kompresji kanału.
- `--silent` (Telegram, Discord): wysyła bez powiadomienia.
- `--gif-playback` (tylko WhatsApp): traktuje materiał wideo jako odtwarzany plik GIF.

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Slack renderuje obsługiwane bloki wykresów natywnie; pozostałe kanały otrzymują
te same dane w postaci czytelnego tekstu:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"blocks":[{"type":"chart","chartType":"bar","title":"Quarterly revenue","categories":["Q1","Q2"],"series":[{"name":"Revenue","values":[120,145]}],"xLabel":"Quarter"}]}'
```

Slack renderuje również natywnie jawne bloki tabel. Inne kanały otrzymują
podpis i każdy wiersz jako deterministyczny tekst:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"title":"Pipeline report","blocks":[{"type":"table","caption":"Open pipeline","headers":["Account","Stage","ARR"],"rows":[["Acme","Won",125000],["Globex","Review",82000]],"rowHeaderColumnIndex":0}]}'
```

Przyciski Mini App w Telegramie używają `webApp` (`web_app` jest nadal
obsługiwane podczas analizy starszego formatu JSON) i są renderowane wyłącznie
w prywatnych czatach między użytkownikiem a botem:

```bash
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

### Ankieta

```bash
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

- `--poll-option <choice>`: powtórz od 2 do 12 razy.
- `--poll-multi`: zezwala na wybór wielu opcji.
- Discord: `--poll-duration-hours`, `--silent`, `--message`.
- Telegram: `--poll-duration-seconds <n>` (5–600), `--silent`,
  `--poll-anonymous` / `--poll-public`, `--thread-id`.

```bash
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

```bash
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

### Wątki

- `thread create`: kanały Discord. Wymagane: `--thread-name`, `--target`
  (identyfikator kanału). Opcjonalne: `--message-id`, `--message`, `--auto-archive-min`.
- `thread list`: kanały Discord. Wymagane: `--guild-id`. Opcjonalne:
  `--channel-id`, `--include-archived`, `--before`, `--limit`.
- `thread reply`: kanały Discord. Wymagane: `--target` (identyfikator wątku),
  `--message`. Opcjonalne: `--media`, `--reply-to`.

### Emoji

- `emoji list`: Discord (`--guild-id`), Slack (bez dodatkowych flag).
- `emoji upload`: Discord. Wymagane: `--guild-id`, `--emoji-name`, `--media`.
  Opcjonalne: `--role-ids` (można powtarzać).

### Naklejki

- `sticker send`: Discord. Wymagane: `--target`, `--sticker-id` (można powtarzać).
  Opcjonalne: `--message`.
- `sticker upload`: Discord. Wymagane: `--guild-id`, `--sticker-name`,
  `--sticker-desc`, `--sticker-tags`, `--media`.

### Role, kanały, komunikacja głosowa i wydarzenia (Discord)

- `role info`: `--guild-id`.
- `role add` / `role remove`: `--guild-id`, `--user-id`, `--role-id`.
- `channel info`: `--target`.
- `channel list`: `--guild-id`.
- `voice status`: `--guild-id`, `--user-id`.
- `event list`: `--guild-id`.
- `event create`: wymagane `--guild-id`, `--event-name`, `--start-time`;
  opcjonalne `--end-time`, `--desc`, `--channel-id`, `--location`,
  `--event-type`, `--image <url-or-path>`.

### Moderacja (Discord)

- `timeout`: `--guild-id`, `--user-id`; opcjonalne `--duration-min` lub
  `--until` (pomiń oba, aby usunąć ograniczenie czasowe), `--reason`.
- `kick`: `--guild-id`, `--user-id`, `--reason`.
- `ban`: `--guild-id`, `--user-id`, `--delete-days`, `--reason`.

### Rozsyłanie

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

Wysyła jeden ładunek do wielu celów. Opcja `--targets` przyjmuje listę
rozdzieloną spacjami. Użyj `--channel all`, aby objąć każdy skonfigurowany
moduł dostawcy.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Wysyłanie przez agenta](/pl/tools/agent-send)
- [Prezentacja wiadomości](/pl/plugins/message-presentation)
