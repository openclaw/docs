---
read_when:
    - Je wilt migreren van Hermes of een ander agentsysteem naar OpenClaw
    - Je voegt een Plugin-eigen migratieprovider toe
summary: CLI-referentie voor `openclaw migrate` (toestand importeren uit een ander agentsysteem)
title: Migreren
x-i18n:
    generated_at: "2026-05-12T23:30:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5103a85404f0204cc265df611449e9cd4b18347c6862a8b36d13838709896459
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importeer status vanuit een ander agentsysteem via een door een Plugin beheerde migratieprovider. Meegeleverde providers dekken Codex CLI-status, [Claude](/nl/install/migrating-claude) en [Hermes](/nl/install/migrating-hermes); externe Plugins kunnen aanvullende providers registreren.

<Tip>
Voor gebruikersgerichte walkthroughs, zie [Migreren vanaf Claude](/nl/install/migrating-claude) en [Migreren vanaf Hermes](/nl/install/migrating-hermes). De [migratiehub](/nl/install/migrating) vermeldt alle paden.
</Tip>

## Opdrachten

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
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
  Naam van een geregistreerde migratieprovider, bijvoorbeeld `hermes`. Voer `openclaw migrate list` uit om geïnstalleerde providers te zien.
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
  Sta toe dat toepassen bestaande doelen vervangt wanneer het plan conflicten meldt.
</ParamField>
<ParamField path="--yes" type="boolean">
  Sla de bevestigingsprompt over. Vereist in niet-interactieve modus.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Selecteer één item voor het kopiëren van een skill op skillnaam of item-id. Herhaal de vlag om meerdere Skills te migreren. Wanneer weggelaten, tonen interactieve Codex-migraties een selectievakjeskiezer en behouden niet-interactieve migraties alle geplande Skills.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Selecteer één Codex Plugin-installatie-item op Pluginnaam of item-id. Herhaal de vlag om meerdere Codex-Plugins te migreren. Wanneer weggelaten, tonen interactieve Codex-migraties een native Codex Plugin-selectievakjeskiezer en behouden niet-interactieve migraties alle geplande Plugins. Dit is alleen van toepassing op vanuit de bron geïnstalleerde `openai-curated` Codex-Plugins die door de inventaris van de Codex app-server zijn gevonden.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Alleen Codex. Forceer een nieuwe traversal van de bron-Codex app-server `app/list` voordat native Plugin-activering wordt gepland. Standaard uitgeschakeld om migratieplanning snel te houden.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Sla de back-up voorafgaand aan toepassen over. Vereist `--force` wanneer lokale OpenClaw-status bestaat.
</ParamField>
<ParamField path="--force" type="boolean">
  Vereist naast `--no-backup` wanneer toepassen anders zou weigeren de back-up over te slaan.
</ParamField>
<ParamField path="--json" type="boolean">
  Druk het plan of het toepassingsresultaat af als JSON. Met `--json` en zonder `--yes` drukt toepassen het plan af en muteert het de status niet.
</ParamField>

## Veiligheidsmodel

`openclaw migrate` is eerst een preview.

<AccordionGroup>
  <Accordion title="Preview vóór toepassen">
    De provider retourneert een uitgesplitst plan voordat er iets verandert, inclusief conflicten, overgeslagen items en gevoelige items. JSON-plannen, toepassingsuitvoer en migratierapporten redigeren geneste sleutels die op geheimen lijken, zoals API-sleutels, tokens, autorisatieheaders, cookies en wachtwoorden.

    `openclaw migrate apply <provider>` toont een preview van het plan en vraagt om bevestiging voordat de status wordt gewijzigd, tenzij `--yes` is ingesteld. In niet-interactieve modus vereist toepassen `--yes`.

  </Accordion>
  <Accordion title="Back-ups">
    Toepassen maakt en verifieert een OpenClaw-back-up voordat de migratie wordt toegepast. Als er nog geen lokale OpenClaw-status bestaat, wordt de back-upstap overgeslagen en kan de migratie doorgaan. Om een back-up over te slaan wanneer status bestaat, geef je zowel `--no-backup` als `--force` door.
  </Accordion>
  <Accordion title="Conflicten">
    Toepassen weigert door te gaan wanneer het plan conflicten bevat. Bekijk het plan en voer daarna opnieuw uit met `--overwrite` als het vervangen van bestaande doelen de bedoeling is. Providers kunnen nog steeds back-ups op itemniveau schrijven voor overschreven bestanden in de map met migratierapporten.
  </Accordion>
  <Accordion title="Geheimen">
    Geheimen worden standaard nooit geïmporteerd. Gebruik `--include-secrets` om ondersteunde referenties te importeren.
  </Accordion>
