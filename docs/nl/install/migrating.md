---
read_when:
    - Je verhuist OpenClaw naar een nieuwe laptop of server
    - Je stapt over vanuit een ander agentsysteem en wilt de status behouden
    - U voert een upgrade uit van een bestaande Plugin-installatie
summary: 'Migratiehub: imports tussen systemen, verhuizingen van machine naar machine en Plugin-upgrades'
title: Migratiehandleiding
x-i18n:
    generated_at: "2026-07-12T09:04:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7961f78bc654d328cb91a6ef982b6e47740fd831aec9249c8ffed3225dd0ccf
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw ondersteunt drie migratiepaden: importeren vanuit een ander agentsysteem, een bestaande installatie naar een nieuwe machine verplaatsen en een Plugin ter plaatse upgraden.

## Importeren vanuit een ander agentsysteem

Meegeleverde migratieproviders brengen instructies, MCP-servers, Skills, modelconfiguratie en (optioneel) API-sleutels over naar OpenClaw. Plannen worden vóór elke wijziging als voorbeeld weergegeven, geheimen worden in rapporten onleesbaar gemaakt en het toepassen wordt gedekt door een geverifieerde back-up.

<CardGroup cols={2}>
  <Card title="Migreren vanuit Claude" href="/nl/install/migrating-claude" icon="brain">
    Importeer de status van Claude Code en Claude Desktop, waaronder `CLAUDE.md`, MCP-servers, Skills en projectopdrachten.
  </Card>
  <Card title="Migreren vanuit Hermes" href="/nl/install/migrating-hermes" icon="feather">
    Importeer Hermes-configuratie, providers, MCP-servers, geheugen, Skills en ondersteunde `.env`-sleutels.
  </Card>
</CardGroup>

Het CLI-ingangspunt is [`openclaw migrate`](/nl/cli/migrate). De onboarding kan ook migratie aanbieden wanneer een bekende bron wordt gedetecteerd (`openclaw onboard --flow import`).

## OpenClaw naar een nieuwe machine verplaatsen

Kopieer de **statusmap** (standaard `~/.openclaw/`) en je **werkruimte** om het volgende te behouden:

- **Configuratie** — `openclaw.json` en alle Gateway-instellingen.
- **Authenticatie** — `auth-profiles.json` per agent (API-sleutels en OAuth), plus eventuele kanaal- of providerstatus onder `credentials/`.
- **Sessies** — gespreksgeschiedenis en agentstatus.
- **Kanaalstatus** — WhatsApp-aanmelding, Telegram-sessie en vergelijkbare gegevens.
- **Werkruimtebestanden** — `MEMORY.md`, `USER.md`, Skills en prompts.

<Tip>
Voer `openclaw status` uit op de oude machine om het pad van je statusmap te bevestigen. Aangepaste profielen gebruiken `~/.openclaw-<profile>/` of een pad dat via `OPENCLAW_STATE_DIR` is ingesteld.
</Tip>

### Migratiestappen

<Steps>
  <Step title="Stop de Gateway en maak een back-up">
    Stop op de **oude** machine de Gateway, zodat bestanden tijdens het kopiëren niet veranderen, en archiveer vervolgens:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Als je meerdere profielen gebruikt (bijvoorbeeld `~/.openclaw-work`), archiveer je elk profiel afzonderlijk.

  </Step>

  <Step title="Installeer OpenClaw op de nieuwe machine">
    [Installeer](/nl/install) de CLI (en indien nodig Node) op de nieuwe machine. Het is geen probleem als de onboarding een nieuwe `~/.openclaw/` aanmaakt — die overschrijf je in de volgende stap.
  </Step>

  <Step title="Kopieer de statusmap en werkruimte">
    Draag het archief over via `scp`, `rsync -a` of een externe schijf en pak het vervolgens uit:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Controleer of verborgen mappen zijn meegenomen en of het bestandseigendom overeenkomt met de gebruiker die de Gateway zal uitvoeren.

  </Step>

  <Step title="Voer doctor uit en verifieer">
    Voer op de nieuwe machine [Doctor](/nl/gateway/doctor) uit om configuratiemigraties toe te passen en services te herstellen:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

Als Telegram of Discord de standaardterugval op omgevingsvariabelen gebruikt (`TELEGRAM_BOT_TOKEN` of `DISCORD_BOT_TOKEN`), controleer dan of het gemigreerde `.env`-bestand in de statusmap deze sleutels bevat, zonder de geheime waarden af te drukken:

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

`openclaw doctor` waarschuwt ook wanneer voor een ingeschakeld standaardaccount van Telegram of Discord geen token is geconfigureerd en de bijbehorende omgevingsvariabele niet beschikbaar is voor het doctor-proces.

### Veelvoorkomende valkuilen

<AccordionGroup>
  <Accordion title="Profiel of statusmap komt niet overeen">
    Als de oude Gateway `--profile` of `OPENCLAW_STATE_DIR` gebruikte en de nieuwe dat niet doet, lijken kanalen afgemeld en zijn sessies leeg. Start de Gateway met **hetzelfde** profiel of dezelfde statusmap die je hebt gemigreerd en voer daarna `openclaw doctor` opnieuw uit.
  </Accordion>

  <Accordion title="Alleen openclaw.json kopiëren">
    Alleen het configuratiebestand is niet voldoende. Profielen voor modelauthenticatie staan onder `agents/<agentId>/agent/auth-profiles.json` en de kanaal- en providerstatus staat onder `credentials/`. Migreer altijd de **volledige** statusmap.
  </Accordion>

  <Accordion title="Machtigingen en eigendom">
    Als je als root hebt gekopieerd of van gebruiker bent gewisseld, kan de Gateway mogelijk de referenties niet lezen. Zorg ervoor dat de statusmap en werkruimte eigendom zijn van de gebruiker die de Gateway uitvoert.
  </Accordion>

  <Accordion title="Externe modus">
    Als je gebruikersinterface naar een **externe** Gateway verwijst, beheert de externe host de sessies en werkruimte. Migreer de Gateway-host zelf, niet je lokale laptop. Zie [Veelgestelde vragen](/nl/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Geheimen in back-ups">
    De statusmap bevat authenticatieprofielen, kanaalreferenties en andere providerstatus. Sla back-ups versleuteld op, vermijd onbeveiligde overdrachtskanalen en roteer sleutels als je vermoedt dat ze zijn blootgesteld.
  </Accordion>
</AccordionGroup>

### Verificatiechecklist

Controleer op de nieuwe machine:

- [ ] `openclaw status` toont dat de Gateway actief is.
- [ ] Kanalen zijn nog steeds verbonden (opnieuw koppelen is niet nodig).
- [ ] Het dashboard wordt geopend en toont bestaande sessies.
- [ ] Werkruimtebestanden (geheugen, configuraties) zijn aanwezig.

## Een Plugin ter plaatse upgraden

Upgrades van een Plugin ter plaatse behouden dezelfde Plugin-id en configuratiesleutels, maar kunnen status op schijf naar de huidige indeling verplaatsen. Pluginspecifieke upgradehandleidingen staan naast de bijbehorende kanalen:

- [Matrix-migratie](/nl/channels/matrix-migration): limieten voor herstel van versleutelde status, automatisch snapshotgedrag en handmatige herstelopdrachten.

## Gerelateerd

- [`openclaw migrate`](/nl/cli/migrate): CLI-naslag voor imports tussen systemen.
- [Installatieoverzicht](/nl/install): alle installatiemethoden.
- [Doctor](/nl/gateway/doctor): statuscontrole na de migratie.
- [Verwijderen](/nl/install/uninstall): OpenClaw netjes verwijderen.
