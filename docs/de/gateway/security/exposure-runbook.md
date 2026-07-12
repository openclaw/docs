---
read_when:
    - Bereitstellen des Gateways über LAN, Tailnet, Tailscale Serve, Funnel oder einen Reverse-Proxy
    - Überprüfen einer Bereitstellung, bevor echte Messaging-Benutzer zugelassen werden
    - Eine riskante Fernzugriffs- oder DM-Konfiguration zurücksetzen
sidebarTitle: Exposure runbook
summary: Checkliste für Vorabprüfung und Rollback, bevor ein OpenClaw Gateway außerhalb der Loopback-Schnittstelle verfügbar gemacht wird
title: Runbook zur Gateway-Exposition
x-i18n:
    generated_at: "2026-07-12T15:27:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fb8e66af57e804325afc91281122b822183337177c734efe065c5fc18b175e72
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Machen Sie den Gateway erst zugänglich, wenn Sie erklären können, wer ihn erreichen kann, wie diese Personen
authentifiziert werden, welche Agenten sie auslösen können und welche Tools diese Agenten
verwenden dürfen. Kehren Sie im Zweifelsfall zu einem ausschließlich auf Loopback beschränkten Zugriff zurück und führen Sie das Audit erneut aus.
</Warning>

Dieses Runbook überführt die umfassenderen Hinweise unter [Sicherheit](/de/gateway/security) in eine
Checkliste für Betreiber zur Offenlegung des Fernzugriffs und von Messaging-Zugängen.

## Offenlegungsmuster auswählen

Bevorzugen Sie das restriktivste Muster, das die Anforderungen des Workflows erfüllt.

| Muster                     | Empfohlen für                                   | Erforderliche Kontrollen                                                                                                                         |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Loopback + SSH-Tunnel      | Persönliche Nutzung, Admin-Zugriff, Debugging   | Behalten Sie `gateway.bind: "loopback"` bei und tunneln Sie `127.0.0.1:18789`                                                                     |
| Loopback + Tailscale Serve | Persönlicher Tailnet-Zugriff auf Control UI/WebSocket | Beschränken Sie den Gateway auf Loopback; Tailscale-Identitätsheader authentifizieren nur die WebSocket-Oberfläche der Control UI, nicht andere Authentifizierungspfade |
| Tailnet-/LAN-Bindung       | Dediziertes privates Netzwerk mit bekannten Geräten | Gateway-Authentifizierung, Firewall-Zulassungsliste, keine öffentliche Portweiterleitung                                                      |
| Vertrauenswürdiger Reverse Proxy | Organisationsweites SSO/OIDC vor dem Gateway | `trusted-proxy`-Authentifizierung, strikte `trustedProxies`, Regeln zum Überschreiben/Entfernen von Headern, explizit zugelassene Benutzer        |
| Öffentliches Internet     | Seltene Bereitstellungen mit hohem Risiko       | Identitätsbewusster Proxy, TLS, Ratenbegrenzungen, strikte Zulassungslisten, Sandbox für Nicht-Hauptsitzungen                                    |

Vermeiden Sie eine direkte öffentliche Portweiterleitung zum Gateway. Wenn öffentlicher Zugriff
erforderlich ist, schalten Sie ihm einen identitätsbewussten Proxy vor und machen Sie den Proxy zum
einzigen Netzwerkpfad zum Gateway.

## Bestandsaufnahme vorab

Dokumentieren Sie Folgendes, bevor Sie Bindungs-, Proxy-, Tailscale- oder Kanalrichtlinien ändern:

- Gateway-Host, Betriebssystembenutzer und Zustandsverzeichnis (Standard: `~/.openclaw`).
- Gateway-URL und Bindungsmodus (`gateway.bind`; Standardport: `18789`).
- Authentifizierungsmodus, Quelle für Token/Passwort oder Identitätsquelle des vertrauenswürdigen Proxys.
- Jeden aktivierten Kanal und ob er Direktnachrichten, Gruppen oder Webhooks akzeptiert.
- Agenten, die für nicht lokale Absender erreichbar sind.
- Toolprofil, Sandbox-Modus und Richtlinie für privilegierte Tools jedes erreichbaren Agenten.
- Externe Zugangsdaten, die diesen Agenten zur Verfügung stehen.
- Sicherungsort für `~/.openclaw/openclaw.json` und Zugangsdaten.

