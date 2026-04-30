---
read_when:
    - Je hebt verbindings-/authenticatieproblemen en wilt begeleide oplossingen
    - Je hebt iets bijgewerkt en wilt een sanity check
summary: CLI-referentie voor `openclaw doctor` (gezondheidscontroles + begeleide reparaties)
title: Dokter
x-i18n:
    generated_at: "2026-04-30T20:05:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265d82a10da086cf89687886e491be018a720b70021e0b26bd8f39b25a907e14
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gezondheidscontroles + snelle oplossingen voor de Gateway en kanalen.

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

- `--no-workspace-suggestions`: schakel geheugen-/zoeksuggesties voor de werkruimte uit
- `--yes`: accepteer standaardwaarden zonder te vragen
- `--repair`: pas aanbevolen reparaties toe zonder te vragen
- `--fix`: alias voor `--repair`
- `--force`: pas ingrijpende reparaties toe, inclusief het overschrijven van aangepaste serviceconfiguratie wanneer nodig
- `--non-interactive`: voer uit zonder prompts; alleen veilige migraties
- `--generate-gateway-token`: genereer en configureer een Gateway-token
- `--deep`: scan systeemservices op extra Gateway-installaties

Opmerkingen:

- Interactieve prompts (zoals keychain-/OAuth-oplossingen) worden alleen uitgevoerd wanneer stdin een TTY is en `--non-interactive` **niet** is ingesteld. Headless runs (cron, Telegram, geen terminal) slaan prompts over.
- Prestaties: niet-interactieve `doctor`-runs slaan eager plugin-laden over zodat headless gezondheidscontroles snel blijven. Interactieve sessies laden plugins nog steeds volledig wanneer een controle hun bijdrage nodig heeft.
- `--fix` (alias voor `--repair`) schrijft een back-up naar `~/.openclaw/openclaw.json.bak` en verwijdert onbekende configuratiesleutels, met een lijst van elke verwijdering.
- Integriteitscontroles voor status detecteren nu verweesde transcriptbestanden in de sessiemap. Ze archiveren als `.deleted.<timestamp>` vereist interactieve bevestiging; `--fix`, `--yes` en headless runs laten ze staan.
- Doctor scant ook `~/.openclaw/cron/jobs.json` (of `cron.store`) op verouderde cron-taakvormen en kan ze ter plekke herschrijven voordat de scheduler ze tijdens runtime automatisch moet normaliseren.
- Doctor repareert ontbrekende runtime-afhankelijkheden van gebundelde plugins zonder naar verpakte globale installaties te schrijven. Voor root-owned npm-installaties of geharde systemd-units stelt u `OPENCLAW_PLUGIN_STAGE_DIR` in op een schrijfbare map zoals `/var/lib/openclaw/plugin-runtime-deps`; dit kan ook een padlijst zijn zoals `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps`, waarbij eerdere roots alleen-lezen opzoeklagen zijn en de laatste root het reparatiedoel is.
- Doctor repareert verouderde pluginconfiguratie door ontbrekende plugin-id's te verwijderen uit `plugins.allow`/`plugins.entries`, plus bijpassende loshangende kanaalconfiguratie, Heartbeat-doelen en kanaalmodel-overschrijvingen wanneer plugin-detectie gezond is.
- Doctor plaatst ongeldige pluginconfiguratie in quarantaine door de betrokken `plugins.entries.<id>`-vermelding uit te schakelen en de ongeldige `config`-payload te verwijderen. Gateway-startup slaat al alleen die slechte plugin over zodat andere plugins en kanalen kunnen blijven draaien.
- Stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een andere supervisor eigenaar is van de Gateway-levenscyclus. Doctor rapporteert nog steeds Gateway-/servicestatus en past niet-service-reparaties toe, maar slaat service-installatie/start/herstart/bootstrap en het opruimen van verouderde services over.
- Op Linux negeert doctor inactieve extra Gateway-achtige systemd-units en herschrijft geen command-/entrypoint-metadata voor een draaiende systemd Gateway-service tijdens reparatie. Stop eerst de service of gebruik `openclaw gateway install --force` wanneer u bewust de actieve launcher wilt vervangen.
- Doctor migreert verouderde platte Talk-configuratie (`talk.voiceId`, `talk.modelId` en verwante sleutels) automatisch naar `talk.provider` + `talk.providers.<provider>`.
- Herhaalde `doctor --fix`-runs rapporteren/passen Talk-normalisatie niet meer toe wanneer het enige verschil de volgorde van objectsleutels is.
- Doctor bevat een gereedheidscontrole voor geheugenzoeken en kan `openclaw configure --section model` aanbevelen wanneer embedding-referenties ontbreken.
- Doctor waarschuwt wanneer er geen commando-eigenaar is geconfigureerd. De commando-eigenaar is het account van de menselijke operator dat owner-only-commando's mag uitvoeren en gevaarlijke acties mag goedkeuren. DM-koppeling laat iemand alleen met de bot praten; als u een afzender hebt goedgekeurd voordat first-owner-bootstrap bestond, stel dan `commands.ownerAllowFrom` expliciet in.
- Doctor waarschuwt wanneer Codex-modusagents zijn geconfigureerd en persoonlijke Codex CLI-assets bestaan in de Codex-home van de operator. Lokale Codex app-server-starts gebruiken geïsoleerde per-agent homes, dus gebruik `openclaw migrate codex --dry-run` om assets te inventariseren die bewust moeten worden gepromoveerd.
- Als sandbox-modus is ingeschakeld maar Docker niet beschikbaar is, rapporteert doctor een waarschuwing met hoge signaalwaarde en hersteladvies (`install Docker` of `openclaw config set agents.defaults.sandbox.mode off`).
- Als `gateway.auth.token`/`gateway.auth.password` door SecretRef worden beheerd en niet beschikbaar zijn in het huidige commandopad, rapporteert doctor een alleen-lezen waarschuwing en schrijft geen plaintext fallback-referenties.
- Als kanaal-SecretRef-inspectie faalt in een fix-pad, gaat doctor door en rapporteert een waarschuwing in plaats van vroegtijdig af te sluiten.
- Automatische resolutie van Telegram `allowFrom`-gebruikersnamen (`doctor --fix`) vereist een oplosbaar Telegram-token in het huidige commandopad. Als tokeninspectie niet beschikbaar is, rapporteert doctor een waarschuwing en slaat automatische resolutie voor die run over.

## macOS: `launchctl`-env-overschrijvingen

Als u eerder `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (of `...PASSWORD`) hebt uitgevoerd, overschrijft die waarde uw configuratiebestand en kan dit aanhoudende “unauthorized”-fouten veroorzaken.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway doctor](/nl/gateway/doctor)
