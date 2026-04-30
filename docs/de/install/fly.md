---
read_when:
    - OpenClaw auf Fly.io bereitstellen
    - Fly-Volumes, Secrets und Konfiguration für den ersten Start einrichten
summary: Schritt-für-Schritt-Bereitstellung von OpenClaw auf Fly.io mit persistentem Speicher und HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-30T07:00:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 195a77c4cec439dc2b5030f5ee618274df76b16d878b8d16e65a754e4bd8072c
    source_path: install/fly.md
    workflow: 16
---

# Fly.io-Bereitstellung

**Ziel:** OpenClaw Gateway läuft auf einer [Fly.io](https://fly.io)-Maschine mit persistentem Speicher, automatischem HTTPS und Discord-/Kanalzugriff.

## Was Sie benötigen

- Installierte [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.io-Konto (kostenloser Tarif reicht aus)
- Modellauthentifizierung: API-Schlüssel für Ihren gewählten Modell-Provider
- Kanal-Zugangsdaten: Discord-Bot-Token, Telegram-Token usw.

## Schneller Einstieg für Anfänger

1. Repository klonen → `fly.toml` anpassen
2. App + Volume erstellen → Secrets setzen
3. Mit `fly deploy` bereitstellen
4. Per SSH anmelden, um die Konfiguration zu erstellen, oder Control UI verwenden

<Steps>
  <Step title="Create the Fly app">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Tipp:** Wählen Sie eine Region in Ihrer Nähe. Häufige Optionen: `lhr` (London), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="Configure fly.toml">
    Bearbeiten Sie `fly.toml`, damit sie zu Ihrem App-Namen und Ihren Anforderungen passt.

    **Sicherheitshinweis:** Die Standardkonfiguration stellt eine öffentliche URL bereit. Für eine gehärtete Bereitstellung ohne öffentliche IP siehe [Private Bereitstellung](#private-deployment-hardened) oder verwenden Sie `fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Your app name
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    **Wichtige Einstellungen:**

    | Einstellung                   | Warum                                                                            |
    | ----------------------------- | -------------------------------------------------------------------------------- |
    | `--bind lan`                  | Bindet an `0.0.0.0`, damit der Fly-Proxy das Gateway erreichen kann              |
    | `--allow-unconfigured`        | Startet ohne Konfigurationsdatei (Sie erstellen danach eine)                     |
    | `internal_port = 3000`        | Muss für Fly-Integritätsprüfungen zu `--port 3000` (oder `OPENCLAW_GATEWAY_PORT`) passen |
    | `memory = "2048mb"`           | 512 MB sind zu wenig; 2 GB empfohlen                                             |
    | `OPENCLAW_STATE_DIR = "/data"` | Persistiert den Zustand auf dem Volume                                           |

  </Step>

  <Step title="Set secrets">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Hinweise:**

    - Nicht-Loopback-Bindings (`--bind lan`) erfordern einen gültigen Gateway-Authentifizierungspfad. Dieses Fly.io-Beispiel verwendet `OPENCLAW_GATEWAY_TOKEN`, aber `gateway.auth.password` oder eine korrekt konfigurierte Nicht-Loopback-`trusted-proxy`-Bereitstellung erfüllen die Anforderung ebenfalls.
    - Behandeln Sie diese Token wie Passwörter.
    - **Bevorzugen Sie Umgebungsvariablen gegenüber der Konfigurationsdatei** für alle API-Schlüssel und Token. Dadurch bleiben Secrets aus `openclaw.json` heraus, wo sie versehentlich offengelegt oder protokolliert werden könnten.

  </Step>

  <Step title="Deploy">
    ```bash
    fly deploy
    ```

    Die erste Bereitstellung baut das Docker-Image (ca. 2–3 Minuten). Nachfolgende Bereitstellungen sind schneller.

    Prüfen Sie nach der Bereitstellung:

    ```bash
    fly status
    fly logs
    ```

    Sie sollten Folgendes sehen:

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="Create config file">
    Melden Sie sich per SSH auf der Maschine an, um eine passende Konfiguration zu erstellen:

    ```bash
    fly ssh console
    ```

    Erstellen Sie das Konfigurationsverzeichnis und die Datei:

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto",
        "controlUi": {
          "allowedOrigins": [
            "https://my-openclaw.fly.dev",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
          ]
        }
      },
      "meta": {}
    }
    EOF
    ```

    **Hinweis:** Mit `OPENCLAW_STATE_DIR=/data` ist der Konfigurationspfad `/data/openclaw.json`.

    **Hinweis:** Ersetzen Sie `https://my-openclaw.fly.dev` durch den echten Ursprung Ihrer Fly-App. Der Gateway-Start legt lokale Control-UI-Ursprünge aus den Laufzeitwerten `--bind` und `--port` an, damit der erste Start vor dem Vorhandensein der Konfiguration fortfahren kann, aber Browserzugriff über Fly benötigt weiterhin den exakten HTTPS-Ursprung in `gateway.controlUi.allowedOrigins`.

    **Hinweis:** Das Discord-Token kann aus einer der folgenden Quellen stammen:

    - Umgebungsvariable: `DISCORD_BOT_TOKEN` (für Secrets empfohlen)
    - Konfigurationsdatei: `channels.discord.token`

    Wenn Sie die Umgebungsvariable verwenden, müssen Sie kein Token zur Konfiguration hinzufügen. Das Gateway liest `DISCORD_BOT_TOKEN` automatisch.

    Zum Anwenden neu starten:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Access the Gateway">
    ### Control UI

    Im Browser öffnen:

    ```bash
    fly open
    ```

    Oder besuchen Sie `https://my-openclaw.fly.dev/`

    Authentifizieren Sie sich mit dem konfigurierten gemeinsamen Secret. Diese Anleitung verwendet das Gateway-Token aus `OPENCLAW_GATEWAY_TOKEN`; wenn Sie auf Passwortauthentifizierung gewechselt haben, verwenden Sie stattdessen dieses Passwort.

    ### Protokolle

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### SSH-Konsole

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Fehlerbehebung

### „App lauscht nicht auf der erwarteten Adresse“

Das Gateway bindet an `127.0.0.1` statt an `0.0.0.0`.

**Behebung:** Fügen Sie `--bind lan` zu Ihrem Prozessbefehl in `fly.toml` hinzu.

### Integritätsprüfungen schlagen fehl / Verbindung abgelehnt

Fly kann das Gateway auf dem konfigurierten Port nicht erreichen.

**Behebung:** Stellen Sie sicher, dass `internal_port` zum Gateway-Port passt (setzen Sie `--port 3000` oder `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / Speicherprobleme

Der Container startet ständig neu oder wird beendet. Anzeichen: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` oder stille Neustarts.

**Behebung:** Erhöhen Sie den Speicher in `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Oder aktualisieren Sie eine vorhandene Maschine:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Hinweis:** 512 MB sind zu wenig. 1 GB kann funktionieren, kann aber unter Last oder bei ausführlicher Protokollierung zu OOM führen. **2 GB werden empfohlen.**

### Gateway-Sperrprobleme

Das Gateway verweigert den Start mit Fehlern vom Typ „bereits ausgeführt“.

Dies passiert, wenn der Container neu startet, die PID-Sperrdatei aber auf dem Volume bestehen bleibt.

**Behebung:** Löschen Sie die Sperrdatei:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Die Sperrdatei liegt unter `/data/gateway.*.lock` (nicht in einem Unterverzeichnis).

### Konfiguration wird nicht gelesen

`--allow-unconfigured` umgeht nur die Startschutzprüfung. Es erstellt oder repariert `/data/openclaw.json` nicht. Stellen Sie daher sicher, dass Ihre echte Konfiguration existiert und `gateway.mode="local"` enthält, wenn Sie einen normalen lokalen Gateway-Start wünschen.

Prüfen Sie, ob die Konfiguration existiert:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Konfiguration per SSH schreiben

Der Befehl `fly ssh console -C` unterstützt keine Shell-Umleitung. So schreiben Sie eine Konfigurationsdatei:

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Hinweis:** `fly sftp` kann fehlschlagen, wenn die Datei bereits existiert. Zuerst löschen:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Zustand bleibt nicht bestehen

Wenn Sie nach einem Neustart Authentifizierungsprofile, Kanal-/Provider-Zustand oder Sitzungen verlieren, schreibt das Zustandsverzeichnis in das Container-Dateisystem.

**Behebung:** Stellen Sie sicher, dass `OPENCLAW_STATE_DIR=/data` in `fly.toml` gesetzt ist, und stellen Sie erneut bereit.

## Aktualisierungen

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### Maschinenbefehl aktualisieren

Wenn Sie den Startbefehl ohne vollständige erneute Bereitstellung ändern müssen:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Hinweis:** Nach `fly deploy` kann der Maschinenbefehl auf den Wert aus `fly.toml` zurückgesetzt werden. Wenn Sie manuelle Änderungen vorgenommen haben, wenden Sie sie nach der Bereitstellung erneut an.

## Private Bereitstellung (gehärtet)

Standardmäßig weist Fly öffentliche IPs zu, wodurch Ihr Gateway unter `https://your-app.fly.dev` erreichbar ist. Das ist praktisch, bedeutet aber, dass Ihre Bereitstellung von Internet-Scannern (Shodan, Censys usw.) gefunden werden kann.

Für eine gehärtete Bereitstellung mit **keiner öffentlichen Exponierung** verwenden Sie die private Vorlage.

### Wann Sie private Bereitstellung verwenden sollten

- Sie führen nur **ausgehende** Aufrufe/Nachrichten aus (keine eingehenden Webhooks)
- Sie verwenden **ngrok- oder Tailscale**-Tunnel für Webhook-Rückrufe
- Sie greifen über **SSH, Proxy oder WireGuard** statt über den Browser auf das Gateway zu
- Sie möchten, dass die Bereitstellung **vor Internet-Scannern verborgen** bleibt

### Einrichtung

Verwenden Sie `fly.private.toml` statt der Standardkonfiguration:

```bash
# Deploy with private config
fly deploy -c fly.private.toml
```

Oder konvertieren Sie eine vorhandene Bereitstellung:

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Danach sollte `fly ips list` nur eine IP vom Typ `private` anzeigen:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Zugriff auf eine private Bereitstellung

Da es keine öffentliche URL gibt, verwenden Sie eine dieser Methoden:

**Option 1: Lokaler Proxy (am einfachsten)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**Option 2: WireGuard-VPN**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**Option 3: Nur SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooks mit privater Bereitstellung

Wenn Sie Webhook-Callbacks (Twilio, Telnyx usw.) ohne öffentliche Erreichbarkeit benötigen:

1. **ngrok-Tunnel** - Führen Sie ngrok im Container oder als Sidecar aus
2. **Tailscale Funnel** - Geben Sie bestimmte Pfade über Tailscale frei
3. **Nur ausgehend** - Einige Provider (Twilio) funktionieren für ausgehende Anrufe auch ohne Webhooks problemlos

Beispiel für eine `voice-call`-Konfiguration mit ngrok:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

Der ngrok-Tunnel läuft im Container und stellt eine öffentliche Webhook-URL bereit, ohne die Fly-App selbst offenzulegen. Setzen Sie `webhookSecurity.allowedHosts` auf den öffentlichen Tunnel-Hostnamen, damit weitergeleitete Host-Header akzeptiert werden.

### Sicherheitsvorteile

| Aspekt             | Öffentlich | Privat       |
| ------------------ | ---------- | ------------ |
| Internetscanner    | Auffindbar | Verborgen    |
| Direkte Angriffe   | Möglich    | Blockiert    |
| Control-UI-Zugriff | Browser    | Proxy/VPN    |
| Webhook-Zustellung | Direkt     | Über Tunnel  |

## Hinweise

- Fly.io verwendet **x86-Architektur** (nicht ARM)
- Das Dockerfile ist mit beiden Architekturen kompatibel
- Verwenden Sie für das Onboarding von WhatsApp/Telegram `fly ssh console`
- Persistente Daten liegen auf dem Volume unter `/data`
- Signal erfordert Java + signal-cli; verwenden Sie ein eigenes Image und halten Sie den Speicher bei mindestens 2 GB.

## Kosten

Mit der empfohlenen Konfiguration (`shared-cpu-2x`, 2 GB RAM):

- ca. 10-15 USD/Monat, je nach Nutzung
- Der kostenlose Tarif enthält ein gewisses Kontingent

Details finden Sie unter [Fly.io pricing](https://fly.io/docs/about/pricing/).

## Nächste Schritte

- Messaging-Kanäle einrichten: [Kanäle](/de/channels)
- Gateway konfigurieren: [Gateway-Konfiguration](/de/gateway/configuration)
- OpenClaw aktuell halten: [Aktualisierung](/de/install/updating)

## Verwandt

- [Installationsübersicht](/de/install)
- [Hetzner](/de/install/hetzner)
- [Docker](/de/install/docker)
- [VPS-Hosting](/de/vps)
