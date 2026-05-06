---
read_when:
    - Je hebt connectiviteits-/authenticatieproblemen en wilt begeleide oplossingen
    - Je hebt bijgewerkt en wilt een plausibiliteitscontrole
summary: CLI-referentie voor `openclaw doctor` (gezondheidscontroles + begeleide herstelacties)
title: Diagnose
x-i18n:
    generated_at: "2026-05-06T09:05:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20eff2f94b41315dbe1d393ebbbf6dce352a7f9e589db3b8fb51f423dd6fed28
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
- `--yes`: accepteer standaardwaarden zonder prompt
- `--repair`: pas aanbevolen niet-serviceherstellingen toe zonder prompt; Gateway-service-installaties en herschrijvingen vereisen nog steeds interactieve bevestiging of expliciete Gateway-opdrachten
- `--fix`: alias voor `--repair`
- `--force`: pas ingrijpende herstellingen toe, inclusief het overschrijven van aangepaste serviceconfiguratie wanneer nodig
- `--non-interactive`: voer uit zonder prompts; alleen veilige migraties en niet-serviceherstellingen
- `--generate-gateway-token`: genereer en configureer een Gateway-token
- `--deep`: scan systeemservices op extra Gateway-installaties en rapporteer recente overdrachten van herstarts door de Gateway-supervisor

Opmerkingen:

