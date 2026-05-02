---
read_when:
    - Je hebt verbindings-/authenticatieproblemen en wilt begeleide oplossingen
    - Je hebt iets bijgewerkt en wilt een snelle controle
summary: CLI-referentie voor `openclaw doctor` (statuscontroles + begeleide reparaties)
title: Diagnose
x-i18n:
    generated_at: "2026-05-02T11:12:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: e861fa105737088eafa55815faa1a37ccd61e154e8dbe811cf4b988bc1c571e5
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gezondheidscontroles + snelle reparaties voor de Gateway en kanalen.

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

- `--no-workspace-suggestions`: schakel suggesties voor werkruimtegeheugen/zoeken uit
- `--yes`: accepteer standaardwaarden zonder te vragen
- `--repair`: pas aanbevolen reparaties buiten services om toe zonder te vragen; installaties en herschrijvingen van Gateway-services vereisen nog steeds interactieve bevestiging of expliciete Gateway-commando's
- `--fix`: alias voor `--repair`
- `--force`: pas ingrijpende reparaties toe, inclusief het overschrijven van aangepaste serviceconfiguratie wanneer nodig
- `--non-interactive`: voer uit zonder prompts; alleen veilige migraties en reparaties buiten services om
- `--generate-gateway-token`: genereer en configureer een Gateway-token
- `--deep`: scan systeemservices op extra Gateway-installaties

Opmerkingen:

- Interactieve prompts (zoals keychain-/OAuth-reparaties) worden alleen uitgevoerd wanneer stdin een TTY is en `--non-interactive` **niet** is ingesteld. Headless-runs (cron, Telegram, geen terminal) slaan prompts over.
- Prestaties: niet-interactieve `doctor`-runs slaan eager laden van plugins over, zodat headless gezondheidscontroles snel blijven. Interactieve sessies laden plugins nog steeds volledig wanneer een controle hun bijdrage nodig heeft.
- `--fix` (alias voor `--repair`) schrijft een back-up naar `~/.openclaw/openclaw.json.bak` en verwijdert onbekende configuratiesleutels, waarbij elke verwijdering wordt vermeld.
- `doctor --fix --non-interactive` meldt ontbrekende of verouderde Gateway-servicedefinities, maar installeert of herschrijft ze niet buiten de reparatiemodus voor updates. Voer `openclaw gateway install` uit voor een ontbrekende service, of `openclaw gateway install --force` wanneer je de launcher bewust wilt vervangen.
- Integriteitscontroles van de status detecteren nu verweesde transcriptbestanden in de sessiemap. Ze archiveren als `.deleted.<timestamp>` vereist interactieve bevestiging; `--fix`, `--yes` en headless-runs laten ze staan.
- Doctor scant ook `~/.openclaw/cron/jobs.json` (of `cron.store`) op verouderde vormen van Cron-taken en kan ze ter plaatse herschrijven voordat de scheduler ze tijdens runtime automatisch moet normaliseren.
- Op Linux waarschuwt doctor wanneer de crontab van de gebruiker nog steeds het verouderde `~/.openclaw/bin/ensure-whatsapp.sh` uitvoert; dat script wordt niet langer onderhouden en kan foutieve WhatsApp Gateway-storingen loggen wanneer Cron de systemd user-bus-omgeving mist.
- Doctor ruimt verouderde stagingstatus voor Plugin-afhankelijkheden op die door oudere OpenClaw-versies is gemaakt. Het repareert ook ontbrekende geconfigureerde downloadbare plugins wanneer het register ze kan vinden.
- Doctor repareert verouderde Plugin-configuratie door ontbrekende Plugin-id's te verwijderen uit `plugins.allow`/`plugins.entries`, plus bijbehorende loshangende kanaalconfiguratie, Heartbeat-doelen en overschrijvingen van kanaalmodellen wanneer Plugin-detectie gezond is.
- Doctor plaatst ongeldige Plugin-configuratie in quarantaine door de betrokken `plugins.entries.<id>`-vermelding uit te schakelen en de ongeldige `config`-payload te verwijderen. Het opstarten van de Gateway slaat alleen die foutieve Plugin al over, zodat andere plugins en kanalen kunnen blijven draaien.
- Stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een andere supervisor de levenscyclus van de Gateway beheert. Doctor meldt nog steeds de gezondheid van Gateway/services en past reparaties buiten services om toe, maar slaat service-installatie/start/herstart/bootstrap en opruiming van verouderde services over.
- Op Linux negeert doctor inactieve extra Gateway-achtige systemd-units en herschrijft het tijdens reparatie geen metadata voor commando/entrypoint van een draaiende systemd Gateway-service. Stop de service eerst of gebruik `openclaw gateway install --force` wanneer je de actieve launcher bewust wilt vervangen.
- Doctor migreert verouderde platte Talk-configuratie (`talk.voiceId`, `talk.modelId` en verwante sleutels) automatisch naar `talk.provider` + `talk.providers.<provider>`.
- Herhaalde `doctor --fix`-runs melden/passen Talk-normalisatie niet meer toe wanneer het enige verschil de sleutelvolgorde van objecten is.
- Doctor bevat een gereedheidscontrole voor geheugenzoekopdrachten en kan `openclaw configure --section model` aanbevelen wanneer embeddingreferenties ontbreken.
- Doctor waarschuwt wanneer er geen commando-eigenaar is geconfigureerd. De commando-eigenaar is het menselijke operatoraccount dat eigenaar-only commando's mag uitvoeren en gevaarlijke acties mag goedkeuren. DM-koppeling laat iemand alleen met de bot praten; als je een afzender hebt goedgekeurd voordat de bootstrap voor de eerste eigenaar bestond, stel `commands.ownerAllowFrom` dan expliciet in.
- Doctor waarschuwt wanneer agents in Codex-modus zijn geconfigureerd en persoonlijke Codex CLI-assets bestaan in de Codex-home van de operator. Lokale launches van de Codex-appserver gebruiken geïsoleerde homes per agent, dus gebruik `openclaw migrate codex --dry-run` om assets te inventariseren die bewust moeten worden gepromoot.
- Als sandboxmodus is ingeschakeld maar Docker niet beschikbaar is, meldt doctor een gerichte waarschuwing met oplossing (`install Docker` of `openclaw config set agents.defaults.sandbox.mode off`).
- Als `gateway.auth.token`/`gateway.auth.password` door SecretRef worden beheerd en niet beschikbaar zijn in het huidige commandopad, meldt doctor een alleen-lezen waarschuwing en schrijft het geen fallbackreferenties in platte tekst.
- Als inspectie van kanaal-SecretRef mislukt in een fix-pad, gaat doctor door en meldt het een waarschuwing in plaats van vroegtijdig af te sluiten.
- Na migraties van de statusmap waarschuwt doctor wanneer ingeschakelde standaardaccounts voor Telegram of Discord afhankelijk zijn van een env-fallback en `TELEGRAM_BOT_TOKEN` of `DISCORD_BOT_TOKEN` niet beschikbaar is voor het doctor-proces.
- Automatische resolutie van Telegram `allowFrom`-gebruikersnamen (`doctor --fix`) vereist een oplosbaar Telegram-token in het huidige commandopad. Als tokeninspectie niet beschikbaar is, meldt doctor een waarschuwing en slaat het automatische resolutie voor die run over.

## macOS: env-overschrijvingen voor `launchctl`

Als je eerder `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (of `...PASSWORD`) hebt uitgevoerd, overschrijft die waarde je configuratiebestand en kan dit aanhoudende fouten met “ongeautoriseerd” veroorzaken.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway doctor](/nl/gateway/doctor)
