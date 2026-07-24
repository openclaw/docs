---
read_when:
    - Sie möchten eine Terminal-Benutzeroberfläche für das Gateway (für Remote-Zugriff geeignet)
    - Sie möchten URL/Token/Sitzung aus Skripten übergeben
    - Sie möchten die TUI im lokalen eingebetteten Modus ohne Gateway ausführen
    - Sie möchten `openclaw chat` oder `openclaw tui --local` verwenden
summary: CLI-Referenz für `openclaw tui` (Gateway-gestützte oder lokal eingebettete Terminal-Benutzeroberfläche)
title: TUI
x-i18n:
    generated_at: "2026-07-24T03:44:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5406f25bbd22c64867296c15112fafcaf8e1580c759e5fdc81fccfb62ae1e318
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Öffnen Sie die mit dem Gateway verbundene Terminal-Benutzeroberfläche oder führen Sie sie im lokalen eingebetteten
Modus aus.

Zugehörige Anleitung: [TUI](/de/web/tui)

## Optionen

| Flag                         | Standardwert                              | Beschreibung                                                                       |
| ---------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `--local`                    | `false`                                   | Verwendet statt eines Gateways die lokale eingebettete Agent-Runtime.              |
| `--url <url>`                | `gateway.remote.url` aus der Konfiguration | Gateway-WebSocket-URL.                                                             |
| `--token <token>`            | (keiner)                                  | Gateway-Token, falls erforderlich.                                                 |
| `--password <pass>`          | (keines)                                  | Gateway-Passwort, falls erforderlich.                                              |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | Erwarteter TLS-Zertifikat-Fingerabdruck für ein angeheftetes `wss://`-Gateway.      |
| `--session <key>`            | `main` (oder `global`, wenn der Geltungsbereich global ist) | Sitzungsschlüssel. Innerhalb eines Agent-Arbeitsbereichs wird automatisch dieser Agent ausgewählt, sofern kein Präfix angegeben ist. |
| `--deliver`                  | `false`                                   | Übermittelt Antworten des Assistenten über konfigurierte Kanäle.                   |
| `--thinking <level>`         | (Modellstandard)                          | Überschreibt die Denkstufe.                                                        |
| `--message <text>`           | (keine)                                   | Sendet nach dem Verbindungsaufbau eine erste Nachricht.                            |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | Agent-Zeitlimit. Ungültige Werte erzeugen eine Warnung und werden ignoriert.        |
| `--history-limit <n>`        | `200`                                     | Anzahl der beim Anhängen zu ladenden Verlaufseinträge.                             |

Die Aliasse `openclaw chat` und `openclaw terminal` rufen diesen Befehl mit impliziertem
`--local` auf.

## Hinweise

- `--local` kann nicht mit `--url`, `--token`, `--password` oder `--tls-fingerprint` kombiniert werden.
- `tui` löst konfigurierte Gateway-Authentifizierungs-SecretRefs für die Token-/Passwortauthentifizierung
  nach Möglichkeit auf (Provider `env`/`file`/`exec`).
- Ohne explizite URL oder expliziten Port verwendet `tui` den aktiven lokalen Gateway-Port,
  der vom laufenden Gateway aufgezeichnet wurde. Explizite Angaben für `--url`, `OPENCLAW_GATEWAY_URL`,
  `OPENCLAW_GATEWAY_PORT` sowie die Remote-Gateway-Konfiguration haben weiterhin Vorrang.
- Beim Start aus einem konfigurierten Agent-Arbeitsbereichsverzeichnis wählt die TUI automatisch
  diesen Agent als Standardwert für den Sitzungsschlüssel aus (sofern `--session` nicht explizit
  auf `agent:<id>:...` gesetzt ist).
- Der lokale Modus verwendet die eingebettete Agent-Runtime direkt. Die meisten lokalen Tools funktionieren,
  aber Funktionen, die ausschließlich über den Gateway verfügbar sind, stehen nicht zur Verfügung.
- Der lokale Modus fügt der TUI-Befehlsoberfläche `/auth [provider]` hinzu.
- Plugin-Genehmigungsschranken gelten weiterhin im lokalen Modus: Tools, die eine Genehmigung erfordern,
  fordern im Terminal zu einer Entscheidung auf; nichts wird stillschweigend automatisch genehmigt.
- Sitzungs-[Ziele](/de/tools/goal) werden in der Fußzeile angezeigt und können mit
  `/goal` verwaltet werden.

## Beispiele

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Vergleiche meine Konfiguration mit der Dokumentation und sage mir, was ich korrigieren muss"
# bei Ausführung in einem Agent-Arbeitsbereich wird dieser Agent automatisch abgeleitet
openclaw tui --session bugfix
```

## Reparaturschleife für die Konfiguration

Verwenden Sie den lokalen Modus, damit der eingebettete Agent die aktuelle Konfiguration prüft, sie mit
der Dokumentation vergleicht und bei der Reparatur im selben Terminal hilft.

Falls `openclaw config validate` bereits fehlschlägt, führen Sie zuerst `openclaw configure` oder
`openclaw doctor --fix` aus; `openclaw chat` umgeht die
Schutzprüfung gegen ungültige Konfigurationen nicht.

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

Wenden Sie gezielte Korrekturen mit `openclaw config set` oder `openclaw configure` an und führen Sie anschließend
`openclaw config validate` erneut aus. Siehe [TUI](/de/web/tui) und
[Konfiguration](/de/cli/config).

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [TUI](/de/web/tui)
- [Ziel](/de/tools/goal)
