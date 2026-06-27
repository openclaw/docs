---
read_when:
    - Bereitstellen des Gateway über LAN, tailnet, Tailscale Serve, Funnel oder einen Reverse Proxy
    - Überprüfen einer Bereitstellung, bevor echte Messaging-Benutzer zugelassen werden
    - Eine riskante Remote-Zugriffs- oder DM-Konfiguration zurücksetzen
sidebarTitle: Exposure runbook
summary: Vorab- und Rollback-Checkliste, bevor Sie einen OpenClaw Gateway über Loopback hinaus freigeben
title: Gateway-Expositions-Runbook
x-i18n:
    generated_at: "2026-06-27T17:33:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5e94cc03b9d79a03eb16aa04bad0fd311b72f27f14182c036832382dbce3d0f
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Geben Sie den Gateway erst frei, wenn Sie erklären können, wer ihn erreichen kann, wie diese Personen
authentifiziert werden, welche Agenten sie auslösen können und welche Tools diese Agenten
verwenden dürfen. Kehren Sie im Zweifel zu reinem Loopback-Zugriff zurück und führen Sie das Audit erneut aus.
</Warning>

Dieses Runbook überführt die allgemeinere Anleitung unter [Sicherheit](/de/gateway/security) in eine
Operator-Checkliste für Remotezugriff und Messaging-Freigabe.

## Freigabemuster wählen

Bevorzugen Sie das engste Muster, das den Workflow erfüllt.

| Muster                     | Empfohlen, wenn                                  | Erforderliche Kontrollen                                                                            |
| -------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Loopback + SSH-Tunnel      | Persönliche Nutzung, Adminzugriff, Debugging    | `gateway.bind: "loopback"` beibehalten und `127.0.0.1:18789` tunneln                                |
| Loopback + Tailscale Serve | Persönlicher Tailnet-Zugriff auf Control UI/WebSocket | Gateway nur über Loopback erreichbar halten; Tailscale-Identity-Header nur für unterstützte Oberflächen verwenden |
| Tailnet/LAN-Bind           | Dediziertes privates Netzwerk mit bekannten Geräten | Gateway-Auth, Firewall-Allowlist, kein öffentliches Port-Forwarding                                 |
| Vertrauenswürdiger Reverse Proxy | Organisations-SSO/OIDC vor dem Gateway    | `trusted-proxy`-Auth, strikte `trustedProxies`, Regeln zum Überschreiben/Entfernen von Headern, explizit erlaubte Benutzer |
| Öffentliches Internet      | Seltene Hochrisiko-Deployments                  | Identity-aware Proxy, TLS, Ratenbegrenzungen, strikte Allowlists, isolierte Nicht-main-Sitzungen    |

Vermeiden Sie direktes öffentliches Port-Forwarding zum Gateway. Wenn Sie öffentlichen Zugriff benötigen,
schalten Sie einen identity-aware Proxy davor und machen Sie den Proxy zum einzigen Netzwerkpfad
zum Gateway.

## Preflight-Inventar

Notieren Sie Folgendes, bevor Sie Bind-, Proxy-, Tailscale- oder Channel-Richtlinien ändern:

- Gateway-Host, OS-Benutzer und State-Verzeichnis.
- Gateway-URL und Bind-Modus.
- Auth-Modus, Token-/Passwortquelle oder Identity-Quelle des vertrauenswürdigen Proxys.
- Alle aktivierten Channels und ob sie DMs, Gruppen oder Webhooks akzeptieren.
- Agenten, die von nicht lokalen Absendern erreichbar sind.
- Tool-Profil, Sandbox-Modus und Richtlinie für erhöhte Tools für jeden erreichbaren Agenten.
- Externe Zugangsdaten, die diesen Agenten zur Verfügung stehen.
- Backup-Speicherort für `~/.openclaw/openclaw.json` und Zugangsdaten.

Wenn mehr als eine Person dem Bot Nachrichten senden kann, behandeln Sie dies als gemeinsam delegierte Tool-Berechtigung,
nicht als hostseitige Isolation pro Benutzer.

## Basisprüfungen

Führen Sie diese aus, bevor Sie Zugriff öffnen:

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Beheben Sie kritische Befunde zuerst. Warnungen können nur akzeptabel sein, wenn sie
absichtlich sind und für das Deployment dokumentiert wurden.

Übergeben Sie Zugangsdaten für die Remote-CLI-Validierung explizit:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Gehen Sie nicht davon aus, dass lokale Konfigurations-Zugangsdaten für eine explizite Remote-URL gelten.

## Sichere Mindestbasis

Verwenden Sie diese Form als Ausgangspunkt für freigegebene Deployments:

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

Weiten Sie anschließend jeweils nur eine Kontrolle aus. Fügen Sie beispielsweise eine spezifische Channel-Allowlist hinzu,
bevor Sie schreibfähige Tools aktivieren, oder aktivieren Sie einen Reverse Proxy, bevor Sie
Remote-Control-UI-Traffic akzeptieren.

Die strikte Basis `exec.security: "deny"` blockiert alle Exec-Aufrufe, einschließlich
harmloser Diagnosen. Wenn Diagnosen oder Befehle mit geringem Risiko erforderlich sind, lockern Sie dies
erst, nachdem Sie die konkreten Absender, Agenten, Befehle und den Genehmigungsmodus gewählt haben,
die zu Ihrem Bedrohungsmodell passen.

## DM- und Gruppenfreigabe

Messaging-Channels sind nicht vertrauenswürdige Eingabeoberflächen. Bevor Sie DMs oder Gruppen zulassen:

