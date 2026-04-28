---
read_when:
    - Sie möchten die Konfiguration nicht interaktiv lesen oder bearbeiten
sidebarTitle: Config
summary: CLI-Referenz für `openclaw config` (`get`/`set`/`unset`/`file`/`schema`/`validate`)
title: Konfiguration
x-i18n:
    generated_at: "2026-04-26T11:25:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7871ee03a1da6ab5d0881ace7579ce101a89e9f9d05d1a720ff34fd31fa12a9d
    source_path: cli/config.md
    workflow: 15
---

Konfigurationshilfen für nicht interaktive Bearbeitungen in `openclaw.json`: Werte über Pfade abrufen/setzen/entfernen, aktive Konfigurationsdatei ausgeben und `file`/`schema`/`validate` verwenden. Ohne Unterbefehl ausgeführt wird der Konfigurationsassistent geöffnet (wie bei `openclaw configure`).

## Root-Optionen

<ParamField path="--section <section>" type="string">
  Wiederholbarer Filter für Bereiche der geführten Einrichtung, wenn Sie `openclaw config` ohne Unterbefehl ausführen.
</ParamField>

Unterstützte geführte Bereiche: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Gibt das generierte JSON-Schema für `openclaw.json` als JSON auf stdout aus.

<AccordionGroup>
  <Accordion title="Was enthalten ist">
    - Das aktuelle Root-Konfigurationsschema sowie ein Root-String-Feld `$schema` für Editor-Tooling.
    - `title`- und `description`-Dokumentationsmetadaten von Feldern, die von der Control UI verwendet werden.
    - Verschachtelte Objekt-, Wildcard- (`*`) und Array-Element- (`[]`) Knoten übernehmen dieselben `title`-/`description`-Metadaten, wenn passende Felddokumentation vorhanden ist.
    - Auch `anyOf`-/`oneOf`-/`allOf`-Zweige übernehmen dieselben Dokumentationsmetadaten, wenn passende Felddokumentation vorhanden ist.
    - Best-Effort-Live-Schemametadaten für Plugins und Kanäle, wenn Laufzeit-Manifeste geladen werden können.
    - Ein sauberes Fallback-Schema, selbst wenn die aktuelle Konfiguration ungültig ist.

  </Accordion>
  <Accordion title="Zugehörige Runtime-RPC">
    `config.schema.lookup` gibt einen normalisierten Konfigurationspfad mit einem flachen Schemaknoten (`title`, `description`, `type`, `enum`, `const`, gängige Grenzen), passenden UI-Hinweismetadaten und Zusammenfassungen der direkten Kindknoten zurück. Verwenden Sie dies für pfadbezogene Drill-downs in der Control UI oder in benutzerdefinierten Clients.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Leiten Sie es in eine Datei um, wenn Sie es prüfen oder mit anderen Tools validieren möchten:

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

