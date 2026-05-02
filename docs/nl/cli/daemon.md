---
read_when:
    - Je gebruikt `openclaw daemon ...` nog steeds in scripts
    - Je hebt opdrachten voor de servicelevenscyclus nodig (install/start/stop/restart/status)
summary: CLI-referentie voor `openclaw daemon` (verouderde alias voor Gateway-servicebeheer)
title: Achtergrondproces
x-i18n:
    generated_at: "2026-05-02T22:17:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f11b75bf2781e69f6f59b23364f06cf359f9f24407f25f19b9d2186f7158512
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Verouderde alias voor opdrachten voor Gateway-servicebeheer.

`openclaw daemon ...` verwijst naar hetzelfde servicebeheeroppervlak als de serviceopdrachten van `openclaw gateway ...`.

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

- `status`: toon de installatiestatus van de service en controleer de Gateway-gezondheid
- `install`: installeer service (`launchd`/`systemd`/`schtasks`)
- `uninstall`: verwijder service
- `start`: start service
- `stop`: stop service
- `restart`: herstart service

## Algemene opties

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--force`, `--wait <duration>`, `--json`
- levenscyclus (`uninstall|start|stop`): `--json`

Opmerkingen:

- `status` lost geconfigureerde auth-SecretRefs op voor probe-authenticatie wanneer mogelijk.
- Als een vereiste auth-SecretRef in dit opdrachtpad niet is opgelost, meldt `daemon status --json` `rpc.authWarning` wanneer probe-connectiviteit/authenticatie mislukt; geef `--token`/`--password` expliciet door of los eerst de geheime bron op.
- Als de probe slaagt, worden waarschuwingen over niet-opgeloste auth-refs onderdrukt om fout-positieven te voorkomen.
- `status --deep` voegt een best-effort service-scan op systeemniveau toe. Wanneer die andere gateway-achtige services vindt, geeft de menselijke uitvoer opschoonhints weer en waarschuwt dat één gateway per machine nog steeds de normale aanbeveling is.
- Bij Linux-systemd-installaties omvatten token-driftcontroles van `status` zowel `Environment=`- als `EnvironmentFile=`-unitbronnen.
- Driftcontroles lossen `gateway.auth.token`-SecretRefs op met de samengevoegde runtime-env (eerst de env van de serviceopdracht, daarna process-env als fallback).
- Als token-authenticatie niet effectief actief is (expliciete `gateway.auth.mode` van `password`/`none`/`trusted-proxy`, of modus niet ingesteld waarbij password kan winnen en geen tokenkandidaat kan winnen), slaan token-driftcontroles het oplossen van config-token over.
- Wanneer token-authenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert `install` dat de SecretRef oplosbaar is, maar bewaart het opgeloste token niet in service-omgevingsmetadata.
- Als token-authenticatie een token vereist en de geconfigureerde token-SecretRef niet is opgelost, faalt de installatie gesloten.
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt installatie geblokkeerd totdat de modus expliciet is ingesteld.
- Op macOS houdt `install` LaunchAgent-plists alleen voor de eigenaar en laadt het beheerde service-omgevingswaarden via een alleen-voor-de-eigenaar-bestand en wrapper in plaats van API-sleutels of auth-profile-env-refs te serialiseren naar `EnvironmentVariables`.
- Als je bewust meerdere gateways op één host draait, isoleer dan poorten, config/status en workspaces; zie [/gateway#multiple-gateways-same-host](/nl/gateway#multiple-gateways-same-host).

## Voorkeur

Gebruik [`openclaw gateway`](/nl/cli/gateway) voor actuele docs en voorbeelden.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-runbook](/nl/gateway)