</AccordionGroup>

## Claude-provider

De meegeleverde Claude-provider detecteert standaard Claude Code-status op `~/.claude`. Gebruik `--from <path>` om een specifieke Claude Code-home of projectroot te importeren.

<Tip>
Voor een gebruikersgerichte walkthrough, zie [Migreren vanaf Claude](/nl/install/migrating-claude).
</Tip>

### Wat Claude importeert

- Project-`CLAUDE.md` en `.claude/CLAUDE.md` naar de OpenClaw-agentwerkruimte.
- Gebruikers-`~/.claude/CLAUDE.md` toegevoegd aan werkruimte-`USER.md`.
- MCP-serverdefinities uit project-`.mcp.json`, Claude Code `~/.claude.json` en Claude Desktop `claude_desktop_config.json`.
- Claude-skillmappen die `SKILL.md` bevatten.
- Markdown-bestanden voor Claude-opdrachten geconverteerd naar OpenClaw Skills met alleen handmatige aanroep.

### Archief- en handmatige-reviewstatus

Claude-hooks, machtigingen, omgevingsstandaarden, lokaal geheugen, padgebonden regels, subagents, caches, plannen en projectgeschiedenis worden bewaard in het migratierapport of gerapporteerd als items voor handmatige review. OpenClaw voert hooks niet uit, kopieert geen brede allowlists en importeert OAuth/Desktop-referentiestatus niet automatisch.

## Codex-provider

De meegeleverde Codex-provider detecteert standaard Codex CLI-status op `~/.codex`, of
op `CODEX_HOME` wanneer die omgevingsvariabele is ingesteld. Gebruik `--from <path>` om
een specifieke Codex-home te inventariseren.

Gebruik deze provider wanneer je overstapt naar de OpenClaw Codex-harness en je
nuttige persoonlijke Codex CLI-assets bewust wilt promoveren. Lokale Codex app-server-
starts gebruiken per-agent `CODEX_HOME`- en `HOME`-mappen, dus ze lezen standaard
je persoonlijke Codex CLI-status niet.

Het uitvoeren van `openclaw migrate codex` in een interactieve terminal toont eerst een preview van het volledige
plan en opent daarna selectievakjeskiezers vóór de definitieve bevestiging voor toepassen. Items voor het kopiëren van Skills
worden eerst gevraagd. Gebruik `Toggle all on` of `Toggle all off` voor bulkselectie.
Druk op Spatie om rijen om te schakelen, of druk op Enter om de gemarkeerde
rij te activeren en door te gaan. Geplande Skills beginnen aangevinkt, Skills met conflicten beginnen uitgevinkt, en
`Skip for now` slaat skillkopieën voor deze uitvoering over terwijl de Plugin-
selectie nog steeds doorgaat. Wanneer vanuit de bron geïnstalleerde samengestelde Codex-Plugins migreerbaar zijn en
`--plugin` niet is opgegeven, vraagt migratie daarna om native Codex Plugin-
activering op Pluginnaam. Plugin-items
beginnen aangevinkt, tenzij de doelconfiguratie van de OpenClaw Codex Plugin die
Plugin al heeft. Bestaande doel-Plugins beginnen uitgevinkt en tonen een conflict-hint zoals
`conflict: plugin exists`; kies `Toggle all off` om in die uitvoering geen native Codex-
Plugins te migreren, of `Skip for now` om te stoppen vóór toepassen. Voor gescripte of
exacte uitvoeringen geef je `--skill <name>` één keer per skill door, bijvoorbeeld:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Gebruik `--plugin <name>` om native Codex Plugin-migratie niet-interactief
te beperken tot één of meer vanuit de bron geïnstalleerde samengestelde Plugins:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Wat Codex importeert

