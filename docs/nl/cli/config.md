---
read_when:
    - Je wilt de configuratie niet-interactief lezen of bewerken
sidebarTitle: Config
summary: CLI-referentie voor `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Configuratie
x-i18n:
    generated_at: "2026-04-29T22:30:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f55c4b932d469cb9112d9f55b66f0ff88dbe066250651df7a0a753060a223d
    source_path: cli/config.md
    workflow: 16
---

Configuratiehelpers voor niet-interactieve bewerkingen in `openclaw.json`: waarden per pad get/set/patch/unset/file/schema/validate uitvoeren en het actieve configuratiebestand afdrukken. Voer uit zonder subopdracht om de configuratiewizard te openen (hetzelfde als `openclaw configure`).

## Hoofdopties

<ParamField path="--section <section>" type="string">
  Herhaalbaar sectiefilter voor begeleide installatie wanneer je `openclaw config` zonder subopdracht uitvoert.
</ParamField>

Ondersteunde begeleide secties: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

## Voorbeelden

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Druk het gegenereerde JSON-schema voor `openclaw.json` als JSON af naar stdout.

<AccordionGroup>
  <Accordion title="Wat het bevat">
    - Het huidige hoofdconfiguratieschema, plus een hoofdveld `$schema` met een tekenreeks voor editorhulpmiddelen.
    - Metadata voor documentatie van velden `title` en `description`, gebruikt door de Control UI.
    - Geneste object-, jokerteken- (`*`) en array-itemknooppunten (`[]`) erven dezelfde metadata voor `title` / `description` wanneer overeenkomende veldocumentatie bestaat.
    - Vertakkingen `anyOf` / `oneOf` / `allOf` erven ook dezelfde documentatiemetadata wanneer overeenkomende veldocumentatie bestaat.
    - Best-effort live metadata voor Plugin- en kanaalschema's wanneer runtime-manifesten kunnen worden geladen.
    - Een schoon fallbackschema, zelfs wanneer de huidige configuratie ongeldig is.

  </Accordion>
  <Accordion title="Gerelateerde runtime-RPC">
    `config.schema.lookup` retourneert een genormaliseerd configuratiepad met een ondiep schemaknooppunt (`title`, `description`, `type`, `enum`, `const`, algemene grenzen), overeenkomende metadata voor UI-hints en directe samenvattingen van kinderen. Gebruik dit voor padgebonden drill-down in Control UI of aangepaste clients.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Pipe het naar een bestand wanneer je het met andere tools wilt inspecteren of valideren:

```bash
openclaw config schema > openclaw.schema.json
```

### Paden

Paden gebruiken punt- of haakjesnotatie:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Gebruik de agentlijstindex om een specifieke agent te kiezen:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Waarden

Waarden worden waar mogelijk als JSON5 geparseerd; anders worden ze als tekenreeksen behandeld. Gebruik `--strict-json` om JSON5-parsing te vereisen. `--json` blijft ondersteund als verouderde alias.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` drukt de ruwe waarde af als JSON in plaats van terminalopgemaakte tekst.

<Note>
Objecttoewijzing vervangt standaard het doelpad. Beveiligde map-/lijstpaden die vaak door gebruikers toegevoegde items bevatten, zoals `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` en `auth.profiles`, weigeren vervangingen die bestaande items zouden verwijderen, tenzij je `--replace` meegeeft.
</Note>

Gebruik `--merge` wanneer je items aan die maps toevoegt:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Gebruik `--replace` alleen wanneer je bewust wilt dat de opgegeven waarde de volledige doelwaarde wordt.

## Modi voor `config set`

`openclaw config set` ondersteunt vier toewijzingsstijlen:

<Tabs>
  <Tab title="Waardemodus">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef-buildermodus">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Provider-buildermodus">
    Provider-buildermodus richt zich alleen op paden `secrets.providers.<alias>`:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Batchmodus">
    ```bash
    openclaw config set --batch-json '[
      {
        "path": "secrets.providers.default",
        "provider": { "source": "env" }
      },
      {
        "path": "channels.discord.token",
        "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
      }
    ]'
    ```

    ```bash
    openclaw config set --batch-file ./config-set.batch.json --dry-run
    ```

  </Tab>
</Tabs>

<Warning>
SecretRef-toewijzingen worden geweigerd op niet-ondersteunde runtime-muteerbare oppervlakken (bijvoorbeeld `hooks.token`, `commands.ownerDisplaySecret`, Discord-webhooktokens voor threadbinding en JSON met WhatsApp-referenties). Zie [SecretRef-referentieoppervlak](/nl/reference/secretref-credential-surface).
</Warning>

