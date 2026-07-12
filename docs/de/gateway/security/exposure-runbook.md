---
read_when:
    - Bereitstellen des Gateways über LAN, Tailnet, Tailscale Serve, Funnel oder einen Reverse-Proxy
    - Überprüfung einer Bereitstellung vor der Freigabe für echte Messaging-Benutzer
    - Zurücksetzen einer riskanten Konfiguration für Fernzugriff oder Direktnachrichten
sidebarTitle: Exposure runbook
summary: Prüfliste für Vorabkontrollen und Rollback vor der Freigabe eines OpenClaw-Gateways über local loopback hinaus
title: Runbook für die Gateway-Bereitstellung
x-i18n:
    generated_at: "2026-07-12T01:42:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb8e66af57e804325afc91281122b822183337177c734efe065c5fc18b175e72
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Geben Sie den Gateway erst frei, wenn Sie erklären können, wer ihn erreichen kann, wie diese Personen
authentifiziert werden, welche Agenten sie auslösen können und welche Werkzeuge diese Agenten
verwenden können. Kehren Sie im Zweifelsfall zum reinen local-loopback-Zugriff zurück und führen Sie das Audit erneut aus.
</Warning>

Dieses Runbook überführt die umfassenderen Hinweise unter [Sicherheit](/de/gateway/security) in eine
Betriebscheckliste für Fernzugriff und die Freigabe von Messaging-Schnittstellen.

## Freigabemuster auswählen

Bevorzugen Sie das engste Muster, das den Workflow erfüllt.

| Muster                     | Empfohlen für                                   | Erforderliche Kontrollen                                                                                                                        |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Loopback + SSH-Tunnel      | Persönliche Nutzung, Administratorzugriff, Debugging | `gateway.bind: "loopback"` beibehalten und `127.0.0.1:18789` tunneln                                                                         |
| Loopback + Tailscale Serve | Persönlicher Tailnet-Zugriff auf Control UI/WebSocket | Gateway ausschließlich über Loopback erreichbar halten; Tailscale-Identitätsheader authentifizieren nur die WebSocket-Schnittstelle der Control UI, nicht andere Authentifizierungspfade |
| Tailnet-/LAN-Bindung       | Dediziertes privates Netzwerk mit bekannten Geräten | Gateway-Authentifizierung, Firewall-Zulassungsliste, keine öffentliche Portweiterleitung                                                     |
| Vertrauenswürdiger Reverse-Proxy | Organisationsweites SSO/OIDC vor dem Gateway | `trusted-proxy`-Authentifizierung, strikte `trustedProxies`, Regeln zum Überschreiben/Entfernen von Headern, ausdrücklich zugelassene Benutzer |
| Öffentliches Internet     | Seltene Bereitstellungen mit hohem Risiko       | Identitätsbewusster Proxy, TLS, Ratenbegrenzungen, strikte Zulassungslisten, isolierte Nicht-Hauptsitzungen                                      |

Vermeiden Sie eine direkte öffentliche Portweiterleitung zum Gateway. Wenn öffentlicher Zugriff
erforderlich ist, schalten Sie einen identitätsbewussten Proxy davor und sorgen Sie dafür, dass der Proxy der
einzige Netzwerkpfad zum Gateway ist.

## Bestandsaufnahme vorab

Dokumentieren Sie Folgendes, bevor Sie Bindung, Proxy, Tailscale oder Kanalrichtlinien ändern:

- Gateway-Host, Betriebssystembenutzer und Zustandsverzeichnis (Standard: `~/.openclaw`).
- Gateway-URL und Bindungsmodus (`gateway.bind`; Standardport `18789`).
- Authentifizierungsmodus, Quelle für Token/Passwort oder Identitätsquelle des vertrauenswürdigen Proxys.
- Jeden aktivierten Kanal und ob er Direktnachrichten, Gruppen oder Webhooks akzeptiert.
- Agenten, die für nicht lokale Absender erreichbar sind.
- Werkzeugprofil, Sandbox-Modus und Richtlinie für Werkzeuge mit erhöhten Rechten für jeden erreichbaren Agenten.
- Externe Anmeldedaten, die diesen Agenten zur Verfügung stehen.
- Sicherungsort für `~/.openclaw/openclaw.json` und Anmeldedaten.

Wenn mehr als eine Person dem Bot Nachrichten senden kann, behandeln Sie dies als gemeinsam delegierte
Werkzeugberechtigung und nicht als Host-Isolation pro Benutzer.

