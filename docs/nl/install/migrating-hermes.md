---
read_when:
    - Je stapt over van Hermes en wilt je modelconfiguratie, prompts, geheugen en Skills behouden
    - Je wilt weten wat OpenClaw automatisch importeert en wat alleen in het archief blijft
    - U hebt een schoon, gescript migratiepad nodig (CI, nieuwe laptop, automatisering)
summary: Stap over van Hermes naar OpenClaw met een vooraf bekeken, omkeerbare importbewerking
title: Migreren vanuit Hermes
x-i18n:
    generated_at: "2026-07-12T08:55:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd9012efb084c00dfe55bb841fea3cc6908c08b528492f1552bf226f125961e6
    source_path: install/migrating-hermes.md
    workflow: 16
---

De meegeleverde Hermes-migratieprovider detecteert de status in `~/.hermes`, toont een voorbeeld van elke wijziging voordat deze wordt toegepast, maskeert geheimen in plannen en rapporten en schrijft een geverifieerde OpenClaw-back-up voordat er iets wordt gewijzigd.

<Note>
Voor imports is een nieuwe OpenClaw-configuratie vereist. Als je al een lokale OpenClaw-status hebt, stel dan eerst de configuratie, aanmeldgegevens, sessies en werkruimte opnieuw in, of gebruik rechtstreeks `openclaw migrate apply hermes` met `--overwrite` nadat je het plan hebt gecontroleerd.
</Note>

## Twee manieren om te importeren

<Tabs>
  <Tab title="Onboardingwizard">
    Detecteert Hermes in `~/.hermes` en toont een voorbeeld voordat de wijzigingen worden toegepast.

    ```bash
    openclaw onboard --flow import
    ```

    Of verwijs naar een specifieke bron:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Gebruik `openclaw migrate` voor gescripte of herhaalbare uitvoeringen. Zie [`openclaw migrate`](/nl/cli/migrate) voor de volledige referentie.

    ```bash
    openclaw migrate hermes --dry-run    # alleen voorbeeld
    openclaw migrate apply hermes --yes  # toepassen zonder bevestiging
    ```

    Voeg `--from <path>` toe wanneer Hermes zich buiten `~/.hermes` bevindt.

  </Tab>
</Tabs>

## Wat wordt geïmporteerd

