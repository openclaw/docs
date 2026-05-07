---
read_when:
    - Je hebt verbindings-/authenticatieproblemen en wilt begeleide oplossingen
    - Je hebt bijgewerkt en wilt een snelle controle
summary: CLI-referentie voor `openclaw doctor` (gezondheidscontroles + begeleide reparaties)
title: Diagnose
x-i18n:
    generated_at: "2026-05-07T13:14:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7683a974eb9406e5ca071612c96c7db05247a69e253ef4293c57e7707aa5fd4
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

De gerichte Discord-capabilities-probe rapporteert de effectieve kanaalmachtigingen van de bot; de statusprobe controleert geconfigureerde Discord-kanalen en doelen voor automatisch deelnemen aan spraakkanalen.

## Opties

- `--no-workspace-suggestions`: schakel suggesties voor werkruimtegeheugen/zoeken uit
- `--yes`: accepteer standaardwaarden zonder prompt
- `--repair`: pas aanbevolen reparaties zonder service-impact toe zonder prompt; Gateway-service-installaties en herschrijvingen vereisen nog steeds interactieve bevestiging of expliciete Gateway-commando's
- `--fix`: alias voor `--repair`
- `--force`: pas agressieve reparaties toe, inclusief het overschrijven van aangepaste serviceconfiguratie wanneer nodig
- `--non-interactive`: voer uit zonder prompts; alleen veilige migraties en reparaties zonder service-impact
- `--generate-gateway-token`: genereer en configureer een Gateway-token
- `--deep`: scan systeemservices op extra Gateway-installaties en rapporteer recente overdrachten van herstarts door de Gateway-supervisor

Opmerkingen:

- In Nix-modus (`OPENCLAW_NIX_MODE=1`) werken read-only doctor-controles nog steeds, maar `doctor --fix`, `doctor --repair`, `doctor --yes` en `doctor --generate-gateway-token` zijn uitgeschakeld omdat `openclaw.json` onveranderlijk is. Bewerk in plaats daarvan de Nix-bron voor deze installatie; gebruik voor nix-openclaw de agent-first [Snelstart](https://github.com/openclaw/nix-openclaw#quick-start).
- Interactieve prompts (zoals keychain-/OAuth-reparaties) worden alleen uitgevoerd wanneer stdin een TTY is en `--non-interactive` **niet** is ingesteld. Headless uitvoeringen (cron, Telegram, geen terminal) slaan prompts over.
- Prestaties: niet-interactieve `doctor`-uitvoeringen slaan eager plugin-laden over zodat headless gezondheidscontroles snel blijven. Interactieve sessies laden plugins nog steeds volledig wanneer een controle hun bijdrage nodig heeft.
- `--fix` (alias voor `--repair`) schrijft een back-up naar `~/.openclaw/openclaw.json.bak` en verwijdert onbekende configuratiesleutels, met een lijst van elke verwijdering.
- `doctor --fix --non-interactive` rapporteert ontbrekende of verouderde Gateway-service-definities, maar installeert of herschrijft ze niet buiten de reparatiemodus voor updates. Voer `openclaw gateway install` uit voor een ontbrekende service, of `openclaw gateway install --force` wanneer je de launcher bewust wilt vervangen.
- Integriteitscontroles van de status detecteren nu verweesde transcriptbestanden in de sessiemap. Ze archiveren als `.deleted.<timestamp>` vereist een interactieve bevestiging; `--fix`, `--yes` en headless uitvoeringen laten ze staan.
- Doctor scant ook `~/.openclaw/cron/jobs.json` (of `cron.store`) op verouderde cron-jobvormen en kan ze ter plekke herschrijven voordat de scheduler ze tijdens runtime automatisch moet normaliseren.
- Op Linux waarschuwt doctor wanneer de crontab van de gebruiker nog steeds het verouderde `~/.openclaw/bin/ensure-whatsapp.sh` uitvoert; dat script wordt niet langer onderhouden en kan onterecht WhatsApp-Gateway-storingen loggen wanneer cron de systemd user-bus-omgeving mist.
- Wanneer WhatsApp is ingeschakeld, controleert doctor op een verslechterde Gateway-eventloop terwijl lokale `openclaw-tui`-clients nog actief zijn. `doctor --fix` stopt alleen geverifieerde lokale TUI-clients zodat WhatsApp-antwoorden niet achter verouderde TUI-verversingslussen in de wachtrij komen.
- Doctor herschrijft verouderde `openai-codex/*`-modelrefs naar canonieke `openai/*`-refs voor primaire modellen, fallbacks, heartbeat-/subagent-/compaction-overrides, hooks, kanaalmodel-overrides en verouderde sessieroute-pins. `--fix` selecteert `agentRuntime.id: "codex"` alleen wanneer de Codex-plugin is geïnstalleerd, ingeschakeld, de `codex`-harness bijdraagt en bruikbare OAuth heeft; anders selecteert het `agentRuntime.id: "pi"` zodat de route op de standaard OpenClaw-runner blijft.
- Doctor ruimt verouderde staging-status voor plugin-afhankelijkheden op die door oudere OpenClaw-versies is aangemaakt. Het repareert ook ontbrekende downloadbare plugins waarnaar in de configuratie wordt verwezen, zoals `plugins.entries`, geconfigureerde kanalen, geconfigureerde provider-/zoekinstellingen of geconfigureerde agent-runtimes. Tijdens pakketupdates slaat doctor plugin-reparatie via de pakketbeheerder over totdat de pakketwissel is voltooid; voer daarna opnieuw `openclaw doctor --fix` uit als een geconfigureerde plugin nog herstel nodig heeft. Als de download mislukt, rapporteert doctor de installatiefout en behoudt het de geconfigureerde plugin-vermelding voor de volgende reparatiepoging.
- Doctor repareert verouderde plugin-configuratie door ontbrekende plugin-id's uit `plugins.allow`/`plugins.entries` te verwijderen, plus bijbehorende loshangende kanaalconfiguratie, Heartbeat-doelen en kanaalmodel-overrides wanneer plugin-detectie gezond is.
- Doctor plaatst ongeldige plugin-configuratie in quarantaine door de betrokken `plugins.entries.<id>`-vermelding uit te schakelen en de ongeldige `config`-payload te verwijderen. Het opstarten van de Gateway slaat alleen die slechte plugin al over, zodat andere plugins en kanalen kunnen blijven draaien.
- Stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een andere supervisor de Gateway-levenscyclus beheert. Doctor rapporteert nog steeds Gateway-/servicegezondheid en past reparaties zonder service-impact toe, maar slaat service-installatie/start/herstart/bootstrap en opschoning van verouderde services over.
- Op Linux negeert doctor inactieve extra systemd-units die op de Gateway lijken en herschrijft het tijdens reparatie geen command-/entrypoint-metadata voor een actieve systemd-Gateway-service. Stop eerst de service of gebruik `openclaw gateway install --force` wanneer je de actieve launcher bewust wilt vervangen.
- Doctor migreert automatisch verouderde platte Talk-configuratie (`talk.voiceId`, `talk.modelId` en verwante instellingen) naar `talk.provider` + `talk.providers.<provider>`.
- Herhaalde `doctor --fix`-uitvoeringen rapporteren/passen Talk-normalisatie niet langer toe wanneer het enige verschil de volgorde van objectsleutels is.
- Doctor bevat een gereedheidscontrole voor geheugenzoekopdrachten en kan `openclaw configure --section model` aanbevelen wanneer embedding-referenties ontbreken.
- Doctor waarschuwt wanneer geen commando-eigenaar is geconfigureerd. De commando-eigenaar is het menselijke operatoraccount dat owner-only commando's mag uitvoeren en gevaarlijke acties mag goedkeuren. DM-koppeling laat iemand alleen met de bot praten; als je een afzender hebt goedgekeurd voordat bootstrap voor de eerste eigenaar bestond, stel `commands.ownerAllowFrom` dan expliciet in.
- Doctor waarschuwt wanneer agents in Codex-modus zijn geconfigureerd en persoonlijke Codex CLI-assets bestaan in de Codex-home van de operator. Lokale Codex app-server-starts gebruiken geïsoleerde homes per agent, dus gebruik `openclaw migrate codex --dry-run` om assets te inventariseren die bewust gepromoveerd moeten worden.
- Doctor waarschuwt wanneer skills die voor de standaardagent zijn toegestaan niet beschikbaar zijn in de huidige runtime-omgeving omdat bins, env vars, config of OS-vereisten ontbreken. `doctor --fix` kan die niet-beschikbare skills uitschakelen met `skills.entries.<skill>.enabled=false`; installeer/configureer in plaats daarvan de ontbrekende vereiste wanneer je de skill actief wilt houden.
- Als sandboxmodus is ingeschakeld maar Docker niet beschikbaar is, rapporteert doctor een waarschuwing met hoog signaal en hersteladvies (`install Docker` of `openclaw config set agents.defaults.sandbox.mode off`).
- Als verouderde sandbox-registerbestanden (`~/.openclaw/sandbox/containers.json` of `~/.openclaw/sandbox/browsers.json`) aanwezig zijn, rapporteert doctor ze; `openclaw doctor --fix` migreert geldige vermeldingen naar gesharde registermappen en plaatst ongeldige verouderde bestanden in quarantaine.
- Als `gateway.auth.token`/`gateway.auth.password` door SecretRef worden beheerd en niet beschikbaar zijn in het huidige commandopad, rapporteert doctor een read-only waarschuwing en schrijft het geen platte-tekst fallback-referenties.
- Als inspectie van kanaal-SecretRef in een fix-pad mislukt, gaat doctor door en rapporteert het een waarschuwing in plaats van vroegtijdig af te sluiten.
- Na migraties van de statusmap waarschuwt doctor wanneer ingeschakelde standaard Telegram- of Discord-accounts afhankelijk zijn van env-fallback en `TELEGRAM_BOT_TOKEN` of `DISCORD_BOT_TOKEN` niet beschikbaar is voor het doctor-proces.
- Automatische resolutie van Telegram `allowFrom`-gebruikersnamen (`doctor --fix`) vereist een oplosbaar Telegram-token in het huidige commandopad. Als tokeninspectie niet beschikbaar is, rapporteert doctor een waarschuwing en slaat het automatische resolutie voor die run over.

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
