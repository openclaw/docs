---
read_when:
    - Dodawanie lub modyfikowanie akcji CLI wiadomości
    - Zmiana zachowania kanału wychodzącego
summary: Dokumentacja referencyjna CLI dla `openclaw message` (wysyłanie + działania kanału)
title: Wiadomość
x-i18n:
    generated_at: "2026-06-27T17:21:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a8a716435313efa41a13ee5c6392eb2e4cfca2ede3e4690b157d26d077f7d56
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Pojedyncze polecenie wychodzące do wysyłania wiadomości i akcji kanałów
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Użycie

```
openclaw message <subcommand> [flags]
```

Wybór kanału:

- `--channel` jest wymagane, jeśli skonfigurowano więcej niż jeden kanał.
- Jeśli skonfigurowano dokładnie jeden kanał, staje się on domyślny.
- Wartości: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost wymaga Plugin)
- `openclaw message` rozwiązuje wybrany kanał do Pluginu, który jest jego właścicielem, gdy obecne jest `--channel` lub cel z prefiksem kanału; w przeciwnym razie ładuje skonfigurowane Pluginy kanałów w celu wywnioskowania kanału domyślnego.

Formaty celu (`--target`):

- WhatsApp: E.164, JID grupy albo JID kanału/newslettera WhatsApp (`...@newsletter`)
- Telegram: identyfikator czatu, `@username` albo cel tematu forum (`-1001234567890:topic:42` lub `--thread-id 42`)
- Discord: `channel:<id>` albo `user:<id>` (lub wzmianka `<@id>`; surowe identyfikatory numeryczne są traktowane jako kanały)
- Google Chat: `spaces/<spaceId>` albo `users/<userId>`
- Slack: `channel:<id>` albo `user:<id>` (surowy identyfikator kanału jest akceptowany)
- Mattermost (Plugin): `channel:<id>`, `user:<id>` albo `@username` (same identyfikatory są traktowane jako kanały)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>` albo `username:<name>`/`u:<name>`
- iMessage: uchwyt, `chat_id:<id>`, `chat_guid:<guid>` albo `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server` albo `#alias:server`
- Microsoft Teams: identyfikator konwersacji (`19:...@thread.tacv2`) albo `conversation:<id>` lub `user:<aad-object-id>`

Wyszukiwanie nazw:

- Dla obsługiwanych dostawców (Discord/Slack/itd.) nazwy kanałów, takie jak `Help` lub `#help`, są rozwiązywane przez pamięć podręczną katalogu.
- Przy chybieniu pamięci podręcznej OpenClaw spróbuje wykonać wyszukiwanie katalogu na żywo, jeśli dostawca je obsługuje.

## Typowe flagi

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (kanał docelowy lub użytkownik dla send/poll/read/itd.)
- `--targets <name>` (powtarzalne; tylko rozgłaszanie)
- `--json`
- `--dry-run`
- `--verbose`

## Zachowanie SecretRef

- `openclaw message` rozwiązuje obsługiwane SecretRefy kanałów przed uruchomieniem wybranej akcji.
- Rozwiązywanie jest ograniczone do aktywnego celu akcji, gdy to możliwe:
  - ograniczone do kanału, gdy ustawiono `--channel` (lub wywnioskowano go z celów z prefiksem, takich jak `discord:...`)
  - ograniczone do konta, gdy ustawiono `--account` (globalne powierzchnie kanału + wybrane powierzchnie konta)
  - gdy pominięto `--account`, OpenClaw nie wymusza zakresu SecretRef konta `default`
- Nierozwiązane SecretRefy w niepowiązanych kanałach nie blokują docelowej akcji wiadomości.
- Jeśli SecretRef wybranego kanału/konta jest nierozwiązany, polecenie kończy się zamknięciem dla tej akcji.

## Akcje

### Rdzeń

