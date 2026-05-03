---
read_when:
    - OpenClaw auf Fly.io bereitstellen
    - Fly-Volumes, Secrets und Erstlaufkonfiguration einrichten
summary: Schritt-für-Schritt-Deployment von OpenClaw auf Fly.io mit persistentem Speicher und HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-05-03T21:35:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9b98b2d1c102195e31ee7e93ba075e6cfa16080e78f8e17fc006a62d300ce1a
    source_path: install/fly.md
    workflow: 16
---

# Fly.io-Bereitstellung

**Ziel:** OpenClaw Gateway auf einer [Fly.io](https://fly.io)-Maschine mit persistentem Speicher, automatischem HTTPS und Discord-/Kanalzugriff ausführen.

## Was Sie benötigen

- Installierte [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.io-Konto (kostenloser Tarif reicht aus)
- Modellauthentifizierung: API-Schlüssel für Ihren gewählten Modell-Provider
- Kanal-Zugangsdaten: Discord-Bot-Token, Telegram-Token usw.

## Schneller Einstieg für Anfänger

1. Repository klonen → `fly.toml` anpassen
2. App + Volume erstellen → Secrets setzen
3. Mit `fly deploy` bereitstellen
4. Per SSH verbinden, um die Konfiguration zu erstellen, oder Control UI verwenden

<Steps>
  <Step title="Fly-App erstellen">
    ```bash
    # Repository klonen
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Neue Fly-App erstellen (wählen Sie Ihren eigenen Namen)
    fly apps create my-openclaw

    # Persistentes Volume erstellen (1 GB ist normalerweise ausreichend)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Tipp:** Wählen Sie eine Region in Ihrer Nähe. Häufige Optionen: `lhr` (London), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="fly.toml konfigurieren">
    Bearbeiten Sie `fly.toml`, damit sie zu Ihrem App-Namen und Ihren Anforderungen passt.

    **Sicherheitshinweis:** Die Standardkonfiguration stellt eine öffentliche URL bereit. Für eine gehärtete Bereitstellung ohne öffentliche IP siehe [Private Bereitstellung](#private-deployment-hardened) oder verwenden Sie `deploy/fly.private.toml`.

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

    | Einstellung                    | Warum                                                                      |
    | ------------------------------ | -------------------------------------------------------------------------- |
    | `--bind lan`                   | Bindet an `0.0.0.0`, damit der Fly-Proxy das Gateway erreichen kann        |
    | `--allow-unconfigured`         | Startet ohne Konfigurationsdatei (Sie erstellen sie anschließend)          |
    | `internal_port = 3000`         | Muss für Fly-Health-Checks zu `--port 3000` (oder `OPENCLAW_GATEWAY_PORT`) passen |
    | `memory = "2048mb"`            | 512 MB sind zu klein; 2 GB werden empfohlen                                |
    | `OPENCLAW_STATE_DIR = "/data"` | Persistiert den Zustand auf dem Volume                                     |

  </Step>

  <Step title="Secrets setzen">
    ```bash
    # Erforderlich: Gateway-Token (für Nicht-Loopback-Bindung)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # API-Schlüssel für Modell-Provider
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Optional: Weitere Provider
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Kanal-Token
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Hinweise:**

    - Nicht-Loopback-Bindungen (`--bind lan`) erfordern einen gültigen Gateway-Authentifizierungspfad. Dieses Fly.io-Beispiel verwendet `OPENCLAW_GATEWAY_TOKEN`, aber `gateway.auth.password` oder eine korrekt konfigurierte Nicht-Loopback-`trusted-proxy`-Bereitstellung erfüllen die Anforderung ebenfalls.
    - Behandeln Sie diese Token wie Passwörter.
    - **Bevorzugen Sie Umgebungsvariablen gegenüber der Konfigurationsdatei** für alle API-Schlüssel und Token. Dadurch bleiben Secrets außerhalb von `openclaw.json`, wo sie versehentlich offengelegt oder protokolliert werden könnten.

  </Step>

  <Step title="Bereitstellen">
    ```bash
    fly deploy
    ```

    Die erste Bereitstellung erstellt das Docker-Image (~2-3 Minuten). Nachfolgende Bereitstellungen sind schneller.

    Nach der Bereitstellung prüfen Sie:

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

  <Step title="Konfigurationsdatei erstellen">
    Verbinden Sie sich per SSH mit der Maschine, um eine passende Konfiguration zu erstellen:

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

    **Hinweis:** Mit `OPENCLAW_STATE_DIR=/data` lautet der Konfigurationspfad `/data/openclaw.json`.

    **Hinweis:** Ersetzen Sie `https://my-openclaw.fly.dev` durch den tatsächlichen Ursprung Ihrer Fly-App. Beim Gateway-Start werden lokale Control-UI-Ursprünge aus den Laufzeitwerten `--bind` und `--port` initialisiert, damit der erste Start fortfahren kann, bevor die Konfiguration existiert. Browserzugriff über Fly erfordert jedoch weiterhin den exakten HTTPS-Ursprung in `gateway.controlUi.allowedOrigins`.

    **Hinweis:** Der Discord-Token kann aus einer der folgenden Quellen stammen:

    - Umgebungsvariable: `DISCORD_BOT_TOKEN` (für Secrets empfohlen)
    - Konfigurationsdatei: `channels.discord.token`

    Wenn Sie die Umgebungsvariable verwenden, müssen Sie keinen Token zur Konfiguration hinzufügen. Das Gateway liest `DISCORD_BOT_TOKEN` automatisch.

    Zum Anwenden neu starten:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Auf das Gateway zugreifen">
    ### Control UI

    Im Browser öffnen:

    ```bash
    fly open
    ```

    Oder besuchen Sie `https://my-openclaw.fly.dev/`

    Authentifizieren Sie sich mit dem konfigurierten gemeinsamen Secret. Diese Anleitung verwendet den Gateway-Token aus `OPENCLAW_GATEWAY_TOKEN`; wenn Sie auf Passwortauthentifizierung umgestellt haben, verwenden Sie stattdessen dieses Passwort.

    ### Logs

    ```bash
    fly logs              # Live-Logs
    fly logs --no-tail    # Aktuelle Logs
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

**Behebung:** Fügen Sie `--bind lan` zum Prozessbefehl in `fly.toml` hinzu.

### Health-Checks schlagen fehl / Verbindung abgelehnt

Fly kann das Gateway am konfigurierten Port nicht erreichen.

**Behebung:** Stellen Sie sicher, dass `internal_port` mit dem Gateway-Port übereinstimmt (setzen Sie `--port 3000` oder `OPENCLAW_GATEWAY_PORT=3000`).

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

**Hinweis:** 512 MB sind zu klein. 1 GB kann funktionieren, kann aber unter Last oder bei ausführlicher Protokollierung zu OOM führen. **2 GB werden empfohlen.**

### Probleme mit Gateway-Sperrdateien

Das Gateway verweigert den Start mit Fehlern wie „already running“.

Dies passiert, wenn der Container neu startet, die PID-Sperrdatei jedoch auf dem Volume erhalten bleibt.

**Behebung:** Löschen Sie die Sperrdatei:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Die Sperrdatei liegt unter `/data/gateway.*.lock` (nicht in einem Unterverzeichnis).

### Konfiguration wird nicht gelesen

`--allow-unconfigured` umgeht nur die Startsperre. Es erstellt oder repariert `/data/openclaw.json` nicht. Stellen Sie daher sicher, dass Ihre echte Konfiguration existiert und `gateway.mode="local"` enthält, wenn Sie einen normalen lokalen Gateway-Start wünschen.

Prüfen Sie, ob die Konfiguration existiert:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Konfiguration per SSH schreiben

Der Befehl `fly ssh console -C` unterstützt keine Shell-Umleitung. So schreiben Sie eine Konfigurationsdatei:

```bash
# echo + tee verwenden (Pipe von lokal nach remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Oder sftp verwenden
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Hinweis:** `fly sftp` kann fehlschlagen, wenn die Datei bereits existiert. Löschen Sie sie zuerst:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Zustand bleibt nicht persistent

Wenn Sie Authentifizierungsprofile, Kanal-/Provider-Zustand oder Sitzungen nach einem Neustart verlieren, schreibt das Zustandsverzeichnis in das Container-Dateisystem.

**Behebung:** Stellen Sie sicher, dass `OPENCLAW_STATE_DIR=/data` in `fly.toml` gesetzt ist, und stellen Sie erneut bereit.

## Updates

```bash
# Neueste Änderungen abrufen
git pull

# Erneut bereitstellen
fly deploy

# Zustand prüfen
fly status
fly logs
```

### Maschinenbefehl aktualisieren

Wenn Sie den Startbefehl ohne vollständige erneute Bereitstellung ändern müssen:

```bash
# Maschinen-ID abrufen
fly machines list

# Befehl aktualisieren
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Oder mit Speichererhöhung
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Hinweis:** Nach `fly deploy` kann der Maschinenbefehl auf den Inhalt von `fly.toml` zurückgesetzt werden. Wenn Sie manuelle Änderungen vorgenommen haben, wenden Sie sie nach der Bereitstellung erneut an.

## Private Bereitstellung (gehärtet)

Standardmäßig weist Fly öffentliche IPs zu, wodurch Ihr Gateway unter `https://your-app.fly.dev` erreichbar ist. Das ist praktisch, bedeutet aber, dass Ihre Bereitstellung von Internet-Scannern (Shodan, Censys usw.) gefunden werden kann.

Für eine gehärtete Bereitstellung mit **keiner öffentlichen Exposition** verwenden Sie die private Vorlage.

### Wann Sie eine private Bereitstellung verwenden sollten

- Sie führen nur **ausgehende** Aufrufe/Nachrichten aus (keine eingehenden Webhooks)
- Sie verwenden **ngrok- oder Tailscale**-Tunnel für Webhook-Callbacks
- Sie greifen statt über den Browser per **SSH, Proxy oder WireGuard** auf das Gateway zu
- Sie möchten die Bereitstellung **vor Internet-Scannern verbergen**

### Einrichtung

Verwenden Sie `deploy/fly.private.toml` statt der Standardkonfiguration:

```bash
# Mit privater Konfiguration bereitstellen
fly deploy -c deploy/fly.private.toml
```

Oder wandeln Sie eine vorhandene Bereitstellung um:

```bash
# Aktuelle IPs auflisten
fly ips list -a my-openclaw

# Öffentliche IPs freigeben
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Zur privaten Konfiguration wechseln, damit zukünftige Bereitstellungen keine öffentlichen IPs erneut zuweisen
# ([http_service] entfernen oder mit der privaten Vorlage bereitstellen)
fly deploy -c deploy/fly.private.toml

# Nur private IPv6 zuweisen
fly ips allocate-v6 --private -a my-openclaw
```

Danach sollte `fly ips list` nur eine IP vom Typ `private` anzeigen:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Auf eine private Bereitstellung zugreifen

Da es keine öffentliche URL gibt, verwenden Sie eine dieser Methoden:

**Option 1: Lokaler Proxy (am einfachsten)**

```bash
# Lokalen Port 3000 an die App weiterleiten
fly proxy 3000:3000 -a my-openclaw

# Dann http://localhost:3000 im Browser öffnen
```

**Option 2: WireGuard-VPN**

```bash
# WireGuard-Konfiguration erstellen (einmalig)
fly wireguard create

# In den WireGuard-Client importieren, dann über interne IPv6 zugreifen
# Beispiel: http://[fdaa:x:x:x:x::x]:3000
```

**Option 3: Nur SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooks mit privater Bereitstellung

Wenn Sie Webhook-Callbacks (Twilio, Telnyx usw.) ohne öffentliche Erreichbarkeit benötigen:

1. **ngrok-Tunnel** - Führen Sie ngrok innerhalb des Containers oder als Sidecar aus
2. **Tailscale Funnel** - Machen Sie bestimmte Pfade über Tailscale zugänglich
3. **Nur ausgehend** - Einige Provider (Twilio) funktionieren für ausgehende Anrufe ohne Webhooks problemlos

Beispielkonfiguration für voice-call mit ngrok:

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

Der ngrok-Tunnel läuft innerhalb des Containers und stellt eine öffentliche Webhook-URL bereit, ohne die Fly-App selbst offenzulegen. Setzen Sie `webhookSecurity.allowedHosts` auf den öffentlichen Tunnel-Hostnamen, damit weitergeleitete Host-Header akzeptiert werden.

### Sicherheitsvorteile

| Aspekt             | Öffentlich    | Privat     |
| ------------------ | ------------- | ---------- |
| Internetscanner    | Auffindbar    | Verborgen  |
| Direkte Angriffe   | Möglich       | Blockiert  |
| Zugriff auf Control UI | Browser   | Proxy/VPN  |
| Webhook-Zustellung | Direkt        | Über Tunnel |

## Hinweise

- Fly.io verwendet **x86-Architektur** (nicht ARM)
- Das Dockerfile ist mit beiden Architekturen kompatibel
- Verwenden Sie für das WhatsApp/Telegram-Onboarding `fly ssh console`
- Persistente Daten liegen auf dem Volume unter `/data`
- Signal benötigt Java + signal-cli; verwenden Sie ein benutzerdefiniertes Image und halten Sie den Speicher bei 2 GB oder mehr.

## Kosten

Mit der empfohlenen Konfiguration (`shared-cpu-2x`, 2 GB RAM):

- ca. 10-15 USD/Monat, abhängig von der Nutzung
- Die kostenlose Stufe enthält ein gewisses Kontingent

Details finden Sie unter [Fly.io-Preise](https://fly.io/docs/about/pricing/).

## Nächste Schritte

- Richten Sie Messaging-Kanäle ein: [Kanäle](/de/channels)
- Konfigurieren Sie das Gateway: [Gateway-Konfiguration](/de/gateway/configuration)
- Halten Sie OpenClaw aktuell: [Aktualisierung](/de/install/updating)

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Hetzner](/de/install/hetzner)
- [Docker](/de/install/docker)
- [VPS-Hosting](/de/vps)
