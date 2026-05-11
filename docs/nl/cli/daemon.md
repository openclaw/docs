---
read_when:
    - Je gebruikt nog steeds `openclaw daemon ...` in scripts
    - Je hebt commando's voor de servicelevenscyclus nodig (install/start/stop/restart/status)
summary: CLI-referentie voor `openclaw daemon` (verouderde alias voor Gateway-servicebeheer)
title: Daemon
x-i18n:
    generated_at: "2026-05-11T20:26:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0131c3838ac0240f38e755eb779134d19a935821d90bb2898648b947696be12e
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Legacy alias voor Gateway-servicebeheeropdrachten.

`openclaw daemon ...` verwijst naar dezelfde servicebesturingsinterface als serviceopdrachten van `openclaw gateway ...`.

## Gebruik

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Subopdrachten

- `status`: toon de installatiestatus van de service en controleer de gezondheid van de Gateway
- `install`: installeer service (`launchd`/`systemd`/`schtasks`)
- `uninstall`: verwijder service
- `start`: start service
- `stop`: stop service
- `restart`: herstart service

## Algemene opties

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- levenscyclus (`uninstall|start|stop`): `--json`

Opmerkingen:

- `status` lost geconfigureerde auth SecretRefs op voor probe-auth wanneer mogelijk.
- Als een vereiste auth SecretRef in dit opdrachtpad niet kan worden opgelost, rapporteert `daemon status --json` `rpc.authWarning` wanneer probe-connectiviteit/auth mislukt; geef `--token`/`--password` expliciet door of los eerst de geheime bron op.
- Als de probe slaagt, worden waarschuwingen over niet-opgeloste auth-refs onderdrukt om fout-positieven te voorkomen.
- `status --deep` voegt een best-effort service-scan op systeemniveau toe. Wanneer andere gateway-achtige services worden gevonden, toont menselijke uitvoer opruimtips en waarschuwt dat één gateway per machine nog steeds de normale aanbeveling is.
- `status --deep` voert ook configuratievalidatie uit in Plugin-bewuste modus en toont geconfigureerde Plugin-manifestwaarschuwingen (bijvoorbeeld ontbrekende channel-configuratiemetadata), zodat install- en update-smokechecks ze vinden. Standaard `status` behoudt het snelle, alleen-lezen pad dat Plugin-validatie overslaat.
- Op Linux-systemd-installaties omvatten token-driftcontroles van `status` zowel `Environment=`- als `EnvironmentFile=`-unitbronnen.
- Driftcontroles lossen `gateway.auth.token` SecretRefs op met samengevoegde runtime-env (eerst serviceopdracht-env, daarna proces-env als fallback).
- Als token-auth niet effectief actief is (expliciete `gateway.auth.mode` van `password`/`none`/`trusted-proxy`, of modus niet ingesteld waarbij password kan winnen en geen tokenkandidaat kan winnen), slaan token-driftcontroles configuratietokenresolutie over.
- Wanneer token-auth een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert `install` dat de SecretRef kan worden opgelost, maar blijft het opgeloste token niet bewaren in serviceomgevingsmetadata.
- Als token-auth een token vereist en de geconfigureerde token-SecretRef niet kan worden opgelost, mislukt install gesloten.
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt install geblokkeerd totdat de modus expliciet is ingesteld.
- Op macOS houdt `install` LaunchAgent-plists alleen voor de eigenaar en laadt beheerde serviceomgevingswaarden via een bestand en wrapper die alleen voor de eigenaar zijn, in plaats van API-sleutels of auth-profile-envrefs te serialiseren naar `EnvironmentVariables`.
- Als je bewust meerdere gateways op één host draait, isoleer dan poorten, configuratie/status en workspaces; zie [/gateway#multiple-gateways-same-host](/nl/gateway#multiple-gateways-same-host).
- `restart --safe` vraagt de actieve Gateway om actief werk vooraf te controleren en één samengevoegde herstart te plannen nadat actief werk is afgehandeld. Gewone `restart` behoudt het bestaande gedrag van de servicemanager; `--force` blijft het directe override-pad.
- `restart --safe --skip-deferral` voert de OpenClaw-bewuste veilige herstart uit, maar omzeilt de uitstelsluis voor actief werk, zodat de Gateway de herstart onmiddellijk uitzendt, zelfs wanneer blockers worden gerapporteerd. Operator-nooduitgang wanneer een vastgelopen taakrun de veilige herstart vasthoudt; vereist `--safe`.

## Bij voorkeur

Gebruik [`openclaw gateway`](/nl/cli/gateway) voor actuele documentatie en voorbeelden.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-draaiboek](/nl/gateway)
