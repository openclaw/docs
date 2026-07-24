---
read_when:
    - OpenClaw auf EasyRunner bereitstellen
    - Ausführen des Gateway hinter dem Caddy-Proxy von EasyRunner
    - Persistente Volumes und Authentifizierung für einen gehosteten Gateway auswählen
summary: Führen Sie das OpenClaw Gateway auf EasyRunner mit Podman und Caddy aus
title: EasyRunner
x-i18n:
    generated_at: "2026-07-24T05:03:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner hostet das OpenClaw Gateway als kleine containerisierte App hinter seinem
Caddy-Proxy. Diese Anleitung setzt einen EasyRunner-Host voraus, auf dem Podman-kompatible
Compose-Apps ausgeführt werden und der HTTPS über Caddy terminiert.

## Bevor Sie beginnen

- Ein EasyRunner-Server mit einer darauf verweisenden Domain.
- Das offizielle OpenClaw-Image (`ghcr.io/openclaw/openclaw`) oder Ihr eigener Build.
- Ein persistentes Konfigurations-Volume für `/home/node/.openclaw`.
- Ein persistentes Workspace-Volume für `/home/node/.openclaw/workspace`.
- Ein starkes Gateway-Token oder Passwort.

Lassen Sie die Geräteauthentifizierung nach Möglichkeit aktiviert. Wenn Ihr Reverse-Proxy
die Geräteidentität nicht korrekt übertragen kann, korrigieren Sie zuerst die Einstellungen
für vertrauenswürdige Proxys (siehe
[Authentifizierung über vertrauenswürdige Proxys](/de/gateway/trusted-proxy-auth)); verwenden Sie gefährliche
Umgehungen der Authentifizierung nur in einem vollständig privaten, vom Betreiber kontrollierten Netzwerk.

## Compose-App

Erstellen Sie eine EasyRunner-App mit einer Compose-Datei nach folgendem Muster:

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
      OPENCLAW_WORKSPACE_DIR: /home/node/.openclaw/workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/home/node/.openclaw/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

Ersetzen Sie `openclaw.example.com` durch den Hostnamen Ihres Gateways. Speichern Sie
`OPENCLAW_GATEWAY_TOKEN` im Secret-/Umgebungsmanager von EasyRunner, anstatt es
in die App-Definition zu übernehmen. Das Image bindet standardmäßig an die Loopback-Schnittstelle,
daher ist das explizite `--bind lan --port 1455` in `command` erforderlich, damit Caddy
den Container erreichen kann.

## OpenClaw konfigurieren

Sorgen Sie innerhalb des persistenten Konfigurations-Volumes dafür, dass das Gateway nur über
den Proxy erreichbar ist, und verlangen Sie eine Authentifizierung:

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

Wenn Caddy TLS für das Gateway terminiert, konfigurieren Sie die Einstellungen für
vertrauenswürdige Proxys für den exakten Proxy-Pfad, anstatt Authentifizierungsprüfungen global zu deaktivieren. Siehe
[Authentifizierung über vertrauenswürdige Proxys](/de/gateway/trusted-proxy-auth).

## Überprüfen

Von Ihrer Workstation aus:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

Vom EasyRunner-Host aus benötigen `GET /healthz` (Verfügbarkeit) und `GET /readyz`
(Bereitschaft) keine Authentifizierung und bilden die Grundlage für die integrierte
Container-Integritätsprüfung des Images. Prüfen Sie außerdem die App-Protokolle darauf, dass das Gateway Verbindungen entgegennimmt und keine
SecretRef-, Plugin- oder Kanalauthentifizierungsfehler beim Start auftreten.

## Updates und Sicherungen

- Rufen Sie das neue OpenClaw-Image ab oder erstellen Sie es und stellen Sie anschließend die EasyRunner-App erneut bereit.
- Sichern Sie vor Updates das Volume `openclaw-config`. Es enthält
  `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` und den Zustand installierter
  Plugin-Pakete.
- Sichern Sie `openclaw-workspace`, wenn Agenten dort dauerhafte Projektdaten speichern.
- Führen Sie nach größeren Updates `openclaw doctor` aus, um Konfigurationsmigrationen und
  Dienstwarnungen zu erkennen.

## Fehlerbehebung

- `gateway probe` kann keine Verbindung herstellen: Vergewissern Sie sich, dass der Caddy-Hostname auf die App verweist
  und der Container auf `0.0.0.0:1455` Verbindungen entgegennimmt.
- Authentifizierung schlägt fehl: Rotieren Sie das Token gleichzeitig in den EasyRunner-Secrets und im lokalen
  Client-Befehl.
- Dateien gehören nach der Wiederherstellung root: Das Image wird als `node` (UID 1000) ausgeführt;
  korrigieren Sie die Berechtigungen der eingebundenen Volumes, damit dieser Benutzer
  in `/home/node/.openclaw` und `/home/node/.openclaw/workspace` schreiben kann.
- Browser- oder Kanal-Plugins schlagen fehl: Prüfen Sie, ob die erforderlichen externen
  Binärdateien, der ausgehende Netzwerkzugriff und die eingebundenen Anmeldedaten innerhalb des
  Containers verfügbar sind.
