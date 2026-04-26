---
read_when:
    - OpenClaw auf Fly.io bereitstellen
    - Einrichten von Fly-Volumes, Secrets und der Konfiguration für den ersten Start
summary: Schritt-für-Schritt-Bereitstellung auf Fly.io für OpenClaw mit persistentem Speicher und HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-26T11:32:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fe13cb60aff6ee2159e1008d2af660b689d819d38893e9758c23e1edaf32e22
    source_path: install/fly.md
    workflow: 15
---

# Fly.io-Bereitstellung

**Ziel:** OpenClaw Gateway läuft auf einer [Fly.io](https://fly.io)-Maschine mit persistentem Speicher, automatischem HTTPS und Discord-/Kanalzugriff.

## Was Sie benötigen

- installierte [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.io-Konto (Free Tier funktioniert)
- Modellauthentifizierung: API-Key für Ihren gewählten Modell-Provider
- Kanal-Anmeldedaten: Discord-Bot-Token, Telegram-Token usw.

## Schneller Einstieg für Anfänger

1. Repo klonen → `fly.toml` anpassen
2. App + Volume erstellen → Secrets setzen
3. Mit `fly deploy` bereitstellen
4. Per SSH einloggen, um die Konfiguration zu erstellen, oder die Control UI verwenden

<Steps>
  <Step title="Die Fly-App erstellen">
    ```bash
    # Repo klonen
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Neue Fly-App erstellen (eigenen Namen wählen)
    fly apps create my-openclaw

    # Persistentes Volume erstellen (1GB reicht normalerweise)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Tipp:** Wählen Sie eine Region in Ihrer Nähe. Häufige Optionen: `lhr` (London), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="fly.toml konfigurieren">
    Bearbeiten Sie `fly.toml`, damit es zu Ihrem App-Namen und Ihren Anforderungen passt.

    **Sicherheitshinweis:** Die Standardkonfiguration stellt eine öffentliche URL bereit. Für eine gehärtete Bereitstellung ohne öffentliche IP siehe [Private Bereitstellung](#private-deployment-hardened) oder verwenden Sie `fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Ihr App-Name
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

    | Setting                        | Warum                                                                       |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Bindet an `0.0.0.0`, damit der Fly-Proxy das Gateway erreichen kann         |
    | `--allow-unconfigured`         | Startet ohne Konfigurationsdatei (Sie erstellen sie danach)                 |
    | `internal_port = 3000`         | Muss zu `--port 3000` (oder `OPENCLAW_GATEWAY_PORT`) für Fly-Health-Checks passen |
    | `memory = "2048mb"`            | 512MB sind zu wenig; 2GB empfohlen                                          |
    | `OPENCLAW_STATE_DIR = "/data"` | Speichert den Zustand auf dem Volume                                        |

  </Step>

  <Step title="Secrets setzen">
    ```bash
    # Erforderlich: Gateway-Token (für Nicht-Loopback-Binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # API-Keys für Modell-Provider
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Optional: Weitere Provider
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Kanal-Tokens
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Hinweise:**

    - Nicht-Loopback-Bindings (`--bind lan`) erfordern einen gültigen Gateway-Authentifizierungspfad. Dieses Fly.io-Beispiel verwendet `OPENCLAW_GATEWAY_TOKEN`, aber `gateway.auth.password` oder eine korrekt konfigurierte Nicht-Loopback-Bereitstellung mit `trusted-proxy` erfüllen die Anforderung ebenfalls.
    - Behandeln Sie diese Tokens wie Passwörter.
    - **Bevorzugen Sie Umgebungsvariablen gegenüber der Konfigurationsdatei** für alle API-Keys und Tokens. So bleiben Secrets aus `openclaw.json` heraus, wo sie versehentlich offengelegt oder geloggt werden könnten.

  </Step>

  <Step title="Bereitstellen">
    ```bash
    fly deploy
    ```

    Die erste Bereitstellung baut das Docker-Image (~2–3 Minuten). Spätere Bereitstellungen sind schneller.

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
    Melden Sie sich per SSH an der Maschine an, um eine ordentliche Konfiguration zu erstellen:

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

    **Hinweis:** Ersetzen Sie `https://my-openclaw.fly.dev` durch Ihren echten Fly-App-
    Ursprung. Der Gateway-Start initialisiert lokale Control-UI-Ursprünge aus den Laufzeitwerten
    `--bind` und `--port`, sodass der erste Start erfolgen kann, bevor eine Konfiguration existiert,
    aber Browserzugriff über Fly benötigt weiterhin den exakten HTTPS-Ursprung in
    `gateway.controlUi.allowedOrigins`.

    **Hinweis:** Das Discord-Token kann aus einer der folgenden Quellen kommen:

    - Umgebungsvariable: `DISCORD_BOT_TOKEN` (empfohlen für Secrets)
    - Konfigurationsdatei: `channels.discord.token`

    Wenn Sie die Umgebungsvariable verwenden, müssen Sie das Token nicht zur Konfiguration hinzufügen. Das Gateway liest `DISCORD_BOT_TOKEN` automatisch.

    Neustarten, um die Änderungen zu übernehmen:

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

    Oder `https://my-openclaw.fly.dev/` aufrufen

    Authentifizieren Sie sich mit dem konfigurierten gemeinsamen Secret. Dieser Leitfaden verwendet das Gateway-
    Token aus `OPENCLAW_GATEWAY_TOKEN`; wenn Sie stattdessen Passwortauthentifizierung verwenden, nutzen Sie
    dieses Passwort.

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

### "App is not listening on expected address"

Das Gateway bindet an `127.0.0.1` statt an `0.0.0.0`.

**Lösung:** Fügen Sie `--bind lan` zu Ihrem Prozessbefehl in `fly.toml` hinzu.

### Health-Checks schlagen fehl / connection refused

Fly kann das Gateway auf dem konfigurierten Port nicht erreichen.

**Lösung:** Stellen Sie sicher, dass `internal_port` zum Gateway-Port passt (setzen Sie `--port 3000` oder `OPENCLAW_GATEWAY_PORT=3000`).

### OOM-/Speicherprobleme

Der Container startet ständig neu oder wird beendet. Anzeichen: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` oder stille Neustarts.

**Lösung:** Erhöhen Sie den Speicher in `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Oder aktualisieren Sie eine bestehende Maschine:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Hinweis:** 512MB sind zu wenig. 1GB kann funktionieren, aber unter Last oder bei ausführlichem Logging zu OOM führen. **2GB werden empfohlen.**

### Probleme mit Gateway-Locks

Das Gateway verweigert den Start mit Fehlern wie "already running".

Das passiert, wenn der Container neu startet, die PID-Lock-Datei aber auf dem Volume bestehen bleibt.

**Lösung:** Löschen Sie die Lock-Datei:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Die Lock-Datei befindet sich unter `/data/gateway.*.lock` (nicht in einem Unterverzeichnis).

### Konfiguration wird nicht gelesen

`--allow-unconfigured` umgeht nur die Startschutzprüfung. Es erstellt oder repariert `/data/openclaw.json` nicht, also stellen Sie sicher, dass Ihre echte Konfiguration existiert und `gateway.mode="local"` enthält, wenn Sie einen normalen lokalen Gateway-Start möchten.

Prüfen Sie, ob die Konfiguration existiert:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Konfiguration per SSH schreiben

Der Befehl `fly ssh console -C` unterstützt keine Shell-Umleitung. Um eine Konfigurationsdatei zu schreiben:

```bash
# echo + tee verwenden (von lokal nach remote pipen)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Oder sftp verwenden
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Hinweis:** `fly sftp` kann fehlschlagen, wenn die Datei bereits existiert. Löschen Sie sie zuerst:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Zustand bleibt nicht erhalten

Wenn Sie nach einem Neustart Auth-Profile, Kanal-/Provider-Zustand oder Sitzungen verlieren,
wird das Zustandsverzeichnis in das Container-Dateisystem geschrieben.

**Lösung:** Stellen Sie sicher, dass `OPENCLAW_STATE_DIR=/data` in `fly.toml` gesetzt ist, und stellen Sie erneut bereit.

## Updates

```bash
# Neueste Änderungen holen
git pull

# Erneut bereitstellen
fly deploy

# Zustand prüfen
fly status
fly logs
```

### Maschinenbefehl aktualisieren

Wenn Sie den Startbefehl ohne vollständige Neu-Bereitstellung ändern müssen:

```bash
# Maschinen-ID abrufen
fly machines list

# Befehl aktualisieren
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Oder zusammen mit Speichererhöhung
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Hinweis:** Nach `fly deploy` kann der Maschinenbefehl auf den Inhalt von `fly.toml` zurückgesetzt werden. Wenn Sie manuelle Änderungen vorgenommen haben, wenden Sie sie nach der Bereitstellung erneut an.

## Private Bereitstellung (gehärtet)

Standardmäßig weist Fly öffentliche IPs zu, wodurch Ihr Gateway unter `https://your-app.fly.dev` erreichbar ist. Das ist praktisch, bedeutet aber auch, dass Ihre Bereitstellung für Internet-Scanner (Shodan, Censys usw.) auffindbar ist.

Verwenden Sie für eine gehärtete Bereitstellung mit **keiner öffentlichen Exponierung** die private Vorlage.

### Wann eine private Bereitstellung sinnvoll ist

- Sie tätigen nur **ausgehende** Aufrufe/Nachrichten (keine eingehenden Webhooks)
- Sie verwenden **ngrok- oder Tailscale**-Tunnel für Webhook-Callbacks
- Sie greifen per **SSH, Proxy oder WireGuard** statt per Browser auf das Gateway zu
- Sie möchten, dass die Bereitstellung **vor Internet-Scannern verborgen** bleibt

### Einrichtung

Verwenden Sie `fly.private.toml` statt der Standardkonfiguration:

```bash
# Mit privater Konfiguration bereitstellen
fly deploy -c fly.private.toml
```

Oder eine bestehende Bereitstellung umstellen:

```bash
# Aktuelle IPs auflisten
fly ips list -a my-openclaw

# Öffentliche IPs freigeben
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Auf private Konfiguration umstellen, damit zukünftige Bereitstellungen keine öffentlichen IPs erneut zuweisen
# ([http_service] entfernen oder mit der privaten Vorlage bereitstellen)
fly deploy -c fly.private.toml

# Nur private IPv6 zuweisen
fly ips allocate-v6 --private -a my-openclaw
```

Danach sollte `fly ips list` nur noch eine IP vom Typ `private` anzeigen:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Zugriff auf eine private Bereitstellung

Da es keine öffentliche URL gibt, verwenden Sie eine der folgenden Methoden:

**Option 1: Lokaler Proxy (am einfachsten)**

```bash
# Lokalen Port 3000 zur App weiterleiten
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

### Webhooks bei privater Bereitstellung

Wenn Sie Webhook-Callbacks (Twilio, Telnyx usw.) ohne öffentliche Exponierung benötigen:

1. **ngrok-Tunnel** - ngrok innerhalb des Containers oder als Sidecar ausführen
2. **Tailscale Funnel** - bestimmte Pfade über Tailscale bereitstellen
3. **Nur ausgehend** - einige Provider (Twilio) funktionieren für ausgehende Aufrufe auch ohne Webhooks

Beispielkonfiguration für Voice Calls mit ngrok:

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

| Aspect            | Öffentlich   | Privat     |
| ----------------- | ------------ | ---------- |
| Internet-Scanner  | Auffindbar   | Verborgen  |
| Direkte Angriffe  | Möglich      | Blockiert  |
| Zugriff auf Control UI | Browser | Proxy/VPN  |
| Webhook-Zustellung | Direkt      | Über Tunnel |

## Hinweise

- Fly.io verwendet die **x86-Architektur** (nicht ARM)
- Das Dockerfile ist mit beiden Architekturen kompatibel
- Für das Onboarding von WhatsApp/Telegram verwenden Sie `fly ssh console`
- Persistente Daten liegen auf dem Volume unter `/data`
- Signal erfordert Java + `signal-cli`; verwenden Sie ein benutzerdefiniertes Image und halten Sie den Speicher bei 2GB+.

## Kosten

Mit der empfohlenen Konfiguration (`shared-cpu-2x`, 2GB RAM):

- ~10–15 USD/Monat, abhängig von der Nutzung
- Das Free Tier enthält ein gewisses Kontingent

Details finden Sie unter [Fly.io-Preise](https://fly.io/docs/about/pricing/).

## Nächste Schritte

- Messaging-Kanäle einrichten: [Kanäle](/de/channels)
- Das Gateway konfigurieren: [Gateway-Konfiguration](/de/gateway/configuration)
- OpenClaw aktuell halten: [Aktualisieren](/de/install/updating)

## Verwandt

- [Installationsübersicht](/de/install)
- [Hetzner](/de/install/hetzner)
- [Docker](/de/install/docker)
- [VPS-Hosting](/de/vps)
