---
read_when:
    - Je wilt de configuratie niet-interactief lezen of bewerken
sidebarTitle: Config
summary: CLI-referentie voor `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Configuratie
x-i18n:
    generated_at: "2026-07-16T15:33:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 63be5cbac6c7db9c6b93ad690e5decab9f4ce7904e8b10f26a3b1e39e4729450
    source_path: cli/config.md
    workflow: 16
---

Niet-interactieve hulpprogramma's voor `openclaw.json`: een waarde op basis van een pad ophalen/instellen/patchen/verwijderen, het schema afdrukken, valideren of het actieve bestandspad afdrukken. Voer `openclaw config` zonder subopdracht uit om dezelfde begeleide wizard te openen als `openclaw configure`.

<Note>
Wanneer `OPENCLAW_NIX_MODE=1`, behandelt OpenClaw `openclaw.json` als onveranderlijk. Alleen-lezenopdrachten (`config get`, `config file`, `config schema`, `config validate`) blijven werken; configuratieschrijvers weigeren. Bewerk in plaats daarvan de Nix-bron voor de installatie; gebruik voor de officiële nix-openclaw-distributie de [snelstart voor nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) en stel waarden in onder `programs.openclaw.config` of `instances.<name>.config`.
</Note>

## Hoofdopties

<ParamField path="--section <section>" type="string">
  Herhaalbaar sectiefilter voor begeleide configuratie wanneer je `openclaw config` zonder subopdracht uitvoert.
</ParamField>

Begeleide secties: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### Paden

Punt- of haakjesnotatie. Zet paden met haakjes in shellvoorbeelden tussen aanhalingstekens, zodat zsh `[0]` niet als glob uitbreidt:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

Leest een waarde uit de geredigeerde configuratiesnapshot (geheimen worden nooit afgedrukt). `--json` drukt de onbewerkte waarde af als JSON; anders worden tekenreeksen/getallen/booleaanse waarden zonder opmaak afgedrukt en objecten/arrays als opgemaakte JSON.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

Drukt het actieve configuratiebestandspad af, bepaald aan de hand van `OPENCLAW_CONFIG_PATH` of de standaardlocatie. Het pad verwijst naar een regulier bestand, niet naar een symbolische koppeling; zie [Schrijfveiligheid](#write-safety).

### `config schema`

Drukt het gegenereerde JSON-schema voor `openclaw.json` af naar stdout.

<AccordionGroup>
  <Accordion title="Wat het bevat">
    - Het huidige hoofdconfiguratieschema, plus een hoofdveld `$schema` van het type tekenreeks voor editorhulpmiddelen.
    - Documentatiemetagegevens voor velden `title` / `description` die door de Control UI worden gebruikt.
    - Geneste object-, jokerteken- (`*`) en array-itemknooppunten (`[]`) nemen dezelfde metagegevens voor `title` / `description` over wanneer overeenkomende velddocumentatie bestaat.
    - Vertakkingen `anyOf` / `oneOf` / `allOf` nemen eveneens dezelfde documentatiemetagegevens over.
    - Naar beste vermogen bepaalde live schema-metagegevens van plugins en kanalen wanneer runtime-manifesten kunnen worden geladen.
    - Een schoon terugvalschema, zelfs wanneer de huidige configuratie ongeldig is.

  </Accordion>
  <Accordion title="Gerelateerde runtime-RPC">
    `config.schema.lookup` retourneert één genormaliseerd configuratiepad met een oppervlakkig schemaknooppunt (`title`, `description`, `type`, `enum`, `const`, algemene grenzen), overeenkomende metagegevens voor UI-aanwijzingen en samenvattingen van directe onderliggende elementen. Gebruik dit voor padgerichte verdieping in de Control UI of aangepaste clients.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

Valideert de huidige configuratie aan de hand van het actieve schema zonder de Gateway te starten.

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
Als de validatie al mislukt, begin dan met `openclaw configure` of `openclaw doctor --fix`. `openclaw chat` omzeilt de beveiliging tegen ongeldige configuraties niet.
</Note>

## Waarden

Waarden worden waar mogelijk als JSON5 geparseerd; anders worden ze als onbewerkte tekenreeksen behandeld. Gebruik `--strict-json` om standaard-JSON zonder terugval naar een tekenreeks te vereisen (syntaxis die alleen in JSON5 geldig is, zoals opmerkingen, afsluitende komma's of sleutels zonder aanhalingstekens, wordt dan geweigerd). `--json` is een verouderde alias voor `--strict-json` bij `config set`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` drukt de onbewerkte waarde af als JSON in plaats van als voor de terminal opgemaakte tekst.

<Note>
Bij toewijzing van een object wordt het doelpad standaard vervangen. Beschermde paden die vaak door gebruikers toegevoegde vermeldingen bevatten, weigeren vervangingen waarbij bestaande vermeldingen zouden worden verwijderd, tenzij je `--replace` doorgeeft: `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries` en `auth.profiles`.
</Note>

