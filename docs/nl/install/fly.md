---
read_when:
    - OpenClaw implementeren op Fly.io
    - Fly-volumes, secrets en de configuratie voor de eerste uitvoering instellen
summary: Stapsgewijze implementatie van OpenClaw op Fly.io met permanente opslag en HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-12T08:55:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2cb4203cdea9db2fa76ed60de01da67d550a75d538895b06732446d0f70e2f4
    source_path: install/fly.md
    workflow: 16
---

**Doel:** OpenClaw Gateway uitvoeren op een [Fly.io](https://fly.io)-machine met permanente opslag, automatische HTTPS en toegang tot Discord/kanalen.

## Wat u nodig hebt

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) geïnstalleerd
- Fly.io-account (gratis abonnement volstaat)
- Modelauthenticatie: API-sleutel voor de gekozen modelprovider
- Kanaalreferenties: Discord-bottoken, Telegram-token enzovoort

## Snelstart voor beginners

1. Kloon de repository en pas `fly.toml` aan
2. Maak de app en het volume, en stel geheimen in
3. Implementeer met `fly deploy`
4. Meld u aan via SSH om de configuratie te maken, of gebruik de bedieningsinterface

<Steps>
  <Step title="De Fly-app maken">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # kies uw eigen naam
    fly apps create my-openclaw

    # 1 GB is doorgaans voldoende
    fly volumes create openclaw_data --size 1 --region iad
    ```

    Kies een regio dicht bij u. Veelgebruikte opties: `lhr` (Londen), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="fly.toml configureren">
    Bewerk `fly.toml` zodat deze overeenkomt met uw appnaam en vereisten. De bijgehouden `fly.toml` van de repository is de openbare sjabloon die hieronder wordt weergegeven; `deploy/fly.private.toml` is de versterkte variant zonder openbaar IP-adres (zie [Privé-implementatie](#private-deployment-hardened)).

    ```toml
    app = "my-openclaw"  # uw appnaam
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

    Het toegangspunt van de OpenClaw Docker-image is `tini`, dat standaard `node openclaw.mjs gateway` uitvoert. Fly `[processes]` vervangt de Docker-`CMD` (hier wordt rechtstreeks `node dist/index.js gateway ...` uitgevoerd, hetzelfde gecompileerde toegangspunt) zonder `ENTRYPOINT` te wijzigen, zodat het proces nog steeds onder `tini` wordt uitgevoerd.

    **Belangrijkste instellingen:**

    | Instelling                     | Reden                                                                       |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Bindt aan `0.0.0.0`, zodat de proxy van Fly de Gateway kan bereiken         |
    | `--allow-unconfigured`         | Start zonder configuratiebestand (u maakt dit naderhand)                    |
    | `internal_port = 3000`         | Moet voor de statuscontroles van Fly overeenkomen met `--port 3000` (of `OPENCLAW_GATEWAY_PORT`) |
    | `memory = "2048mb"`            | 512 MB is te weinig; 2 GB wordt aanbevolen                                  |
    | `OPENCLAW_STATE_DIR = "/data"` | Slaat de status permanent op het volume op                                  |

  </Step>

  <Step title="Geheimen instellen">
    ```bash
    # vereist: gateway-authenticatietoken voor binding buiten loopback
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # API-sleutels van modelproviders
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # optioneel: andere providers
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # kanaaltokens
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    Bindingen buiten loopback (`--bind lan`) vereisen een geldig authenticatiepad voor de Gateway. Dit voorbeeld gebruikt `OPENCLAW_GATEWAY_TOKEN`, maar `gateway.auth.password` of een correct geconfigureerde vertrouwde-proxy-implementatie buiten loopback voldoet eveneens aan de vereiste. Zie [Beheer van geheimen](/nl/gateway/secrets) voor het SecretRef-contract.

    Behandel deze tokens als wachtwoorden. Geef voor API-sleutels en tokens de voorkeur aan omgevingsvariabelen/`fly secrets` boven het configuratiebestand, zodat geheimen buiten `openclaw.json` blijven.

  </Step>

  <Step title="Implementeren">
    ```bash
    fly deploy
    ```

    Bij de eerste implementatie wordt de Docker-image gebouwd. Controleer na de implementatie:

    ```bash
    fly status
    fly logs
    ```

    Bij het starten registreert de Gateway `gateway ready` zodra de HTTP-/WebSocket-listener actief is. De eigen statuscontrole van Fly bewaakt `internal_port = 3000` volgens `fly.toml`; de Docker-`HEALTHCHECK`-instructie van de image vraagt daarnaast `/healthz` op de standaardpoort 18789 op. Die wordt hier niet gebruikt, omdat deze implementatie de Gateway met `--port 3000` overschrijft.

  </Step>

  <Step title="Het configuratiebestand maken">
    Meld u via SSH aan bij de machine om een correcte configuratie te maken:

    ```bash
    fly ssh console
    ```

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

    Met `OPENCLAW_STATE_DIR=/data` is het configuratiepad `/data/openclaw.json`.

    Vervang `https://my-openclaw.fly.dev` door de werkelijke oorsprong van uw Fly-app. Bij het starten vult de Gateway lokale oorsprongen voor de bedieningsinterface op basis van de runtimewaarden `--bind` en `--port`, zodat de eerste start kan doorgaan voordat de configuratie bestaat. Voor browsertoegang via Fly moet de exacte HTTPS-oorsprong echter nog steeds in `gateway.controlUi.allowedOrigins` staan.

    Het Discord-token kan afkomstig zijn uit:

    - Omgevingsvariabele `DISCORD_BOT_TOKEN` (aanbevolen voor geheimen); u hoeft deze niet aan de configuratie toe te voegen, de Gateway leest deze automatisch
    - Configuratiebestand `channels.discord.token`

    Start opnieuw om dit toe te passen:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Toegang tot de Gateway">
    ### Bedieningsinterface

    ```bash
    fly open
    ```

    Of bezoek `https://my-openclaw.fly.dev/`.

    Authenticeer met het geconfigureerde gedeelde geheim: het Gateway-token van `OPENCLAW_GATEWAY_TOKEN`, of uw wachtwoord als u bent overgeschakeld op wachtwoordauthenticatie.

    ### Logboeken

    ```bash
    fly logs              # live-logboeken
    fly logs --no-tail    # recente logboeken
    ```

    ### SSH-console

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Problemen oplossen

