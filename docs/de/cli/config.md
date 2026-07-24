---
read_when:
    - Sie möchten die Konfiguration nicht interaktiv lesen oder bearbeiten
sidebarTitle: Config
summary: CLI-Referenz für `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Konfiguration
x-i18n:
    generated_at: "2026-07-24T04:27:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4c4f8edb19737070e421c9107f7da8886e5617d9a043d8647666505c7ac9638d
    source_path: cli/config.md
    workflow: 16
---

Nicht interaktive Hilfsbefehle für `openclaw.json`: einen Wert anhand eines Pfads abrufen/festlegen/patchen/entfernen, das Schema ausgeben, validieren oder den aktiven Dateipfad ausgeben. Führen Sie `openclaw config` ohne Unterbefehl aus, um denselben geführten Assistenten wie mit `openclaw configure` zu öffnen.

<Note>
Bei `OPENCLAW_NIX_MODE=1` behandelt OpenClaw `openclaw.json` als unveränderlich. Schreibgeschützte Befehle (`config get`, `config file`, `config schema`, `config validate`) funktionieren weiterhin; Konfigurationsschreibvorgänge werden verweigert. Bearbeiten Sie stattdessen die Nix-Quelle für die Installation; verwenden Sie für die offizielle nix-openclaw-Distribution den [nix-openclaw-Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start) und legen Sie Werte unter `programs.openclaw.config` oder `instances.<name>.config` fest.
</Note>

## Stammoptionen

<ParamField path="--section <section>" type="string">
  Wiederholbarer Abschnittsfilter für die geführte Einrichtung, wenn Sie `openclaw config` ohne Unterbefehl ausführen.
</ParamField>

Geführte Abschnitte: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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
openclaw config set 'agents.entries.main.tools.exec.node' "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### Pfade

Punkt- oder Klammernotation. Setzen Sie Klammerpfade in Shell-Beispielen in Anführungszeichen, damit zsh `[0]` nicht als Glob-Muster erweitert:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.entries.main
openclaw config get agents.entries
openclaw config set 'agents.entries.work.tools.exec.node' "node-id-or-name"
```

### `config get`

Liest einen Wert aus dem geschwärzten Konfigurations-Snapshot (Geheimnisse werden niemals ausgegeben). `--json` gibt den Rohwert als JSON aus; andernfalls werden Zeichenfolgen/Zahlen/boolesche Werte unverändert und Objekte/Arrays als formatiertes JSON ausgegeben.

Wenn der Pfad fehlt, schreibt `--json` `{ "error": "Config path not found: <path>" }` in die Standardausgabe und beendet sich mit Status 1. Ohne `--json` verbleibt die Diagnose in der Standardfehlerausgabe.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

