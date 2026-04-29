---
read_when:
    - Status van de bijbehorende Linux-app zoeken
    - Platformdekking of bijdragen plannen
    - Linux-OOM-beëindigingen of afsluitcode 137 debuggen op een VPS of container
summary: Linux-ondersteuning + status van de begeleidende app
title: Linux-app
x-i18n:
    generated_at: "2026-04-29T22:58:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 376721d4b4376c3093c50def9130e3405adc409484c17c19d8d312c4a9a86fc5
    source_path: platforms/linux.md
    workflow: 16
---

De Gateway wordt volledig ondersteund op Linux. **Node is de aanbevolen runtime**.
Bun wordt niet aanbevolen voor de Gateway (WhatsApp/Telegram-bugs).

Native Linux-companion-apps zijn gepland. Bijdragen zijn welkom als je wilt helpen er een te bouwen.

## Snelle route voor beginners (VPS)

1. Installeer Node 24 (aanbevolen; Node 22 LTS, momenteel `22.14+`, werkt nog steeds voor compatibiliteit)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Vanaf je laptop: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Open `http://127.0.0.1:18789/` en authenticeer met het geconfigureerde gedeelde geheim (standaard token; wachtwoord als je `gateway.auth.mode: "password"` instelt)

Volledige Linux-servergids: [Linux-server](/nl/vps). Stapsgewijs VPS-voorbeeld: [exe.dev](/nl/install/exe-dev)

## Installatie

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

OpenClaw installeert standaard een systemd **user**-service. Gebruik een **system**-service voor gedeelde of altijd actieve servers. `openclaw gateway install` en
`openclaw onboard --install-daemon` renderen de huidige canonieke unit al voor je; schrijf er alleen handmatig een wanneer je een aangepaste systeem-/service-managerconfiguratie nodig hebt. De volledige servicebegeleiding staat in het [Gateway-runbook](/nl/gateway).

Minimale configuratie:

Maak `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

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

## Geheugendruk en OOM-beëindigingen

Op Linux kiest de kernel een OOM-slachtoffer wanneer een host, VM of container-cgroup
zonder geheugen komt te zitten. De Gateway kan een slecht slachtoffer zijn omdat deze langdurige sessies en kanaalverbindingen beheert. OpenClaw geeft tijdelijke child-processen daarom, waar mogelijk, voorrang om vóór de Gateway te worden beëindigd.

Voor in aanmerking komende Linux-child-spawns start OpenClaw het child-proces via een korte
`/bin/sh`-wrapper die de eigen `oom_score_adj` van het child-proces verhoogt naar `1000`, en daarna
de echte opdracht met `exec` uitvoert. Dit is een niet-geprivilegieerde bewerking omdat het child-proces
alleen zijn eigen kans op beëindiging door OOM vergroot.

Gedekte child-processurfaces zijn onder andere:

- door de supervisor beheerde opdracht-child-processen,
- PTY-shell-child-processen,
- MCP stdio-server-child-processen,
- door OpenClaw gestarte browser-/Chrome-processen.

De wrapper is alleen voor Linux en wordt overgeslagen wanneer `/bin/sh` niet beschikbaar is. Deze wordt
ook overgeslagen als de child-env `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` of `off` instelt.

Een child-proces verifiëren:

```bash
cat /proc/<child-pid>/oom_score_adj
```

De verwachte waarde voor gedekte child-processen is `1000`. Het Gateway-proces moet
zijn normale score behouden, meestal `0`.

Dit vervangt normale geheugentuning niet. Als een VPS of container herhaaldelijk
child-processen beëindigt, verhoog dan de geheugenlimiet, verminder gelijktijdigheid of voeg sterkere
resource controls toe, zoals systemd `MemoryMax=` of geheugenlimieten op containerniveau.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Linux-server](/nl/vps)
- [Raspberry Pi](/nl/install/raspberry-pi)
