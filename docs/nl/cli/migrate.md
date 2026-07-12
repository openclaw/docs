---
read_when:
    - U wilt migreren van Hermes of een ander agentsysteem naar OpenClaw
    - Je voegt een migratieprovider toe die door een Plugin wordt beheerd
summary: CLI-referentie voor `openclaw migrate` (status importeren uit een ander agentsysteem)
title: Migreren
x-i18n:
    generated_at: "2026-07-12T08:45:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importeer status uit een ander agentsysteem via een migratieprovider die door een plugin wordt beheerd. De meegeleverde providers ondersteunen Claude, Codex CLI en [Hermes](/nl/install/migrating-hermes); plugins kunnen aanvullende providers registreren.

<Tip>
Zie [Migreren vanuit Claude](/nl/install/migrating-claude) en [Migreren vanuit Hermes](/nl/install/migrating-hermes) voor gebruikersgerichte stappenplannen. De [migratiehub](/nl/install/migrating) vermeldt alle routes.
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

Als u `openclaw migrate <provider>` zonder andere vlaggen uitvoert, wordt de migratie gepland en als voorbeeld weergegeven, waarna (in een TTY) om bevestiging wordt gevraagd voordat deze wordt toegepast. Met `openclaw migrate plan <provider>` en `openclaw migrate apply <provider>` worden het voorbeeld en de toepassing opgesplitst in afzonderlijke subopdrachten met dezelfde vlaggen.

<ParamField path="<provider>" type="string">
  Naam van een geregistreerde migratieprovider, bijvoorbeeld `hermes`. Voer `openclaw migrate list` uit om de geïnstalleerde providers te bekijken.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Stel het plan op en sluit af zonder de status te wijzigen.
</ParamField>
<ParamField path="--from <path>" type="string">
  Overschrijf de bronmap voor de status. Hermes gebruikt standaard `~/.hermes`, Codex gebruikt standaard `~/.codex` (of `$CODEX_HOME`) en Claude gebruikt standaard `~/.claude`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importeer ondersteunde referenties zonder om bevestiging te vragen. Bij interactieve toepassing wordt vóór het importeren van gedetecteerde authenticatiereferenties om bevestiging gevraagd, waarbij ja standaard is geselecteerd; voor niet-interactief gebruik van `--yes` is `--include-secrets` vereist om ze te importeren.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Sla het importeren van authenticatiereferenties over, inclusief de interactieve vraag.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Sta toe dat bestaande doelen bij toepassing worden vervangen wanneer het plan conflicten meldt.
</ParamField>
<ParamField path="--yes" type="boolean">
  Sla de bevestigingsvraag over. Vereist in niet-interactieve modus.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Selecteer één te kopiëren skill op skillnaam of item-id. Herhaal de vlag om meerdere skills te migreren. Wanneer deze vlag wordt weggelaten, tonen interactieve Codex-migraties een selectievakjeslijst en behouden niet-interactieve migraties alle geplande skills.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Selecteer één installatie-item voor een Codex-plugin op pluginnaam of item-id. Herhaal de vlag om meerdere Codex-plugins te migreren. Wanneer deze vlag wordt weggelaten, tonen interactieve Codex-migraties een systeemeigen selectievakjeslijst voor Codex-plugins en behouden niet-interactieve migraties alle geplande plugins. Alleen van toepassing op vanuit de bron geïnstalleerde `openai-curated` Codex-plugins die door de inventaris van de Codex-appserver zijn gevonden.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Alleen voor Codex. Dwingt een nieuwe doorloop van `app/list` op de Codex-bronappserver af voordat systeemeigen pluginactivering wordt gepland. Standaard uitgeschakeld om het plannen van migraties snel te houden.
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  Pad naar of map voor het back-uparchief vóór de migratie. Wordt doorgegeven aan `openclaw backup create`.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Sla de back-up vóór toepassing over. Vereist `--force` wanneer lokale OpenClaw-status bestaat.
</ParamField>
<ParamField path="--force" type="boolean">
  Vereist naast `--no-backup` wanneer de toepassing anders zou weigeren de back-up over te slaan.
