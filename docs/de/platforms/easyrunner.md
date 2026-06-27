---
read_when:
    - OpenClaw auf EasyRunner bereitstellen
    - Den Gateway hinter dem Caddy-Proxy von EasyRunner ausführen
    - Persistente Volumes und Authentifizierung für einen gehosteten Gateway auswählen
summary: OpenClaw Gateway auf EasyRunner mit Podman und Caddy ausführen
title: EasyRunner
x-i18n:
    generated_at: "2026-06-27T17:41:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b6d67270e1b47ecbd67361edd018b531598d0365e2dacd594cb73c6b74c10478
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner kann das OpenClaw Gateway als kleine containerisierte App hinter seinem
Caddy-Proxy hosten. Diese Anleitung setzt einen EasyRunner-Host voraus, der Podman-kompatible
Compose-Apps ausführt und HTTPS über Caddy bereitstellt.

## Bevor Sie beginnen

- Ein EasyRunner-Server mit einer darauf gerouteten Domain.
- Ein gebautes oder veröffentlichtes OpenClaw-Container-Image.
- Ein persistentes Konfigurations-Volume für `/home/node/.openclaw`.
- Ein persistentes Workspace-Volume für `/workspace`.
- Ein starkes Gateway-Token oder Passwort.

Lassen Sie die Geräteauthentifizierung nach Möglichkeit aktiviert. Wenn Ihre Reverse-Proxy-Bereitstellung
die Geräteidentität nicht korrekt weitergeben kann, beheben Sie zuerst die Trusted-Proxy-Einstellungen; verwenden Sie
gefährliche Authentifizierungs-Bypässe nur für ein vollständig privates, vom Betreiber kontrolliertes Netzwerk.

## Compose-App

Erstellen Sie eine EasyRunner-App mit einer Compose-Datei in dieser Form:

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["openclaw", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

Ersetzen Sie `openclaw.example.com` durch Ihren Gateway-Hostnamen. Speichern Sie
`OPENCLAW_GATEWAY_TOKEN` im Secret-/Umgebungsmanager von EasyRunner, anstatt es
in die App-Definition zu committen.

## OpenClaw konfigurieren

Halten Sie das Gateway innerhalb des persistenten Konfigurations-Volumes nur über
den Proxy erreichbar und verlangen Sie Authentifizierung:

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

Wenn Caddy TLS für das Gateway terminiert, konfigurieren Sie Trusted-Proxy-Einstellungen für
den genauen Proxy-Pfad, anstatt Authentifizierungsprüfungen global zu deaktivieren. Siehe
[Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth).

## Überprüfen

Von Ihrer Workstation aus:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

Prüfen Sie auf dem EasyRunner-Host die App-Logs auf ein lauschendes Gateway und keine
Startfehler bei SecretRef-, Plugin- oder Kanal-Authentifizierung.

## Updates und Backups

- Ziehen oder bauen Sie das neue OpenClaw-Image und stellen Sie anschließend die EasyRunner-App erneut bereit.
- Sichern Sie das Volume `openclaw-config` vor Updates.
- Sichern Sie `openclaw-workspace`, wenn Agenten dort dauerhafte Projektdaten schreiben.
- Führen Sie `openclaw doctor` nach größeren Updates aus, um Konfigurationsmigrationen und
  Dienstwarnungen zu erkennen.

## Fehlerbehebung

- `gateway probe` kann keine Verbindung herstellen: Bestätigen Sie, dass der Caddy-Hostname auf die App zeigt
  und dass der Container auf `0.0.0.0:1455` lauscht.
- Authentifizierung schlägt fehl: Rotieren Sie das Token in EasyRunner-Secrets und im lokalen Client-Befehl
  gemeinsam.
- Dateien gehören nach der Wiederherstellung root: Reparieren Sie die eingebundenen Volumes, damit der
  Container-Benutzer in `/home/node/.openclaw` und `/workspace` schreiben kann.
- Browser- oder Kanal-Plugins schlagen fehl: Prüfen Sie, ob die erforderlichen externen
  Binärdateien, der Netzwerk-Egress und eingebundene Anmeldedaten innerhalb des
  Containers verfügbar sind.
