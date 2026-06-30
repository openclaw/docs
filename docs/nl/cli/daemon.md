---
read_when:
    - Je gebruikt nog steeds `openclaw daemon ...` in scripts
    - Je hebt opdrachten voor de servicelevenscyclus nodig (installeren/starten/stoppen/herstarten/status)
summary: CLI-referentie voor `openclaw daemon` (verouderde alias voor Gateway-servicebeheer)
title: Daemon
x-i18n:
    generated_at: "2026-06-30T14:11:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a3ec72b22907994ecefac84b2b9e5b22bf1d922e5b2822a1c0db80f0362dade
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Verouderde alias voor servicebeheeropdrachten van de Gateway.

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

- `status` lost geconfigureerde auth-SecretRefs waar mogelijk op voor probe-authenticatie.
- Als een vereiste auth-SecretRef in dit opdrachtpad niet kan worden opgelost, meldt `daemon status --json` `rpc.authWarning` wanneer probe-connectiviteit/authenticatie mislukt; geef `--token`/`--password` expliciet door of los eerst de secretbron op.
- Als de probe slaagt, worden waarschuwingen over niet-opgeloste auth-refs onderdrukt om fout-positieven te voorkomen.
- `status --deep` voegt een best-effort scan op systeemniveau van services toe. Wanneer deze andere gateway-achtige services vindt, toont uitvoer voor mensen opschoontips en waarschuwt dat één gateway per machine nog steeds de normale aanbeveling is.
- `status --deep` voert ook configuratievalidatie uit in pluginbewuste modus en toont waarschuwingen uit geconfigureerde pluginmanifests (bijvoorbeeld ontbrekende metagegevens voor kanaalconfiguratie), zodat install- en update-smokechecks ze vinden. Standaard `status` behoudt het snelle alleen-lezenpad dat pluginvalidatie overslaat.
- Bij Linux-systemd-installaties omvatten token-driftcontroles van `status` zowel `Environment=`- als `EnvironmentFile=`-unitbronnen.
- Driftcontroles lossen `gateway.auth.token`-SecretRefs op met samengevoegde runtime-omgeving (eerst de omgeving van serviceopdrachten, daarna de procesomgeving als fallback).
- Als tokenauthenticatie feitelijk niet actief is (expliciete `gateway.auth.mode` van `password`/`none`/`trusted-proxy`, of modus niet ingesteld waarbij wachtwoord kan winnen en geen tokenkandidaat kan winnen), slaan token-driftcontroles het oplossen van configuratietokens over.
- Wanneer tokenauthenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert `install` dat de SecretRef kan worden opgelost, maar bewaart het opgeloste token niet in metagegevens van de serviceomgeving.
- Als tokenauthenticatie een token vereist en de geconfigureerde token-SecretRef niet kan worden opgelost, faalt installatie gesloten.
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt installatie geblokkeerd totdat de modus expliciet is ingesteld.
- Op macOS houdt `install` LaunchAgent-plists alleen toegankelijk voor de eigenaar en laadt beheerde serviceomgevingswaarden via een alleen-voor-de-eigenaar bestand en wrapper in plaats van API-sleutels of auth-profiel-env-refs te serialiseren naar `EnvironmentVariables`.
- Als je bewust meerdere gateways op één host uitvoert, isoleer dan poorten, configuratie/status en werkruimten; zie [/gateway#multiple-gateways-same-host](/nl/gateway#multiple-gateways-same-host).
- `restart --safe` vraagt de draaiende Gateway om actief werk vooraf te controleren en één samengevoegde herstart te plannen nadat actief werk is afgehandeld. De standaard veilige herstart wacht op actief werk tot de geconfigureerde `gateway.reload.deferralTimeoutMs` (standaard 5 minuten); wanneer dat budget verloopt, wordt de herstart geforceerd. Stel `gateway.reload.deferralTimeoutMs` in op `0` voor onbeperkt veilig wachten dat nooit forceert. Gewone `restart` behoudt het bestaande gedrag van de servicemanager; `--force` blijft het directe overridepad.
- `restart --safe --skip-deferral` voert de OpenClaw-bewuste veilige herstart uit, maar omzeilt de uitstelpoort voor actief werk, zodat de Gateway de herstart onmiddellijk verstuurt, zelfs wanneer blokkades worden gemeld. Operator-nooduitgang wanneer een vastgelopen taakrun de veilige herstart blokkeert; vereist `--safe`.

## Voorkeur

Gebruik [`openclaw gateway`](/nl/cli/gateway) voor actuele documentatie en voorbeelden.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-runbook](/nl/gateway)
