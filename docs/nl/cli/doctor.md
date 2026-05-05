---
read_when:
    - Je hebt connectiviteits-/authenticatieproblemen en wilt begeleide oplossingen
    - Je hebt bijgewerkt en wilt een snelle controle
summary: CLI-referentie voor `openclaw doctor` (gezondheidscontroles + begeleide herstelacties)
title: Diagnose
x-i18n:
    generated_at: "2026-05-05T01:44:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 079d7674ae2a259a0430e30e7577ac532135ad5461c57c4b3a6514a007bc9ea5
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

- `--no-workspace-suggestions`: schakel suggesties voor werkruimtegeheugen/zoeken uit
- `--yes`: accepteer standaardwaarden zonder prompts
- `--repair`: pas aanbevolen niet-serviceherstelacties toe zonder prompts; installaties en herschrijvingen van de Gateway-service vereisen nog steeds interactieve bevestiging of expliciete Gateway-opdrachten
- `--fix`: alias voor `--repair`
- `--force`: pas agressieve herstelacties toe, inclusief het overschrijven van aangepaste serviceconfiguratie wanneer nodig
- `--non-interactive`: voer uit zonder prompts; alleen veilige migraties en niet-serviceherstelacties
- `--generate-gateway-token`: genereer en configureer een Gateway-token
- `--deep`: scan systeemservices op extra Gateway-installaties

Opmerkingen:

