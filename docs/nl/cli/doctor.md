---
read_when:
    - Je hebt verbindings-/authenticatieproblemen en wilt begeleide oplossingen
    - Je hebt bijgewerkt en wilt een snelle controle
summary: CLI-referentie voor `openclaw doctor` (gezondheidscontroles + begeleide reparaties)
title: Dokter
x-i18n:
    generated_at: "2026-05-12T08:45:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90050276597a50abcc3638e7b7b50f29ef0682f5da30d33d5dca3ad6117173e0
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

Gebruik voor kanaalspecifieke machtigingen de kanaalprobes in plaats van `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

De gerichte Discord-mogelijkhedenprobe rapporteert de effectieve kanaalmachtigingen van de bot; de statusprobe controleert geconfigureerde Discord-kanalen en doelen voor automatisch deelnemen aan spraakkanalen.

## Opties

- `--no-workspace-suggestions`: schakel suggesties voor werkruimtegeheugen/zoeken uit
- `--yes`: accepteer standaardwaarden zonder prompt
- `--repair`: pas aanbevolen niet-serviceherstelacties toe zonder prompt; Gateway-service-installaties en herschrijvingen vereisen nog steeds interactieve bevestiging of expliciete Gateway-commando's
- `--fix`: alias voor `--repair`
- `--force`: pas agressieve herstelacties toe, inclusief het overschrijven van aangepaste serviceconfiguratie wanneer nodig
- `--non-interactive`: voer uit zonder prompts; alleen veilige migraties en niet-serviceherstelacties
- `--generate-gateway-token`: genereer en configureer een Gateway-token
- `--deep`: scan systeemservices op extra Gateway-installaties en rapporteer recente overdrachten van Gateway-supervisorherstarts

Opmerkingen:

- In Nix-modus (`OPENCLAW_NIX_MODE=1`) werken read-only doctor-controles nog steeds, maar `doctor --fix`, `doctor --repair`, `doctor --yes` en `doctor --generate-gateway-token` zijn uitgeschakeld omdat `openclaw.json` onveranderlijk is. Bewerk in plaats daarvan de Nix-bron voor deze installatie; gebruik voor nix-openclaw de agent-first [Snelstart](https://github.com/openclaw/nix-openclaw#quick-start).
- Interactieve prompts (zoals oplossingen voor keychain/OAuth) worden alleen uitgevoerd wanneer stdin een TTY is en `--non-interactive` **niet** is ingesteld. Headless-runs (cron, Telegram, geen terminal) slaan prompts over.
- Prestaties: niet-interactieve `doctor`-runs slaan eager plugin-laden over zodat headless gezondheidscontroles snel blijven. Interactieve sessies laden plugins nog steeds volledig wanneer een controle hun bijdrage nodig heeft.
- `--fix` (alias voor `--repair`) schrijft een back-up naar `~/.openclaw/openclaw.json.bak` en verwijdert onbekende configuratiesleutels, waarbij elke verwijdering wordt vermeld.
- `doctor --fix --non-interactive` rapporteert ontbrekende of verouderde Gateway-servicedefinities, maar installeert of herschrijft ze niet buiten updateherstelmodus. Voer `openclaw gateway install` uit voor een ontbrekende service, of `openclaw gateway install --force` wanneer je de launcher bewust wilt vervangen.
- Controles op toestandintegriteit detecteren nu verweesde transcriptbestanden in de sessiemap. Ze archiveren als `.deleted.<timestamp>` vereist interactieve bevestiging; `--fix`, `--yes` en headless-runs laten ze staan.
- Doctor scant ook `~/.openclaw/cron/jobs.json` (of `cron.store`) op legacy cron-taakvormen en kan ze ter plaatse herschrijven voordat de planner ze tijdens runtime automatisch moet normaliseren.
- Op Linux waarschuwt doctor wanneer de crontab van de gebruiker nog steeds legacy `~/.openclaw/bin/ensure-whatsapp.sh` uitvoert; dat script wordt niet meer onderhouden en kan valse WhatsApp Gateway-storingen loggen wanneer cron de systemd user-bus-omgeving mist.
- Wanneer WhatsApp is ingeschakeld, controleert doctor op een gedegradeerde Gateway-eventloop met lokale `openclaw-tui`-clients die nog draaien. `doctor --fix` stopt alleen geverifieerde lokale TUI-clients zodat WhatsApp-antwoorden niet achter verouderde TUI-verversingsloops in de wachtrij komen te staan.
- Doctor herschrijft legacy `openai-codex/*`-modelrefs naar canonieke `openai/*`-refs voor primaire modellen, fallbacks, heartbeat/subagent/compaction-overrides, hooks, kanaalmodeloverrides en verouderde sessieroutepinnen. `--fix` verplaatst Codex-intentie naar provider/model-gescopete `agentRuntime.id: "codex"`-items, behoudt sessie-auth-profielpinnen zoals `openai-codex:...`, verwijdert verouderde whole-agent/session-runtimepinnen en houdt herstelde OpenAI-agentrefs op Codex-auth-routering in plaats van directe OpenAI-API-sleutelauthenticatie.
- Doctor ruimt legacy plugin-afhankelijkheidsstagingstatus op die door oudere OpenClaw-versies is gemaakt en koppelt het hostpakket `openclaw` opnieuw voor beheerde npm-plugins die dit als peer-afhankelijkheid declareren. Het herstelt ook ontbrekende downloadbare plugins waarnaar door configuratie wordt verwezen, zoals `plugins.entries`, geconfigureerde kanalen, geconfigureerde provider-/zoekinstellingen of geconfigureerde agentruntimes. Tijdens pakketupdates slaat doctor pakketmanager-pluginherstel over totdat de pakketwissel voltooid is; voer daarna opnieuw `openclaw doctor --fix` uit als een geconfigureerde plugin nog herstel nodig heeft. Als de download mislukt, rapporteert doctor de installatiefout en behoudt het geconfigureerde plugin-item voor de volgende herstelpoging.
- Doctor herstelt verouderde pluginconfiguratie door ontbrekende plugin-id's te verwijderen uit `plugins.allow`/`plugins.deny`/`plugins.entries`, plus bijbehorende zwevende kanaalconfiguratie, heartbeattargets en kanaalmodeloverrides wanneer plugin-discovery gezond is.
- Doctor plaatst ongeldige pluginconfiguratie in quarantaine door het betreffende `plugins.entries.<id>`-item uit te schakelen en de ongeldige `config`-payload te verwijderen. Gateway-opstarten slaat al alleen die ongeldige plugin over, zodat andere plugins en kanalen kunnen blijven draaien.
- Stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een andere supervisor de Gateway-levenscyclus beheert. Doctor rapporteert nog steeds Gateway-/servicegezondheid en past niet-serviceherstelacties toe, maar slaat service-install/start/herstart/bootstrap en opschonen van legacy services over.
- Op Linux negeert doctor inactieve extra gateway-achtige systemd-units en herschrijft het geen commando-/entrypointmetadata voor een draaiende systemd Gateway-service tijdens herstel. Stop eerst de service of gebruik `openclaw gateway install --force` wanneer je de actieve launcher bewust wilt vervangen.
- Doctor migreert legacy platte Talk-configuratie (`talk.voiceId`, `talk.modelId` en verwante items) automatisch naar `talk.provider` + `talk.providers.<provider>`.
- Herhaalde `doctor --fix`-runs rapporteren/passen Talk-normalisatie niet meer toe wanneer het enige verschil de volgorde van objectsleutels is.
- Doctor bevat een gereedheidscontrole voor geheugenzoeken en kan `openclaw configure --section model` aanbevelen wanneer embedding-referenties ontbreken.
- Doctor waarschuwt wanneer er geen commando-eigenaar is geconfigureerd. De commando-eigenaar is het menselijke operatoraccount dat eigenaar-only commando's mag uitvoeren en gevaarlijke acties mag goedkeuren. DM-koppeling laat iemand alleen met de bot praten; als je een afzender hebt goedgekeurd voordat first-owner-bootstrap bestond, stel dan expliciet `commands.ownerAllowFrom` in.
- Doctor waarschuwt wanneer Codex-modus-agents zijn geconfigureerd en persoonlijke Codex CLI-assets bestaan in de Codex-home van de operator. Lokale Codex app-server-lanceringen gebruiken geïsoleerde homes per agent, dus gebruik `openclaw migrate codex --dry-run` om assets te inventariseren die bewust moeten worden gepromoot.
- Doctor verwijdert de uitgefaseerde `plugins.entries.codex.config.codexDynamicToolsProfile`; de Codex app-server houdt Codex-native werkruimtetools altijd native.
- Doctor waarschuwt wanneer Skills die voor de standaardagent zijn toegestaan niet beschikbaar zijn in de huidige runtimeomgeving omdat bins, env-vars, configuratie of OS-vereisten ontbreken. `doctor --fix` kan die niet-beschikbare Skills uitschakelen met `skills.entries.<skill>.enabled=false`; installeer/configureer in plaats daarvan de ontbrekende vereiste wanneer je de Skill actief wilt houden.
- Als sandboxmodus is ingeschakeld maar Docker niet beschikbaar is, rapporteert doctor een waarschuwing met veel signaal en hersteladvies (`install Docker` of `openclaw config set agents.defaults.sandbox.mode off`).
- Als legacy sandboxregisterbestanden (`~/.openclaw/sandbox/containers.json` of `~/.openclaw/sandbox/browsers.json`) aanwezig zijn, rapporteert doctor ze; `openclaw doctor --fix` migreert geldige items naar gesharde registermappen en plaatst ongeldige legacy bestanden in quarantaine.
- Als `gateway.auth.token`/`gateway.auth.password` door SecretRef worden beheerd en niet beschikbaar zijn in het huidige commandopad, rapporteert doctor een read-only waarschuwing en schrijft het geen plaintext fallback-referenties.
- Als inspectie van kanaal-SecretRef mislukt in een fix-pad, gaat doctor door en rapporteert het een waarschuwing in plaats van vroegtijdig af te sluiten.
- Na migraties van toestandsmappen waarschuwt doctor wanneer ingeschakelde standaard Telegram- of Discord-accounts afhankelijk zijn van env-fallback en `TELEGRAM_BOT_TOKEN` of `DISCORD_BOT_TOKEN` niet beschikbaar is voor het doctor-proces.
- Automatische resolutie van Telegram `allowFrom`-gebruikersnamen (`doctor --fix`) vereist een oplosbaar Telegram-token in het huidige commandopad. Als tokeninspectie niet beschikbaar is, rapporteert doctor een waarschuwing en slaat het automatische resolutie voor die pass over.

## macOS: `launchctl` env-overrides

Als je eerder `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (of `...PASSWORD`) hebt uitgevoerd, overschrijft die waarde je configuratiebestand en kan dit aanhoudende fouten met "unauthorized" veroorzaken.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway doctor](/nl/gateway/doctor)
