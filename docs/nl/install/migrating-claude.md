---
read_when:
    - Je stapt over van Claude Code of Claude Desktop en wilt instructies, MCP-servers en Skills behouden
    - Je moet begrijpen wat OpenClaw automatisch importeert en wat uitsluitend in het archief blijft.
summary: Verplaats de lokale status van Claude Code en Claude Desktop naar OpenClaw met een vooraf bekeken importbewerking
title: Migreren vanaf Claude
x-i18n:
    generated_at: "2026-07-12T09:00:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw importeert de lokale Claude-status via de gebundelde Claude-migratieprovider. De provider toont een voorbeeld van elk item voordat de status wordt gewijzigd, maskeert geheimen in plannen en rapporten en maakt vóór het toepassen een geverifieerde back-up.

<Note>
Voor importeren tijdens de onboarding is een nieuwe OpenClaw-installatie vereist. Als u al een lokale OpenClaw-status hebt, stelt u eerst de configuratie, aanmeldgegevens, sessies en werkruimte opnieuw in. U kunt ook rechtstreeks `openclaw migrate` gebruiken met `--overwrite`, nadat u het plan hebt gecontroleerd.
</Note>

## Twee manieren om te importeren

<Tabs>
  <Tab title="Onboardingwizard">
    De wizard biedt Claude aan wanneer lokale Claude-status wordt gedetecteerd.

    ```bash
    openclaw onboard --flow import
    ```

    Of geef een specifieke bron op:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Gebruik `openclaw migrate` voor gescripte of herhaalbare uitvoeringen. Zie [`openclaw migrate`](/nl/cli/migrate) voor de volledige referentie.

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    Voeg `--from <path>` toe om een specifieke basismap van Claude Code of projecthoofdmap te importeren.

  </Tab>
</Tabs>

## Wat wordt geïmporteerd