- Interactieve prompts (zoals oplossingen voor sleutelhanger/OAuth) worden alleen uitgevoerd wanneer stdin een TTY is en `--non-interactive` **niet** is ingesteld. Headless uitvoeringen (Cron, Telegram, geen terminal) slaan prompts over.
- Prestaties: niet-interactieve `doctor`-uitvoeringen slaan eager Plugin-loading over zodat headless gezondheidscontroles snel blijven. Interactieve sessies laden Plugins nog steeds volledig wanneer een controle hun bijdrage nodig heeft.
- `--fix` (alias voor `--repair`) schrijft een back-up naar `~/.openclaw/openclaw.json.bak` en verwijdert onbekende configuratiesleutels, waarbij elke verwijdering wordt vermeld.
- `doctor --fix --non-interactive` meldt ontbrekende of verouderde Gateway-servicedefinities, maar installeert of herschrijft ze niet buiten de modus voor updateherstel. Voer `openclaw gateway install` uit voor een ontbrekende service, of `openclaw gateway install --force` wanneer je de launcher bewust wilt vervangen.
- Integriteitscontroles van de status detecteren nu verweesde transcriptbestanden in de sessiemap. Ze archiveren als `.deleted.<timestamp>` vereist interactieve bevestiging; `--fix`, `--yes` en headless uitvoeringen laten ze staan.
- Doctor scant ook `~/.openclaw/cron/jobs.json` (of `cron.store`) op verouderde vormen van Cron-taken en kan ze ter plekke herschrijven voordat de scheduler ze tijdens runtime automatisch moet normaliseren.
- Op Linux waarschuwt doctor wanneer de crontab van de gebruiker nog steeds het verouderde `~/.openclaw/bin/ensure-whatsapp.sh` uitvoert; dat script wordt niet meer onderhouden en kan foutieve WhatsApp Gateway-storingen loggen wanneer Cron de systemd user-busomgeving mist.
- Doctor ruimt verouderde stagingstatus voor Plugin-afhankelijkheden op die door oudere OpenClaw-versies is gemaakt. Het herstelt ook ontbrekende downloadbare Plugins waarnaar in de configuratie wordt verwezen, zoals `plugins.entries`, geconfigureerde kanalen, geconfigureerde provider-/zoekinstellingen of geconfigureerde agent-runtimes. Tijdens pakketupdates slaat doctor Plugin-herstel via de pakketbeheerder over totdat de pakketwissel is voltooid; voer daarna opnieuw `openclaw doctor --fix` uit als een geconfigureerde Plugin nog herstel nodig heeft. Als de download mislukt, meldt doctor de installatiefout en behoudt het de geconfigureerde Plugin-vermelding voor de volgende herstelpoging.
- Doctor herstelt verouderde Plugin-configuratie door ontbrekende Plugin-id's te verwijderen uit `plugins.allow`/`plugins.entries`, plus bijpassende zwevende kanaalconfiguratie, Heartbeat-doelen en overrides voor kanaalmodellen wanneer Plugin-discovery gezond is.
- Doctor plaatst ongeldige Plugin-configuratie in quarantaine door de betrokken `plugins.entries.<id>`-vermelding uit te schakelen en de ongeldige `config`-payload te verwijderen. Het opstarten van de Gateway slaat al alleen die slechte Plugin over, zodat andere Plugins en kanalen kunnen blijven draaien.
- Stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een andere supervisor de Gateway-levenscyclus beheert. Doctor meldt nog steeds de gezondheid van Gateway/service en past niet-serviceherstelacties toe, maar slaat service-install/start/restart/bootstrap en het opschonen van verouderde services over.
- Op Linux negeert doctor inactieve extra Gateway-achtige systemd-units en herschrijft het tijdens herstel geen opdracht-/entrypointmetadata voor een draaiende systemd Gateway-service. Stop eerst de service of gebruik `openclaw gateway install --force` wanneer je de actieve launcher bewust wilt vervangen.
- Doctor migreert automatisch verouderde platte Talk-configuratie (`talk.voiceId`, `talk.modelId` en verwante sleutels) naar `talk.provider` + `talk.providers.<provider>`.
- Herhaalde `doctor --fix`-uitvoeringen melden/passen Talk-normalisatie niet langer toe wanneer het enige verschil de volgorde van objectsleutels is.
- Doctor bevat een gereedheidscontrole voor geheugenzoeken en kan `openclaw configure --section model` aanbevelen wanneer embedding-credentials ontbreken.
- Doctor waarschuwt wanneer er geen opdrachteigenaar is geconfigureerd. De opdrachteigenaar is het menselijke operatoraccount dat eigenaar-only opdrachten mag uitvoeren en gevaarlijke acties mag goedkeuren. DM-koppeling laat iemand alleen met de bot praten; als je een afzender hebt goedgekeurd voordat first-owner bootstrap bestond, stel dan `commands.ownerAllowFrom` expliciet in.
- Doctor waarschuwt wanneer Codex-modusagents zijn geconfigureerd en persoonlijke Codex CLI-assets bestaan in de Codex-home van de operator. Lokale lanceringen van de Codex-appserver gebruiken geïsoleerde homes per agent, dus gebruik `openclaw migrate codex --dry-run` om assets te inventariseren die bewust moeten worden gepromoveerd.
- Doctor waarschuwt wanneer Skills die voor de standaardagent zijn toegestaan niet beschikbaar zijn in de huidige runtimeomgeving omdat bins, env vars, configuratie of OS-vereisten ontbreken. `doctor --fix` kan die niet-beschikbare Skills uitschakelen met `skills.entries.<skill>.enabled=false`; installeer/configureer in plaats daarvan de ontbrekende vereiste wanneer je de Skill actief wilt houden.
- Als sandboxmodus is ingeschakeld maar Docker niet beschikbaar is, meldt doctor een waarschuwing met hoge signaalwaarde en hersteladvies (`install Docker` of `openclaw config set agents.defaults.sandbox.mode off`).
- Als verouderde sandboxregisterbestanden (`~/.openclaw/sandbox/containers.json` of `~/.openclaw/sandbox/browsers.json`) aanwezig zijn, meldt doctor ze; `openclaw doctor --fix` migreert geldige vermeldingen naar geshardede registermappen en plaatst ongeldige verouderde bestanden in quarantaine.
- Als `gateway.auth.token`/`gateway.auth.password` door SecretRef worden beheerd en niet beschikbaar zijn in het huidige opdrachtpad, meldt doctor een alleen-lezenwaarschuwing en schrijft het geen platte-tekst fallback-credentials.
- Als SecretRef-inspectie voor kanalen mislukt in een fix-pad, gaat doctor door en meldt het een waarschuwing in plaats van vroegtijdig af te sluiten.
- Na migraties van de statusmap waarschuwt doctor wanneer ingeschakelde standaardaccounts voor Telegram of Discord afhankelijk zijn van env-fallback en `TELEGRAM_BOT_TOKEN` of `DISCORD_BOT_TOKEN` niet beschikbaar is voor het doctor-proces.
- Automatische resolutie van Telegram `allowFrom`-gebruikersnamen (`doctor --fix`) vereist een oplosbaar Telegram-token in het huidige opdrachtpad. Als tokeninspectie niet beschikbaar is, meldt doctor een waarschuwing en slaat het automatische resolutie voor die uitvoering over.

## macOS: `launchctl` env-overrides

Als je eerder `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (of `...PASSWORD`) hebt uitgevoerd, overschrijft die waarde je configuratiebestand en kan dit aanhoudende fouten met "ongeautoriseerd" veroorzaken.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway doctor](/nl/gateway/doctor)
