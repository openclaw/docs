---
read_when:
    - Je wilt een gecontaineriseerde Gateway met Podman in plaats van Docker
summary: Draai OpenClaw in een rootloze Podman-container
title: Podman
x-i18n:
    generated_at: "2026-04-29T22:55:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfdcbbdb62c2f8ca2d6d370b742003e6f92f6921a38c00ba19e810d83e350647
    source_path: install/podman.md
    workflow: 16
---

Voer de OpenClaw Gateway uit in een rootless Podman-container, beheerd door je huidige niet-rootgebruiker.

Het beoogde model is:

- Podman voert de gatewaycontainer uit.
- Je host-`openclaw` CLI is het besturingsvlak.
- Persistente status staat standaard op de host onder `~/.openclaw`.
- Dagelijks beheer gebruikt `openclaw --container <name> ...` in plaats van `sudo -u openclaw`, `podman exec` of een afzonderlijke servicegebruiker.

## Vereisten

- **Podman** in rootless modus
- **OpenClaw CLI** geïnstalleerd op de host
- **Optioneel:** `systemd --user` als je door Quadlet beheerd automatisch starten wilt
- **Optioneel:** `sudo` alleen als je `loginctl enable-linger "$(whoami)"` wilt voor persistentie na het opstarten op een headless host

## Snel starten

<Steps>
  <Step title="Eenmalige setup">
    Voer vanuit de repo-root `./scripts/podman/setup.sh` uit.
  </Step>

  <Step title="Start de Gateway-container">
    Start de container met `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Voer onboarding uit binnen de container">
    Voer `./scripts/run-openclaw-podman.sh launch setup` uit en open daarna `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Beheer de draaiende container vanuit de host-CLI">
    Stel `OPENCLAW_CONTAINER=openclaw` in en gebruik daarna normale `openclaw`-commando's vanaf de host.
  </Step>
</Steps>

Setupdetails:

- `./scripts/podman/setup.sh` bouwt standaard `openclaw:local` in je rootless Podman-store, of gebruikt `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` als je er een instelt.
- Het maakt `~/.openclaw/openclaw.json` met `gateway.mode: "local"` als dat ontbreekt.
- Het maakt `~/.openclaw/.env` met `OPENCLAW_GATEWAY_TOKEN` als dat ontbreekt.
- Voor handmatige starts leest de helper alleen een kleine allowlist van Podman-gerelateerde sleutels uit `~/.openclaw/.env` en geeft expliciete runtime-env-vars door aan de container; het geeft niet het volledige env-bestand aan Podman.

Door Quadlet beheerde setup:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet is een optie alleen voor Linux, omdat het afhankelijk is van systemd-gebruikersservices.

Je kunt ook `OPENCLAW_PODMAN_QUADLET=1` instellen.

Optionele build-/setup-env-vars:

- `OPENCLAW_IMAGE` of `OPENCLAW_PODMAN_IMAGE` -- gebruik een bestaande/opgehaalde image in plaats van `openclaw:local` te bouwen
- `OPENCLAW_DOCKER_APT_PACKAGES` -- installeer extra apt-pakketten tijdens het bouwen van de image
- `OPENCLAW_EXTENSIONS` -- installeer Plugin-afhankelijkheden vooraf tijdens buildtijd
- `OPENCLAW_INSTALL_BROWSER` -- installeer Chromium en Xvfb vooraf voor browserautomatisering (stel in op `1` om in te schakelen)

Container starten:

```bash
./scripts/run-openclaw-podman.sh launch
```

Het script start de container als je huidige uid/gid met `--userns=keep-id` en bind-mount je OpenClaw-status in de container.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Open daarna `http://127.0.0.1:18789/` en gebruik het token uit `~/.openclaw/.env`.

Standaard host-CLI:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Daarna worden commando's zoals deze automatisch binnen die container uitgevoerd:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

Op macOS kan Podman machine ervoor zorgen dat de browser voor de gateway niet-lokaal lijkt.
Als de Control UI na het starten device-auth-fouten meldt, gebruik dan de Tailscale-richtlijnen in
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Voor HTTPS of externe browsertoegang volg je de hoofd-documentatie voor Tailscale.

Podman-specifieke opmerking:

- Houd de Podman-publicatiehost op `127.0.0.1`.
- Geef de voorkeur aan door de host beheerde `tailscale serve` boven `openclaw gateway --tailscale serve`.
- Gebruik op macOS Tailscale-toegang in plaats van ad-hoc workarounds met lokale tunnels als de lokale browsercontext voor device-auth onbetrouwbaar is.

Zie:

- [Tailscale](/nl/gateway/tailscale)
- [Control UI](/nl/web/control-ui)

## Systemd (Quadlet, optioneel)

Als je `./scripts/podman/setup.sh --quadlet` hebt uitgevoerd, installeert de setup een Quadlet-bestand op:

```bash
~/.config/containers/systemd/openclaw.container
```

Nuttige commando's:

