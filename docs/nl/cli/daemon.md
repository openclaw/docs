---
read_when:
    - Je gebruikt nog steeds `openclaw daemon ...` in scripts
    - Je hebt commando's voor de servicelevenscyclus nodig (install/start/stop/restart/status)
summary: CLI-referentie voor `openclaw daemon` (verouderde alias voor Gateway-servicebeheer)
title: Daemon
x-i18n:
    generated_at: "2026-05-10T19:28:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1951ade64d538130e4f04954cc8dec136f54a78b1fdf94e6ce988ded8cab516
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Verouderde alias voor opdrachten voor Gateway-dienstbeheer.

`openclaw daemon ...` verwijst naar hetzelfde dienstbesturingsoppervlak als de dienstopdrachten van `openclaw gateway ...`.

## Gebruik

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Subcommando's

- `status`: toon de installatiestatus van de dienst en controleer de Gateway-gezondheid
- `install`: installeer dienst (`launchd`/`systemd`/`schtasks`)
- `uninstall`: verwijder dienst
- `start`: start dienst
- `stop`: stop dienst
- `restart`: herstart dienst

## Algemene opties

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- levenscyclus (`uninstall|start|stop`): `--json`

Opmerkingen:

- `status` lost geconfigureerde auth-SecretRefs voor probe-authenticatie op wanneer dat mogelijk is.
- Als een vereiste auth-SecretRef in dit opdrachtpad niet kan worden opgelost, rapporteert `daemon status --json` `rpc.authWarning` wanneer probe-connectiviteit/authenticatie mislukt; geef `--token`/`--password` expliciet door of los eerst de geheime bron op.
- Als de probe slaagt, worden waarschuwingen over niet-opgeloste auth-verwijzingen onderdrukt om fout-positieven te voorkomen.
- `status --deep` voegt een best-effort scan op systeemniveau van de dienst toe. Wanneer hiermee andere gateway-achtige diensten worden gevonden, drukt menselijke uitvoer opschoontips af en waarschuwt deze dat één gateway per machine nog steeds de normale aanbeveling is.
- Bij Linux-systemd-installaties omvatten token-driftcontroles van `status` zowel `Environment=`- als `EnvironmentFile=`-unitbronnen.
- Driftcontroles lossen `gateway.auth.token`-SecretRefs op met samengevoegde runtime-env (eerst de env van de dienstopdracht, daarna proces-env als fallback).
- Als tokenauthenticatie niet effectief actief is (expliciete `gateway.auth.mode` van `password`/`none`/`trusted-proxy`, of modus niet ingesteld waarbij wachtwoord kan winnen en geen tokenkandidaat kan winnen), slaan token-driftcontroles het oplossen van config-token over.
- Wanneer tokenauthenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert `install` dat de SecretRef oplosbaar is, maar bewaart het opgeloste token niet in de metadata van de dienstomgeving.
- Als tokenauthenticatie een token vereist en de geconfigureerde token-SecretRef niet is opgelost, mislukt installatie gesloten.
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt installatie geblokkeerd totdat de modus expliciet is ingesteld.
- Op macOS houdt `install` LaunchAgent-plists alleen toegankelijk voor de eigenaar en laadt beheerde dienstomgevingswaarden via een bestand en wrapper die alleen voor de eigenaar toegankelijk zijn, in plaats van API-sleutels of env-verwijzingen naar auth-profielen te serialiseren naar `EnvironmentVariables`.
- Als je bewust meerdere gateways op één host uitvoert, isoleer dan poorten, config/status en werkruimten; zie [/gateway#multiple-gateways-same-host](/nl/gateway#multiple-gateways-same-host).
- `restart --safe` vraagt de draaiende Gateway om actief werk vooraf te controleren en één samengevoegde herstart te plannen nadat actief werk is weggelopen. Gewone `restart` behoudt het bestaande gedrag van de dienstbeheerder; `--force` blijft het directe override-pad.
- `restart --safe --skip-deferral` voert de OpenClaw-bewuste veilige herstart uit, maar omzeilt de uitstelpoort voor actief werk zodat de Gateway de herstart onmiddellijk uitzendt, zelfs wanneer blokkers worden gerapporteerd. Operator-uitweg wanneer een vastgelopen taakuitvoering de veilige herstart vastzet; vereist `--safe`.

## Bij voorkeur

Gebruik [`openclaw gateway`](/nl/cli/gateway) voor actuele documentatie en voorbeelden.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-runbook](/nl/gateway)
