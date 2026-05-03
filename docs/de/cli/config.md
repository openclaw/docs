---
read_when:
    - Sie möchten die Konfiguration nicht interaktiv lesen oder bearbeiten
sidebarTitle: Config
summary: CLI-Referenz für `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Konfiguration
x-i18n:
    generated_at: "2026-05-03T21:28:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7be6a2ff8474fe78deb1d32dd822a4cf8a2b420dfb45306be5d7c5a1d54f0b4d
    source_path: cli/config.md
    workflow: 16
---

Konfigurationshelfer für nicht interaktive Änderungen in `openclaw.json`: Werte per Pfad abrufen/festlegen/patchen/entfernen, Datei/Schema validieren und die aktive Konfigurationsdatei ausgeben. Ohne Unterbefehl ausführen, um den Konfigurationsassistenten zu öffnen (identisch mit `openclaw configure`).

## Root-Optionen

<ParamField path="--section <section>" type="string">
  Wiederholbarer Abschnittsfilter für die geführte Einrichtung, wenn Sie `openclaw config` ohne Unterbefehl ausführen.
</ParamField>

Unterstützte geführte Abschnitte: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

## Beispiele

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

Gibt das generierte JSON-Schema für `openclaw.json` als JSON auf stdout aus.

<AccordionGroup>
  <Accordion title="What it includes">
    - Das aktuelle Root-Konfigurationsschema plus ein Root-Stringfeld `$schema` für Editor-Werkzeuge.
    - Die Dokumentationsmetadaten der Felder `title` und `description`, die von der Control UI verwendet werden.
    - Verschachtelte Objekt-, Platzhalter- (`*`) und Array-Element- (`[]`) Knoten erben dieselben `title`- / `description`-Metadaten, wenn passende Felddokumentation vorhanden ist.
    - `anyOf`- / `oneOf`- / `allOf`-Zweige erben ebenfalls dieselben Dokumentationsmetadaten, wenn passende Felddokumentation vorhanden ist.
    - Bestmögliche Live-Metadaten für Plugin- und Kanal-Schemas, wenn Laufzeitmanifeste geladen werden können.
    - Ein sauberes Fallback-Schema, auch wenn die aktuelle Konfiguration ungültig ist.

  </Accordion>
  <Accordion title="Related runtime RPC">
    `config.schema.lookup` gibt einen normalisierten Konfigurationspfad mit einem flachen Schemaknoten (`title`, `description`, `type`, `enum`, `const`, gemeinsame Grenzen), passenden UI-Hinweis-Metadaten und Zusammenfassungen der direkten untergeordneten Elemente zurück. Verwenden Sie dies für pfadbezogene Detailansichten in der Control UI oder in eigenen Clients.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Leiten Sie die Ausgabe in eine Datei um, wenn Sie sie mit anderen Werkzeugen prüfen oder validieren möchten:

```bash
openclaw config schema > openclaw.schema.json
```

### Pfade

Pfade verwenden Punkt- oder Klammernotation:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Verwenden Sie den Index der Agentenliste, um einen bestimmten Agenten anzusprechen:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Werte

Werte werden nach Möglichkeit als JSON5 geparst; andernfalls werden sie als Zeichenketten behandelt. Verwenden Sie `--strict-json`, um JSON5-Parsing zu erzwingen. `--json` bleibt als veralteter Alias unterstützt.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` gibt den Rohwert als JSON statt als für das Terminal formatierten Text aus.

<Note>
Objektzuweisung ersetzt den Zielpfad standardmäßig. Geschützte Map-/Listenpfade, die üblicherweise von Benutzern hinzugefügte Einträge enthalten, etwa `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` und `auth.profiles`, verweigern Ersetzungen, die vorhandene Einträge entfernen würden, sofern Sie nicht `--replace` übergeben.
</Note>

Verwenden Sie `--merge`, wenn Sie diesen Maps Einträge hinzufügen:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Verwenden Sie `--replace` nur, wenn der angegebene Wert bewusst der vollständige Zielwert werden soll.

## `config set`-Modi

`openclaw config set` unterstützt vier Zuweisungsarten:

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
    Der Provider-Builder-Modus zielt ausschließlich auf Pfade der Form `secrets.providers.<alias>`:

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
SecretRef-Zuweisungen werden auf nicht unterstützten zur Laufzeit veränderbaren Oberflächen abgelehnt (zum Beispiel `hooks.token`, `commands.ownerDisplaySecret`, Webhook-Tokens für Discord-Thread-Bindung und WhatsApp-Zugangsdaten-JSON). Siehe [SecretRef-Anmeldedaten-Oberfläche](/de/reference/secretref-credential-surface).
</Warning>

Batch-Parsing verwendet immer die Batch-Nutzlast (`--batch-json`/`--batch-file`) als maßgebliche Quelle. `--strict-json` / `--json` ändern das Batch-Parsing-Verhalten nicht.

