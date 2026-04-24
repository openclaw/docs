---
read_when:
    - Chcesz usunąć usługę gateway i/lub stan lokalny
    - Najpierw chcesz wykonać symulację
summary: Dokumentacja CLI dla `openclaw uninstall` (usuwanie usługi gateway i danych lokalnych)
title: Odinstalowanie
x-i18n:
    generated_at: "2026-04-24T09:04:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: b774fc006e989068b9126aff2a72888fd808a2e0e3d5ea8b57e6ab9d9f1b63ee
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

Odinstaluj usługę gateway + dane lokalne (CLI pozostaje).

Opcje:

- `--service`: usuń usługę gateway
- `--state`: usuń stan i konfigurację
- `--workspace`: usuń katalogi obszaru roboczego
- `--app`: usuń aplikację macOS
- `--all`: usuń usługę, stan, obszar roboczy i aplikację
- `--yes`: pomiń prośby o potwierdzenie
- `--non-interactive`: wyłącz prompty; wymaga `--yes`
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

- Najpierw uruchom `openclaw backup create`, jeśli chcesz mieć możliwy do przywrócenia snapshot przed usunięciem stanu lub obszarów roboczych.
- `--all` to skrót do jednoczesnego usunięcia usługi, stanu, obszaru roboczego i aplikacji.
- `--non-interactive` wymaga `--yes`.

## Powiązane

- [CLI reference](/pl/cli)
- [Uninstall](/pl/install/uninstall)