<AccordionGroup>
  <Accordion title="Modelconfiguratie">
    - De standaardmodelselectie uit het Hermes-bestand `config.yaml`.
    - Geconfigureerde modelproviders en aangepaste OpenAI-compatibele eindpunten uit `providers` en `custom_providers`.

  </Accordion>
  <Accordion title="MCP-servers">
    MCP-serverdefinities uit `mcp_servers` of `mcp.servers`.
  </Accordion>
  <Accordion title="Werkruimtebestanden">
    - `SOUL.md` en `AGENTS.md` worden naar de OpenClaw-agentwerkruimte gekopieerd.
    - `memories/MEMORY.md` en `memories/USER.md` worden aan de overeenkomende OpenClaw-geheugenbestanden **toegevoegd** in plaats van deze te overschrijven.

  </Accordion>
  <Accordion title="Geheugenconfiguratie">
    Standaardwaarden voor de geheugenconfiguratie van het OpenClaw-bestandsgeheugen. Externe geheugenproviders zoals Honcho worden geregistreerd als archiefitems of items voor handmatige controle, zodat je ze doelbewust kunt verplaatsen.
  </Accordion>
  <Accordion title="Skills">
    Skills met een `SKILL.md`-bestand onder `skills/<name>/` worden gekopieerd, samen met configuratiewaarden per Skill uit `skills.config`.
  </Accordion>
  <Accordion title="Authenticatiegegevens">
    Interactieve uitvoering van `openclaw migrate` vraagt vóór het importeren van authenticatiegegevens om bevestiging, waarbij ja standaard is geselecteerd. Als je dit accepteert, worden OpenCode OpenAI OAuth- en GitHub Copilot-vermeldingen uit het bestand `auth.json` van OpenCode geïmporteerd, evenals de [ondersteunde Hermes-sleutels voor `.env`](/nl/cli/migrate#supported-env-keys). De OAuth-vermeldingen in het eigen `auth.json`-bestand van Hermes zijn verouderde status: ze worden weergegeven als een item voor handmatige herauthenticatie of reparatie met doctor, in plaats van naar actieve authenticatie te worden geïmporteerd. Gebruik `--include-secrets` om aanmeldgegevens tijdens een niet-interactieve uitvoering te importeren, `--no-auth-credentials` om de import van aanmeldgegevens volledig over te slaan, of de vlag `--import-secrets` van de onboardingwizard.
  </Accordion>
</AccordionGroup>

## Wat uitsluitend in het archief blijft

De provider kopieert het volgende naar de map met migratierapporten voor handmatige controle, maar laadt dit **niet** in de actieve OpenClaw-configuratie of aanmeldgegevens:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw weigert deze status automatisch uit te voeren of te vertrouwen, omdat indelingen en vertrouwensaannamen tussen systemen kunnen verschillen. Verplaats wat je nodig hebt handmatig nadat je het archief hebt gecontroleerd.

## Aanbevolen procedure

<Steps>
  <Step title="Bekijk een voorbeeld van het plan">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Het plan vermeldt alles wat wordt gewijzigd, waaronder conflicten, overgeslagen items en gevoelige items. Geneste sleutels die op geheimen lijken, worden in de uitvoer gemaskeerd.

  </Step>
  <Step title="Pas toe met een back-up">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw maakt en verifieert vóór het toepassen een back-up. Dit niet-interactieve voorbeeld importeert alleen niet-geheime status. Voer de opdracht zonder `--yes` uit om de vraag over aanmeldgegevens interactief te beantwoorden, of voeg `--include-secrets` toe om ondersteunde aanmeldgegevens tijdens een onbeheerde uitvoering op te nemen.

  </Step>
  <Step title="Voer doctor uit">
    ```bash
    openclaw doctor
    ```

    [Doctor](/nl/gateway/doctor) past eventuele openstaande configuratiemigraties opnieuw toe en controleert op problemen die tijdens de import zijn ontstaan.

  </Step>
  <Step title="Herstart en verifieer">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Controleer of de Gateway correct werkt en of je geïmporteerde model, geheugen en Skills zijn geladen.

  </Step>
</Steps>

## Conflictafhandeling

Het toepassen weigert door te gaan wanneer het plan conflicten meldt (een bestand of configuratiewaarde bestaat al op de doellocatie).

<Warning>
Voer de opdracht alleen opnieuw uit met `--overwrite` als het de bedoeling is om het bestaande doel te vervangen. Providers kunnen in de map met migratierapporten nog steeds back-ups per item schrijven voor overschreven bestanden.
</Warning>

Conflicten zijn ongebruikelijk bij een nieuwe installatie. Ze treden doorgaans op wanneer je de import opnieuw uitvoert voor een configuratie die al gebruikerswijzigingen bevat.

Als tijdens het toepassen een conflict optreedt (bijvoorbeeld een onverwachte racecondition bij een configuratiebestand), markeert Hermes de resterende afhankelijke configuratie-items als `skipped` met de reden `blocked by earlier apply conflict`, in plaats van deze gedeeltelijk te schrijven. Het migratierapport registreert elk geblokkeerd item, zodat je het oorspronkelijke conflict kunt oplossen en de import opnieuw kunt uitvoeren.

## Geheimen

Interactieve uitvoering van `openclaw migrate` vraagt of gedetecteerde authenticatiegegevens moeten worden geïmporteerd, waarbij ja standaard is geselecteerd.

- Als je dit accepteert, worden OpenCode OpenAI OAuth- en GitHub Copilot-vermeldingen uit het bestand `auth.json` van OpenCode geïmporteerd, evenals de [ondersteunde sleutels voor `.env`](/nl/cli/migrate#supported-env-keys). De OAuth-vermeldingen in het eigen `auth.json`-bestand van Hermes worden gemeld voor handmatige herauthenticatie bij OpenAI of reparatie met doctor.
- Gebruik `--no-auth-credentials`, of antwoord nee op de vraag, om alleen niet-geheime status te importeren.
- Gebruik `--include-secrets` om aanmeldgegevens tijdens een onbeheerde uitvoering met `--yes` te importeren.
- Gebruik de vlag `--import-secrets` van de onboardingwizard om aanmeldgegevens vanuit de wizard te importeren.

## JSON-uitvoer voor automatisering

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Met `--json` en zonder `--yes` drukt het toepassen het plan af en wordt de status niet gewijzigd: dit is de veiligste modus voor CI en gedeelde scripts.

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Toepassen wordt geweigerd vanwege conflicten">
    Controleer de uitvoer van het plan. Elk conflict identificeert het bronpad en het bestaande doel. Bepaal per item of je het wilt overslaan, het doel wilt bewerken of de opdracht opnieuw wilt uitvoeren met `--overwrite`.
  </Accordion>
  <Accordion title="Hermes bevindt zich buiten ~/.hermes">
    Geef `--from /actual/path` (CLI) of `--import-source /actual/path` (onboarding) door.
  </Accordion>
  <Accordion title="Onboarding weigert te importeren naar een bestaande configuratie">
    Voor onboardingimports is een nieuwe configuratie vereist. Stel de status opnieuw in en doorloop de onboarding opnieuw, of gebruik rechtstreeks `openclaw migrate apply hermes`, dat `--overwrite` en expliciet back-upbeheer ondersteunt.
  </Accordion>
  <Accordion title="API-sleutels zijn niet geïmporteerd">
    Interactieve uitvoering van `openclaw migrate` importeert API-sleutels alleen wanneer je de vraag over aanmeldgegevens accepteert. Niet-interactieve uitvoeringen met `--yes` hebben `--include-secrets` nodig; onboardingimports hebben `--import-secrets` nodig. Alleen de [ondersteunde sleutels voor `.env`](/nl/cli/migrate#supported-env-keys) worden herkend; andere variabelen in `.env` worden genegeerd.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [`openclaw migrate`](/nl/cli/migrate): volledige CLI-referentie, Plugin-contract en JSON-structuren.
- [Onboarding](/nl/cli/onboard): wizardprocedure en vlaggen voor niet-interactief gebruik.
- [Migreren](/nl/install/migrating): verplaats een OpenClaw-installatie tussen machines.
- [Doctor](/nl/gateway/doctor): statuscontrole na de migratie.
- [Agentwerkruimte](/nl/concepts/agent-workspace): waar `SOUL.md`, `AGENTS.md` en geheugenbestanden zich bevinden.
