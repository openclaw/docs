---
read_when:
    - Integration der Mac-App in den Gateway-Lebenszyklus
summary: Gateway-Lebenszyklus unter macOS (launchd)
title: Gateway-Lebenszyklus unter macOS
x-i18n:
    generated_at: "2026-07-12T15:38:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 89a27334afcecb322feb2732cf6282b4c286ef27828a1b57157f9d4fc161aed6
    source_path: platforms/mac/child-process.md
    workflow: 16
---

Die macOS-App verwaltet den Gateway standardmäßig über **launchd** und
startet den Gateway nicht als untergeordneten Prozess. Sie versucht zunächst, eine Verbindung
zu einem bereits ausgeführten Gateway am konfigurierten Port herzustellen. Ist keiner erreichbar,
aktiviert sie den launchd-Dienst über die externe `openclaw`-CLI (keine eingebettete
Laufzeitumgebung). Dies ermöglicht einen zuverlässigen automatischen Start bei der Anmeldung und einen Neustart nach Abstürzen.

Der Modus für untergeordnete Prozesse (Gateway wird direkt von der App gestartet) wird
derzeit **nicht verwendet**. Wenn Sie eine engere Kopplung mit der Benutzeroberfläche benötigen, führen Sie den Gateway manuell in einem
Terminal aus.

## Standardverhalten (launchd)

- Die App installiert einen benutzerspezifischen LaunchAgent mit der Bezeichnung `ai.openclaw.gateway` (oder
  `ai.openclaw.<profile>` bei Verwendung von `--profile`/`OPENCLAW_PROFILE`).
- Wenn der lokale Modus aktiviert ist, stellt die App sicher, dass der LaunchAgent geladen ist, und
  startet den Gateway bei Bedarf.
- Protokolle werden in den launchd-Gateway-Protokollpfad geschrieben (in den Debug-Einstellungen sichtbar).

Häufig verwendete Befehle:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Ersetzen Sie die Bezeichnung durch `ai.openclaw.<profile>`, wenn Sie ein benanntes Profil verwenden.

## Nicht signierte Entwicklungs-Builds

`scripts/restart-mac.sh --no-sign` ist für schnelle lokale Builds ohne Signaturschlüssel
vorgesehen. Um zu verhindern, dass launchd auf eine nicht signierte Relay-Binärdatei verweist, wird
`~/.openclaw/disable-launchagent` erstellt.

Signierte Ausführungen von `scripts/restart-mac.sh` entfernen diese Außerkraftsetzung, wenn die Markierungsdatei
vorhanden ist. So setzen Sie sie manuell zurück:

```bash
rm ~/.openclaw/disable-launchagent
```

## Modus „Nur verbinden“

Um zu erzwingen, dass die macOS-App launchd niemals installiert oder verwaltet, starten Sie sie mit
`--attach-only` (oder `--no-launchd`). Dadurch wird
`~/.openclaw/disable-launchagent` erstellt, sodass die App nur eine Verbindung zu einem bereits
ausgeführten Gateway herstellt. Aktivieren oder deaktivieren Sie dasselbe Verhalten in den Debug-Einstellungen.

## Remote-Modus

Im Remote-Modus wird niemals ein lokaler Gateway gestartet. Die App verwendet einen SSH-Tunnel zum
Remote-Host und stellt die Verbindung über diesen Tunnel her.

## Warum wir launchd bevorzugen

- Automatischer Start bei der Anmeldung.
- Integrierte Neustart-/KeepAlive-Semantik.
- Vorhersehbare Protokolle und Überwachung.

Falls ein echter Modus für untergeordnete Prozesse jemals wieder benötigt wird, sollte er als
separater, expliziter und ausschließlich für die Entwicklung vorgesehener Modus dokumentiert werden.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [Gateway-Betriebshandbuch](/de/gateway)
