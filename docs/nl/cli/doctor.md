---
read_when:
    - Je hebt verbindings-/authenticatieproblemen en wilt begeleide oplossingen
    - Je hebt bijgewerkt en wilt een snelle controle
summary: CLI-referentie voor `openclaw doctor` (statuscontroles + begeleide reparaties)
title: Dokter
x-i18n:
    generated_at: "2026-05-04T02:22:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd7fb09d373c313e4be45ad9e3b19ceb187a5787ef3e70fcd2b1f1f01b50c905
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

- `--no-workspace-suggestions`: geheugen-/zoeksuggesties voor de werkruimte uitschakelen
- `--yes`: standaardwaarden accepteren zonder prompt
- `--repair`: aanbevolen reparaties buiten services toepassen zonder prompt; Gateway-service-installaties en herschrijvingen vereisen nog steeds interactieve bevestiging of expliciete Gateway-opdrachten
- `--fix`: alias voor `--repair`
- `--force`: agressieve reparaties toepassen, inclusief het overschrijven van aangepaste serviceconfiguratie wanneer nodig
- `--non-interactive`: uitvoeren zonder prompts; alleen veilige migraties en reparaties buiten services
- `--generate-gateway-token`: een Gateway-token genereren en configureren
- `--deep`: systeemservices scannen op extra Gateway-installaties

Opmerkingen:

