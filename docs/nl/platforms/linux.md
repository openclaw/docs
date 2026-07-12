---
read_when:
    - Op zoek naar de status van de Linux-begeleidende app
    - Platformondersteuning of bijdragen plannen
    - Linux OOM-beëindigingen of afsluitcode 137 op een VPS of container opsporen
summary: Linux-ondersteuning + status van de companion-app
title: Linux-app
x-i18n:
    generated_at: "2026-07-12T08:59:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

De Gateway wordt volledig ondersteund op Linux. Node is de aanbevolen runtime; Bun
wordt niet aanbevolen (bekende problemen met WhatsApp/Telegram).

Er is nog geen native Linux-begeleidende app. Bijdragen zijn welkom.

## Snelle route (VPS)

1. Installeer Node 24 (aanbevolen) of Node 22.19+ (LTS, nog steeds ondersteund).
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Vanaf uw laptop: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Open `http://127.0.0.1:18789/` en verifieer uw identiteit met het geconfigureerde gedeelde
   geheim (standaard een token; een wachtwoord als `gateway.auth.mode` op `"password"` staat).

Volledige serverhandleiding: [Linux-server](/nl/vps). Stapsgewijs VPS-voorbeeld:
[exe.dev](/nl/install/exe-dev).

## Installatie

- [Aan de slag](/nl/start/getting-started)
- [Installatie en updates](/nl/install/updating)
- Optioneel: [Bun (experimenteel)](/nl/install/bun), [Nix](/nl/install/nix), [Docker](/nl/install/docker)

## Gateway-service (systemd)

Installeer met een van de volgende opdrachten:

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # selecteer "Gateway-service" wanneer daarom wordt gevraagd
```

Herstel of migreer een bestaande installatie:

```bash
openclaw doctor
```

`openclaw gateway install` genereert standaard een systemd-**gebruikersunit**. Volledige
service-instructies, waaronder de variant op **systeemniveau** voor gedeelde hosts of
hosts die permanent actief zijn, staan in het [Gateway-draaiboek](/nl/gateway#supervision-and-service-lifecycle).

Schrijf alleen handmatig een unit voor een aangepaste configuratie. Minimaal voorbeeld
van een gebruikersunit (`~/.config/systemd/user/openclaw-gateway[-<profile>].service`):

```ini
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Schakel deze in:

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Geheugendruk en beëindiging door OOM

Op Linux kiest de kernel een OOM-slachtoffer wanneer het geheugen van een host, VM of
container-cgroup opraakt. De Gateway is een ongeschikt slachtoffer, omdat deze langdurige
sessies en kanaalverbindingen beheert. Daarom zorgt OpenClaw er waar mogelijk voor dat
tijdelijke onderliggende processen als eerste worden beëindigd.

Voor geschikte onderliggende Linux-processen verpakt OpenClaw de opdracht in een korte
`/bin/sh`-shim die de eigen `oom_score_adj` van het onderliggende proces verhoogt naar
`1000` en vervolgens met `exec` de daadwerkelijke opdracht uitvoert. Hiervoor zijn geen
verhoogde bevoegdheden nodig: een proces mag altijd zijn eigen OOM-score verhogen.

Dit geldt voor de volgende onderliggende processen:

- Door de supervisor beheerde opdrachtprocessen
- Onderliggende PTY-shellprocessen
- Onderliggende MCP-stdio-serverprocessen
- Door OpenClaw gestarte browser-/Chrome-processen (via de procesruntime van de Plugin-SDK)

De wrapper wordt alleen op Linux gebruikt en wordt overgeslagen wanneer `/bin/sh` niet
beschikbaar is, of wanneer de omgeving van het onderliggende proces
`OPENCLAW_CHILD_OOM_SCORE_ADJ` instelt op `0`, `false`, `no` of `off`.

Controleer een onderliggend proces:

```bash
cat /proc/<child-pid>/oom_score_adj
```

De verwachte waarde voor processen waarop dit van toepassing is, is `1000`; het
Gateway-proces zelf behoudt zijn normale score (doorgaans `0`).

Dankzij `OOMPolicy=continue` in de systemd-unit blijft de Gateway-service actief wanneer
de OOM-killer een tijdelijk onderliggend proces selecteert. Zo wordt niet de hele unit als
mislukt gemarkeerd en worden niet alle kanalen opnieuw gestart; het mislukte onderliggende
proces of de mislukte sessie rapporteert een eigen fout.

Dit vervangt normale geheugenafstemming niet. Als een VPS of container herhaaldelijk
onderliggende processen beëindigt, verhoog dan de geheugenlimiet, verlaag de gelijktijdigheid
of voeg strengere resourcebeperkingen toe (systemd `MemoryMax=`, containergeheugenlimieten).

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Linux-server](/nl/vps)
- [Raspberry Pi](/nl/install/raspberry-pi)
- [Gateway-draaiboek](/nl/gateway)
- [Gateway-configuratie](/nl/gateway/configuration)
