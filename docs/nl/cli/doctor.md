---
read_when:
    - Je hebt verbindings-/authenticatieproblemen en wilt begeleide oplossingen
    - Je hebt bijgewerkt en wilt een snelle controle
summary: CLI-referentie voor `openclaw doctor` (statuscontroles + begeleide reparaties)
title: Diagnose
x-i18n:
    generated_at: "2026-05-06T17:53:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: eed73ecbec848ae3071448f2444735e2564680fee94cf1e22a73d1e7beaede80
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

- `--no-workspace-suggestions`: schakel suggesties voor werkruimtegeheugen/zoekacties uit
- `--yes`: accepteer standaardwaarden zonder prompt
- `--repair`: pas aanbevolen niet-service-reparaties toe zonder prompt; Gateway-service-installaties en herschrijvingen vereisen nog steeds interactieve bevestiging of expliciete Gateway-opdrachten
- `--fix`: alias voor `--repair`
- `--force`: pas agressieve reparaties toe, inclusief het overschrijven van aangepaste serviceconfiguratie wanneer nodig
- `--non-interactive`: voer uit zonder prompts; alleen veilige migraties en niet-service-reparaties
- `--generate-gateway-token`: genereer en configureer een Gateway-token
- `--deep`: scan systeemservices op extra Gateway-installaties en rapporteer recente overdrachten van herstarts door de Gateway-supervisor

Opmerkingen:

