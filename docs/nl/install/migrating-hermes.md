---
read_when:
    - Je komt van Hermes en wilt je modelconfiguratie, prompts, geheugen en Skills behouden
    - Je wilt weten wat OpenClaw automatisch importeert en wat alleen in het archief blijft
    - Je hebt een schoon, gescript migratiepad nodig (CI, nieuwe laptop, automatisering)
summary: Stap over van Hermes naar OpenClaw met een vooraf te bekijken, omkeerbare import
title: Migreren vanuit Hermes
x-i18n:
    generated_at: "2026-04-29T22:55:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f8a71e524b31c85864be63e54fc8a2057ecb06a73aac9e6fb107fc0c49757d
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw importeert Hermes-status via een gebundelde migratieprovider. De provider toont een voorbeeld van alles voordat de status wordt gewijzigd, redigeert geheimen in plannen en rapporten, en maakt een geverifieerde back-up voordat wijzigingen worden toegepast.

<Note>
Imports vereisen een nieuwe OpenClaw-installatie. Als je al lokale OpenClaw-status hebt, reset dan eerst configuratie, referenties, sessies en de werkruimte, of gebruik `openclaw migrate` rechtstreeks met `--overwrite` nadat je het plan hebt bekeken.
</Note>

## Twee manieren om te importeren

<Tabs>
  <Tab title="Onboardingwizard">
    De snelste route. De wizard detecteert Hermes op `~/.hermes` en toont een voorbeeld voordat wijzigingen worden toegepast.

    ```bash
    openclaw onboard --flow import
    ```

    Of wijs naar een specifieke bron:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Gebruik `openclaw migrate` voor gescripte of herhaalbare runs. Zie [`openclaw migrate`](/nl/cli/migrate) voor de volledige referentie.

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    Voeg `--from <path>` toe wanneer Hermes buiten `~/.hermes` staat.

  </Tab>
</Tabs>

## Wat wordt geïmporteerd

