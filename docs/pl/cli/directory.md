---
read_when:
    - Chcesz wyszukać identyfikatory kontaktów/grup/siebie dla kanału
    - Tworzysz adapter katalogu kanału
summary: Dokumentacja CLI dla `openclaw directory` (self, peers, groups)
title: directory
x-i18n:
    generated_at: "2026-04-05T13:48:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a81a037e0a33f77c24b1adabbc4be16ed4d03c419873f3cbdd63f2ce84a1064
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

Wyszukiwanie w katalogu dla kanałów, które to obsługują (kontakty/peerzy, grupy i „ja”).

## Typowe flagi

- `--channel <name>`: identyfikator/alias kanału (wymagane, gdy skonfigurowano wiele kanałów; automatyczne, gdy skonfigurowano tylko jeden)
- `--account <id>`: identyfikator konta (domyślnie: domyślne konto kanału)
- `--json`: wyjście JSON

## Uwagi

- `directory` ma pomagać w znajdowaniu identyfikatorów, które można wkleić do innych poleceń (zwłaszcza `openclaw message send --target ...`).
- Dla wielu kanałów wyniki są oparte na konfiguracji (allowlisty / skonfigurowane grupy), a nie na katalogu dostawcy na żywo.
- Domyślne wyjście to `id` (a czasem `name`) oddzielone tabulatorem; do skryptów używaj `--json`.

## Używanie wyników z `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formaty identyfikatorów (według kanału)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (grupa)
- Telegram: `@username` lub numeryczny identyfikator czatu; grupy to identyfikatory numeryczne
- Slack: `user:U…` i `channel:C…`
- Discord: `user:<id>` i `channel:<id>`
- Matrix (plugin): `user:@user:server`, `room:!roomId:server` lub `#alias:server`
- Microsoft Teams (plugin): `user:<id>` i `conversation:<id>`
- Zalo (plugin): identyfikator użytkownika (Bot API)
- Zalo Personal / `zalouser` (plugin): identyfikator wątku (DM/grupa) z `zca` (`me`, `friend list`, `group list`)

## Self ("me")

```bash
openclaw directory self --channel zalouser
```

## Peers (kontakty/użytkownicy)

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