</ParamField>
<ParamField path="--json" type="boolean">
  Geef het plan of het toepassingsresultaat weer als JSON. Met `--json` en zonder `--yes` geeft de toepassing het plan weer en wordt de status niet gewijzigd.
</ParamField>

## Veiligheidsmodel

`openclaw migrate` toont altijd eerst een voorbeeld.

<AccordionGroup>
  <Accordion title="Voorbeeld vóór toepassing">
    De provider retourneert een gespecificeerd plan voordat er iets wordt gewijzigd, inclusief conflicten, overgeslagen items en gevoelige items. JSON-plannen, toepassingsuitvoer en migratierapporten maskeren geneste sleutels die op geheimen lijken, zoals API-sleutels, tokens, autorisatieheaders, cookies en wachtwoorden.

    `openclaw migrate apply <provider>` toont een voorbeeld van het plan en vraagt om bevestiging voordat de status wordt gewijzigd, tenzij `--yes` is ingesteld. In niet-interactieve modus vereist de toepassing `--yes`.

  </Accordion>
  <Accordion title="Back-ups">
    De toepassing maakt en verifieert een OpenClaw-back-up voordat de migratie wordt toegepast. Als er nog geen lokale OpenClaw-status bestaat, wordt de back-upstap overgeslagen en gaat de migratie verder. Geef zowel `--no-backup` als `--force` door om een back-up over te slaan wanneer er status bestaat.
  </Accordion>
  <Accordion title="Conflicten">
    De toepassing weigert door te gaan wanneer het plan conflicten bevat. Controleer het plan en voer de opdracht daarna opnieuw uit met `--overwrite` als het opzettelijk is om bestaande doelen te vervangen. Providers kunnen nog steeds back-ups per item schrijven voor overschreven bestanden in de map met het migratierapport.
  </Accordion>
  <Accordion title="Geheimen">
    Bij interactieve toepassing wordt gevraagd of gedetecteerde authenticatiereferenties moeten worden geïmporteerd, waarbij ja standaard is geselecteerd. Gebruik `--no-auth-credentials` om ze over te slaan, of `--include-secrets` voor onbeheerde import van referenties met `--yes`.
  </Accordion>
</AccordionGroup>

## Claude-provider

De meegeleverde Claude-provider detecteert standaard de status van Claude Code in `~/.claude`. Gebruik `--from <path>` om een specifieke thuismap of projecthoofdmap van Claude Code te importeren.

<Tip>
Zie [Migreren vanuit Claude](/nl/install/migrating-claude) voor een gebruikersgericht stappenplan.
</Tip>

### Wat Claude importeert

- Projectbestand `CLAUDE.md` en `.claude/CLAUDE.md` naar de OpenClaw-agentwerkruimte (`AGENTS.md`).
- Gebruikersbestand `~/.claude/CLAUDE.md`, toegevoegd aan `USER.md` in de werkruimte.
- MCP-serverdefinities uit het projectbestand `.mcp.json`, Claude Code-bestand `~/.claude.json` (inclusief de items per project) en Claude Desktop-bestand `claude_desktop_config.json`.
- Claude-skillmappen die `SKILL.md` bevatten (`~/.claude/skills` van de gebruiker en `.claude/skills` van het project).
- Markdown-opdrachtbestanden van Claude (`~/.claude/commands` van de gebruiker en `.claude/commands` van het project), omgezet in OpenClaw-skills die alleen handmatig kunnen worden aangeroepen.

### Archief- en handmatige-controlestatus

