---
read_when:
    - SecretRefs für Provider-Anmeldedaten und `auth-profiles.json`-Refs konfigurieren
    - Secrets-Reload, Audit, Konfiguration und Anwendung in der Produktion sicher betreiben
    - Startverhalten mit schnellem Fehlschlagen, Filterung inaktiver Oberflächen und Last-Known-Good-Verhalten verstehen
sidebarTitle: Secrets management
summary: 'Geheimnisverwaltung: SecretRef-Vertrag, Laufzeit-Snapshot-Verhalten und sichere Einweg-Bereinigung'
title: Geheimnisverwaltung
x-i18n:
    generated_at: "2026-06-27T17:33:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d90346b1e4abc39cf1ab314c242f0b976aa83ee06f6dfeb787aafb19fa90de9
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw unterstützt additive SecretRefs, sodass unterstützte Zugangsdaten nicht als Klartext in der Konfiguration gespeichert werden müssen.

<Note>
Klartext funktioniert weiterhin. SecretRefs sind pro Zugangsdaten opt-in.
</Note>

<Warning>
Klartext-Zugangsdaten bleiben für Agents lesbar, wenn sie in Dateien gespeichert sind, die der
Agent einsehen kann, darunter `openclaw.json`, `auth-profiles.json`, `.env` oder
generierte `agents/*/agent/models.json`-Dateien. SecretRefs reduzieren diesen lokalen
Auswirkungsbereich erst, nachdem alle unterstützten Zugangsdaten migriert wurden und
`openclaw secrets audit --check` keine verbleibenden Klartext-Secrets meldet.
</Warning>

## Ziele und Laufzeitmodell

Secrets werden in einen In-Memory-Laufzeit-Snapshot aufgelöst.

- Die Auflösung erfolgt während der Aktivierung eifrig, nicht lazy auf Anfragepfaden.
- Der Start schlägt schnell fehl, wenn ein effektiv aktiver SecretRef nicht aufgelöst werden kann.
- Reload verwendet atomaren Austausch: vollständiger Erfolg oder Beibehaltung des zuletzt als gut bekannten Snapshots.
- SecretRef-Policy-Verstöße (zum Beispiel Auth-Profile im OAuth-Modus in Kombination mit SecretRef-Eingabe) lassen die Aktivierung vor dem Laufzeitaustausch fehlschlagen.
- Laufzeitanfragen lesen ausschließlich aus dem aktiven In-Memory-Snapshot.
- Nach der ersten erfolgreichen Konfigurationsaktivierung bzw. dem ersten erfolgreichen Laden lesen Laufzeit-Codepfade weiter aus diesem aktiven In-Memory-Snapshot, bis ein erfolgreicher Reload ihn austauscht.
- Ausgehende Zustellpfade lesen ebenfalls aus diesem aktiven Snapshot (zum Beispiel Discord-Antwort-/Thread-Zustellung und Telegram-Aktionssendungen); sie lösen SecretRefs nicht bei jedem Senden erneut auf.

Dadurch bleiben Ausfälle von Secret-Providern von heißen Anfragepfaden fern.

## Agent-Zugriffsgrenze

SecretRefs schützen Zugangsdaten davor, in unterstützter Konfiguration und
generierten Modelloberflächen persistiert zu werden, sie sind jedoch keine Prozessisolationsgrenze. Wenn ein
Klartext-Zugangsdatenwert auf der Festplatte in einem Pfad verbleibt, den der Agent lesen kann, kann der Agent
Redaktion auf API-Ebene umgehen, indem er Datei- oder Shell-Tools verwendet, um diese Datei einzusehen.

Behandeln Sie bei Produktionsbereitstellungen, bei denen für Agents zugängliche Dateien im Geltungsbereich liegen,
die SecretRef-Migration nur dann als abgeschlossen, wenn all dies zutrifft:

- unterstützte Zugangsdaten verwenden SecretRefs statt Klartextwerten
- veraltete Klartextreste wurden aus `openclaw.json`,
  `auth-profiles.json`, `.env` und generierten `models.json`-Dateien entfernt
