---
read_when:
    - Chcesz usunąć usługę gateway i/lub stan lokalny
    - Najpierw chcesz wykonać dry-run
summary: Dokumentacja CLI dla `openclaw uninstall` (usuwanie usługi gateway + danych lokalnych)
title: uninstall
x-i18n:
    generated_at: "2026-04-05T13:49:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2123a4f9c7a070ef7e13c60dafc189053ef61ce189fa4f29449dd50987c1894c
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

Odinstaluj usługę gateway + dane lokalne (CLI pozostaje).

Opcje:

- `--service`: usuń usługę gateway
- `--state`: usuń stan i konfigurację
- `--workspace`: usuń katalogi workspace
- `--app`: usuń aplikację macOS
- `--all`: usuń usługę, stan, workspace i aplikację
- `--yes`: pomiń prompty potwierdzenia
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

- Najpierw uruchom `openclaw backup create`, jeśli chcesz mieć przywracalny snapshot przed usunięciem stanu lub workspace.
- `--all` to skrót do jednoczesnego usunięcia usługi, stanu, workspace i aplikacji.
- `--non-interactive` wymaga `--yes`.
