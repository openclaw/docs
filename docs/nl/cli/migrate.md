---
read_when:
    - Je wilt migreren van Hermes of een ander agentsysteem naar OpenClaw
    - Je voegt een Plugin-eigen migratieprovider toe
summary: CLI-referentie voor `openclaw migrate` (toestand importeren vanuit een ander agentsysteem)
title: Migreren
x-i18n:
    generated_at: "2026-05-12T00:58:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95d31d2995d426c7886700c9e0e6c6fa0c013a27c0bfe7cf91380c8029d6df89
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importeer status uit een ander agentsysteem via een migratieprovider die eigendom is van een plugin. Meegeleverde providers ondersteunen Codex CLI-status, [Claude](/nl/install/migrating-claude) en [Hermes](/nl/install/migrating-hermes); plugins van derden kunnen aanvullende providers registreren.

<Tip>
Zie voor gebruikersgerichte handleidingen [Migreren vanuit Claude](/nl/install/migrating-claude) en [Migreren vanuit Hermes](/nl/install/migrating-hermes). De [migratiehub](/nl/install/migrating) vermeldt alle paden.
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
  Naam van een geregistreerde migratieprovider, bijvoorbeeld `hermes`. Voer `openclaw migrate list` uit om geïnstalleerde providers te bekijken.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Bouw het plan en sluit af zonder de status te wijzigen.
