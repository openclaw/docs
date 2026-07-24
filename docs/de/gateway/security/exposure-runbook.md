---
read_when:
    - Bereitstellen des Gateways über LAN, Tailnet, Tailscale Serve, Funnel oder einen Reverse-Proxy
    - Überprüfen einer Bereitstellung, bevor echte Messaging-Benutzer zugelassen werden
    - Zurücksetzen einer riskanten Fernzugriffs- oder DM-Konfiguration
sidebarTitle: Exposure runbook
summary: Vorabprüfungs- und Rollback-Checkliste vor der Bereitstellung eines OpenClaw Gateway außerhalb der Loopback-Schnittstelle
title: Runbook zur Gateway-Exposition
x-i18n:
    generated_at: "2026-07-24T03:53:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb8e66af57e804325afc91281122b822183337177c734efe065c5fc18b175e72
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Machen Sie den Gateway erst zugänglich, nachdem Sie erklären können, wer ihn erreichen kann, wie diese Personen
authentifiziert werden, welche Agenten sie auslösen können und welche Tools diese Agenten
verwenden können. Kehren Sie im Zweifelsfall zum ausschließlichen Loopback-Zugriff zurück und führen Sie das Audit erneut aus.
</Warning>

Dieses Runbook überführt die umfassenderen Hinweise unter [Sicherheit](/de/gateway/security) in eine
Checkliste für Betreiber zur Exposition von Fernzugriff und Messaging.

## Expositionsmuster auswählen

Bevorzugen Sie das engste Muster, das den Workflow erfüllt.

| Muster                     | Empfohlen für                                   | Erforderliche Kontrollen                                                                                                               |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Loopback + SSH-Tunnel      | Persönliche Nutzung, Administratorzugriff, Debugging           | `gateway.bind: "loopback"` beibehalten und `127.0.0.1:18789` tunneln                                                                    |
| Loopback + Tailscale Serve | Persönlicher Tailnet-Zugriff auf Control UI/WebSocket | Gateway ausschließlich über Loopback zugänglich halten; Tailscale-Identitäts-Header authentifizieren nur die WebSocket-Oberfläche der Control UI, nicht andere Authentifizierungspfade |
| Tailnet-/LAN-Bindung       | Dediziertes privates Netzwerk mit bekannten Geräten    | Gateway-Authentifizierung, Firewall-Zulassungsliste, keine öffentliche Portweiterleitung                                                                        |
| Vertrauenswürdiger Reverse-Proxy      | Organisationsweites SSO/OIDC vor dem Gateway       | `trusted-proxy`-Authentifizierung, striktes `trustedProxies`, Regeln zum Überschreiben/Entfernen von Headern, explizit zugelassene Benutzer                             |
| Öffentliches Internet            | Seltene Bereitstellungen mit hohem Risiko                     | Identitätsbewusster Proxy, TLS, Ratenbegrenzungen, strikte Zulassungslisten, isolierte Nicht-Hauptsitzungen                                          |

Vermeiden Sie eine direkte öffentliche Portweiterleitung zum Gateway. Wenn öffentlicher Zugriff
erforderlich ist, schalten Sie einen identitätsbewussten Proxy davor und machen Sie den Proxy zum
einzigen Netzwerkpfad zum Gateway.

## Bestandsaufnahme vorab

Halten Sie Folgendes fest, bevor Sie Bindungs-, Proxy-, Tailscale- oder Kanalrichtlinien ändern:

- Gateway-Host, Betriebssystembenutzer und Zustandsverzeichnis (Standard: `~/.openclaw`).
- Gateway-URL und Bindungsmodus (`gateway.bind`; Standardport: `18789`).
- Authentifizierungsmodus, Quelle für Token/Passwort oder Identitätsquelle des vertrauenswürdigen Proxys.
- Jeder aktivierte Kanal und ob er Direktnachrichten, Gruppen oder Webhooks akzeptiert.
- Agenten, die für nicht lokale Absender erreichbar sind.
- Tool-Profil, Sandbox-Modus und Richtlinie für privilegierte Tools jedes erreichbaren Agenten.
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
finden Sie die Bedeutung jedes `checkId` und den zugehörigen Reparaturschlüssel.

Übergeben Sie für die Remote-CLI-Validierung die Zugangsdaten explizit:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Gehen Sie nicht davon aus, dass Zugangsdaten aus der lokalen Konfiguration für eine explizite Remote-URL gelten.

## Minimale sichere Ausgangsbasis

Verwenden Sie diese Struktur als Ausgangspunkt für exponierte Bereitstellungen:

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
Tools mit Schreibzugriff aktivieren, oder aktivieren Sie einen Reverse-Proxy, bevor Sie Remote-Datenverkehr der Control UI
akzeptieren.

`tools.exec.security: "deny"` blockiert alle Exec-Aufrufe, einschließlich unbedenklicher
Diagnosen. Wenn Diagnosen oder Befehle mit geringem Risiko erforderlich sind, lockern Sie dies erst,
nachdem Sie die spezifischen Absender, Agenten, Befehle und den Genehmigungsmodus ausgewählt haben, die
Ihrem Bedrohungsmodell entsprechen.

## Exposition von Direktnachrichten und Gruppen

Messaging-Kanäle sind Oberflächen für nicht vertrauenswürdige Eingaben. Bevor Sie Direktnachrichten oder
Gruppen zulassen:

- Bevorzugen Sie `dmPolicy: "pairing"` oder eine strikte `allowFrom`-Liste gegenüber `dmPolicy: "open"`.
- Kombinieren Sie `"*"`-Zulassungslisten nicht mit umfassendem Tool-Zugriff.
- Verlangen Sie Erwähnungen in Gruppen, sofern der Raum nicht streng kontrolliert wird.
- Legen Sie `session.dmScope: "per-channel-peer"` (oder `"per-account-channel-peer"` für
  Kanäle mit mehreren Konten) fest, wenn mehrere Personen dem Bot Direktnachrichten senden können, damit Direktnachrichtensitzungen
  keinen Kontext teilen.