- Codex CLI-skillmappen onder `$CODEX_HOME/skills`, met uitzondering van Codex'
  `.system`-cache.
- Persoonlijke AgentSkills onder `$HOME/.agents/skills`, gekopieerd naar de huidige
  OpenClaw-agentwerkruimte wanneer je eigenaarschap per agent wilt.
- Vanuit de bron geïnstalleerde `openai-curated` Codex-Plugins gevonden via Codex
  app-server `plugin/list`. Planning leest `plugin/read` voor elke ingeschakelde
  geïnstalleerde Plugin. App-ondersteunde Plugins vereisen dat de accountrespons van de bron-Codex app-server
  een ChatGPT-abonnementsaccount is; niet-ChatGPT- of ontbrekende
  accountresponses worden overgeslagen met `codex_subscription_required`. Standaard
  roept migratie geen bron-`app/list` aan, dus app-ondersteunde Plugins die door de
  accountgate komen, worden gepland zonder verificatie van toegankelijkheid van de bron-app, en
  transportfouten bij accountlookup worden overgeslagen met `codex_account_unavailable`. Geef
  `--verify-plugin-apps` door wanneer je wilt dat migratie een nieuwe bron-
  `app/list`-snapshot forceert en vereist dat elke app in eigendom aanwezig, ingeschakeld en
  toegankelijk is vóór het plannen van native activering. In die modus vallen transportfouten
  bij accountlookup door naar verificatie van de bron-appinventaris. De
  snapshot van de bron-appinventaris wordt in geheugen gehouden voor het huidige proces; deze
  wordt niet naar migratie-uitvoer of doelconfiguratie geschreven. Uitgeschakelde Plugins,
  onleesbare Plugindetails, bronaccounts achter een abonnementspoort en, wanneer
  verificatie is gevraagd, ontbrekende apps, uitgeschakelde apps, ontoegankelijke apps of
  fouten in de bron-appinventaris worden handmatig overgeslagen items met getypeerde redenen
  in plaats van doelconfiguratie-items.
  Toepassen roept app-server `plugin/install` aan voor elke geselecteerde geschikte Plugin,
  zelfs als de doel-app-server die Plugin al als geïnstalleerd en
  ingeschakeld meldt. Gemigreerde Codex-Plugins zijn alleen bruikbaar in sessies die de
  native Codex-harness selecteren; ze worden niet blootgesteld aan Pi, normale OpenAI-provideruitvoeringen,
  ACP-gespreksbindingen of andere harnesses.

### Codex-status voor handmatige review

Codex `config.toml`, native `hooks/hooks.json`, niet-samengestelde marketplaces, gecachte
Pluginbundels die geen vanuit de bron geïnstalleerde samengestelde Plugins zijn, en vanuit de bron geïnstalleerde
Plugins die de bronabonnementsgate niet halen, worden niet automatisch geactiveerd.
Wanneer `--verify-plugin-apps` is ingesteld, worden Plugins die de bron-appinventaris-
gate niet halen ook overgeslagen. Ze worden gekopieerd of gerapporteerd in het migratierapport voor
handmatige review.

Voor gemigreerde vanuit de bron geïnstalleerde samengestelde Plugins schrijft toepassen:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- één expliciet Plugin-item met `marketplaceName: "openai-curated"` en
  `pluginName` voor elke geselecteerde Plugin

Migratie schrijft nooit `plugins["*"]` en slaat nooit lokale marketplace-cachepaden op.
Abonnementsfouten aan de bronzijde worden gerapporteerd op handmatige items met getypeerde
redenen zoals `codex_subscription_required`, `codex_account_unavailable`,
`plugin_disabled` of `plugin_read_unavailable`. Met `--verify-plugin-apps`
kunnen fouten in de bron-appinventaris ook verschijnen als `app_inaccessible`,
`app_disabled`, `app_missing` of `app_inventory_unavailable`. Overgeslagen Plugins
worden niet naar doelconfiguratie geschreven.
Doelzijdige installaties waarvoor auth vereist is, worden op het betreffende Plugin-item gerapporteerd met
`status: "skipped"`, `reason: "auth_required"` en opgeschoonde app-identificatoren.
Hun expliciete configuratie-items worden uitgeschakeld geschreven totdat je opnieuw autoriseert en
ze inschakelt. Andere installatiefouten zijn itemgebonden `error`-resultaten.