</ParamField>
<ParamField path="--from <path>" type="string">
  Overschrijf de bronmap voor status. Hermes gebruikt standaard `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importeer ondersteunde aanmeldgegevens. Standaard uitgeschakeld.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Sta toe dat toepassen bestaande doelen vervangt wanneer het plan conflicten rapporteert.
</ParamField>
<ParamField path="--yes" type="boolean">
  Sla de bevestigingsprompt over. Vereist in niet-interactieve modus.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Selecteer één skill-kopieeritem op skillnaam of item-id. Herhaal de vlag om meerdere skills te migreren. Wanneer dit wordt weggelaten, tonen interactieve Codex-migraties een selectievakjeskiezer en behouden niet-interactieve migraties alle geplande skills.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Selecteer één Codex-plugininstallatie-item op pluginnaam of item-id. Herhaal de vlag om meerdere Codex-plugins te migreren. Wanneer dit wordt weggelaten, tonen interactieve Codex-migraties een native Codex-pluginselectievakjeskiezer en behouden niet-interactieve migraties alle geplande plugins. Dit geldt alleen voor brongeïnstalleerde `openai-curated` Codex-plugins die door de Codex app-serverinventaris zijn gevonden.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Sla de back-up vóór toepassen over. Vereist `--force` wanneer lokale OpenClaw-status bestaat.
</ParamField>
<ParamField path="--force" type="boolean">
  Vereist naast `--no-backup` wanneer toepassen anders zou weigeren de back-up over te slaan.
</ParamField>
<ParamField path="--json" type="boolean">
  Druk het plan of het toepassingsresultaat af als JSON. Met `--json` en zonder `--yes` drukt toepassen het plan af en wijzigt het de status niet.
</ParamField>

## Veiligheidsmodel

`openclaw migrate` werkt eerst met een voorbeeldweergave.

<AccordionGroup>
  <Accordion title="Preview before apply">
    De provider retourneert een gespecificeerd plan voordat er iets verandert, inclusief conflicten, overgeslagen items en gevoelige items. JSON-plannen, toepassingsuitvoer en migratierapporten redigeren geneste sleutels die op geheimen lijken, zoals API-sleutels, tokens, autorisatieheaders, cookies en wachtwoorden.

    `openclaw migrate apply <provider>` toont een voorbeeld van het plan en vraagt om bevestiging voordat de status wordt gewijzigd, tenzij `--yes` is ingesteld. In niet-interactieve modus vereist toepassen `--yes`.

  </Accordion>
  <Accordion title="Backups">
    Toepassen maakt en verifieert een OpenClaw-back-up voordat de migratie wordt toegepast. Als er nog geen lokale OpenClaw-status bestaat, wordt de back-upstap overgeslagen en kan de migratie doorgaan. Geef zowel `--no-backup` als `--force` door om een back-up over te slaan wanneer er status bestaat.
  </Accordion>
  <Accordion title="Conflicts">
    Toepassen weigert door te gaan wanneer het plan conflicten heeft. Controleer het plan en voer daarna opnieuw uit met `--overwrite` als het vervangen van bestaande doelen de bedoeling is. Providers kunnen nog steeds back-ups op itemniveau schrijven voor overschreven bestanden in de map met migratierapporten.
  </Accordion>
  <Accordion title="Secrets">
    Geheimen worden standaard nooit geïmporteerd. Gebruik `--include-secrets` om ondersteunde aanmeldgegevens te importeren.
  </Accordion>
</AccordionGroup>

## Claude-provider

De meegeleverde Claude-provider detecteert Claude Code-status standaard op `~/.claude`. Gebruik `--from <path>` om een specifieke Claude Code-home of projectroot te importeren.

<Tip>
Zie voor een gebruikersgerichte handleiding [Migreren vanuit Claude](/nl/install/migrating-claude).
</Tip>

### Wat Claude importeert

- Project-`CLAUDE.md` en `.claude/CLAUDE.md` naar de OpenClaw-agentworkspace.
- Gebruikers-`~/.claude/CLAUDE.md` toegevoegd aan workspace-`USER.md`.
- MCP-serverdefinities uit project-`.mcp.json`, Claude Code `~/.claude.json` en Claude Desktop `claude_desktop_config.json`.
- Claude-skillmappen die `SKILL.md` bevatten.
- Claude-opdracht-Markdown-bestanden geconverteerd naar OpenClaw-skills met alleen handmatige aanroep.

### Archief- en handmatige-beoordelingsstatus

Claude-hooks, permissies, omgevingsstandaarden, lokaal geheugen, padgebonden regels, subagents, caches, plannen en projectgeschiedenis worden bewaard in het migratierapport of gerapporteerd als items voor handmatige beoordeling. OpenClaw voert geen hooks uit, kopieert geen brede allowlists en importeert OAuth/Desktop-aanmeldgegevensstatus niet automatisch.

## Codex-provider

De meegeleverde Codex-provider detecteert Codex CLI-status standaard op `~/.codex`, of
op `CODEX_HOME` wanneer die omgevingsvariabele is ingesteld. Gebruik `--from <path>` om
een specifieke Codex-home te inventariseren.

Gebruik deze provider wanneer je overstapt naar de OpenClaw Codex-harness en bewust
nuttige persoonlijke Codex CLI-assets wilt promoveren. Lokale Codex app-server-
starts gebruiken per-agent-`CODEX_HOME`- en `HOME`-mappen, zodat ze standaard
je persoonlijke Codex CLI-status niet lezen.

Als je `openclaw migrate codex` uitvoert in een interactieve terminal, wordt eerst het volledige
plan getoond, waarna selectievakjeskiezers worden geopend vóór de uiteindelijke toepassingsbevestiging. Skill-
kopieeritems worden eerst gevraagd. Gebruik `Toggle all on` of `Toggle all off` voor bulk-
selectie; geplande skills beginnen aangevinkt, conflicterende skills beginnen uitgevinkt en
`Skip for now` slaat skill-kopieën voor deze uitvoering over terwijl nog steeds wordt doorgegaan naar plugin-
selectie. Wanneer brongeïnstalleerde gecureerde Codex-plugins migreerbaar zijn en
`--plugin` niet is opgegeven, vraagt de migratie daarna om native Codex-plugin-
activatie op pluginnaam. Plugin-items
beginnen aangevinkt tenzij de doelconfiguratie van de OpenClaw Codex-plugin die
plugin al heeft. Bestaande doelplugins beginnen uitgevinkt en tonen een conflicthint zoals
`conflict: plugin exists`; kies `Toggle all off` om in die uitvoering geen native Codex-
plugins te migreren, of `Skip for now` om te stoppen vóór toepassen. Geef voor gescripte of
exacte uitvoeringen `--skill <name>` één keer per skill door, bijvoorbeeld:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Gebruik `--plugin <name>` om native Codex-pluginmigratie niet-interactief te beperken
tot één of meer brongeïnstalleerde gecureerde plugins:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Wat Codex importeert

- Codex CLI-skillmappen onder `$CODEX_HOME/skills`, met uitzondering van Codex'
  `.system`-cache.
- Persoonlijke AgentSkills onder `$HOME/.agents/skills`, gekopieerd naar de huidige
  OpenClaw-agentworkspace wanneer je eigendom per agent wilt.
- Brongeïnstalleerde `openai-curated` Codex-plugins die via Codex
  app-server `plugin/list` zijn gevonden. Toepassen roept app-server `plugin/install` aan voor elke
  geselecteerde plugin, zelfs als de doel-app-server die plugin al als
  geïnstalleerd en ingeschakeld rapporteert. Gemigreerde Codex-plugins zijn alleen bruikbaar in sessies die
  de native Codex-harness selecteren; ze worden niet beschikbaar gemaakt voor Pi, normale OpenAI-
  provideruitvoeringen, ACP-gespreksbindingen of andere harnesses.

### Codex-status voor handmatige beoordeling

Codex `config.toml`, native `hooks/hooks.json`, niet-gecureerde marketplaces en
gecachete pluginbundels die geen brongeïnstalleerde gecureerde plugins zijn, worden niet
automatisch geactiveerd. Ze worden gekopieerd of gerapporteerd in het migratierapport voor
handmatige beoordeling.

Voor gemigreerde brongeïnstalleerde gecureerde plugins schrijft toepassen:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- één expliciete pluginvermelding met `marketplaceName: "openai-curated"` en
  `pluginName` voor elke geselecteerde plugin

Migratie schrijft nooit `plugins["*"]` en slaat nooit lokale marketplace-cache-
paden op. Installaties waarvoor autorisatie vereist is, worden gerapporteerd op het betrokken plugin-item met
`status: "skipped"`, `reason: "auth_required"` en opgeschoonde app-identificatoren.
Hun expliciete configuratievermeldingen worden uitgeschakeld geschreven totdat je opnieuw autoriseert en
ze inschakelt. Andere installatiefouten zijn itemgebonden `error`-resultaten.

Als Codex app-serverplugininventaris tijdens het plannen niet beschikbaar is, valt de migratie
terug op gecachete bundeladviesitems in plaats van de hele
migratie te laten mislukken.

## Hermes-provider

De meegeleverde Hermes-provider detecteert standaard status op `~/.hermes`. Gebruik `--from <path>` wanneer Hermes ergens anders staat.

### Wat Hermes importeert

- Standaardmodelconfiguratie uit `config.yaml`.
- Geconfigureerde modelproviders en aangepaste OpenAI-compatibele eindpunten uit `providers` en `custom_providers`.
- MCP-serverdefinities uit `mcp_servers` of `mcp.servers`.
- `SOUL.md` en `AGENTS.md` naar de OpenClaw-agentworkspace.
- `memories/MEMORY.md` en `memories/USER.md` toegevoegd aan workspacegeheugenbestanden.
- Geheugenconfiguratiestandaarden voor OpenClaw-bestandsgeheugen, plus archief- of handmatige-beoordelingsitems voor externe geheugenproviders zoals Honcho.
- Skills die een `SKILL.md`-bestand onder `skills/<name>/` bevatten.
- Configuratiewaarden per skill uit `skills.config`.
- Ondersteunde API-sleutels uit `.env`, alleen met `--include-secrets`.

### Ondersteunde `.env`-sleutels

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Alleen-archiefstatus

Hermes-status die OpenClaw niet veilig kan interpreteren, wordt naar het migratierapport gekopieerd voor handmatige beoordeling, maar wordt niet geladen in live OpenClaw-configuratie of aanmeldgegevens. Dit bewaart ondoorzichtige of onveilige status zonder te doen alsof OpenClaw deze automatisch kan uitvoeren of vertrouwen:

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

## Plugincontract

Migratiebronnen zijn plugins. Een plugin declareert zijn provider-id's in `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Tijdens runtime roept de plugin `api.registerMigrationProvider(...)` aan. De provider implementeert `detect`, `plan` en `apply`. Core beheert CLI-orkestratie, back-upbeleid, prompts, JSON-uitvoer en conflictpreflight. Core geeft het beoordeelde plan door aan `apply(ctx, plan)`, en providers mogen het plan alleen opnieuw bouwen wanneer dat argument ontbreekt voor compatibiliteit.

