---
read_when:
    - Integration der Mac-App in den Gateway-Lebenszyklus
summary: Gateway-Lebenszyklus unter macOS (launchd)
title: Gateway-Lebenszyklus unter macOS
x-i18n:
    generated_at: "2026-05-06T06:56:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 543327024f8c635d74ac656923e8e745dc47ca9df0aba5ec51215bd186db2b35
    source_path: platforms/mac/child-process.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Die macOS-App **verwaltet das Gateway standardmäßig über launchd** und startet
das Gateway nicht als Kindprozess. Sie versucht zunächst, sich mit einem bereits laufenden
Gateway am konfigurierten Port zu verbinden; wenn keines erreichbar ist, aktiviert sie den launchd-
Dienst über die externe `openclaw`-CLI (keine eingebettete Runtime). Dadurch erhalten Sie
zuverlässigen Autostart bei der Anmeldung und Neustart bei Abstürzen.

Der Kindprozessmodus (Gateway wird direkt von der App gestartet) wird heute **nicht verwendet**.
Wenn Sie eine engere Kopplung an die UI benötigen, führen Sie das Gateway manuell in einem Terminal aus.

## Standardverhalten (launchd)

- Die App installiert einen benutzerspezifischen LaunchAgent mit dem Label `ai.openclaw.gateway`
  (oder `ai.openclaw.<profile>` bei Verwendung von `--profile`/`OPENCLAW_PROFILE`; das alte `com.openclaw.*` wird unterstützt).
- Wenn der lokale Modus aktiviert ist, stellt die App sicher, dass der LaunchAgent geladen ist, und
  startet das Gateway bei Bedarf.
- Logs werden in den launchd-Gateway-Logpfad geschrieben (sichtbar in den Debug-Einstellungen).

Häufige Befehle:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Ersetzen Sie das Label durch `ai.openclaw.<profile>`, wenn Sie ein benanntes Profil ausführen.

## Nicht signierte Dev-Builds

`scripts/restart-mac.sh --no-sign` ist für schnelle lokale Builds gedacht, wenn Sie keine
Signaturschlüssel haben. Um zu verhindern, dass launchd auf eine nicht signierte Relay-Binärdatei zeigt, geschieht Folgendes:

- `~/.openclaw/disable-launchagent` wird geschrieben.

Signierte Ausführungen von `scripts/restart-mac.sh` entfernen diese Außerkraftsetzung, wenn die Markierung
vorhanden ist. Zum manuellen Zurücksetzen:

```bash
rm ~/.openclaw/disable-launchagent
```

## Nur-Anhängen-Modus

Um die macOS-App zu zwingen, **launchd niemals zu installieren oder zu verwalten**, starten Sie sie mit
`--attach-only` (oder `--no-launchd`). Dadurch wird `~/.openclaw/disable-launchagent` gesetzt,
sodass die App sich nur mit einem bereits laufenden Gateway verbindet. Dasselbe
Verhalten können Sie in den Debug-Einstellungen umschalten.

## Remote-Modus

Der Remote-Modus startet niemals ein lokales Gateway. Die App verwendet einen SSH-Tunnel zum
Remote-Host und verbindet sich über diesen Tunnel.

## Warum wir launchd bevorzugen

- Autostart bei der Anmeldung.
- Integrierte Neustart-/KeepAlive-Semantik.
- Vorhersagbare Logs und Überwachung.

Wenn ein echter Kindprozessmodus jemals wieder benötigt wird, sollte er als
separater, expliziter reiner Dev-Modus dokumentiert werden.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [Gateway-Runbook](/de/gateway)