- `openclaw secrets audit --check` ist nach der Migration sauber
- alle verbleibenden nicht unterstützten oder rotierenden Zugangsdaten sind durch Betriebssystemisolation,
  Container-Isolation oder einen externen Zugangsdaten-Proxy geschützt

Deshalb ist der Audit-/Configure-/Apply-Workflow ein Sicherheitsmigrations-Gate und
nicht nur ein Komfort-Helper.

<Warning>
SecretRefs machen beliebige lesbare Dateien nicht sicher. Backups, kopierte Konfigurationen,
alte generierte Modellkataloge und nicht unterstützte Zugangsdatenklassen müssen
als Produktions-Secrets behandelt werden, bis sie gelöscht, außerhalb der Agent-Vertrauensgrenze
verschoben oder durch eine separate Isolationsschicht geschützt sind.
</Warning>

## Filterung aktiver Oberflächen

SecretRefs werden nur auf effektiv aktiven Oberflächen validiert.

- Aktivierte Oberflächen: nicht aufgelöste Referenzen blockieren Start/Reload.
- Inaktive Oberflächen: nicht aufgelöste Referenzen blockieren Start/Reload nicht.
- Inaktive Referenzen geben nicht-fatale Diagnosen mit dem Code `SECRETS_REF_IGNORED_INACTIVE_SURFACE` aus.