- In Nix-modus (`OPENCLAW_NIX_MODE=1`) blijven alleen-lezen doctor-controles werken, maar `doctor --fix`, `doctor --repair`, `doctor --yes` en `doctor --generate-gateway-token` zijn uitgeschakeld omdat `openclaw.json` onveranderlijk is. Bewerk in plaats daarvan de Nix-bron voor deze installatie; gebruik voor nix-openclaw de agent-first [Snelstart](https://github.com/openclaw/nix-openclaw#quick-start).
- Interactieve prompts (zoals keychain-/OAuth-reparaties) worden alleen uitgevoerd wanneer stdin een TTY is en `--non-interactive` **niet** is ingesteld. Headless uitvoeringen (cron, Telegram, geen terminal) slaan prompts over.
- Prestaties: niet-interactieve `doctor`-uitvoeringen slaan eager laden van plugins over zodat headless gezondheidscontroles snel blijven. Interactieve sessies laden plugins nog steeds volledig wanneer een controle hun bijdrage nodig heeft.
- `--fix` (alias voor `--repair`) schrijft een back-up naar `~/.openclaw/openclaw.json.bak` en verwijdert onbekende configuratiesleutels, waarbij elke verwijdering wordt vermeld.
- `doctor --fix --non-interactive` rapporteert ontbrekende of verouderde Gateway-servicedefinities, maar installeert of herschrijft ze niet buiten de update-reparatiemodus. Voer `openclaw gateway install` uit voor een ontbrekende service, of `openclaw gateway install --force` wanneer je de launcher bewust wilt vervangen.
- Controles op statusintegriteit detecteren nu verweesde transcriptbestanden in de sessiemap. Ze archiveren als `.deleted.<timestamp>` vereist interactieve bevestiging; `--fix`, `--yes` en headless uitvoeringen laten ze staan.
- Doctor scant ook `~/.openclaw/cron/jobs.json` (of `cron.store`) op legacy vormen van cron-taken en kan ze ter plekke herschrijven voordat de scheduler ze tijdens runtime automatisch moet normaliseren.
- Op Linux waarschuwt doctor wanneer de crontab van de gebruiker nog steeds legacy `~/.openclaw/bin/ensure-whatsapp.sh` uitvoert; dat script wordt niet langer onderhouden en kan onterechte WhatsApp Gateway-storingen loggen wanneer cron de systemd user-bus-omgeving mist.
- Wanneer WhatsApp is ingeschakeld, controleert doctor op een verslechterde Gateway-eventloop terwijl lokale `openclaw-tui`-clients nog actief zijn. `doctor --fix` stopt alleen geverifieerde lokale TUI-clients zodat WhatsApp-antwoorden niet achter verouderde TUI-verversingsloops in de wachtrij blijven staan.
- Doctor herschrijft legacy `openai-codex/*`-modelrefs naar canonieke `openai/*`-refs in primaire modellen, fallbacks, heartbeat-/subagent-/compaction-overrides, hooks, kanaalmodel-overrides en verouderde sessieroute-pins. `--fix` selecteert `agentRuntime.id: "codex"` alleen wanneer de Codex-plugin is geïnstalleerd, ingeschakeld, de `codex`-harness bijdraagt en bruikbare OAuth heeft; anders selecteert het `agentRuntime.id: "pi"` zodat de route op de standaard OpenClaw-runner blijft.
- Doctor ruimt legacy stagingstatus voor plugin-afhankelijkheden op die door oudere OpenClaw-versies is aangemaakt. Het repareert ook ontbrekende downloadbare plugins waarnaar door configuratie wordt verwezen, zoals `plugins.entries`, geconfigureerde kanalen, geconfigureerde provider-/zoekinstellingen of geconfigureerde agentruntimes. Tijdens pakketupdates slaat doctor pakketbeheerder-pluginreparatie over totdat de pakketwissel is voltooid; voer daarna opnieuw `openclaw doctor --fix` uit als een geconfigureerde plugin nog herstel nodig heeft. Als de download mislukt, rapporteert doctor de installatiefout en behoudt het de geconfigureerde plugin-vermelding voor de volgende reparatiepoging.
- Doctor repareert verouderde plugin-configuratie door ontbrekende plugin-id's uit `plugins.allow`/`plugins.entries` te verwijderen, plus bijbehorende loshangende kanaalconfiguratie, Heartbeat-doelen en kanaalmodel-overrides wanneer plugin-detectie gezond is.
- Doctor plaatst ongeldige plugin-configuratie in quarantaine door de betreffende `plugins.entries.<id>`-vermelding uit te schakelen en de ongeldige `config`-payload te verwijderen. Het opstarten van de Gateway slaat al alleen die defecte plugin over, zodat andere plugins en kanalen kunnen blijven draaien.
- Stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een andere supervisor eigenaar is van de Gateway-levenscyclus. Doctor rapporteert nog steeds de gezondheid van Gateway/service en past niet-service-reparaties toe, maar slaat service-installatie/start/herstart/bootstrap en opschoning van legacy services over.
- Op Linux negeert doctor inactieve extra gateway-achtige systemd-units en herschrijft het tijdens reparatie geen opdracht-/entrypointmetadata voor een actieve systemd Gateway-service. Stop eerst de service of gebruik `openclaw gateway install --force` wanneer je de actieve launcher bewust wilt vervangen.
- Doctor migreert legacy platte Talk-configuratie (`talk.voiceId`, `talk.modelId` en verwante sleutels) automatisch naar `talk.provider` + `talk.providers.<provider>`.
- Herhaalde `doctor --fix`-uitvoeringen rapporteren/passen Talk-normalisatie niet meer toe wanneer het enige verschil de volgorde van objectsleutels is.
- Doctor bevat een gereedheidscontrole voor geheugenzoekacties en kan `openclaw configure --section model` aanbevelen wanneer embeddingreferenties ontbreken.
- Doctor waarschuwt wanneer er geen opdrachteigenaar is geconfigureerd. De opdrachteigenaar is het menselijke operatoraccount dat eigenaar-only opdrachten mag uitvoeren en gevaarlijke acties mag goedkeuren. DM-koppeling laat iemand alleen met de bot praten; als je een afzender hebt goedgekeurd voordat de eerste-eigenaar-bootstrap bestond, stel dan expliciet `commands.ownerAllowFrom` in.
- Doctor waarschuwt wanneer agents in Codex-modus zijn geconfigureerd en persoonlijke Codex CLI-assets aanwezig zijn in de Codex-home van de operator. Lokale lanceringen van de Codex-appserver gebruiken geïsoleerde homes per agent, dus gebruik `openclaw migrate codex --dry-run` om assets te inventariseren die bewust moeten worden gepromoveerd.
- Doctor waarschuwt wanneer Skills die voor de standaardagent zijn toegestaan, niet beschikbaar zijn in de huidige runtimeomgeving omdat bins, env vars, configuratie of OS-vereisten ontbreken. `doctor --fix` kan die niet-beschikbare Skills uitschakelen met `skills.entries.<skill>.enabled=false`; installeer/configureer in plaats daarvan de ontbrekende vereiste wanneer je de skill actief wilt houden.
- Als sandboxmodus is ingeschakeld maar Docker niet beschikbaar is, rapporteert doctor een duidelijke waarschuwing met hersteladvies (`install Docker` of `openclaw config set agents.defaults.sandbox.mode off`).
- Als legacy sandboxregisterbestanden (`~/.openclaw/sandbox/containers.json` of `~/.openclaw/sandbox/browsers.json`) aanwezig zijn, rapporteert doctor ze; `openclaw doctor --fix` migreert geldige vermeldingen naar shard-registermappen en plaatst ongeldige legacy bestanden in quarantaine.
- Als `gateway.auth.token`/`gateway.auth.password` door SecretRef worden beheerd en niet beschikbaar zijn in het huidige opdrachtpad, rapporteert doctor een alleen-lezen waarschuwing en schrijft het geen plaintext fallback-referenties.
- Als inspectie van kanaal-SecretRef mislukt in een reparatiepad, gaat doctor door en rapporteert het een waarschuwing in plaats van vroegtijdig af te sluiten.
- Na migraties van statusmappen waarschuwt doctor wanneer ingeschakelde standaard Telegram- of Discord-accounts afhankelijk zijn van env fallback en `TELEGRAM_BOT_TOKEN` of `DISCORD_BOT_TOKEN` niet beschikbaar is voor het doctor-proces.
- Automatische resolutie van Telegram `allowFrom`-gebruikersnamen (`doctor --fix`) vereist een oplosbaar Telegram-token in het huidige opdrachtpad. Als tokeninspectie niet beschikbaar is, rapporteert doctor een waarschuwing en slaat het automatische resolutie voor die run over.

## macOS: `launchctl` env-overrides

Als je eerder `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (of `...PASSWORD`) hebt uitgevoerd, overschrijft die waarde je configuratiebestand en kan dit hardnekkige fouten met "unauthorized" veroorzaken.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway doctor](/nl/gateway/doctor)
