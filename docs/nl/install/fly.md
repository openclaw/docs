---
read_when:
    - OpenClaw implementeren op Fly.io
    - Fly-volumes, geheimen en configuratie voor de eerste keer instellen
summary: Stapsgewijze implementatie van OpenClaw op Fly.io met permanente opslag en HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-16T15:49:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d2b5119c1df8ee077f4db4f44fa92c6ae0e2bf3c355c2117e0fd39146bb49875
    source_path: install/fly.md
    workflow: 16
---

**Doel:** OpenClaw Gateway die draait op een [Fly.io](https://fly.io)-machine met permanente opslag, automatische HTTPS en toegang tot Discord/kanalen.

## Wat je nodig hebt

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) geïnstalleerd
- Fly.io-account (gratis abonnement werkt)
- Modelauthenticatie: API-sleutel voor de gekozen modelprovider
- Kanaalreferenties: Discord-bottoken, Telegram-token enzovoort

## Snelstart voor beginners

1. Kloon de repository en pas `fly.toml` aan
2. Maak de app en het volume, en stel geheimen in
3. Implementeer met `fly deploy`
4. Maak via SSH verbinding om de configuratie te maken, of gebruik de Control UI

<Steps>
  <Step title="De Fly-app maken">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # kies je eigen naam
    fly apps create my-openclaw

    # 1 GB is meestal voldoende
    fly volumes create openclaw_data --size 1 --region iad
    ```

    Kies een regio dicht bij jou. Veelgebruikte opties: `lhr` (Londen), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="fly.toml configureren">
    Bewerk `fly.toml` zodat deze overeenkomt met je appnaam en vereisten. De bijgehouden `fly.toml` van de repository is de openbare sjabloon die hieronder wordt weergegeven; `deploy/fly.private.toml` is de beveiligde variant zonder openbaar IP-adres (zie [Privé-implementatie](#private-deployment-hardened)).

    ```toml
    app = "my-openclaw"  # je appnaam
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

    Het toegangspunt van de OpenClaw Docker-image is `tini` en voert standaard `node openclaw.mjs gateway` uit. Fly `[processes]` vervangt de Docker-`CMD` (hier wordt `node dist/index.js gateway ...` rechtstreeks uitgevoerd, hetzelfde gecompileerde toegangspunt) zonder `ENTRYPOINT` te wijzigen, zodat het proces nog steeds onder `tini` draait.

    **Belangrijkste instellingen:**

    | Instelling                     | Waarom                                                                      |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Bindt aan `0.0.0.0`, zodat de proxy van Fly de Gateway kan bereiken        |
    | `--allow-unconfigured`         | Start zonder configuratiebestand (dat maak je daarna)                       |
    | `internal_port = 3000`         | Moet overeenkomen met `--port 3000` (of `OPENCLAW_GATEWAY_PORT`) voor Fly-statuscontroles |
    | `memory = "2048mb"`            | 512 MB is te weinig; 2 GB wordt aanbevolen                                  |
    | `OPENCLAW_STATE_DIR = "/data"` | Slaat de status permanent op het volume op                                  |

  </Step>

  <Step title="Geheimen instellen">
    ```bash
    # vereist: Gateway-authenticatietoken voor binding buiten de loopbackinterface
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # API-sleutels voor modelproviders
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # optioneel: andere providers
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # kanaaltokens
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    Bindingen buiten de loopbackinterface (`--bind lan`) vereisen een geldig authenticatiepad voor de Gateway. Dit voorbeeld gebruikt `OPENCLAW_GATEWAY_TOKEN`, maar `gateway.auth.password` of een correct geconfigureerde vertrouwde-proxy-implementatie buiten de loopbackinterface voldoet ook aan de vereiste. Zie [Geheimenbeheer](/nl/gateway/secrets) voor het SecretRef-contract.

    Behandel deze tokens als wachtwoorden. Geef voor API-sleutels en tokens de voorkeur aan omgevingsvariabelen/`fly secrets` boven het configuratiebestand, zodat geheimen buiten `openclaw.json` blijven.

  </Step>

  <Step title="Implementeren">
    ```bash
    fly deploy
    ```

    Bij de eerste implementatie wordt de Docker-image gebouwd. Controleer dit na de implementatie:

    ```bash
    fly status
    fly logs
    ```

    Bij het opstarten van de Gateway wordt `gateway ready` vastgelegd zodra de HTTP/WebSocket-listener actief is. De eigen statuscontrole van Fly bewaakt `internal_port = 3000` volgens `fly.toml`; de Docker-`HEALTHCHECK`-instructie van de image bevraagt daarnaast `/healthz` op de standaardpoort 18789, die hier niet wordt gebruikt omdat deze implementatie de Gateway overschrijft naar `--port 3000`.

  </Step>

  <Step title="Configuratiebestand maken">
    Maak via SSH verbinding met de machine om een correcte configuratie te maken:

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

    Vervang `https://my-openclaw.fly.dev` door de echte oorsprong van je Fly-app. Bij het opstarten vult de Gateway lokale Control UI-oorsprongen in op basis van de runtimewaarden `--bind` en `--port`, zodat de eerste opstart kan doorgaan voordat de configuratie bestaat. Voor browsertoegang via Fly moet de exacte HTTPS-oorsprong echter nog steeds in `gateway.controlUi.allowedOrigins` zijn opgenomen.

    Het Discord-token kan afkomstig zijn uit:

    - Omgevingsvariabele `DISCORD_BOT_TOKEN` (aanbevolen voor geheimen); je hoeft deze niet aan de configuratie toe te voegen, de Gateway leest deze automatisch
    - Configuratiebestand `channels.discord.token`

    Start opnieuw om de wijzigingen toe te passen:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Toegang krijgen tot de Gateway">
    ### Control UI

    ```bash
    fly open
    ```

    Of ga naar `https://my-openclaw.fly.dev/`.

    Authenticeer met het geconfigureerde gedeelde geheim: het Gateway-token uit `OPENCLAW_GATEWAY_TOKEN`, of je wachtwoord als je bent overgeschakeld op wachtwoordauthenticatie.

    ### Logboeken

    ```bash
    fly logs              # live logboeken
    fly logs --no-tail    # recente logboeken
    ```

    ### SSH-console

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Problemen oplossen