### "App luistert niet op het verwachte adres"

De Gateway bindt aan `127.0.0.1` in plaats van aan `0.0.0.0`.

**Oplossing:** voeg `--bind lan` toe aan de procesopdracht in `fly.toml`.

### Mislukkende statuscontroles / verbinding geweigerd

Fly kan de Gateway niet bereiken op de geconfigureerde poort.

**Oplossing:** zorg dat `internal_port` overeenkomt met de Gateway-poort (`--port 3000` of `OPENCLAW_GATEWAY_PORT=3000`).

### OOM-/geheugenproblemen

De container blijft opnieuw starten of wordt steeds beëindigd. Signalen: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` of stille herstarts.

**Oplossing:** vergroot het geheugen in `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Of werk een bestaande machine bij:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512 MB is te weinig. 1 GB kan werken, maar kan onder belasting of bij uitgebreide logboekregistratie een OOM veroorzaken. 2 GB wordt aanbevolen.

### Problemen met de Gateway-vergrendeling

De Gateway weigert na een herstart van de container te starten met fouten dat deze „al actief” is.

Het vergrendelingsbestand voor één instantie bevindt zich in `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock` (Linux: `/tmp/openclaw-<uid>/gateway.<hash>.lock`), niet op het permanente `/data`-volume. Een volledige herstart van de container wist het daarom normaal gesproken samen met de rest van het containerbestandssysteem. Als de vergrendeling behouden blijft (bijvoorbeeld bij een `fly machine restart` waarbij het containerbestandssysteem behouden blijft) en het starten blokkeert, verwijdert u deze handmatig:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### Configuratie wordt niet gelezen

`--allow-unconfigured` omzeilt alleen de startcontrole. Het maakt of herstelt `/data/openclaw.json` niet. Zorg er daarom voor dat uw werkelijke configuratie bestaat en voor een normale lokale start van de Gateway `"gateway": { "mode": "local" }` bevat.

Controleer of de configuratie bestaat:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Configuratie schrijven via SSH

`fly ssh console -C` ondersteunt geen shellomleiding. Een configuratiebestand schrijven:

```bash
# echo + tee (doorsturen van lokaal naar extern)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# of sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

`fly sftp` kan mislukken als het bestand al bestaat; verwijder het eerst:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Status blijft niet behouden

Als u na een herstart authenticatieprofielen, kanaal-/providerstatus of sessies verliest, wordt de statusmap naar het containerbestandssysteem geschreven in plaats van naar het volume.

**Oplossing:** zorg dat `OPENCLAW_STATE_DIR=/data` in `fly.toml` is ingesteld en implementeer opnieuw.

## Bijwerken

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` is hier het gecontroleerde pad: hiermee wordt de image opnieuw vanuit het Dockerfile gebouwd, zodat de CLI-/Gateway-versie, de basisimage van het besturingssysteem en eventuele Dockerfile-wijzigingen samen worden bijgewerkt. `openclaw update` binnen de actieve container is niet dezelfde handeling, omdat de image wordt geleverd als een door Docker gebouwde `dist/`-structuur, zonder `.git`-checkout en zonder door npm beheerde globale installatie die kan worden gedetecteerd. Zie [Bijwerken](/nl/install/updating) voor die werkwijze bij VM-achtige installaties.