Claude-hooks, machtigingen, standaardwaarden voor de omgeving, projectbestand `CLAUDE.local.md`, `.claude/rules`, gebruikers- en projectmappen `agents/` en projectgeschiedenis (`projects`, `cache` en `plans` onder `~/.claude`) worden bewaard in het migratierapport of gemeld als items voor handmatige controle. OpenClaw voert hooks niet uit, kopieert geen brede toelatingslijsten en importeert de status van OAuth-/Desktop-referenties niet automatisch.

## Codex-provider

De meegeleverde Codex-provider detecteert standaard de Codex CLI-status in `~/.codex`, of in `CODEX_HOME` wanneer die omgevingsvariabele is ingesteld. Gebruik `--from <path>` om een specifieke Codex-thuismap te inventariseren.

Gebruik deze provider wanneer u overstapt op het OpenClaw Codex-harnas en nuttige persoonlijke Codex CLI-middelen bewust wilt overzetten. Lokale starts van de Codex-appserver gebruiken een `CODEX_HOME` per agent en lezen daarom standaard uw persoonlijke `~/.codex` niet. Het normale proces neemt `HOME` nog steeds over, zodat Codex gedeelde skills en pluginmarktplaatsitems in `$HOME/.agents/*` kan zien en subprocessen configuratie en tokens in de thuismap van de gebruiker kunnen vinden.

Wanneer `openclaw migrate codex` in een interactieve terminal wordt uitgevoerd, wordt eerst het volledige plan weergegeven en worden daarna selectievakjeslijsten geopend vóór de definitieve bevestiging voor toepassing. Eerst wordt om de te kopiëren skills gevraagd. Gebruik `Toggle all on` of `Toggle all off` voor bulkselectie. Druk op Spatie om rijen in of uit te schakelen, of op Enter om de gemarkeerde rij te activeren en door te gaan. Geplande skills zijn aanvankelijk aangevinkt, skills met conflicten zijn aanvankelijk niet aangevinkt en `Skip for now` slaat het kopiëren van skills voor deze uitvoering over, terwijl de selectie van plugins wel doorgaat. Wanneer vanuit de bron geïnstalleerde, beheerde Codex-plugins kunnen worden gemigreerd en `--plugin` niet is opgegeven, wordt daarna op pluginnaam gevraagd om systeemeigen Codex-plugins te activeren. Pluginitems zijn aanvankelijk aangevinkt, tenzij de configuratie van de Codex-plugin in OpenClaw die plugin al bevat. Bestaande doelplugins zijn aanvankelijk niet aangevinkt en tonen een conflictaanwijzing zoals `conflict: plugin exists`; kies `Toggle all off` om tijdens die uitvoering geen systeemeigen Codex-plugins te migreren, of `Skip for now` om vóór de toepassing te stoppen.

Selecteer voor gescripte of exacte uitvoeringen expliciet een of meer skills of plugins:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Wat Codex importeert

- Codex CLI-skillmappen onder `$CODEX_HOME/skills`, met uitzondering van de `.system`-cache van Codex.
- Persoonlijke AgentSkills onder `$HOME/.agents/skills`, gekopieerd naar de huidige OpenClaw-agentwerkruimte voor eigendom per agent.
- Vanuit de bron geïnstalleerde `openai-curated` Codex-plugins die via `plugin/list` van de Codex-appserver zijn gevonden. Tijdens de planning wordt `plugin/read` gelezen voor elke ingeschakelde geïnstalleerde plugin.

Voor door apps ondersteunde pluginmigratie gelden extra voorwaarden:

