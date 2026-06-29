---
read_when:
    - Sie möchten die Konfiguration nicht interaktiv lesen oder bearbeiten
sidebarTitle: Config
summary: CLI-Referenz für `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Konfiguration
x-i18n:
    generated_at: "2026-06-28T22:33:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92878977e8fb6670f12c0a77937a7c41f9230da82e20ec7690731bbda1e910ca
    source_path: cli/config.md
    workflow: 16
---

Konfigurationshilfen für nicht interaktive Änderungen in `openclaw.json`: Werte per Pfad abrufen/festlegen/patchen/aufheben/datei/schema/validieren und die aktive Konfigurationsdatei ausgeben. Ohne Unterbefehl ausführen, um den Konfigurationsassistenten zu öffnen (entspricht `openclaw configure`).

<Note>
Wenn `OPENCLAW_NIX_MODE=1` gesetzt ist, behandelt OpenClaw `openclaw.json` als unveränderlich. Schreibgeschützte Befehle wie `config get`, `config file`, `config schema` und `config validate` funktionieren weiterhin, aber Konfigurationsschreiber verweigern die Ausführung. Agents sollten stattdessen die Nix-Quelle der Installation bearbeiten; für die First-Party-Distribution nix-openclaw verwenden Sie [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) und setzen Werte unter `programs.openclaw.config` oder `instances.<name>.config`.
</Note>

## Stammoptionen

<ParamField path="--section <section>" type="string">
  Wiederholbarer Filter für Abschnitte der geführten Einrichtung, wenn Sie `openclaw config` ohne Unterbefehl ausführen.
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

### `config schema`

Gibt das generierte JSON-Schema für `openclaw.json` als JSON auf stdout aus.

<AccordionGroup>
  <Accordion title="Was es enthält">
    - Das aktuelle Stamm-Konfigurationsschema sowie ein `$schema`-Stringfeld auf Stammebene für Editor-Werkzeuge.
    - Dokumentationsmetadaten `title` und `description`, die von der Control UI verwendet werden.
    - Verschachtelte Objekt-, Platzhalter- (`*`) und Array-Element-Knoten (`[]`) erben dieselben Metadaten `title` / `description`, wenn passende Felddokumentation vorhanden ist.
    - Auch `anyOf`- / `oneOf`- / `allOf`-Zweige erben dieselben Dokumentationsmetadaten, wenn passende Felddokumentation vorhanden ist.
    - Bestmögliche Live-Metadaten für Plugin- und Kanal-Schemata, wenn Laufzeitmanifeste geladen werden können.
    - Ein sauberes Fallback-Schema, selbst wenn die aktuelle Konfiguration ungültig ist.

  </Accordion>
  <Accordion title="Zugehörige Laufzeit-RPC">
    `config.schema.lookup` gibt einen normalisierten Konfigurationspfad mit einem flachen Schemaknoten (`title`, `description`, `type`, `enum`, `const`, übliche Grenzen), passenden UI-Hinweis-Metadaten und direkten Kindzusammenfassungen zurück. Verwenden Sie dies für pfadbezogene Detailansichten in der Control UI oder in benutzerdefinierten Clients.
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

Pfade verwenden Punkt- oder Klammernotation. Setzen Sie Pfade in Klammernotation in Shell-Beispielen in Anführungszeichen, damit Shells wie zsh `[0]` nicht als Glob erweitern, bevor OpenClaw den Pfad erhält:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

Verwenden Sie den Index der Agent-Liste, um einen bestimmten Agent gezielt anzusprechen:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## Werte

Werte werden nach Möglichkeit als JSON5 geparst; andernfalls werden sie als Strings behandelt. Verwenden Sie `--strict-json`, um standardkonformes JSON-Parsing ohne String-Fallback zu erzwingen. `--json` wird weiterhin als Legacy-Alias für `--strict-json` unterstützt.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

Wenn `--strict-json` aktiviert ist, wird JSON5-spezifische Syntax wie Kommentare, nachgestellte Kommas oder nicht in Anführungszeichen gesetzte Objektschlüssel abgelehnt. Lassen Sie `--strict-json` weg, um JSON5-Wert-Parsing mit Raw-String-Fallback zu verwenden.

`config get <path> --json` gibt den Rohwert als JSON statt als terminalformatierten Text aus.

<Note>
Objektzuweisung ersetzt standardmäßig den Zielpfad. Geschützte Map-/Listenpfade, die üblicherweise von Benutzern hinzugefügte Einträge enthalten, wie `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` und `auth.profiles`, verweigern Ersetzungen, die vorhandene Einträge entfernen würden, sofern Sie nicht `--replace` übergeben.
</Note>

Verwenden Sie `--merge`, wenn Sie diesen Maps Einträge hinzufügen:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Verwenden Sie `--replace` nur, wenn der bereitgestellte Wert absichtlich zum vollständigen Zielwert werden soll.

## `config set`-Modi

`openclaw config set` unterstützt vier Zuweisungsarten:

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
    Der Provider-Builder-Modus zielt nur auf Pfade `secrets.providers.<alias>`:

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
SecretRef-Zuweisungen werden auf nicht unterstützten, zur Laufzeit veränderbaren Oberflächen abgelehnt (zum Beispiel `hooks.token`, `commands.ownerDisplaySecret`, Discord-Thread-Binding-Webhook-Tokens und WhatsApp-Anmeldedaten-JSON). Siehe [SecretRef-Anmeldeinformationsoberfläche](/de/reference/secretref-credential-surface).
</Warning>

Batch-Parsing verwendet immer die Batch-Nutzdaten (`--batch-json`/`--batch-file`) als maßgebliche Quelle. `--strict-json` / `--json` ändern das Batch-Parsing-Verhalten nicht.

## `config patch`

Verwenden Sie `config patch`, wenn Sie einen konfigurationsförmigen Patch einfügen oder per Pipe übergeben möchten, statt viele pfadbasierte `config set`-Befehle auszuführen. Die Eingabe ist ein JSON5-Objekt. Objekte werden rekursiv zusammengeführt, Arrays und skalare Werte ersetzen den Zielwert, und `null` löscht den Zielpfad.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Sie können einen Patch auch über stdin per Pipe übergeben, was für Remote-Setup-Skripte nützlich ist:

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

Verwenden Sie `--replace-path <path>`, wenn ein Objekt oder Array exakt zum bereitgestellten Wert werden soll, statt rekursiv gepatcht zu werden:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` führt Schema- und SecretRef-Auflösbarkeitsprüfungen aus, ohne zu schreiben. Exec-gestützte SecretRefs werden während des Dry-Runs standardmäßig übersprungen; fügen Sie `--allow-exec` hinzu, wenn der Dry-Run absichtlich Provider-Befehle ausführen soll.