Providerplugins kunnen `openclaw/plugin-sdk/migration` gebruiken voor itemconstructie en samenvattingstellingen, plus `openclaw/plugin-sdk/migration-runtime` voor conflictbewuste bestandskopieën, alleen-archiefrapportkopieën, gecachete config-runtime-wrappers en migratierapporten.

## Onboarding-integratie

Onboarding kan migratie aanbieden wanneer een provider een bekende bron detecteert. Zowel `openclaw onboard --flow import` als `openclaw setup --wizard --import-from hermes` gebruiken dezelfde pluginmigratieprovider en tonen nog steeds een voorbeeldweergave vóór toepassen.

<Note>
Onboarding-imports vereisen een nieuwe OpenClaw-installatie. Reset eerst de configuratie, inloggegevens, sessies en de werkruimte als je al lokale state hebt. Importen met back-up plus overschrijven of samenvoegen zijn voor bestaande installaties achter een feature gate geplaatst.
</Note>

## Gerelateerd

- [Migreren vanaf Hermes](/nl/install/migrating-hermes): gebruikersgerichte walkthrough.
- [Migreren vanaf Claude](/nl/install/migrating-claude): gebruikersgerichte walkthrough.
- [Migreren](/nl/install/migrating): verplaats OpenClaw naar een nieuwe machine.
- [Doctor](/nl/gateway/doctor): statuscontrole na het toepassen van een migratie.
- [Plugins](/nl/tools/plugin): Plugininstallatie en -registratie.
