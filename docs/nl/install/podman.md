---
read_when:
    - U wilt een Gateway in een container met Podman in plaats van Docker
summary: Voer OpenClaw uit in een rootless Podman-container
title: Podman
x-i18n:
    generated_at: "2026-07-12T08:56:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

Voer de OpenClaw Gateway uit in een rootless Podman-container, beheerd door uw huidige niet-rootgebruiker.

Het model:

- Podman voert de Gateway-container uit.
- De `openclaw`-CLI op uw host is het besturingsvlak.
- Persistente status bevindt zich standaard op de host onder `~/.openclaw`.
- Voor dagelijks beheer gebruikt u `openclaw --container <name> ...` in plaats van `sudo -u openclaw`, `podman exec` of een afzonderlijke servicegebruiker.

## Vereisten

- **Podman** in rootless modus
- **OpenClaw-CLI** geïnstalleerd op de host
- **Optioneel:** `systemd --user` als u automatisch starten via Quadlet wilt beheren
- **Optioneel:** `sudo`, alleen als u `loginctl enable-linger "$(whoami)"` wilt gebruiken om opstartpersistentie op een headless host mogelijk te maken

## Snel aan de slag

<Steps>
  <Step title="Eenmalige configuratie">
    Voer vanuit de hoofdmap van de repository `./scripts/podman/setup.sh` uit.

    Hiermee wordt `openclaw:local` gebouwd in uw rootless Podman-opslag (of `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` opgehaald indien ingesteld), wordt `~/.openclaw/openclaw.json` met `gateway.mode: "local"` aangemaakt indien dit bestand ontbreekt en wordt `~/.openclaw/.env` met een gegenereerd `OPENCLAW_GATEWAY_TOKEN` aangemaakt indien dit bestand ontbreekt.

    Optionele omgevingsvariabelen voor de bouw:

    | Variabele | Effect |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | Een bestaande/opgehaalde image gebruiken in plaats van `openclaw:local` te bouwen |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | Extra apt-pakketten installeren tijdens het bouwen van de image (accepteert ook het verouderde `OPENCLAW_DOCKER_APT_PACKAGES`) |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | Extra Python-pakketten installeren tijdens het bouwen van de image; zet versies vast en gebruik alleen pakketindexen die u vertrouwt |
    | `OPENCLAW_EXTENSIONS` | Geselecteerde ondersteunde plugins compileren/verpakken en hun runtime-afhankelijkheden installeren |
    | `OPENCLAW_INSTALL_BROWSER` | Chromium en Xvfb vooraf installeren voor browserautomatisering (stel in op `1`) |

    Voor configuratie die in plaats daarvan door Quadlet wordt beheerd (alleen Linux + systemd-gebruikersservices):

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    Of stel `OPENCLAW_PODMAN_QUADLET=1` in.

  </Step>

  <Step title="De Gateway-container starten">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    Start de container met uw huidige uid/gid en `--userns=keep-id` en koppelt uw OpenClaw-status via bind-mounts aan de container.

  </Step>

  <Step title="Onboarding in de container uitvoeren">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    Open vervolgens `http://127.0.0.1:18789/` en gebruik het token uit `~/.openclaw/.env`.

    Modelauthenticatie: gebruik tijdens de configuratie door OpenClaw beheerde authenticatie (Anthropic-API-sleutels, of OpenAI Codex-browser-OAuth/apparaatcode-authenticatie voor door Codex ondersteunde OpenAI). Het Podman-startprogramma koppelt mappen met CLI-aanmeldgegevens van de host, zoals `~/.claude` of `~/.codex`, niet aan de configuratie- of Gateway-container. Bestaande CLI-aanmeldingen op de host zijn alleen gemakspaden voor dezelfde host -- bewaar bij containerinstallaties de providerauthenticatie in de gekoppelde `~/.openclaw`-status die door de configuratie wordt beheerd.

  </Step>

  <Step title="De actieve container beheren via de CLI op de host">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    Normale `openclaw`-opdrachten worden vervolgens automatisch in die container uitgevoerd:

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # bevat een extra servicescan
    openclaw doctor
    openclaw channels login
    ```

    Op macOS kan de Podman-machine ervoor zorgen dat de browser voor de Gateway niet lokaal lijkt. Als de Control UI na het starten fouten voor apparaatauthenticatie meldt, volgt u de Tailscale-instructies in [Podman en Tailscale](#podman-and-tailscale).

  </Step>
</Steps>

Het handmatige startprogramma leest alleen een kleine toegestane lijst met Podman-gerelateerde sleutels uit `~/.openclaw/.env` en geeft expliciete runtime-omgevingsvariabelen door aan de container; het geeft niet het volledige omgevingsbestand door aan Podman.

<a id="podman-and-tailscale"></a>

## Podman en Tailscale

Volg voor HTTPS of externe browsertoegang de algemene Tailscale-documentatie.

Specifieke opmerkingen voor Podman:

- Houd de publicatiehost van Podman op `127.0.0.1`.
- Geef de voorkeur aan door de host beheerde `tailscale serve` boven `openclaw gateway --tailscale serve`.
- Gebruik op macOS Tailscale-toegang in plaats van geïmproviseerde tijdelijke oplossingen met lokale tunnels als de context voor apparaatauthenticatie van de lokale browser onbetrouwbaar is.

Zie [Tailscale](/nl/gateway/tailscale) en [Control UI](/nl/web/control-ui).

## Systemd (Quadlet, optioneel)

Als u `./scripts/podman/setup.sh --quadlet` hebt uitgevoerd, installeert de configuratie een Quadlet-bestand op `~/.config/containers/systemd/openclaw.container`.

| Actie | Opdracht                                   |
| ------ | ------------------------------------------ |
| Starten | `systemctl --user start openclaw.service`  |
| Stoppen | `systemctl --user stop openclaw.service`   |
| Status | `systemctl --user status openclaw.service` |
| Logboeken | `journalctl --user -u openclaw.service -f` |

Na het bewerken van het Quadlet-bestand:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Schakel voor opstartpersistentie op SSH-/headless hosts lingering in voor uw huidige gebruiker:

```bash
sudo loginctl enable-linger "$(whoami)"
```

De gegenereerde Quadlet-service behoudt een vaste, geharde standaardconfiguratie: op `127.0.0.1` gepubliceerde poorten (`18789` voor de Gateway, `18790` voor de bridge), `--bind lan` in de container, de gebruikersnaamruimte `keep-id`, `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` en `TimeoutStartSec=300`. De service leest `~/.openclaw/.env` als runtime-`EnvironmentFile` voor waarden zoals `OPENCLAW_GATEWAY_TOKEN`, maar gebruikt niet de toegestane lijst met Podman-specifieke overschrijvingen van het handmatige startprogramma. Gebruik voor aangepaste publicatiepoorten, een aangepaste publicatiehost of andere vlaggen voor het uitvoeren van de container het handmatige startprogramma, of bewerk `~/.config/containers/systemd/openclaw.container` rechtstreeks en laad en herstart daarna de service.

## Configuratie, omgeving en opslag

- **Configuratiemap:** `~/.openclaw`
- **Werkruimtemap:** `~/.openclaw/workspace`
- **Tokenbestand:** `~/.openclaw/.env`
- **Starthulpprogramma:** `./scripts/run-openclaw-podman.sh`

Het startscript en Quadlet koppelen de status van de host via bind-mounts aan de container: `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`. Standaard zijn dit hostmappen en geen anonieme containerstatus, zodat `openclaw.json`, `auth-profiles.json` per agent, kanaal-/providerstatus, sessies en de werkruimte behouden blijven wanneer de container wordt vervangen. De configuratie vult ook `gateway.controlUi.allowedOrigins` vooraf in voor `127.0.0.1` en `localhost` op de gepubliceerde Gateway-poort, zodat het lokale dashboard werkt met de niet-loopback-binding van de container.

Nuttige omgevingsvariabelen voor het handmatige startprogramma (sla deze op in `~/.openclaw/.env`; het startprogramma leest dat bestand voordat het de standaardwaarden voor de container/image definitief vastlegt):

| Variabele                                  | Standaard        | Effect                                         |
| ------------------------------------------ | ---------------- | ---------------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | Containernaam                                  |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | Uit te voeren image                            |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | Hostpoort gekoppeld aan containerpoort `18789` |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | Hostpoort gekoppeld aan containerpoort `18790` |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | Hostinterface voor gepubliceerde poorten       |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | Gateway-bindingsmodus in de container          |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id`, `auto` of `host`                    |

