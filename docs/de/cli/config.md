---
read_when:
    - Sie möchten die Konfiguration nicht interaktiv lesen oder bearbeiten
summary: CLI-Referenz für `openclaw config` (`get`/`set`/`unset`/`file`/`schema`/`validate`)
title: Konfiguration
x-i18n:
    generated_at: "2026-04-25T13:43:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60567d39174d7214461f995d32f3064777d7437ff82226961eab404cd7fec5c4
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Konfigurationshilfen für nicht interaktive Änderungen in `openclaw.json`: Werte per Pfad mit get/set/unset/file/schema/validate lesen, setzen oder entfernen und die aktive Konfigurationsdatei ausgeben. Ohne Unterbefehl wird der Konfigurationsassistent geöffnet (wie bei `openclaw configure`).

Root-Optionen:

- `--section <section>`: wiederholbarer Abschnittsfilter für das geführte Setup, wenn Sie `openclaw config` ohne Unterbefehl ausführen

Unterstützte Setup-Abschnitte:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

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

Was enthalten ist:

- Das aktuelle Root-Konfigurationsschema sowie ein Root-Stringfeld `$schema` für Editor-Tooling
- Die Dokumentationsmetadaten `title` und `description`, die von der Control UI verwendet werden
- Verschachtelte Objekt-, Wildcard- (`*`) und Array-Element- (`[]`) Knoten übernehmen dieselben Metadaten `title` / `description`, wenn passende Felddokumentation vorhanden ist
- Auch `anyOf`- / `oneOf`- / `allOf`-Zweige übernehmen dieselben Dokumentationsmetadaten, wenn passende Felddokumentation vorhanden ist
- Best-Effort-Metadaten für Live-Plugin- und Kanal-Schemas, wenn Laufzeit-Manifeste geladen werden können
- Ein sauberes Fallback-Schema, selbst wenn die aktuelle Konfiguration ungültig ist

Zugehörige Laufzeit-RPC:

- `config.schema.lookup` gibt einen normalisierten Konfigurationspfad mit einem flachen
  Schema-Knoten (`title`, `description`, `type`, `enum`, `const`, gängige Grenzen),
  passenden UI-Hinweis-Metadaten und unmittelbaren Zusammenfassungen der Kindknoten zurück. Verwenden Sie dies für
  pfadbezogenes Drill-down in der Control UI oder in benutzerdefinierten Clients.

```bash
openclaw config schema
```

Leiten Sie die Ausgabe in eine Datei um, wenn Sie sie mit anderen Tools prüfen oder validieren möchten:

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

