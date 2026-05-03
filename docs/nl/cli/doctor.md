---
read_when:
    - Je hebt verbindings-/authenticatieproblemen en wilt begeleide oplossingen
    - Je hebt bijgewerkt en wilt een sanitycheck
summary: CLI-referentie voor `openclaw doctor` (gezondheidscontroles + begeleide herstelacties)
title: Diagnose
x-i18n:
    generated_at: "2026-05-03T21:28:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4baab5b0cd4d046d12ae5bd14ccf05224115856d45e630a57e77a2be15e5db0
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
- `--repair`: pas aanbevolen reparaties buiten services toe zonder prompt; installaties en herschrijvingen van Gateway-services vereisen nog steeds interactieve bevestiging of expliciete Gateway-opdrachten
- `--fix`: alias voor `--repair`
- `--force`: pas agressieve reparaties toe, inclusief het overschrijven van aangepaste serviceconfiguratie wanneer nodig
- `--non-interactive`: voer uit zonder prompts; alleen veilige migraties en reparaties buiten services
- `--generate-gateway-token`: genereer en configureer een Gateway-token
- `--deep`: scan systeemservices op extra Gateway-installaties

Opmerkingen:

- Interactieve prompts (zoals oplossingen voor keychain/OAuth) worden alleen uitgevoerd wanneer stdin een TTY is en `--non-interactive` **niet** is ingesteld. Headless-uitvoeringen (cron, Telegram, geen terminal) slaan prompts over.
- Prestaties: niet-interactieve `doctor`-uitvoeringen slaan eager Plugin-laden over, zodat headless gezondheidscontroles snel blijven. Interactieve sessies laden Plugins nog steeds volledig wanneer een controle hun bijdrage nodig heeft.
- `--fix` (alias voor `--repair`) schrijft een back-up naar `~/.openclaw/openclaw.json.bak` en verwijdert onbekende configuratiesleutels, waarbij elke verwijdering wordt vermeld.
- `doctor --fix --non-interactive` rapporteert ontbrekende of verouderde Gateway-servicedefinities, maar installeert of herschrijft ze niet buiten de updatereparatiemodus. Voer `openclaw gateway install` uit voor een ontbrekende service, of `openclaw gateway install --force` wanneer je de launcher bewust wilt vervangen.
- Controles op statusintegriteit detecteren nu verweesde transcriptbestanden in de sessiemap. Ze archiveren als `.deleted.<timestamp>` vereist interactieve bevestiging; `--fix`, `--yes` en headless-uitvoeringen laten ze staan.
- Doctor scant ook `~/.openclaw/cron/jobs.json` (of `cron.store`) op legacy cron-jobvormen en kan ze ter plekke herschrijven voordat de scheduler ze tijdens runtime automatisch moet normaliseren.
- Op Linux waarschuwt doctor wanneer de crontab van de gebruiker nog steeds de legacy `~/.openclaw/bin/ensure-whatsapp.sh` uitvoert; dat script wordt niet langer onderhouden en kan onterechte WhatsApp Gateway-storingen loggen wanneer cron de systemd user-bus-omgeving mist.
- Doctor schoont legacy stagingstatus voor Plugin-afhankelijkheden op die door oudere OpenClaw-versies is gemaakt. Het repareert ook ontbrekende geconfigureerde downloadbare Plugins wanneer het register ze kan oplossen, en de doctor-pass van 2026.5.2 installeert automatisch downloadbare Plugins die een oudere configuratie al gebruikt voordat de configuratie als aangeraakt voor die release wordt gemarkeerd.
- Doctor repareert verouderde Plugin-configuratie door ontbrekende Plugin-id's te verwijderen uit `plugins.allow`/`plugins.entries`, plus bijpassende loshangende kanaalconfiguratie, Heartbeat-doelen en kanaalmodeloverschrijvingen wanneer Plugin-detectie gezond is.
- Doctor plaatst ongeldige Plugin-configuratie in quarantaine door de betreffende `plugins.entries.<id>`-vermelding uit te schakelen en de ongeldige `config`-payload te verwijderen. Het opstarten van de Gateway slaat al alleen die slechte Plugin over, zodat andere Plugins en kanalen kunnen blijven draaien.
- Stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een andere supervisor de levenscyclus van de Gateway beheert. Doctor rapporteert nog steeds de gezondheid van Gateway/service en past reparaties buiten services toe, maar slaat service-installatie/start/herstart/bootstrap en legacy service-opruiming over.
- Op Linux negeert doctor inactieve extra Gateway-achtige systemd-units en herschrijft geen opdracht-/entrypointmetadata voor een draaiende systemd Gateway-service tijdens reparatie. Stop de service eerst of gebruik `openclaw gateway install --force` wanneer je de actieve launcher bewust wilt vervangen.
- Doctor migreert legacy platte Talk-configuratie (`talk.voiceId`, `talk.modelId` en verwanten) automatisch naar `talk.provider` + `talk.providers.<provider>`.
- Herhaalde `doctor --fix`-uitvoeringen rapporteren/passen Talk-normalisatie niet langer toe wanneer alleen de volgorde van objectsleutels verschilt.
- Doctor bevat een gereedheidscontrole voor geheugenzoeken en kan `openclaw configure --section model` aanbevelen wanneer embedding-inloggegevens ontbreken.
- Doctor waarschuwt wanneer er geen opdrachteigenaar is geconfigureerd. De opdrachteigenaar is het menselijke operatoraccount dat eigenaar-opdrachten mag uitvoeren en gevaarlijke acties mag goedkeuren. DM-koppeling laat iemand alleen met de bot praten; als je een afzender hebt goedgekeurd voordat first-owner bootstrap bestond, stel `commands.ownerAllowFrom` dan expliciet in.
- Doctor waarschuwt wanneer Codex-modusagents zijn geconfigureerd en persoonlijke Codex CLI-assets bestaan in de Codex-home van de operator. Lokale starts van de Codex app-server gebruiken geïsoleerde homes per agent, dus gebruik `openclaw migrate codex --dry-run` om assets te inventariseren die bewust moeten worden gepromoveerd.
- Doctor waarschuwt wanneer Skills die voor de standaardagent zijn toegestaan niet beschikbaar zijn in de huidige runtime-omgeving omdat bins, env vars, configuratie of OS-vereisten ontbreken. `doctor --fix` kan die niet-beschikbare Skills uitschakelen met `skills.entries.<skill>.enabled=false`; installeer/configureer in plaats daarvan de ontbrekende vereiste wanneer je de skill actief wilt houden.
- Als sandboxmodus is ingeschakeld maar Docker niet beschikbaar is, rapporteert doctor een duidelijke waarschuwing met oplossing (`install Docker` of `openclaw config set agents.defaults.sandbox.mode off`).
- Als legacy sandbox-registerbestanden (`~/.openclaw/sandbox/containers.json` of `~/.openclaw/sandbox/browsers.json`) aanwezig zijn, rapporteert doctor ze; `openclaw doctor --fix` migreert geldige vermeldingen naar gesharde registermappen en plaatst ongeldige legacy-bestanden in quarantaine.
- Als `gateway.auth.token`/`gateway.auth.password` door SecretRef worden beheerd en niet beschikbaar zijn in het huidige opdrachtpad, rapporteert doctor een alleen-lezen waarschuwing en schrijft geen plaintext fallback-inloggegevens.
- Als SecretRef-inspectie van kanalen faalt in een fixpad, gaat doctor door en rapporteert een waarschuwing in plaats van vroegtijdig af te sluiten.
- Na statusmapmigraties waarschuwt doctor wanneer ingeschakelde standaard Telegram- of Discord-accounts afhankelijk zijn van env-fallback en `TELEGRAM_BOT_TOKEN` of `DISCORD_BOT_TOKEN` niet beschikbaar is voor het doctor-proces.
- Automatische resolutie van Telegram `allowFrom`-gebruikersnamen (`doctor --fix`) vereist een oplosbaar Telegram-token in het huidige opdrachtpad. Als tokeninspectie niet beschikbaar is, rapporteert doctor een waarschuwing en slaat automatische resolutie voor die pass over.

## macOS: `launchctl` env-overschrijvingen

Als je eerder `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (of `...PASSWORD`) hebt uitgevoerd, overschrijft die waarde je configuratiebestand en kan dit aanhoudende “unauthorized”-fouten veroorzaken.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway doctor](/nl/gateway/doctor)
