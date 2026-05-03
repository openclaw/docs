---
read_when:
    - U wilt configuratie niet-interactief lezen of bewerken
sidebarTitle: Config
summary: CLI-referentie voor `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Configuratie
x-i18n:
    generated_at: "2026-05-03T21:27:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7be6a2ff8474fe78deb1d32dd822a4cf8a2b420dfb45306be5d7c5a1d54f0b4d
    source_path: cli/config.md
    workflow: 16
---

Confighelpers voor niet-interactieve bewerkingen in `openclaw.json`: waarden op pad ophalen/instellen/patchen/verwijderen/bestand/schema/valideren en het actieve configuratiebestand afdrukken. Voer uit zonder subopdracht om de configuratiewizard te openen (hetzelfde als `openclaw configure`).

## Rootopties

<ParamField path="--section <section>" type="string">
  Herhaalbaar sectiefilter voor begeleide setup wanneer je `openclaw config` zonder subopdracht uitvoert.
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

Druk het gegenereerde JSON-schema voor `openclaw.json` af naar stdout als JSON.

<AccordionGroup>
  <Accordion title="What it includes">
    - Het huidige rootconfiguratieschema, plus een rootveld `$schema` als tekenreeks voor editorhulpmiddelen.
    - Documentatiemetadata `title` en `description` voor velden, gebruikt door de Control UI.
    - Geneste object-, wildcard- (`*`) en array-itemnodes (`[]`) erven dezelfde metadata `title` / `description` wanneer overeenkomende velddocumentatie bestaat.
    - Vertakkingen `anyOf` / `oneOf` / `allOf` erven ook dezelfde documentatiemetadata wanneer overeenkomende velddocumentatie bestaat.
    - Best-effort live schema-metadata voor Plugin en kanaal wanneer runtime-manifesten kunnen worden geladen.
    - Een schoon fallbackschema, zelfs wanneer de huidige configuratie ongeldig is.

  </Accordion>
  <Accordion title="Related runtime RPC">
    `config.schema.lookup` retourneert één genormaliseerd configuratiepad met een ondiepe schemanode (`title`, `description`, `type`, `enum`, `const`, algemene grenzen), overeenkomende UI-hintmetadata en samenvattingen van directe kinderen. Gebruik dit voor padafgebakende verdieping in Control UI of aangepaste clients.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Pipe dit naar een bestand wanneer je het met andere hulpmiddelen wilt inspecteren of valideren:

```bash
openclaw config schema > openclaw.schema.json
```

### Paden

Paden gebruiken punt- of haakjesnotatie:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Gebruik de index van de agentlijst om een specifieke agent te targeten:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Waarden

Waarden worden waar mogelijk als JSON5 geparseerd; anders worden ze als tekenreeksen behandeld. Gebruik `--strict-json` om JSON5-parsing te vereisen. `--json` blijft ondersteund als legacy-alias.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` drukt de ruwe waarde af als JSON in plaats van terminalopgemaakte tekst.

<Note>
Objecttoewijzing vervangt standaard het doelpad. Beschermde map-/lijstpaden die vaak door gebruikers toegevoegde vermeldingen bevatten, zoals `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` en `auth.profiles`, weigeren vervangingen die bestaande vermeldingen zouden verwijderen, tenzij je `--replace` doorgeeft.
</Note>

Gebruik `--merge` wanneer je vermeldingen aan die mappen toevoegt:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Gebruik `--replace` alleen wanneer je bewust wilt dat de opgegeven waarde de volledige doelwaarde wordt.

## `config set`-modi

`openclaw config set` ondersteunt vier toewijzingsstijlen:

<Tabs>
  <Tab title="Value mode">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef builder mode">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Provider builder mode">
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
  <Tab title="Batch mode">
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
SecretRef-toewijzingen worden geweigerd op niet-ondersteunde runtime-muteerbare oppervlakken (bijvoorbeeld `hooks.token`, `commands.ownerDisplaySecret`, Discord thread-binding Webhook-tokens en WhatsApp-creds-JSON). Zie [SecretRef-referentieoppervlak](/nl/reference/secretref-credential-surface).
</Warning>