Als Codex app-server-Plugininventaris niet beschikbaar is tijdens planning, valt migratie
terug op adviesitems uit gecachte bundels in plaats van de hele
migratie te laten mislukken.

## Hermes-provider

De meegeleverde Hermes-provider detecteert standaard status op `~/.hermes`. Gebruik `--from <path>` wanneer Hermes ergens anders staat.

### Wat Hermes importeert

- Standaardmodelconfiguratie uit `config.yaml`.
- Geconfigureerde modelproviders en aangepaste OpenAI-compatibele endpoints uit `providers` en `custom_providers`.
- MCP-serverdefinities uit `mcp_servers` of `mcp.servers`.
- `SOUL.md` en `AGENTS.md` naar de OpenClaw-agentworkspace.
- `memories/MEMORY.md` en `memories/USER.md` toegevoegd aan workspace-geheugenbestanden.
- Standaardwaarden voor geheugenconfiguratie voor OpenClaw-bestandsgeheugen, plus archief- of handmatige-reviewitems voor externe geheugenproviders zoals Honcho.
- Skills die een `SKILL.md`-bestand bevatten onder `skills/<name>/`.
- Configuratiewaarden per skill uit `skills.config`.
- Ondersteunde API-sleutels uit `.env`, alleen met `--include-secrets`.

### Ondersteunde `.env`-sleutels

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Alleen-archiefstatus

Hermes-status die OpenClaw niet veilig kan interpreteren, wordt voor handmatige review naar het migratierapport gekopieerd, maar wordt niet in live OpenClaw-configuratie of -referenties geladen. Dit bewaart ondoorzichtige of onveilige status zonder te doen alsof OpenClaw die automatisch kan uitvoeren of vertrouwen:

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

Tijdens runtime roept de plugin `api.registerMigrationProvider(...)` aan. De provider implementeert `detect`, `plan` en `apply`. Core beheert CLI-orkestratie, back-upbeleid, prompts, JSON-uitvoer en conflictpreflight. Core geeft het gereviewde plan door aan `apply(ctx, plan)`, en providers mogen het plan alleen opnieuw opbouwen wanneer dat argument ontbreekt voor compatibiliteit.

Providerplugins kunnen `openclaw/plugin-sdk/migration` gebruiken voor itemconstructie en samenvattingstellingen, plus `openclaw/plugin-sdk/migration-runtime` voor conflictbewuste bestandskopieën, alleen-archief-rapportkopieën, gecachete config-runtime-wrappers en migratierapporten.

## Onboarding-integratie

Onboarding kan migratie aanbieden wanneer een provider een bekende bron detecteert. Zowel `openclaw onboard --flow import` als `openclaw setup --wizard --import-from hermes` gebruikt dezelfde pluginmigratieprovider en toont nog steeds een preview vóór toepassing.

<Note>
Onboarding-imports vereisen een nieuwe OpenClaw-installatie. Reset eerst config, referenties, sessies en de workspace als je al lokale status hebt. Back-up-plus-overschrijven of samenvoegimports zijn feature-gated voor bestaande installaties.
</Note>

## Gerelateerd

- [Migreren vanaf Hermes](/nl/install/migrating-hermes): gebruikersgerichte walkthrough.
- [Migreren vanaf Claude](/nl/install/migrating-claude): gebruikersgerichte walkthrough.
- [Migreren](/nl/install/migrating): verplaats OpenClaw naar een nieuwe machine.
- [Doctor](/nl/gateway/doctor): gezondheidscontrole na het toepassen van een migratie.
- [Plugins](/nl/tools/plugin): plugininstallatie en -registratie.