<AccordionGroup>
  <Accordion title="Beispiele für inaktive Oberflächen">
    - Deaktivierte Channel-/Konto-Einträge.
    - Top-Level-Channel-Zugangsdaten, die kein aktiviertes Konto erbt.
    - Deaktivierte Tool-/Feature-Oberflächen.
    - Websuche-Provider-spezifische Schlüssel, die nicht durch `tools.web.search.provider` ausgewählt sind. Im Automodus (Provider nicht gesetzt) werden Schlüssel entsprechend ihrer Priorität für die automatische Provider-Erkennung herangezogen, bis einer aufgelöst wird. Nach der Auswahl werden nicht ausgewählte Provider-Schlüssel als inaktiv behandelt, bis sie ausgewählt werden.
    - Sandbox-SSH-Auth-Material (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData` plus agentenspezifische Überschreibungen) ist nur aktiv, wenn das effektive Sandbox-Backend für den Standard-Agent oder einen aktivierten Agent `ssh` ist.
    - `gateway.remote.token`- / `gateway.remote.password`-SecretRefs sind aktiv, wenn eine dieser Bedingungen zutrifft:
      - `gateway.mode=remote`
      - `gateway.remote.url` ist konfiguriert
      - `gateway.tailscale.mode` ist `serve` oder `funnel`
      - Im lokalen Modus ohne diese Remote-Oberflächen:
        - `gateway.remote.token` ist aktiv, wenn Token-Auth gewinnen kann und kein Env-/Auth-Token konfiguriert ist.
        - `gateway.remote.password` ist nur aktiv, wenn Passwort-Auth gewinnen kann und kein Env-/Auth-Passwort konfiguriert ist.
    - `gateway.auth.token`-SecretRef ist für die Auth-Auflösung beim Start inaktiv, wenn `OPENCLAW_GATEWAY_TOKEN` gesetzt ist, weil Env-Token-Eingabe für diese Laufzeit Vorrang hat.

  </Accordion>
</AccordionGroup>

## Diagnosen der Gateway-Auth-Oberfläche

Wenn ein SecretRef auf `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` oder `gateway.remote.password` konfiguriert ist, protokolliert Gateway-Start/Reload den Oberflächenzustand explizit:

- `active`: Der SecretRef ist Teil der effektiven Auth-Oberfläche und muss aufgelöst werden.
- `inactive`: Der SecretRef wird für diese Laufzeit ignoriert, weil eine andere Auth-Oberfläche Vorrang hat oder weil Remote-Auth deaktiviert/nicht aktiv ist.

Diese Einträge werden mit `SECRETS_GATEWAY_AUTH_SURFACE` protokolliert und enthalten den Grund, den die Policy für aktive Oberflächen verwendet. So können Sie sehen, warum ein Zugangsdatenwert als aktiv oder inaktiv behandelt wurde.

## Onboarding-Referenz-Preflight

Wenn Onboarding im interaktiven Modus läuft und Sie SecretRef-Speicherung auswählen, führt OpenClaw vor dem Speichern eine Preflight-Validierung aus:

- Env-Referenzen: validiert den Namen der Env-Variable und bestätigt, dass während der Einrichtung ein nicht leerer Wert sichtbar ist.
- Provider-Referenzen (`file` oder `exec`): validiert die Provider-Auswahl, löst `id` auf und prüft den Typ des aufgelösten Werts.
- Quickstart-Wiederverwendungspfad: Wenn `gateway.auth.token` bereits ein SecretRef ist, löst Onboarding ihn vor Probe-/Dashboard-Bootstrap (für `env`-, `file`- und `exec`-Referenzen) mit demselben Fail-Fast-Gate auf.

Wenn die Validierung fehlschlägt, zeigt Onboarding den Fehler an und lässt Sie es erneut versuchen.

## SecretRef-Vertrag

Verwenden Sie überall dieselbe Objektform:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Unterstützte SecretInput-Felder akzeptieren außerdem exakte String-Kurzformen:

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
    ```

    Validierung:

    - `provider` muss `^[a-z][a-z0-9_-]{0,63}$` entsprechen
    - `id` muss `^[A-Z][A-Z0-9_]{0,127}$` entsprechen

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    Validierung:

    - `provider` muss `^[a-z][a-z0-9_-]{0,63}$` entsprechen
    - `id` muss ein absoluter JSON-Pointer sein (`/...`)
    - RFC6901-Escaping in Segmenten: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Validierung:

    - `provider` muss `^[a-z][a-z0-9_-]{0,63}$` entsprechen
    - `id` muss `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` entsprechen (unterstützt Selektoren wie `secret#json_key`)
    - `id` darf `.` oder `..` nicht als durch Schrägstriche getrennte Pfadsegmente enthalten (zum Beispiel wird `a/../b` abgelehnt)

  </Tab>
</Tabs>

## Provider-Konfiguration

Definieren Sie Provider unter `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // or "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
      "team-secrets": {
        source: "exec",
        pluginIntegration: {
          pluginId: "acme-secrets",
          integrationId: "secret-store",
        },
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Env-Provider">
    - Optionale Allowlist über `allowlist`.
    - Fehlende/leere Env-Werte lassen die Auflösung fehlschlagen.

  </Accordion>
  <Accordion title="Datei-Provider">
    - Liest lokale Datei aus `path`.
    - `mode: "json"` erwartet eine JSON-Objekt-Payload und löst `id` als Pointer auf.
    - `mode: "singleValue"` erwartet die Referenz-ID `"value"` und gibt Dateiinhalte zurück.
    - Der Pfad muss Eigentümer-/Berechtigungsprüfungen bestehen.
    - Windows-Fail-Closed-Hinweis: Wenn ACL-Verifizierung für einen Pfad nicht verfügbar ist, schlägt die Auflösung fehl. Setzen Sie nur für vertrauenswürdige Pfade `allowInsecurePath: true` auf diesem Provider, um Pfadsicherheitsprüfungen zu umgehen.

  </Accordion>
  <Accordion title="Exec-Provider">
    - Führt den konfigurierten absoluten Binärpfad ohne Shell aus.
    - Standardmäßig muss `command` auf eine reguläre Datei zeigen (kein Symlink).
    - Setzen Sie `allowSymlinkCommand: true`, um Symlink-Befehlspfade zuzulassen (zum Beispiel Homebrew-Shims). OpenClaw validiert den aufgelösten Zielpfad.
    - Kombinieren Sie `allowSymlinkCommand` mit `trustedDirs` für Paketmanager-Pfade (zum Beispiel `["/opt/homebrew"]`).
    - Unterstützt Timeout, Timeout bei fehlender Ausgabe, Ausgabebyte-Limits, Env-Allowlist und vertrauenswürdige Verzeichnisse.
    - Windows-Fail-Closed-Hinweis: Wenn ACL-Verifizierung für den Befehlspfad nicht verfügbar ist, schlägt die Auflösung fehl. Setzen Sie nur für vertrauenswürdige Pfade `allowInsecurePath: true` auf diesem Provider, um Pfadsicherheitsprüfungen zu umgehen.
    - Plugin-verwaltete Exec-Provider können `pluginIntegration` statt
      kopiertem `command`/`args` verwenden. OpenClaw löst die aktuellen Befehlsdetails
      während Start/Reload aus dem installierten Plugin-Manifest auf. Wenn das Plugin
      deaktiviert, entfernt, nicht vertrauenswürdig ist oder die Integration nicht mehr deklariert,
      schlagen aktive SecretRefs, die diesen Provider verwenden, geschlossen fehl.

    Anfrage-Payload (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Antwort-Payload (stdout):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    Optionale Fehler pro ID:

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## Dateibasierte API-Schlüssel

Legen Sie keine `file:...`-Strings in den `env`-Block der Konfiguration. Der `env`-Block ist
literal und nicht überschreibend, daher wird `file:...` nicht aufgelöst.

Verwenden Sie stattdessen einen Datei-SecretRef auf einem unterstützten Zugangsdatenfeld:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

Für `mode: "singleValue"` ist die SecretRef-`id` `"value"`. Für
`mode: "json"` verwenden Sie einen absoluten JSON-Pointer wie
`"/providers/xai/apiKey"`.

Siehe [SecretRef-Zugangsdatenoberfläche](/de/reference/secretref-credential-surface) für
die Konfigurationsfelder, die SecretRefs akzeptieren.

## Exec-Integrationsbeispiele

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
            trustedDirs: ["/opt/homebrew"],
            args: ["read", "op://Personal/OpenClaw QA API Key/password"],
            passEnv: ["HOME"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="Bitwarden Secrets Manager (`bws`)">
    Verwenden Sie einen Resolver-Wrapper, wenn SecretRef-IDs Bitwarden
    Secrets Manager-Elementschlüsseln zugeordnet werden sollen. Das Repository enthält
    `scripts/secrets/openclaw-bws-resolver.mjs`; installieren oder kopieren Sie es in einen absoluten,
    vertrauenswürdigen Pfad auf dem Host, auf dem der Gateway ausgeführt wird.

    Anforderungen:

    - Bitwarden Secrets Manager CLI (`bws`) ist auf dem Gateway-Host installiert.
    - `BWS_ACCESS_TOKEN` ist für den Gateway-Dienst verfügbar.
    - `PATH` wird an den Resolver übergeben, oder `BWS_BIN` ist auf den absoluten
      Binärpfad von `bws` gesetzt.
    - `BWS_SERVER_URL` muss in der Umgebung gesetzt sein, wenn eine selbst gehostete
      Bitwarden-Instanz verwendet wird.

    ```json5
    {
      secrets: {
        providers: {
          bws: {
            source: "exec",
            command: "/usr/local/bin/openclaw-bws-resolver.mjs",
            passEnv: ["BWS_ACCESS_TOKEN", "BWS_SERVER_URL", "PATH", "BWS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "bws",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    Der Resolver bündelt angeforderte IDs, führt `bws secret list` aus und gibt
    Werte für passende geheime `key`-Felder zurück. Verwenden Sie Schlüssel, die den exec
    SecretRef-ID-Vertrag erfüllen, etwa `openclaw/providers/openai/apiKey`; Env-Var-
    Schlüssel im Stil mit Unterstrichen werden abgelehnt, bevor der Resolver ausgeführt wird. Wenn mehr
    als ein sichtbares Bitwarden-Geheimnis denselben angeforderten Schlüssel hat, lässt der Resolver
    diese ID wegen Mehrdeutigkeit fehlschlagen, statt eines auszuwählen. Prüfen Sie nach der Aktualisierung der Konfiguration
    den Resolver-Pfad:

    ```bash
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
            trustedDirs: ["/opt/homebrew"],
            args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
            passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "vault_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="password-store (`pass`)">
    Verwenden Sie einen kleinen Resolver-Wrapper, wenn SecretRef-IDs direkt
    `pass`-Einträgen zugeordnet werden sollen. Speichern Sie dies als ausführbare Datei in einem absoluten Pfad, der
    Ihre exec-Provider-Pfadprüfungen besteht, zum Beispiel
    `/usr/local/bin/openclaw-pass-resolver`. Der `#!/usr/bin/env node`-Shebang
    löst `node` aus dem `PATH` des Resolver-Prozesses auf, nehmen Sie daher `PATH` in
    `passEnv` auf. Wenn `pass` nicht in diesem `PATH` liegt, setzen Sie `PASS_BIN` in der übergeordneten
    Umgebung und nehmen Sie es ebenfalls in `passEnv` auf:

    ```js
    #!/usr/bin/env node
    const { spawnSync } = require("node:child_process");

    let stdin = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      stdin += chunk;
    });
    process.stdin.on("error", (err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
    process.stdin.on("end", () => {
      let request;
      try {
        request = JSON.parse(stdin || "{}");
      } catch (err) {
        process.stderr.write(`Failed to parse request: ${err.message}\n`);
        process.exit(1);
      }

      const passBin = process.env.PASS_BIN || "pass";
      const values = {};
      const errors = {};

      for (const id of request.ids ?? []) {
        const result = spawnSync(passBin, ["show", id], { encoding: "utf8" });
        if (result.status === 0) {
          values[id] = result.stdout.split(/\r?\n/, 1)[0] ?? "";
        } else {
          errors[id] = { message: (result.stderr || `pass exited ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    Konfigurieren Sie anschließend den exec-Provider und richten Sie `apiKey` auf den `pass`-Eintragspfad:

    ```json5
    {
      secrets: {
        providers: {
          pass_store: {
            source: "exec",
            command: "/usr/local/bin/openclaw-pass-resolver",
            passEnv: ["PATH", "HOME", "GNUPGHOME", "GPG_TTY", "PASSWORD_STORE_DIR", "PASS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "pass_store",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    Bewahren Sie das Geheimnis in der ersten Zeile des `pass`-Eintrags auf, oder passen Sie den
    Wrapper an, wenn Sie stattdessen die vollständige Ausgabe von `pass show` zurückgeben möchten. Prüfen Sie nach
    der Aktualisierung der Konfiguration sowohl das statische Audit als auch den exec-Resolver-Pfad:

    ```bash
    openclaw secrets audit --check
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
            trustedDirs: ["/opt/homebrew"],
            args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
            passEnv: ["SOPS_AGE_KEY_FILE"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "sops_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## MCP-Server-Umgebungsvariablen

MCP-Server-Env-Vars, die über `plugins.entries.acpx.config.mcpServers` konfiguriert sind, unterstützen SecretInput. Dadurch bleiben API-Schlüssel und Tokens außerhalb der Klartextkonfiguration:

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

Klartext-String-Werte funktionieren weiterhin. Env-Template-Refs wie `${MCP_SERVER_API_KEY}` und SecretRef-Objekte werden während der Gateway-Aktivierung aufgelöst, bevor der MCP-Server-Prozess gestartet wird. Wie bei anderen SecretRef-Oberflächen blockieren nicht aufgelöste Refs die Aktivierung nur, wenn das `acpx`-Plugin effektiv aktiv ist.

## SSH-Auth-Material für Sandbox

Das zentrale `ssh`-Sandbox-Backend unterstützt ebenfalls SecretRefs für SSH-Auth-Material:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Laufzeitverhalten:

- OpenClaw löst diese Refs während der Sandbox-Aktivierung auf, nicht verzögert bei jedem SSH-Aufruf.
- Aufgelöste Werte werden in temporäre Dateien mit restriktiven Berechtigungen geschrieben und in der generierten SSH-Konfiguration verwendet.
- Wenn das effektive Sandbox-Backend nicht `ssh` ist, bleiben diese Refs inaktiv und blockieren den Start nicht.

## Unterstützte Anmeldeinformationsoberfläche

Kanonisch unterstützte und nicht unterstützte Anmeldeinformationen sind hier aufgeführt:

- [SecretRef-Anmeldeinformationsoberfläche](/de/reference/secretref-credential-surface)

<Note>
Zur Laufzeit erstellte oder rotierende Anmeldeinformationen und OAuth-Refresh-Material sind absichtlich von der schreibgeschützten SecretRef-Auflösung ausgeschlossen.
</Note>

## Erforderliches Verhalten und Vorrang

- Feld ohne Ref: unverändert.
- Feld mit Ref: auf aktiven Oberflächen während der Aktivierung erforderlich.
- Wenn sowohl Klartext als auch Ref vorhanden sind, hat Ref auf unterstützten Vorrangpfaden Vorrang.
- Der Redaktions-Sentinel `__OPENCLAW_REDACTED__` ist für interne Konfigurationsredaktion/-wiederherstellung reserviert und wird als wörtlich übermittelte Konfigurationsdaten abgelehnt.

Warn- und Audit-Signale:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (Laufzeitwarnung)
- `REF_SHADOWED` (Audit-Befund, wenn `auth-profiles.json`-Anmeldeinformationen Vorrang vor `openclaw.json`-Refs haben)

Google Chat-Kompatibilitätsverhalten:

- `serviceAccountRef` hat Vorrang vor Klartext-`serviceAccount`.
- Der Klartextwert wird ignoriert, wenn eine benachbarte Ref gesetzt ist.

## Aktivierungsauslöser

Die Geheimnisaktivierung wird ausgeführt bei:

- Start (Preflight plus abschließende Aktivierung)
- Hot-Apply-Pfad beim Neuladen der Konfiguration
- Restart-Check-Pfad beim Neuladen der Konfiguration
- Manuellem Neuladen über `secrets.reload`
- Gateway-Konfigurationsschreib-RPC-Preflight (`config.set` / `config.apply` / `config.patch`) für die Auflösbarkeit von SecretRefs auf aktiven Oberflächen innerhalb der übermittelten Konfigurationsnutzlast vor dem Persistieren von Änderungen

Aktivierungsvertrag:

- Erfolg tauscht den Snapshot atomar aus.
- Ein Startfehler bricht den Gateway-Start ab.
- Ein Laufzeit-Neuladefehler behält den zuletzt bekannten funktionsfähigen Snapshot bei.
- Ein Write-RPC-Preflight-Fehler lehnt die übermittelte Konfiguration ab und lässt sowohl die Datenträgerkonfiguration als auch den aktiven Laufzeit-Snapshot unverändert.
- Das Bereitstellen eines expliziten Kanal-Tokens pro Aufruf für einen ausgehenden Helper-/Tool-Aufruf löst keine SecretRef-Aktivierung aus; Aktivierungspunkte bleiben Start, Neuladen und explizites `secrets.reload`.

## Signale für beeinträchtigten und wiederhergestellten Zustand

Wenn die Aktivierung beim Neuladen nach einem fehlerfreien Zustand fehlschlägt, wechselt OpenClaw in einen beeinträchtigten Geheimniszustand.

Einmalige Systemereignis- und Protokollcodes:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Verhalten:

- Beeinträchtigt: Die Laufzeit behält den zuletzt bekannten funktionsfähigen Snapshot bei.
- Wiederhergestellt: Wird einmal nach der nächsten erfolgreichen Aktivierung ausgegeben.
- Wiederholte Fehler, während der Zustand bereits beeinträchtigt ist, protokollieren Warnungen, erzeugen aber keine Ereignisflut.
- Start-Fail-Fast gibt keine Ereignisse für beeinträchtigten Zustand aus, weil die Laufzeit nie aktiv wurde.

## Befehlspfadauflösung

Befehlspfade können sich über Gateway-Snapshot-RPC für unterstützte SecretRef-Auflösung entscheiden.

Es gibt zwei allgemeine Verhaltensweisen:

<Tabs>
  <Tab title="Strikte Befehlspfade">
    Zum Beispiel `openclaw memory`-Remote-Memory-Pfade und `openclaw qr --remote`, wenn Remote-Shared-Secret-Refs benötigt werden. Sie lesen aus dem aktiven Snapshot und schlagen schnell fehl, wenn eine erforderliche SecretRef nicht verfügbar ist.
  </Tab>
  <Tab title="Schreibgeschützte Befehlspfade">
    Zum Beispiel `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` und schreibgeschützte Doctor-/Konfigurationsreparatur-Flows. Sie bevorzugen ebenfalls den aktiven Snapshot, werden aber eingeschränkt fortgesetzt, statt abzubrechen, wenn eine gezielte SecretRef in diesem Befehlspfad nicht verfügbar ist.

    Schreibgeschütztes Verhalten:

    - Wenn der Gateway läuft, lesen diese Befehle zuerst aus dem aktiven Snapshot.
    - Wenn die Gateway-Auflösung unvollständig ist oder der Gateway nicht verfügbar ist, versuchen sie einen gezielten lokalen Fallback für die spezifische Befehlsoberfläche.
    - Wenn eine gezielte SecretRef weiterhin nicht verfügbar ist, wird der Befehl mit eingeschränkter schreibgeschützter Ausgabe und ausdrücklicher Diagnose wie „konfiguriert, aber in diesem Befehlspfad nicht verfügbar“ fortgesetzt.
    - Dieses eingeschränkte Verhalten ist nur befehlslokal. Es schwächt keine Laufzeit-Start-, Reload- oder Sende-/Authentifizierungspfade ab.

  </Tab>
</Tabs>

Weitere Hinweise:

- Die Snapshot-Aktualisierung nach einer Secret-Rotation im Backend wird von `openclaw secrets reload` behandelt.
- Von diesen Befehlspfaden verwendete Gateway-RPC-Methode: `secrets.resolve`.

## Audit- und Konfigurationsworkflow

Standardmäßiger Operator-Flow:

<Steps>
  <Step title="Aktuellen Zustand auditieren">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="SecretRefs konfigurieren und anwenden">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="Erneut auditieren">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

Betrachten Sie die Migration erst als abgeschlossen, wenn der erneute Audit sauber ist. Wenn der Audit
weiterhin Klartextwerte im Ruhezustand meldet, besteht das Risiko des Agent-Zugriffs weiterhin,
auch wenn Laufzeit-APIs redigierte Werte zurückgeben.

Wenn Sie während `configure` einen Plan speichern, statt ihn anzuwenden, wenden Sie diesen gespeicherten Plan
vor dem erneuten Audit mit `openclaw secrets apply --from <plan-path>` an.

<AccordionGroup>
  <Accordion title="secrets audit">
    Befunde umfassen:

    - Klartextwerte im Ruhezustand (`openclaw.json`, `auth-profiles.json`, `.env` und generierte `agents/*/agent/models.json`)
    - Klartextreste sensibler Provider-Header in generierten `models.json`-Einträgen
    - nicht aufgelöste Refs
    - Prioritätsverschattung (`auth-profiles.json` hat Vorrang vor `openclaw.json`-Refs)
    - Legacy-Reste (`auth.json`, OAuth-Erinnerungen)

    Exec-Hinweis:

    - Standardmäßig überspringt der Audit Auflösbarkeitsprüfungen für exec-SecretRefs, um Nebenwirkungen von Befehlen zu vermeiden.
    - Verwenden Sie `openclaw secrets audit --allow-exec`, um exec-Provider während des Audits auszuführen.

    Hinweis zu Header-Resten:

    - Die Erkennung sensibler Provider-Header basiert auf Namensheuristiken (gängige Authentifizierungs-/Zugangsdaten-Headernamen und Fragmente wie `authorization`, `x-api-key`, `token`, `secret`, `password` und `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Interaktiver Helfer, der:

    - zuerst `secrets.providers` konfiguriert (`env`/`file`/`exec`, hinzufügen/bearbeiten/entfernen)
    - Sie unterstützte Felder mit Secrets in `openclaw.json` plus `auth-profiles.json` für einen Agent-Scope auswählen lässt
    - direkt in der Zielauswahl eine neue `auth-profiles.json`-Zuordnung erstellen kann
    - SecretRef-Details erfasst (`source`, `provider`, `id`)
    - Preflight-Auflösung ausführt
    - sofort anwenden kann

    Exec-Hinweis:

    - Preflight überspringt exec-SecretRef-Prüfungen, sofern `--allow-exec` nicht gesetzt ist.
    - Wenn Sie direkt aus `configure --apply` anwenden und der Plan exec-Refs/-Provider enthält, lassen Sie `--allow-exec` auch für den Anwendungsschritt gesetzt.

    Hilfreiche Modi:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure`-Anwendungsstandards:

    - passende statische Zugangsdaten aus `auth-profiles.json` für gezielte Provider bereinigen
    - statische Legacy-`api_key`-Einträge aus `auth.json` bereinigen
    - passende bekannte Secret-Zeilen aus `<config-dir>/.env` bereinigen

  </Accordion>
  <Accordion title="secrets apply">
    Einen gespeicherten Plan anwenden:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Exec-Hinweis:

    - dry-run überspringt exec-Prüfungen, sofern `--allow-exec` nicht gesetzt ist.
    - Der Schreibmodus weist Pläne zurück, die exec-SecretRefs/-Provider enthalten, sofern `--allow-exec` nicht gesetzt ist.

    Details zum strikten Ziel-/Pfadvertrag und genaue Zurückweisungsregeln finden Sie unter [Secrets Apply Plan-Vertrag](/de/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Einweg-Sicherheitsrichtlinie

<Warning>
OpenClaw schreibt absichtlich keine Rollback-Backups, die historische Klartext-Secret-Werte enthalten.
</Warning>

Sicherheitsmodell:

- Preflight muss erfolgreich sein, bevor der Schreibmodus verwendet wird
- Laufzeitaktivierung wird vor dem Commit validiert
- Apply aktualisiert Dateien mit atomarer Dateiersetzung und Best-Effort-Wiederherstellung bei Fehlern

## Hinweise zur Legacy-Auth-Kompatibilität

Für statische Zugangsdaten hängt die Laufzeit nicht mehr von Klartext-Legacy-Auth-Speicher ab.

- Die Quelle für Laufzeit-Zugangsdaten ist der aufgelöste In-Memory-Snapshot.
- Statische Legacy-`api_key`-Einträge werden bereinigt, wenn sie entdeckt werden.
- OAuth-bezogenes Kompatibilitätsverhalten bleibt getrennt.

## Hinweis zur Web-UI

Einige SecretInput-Unions lassen sich im Roh-Editor-Modus leichter konfigurieren als im Formularmodus.

## Verwandte Themen

- [Authentifizierung](/de/gateway/authentication) — Auth-Einrichtung
- [CLI: secrets](/de/cli/secrets) — CLI-Befehle
- [Umgebungsvariablen](/de/help/environment) — Umgebungspriorität
- [SecretRef-Zugangsdatenoberfläche](/de/reference/secretref-credential-surface) — Zugangsdatenoberfläche
- [Secrets Apply Plan-Vertrag](/de/gateway/secrets-plan-contract) — Details zum Planvertrag
- [Sicherheit](/de/gateway/security) — Sicherheitsstatus
