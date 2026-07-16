---
read_when:
    - Je gebruikt nog steeds `openclaw daemon ...` in scripts
    - Je hebt opdrachten voor de servicelevenscyclus nodig (installeren/starten/stoppen/herstarten/status)
summary: CLI-referentie voor `openclaw daemon` (verouderde alias voor Gateway-servicebeheer)
title: Daemon
x-i18n:
    generated_at: "2026-07-16T15:34:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a5e08114a8a0de959b54fcb0fcef88b880424fd89c133f7c383f254d18f0d71d
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Verouderde alias voor het beheer van de Gateway-service. `openclaw daemon ...` verwijst naar dezelfde opdrachten voor servicebeheer als `openclaw gateway ...`. Gebruik bij voorkeur [`openclaw gateway`](/nl/cli/gateway) voor actuele documentatie en voorbeelden.

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

| Subopdracht | Opties                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`   | `--port`, `--runtime <node>`, `--token`, `--wrapper <path>`, `--force`, `--json`                 |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`, `--disable` (alleen launchd: onderdruk KeepAlive/RunAtLoad permanent tot de volgende start) |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`: toont de installatiestatus van de service (launchd/systemd/schtasks) en controleert de status van de Gateway.
- `install`: installeert de service; `--force` installeert opnieuw of overschrijft een bestaande installatie.
- `restart --safe`: vraagt de actieve Gateway om actieve werkzaamheden vooraf te controleren en één samengevoegde herstart te plannen nadat de werkzaamheden zijn afgerond, begrensd door `gateway.reload.deferralTimeoutMs` (standaard 300000ms/5 minuten; stel in op `0` om onbeperkt te wachten). Wanneer die tijdslimiet verstrijkt, wordt de herstart alsnog geforceerd. Een gewone `restart` gebruikt de servicebeheerder rechtstreeks; `--force` is de onmiddellijke override.
- `restart --safe --skip-deferral`: omzeilt de uitstelblokkering voor actieve werkzaamheden, zodat de Gateway onmiddellijk opnieuw wordt gestart, zelfs wanneer blokkeringen worden gemeld. Vereist `--safe`.

## Opmerkingen

- `status` zet geconfigureerde SecretRefs voor authenticatie waar mogelijk om voor probe-authenticatie. Als een vereiste SecretRef niet kan worden omgezet, meldt `status --json` `rpc.authWarning`; geef `--token`/`--password` expliciet door of los eerst de geheime bron op. Waarschuwingen over niet-opgeloste authenticatie worden onderdrukt zodra de probe verder slaagt.
- `status --deep` voegt een best-effortscan op systeemniveau toe voor andere Gateway-achtige services (toont opschooninstructies; één Gateway per machine blijft de aanbeveling) en voert configuratievalidatie uit in Plugin-bewuste modus, waarbij waarschuwingen uit Plugin-manifesten worden getoond die door het snelle standaardpad worden overgeslagen.
- Bij Linux-installaties met systemd controleren tests op tokenafwijkingen zowel de unit-bronnen `Environment=` als `EnvironmentFile=`.
- Tests op tokenafwijkingen zetten `gateway.auth.token` SecretRefs om met behulp van de samengevoegde runtime-omgeving (eerst de opdrachtomgeving van de service, daarna de procesomgeving). Als tokenauthenticatie niet daadwerkelijk actief is (`gateway.auth.mode` van `password`/`none`/`trusted-proxy`, of niet ingesteld terwijl het wachtwoord voorrang kan krijgen), wordt het omzetten van het configuratietoken overgeslagen.
- `install` valideert dat een via SecretRef beheerde `gateway.auth.token` kan worden omgezet, maar slaat de omgezette waarde nooit op in de omgevingsmetadata van de service; als omzetting niet mogelijk is, mislukt de installatie volgens het fail-closed-principe.
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert `install` totdat je de modus expliciet instelt.
- Op macOS houdt `install` de LaunchAgent-plists en het gegenereerde omgevingsbestand/de wrapper alleen toegankelijk voor de eigenaar (modus `0600`/`0700`), in plaats van geheimen in `EnvironmentVariables` in te sluiten.
- Meerdere Gateways op één host uitvoeren: isoleer poorten, configuratie/status en werkruimten. Zie [Meerdere gateways](/nl/gateway#multiple-gateways-same-host).

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway-draaiboek](/nl/gateway)
