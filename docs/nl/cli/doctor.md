---
read_when:
    - Je hebt verbindings-/authenticatieproblemen en wilt begeleide oplossingen
    - Je hebt een update uitgevoerd en wilt een snelle controle
summary: CLI-referentie voor `openclaw doctor` (gezondheidscontroles + begeleide reparaties)
title: Diagnose
x-i18n:
    generated_at: "2026-04-29T22:32:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9985c84d23861dd9468a4659ee00519573fe6d540c436548da0a68067dbabc4c
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Healthchecks + snelle oplossingen voor de Gateway en kanalen.

Gerelateerd:

- Probleemoplossing: [Probleemoplossing](/nl/gateway/troubleshooting)
- Beveiligingsaudit: [Beveiliging](/nl/gateway/security)

## Voorbeelden

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Opties

- `--no-workspace-suggestions`: schakel suggesties voor workspace-geheugen/zoeken uit
- `--yes`: accepteer standaardwaarden zonder te vragen
- `--repair`: pas aanbevolen reparaties toe zonder te vragen
- `--fix`: alias voor `--repair`
- `--force`: pas ingrijpende reparaties toe, inclusief het overschrijven van aangepaste serviceconfiguratie wanneer nodig
- `--non-interactive`: voer uit zonder prompts; alleen veilige migraties
- `--generate-gateway-token`: genereer en configureer een Gateway-token
- `--deep`: scan systeemservices op extra Gateway-installaties

Opmerkingen:

- Interactieve prompts (zoals keychain-/OAuth-oplossingen) worden alleen uitgevoerd wanneer stdin een TTY is en `--non-interactive` **niet** is ingesteld. Headless runs (cron, Telegram, geen terminal) slaan prompts over.
- Prestaties: niet-interactieve `doctor`-runs slaan het gretig laden van Plugins over zodat headless healthchecks snel blijven. Interactieve sessies laden Plugins nog steeds volledig wanneer een check hun bijdrage nodig heeft.
- `--fix` (alias voor `--repair`) schrijft een back-up naar `~/.openclaw/openclaw.json.bak` en verwijdert onbekende configuratiesleutels, waarbij elke verwijdering wordt vermeld.
- Controles op statusintegriteit detecteren nu verweesde transcriptbestanden in de sessiemap. Ze archiveren als `.deleted.<timestamp>` vereist interactieve bevestiging; `--fix`, `--yes` en headless runs laten ze staan.
- Doctor scant ook `~/.openclaw/cron/jobs.json` (of `cron.store`) op verouderde Cron-taakvormen en kan ze ter plekke herschrijven voordat de scheduler ze tijdens runtime automatisch moet normaliseren.
- Doctor repareert ontbrekende runtime-afhankelijkheden van gebundelde Plugins zonder naar verpakte globale installaties te schrijven. Voor root-owned npm-installaties of verharde systemd-units stel je `OPENCLAW_PLUGIN_STAGE_DIR` in op een schrijfbare map zoals `/var/lib/openclaw/plugin-runtime-deps`; het kan ook een padlijst zijn zoals `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps`, waarbij eerdere roots read-only opzoeklagen zijn en de laatste root het reparatiedoel is.
- Doctor repareert verouderde Plugin-configuratie door ontbrekende Plugin-id's te verwijderen uit `plugins.allow`/`plugins.entries`, plus bijbehorende bungelende kanaalconfiguratie, Heartbeat-doelen en kanaalmodeloverschrijvingen wanneer Plugin-detectie gezond is.
- Doctor plaatst ongeldige Plugin-configuratie in quarantaine door de betreffende `plugins.entries.<id>`-vermelding uit te schakelen en de ongeldige `config`-payload te verwijderen. Het opstarten van de Gateway slaat al alleen die slechte Plugin over, zodat andere Plugins en kanalen kunnen blijven draaien.
- Stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een andere supervisor eigenaar is van de levenscyclus van de Gateway. Doctor rapporteert nog steeds de status van Gateway/service en past niet-servicegerelateerde reparaties toe, maar slaat service-installatie/start/herstart/bootstrap en opruiming van verouderde services over.
- Op Linux negeert doctor inactieve extra gateway-achtige systemd-units en herschrijft tijdens reparatie geen commando-/entrypointmetadata voor een draaiende systemd Gateway-service. Stop de service eerst of gebruik `openclaw gateway install --force` wanneer je bewust de actieve launcher wilt vervangen.
- Doctor migreert automatisch verouderde platte Talk-configuratie (`talk.voiceId`, `talk.modelId` en verwante instellingen) naar `talk.provider` + `talk.providers.<provider>`.
- Herhaalde `doctor --fix`-runs rapporteren/passen Talk-normalisatie niet meer toe wanneer het enige verschil de volgorde van objectsleutels is.
- Doctor bevat een gereedheidscheck voor geheugenzoeken en kan `openclaw configure --section model` aanbevelen wanneer embeddingreferenties ontbreken.
- Doctor waarschuwt wanneer er geen commando-eigenaar is geconfigureerd. De commando-eigenaar is het menselijke operatoraccount dat owner-only commando's mag uitvoeren en gevaarlijke acties mag goedkeuren. DM-koppeling laat iemand alleen met de bot praten; als je een afzender hebt goedgekeurd voordat first-owner-bootstrap bestond, stel dan `commands.ownerAllowFrom` expliciet in.
- Als sandboxmodus is ingeschakeld maar Docker niet beschikbaar is, rapporteert doctor een waarschuwing met hoge signaalwaarde en hersteladvies (`install Docker` of `openclaw config set agents.defaults.sandbox.mode off`).
- Als `gateway.auth.token`/`gateway.auth.password` door SecretRef worden beheerd en niet beschikbaar zijn in het huidige commandopad, rapporteert doctor een read-only waarschuwing en schrijft geen plaintext fallback-referenties.
- Als inspectie van kanaal-SecretRef in een fixpad mislukt, gaat doctor door en rapporteert een waarschuwing in plaats van vroegtijdig af te sluiten.
- Automatische resolutie van Telegram `allowFrom`-gebruikersnamen (`doctor --fix`) vereist een oplosbaar Telegram-token in het huidige commandopad. Als tokeninspectie niet beschikbaar is, rapporteert doctor een waarschuwing en slaat automatische resolutie voor die run over.

## macOS: `launchctl` env-overschrijvingen

Als je eerder `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (of `...PASSWORD`) hebt uitgevoerd, overschrijft die waarde je configuratiebestand en kan dit aanhoudende fouten met “niet geautoriseerd” veroorzaken.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway doctor](/nl/gateway/doctor)
