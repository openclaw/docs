---
read_when:
    - U wilt migreren van Hermes of een ander agentsysteem naar OpenClaw
    - Je voegt een Plugin-eigen migratieprovider toe
summary: CLI-referentie voor `openclaw migrate` (toestand importeren uit een ander agentsysteem)
title: Migreren
x-i18n:
    generated_at: "2026-04-30T20:05:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffcd9e874bdaa0a5195e712d4fccd7b3d53034cb362c7f7462e9c7df72477b1a
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importeer state uit een ander agentsysteem via een migratieprovider die eigendom is van een Plugin. Gebundelde providers ondersteunen Codex CLI-state, [Claude](/nl/install/migrating-claude) en [Hermes](/nl/install/migrating-hermes); Plugins van derden kunnen extra providers registreren.

<Tip>
Zie voor gebruikersgerichte stappenplannen [Migreren vanaf Claude](/nl/install/migrating-claude) en [Migreren vanaf Hermes](/nl/install/migrating-hermes). De [migratiehub](/nl/install/migrating) vermeldt alle paden.
</Tip>

## Commando's

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
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
  Bouw het plan en sluit af zonder state te wijzigen.
</ParamField>
<ParamField path="--from <path>" type="string">
  Overschrijf de bronmap voor state. Hermes gebruikt standaard `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importeer ondersteunde credentials. Standaard uitgeschakeld.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Sta toe dat apply bestaande doelen vervangt wanneer het plan conflicten meldt.
</ParamField>
<ParamField path="--yes" type="boolean">
  Sla de bevestigingsprompt over. Vereist in niet-interactieve modus.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Selecteer een Skill-kopieeritem op Skill-naam of item-id. Herhaal de flag om meerdere Skills te migreren. Wanneer weggelaten, tonen interactieve Codex-migraties een checkboxselector en behouden niet-interactieve migraties alle geplande Skills.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Sla de backup voor apply over. Vereist `--force` wanneer lokale OpenClaw-state bestaat.
</ParamField>
<ParamField path="--force" type="boolean">
  Vereist naast `--no-backup` wanneer apply anders zou weigeren de backup over te slaan.
</ParamField>
<ParamField path="--json" type="boolean">
  Print het plan of apply-resultaat als JSON. Met `--json` en zonder `--yes` print apply het plan en wijzigt het geen state.
</ParamField>

## Veiligheidsmodel

`openclaw migrate` werkt met preview eerst.

<AccordionGroup>
  <Accordion title="Preview voor apply">
    De provider retourneert een gespecificeerd plan voordat er iets verandert, inclusief conflicten, overgeslagen items en gevoelige items. JSON-plannen, apply-uitvoer en migratierapporten redigeren geneste sleutels die op geheimen lijken, zoals API-sleutels, tokens, autorisatieheaders, cookies en wachtwoorden.

    `openclaw migrate apply <provider>` toont een preview van het plan en vraagt om bevestiging voordat state wordt gewijzigd, tenzij `--yes` is ingesteld. In niet-interactieve modus vereist apply `--yes`.

  </Accordion>
  <Accordion title="Backups">
    Apply maakt en verifieert een OpenClaw-backup voordat de migratie wordt toegepast. Als er nog geen lokale OpenClaw-state bestaat, wordt de backupstap overgeslagen en kan de migratie doorgaan. Geef zowel `--no-backup` als `--force` mee om een backup over te slaan wanneer state bestaat.
  </Accordion>
  <Accordion title="Conflicten">
    Apply weigert door te gaan wanneer het plan conflicten bevat. Controleer het plan en voer daarna opnieuw uit met `--overwrite` als het opzettelijk is om bestaande doelen te vervangen. Providers kunnen nog steeds backups op itemniveau schrijven voor overschreven bestanden in de map met migratierapporten.
  </Accordion>
  <Accordion title="Geheimen">
    Geheimen worden standaard nooit geimporteerd. Gebruik `--include-secrets` om ondersteunde credentials te importeren.
  </Accordion>
</AccordionGroup>

## Claude-provider

De gebundelde Claude-provider detecteert standaard Claude Code-state op `~/.claude`. Gebruik `--from <path>` om een specifieke Claude Code-home of projectroot te importeren.

<Tip>
Zie [Migreren vanaf Claude](/nl/install/migrating-claude) voor een gebruikersgericht stappenplan.
</Tip>

### Wat Claude importeert

- Project-`CLAUDE.md` en `.claude/CLAUDE.md` naar de OpenClaw-agentwerkruimte.
- Gebruikers-`~/.claude/CLAUDE.md` toegevoegd aan werkruimte-`USER.md`.
- MCP-serverdefinities uit project-`.mcp.json`, Claude Code `~/.claude.json` en Claude Desktop `claude_desktop_config.json`.
- Claude-Skill-mappen die `SKILL.md` bevatten.
- Claude-command Markdown-bestanden geconverteerd naar OpenClaw-Skills met alleen handmatige aanroep.

### Gearchiveerde state en state voor handmatige review

Claude-hooks, permissies, omgevingsdefaults, lokaal geheugen, padgebonden regels, subagents, caches, plannen en projectgeschiedenis worden bewaard in het migratierapport of gemeld als items voor handmatige review. OpenClaw voert hooks niet uit, kopieert geen brede allowlists en importeert OAuth/Desktop-credentialstate niet automatisch.

## Codex-provider

De gebundelde Codex-provider detecteert standaard Codex CLI-state op `~/.codex`, of
op `CODEX_HOME` wanneer die omgevingsvariabele is ingesteld. Gebruik `--from <path>` om
een specifieke Codex-home te inventariseren.

Gebruik deze provider wanneer je overstapt naar de OpenClaw Codex-harness en nuttige
persoonlijke Codex CLI-assets bewust wilt promoveren. Lokale Codex-app-serverstarts
gebruiken per-agent `CODEX_HOME`- en `HOME`-mappen, dus die lezen standaard niet
je persoonlijke Codex CLI-state.

Als je `openclaw migrate codex` uitvoert in een interactieve terminal, wordt eerst het volledige
plan getoond en daarna wordt een checkboxselector geopend voor Skill-kopieeritems voordat de laatste
apply-bevestiging verschijnt. Alle Skills zijn in eerste instantie geselecteerd; vink elke Skill uit die je niet
naar deze agent wilt kopieren. Geef voor scripts of exacte runs `--skill <name>` eenmaal
per Skill mee, bijvoorbeeld:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Wat Codex importeert

- Codex CLI-Skill-mappen onder `$CODEX_HOME/skills`, met uitsluiting van Codex'
  `.system`-cache.
- Persoonlijke AgentSkills onder `$HOME/.agents/skills`, gekopieerd naar de huidige
  OpenClaw-agentwerkruimte wanneer je eigenaarschap per agent wilt.

### Codex-state voor handmatige review

Codex-native Plugins, `config.toml` en native `hooks/hooks.json` worden niet
automatisch geactiveerd. Plugins kunnen MCP-servers, apps, hooks of ander
uitvoerbaar gedrag beschikbaar maken, dus de provider meldt ze voor review in plaats van ze
in OpenClaw te laden. Config- en hookbestanden worden naar het migratierapport gekopieerd
voor handmatige review.

## Hermes-provider

De gebundelde Hermes-provider detecteert standaard state op `~/.hermes`. Gebruik `--from <path>` wanneer Hermes elders staat.

### Wat Hermes importeert

- Standaardmodelconfiguratie uit `config.yaml`.
- Geconfigureerde modelproviders en aangepaste OpenAI-compatibele endpoints uit `providers` en `custom_providers`.
- MCP-serverdefinities uit `mcp_servers` of `mcp.servers`.
- `SOUL.md` en `AGENTS.md` naar de OpenClaw-agentwerkruimte.
- `memories/MEMORY.md` en `memories/USER.md` toegevoegd aan geheugenbestanden in de werkruimte.
- Geheugenconfiguratiedefaults voor OpenClaw-bestandsgeheugen, plus archiveer- of handmatige-reviewitems voor externe geheugenproviders zoals Honcho.
- Skills die een `SKILL.md`-bestand bevatten onder `skills/<name>/`.
- Configuratiewaarden per Skill uit `skills.config`.
- Ondersteunde API-sleutels uit `.env`, alleen met `--include-secrets`.

### Ondersteunde `.env`-sleutels

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Alleen gearchiveerde state

Hermes-state die OpenClaw niet veilig kan interpreteren, wordt naar het migratierapport gekopieerd voor handmatige review, maar wordt niet geladen in live OpenClaw-configuratie of credentials. Dit bewaart ondoorzichtige of onveilige state zonder te doen alsof OpenClaw deze automatisch kan uitvoeren of vertrouwen:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### Na apply

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

Tijdens runtime roept de Plugin `api.registerMigrationProvider(...)` aan. De provider implementeert `detect`, `plan` en `apply`. Core is eigenaar van CLI-orchestratie, backupbeleid, prompts, JSON-uitvoer en conflictpreflight. Core geeft het gereviewde plan door aan `apply(ctx, plan)`, en providers mogen het plan alleen opnieuw opbouwen wanneer dat argument ontbreekt voor compatibiliteit.

Provider-Plugins kunnen `openclaw/plugin-sdk/migration` gebruiken voor itemconstructie en samenvattingstellingen, plus `openclaw/plugin-sdk/migration-runtime` voor conflictbewuste bestandskopieen, archive-only rapportkopieen, gecachte config-runtime wrappers en migratierapporten.

## Onboarding-integratie

Onboarding kan migratie aanbieden wanneer een provider een bekende bron detecteert. Zowel `openclaw onboard --flow import` als `openclaw setup --wizard --import-from hermes` gebruiken dezelfde Plugin-migratieprovider en tonen nog steeds een preview voordat apply wordt uitgevoerd.

<Note>
Onboarding-imports vereisen een verse OpenClaw-setup. Reset eerst configuratie, credentials, sessies en de werkruimte als je al lokale state hebt. Backup-plus-overschrijven of merge-imports zijn feature-gated voor bestaande setups.
</Note>

## Gerelateerd

- [Migreren vanaf Hermes](/nl/install/migrating-hermes): gebruikersgericht stappenplan.
- [Migreren vanaf Claude](/nl/install/migrating-claude): gebruikersgericht stappenplan.
- [Migreren](/nl/install/migrating): verplaats OpenClaw naar een nieuwe machine.
- [Doctor](/nl/gateway/doctor): gezondheidscontrole na het toepassen van een migratie.
- [Plugins](/nl/tools/plugin): Plugin-installatie en registratie.