- Door apps ondersteunde plugins vereisen dat het account van de Codex-bronappserver een ChatGPT-abonnementsaccount is. Antwoorden voor niet-ChatGPT-accounts of ontbrekende accounts worden overgeslagen met `codex_subscription_required`.
- Standaard roept de migratie `app/list` van de bron niet aan. Daardoor worden door apps ondersteunde plugins die aan de accountvoorwaarde voldoen gepland zonder verificatie van de toegankelijkheid van de bronapp, en worden transportfouten bij het opzoeken van het account overgeslagen met `codex_account_unavailable`.
- Geef `--verify-plugin-apps` door om een nieuwe momentopname van `app/list` van de bron af te dwingen en te vereisen dat elke eigen app aanwezig, ingeschakeld en toegankelijk is voordat systeemeigen activering wordt gepland. In die modus wordt bij transportfouten tijdens het opzoeken van het account teruggevallen op verificatie van de bronapp-inventaris. De momentopname wordt alleen voor het huidige proces in het geheugen bewaard; deze wordt nooit naar migratie-uitvoer of doelconfiguratie geschreven.

Uitgeschakelde plugins, onleesbare plugindetails, bronaccounts waarvoor een abonnement vereist is en (wanneer `--verify-plugin-apps` is ingesteld) ontbrekende, uitgeschakelde of ontoegankelijke apps worden handmatig overgeslagen items met getypeerde redenen in plaats van items in de doelconfiguratie. De toepassing roept `plugin/install` van de appserver aan voor elke geselecteerde, geschikte plugin, zelfs als de doelappserver al meldt dat die plugin is geïnstalleerd en ingeschakeld. Gemigreerde Codex-plugins zijn alleen bruikbaar in sessies die het systeemeigen Codex-harnas selecteren; ze worden niet beschikbaar gesteld aan OpenClaw-provideruitvoeringen, ACP-gesprekskoppelingen of andere harnassen.

### Handmatig te controleren Codex-status

Codex-bestand `config.toml`, systeemeigen `hooks/hooks.json`, niet-beheerde marktplaatsen, gecachte pluginbundels die geen vanuit de bron geïnstalleerde beheerde plugins zijn en vanuit de bron geïnstalleerde plugins die niet aan de abonnementsvoorwaarde van de bron voldoen, worden niet automatisch geactiveerd. Wanneer `--verify-plugin-apps` is ingesteld, worden plugins die niet aan de inventarisvoorwaarde van de bronapp voldoen ook overgeslagen. Al deze items worden gekopieerd naar of gemeld in het migratierapport voor handmatige controle.

Voor gemigreerde, vanuit de bron geïnstalleerde beheerde plugins schrijft de toepassing:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- één expliciet pluginitem met `marketplaceName: "openai-curated"` en `pluginName` voor elke geselecteerde plugin

De migratie schrijft nooit `plugins["*"]` en slaat nooit lokale cachepaden van marktplaatsen op.

Overgeslagen plugins worden niet naar de doelconfiguratie geschreven. Mislukte abonnementcontroles aan de bronzijde worden bij handmatige items gemeld met getypeerde redenen: `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` of `plugin_read_unavailable`. Met `--verify-plugin-apps` kunnen mislukte inventariscontroles van bronapps ook worden weergegeven als `app_inaccessible`, `app_disabled`, `app_missing` of `app_inventory_unavailable`. Installaties waarvoor aan de doelzijde authenticatie vereist is, worden bij het betreffende pluginitem gemeld met `status: "skipped"`, `reason: "auth_required"` en opgeschoonde app-id's; de expliciete configuratie-items ervan worden uitgeschakeld weggeschreven totdat u opnieuw autoriseert en ze inschakelt. Andere installatiefouten zijn tot het item beperkte `error`-resultaten.

Als de plugininventaris van de Codex-appserver tijdens de planning niet beschikbaar is, valt de migratie terug op adviserende items uit de gebundelde cache in plaats van de volledige migratie te laten mislukken.

## Hermes-provider

De gebundelde Hermes-provider detecteert standaard de status in `~/.hermes`. Gebruik `--from <path>` wanneer Hermes zich elders bevindt.

### Wat Hermes importeert