Werte werden nach Möglichkeit als JSON5 geparst, andernfalls als Strings behandelt.
Verwenden Sie `--strict-json`, um JSON5-Parsing zu erzwingen. `--json` wird weiterhin als veralteter Alias unterstützt.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` gibt den Rohwert als JSON statt als terminalformatierter Text aus.

Objektzuweisung ersetzt standardmäßig den Zielpfad. Geschützte Map-/Listenpfade,
die typischerweise vom Benutzer hinzugefügte Einträge enthalten, wie `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` und
`auth.profiles`, verweigern Ersetzungen, die bestehende Einträge entfernen würden, es sei denn,
Sie übergeben `--replace`.

Verwenden Sie `--merge`, wenn Sie Einträge zu diesen Maps hinzufügen:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Verwenden Sie `--replace` nur, wenn der angegebene Wert bewusst zum vollständigen Zielwert werden soll.

## Modi von `config set`

`openclaw config set` unterstützt vier Zuweisungsstile:

1. Wertmodus: `openclaw config set <path> <value>`
2. SecretRef-Builder-Modus:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Provider-Builder-Modus (nur Pfad `secrets.providers.<alias>`):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Batch-Modus (`--batch-json` oder `--batch-file`):

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

Hinweis zur Richtlinie:

- SecretRef-Zuweisungen werden auf nicht unterstützten zur Laufzeit veränderbaren Oberflächen abgelehnt (zum Beispiel `hooks.token`, `commands.ownerDisplaySecret`, Webhook-Tokens für Discord-Thread-Bindungen und WhatsApp-Creds-JSON). Siehe [SecretRef Credential Surface](/de/reference/secretref-credential-surface).

Das Parsing von Batchs verwendet immer die Batch-Nutzlast (`--batch-json`/`--batch-file`) als Quelle der Wahrheit.
`--strict-json` / `--json` ändern das Verhalten des Batch-Parsings nicht.

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

Ziele des Provider-Builders müssen `secrets.providers.<alias>` als Pfad verwenden.

Allgemeine Flags:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Env-Provider (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (wiederholbar)

Datei-Provider (`--provider-source file`):

- `--provider-path <path>` (erforderlich)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

Exec-Provider (`--provider-source exec`):

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

## Probelauf

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

Verhalten von `--dry-run`:

- Builder-Modus: Führt SecretRef-Auflösbarkeitsprüfungen für geänderte Refs/Provider aus.
- JSON-Modus (`--strict-json`, `--json` oder Batch-Modus): Führt Schemavalidierung plus SecretRef-Auflösbarkeitsprüfungen aus.
- Richtlinienvalidierung läuft ebenfalls für bekannte nicht unterstützte SecretRef-Zieloberflächen.
- Richtlinienprüfungen werten die vollständige Konfiguration nach der Änderung aus, sodass Schreibvorgänge auf übergeordneten Objekten (zum Beispiel das Setzen von `hooks` als Objekt) die Validierung nicht unterstützter Oberflächen nicht umgehen können.
- Exec-SecretRef-Prüfungen werden während `--dry-run` standardmäßig übersprungen, um Nebenwirkungen von Befehlen zu vermeiden.
- Verwenden Sie `--allow-exec` zusammen mit `--dry-run`, um Exec-SecretRef-Prüfungen zu aktivieren (dies kann Provider-Befehle ausführen).
- `--allow-exec` gilt nur für `--dry-run` und führt zu einem Fehler, wenn es ohne `--dry-run` verwendet wird.

`--dry-run --json` gibt einen maschinenlesbaren Bericht aus:

- `ok`: ob der Probelauf erfolgreich war
- `operations`: Anzahl der ausgewerteten Zuweisungen
- `checks`: ob Schema-/Auflösbarkeitsprüfungen ausgeführt wurden
- `checks.resolvabilityComplete`: ob Auflösbarkeitsprüfungen vollständig ausgeführt wurden (`false`, wenn Exec-Refs übersprungen wurden)
- `refsChecked`: Anzahl der Refs, die während des Probelaufs tatsächlich aufgelöst wurden
- `skippedExecRefs`: Anzahl der Exec-Refs, die übersprungen wurden, weil `--allow-exec` nicht gesetzt war
- `errors`: strukturierte Schema-/Auflösbarkeitsfehler, wenn `ok=false`

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
      ref?: string, // vorhanden bei Auflösbarkeitsfehlern
    },
  ],
}
```

Erfolgsbeispiel:

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

Fehlerbeispiel:

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

Wenn `--dry-run` fehlschlägt:

- `config schema validation failed`: Die Form Ihrer Konfiguration nach der Änderung ist ungültig; korrigieren Sie Pfad/Wert oder die Form des Provider-/Ref-Objekts.
- `Config policy validation failed: unsupported SecretRef usage`: Verschieben Sie diese Zugangsdaten zurück auf Klartext-/String-Eingabe und verwenden Sie SecretRefs nur auf unterstützten Oberflächen.
- `SecretRef assignment(s) could not be resolved`: Der referenzierte Provider/Ref kann aktuell nicht aufgelöst werden (fehlende Umgebungsvariable, ungültiger Dateizeiger, Fehler im Exec-Provider oder Provider-/Quellenkonflikt).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: Der Probelauf hat Exec-Refs übersprungen; führen Sie ihn mit `--allow-exec` erneut aus, wenn Sie die Auflösbarkeit von Exec prüfen müssen.
- Im Batch-Modus: Korrigieren Sie die fehlerhaften Einträge und führen Sie `--dry-run` erneut aus, bevor Sie schreiben.

