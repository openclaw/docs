---
read_when:
    - Je wilt migreren van Hermes of een ander agentsysteem naar OpenClaw
    - Je voegt een Plugin-eigen migratieprovider toe
summary: CLI-referentie voor `openclaw migrate` (toestand importeren uit een ander agentsysteem)
title: Migreren
x-i18n:
    generated_at: "2026-04-29T22:33:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3db14c16b8f9dcbf86a4f12558cf4e8555aa9a255637034fb804148996a225e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importeer status uit een ander agentsysteem via een door een plugin beheerde migratieprovider. Meegeleverde providers ondersteunen [Claude](/nl/install/migrating-claude) en [Hermes](/nl/install/migrating-hermes); plugins van derden kunnen extra providers registreren.

<Tip>
Zie voor gebruikersgerichte stappenplannen [Migreren vanaf Claude](/nl/install/migrating-claude) en [Migreren vanaf Hermes](/nl/install/migrating-hermes). De [migratiehub](/nl/install/migrating) vermeldt alle paden.
</Tip>

## Opdrachten

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
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
  Stel het plan op en sluit af zonder de status te wijzigen.
</ParamField>
<ParamField path="--from <path>" type="string">
  Overschrijf de bronmap voor status. Hermes gebruikt standaard `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importeer ondersteunde referenties. Standaard uitgeschakeld.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Sta toe dat toepassen bestaande doelen vervangt wanneer het plan conflicten meldt.
</ParamField>
<ParamField path="--yes" type="boolean">
  Sla de bevestigingsprompt over. Vereist in niet-interactieve modus.
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
  <Accordion title="Voorbeeldweergave vóór toepassen">
    De provider retourneert een puntsgewijs plan voordat er iets verandert, inclusief conflicten, overgeslagen items en gevoelige items. JSON-plannen, toepassingsuitvoer en migratierapporten redigeren geneste sleutels die op geheimen lijken, zoals API-sleutels, tokens, autorisatieheaders, cookies en wachtwoorden.

    `openclaw migrate apply <provider>` toont een voorbeeldweergave van het plan en vraagt om bevestiging voordat de status wordt gewijzigd, tenzij `--yes` is ingesteld. In niet-interactieve modus vereist toepassen `--yes`.

  </Accordion>
  <Accordion title="Back-ups">
    Toepassen maakt en verifieert een OpenClaw-back-up voordat de migratie wordt toegepast. Als er nog geen lokale OpenClaw-status bestaat, wordt de back-upstap overgeslagen en kan de migratie doorgaan. Geef zowel `--no-backup` als `--force` mee om een back-up over te slaan wanneer status bestaat.
  </Accordion>
  <Accordion title="Conflicten">
    Toepassen weigert door te gaan wanneer het plan conflicten bevat. Controleer het plan en voer daarna opnieuw uit met `--overwrite` als het vervangen van bestaande doelen de bedoeling is. Providers kunnen in de migratierapportmap nog steeds back-ups op itemniveau schrijven voor overschreven bestanden.
  </Accordion>
  <Accordion title="Geheimen">
    Geheimen worden standaard nooit geïmporteerd. Gebruik `--include-secrets` om ondersteunde referenties te importeren.
  </Accordion>
</AccordionGroup>

## Claude-provider

De meegeleverde Claude-provider detecteert standaard Claude Code-status op `~/.claude`. Gebruik `--from <path>` om een specifieke Claude Code-home of projectroot te importeren.

<Tip>
Zie voor een gebruikersgericht stappenplan [Migreren vanaf Claude](/nl/install/migrating-claude).
</Tip>

### Wat Claude importeert

- Project-`CLAUDE.md` en `.claude/CLAUDE.md` naar de OpenClaw-agentwerkruimte.
- Gebruikers-`~/.claude/CLAUDE.md` toegevoegd aan werkruimte-`USER.md`.
- MCP-serverdefinities uit project-`.mcp.json`, Claude Code-`~/.claude.json` en Claude Desktop-`claude_desktop_config.json`.
- Claude-skillmappen die `SKILL.md` bevatten.
- Claude-opdracht-Markdown-bestanden geconverteerd naar OpenClaw-Skills met alleen handmatige aanroep.

### Archief- en handmatige-controle-status

Claude-hooks, machtigingen, omgevingsstandaarden, lokaal geheugen, padgebonden regels, subagents, caches, plannen en projectgeschiedenis worden bewaard in het migratierapport of gemeld als items voor handmatige controle. OpenClaw voert geen hooks uit, kopieert geen brede toestemmingslijsten en importeert OAuth-/Desktop-referentiestatus niet automatisch.

## Hermes-provider

De meegeleverde Hermes-provider detecteert standaard status op `~/.hermes`. Gebruik `--from <path>` wanneer Hermes ergens anders staat.

### Wat Hermes importeert

- Standaardmodelconfiguratie uit `config.yaml`.
- Geconfigureerde modelproviders en aangepaste OpenAI-compatibele endpoints uit `providers` en `custom_providers`.
- MCP-serverdefinities uit `mcp_servers` of `mcp.servers`.
- `SOUL.md` en `AGENTS.md` naar de OpenClaw-agentwerkruimte.
- `memories/MEMORY.md` en `memories/USER.md` toegevoegd aan werkruimtegeheugenbestanden.
- Geheugenconfiguratiestandaarden voor OpenClaw-bestandsgeheugen, plus archief- of handmatige-controle-items voor externe geheugenproviders zoals Honcho.
- Skills die een `SKILL.md`-bestand bevatten onder `skills/<name>/`.
- Configuratiewaarden per Skill uit `skills.config`.
- Ondersteunde API-sleutels uit `.env`, alleen met `--include-secrets`.

### Ondersteunde `.env`-sleutels

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Status alleen voor archief

Hermes-status die OpenClaw niet veilig kan interpreteren, wordt voor handmatige controle naar het migratierapport gekopieerd, maar wordt niet geladen in live OpenClaw-configuratie of -referenties. Dit bewaart ondoorzichtige of onveilige status zonder te doen alsof OpenClaw die automatisch kan uitvoeren of vertrouwen:

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

Migratiebronnen zijn plugins. Een plugin declareert zijn provider-id's in `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Tijdens runtime roept de plugin `api.registerMigrationProvider(...)` aan. De provider implementeert `detect`, `plan` en `apply`. Core beheert CLI-orkestratie, back-upbeleid, prompts, JSON-uitvoer en conflictcontrole vooraf. Core geeft het beoordeelde plan door aan `apply(ctx, plan)`, en providers mogen het plan alleen opnieuw opbouwen wanneer dat argument ontbreekt voor compatibiliteit.