- `send`
  - Kanały: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Wymagane: `--target` oraz `--message`, `--media` lub `--presentation`
  - Opcjonalne: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Współdzielone ładunki prezentacji: `--presentation` wysyła bloki semantyczne (`text`, `context`, `divider`, `buttons`, `select`), które rdzeń renderuje przez zadeklarowane możliwości wybranego kanału. Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation).
  - Ogólne preferencje dostarczania: `--delivery` przyjmuje wskazówki dostarczania, takie jak `{ "pin": true }`; `--pin` jest skrótem dla przypiętego dostarczania, gdy kanał je obsługuje.
  - Telegram + WhatsApp: `--force-document` (wysyła obrazy, GIF-y i filmy jako dokumenty, aby uniknąć kompresji kanału)
  - Tylko Telegram: `--thread-id` (identyfikator tematu forum)
  - Tylko Slack: `--thread-id` (znacznik czasu wątku; `--reply-to` używa tego samego pola)
  - Telegram + Discord: `--silent`
  - Tylko WhatsApp: `--gif-playback`; kanały/newslettery WhatsApp są adresowane przy użyciu ich natywnego JID `@newsletter`.

- `poll`
  - Kanały: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Wymagane: `--target`, `--poll-question`, `--poll-option` (powtarzalne)
  - Opcjonalne: `--poll-multi`
  - Tylko Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Tylko Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Kanały: Discord/Google Chat/Matrix/Nextcloud Talk/Signal/Slack/Telegram/WhatsApp
  - Wymagane: `--message-id`, `--target`
  - Opcjonalne: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Uwaga: `--remove` wymaga `--emoji` (pomiń `--emoji`, aby wyczyścić własne reakcje tam, gdzie jest to obsługiwane; zobacz /tools/reactions)
  - Tylko WhatsApp: `--participant`, `--from-me`
  - Reakcje grup Signal: wymagane `--target-author` lub `--target-author-uuid`
  - Nextcloud Talk: tylko dodawanie reakcji; `--remove` jest odrzucane z jasnym błędem (zobacz /tools/reactions)

- `reactions`
  - Kanały: Discord/Google Chat/Slack/Matrix
  - Wymagane: `--message-id`, `--target`
  - Opcjonalne: `--limit`

- `read`
  - Kanały: Discord/Slack/Matrix
  - Wymagane: `--target`
  - Opcjonalne: `--limit`, `--message-id`, `--before`, `--after`
  - Tylko Slack: `--message-id` odczytuje konkretny znacznik czasu wiadomości Slack; połącz z `--thread-id`, aby odczytać dokładną odpowiedź w wątku.
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
  - Tylko Matrix: dostępne, gdy szyfrowanie Matrix jest włączone, a akcje weryfikacji są dozwolone

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
  - Slack: brak dodatkowych flag

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

### Zdarzenia

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - Opcjonalnie: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderacja (Discord)

- `timeout`: `--guild-id`, `--user-id` (opcjonalnie `--duration-min` lub `--until`; pomiń oba, aby wyczyścić timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` obsługuje także `--reason`

### Transmisja

- `broadcast`
  - Kanały: dowolny skonfigurowany kanał; użyj `--channel all`, aby skierować do wszystkich dostawców
  - Wymagane: `--targets <target...>`
  - Opcjonalnie: `--message`, `--media`, `--dry-run`

## Przykłady

Wyślij odpowiedź w Discord:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Wyślij wiadomość z przyciskami semantycznymi:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

Rdzeń renderuje ten sam ładunek `presentation` jako komponenty Discord, bloki Slack, przyciski inline Telegram, właściwości Mattermost albo karty Teams/Feishu, zależnie od możliwości kanału. Pełny kontrakt i reguły fallbacku znajdziesz w sekcji [Prezentacja wiadomości](/pl/plugins/message-presentation).

Wyślij bogatszy ładunek prezentacji:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Utwórz ankietę Discord:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Utwórz ankietę Telegram (automatyczne zamknięcie po 2 minutach):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Wyślij proaktywną wiadomość Teams:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Utwórz ankietę Teams:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Dodaj reakcję w Slack:

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

Wyślij przyciski inline Telegram przez ogólną prezentację:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Wyślij przycisk Telegram Mini App przez ogólną prezentację:

```
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

Przyciski aplikacji webowej Telegram są obsługiwane tylko w prywatnych czatach między użytkownikiem a
botem. Starsze ładunki JSON używające `web_app` nadal są parsowane, ale `webApp` jest
kanonicznym polem prezentacji.

Wyślij kartę Teams przez ogólną prezentację:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Wyślij obraz Telegram lub WhatsApp jako dokument, aby uniknąć kompresji:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Wysyłanie przez agenta](/pl/tools/agent-send)