<AccordionGroup>
  <Accordion title="Instructies en geheugen">
    - De inhoud van `CLAUDE.md` en `.claude/CLAUDE.md` van het project wordt gekopieerd naar of toegevoegd aan `AGENTS.md` in de OpenClaw-agentwerkruimte.
    - De inhoud van `~/.claude/CLAUDE.md` van de gebruiker wordt toegevoegd aan `USER.md` in de werkruimte.

  </Accordion>
  <Accordion title="MCP-servers">
    Indien aanwezig, worden MCP-serverdefinities geïmporteerd uit `.mcp.json` van het project, `~/.claude.json` van Claude Code en `claude_desktop_config.json` van Claude Desktop.
  </Accordion>
  <Accordion title="Skills en opdrachten">
    - Claude-skills met een `SKILL.md`-bestand worden gekopieerd naar de Skills-map van de OpenClaw-werkruimte.
    - Markdown-bestanden met Claude-opdrachten onder `.claude/commands/` of `~/.claude/commands/` worden geconverteerd naar OpenClaw-Skills met `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## Wat alleen in het archief blijft

De provider kopieert het volgende naar het migratierapport voor handmatige controle, maar laadt het **niet** in de actieve OpenClaw-configuratie:

- Claude-hooks
- Claude-machtigingen en brede toestemmingslijsten voor tools
- Standaardwaarden voor de Claude-omgeving
- `CLAUDE.local.md`
- `.claude/rules/`
- Claude-subagenten onder `.claude/agents/` of `~/.claude/agents/`
- Cache-, plan- en projectgeschiedenismappen van Claude Code
- Claude Desktop-extensies en in het besturingssysteem opgeslagen aanmeldgegevens

OpenClaw weigert automatisch hooks uit te voeren, toestemmingslijsten voor machtigingen te vertrouwen of ondoorzichtige OAuth- en Desktop-aanmeldgegevens te decoderen. Verplaats wat u nodig hebt handmatig nadat u het archief hebt gecontroleerd.

## Bronselectie

Zonder `--from` inspecteert OpenClaw de standaardbasismap van Claude Code op `~/.claude`, het bemonsterde statusbestand `~/.claude.json` van Claude Code en de MCP-configuratie van Claude Desktop op macOS.

Wanneer `--from` naar een projecthoofdmap verwijst, importeert OpenClaw alleen de Claude-bestanden van dat project, zoals `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` en `.mcp.json`. Tijdens een import vanuit een projecthoofdmap wordt uw globale Claude-basismap niet gelezen.

## Aanbevolen werkwijze

<Steps>
  <Step title="Bekijk een voorbeeld van het plan">
    ```bash
    openclaw migrate claude --dry-run
    ```

    Het plan vermeldt alles wat wordt gewijzigd, waaronder conflicten, overgeslagen items en gevoelige waarden die in geneste MCP-velden `env` of `headers` zijn gemaskeerd.

  </Step>
  <Step title="Toepassen met back-up">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw maakt en verifieert een back-up voordat de wijzigingen worden toegepast.

  </Step>
  <Step title="Doctor uitvoeren">
    ```bash
    openclaw doctor
    ```

    [Doctor](/nl/gateway/doctor) controleert na het importeren op problemen met de configuratie of status.

  </Step>
  <Step title="Opnieuw starten en verifiëren">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Controleer of de Gateway correct werkt en uw geïmporteerde instructies, MCP-servers en Skills zijn geladen.

  </Step>
</Steps>

## Conflictafhandeling

Het toepassen wordt geweigerd wanneer het plan conflicten meldt (er bestaat al een bestand of configuratiewaarde op de doellocatie).

<Warning>
Voer de opdracht alleen opnieuw uit met `--overwrite` wanneer u het bestaande doel bewust wilt vervangen. Providers kunnen voor overschreven bestanden nog steeds back-ups per item opslaan in de map van het migratierapport.
</Warning>

Bij een nieuwe OpenClaw-installatie zijn conflicten ongebruikelijk. Ze treden doorgaans op wanneer u de import opnieuw uitvoert op een installatie die al gebruikerswijzigingen bevat.

## JSON-uitvoer voor automatisering

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

`--yes` is vereist voor `migrate apply` buiten een interactieve terminal. Zonder deze vlag geeft OpenClaw een foutmelding in plaats van de wijzigingen toe te passen. Scripts en CI moeten `--yes` daarom expliciet doorgeven. Bekijk eerst een voorbeeld met `--dry-run --json` en pas de migratie vervolgens toe met `--json --yes` zodra het plan correct is.

## Probleemoplossing

<AccordionGroup>
  <Accordion title="De Claude-status bevindt zich buiten ~/.claude">
    Geef `--from /actual/path` (CLI) of `--import-source /actual/path` (onboarding) door.
  </Accordion>
  <Accordion title="Onboarding weigert te importeren in een bestaande installatie">
    Voor importeren tijdens de onboarding is een nieuwe installatie vereist. Stel de status opnieuw in en doorloop de onboarding opnieuw, of gebruik rechtstreeks `openclaw migrate apply claude`. Deze opdracht ondersteunt `--overwrite` en expliciet beheer van back-ups.
  </Accordion>
  <Accordion title="MCP-servers van Claude Desktop zijn niet geïmporteerd">
    Claude Desktop leest `claude_desktop_config.json` vanaf een platformspecifiek pad. Laat `--from` naar de map van dat bestand verwijzen als OpenClaw het niet automatisch heeft gedetecteerd.
  </Accordion>
  <Accordion title="Claude-opdrachten zijn Skills geworden waarvoor modelaanroepen zijn uitgeschakeld">
    Dit is zo ontworpen. Claude-opdrachten worden door de gebruiker geactiveerd. Daarom importeert OpenClaw ze als Skills met `disable-model-invocation: true`. Bewerk de frontmatter van elke Skill als u wilt dat de agent ze automatisch aanroept.
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [`openclaw migrate`](/nl/cli/migrate): volledige CLI-referentie, Plugin-contract en JSON-structuren.
- [Migratiehandleiding](/nl/install/migrating): alle migratiepaden.
- [Migreren vanuit Hermes](/nl/install/migrating-hermes): het andere importschema tussen systemen.
- [Onboarding](/nl/cli/onboard): wizardprocedure en niet-interactieve vlaggen.
- [Doctor](/nl/gateway/doctor): statuscontrole na de migratie.
- [Agentwerkruimte](/nl/concepts/agent-workspace): waar `AGENTS.md`, `USER.md` en Skills zich bevinden.
