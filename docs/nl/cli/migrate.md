---
read_when:
    - Je wilt migreren van Hermes of een ander agentsysteem naar OpenClaw
    - Je voegt een migratieprovider toe die eigendom is van de Plugin
summary: CLI-referentie voor `openclaw migrate` (toestand importeren uit een ander agentsysteem)
title: Migreren
x-i18n:
    generated_at: "2026-05-10T19:29:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb32f993d2412a97a1f91bf3f2b3ca1a653d1db3db75aa90d3b834bdc6acbb95
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importeer status vanuit een ander agentsysteem via een migratieprovider die eigendom is van een Plugin. Gebundelde providers dekken de status van Codex CLI, [Claude](/nl/install/migrating-claude) en [Hermes](/nl/install/migrating-hermes); Plugins van derden kunnen extra providers registreren.

<Tip>
Zie [Migreren vanaf Claude](/nl/install/migrating-claude) en [Migreren vanaf Hermes](/nl/install/migrating-hermes) voor gebruikersgerichte stappenplannen. De [migratiehub](/nl/install/migrating) vermeldt alle paden.
</Tip>

## Opdrachten

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  Naam van een geregistreerde migratieprovider, bijvoorbeeld `hermes`. Voer `openclaw migrate list` uit om geinstalleerde providers te bekijken.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Bouw het plan op en sluit af zonder status te wijzigen.
</ParamField>
<ParamField path="--from <path>" type="string">
  Overschrijf de bronmap voor status. Hermes gebruikt standaard `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importeer ondersteunde inloggegevens. Standaard uitgeschakeld.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Sta toe dat toepassen bestaande doelen vervangt wanneer het plan conflicten meldt.
</ParamField>
<ParamField path="--yes" type="boolean">
  Sla de bevestigingsprompt over. Vereist in niet-interactieve modus.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Selecteer een skill-kopieeritem op skillnaam of item-id. Herhaal de vlag om meerdere skills te migreren. Wanneer dit wordt weggelaten, tonen interactieve Codex-migraties een selectievakjeskiezer en behouden niet-interactieve migraties alle geplande skills.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Selecteer een installatie-item voor een Codex-Plugin op Plugin-naam of item-id. Herhaal de vlag om meerdere Codex-Plugins te migreren. Wanneer dit wordt weggelaten, tonen interactieve Codex-migraties een native Codex Plugin-selectievakjeskiezer en behouden niet-interactieve migraties alle geplande Plugins. Dit geldt alleen voor brongeinstalleerde `openai-curated` Codex-Plugins die door de inventaris van de Codex-appserver zijn ontdekt.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Sla de backup voorafgaand aan toepassen over. Vereist `--force` wanneer lokale OpenClaw-status bestaat.
</ParamField>
<ParamField path="--force" type="boolean">
  Vereist naast `--no-backup` wanneer toepassen anders zou weigeren om de backup over te slaan.
</ParamField>
<ParamField path="--json" type="boolean">
  Druk het plan of toepassingsresultaat af als JSON. Met `--json` en zonder `--yes` drukt toepassen het plan af en wijzigt het geen status.
</ParamField>

## Veiligheidsmodel

`openclaw migrate` werkt eerst met een voorbeeldweergave.

<AccordionGroup>
  <Accordion title="Voorbeeld bekijken voor toepassen">
    De provider retourneert een uitgesplitst plan voordat er iets verandert, inclusief conflicten, overgeslagen items en gevoelige items. JSON-plannen, toepassingsuitvoer en migratierapporten redigeren geneste sleutels die op geheimen lijken, zoals API-sleutels, tokens, autorisatieheaders, cookies en wachtwoorden.

    `openclaw migrate apply <provider>` toont eerst een voorbeeld van het plan en vraagt om bevestiging voordat status wordt gewijzigd, tenzij `--yes` is ingesteld. In niet-interactieve modus vereist toepassen `--yes`.

  </Accordion>
  <Accordion title="Backups">
    Toepassen maakt en verifieert een OpenClaw-backup voordat de migratie wordt toegepast. Als er nog geen lokale OpenClaw-status bestaat, wordt de backupstap overgeslagen en kan de migratie doorgaan. Geef zowel `--no-backup` als `--force` door om een backup over te slaan wanneer status bestaat.
  </Accordion>
  <Accordion title="Conflicten">
    Toepassen weigert door te gaan wanneer het plan conflicten bevat. Controleer het plan en voer daarna opnieuw uit met `--overwrite` als het vervangen van bestaande doelen de bedoeling is. Providers kunnen nog steeds backups op itemniveau voor overschreven bestanden wegschrijven in de map met migratierapporten.
  </Accordion>
  <Accordion title="Geheimen">
    Geheimen worden standaard nooit geimporteerd. Gebruik `--include-secrets` om ondersteunde inloggegevens te importeren.
  </Accordion>
</AccordionGroup>

## Claude-provider

De gebundelde Claude-provider detecteert standaard Claude Code-status op `~/.claude`. Gebruik `--from <path>` om een specifieke Claude Code-home of projectroot te importeren.

<Tip>
Zie [Migreren vanaf Claude](/nl/install/migrating-claude) voor een gebruikersgericht stappenplan.
</Tip>

### Wat Claude importeert

- Project-`CLAUDE.md` en `.claude/CLAUDE.md` naar de OpenClaw-agentwerkruimte.
- Gebruikers-`~/.claude/CLAUDE.md` toegevoegd aan werkruimte-`USER.md`.
- MCP-serverdefinities uit project-`.mcp.json`, Claude Code `~/.claude.json` en Claude Desktop `claude_desktop_config.json`.
- Claude-skillmappen die `SKILL.md` bevatten.
- Claude-opdracht-Markdown-bestanden geconverteerd naar OpenClaw-skills met alleen handmatige aanroep.

### Gearchiveerde status en status voor handmatige beoordeling

Claude-hooks, machtigingen, omgevingsstandaarden, lokaal geheugen, padgebonden regels, subagents, caches, plannen en projectgeschiedenis worden bewaard in het migratierapport of gemeld als items voor handmatige beoordeling. OpenClaw voert geen hooks uit, kopieert geen brede allowlists en importeert OAuth-/Desktop-inlogstatus niet automatisch.

## Codex-provider

De gebundelde Codex-provider detecteert standaard Codex CLI-status op `~/.codex`, of
op `CODEX_HOME` wanneer die omgevingsvariabele is ingesteld. Gebruik `--from <path>` om
een specifieke Codex-home te inventariseren.

Gebruik deze provider wanneer je overstapt naar de OpenClaw Codex-harness en nuttige
persoonlijke Codex CLI-assets bewust wilt promoveren. Lokale lanceringen van de Codex-appserver
gebruiken per-agent `CODEX_HOME`- en `HOME`-mappen, zodat ze standaard niet je
persoonlijke Codex CLI-status lezen.

Wanneer `openclaw migrate codex` in een interactieve terminal wordt uitgevoerd, wordt eerst het volledige
plan getoond en worden daarna selectievakjeskiezers geopend voor de definitieve toepassingsbevestiging. Skill-
kopieeritems worden als eerste gevraagd. Gebruik `Toggle all on` of `Toggle all off` voor bulk-
selectie; geplande skills beginnen aangevinkt, conflict-skills beginnen uitgevinkt en
`Skip for now` slaat skill-kopieen over voor deze uitvoering terwijl nog steeds wordt doorgegaan naar Plugin-
selectie. Wanneer brongeinstalleerde gecureerde Codex-Plugins migreerbaar zijn en
`--plugin` niet is opgegeven, vraagt migratie daarna om native Codex Plugin-
activatie op Plugin-naam. Plugin-items
beginnen aangevinkt tenzij de doelconfiguratie van de OpenClaw Codex-Plugin die
Plugin al bevat. Bestaande doel-Plugins beginnen uitgevinkt en tonen een conflicthint zoals
`conflict: plugin exists`; kies `Toggle all off` om in die uitvoering geen native Codex-
Plugins te migreren, of `Skip for now` om te stoppen voordat wordt toegepast. Geef voor gescripte of
exacte uitvoeringen `--skill <name>` een keer per skill door, bijvoorbeeld:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Gebruik `--plugin <name>` om native Codex Plugin-migratie niet-interactief te beperken
tot een of meer brongeinstalleerde gecureerde Plugins:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Wat Codex importeert

- Codex CLI-skillmappen onder `$CODEX_HOME/skills`, exclusief Codex'
  `.system`-cache.
- Persoonlijke AgentSkills onder `$HOME/.agents/skills`, gekopieerd naar de huidige
  OpenClaw-agentwerkruimte wanneer je eigenaarschap per agent wilt.
- Brongeinstalleerde `openai-curated` Codex-Plugins ontdekt via Codex
  appserver-`plugin/list`. Toepassen roept appserver-`plugin/install` aan voor elke
  geselecteerde Plugin, zelfs als de doel-appserver die Plugin al meldt als
  geinstalleerd en ingeschakeld. Gemigreerde Codex-Plugins zijn alleen bruikbaar in sessies die
  de native Codex-harness selecteren; ze worden niet beschikbaar gesteld aan Pi, normale OpenAI-
  provideruitvoeringen, ACP-gespreksbindingen of andere harnesses.

### Codex-status voor handmatige beoordeling

Codex `config.toml`, native `hooks/hooks.json`, niet-gecureerde marketplaces en
gecachete Plugin-bundels die geen brongeinstalleerde gecureerde Plugins zijn, worden niet
automatisch geactiveerd. Ze worden gekopieerd of gerapporteerd in het migratierapport voor
handmatige beoordeling.

Voor gemigreerde brongeinstalleerde gecureerde Plugins schrijft toepassen:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: false`
- een expliciete Plugin-vermelding met `marketplaceName: "openai-curated"` en
  `pluginName` voor elke geselecteerde Plugin