Gebruik `--merge` wanneer je vermeldingen aan die toewijzingen toevoegt:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Gebruik `--replace` alleen wanneer de opgegeven waarde opzettelijk de volledige doelwaarde moet worden.

## Modi van `config set`

<Tabs>
  <Tab title="Waardemodus">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef-opbouwmodus">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Provider-opbouwmodus">
    Alleen voor paden onder `secrets.providers.<alias>`:

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
SecretRef-toewijzingen worden geweigerd op niet-ondersteunde oppervlakken die tijdens runtime kunnen worden gewijzigd (bijvoorbeeld `hooks.token`, `commands.ownerDisplaySecret`, Webhook-tokens voor Discord-threadkoppelingen en JSON met WhatsApp-aanmeldgegevens). Zie [Aanmeldgegevensoppervlak voor SecretRef](/nl/reference/secretref-credential-surface).
</Warning>

Bij batchparsering wordt altijd de batchpayload (`--batch-json`/`--batch-file`) als bron van waarheid gebruikt; `--strict-json` / `--json` veranderen het parseergedrag voor batches niet.

De JSON-pad-/waardemodus werkt ook rechtstreeks voor SecretRefs en providers:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### Vlaggen voor provideropbouw

Doelen voor provideropbouw moeten `secrets.providers.<alias>` als pad gebruiken.

<AccordionGroup>
  <Accordion title="Algemene vlaggen">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Omgevingsprovider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (herhaalbaar)

  </Accordion>
  <Accordion title="Bestandsprovider (--provider-source file)">
    - `--provider-path <path>` (vereist)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Uitvoerprovider (--provider-source exec)">
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

Voorbeeld van een beveiligde uitvoerprovider:

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

## `config patch`

Plak of pipe een configuratievormige JSON5-patch in plaats van veel padgebaseerde `config set`-opdrachten uit te voeren. Objecten worden recursief samengevoegd; arrays en scalaire waarden vervangen het doel; `null` verwijdert het doelpad.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Pipe een patch via stdin voor externe configuratiescripts:

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
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
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

Gebruik `--replace-path <path>` wanneer één object of één array exact de opgegeven waarde moet worden in plaats van recursief te worden gepatcht:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` voert controles op het schema en de oplosbaarheid van SecretRefs uit zonder te schrijven. SecretRefs op basis van uitvoeropdrachten worden tijdens een proefuitvoering standaard overgeslagen; voeg `--allow-exec` toe wanneer je opzettelijk wilt dat de proefuitvoering provideropdrachten uitvoert.

## Proefuitvoering

`--dry-run` valideert wijzigingen zonder naar `openclaw.json` te schrijven. Beschikbaar voor `config set`, `config patch` en `config unset`.

```bash
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
  <Accordion title="Gedrag van dry-run">
    - Builder-modus: voert controles uit op de oplosbaarheid van SecretRefs voor gewijzigde refs/providers.
    - JSON-modus (`--strict-json`, `--json` of batchmodus): voert schemavalidatie en controles op de oplosbaarheid van SecretRefs uit.
    - Beleidsvalidatie wordt uitgevoerd op de volledige configuratie na de wijziging, zodat schrijfbewerkingen naar bovenliggende objecten (bijvoorbeeld het instellen van `hooks` als een object) de validatie van niet-ondersteunde oppervlakken niet kunnen omzeilen.
    - Controles van Exec SecretRefs worden standaard overgeslagen om bijwerkingen van opdrachten te voorkomen; geef `--allow-exec` door om ze in te schakelen (hierdoor kunnen provideropdrachten worden uitgevoerd). `--allow-exec` is uitsluitend voor dry-run en geeft een fout zonder `--dry-run`.

  </Accordion>
  <Accordion title="Velden van --dry-run --json">
    - `ok`: of dry-run is geslaagd
    - `operations`: aantal geëvalueerde toewijzingen
    - `checks`: of schema-/oplosbaarheidscontroles zijn uitgevoerd
    - `checks.resolvabilityComplete`: of de oplosbaarheidscontroles volledig zijn uitgevoerd (onwaar wanneer exec-refs worden overgeslagen)
    - `refsChecked`: aantal refs dat daadwerkelijk is opgelost tijdens dry-run
    - `skippedExecRefs`: aantal overgeslagen exec-refs omdat `--allow-exec` niet was ingesteld
    - `errors`: gestructureerde fouten voor ontbrekende paden, schema's of oplosbaarheid wanneer `ok=false`

  </Accordion>
</AccordionGroup>

### Structuur van JSON-uitvoer

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder" | "unset", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "missing-path" | "schema" | "resolvability",
      message: string,
      ref?: string, // aanwezig bij oplosbaarheidsfouten
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
          "message": "Fout: omgevingsvariabele \"MISSING_TEST_SECRET\" is niet ingesteld.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Als dry-run mislukt">
    - `config schema validation failed`: de structuur van je configuratie na de wijziging is ongeldig; corrigeer het pad/de waarde of de structuur van het provider-/ref-object.
    - `Config policy validation failed: unsupported SecretRef usage`: zet die aanmeldgegevens terug naar invoer als platte tekst/tekenreeks; gebruik SecretRefs alleen op ondersteunde oppervlakken.
    - `SecretRef assignment(s) could not be resolved`: de provider/ref waarnaar wordt verwezen, kan momenteel niet worden opgelost (ontbrekende omgevingsvariabele, ongeldige bestandsverwijzing, fout van de exec-provider of verschil tussen provider en bron).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: voer opnieuw uit met `--allow-exec` als je validatie van de oplosbaarheid van exec nodig hebt.
    - Corrigeer in de batchmodus de mislukte vermeldingen en voer `--dry-run` opnieuw uit voordat je schrijft.

  </Accordion>
