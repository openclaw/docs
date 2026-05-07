---
read_when:
    - Status van de Linux-begeleidende app zoeken
    - Platformdekking of bijdragen plannen
    - Linux OOM-kills of afsluitcode 137 debuggen op een VPS of in een container
summary: Linux-ondersteuning + status van de begeleidende app
title: Linux-app
x-i18n:
    generated_at: "2026-05-07T13:22:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 920fa0d3fccac52dfb640ddf7e398fc1f17ca1b46e20b9aaf9525590629ec346
    source_path: platforms/linux.md
    workflow: 16
---

De Gateway wordt volledig ondersteund op Linux. **Node is de aanbevolen runtime**.
Bun wordt niet aanbevolen voor de Gateway (WhatsApp/Telegram-bugs).

Native Linux-begeleidende apps zijn gepland. Bijdragen zijn welkom als je wilt helpen er een te bouwen.

## Snelle route voor beginners (VPS)

1. Installeer Node 24 (aanbevolen; Node 22 LTS, momenteel `22.16+`, werkt nog steeds voor compatibiliteit)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Vanaf je laptop: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Open `http://127.0.0.1:18789/` en authenticeer met het geconfigureerde gedeelde geheim (standaard een token; wachtwoord als je `gateway.auth.mode: "password"` hebt ingesteld)

Volledige Linux-serverhandleiding: [Linux-server](/nl/vps). Stapsgewijs VPS-voorbeeld: [exe.dev](/nl/install/exe-dev)

## Installeren

- [Aan de slag](/nl/start/getting-started)
- [Installatie en updates](/nl/install/updating)
- Optionele stromen: [Bun (experimenteel)](/nl/install/bun), [Nix](/nl/install/nix), [Docker](/nl/install/docker)

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

OpenClaw installeert standaard een systemd-service voor de **gebruiker**. Gebruik een **systeem**service voor gedeelde servers of servers die altijd aan staan. `openclaw gateway install` en
`openclaw onboard --install-daemon` maken de huidige canonieke eenheid al
voor je; schrijf er alleen zelf een wanneer je een aangepaste systeem-/service-managerconfiguratie
nodig hebt. De volledige servicehandleiding staat in het [Gateway-runbook](/nl/gateway).

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
KillMode=control-group

[Install]
WantedBy=default.target
```

Schakel deze in:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Geheugendruk en OOM-kills

Op Linux kiest de kernel een OOM-slachtoffer wanneer een host, VM of container-cgroup
geen geheugen meer heeft. De Gateway kan een slecht slachtoffer zijn omdat deze langlevende
sessies en kanaalverbindingen beheert. OpenClaw stuurt er daarom waar mogelijk op aan dat tijdelijke onderliggende
processen eerder worden beëindigd dan de Gateway.

Voor in aanmerking komende onderliggende Linux-processen start OpenClaw het onderliggende proces via een korte
`/bin/sh`-wrapper die de eigen `oom_score_adj` van het onderliggende proces verhoogt naar `1000`, en daarna
de echte opdracht met `exec` uitvoert. Dit is een niet-geprivilegieerde bewerking omdat het onderliggende proces
alleen zijn eigen kans op een OOM-kill verhoogt.

Gedekte oppervlakken voor onderliggende processen zijn onder meer:

- onderliggende opdrachten die door de supervisor worden beheerd,
- onderliggende PTY-shellprocessen,
- onderliggende MCP-stdio-serverprocessen,
- door OpenClaw gestarte browser-/Chrome-processen.

De wrapper is alleen voor Linux en wordt overgeslagen wanneer `/bin/sh` niet beschikbaar is. Deze wordt
ook overgeslagen als de env van het onderliggende proces `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` of `off` instelt.

Om een onderliggend proces te verifiëren:

```bash
cat /proc/<child-pid>/oom_score_adj
```

De verwachte waarde voor gedekte onderliggende processen is `1000`. Het Gateway-proces moet
zijn normale score behouden, meestal `0`.

Dit vervangt normale geheugenafstemming niet. Als een VPS of container herhaaldelijk
onderliggende processen beëindigt, verhoog dan de geheugenlimiet, verminder de gelijktijdigheid of voeg sterkere
resourcebeperkingen toe, zoals systemd `MemoryMax=` of geheugenlimieten op containerniveau.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Linux-server](/nl/vps)
- [Raspberry Pi](/nl/install/raspberry-pi)