Wenn mehr als eine Person dem Bot Nachrichten senden kann, behandeln Sie dies als gemeinsam delegierte
Tool-Berechtigung und nicht als Host-Isolation pro Benutzer.

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

Übergeben Sie für die Validierung per Remote-CLI die Zugangsdaten explizit:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Gehen Sie nicht davon aus, dass Zugangsdaten aus der lokalen Konfiguration für eine explizite Remote-URL gelten.

## Minimaler sicherer Ausgangszustand

Verwenden Sie diese Struktur als Ausgangspunkt für zugänglich gemachte Bereitstellungen:

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

Lockern Sie jeweils nur eine Kontrolle: Fügen Sie eine spezifische Kanal-Zulassungsliste hinzu, bevor Sie
Tools mit Schreibzugriff aktivieren, oder aktivieren Sie einen Reverse Proxy, bevor Sie Remote-Datenverkehr der Control UI
akzeptieren.

`tools.exec.security: "deny"` blockiert alle Exec-Aufrufe, einschließlich harmloser
Diagnosen. Wenn Diagnosen oder Befehle mit geringem Risiko erforderlich sind, lockern Sie dies erst,
nachdem Sie die spezifischen Absender, Agenten, Befehle und den Genehmigungsmodus ausgewählt haben, die
Ihrem Bedrohungsmodell entsprechen.

## Offenlegung von Direktnachrichten und Gruppen

Messaging-Kanäle sind Oberflächen für nicht vertrauenswürdige Eingaben. Bevor Sie Direktnachrichten oder
Gruppen zulassen:

- Bevorzugen Sie `dmPolicy: "pairing"` oder eine strikte `allowFrom`-Liste gegenüber `dmPolicy: "open"`.
- Kombinieren Sie `"*"`-Zulassungslisten nicht mit umfassendem Toolzugriff.
- Verlangen Sie Erwähnungen in Gruppen, sofern der Raum nicht streng kontrolliert wird.
- Legen Sie `session.dmScope: "per-channel-peer"` (oder `"per-account-channel-peer"` für
  Kanäle mit mehreren Konten) fest, wenn mehrere Personen dem Bot Direktnachrichten senden können, damit DM-Sitzungen
  keinen Kontext gemeinsam nutzen.
- Leiten Sie gemeinsam genutzte Kanäle an Agenten mit minimalen Tools und ohne persönliche
  Zugangsdaten weiter.

Durch das Pairing wird der Absender autorisiert, den Bot auszulösen. Es macht diesen Absender nicht zu einer
separaten Sicherheitsgrenze des Hosts.

## Prüfungen für Reverse Proxys

Für identitätsbewusste Proxys gilt:

- Der Proxy muss Benutzer authentifizieren, bevor er Anfragen an den Gateway weiterleitet.
- Die Firewall oder Netzwerkrichtlinie muss direkten Zugriff auf den Gateway-Port blockieren.
- `gateway.trustedProxies` darf nur die Quell-IP-Adressen des Proxys aufführen.
- Der Proxy muss vom Client bereitgestellte Identitäts- und Weiterleitungsheader entfernen oder
  überschreiben.
- Legen Sie `gateway.auth.trustedProxy.allowUsers` fest, wenn der Proxy mehr als
  eine Zielgruppe bedient.
- Verwenden Sie `gateway.auth.trustedProxy.allowLoopback` nur für einen Proxy auf demselben Host,
  wenn lokalen Prozessen vertraut wird und der Proxy für die Identitätsheader verantwortlich ist.

Führen Sie nach Proxy-Änderungen `openclaw security audit --deep` aus. Befunde zu vertrauenswürdigen Proxys
haben eine hohe Aussagekraft, da der Proxy zur Authentifizierungsgrenze
wird.