Providerplugins kunnen `openclaw/plugin-sdk/migration` gebruiken voor itemconstructie en samenvattingstellingen, plus `openclaw/plugin-sdk/migration-runtime` voor conflictbewuste bestandskopieën, rapportkopieën alleen voor archief, gecachete config-runtime-wrappers en migratierapporten.

## Integratie met onboarding

Onboarding kan migratie aanbieden wanneer een provider een bekende bron detecteert. Zowel `openclaw onboard --flow import` als `openclaw setup --wizard --import-from hermes` gebruiken dezelfde pluginmigratieprovider en tonen nog steeds een voorbeeldweergave vóór toepassen.

<Note>
Onboarding-imports vereisen een nieuwe OpenClaw-installatie. Reset eerst configuratie, referenties, sessies en de werkruimte als je al lokale status hebt. Back-up-plus-overschrijven of samenvoegimports zijn feature-gated voor bestaande installaties.
</Note>

## Gerelateerd

- [Migreren vanaf Hermes](/nl/install/migrating-hermes): gebruikersgericht stappenplan.
- [Migreren vanaf Claude](/nl/install/migrating-claude): gebruikersgericht stappenplan.
- [Migreren](/nl/install/migrating): verplaats OpenClaw naar een nieuwe machine.
- [Doctor](/nl/gateway/doctor): gezondheidscontrole na het toepassen van een migratie.
- [Plugins](/nl/tools/plugin): plugininstallatie en -registratie.
