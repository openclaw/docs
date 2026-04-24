---
read_when:
    - Chcesz wyszukać kontakty/grupy/własne identyfikatory dla kanału
    - Tworzysz adapter katalogu kanału
summary: Dokumentacja CLI dla `openclaw directory` (self, peers, groups)
title: Katalog
x-i18n:
    generated_at: "2026-04-24T09:02:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: f63ed92469738501ae1f8f08aec3edf01d1f0f46008571ed38ccd9c77e5ba15e
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

Wyszukiwanie katalogowe dla kanałów, które to obsługują (kontakty/peerzy, grupy i „ja”).

## Typowe flagi

- `--channel <name>`: identyfikator/alias kanału (wymagane, gdy skonfigurowano wiele kanałów; automatycznie, gdy skonfigurowano tylko jeden)
- `--account <id>`: identyfikator konta (domyślnie: domyślne konto kanału)
- `--json`: wyjście JSON

## Uwagi

- `directory` ma pomóc znaleźć identyfikatory, które można wkleić do innych poleceń (szczególnie `openclaw message send --target ...`).
- W przypadku wielu kanałów wyniki pochodzą z konfiguracji (allowlisty / skonfigurowane grupy), a nie z katalogu dostawcy na żywo.
- Domyślne wyjście to `id` (a czasem `name`) oddzielone tabulatorem; do skryptów używaj `--json`.

## Używanie wyników z `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formaty identyfikatorów (według kanału)

- WhatsApp: `+15551234567` (wiadomość prywatna), `1234567890-1234567890@g.us` (grupa)
- Telegram: `@username` lub numeryczny identyfikator czatu; grupy mają identyfikatory numeryczne
- Slack: `user:U…` i `channel:C…`
- Discord: `user:<id>` i `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` lub `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` i `conversation:<id>`
- Zalo (Plugin): identyfikator użytkownika (Bot API)
- Zalo Personal / `zalouser` (Plugin): identyfikator wątku (wiadomość prywatna/grupa) z `zca` (`me`, `friend list`, `group list`)

## Ja ("me")

```bash
openclaw directory self --channel zalouser
```

## Peerzy (kontakty/użytkownicy)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## Grupy

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