Als u een niet-standaardwaarde voor `OPENCLAW_CONFIG_DIR` of `OPENCLAW_WORKSPACE_DIR` gebruikt, stelt u dezelfde variabelen in voor zowel `./scripts/podman/setup.sh` als latere opdrachten met `./scripts/run-openclaw-podman.sh launch` -- het repositorylokale startprogramma bewaart aangepaste padoverschrijvingen niet tussen shells.

## Images upgraden

Nadat u een nieuwe image hebt gebouwd of opgehaald, herstart u de container of Quadlet-service.
Bij de eerste start voor een nieuwe OpenClaw-versie voert de Gateway veilige reparaties van de status en plugins uit voordat deze meldt gereed te zijn.

Als de Gateway wordt afgesloten in plaats van gereed te worden, voert u dezelfde image eenmaal uit met `openclaw doctor --fix` voor dezelfde gekoppelde status/configuratie en herstart u de Gateway daarna normaal:

```bash
OPENCLAW_CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}"
OPENCLAW_WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$OPENCLAW_CONFIG_DIR/workspace}"
OPENCLAW_PODMAN_IMAGE="${OPENCLAW_PODMAN_IMAGE:-${OPENCLAW_IMAGE:-openclaw:local}}"

podman run --rm -it \
  --userns=keep-id \
  --user "$(id -u):$(id -g)" \
  -e HOME=/home/node \
  -e NPM_CONFIG_CACHE=/home/node/.openclaw/.npm \
  -v "$OPENCLAW_CONFIG_DIR:/home/node/.openclaw:rw" \
  -v "$OPENCLAW_WORKSPACE_DIR:/home/node/.openclaw/workspace:rw" \
  "$OPENCLAW_PODMAN_IMAGE" \
  openclaw doctor --fix
```