<AccordionGroup>
  <Accordion title="Modelconfiguratie">
    - Standaardmodelselectie uit Hermes `config.yaml`.
    - Geconfigureerde modelproviders en aangepaste OpenAI-compatibele eindpunten uit `providers` en `custom_providers`.

  </Accordion>
  <Accordion title="MCP-servers">
    MCP-serverdefinities uit `mcp_servers` of `mcp.servers`.
  </Accordion>
  <Accordion title="Werkruimtebestanden">
    - `SOUL.md` en `AGENTS.md` worden naar de OpenClaw-agentwerkruimte gekopieerd.
    - `memories/MEMORY.md` en `memories/USER.md` worden **toegevoegd** aan de overeenkomende OpenClaw-geheugenbestanden in plaats van ze te overschrijven.

  </Accordion>
  <Accordion title="Geheugenconfiguratie">
    Standaardwaarden voor geheugenconfiguratie voor OpenClaw-bestandsgeheugen. Externe geheugenproviders zoals Honcho worden vastgelegd als archief- of handmatige-reviewitems, zodat je ze bewust kunt verplaatsen.
  </Accordion>
  <Accordion title="Skills">
    Skills met een `SKILL.md`-bestand onder `skills/<name>/` worden gekopieerd, samen met configuratiewaarden per Skill uit `skills.config`.
  </Accordion>
  <Accordion title="API-sleutels (opt-in)">
    Stel `--include-secrets` in om ondersteunde `.env`-sleutels te importeren: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`. Zonder de vlag worden geheimen nooit gekopieerd.
  </Accordion>
</AccordionGroup>

## Wat alleen archief blijft

De provider kopieert deze naar de migratierapportmap voor handmatige review, maar laadt ze **niet** in live OpenClaw-configuratie of referenties:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

OpenClaw weigert deze status automatisch uit te voeren of te vertrouwen, omdat de indelingen en vertrouwensaannames tussen systemen kunnen verschillen. Verplaats wat je nodig hebt handmatig nadat je het archief hebt bekeken.

## Aanbevolen workflow

<Steps>
  <Step title="Bekijk het plan">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Het plan vermeldt alles wat wordt gewijzigd, inclusief conflicten, overgeslagen items en eventuele gevoelige items. Planuitvoer redigeert geneste sleutels die op geheimen lijken.

  </Step>
  <Step title="Toepassen met back-up">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw maakt en verifieert een back-up voordat wijzigingen worden toegepast. Als je API-sleutels moet importeren, voeg dan `--include-secrets` toe.

  </Step>
  <Step title="Voer doctor uit">
    ```bash
    openclaw doctor
    ```

    [Doctor](/nl/gateway/doctor) past eventuele openstaande configuratiemigraties opnieuw toe en controleert op problemen die tijdens de import zijn geïntroduceerd.

  </Step>
  <Step title="Herstart en verifieer">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Bevestig dat de Gateway gezond is en dat je geïmporteerde model, geheugen en Skills zijn geladen.

  </Step>
</Steps>

## Conflictafhandeling

Apply weigert door te gaan wanneer het plan conflicten meldt (een bestand of configuratiewaarde bestaat al op het doel).

<Warning>
Voer opnieuw uit met `--overwrite` alleen wanneer het vervangen van het bestaande doel bewust de bedoeling is. Providers kunnen nog steeds back-ups op itemniveau schrijven voor overschreven bestanden in de migratierapportmap.
</Warning>

Voor een nieuwe OpenClaw-installatie zijn conflicten ongebruikelijk. Ze verschijnen meestal wanneer je de import opnieuw uitvoert op een setup die al gebruikersbewerkingen bevat.

Als er midden tijdens apply een conflict optreedt (bijvoorbeeld een onverwachte race op een configuratiebestand), markeert Hermes resterende afhankelijke configuratie-items als `skipped` met reden `blocked by earlier apply conflict` in plaats van ze gedeeltelijk te schrijven. Het migratierapport registreert elk geblokkeerd item, zodat je het oorspronkelijke conflict kunt oplossen en de import opnieuw kunt uitvoeren.

## Geheimen

Geheimen worden standaard nooit geïmporteerd.

- Voer eerst `openclaw migrate apply hermes --yes` uit om niet-geheime status te importeren.
- Als je ook ondersteunde `.env`-sleutels wilt kopiëren, voer dan opnieuw uit met `--include-secrets`.
- Voor door SecretRef beheerde referenties configureer je de SecretRef-bron nadat de import is voltooid.

## JSON-uitvoer voor automatisering

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Met `--json` en zonder `--yes` drukt apply het plan af en muteert het geen status. Dit is de veiligste modus voor CI en gedeelde scripts.

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Apply weigert met conflicten">
    Inspecteer de planuitvoer. Elk conflict identificeert het bronpad en het bestaande doel. Bepaal per item of je wilt overslaan, het doel wilt bewerken, of opnieuw wilt uitvoeren met `--overwrite`.
  </Accordion>
  <Accordion title="Hermes staat buiten ~/.hermes">
    Geef `--from /actual/path` (CLI) of `--import-source /actual/path` (onboarding) door.
  </Accordion>
  <Accordion title="Onboarding weigert te importeren op een bestaande setup">
    Onboardingimports vereisen een nieuwe setup. Reset de status en onboard opnieuw, of gebruik `openclaw migrate apply hermes` rechtstreeks, dat `--overwrite` en expliciete back-upcontrole ondersteunt.
  </Accordion>
  <Accordion title="API-sleutels zijn niet geïmporteerd">
    `--include-secrets` is vereist, en alleen de hierboven vermelde sleutels worden herkend. Andere variabelen in `.env` worden genegeerd.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [`openclaw migrate`](/nl/cli/migrate): volledige CLI-referentie, Plugin-contract en JSON-vormen.
- [Onboarding](/nl/cli/onboard): wizardworkflow en niet-interactieve vlaggen.
- [Migreren](/nl/install/migrating): verplaats een OpenClaw-installatie tussen machines.
- [Doctor](/nl/gateway/doctor): gezondheidscontrole na migratie.
- [Agentwerkruimte](/nl/concepts/agent-workspace): waar `SOUL.md`, `AGENTS.md` en geheugenbestanden staan.
