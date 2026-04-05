---
read_when:
    - Dodawanie lub modyfikowanie działań CLI wiadomości
    - Zmiana zachowania kanałów wychodzących
summary: Dokumentacja CLI dla `openclaw message` (wysyłanie + działania kanałów)
title: message
x-i18n:
    generated_at: "2026-04-05T13:49:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: b70f36189d028d59db25cd8b39d7c67883eaea71bea2358ee6314eec6cd2fa51
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

Pojedyncze polecenie wychodzące do wysyłania wiadomości i działań kanałów
(Discord/Google Chat/iMessage/Matrix/Mattermost (plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Użycie

```
openclaw message <subcommand> [flags]
```

Wybór kanału:

- `--channel` jest wymagane, jeśli skonfigurowano więcej niż jeden kanał.
- Jeśli skonfigurowano dokładnie jeden kanał, staje się on domyślny.
- Wartości: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost wymaga plugin)

Formaty celu (`--target`):

- WhatsApp: E.164 lub grupowy JID
- Telegram: identyfikator czatu lub `@username`
- Discord: `channel:<id>` lub `user:<id>` (albo wzmianka `<@id>`; nieprzetworzone identyfikatory numeryczne są traktowane jako kanały)
- Google Chat: `spaces/<spaceId>` lub `users/<userId>`
- Slack: `channel:<id>` lub `user:<id>` (nieprzetworzony identyfikator kanału jest akceptowany)
- Mattermost (plugin): `channel:<id>`, `user:<id>` lub `@username` (same identyfikatory są traktowane jako kanały)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` lub `username:<name>`/`u:<name>`
- iMessage: uchwyt, `chat_id:<id>`, `chat_guid:<guid>` lub `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` lub `#alias:server`
- Microsoft Teams: identyfikator konwersacji (`19:...@thread.tacv2`) albo `conversation:<id>` lub `user:<aad-object-id>`

Wyszukiwanie nazw:

- W przypadku obsługiwanych dostawców (Discord/Slack/itd.) nazwy kanałów, takie jak `Help` lub `#help`, są rozwiązywane przez pamięć podręczną katalogu.
- Przy braku trafienia w pamięci podręcznej OpenClaw spróbuje wykonać wyszukiwanie katalogu na żywo, jeśli dostawca to obsługuje.

## Wspólne flagi

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (docelowy kanał lub użytkownik dla send/poll/read/itd.)
- `--targets <name>` (powtarzalne; tylko broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## Zachowanie SecretRef

- `openclaw message` rozwiązuje obsługiwane kanałowe SecretRef przed uruchomieniem wybranego działania.
- Rozwiązywanie jest ograniczane do aktywnego celu działania, gdy to możliwe:
  - w zakresie kanału, gdy ustawiono `--channel` (lub wywnioskowano z prefiksowanych celów, takich jak `discord:...`)
  - w zakresie konta, gdy ustawiono `--account` (globalne ustawienia kanału + powierzchnie wybranego konta)
  - gdy pominięto `--account`, OpenClaw nie wymusza zakresu SecretRef konta `default`
- Nierozwiązane SecretRef w niepowiązanych kanałach nie blokują ukierunkowanego działania wiadomości.
- Jeśli SecretRef wybranego kanału/konta nie zostanie rozwiązany, polecenie kończy się niepowodzeniem w trybie fail-closed dla tego działania.

## Działania

### Podstawowe

- `send`
  - Kanały: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Wymagane: `--target`, oraz `--message` lub `--media`
  - Opcjonalne: `--media`, `--interactive`, `--buttons`, `--components`, `--card`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Wspólne ładunki interaktywne: `--interactive` wysyła natywny dla kanału interaktywny ładunek JSON, gdy jest obsługiwany
  - Tylko Telegram: `--buttons` (wymaga `channels.telegram.capabilities.inlineButtons`, aby było dozwolone)
  - Tylko Telegram: `--force-document` (wysyłanie obrazów i GIF-ów jako dokumentów, aby uniknąć kompresji Telegrama)
  - Tylko Telegram: `--thread-id` (identyfikator tematu forum)
  - Tylko Slack: `--thread-id` (znacznik czasu wątku; `--reply-to` używa tego samego pola)
  - Tylko Discord: ładunek JSON `--components`
  - Kanały z kartami adaptacyjnymi: ładunek JSON `--card`, gdy jest obsługiwany
  - Telegram + Discord: `--silent`
  - Tylko WhatsApp: `--gif-playback`

- `poll`
  - Kanały: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Wymagane: `--target`, `--poll-question`, `--poll-option` (powtarzalne)
  - Opcjonalne: `--poll-multi`
  - Tylko Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Tylko Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Kanały: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Wymagane: `--message-id`, `--target`
  - Opcjonalne: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Uwaga: `--remove` wymaga `--emoji` (pomiń `--emoji`, aby wyczyścić własne reakcje tam, gdzie jest to obsługiwane; zobacz /tools/reactions)
  - Tylko WhatsApp: `--participant`, `--from-me`
  - Reakcje w grupach Signal: wymagane `--target-author` lub `--target-author-uuid`

- `reactions`
  - Kanały: Discord/Google Chat/Slack/Matrix
  - Wymagane: `--message-id`, `--target`
  - Opcjonalne: `--limit`

- `read`
  - Kanały: Discord/Slack/Matrix
  - Wymagane: `--target`
  - Opcjonalne: `--limit`, `--before`, `--after`
  - Tylko Discord: `--around`

- `edit`
  - Kanały: Discord/Slack/Matrix
  - Wymagane: `--message-id`, `--message`, `--target`

- `delete`
  - Kanały: Discord/Slack/Telegram/Matrix
  - Wymagane: `--message-id`, `--target`

- `pin` / `unpin`
  - Kanały: Discord/Slack/Matrix
  - Wymagane: `--message-id`, `--target`

- `pins` (lista)
  - Kanały: Discord/Slack/Matrix
  - Wymagane: `--target`

- `permissions`
  - Kanały: Discord/Matrix
  - Wymagane: `--target`
  - Tylko Matrix: dostępne, gdy szyfrowanie Matrix jest włączone i działania weryfikacyjne są dozwolone

- `search`
  - Kanały: Discord
  - Wymagane: `--guild-id`, `--query`
  - Opcjonalne: `--channel-id`, `--channel-ids` (powtarzalne), `--author-id`, `--author-ids` (powtarzalne), `--limit`

### Wątki

- `thread create`
  - Kanały: Discord
  - Wymagane: `--thread-name`, `--target` (identyfikator kanału)
  - Opcjonalne: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Kanały: Discord
  - Wymagane: `--guild-id`
  - Opcjonalne: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Kanały: Discord
  - Wymagane: `--target` (identyfikator wątku), `--message`
  - Opcjonalne: `--media`, `--reply-to`

### Emoji

- `emoji list`
  - Discord: `--guild-id`
  - Slack: bez dodatkowych flag

- `emoji upload`
  - Kanały: Discord
  - Wymagane: `--guild-id`, `--emoji-name`, `--media`
  - Opcjonalne: `--role-ids` (powtarzalne)

### Naklejki

- `sticker send`
  - Kanały: Discord
  - Wymagane: `--target`, `--sticker-id` (powtarzalne)
  - Opcjonalne: `--message`

- `sticker upload`
  - Kanały: Discord
  - Wymagane: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Role / Kanały / Członkowie / Głos

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` dla Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Wydarzenia

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - Opcjonalne: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderacja (Discord)

- `timeout`: `--guild-id`, `--user-id` (opcjonalnie `--duration-min` lub `--until`; pomiń oba, aby wyczyścić timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` obsługuje także `--reason`

### Broadcast

- `broadcast`
  - Kanały: dowolny skonfigurowany kanał; użyj `--channel all`, aby kierować do wszystkich dostawców
  - Wymagane: `--targets <target...>`
  - Opcjonalne: `--message`, `--media`, `--dry-run`

## Przykłady

Wyślij odpowiedź na Discordzie:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Wyślij wiadomość na Discordzie z komponentami:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --components '{"text":"Choose a path","blocks":[{"type":"actions","buttons":[{"label":"Approve","style":"success"},{"label":"Decline","style":"danger"}]}]}'
```

Zobacz [Komponenty Discord](/pl/channels/discord#interactive-components), aby poznać pełny schemat.

Wyślij wspólny ładunek interaktywny:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --interactive '{"text":"Choose a path","blocks":[{"type":"actions","buttons":[{"label":"Approve"},{"label":"Decline"}]}]}'
```

Utwórz ankietę na Discordzie:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Utwórz ankietę w Telegramie (automatyczne zamknięcie po 2 minutach):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Wyślij proaktywną wiadomość w Teams:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Utwórz ankietę w Teams:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Dodaj reakcję w Slacku:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Dodaj reakcję w grupie Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Wyślij przyciski inline w Telegramie:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --buttons '[ [{"text":"Yes","callback_data":"cmd:yes"}], [{"text":"No","callback_data":"cmd:no"}] ]'
```

Wyślij kartę adaptacyjną Teams:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Status update"}]}'
```

Wyślij obraz w Telegramie jako dokument, aby uniknąć kompresji:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```
