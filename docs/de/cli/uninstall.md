---
read_when:
    - Sie möchten den Gateway-Dienst und/oder den lokalen Status entfernen
    - Sie möchten zuerst einen Probelauf durchführen
summary: CLI-Referenz für `openclaw uninstall` (Gateway-Dienst + lokale Daten entfernen)
title: Deinstallieren
x-i18n:
    generated_at: "2026-06-27T17:21:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f90fa8cf513e2e8cd422c3b8a880e7fd20fb71131a3ec88260e765daa2ace543
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Deinstallieren Sie den Gateway-Dienst + lokale Daten (CLI bleibt erhalten).

Optionen:

- `--service`: den Gateway-Dienst entfernen
- `--state`: Status und Konfiguration entfernen
- `--workspace`: Workspace-Verzeichnisse entfernen
- `--app`: die macOS-App entfernen
- `--all`: Dienst, Status, Workspace und App entfernen
- `--yes`: Bestätigungsabfragen überspringen
- `--non-interactive`: Eingabeaufforderungen deaktivieren; erfordert `--yes`
- `--dry-run`: Aktionen ausgeben, ohne Dateien zu entfernen

Beispiele:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

Hinweise:

- Führen Sie zuerst `openclaw backup create` aus, wenn Sie vor dem Entfernen von Status oder Workspaces einen wiederherstellbaren Snapshot erstellen möchten.
- `--state` behält konfigurierte Workspace-Verzeichnisse bei, sofern nicht auch `--workspace` ausgewählt ist.
- `--all` ist eine Kurzform zum gemeinsamen Entfernen von Dienst, Status, Workspace und App.
- `--non-interactive` erfordert `--yes`.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Deinstallieren](/de/install/uninstall)