## Schreibsicherheit

`openclaw config set` und andere OpenClaw-eigene Konfigurationsschreiber validieren die vollständige
Konfiguration nach der Änderung, bevor sie auf die Festplatte geschrieben wird. Wenn die neue Nutzlast die Schemavalidierung nicht besteht
oder wie ein destruktives Überschreiben aussieht, bleibt die aktive Konfiguration unverändert
und die abgelehnte Nutzlast wird daneben als `openclaw.json.rejected.*` gespeichert.
Der Pfad der aktiven Konfiguration muss eine reguläre Datei sein. Per Symlink verknüpfte `openclaw.json`-Layouts
werden für Schreibvorgänge nicht unterstützt; verwenden Sie stattdessen `OPENCLAW_CONFIG_PATH`, um direkt
auf die tatsächliche Datei zu verweisen.

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

Direkte Schreibvorgänge im Editor sind weiterhin erlaubt, aber das laufende Gateway behandelt sie als nicht vertrauenswürdig, bis sie validieren. Ungültige direkte Änderungen können beim Start oder Hot-Reload aus dem zuletzt als gültig bekannten Backup wiederhergestellt werden. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#gateway-restored-last-known-good-config).

Eine Wiederherstellung der gesamten Datei ist global beschädigter Konfiguration vorbehalten, etwa bei Parse-Fehlern, Schemafehlern auf Root-Ebene, Fehlern bei Legacy-Migrationen oder gemischten Fehlern in Plugin und Root. Wenn die Validierung nur unter `plugins.entries.<id>...` fehlschlägt, belässt OpenClaw die aktive `openclaw.json` an Ort und Stelle und meldet stattdessen das pluginlokale Problem, anstatt `.last-good` wiederherzustellen. Dadurch wird verhindert, dass Änderungen am Plugin-Schema oder eine Abweichung bei `minHostVersion` nicht zusammenhängende Benutzereinstellungen wie Modelle, Provider, Auth-Profile, Kanäle, Gateway-Exposition, Tools, Speicher, Browser oder Cron-Konfiguration zurückrollen.

## Unterbefehle

- `config file`: Den Pfad der aktiven Konfigurationsdatei ausgeben (aufgelöst aus `OPENCLAW_CONFIG_PATH` oder dem Standardspeicherort). Der Pfad sollte auf eine reguläre Datei verweisen, nicht auf einen Symlink.

Starten Sie das Gateway nach Änderungen neu.

## Validieren

Die aktuelle Konfiguration gegen das aktive Schema validieren, ohne das
Gateway zu starten.

```bash
openclaw config validate
openclaw config validate --json
```

Sobald `openclaw config validate` erfolgreich ist, können Sie das lokale TUI verwenden, damit ein eingebetteter Agent die aktive Konfiguration mit der Dokumentation vergleicht, während Sie jede Änderung im selben Terminal validieren:

Wenn die Validierung bereits fehlschlägt, beginnen Sie mit `openclaw configure` oder
`openclaw doctor --fix`. `openclaw chat` umgeht die Schutzvorrichtung für ungültige Konfigurationen nicht.

```bash
openclaw chat
```

Dann innerhalb des TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Typischer Reparaturablauf:

- Bitten Sie den Agenten, Ihre aktuelle Konfiguration mit der relevanten Dokumentationsseite zu vergleichen und die kleinste Korrektur vorzuschlagen.
- Wenden Sie gezielte Änderungen mit `openclaw config set` oder `openclaw configure` an.
- Führen Sie nach jeder Änderung erneut `openclaw config validate` aus.
- Wenn die Validierung erfolgreich ist, die Laufzeit aber weiterhin ungesund ist, führen Sie `openclaw doctor` oder `openclaw doctor --fix` für Hilfe bei Migration und Reparatur aus.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Konfiguration](/de/gateway/configuration)
