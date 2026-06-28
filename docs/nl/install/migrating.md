---
read_when:
    - Je zet OpenClaw over naar een nieuwe laptop of server
    - Je komt vanuit een ander agentsysteem en wilt de toestand behouden
    - Je werkt een bestaande Plugin op zijn plek bij
summary: 'Migratiehub: systeemoverschrijdende imports, verplaatsingen van machine naar machine en Plugin-upgrades'
title: Migratiegids
x-i18n:
    generated_at: "2026-05-02T11:20:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: e447e38cf0086603a7b30ee5204e63cc8227ebc7a56add26d06ac2798a23e26f
    source_path: install/migrating.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw ondersteunt drie migratiepaden: importeren vanuit een ander agentsysteem, een bestaande installatie naar een nieuwe machine verplaatsen en een Plugin ter plekke upgraden.

## Importeren vanuit een ander agentsysteem

Gebruik de meegeleverde migratieproviders om instructies, MCP-servers, Skills, modelconfiguratie en (opt-in) API-sleutels naar OpenClaw te brengen. Plannen worden vooraf bekeken voordat er iets verandert, geheimen worden in rapporten geredigeerd en toepassen wordt ondersteund door een geverifieerde back-up.

<CardGroup cols={2}>
  <Card title="Migreren vanuit Claude" href="/nl/install/migrating-claude" icon="brain">
    Importeer de status van Claude Code en Claude Desktop, inclusief `CLAUDE.md`, MCP-servers, Skills en projectopdrachten.
  </Card>
  <Card title="Migreren vanuit Hermes" href="/nl/install/migrating-hermes" icon="feather">
    Importeer Hermes-configuratie, providers, MCP-servers, geheugen, Skills en ondersteunde `.env`-sleutels.
  </Card>
</CardGroup>

Het CLI-ingangspunt is [`openclaw migrate`](/nl/cli/migrate). Onboarding kan ook migratie aanbieden wanneer het een bekende bron detecteert (`openclaw onboard --flow import`).

## OpenClaw naar een nieuwe machine verplaatsen

Kopieer de **statusdirectory** (standaard `~/.openclaw/`) en je **workspace** om het volgende te behouden:

- **Configuratie** — `openclaw.json` en alle gateway-instellingen.
- **Authenticatie** — `auth-profiles.json` per agent (API-sleutels plus OAuth), plus eventuele kanaal- of providerstatus onder `credentials/`.
- **Sessies** — gespreksgeschiedenis en agentstatus.
- **Kanaalstatus** — WhatsApp-login, Telegram-sessie en vergelijkbare gegevens.
- **Workspace-bestanden** — `MEMORY.md`, `USER.md`, Skills en prompts.

<Tip>
Voer `openclaw status` uit op de oude machine om het pad van je statusdirectory te bevestigen. Aangepaste profielen gebruiken `~/.openclaw-<profile>/` of een pad dat via `OPENCLAW_STATE_DIR` is ingesteld.
</Tip>

### Migratiestappen

<Steps>
  <Step title="Stop de Gateway en maak een back-up">
    Stop op de **oude** machine de Gateway zodat bestanden niet tijdens het kopiëren veranderen, en archiveer daarna:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Als je meerdere profielen gebruikt (bijvoorbeeld `~/.openclaw-work`), archiveer elk profiel afzonderlijk.

  </Step>

  <Step title="Installeer OpenClaw op de nieuwe machine">
    [Installeer](/nl/install) de CLI (en Node indien nodig) op de nieuwe machine. Het is prima als onboarding een nieuwe `~/.openclaw/` aanmaakt. Je overschrijft die hierna.
  </Step>

  <Step title="Kopieer de statusdirectory en workspace">
    Zet het archief over via `scp`, `rsync -a` of een externe schijf, en pak het daarna uit:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Zorg dat verborgen directory's zijn meegenomen en dat het bestandseigendom overeenkomt met de gebruiker die de Gateway zal uitvoeren.

  </Step>

  <Step title="Voer doctor uit en verifieer">
    Voer op de nieuwe machine [Doctor](/nl/gateway/doctor) uit om configuratiemigraties toe te passen en services te repareren:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

Als Telegram of Discord de standaard env-terugval gebruikt (`TELEGRAM_BOT_TOKEN` of `DISCORD_BOT_TOKEN`), controleer dan of de gemigreerde statusdirectory `.env` die sleutels bevat zonder de geheime waarden af te drukken:

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

`openclaw doctor` waarschuwt ook wanneer een ingeschakeld standaard Telegram- of Discord-account geen geconfigureerd token heeft en de overeenkomende env-variabele niet beschikbaar is voor het doctor-proces.

### Veelvoorkomende valkuilen

<AccordionGroup>
  <Accordion title="Profiel- of statusdirectory komt niet overeen">
    Als de oude Gateway `--profile` of `OPENCLAW_STATE_DIR` gebruikte en de nieuwe niet, lijken kanalen uitgelogd en zijn sessies leeg. Start de Gateway met hetzelfde profiel of dezelfde statusdirectory die je hebt gemigreerd, en voer daarna `openclaw doctor` opnieuw uit.
  </Accordion>

  <Accordion title="Alleen openclaw.json kopiëren">
    Het configuratiebestand alleen is niet genoeg. Modelauthenticatieprofielen staan onder `agents/<agentId>/agent/auth-profiles.json`, en kanaal- en providerstatus staat onder `credentials/`. Migreer altijd de **volledige** statusdirectory.
  </Accordion>

  <Accordion title="Machtigingen en eigendom">
    Als je als root hebt gekopieerd of van gebruiker bent gewisseld, kan de Gateway mogelijk geen inloggegevens lezen. Zorg dat de statusdirectory en workspace eigendom zijn van de gebruiker die de Gateway uitvoert.
  </Accordion>

  <Accordion title="Externe modus">
    Als je UI naar een **externe** Gateway verwijst, beheert de externe host de sessies en workspace. Migreer de Gateway-host zelf, niet je lokale laptop. Zie [FAQ](/nl/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Geheimen in back-ups">
    De statusdirectory bevat authenticatieprofielen, kanaalinloggegevens en andere providerstatus. Sla back-ups versleuteld op, vermijd onveilige overdrachtskanalen en roteer sleutels als je blootstelling vermoedt.
  </Accordion>
</AccordionGroup>

### Verificatiechecklist

Bevestig op de nieuwe machine:

- [ ] `openclaw status` toont dat de Gateway draait.
- [ ] Kanalen zijn nog steeds verbonden (opnieuw koppelen is niet nodig).
- [ ] Het dashboard opent en toont bestaande sessies.
- [ ] Workspace-bestanden (geheugen, configuraties) zijn aanwezig.

## Een Plugin ter plekke upgraden

Ter plekke uitgevoerde Plugin-upgrades behouden dezelfde Plugin-id en configuratiesleutels, maar kunnen status op schijf naar de huidige indeling verplaatsen. Plugin-specifieke upgradehandleidingen staan naast hun kanalen:

- [Matrix-migratie](/nl/channels/matrix-migration): herstelbeperkingen voor versleutelde status, automatisch snapshotgedrag en handmatige herstelopdrachten.

## Gerelateerd

- [`openclaw migrate`](/nl/cli/migrate): CLI-referentie voor imports tussen systemen.
- [Installatieoverzicht](/nl/install): alle installatiemethoden.
- [Doctor](/nl/gateway/doctor): gezondheidscontrole na migratie.
- [De-installeren](/nl/install/uninstall): OpenClaw netjes verwijderen.
