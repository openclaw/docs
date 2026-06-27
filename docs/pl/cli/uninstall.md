---
read_when:
    - Chcesz usunąć usługę Gateway i/lub stan lokalny
    - Chcesz najpierw próbę na sucho
summary: Dokumentacja referencyjna CLI dla `openclaw uninstall` (usuń usługę Gateway + dane lokalne)
title: Odinstalowanie
x-i18n:
    generated_at: "2026-06-27T17:24:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f90fa8cf513e2e8cd422c3b8a880e7fd20fb71131a3ec88260e765daa2ace543
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Odinstaluj usługę Gateway + dane lokalne (CLI pozostaje).

Opcje:

- `--service`: usuń usługę Gateway
- `--state`: usuń stan i konfigurację
- `--workspace`: usuń katalogi przestrzeni roboczych
- `--app`: usuń aplikację macOS
- `--all`: usuń usługę, stan, przestrzeń roboczą i aplikację
- `--yes`: pomiń prośby o potwierdzenie
- `--non-interactive`: wyłącz monity; wymaga `--yes`
- `--dry-run`: wypisz działania bez usuwania plików

Przykłady:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

Uwagi:

- Najpierw uruchom `openclaw backup create`, jeśli chcesz mieć możliwą do przywrócenia migawkę przed usunięciem stanu lub przestrzeni roboczych.
- `--state` zachowuje skonfigurowane katalogi przestrzeni roboczych, chyba że wybrano też `--workspace`.
- `--all` to skrót do jednoczesnego usunięcia usługi, stanu, przestrzeni roboczej i aplikacji.
- `--non-interactive` wymaga `--yes`.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Odinstalowanie](/pl/install/uninstall)
