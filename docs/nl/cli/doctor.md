---
read_when:
    - Je hebt verbindings- of authenticatieproblemen en wilt begeleide oplossingen
    - Je hebt iets bijgewerkt en wilt een snelle controle
summary: CLI-referentie voor `openclaw doctor` (gezondheidscontroles + begeleide reparaties)
title: Diagnose
x-i18n:
    generated_at: "2026-05-11T20:26:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f2dd99f339e4fcdeeae840b75098f3c251b3aa133b7ea11b040b3c7f32c200
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

Gebruik voor kanaalspecifieke machtigingen de kanaalprobes in plaats van `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

De gerichte Discord-mogelijkhedenprobe rapporteert de effectieve kanaalmachtigingen van de bot; de statusprobe controleert geconfigureerde Discord-kanalen en doelen voor automatisch deelnemen aan spraak.

## Opties

- `--no-workspace-suggestions`: schakel suggesties voor werkruimtegeheugen/zoeken uit
- `--yes`: accepteer standaardwaarden zonder prompt
- `--repair`: pas aanbevolen niet-service-reparaties toe zonder prompt; installaties en herschrijvingen van de Gateway-service vereisen nog steeds interactieve bevestiging of expliciete Gateway-opdrachten
- `--fix`: alias voor `--repair`
- `--force`: pas agressieve reparaties toe, inclusief het overschrijven van aangepaste serviceconfiguratie wanneer nodig
- `--non-interactive`: voer uit zonder prompts; alleen veilige migraties en niet-service-reparaties
- `--generate-gateway-token`: genereer en configureer een Gateway-token
- `--deep`: scan systeemservices op extra Gateway-installaties en rapporteer recente overdrachten van herstarts door de Gateway-supervisor

Opmerkingen:

- In Nix-modus (`OPENCLAW_NIX_MODE=1`) blijven alleen-lezen doctor-controles werken, maar `doctor --fix`, `doctor --repair`, `doctor --yes` en `doctor --generate-gateway-token` zijn uitgeschakeld omdat `openclaw.json` onveranderlijk is. Bewerk in plaats daarvan de Nix-bron voor deze installatie; gebruik voor nix-openclaw de agent-eerst-[Snelstart](https://github.com/openclaw/nix-openclaw#quick-start).
- Interactieve prompts (zoals keychain-/OAuth-reparaties) worden alleen uitgevoerd wanneer stdin een TTY is en `--non-interactive` **niet** is ingesteld. Headless runs (cron, Telegram, geen terminal) slaan prompts over.
- Prestaties: niet-interactieve `doctor`-runs slaan eager plugin-loading over zodat headless gezondheidscontroles snel blijven. Interactieve sessies laden plugins nog steeds volledig wanneer een controle hun bijdrage nodig heeft.
- `--fix` (alias voor `--repair`) schrijft een back-up naar `~/.openclaw/openclaw.json.bak` en verwijdert onbekende configuratiesleutels, waarbij elke verwijdering wordt vermeld.
- `doctor --fix --non-interactive` rapporteert ontbrekende of verouderde Gateway-servicedefinities, maar installeert of herschrijft ze niet buiten de update-reparatiemodus. Voer `openclaw gateway install` uit voor een ontbrekende service, of `openclaw gateway install --force` wanneer je de launcher bewust wilt vervangen.
- Integriteitscontroles voor status detecteren nu verweesde transcriptbestanden in de sessiemap. Ze archiveren als `.deleted.<timestamp>` vereist interactieve bevestiging; `--fix`, `--yes` en headless runs laten ze staan.
- Doctor scant ook `~/.openclaw/cron/jobs.json` (of `cron.store`) op legacy cron-taakvormen en kan ze ter plekke herschrijven voordat de planner ze tijdens runtime automatisch moet normaliseren.
- Op Linux waarschuwt doctor wanneer de crontab van de gebruiker nog steeds legacy `~/.openclaw/bin/ensure-whatsapp.sh` uitvoert; dat script wordt niet langer onderhouden en kan foutieve WhatsApp-Gateway-storingen loggen wanneer cron de systemd user-bus-omgeving mist.
- Wanneer WhatsApp is ingeschakeld, controleert doctor op een verslechterde Gateway-eventloop met lokale `openclaw-tui`-clients die nog actief zijn. `doctor --fix` stopt alleen geverifieerde lokale TUI-clients zodat WhatsApp-antwoorden niet achter verouderde TUI-verversingslussen in de wachtrij blijven staan.
- Doctor herschrijft legacy `openai-codex/*`-modelreferenties naar canonieke `openai/*`-referenties voor primaire modellen, fallbacks, Heartbeat-/subagent-/Compaction-overrides, hooks, kanaalmodel-overrides en verouderde route-pins voor sessies. `--fix` verplaatst Codex-intentie naar provider-/model-gescopete `agentRuntime.id: "codex"`-vermeldingen, behoudt auth-profiel-pins voor sessies zoals `openai-codex:...`, verwijdert verouderde runtime-pins voor volledige agents/sessies en houdt gerepareerde OpenAI-agentreferenties op Codex-auth-routering in plaats van directe OpenAI API-sleutel-authenticatie.
- Doctor schoont legacy stagingstatus voor plugin-afhankelijkheden op die door oudere OpenClaw-versies is aangemaakt. Het repareert ook ontbrekende downloadbare plugins waarnaar in de configuratie wordt verwezen, zoals `plugins.entries`, geconfigureerde kanalen, geconfigureerde provider-/zoekinstellingen of geconfigureerde agent-runtimes. Tijdens pakketupdates slaat doctor plugin-reparatie via de pakketmanager over totdat de pakketwissel is voltooid; voer daarna opnieuw `openclaw doctor --fix` uit als een geconfigureerde plugin nog herstel nodig heeft. Als de download mislukt, rapporteert doctor de installatiefout en behoudt het de geconfigureerde plugin-vermelding voor de volgende reparatiepoging.
- Doctor repareert verouderde plugin-configuratie door ontbrekende plugin-id's te verwijderen uit `plugins.allow`/`plugins.deny`/`plugins.entries`, plus bijpassende loshangende kanaalconfiguratie, Heartbeat-doelen en kanaalmodel-overrides wanneer plugin-detectie gezond is.
- Doctor plaatst ongeldige plugin-configuratie in quarantaine door de betreffende `plugins.entries.<id>`-vermelding uit te schakelen en de ongeldige `config`-payload te verwijderen. Gateway-startup slaat al alleen die slechte plugin over zodat andere plugins en kanalen kunnen blijven draaien.
- Stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een andere supervisor de Gateway-levenscyclus beheert. Doctor rapporteert nog steeds Gateway-/servicegezondheid en past niet-service-reparaties toe, maar slaat service-installatie/start/herstart/bootstrap en opschoning van legacy services over.
- Op Linux negeert doctor inactieve extra Gateway-achtige systemd-units en herschrijft het tijdens reparatie geen opdracht-/entrypointmetadata voor een actieve systemd Gateway-service. Stop eerst de service of gebruik `openclaw gateway install --force` wanneer je de actieve launcher bewust wilt vervangen.
- Doctor migreert legacy platte Talk-configuratie (`talk.voiceId`, `talk.modelId` en vergelijkbare waarden) automatisch naar `talk.provider` + `talk.providers.<provider>`.
- Herhaalde `doctor --fix`-runs rapporteren/passen Talk-normalisatie niet langer toe wanneer het enige verschil de volgorde van objectsleutels is.
- Doctor bevat een gereedheidscontrole voor geheugenzoekopdrachten en kan `openclaw configure --section model` aanbevelen wanneer embeddingreferenties ontbreken.
- Doctor waarschuwt wanneer er geen opdrachteigenaar is geconfigureerd. De opdrachteigenaar is het account van de menselijke operator dat owner-only opdrachten mag uitvoeren en gevaarlijke acties mag goedkeuren. DM-koppeling laat iemand alleen met de bot praten; als je een afzender hebt goedgekeurd voordat first-owner-bootstrap bestond, stel dan expliciet `commands.ownerAllowFrom` in.
- Doctor waarschuwt wanneer agents in Codex-modus zijn geconfigureerd en persoonlijke Codex CLI-assets bestaan in de Codex-home van de operator. Lokale Codex app-server-starts gebruiken geïsoleerde homes per agent, dus gebruik `openclaw migrate codex --dry-run` om assets te inventariseren die bewust moeten worden gepromoveerd.
- Doctor verwijdert de gepensioneerde `plugins.entries.codex.config.codexDynamicToolsProfile`; de Codex app-server houdt Codex-native werkruimtetools altijd native.
- Doctor waarschuwt wanneer Skills die voor de standaardagent zijn toegestaan niet beschikbaar zijn in de huidige runtime-omgeving omdat bins, env-vars, config of OS-vereisten ontbreken. `doctor --fix` kan die niet-beschikbare skills uitschakelen met `skills.entries.<skill>.enabled=false`; installeer/configureer in plaats daarvan de ontbrekende vereiste wanneer je de skill actief wilt houden.
- Als sandboxmodus is ingeschakeld maar Docker niet beschikbaar is, rapporteert doctor een waarschuwing met hoge signaalwaarde en remedie (`install Docker` of `openclaw config set agents.defaults.sandbox.mode off`).
- Als legacy sandbox-registerbestanden (`~/.openclaw/sandbox/containers.json` of `~/.openclaw/sandbox/browsers.json`) aanwezig zijn, rapporteert doctor ze; `openclaw doctor --fix` migreert geldige vermeldingen naar gesharde registermappen en plaatst ongeldige legacy bestanden in quarantaine.
- Als `gateway.auth.token`/`gateway.auth.password` door SecretRef worden beheerd en niet beschikbaar zijn in het huidige opdrachtpad, rapporteert doctor een alleen-lezen waarschuwing en schrijft het geen plaintext fallbackreferenties.
- Als kanaal-SecretRef-inspectie faalt in een fix-pad, gaat doctor door en rapporteert het een waarschuwing in plaats van vroegtijdig af te sluiten.
- Na migraties van statusmappen waarschuwt doctor wanneer ingeschakelde standaard Telegram- of Discord-accounts afhankelijk zijn van env-fallback en `TELEGRAM_BOT_TOKEN` of `DISCORD_BOT_TOKEN` niet beschikbaar is voor het doctor-proces.
- Automatische resolutie van Telegram `allowFrom`-gebruikersnamen (`doctor --fix`) vereist een oplosbaar Telegram-token in het huidige opdrachtpad. Als tokeninspectie niet beschikbaar is, rapporteert doctor een waarschuwing en slaat het automatische resolutie voor die run over.

## macOS: `launchctl` env-overrides

Als je eerder `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (of `...PASSWORD`) hebt uitgevoerd, overschrijft die waarde je configuratiebestand en kan dit aanhoudende "unauthorized"-fouten veroorzaken.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway doctor](/nl/gateway/doctor)
