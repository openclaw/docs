---
read_when:
    - Je wilt migreren van Hermes of een ander agentsysteem naar OpenClaw
    - Je voegt een Plugin-eigen migratieprovider toe
summary: CLI-referentie voor `openclaw migrate` (status importeren uit een ander agentsysteem)
title: Migreren
x-i18n:
    generated_at: "2026-05-06T09:06:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021d673f6e51f5c2320278f0a37830c9aa34cdb4628932be1c09714c375066e3
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importeer status vanuit een ander agentsysteem via een door een plugin beheerde migratieprovider. Gebundelde providers ondersteunen status van Codex CLI, [Claude](/nl/install/migrating-claude) en [Hermes](/nl/install/migrating-hermes); plugins van derden kunnen extra providers registreren.

<Tip>
Voor gebruikersgerichte stappenplannen, zie [Migreren vanaf Claude](/nl/install/migrating-claude) en [Migreren vanaf Hermes](/nl/install/migrating-hermes). De [migratiehub](/nl/install/migrating) vermeldt alle paden.
</Tip>

## Opdrachten

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
  Bouw het plan en sluit af zonder status te wijzigen.
</ParamField>
<ParamField path="--from <path>" type="string">
  Overschrijf de bronmap voor status. Hermes gebruikt standaard `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importeer ondersteunde referenties. Standaard uitgeschakeld.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Sta toe dat apply bestaande doelen vervangt wanneer het plan conflicten meldt.
</ParamField>
<ParamField path="--yes" type="boolean">
  Sla de bevestigingsprompt over. Vereist in niet-interactieve modus.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Selecteer een skill-kopieeritem op skillnaam of item-id. Herhaal de vlag om meerdere skills te migreren. Wanneer weggelaten, tonen interactieve Codex-migraties een selectievakjeskiezer en behouden niet-interactieve migraties alle geplande skills.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Sla de pre-apply-back-up over. Vereist `--force` wanneer lokale OpenClaw-status bestaat.
</ParamField>
<ParamField path="--force" type="boolean">
  Vereist naast `--no-backup` wanneer apply anders zou weigeren de back-up over te slaan.
</ParamField>
<ParamField path="--json" type="boolean">
  Druk het plan of apply-resultaat af als JSON. Met `--json` en zonder `--yes` drukt apply het plan af en muteert geen status.
</ParamField>

## Veiligheidsmodel

`openclaw migrate` werkt eerst met een voorbeeldweergave.

<AccordionGroup>
  <Accordion title="Preview before apply">
    De provider retourneert een opgesomd plan voordat er iets verandert, inclusief conflicten, overgeslagen items en gevoelige items. JSON-plannen, apply-uitvoer en migratierapporten redigeren geneste sleutels die op geheimen lijken, zoals API-sleutels, tokens, autorisatieheaders, cookies en wachtwoorden.

    `openclaw migrate apply <provider>` toont een voorbeeld van het plan en vraagt om bevestiging voordat status wordt gewijzigd, tenzij `--yes` is ingesteld. In niet-interactieve modus vereist apply `--yes`.

  </Accordion>
  <Accordion title="Backups">
    Apply maakt en verifieert een OpenClaw-back-up voordat de migratie wordt toegepast. Als er nog geen lokale OpenClaw-status bestaat, wordt de back-upstap overgeslagen en kan de migratie doorgaan. Geef zowel `--no-backup` als `--force` door om een back-up over te slaan wanneer status bestaat.
  </Accordion>
  <Accordion title="Conflicts">
    Apply weigert door te gaan wanneer het plan conflicten heeft. Bekijk het plan en voer daarna opnieuw uit met `--overwrite` als het vervangen van bestaande doelen opzettelijk is. Providers kunnen nog steeds back-ups op itemniveau schrijven voor overschreven bestanden in de map met migratierapporten.
  </Accordion>
  <Accordion title="Secrets">
    Geheimen worden standaard nooit geimporteerd. Gebruik `--include-secrets` om ondersteunde referenties te importeren.
  </Accordion>
</AccordionGroup>

## Claude-provider

De gebundelde Claude-provider detecteert standaard Claude Code-status in `~/.claude`. Gebruik `--from <path>` om een specifieke Claude Code-home of projectroot te importeren.

<Tip>
Voor een gebruikersgericht stappenplan, zie [Migreren vanaf Claude](/nl/install/migrating-claude).
</Tip>

### Wat Claude importeert

- Project-`CLAUDE.md` en `.claude/CLAUDE.md` naar de OpenClaw-agentwerkruimte.
- Gebruikers-`~/.claude/CLAUDE.md` toegevoegd aan werkruimte-`USER.md`.
- MCP-serverdefinities uit project-`.mcp.json`, Claude Code `~/.claude.json` en Claude Desktop `claude_desktop_config.json`.
- Claude-skillmappen die `SKILL.md` bevatten.
- Claude-opdracht-Markdownbestanden omgezet naar OpenClaw-skills met alleen handmatige aanroep.

### Archief- en handmatige-beoordelingsstatus

Claude-hooks, machtigingen, omgevingsstandaarden, lokaal geheugen, padgebonden regels, subagents, caches, plannen en projectgeschiedenis worden bewaard in het migratierapport of gemeld als items voor handmatige beoordeling. OpenClaw voert geen hooks uit, kopieert geen brede allowlists en importeert OAuth/Desktop-referentiestatus niet automatisch.

## Codex-provider

De gebundelde Codex-provider detecteert standaard Codex CLI-status in `~/.codex`, of
in `CODEX_HOME` wanneer die omgevingsvariabele is ingesteld. Gebruik `--from <path>` om
een specifieke Codex-home te inventariseren.

Gebruik deze provider wanneer je overstapt naar de OpenClaw Codex-harness en nuttige persoonlijke Codex CLI-assets doelbewust wilt promoveren. Lokale Codex-app-serverstarts gebruiken per-agent `CODEX_HOME`- en `HOME`-mappen, dus ze lezen standaard je persoonlijke Codex CLI-status niet.

Het uitvoeren van `openclaw migrate codex` in een interactieve terminal toont een voorbeeld van het volledige plan en opent daarna een selectievakjeskiezer voor skill-kopieeritems vóór de uiteindelijke apply-bevestiging. Gebruik `Toggle all on` of `Toggle all off` voor bulkselectie; geplande skills beginnen aangevinkt, conflicterende skills beginnen uitgevinkt en `Skip for now` laat skills ongewijzigd zonder toe te passen. Geef voor gescripte of exacte runs `--skill <name>` eenmaal per skill door, bijvoorbeeld:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Wat Codex importeert

- Codex CLI-skillmappen onder `$CODEX_HOME/skills`, met uitzondering van Codex' `.system`-cache.
- Persoonlijke AgentSkills onder `$HOME/.agents/skills`, gekopieerd naar de huidige OpenClaw-agentwerkruimte wanneer je eigendom per agent wilt.

### Codex-status voor handmatige beoordeling

Native Codex-plugins, `config.toml` en native `hooks/hooks.json` worden niet automatisch geactiveerd. Plugins kunnen MCP-servers, apps, hooks of ander uitvoerbaar gedrag blootstellen, dus de provider rapporteert ze ter beoordeling in plaats van ze in OpenClaw te laden. Configuratie- en hookbestanden worden naar het migratierapport gekopieerd voor handmatige beoordeling.

## Hermes-provider

De gebundelde Hermes-provider detecteert standaard status in `~/.hermes`. Gebruik `--from <path>` wanneer Hermes elders staat.

### Wat Hermes importeert

- Standaardmodelconfiguratie uit `config.yaml`.
- Geconfigureerde modelproviders en aangepaste OpenAI-compatibele endpoints uit `providers` en `custom_providers`.
- MCP-serverdefinities uit `mcp_servers` of `mcp.servers`.
- `SOUL.md` en `AGENTS.md` naar de OpenClaw-agentwerkruimte.
- `memories/MEMORY.md` en `memories/USER.md` toegevoegd aan geheugensbestanden van de werkruimte.
- Geheugenconfiguratiestandaarden voor OpenClaw-bestandsgeheugen, plus archief- of handmatige-beoordelingsitems voor externe geheugenproviders zoals Honcho.
- Skills die een `SKILL.md`-bestand bevatten onder `skills/<name>/`.
- Configuratiewaarden per skill uit `skills.config`.
- Ondersteunde API-sleutels uit `.env`, alleen met `--include-secrets`.

### Ondersteunde `.env`-sleutels

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Alleen-archiefstatus

Hermes-status die OpenClaw niet veilig kan interpreteren, wordt naar het migratierapport gekopieerd voor handmatige beoordeling, maar wordt niet geladen in live OpenClaw-configuratie of -referenties. Dit behoudt ondoorzichtige of onveilige status zonder te doen alsof OpenClaw die automatisch kan uitvoeren of vertrouwen:

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

Tijdens runtime roept de plugin `api.registerMigrationProvider(...)` aan. De provider implementeert `detect`, `plan` en `apply`. Core beheert CLI-orchestratie, back-upbeleid, prompts, JSON-uitvoer en conflict-preflight. Core geeft het beoordeelde plan door aan `apply(ctx, plan)`, en providers mogen het plan alleen opnieuw bouwen wanneer dat argument ontbreekt voor compatibiliteit.

Providerplugins kunnen `openclaw/plugin-sdk/migration` gebruiken voor itemconstructie en samenvattingstellingen, plus `openclaw/plugin-sdk/migration-runtime` voor conflictbewuste bestandskopieen, alleen-archief rapportkopieen, gecachete config-runtime-wrappers en migratierapporten.

## Onboarding-integratie

Onboarding kan migratie aanbieden wanneer een provider een bekende bron detecteert. Zowel `openclaw onboard --flow import` als `openclaw setup --wizard --import-from hermes` gebruikt dezelfde pluginmigratieprovider en toont nog steeds een voorbeeld vóór toepassing.

<Note>
Onboarding-imports vereisen een nieuwe OpenClaw-installatie. Reset eerst configuratie, referenties, sessies en de werkruimte als je al lokale status hebt. Back-up-plus-overschrijven of samenvoegimports zijn feature-gated voor bestaande installaties.
</Note>

## Gerelateerd

- [Migreren vanaf Hermes](/nl/install/migrating-hermes): gebruikersgericht stappenplan.
- [Migreren vanaf Claude](/nl/install/migrating-claude): gebruikersgericht stappenplan.
- [Migreren](/nl/install/migrating): verplaats OpenClaw naar een nieuwe machine.
- [Doctor](/nl/gateway/doctor): gezondheidscontrole na het toepassen van een migratie.
- [Plugins](/nl/tools/plugin): plugininstallatie en -registratie.
