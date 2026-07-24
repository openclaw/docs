---
read_when:
    - Sie möchten einen günstigen, durchgehend verfügbaren Linux-Host für das Gateway.
    - Sie möchten aus der Ferne auf die Control UI zugreifen, ohne einen eigenen VPS zu betreiben
summary: OpenClaw Gateway auf exe.dev (VM + HTTPS-Proxy) für den Fernzugriff ausführen
title: exe.dev
x-i18n:
    generated_at: "2026-07-24T03:52:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**Ziel:** OpenClaw Gateway läuft auf einer [exe.dev](https://exe.dev)-VM und ist unter `https://<vm-name>.exe.xyz` erreichbar.

Diese Anleitung setzt das standardmäßige **exeuntu**-Image von exe.dev voraus. Ordnen Sie die Pakete bei anderen Distributionen entsprechend zu.

## Voraussetzungen

- exe.dev-Konto
- `ssh exe.dev`-Zugriff auf exe.dev-VMs (optional, für die manuelle Einrichtung)

## Schnelleinstieg für Einsteiger

1. Öffnen Sie [https://exe.new/openclaw](https://exe.new/openclaw)
2. Geben Sie bei Bedarf Ihren Authentifizierungsschlüssel bzw. Ihr Token ein
3. Klicken Sie neben Ihrer VM auf "Agent" und warten Sie, bis Shelley die Bereitstellung abgeschlossen hat
4. Öffnen Sie `https://<vm-name>.exe.xyz/` und authentifizieren Sie sich mit dem konfigurierten gemeinsamen Geheimnis (standardmäßig Token-Authentifizierung; Passwort-Authentifizierung funktioniert ebenfalls, wenn Sie `gateway.auth.mode` umstellen)
5. Genehmigen Sie ausstehende Anfragen zur Gerätekopplung mit `openclaw devices approve <requestId>`

## Automatisierte Installation mit Shelley

Shelley, der Agent von exe.dev, kann OpenClaw anhand einer Eingabeaufforderung installieren:

```text
Richten Sie OpenClaw (https://docs.openclaw.ai/install) auf dieser VM ein. Verwenden Sie für das OpenClaw-Onboarding die Flags für den nicht interaktiven Modus und zum Akzeptieren des Risikos. Fügen Sie nach Bedarf die bereitgestellte Authentifizierung oder das Token hinzu. Konfigurieren Sie nginx so, dass Anfragen vom Standardport 18789 an den Stamm-Pfad in der standardmäßig aktivierten Website-Konfiguration weitergeleitet werden, und stellen Sie sicher, dass WebSocket-Unterstützung aktiviert ist. Die Kopplung erfolgt mit "openclaw devices list" und "openclaw devices approve <request id>". Stellen Sie sicher, dass das Dashboard anzeigt, dass der Zustand von OpenClaw OK ist. exe.dev übernimmt für uns die Weiterleitung von Port 8000 zu Port 80/443 sowie HTTPS, daher sollte die endgültige Angabe für "erreichbar" <vm-name>.exe.xyz ohne Portangabe lauten.
```

## Manuelle Installation

<Steps>
  <Step title="VM erstellen">
    Auf Ihrem Gerät:

    ```bash
    ssh exe.dev new
    ```

    Stellen Sie anschließend die Verbindung her:

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    Behalten Sie diese VM **zustandsbehaftet** bei. OpenClaw speichert `openclaw.json`, agentenspezifische `auth-profiles.json`, Sitzungen sowie den Kanal-/Provider-Status unter `~/.openclaw/` und den Arbeitsbereich unter `~/.openclaw/workspace/`.
    </Tip>

  </Step>

  <Step title="Voraussetzungen installieren (auf der VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="OpenClaw installieren">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="nginx als Proxy zu Port 8000 konfigurieren">
    Bearbeiten Sie `/etc/nginx/sites-enabled/default`:

    ```nginx
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        listen 8000;
        listen [::]:8000;

        server_name _;

        location / {
            proxy_pass http://127.0.0.1:18789;
            proxy_http_version 1.1;

            # WebSocket-Unterstützung
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # Standardmäßige Proxy-Header
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Zeitüberschreitungseinstellungen für langlebige Verbindungen
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }
    ```

    Überschreiben Sie Weiterleitungs-Header, anstatt vom Client bereitgestellte Ketten beizubehalten. OpenClaw vertraut weitergeleiteten IP-Metadaten nur von ausdrücklich konfigurierten Proxys, und durch Anhängen erzeugte `X-Forwarded-For`-Ketten werden als Sicherheitsrisiko behandelt.

  </Step>

  <Step title="Auf OpenClaw zugreifen und Geräte genehmigen">
    Öffnen Sie `https://<vm-name>.exe.xyz/` (siehe die Ausgabe der Control UI beim Onboarding). Wenn Sie zur Authentifizierung aufgefordert werden, fügen Sie das konfigurierte gemeinsame Geheimnis von der VM ein.

    Diese Anleitung verwendet standardmäßig Token-Authentifizierung. Rufen Sie daher `gateway.auth.token` mit `openclaw config get gateway.auth.token` ab oder erzeugen Sie mit `openclaw doctor --n` ein neues Token. Wenn Sie den Gateway auf Passwort-Authentifizierung umgestellt haben, verwenden Sie stattdessen `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.

    Genehmigen Sie Geräte mit `openclaw devices list` und `openclaw devices approve <requestId>`. Verwenden Sie im Zweifelsfall Shelley in Ihrem Browser.

  </Step>
</Steps>

## Remote-Kanaleinrichtung

Bevorzugen Sie bei Remote-Hosts einen einzigen `config patch`-Aufruf gegenüber vielen SSH-Aufrufen an `config set`. Bewahren Sie echte Tokens in der VM-Umgebung oder in `~/.openclaw/.env` auf und tragen Sie in `openclaw.json` ausschließlich SecretRefs ein. Den vollständigen SecretRef-Vertrag finden Sie unter [Geheimnisverwaltung](/de/gateway/secrets).

Sorgen Sie auf der VM dafür, dass die Dienstumgebung die benötigten Geheimnisse enthält:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

Erstellen Sie auf Ihrem lokalen Rechner eine Patch-Datei und leiten Sie sie an die VM weiter:

```json5
// openclaw.remote.patch.json5
{
  secrets: {
    providers: {
      default: { source: "env" },
    },
  },
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --dry-run' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw gateway restart && openclaw health'
```

Verwenden Sie `--replace-path`, wenn eine verschachtelte Zulassungsliste exakt dem Patch-Wert entsprechen soll, beispielsweise beim Ersetzen der Zulassungsliste eines Discord-Kanals:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

Die vollständige Referenz zur Kanalkonfiguration finden Sie unter [Discord](/de/channels/discord) und [Slack](/de/channels/slack).

## Remote-Zugriff

exe.dev übernimmt die Authentifizierung für den Remote-Zugriff. Standardmäßig wird HTTP-Datenverkehr von Port 8000 mit E-Mail-Authentifizierung an `https://<vm-name>.exe.xyz` weitergeleitet.

## Aktualisierung

```bash
openclaw update
```

Informationen zum Wechseln von Kanälen und zur manuellen Wiederherstellung finden Sie unter [Aktualisierung](/de/install/updating).

## Verwandte Themen

- [Remote-Gateway](/de/gateway/remote)
- [Installationsübersicht](/de/install)