Voeg op SELinux-hosts `,Z` toe aan beide bind-mounts als Podman de toegang tot de gekoppelde status blokkeert.

## Nuttige opdrachten

- **Containerlogboeken:** `podman logs -f openclaw`
- **Container stoppen:** `podman stop openclaw`
- **Container verwijderen:** `podman rm -f openclaw`
- **Dashboard-URL openen via de CLI op de host:** `openclaw dashboard --no-open`
- **Gezondheid/status via de CLI op de host:** `openclaw gateway status --deep` (RPC-probe + extra servicescan)

## Problemen oplossen

- **Toegang geweigerd (EACCES) voor configuratie of werkruimte:** De container wordt standaard uitgevoerd met `--userns=keep-id` en `--user <uw uid>:<uw gid>`. Zorg dat de configuratie-/werkruimtepaden op de host eigendom zijn van uw huidige gebruiker.
- **Starten van de Gateway geblokkeerd (`gateway.mode=local` ontbreekt):** Zorg dat `~/.openclaw/openclaw.json` bestaat en `gateway.mode="local"` instelt. `scripts/podman/setup.sh` maakt dit bestand aan als het ontbreekt.
- **Container wordt na een image-update opnieuw gestart:** Voer de eenmalige opdracht `openclaw doctor --fix` uit onder [Images upgraden](#upgrading-images) en start de Gateway daarna opnieuw.
- **CLI-opdrachten voor de container gebruiken het verkeerde doel:** Gebruik expliciet `openclaw --container <name> ...` of exporteer `OPENCLAW_CONTAINER=<name>` in uw shell.
- **`openclaw update` mislukt met `--container`:** Dit is te verwachten. Bouw de image opnieuw of haal deze opnieuw op en herstart daarna de container of Quadlet-service.
- **Quadlet-service start niet:** Voer `systemctl --user daemon-reload` uit en daarna `systemctl --user start openclaw.service`. Op headless systemen hebt u mogelijk ook `sudo loginctl enable-linger "$(whoami)"` nodig.
- **SELinux blokkeert bind-mounts:** Laat het standaard mountgedrag ongewijzigd; het startprogramma voegt op Linux automatisch `:Z` toe wanneer SELinux in afdwingende of permissieve modus staat.

## Gerelateerd

- [Docker](/nl/install/docker)
- [Gateway-achtergrondproces](/nl/gateway/background-process)
- [Problemen met de Gateway oplossen](/nl/gateway/troubleshooting)