- Bevorzugen Sie `dmPolicy: "pairing"` oder strikte `allowFrom`-Listen.
- Vermeiden Sie `dmPolicy: "open"`, sofern nicht jeder Absender vertrauenswürdig ist.
- Kombinieren Sie `"*"`-Allowlists nicht mit breitem Tool-Zugriff.
- Verlangen Sie Erwähnungen in Gruppen, sofern der Raum nicht streng kontrolliert ist.
- Verwenden Sie `session.dmScope: "per-channel-peer"`, wenn mehrere Personen dem Bot DMs senden können.
- Leiten Sie gemeinsame Channels an Agenten mit minimalen Tools und ohne persönliche Zugangsdaten.

Pairing berechtigt den Absender, den Bot auszulösen. Es macht diesen Absender nicht zu einer
separaten Host-Sicherheitsgrenze.

## Reverse-Proxy-Prüfungen

Für identity-aware Proxys:

- Der Proxy muss Benutzer authentifizieren, bevor er an den Gateway weiterleitet.
- Direkter Zugriff auf den Gateway-Port muss durch Firewall oder Netzwerkrichtlinie blockiert sein.
- `gateway.trustedProxies` darf nur die Quell-IPs des Proxys enthalten.
- Der Proxy muss vom Client gelieferte Identity- und Forwarding-Header entfernen oder überschreiben.
- `gateway.auth.trustedProxy.allowUsers` sollte die erwarteten Benutzer auflisten, wenn der Proxy mehr als eine Zielgruppe bedient.
- Same-Host-Loopback-Proxy-Modus sollte `allowLoopback` nur verwenden, wenn lokale Prozesse vertrauenswürdig sind und der Proxy die Identity-Header kontrolliert.

Führen Sie nach Proxy-Änderungen `openclaw security audit --deep` aus. Trusted-Proxy-Befunde
sind absichtlich hochsignalig, weil der Proxy zur Authentifizierungsgrenze wird.

## Tool- und Sandbox-Review

Bevor Sie einen Agenten für Remote-Absender freigeben:

- Bestätigen Sie, welche Sitzungen auf dem Host und welche in der Sandbox laufen.
- Verweigern Sie Host-Exec oder verlangen Sie dafür eine Genehmigung.
- Lassen Sie erhöhte Tools deaktiviert, sofern kein spezifischer, vertrauenswürdiger Absender sie benötigt.
- Vermeiden Sie Browser-, Canvas-, Node-, Cron-, Gateway- und Session-Spawn-Tools für offene oder halb offene Messaging-Oberflächen.
- Halten Sie Bind-Mounts eng begrenzt und vermeiden Sie Pfade zu Zugangsdaten, Home, Docker-Socket und Systempfaden.
- Verwenden Sie separate Gateways, OS-Benutzer oder Hosts für wesentlich unterschiedliche Vertrauensgrenzen.

Wenn Remote-Benutzer nicht vollständig vertrauenswürdig sind, muss die Isolation aus separaten
Deployments entstehen, nicht nur aus Prompts oder Sitzungslabels.

## Validierung nach Änderungen

Nach jeder Freigabeänderung:

1. Führen Sie `openclaw security audit --deep` erneut aus.
2. Testen Sie eine erfolgreiche autorisierte Verbindung.
3. Testen Sie, dass ein nicht autorisierter Absender oder eine nicht autorisierte Browsersitzung abgewiesen wird.
4. Bestätigen Sie, dass Logs Geheimnisse redigieren.
5. Bestätigen Sie, dass DM-/Gruppen-Routing nur den beabsichtigten Agenten erreicht.
6. Bestätigen Sie, dass Tools mit hoher Auswirkung um Genehmigung bitten oder verweigert werden.
7. Dokumentieren Sie die akzeptierten verbleibenden Warnungen.

Fahren Sie nicht mit der nächsten Freigabeänderung fort, bis die aktuelle verstanden ist.

## Rollback-Plan

Wenn der Gateway möglicherweise übermäßig freigegeben ist:

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

Dann:

1. Stoppen Sie öffentliche Weiterleitungen, Tailscale Funnel oder Reverse-Proxy-Routen.
2. Rotieren Sie Gateway-Tokens/-Passwörter und betroffene Integrationszugangsdaten.
3. Entfernen Sie `"*"` und unerwartete Absender aus Allowlists.
4. Prüfen Sie aktuelle Audit-Logs, Run-Historie, Tool-Aufrufe und Konfigurationsänderungen.
5. Führen Sie `openclaw security audit --deep` erneut aus.
6. Aktivieren Sie den Zugriff wieder mit dem engsten Muster, das den Workflow erfüllt.

## Review-Checkliste

- Gateway bleibt nur über Loopback erreichbar, sofern es keinen dokumentierten Grund gibt.
- Nicht-Loopback-Zugriff hat Auth, Firewalling und keine öffentliche direkte Route.
- Trusted-Proxy-Deployments haben strikte Proxy-IPs und Header-Kontrollen.
- DMs verwenden Pairing oder Allowlists, nicht standardmäßig offenen Zugriff.
- Gruppen verlangen Erwähnungen oder explizite Allowlists.
- Gemeinsame Channels erreichen keine persönlichen Zugangsdaten.
- Nicht-main-Sitzungen laufen im Sandbox-Modus.
- Host-Exec und erhöhte Tools werden verweigert oder sind genehmigungspflichtig.
- Logs redigieren Geheimnisse.
- Kritische Audit-Befunde sind behoben.
- Rollback-Schritte sind getestet und dokumentiert.