### De machineopdracht bijwerken

De startopdracht wijzigen zonder volledige herimplementatie:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# of met meer geheugen
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

Een latere `fly deploy` zet de machineopdracht terug naar wat in `fly.toml` staat; pas handmatige wijzigingen na de herimplementatie opnieuw toe.

## Privé-implementatie (versterkt)

Fly wijst standaard openbare IP-adressen toe, waardoor uw Gateway bereikbaar is via `https://your-app.fly.dev` en kan worden gevonden door internetscanners (Shodan, Censys enzovoort).

Gebruik `deploy/fly.private.toml` voor een versterkte implementatie **zonder openbaar IP-adres**: hierin ontbreekt `[http_service]`, zodat geen openbare inkomende toegang wordt toegewezen.

### Wanneer u een privé-implementatie gebruikt

- Alleen uitgaande aanroepen/berichten (geen inkomende webhooks)
- ngrok- of Tailscale-tunnels verwerken eventuele Webhook-callbacks
- Toegang tot de Gateway verloopt via SSH, proxy of WireGuard in plaats van via een browser
- De implementatie moet verborgen blijven voor internetscanners

### Instellen

```bash
fly deploy -c deploy/fly.private.toml
```

Of zet een bestaande implementatie om:

```bash
# huidige IP-adressen weergeven
fly ips list -a my-openclaw

# openbare IP-adressen vrijgeven
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# overschakelen naar de privéconfiguratie, zodat toekomstige implementaties geen openbare IP-adressen opnieuw toewijzen
fly deploy -c deploy/fly.private.toml

# uitsluitend privé-IPv6 toewijzen
fly ips allocate-v6 --private -a my-openclaw
```

Hierna zou `fly ips list` alleen een IP van het type `private` moeten tonen:

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Toegang tot een privé-implementatie

**Optie 1: lokale proxy (eenvoudigst)**

```bash
fly proxy 3000:3000 -a my-openclaw
# open http://localhost:3000 in een browser
```

**Optie 2: WireGuard-VPN**

```bash
fly wireguard create
# importeer dit in een WireGuard-client en maak vervolgens verbinding via het interne IPv6-adres
# voorbeeld: http://[fdaa:x:x:x:x::x]:3000
```

**Optie 3: alleen SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooks bij een privé-implementatie

Voor Webhook-callbacks (Twilio, Telnyx enzovoort) zonder openbare blootstelling:

1. **ngrok-tunnel**: voer ngrok uit in de container of als sidecar
2. **Tailscale Funnel**: stel specifieke paden beschikbaar via Tailscale
3. **Alleen uitgaand**: sommige providers (Twilio) werken voor uitgaande gesprekken zonder Webhooks

Voorbeeldconfiguratie voor spraakoproepen met ngrok, onder `plugins.entries.voice-call.config`:

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

De ngrok-tunnel wordt in de container uitgevoerd en biedt een openbare Webhook-URL zonder de Fly-app zelf openbaar te maken. Stel `webhookSecurity.allowedHosts` in op de hostnaam van de tunnel, zodat doorgestuurde hostheaders worden geaccepteerd.

### Afwegingen rond beveiliging

| Aspect             | Openbaar         | Privé         |
| ------------------ | ---------------- | ------------- |
| Internetscanners   | Vindbaar         | Verborgen     |
| Rechtstreekse aanvallen | Mogelijk    | Geblokkeerd   |
| Toegang tot de beheerinterface | Browser | Proxy/VPN |
| Levering van Webhooks | Rechtstreeks  | Via tunnel    |

## Opmerkingen

- Fly.io gebruikt de x86-architectuur; het Dockerfile is compatibel met zowel x86 als ARM.
- Gebruik `fly ssh console` voor de onboarding van WhatsApp/Telegram.
- Permanente gegevens bevinden zich op het volume op `/data`.
- Signal vereist signal-cli (een op Java gebaseerde CLI) in de image; gebruik een aangepaste image en wijs minimaal 2 GB geheugen toe.

## Kosten

Met de aanbevolen configuratie (`shared-cpu-2x`, 2 GB RAM) kunt u, afhankelijk van het gebruik, rekenen op ongeveer $10-15 per maand; het gratis abonnement dekt een deel van de basistoewijzing. Zie [prijzen van Fly.io](https://fly.io/docs/about/pricing/) voor de actuele tarieven.

## Volgende stappen

- Stel berichtenkanalen in: [Kanalen](/nl/channels)
- Configureer de Gateway: [Gateway-configuratie](/nl/gateway/configuration)
- Houd OpenClaw up-to-date: [Bijwerken](/nl/install/updating)

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Hetzner](/nl/install/hetzner)
- [Docker](/nl/install/docker)
- [VPS-hosting](/nl/vps)
