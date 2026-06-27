---
read_when:
    - Linux companion-appstatus zoeken
    - Platformdekking of bijdragen plannen
    - Linux OOM-kills of afsluitcode 137 debuggen op een VPS of container
summary: Linux-ondersteuning + status van de companion-app
title: Linux-app
x-i18n:
    generated_at: "2026-06-27T17:47:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 437eb12d373ff9161ec7fa1e6fc04bf5662f903374d17f55b45ae1ea355c9085
    source_path: platforms/linux.md
    workflow: 16
---

De Gateway wordt volledig ondersteund op Linux. **Node is de aanbevolen runtime**.
Bun wordt niet aanbevolen voor de Gateway (WhatsApp/Telegram-bugs).

Native Linux-begeleidende apps zijn gepland. Bijdragen zijn welkom als je wilt helpen er een te bouwen.

## Snel pad voor beginners (VPS)

1. Installeer Node 24 (aanbevolen; Node 22 LTS, momenteel `22.19+`, werkt nog steeds voor compatibiliteit)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Vanaf je laptop: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Open `http://127.0.0.1:18789/` en authenticeer met het geconfigureerde gedeelde geheim (standaard token; wachtwoord als je `gateway.auth.mode: "password"` hebt ingesteld)

Volledige Linux-serverhandleiding: [Linux-server](/nl/vps). Stapsgewijs VPS-voorbeeld: [exe.dev](/nl/install/exe-dev)

## Installeren

- [Aan de slag](/nl/start/getting-started)
- [Installatie en updates](/nl/install/updating)
- Optionele flows: [Bun (experimenteel)](/nl/install/bun), [Nix](/nl/install/nix), [Docker](/nl/install/docker)

## Gateway

- [Gateway-runbook](/nl/gateway)
- [Configuratie](/nl/gateway/configuration)

## Gateway-service installeren (CLI)

Gebruik een van deze:

```
openclaw onboard --install-daemon
```

Of:

```
openclaw gateway install
```

Of:

```
openclaw configure
```

Selecteer **Gateway-service** wanneer daarom wordt gevraagd.

Repareren/migreren:

```
openclaw doctor
```

## Systeembeheer (systemd-gebruikerseenheid)

OpenClaw installeert standaard een systemd-service voor de **gebruiker**. Gebruik een **systeem**service voor gedeelde of altijd actieve servers. `openclaw gateway install` en
`openclaw onboard --install-daemon` genereren al de huidige canonieke eenheid
voor je; schrijf er alleen handmatig een wanneer je een aangepaste system-/servicemanager-
configuratie nodig hebt. De volledige servicerichtlijnen staan in het [Gateway-runbook](/nl/gateway).

Minimale configuratie:

Maak `~/.config/systemd/user/openclaw-gateway[-<profile>].service` aan:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Schakel deze in:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Geheugendruk en OOM-kills

Op Linux kiest de kernel een OOM-slachtoffer wanneer een host-, VM- of container-cgroup
zonder geheugen komt te zitten. De Gateway kan een ongunstig slachtoffer zijn omdat deze langlevende
sessies en kanaalverbindingen bezit. OpenClaw zorgt er daarom, waar mogelijk, voor dat tijdelijke child-
processen eerder worden beëindigd dan de Gateway.

Voor geschikte Linux-childprocessen start OpenClaw het childproces via een korte
`/bin/sh`-wrapper die de eigen `oom_score_adj` van het childproces verhoogt naar `1000`, en daarna
de echte opdracht met `exec` uitvoert. Dit is een niet-geprivilegieerde bewerking, omdat het childproces
alleen zijn eigen kans op een OOM-kill verhoogt.

Gedekte childprocess-oppervlakken omvatten:

- door supervisor beheerde command-childprocessen,
- PTY-shell-childprocessen,
- MCP stdio-server-childprocessen,
- door OpenClaw gestarte browser-/Chrome-processen.

De wrapper is alleen voor Linux en wordt overgeslagen wanneer `/bin/sh` niet beschikbaar is. Deze wordt
ook overgeslagen als de child-env `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` of `off` instelt.

Een childproces verifiëren:

```bash
cat /proc/<child-pid>/oom_score_adj
```

De verwachte waarde voor gedekte childprocessen is `1000`. Het Gateway-proces moet
zijn normale score behouden, meestal `0`.

De aanbevolen systemd-eenheid stelt ook `OOMPolicy=continue` in. Hierdoor blijft de
Gateway-eenheid actief wanneer een tijdelijk childproces door de OOM-killer wordt geselecteerd;
de childopdracht/-sessie kan mislukken en de fout rapporteren zonder dat systemd de
hele gatewayservice als mislukt markeert en alle kanalen opnieuw start.

Dit vervangt normale geheugentuning niet. Als een VPS of container herhaaldelijk
childprocessen beëindigt, verhoog dan de geheugenlimiet, verminder concurrency of voeg sterkere
resource-controls toe, zoals systemd `MemoryMax=` of geheugenlimieten op containerniveau.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Linux-server](/nl/vps)
- [Raspberry Pi](/nl/install/raspberry-pi)
