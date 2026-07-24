---
read_when:
    - Integration der Mac-App in den Gateway-Lebenszyklus
summary: Gateway-Lebenszyklus unter macOS (launchd)
title: Gateway-Lebenszyklus unter macOS
x-i18n:
    generated_at: "2026-07-24T05:03:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 89a27334afcecb322feb2732cf6282b4c286ef27828a1b57157f9d4fc161aed6
    source_path: platforms/mac/child-process.md
    workflow: 16
---

Die macOS-App verwaltet den Gateway standardmäßig über **launchd** und
startet den Gateway nicht als untergeordneten Prozess. Sie versucht zunächst, eine Verbindung mit einem
bereits ausgeführten Gateway am konfigurierten Port herzustellen. Ist keiner erreichbar,
aktiviert sie den launchd-Dienst über die externe `openclaw` CLI (keine eingebettete
Runtime). Dies gewährleistet einen zuverlässigen automatischen Start bei der Anmeldung und einen Neustart nach Abstürzen.

Der Modus für untergeordnete Prozesse (Gateway wird direkt von der App gestartet) wird
derzeit **nicht verwendet**. Wenn Sie eine engere Kopplung an die Benutzeroberfläche benötigen, führen Sie den Gateway manuell in einem
Terminal aus.

## Standardverhalten (launchd)

- Die App installiert einen benutzerspezifischen LaunchAgent mit der Bezeichnung `ai.openclaw.gateway` (oder
  `ai.openclaw.<profile>` bei Verwendung von `--profile`/`OPENCLAW_PROFILE`).
- Wenn der lokale Modus aktiviert ist, stellt die App sicher, dass der LaunchAgent geladen ist, und
  startet bei Bedarf den Gateway.
- Protokolle werden in den launchd-Gateway-Protokollpfad geschrieben (sichtbar in den Debug-Einstellungen).

Häufig verwendete Befehle:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Ersetzen Sie beim Ausführen eines benannten Profils die Bezeichnung durch `ai.openclaw.<profile>`.

## Nicht signierte Entwicklungs-Builds

`scripts/restart-mac.sh --no-sign` ist für schnelle lokale Builds ohne Signaturschlüssel
vorgesehen. Damit launchd nicht auf eine nicht signierte Relay-Binärdatei verweist, schreibt es
`~/.openclaw/disable-launchagent`.

Signierte Ausführungen von `scripts/restart-mac.sh` entfernen diese Überschreibung, wenn die Markierung
vorhanden ist. So setzen Sie sie manuell zurück:

```bash
rm ~/.openclaw/disable-launchagent
```

## Nur-Anhängen-Modus

Um zu erzwingen, dass die macOS-App launchd niemals installiert oder verwaltet, starten Sie sie mit
`--attach-only` (oder `--no-launchd`). Dadurch wird
`~/.openclaw/disable-launchagent` gesetzt, sodass die App nur eine Verbindung mit einem bereits
ausgeführten Gateway herstellt. Das gleiche Verhalten können Sie in den Debug-Einstellungen umschalten.

## Remote-Modus

Der Remote-Modus startet niemals einen lokalen Gateway. Die App verwendet einen SSH-Tunnel zum
Remote-Host und stellt die Verbindung über diesen Tunnel her.

## Warum wir launchd bevorzugen

- Automatischer Start bei der Anmeldung.
- Integrierte Neustart-/KeepAlive-Semantik.
- Vorhersehbare Protokolle und Überwachung.

Falls jemals wieder ein echter Modus für untergeordnete Prozesse benötigt wird, sollte er als
separater, expliziter, ausschließlich für die Entwicklung vorgesehener Modus dokumentiert werden.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [Gateway-Betriebshandbuch](/de/gateway)
