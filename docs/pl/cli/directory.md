---
read_when:
    - Chcesz odszukać identyfikatory kontaktów/grup/własne dla kanału
    - Tworzysz adapter katalogu kanałów
summary: Dokumentacja CLI dla `openclaw directory` (siebie, peerów, grup)
title: Katalog
x-i18n:
    generated_at: "2026-05-02T09:45:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcd0be284c0ec1aa347084d84f7001f1e2f47977ec5198025ba303297858aaab
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Wyszukiwanie w katalogu dla kanałów, które je obsługują (kontakty/peers, grupy oraz „me”).

## Wspólne flagi

- `--channel <name>`: identyfikator/alias kanału (wymagane, gdy skonfigurowano wiele kanałów; automatyczne, gdy skonfigurowano tylko jeden)
- `--account <id>`: identyfikator konta (domyślnie: domyślne konto kanału)
- `--json`: wyjście JSON

## Uwagi

- `directory` ma pomóc znaleźć identyfikatory, które można wkleić do innych poleceń (zwłaszcza `openclaw message send --target ...`).
- Dla wielu kanałów wyniki pochodzą z konfiguracji (listy dozwolonych / skonfigurowane grupy), a nie z katalogu dostawcy na żywo.
- Zainstalowane Pluginy kanałów nadal mogą pomijać obsługę katalogu; w takim przypadku polecenie zgłasza nieobsługiwaną operację katalogu zamiast ponownie instalować Plugin.
- Domyślne wyjście to `id` (a czasem `name`) oddzielone tabulatorem; użyj `--json` do skryptów.

## Używanie wyników z `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formaty ID (według kanału)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (grupa)
- Telegram: `@username` albo numeryczny identyfikator czatu; grupy mają numeryczne identyfikatory
- Slack: `user:U…` i `channel:C…`
- Discord: `user:<id>` i `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` albo `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` i `conversation:<id>`
- Zalo (Plugin): identyfikator użytkownika (Bot API)
- Zalo Personal / `zalouser` (Plugin): identyfikator wątku (DM/grupa) z `zca` (`me`, `friend list`, `group list`)

## Własny użytkownik ("me")

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

## Powiązane

- [Dokumentacja CLI](/pl/cli)