Werte werden nach Möglichkeit als JSON5 geparst, andernfalls werden sie als Strings behandelt. Verwenden Sie `--strict-json`, um JSON5-Parsing zu erzwingen. `--json` wird weiterhin als veralteter Alias unterstützt.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` gibt den Rohwert als JSON aus statt als terminalformatierter Text.

<Note>
Objektzuweisungen ersetzen standardmäßig den Zielpfad. Geschützte Map-/Listenpfade, die häufig benutzerhinzugefügte Einträge enthalten, etwa `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` und `auth.profiles`, verweigern Ersetzungen, die vorhandene Einträge entfernen würden, sofern Sie nicht `--replace` übergeben.
</Note>

Verwenden Sie `--merge`, wenn Sie Einträge zu diesen Maps hinzufügen:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Verwenden Sie `--replace` nur dann, wenn der angegebene Wert absichtlich zum vollständigen Zielwert werden soll.

## Modi von `config set`

`openclaw config set` unterstützt vier Zuweisungsstile:

<Tabs>
  <Tab title="Wertmodus">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef-Builder-Modus">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Provider-Builder-Modus">
    Der Provider-Builder-Modus zielt nur auf Pfade unter `secrets.providers.<alias>`:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Batch-Modus">
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
SecretRef-Zuweisungen werden auf nicht unterstützten, zur Laufzeit veränderbaren Oberflächen zurückgewiesen (zum Beispiel `hooks.token`, `commands.ownerDisplaySecret`, Discord-Thread-Binding-Webhook-Tokens und WhatsApp-Creds-JSON). Siehe [SecretRef Credential Surface](/de/reference/secretref-credential-surface).
</Warning>

Das Batch-Parsing verwendet immer die Batch-Nutzlast (`--batch-json`/`--batch-file`) als maßgebliche Quelle. `--strict-json` / `--json` verändern das Verhalten des Batch-Parsings nicht.

Der JSON-Pfad-/Wertmodus bleibt sowohl für SecretRefs als auch für Provider unterstützt:

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
  <Accordion title="Gemeinsame Flags">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Env-Provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (wiederholbar)

  </Accordion>
  <Accordion title="File-Provider (--provider-source file)">
    - `--provider-path <path>` (erforderlich)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec-Provider (--provider-source exec)">
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

## Dry run

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
  <Accordion title="Verhalten von Dry-run">
    - Builder-Modus: führt Prüfungen der SecretRef-Auflösbarkeit für geänderte Refs/Provider aus.
    - JSON-Modus (`--strict-json`, `--json` oder Batch-Modus): führt Schemavalidierung plus SecretRef-Auflösbarkeitsprüfungen aus.
    - Richtlinienvalidierung wird ebenfalls für bekannte nicht unterstützte SecretRef-Zieloberflächen ausgeführt.
    - Richtlinienprüfungen werten die vollständige Konfiguration nach der Änderung aus, sodass Schreibvorgänge auf übergeordnete Objekte (zum Beispiel das Setzen von `hooks` als Objekt) die Validierung nicht unterstützter Oberflächen nicht umgehen können.
    - Exec-SecretRef-Prüfungen werden während `dry-run` standardmäßig übersprungen, um Seiteneffekte durch Befehle zu vermeiden.
    - Verwenden Sie `--allow-exec` zusammen mit `--dry-run`, um Exec-SecretRef-Prüfungen zu aktivieren (dies kann Provider-Befehle ausführen).
    - `--allow-exec` ist nur für `dry-run` vorgesehen und erzeugt einen Fehler, wenn es ohne `--dry-run` verwendet wird.

  </Accordion>
  <Accordion title="Felder von --dry-run --json">
    `--dry-run --json` gibt einen maschinenlesbaren Bericht aus:

    - `ok`: ob der Dry-run erfolgreich war
    - `operations`: Anzahl der ausgewerteten Zuweisungen
    - `checks`: ob Schema-/Auflösbarkeitsprüfungen ausgeführt wurden
    - `checks.resolvabilityComplete`: ob Auflösbarkeitsprüfungen vollständig ausgeführt wurden (`false`, wenn Exec-Refs übersprungen werden)
    - `refsChecked`: Anzahl der Refs, die während des Dry-runs tatsächlich aufgelöst wurden
    - `skippedExecRefs`: Anzahl der Exec-Refs, die übersprungen wurden, weil `--allow-exec` nicht gesetzt war
    - `errors`: strukturierte Schema-/Auflösbarkeitsfehler, wenn `ok=false`

  </Accordion>
</AccordionGroup>

### Form der JSON-Ausgabe

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
  <Tab title="Erfolgsbeispiel">
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
  <Tab title="Fehlerbeispiel">
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
  <Accordion title="Wenn dry-run fehlschlägt">
    - `config schema validation failed`: Die Form Ihrer Konfiguration nach der Änderung ist ungültig; korrigieren Sie Pfad/Wert oder die Form des Provider-/Ref-Objekts.
    - `Config policy validation failed: unsupported SecretRef usage`: Verschieben Sie diese Zugangsdaten zurück zu einer Klartext-/String-Eingabe und verwenden Sie SecretRefs nur auf unterstützten Oberflächen.
    - `SecretRef assignment(s) could not be resolved`: Der referenzierte Provider/Ref kann derzeit nicht aufgelöst werden (fehlende Env-Variable, ungültiger Datei-Zeiger, Fehler beim Exec-Provider oder Nichtübereinstimmung von Provider/Quelle).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: Dry-run hat Exec-Refs übersprungen; führen Sie den Befehl erneut mit `--allow-exec` aus, wenn Sie die Auflösbarkeitsvalidierung für Exec benötigen.
    - Im Batch-Modus: korrigieren Sie fehlerhafte Einträge und führen Sie `--dry-run` erneut aus, bevor Sie schreiben.

  </Accordion>
</AccordionGroup>

## Schreibsicherheit

`openclaw config set` und andere von OpenClaw verwaltete Konfigurationsschreiber validieren die vollständige Konfiguration nach der Änderung, bevor sie auf die Festplatte geschrieben wird. Wenn die neue Nutzlast die Schema-Validierung nicht besteht oder wie ein destruktives Überschreiben aussieht, bleibt die aktive Konfiguration unverändert und die abgelehnte Nutzlast wird daneben als `openclaw.json.rejected.*` gespeichert.

<Warning>
Der aktive Konfigurationspfad muss eine reguläre Datei sein. Per Symlink eingebundene `openclaw.json`-Layouts werden für Schreibvorgänge nicht unterstützt; verwenden Sie stattdessen `OPENCLAW_CONFIG_PATH`, um direkt auf die echte Datei zu zeigen.
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

Direkte Schreibvorgänge im Editor sind weiterhin erlaubt, aber das laufende Gateway behandelt sie als nicht vertrauenswürdig, bis sie validiert sind. Ungültige direkte Bearbeitungen können beim Start oder Hot Reload aus dem zuletzt als gut bekannten Backup wiederhergestellt werden. Siehe [Gateway troubleshooting](/de/gateway/troubleshooting#gateway-restored-last-known-good-config).

Die Wiederherstellung der gesamten Datei ist für global defekte Konfiguration reserviert, etwa bei Parse-Fehlern, Schemafehlern auf Root-Ebene, Fehlern bei Legacy-Migrationen oder gemischten Fehlern bei Plugins und Root. Wenn die Validierung nur unter `plugins.entries.<id>...` fehlschlägt, belässt OpenClaw die aktive `openclaw.json` an Ort und Stelle und meldet stattdessen das pluginlokale Problem, anstatt `.last-good` wiederherzustellen. Dadurch wird verhindert, dass Änderungen am Plugin-Schema oder `minHostVersion`-Abweichungen nicht zusammenhängende Benutzereinstellungen wie Modelle, Provider, Auth-Profile, Kanäle, Gateway-Exposition, Tools, Speicher, Browser- oder Cron-Konfiguration zurückrollen.

## Unterbefehle

- `config file`: Gibt den Pfad der aktiven Konfigurationsdatei aus (aufgelöst aus `OPENCLAW_CONFIG_PATH` oder dem Standardpfad). Der Pfad sollte auf eine reguläre Datei zeigen, nicht auf einen Symlink.

Starten Sie das Gateway nach Bearbeitungen neu.

## Validieren

Validieren Sie die aktuelle Konfiguration gegen das aktive Schema, ohne das Gateway zu starten.

```bash
openclaw config validate
openclaw config validate --json
```

Nachdem `openclaw config validate` erfolgreich ist, können Sie die lokale TUI verwenden, damit ein eingebetteter Agent die aktive Konfiguration mit der Dokumentation vergleicht, während Sie jede Änderung im selben Terminal validieren:

<Note>
Wenn die Validierung bereits fehlschlägt, beginnen Sie mit `openclaw configure` oder `openclaw doctor --fix`. `openclaw chat` umgeht die Sperre bei ungültiger Konfiguration nicht.
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

Typischer Reparaturablauf:

<Steps>
  <Step title="Mit der Dokumentation vergleichen">
    Bitten Sie den Agenten, Ihre aktuelle Konfiguration mit der relevanten Dokumentationsseite zu vergleichen und die kleinste notwendige Korrektur vorzuschlagen.
  </Step>
  <Step title="Gezielte Bearbeitungen anwenden">
    Wenden Sie gezielte Bearbeitungen mit `openclaw config set` oder `openclaw configure` an.
  </Step>
  <Step title="Erneut validieren">
    Führen Sie `openclaw config validate` nach jeder Änderung erneut aus.
  </Step>
  <Step title="Doctor für Laufzeitprobleme">
    Wenn die Validierung erfolgreich ist, die Laufzeit aber weiterhin ungesund ist, führen Sie `openclaw doctor` oder `openclaw doctor --fix` aus, um Hilfe bei Migration und Reparatur zu erhalten.
  </Step>
</Steps>

## Verwandt

- [CLI reference](/de/cli)
- [Configuration](/de/gateway/configuration)
