---
read_when:
    - Je wilt migreren van Hermes of een ander agentsysteem naar OpenClaw
    - Je voegt een door een plugin beheerde migratieprovider toe
summary: CLI-referentie voor `openclaw migrate` (status importeren uit een ander agentsysteem)
title: Migreren
x-i18n:
    generated_at: "2026-06-27T17:20:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90798fd24af0984e485753e251c87a5dd8fd0246e7c135a50e3532de93ba075e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importeer status uit een ander agentsysteem via een migratieprovider die eigendom is van een plugin. Gebundelde providers dekken Codex CLI-status, [Claude](/nl/install/migrating-claude) en [Hermes](/nl/install/migrating-hermes); plugins van derden kunnen extra providers registreren.

<Tip>
Zie voor gebruikersgerichte stappenplannen [Migreren vanuit Claude](/nl/install/migrating-claude) en [Migreren vanuit Hermes](/nl/install/migrating-hermes). De [migratiehub](/nl/install/migrating) vermeldt alle paden.
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
  Overschrijf de bronstatusmap. Hermes gebruikt standaard `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importeer ondersteunde referenties zonder prompt. Interactief toepassen vraagt voordat gedetecteerde verificatiereferenties worden geïmporteerd, met ja standaard geselecteerd; niet-interactief `--yes` vereist `--include-secrets` om ze te importeren.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Sla import van verificatiereferenties over, inclusief de interactieve prompt.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Sta toepassen toe om bestaande doelen te vervangen wanneer het plan conflicten meldt.
</ParamField>
<ParamField path="--yes" type="boolean">
  Sla de bevestigingsprompt over. Vereist in niet-interactieve modus.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Selecteer één skill-kopie-item op skillnaam of item-id. Herhaal de vlag om meerdere skills te migreren. Indien weggelaten tonen interactieve Codex-migraties een selectievakjeskiezer en behouden niet-interactieve migraties alle geplande skills.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Selecteer één Codex-plugininstallatie-item op pluginnaam of item-id. Herhaal de vlag om meerdere Codex-plugins te migreren. Indien weggelaten tonen interactieve Codex-migraties een native Codex-pluginselectievakjeskiezer en behouden niet-interactieve migraties alle geplande plugins. Dit geldt alleen voor brongeïnstalleerde `openai-curated` Codex-plugins die door de Codex app-server-inventaris zijn ontdekt.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Alleen Codex. Forceer een nieuwe bron-Codex app-server `app/list`-traversal voordat native pluginactivatie wordt gepland. Standaard uit om migratieplanning snel te houden.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Sla de back-up vóór toepassen over. Vereist `--force` wanneer lokale OpenClaw-status bestaat.
</ParamField>
<ParamField path="--force" type="boolean">
  Vereist naast `--no-backup` wanneer toepassen anders zou weigeren de back-up over te slaan.
</ParamField>
<ParamField path="--json" type="boolean">
  Druk het plan of het toepasresultaat af als JSON. Met `--json` en zonder `--yes` drukt toepassen het plan af en muteert het geen status.
</ParamField>

## Veiligheidsmodel

`openclaw migrate` werkt met eerst een voorbeeldweergave.

<AccordionGroup>
  <Accordion title="Voorbeeld vóór toepassen">
    De provider retourneert een gespecificeerd plan voordat er iets verandert, inclusief conflicten, overgeslagen items en gevoelige items. JSON-plannen, toepasuitvoer en migratierapporten redigeren geneste sleutels die op geheimen lijken, zoals API-sleutels, tokens, autorisatieheaders, cookies en wachtwoorden.

    `openclaw migrate apply <provider>` toont een voorbeeld van het plan en vraagt om bevestiging voordat status wordt gewijzigd, tenzij `--yes` is ingesteld. In niet-interactieve modus vereist toepassen `--yes`.

  </Accordion>
  <Accordion title="Back-ups">
    Toepassen maakt en verifieert een OpenClaw-back-up voordat de migratie wordt toegepast. Als er nog geen lokale OpenClaw-status bestaat, wordt de back-upstap overgeslagen en kan de migratie doorgaan. Geef zowel `--no-backup` als `--force` mee om een back-up over te slaan wanneer status bestaat.
  </Accordion>
  <Accordion title="Conflicten">
    Toepassen weigert door te gaan wanneer het plan conflicten heeft. Bekijk het plan en voer daarna opnieuw uit met `--overwrite` als het vervangen van bestaande doelen opzettelijk is. Providers kunnen nog steeds back-ups op itemniveau voor overschreven bestanden schrijven in de migratierapportmap.
  </Accordion>
  <Accordion title="Geheimen">
    Interactief toepassen vraagt of gedetecteerde verificatiereferenties moeten worden geïmporteerd, met ja standaard geselecteerd. Gebruik `--no-auth-credentials` om ze over te slaan, of gebruik `--include-secrets` voor onbeheerde referentie-import met `--yes`.
  </Accordion>
</AccordionGroup>

## Claude-provider

De gebundelde Claude-provider detecteert standaard Claude Code-status op `~/.claude`. Gebruik `--from <path>` om een specifieke Claude Code-home of projectroot te importeren.

<Tip>
Zie voor een gebruikersgericht stappenplan [Migreren vanuit Claude](/nl/install/migrating-claude).
</Tip>

### Wat Claude importeert

- Project-`CLAUDE.md` en `.claude/CLAUDE.md` naar de OpenClaw-agentwerkruimte.
- Gebruikers-`~/.claude/CLAUDE.md` toegevoegd aan werkruimte-`USER.md`.
- MCP-serverdefinities uit project-`.mcp.json`, Claude Code `~/.claude.json` en Claude Desktop `claude_desktop_config.json`.
- Claude-skillmappen die `SKILL.md` bevatten.
- Claude-opdracht-Markdownbestanden geconverteerd naar OpenClaw-skills met alleen handmatige aanroep.

### Archief- en handmatige-beoordelingsstatus

Claude-hooks, machtigingen, omgevingsstandaarden, lokaal geheugen, padgebonden regels, subagents, caches, plannen en projectgeschiedenis worden bewaard in het migratierapport of gerapporteerd als items voor handmatige beoordeling. OpenClaw voert geen hooks uit, kopieert geen brede allowlists en importeert OAuth/Desktop-referentiestatus niet automatisch.

## Codex-provider

De gebundelde Codex-provider detecteert standaard Codex CLI-status op `~/.codex`, of
op `CODEX_HOME` wanneer die omgevingsvariabele is ingesteld. Gebruik `--from <path>` om
een specifieke Codex-home te inventariseren.

Gebruik deze provider wanneer je overstapt naar de OpenClaw Codex-harness en je
nuttige persoonlijke Codex CLI-assets bewust wilt promoveren. Lokale Codex app-server-
starts gebruiken een per-agent `CODEX_HOME`, dus ze lezen standaard niet je persoonlijke
`~/.codex`. Het normale proces-`HOME` wordt nog steeds geërfd, zodat Codex
gedeelde `$HOME/.agents/*` skills/plugin-marktplaatsvermeldingen kan zien en
subprocessen gebruikers-homeconfiguratie en tokens kunnen vinden.

Het uitvoeren van `openclaw migrate codex` in een interactieve terminal toont eerst het volledige
plan en opent daarna selectievakjeskiezers vóór de definitieve toepasbevestiging. Skill-
kopie-items worden eerst gevraagd. Gebruik `Toggle all on` of `Toggle all off` voor bulk-
selectie. Druk op Spatie om rijen om te schakelen, of druk op Enter om de gemarkeerde
rij te activeren en door te gaan. Geplande skills beginnen aangevinkt, skills met conflict beginnen uitgevinkt, en
`Skip for now` slaat skillkopieën voor deze uitvoering over terwijl de plugin-
selectie nog steeds doorgaat. Wanneer brongeïnstalleerde gecureerde Codex-plugins migreerbaar zijn en
`--plugin` niet is opgegeven, vraagt de migratie daarna om native Codex-plugin-
activatie op pluginnaam. Plugin-items
beginnen aangevinkt tenzij de doel-OpenClaw Codex-pluginconfiguratie die
plugin al heeft. Bestaande doelplugins beginnen uitgevinkt en tonen een conflicthint zoals
`conflict: plugin exists`; kies `Toggle all off` om in die uitvoering geen native Codex-
plugins te migreren, of `Skip for now` om te stoppen vóór toepassen. Voor gescripte of
exacte uitvoeringen geef je `--skill <name>` één keer per skill mee, bijvoorbeeld:

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
  OpenClaw-agentwerkruimte wanneer je eigendom per agent wilt.
- Brongeïnstalleerde `openai-curated` Codex-plugins ontdekt via Codex
  app-server `plugin/list`. Planning leest `plugin/read` voor elke ingeschakelde
  geïnstalleerde plugin. App-ondersteunde plugins vereisen dat de accountreactie van de bron-Codex app-server
  een ChatGPT-abonnementsaccount is; niet-ChatGPT- of ontbrekende
  accountreacties worden overgeslagen met `codex_subscription_required`. Standaard
  roept migratie geen bron-`app/list` aan, dus app-ondersteunde plugins die de
  accountpoort passeren, worden gepland zonder verificatie van toegankelijkheid van de bron-app, en
  transportfouten bij accountopzoeking slaan over met `codex_account_unavailable`. Geef
  `--verify-plugin-apps` mee wanneer je wilt dat migratie een nieuwe bron-
  `app/list`-snapshot forceert en vereist dat elke eigen app aanwezig, ingeschakeld en
  toegankelijk is voordat native activatie wordt gepland. In die modus vallen transportfouten bij
  accountopzoeking door naar verificatie van de bron-appinventaris. De
  bron-appinventarissnapshot wordt in het geheugen gehouden voor het huidige proces; hij
  wordt niet geschreven naar migratie-uitvoer of doelconfiguratie. Uitgeschakelde plugins,
  onleesbare plugindetails, door abonnement geblokkeerde bronaccounts en, wanneer
  verificatie is aangevraagd, ontbrekende apps, uitgeschakelde apps, ontoegankelijke apps of
  bron-appinventarisfouten worden handmatig overgeslagen items met getypte redenen
  in plaats van doelconfiguratievermeldingen.
  Toepassen roept app-server `plugin/install` aan voor elke geselecteerde geschikte plugin,
  zelfs als de doel-app-server die plugin al als geïnstalleerd en
  ingeschakeld rapporteert. Gemigreerde Codex-plugins zijn alleen bruikbaar in sessies die de
  native Codex-harness selecteren; ze worden niet blootgesteld aan OpenClaw-provideruitvoeringen,
  ACP-gespreksbindingen of andere harnesses.

### Codex-status voor handmatige beoordeling

Codex `config.toml`, native `hooks/hooks.json`, niet-gecureerde marktplaatsen, gecachte
pluginbundels die geen brongeïnstalleerde gecureerde plugins zijn, en brongeïnstalleerde
plugins die de bronabonnementspoort niet halen, worden niet automatisch geactiveerd.
Wanneer `--verify-plugin-apps` is ingesteld, worden plugins die de bron-appinventaris-
poort niet halen ook overgeslagen. Ze worden gekopieerd of gerapporteerd in het migratierapport voor
handmatige beoordeling.

Voor gemigreerde brongeïnstalleerde gecureerde plugins schrijft toepassen:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- één expliciete pluginvermelding met `marketplaceName: "openai-curated"` en
  `pluginName` voor elke geselecteerde plugin

Migratie schrijft nooit `plugins["*"]` en slaat nooit lokale cachepaden voor de marketplace op. Mislukte abonnementen aan de bronzijde worden gerapporteerd op handmatige items met getypeerde redenen zoals `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` of `plugin_read_unavailable`. Met `--verify-plugin-apps` kunnen inventarisatiefouten van bronapps ook verschijnen als `app_inaccessible`, `app_disabled`, `app_missing` of `app_inventory_unavailable`. Overgeslagen plugins worden niet naar de doelconfiguratie geschreven.
Installaties aan de doelzijde waarvoor authenticatie vereist is, worden gerapporteerd op het betrokken plugin-item met `status: "skipped"`, `reason: "auth_required"` en opgeschoonde app-identificaties. Hun expliciete configuratie-items worden uitgeschakeld geschreven totdat u ze opnieuw autoriseert en inschakelt. Andere installatiefouten zijn itemgebonden `error`-resultaten.

Als de plugin-inventaris van de Codex app-server tijdens de planning niet beschikbaar is, valt migratie terug op gecachte bundeladviesitems in plaats van de hele migratie te laten mislukken.

## Hermes-provider

De gebundelde Hermes-provider detecteert standaard status in `~/.hermes`. Gebruik `--from <path>` wanneer Hermes ergens anders staat.

### Wat Hermes importeert

- Standaard modelconfiguratie uit `config.yaml`.
- Geconfigureerde modelproviders en aangepaste OpenAI-compatibele eindpunten uit `providers` en `custom_providers`.
- MCP-serverdefinities uit `mcp_servers` of `mcp.servers`.
- `SOUL.md` en `AGENTS.md` naar de agentwerkruimte van OpenClaw.
- `memories/MEMORY.md` en `memories/USER.md` toegevoegd aan werkruimtegeheugenbestanden.
- Standaardwaarden voor geheugenconfiguratie voor OpenClaw-bestandsgeheugen, plus archief- of handmatige-reviewitems voor externe geheugenproviders zoals Honcho.
- Skills die een `SKILL.md`-bestand bevatten onder `skills/<name>/`.
- Configuratiewaarden per Skill uit `skills.config`.
- OpenCode OpenAI OAuth-referenties uit OpenCode `auth.json` wanneer interactieve referentiemigratie wordt geaccepteerd, of wanneer `--include-secrets` is ingesteld. Hermes `auth.json` OAuth-items zijn verouderde status die wordt gerapporteerd voor handmatige OpenAI-herauthenticatie of doctor-reparatie.
- Ondersteunde API-sleutels en tokens uit Hermes `.env` en OpenCode `auth.json` wanneer interactieve referentiemigratie wordt geaccepteerd, of wanneer `--include-secrets` is ingesteld.

### Ondersteunde `.env`-sleutels

- `AI_GATEWAY_API_KEY`
- `ALIBABA_API_KEY`
- `ANTHROPIC_API_KEY`
- `ARCEEAI_API_KEY`
- `CEREBRAS_API_KEY`
- `CHUTES_API_KEY`
- `CLOUDFLARE_AI_GATEWAY_API_KEY`
- `COPILOT_GITHUB_TOKEN`
- `DASHSCOPE_API_KEY`
- `DEEPINFRA_API_KEY`
- `DEEPSEEK_API_KEY`
- `FIREWORKS_API_KEY`
- `GEMINI_API_KEY`
- `GH_TOKEN`
- `GITHUB_TOKEN`
- `GLM_API_KEY`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY`
- `HF_TOKEN`
- `HUGGINGFACE_HUB_TOKEN`
- `KILOCODE_API_KEY`
- `KIMICODE_API_KEY`
- `KIMI_API_KEY`
- `MINIMAX_API_KEY`
- `MINIMAX_CODING_API_KEY`
- `MISTRAL_API_KEY`
- `MODELSTUDIO_API_KEY`
- `MOONSHOT_API_KEY`
- `NVIDIA_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`
- `OPENCODE_GO_API_KEY`
- `OPENCODE_ZEN_API_KEY`
- `OPENROUTER_API_KEY`
- `QIANFAN_API_KEY`
- `QWEN_API_KEY`
- `TOGETHER_API_KEY`
- `VENICE_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`
- `ZAI_API_KEY`
- `Z_AI_API_KEY`

### Alleen-archiefstatus

Hermes-status die OpenClaw niet veilig kan interpreteren, wordt naar het migratierapport gekopieerd voor handmatige review, maar wordt niet geladen in live OpenClaw-configuratie of -referenties. Dit bewaart ondoorzichtige of onveilige status zonder te doen alsof OpenClaw die automatisch kan uitvoeren of vertrouwen:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
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

Tijdens runtime roept de plugin `api.registerMigrationProvider(...)` aan. De provider implementeert `detect`, `plan` en `apply`. Core is eigenaar van CLI-orkestratie, back-upbeleid, prompts, JSON-uitvoer en conflictpreflight. Core geeft het beoordeelde plan door aan `apply(ctx, plan)`, en providers mogen het plan alleen opnieuw opbouwen wanneer dat argument afwezig is voor compatibiliteit.

Providerplugins kunnen `openclaw/plugin-sdk/migration` gebruiken voor itemconstructie en samenvattingstellingen, plus `openclaw/plugin-sdk/migration-runtime` voor conflictbewuste bestandskopieën, alleen-archief rapportkopieën, gecachte config-runtime wrappers en migratierapporten.

## Onboarding-integratie

Onboarding kan migratie aanbieden wanneer een provider een bekende bron detecteert. Zowel `openclaw onboard --flow import` als `openclaw setup --wizard --import-from hermes` gebruiken dezelfde pluginmigratieprovider en tonen nog steeds een voorbeeld voordat ze toepassen.

<Note>
Onboarding-imports vereisen een nieuwe OpenClaw-installatie. Reset eerst configuratie, referenties, sessies en de werkruimte als u al lokale status hebt. Back-up-plus-overschrijven of samenvoegimports zijn via feature gates beschikbaar voor bestaande installaties.
</Note>

## Gerelateerd

- [Migreren vanaf Hermes](/nl/install/migrating-hermes): gebruikersgerichte walkthrough.
- [Migreren vanaf Claude](/nl/install/migrating-claude): gebruikersgerichte walkthrough.
- [Migreren](/nl/install/migrating): verplaats OpenClaw naar een nieuwe machine.
- [Doctor](/nl/gateway/doctor): gezondheidscontrole na het toepassen van een migratie.
- [Plugins](/nl/tools/plugin): plugininstallatie en registratie.
