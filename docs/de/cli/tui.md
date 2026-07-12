---
read_when:
    - Sie möchten eine Terminal-Benutzeroberfläche für das Gateway (für den Remote-Zugriff geeignet)
    - Sie möchten URL, Token und Sitzung aus Skripten übergeben
    - Sie möchten die TUI im lokalen eingebetteten Modus ohne Gateway ausführen
    - Sie möchten `openclaw chat` oder `openclaw tui --local` verwenden.
summary: CLI-Referenz für `openclaw tui` (Gateway-gestützte oder lokal eingebettete Terminal-Benutzeroberfläche)
title: TUI
x-i18n:
    generated_at: "2026-07-12T01:30:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e7b4a067e957c72836b22688f7446861b64fb7078b43e206bbe765ea0d62e57
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Öffnet die mit dem Gateway verbundene Terminal-Benutzeroberfläche oder führt sie im lokalen eingebetteten Modus aus.

Zugehörige Anleitung: [TUI](/de/web/tui)

## Optionen

| Flag                         | Standardwert                                      | Beschreibung                                                                                                                           |
| ---------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `--local`                    | `false`                                           | Verwendet statt eines Gateway die lokale eingebettete Agent-Laufzeit.                                                                  |
| `--url <url>`                | `gateway.remote.url` aus der Konfiguration        | WebSocket-URL des Gateway.                                                                                                             |
| `--token <token>`            | (keiner)                                          | Gateway-Token, falls erforderlich.                                                                                                     |
| `--password <pass>`          | (keines)                                          | Gateway-Passwort, falls erforderlich.                                                                                                  |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`                   | Erwarteter TLS-Zertifikatfingerabdruck für ein fest verankertes `wss://`-Gateway.                                                       |
| `--session <key>`            | `main` (oder `global` bei globalem Geltungsbereich) | Sitzungsschlüssel. Innerhalb eines Agent-Arbeitsbereichs wird automatisch dieser Agent ausgewählt, sofern kein Präfix angegeben ist. |
| `--deliver`                  | `false`                                           | Übermittelt Antworten des Assistenten über konfigurierte Kanäle.                                                                       |
| `--thinking <level>`         | (Modellstandard)                                  | Überschreibt die Denkstufe.                                                                                                            |
| `--message <text>`           | (keine)                                           | Sendet nach dem Verbindungsaufbau eine erste Nachricht.                                                                                 |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`                  | Zeitüberschreitung des Agent. Ungültige Werte erzeugen eine Warnung im Protokoll und werden ignoriert.                                  |
| `--history-limit <n>`        | `200`                                             | Anzahl der beim Verbinden zu ladenden Verlaufseinträge.                                                                                 |

Die Aliasse `openclaw chat` und `openclaw terminal` rufen diesen Befehl mit impliziertem `--local` auf.

## Hinweise

- `--local` kann nicht mit `--url`, `--token`, `--password` oder `--tls-fingerprint` kombiniert werden.
- `tui` löst konfigurierte Gateway-Authentifizierungs-SecretRefs für die Token-/Passwortauthentifizierung nach Möglichkeit auf (`env`-/`file`-/`exec`-Provider).
- Ohne explizite URL oder Portangabe verwendet `tui` den aktiven lokalen Gateway-Port, den das laufende Gateway gespeichert hat. Explizite Angaben über `--url`, `OPENCLAW_GATEWAY_URL`, `OPENCLAW_GATEWAY_PORT` und die Remote-Gateway-Konfiguration haben weiterhin Vorrang.
- Wird die TUI innerhalb des Verzeichnisses eines konfigurierten Agent-Arbeitsbereichs gestartet, wählt sie diesen Agent automatisch als Standard für den Sitzungsschlüssel aus (sofern `--session` nicht explizit als `agent:<id>:...` angegeben ist).
- Um bei nicht lokalen, URL-basierten Verbindungen den Gateway-Hostnamen in der Fußzeile anzuzeigen, führen Sie `openclaw config set tui.footer.showRemoteHost true` aus. Standardmäßig deaktiviert; wird bei local loopback oder eingebetteten lokalen Verbindungen nie angezeigt.
- Der lokale Modus verwendet die eingebettete Agent-Laufzeit direkt. Die meisten lokalen Werkzeuge funktionieren, Funktionen, die ausschließlich über das Gateway verfügbar sind, jedoch nicht.
- Der lokale Modus ergänzt die TUI-Befehle um `/auth [provider]`.
- Die Genehmigungsprüfungen von Plugins gelten auch im lokalen Modus: Werkzeuge, die eine Genehmigung erfordern, fordern im Terminal zu einer Entscheidung auf; es wird nichts unbemerkt automatisch genehmigt.
- [Ziele](/de/tools/goal) der Sitzung werden in der Fußzeile angezeigt und können mit `/goal` verwaltet werden.

## Beispiele

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Vergleiche meine Konfiguration mit der Dokumentation und sage mir, was ich korrigieren muss"
# bei Ausführung innerhalb eines Agent-Arbeitsbereichs wird dieser Agent automatisch erkannt
openclaw tui --session bugfix
```

## Reparaturschleife für die Konfiguration

Verwenden Sie den lokalen Modus, damit der eingebettete Agent die aktuelle Konfiguration prüft, sie mit der Dokumentation vergleicht und Sie bei der Reparatur im selben Terminal unterstützt.

Falls `openclaw config validate` bereits fehlschlägt, führen Sie zunächst `openclaw configure` oder `openclaw doctor --fix` aus; `openclaw chat` umgeht die Schutzprüfung für ungültige Konfigurationen nicht.

```bash
openclaw chat
```

Anschließend innerhalb der TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Wenden Sie gezielte Korrekturen mit `openclaw config set` oder `openclaw configure` an und führen Sie anschließend `openclaw config validate` erneut aus. Siehe [TUI](/de/web/tui) und [Konfiguration](/de/cli/config).

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [TUI](/de/web/tui)
- [Ziel](/de/tools/goal)