Batchparsing gebruikt altijd de batchpayload (`--batch-json`/`--batch-file`) als bron van waarheid. `--strict-json` / `--json` veranderen het batchparseergedrag niet.

## `config patch`

Gebruik `config patch` wanneer je een configuratievormige patch wilt plakken of pipen in plaats van veel padgebaseerde `config set`-opdrachten uit te voeren. De invoer is een JSON5-object. Objecten worden recursief samengevoegd, arrays en scalaire waarden vervangen de doelwaarde, en `null` verwijdert het doelpad.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Je kunt ook een patch via stdin pipen, wat handig is voor scripts voor setup op afstand:

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

Gebruik `--replace-path <path>` wanneer één object of array exact de opgegeven waarde moet worden in plaats van recursief gepatcht te worden:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` voert schema- en SecretRef-oplosbaarheidscontroles uit zonder te schrijven. Door exec ondersteunde SecretRefs worden standaard overgeslagen tijdens dry-run; voeg `--allow-exec` toe wanneer je bewust wilt dat dry-run provideropdrachten uitvoert.

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
  <Accordion title="Common flags">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Env provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (herhaalbaar)

  </Accordion>
  <Accordion title="File provider (--provider-source file)">
    - `--provider-path <path>` (vereist)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec provider (--provider-source exec)">
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

## Dry-run

Gebruik `--dry-run` om wijzigingen te valideren zonder naar `openclaw.json` te schrijven.

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
  <Accordion title="Dry-run behavior">
    - Buildermodus: voert SecretRef-oplosbaarheidscontroles uit voor gewijzigde refs/providers.
    - JSON-modus (`--strict-json`, `--json` of batchmodus): voert schemavalidatie plus SecretRef-oplosbaarheidscontroles uit.
    - Beleidsvalidatie wordt ook uitgevoerd voor bekende niet-ondersteunde SecretRef-doeloppervlakken.
    - Beleidscontroles evalueren de volledige configuratie na de wijziging, zodat parent-objectwrites (bijvoorbeeld `hooks` instellen als object) validatie van niet-ondersteunde oppervlakken niet kunnen omzeilen.
    - Exec-SecretRef-controles worden standaard overgeslagen tijdens dry-run om neveneffecten van opdrachten te vermijden.
    - Gebruik `--allow-exec` met `--dry-run` om exec-SecretRef-controles expliciet in te schakelen (dit kan provideropdrachten uitvoeren).
    - `--allow-exec` is alleen voor dry-run en geeft een fout als het zonder `--dry-run` wordt gebruikt.

  </Accordion>
  <Accordion title="--dry-run --json fields">
    `--dry-run --json` drukt een machineleesbaar rapport af:

    - `ok`: of dry-run is geslaagd
    - `operations`: aantal geëvalueerde toewijzingen
    - `checks`: of schema-/oplosbaarheidscontroles zijn uitgevoerd
    - `checks.resolvabilityComplete`: of oplosbaarheidscontroles tot voltooiing zijn uitgevoerd (false wanneer exec-refs worden overgeslagen)
    - `refsChecked`: aantal refs dat daadwerkelijk is opgelost tijdens dry-run
    - `skippedExecRefs`: aantal exec-refs dat is overgeslagen omdat `--allow-exec` niet was ingesteld
    - `errors`: gestructureerde schema-/oplosbaarheidsfouten wanneer `ok=false`

  </Accordion>
</AccordionGroup>

### JSON-uitvoervorm

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
  <Tab title="Voorbeeld van succes">
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
  <Tab title="Voorbeeld van mislukking">
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
  <Accordion title="Als dry-run mislukt">
    - `config schema validation failed`: de vorm van je configuratie na de wijziging is ongeldig; corrigeer het pad/de waarde of de vorm van het provider-/ref-object.
    - `Config policy validation failed: unsupported SecretRef usage`: verplaats die referentie terug naar platte tekst/string-invoer en houd SecretRefs alleen op ondersteunde oppervlakken.
    - `SecretRef assignment(s) could not be resolved`: de provider/ref waarnaar wordt verwezen kan momenteel niet worden opgelost (ontbrekende omgevingsvariabele, ongeldige bestandsverwijzing, mislukking van exec-provider, of mismatch tussen provider en bron).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run heeft exec-refs overgeslagen; voer opnieuw uit met `--allow-exec` als je validatie van exec-oplosbaarheid nodig hebt.
    - Corrigeer voor batchmodus mislukte vermeldingen en voer `--dry-run` opnieuw uit voordat je schrijft.

  </Accordion>
</AccordionGroup>

## Schrijfveiligheid

`openclaw config set` en andere configuratieschrijvers van OpenClaw valideren de volledige configuratie na de wijziging voordat ze die naar schijf schrijven. Als de nieuwe payload niet door schemavalidatie komt of eruitziet als destructief overschrijven, blijft de actieve configuratie ongemoeid en wordt de geweigerde payload ernaast opgeslagen als `openclaw.json.rejected.*`.

<Warning>
Het actieve configuratiepad moet een regulier bestand zijn. Lay-outs met een gesymlinkte `openclaw.json` worden niet ondersteund voor schrijven; gebruik in plaats daarvan `OPENCLAW_CONFIG_PATH` om rechtstreeks naar het echte bestand te wijzen.
</Warning>

Gebruik bij voorkeur CLI-schrijfopdrachten voor kleine wijzigingen:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Als een schrijfopdracht wordt geweigerd, inspecteer dan de opgeslagen payload en corrigeer de volledige configuratievorm:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Rechtstreekse bewerkingen in een editor zijn nog steeds toegestaan, maar de draaiende Gateway behandelt ze als niet-vertrouwd totdat ze valideren. Ongeldige rechtstreekse bewerkingen laten het opstarten mislukken of worden door hot reload overgeslagen; Gateway herschrijft `openclaw.json` niet. Voer `openclaw doctor --fix` uit om configuratie met prefixen of overschrijvingen te herstellen, of herstel de laatst bekende goede kopie. Zie [Gateway-probleemoplossing](/nl/gateway/troubleshooting#gateway-rejected-invalid-config).

Herstel van een volledig bestand is voorbehouden aan doctor-reparatie. Wijzigingen in Plugin-schema's of afwijkingen in `minHostVersion` blijven duidelijk zichtbaar in plaats van niet-gerelateerde gebruikersinstellingen terug te draaien, zoals modellen, providers, auth-profielen, kanalen, gateway-blootstelling, tools, geheugen, browser of cron-configuratie.

## Subopdrachten

- `config file`: Druk het actieve pad naar het configuratiebestand af (opgelost vanuit `OPENCLAW_CONFIG_PATH` of de standaardlocatie). Het pad moet een regulier bestand aanduiden, geen symlink.

Start de Gateway opnieuw na bewerkingen.

## Valideren

Valideer de huidige configuratie tegen het actieve schema zonder de Gateway te starten.

```bash
openclaw config validate
openclaw config validate --json
```

Nadat `openclaw config validate` slaagt, kun je de lokale TUI gebruiken om een ingebedde agent de actieve configuratie met de documentatie te laten vergelijken terwijl je elke wijziging vanuit dezelfde terminal valideert:

<Note>
Als validatie al mislukt, begin dan met `openclaw configure` of `openclaw doctor --fix`. `openclaw chat` omzeilt de bewaking tegen ongeldige configuratie niet.
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

Typische herstelcyclus:

<Steps>
  <Step title="Vergelijken met documentatie">
    Vraag de agent om je huidige configuratie te vergelijken met de relevante documentatiepagina en de kleinste oplossing voor te stellen.
  </Step>
  <Step title="Gerichte bewerkingen toepassen">
    Pas gerichte bewerkingen toe met `openclaw config set` of `openclaw configure`.
  </Step>
  <Step title="Opnieuw valideren">
    Voer `openclaw config validate` opnieuw uit na elke wijziging.
  </Step>
  <Step title="Doctor voor runtimeproblemen">
    Als validatie slaagt maar de runtime nog steeds ongezond is, voer dan `openclaw doctor` of `openclaw doctor --fix` uit voor hulp bij migratie en herstel.
  </Step>
</Steps>

## Gerelateerd

- [CLI-naslag](/nl/cli)
- [Configuratie](/nl/gateway/configuration)