## Überprüfung von Tools und Sandbox

Bevor Sie einen Agenten für Remote-Absender zugänglich machen:

- Prüfen Sie, welche Sitzungen auf dem Host und welche in der Sandbox ausgeführt werden.
- Verweigern Sie die Ausführung auf dem Host oder verlangen Sie dafür eine Genehmigung.
- Lassen Sie privilegierte Tools deaktiviert, sofern sie nicht von einem bestimmten, vertrauenswürdigen Absender benötigt werden.
- Vermeiden Sie Browser-, Canvas-, Node-, Cron-, Gateway- und Tools zum Erzeugen von Sitzungen für offene
  oder teilweise offene Messaging-Oberflächen.
- Halten Sie Bind-Mounts eng begrenzt; vermeiden Sie Pfade für Zugangsdaten, das Home-Verzeichnis, den Docker-Socket und das
  System.
- Verwenden Sie separate Gateways, Betriebssystembenutzer oder Hosts für wesentlich unterschiedliche Vertrauensgrenzen.

Wenn Remote-Benutzern nicht vollständig vertraut wird, muss die Isolation durch separate
Bereitstellungen erfolgen und nicht nur durch Prompts oder Sitzungsbezeichnungen.

## Validierung nach Änderungen

Nach jeder Änderung der Offenlegung:

1. Führen Sie `openclaw security audit --deep` erneut aus.
2. Vergewissern Sie sich, dass eine autorisierte Verbindung erfolgreich hergestellt wird.
3. Vergewissern Sie sich, dass ein nicht autorisierter Absender oder eine nicht autorisierte Browsersitzung abgewiesen wird.
4. Vergewissern Sie sich, dass Geheimnisse in Protokollen unkenntlich gemacht werden.
5. Vergewissern Sie sich, dass das Routing von Direktnachrichten und Gruppen nur den vorgesehenen Agenten erreicht.
6. Vergewissern Sie sich, dass Tools mit großen Auswirkungen eine Genehmigung anfordern oder abgewiesen werden.
7. Dokumentieren Sie die akzeptierten verbleibenden Warnungen.

Fahren Sie erst mit der nächsten Änderung der Offenlegung fort, wenn die aktuelle
verstanden ist.

## Rollback-Plan

Wenn der Gateway möglicherweise zu weit offengelegt ist:

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
2. Rotieren Sie Gateway-Tokens/-Passwörter und betroffene Zugangsdaten für Integrationen.
3. Entfernen Sie `"*"` und unerwartete Absender aus Zulassungslisten.
4. Prüfen Sie aktuelle Audit-Protokolle, den Ausführungsverlauf, Tool-Aufrufe und Konfigurationsänderungen.
5. Führen Sie `openclaw security audit --deep` erneut aus.
6. Aktivieren Sie den Zugriff mit dem restriktivsten Muster erneut, das die Anforderungen des Workflows erfüllt.

## Überprüfungscheckliste

- Der Gateway bleibt ausschließlich auf Loopback beschränkt, sofern kein dokumentierter Grund dagegen spricht.
- Zugriff außerhalb von Loopback verfügt über Authentifizierung und Firewall-Schutz und hat keinen direkten öffentlichen Pfad.
- Bereitstellungen mit vertrauenswürdigem Proxy verwenden strikte Proxy-IP-Adressen und Header-Kontrollen.
- Direktnachrichten verwenden standardmäßig Pairing oder Zulassungslisten und keinen offenen Zugriff.
- Gruppen erfordern Erwähnungen oder explizite Zulassungslisten.
- Gemeinsam genutzte Kanäle haben keinen Zugriff auf persönliche Zugangsdaten.
- Nicht-Hauptsitzungen werden im Sandbox-Modus ausgeführt.
- Ausführung auf dem Host und privilegierte Tools werden verweigert oder sind genehmigungspflichtig.
- Geheimnisse werden in Protokollen unkenntlich gemacht.
- Kritische Audit-Befunde sind behoben.
- Rollback-Schritte sind getestet und dokumentiert.
