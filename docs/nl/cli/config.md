---
read_when:
    - Je wilt de configuratie niet-interactief lezen of bewerken
sidebarTitle: Config
summary: CLI-referentie voor `openclaw config` (ophalen/instellen/wijzigen/verwijderen/bestand/schema/valideren)
title: Configuratie
x-i18n:
    generated_at: "2026-07-12T08:42:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a9531407b2314d1a6bc05a87eb7efb6c37a847378b150125693f4d59733a2e9
    source_path: cli/config.md
    workflow: 16
---

Niet-interactieve hulpfuncties voor `openclaw.json`: een waarde op basis van een pad ophalen/instellen/patchen/verwijderen, het schema weergeven, valideren of het actieve bestandspad weergeven. Voer `openclaw config` zonder subopdracht uit om dezelfde begeleide wizard te openen als met `openclaw configure`.

<Note>
Wanneer `OPENCLAW_NIX_MODE=1` is ingesteld, behandelt OpenClaw `openclaw.json` als onveranderlijk. Alleen-lezenopdrachten (`config get`, `config file`, `config schema`, `config validate`) blijven werken; opdrachten die de configuratie wijzigen, worden geweigerd. Bewerk in plaats daarvan de Nix-bron voor de installatie; gebruik voor de officiële nix-openclaw-distributie de [snelstartgids voor nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) en stel waarden in onder `programs.openclaw.config` of `instances.<name>.config`.
</Note>

## Hoofdopties

<ParamField path="--section <section>" type="string">
  Herhaalbaar sectiefilter voor de begeleide installatie wanneer u `openclaw config` zonder subopdracht uitvoert.
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

Punt- of haakjesnotatie. Zet paden met haakjes in shellvoorbeelden tussen aanhalingstekens, zodat zsh `[0]` niet als globpatroon uitbreidt:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

Leest een waarde uit de geredigeerde configuratiemomentopname (geheimen worden nooit weergegeven). Met `--json` wordt de onbewerkte waarde als JSON weergegeven; anders worden tekenreeksen/getallen/booleaanse waarden zonder opmaak weergegeven en objecten/matrices als opgemaakte JSON.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

