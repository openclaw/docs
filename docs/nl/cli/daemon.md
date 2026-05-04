---
read_when:
    - Je gebruikt nog steeds `openclaw daemon ...` in scripts
    - Je hebt commando's voor de servicelevenscyclus nodig (install/start/stop/restart/status)
summary: CLI-referentie voor `openclaw daemon` (verouderde alias voor Gateway-servicebeheer)
title: Daemon
x-i18n:
    generated_at: "2026-05-04T18:23:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84e11fc50bdf38da518a8fcf415ae461a2688c2299f996eee384357c0d04a05
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Verouderde alias voor opdrachten voor beheer van de Gateway-service.

`openclaw daemon ...` verwijst naar dezelfde servicebeheerinterface als de serviceopdrachten van `openclaw gateway ...`.

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

- `status`: toon de installatiestatus van de service en test de gezondheid van de Gateway
- `install`: installeer de service (`launchd`/`systemd`/`schtasks`)
- `uninstall`: verwijder de service
- `start`: start de service
- `stop`: stop de service
- `restart`: herstart de service

## Algemene opties

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
- levenscyclus (`uninstall|start|stop`): `--json`

Opmerkingen:

- `status` lost geconfigureerde auth-SecretRefs op voor probe-auth wanneer mogelijk.
- Als een vereiste auth-SecretRef in dit opdrachtpad niet is opgelost, rapporteert `daemon status --json` `rpc.authWarning` wanneer probe-connectiviteit/auth mislukt; geef `--token`/`--password` expliciet door of los eerst de geheime bron op.
- Als de probe slaagt, worden waarschuwingen over niet-opgeloste auth-refs onderdrukt om fout-positieven te voorkomen.
- `status --deep` voegt een best-effort servicescan op systeemniveau toe. Wanneer deze andere gateway-achtige services vindt, toont de menselijke uitvoer opruimhints en waarschuwt dat één gateway per machine nog steeds de normale aanbeveling is.
- Op Linux-systemd-installaties omvatten token-driftcontroles van `status` zowel `Environment=`- als `EnvironmentFile=`-unitbronnen.
- Driftcontroles lossen `gateway.auth.token`-SecretRefs op met behulp van de samengevoegde runtime-env (eerst de env van de serviceopdracht, daarna proces-env als fallback).
- Als token-auth niet effectief actief is (expliciete `gateway.auth.mode` van `password`/`none`/`trusted-proxy`, of modus niet ingesteld waarbij password kan winnen en geen tokenkandidaat kan winnen), slaan token-driftcontroles het oplossen van het configuratietoken over.
- Wanneer token-auth een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert `install` dat de SecretRef oplosbaar is, maar bewaart het opgeloste token niet in metadata van de serviceomgeving.
- Als token-auth een token vereist en de geconfigureerde token-SecretRef niet is opgelost, faalt install gesloten.
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt install geblokkeerd totdat de modus expliciet is ingesteld.
- Op macOS houdt `install` LaunchAgent-plists alleen toegankelijk voor de eigenaar en laadt het beheerde waarden voor de serviceomgeving via een alleen-voor-de-eigenaar-bestand en wrapper in plaats van API-sleutels of auth-profile-env-refs te serialiseren naar `EnvironmentVariables`.
- Als je bewust meerdere gateways op één host uitvoert, isoleer dan poorten, config/status en werkruimten; zie [/gateway#multiple-gateways-same-host](/nl/gateway#multiple-gateways-same-host).
- `restart --safe` vraagt de actieve Gateway om actief werk vooraf te controleren en één samengevoegde herstart te plannen nadat actief werk is leeggemaakt. Gewone `restart` behoudt het bestaande gedrag van de servicemanager; `--force` blijft het directe overridepad.

## Voorkeur

Gebruik [`openclaw gateway`](/nl/cli/gateway) voor actuele documentatie en voorbeelden.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-runbook](/nl/gateway)
