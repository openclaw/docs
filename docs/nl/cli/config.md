---
read_when:
    - Je wilt configuratie niet-interactief lezen of bewerken
sidebarTitle: Config
summary: CLI-referentie voor `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Configuratie
x-i18n:
    generated_at: "2026-05-06T17:52:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4e0d580347e162278277ddb33eed0e42105c5e85bac4325c07fa2cd700b831d
    source_path: cli/config.md
    workflow: 16
---

Configuratiehelpers voor niet-interactieve bewerkingen in `openclaw.json`: waarden opvragen/instellen/patchen/verwijderen, bestanden/schema's/waarden valideren per pad en het actieve configuratiebestand afdrukken. Voer uit zonder subopdracht om de configuratiewizard te openen (hetzelfde als `openclaw configure`).

<Note>
Wanneer `OPENCLAW_NIX_MODE=1`, behandelt OpenClaw `openclaw.json` als onveranderlijk. Alleen-lezen opdrachten zoals `config get`, `config file`, `config schema` en `config validate` werken nog steeds, maar configuratieschrijvers weigeren. Agents moeten in plaats daarvan de Nix-bron voor de installatie bewerken; gebruik voor de first-party nix-openclaw-distributie [nix-openclaw Snelstart](https://github.com/openclaw/nix-openclaw#quick-start) en stel waarden in onder `programs.openclaw.config` of `instances.<name>.config`.
</Note>

## Hoofdopties

<ParamField path="--section <section>" type="string">
  Herhaalbaar sectiefilter voor begeleide configuratie wanneer je `openclaw config` zonder subopdracht uitvoert.
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
  <Accordion title="Wat het bevat">
    - Het huidige root-configuratieschema, plus een root-veld `$schema` als tekenreeks voor editortooling.
    - Documentatiemetadata `title` en `description` voor velden, gebruikt door de Control UI.
    - Geneste object-, wildcard- (`*`) en array-item-knooppunten (`[]`) erven dezelfde metadata `title` / `description` wanneer overeenkomende velddocumentatie bestaat.
    - `anyOf` / `oneOf` / `allOf`-takken erven ook dezelfde documentatiemetadata wanneer overeenkomende velddocumentatie bestaat.
    - Best-effort live schema-metadata voor plugins en kanalen wanneer runtime-manifesten kunnen worden geladen.
    - Een schoon fallback-schema, zelfs wanneer de huidige configuratie ongeldig is.

  </Accordion>
  <Accordion title="Gerelateerde runtime-RPC">
    `config.schema.lookup` retourneert één genormaliseerd configuratiepad met een oppervlakkig schema-knooppunt (`title`, `description`, `type`, `enum`, `const`, algemene grenzen), overeenkomende metadata voor UI-hints en directe samenvattingen van child-knooppunten. Gebruik dit voor padgerichte drill-down in Control UI of aangepaste clients.
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

Gebruik de index van de agentlijst om een specifieke agent te targeten:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Waarden

Waarden worden waar mogelijk geparseerd als JSON5; anders worden ze behandeld als tekenreeksen. Gebruik `--strict-json` om JSON5-parsing te vereisen. `--json` blijft ondersteund als legacy-alias.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` drukt de ruwe waarde af als JSON in plaats van terminal-geformatteerde tekst.

<Note>
Objecttoewijzing vervangt standaard het doelpad. Beschermde map-/lijstpaden die vaak door gebruikers toegevoegde items bevatten, zoals `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` en `auth.profiles`, weigeren vervangingen die bestaande items zouden verwijderen, tenzij je `--replace` meegeeft.
</Note>

Gebruik `--merge` wanneer je items aan die maps toevoegt:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Gebruik `--replace` alleen wanneer je bewust wilt dat de opgegeven waarde de volledige doelwaarde wordt.

