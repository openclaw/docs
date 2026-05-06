---
read_when:
    - Chcesz wyszukać identyfikatory kontaktów/grup/własne dla kanału
    - Tworzysz adapter katalogu kanałów
summary: Dokumentacja referencyjna CLI dla `openclaw directory` (siebie, równorzędnych, grup)
title: Katalog
x-i18n:
    generated_at: "2026-05-06T17:52:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 855f9312790134f2d1da53ffbb106167c190155510a7bdef212b5d38c2fba0b3
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Wyszukiwania w katalogu dla kanałów, które je obsługują (kontakty/uczestnicy, grupy i „ja”).

## Wspólne flagi

- `--channel <name>`: identyfikator/alias kanału (wymagane, gdy skonfigurowano wiele kanałów; automatyczne, gdy skonfigurowano tylko jeden)
- `--account <id>`: identyfikator konta (domyślnie: domyślne konto kanału)
- `--json`: wyjście JSON

## Uwagi

- `directory` ma pomóc znaleźć identyfikatory, które można wkleić do innych poleceń (zwłaszcza `openclaw message send --target ...`).
- Dla wielu kanałów wyniki są oparte na konfiguracji (listy dozwolonych / skonfigurowane grupy), a nie na katalogu dostawcy na żywo.
- Zainstalowane pluginy kanałów nadal mogą nie obsługiwać katalogu; w takim przypadku polecenie zgłasza nieobsługiwaną operację katalogu zamiast ponownie instalować plugin.
- Domyślnym wyjściem jest `id` (a czasem `name`) oddzielone tabulatorem; użyj `--json` do skryptów.

## Używanie wyników z `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formaty identyfikatorów (według kanału)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (grupa), `120363123456789@newsletter` (docelowy adres wychodzący kanału/newslettera)
- Telegram: `@username` lub numeryczny identyfikator czatu; grupy mają identyfikatory numeryczne
- Slack: `user:U…` i `channel:C…`
- Discord: `user:<id>` i `channel:<id>`
- Matrix (plugin): `user:@user:server`, `room:!roomId:server` lub `#alias:server`
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