Migratie schrijft nooit `plugins["*"]` en slaat nooit lokale cachepaden van marketplaces
op. Installaties waarvoor auth vereist is, worden gemeld op het betreffende Plugin-item met
`status: "skipped"`, `reason: "auth_required"` en opgeschoonde app-id's.
Hun expliciete configuratievermeldingen worden uitgeschakeld weggeschreven totdat je opnieuw autoriseert en
ze inschakelt. Andere installatiefouten zijn itemgebonden `error`-resultaten.

Als de Plugin-inventaris van de Codex-appserver tijdens planning niet beschikbaar is, valt migratie
terug op adviesitems uit gecachete bundels in plaats van de hele
migratie te laten mislukken.

## Hermes-provider

De gebundelde Hermes-provider detecteert standaard status op `~/.hermes`. Gebruik `--from <path>` wanneer Hermes ergens anders staat.

### Wat Hermes importeert

- Standaardmodelconfiguratie uit `config.yaml`.
- Geconfigureerde modelproviders en aangepaste OpenAI-compatibele eindpunten uit `providers` en `custom_providers`.
- MCP-serverdefinities uit `mcp_servers` of `mcp.servers`.
- `SOUL.md` en `AGENTS.md` naar de OpenClaw-agentwerkruimte.
- `memories/MEMORY.md` en `memories/USER.md` toegevoegd aan geheugenbestanden van de werkruimte.
- Geheugenconfiguratiestandaarden voor OpenClaw-bestandsgeheugen, plus archiefitems of items voor handmatige beoordeling voor externe geheugenproviders zoals Honcho.
- Skills die een `SKILL.md`-bestand bevatten onder `skills/<name>/`.
- Configuratiewaarden per skill uit `skills.config`.
- Ondersteunde API-sleutels uit `.env`, alleen met `--include-secrets`.

