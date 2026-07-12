---
read_when:
    - OpenClaw auf EasyRunner bereitstellen
    - Ausführen des Gateways hinter dem Caddy-Proxy von EasyRunner
    - Persistente Volumes und Authentifizierung für ein gehostetes Gateway auswählen
summary: Führen Sie das OpenClaw Gateway auf EasyRunner mit Podman und Caddy aus
title: EasyRunner
x-i18n:
    generated_at: "2026-07-12T15:37:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner hostet das OpenClaw Gateway als kleine containerisierte App hinter seinem
Caddy-Proxy. Diese Anleitung setzt einen EasyRunner-Host voraus, auf dem Podman-kompatible
Compose-Apps ausgeführt werden und der HTTPS über Caddy terminiert.

## Voraussetzungen

- Ein EasyRunner-Server mit einer Domain, die auf ihn verweist.
- Das offizielle OpenClaw-Image (`ghcr.io/openclaw/openclaw`) oder Ihr eigener Build.
- Ein persistentes Konfigurations-Volume für `/home/node/.openclaw`.
- Ein persistentes Workspace-Volume für `/home/node/.openclaw/workspace`.
- Ein starkes Gateway-Token oder Passwort.

Lassen Sie die Geräteauthentifizierung nach Möglichkeit aktiviert. Wenn Ihr Reverse-Proxy
die Geräteidentität nicht korrekt übertragen kann, korrigieren Sie zuerst die Einstellungen
für vertrauenswürdige Proxys (siehe
[Authentifizierung über vertrauenswürdige Proxys](/de/gateway/trusted-proxy-auth)); verwenden Sie gefährliche Umgehungen der
Authentifizierung nur in einem vollständig privaten, vom Betreiber kontrollierten Netzwerk.

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
`OPENCLAW_GATEWAY_TOKEN` im Secret-/Umgebungsvariablen-Manager von EasyRunner, anstatt
es in die App-Definition zu übernehmen. Das Image bindet standardmäßig an die Loopback-Schnittstelle,
daher ist die explizite Angabe `--bind lan --port 1455` unter `command` erforderlich, damit Caddy
den Container erreichen kann.

## OpenClaw konfigurieren

Halten Sie das Gateway innerhalb des persistenten Konfigurations-Volumes ausschließlich über
den Proxy erreichbar und verlangen Sie eine Authentifizierung:

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

Wenn Caddy TLS für das Gateway terminiert, konfigurieren Sie die Einstellungen für vertrauenswürdige Proxys für den exakten Proxy-Pfad, anstatt die Authentifizierungsprüfungen global zu deaktivieren. Siehe
[Authentifizierung über vertrauenswürdige Proxys](/de/gateway/trusted-proxy-auth).

## Überprüfen

Von Ihrer Workstation aus:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

Auf dem EasyRunner-Host benötigen `GET /healthz` (Verfügbarkeit) und `GET /readyz`
(Bereitschaft) keine Authentifizierung und dienen als Grundlage für die integrierte
Container-Zustandsprüfung des Images. Prüfen Sie außerdem die App-Protokolle auf
ein empfangsbereites Gateway und darauf, dass beim Start keine Authentifizierungsfehler
bei SecretRef, Plugins oder Kanälen auftreten.

## Updates und Sicherungen

- Rufen Sie das neue OpenClaw-Image ab oder erstellen Sie es und stellen Sie anschließend die EasyRunner-App erneut bereit.
- Sichern Sie das Volume `openclaw-config` vor Updates. Es enthält
  `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` und den Zustand
  installierter Plugin-Pakete.
- Sichern Sie `openclaw-workspace`, wenn Agenten dort dauerhafte Projektdaten speichern.
- Führen Sie nach größeren Updates `openclaw doctor` aus, um Konfigurationsmigrationen und
  Dienstwarnungen zu erkennen.

## Fehlerbehebung

- `gateway probe` kann keine Verbindung herstellen: Stellen Sie sicher, dass der Caddy-Hostname auf die App verweist
  und der Container auf `0.0.0.0:1455` lauscht.
- Die Authentifizierung schlägt fehl: Rotieren Sie gleichzeitig das Token in den EasyRunner-Secrets und
  im lokalen Client-Befehl.
- Dateien gehören nach der Wiederherstellung root: Das Image wird als `node` (uid 1000) ausgeführt;
  korrigieren Sie die Berechtigungen der eingebundenen Volumes, damit dieser Benutzer Schreibzugriff auf
  `/home/node/.openclaw` und `/home/node/.openclaw/workspace` hat.
- Browser- oder Kanal-Plugins schlagen fehl: Prüfen Sie, ob die erforderlichen externen
  Binärdateien, ausgehenden Netzwerkverbindungen und eingebundenen Anmeldedaten im
  Container verfügbar sind.