- Interactieve prompts (zoals oplossingen voor sleutelhangertoegang/OAuth) worden alleen uitgevoerd wanneer stdin een TTY is en `--non-interactive` **niet** is ingesteld. Headless uitvoeringen (Cron, Telegram, geen terminal) slaan prompts over.
- Prestaties: niet-interactieve `doctor`-uitvoeringen slaan eager Plugin-laden over zodat headless gezondheidscontroles snel blijven. Interactieve sessies laden Plugins nog steeds volledig wanneer een controle hun bijdrage nodig heeft.
- `--fix` (alias voor `--repair`) schrijft een back-up naar `~/.openclaw/openclaw.json.bak` en verwijdert onbekende configuratiesleutels, waarbij elke verwijdering wordt vermeld.
- `doctor --fix --non-interactive` rapporteert ontbrekende of verouderde Gateway-servicedefinities, maar installeert of herschrijft ze niet buiten de herstelmodus voor updates. Voer `openclaw gateway install` uit voor een ontbrekende service, of `openclaw gateway install --force` wanneer je de launcher bewust wilt vervangen.
- Controles voor toestandsintegriteit detecteren nu verweesde transcriptbestanden in de sessiemap. Het archiveren ervan als `.deleted.<timestamp>` vereist interactieve bevestiging; `--fix`, `--yes` en headless uitvoeringen laten ze staan.
- Doctor scant ook `~/.openclaw/cron/jobs.json` (of `cron.store`) op verouderde Cron-taakvormen en kan ze ter plekke herschrijven voordat de planner ze tijdens runtime automatisch moet normaliseren.
- Op Linux waarschuwt doctor wanneer de crontab van de gebruiker nog steeds de verouderde `~/.openclaw/bin/ensure-whatsapp.sh` uitvoert; dat script wordt niet meer onderhouden en kan onterechte WhatsApp Gateway-uitval loggen wanneer Cron de systemd-gebruikersbusomgeving mist.
- Wanneer WhatsApp is ingeschakeld, controleert doctor op een verslechterde Gateway-eventloop terwijl lokale `openclaw-tui`-clients nog actief zijn. `doctor --fix` stopt alleen geverifieerde lokale TUI-clients, zodat WhatsApp-antwoorden niet achter verouderde TUI-verversingsloops in de wachtrij komen.
- Doctor herschrijft verouderde `openai-codex/*`-modelverwijzingen naar canonieke `openai/*`-verwijzingen in primaire modellen, fallbacks, Heartbeat/subagent/Compaction-overschrijvingen, hooks, kanaalmodeloverschrijvingen en verouderde routepinnen van sessies. `--fix` selecteert `agentRuntime.id: "codex"` alleen wanneer de Codex-Plugin is geinstalleerd, ingeschakeld, het `codex`-harnas bijdraagt en bruikbare OAuth heeft; anders selecteert het `agentRuntime.id: "pi"` zodat de route op de standaard OpenClaw-runner blijft.
- Doctor ruimt verouderde stagingstatus voor Plugin-afhankelijkheden op die door oudere OpenClaw-versies is aangemaakt. Het herstelt ook ontbrekende downloadbare Plugins waarnaar configuratie verwijst, zoals `plugins.entries`, geconfigureerde kanalen, geconfigureerde provider-/zoekinstellingen of geconfigureerde agentruntimes. Tijdens pakketupdates slaat doctor herstel van pakketbeheer-Plugins over totdat de pakketwisseling is voltooid; voer daarna opnieuw `openclaw doctor --fix` uit als een geconfigureerde Plugin nog herstel nodig heeft. Als de download mislukt, rapporteert doctor de installatiefout en behoudt de geconfigureerde Plugin-vermelding voor de volgende herstelpoging.
- Doctor herstelt verouderde Plugin-configuratie door ontbrekende Plugin-id's uit `plugins.allow`/`plugins.entries` te verwijderen, plus bijpassende loshangende kanaalconfiguratie, Heartbeat-doelen en kanaalmodeloverschrijvingen wanneer Plugin-detectie gezond is.
- Doctor plaatst ongeldige Plugin-configuratie in quarantaine door de betreffende `plugins.entries.<id>`-vermelding uit te schakelen en de ongeldige `config`-payload te verwijderen. Gateway-opstart slaat al alleen die slechte Plugin over, zodat andere Plugins en kanalen kunnen blijven draaien.
- Stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een andere supervisor de levenscyclus van de Gateway beheert. Doctor rapporteert nog steeds de gezondheid van Gateway/service en past niet-serviceherstellingen toe, maar slaat service-installatie/start/herstart/bootstrap en opschoning van verouderde services over.
- Op Linux negeert doctor inactieve extra Gateway-achtige systemd-units en herschrijft tijdens herstel geen opdracht-/entrypointmetadata voor een draaiende systemd Gateway-service. Stop eerst de service of gebruik `openclaw gateway install --force` wanneer je de actieve launcher bewust wilt vervangen.
- Doctor migreert automatisch verouderde platte Talk-configuratie (`talk.voiceId`, `talk.modelId` en verwanten) naar `talk.provider` + `talk.providers.<provider>`.
- Herhaalde `doctor --fix`-uitvoeringen rapporteren/passen Talk-normalisatie niet meer toe wanneer het enige verschil de volgorde van objectsleutels is.
- Doctor bevat een gereedheidscontrole voor geheugenzoeken en kan `openclaw configure --section model` aanbevelen wanneer inbeddingsreferenties ontbreken.
- Doctor waarschuwt wanneer er geen opdrachteigenaar is geconfigureerd. De opdrachteigenaar is het menselijke operatoraccount dat eigenaar-only opdrachten mag uitvoeren en gevaarlijke acties mag goedkeuren. DM-koppeling laat iemand alleen met de bot praten; als je een afzender hebt goedgekeurd voordat de bootstrap voor de eerste eigenaar bestond, stel dan expliciet `commands.ownerAllowFrom` in.
- Doctor waarschuwt wanneer agents in Codex-modus zijn geconfigureerd en persoonlijke Codex CLI-assets bestaan in de Codex-home van de operator. Lokale starts van Codex-appservers gebruiken geisoleerde homes per agent, dus gebruik `openclaw migrate codex --dry-run` om assets te inventariseren die bewust moeten worden gepromoveerd.
- Doctor waarschuwt wanneer Skills die voor de standaardagent zijn toegestaan niet beschikbaar zijn in de huidige runtimeomgeving omdat bins, omgevingsvariabelen, configuratie of OS-vereisten ontbreken. `doctor --fix` kan die niet-beschikbare Skills uitschakelen met `skills.entries.<skill>.enabled=false`; installeer/configureer in plaats daarvan de ontbrekende vereiste wanneer je de Skill actief wilt houden.
- Als sandboxmodus is ingeschakeld maar Docker niet beschikbaar is, rapporteert doctor een duidelijke waarschuwing met herstelactie (`install Docker` of `openclaw config set agents.defaults.sandbox.mode off`).
- Als verouderde sandboxregisterbestanden (`~/.openclaw/sandbox/containers.json` of `~/.openclaw/sandbox/browsers.json`) aanwezig zijn, rapporteert doctor ze; `openclaw doctor --fix` migreert geldige vermeldingen naar geshardede registermappen en plaatst ongeldige verouderde bestanden in quarantaine.
- Als `gateway.auth.token`/`gateway.auth.password` door SecretRef worden beheerd en niet beschikbaar zijn in het huidige opdrachtpad, rapporteert doctor een alleen-lezen waarschuwing en schrijft geen plaintext fallback-referenties.
- Als inspectie van channel-SecretRef mislukt in een fixpad, gaat doctor door en rapporteert een waarschuwing in plaats van vroegtijdig af te sluiten.
- Na migraties van toestandsmappen waarschuwt doctor wanneer ingeschakelde standaard Telegram- of Discord-accounts afhankelijk zijn van env-fallback en `TELEGRAM_BOT_TOKEN` of `DISCORD_BOT_TOKEN` niet beschikbaar is voor het doctor-proces.
- Automatische resolutie van Telegram `allowFrom`-gebruikersnamen (`doctor --fix`) vereist een oplosbaar Telegram-token in het huidige opdrachtpad. Als tokeninspectie niet beschikbaar is, rapporteert doctor een waarschuwing en slaat automatische resolutie voor die run over.

## macOS: `launchctl`-env-overschrijvingen

Als je eerder `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (of `...PASSWORD`) hebt uitgevoerd, overschrijft die waarde je configuratiebestand en kan dit blijvende fouten met “niet geautoriseerd” veroorzaken.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway doctor](/nl/gateway/doctor)
