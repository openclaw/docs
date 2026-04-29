---
read_when:
    - Je gebruikt nog steeds `openclaw daemon ...` in scripts
    - Je hebt commando's voor de servicelevenscyclus nodig (install/start/stop/restart/status)
summary: CLI-referentie voor `openclaw daemon` (verouderde alias voor Gateway-servicebeheer)
title: Daemon
x-i18n:
    generated_at: "2026-04-29T22:31:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51839f7cbc180cc0c43caa2d7e83cc2add7cbca40665f83f64e6ce9dde8574dd
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Verouderde alias voor Gateway-servicebeheercommando's.

`openclaw daemon ...` verwijst naar hetzelfde servicebeheeroppervlak als de servicecommando's van `openclaw gateway ...`.

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

- `status`: toon de installatiestatus van de service en controleer de Gateway-status
- `install`: installeer de service (`launchd`/`systemd`/`schtasks`)
- `uninstall`: verwijder de service
- `start`: start de service
- `stop`: stop de service
- `restart`: herstart de service

## Algemene opties

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- levenscyclus (`uninstall|start|stop|restart`): `--json`

Opmerkingen:

- `status` lost geconfigureerde authenticatie-SecretRefs voor probe-authenticatie op wanneer mogelijk.
- Als een vereiste authenticatie-SecretRef in dit commandopad niet is opgelost, rapporteert `daemon status --json` `rpc.authWarning` wanneer probe-connectiviteit/authenticatie mislukt; geef `--token`/`--password` expliciet door of los eerst de geheime bron op.
- Als de probe slaagt, worden waarschuwingen voor onopgeloste auth-refs onderdrukt om vals-positieven te voorkomen.
- `status --deep` voegt een best-effort service-scan op systeemniveau toe. Wanneer andere gateway-achtige services worden gevonden, toont de menselijke uitvoer opruimhints en waarschuwt dat één gateway per machine nog steeds de normale aanbeveling is.
- Bij Linux systemd-installaties bevatten `status`-controles op token-afwijking zowel `Environment=`- als `EnvironmentFile=`-unitbronnen.
- Afwijkingscontroles lossen `gateway.auth.token` SecretRefs op met de samengevoegde runtime-env (eerst de env van het servicecommando, daarna proces-env als fallback).
- Als token-authenticatie niet effectief actief is (expliciete `gateway.auth.mode` van `password`/`none`/`trusted-proxy`, of mode niet ingesteld waarbij wachtwoord kan winnen en geen tokenkandidaat kan winnen), slaan token-afwijkingscontroles het oplossen van het config-token over.
- Wanneer token-authenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert `install` dat de SecretRef oplosbaar is, maar bewaart het opgeloste token niet in metadata van de service-omgeving.
- Als token-authenticatie een token vereist en de geconfigureerde token-SecretRef niet is opgelost, mislukt de installatie gesloten.
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt installatie geblokkeerd totdat de mode expliciet is ingesteld.
- Op macOS houdt `install` LaunchAgent-plists alleen toegankelijk voor de eigenaar en laadt beheerde service-omgevingswaarden via een alleen-voor-de-eigenaar bestand en wrapper in plaats van API-sleutels of auth-profile env refs te serialiseren naar `EnvironmentVariables`.
- Als je bewust meerdere gateways op één host uitvoert, isoleer dan poorten, config/state en workspaces; zie [/gateway#multiple-gateways-same-host](/nl/gateway#multiple-gateways-same-host).

## Voorkeur

Gebruik [`openclaw gateway`](/nl/cli/gateway) voor actuele documentatie en voorbeelden.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-runbook](/nl/gateway)
