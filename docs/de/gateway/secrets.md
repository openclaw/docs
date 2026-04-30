---
read_when:
    - SecretRefs für Provider-Anmeldedaten und `auth-profiles.json`-Referenzen konfigurieren
    - Secrets in der Produktion sicher neu laden, auditieren, konfigurieren und anwenden
    - Startverhalten mit Fail-Fast, Filterung inaktiver Oberflächen und Last-Known-Good-Verhalten verstehen
sidebarTitle: Secrets management
summary: 'Verwaltung von Geheimnissen: SecretRef-Vertrag, Verhalten von Laufzeit-Snapshots und sichere unumkehrbare Bereinigung'
title: Verwaltung von Secrets
x-i18n:
    generated_at: "2026-04-30T06:56:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96fddc346e21cab17d978843dc2a482c6faf8f810b3698a97aa88463133eaca5
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw unterstützt additive SecretRefs, damit unterstützte Anmeldedaten nicht als Klartext in der Konfiguration gespeichert werden müssen.

<Note>
Klartext funktioniert weiterhin. SecretRefs sind pro Anmeldedatum opt-in.
</Note>

## Ziele und Laufzeitmodell

Secrets werden in einen In-Memory-Laufzeit-Snapshot aufgelöst.

- Die Auflösung erfolgt während der Aktivierung eager, nicht lazy auf Anfragepfaden.
- Der Start schlägt schnell fehl, wenn eine effektiv aktive SecretRef nicht aufgelöst werden kann.
- Reload verwendet atomaren Austausch: vollständiger Erfolg oder Beibehaltung des zuletzt als gut bekannten Snapshots.
- SecretRef-Richtlinienverstöße (zum Beispiel OAuth-Modus-Auth-Profile in Kombination mit SecretRef-Eingaben) lassen die Aktivierung vor dem Laufzeitaustausch fehlschlagen.
- Laufzeitanfragen lesen nur aus dem aktiven In-Memory-Snapshot.
- Nach der ersten erfolgreichen Konfigurationsaktivierung bzw. dem ersten erfolgreichen Laden lesen Laufzeit-Codepfade weiterhin diesen aktiven In-Memory-Snapshot, bis ein erfolgreicher Reload ihn austauscht.
- Ausgehende Zustellungspfade lesen ebenfalls aus diesem aktiven Snapshot (zum Beispiel Discord-Antwort-/Thread-Zustellung und Telegram-Aktionssendungen); sie lösen SecretRefs nicht bei jedem Senden erneut auf.

Dadurch bleiben Ausfälle von Secret-Providern von heißen Anfragepfaden fern.

## Filterung aktiver Oberflächen

SecretRefs werden nur auf effektiv aktiven Oberflächen validiert.

- Aktivierte Oberflächen: nicht aufgelöste Refs blockieren Start/Reload.
- Inaktive Oberflächen: nicht aufgelöste Refs blockieren Start/Reload nicht.
- Inaktive Refs geben nicht-fatale Diagnosen mit dem Code `SECRETS_REF_IGNORED_INACTIVE_SURFACE` aus.

