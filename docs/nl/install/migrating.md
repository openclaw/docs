---
read_when:
    - Je verhuist OpenClaw naar een nieuwe laptop of server
    - Je stapt over vanaf een ander agentsysteem en wilt de status behouden
    - Je voert een upgrade uit van een bestaande Plugin
summary: 'Migratiehub: imports tussen systemen, verplaatsingen van machine naar machine en Plugin-upgrades'
title: Migratiehandleiding
x-i18n:
    generated_at: "2026-04-29T22:55:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2a1dc86ed367a0b92cdc0d5189123bb045d327be944516f564dac723f324c97
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw ondersteunt drie migratiepaden: importeren vanuit een ander agentsysteem, een bestaande installatie verplaatsen naar een nieuwe machine en een Plugin ter plekke upgraden.

## Importeren vanuit een ander agentsysteem

Gebruik de meegeleverde migratieproviders om instructies, MCP-servers, Skills, modelconfiguratie en (opt-in) API-sleutels naar OpenClaw over te brengen. Plannen worden vooraf bekeken voordat er iets wordt gewijzigd, geheimen worden in rapporten geredigeerd, en toepassen wordt ondersteund door een geverifieerde back-up.

<CardGroup cols={2}>
  <Card title="Migrating from Claude" href="/nl/install/migrating-claude" icon="brain">
    Importeer de staat van Claude Code en Claude Desktop, inclusief `CLAUDE.md`, MCP-servers, Skills en projectopdrachten.
  </Card>
  <Card title="Migrating from Hermes" href="/nl/install/migrating-hermes" icon="feather">
    Importeer Hermes-configuratie, providers, MCP-servers, geheugen, Skills en ondersteunde `.env`-sleutels.
  </Card>
</CardGroup>

Het CLI-toegangspunt is [`openclaw migrate`](/nl/cli/migrate). Onboarding kan ook migratie aanbieden wanneer een bekende bron wordt gedetecteerd (`openclaw onboard --flow import`).

## OpenClaw naar een nieuwe machine verplaatsen

Kopieer de **statusmap** (standaard `~/.openclaw/`) en je **werkruimte** om het volgende te behouden:

- **Configuratie** — `openclaw.json` en alle Gateway-instellingen.
- **Authenticatie** — `auth-profiles.json` per agent (API-sleutels plus OAuth), plus eventuele kanaal- of providerstatus onder `credentials/`.
- **Sessies** — gespreksgeschiedenis en agentstatus.
- **Kanaalstatus** — WhatsApp-login, Telegram-sessie en vergelijkbaar.
- **Werkruimtebestanden** — `MEMORY.md`, `USER.md`, Skills en prompts.

<Tip>
Voer `openclaw status` uit op de oude machine om het pad van je statusmap te bevestigen. Aangepaste profielen gebruiken `~/.openclaw-<profile>/` of een pad dat via `OPENCLAW_STATE_DIR` is ingesteld.
</Tip>

### Migratiestappen

<Steps>
  <Step title="Stop the gateway and back up">
    Stop op de **oude** machine de Gateway zodat bestanden niet tijdens het kopieren veranderen, en archiveer daarna:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Als je meerdere profielen gebruikt (bijvoorbeeld `~/.openclaw-work`), archiveer elk profiel apart.

  </Step>

  <Step title="Install OpenClaw on the new machine">
    [Installeer](/nl/install) de CLI (en Node indien nodig) op de nieuwe machine. Het is prima als onboarding een nieuwe `~/.openclaw/` aanmaakt. Je overschrijft die hierna.
  </Step>

  <Step title="Copy state directory and workspace">
    Zet het archief over via `scp`, `rsync -a` of een externe schijf, en pak het daarna uit:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Zorg dat verborgen mappen zijn meegenomen en dat het bestandseigendom overeenkomt met de gebruiker die de Gateway uitvoert.

  </Step>

  <Step title="Run doctor and verify">
    Voer op de nieuwe machine [Doctor](/nl/gateway/doctor) uit om configuratiemigraties toe te passen en services te herstellen:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

### Veelvoorkomende valkuilen

<AccordionGroup>
  <Accordion title="Profile or state-dir mismatch">
    Als de oude Gateway `--profile` of `OPENCLAW_STATE_DIR` gebruikte en de nieuwe niet, lijken kanalen uitgelogd en zijn sessies leeg. Start de Gateway met hetzelfde profiel of dezelfde statusmap die je hebt gemigreerd, en voer daarna opnieuw `openclaw doctor` uit.
  </Accordion>

  <Accordion title="Copying only openclaw.json">
    Alleen het configuratiebestand is niet genoeg. Model-authenticatieprofielen staan onder `agents/<agentId>/agent/auth-profiles.json`, en kanaal- en providerstatus staat onder `credentials/`. Migreer altijd de **volledige** statusmap.
  </Accordion>

  <Accordion title="Permissions and ownership">
    Als je als root hebt gekopieerd of van gebruiker bent gewisseld, kan de Gateway mogelijk geen credentials lezen. Zorg dat de statusmap en werkruimte eigendom zijn van de gebruiker die de Gateway uitvoert.
  </Accordion>

  <Accordion title="Remote mode">
    Als je UI naar een **externe** Gateway verwijst, beheert de externe host sessies en de werkruimte. Migreer de Gateway-host zelf, niet je lokale laptop. Zie [FAQ](/nl/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Secrets in backups">
    De statusmap bevat authenticatieprofielen, kanaalcredentials en andere providerstatus. Bewaar back-ups versleuteld, vermijd onveilige overdrachtskanalen en roteer sleutels als je blootstelling vermoedt.
  </Accordion>
</AccordionGroup>

### Verificatiechecklist

Controleer op de nieuwe machine:

- [ ] `openclaw status` toont dat de Gateway draait.
- [ ] Kanalen zijn nog steeds verbonden (opnieuw koppelen is niet nodig).
- [ ] Het dashboard opent en toont bestaande sessies.
- [ ] Werkruimtebestanden (geheugen, configuraties) zijn aanwezig.

## Een Plugin ter plekke upgraden

In-place Plugin-upgrades behouden dezelfde Plugin-id en configuratiesleutels, maar kunnen status op schijf naar de huidige indeling verplaatsen. Plugin-specifieke upgradegidsen staan naast hun kanalen:

- [Matrix-migratie](/nl/channels/matrix-migration): herstelbeperkingen voor versleutelde status, automatisch snapshotgedrag en handmatige herstelopdrachten.

## Gerelateerd

- [`openclaw migrate`](/nl/cli/migrate): CLI-referentie voor imports tussen systemen.
- [Installatieoverzicht](/nl/install): alle installatiemethoden.
- [Doctor](/nl/gateway/doctor): gezondheidscontrole na migratie.
- [Verwijderen](/nl/install/uninstall): OpenClaw netjes verwijderen.
