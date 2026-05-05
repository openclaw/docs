---
read_when:
    - Je hebt verbindings- of authenticatieproblemen en wilt begeleide oplossingen
    - Je hebt bijgewerkt en wilt een snelle controle
summary: CLI-referentie voor `openclaw doctor` (gezondheidscontroles + begeleide reparaties)
title: Dokter
x-i18n:
    generated_at: "2026-05-05T08:25:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6101008d1cb7e08f9902a8a29785710f325966524b003b87b5c628fe906ab78
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

- `--no-workspace-suggestions`: schakel suggesties voor werkruimtegeheugen/zoekacties uit
- `--yes`: accepteer standaardwaarden zonder prompt
- `--repair`: pas aanbevolen reparaties buiten services toe zonder prompt; installaties en herschrijvingen van de Gateway-service vereisen nog steeds interactieve bevestiging of expliciete Gateway-opdrachten
- `--fix`: alias voor `--repair`
- `--force`: pas ingrijpende reparaties toe, inclusief het overschrijven van aangepaste serviceconfiguratie wanneer nodig
- `--non-interactive`: voer uit zonder prompts; alleen veilige migraties en reparaties buiten services
- `--generate-gateway-token`: genereer en configureer een Gateway-token
- `--deep`: scan systeemservices op extra Gateway-installaties en rapporteer recente overdrachten van Gateway-supervisorherstarts

Opmerkingen:

