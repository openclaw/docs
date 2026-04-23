---
read_when:
    - Sie möchten eine Terminal-Benutzeroberfläche für das Gateway (remote-freundlich)
    - Sie möchten URL/Token/Sitzung aus Skripten übergeben
    - Sie möchten die TUI im lokal eingebetteten Modus ohne Gateway ausführen
    - Sie möchten `openclaw chat` oder `openclaw tui --local` verwenden
summary: CLI-Referenz für `openclaw tui` (Gateway-gestützte oder lokal eingebettete Terminal-Benutzeroberfläche)
title: TUI
x-i18n:
    generated_at: "2026-04-23T06:27:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f4b7cf2468779e0711f38a2cc304d783bb115fd5c5e573c9d1bc982da6e2905
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Öffnen Sie die Terminal-Benutzeroberfläche, die mit dem Gateway verbunden ist, oder führen Sie sie im lokal eingebetteten Modus aus.

Verwandt:

- TUI-Leitfaden: [TUI](/de/web/tui)

Hinweise:

- `chat` und `terminal` sind Aliasse für `openclaw tui --local`.
- `--local` kann nicht mit `--url`, `--token` oder `--password` kombiniert werden.
- `tui` löst konfigurierte Gateway-Auth-SecretRefs für Token-/Passwort-Authentifizierung nach Möglichkeit auf (Provider `env`/`file`/`exec`).
- Wenn TUI innerhalb eines konfigurierten Agent-Workspace-Verzeichnisses gestartet wird, wählt sie diesen Agent automatisch als Standard für den Sitzungsschlüssel aus (es sei denn, `--session` ist explizit `agent:<id>:...`).
- Der lokale Modus verwendet die eingebettete Agent-Runtime direkt. Die meisten lokalen Tools funktionieren, aber reine Gateway-Funktionen sind nicht verfügbar.
- Der lokale Modus fügt `/auth [provider]` innerhalb der TUI-Befehlsoberfläche hinzu.

## Beispiele

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## Konfigurations-Reparaturablauf

Verwenden Sie den lokalen Modus, wenn die aktuelle Konfiguration bereits validiert ist und Sie möchten, dass der eingebettete Agent sie prüft, mit der Dokumentation vergleicht und bei der Reparatur im selben Terminal hilft:

Wenn `openclaw config validate` bereits fehlschlägt, verwenden Sie zuerst `openclaw configure` oder `openclaw doctor --fix`. `openclaw chat` umgeht die Schutzvorrichtung bei ungültiger Konfiguration nicht.

```bash
openclaw chat
```

Dann innerhalb der TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Wenden Sie gezielte Korrekturen mit `openclaw config set` oder `openclaw configure` an und führen Sie dann `openclaw config validate` erneut aus. Siehe [TUI](/de/web/tui) und [Konfiguration](/de/cli/config).