Der JSON-Pfad-/Wertmodus wird weiterhin sowohl für SecretRefs als auch für Provider unterstützt:

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
  <Accordion title="Allgemeine Flags">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Env-Provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (wiederholbar)

  </Accordion>
  <Accordion title="Datei-Provider (--provider-source file)">
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

Beispiel für gehärteten Exec-Provider:

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
  <Accordion title="Dry-run-Verhalten">
    - Builder-Modus: führt SecretRef-Auflösbarkeitsprüfungen für geänderte Refs/Provider aus.
    - JSON-Modus (`--strict-json`, `--json` oder Batch-Modus): führt Schemavalidierung plus SecretRef-Auflösbarkeitsprüfungen aus.
    - Die Policy-Validierung läuft auch für bekannte nicht unterstützte SecretRef-Zielflächen.
    - Policy-Prüfungen bewerten die vollständige Konfiguration nach der Änderung, sodass Schreibvorgänge auf übergeordnete Objekte (zum Beispiel das Setzen von `hooks` als Objekt) die Validierung nicht unterstützter Flächen nicht umgehen können.
    - Exec-SecretRef-Prüfungen werden während eines Dry-run standardmäßig übersprungen, um Seiteneffekte durch Befehle zu vermeiden.
    - Verwenden Sie `--allow-exec` mit `--dry-run`, um Exec-SecretRef-Prüfungen explizit zu aktivieren (dies kann Provider-Befehle ausführen).
    - `--allow-exec` gilt nur für Dry-run und führt zu einem Fehler, wenn es ohne `--dry-run` verwendet wird.

  </Accordion>
  <Accordion title="`--dry-run --json`-Felder">
    `--dry-run --json` gibt einen maschinenlesbaren Bericht aus:

    - `ok`: ob der Dry-run bestanden wurde
    - `operations`: Anzahl der ausgewerteten Zuweisungen
    - `checks`: ob Schema-/Auflösbarkeitsprüfungen ausgeführt wurden
    - `checks.resolvabilityComplete`: ob Auflösbarkeitsprüfungen vollständig ausgeführt wurden (false, wenn Exec-Refs übersprungen werden)
    - `refsChecked`: Anzahl der während des Dry-run tatsächlich aufgelösten Refs
    - `skippedExecRefs`: Anzahl der übersprungenen Exec-Refs, weil `--allow-exec` nicht gesetzt war
    - `errors`: strukturierte Fehler zu fehlenden Pfaden, Schema oder Auflösbarkeit, wenn `ok=false`

  </Accordion>