- Standaardmodelconfiguratie uit `config.yaml`.
- Geconfigureerde modelproviders en aangepaste OpenAI-compatibele eindpunten uit `providers` en `custom_providers`.
- MCP-serverdefinities uit `mcp_servers` of `mcp.servers`.
- `SOUL.md` en `AGENTS.md` naar de werkruimte van de OpenClaw-agent.
- `memories/MEMORY.md` en `memories/USER.md`, toegevoegd aan geheugenbestanden in de werkruimte.
- Standaardwaarden voor de geheugenconfiguratie van het OpenClaw-bestandsgeheugen, plus archief- of handmatige-beoordelingsitems voor externe geheugenproviders zoals Honcho.
- Skills die een `SKILL.md`-bestand bevatten onder `skills/<name>/`.
- Configuratiewaarden per Skill uit `skills.config`.
- OpenAI OAuth-referenties van OpenCode uit OpenCode `auth.json` wanneer interactieve migratie van referenties wordt geaccepteerd of wanneer `--include-secrets` is ingesteld. OAuth-items in Hermes `auth.json` zijn verouderde status die wordt gemeld voor handmatige herauthenticatie bij OpenAI of herstel met doctor.
- Ondersteunde API-sleutels en tokens uit Hermes `.env` en OpenCode `auth.json` wanneer interactieve migratie van referenties wordt geaccepteerd of wanneer `--include-secrets` is ingesteld.

### Ondersteunde `.env`-sleutels

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### Status uitsluitend voor archivering

Hermes-status die OpenClaw niet veilig kan interpreteren, wordt voor handmatige beoordeling naar het migratierapport gekopieerd, maar niet in de actieve OpenClaw-configuratie of -referenties geladen. Hierdoor blijft ondoorzichtige of onveilige status behouden zonder te suggereren dat OpenClaw deze automatisch kan uitvoeren of vertrouwen: `plugins/`, `sessions/`, `logs/`, `cron/`, `mcp-tokens/`, `state.db`.

### Na het toepassen

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

Tijdens runtime roept de plugin `api.registerMigrationProvider(...)` aan. De provider implementeert `detect`, `plan` en `apply`. De kern beheert de CLI-orkestratie, het back-upbeleid, prompts, JSON-uitvoer en de voorafgaande conflictcontrole. De kern geeft het beoordeelde plan door aan `apply(ctx, plan)` en providers mogen het plan uitsluitend opnieuw opbouwen wanneer dat argument om compatibiliteitsredenen ontbreekt.

Providerplugins kunnen `openclaw/plugin-sdk/migration` gebruiken voor het samenstellen van items en totalen in samenvattingen, plus `openclaw/plugin-sdk/migration-runtime` voor conflictbewuste bestandskopieën, rapportkopieën uitsluitend voor archivering, gecachte configuratie-runtimewrappers en migratierapporten.

## Integratie met onboarding

Onboarding kan migratie aanbieden wanneer een provider een bekende bron detecteert. Zowel `openclaw onboard --flow import` als `openclaw setup --wizard --import-from hermes` gebruiken dezelfde pluginmigratieprovider en tonen nog steeds een voorbeeldweergave voordat de migratie wordt toegepast.

<Note>
Voor imports tijdens onboarding is een nieuwe OpenClaw-installatie vereist. Stel eerst de configuratie, referenties, sessies en werkruimte opnieuw in als u al lokale status hebt. Imports met back-up plus overschrijven of samenvoegen zijn voor bestaande installaties alleen beschikbaar achter een functievlag.
</Note>

## Gerelateerd

- [Migreren vanuit Hermes](/nl/install/migrating-hermes): gebruikersgerichte stapsgewijze uitleg.
- [Migreren vanuit Claude](/nl/install/migrating-claude): gebruikersgerichte stapsgewijze uitleg.
- [Migreren](/nl/install/migrating): verplaats OpenClaw naar een nieuwe machine.
- [Doctor](/nl/gateway/doctor): statuscontrole na het toepassen van een migratie.
- [Plugins](/nl/tools/plugin): installatie en registratie van plugins.
