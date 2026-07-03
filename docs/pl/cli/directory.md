---
read_when:
    - Chcesz wyszukać identyfikatory kontaktów/grup/własne dla kanału
    - Opracowujesz adapter katalogu kanałów
summary: Dokumentacja CLI dla `openclaw directory` (ja, równorzędne instancje, grupy)
title: Katalog
x-i18n:
    generated_at: "2026-07-03T17:44:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d17f545ce0bbe23a6c1ba74e4d1b44b103cc985b52affe4b25fbc6a6d1121045
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Wyszukiwanie w katalogu dla kanałów, które je obsługują (kontakty/uczestnicy, grupy i „me”).

## Wspólne flagi

- `--channel <name>`: identyfikator/alias kanału (wymagany, gdy skonfigurowano wiele kanałów; automatyczny, gdy skonfigurowano tylko jeden)
- `--account <id>`: identyfikator konta (domyślnie: domyślne konto kanału)
- `--json`: wyjście JSON

## Uwagi

- `directory` ma pomóc znaleźć identyfikatory, które można wkleić do innych poleceń (zwłaszcza `openclaw message send --target ...`).
- Dla wielu kanałów wyniki są oparte na konfiguracji (listy dozwolonych elementów / skonfigurowane grupy), a nie na aktywnym katalogu dostawcy.
- Zainstalowane pluginy kanałów nadal mogą nie obsługiwać katalogu; w takim przypadku polecenie zgłasza nieobsługiwaną operację katalogu zamiast ponownie instalować plugin.
- Domyślne wyjście to `id` (a czasem `name`) oddzielone tabulatorem; użyj `--json` do skryptów.

## Używanie wyników z `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formaty identyfikatorów (według kanału)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (grupa), `120363123456789@newsletter` (docelowy adres wychodzący kanału/newslettera)
- Signal: skonfigurowane aliasy są rozwiązywane na docelowe DM w formacie E.164/UUID albo docelowe grupy `group:<id>`
- Telegram: `@username` albo numeryczny identyfikator czatu; grupy mają numeryczne identyfikatory
- Slack: `user:U…` i `channel:C…`
- Discord: `user:<id>` i `channel:<id>`
- Matrix (plugin): `user:@user:server`, `room:!roomId:server` albo `#alias:server`
- Microsoft Teams (plugin): `user:<id>` i `conversation:<id>`
- Zalo (plugin): identyfikator użytkownika (Bot API)
- Zalo Personal / `zalouser` (plugin): identyfikator wątku (DM/grupa) z `zca` (`me`, `friend list`, `group list`)

## Ja („me”)

```bash
openclaw directory self --channel zalouser
```

## Uczestnicy (kontakty/użytkownicy)

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