## `config patch`

Verwenden Sie `config patch`, wenn Sie einen konfigurationsförmigen Patch einfügen oder per Pipe übergeben möchten, statt viele pfadbasierte `config set`-Befehle auszuführen. Die Eingabe ist ein JSON5-Objekt. Objekte werden rekursiv zusammengeführt, Arrays und skalare Werte ersetzen den Zielwert, und `null` löscht den Zielpfad.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Sie können einen Patch auch über stdin per Pipe übergeben, was für Remote-Einrichtungsskripte nützlich ist:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Beispiel-Patch:

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

Verwenden Sie `--replace-path <path>`, wenn ein Objekt oder Array exakt den angegebenen Wert annehmen soll, statt rekursiv gepatcht zu werden:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` führt Schema- und SecretRef-Auflösbarkeitsprüfungen ohne Schreiben aus. Exec-gestützte SecretRefs werden während eines Dry-Runs standardmäßig übersprungen; fügen Sie `--allow-exec` hinzu, wenn der Dry-Run bewusst Provider-Befehle ausführen soll.

JSON-Pfad-/Wertmodus bleibt sowohl für SecretRefs als auch für Provider unterstützt:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Provider-Builder-Flags

Provider-Builder-Ziele müssen `secrets.providers.<alias>` als Pfad verwenden.

<AccordionGroup>
  <Accordion title="Common flags">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Env provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (wiederholbar)

  </Accordion>
  <Accordion title="File provider (--provider-source file)">
    - `--provider-path <path>` (erforderlich)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec provider (--provider-source exec)">
    - `--provider-command <path>` (erforderlich)
    - `--provider-arg <arg>` (wiederholbar)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (wiederholbar)
    - `--provider-pass-env <ENV_VAR>` (wiederholbar)
    - `--provider-trusted-dir <path>` (wiederholbar)
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

Beispiel für einen gehärteten Exec-Provider:

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

## Dry-Run

Verwenden Sie `--dry-run`, um Änderungen zu validieren, ohne `openclaw.json` zu schreiben.

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
    - Builder-Modus: führt SecretRef-Auflösbarkeitsprüfungen für geänderte Refs/Provider aus.
    - JSON-Modus (`--strict-json`, `--json` oder Batch-Modus): führt Schemavalidierung plus SecretRef-Auflösbarkeitsprüfungen aus.
    - Richtlinienvalidierung läuft auch für bekannte nicht unterstützte SecretRef-Zieloberflächen.
    - Richtlinienprüfungen werten die vollständige Konfiguration nach der Änderung aus, sodass Schreibvorgänge auf übergeordnete Objekte (zum Beispiel das Setzen von `hooks` als Objekt) die Validierung nicht unterstützter Oberflächen nicht umgehen können.
    - Exec-SecretRef-Prüfungen werden während eines Dry-Runs standardmäßig übersprungen, um Nebeneffekte durch Befehle zu vermeiden.
    - Verwenden Sie `--allow-exec` mit `--dry-run`, um Exec-SecretRef-Prüfungen ausdrücklich zu aktivieren (dies kann Provider-Befehle ausführen).
    - `--allow-exec` gilt nur für Dry-Runs und erzeugt einen Fehler, wenn es ohne `--dry-run` verwendet wird.

  </Accordion>
  <Accordion title="--dry-run --json fields">
    `--dry-run --json` gibt einen maschinenlesbaren Bericht aus:

    - `ok`: ob der Dry-Run bestanden wurde
    - `operations`: Anzahl der ausgewerteten Zuweisungen
    - `checks`: ob Schema-/Auflösbarkeitsprüfungen ausgeführt wurden
    - `checks.resolvabilityComplete`: ob Auflösbarkeitsprüfungen vollständig ausgeführt wurden (false, wenn Exec-Refs übersprungen werden)
    - `refsChecked`: Anzahl der während des Dry-Runs tatsächlich aufgelösten Refs
    - `skippedExecRefs`: Anzahl der übersprungenen Exec-Refs, weil `--allow-exec` nicht gesetzt war
    - `errors`: strukturierte Schema-/Auflösbarkeitsfehler, wenn `ok=false`

  </Accordion>
</AccordionGroup>

### JSON-Ausgabeform

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
    - `config schema validation failed`: Die Form Ihrer Konfiguration nach der Änderung ist ungültig; korrigieren Sie Pfad/Wert oder die Form des Provider-/Ref-Objekts.
    - `Config policy validation failed: unsupported SecretRef usage`: Verschieben Sie diese Zugangsdaten zurück in eine Klartext-/String-Eingabe und verwenden Sie SecretRefs nur auf unterstützten Oberflächen.
    - `SecretRef assignment(s) could not be resolved`: Der referenzierte Provider/die referenzierte Ref kann derzeit nicht aufgelöst werden (fehlende Umgebungsvariable, ungültiger Dateizeiger, Fehler des Exec-Providers oder Provider-/Quellenkonflikt).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: Der dry-run hat Exec-Refs übersprungen; führen Sie ihn erneut mit `--allow-exec` aus, wenn Sie die Auflösbarkeit von Exec-Refs validieren müssen.
    - Korrigieren Sie im Batch-Modus fehlerhafte Einträge und führen Sie `--dry-run` erneut aus, bevor Sie schreiben.

  </Accordion>
</AccordionGroup>

## Schreibsicherheit

`openclaw config set` und andere OpenClaw-eigene Konfigurationsschreiber validieren die vollständige Konfiguration nach der Änderung, bevor sie auf die Festplatte geschrieben wird. Wenn die neue Nutzlast die Schemavalidierung nicht besteht oder wie ein destruktives Überschreiben wirkt, bleibt die aktive Konfiguration unverändert und die abgelehnte Nutzlast wird daneben als `openclaw.json.rejected.*` gespeichert.

<Warning>
Der aktive Konfigurationspfad muss eine reguläre Datei sein. Symlink-basierte `openclaw.json`-Layouts werden für Schreibvorgänge nicht unterstützt; verwenden Sie stattdessen `OPENCLAW_CONFIG_PATH`, um direkt auf die echte Datei zu verweisen.
</Warning>

Bevorzugen Sie CLI-Schreibvorgänge für kleine Änderungen:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Wenn ein Schreibvorgang abgelehnt wird, prüfen Sie die gespeicherte Nutzlast und korrigieren Sie die vollständige Konfigurationsform:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Direkte Änderungen im Editor sind weiterhin erlaubt, aber der laufende Gateway behandelt sie als nicht vertrauenswürdig, bis sie validiert wurden. Ungültige direkte Änderungen verhindern den Start oder werden vom Hot Reload übersprungen; der Gateway schreibt `openclaw.json` nicht neu. Führen Sie `openclaw doctor --fix` aus, um eine präfixierte/überschriebene Konfiguration zu reparieren oder die letzte als funktionierend bekannte Kopie wiederherzustellen. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#gateway-rejected-invalid-config).

Die Wiederherstellung der gesamten Datei ist der Doctor-Reparatur vorbehalten. Änderungen am Plugin-Schema oder eine `minHostVersion`-Abweichung bleiben deutlich sichtbar, statt unabhängige Benutzereinstellungen wie Modelle, Provider, Auth-Profile, Kanäle, Gateway-Exposition, Tools, Speicher, Browser oder Cron-Konfiguration zurückzusetzen.

## Unterbefehle

- `config file`: Gibt den aktiven Konfigurationsdateipfad aus (aufgelöst aus `OPENCLAW_CONFIG_PATH` oder dem Standardspeicherort). Der Pfad sollte eine reguläre Datei benennen, keinen Symlink.

Starten Sie den Gateway nach Änderungen neu.

## Validieren

Validieren Sie die aktuelle Konfiguration gegen das aktive Schema, ohne den Gateway zu starten.

```bash
openclaw config validate
openclaw config validate --json
```

Nachdem `openclaw config validate` erfolgreich ist, können Sie die lokale TUI verwenden, damit ein eingebetteter Agent die aktive Konfiguration mit der Dokumentation vergleicht, während Sie jede Änderung im selben Terminal validieren:

<Note>
Wenn die Validierung bereits fehlschlägt, beginnen Sie mit `openclaw configure` oder `openclaw doctor --fix`. `openclaw chat` umgeht den Schutz gegen ungültige Konfigurationen nicht.
</Note>

```bash
openclaw chat
```

Dann innerhalb der TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Typische Reparaturschleife:

<Steps>
  <Step title="Compare with docs">
    Bitten Sie den Agent, Ihre aktuelle Konfiguration mit der relevanten Dokumentationsseite zu vergleichen und die kleinste Korrektur vorzuschlagen.
  </Step>
  <Step title="Apply targeted edits">
    Wenden Sie gezielte Änderungen mit `openclaw config set` oder `openclaw configure` an.
  </Step>
  <Step title="Re-validate">
    Führen Sie `openclaw config validate` nach jeder Änderung erneut aus.
  </Step>
  <Step title="Doctor for runtime issues">
    Wenn die Validierung erfolgreich ist, die Runtime aber weiterhin fehlerhaft ist, führen Sie `openclaw doctor` oder `openclaw doctor --fix` aus, um Hilfe bei Migration und Reparatur zu erhalten.
  </Step>
</Steps>

## Verwandt

- [CLI-Referenz](/de/cli)
- [Konfiguration](/de/gateway/configuration)