Batchparsing gebruikt altijd de batchpayload (`--batch-json`/`--batch-file`) als bron van waarheid. `--strict-json` / `--json` veranderen het gedrag van batchparsing niet.

## `config patch`

Gebruik `config patch` wanneer je een configuratievormige patch wilt plakken of pipen in plaats van veel padgebaseerde `config set`-opdrachten uit te voeren. De invoer is een JSON5-object. Objecten worden recursief samengevoegd, arrays en scalaire waarden vervangen de doelwaarde, en `null` verwijdert het doelpad.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Je kunt ook een patch via stdin pipen, wat handig is voor externe installatiescripts:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Voorbeeldpatch:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

Gebruik `--replace-path <path>` wanneer een object of array exact de opgegeven waarde moet worden in plaats van recursief gepatcht te worden:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` voert schema- en SecretRef-oplosbaarheidscontroles uit zonder te schrijven. Exec-backed SecretRefs worden tijdens dry-run standaard overgeslagen; voeg `--allow-exec` toe wanneer je bewust wilt dat dry-run provideropdrachten uitvoert.

JSON-pad-/waardemodus blijft ondersteund voor zowel SecretRefs als providers:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Provider-buildervlaggen

Provider-builderdoelen moeten `secrets.providers.<alias>` als pad gebruiken.

<AccordionGroup>
  <Accordion title="Algemene vlaggen">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Env-provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (herhaalbaar)

  </Accordion>
  <Accordion title="Bestandsprovider (--provider-source file)">
    - `--provider-path <path>` (vereist)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec-provider (--provider-source exec)">
    - `--provider-command <path>` (vereist)
    - `--provider-arg <arg>` (herhaalbaar)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (herhaalbaar)
    - `--provider-pass-env <ENV_VAR>` (herhaalbaar)
    - `--provider-trusted-dir <path>` (herhaalbaar)
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

Voorbeeld van een geharde exec-provider:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## Dry run

Gebruik `--dry-run` om wijzigingen te valideren zonder `openclaw.json` te schrijven.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

<AccordionGroup>
  <Accordion title="Dry-run-gedrag">
    - Buildermodus: voert SecretRef-oplosbaarheidscontroles uit voor gewijzigde refs/providers.
    - JSON-modus (`--strict-json`, `--json` of batchmodus): voert schemavalidatie plus SecretRef-oplosbaarheidscontroles uit.
    - Beleidsvalidatie wordt ook uitgevoerd voor bekende niet-ondersteunde SecretRef-doeloppervlakken.
    - Beleidscontroles evalueren de volledige configuratie na de wijziging, dus schrijfbewerkingen op bovenliggende objecten (bijvoorbeeld `hooks` als object instellen) kunnen validatie van niet-ondersteunde oppervlakken niet omzeilen.
    - Exec SecretRef-controles worden tijdens dry-run standaard overgeslagen om neveneffecten van opdrachten te vermijden.
    - Gebruik `--allow-exec` met `--dry-run` om je aan te melden voor exec SecretRef-controles (dit kan provideropdrachten uitvoeren).
    - `--allow-exec` is alleen voor dry-run en geeft een fout als het zonder `--dry-run` wordt gebruikt.

  </Accordion>
  <Accordion title="--dry-run --json-velden">
    `--dry-run --json` drukt een machineleesbaar rapport af:

    - `ok`: of dry-run is geslaagd
    - `operations`: aantal geëvalueerde toewijzingen
    - `checks`: of schema-/oplosbaarheidscontroles zijn uitgevoerd
    - `checks.resolvabilityComplete`: of oplosbaarheidscontroles tot voltooiing zijn uitgevoerd (false wanneer exec refs worden overgeslagen)
    - `refsChecked`: aantal refs dat daadwerkelijk tijdens dry-run is opgelost
    - `skippedExecRefs`: aantal exec refs dat is overgeslagen omdat `--allow-exec` niet was ingesteld
    - `errors`: gestructureerde schema-/oplosbaarheidsfouten wanneer `ok=false`

  </Accordion>
</AccordionGroup>

### Vorm van JSON-uitvoer

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // present for resolvability errors
    },
  ],
}
```