</AccordionGroup>

### JSON-Ausgabeform

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
  <Accordion title="Wenn der Dry-run fehlschlägt">
    - `config schema validation failed`: Ihre Konfigurationsform nach der Änderung ist ungültig; korrigieren Sie Pfad/Wert oder die Objektform von Provider/Ref.
    - `Config policy validation failed: unsupported SecretRef usage`: verschieben Sie diese Zugangsdaten zurück in Klartext-/String-Eingabe und behalten Sie SecretRefs nur auf unterstützten Flächen.
    - `SecretRef assignment(s) could not be resolved`: der referenzierte Provider/Ref kann derzeit nicht aufgelöst werden (fehlende Umgebungsvariable, ungültiger Dateizeiger, Exec-Provider-Fehler oder Provider-/Quellenkonflikt).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: Dry-run hat Exec-Refs übersprungen; führen Sie erneut mit `--allow-exec` aus, wenn Sie Exec-Auflösbarkeitsvalidierung benötigen.
    - Korrigieren Sie im Batch-Modus fehlschlagende Einträge und führen Sie `--dry-run` erneut aus, bevor Sie schreiben.

  </Accordion>
</AccordionGroup>

## Schreibsicherheit

`openclaw config set` und andere OpenClaw-eigene Konfigurationsschreiber validieren die vollständige Konfiguration nach der Änderung, bevor sie sie auf die Festplatte schreiben. Wenn die neue Nutzlast die Schemavalidierung nicht besteht oder wie ein destruktives Überschreiben aussieht, bleibt die aktive Konfiguration unverändert und die abgelehnte Nutzlast wird daneben als `openclaw.json.rejected.*` gespeichert.

<Warning>
Der aktive Konfigurationspfad muss eine reguläre Datei sein. Symlink-Layouts für `openclaw.json` werden für Schreibvorgänge nicht unterstützt; verwenden Sie stattdessen `OPENCLAW_CONFIG_PATH`, um direkt auf die echte Datei zu zeigen.
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

Direkte Schreibvorgänge mit einem Editor sind weiterhin erlaubt, aber der laufende Gateway behandelt sie als nicht vertrauenswürdig, bis sie validiert wurden. Ungültige direkte Änderungen lassen den Start fehlschlagen oder werden beim Hot Reload übersprungen; Gateway schreibt `openclaw.json` nicht neu. Führen Sie `openclaw doctor --fix` aus, um vorangestellte/überschriebene Konfiguration zu reparieren oder die letzte als gut bekannte Kopie wiederherzustellen. Siehe [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#gateway-rejected-invalid-config).

Wiederherstellung ganzer Dateien ist der Doctor-Reparatur vorbehalten. Plugin-Schemaänderungen oder `minHostVersion`-Abweichungen bleiben deutlich sichtbar, statt unabhängige Benutzereinstellungen wie Modelle, Provider, Auth-Profile, Kanäle, Gateway-Exponierung, Tools, Speicher, Browser oder Cron-Konfiguration zurückzusetzen.

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
Wenn die Validierung bereits fehlschlägt, beginnen Sie mit `openclaw configure` oder `openclaw doctor --fix`. `openclaw chat` umgeht den Schutz vor ungültiger Konfiguration nicht.
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
  <Step title="Mit Dokumentation vergleichen">
    Bitten Sie den Agent, Ihre aktuelle Konfiguration mit der relevanten Dokumentationsseite zu vergleichen und die kleinste Korrektur vorzuschlagen.
  </Step>
  <Step title="Gezielte Änderungen anwenden">
    Wenden Sie gezielte Änderungen mit `openclaw config set` oder `openclaw configure` an.
  </Step>
  <Step title="Erneut validieren">
    Führen Sie `openclaw config validate` nach jeder Änderung erneut aus.
  </Step>
  <Step title="Doctor für Laufzeitprobleme">
    Wenn die Validierung erfolgreich ist, die Laufzeit aber weiterhin fehlerhaft ist, führen Sie `openclaw doctor` oder `openclaw doctor --fix` aus, um Hilfe bei Migration und Reparatur zu erhalten.
  </Step>
</Steps>

## Verwandt

- [CLI-Referenz](/de/cli)
- [Konfiguration](/de/gateway/configuration)
