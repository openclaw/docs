---
read_when:
    - Je komt van Hermes en wilt je modelconfiguratie, prompts, geheugen en Skills behouden
    - Je wilt weten wat OpenClaw automatisch importeert en wat alleen in het archief blijft
    - Je hebt een schoon, gescript migratiepad nodig (CI, nieuwe laptop, automatisering)
summary: Stap over van Hermes naar OpenClaw met een vooraf bekeken, omkeerbare import
title: Migreren vanaf Hermes
x-i18n:
    generated_at: "2026-06-27T17:43:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f2a2bfea4fd276e3392261e8ecea09d147424636efb200ced1deb86ac0161b5
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw importeert Hermes-status via een gebundelde migratieprovider. De provider toont een voorbeeld van alles voordat de status wordt gewijzigd, redigeert geheimen in plannen en rapporten, en maakt een geverifieerde back-up voordat de toepassing begint.

<Note>
Imports vereisen een nieuwe OpenClaw-installatie. Als je al lokale OpenClaw-status hebt, reset dan eerst configuratie, referenties, sessies en de werkruimte, of gebruik `openclaw migrate` rechtstreeks met `--overwrite` nadat je het plan hebt gecontroleerd.
</Note>

## Twee manieren om te importeren

<Tabs>
  <Tab title="Onboardingwizard">
    Het snelste pad. De wizard detecteert Hermes op `~/.hermes` en toont een voorbeeld voordat wijzigingen worden toegepast.

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
    - Geconfigureerde modelproviders en aangepaste OpenAI-compatibele endpoints uit `providers` en `custom_providers`.

  </Accordion>
  <Accordion title="MCP-servers">
    MCP-serverdefinities uit `mcp_servers` of `mcp.servers`.
  </Accordion>
  <Accordion title="Werkruimtebestanden">
    - `SOUL.md` en `AGENTS.md` worden naar de OpenClaw-agentwerkruimte gekopieerd.
    - `memories/MEMORY.md` en `memories/USER.md` worden **toegevoegd** aan de overeenkomende OpenClaw-geheugenbestanden in plaats van ze te overschrijven.

  </Accordion>
  <Accordion title="Geheugenconfiguratie">
    Standaardwaarden voor geheugenconfiguratie voor OpenClaw-bestandsgeheugen. Externe geheugenproviders zoals Honcho worden geregistreerd als archief- of handmatige-reviewitems, zodat je ze bewust kunt verplaatsen.
  </Accordion>
  <Accordion title="Skills">
    Skills met een `SKILL.md`-bestand onder `skills/<name>/` worden gekopieerd, samen met configuratiewaarden per Skill uit `skills.config`.
  </Accordion>
  <Accordion title="Authenticatiereferenties">
    Interactieve `openclaw migrate` vraagt voordat authenticatiereferenties worden geïmporteerd, waarbij ja standaard is geselecteerd. Geaccepteerde imports omvatten OpenCode OpenAI OAuth-referenties uit OpenCode `auth.json`, OpenCode- en GitHub Copilot-vermeldingen uit OpenCode `auth.json`, en de [ondersteunde `.env`-sleutels](/nl/cli/migrate#supported-env-keys). Hermes `auth.json` OAuth-vermeldingen zijn legacy-status en worden weergegeven als handmatige herauthenticatie-/doctorwerk in plaats van geïmporteerd in live-authenticatie. Gebruik `--include-secrets` voor niet-interactieve import van referenties met `openclaw migrate`, `--no-auth-credentials` om dit over te slaan, of onboarding `--import-secrets` bij importeren vanuit de onboardingwizard.
  </Accordion>
</AccordionGroup>

## Wat alleen archief blijft

De provider kopieert deze naar de migratierapportmap voor handmatige review, maar laadt ze **niet** in live OpenClaw-configuratie of referenties:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw weigert deze status automatisch uit te voeren of te vertrouwen, omdat de formaten en vertrouwensaannames tussen systemen kunnen afwijken. Verplaats wat je nodig hebt handmatig nadat je het archief hebt gecontroleerd.

## Aanbevolen flow

<Steps>
  <Step title="Bekijk het plan vooraf">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Het plan vermeldt alles wat zal veranderen, inclusief conflicten, overgeslagen items en eventuele gevoelige items. Planuitvoer redigeert geneste sleutels die op geheimen lijken.

  </Step>
  <Step title="Pas toe met back-up">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw maakt en verifieert een back-up voordat wijzigingen worden toegepast. Dit niet-interactieve voorbeeld importeert niet-geheime status. Voer uit zonder `--yes` om de referentieprompt te beantwoorden, of voeg `--include-secrets` toe om ondersteunde referenties op te nemen in onbeheerde runs.

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
Voer opnieuw uit met `--overwrite` alleen wanneer het vervangen van het bestaande doel opzettelijk is. Providers kunnen nog steeds back-ups op itemniveau schrijven voor overschreven bestanden in de migratierapportmap.
</Warning>

Voor een nieuwe OpenClaw-installatie zijn conflicten ongebruikelijk. Ze verschijnen meestal wanneer je de import opnieuw uitvoert op een installatie die al gebruikersbewerkingen bevat.

Als er halverwege apply een conflict optreedt (bijvoorbeeld een onverwachte race op een configuratiebestand), markeert Hermes resterende afhankelijke configuratie-items als `skipped` met reden `blocked by earlier apply conflict` in plaats van ze gedeeltelijk te schrijven. Het migratierapport registreert elk geblokkeerd item, zodat je het oorspronkelijke conflict kunt oplossen en de import opnieuw kunt uitvoeren.

## Geheimen

Interactieve `openclaw migrate` vraagt of gedetecteerde authenticatiereferenties moeten worden geïmporteerd, waarbij ja standaard is geselecteerd.

- Het accepteren van de prompt importeert OpenCode OpenAI OAuth-referenties uit OpenCode `auth.json`, OpenCode- en GitHub Copilot-vermeldingen uit OpenCode `auth.json`, en de [ondersteunde `.env`-sleutels](/nl/cli/migrate#supported-env-keys). Hermes `auth.json` OAuth-vermeldingen worden gerapporteerd voor handmatige OpenAI-herauthenticatie of doctorherstel.
- Gebruik `--no-auth-credentials` of kies nee bij de prompt om alleen niet-geheime status te importeren.
- Gebruik `--include-secrets` wanneer je onbeheerd uitvoert met `--yes`.
- Gebruik onboarding `--import-secrets` wanneer je referenties importeert vanuit de onboardingwizard.
- Configureer voor door SecretRef beheerde referenties de SecretRef-bron nadat de import is voltooid.

## JSON-uitvoer voor automatisering

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Met `--json` en zonder `--yes` drukt apply het plan af en muteert het geen status. Dit is de veiligste modus voor CI en gedeelde scripts.

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Apply weigert met conflicten">
    Inspecteer de planuitvoer. Elk conflict identificeert het bronpad en het bestaande doel. Bepaal per item of je het overslaat, het doel bewerkt, of opnieuw uitvoert met `--overwrite`.
  </Accordion>
  <Accordion title="Hermes staat buiten ~/.hermes">
    Geef `--from /actual/path` (CLI) of `--import-source /actual/path` (onboarding) door.
  </Accordion>
  <Accordion title="Onboarding weigert te importeren op een bestaande installatie">
    Onboardingimports vereisen een nieuwe installatie. Reset de status en onboard opnieuw, of gebruik `openclaw migrate apply hermes` rechtstreeks; dit ondersteunt `--overwrite` en expliciete back-upcontrole.
  </Accordion>
  <Accordion title="API-sleutels zijn niet geïmporteerd">
    Interactieve `openclaw migrate` importeert API-sleutels alleen wanneer je de referentieprompt accepteert. Niet-interactieve `--yes`-runs vereisen `--include-secrets`; onboardingimports vereisen `--import-secrets`. Alleen de [ondersteunde `.env`-sleutels](/nl/cli/migrate#supported-env-keys) worden herkend; andere variabelen in `.env` worden genegeerd.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [`openclaw migrate`](/nl/cli/migrate): volledige CLI-referentie, Plugin-contract en JSON-vormen.
- [Onboarding](/nl/cli/onboard): wizardflow en niet-interactieve flags.
- [Migreren](/nl/install/migrating): verplaats een OpenClaw-installatie tussen machines.
- [Doctor](/nl/gateway/doctor): gezondheidscontrole na migratie.
- [Agentwerkruimte](/nl/concepts/agent-workspace): waar `SOUL.md`, `AGENTS.md` en geheugenbestanden staan.