### "App is not listening on expected address"

De Gateway bindt aan `127.0.0.1` in plaats van `0.0.0.0`.

**Oplossing:** voeg `--bind lan` toe aan je procesopdracht in `fly.toml`.

### Statuscontroles mislukken / verbinding geweigerd

Fly kan de Gateway niet bereiken op de geconfigureerde poort.

**Oplossing:** zorg ervoor dat `internal_port` overeenkomt met de Gateway-poort (`--port 3000` of `OPENCLAW_GATEWAY_PORT=3000`).

### OOM-/geheugenproblemen

De container blijft opnieuw opstarten of wordt beëindigd. Signalen: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` of stille herstarts.

**Oplossing:** verhoog het geheugen in `fly.toml`:

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

De Gateway weigert op te starten met fouten die aangeven dat deze "already running" is nadat een container opnieuw is gestart.

De runtimevergrendelingsbestanden bevinden zich in `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock`
en `gateway.state.<hash>.lock` (Linux:
`/tmp/openclaw-<uid>/gateway.*.lock`), niet op het permanente `/data`-volume, zodat
ze bij een volledige herstart van de container normaal gesproken samen met de rest van het
containerbestandssysteem worden gewist. Als een vergrendeling blijft bestaan (bijvoorbeeld een `fly machine restart`
die het containerbestandssysteem behoudt) en het opstarten blokkeert, verwijder je deze
handmatig:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### Configuratie wordt niet gelezen

`--allow-unconfigured` omzeilt alleen de opstartbeveiliging. Hiermee wordt `/data/openclaw.json` niet gemaakt of hersteld. Zorg er daarom voor dat je echte configuratie bestaat en `"gateway": { "mode": "local" }` bevat voor een normale lokale start van de Gateway.

Controleer of de configuratie bestaat:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Configuratie schrijven via SSH

`fly ssh console -C` ondersteunt geen shellomleiding. Zo schrijf je een configuratiebestand:

```bash
# echo + tee (pipe van lokaal naar extern)
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

Als je authenticatieprofielen, kanaal-/providerstatus of sessies na een herstart kwijtraakt, wordt de statusmap naar het containerbestandssysteem geschreven in plaats van naar het volume.

**Oplossing:** zorg ervoor dat `OPENCLAW_STATE_DIR=/data` is ingesteld in `fly.toml` en implementeer opnieuw.