### Ondersteunde `.env`-sleutels

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Status alleen voor archief

Hermes-status die OpenClaw niet veilig kan interpreteren, wordt naar het migratierapport gekopieerd voor handmatige beoordeling, maar wordt niet geladen in live OpenClaw-configuratie of -inloggegevens. Dit bewaart ondoorzichtige of onveilige status zonder te doen alsof OpenClaw die automatisch kan uitvoeren of vertrouwen:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### Na toepassen

```bash
openclaw doctor
```

## Plugin-contract

Migratiebronnen zijn Plugins. Een Plugin declareert zijn provider-id's in `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Tijdens runtime roept de Plugin `api.registerMigrationProvider(...)` aan. De provider implementeert `detect`, `plan` en `apply`. Core bezit CLI-orchestratie, backupbeleid, prompts, JSON-uitvoer en conflictpreflight. Core geeft het beoordeelde plan door aan `apply(ctx, plan)`, en providers mogen het plan alleen opnieuw opbouwen wanneer dat argument ontbreekt voor compatibiliteit.

Provider-Plugins kunnen `openclaw/plugin-sdk/migration` gebruiken voor itemconstructie en samenvattende tellingen, plus `openclaw/plugin-sdk/migration-runtime` voor conflictbewuste bestandskopieen, rapportkopieen die alleen voor archief zijn, gecachete config-runtime-wrappers en migratierapporten.

## Integratie met onboarding

Onboarding kan migratie aanbieden wanneer een provider een bekende bron detecteert. Zowel `openclaw onboard --flow import` als `openclaw setup --wizard --import-from hermes` gebruiken dezelfde Plugin-migratieprovider en tonen nog steeds een voorbeeld voordat wordt toegepast.

<Note>
Onboarding-imports vereisen een nieuwe OpenClaw-installatie. Zet eerst de configuratie, referenties, sessies en de werkruimte terug als je al lokale staat hebt. Imports met back-up plus overschrijven of samenvoegen zijn voor bestaande installaties achter een feature gate geplaatst.
</Note>

## Gerelateerd

- [Migreren vanaf Hermes](/nl/install/migrating-hermes): gebruikersgerichte walkthrough.
- [Migreren vanaf Claude](/nl/install/migrating-claude): gebruikersgerichte walkthrough.
- [Migreren](/nl/install/migrating): verplaats OpenClaw naar een nieuwe machine.
- [Doctor](/nl/gateway/doctor): gezondheidscontrole na het toepassen van een migratie.
- [Plugins](/nl/tools/plugin): Plugin-installatie en -registratie.
