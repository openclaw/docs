---
read_when:
    - OpenClaw implementeren op Fly.io
    - Fly-volumes, geheimen en configuratie voor de eerste uitvoering instellen
summary: Stapsgewijze Fly.io-implementatie voor OpenClaw met persistente opslag en HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-05-11T20:35:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2f6f56d22f01fc3729bafc47337e12dfad626a8b0bebb60bc4b49757d6cd1d3
    source_path: install/fly.md
    workflow: 16
---

**Doel:** OpenClaw Gateway draait op een [Fly.io](https://fly.io)-machine met persistente opslag, automatische HTTPS en Discord-/kanaaltoegang.

## Wat je nodig hebt

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) geïnstalleerd
- Fly.io-account (gratis laag werkt)
- Modelauthenticatie: API-sleutel voor je gekozen modelprovider
- Kanaalreferenties: Discord-bottoken, Telegram-token, enz.

## Snelle route voor beginners

1. Repo klonen → `fly.toml` aanpassen
2. App + volume maken → secrets instellen
3. Deployen met `fly deploy`
4. Via SSH inloggen om configuratie te maken of de Control UI gebruiken

<Steps>
  <Step title="Maak de Fly-app">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Tip:** Kies een regio dicht bij jou. Veelgebruikte opties: `lhr` (Londen), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="Configureer fly.toml">
    Bewerk `fly.toml` zodat deze overeenkomt met je appnaam en vereisten.

    **Beveiligingsopmerking:** De standaardconfiguratie stelt een openbare URL beschikbaar. Zie [Privé-deployment](#private-deployment-hardened) of gebruik `deploy/fly.private.toml` voor een geharde deployment zonder openbaar IP-adres.

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

    De OpenClaw Docker-image gebruikt `tini` als entrypoint. Fly-procescommando's vervangen Docker `CMD` zonder `ENTRYPOINT` te vervangen, dus het proces draait nog steeds onder `tini`.

    **Belangrijke instellingen:**

    | Instelling                     | Waarom                                                                     |
    | ------------------------------ | -------------------------------------------------------------------------- |
    | `--bind lan`                   | Bindt aan `0.0.0.0` zodat Fly's proxy de Gateway kan bereiken              |
    | `--allow-unconfigured`         | Start zonder configuratiebestand (dat maak je daarna)                      |
    | `internal_port = 3000`         | Moet overeenkomen met `--port 3000` (of `OPENCLAW_GATEWAY_PORT`) voor Fly-healthchecks |
    | `memory = "2048mb"`            | 512 MB is te weinig; 2 GB aanbevolen                                       |
    | `OPENCLAW_STATE_DIR = "/data"` | Bewaart status persistent op het volume                                    |

  </Step>

  <Step title="Stel secrets in">
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

    **Opmerkingen:**

    - Niet-loopback-binds (`--bind lan`) vereisen een geldig Gateway-authenticatiepad. Dit Fly.io-voorbeeld gebruikt `OPENCLAW_GATEWAY_TOKEN`, maar `gateway.auth.password` of een correct geconfigureerde niet-loopback-`trusted-proxy`-deployment voldoet ook aan de vereiste.
    - Behandel deze tokens als wachtwoorden.
    - **Geef de voorkeur aan omgevingsvariabelen boven een configuratiebestand** voor alle API-sleutels en tokens. Dit houdt secrets uit `openclaw.json`, waar ze per ongeluk kunnen worden blootgesteld of gelogd.

  </Step>

  <Step title="Deploy">
    ```bash
    fly deploy
    ```

    De eerste deployment bouwt de Docker-image (~2-3 minuten). Volgende deployments zijn sneller.

    Verifieer na deployment:

    ```bash
    fly status
    fly logs
    ```

    Je zou dit moeten zien:

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="Maak het configuratiebestand">
    Log via SSH in op de machine om een juiste configuratie te maken:

    ```bash
    fly ssh console
    ```

    Maak de configuratiemap en het bestand:

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

    **Opmerking:** Met `OPENCLAW_STATE_DIR=/data` is het configuratiepad `/data/openclaw.json`.

    **Opmerking:** Vervang `https://my-openclaw.fly.dev` door de echte origin van je Fly-app. Bij het starten seedt de Gateway lokale Control UI-origins op basis van de runtimewaarden `--bind` en `--port`, zodat de eerste start kan doorgaan voordat configuratie bestaat, maar browsertoegang via Fly vereist nog steeds dat de exacte HTTPS-origin in `gateway.controlUi.allowedOrigins` staat.

    **Opmerking:** Het Discord-token kan uit een van beide bronnen komen:

    - Omgevingsvariabele: `DISCORD_BOT_TOKEN` (aanbevolen voor secrets)
    - Configuratiebestand: `channels.discord.token`

    Als je de omgevingsvariabele gebruikt, hoef je geen token aan de configuratie toe te voegen. De Gateway leest `DISCORD_BOT_TOKEN` automatisch.

    Herstart om toe te passen:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Open de Gateway">
    ### Control UI

    Open in browser:

    ```bash
    fly open
    ```

    Of ga naar `https://my-openclaw.fly.dev/`

    Authenticeer met het geconfigureerde gedeelde geheim. Deze gids gebruikt het Gateway-token uit `OPENCLAW_GATEWAY_TOKEN`; als je bent overgestapt op wachtwoordauthenticatie, gebruik dan dat wachtwoord.

    ### Logs

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### SSH-console

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Probleemoplossing

### "App is not listening on expected address"

De Gateway bindt aan `127.0.0.1` in plaats van aan `0.0.0.0`.

**Oplossing:** Voeg `--bind lan` toe aan je procescommando in `fly.toml`.

### Healthchecks mislukken / verbinding geweigerd

Fly kan de Gateway niet bereiken op de geconfigureerde poort.

**Oplossing:** Zorg dat `internal_port` overeenkomt met de Gateway-poort (stel `--port 3000` of `OPENCLAW_GATEWAY_PORT=3000` in).

### OOM / geheugenproblemen

Container blijft herstarten of wordt beëindigd. Signalen: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` of stille herstarts.

**Oplossing:** Verhoog het geheugen in `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Of werk een bestaande machine bij:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Opmerking:** 512 MB is te weinig. 1 GB kan werken, maar kan onder belasting of bij uitgebreide logging OOM veroorzaken. **2 GB wordt aanbevolen.**

### Problemen met Gateway-lock

Gateway weigert te starten met fouten over "already running".

Dit gebeurt wanneer de container herstart, maar het PID-lockbestand op het volume blijft bestaan.

**Oplossing:** Verwijder het lockbestand:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Het lockbestand staat op `/data/gateway.*.lock` (niet in een submap).

### Configuratie wordt niet gelezen

`--allow-unconfigured` omzeilt alleen de opstartbeveiliging. Het maakt of repareert `/data/openclaw.json` niet, dus zorg dat je echte configuratie bestaat en `gateway.mode="local"` bevat wanneer je een normale lokale Gateway-start wilt.

Controleer of de configuratie bestaat:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Configuratie schrijven via SSH

Het commando `fly ssh console -C` ondersteunt geen shell-omleiding. Een configuratiebestand schrijven:

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Opmerking:** `fly sftp` kan mislukken als het bestand al bestaat. Verwijder het eerst:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Status blijft niet behouden

Als je authenticatieprofielen, kanaal-/providerstatus of sessies kwijtraakt na een herstart, schrijft de statusmap naar het containerbestandssysteem.

**Oplossing:** Zorg dat `OPENCLAW_STATE_DIR=/data` is ingesteld in `fly.toml` en deploy opnieuw.

## Updates

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### Machinecommando bijwerken

Als je het opstartcommando moet wijzigen zonder volledige redeployment:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Opmerking:** Na `fly deploy` kan het machinecommando worden teruggezet naar wat in `fly.toml` staat. Als je handmatige wijzigingen hebt aangebracht, pas ze dan na deployment opnieuw toe.

## Privé-deployment (gehard)

Standaard wijst Fly openbare IP-adressen toe, waardoor je Gateway bereikbaar is op `https://your-app.fly.dev`. Dit is handig, maar betekent dat je deployment vindbaar is door internetscanners (Shodan, Censys, enz.).

Gebruik de privésilabloon voor een geharde deployment met **geen openbare blootstelling**.

### Wanneer je privé-deployment gebruikt

- Je doet alleen **uitgaande** oproepen/berichten (geen inkomende webhooks)
- Je gebruikt **ngrok- of Tailscale**-tunnels voor webhook-callbacks
- Je benadert de Gateway via **SSH, proxy of WireGuard** in plaats van via de browser
- Je wilt dat de deployment **verborgen blijft voor internetscanners**

### Installatie

Gebruik `deploy/fly.private.toml` in plaats van de standaardconfiguratie:

```bash
# Deploy with private config
fly deploy -c deploy/fly.private.toml
```

Of converteer een bestaande deployment:

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c deploy/fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Daarna zou `fly ips list` alleen een IP van type `private` moeten tonen:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Toegang tot een privé-deployment

Omdat er geen openbare URL is, gebruik je een van deze methoden:

**Optie 1: Lokale proxy (eenvoudigst)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**Optie 2: WireGuard-VPN**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**Optie 3: alleen SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooks met privé-implementatie

Als je Webhook-callbacks nodig hebt (Twilio, Telnyx, enz.) zonder openbare blootstelling:

1. **ngrok-tunnel** - Voer ngrok uit in de container of als sidecar
2. **Tailscale Funnel** - Stel specifieke paden beschikbaar via Tailscale
3. **Alleen outbound** - Sommige providers (Twilio) werken prima voor outbound-oproepen zonder Webhooks

Voorbeeldconfiguratie voor spraakoproepen met ngrok:

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

De ngrok-tunnel draait in de container en biedt een openbare Webhook-URL zonder de Fly-app zelf bloot te stellen. Stel `webhookSecurity.allowedHosts` in op de openbare tunnelhostnaam zodat doorgestuurde hostheaders worden geaccepteerd.

### Beveiligingsvoordelen

| Aspect             | Openbaar     | Privé      |
| ------------------ | ------------ | ---------- |
| Internetscanners   | Vindbaar     | Verborgen  |
| Directe aanvallen  | Mogelijk     | Geblokkeerd |
| Toegang tot beheer-UI | Browser   | Proxy/VPN  |
| Webhook-bezorging  | Direct       | Via tunnel |

## Opmerkingen

- Fly.io gebruikt **x86-architectuur** (niet ARM)
- De Dockerfile is compatibel met beide architecturen
- Gebruik `fly ssh console` voor onboarding van WhatsApp/Telegram
- Persistente gegevens staan op het volume bij `/data`
- Signal vereist Java + signal-cli; gebruik een aangepaste image en houd het geheugen op 2 GB+.

## Kosten

Met de aanbevolen configuratie (`shared-cpu-2x`, 2 GB RAM):

- ~$10-15/maand, afhankelijk van gebruik
- De gratis laag bevat enige ruimte

Zie [Fly.io-prijzen](https://fly.io/docs/about/pricing/) voor details.

## Volgende stappen

- Stel berichtkanalen in: [Kanalen](/nl/channels)
- Configureer de Gateway: [Gateway-configuratie](/nl/gateway/configuration)
- Houd OpenClaw up-to-date: [Bijwerken](/nl/install/updating)

## Gerelateerd

- [Installatie-overzicht](/nl/install)
- [Hetzner](/nl/install/hetzner)
- [Docker](/nl/install/docker)
- [VPS-hosting](/nl/vps)