<Tabs>
  <Tab title="Success example">
    ```json
    {
      "ok": true,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0
    }
    ```
  </Tab>
  <Tab title="Failure example">
    ```json
    {
      "ok": false,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0,
      "errors": [
        {
          "kind": "resolvability",
          "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="If dry-run fails">
    - `config schema validation failed`: de vorm van je configuratie na de wijziging is ongeldig; corrigeer het pad/de waarde of de objectvorm van de provider/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: verplaats die aanmeldgegevens terug naar platte tekst/tekenreeksinvoer en houd SecretRefs alleen op ondersteunde oppervlakken.
    - `SecretRef assignment(s) could not be resolved`: de provider/ref waarnaar wordt verwezen kan momenteel niet worden opgelost (ontbrekende omgevingsvariabele, ongeldige bestandsverwijzing, fout in exec-provider of mismatch tussen provider/bron).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run heeft exec-refs overgeslagen; voer opnieuw uit met `--allow-exec` als je exec-oplosbaarheidsvalidatie nodig hebt.
    - Corrigeer voor batchmodus de falende vermeldingen en voer `--dry-run` opnieuw uit voordat je schrijft.

  </Accordion>
</AccordionGroup>

## Schrijfveiligheid

`openclaw config set` en andere configuratieschrijvers die eigendom zijn van OpenClaw valideren de volledige configuratie na wijziging voordat ze die naar schijf schrijven. Als de nieuwe payload niet door schemavalidatie komt of op een destructieve overschrijving lijkt, blijft de actieve configuratie ongemoeid en wordt de geweigerde payload ernaast opgeslagen als `openclaw.json.rejected.*`.

<Warning>
Het actieve configuratiepad moet een regulier bestand zijn. Indelingen met een gesymlinkte `openclaw.json` worden niet ondersteund voor schrijfbewerkingen; gebruik in plaats daarvan `OPENCLAW_CONFIG_PATH` om rechtstreeks naar het echte bestand te wijzen.
</Warning>

Geef de voorkeur aan CLI-schrijfbewerkingen voor kleine aanpassingen:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Als een schrijfbewerking wordt geweigerd, inspecteer dan de opgeslagen payload en corrigeer de volledige configuratievorm:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Rechtstreekse bewerkingen in een editor zijn nog steeds toegestaan, maar de draaiende Gateway behandelt ze als niet-vertrouwd totdat ze valideren. Ongeldige rechtstreekse bewerkingen kunnen tijdens het opstarten of hot reload worden hersteld vanuit de laatste bekende goede back-up. Zie [Gateway-probleemoplossing](/nl/gateway/troubleshooting#gateway-restored-last-known-good-config).

Herstel van het volledige bestand is gereserveerd voor globaal defecte configuratie, zoals parsefouten, schemavalidatiefouten op rootniveau, mislukte legacy-migraties of gecombineerde plugin- en rootfouten. Als validatie alleen faalt onder `plugins.entries.<id>...`, houdt OpenClaw de actieve `openclaw.json` op zijn plaats en rapporteert het het plugin-lokale probleem in plaats van `.last-good` te herstellen. Dit voorkomt dat wijzigingen in het pluginschema of afwijkingen in `minHostVersion` niet-gerelateerde gebruikersinstellingen terugdraaien, zoals modellen, providers, auth-profielen, kanalen, Gateway-blootstelling, tools, geheugen, browser of cron-configuratie.

## Subopdrachten

- `config file`: Druk het pad van het actieve configuratiebestand af (opgelost vanuit `OPENCLAW_CONFIG_PATH` of de standaardlocatie). Het pad moet een regulier bestand aanwijzen, geen symlink.

Start de Gateway opnieuw na bewerkingen.

## Valideren

Valideer de huidige configuratie tegen het actieve schema zonder de Gateway te starten.

```bash
openclaw config validate
openclaw config validate --json
```

Nadat `openclaw config validate` slaagt, kun je de lokale TUI gebruiken om een ingebedde agent de actieve configuratie met de documentatie te laten vergelijken terwijl je elke wijziging vanuit dezelfde terminal valideert:

<Note>
Als validatie al faalt, begin dan met `openclaw configure` of `openclaw doctor --fix`. `openclaw chat` omzeilt de beveiliging tegen ongeldige configuratie niet.
</Note>

```bash
openclaw chat
```

Daarna binnen de TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Typische herstellus:

<Steps>
  <Step title="Compare with docs">
    Vraag de agent om je huidige configuratie te vergelijken met de relevante documentatiepagina en de kleinste fix voor te stellen.
  </Step>
  <Step title="Apply targeted edits">
    Pas gerichte bewerkingen toe met `openclaw config set` of `openclaw configure`.
  </Step>
  <Step title="Re-validate">
    Voer `openclaw config validate` opnieuw uit na elke wijziging.
  </Step>
  <Step title="Doctor for runtime issues">
    Als validatie slaagt maar de runtime nog steeds ongezond is, voer dan `openclaw doctor` of `openclaw doctor --fix` uit voor hulp bij migratie en herstel.
  </Step>
</Steps>

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Configuratie](/nl/gateway/configuration)