<AccordionGroup>
  <Accordion title="Beispiele für inaktive Oberflächen">
    - Deaktivierte Kanal-/Kontoeinträge.
    - Top-Level-Kanalanmeldedaten, die kein aktiviertes Konto erbt.
    - Deaktivierte Tool-/Feature-Oberflächen.
    - Websuche-Provider-spezifische Schlüssel, die nicht durch `tools.web.search.provider` ausgewählt sind. Im Automatikmodus (Provider nicht gesetzt) werden Schlüssel in Prioritätsreihenfolge für die automatische Provider-Erkennung herangezogen, bis einer aufgelöst wird. Nach der Auswahl werden nicht ausgewählte Provider-Schlüssel als inaktiv behandelt, bis sie ausgewählt werden.
    - Sandbox-SSH-Auth-Material (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData` sowie Überschreibungen pro Agent) ist nur aktiv, wenn das effektive Sandbox-Backend für den Standard-Agenten oder einen aktivierten Agenten `ssh` ist.
    - `gateway.remote.token` / `gateway.remote.password`-SecretRefs sind aktiv, wenn eine der folgenden Bedingungen zutrifft:
      - `gateway.mode=remote`
      - `gateway.remote.url` ist konfiguriert
      - `gateway.tailscale.mode` ist `serve` oder `funnel`
      - Im lokalen Modus ohne diese Remote-Oberflächen:
        - `gateway.remote.token` ist aktiv, wenn Token-Auth gewinnen kann und kein Env-/Auth-Token konfiguriert ist.
        - `gateway.remote.password` ist nur aktiv, wenn Passwort-Auth gewinnen kann und kein Env-/Auth-Passwort konfiguriert ist.
    - Die `gateway.auth.token`-SecretRef ist für die Start-Auth-Auflösung inaktiv, wenn `OPENCLAW_GATEWAY_TOKEN` gesetzt ist, weil die Env-Token-Eingabe für diese Laufzeit gewinnt.

  </Accordion>
</AccordionGroup>

## Gateway-Auth-Oberflächendiagnosen

Wenn eine SecretRef für `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` oder `gateway.remote.password` konfiguriert ist, protokolliert Gateway-Start/Reload den Oberflächenstatus explizit:

- `active`: Die SecretRef ist Teil der effektiven Auth-Oberfläche und muss aufgelöst werden.
- `inactive`: Die SecretRef wird für diese Laufzeit ignoriert, weil eine andere Auth-Oberfläche gewinnt oder weil Remote-Auth deaktiviert/nicht aktiv ist.

Diese Einträge werden mit `SECRETS_GATEWAY_AUTH_SURFACE` protokolliert und enthalten den Grund, den die Richtlinie für aktive Oberflächen verwendet, sodass Sie sehen können, warum ein Anmeldedatum als aktiv oder inaktiv behandelt wurde.

## Onboarding-Referenz-Preflight

Wenn Onboarding im interaktiven Modus läuft und Sie SecretRef-Speicherung wählen, führt OpenClaw vor dem Speichern eine Preflight-Validierung aus:

- Env-Refs: validiert den Env-Variablennamen und bestätigt, dass während der Einrichtung ein nicht leerer Wert sichtbar ist.
- Provider-Refs (`file` oder `exec`): validiert die Provider-Auswahl, löst `id` auf und prüft den Typ des aufgelösten Werts.
- Quickstart-Wiederverwendungspfad: Wenn `gateway.auth.token` bereits eine SecretRef ist, löst Onboarding sie vor Probe-/Dashboard-Bootstrap auf (für `env`-, `file`- und `exec`-Refs) und verwendet dabei dasselbe Fail-Fast-Gate.

Wenn die Validierung fehlschlägt, zeigt Onboarding den Fehler an und lässt Sie erneut versuchen.

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
    - `id` muss ein absoluter JSON-Pointer (`/...`) sein
    - RFC6901-Escaping in Segmenten: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    Validierung:

    - `provider` muss `^[a-z][a-z0-9_-]{0,63}$` entsprechen
    - `id` muss `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$` entsprechen
    - `id` darf `.` oder `..` nicht als durch Schrägstriche begrenzte Pfadsegmente enthalten (zum Beispiel wird `a/../b` abgelehnt)

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
  <Accordion title="File-Provider">
    - Liest lokale Datei aus `path`.
    - `mode: "json"` erwartet eine JSON-Objekt-Payload und löst `id` als Pointer auf.
    - `mode: "singleValue"` erwartet die Ref-ID `"value"` und gibt den Dateiinhalt zurück.
    - Der Pfad muss Besitz-/Berechtigungsprüfungen bestehen.
    - Windows-Fail-Closed-Hinweis: Wenn die ACL-Verifizierung für einen Pfad nicht verfügbar ist, schlägt die Auflösung fehl. Nur für vertrauenswürdige Pfade können Sie `allowInsecurePath: true` für diesen Provider setzen, um Pfadsicherheitsprüfungen zu umgehen.

  </Accordion>
  <Accordion title="Exec-Provider">
    - Führt den konfigurierten absoluten Binärpfad aus, ohne Shell.
    - Standardmäßig muss `command` auf eine reguläre Datei zeigen (kein Symlink).
    - Setzen Sie `allowSymlinkCommand: true`, um Symlink-Befehlspfade zuzulassen (zum Beispiel Homebrew-Shims). OpenClaw validiert den aufgelösten Zielpfad.
    - Kombinieren Sie `allowSymlinkCommand` mit `trustedDirs` für Paketmanager-Pfade (zum Beispiel `["/opt/homebrew"]`).
    - Unterstützt Timeout, Timeout bei fehlender Ausgabe, Ausgabe-Byte-Limits, Env-Allowlist und vertrauenswürdige Verzeichnisse.
    - Windows-Fail-Closed-Hinweis: Wenn die ACL-Verifizierung für den Befehlspfad nicht verfügbar ist, schlägt die Auflösung fehl. Nur für vertrauenswürdige Pfade können Sie `allowInsecurePath: true` für diesen Provider setzen, um Pfadsicherheitsprüfungen zu umgehen.

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

MCP-Server-Env-Variablen, die über `plugins.entries.acpx.config.mcpServers` konfiguriert werden, unterstützen SecretInput. Dadurch bleiben API-Schlüssel und Tokens aus der Klartextkonfiguration heraus:

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

Klartext-Stringwerte funktionieren weiterhin. Env-Template-Refs wie `${MCP_SERVER_API_KEY}` und SecretRef-Objekte werden während der Gateway-Aktivierung aufgelöst, bevor der MCP-Server-Prozess gestartet wird. Wie bei anderen SecretRef-Oberflächen blockieren nicht aufgelöste Refs die Aktivierung nur, wenn das `acpx`-Plugin effektiv aktiv ist.

## Sandbox-SSH-Auth-Material

Das Core-`ssh`-Sandbox-Backend unterstützt ebenfalls SecretRefs für SSH-Auth-Material:

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
- Aufgelöste Werte werden mit restriktiven Berechtigungen in temporäre Dateien geschrieben und in der generierten SSH-Konfiguration verwendet.
- Wenn das effektive Sandbox-Backend nicht `ssh` ist, bleiben diese Refs inaktiv und blockieren den Start nicht.

## Unterstützte Anmeldeinformations-Oberfläche

Kanonisch unterstützte und nicht unterstützte Anmeldeinformationen sind aufgeführt in:

- [SecretRef-Anmeldeinformations-Oberfläche](/de/reference/secretref-credential-surface)

<Note>
Zur Laufzeit erzeugte oder rotierende Anmeldeinformationen und OAuth-Aktualisierungsmaterial sind absichtlich von der schreibgeschützten SecretRef-Auflösung ausgeschlossen.
</Note>

## Erforderliches Verhalten und Vorrang

- Feld ohne Ref: unverändert.
- Feld mit Ref: auf aktiven Oberflächen während der Aktivierung erforderlich.
- Wenn sowohl Klartext als auch Ref vorhanden sind, hat Ref auf unterstützten Vorrangspfaden Vorrang.
- Der Schwärzungs-Sentinel `__OPENCLAW_REDACTED__` ist für interne Konfigurationsschwärzung/-wiederherstellung reserviert und wird als wörtlich übermittelte Konfigurationsdaten abgelehnt.

Warn- und Audit-Signale:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (Laufzeitwarnung)
- `REF_SHADOWED` (Audit-Befund, wenn Anmeldeinformationen aus `auth-profiles.json` Vorrang vor Refs aus `openclaw.json` haben)

Kompatibilitätsverhalten für Google Chat:

- `serviceAccountRef` hat Vorrang vor Klartext-`serviceAccount`.
- Der Klartextwert wird ignoriert, wenn eine benachbarte Ref gesetzt ist.

## Aktivierungsauslöser

Secret-Aktivierung läuft bei:

- Start (Preflight plus finale Aktivierung)
- Hot-Apply-Pfad zum Neuladen der Konfiguration
- Restart-Check-Pfad zum Neuladen der Konfiguration
- Manuellem Neuladen über `secrets.reload`
- Gateway-Konfigurationsschreib-RPC-Preflight (`config.set` / `config.apply` / `config.patch`) für die Auflösbarkeit von SecretRefs auf aktiven Oberflächen innerhalb der übermittelten Konfigurationsnutzlast vor dem Persistieren von Änderungen

Aktivierungsvertrag:

- Erfolg tauscht den Snapshot atomar aus.
- Ein Startfehler bricht den Gateway-Start ab.
- Ein Laufzeit-Neuladefehler behält den letzten als funktionierend bekannten Snapshot.
- Ein Write-RPC-Preflight-Fehler lehnt die übermittelte Konfiguration ab und lässt sowohl die Konfiguration auf der Festplatte als auch den aktiven Laufzeit-Snapshot unverändert.
- Das Bereitstellen eines expliziten kanalbezogenen Tokens pro Aufruf für einen ausgehenden Helper-/Tool-Aufruf löst keine SecretRef-Aktivierung aus; Aktivierungspunkte bleiben Start, Neuladen und explizites `secrets.reload`.

## Signale für eingeschränkten und wiederhergestellten Zustand

Wenn die Aktivierung beim Neuladen nach einem fehlerfreien Zustand fehlschlägt, wechselt OpenClaw in einen eingeschränkten Secrets-Zustand.

Einmalige Systemereignis- und Protokollcodes:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Verhalten:

- Eingeschränkt: Die Laufzeit behält den letzten als funktionierend bekannten Snapshot.
- Wiederhergestellt: Wird einmal nach der nächsten erfolgreichen Aktivierung ausgegeben.
- Wiederholte Fehler, während der Zustand bereits eingeschränkt ist, protokollieren Warnungen, erzeugen aber keine Ereignisflut.
- Start-Fail-Fast gibt keine Ereignisse für eingeschränkten Zustand aus, weil die Laufzeit nie aktiv wurde.

## Auflösung von Befehlspfaden

Befehlspfade können sich über Gateway-Snapshot-RPC für die unterstützte SecretRef-Auflösung anmelden.

Es gibt zwei allgemeine Verhaltensweisen:

<Tabs>
  <Tab title="Strict command paths">
    Zum Beispiel `openclaw memory`-Remote-Memory-Pfade und `openclaw qr --remote`, wenn Remote-Shared-Secret-Refs benötigt werden. Sie lesen aus dem aktiven Snapshot und schlagen schnell fehl, wenn eine erforderliche SecretRef nicht verfügbar ist.
  </Tab>
  <Tab title="Read-only command paths">
    Zum Beispiel `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` und schreibgeschützte Doctor-/Konfigurationsreparaturabläufe. Sie bevorzugen ebenfalls den aktiven Snapshot, degradieren aber statt abzubrechen, wenn eine gezielte SecretRef in diesem Befehlspfad nicht verfügbar ist.

    Schreibgeschütztes Verhalten:

    - Wenn der Gateway läuft, lesen diese Befehle zuerst aus dem aktiven Snapshot.
    - Wenn die Gateway-Auflösung unvollständig ist oder der Gateway nicht verfügbar ist, versuchen sie einen gezielten lokalen Fallback für die spezifische Befehlsoberfläche.
    - Wenn eine gezielte SecretRef weiterhin nicht verfügbar ist, wird der Befehl mit eingeschränkter schreibgeschützter Ausgabe und expliziten Diagnosen wie „konfiguriert, aber in diesem Befehlspfad nicht verfügbar“ fortgesetzt.
    - Dieses eingeschränkte Verhalten ist nur befehlslokal. Es schwächt Laufzeitstart, Neuladen oder Sende-/Authentifizierungspfade nicht ab.

  </Tab>
</Tabs>

Weitere Hinweise:

- Die Snapshot-Aktualisierung nach Secret-Rotation im Backend wird von `openclaw secrets reload` behandelt.
- Von diesen Befehlspfaden verwendete Gateway-RPC-Methode: `secrets.resolve`.

## Audit- und Konfigurationsworkflow

Standardablauf für Betreiber:

<Steps>
  <Step title="Audit current state">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Configure SecretRefs">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="Re-audit">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    Befunde umfassen:

    - Klartextwerte im Ruhezustand (`openclaw.json`, `auth-profiles.json`, `.env` und generierte `agents/*/agent/models.json`)
    - Klartextreste sensibler Provider-Header in generierten `models.json`-Einträgen
    - nicht aufgelöste Refs
    - Vorrangsschatten (`auth-profiles.json` hat Priorität vor Refs aus `openclaw.json`)
    - Legacy-Reste (`auth.json`, OAuth-Erinnerungen)

    Exec-Hinweis:

    - Standardmäßig überspringt das Audit Auflösbarkeitsprüfungen für Exec-SecretRefs, um Befehlsnebeneffekte zu vermeiden.
    - Verwenden Sie `openclaw secrets audit --allow-exec`, um Exec-Provider während des Audits auszuführen.

    Hinweis zu Header-Resten:

    - Die Erkennung sensibler Provider-Header basiert auf Namensheuristiken (gängige Namen und Fragmente von Authentifizierungs-/Anmeldeinformations-Headern wie `authorization`, `x-api-key`, `token`, `secret`, `password` und `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Interaktiver Helper, der:

    - zuerst `secrets.providers` konfiguriert (`env`/`file`/`exec`, hinzufügen/bearbeiten/entfernen)
    - Sie unterstützte Secret-tragende Felder in `openclaw.json` plus `auth-profiles.json` für einen Agent-Scope auswählen lässt
    - direkt in der Zielauswahl ein neues `auth-profiles.json`-Mapping erstellen kann
    - SecretRef-Details erfasst (`source`, `provider`, `id`)
    - Preflight-Auflösung ausführt
    - sofort anwenden kann

    Exec-Hinweis:

    - Preflight überspringt Exec-SecretRef-Prüfungen, sofern `--allow-exec` nicht gesetzt ist.
    - Wenn Sie direkt aus `configure --apply` anwenden und der Plan Exec-Refs/-Provider enthält, lassen Sie `--allow-exec` auch für den Apply-Schritt gesetzt.

    Hilfreiche Modi:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure`-Apply-Standardeinstellungen:

    - passende statische Anmeldeinformationen aus `auth-profiles.json` für gezielte Provider bereinigen
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

    - Dry-run überspringt Exec-Prüfungen, sofern `--allow-exec` nicht gesetzt ist.
    - Schreibmodus lehnt Pläne mit Exec-SecretRefs/-Providern ab, sofern `--allow-exec` nicht gesetzt ist.

    Details zum strikten Ziel-/Pfadvertrag und exakte Ablehnungsregeln finden Sie unter [Secrets-Apply-Planvertrag](/de/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Einweg-Sicherheitsrichtlinie

<Warning>
OpenClaw schreibt absichtlich keine Rollback-Sicherungen, die historische Secret-Klartextwerte enthalten.
</Warning>

Sicherheitsmodell:

- Preflight muss vor dem Schreibmodus erfolgreich sein
- Laufzeitaktivierung wird vor dem Commit validiert
- Apply aktualisiert Dateien mit atomarem Dateiaustausch und Best-Effort-Wiederherstellung bei Fehlern

## Legacy-Auth-Kompatibilitätshinweise

Für statische Anmeldeinformationen hängt die Laufzeit nicht mehr von Legacy-Auth-Speicherung im Klartext ab.

- Quelle für Laufzeit-Anmeldeinformationen ist der aufgelöste In-Memory-Snapshot.
- Statische Legacy-`api_key`-Einträge werden bereinigt, wenn sie entdeckt werden.
- OAuth-bezogenes Kompatibilitätsverhalten bleibt getrennt.

## Hinweis zur Web-UI

Einige SecretInput-Unions lassen sich im Roh-Editor-Modus einfacher konfigurieren als im Formularmodus.

## Verwandte Themen

- [Authentifizierung](/de/gateway/authentication) — Auth-Einrichtung
- [CLI: Secrets](/de/cli/secrets) — CLI-Befehle
- [Umgebungsvariablen](/de/help/environment) — Umgebungsvorrang
- [SecretRef-Anmeldeinformations-Oberfläche](/de/reference/secretref-credential-surface) — Anmeldeinformations-Oberfläche
- [Secrets-Apply-Planvertrag](/de/gateway/secrets-plan-contract) — Planvertragsdetails
- [Sicherheit](/de/gateway/security) — Sicherheitslage