## `config set`-modi

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
    Provider-buildermodus target alleen paden `secrets.providers.<alias>`:

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
SecretRef-toewijzingen worden geweigerd op niet-ondersteunde runtime-muteerbare oppervlakken (bijvoorbeeld `hooks.token`, `commands.ownerDisplaySecret`, Webhook-tokens voor Discord-threadbindingen en WhatsApp-creds-JSON). Zie [SecretRef-referentieoppervlak](/nl/reference/secretref-credential-surface).
</Warning>

Batchparsing gebruikt altijd de batchpayload (`--batch-json`/`--batch-file`) als bron van waarheid. `--strict-json` / `--json` veranderen het batchparsinggedrag niet.

## `config patch`

Gebruik `config patch` wanneer je een configuratievormige patch wilt plakken of pipen in plaats van veel padgebaseerde `config set`-opdrachten uit te voeren. De invoer is een JSON5-object. Objecten worden recursief samengevoegd, arrays en scalaire waarden vervangen de doelwaarde, en `null` verwijdert het doelpad.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Je kunt ook een patch via stdin pipen, wat nuttig is voor scripts voor externe setup:

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

Gebruik `--replace-path <path>` wanneer één object of array exact de opgegeven waarde moet worden in plaats van recursief te worden gepatcht:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` voert schema- en SecretRef-oplosbaarheidscontroles uit zonder te schrijven. Exec-backed SecretRefs worden standaard overgeslagen tijdens dry-run; voeg `--allow-exec` toe wanneer je bewust wilt dat dry-run provideropdrachten uitvoert.

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
  <Accordion title="Dry-run-gedrag">
    - Buildermodus: voert SecretRef-oplosbaarheidscontroles uit voor gewijzigde refs/providers.
    - JSON-modus (`--strict-json`, `--json` of batchmodus): voert schemavalidatie plus SecretRef-oplosbaarheidscontroles uit.
    - Beleidsvalidatie wordt ook uitgevoerd voor bekende niet-ondersteunde SecretRef-doeloppervlakken.
    - Beleidscontroles evalueren de volledige configuratie na wijziging, zodat schrijfacties naar bovenliggende objecten (bijvoorbeeld `hooks` instellen als object) niet om niet-ondersteunde-oppervlakvalidatie heen kunnen.
    - Exec SecretRef-controles worden standaard overgeslagen tijdens dry-run om neveneffecten van opdrachten te vermijden.
    - Gebruik `--allow-exec` met `--dry-run` om je aan te melden voor exec SecretRef-controles (dit kan provideropdrachten uitvoeren).
    - `--allow-exec` is alleen voor dry-run en geeft een fout als het zonder `--dry-run` wordt gebruikt.

  </Accordion>
  <Accordion title="--dry-run --json-velden">
    `--dry-run --json` drukt een machineleesbaar rapport af:

    - `ok`: of dry-run is geslaagd
    - `operations`: aantal geëvalueerde toewijzingen
    - `checks`: of schema-/oplosbaarheidscontroles zijn uitgevoerd
    - `checks.resolvabilityComplete`: of oplosbaarheidscontroles volledig zijn uitgevoerd (false wanneer exec-verwijzingen worden overgeslagen)
    - `refsChecked`: aantal verwijzingen dat daadwerkelijk is opgelost tijdens dry-run
    - `skippedExecRefs`: aantal exec-verwijzingen dat is overgeslagen omdat `--allow-exec` niet was ingesteld
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
    - `config schema validation failed`: de vorm van je configuratie na de wijziging is ongeldig; herstel het pad/de waarde of de vorm van het provider-/ref-object.
    - `Config policy validation failed: unsupported SecretRef usage`: verplaats die referentie terug naar platte tekst-/tekenreeksinvoer en houd SecretRefs alleen op ondersteunde oppervlakken.
    - `SecretRef assignment(s) could not be resolved`: de provider/ref waarnaar wordt verwezen kan momenteel niet worden opgelost (ontbrekende omgevingsvariabele, ongeldige bestandsverwijzing, exec-providerfout of provider-/bronmismatch).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run heeft exec-verwijzingen overgeslagen; voer opnieuw uit met `--allow-exec` als je exec-oplosbaarheidsvalidatie nodig hebt.
    - Voor batchmodus: herstel falende vermeldingen en voer `--dry-run` opnieuw uit voordat je schrijft.

  </Accordion>
</AccordionGroup>

## Schrijfveiligheid

`openclaw config set` en andere door OpenClaw beheerde configuratieschrijvers valideren de volledige configuratie na de wijziging voordat ze die naar schijf schrijven. Als de nieuwe payload niet door schemavalidatie komt of eruitziet als een destructieve overschrijving, blijft de actieve configuratie ongemoeid en wordt de geweigerde payload ernaast opgeslagen als `openclaw.json.rejected.*`.

<Warning>
Het actieve configuratiepad moet een regulier bestand zijn. Lay-outs met een gesymlinkte `openclaw.json` worden niet ondersteund voor schrijfbewerkingen; gebruik in plaats daarvan `OPENCLAW_CONFIG_PATH` om rechtstreeks naar het echte bestand te verwijzen.
</Warning>

Geef de voorkeur aan CLI-schrijfbewerkingen voor kleine wijzigingen:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Als een schrijfbewerking wordt geweigerd, inspecteer dan de opgeslagen payload en herstel de volledige configuratievorm:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Directe bewerkingen in een editor zijn nog steeds toegestaan, maar de draaiende Gateway behandelt ze als onvertrouwd totdat ze valideren. Ongeldige directe bewerkingen laten het opstarten mislukken of worden overgeslagen door hot reload; Gateway herschrijft `openclaw.json` niet. Voer `openclaw doctor --fix` uit om configuratie met prefix/overschrijving te repareren of de laatst bekende goede kopie te herstellen. Zie [Gateway-probleemoplossing](/nl/gateway/troubleshooting#gateway-rejected-invalid-config).

Herstel van het volledige bestand is gereserveerd voor doctor-reparatie. Plugin-schemawijzigingen of `minHostVersion`-scheefstand blijven nadrukkelijk zichtbaar in plaats van niet-gerelateerde gebruikersinstellingen terug te draaien, zoals modellen, providers, auth-profielen, kanalen, Gateway-blootstelling, tools, geheugen, browser of cron-configuratie.

## Subcommando's

- `config file`: Druk het actieve configuratiebestandspad af (opgelost vanuit `OPENCLAW_CONFIG_PATH` of de standaardlocatie). Het pad moet een regulier bestand aanduiden, geen symlink.

Herstart de gateway na wijzigingen.

## Valideren

Valideer de huidige configuratie tegen het actieve schema zonder de gateway te starten.

```bash
openclaw config validate
openclaw config validate --json
```

Nadat `openclaw config validate` slaagt, kun je de lokale TUI gebruiken om een ingebedde agent de actieve configuratie met de docs te laten vergelijken terwijl je elke wijziging vanuit dezelfde terminal valideert:

<Note>
Als validatie al faalt, begin dan met `openclaw configure` of `openclaw doctor --fix`. `openclaw chat` omzeilt de ongeldig-configuratiebeveiliging niet.
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

Typische reparatielus:

<Steps>
  <Step title="Compare with docs">
    Vraag de agent om je huidige configuratie te vergelijken met de relevante docspagina en de kleinste fix voor te stellen.
  </Step>
  <Step title="Apply targeted edits">
    Pas gerichte wijzigingen toe met `openclaw config set` of `openclaw configure`.
  </Step>
  <Step title="Re-validate">
    Voer `openclaw config validate` opnieuw uit na elke wijziging.
  </Step>
  <Step title="Doctor for runtime issues">
    Als validatie slaagt maar de runtime nog steeds ongezond is, voer dan `openclaw doctor` of `openclaw doctor --fix` uit voor hulp bij migratie en reparatie.
  </Step>
</Steps>

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Configuratie](/nl/gateway/configuration)