</AccordionGroup>

## Wijzigingen toepassen

Na elke geslaagde `config set` / `config patch` / `config unset` geeft de CLI een van drie hints weer, zodat je weet of de Gateway opnieuw moet worden gestart:

| Hint                                                | Betekenis                                      |
| --------------------------------------------------- | ---------------------------------------------- |
| `Restart the gateway to apply.`                     | Het gewijzigde pad vereist een volledige herstart. |
| `Change will apply without restarting the gateway.` | Hot reload neemt de wijziging automatisch over. |
| `No gateway restart needed.`                        | Er is niets gewijzigd dat relevant is voor de runtime. |

Schrijfbewerkingen naar `plugins.entries` (of een onderliggend pad) vereisen altijd een herstart, omdat de CLI niet kan bewijzen dat de metadata voor herladen van elke Plugin is geladen.

## Veilig schrijven

`openclaw config set` en andere configuratieschrijvers van OpenClaw valideren de volledige configuratie na de wijziging voordat deze naar schijf wordt geschreven. Als de nieuwe payload niet door de schemavalidatie komt of op destructief overschrijven lijkt, blijft de actieve configuratie ongewijzigd en wordt de geweigerde payload ernaast opgeslagen als `openclaw.json.rejected.*`.

Schrijfbewerkingen van OpenClaw serialiseren JSON5 opnieuw als standaard-JSON. Wanneer de bron opmerkingen bevat, waarschuwt de schrijver direct voordat deze worden verwijderd; gebruik een teksteditor als het behouden van opmerkingen belangrijk is.

<Warning>
Het actieve configuratiepad moet een normaal bestand zijn. Indelingen met een symbolische koppeling voor `openclaw.json` worden niet ondersteund voor schrijfbewerkingen; gebruik in plaats daarvan `OPENCLAW_CONFIG_PATH` om rechtstreeks naar het echte bestand te verwijzen.
</Warning>

Geef voor kleine wijzigingen de voorkeur aan schrijfbewerkingen via de CLI:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Als een schrijfbewerking wordt geweigerd, controleer je de opgeslagen payload en corrigeer je de volledige configuratiestructuur:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Rechtstreekse schrijfbewerkingen via een teksteditor zijn nog steeds toegestaan, maar de actieve Gateway behandelt ze als niet-vertrouwd totdat ze zijn gevalideerd. Ongeldige rechtstreekse wijzigingen verhinderen het opstarten of worden door hot reload overgeslagen; Gateway herschrijft `openclaw.json` niet. Voer `openclaw doctor --fix` uit om een configuratie met voorvoegsels of overschreven configuratie te herstellen, of om de laatst bekende werkende kopie terug te zetten. Zie [Problemen met de Gateway oplossen](/nl/gateway/troubleshooting#gateway-rejected-invalid-config).

Herstel van het volledige bestand is uitsluitend bestemd voor herstel door doctor. Wijzigingen in het schema van een Plugin of afwijkingen in `minHostVersion` blijven duidelijk zichtbaar in plaats van niet-gerelateerde gebruikersinstellingen terug te draaien, zoals configuratie voor modellen, providers, auth-profielen, kanalen, Gateway-blootstelling, tools, geheugen, browser of Cron.

## Herstellus

Nadat `openclaw config validate` is geslaagd, gebruik je de lokale TUI om een ingebedde agent de actieve configuratie met de documentatie te laten vergelijken terwijl je elke wijziging vanuit dezelfde terminal valideert:

```bash
openclaw chat
```

Binnen de TUI voert een voorafgaande `!` een letterlijke lokale shellopdracht uit (na een eenmalige bevestigingsvraag per sessie):

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="Vergelijken met de documentatie">
    Vraag de agent om je huidige configuratie met de relevante documentatiepagina te vergelijken en de kleinste correctie voor te stellen.
  </Step>
  <Step title="Gerichte wijzigingen toepassen">
    Pas gerichte wijzigingen toe met `openclaw config set` of `openclaw configure`.
  </Step>
  <Step title="Opnieuw valideren">
    Voer `openclaw config validate` na elke wijziging opnieuw uit.
  </Step>
  <Step title="Doctor voor runtimeproblemen">
    Als de validatie slaagt maar de runtime nog steeds niet goed werkt, voer je `openclaw doctor` of `openclaw doctor --fix` uit voor hulp bij migratie en herstel.
  </Step>
</Steps>

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Configuratie](/nl/gateway/configuration)