- Interactieve prompts (zoals fixes voor keychain/OAuth) worden alleen uitgevoerd wanneer stdin een TTY is en `--non-interactive` **niet** is ingesteld. Headless uitvoeringen (cron, Telegram, geen terminal) slaan prompts over.
- Prestaties: niet-interactieve `doctor`-uitvoeringen slaan gretig laden van Plugins over, zodat headless gezondheidscontroles snel blijven. Interactieve sessies laden Plugins nog steeds volledig wanneer een controle hun bijdrage nodig heeft.
- `--fix` (alias voor `--repair`) schrijft een back-up naar `~/.openclaw/openclaw.json.bak` en verwijdert onbekende configuratiesleutels, waarbij elke verwijdering wordt vermeld.
- `doctor --fix --non-interactive` rapporteert ontbrekende of verouderde Gateway-servicedefinities, maar installeert of herschrijft ze niet buiten de update-reparatiemodus. Voer `openclaw gateway install` uit voor een ontbrekende service, of `openclaw gateway install --force` wanneer je de launcher bewust wilt vervangen.
- Integriteitscontroles van de status detecteren nu verweesde transcriptbestanden in de sessiemap. Ze archiveren als `.deleted.<timestamp>` vereist een interactieve bevestiging; `--fix`, `--yes` en headless uitvoeringen laten ze staan.
- Doctor scant ook `~/.openclaw/cron/jobs.json` (of `cron.store`) op verouderde cronjob-vormen en kan ze ter plekke herschrijven voordat de scheduler ze tijdens runtime automatisch moet normaliseren.
- Op Linux waarschuwt doctor wanneer de crontab van de gebruiker nog steeds het verouderde `~/.openclaw/bin/ensure-whatsapp.sh` uitvoert; dat script wordt niet langer onderhouden en kan onterechte WhatsApp Gateway-storingen loggen wanneer cron de systemd user-bus-omgeving mist.
- Doctor ruimt verouderde stagingstatus voor Plugin-afhankelijkheden op die door oudere OpenClaw-versies is gemaakt. Het repareert ook ontbrekende geconfigureerde downloadbare Plugins wanneer het register ze kan oplossen, en de doctor-pass van 2026.5.2 installeert automatisch downloadbare Plugins die een oudere configuratie al gebruikt voordat de configuratie als geraakt voor die release wordt gemarkeerd. Als de download mislukt, rapporteert doctor de installatiefout en behoudt het de geconfigureerde Plugin-vermelding voor de volgende reparatiepoging.
- Doctor repareert verouderde Plugin-configuratie door ontbrekende Plugin-id's te verwijderen uit `plugins.allow`/`plugins.entries`, plus bijbehorende losgeraakte kanaalconfiguratie, Heartbeat-doelen en kanaalmodel-overschrijvingen wanneer Plugin-detectie gezond is.
- Doctor plaatst ongeldige Plugin-configuratie in quarantaine door de getroffen `plugins.entries.<id>`-vermelding uit te schakelen en de ongeldige `config`-payload te verwijderen. Gateway-opstart slaat al alleen die defecte Plugin over, zodat andere Plugins en kanalen kunnen blijven draaien.
- Stel `OPENCLAW_SERVICE_REPAIR_POLICY=external` in wanneer een andere supervisor de Gateway-levenscyclus beheert. Doctor rapporteert nog steeds de Gateway-/servicegezondheid en past reparaties buiten services toe, maar slaat service-installatie/start/herstart/bootstrap en opruiming van verouderde services over.
- Op Linux negeert doctor inactieve extra systemd-units die op een Gateway lijken en herschrijft het tijdens reparatie geen opdracht-/entrypoint-metadata voor een draaiende systemd Gateway-service. Stop eerst de service of gebruik `openclaw gateway install --force` wanneer je de actieve launcher bewust wilt vervangen.
- Doctor migreert automatisch verouderde platte Talk-configuratie (`talk.voiceId`, `talk.modelId` en verwante sleutels) naar `talk.provider` + `talk.providers.<provider>`.
- Herhaalde `doctor --fix`-uitvoeringen rapporteren/passen Talk-normalisatie niet meer toe wanneer het enige verschil de volgorde van objectsleutels is.
- Doctor bevat een gereedheidscontrole voor geheugenzoekopdrachten en kan `openclaw configure --section model` aanbevelen wanneer embeddingreferenties ontbreken.
- Doctor waarschuwt wanneer er geen opdrachteigenaar is geconfigureerd. De opdrachteigenaar is het menselijke operatoraccount dat owner-only opdrachten mag uitvoeren en gevaarlijke acties mag goedkeuren. DM-koppeling laat iemand alleen met de bot praten; als je een afzender hebt goedgekeurd voordat first-owner bootstrap bestond, stel dan expliciet `commands.ownerAllowFrom` in.
- Doctor waarschuwt wanneer agents in Codex-modus zijn geconfigureerd en persoonlijke Codex CLI-assets bestaan in de Codex-home van de operator. Lokale Codex app-server-starts gebruiken geïsoleerde homes per agent, dus gebruik `openclaw migrate codex --dry-run` om assets te inventariseren die bewust moeten worden gepromoveerd.
- Doctor waarschuwt wanneer skills die voor de standaardagent zijn toegestaan niet beschikbaar zijn in de huidige runtime-omgeving omdat bins, env-vars, configuratie of OS-vereisten ontbreken. `doctor --fix` kan die niet-beschikbare skills uitschakelen met `skills.entries.<skill>.enabled=false`; installeer/configureer in plaats daarvan de ontbrekende vereiste wanneer je de skill actief wilt houden.
- Als sandboxmodus is ingeschakeld maar Docker niet beschikbaar is, rapporteert doctor een duidelijke waarschuwing met hersteladvies (`install Docker` of `openclaw config set agents.defaults.sandbox.mode off`).
- Als verouderde sandbox-registerbestanden (`~/.openclaw/sandbox/containers.json` of `~/.openclaw/sandbox/browsers.json`) aanwezig zijn, rapporteert doctor ze; `openclaw doctor --fix` migreert geldige vermeldingen naar gesharde registermappen en plaatst ongeldige verouderde bestanden in quarantaine.
- Als `gateway.auth.token`/`gateway.auth.password` door SecretRef worden beheerd en niet beschikbaar zijn in het huidige opdrachtpad, rapporteert doctor een alleen-lezen waarschuwing en schrijft het geen plaintext fallback-referenties.
- Als inspectie van kanaal-SecretRef mislukt in een fix-pad, gaat doctor door en rapporteert het een waarschuwing in plaats van vroegtijdig af te sluiten.
- Na statusmapmigraties waarschuwt doctor wanneer ingeschakelde standaardaccounts voor Telegram of Discord afhankelijk zijn van env fallback en `TELEGRAM_BOT_TOKEN` of `DISCORD_BOT_TOKEN` niet beschikbaar is voor het doctor-proces.
- Automatische oplossing van Telegram `allowFrom`-gebruikersnamen (`doctor --fix`) vereist een oplosbaar Telegram-token in het huidige opdrachtpad. Als tokeninspectie niet beschikbaar is, rapporteert doctor een waarschuwing en slaat het automatische oplossing voor die pass over.

## macOS: `launchctl` env-overschrijvingen

Als je eerder `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (of `...PASSWORD`) hebt uitgevoerd, overschrijft die waarde je configuratiebestand en kan dit aanhoudende fouten met “unauthorized” veroorzaken.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Gateway doctor](/nl/gateway/doctor)