Gibt den aktiven Konfigurationsdateipfad aus, der aus `OPENCLAW_CONFIG_PATH` oder dem Standardspeicherort aufgelöst wird. Der Pfad bezeichnet eine reguläre Datei, keinen symbolischen Link; siehe [Schreibsicherheit](#write-safety).

### `config schema`

Gibt das generierte JSON-Schema für `openclaw.json` in die Standardausgabe aus.

<AccordionGroup>
  <Accordion title="Enthaltene Elemente">
    - Das aktuelle Stammkonfigurationsschema sowie ein `$schema`-Zeichenfolgenfeld auf Stammebene für Editorwerkzeuge.
    - Die Dokumentationsmetadaten der Felder `title` / `description`, die von der Control UI verwendet werden.
    - Verschachtelte Objekt-, Platzhalter- (`*`) und Array-Elementknoten (`[]`) erben dieselben `title`- / `description`-Metadaten, wenn passende Felddokumentationen vorhanden sind.
    - Auch `anyOf`- / `oneOf`- / `allOf`-Verzweigungen erben dieselben Dokumentationsmetadaten.
    - Nach bestem Bemühen ermittelte Live-Schemametadaten für Plugins und Kanäle, wenn Laufzeitmanifeste geladen werden können.
    - Ein sauberes Rückfallschema, selbst wenn die aktuelle Konfiguration ungültig ist.

  </Accordion>
  <Accordion title="Zugehöriger Laufzeit-RPC">
    `config.schema.lookup` gibt einen normalisierten Konfigurationspfad mit einem flachen Schemaknoten (`title`, `description`, `type`, `enum`, `const`, allgemeine Grenzwerte), passenden Metadaten für UI-Hinweise und Zusammenfassungen der unmittelbaren untergeordneten Elemente zurück. Verwenden Sie ihn für pfadbezogene Detailansichten in der Control UI oder in benutzerdefinierten Clients.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

Validiert die aktuelle Konfiguration anhand des aktiven Schemas, ohne das Gateway zu starten.

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
Wenn die Validierung bereits fehlschlägt, beginnen Sie mit `openclaw configure` oder `openclaw doctor --fix`. `openclaw chat` umgeht die Schutzprüfung für ungültige Konfigurationen nicht.
</Note>

## Werte

Werte werden nach Möglichkeit als JSON5 geparst; andernfalls werden sie als unformatierte Zeichenfolgen behandelt. Verwenden Sie `--strict-json`, um Standard-JSON ohne Rückgriff auf Zeichenfolgen zu erzwingen (reine JSON5-Syntax wie Kommentare, nachgestellte Kommas oder Schlüssel ohne Anführungszeichen wird dann abgelehnt). `--json` ist bei `config set` ein veralteter Alias für `--strict-json`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` gibt den Rohwert als JSON statt als für das Terminal formatierten Text aus.

Wenn ein Schreibvorgang `agents.defaults.model` oder ein agentenspezifisches `agents.entries.*.model` ändert, löst OpenClaw vor dem Schreiben jede geänderte primäre oder Fallback-Referenz über die konfigurierten Provider-Kataloge auf. Unbekannte Modellreferenzen werden abgelehnt, ohne die aktive Konfiguration zu ändern; führen Sie `openclaw models list` aus, um die verfügbaren Modelle anzuzeigen.

<Note>
Die Zuweisung eines Objekts ersetzt standardmäßig den Zielpfad. Geschützte Pfade, die häufig von Benutzern hinzugefügte Einträge enthalten, verweigern Ersetzungen, durch die vorhandene Einträge entfernt würden, sofern Sie nicht `--replace` übergeben: `agents.defaults.models`, `agents.entries`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries` und `auth.profiles`.
</Note>

Verwenden Sie `--merge`, wenn Sie diesen Zuordnungstabellen Einträge hinzufügen:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Verwenden Sie `--replace` nur, wenn der angegebene Wert absichtlich zum vollständigen Zielwert werden soll.

## `config set`-Modi

<Tabs>
  <Tab title="Wertmodus">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef-Erstellungsmodus">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Provider-Erstellungsmodus">
    Gilt nur für `secrets.providers.<alias>`-Pfade:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Stapelmodus">
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

    Stapeldateien sind auf 8 MiB begrenzt.

  </Tab>
</Tabs>

<Warning>
SecretRef-Zuweisungen werden auf nicht unterstützten, zur Laufzeit veränderbaren Oberflächen abgelehnt (zum Beispiel `hooks.token`, `commands.ownerDisplaySecret`, Webhook-Tokens für die Discord-Threadbindung und WhatsApp-Anmeldedaten im JSON-Format). Siehe [SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface).
</Warning>

Beim Parsen von Stapeln dient immer die Stapelnutzlast (`--batch-json`/`--batch-file`) als maßgebliche Quelle; `--strict-json` / `--json` ändern das Parsingverhalten für Stapel nicht.

Der JSON-Pfad-/Wertmodus funktioniert auch direkt für SecretRefs und Provider:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### Flags für die Provider-Erstellung

Ziele der Provider-Erstellung müssen `secrets.providers.<alias>` als Pfad verwenden.

<AccordionGroup>
  <Accordion title="Allgemeine Flags">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Umgebungs-Provider (--provider-source env)">
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

## `config patch`

Fügen Sie einen konfigurationsförmigen JSON5-Patch ein oder leiten Sie ihn über eine Pipe weiter, statt viele pfadbasierte `config set`-Befehle auszuführen. Objekte werden rekursiv zusammengeführt; Arrays und skalare Werte ersetzen das Ziel; `null` löscht den Zielpfad.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Patchdateien sind auf 8 MiB begrenzt. Über eine Pipe übertragene `--stdin`-Patches sind auf 1 MiB begrenzt.

Leiten Sie für Skripte zur Remote-Einrichtung einen Patch über die Standardeingabe weiter:

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
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
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

Verwenden Sie `--replace-path <path>`, wenn ein Objekt oder Array exakt zum angegebenen Wert werden muss, statt rekursiv gepatcht zu werden:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` führt Schema- und Auflösbarkeitsprüfungen für SecretRefs durch, ohne zu schreiben. Exec-basierte SecretRefs werden während eines Probelaufs standardmäßig übersprungen; fügen Sie `--allow-exec` hinzu, wenn der Probelauf absichtlich Provider-Befehle ausführen soll.

## Probelauf

`--dry-run` validiert Änderungen, ohne `openclaw.json` zu schreiben. Verfügbar für `config set`, `config patch` und `config unset`.

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
  <Accordion title="Verhalten des Probelaufs">
    - Builder-Modus: führt Auflösbarkeitsprüfungen für geänderte SecretRefs/Provider durch.
    - JSON-Modus (`--strict-json`, `--json` oder Batch-Modus): führt eine Schemavalidierung sowie Auflösbarkeitsprüfungen für SecretRefs durch.
    - Die Richtlinienvalidierung wird für die vollständige Konfiguration nach der Änderung ausgeführt, sodass Schreibvorgänge für übergeordnete Objekte (beispielsweise das Festlegen von `hooks` als Objekt) die Validierung nicht unterstützter Oberflächen nicht umgehen können.
    - Prüfungen von Exec-SecretRefs werden standardmäßig übersprungen, um Nebenwirkungen durch Befehle zu vermeiden; übergeben Sie `--allow-exec`, um sie zu aktivieren (dadurch können Provider-Befehle ausgeführt werden). `--allow-exec` ist ausschließlich für Probeläufe vorgesehen und führt ohne `--dry-run` zu einem Fehler.

  </Accordion>
  <Accordion title="Felder von --dry-run --json">
    - `ok`: ob der Probelauf erfolgreich war
    - `operations`: Anzahl der ausgewerteten Zuweisungen
    - `checks`: ob Schema-/Auflösbarkeitsprüfungen ausgeführt wurden
    - `checks.resolvabilityComplete`: ob die Auflösbarkeitsprüfungen vollständig ausgeführt wurden (false, wenn Exec-SecretRefs übersprungen werden)
    - `refsChecked`: Anzahl der während des Probelaufs tatsächlich aufgelösten SecretRefs
    - `skippedExecRefs`: Anzahl der übersprungenen Exec-SecretRefs, weil `--allow-exec` nicht festgelegt war
    - `errors`: strukturierte Fehler zu fehlenden Pfaden, zum Schema oder zur Auflösbarkeit, wenn `ok=false`

  </Accordion>
</AccordionGroup>

### Struktur der JSON-Ausgabe

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
      kind: "missing-path" | "schema" | "resolvability" | "model",
      message: string,
      ref?: string, // bei Auflösbarkeitsfehlern vorhanden
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
          "message": "Fehler: Die Umgebungsvariable \"MISSING_TEST_SECRET\" ist nicht festgelegt.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Wenn der Probelauf fehlschlägt">
    - `config schema validation failed`: Die Struktur Ihrer Konfiguration nach der Änderung ist ungültig; korrigieren Sie den Pfad/Wert oder die Struktur des Provider-/SecretRef-Objekts.
    - `Config policy validation failed: unsupported SecretRef usage`: Verschieben Sie diese Anmeldedaten zurück in eine Klartext-/Zeichenfolgeneingabe; verwenden Sie SecretRefs nur auf unterstützten Oberflächen.
    - `SecretRef assignment(s) could not be resolved`: Der referenzierte Provider bzw. die referenzierte SecretRef kann derzeit nicht aufgelöst werden (fehlende Umgebungsvariable, ungültiger Dateizeiger, Fehler des Exec-Providers oder Nichtübereinstimmung von Provider und Quelle).
    - `model reference validation failed`: Ein geändertes primäres Textmodell oder Fallback-Modell ist unbekannt; führen Sie `openclaw models list` aus und wählen Sie ein verfügbares Modell.
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: Führen Sie den Vorgang erneut mit `--allow-exec` aus, wenn Sie eine Exec-Auflösbarkeitsvalidierung benötigen.
    - Korrigieren Sie im Batch-Modus die fehlerhaften Einträge und führen Sie `--dry-run` vor dem Schreiben erneut aus.

  </Accordion>
</AccordionGroup>

## Änderungen anwenden

Nach jedem erfolgreichen `config set` / `config patch` / `config unset` gibt die CLI einen von drei Hinweisen aus, damit Sie wissen, ob der Gateway neu gestartet werden muss:

| Hinweis                                             | Bedeutung                                              |
| --------------------------------------------------- | ------------------------------------------------------ |
| `Restart the gateway to apply.`                                  | Der geänderte Pfad erfordert einen vollständigen Neustart. |
| `Change will apply without restarting the gateway.`                                  | Hot Reload übernimmt ihn automatisch.                  |
| `No gateway restart needed.`                                  | Es wurde nichts Laufzeitrelevantes geändert.           |

Schreibvorgänge in `plugins.entries` (oder einen beliebigen Unterpfad) erfordern immer einen Neustart, da die CLI nicht sicherstellen kann, dass die Reload-Metadaten jedes Plugins geladen sind.

## Schreibsicherheit

`openclaw config set` und andere OpenClaw-eigene Konfigurationsschreiber validieren die vollständige Konfiguration nach der Änderung, bevor sie auf den Datenträger geschrieben wird. Wenn die neue Nutzlast die Schemavalidierung nicht besteht oder wie ein destruktives Überschreiben aussieht, bleibt die aktive Konfiguration unverändert und die abgelehnte Nutzlast wird daneben als `openclaw.json.rejected.*` gespeichert.

OpenClaw-eigene Schreibvorgänge serialisieren JSON5 als Standard-JSON neu. Wenn die Quelle Kommentare enthält, warnt der Schreiber unmittelbar vor deren Entfernung; verwenden Sie einen direkten Editor, wenn Kommentare erhalten bleiben müssen.

<Warning>
Der aktive Konfigurationspfad muss eine reguläre Datei sein. Über symbolische Links eingebundene `openclaw.json`-Layouts werden für Schreibvorgänge nicht unterstützt; verwenden Sie stattdessen `OPENCLAW_CONFIG_PATH`, um direkt auf die tatsächliche Datei zu verweisen.
</Warning>

Bevorzugen Sie CLI-Schreibvorgänge für kleine Änderungen:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Wenn ein Schreibvorgang abgelehnt wird, prüfen Sie die gespeicherte Nutzlast und korrigieren Sie die vollständige Konfigurationsstruktur:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Direkte Schreibvorgänge mit einem Editor sind weiterhin zulässig, der laufende Gateway behandelt sie jedoch als nicht vertrauenswürdig, bis sie validiert wurden. Ungültige direkte Änderungen führen beim Start zu einem Fehler oder werden beim Hot Reload übersprungen; der Gateway schreibt `openclaw.json` nicht neu. Führen Sie `openclaw doctor --fix` aus, um eine mit Präfixen versehene oder überschriebene Konfiguration zu reparieren oder die letzte als funktionsfähig bekannte Kopie wiederherzustellen. Siehe [Fehlerbehebung für den Gateway](/de/gateway/troubleshooting#gateway-rejected-invalid-config).

Die Wiederherstellung der gesamten Datei ist Doctor-Reparaturen vorbehalten. Änderungen am Plugin-Schema oder eine Abweichung bei `minHostVersion` bleiben deutlich sichtbar, statt nicht zusammenhängende Benutzereinstellungen wie Modelle, Provider, Authentifizierungsprofile, Kanäle, Gateway-Exposition, Werkzeuge, Speicher, Browser- oder Cron-Konfiguration zurückzusetzen.

## Reparaturschleife

Nachdem `openclaw config validate` erfolgreich abgeschlossen wurde, verwenden Sie die lokale TUI, damit ein eingebetteter Agent die aktive Konfiguration mit der Dokumentation vergleicht, während Sie jede Änderung im selben Terminal validieren:

```bash
openclaw chat
```

Innerhalb der TUI führt ein vorangestelltes `!` einen wörtlichen lokalen Shell-Befehl aus (nach einer einmaligen Bestätigungsaufforderung pro Sitzung):

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="Mit der Dokumentation vergleichen">
    Bitten Sie den Agenten, Ihre aktuelle Konfiguration mit der relevanten Dokumentationsseite zu vergleichen und die kleinste Korrektur vorzuschlagen.
  </Step>
  <Step title="Gezielte Änderungen anwenden">
    Wenden Sie gezielte Änderungen mit `openclaw config set` oder `openclaw configure` an.
  </Step>
  <Step title="Erneut validieren">
    Führen Sie `openclaw config validate` nach jeder Änderung erneut aus.
  </Step>
  <Step title="Doctor bei Laufzeitproblemen">
    Wenn die Validierung erfolgreich ist, die Laufzeit aber weiterhin fehlerhaft ist, führen Sie `openclaw doctor` oder `openclaw doctor --fix` aus, um Hilfe bei Migration und Reparatur zu erhalten.
  </Step>
</Steps>

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Konfiguration](/de/gateway/configuration)