- Leiten Sie gemeinsam genutzte Kanäle an Agenten mit minimalen Tools und ohne persönliche
  Zugangsdaten weiter.

Durch das Pairing wird der Absender autorisiert, den Bot auszulösen. Es macht diesen Absender nicht zu einer
separaten Host-Sicherheitsgrenze.

## Reverse-Proxy-Prüfungen

Für identitätsbewusste Proxys:

- Der Proxy muss Benutzer authentifizieren, bevor er Anfragen an den Gateway weiterleitet.
- Eine Firewall- oder Netzwerkrichtlinie muss direkten Zugriff auf den Gateway-Port blockieren.
- `gateway.trustedProxies` darf nur die Quell-IP-Adressen des Proxys auflisten.
- Der Proxy muss vom Client bereitgestellte Identitäts- und Weiterleitungs-
  Header entfernen oder überschreiben.
- Legen Sie `gateway.auth.trustedProxy.allowUsers` fest, wenn der Proxy mehr als
  eine Zielgruppe bedient.
- Verwenden Sie `gateway.auth.trustedProxy.allowLoopback` nur für einen Proxy auf demselben Host,
  wenn lokalen Prozessen vertraut wird und der Proxy die Identitäts-Header kontrolliert.

Führen Sie nach Proxy-Änderungen `openclaw security audit --deep` aus. Befunde zu vertrauenswürdigen Proxys
sind besonders aussagekräftig, da der Proxy zur Authentifizierungsgrenze
wird.

## Überprüfung von Tools und Sandbox

Bevor Sie einen Agenten für Remote-Absender zugänglich machen:

- Prüfen Sie, welche Sitzungen auf dem Host und welche in der Sandbox ausgeführt werden.
- Verweigern Sie die Host-Ausführung oder verlangen Sie dafür eine Genehmigung.
- Lassen Sie privilegierte Tools deaktiviert, sofern sie nicht von einem bestimmten vertrauenswürdigen Absender benötigt werden.
- Vermeiden Sie Browser-, Canvas-, Node-, Cron-, Gateway- und Sitzungserstellungs-Tools für offene
  oder teilweise offene Messaging-Oberflächen.
- Halten Sie Bind-Mounts eng begrenzt; vermeiden Sie Pfade zu Zugangsdaten, Home-Verzeichnissen, Docker-Sockets und System-
  verzeichnissen.
- Verwenden Sie separate Gateways, Betriebssystembenutzer oder Hosts für wesentlich unterschiedliche Vertrauens-
  grenzen.

Wenn Remote-Benutzer nicht vollständig vertrauenswürdig sind, muss die Isolation durch separate
Bereitstellungen erfolgen und nicht nur durch Prompts oder Sitzungsbezeichnungen.

## Validierung nach Änderungen

Nach jeder Änderung der Exposition:

1. Führen Sie `openclaw security audit --deep` erneut aus.
2. Bestätigen Sie, dass eine autorisierte Verbindung erfolgreich hergestellt wird.
3. Bestätigen Sie, dass ein nicht autorisierter Absender oder eine nicht autorisierte Browsersitzung abgewiesen wird.
4. Bestätigen Sie, dass Protokolle Geheimnisse unkenntlich machen.
5. Bestätigen Sie, dass die Weiterleitung von Direktnachrichten/Gruppen nur den vorgesehenen Agenten erreicht.
6. Bestätigen Sie, dass Tools mit hohen Auswirkungen eine Genehmigung anfordern oder verweigert werden.
7. Dokumentieren Sie die akzeptierten verbleibenden Warnungen.

Fahren Sie nicht mit der nächsten Expositionsänderung fort, bevor die aktuelle
verstanden ist.

## Rollback-Plan

Wenn der Gateway möglicherweise zu stark exponiert ist:

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
2. Rotieren Sie Gateway-Tokens/-Passwörter und betroffene Integrationszugangsdaten.
3. Entfernen Sie `"*"` und unerwartete Absender aus Zulassungslisten.
4. Überprüfen Sie aktuelle Audit-Protokolle, den Ausführungsverlauf, Tool-Aufrufe und Konfigurationsänderungen.
5. Führen Sie `openclaw security audit --deep` erneut aus.
6. Aktivieren Sie den Zugriff mit dem engsten Muster erneut, das den Workflow erfüllt.

## Prüfliste

- Der Gateway bleibt ausschließlich über Loopback zugänglich, sofern kein dokumentierter Grund vorliegt.
- Nicht-Loopback-Zugriff verfügt über Authentifizierung und Firewall-Schutz und hat keinen direkten öffentlichen Pfad.
- Bereitstellungen mit vertrauenswürdigem Proxy verfügen über strikt begrenzte Proxy-IP-Adressen und Header-Kontrollen.
- Direktnachrichten verwenden standardmäßig Pairing oder Zulassungslisten statt offenen Zugriffs.
- Gruppen erfordern Erwähnungen oder explizite Zulassungslisten.
- Gemeinsam genutzte Kanäle haben keinen Zugriff auf persönliche Zugangsdaten.
- Nicht-Hauptsitzungen werden im Sandbox-Modus ausgeführt.
- Host-Ausführung und privilegierte Tools werden verweigert oder sind genehmigungspflichtig.
- Protokolle machen Geheimnisse unkenntlich.
- Kritische Audit-Befunde sind behoben.
- Rollback-Schritte sind getestet und dokumentiert.