## Grundlegende Prüfungen

Führen Sie vor dem Öffnen des Zugriffs Folgendes aus:

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Beheben Sie zuerst kritische Befunde. Akzeptieren Sie Warnungen nur, wenn sie für die Bereitstellung beabsichtigt und
dokumentiert sind. Unter [Prüfungen des Sicherheitsaudits](/de/gateway/security/audit-checks)
finden Sie die Bedeutung jeder `checkId` und den zugehörigen Korrekturschlüssel.

Übergeben Sie für die Remote-Validierung per CLI die Anmeldedaten ausdrücklich:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Gehen Sie nicht davon aus, dass Anmeldedaten aus der lokalen Konfiguration für eine ausdrücklich angegebene Remote-URL gelten.

## Sichere Mindestgrundlage

Verwenden Sie diese Struktur als Ausgangspunkt für freigegebene Bereitstellungen:

```json5
{
  gateway: {
    bind: "loopback",
    auth: {
      mode: "token",
      token: "replace-with-a-long-random-token",
    },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  agents: {
    defaults: {
      sandbox: { mode: "non-main" },
    },
  },
  tools: {
    profile: "messaging",
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Erweitern Sie jeweils nur eine Kontrolle: Fügen Sie eine spezifische Kanal-Zulassungsliste hinzu, bevor Sie
schreibfähige Werkzeuge aktivieren, oder aktivieren Sie einen Reverse-Proxy, bevor Sie Remote-Datenverkehr zur Control UI
akzeptieren.

`tools.exec.security: "deny"` blockiert alle Exec-Aufrufe, einschließlich harmloser
Diagnosen. Wenn Diagnosen oder Befehle mit geringem Risiko erforderlich sind, lockern Sie dies erst,
nachdem Sie die konkreten Absender, Agenten, Befehle und den Genehmigungsmodus ausgewählt haben, die
zu Ihrem Bedrohungsmodell passen.

## Freigabe von Direktnachrichten und Gruppen

Messaging-Kanäle sind nicht vertrauenswürdige Eingabeschnittstellen. Bevor Sie Direktnachrichten oder
Gruppen zulassen:

- Bevorzugen Sie `dmPolicy: "pairing"` oder eine strikte `allowFrom`-Liste gegenüber `dmPolicy: "open"`.
- Kombinieren Sie `"*"`-Zulassungslisten nicht mit umfassendem Werkzeugzugriff.
- Fordern Sie in Gruppen Erwähnungen an, sofern der Raum nicht streng kontrolliert wird.
- Setzen Sie `session.dmScope: "per-channel-peer"` (oder `"per-account-channel-peer"` für
  Kanäle mit mehreren Konten), wenn mehrere Personen dem Bot Direktnachrichten senden können, damit Direktnachrichtensitzungen
  keinen gemeinsamen Kontext verwenden.
- Leiten Sie gemeinsam genutzte Kanäle an Agenten mit minimalen Werkzeugen und ohne persönliche
  Anmeldedaten weiter.

Durch die Kopplung wird der Absender berechtigt, den Bot auszulösen. Sie macht diesen Absender nicht zu einer
separaten Host-Sicherheitsgrenze.

## Prüfungen für Reverse-Proxys

Für identitätsbewusste Proxys gilt:

- Der Proxy muss Benutzer authentifizieren, bevor er Anfragen an den Gateway weiterleitet.
- Eine Firewall oder Netzwerkrichtlinie muss den direkten Zugriff auf den Gateway-Port blockieren.
- `gateway.trustedProxies` darf nur die Quell-IP-Adressen des Proxys enthalten.
- Der Proxy muss vom Client bereitgestellte Identitäts- und Weiterleitungsheader entfernen oder
  überschreiben.
- Setzen Sie `gateway.auth.trustedProxy.allowUsers`, wenn der Proxy mehr als
  eine Zielgruppe bedient.
- Verwenden Sie `gateway.auth.trustedProxy.allowLoopback` nur für einen Proxy auf demselben Host,
  wenn lokalen Prozessen vertraut wird und der Proxy für die Identitätsheader verantwortlich ist.

Führen Sie nach Proxy-Änderungen `openclaw security audit --deep` aus. Befunde zu vertrauenswürdigen Proxys
sind besonders aussagekräftig, da der Proxy zur Authentifizierungsgrenze
wird.

## Überprüfung von Werkzeugen und Sandbox

Bevor Sie einen Agenten für Remote-Absender freigeben:

- Prüfen Sie, welche Sitzungen auf dem Host und welche in der Sandbox ausgeführt werden.
- Verweigern Sie die Ausführung auf dem Host oder verlangen Sie dafür eine Genehmigung.
- Lassen Sie Werkzeuge mit erhöhten Rechten deaktiviert, sofern sie nicht von einem bestimmten vertrauenswürdigen Absender benötigt werden.
- Vermeiden Sie Browser-, Canvas-, Node-, Cron-, Gateway- und Werkzeuge zum Erzeugen von Sitzungen für offene
  oder teilweise offene Messaging-Schnittstellen.
- Halten Sie Bind-Mounts eng begrenzt; vermeiden Sie Pfade für Anmeldedaten, Benutzerverzeichnisse, Docker-Sockets und Systemdateien.
- Verwenden Sie separate Gateways, Betriebssystembenutzer oder Hosts für wesentlich unterschiedliche Vertrauensgrenzen.

Wenn Remote-Benutzer nicht vollständig vertrauenswürdig sind, muss die Isolation durch separate
Bereitstellungen erfolgen, nicht nur durch Prompts oder Sitzungsbezeichnungen.

## Validierung nach Änderungen

Nach jeder Änderung der Freigabe:

1. Führen Sie `openclaw security audit --deep` erneut aus.
2. Prüfen Sie, dass eine autorisierte Verbindung erfolgreich hergestellt wird.
3. Prüfen Sie, dass ein nicht autorisierter Absender oder eine nicht autorisierte Browsersitzung abgewiesen wird.
4. Prüfen Sie, dass Protokolle Geheimnisse unkenntlich machen.
5. Prüfen Sie, dass die Weiterleitung von Direktnachrichten/Gruppen nur den vorgesehenen Agenten erreicht.
6. Prüfen Sie, dass Werkzeuge mit hohen Auswirkungen eine Genehmigung anfordern oder verweigert werden.
7. Dokumentieren Sie die akzeptierten verbleibenden Warnungen.

Fahren Sie mit der nächsten Freigabeänderung erst fort, wenn die aktuelle
verstanden ist.

## Rücksetzplan

Falls der Gateway möglicherweise zu weitgehend freigegeben ist:

```json5
{
  gateway: {
    bind: "loopback",
  },
  channels: {
    whatsapp: { dmPolicy: "disabled" },
    telegram: { dmPolicy: "disabled" },
    discord: { dmPolicy: "disabled" },
    slack: { dmPolicy: "disabled" },
  },
  tools: {
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Anschließend:

1. Beenden Sie öffentliche Weiterleitungen, Tailscale Funnel oder Reverse-Proxy-Routen.
2. Rotieren Sie Gateway-Token/-Passwörter und betroffene Integrationsanmeldedaten.
3. Entfernen Sie `"*"` und unerwartete Absender aus Zulassungslisten.
4. Überprüfen Sie aktuelle Audit-Protokolle, Ausführungsverläufe, Werkzeugaufrufe und Konfigurationsänderungen.
5. Führen Sie `openclaw security audit --deep` erneut aus.
6. Aktivieren Sie den Zugriff wieder mit dem engsten Muster, das den Workflow erfüllt.

## Prüfcheckliste

- Der Gateway bleibt ausschließlich über Loopback erreichbar, sofern kein dokumentierter Grund dagegenspricht.
- Zugriff außerhalb von Loopback verfügt über Authentifizierung und Firewall-Schutz sowie keinen direkten öffentlichen Pfad.
- Bereitstellungen mit vertrauenswürdigem Proxy verfügen über strikte Proxy-IP-Adressen und Header-Kontrollen.
- Direktnachrichten verwenden standardmäßig Kopplung oder Zulassungslisten statt offenen Zugriff.
- Gruppen erfordern Erwähnungen oder ausdrückliche Zulassungslisten.
- Gemeinsam genutzte Kanäle haben keinen Zugriff auf persönliche Anmeldedaten.
- Nicht-Hauptsitzungen werden im Sandbox-Modus ausgeführt.
- Host-Ausführung und Werkzeuge mit erhöhten Rechten werden verweigert oder erfordern eine Genehmigung.
- Protokolle machen Geheimnisse unkenntlich.
- Kritische Audit-Befunde sind behoben.
- Rücksetzschritte sind getestet und dokumentiert.
