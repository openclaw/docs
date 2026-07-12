---
read_when:
    - Sie möchten eine Terminal-Benutzeroberfläche für das Gateway (für Remotezugriff geeignet)
    - Sie möchten URL/Token/Sitzung aus Skripten übergeben
    - Sie möchten die TUI im lokalen eingebetteten Modus ohne Gateway ausführen
    - Sie möchten `openclaw chat` oder `openclaw tui --local` verwenden.
summary: CLI-Referenz für `openclaw tui` (Gateway-gestützte oder lokal eingebettete Terminal-Benutzeroberfläche)
title: TUI
x-i18n:
    generated_at: "2026-07-12T15:10:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3e7b4a067e957c72836b22688f7446861b64fb7078b43e206bbe765ea0d62e57
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Öffnen Sie die mit dem Gateway verbundene Terminal-Benutzeroberfläche oder führen Sie sie im lokalen eingebetteten
Modus aus.

Zugehörige Anleitung: [TUI](/de/web/tui)

## Optionen

| Flag                         | Standardwert                              | Beschreibung                                                                                                  |
| ---------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--local`                    | `false`                                   | Wird mit der lokalen eingebetteten Agent-Runtime statt mit einem Gateway ausgeführt.                          |
| `--url <url>`                | `gateway.remote.url` aus der Konfiguration | Gateway-WebSocket-URL.                                                                                        |
| `--token <token>`            | (keiner)                                  | Gateway-Token, falls erforderlich.                                                                            |
| `--password <pass>`          | (keines)                                  | Gateway-Passwort, falls erforderlich.                                                                         |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | Erwarteter Fingerabdruck des TLS-Zertifikats für ein fest verknüpftes `wss://`-Gateway.                        |
| `--session <key>`            | `main` (oder `global` bei globalem Geltungsbereich) | Sitzungsschlüssel. In einem Agent-Arbeitsbereich wird automatisch dieser Agent ausgewählt, sofern kein Präfix angegeben ist. |
| `--deliver`                  | `false`                                   | Antworten des Assistenten über konfigurierte Kanäle zustellen.                                                |
| `--thinking <level>`         | (Modellstandard)                          | Überschreibung der Denkstufe.                                                                                 |
| `--message <text>`           | (keine)                                   | Nach dem Verbindungsaufbau eine erste Nachricht senden.                                                       |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | Agent-Zeitüberschreitung. Ungültige Werte protokollieren eine Warnung und werden ignoriert.                    |
| `--history-limit <n>`        | `200`                                     | Anzahl der beim Verbinden zu ladenden Verlaufseinträge.                                                       |

Aliasse: `openclaw chat` und `openclaw terminal` rufen diesen Befehl mit impliziertem
`--local` auf.

## Hinweise

- `--local` kann nicht mit `--url`, `--token`, `--password` oder `--tls-fingerprint` kombiniert werden.
- `tui` löst konfigurierte Gateway-Authentifizierungs-SecretRefs für die Token-/Passwortauthentifizierung
  nach Möglichkeit auf (`env`-/`file`-/`exec`-Provider).
- Ohne explizite URL oder Portangabe verwendet `tui` den aktiven lokalen Gateway-Port,
  den das laufende Gateway aufgezeichnet hat. Explizite Angaben über `--url`, `OPENCLAW_GATEWAY_URL`,
  `OPENCLAW_GATEWAY_PORT` und die Remote-Gateway-Konfiguration haben weiterhin Vorrang.
- Beim Start innerhalb des Verzeichnisses eines konfigurierten Agent-Arbeitsbereichs wählt die TUI
  diesen Agent automatisch als Standardwert für den Sitzungsschlüssel aus (es sei denn, `--session` lautet explizit
  `agent:<id>:...`).
- Um bei nicht lokalen, URL-basierten Verbindungen den Gateway-Hostnamen in der Fußzeile anzuzeigen,
  führen Sie `openclaw config set tui.footer.showRemoteHost true` aus. Standardmäßig deaktiviert;
  für Loopback- oder eingebettete lokale Verbindungen wird er nie angezeigt.
- Der lokale Modus verwendet die eingebettete Agent-Runtime direkt. Die meisten lokalen Tools funktionieren,
  Gateway-exklusive Funktionen sind jedoch nicht verfügbar.
- Im lokalen Modus wird `/auth [provider]` zur Befehlsoberfläche der TUI hinzugefügt.
- Die Genehmigungssperren für Plugins gelten auch im lokalen Modus: Tools, die eine Genehmigung erfordern,
  fragen im Terminal nach einer Entscheidung; nichts wird stillschweigend automatisch genehmigt.
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

Verwenden Sie den lokalen Modus, damit der eingebettete Agent die aktuelle Konfiguration prüft, sie
mit der Dokumentation vergleicht und bei ihrer Reparatur im selben Terminal hilft.

Falls `openclaw config validate` bereits fehlschlägt, führen Sie zuerst `openclaw configure` oder
`openclaw doctor --fix` aus; `openclaw chat` umgeht die Schutzprüfung für
ungültige Konfigurationen nicht.

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

Wenden Sie gezielte Korrekturen mit `openclaw config set` oder `openclaw configure` an und
führen Sie anschließend `openclaw config validate` erneut aus. Siehe [TUI](/de/web/tui) und
[Konfiguration](/de/cli/config).

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [TUI](/de/web/tui)
- [Ziel](/de/tools/goal)