- Interactieve prompts (zoals oplossingen voor keychain/OAuth) worden alleen uitgevoerd wanneer stdin een TTY is en `--non-interactive` **niet** is ingesteld. Headless uitvoeringen (cron, Telegram, geen terminal) slaan prompts over.
- Prestaties: niet-interactieve `doctor`-uitvoeringen slaan gretig laden van plugins over zodat headless gezondheidscontroles snel blijven. Interactieve sessies laden plugins nog steeds volledig wanneer een controle hun bijdrage nodig heeft.
- `--fix` (alias voor `--repair`) schrijft een back-up naar `~/.openclaw/openclaw.json.bak` en verwijdert onbekende configuratiesleutels, met een lijst van elke verwijdering.
- `doctor --fix --non-interactive` rapporteert ontbrekende of verouderde definities van Gateway-services, maar installeert of herschrijft ze niet buiten de update-reparatiemodus. Voer `openclaw gateway install` uit voor een ontbrekende service, of `openclaw gateway install --force` wanneer je de launcher bewust wilt vervangen.
- Controles op statusintegriteit detecteren nu verweesde transcriptbestanden in de sessiemap. Ze archiveren als `.deleted.<timestamp>` vereist interactieve bevestiging; `--fix`, `--yes` en headless uitvoeringen laten ze staan.
- Doctor scant ook `~/.openclaw/cron/jobs.json` (of `cron.store`) op verouderde cron-taakvormen en kan ze ter plaatse herschrijven voordat de scheduler ze tijdens runtime automatisch moet normaliseren.
- Op Linux waarschuwt doctor wanneer de crontab van de gebruiker nog steeds verouderde `~/.openclaw/bin/ensure-whatsapp.sh` uitvoert; dat script wordt niet meer onderhouden en kan onterechte WhatsApp Gateway-storingen loggen wanneer cron de systemd user-bus-omgeving mist.
- Wanneer WhatsApp is ingeschakeld, controleert doctor op een verslechterde Gateway-eventloop terwijl lokale `openclaw-tui`-clients nog draaien. `doctor --fix` stopt alleen geverifieerde lokale TUI-clients zodat WhatsApp-antwoorden niet achter verouderde TUI-verversingsloops in de wachtrij blijven staan.
- Doctor ruimt verouderde stagingstatus voor Plugin-afhankelijkheden op die door oudere OpenClaw-versies is gemaakt. Het repareert ook ontbrekende downloadbare plugins waarnaar wordt verwezen door configuratie, zoals `plugins.entries`, geconfigureerde kanalen, geconfigureerde provider-/zoekinstellingen of geconfigureerde agent-runtimes. Tijdens pakketupdates slaat doctor Plugin-reparatie via de pakketbeheerder over totdat de pakketwissel is voltooid; voer daarna opnieuw `openclaw doctor --fix` uit als een geconfigureerde Plugin nog herstel nodig heeft. Als de download mislukt, rapporteert doctor de installatiefout en behoudt het de geconfigureerde Plugin-vermelding voor de volgende reparatiepoging.
- Doctor repareert verouderde Plugin-configuratie door ontbrekende Plugin-id's te verwijderen uit `plugins.allow`/`plugins.entries`, plus overeenkomende loshangende kanaalconfiguratie, heartbeat-doelen en overrides voor kanaalmodellen wanneer Plugin-detectie gezond is.
- Doctor plaatst ongeldige Plugin-configuratie in quarantaine door de betreffende `plugins.entries.<id>`-vermelding uit te schakelen en de ongeldige `config`-payload te verwijderen. Het opstarten van de Gateway slaat al alleen die ongeldige Plugin over, zodat andere plugins en kanalen kunnen blijven draaien.
- Stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een andere supervisor de Gateway-levenscyclus beheert. Doctor rapporteert nog steeds de gezondheid van Gateway/services en past reparaties buiten services toe, maar slaat service-installatie/start/herstart/bootstrap en opschoning van verouderde services over.
- Op Linux negeert doctor inactieve extra systemd-units die op een Gateway lijken en herschrijft het tijdens reparatie geen metadata voor opdracht/entrypoint van een draaiende systemd Gateway-service. Stop eerst de service of gebruik `openclaw gateway install --force` wanneer je de actieve launcher bewust wilt vervangen.
- Doctor migreert automatisch verouderde platte Talk-configuratie (`talk.voiceId`, `talk.modelId` en vergelijkbare sleutels) naar `talk.provider` + `talk.providers.<provider>`.
- Herhaalde `doctor --fix`-uitvoeringen rapporteren/passen Talk-normalisatie niet meer toe wanneer het enige verschil de volgorde van objectsleutels is.
- Doctor bevat een gereedheidscontrole voor geheugenzoekacties en kan `openclaw configure --section model` aanbevelen wanneer embedding-referenties ontbreken.
- Doctor waarschuwt wanneer er geen eigenaar voor opdrachten is geconfigureerd. De opdrachteigenaar is het menselijke operatoraccount dat eigenaar-only opdrachten mag uitvoeren en gevaarlijke acties mag goedkeuren. DM-koppeling laat iemand alleen met de bot praten; als je een afzender hebt goedgekeurd voordat de bootstrap voor de eerste eigenaar bestond, stel `commands.ownerAllowFrom` dan expliciet in.
- Doctor waarschuwt wanneer Codex-modusagents zijn geconfigureerd en persoonlijke Codex CLI-assets bestaan in de Codex-home van de operator. Lokale lanceringen van Codex-appservers gebruiken geïsoleerde homes per agent, dus gebruik `openclaw migrate codex --dry-run` om assets te inventariseren die bewust moeten worden gepromoveerd.
- Doctor waarschuwt wanneer Skills die zijn toegestaan voor de standaardagent niet beschikbaar zijn in de huidige runtimeomgeving omdat bins, omgevingsvariabelen, configuratie of OS-vereisten ontbreken. `doctor --fix` kan die onbeschikbare Skills uitschakelen met `skills.entries.<skill>.enabled=false`; installeer/configureer in plaats daarvan de ontbrekende vereiste wanneer je de Skill actief wilt houden.
- Als sandboxmodus is ingeschakeld maar Docker niet beschikbaar is, rapporteert doctor een duidelijke waarschuwing met herstelactie (`install Docker` of `openclaw config set agents.defaults.sandbox.mode off`).
- Als verouderde sandboxregisterbestanden (`~/.openclaw/sandbox/containers.json` of `~/.openclaw/sandbox/browsers.json`) aanwezig zijn, rapporteert doctor ze; `openclaw doctor --fix` migreert geldige vermeldingen naar gesharde registermappen en plaatst ongeldige verouderde bestanden in quarantaine.
- Als `gateway.auth.token`/`gateway.auth.password` door SecretRef worden beheerd en niet beschikbaar zijn in het huidige opdrachtpad, rapporteert doctor een alleen-lezen waarschuwing en schrijft het geen platte-tekst fallback-referenties.
- Als inspectie van kanaal-SecretRef mislukt in een fixpad, gaat doctor door en rapporteert het een waarschuwing in plaats van vroegtijdig af te sluiten.
- Na migraties van statusmappen waarschuwt doctor wanneer ingeschakelde standaard Telegram- of Discord-accounts afhankelijk zijn van env-fallback en `TELEGRAM_BOT_TOKEN` of `DISCORD_BOT_TOKEN` niet beschikbaar is voor het doctor-proces.
- Automatische resolutie van Telegram `allowFrom`-gebruikersnamen (`doctor --fix`) vereist een oplosbaar Telegram-token in het huidige opdrachtpad. Als tokeninspectie niet beschikbaar is, rapporteert doctor een waarschuwing en slaat het automatische resolutie voor die doorgang over.

## macOS: `launchctl` env-overrides

Als je eerder `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (of `...PASSWORD`) hebt uitgevoerd, overschrijft die waarde je configuratiebestand en kan dit hardnekkige fouten met “unauthorized” veroorzaken.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway doctor](/nl/gateway/doctor)
