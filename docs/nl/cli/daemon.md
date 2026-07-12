---
read_when:
    - Je gebruikt nog steeds `openclaw daemon ...` in scripts
    - Je hebt opdrachten voor de levenscyclus van de service nodig (installeren/starten/stoppen/herstarten/status)
summary: CLI-referentie voor `openclaw daemon` (verouderde alias voor Gateway-servicebeheer)
title: Daemon
x-i18n:
    generated_at: "2026-07-12T08:44:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4933885078d067ff2e077f25f14483aa5a10e3cd36951d0dc25c625d8b4d78e6
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Verouderde alias voor het beheer van de Gateway-service. `openclaw daemon ...` verwijst naar dezelfde servicebeheeropdrachten als `openclaw gateway ...`. Gebruik bij voorkeur [`openclaw gateway`](/nl/cli/gateway) voor actuele documentatie en voorbeelden.

## Gebruik

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Subopdrachten en opties

| Subopdracht | Opties                                                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`                              |
| `install`   | `--port`, `--runtime <node\|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`                                         |
| `uninstall` | `--json`                                                                                                                      |
| `start`     | `--json`                                                                                                                      |
| `stop`      | `--json`, `--disable` (alleen launchd: KeepAlive/RunAtLoad permanent onderdrukken tot de volgende start)                     |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                                                        |

- `status`: toont de installatiestatus van de service (launchd/systemd/schtasks) en controleert de status van de Gateway.
- `install`: installeert de service; `--force` installeert opnieuw of overschrijft een bestaande installatie.
- `restart --safe`: vraagt de actieve Gateway om lopend werk vooraf te controleren en één samengevoegde herstart te plannen nadat het werk is afgehandeld, begrensd door `gateway.reload.deferralTimeoutMs` (standaard 300000 ms/5 minuten; stel dit in op `0` om onbeperkt te wachten). Wanneer die tijdslimiet verloopt, wordt de herstart alsnog geforceerd. Een gewone `restart` gebruikt de servicebeheerder rechtstreeks; `--force` is de onmiddellijke overschrijving.
- `restart --safe --skip-deferral`: omzeilt het uitstelmechanisme voor actief werk, zodat de Gateway onmiddellijk opnieuw wordt gestart, zelfs wanneer blokkades worden gemeld. Vereist `--safe`.

## Opmerkingen

- `status` lost geconfigureerde SecretRefs voor probe-authenticatie waar mogelijk op. Als een vereiste SecretRef niet kan worden opgelost, meldt `status --json` dit via `rpc.authWarning`; geef `--token`/`--password` expliciet door of los eerst de bron van het geheim op. Waarschuwingen over niet-opgeloste authenticatie worden onderdrukt zodra de probe verder slaagt.
- `status --deep` voegt een naar beste vermogen uitgevoerde scan op systeemniveau toe voor andere Gateway-achtige services (toont opruimtips; één Gateway per machine blijft de aanbeveling) en voert configuratievalidatie uit in een Plugin-bewuste modus, waardoor waarschuwingen uit Plugin-manifesten zichtbaar worden die het snelle standaardpad overslaat.
- Bij Linux-installaties met systemd onderzoeken controles op tokenafwijkingen zowel de eenheidsbronnen `Environment=` als `EnvironmentFile=`.
- Controles op tokenafwijkingen lossen SecretRefs voor `gateway.auth.token` op met behulp van de samengevoegde runtime-omgeving (eerst de omgeving van de serviceopdracht, daarna de procesomgeving). Als tokenauthenticatie feitelijk niet actief is (`gateway.auth.mode` is `password`/`none`/`trusted-proxy`, of is niet ingesteld terwijl het wachtwoord voorrang kan krijgen), wordt het oplossen van het configuratietoken overgeslagen.
- `install` valideert dat een door SecretRef beheerde `gateway.auth.token` kan worden opgelost, maar slaat de opgeloste waarde nooit op in de omgevingsmetadata van de service; als deze niet kan worden opgelost, wordt de installatie veilig geweigerd.
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert `install` totdat u de modus expliciet instelt.
- Op macOS houdt `install` de LaunchAgent-plists en het gegenereerde omgevingsbestand/de wrapper uitsluitend toegankelijk voor de eigenaar (modus `0600`/`0700`), in plaats van geheimen in `EnvironmentVariables` op te nemen.
- Meerdere Gateways op één host uitvoeren: isoleer poorten, configuratie/status en werkruimten. Zie [Meerdere Gateways](/nl/gateway#multiple-gateways-same-host).

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-draaiboek](/nl/gateway)