## Bijwerken

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` is hier het beheerde pad: hiermee wordt de image opnieuw opgebouwd vanuit de Dockerfile, zodat de CLI-/Gateway-versie, de basisimage van het besturingssysteem en eventuele Dockerfile-wijzigingen allemaal samen worden bijgewerkt. `openclaw update` in de actieve container is niet dezelfde bewerking, omdat de image wordt geleverd als een door Docker gebouwde `dist/`-structuur zonder `.git`-checkout en zonder door npm beheerde globale installatie die kan worden gedetecteerd; zie [Bijwerken](/nl/install/updating) voor die werkwijze bij VM-achtige installaties.

### De machineopdracht bijwerken

Zo wijzig je de opstartopdracht zonder een volledige herimplementatie:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# of met meer geheugen
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

Een latere `fly deploy` zet de machineopdracht terug naar wat in `fly.toml` staat; pas handmatige wijzigingen na een herimplementatie opnieuw toe.

## Privé-implementatie (beveiligd)

Standaard wijst Fly openbare IP-adressen toe, zodat je Gateway bereikbaar is via `https://your-app.fly.dev` en kan worden gevonden door internetscanners (Shodan, Censys enzovoort).

Gebruik `deploy/fly.private.toml` voor een beveiligde implementatie **zonder openbaar IP-adres**: deze laat `[http_service]` weg, zodat er geen openbare ingang wordt toegewezen.

### Wanneer je privé-implementatie gebruikt

- Alleen uitgaande oproepen/berichten (geen inkomende webhooks)
- ngrok- of Tailscale-tunnels verwerken eventuele webhook-callbacks
- Toegang tot de Gateway verloopt via SSH, een proxy of WireGuard in plaats van via een browser
- De implementatie moet verborgen blijven voor internetscanners

### Instellen

```bash
fly deploy -c deploy/fly.private.toml
```

Of zet een bestaande implementatie om:

```bash
# huidige IP's weergeven
fly ips list -a my-openclaw

# openbare IP's vrijgeven
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# overschakelen naar de privéconfiguratie zodat bij toekomstige implementaties niet opnieuw openbare IP's worden toegewezen
fly deploy -c deploy/fly.private.toml

# uitsluitend privé-IPv6 toewijzen
fly ips allocate-v6 --private -a my-openclaw
```

Hierna zou `fly ips list` alleen een IP van het type `private` moeten weergeven:

```text
VERSIE  IP                   TYPE             REGIO
v6      fdaa:x:x:x:x::x      privé            wereldwijd
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
# importeer dit in een WireGuard-client en krijg vervolgens toegang via het interne IPv6-adres
# voorbeeld: http://[fdaa:x:x:x:x::x]:3000
```

**Optie 3: alleen SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooks bij een privé-implementatie

Voor webhook-callbacks (Twilio, Telnyx enzovoort) zonder openbare blootstelling:

1. **ngrok-tunnel**: voer ngrok uit in de container of als sidecar
2. **Tailscale Funnel**: maak specifieke paden toegankelijk via Tailscale
3. **Alleen uitgaand**: sommige providers (Twilio) werken voor uitgaande gesprekken zonder webhooks

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

De ngrok-tunnel draait in de container en biedt een openbare webhook-URL zonder de Fly-app zelf openbaar toegankelijk te maken. Stel `webhookSecurity.allowedHosts` in op de hostnaam van de tunnel, zodat doorgestuurde hostheaders worden geaccepteerd.

### Afwegingen op het gebied van beveiliging

| Aspect            | Openbaar     | Privé          |
| ----------------- | ------------ | -------------- |
| Internetscanners  | Vindbaar     | Verborgen      |
| Directe aanvallen | Mogelijk     | Geblokkeerd    |
| Toegang tot Control UI | Browser | Proxy/VPN      |
| Webhookbezorging  | Direct       | Via een tunnel |

## Opmerkingen

- Fly.io gebruikt de x86-architectuur; het Dockerfile is compatibel met zowel x86 als ARM.
- Gebruik `fly ssh console` voor de onboarding van WhatsApp/Telegram.
- Persistente gegevens bevinden zich op het volume op `/data`.
- Signal vereist signal-cli (een op Java gebaseerde CLI) in de image; gebruik een aangepaste image en houd het geheugen op 2GB+.

## Kosten

Met de aanbevolen configuratie (`shared-cpu-2x`, 2GB RAM) kun je, afhankelijk van het gebruik, rekenen op ongeveer $10-15/maand; het gratis abonnement dekt een deel van het basisgebruik. Zie [prijzen van Fly.io](https://fly.io/docs/about/pricing/) voor de actuele tarieven.

## Volgende stappen

- Stel berichtenkanalen in: [Kanalen](/nl/channels)
- Configureer de Gateway: [Gateway-configuratie](/nl/gateway/configuration)
- Houd OpenClaw up-to-date: [Bijwerken](/nl/install/updating)

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Hetzner](/nl/install/hetzner)
- [Docker](/nl/install/docker)
- [VPS-hosting](/nl/vps)