Geeft het actieve configuratiebestandspad weer, bepaald aan de hand van `OPENCLAW_CONFIG_PATH` of de standaardlocatie. Het pad verwijst naar een regulier bestand, niet naar een symbolische koppeling; zie [Schrijfveiligheid](#write-safety).

### `config schema`

Geeft het gegenereerde JSON-schema voor `openclaw.json` weer op stdout.

<AccordionGroup>
  <Accordion title="Wat het bevat">
    - Het huidige hoofdconfiguratieschema, plus een tekenreeksveld `$schema` op hoofdniveau voor editorhulpmiddelen.
    - Documentatiemetagegevens in de velden `title` / `description` die door de Control UI worden gebruikt.
    - Geneste objecten, jokertekens (`*`) en matrixitemknooppunten (`[]`) nemen dezelfde metagegevens voor `title` / `description` over wanneer bijbehorende velddocumentatie bestaat.
    - Vertakkingen met `anyOf` / `oneOf` / `allOf` nemen eveneens dezelfde documentatiemetagegevens over.
    - Waar mogelijk actuele schemametagegevens van plugins en kanalen wanneer runtimemanifesten kunnen worden geladen.
    - Een schoon terugvalschema, zelfs wanneer de huidige configuratie ongeldig is.

  </Accordion>
  <Accordion title="Gerelateerde runtime-RPC">
    `config.schema.lookup` retourneert één genormaliseerd configuratiepad met een oppervlakkig schemaknooppunt (`title`, `description`, `type`, `enum`, `const`, algemene grenswaarden), overeenkomende metagegevens voor UI-aanwijzingen en samenvattingen van directe onderliggende elementen. Gebruik dit om binnen een specifiek pad verder te navigeren in de Control UI of aangepaste clients.
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
Als de validatie al mislukt, begint u met `openclaw configure` of `openclaw doctor --fix`. `openclaw chat` omzeilt de beveiliging tegen ongeldige configuraties niet.
</Note>

## Waarden

Waarden worden waar mogelijk als JSON5 geparseerd; anders worden ze als onbewerkte tekenreeksen behandeld. Gebruik `--strict-json` om standaard-JSON zonder terugval naar een tekenreeks te vereisen (syntaxis die alleen in JSON5 geldig is, zoals opmerkingen, afsluitende komma's of sleutels zonder aanhalingstekens, wordt dan geweigerd). `--json` is een verouderde alias voor `--strict-json` bij `config set`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` geeft de onbewerkte waarde als JSON weer in plaats van als voor de terminal opgemaakte tekst.

<Note>
Bij toewijzing van een object wordt het doelpad standaard vervangen. Beveiligde paden die vaak door gebruikers toegevoegde vermeldingen bevatten, weigeren vervangingen waardoor bestaande vermeldingen zouden worden verwijderd, tenzij u `--replace` opgeeft: `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries` en `auth.profiles`.
</Note>

Gebruik `--merge` wanneer u vermeldingen aan deze toewijzingen toevoegt:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Gebruik `--replace` alleen wanneer de opgegeven waarde bewust de volledige doelwaarde moet worden.

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
  <Tab title="Provideropbouwmodus">
    Alleen gericht op paden van het type `secrets.providers.<alias>`:

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
SecretRef-toewijzingen worden geweigerd op niet-ondersteunde oppervlakken die tijdens runtime kunnen worden gewijzigd (bijvoorbeeld `hooks.token`, `commands.ownerDisplaySecret`, Webhook-tokens voor Discord-threadkoppeling en JSON met WhatsApp-referenties). Zie [Referentieoppervlak voor SecretRef-inloggegevens](/nl/reference/secretref-credential-surface).
</Warning>

Bij batchverwerking geldt de batchlading (`--batch-json`/`--batch-file`) altijd als gezaghebbende bron; `--strict-json` / `--json` wijzigen het gedrag van batchverwerking niet.

De JSON-pad/waardemodus werkt ook rechtstreeks voor SecretRefs en providers:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### Provideropbouwvlaggen

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

Voorbeeld van een geharde uitvoerprovider:

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

Plak of stuur via een pipe een configuratievormige JSON5-patch in plaats van veel padgebaseerde `config set`-opdrachten uit te voeren. Objecten worden recursief samengevoegd; matrices en scalaire waarden vervangen het doel; `null` verwijdert het doelpad.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Stuur een patch via stdin voor externe installatiescripts:

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

Gebruik `--replace-path <path>` wanneer één object of matrix exact de opgegeven waarde moet krijgen in plaats van recursief te worden gepatcht:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` voert schema- en oplosbaarheidscontroles voor SecretRef uit zonder te schrijven. SecretRefs die door uitvoeropdrachten worden ondersteund, worden tijdens een proefuitvoering standaard overgeslagen; voeg `--allow-exec` toe wanneer u bewust wilt dat de proefuitvoering provideropdrachten uitvoert.

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
  <Accordion title="Gedrag bij een proefuitvoering">
    - Builder-modus: voert controles uit op de oplosbaarheid van SecretRefs voor gewijzigde refs/providers.
    - JSON-modus (`--strict-json`, `--json` of batchmodus): voert schemavalidatie en controles op de oplosbaarheid van SecretRefs uit.
    - Beleidsvalidatie wordt uitgevoerd op de volledige configuratie na de wijziging, zodat schrijfbewerkingen naar bovenliggende objecten (bijvoorbeeld `hooks` instellen als een object) de validatie van niet-ondersteunde oppervlakken niet kunnen omzeilen.
    - Controles van Exec-SecretRefs worden standaard overgeslagen om neveneffecten van opdrachten te voorkomen; geef `--allow-exec` op om ze in te schakelen (hierdoor kunnen provideropdrachten worden uitgevoerd). `--allow-exec` is alleen voor proefuitvoeringen en geeft een fout zonder `--dry-run`.

  </Accordion>
  <Accordion title="Velden van --dry-run --json">
    - `ok`: of de proefuitvoering is geslaagd
    - `operations`: aantal geëvalueerde toewijzingen
    - `checks`: of schema-/oplosbaarheidscontroles zijn uitgevoerd
    - `checks.resolvabilityComplete`: of de oplosbaarheidscontroles volledig zijn uitgevoerd (onwaar wanneer Exec-refs worden overgeslagen)
    - `refsChecked`: aantal refs dat tijdens de proefuitvoering daadwerkelijk is opgelost
    - `skippedExecRefs`: aantal overgeslagen Exec-refs omdat `--allow-exec` niet was ingesteld
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
  <Tab title="Voorbeeld van een fout">
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
          "message": "Fout: Omgevingsvariabele \"MISSING_TEST_SECRET\" is niet ingesteld.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Als de proefuitvoering mislukt">
    - `config schema validation failed`: de structuur van de configuratie na de wijziging is ongeldig; corrigeer het pad/de waarde of de vorm van het provider-/ref-object.
    - `Config policy validation failed: unsupported SecretRef usage`: zet die aanmeldgegevens terug naar invoer als platte tekst/tekenreeks; gebruik SecretRefs alleen op ondersteunde oppervlakken.
    - `SecretRef assignment(s) could not be resolved`: de provider/ref waarnaar wordt verwezen kan momenteel niet worden opgelost (ontbrekende omgevingsvariabele, ongeldige bestandsverwijzing, fout van de Exec-provider of niet-overeenkomende provider/bron).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: voer de opdracht opnieuw uit met `--allow-exec` als u validatie van de oplosbaarheid van Exec nodig hebt.
    - Corrigeer voor de batchmodus de mislukte vermeldingen en voer `--dry-run` opnieuw uit voordat u schrijft.

  </Accordion>
</AccordionGroup>

## Wijzigingen toepassen

Na elke geslaagde `config set` / `config patch` / `config unset` drukt de CLI een van drie aanwijzingen af, zodat u weet of de Gateway opnieuw moet worden gestart:

| Aanwijzing                                         | Betekenis                                            |
| -------------------------------------------------- | ---------------------------------------------------- |
| `Restart the gateway to apply.`                     | Voor het gewijzigde pad is een volledige herstart nodig. |
| `Change will apply without restarting the gateway.` | Hot reload verwerkt de wijziging automatisch.       |
| `No gateway restart needed.`                        | Er is niets gewijzigd dat relevant is voor de runtime. |

Schrijfbewerkingen naar `plugins.entries` (of een subpad daarvan) vereisen altijd een herstart, omdat de CLI niet kan aantonen dat de metadata voor herladen van elke Plugin is geladen.

## Schrijfveiligheid

`openclaw config set` en andere configuratieschrijvers van OpenClaw valideren de volledige configuratie na de wijziging voordat deze naar schijf wordt geschreven. Als de nieuwe payload niet door de schemavalidatie komt of op destructief overschrijven lijkt, blijft de actieve configuratie ongewijzigd en wordt de geweigerde payload ernaast opgeslagen als `openclaw.json.rejected.*`.

<Warning>
Het actieve configuratiepad moet een normaal bestand zijn. Indelingen waarbij `openclaw.json` een symbolische koppeling is, worden niet ondersteund voor schrijfbewerkingen; gebruik in plaats daarvan `OPENCLAW_CONFIG_PATH` om rechtstreeks naar het echte bestand te verwijzen.
</Warning>

Geef voor kleine wijzigingen de voorkeur aan schrijfbewerkingen via de CLI:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Als een schrijfbewerking wordt geweigerd, inspecteert u de opgeslagen payload en corrigeert u de volledige configuratiestructuur:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Rechtstreekse schrijfbewerkingen met een editor zijn nog steeds toegestaan, maar de actieve Gateway behandelt ze als niet-vertrouwd totdat ze zijn gevalideerd. Ongeldige rechtstreekse wijzigingen verhinderen het opstarten of worden door Hot reload overgeslagen; de Gateway herschrijft `openclaw.json` niet. Voer `openclaw doctor --fix` uit om een configuratie met voorvoegsels/overschrijvingen te herstellen of de laatst bekende goede kopie terug te zetten. Zie [Probleemoplossing voor de Gateway](/nl/gateway/troubleshooting#gateway-rejected-invalid-config).

Herstel van het volledige bestand is voorbehouden aan reparatie door Doctor. Wijzigingen in het Plugin-schema of afwijkingen in `minHostVersion` blijven duidelijke fouten geven in plaats van niet-gerelateerde gebruikersinstellingen terug te draaien, zoals de configuratie van modellen, providers, authenticatieprofielen, kanalen, Gateway-blootstelling, hulpmiddelen, geheugen, browser of Cron.

## Reparatiecyclus

Nadat `openclaw config validate` is geslaagd, gebruikt u de lokale TUI om een ingebedde agent de actieve configuratie met de documentatie te laten vergelijken, terwijl u elke wijziging vanuit dezelfde terminal valideert:

```bash
openclaw chat
```

Binnen de TUI voert een `!` aan het begin een letterlijke lokale shellopdracht uit (na een eenmalige bevestigingsprompt per sessie):

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="Vergelijken met de documentatie">
    Vraag de agent om uw huidige configuratie met de relevante documentatiepagina te vergelijken en de kleinst mogelijke oplossing voor te stellen.
  </Step>
  <Step title="Gerichte wijzigingen toepassen">
    Pas gerichte wijzigingen toe met `openclaw config set` of `openclaw configure`.
  </Step>
  <Step title="Opnieuw valideren">
    Voer `openclaw config validate` na elke wijziging opnieuw uit.
  </Step>
  <Step title="Doctor gebruiken voor runtimeproblemen">
    Als de validatie slaagt maar de runtime nog steeds niet goed functioneert, voert u `openclaw doctor` of `openclaw doctor --fix` uit voor hulp bij migratie en reparatie.
  </Step>
</Steps>

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Configuratie](/nl/gateway/configuration)