- **Starten:** `systemctl --user start openclaw.service`
- **Stoppen:** `systemctl --user stop openclaw.service`
- **Status:** `systemctl --user status openclaw.service`
- **Logs:** `journalctl --user -u openclaw.service -f`

Na het bewerken van het Quadlet-bestand:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Schakel lingering in voor je huidige gebruiker voor persistentie na het opstarten op SSH-/headless hosts:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Configuratie, env en opslag

- **Configuratiemap:** `~/.openclaw`
- **Werkruimtemap:** `~/.openclaw/workspace`
- **Tokenbestand:** `~/.openclaw/.env`
- **Launch-helper:** `./scripts/run-openclaw-podman.sh`

Het launch-script en Quadlet bind-mounten hoststatus in de container:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Standaard zijn dat hostmappen, geen anonieme containerstatus, zodat
`openclaw.json`, per-agent `auth-profiles.json`, kanaal-/providerstatus,
sessies en werkruimte behouden blijven wanneer de container wordt vervangen.
De Podman-setup vult ook `gateway.controlUi.allowedOrigins` voor `127.0.0.1` en `localhost` op de gepubliceerde gatewaypoort, zodat het lokale dashboard werkt met de niet-loopback-bind van de container.

Nuttige env-vars voor de handmatige launcher:

- `OPENCLAW_PODMAN_CONTAINER` -- containernaam (standaard `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- uit te voeren image
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- hostpoort toegewezen aan container `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- hostpoort toegewezen aan container `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- hostinterface voor gepubliceerde poorten; standaard is `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- gateway-bindmodus binnen de container; standaard is `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (standaard), `auto` of `host`

De handmatige launcher leest `~/.openclaw/.env` voordat container-/image-standaarden definitief worden gemaakt, zodat je deze daar kunt bewaren.

Als je een niet-standaard `OPENCLAW_CONFIG_DIR` of `OPENCLAW_WORKSPACE_DIR` gebruikt, stel dan dezelfde variabelen in voor zowel `./scripts/podman/setup.sh` als latere `./scripts/run-openclaw-podman.sh launch`-commando's. De repo-lokale launcher bewaart aangepaste pad-overschrijvingen niet tussen shells.

Quadlet-opmerking:

- De gegenereerde Quadlet-service houdt bewust een vaste, geharde standaardvorm aan: gepubliceerde poorten op `127.0.0.1`, `--bind lan` binnen de container en `keep-id`-gebruikersnamespace.
- Het pint `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` en `TimeoutStartSec=300`.
- Het publiceert zowel `127.0.0.1:18789:18789` (gateway) als `127.0.0.1:18790:18790` (bridge).
- Het leest `~/.openclaw/.env` als runtime-`EnvironmentFile` voor waarden zoals `OPENCLAW_GATEWAY_TOKEN`, maar gebruikt de Podman-specifieke override-allowlist van de handmatige launcher niet.
- Als je aangepaste publicatiepoorten, publicatiehost of andere container-run-flags nodig hebt, gebruik dan de handmatige launcher of bewerk `~/.config/containers/systemd/openclaw.container` rechtstreeks, laad opnieuw en herstart daarna de service.

## Nuttige commando's

- **Containerlogs:** `podman logs -f openclaw`
- **Container stoppen:** `podman stop openclaw`
- **Container verwijderen:** `podman rm -f openclaw`
- **Dashboard-URL openen vanuit host-CLI:** `openclaw dashboard --no-open`
- **Health/status via host-CLI:** `openclaw gateway status --deep` (RPC-probe + extra
  servicescan)

## Probleemoplossing

- **Toegang geweigerd (EACCES) op configuratie of werkruimte:** De container draait standaard met `--userns=keep-id` en `--user <your uid>:<your gid>`. Zorg dat de hostpaden voor configuratie/werkruimte eigendom zijn van je huidige gebruiker.
- **Gateway-start geblokkeerd (ontbrekende `gateway.mode=local`):** Zorg dat `~/.openclaw/openclaw.json` bestaat en `gateway.mode="local"` instelt. `scripts/podman/setup.sh` maakt dit aan als het ontbreekt.
- **Container-CLI-commando's raken het verkeerde doel:** Gebruik expliciet `openclaw --container <name> ...`, of exporteer `OPENCLAW_CONTAINER=<name>` in je shell.
- **`openclaw update` mislukt met `--container`:** Verwacht. Bouw de image opnieuw of haal deze op, en herstart daarna de container of de Quadlet-service.
- **Quadlet-service start niet:** Voer `systemctl --user daemon-reload` uit, daarna `systemctl --user start openclaw.service`. Op headless systemen heb je mogelijk ook `sudo loginctl enable-linger "$(whoami)"` nodig.
- **SELinux blokkeert bind mounts:** Laat het standaard mountgedrag ongemoeid; de launcher voegt automatisch `:Z` toe op Linux wanneer SELinux enforcing of permissive is.

## Gerelateerd

- [Docker](/nl/install/docker)
- [Gateway-achtergrondproces](/nl/gateway/background-process)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
