---
read_when:
    - Chcesz wyszukać identyfikatory kontaktów, grup lub własny identyfikator dla kanału
    - Tworzysz adapter katalogu kanałów
summary: Dokumentacja CLI dla `openclaw directory` (własny, równorzędne, grupy)
title: Katalog
x-i18n:
    generated_at: "2026-07-12T15:00:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Wyszukiwanie w katalogach kanałów, które je obsługują: kontakty/partnerzy, grupy i „ja” (własna tożsamość).

Wyniki są przeznaczone do wklejania w innych poleceniach, zwłaszcza `openclaw message send --target ...`.

## Wspólne flagi

- `--channel <name>`: identyfikator/alias kanału (wymagany, gdy skonfigurowano wiele kanałów; wybierany automatycznie, gdy skonfigurowano tylko jeden)
- `--account <id>`: identyfikator konta (domyślnie: konto domyślne kanału)
- `--json`: wyświetla dane w formacie JSON

Domyślne dane wyjściowe (inne niż JSON) to `id` (a czasami `name`) rozdzielone tabulatorem.

## Uwagi

- W przypadku wielu kanałów wyniki pochodzą z konfiguracji (list dozwolonych elementów / skonfigurowanych grup), a nie z bieżącego katalogu dostawcy.
- Już zainstalowany Plugin kanału może nie obsługiwać katalogu. W takim przypadku polecenie zgłasza nieobsługiwaną operację; nie próbuje ponownie instalować ani uaktualniać Pluginu w celu dodania obsługi.

## Używanie wyników z poleceniem `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Formaty identyfikatorów według kanałów

| Kanał                               | Format identyfikatora celu                                                                                                  |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567` (wiadomość prywatna), `1234567890-1234567890@g.us` (grupa), `120363123456789@newsletter` (kanał/biuletyn, tylko wiadomości wychodzące) |
| Signal                              | Skonfigurowane aliasy wskazują cele wiadomości prywatnych w formacie E.164/UUID lub cele grupowe `group:<id>`                |
| Telegram                            | `@username` lub numeryczny identyfikator czatu; grupy używają identyfikatorów numerycznych                                   |
| Slack                               | `user:U…` i `channel:C…`                                                                                                    |
| Discord                             | `user:<id>` i `channel:<id>`                                                                                                |
| Matrix (Plugin)                     | `user:@user:server`, `room:!roomId:server` lub `#alias:server`                                                               |
| Microsoft Teams (Plugin)            | `user:<id>` i `conversation:<id>`                                                                                           |
| Zalo (Plugin)                       | Identyfikator użytkownika (Bot API)                                                                                          |
| Zalo Personal / `zalouser` (Plugin) | Identyfikator wątku (wiadomość prywatna/grupa) z `zca` (`me`, `friend list`, `group list`)                                   |

## Własna tożsamość („ja”)

```bash
openclaw directory self --channel zalouser
```

## Kontakty (kontakty/użytkownicy)

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

## Powiązane materiały

- [Dokumentacja CLI](/pl/cli)
