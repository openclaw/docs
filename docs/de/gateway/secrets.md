---
read_when:
    - SecretRefs für Provider-Anmeldedaten und `auth-profiles.json`-Referenzen konfigurieren
    - Secrets sicher in Produktion neu laden, prüfen, konfigurieren und anwenden
    - Start-Fail-Fast, Filterung inaktiver Oberflächen und Last-Known-Good-Verhalten verstehen
sidebarTitle: Secrets management
summary: 'Secrets Management: SecretRef-Vertrag, Laufzeit-Snapshot-Verhalten und sicheres Einweg-Scrubbing'
title: Secrets Management
x-i18n:
    generated_at: "2026-04-26T11:30:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8697a8eb15cf6ef9b105e3f12cfdad6205284d4c45f1314cd7aec2e2c81fed1
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw unterstützt additive SecretRefs, sodass unterstützte Anmeldedaten nicht als Klartext in der Konfiguration gespeichert werden müssen.

<Note>
Klartext funktioniert weiterhin. SecretRefs sind pro Anmeldedatum opt-in.
</Note>

## Ziele und Laufzeitmodell

Secrets werden in einen In-Memory-Laufzeit-Snapshot aufgelöst.

- Die Auflösung erfolgt während der Aktivierung eager, nicht lazy auf Request-Pfaden.
- Der Start schlägt fail-fast fehl, wenn ein effektiv aktiver SecretRef nicht aufgelöst werden kann.
- Reload verwendet atomaren Austausch: vollständiger Erfolg oder Beibehaltung des Last-Known-Good-Snapshots.
- SecretRef-Richtlinienverletzungen (zum Beispiel Auth-Profile im OAuth-Modus kombiniert mit SecretRef-Eingabe) lassen die Aktivierung vor dem Laufzeit-Austausch fehlschlagen.
- Laufzeit-Requests lesen nur aus dem aktiven In-Memory-Snapshot.
- Nach der ersten erfolgreichen Konfigurationsaktivierung/-ladung lesen Laufzeit-Codepfade weiter aus diesem aktiven In-Memory-Snapshot, bis ein erfolgreicher Reload ihn austauscht.
- Auch ausgehende Zustellpfade lesen aus diesem aktiven Snapshot (zum Beispiel Discord-Antwort-/Thread-Zustellung und Telegram-Aktions-Sendungen); sie lösen SecretRefs nicht bei jedem Senden erneut auf.

Dadurch bleiben Ausfälle von Secret-Providern von heißen Request-Pfaden fern.

## Filterung aktiver Oberflächen

SecretRefs werden nur auf effektiv aktiven Oberflächen validiert.

- Aktivierte Oberflächen: nicht aufgelöste Referenzen blockieren Start/Reload.
- Inaktive Oberflächen: nicht aufgelöste Referenzen blockieren Start/Reload nicht.
- Inaktive Referenzen erzeugen nicht fatale Diagnosen mit dem Code `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Beispiele für inaktive Oberflächen">
    - Deaktivierte Channel-/Konto-Einträge.
    - Anmeldedaten auf Channel-Ebene, die kein aktiviertes Konto erbt.
    - Deaktivierte Tool-/Feature-Oberflächen.
    - Websuche-provider-spezifische Schlüssel, die nicht durch `tools.web.search.provider` ausgewählt werden. Im Auto-Modus (Provider nicht gesetzt) werden Schlüssel bis zur automatischen Provider-Erkennung in Prioritätsreihenfolge geprüft, bis einer aufgelöst wird. Nach der Auswahl werden nicht ausgewählte Provider-Schlüssel als inaktiv behandelt, bis sie ausgewählt werden.
    - SSH-Authentifizierungsmaterial für Sandboxing (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData` sowie Überschreibungen pro Agent) ist nur aktiv, wenn das effektive Sandbox-Backend für den Standard-Agenten oder einen aktivierten Agenten `ssh` ist.
    - SecretRefs für `gateway.remote.token` / `gateway.remote.password` sind aktiv, wenn eine dieser Bedingungen zutrifft:
      - `gateway.mode=remote`
      - `gateway.remote.url` ist konfiguriert
      - `gateway.tailscale.mode` ist `serve` oder `funnel`
      - Im lokalen Modus ohne diese Remote-Oberflächen:
        - `gateway.remote.token` ist aktiv, wenn Token-Authentifizierung gewinnen kann und kein env-/auth-Token konfiguriert ist.
        - `gateway.remote.password` ist nur aktiv, wenn Passwort-Authentifizierung gewinnen kann und kein env-/auth-Passwort konfiguriert ist.
    - SecretRef für `gateway.auth.token` ist für die Auth-Auflösung beim Start inaktiv, wenn `OPENCLAW_GATEWAY_TOKEN` gesetzt ist, weil die env-Token-Eingabe für diese Laufzeit gewinnt.
  </Accordion>
</AccordionGroup>

## Diagnosen der Gateway-Authentifizierungsoberfläche

Wenn ein SecretRef auf `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` oder `gateway.remote.password` konfiguriert ist, protokolliert der Gateway-Start/Reload den Status der Oberfläche explizit:

- `active`: Der SecretRef ist Teil der effektiven Authentifizierungsoberfläche und muss aufgelöst werden.
- `inactive`: Der SecretRef wird für diese Laufzeit ignoriert, weil eine andere Authentifizierungsoberfläche gewinnt oder weil Remote-Authentifizierung deaktiviert/nicht aktiv ist.

Diese Einträge werden mit `SECRETS_GATEWAY_AUTH_SURFACE` protokolliert und enthalten den von der Active-Surface-Richtlinie verwendeten Grund, sodass Sie sehen können, warum ein Anmeldedatum als aktiv oder inaktiv behandelt wurde.

## Preflight für Onboarding-Referenzen

Wenn das Onboarding im interaktiven Modus läuft und Sie SecretRef-Speicherung wählen, führt OpenClaw vor dem Speichern eine Preflight-Validierung aus:

- Env-Referenzen: validiert den Namen der Umgebungsvariable und bestätigt, dass während der Einrichtung ein nicht leerer Wert sichtbar ist.
- Provider-Referenzen (`file` oder `exec`): validiert die Providerauswahl, löst `id` auf und prüft den aufgelösten Werttyp.
- Quickstart-Wiederverwendungspfad: Wenn `gateway.auth.token` bereits ein SecretRef ist, löst das Onboarding ihn vor Probe-/Dashboard-Bootstrap auf (für `env`-, `file`- und `exec`-Referenzen) und verwendet dabei dieselbe fail-fast-Prüfung.

Wenn die Validierung fehlschlägt, zeigt das Onboarding den Fehler an und lässt Sie es erneut versuchen.

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
    - `id` muss ein absoluter JSON-Pointer sein (`/...`)
    - RFC6901-Escaping in Segmenten: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    Validierung:

    - `provider` muss `^[a-z][a-z0-9_-]{0,63}$` entsprechen
    - `id` muss `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$` entsprechen
    - `id` darf `.` oder `..` nicht als durch Slashes getrennte Pfadsegmente enthalten (zum Beispiel wird `a/../b` abgelehnt)

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
        mode: "json", // oder "singleValue"
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
    - Fehlende/leere env-Werte lassen die Auflösung fehlschlagen.
  </Accordion>
  <Accordion title="File-Provider">
    - Liest eine lokale Datei aus `path`.
    - `mode: "json"` erwartet eine JSON-Objekt-Payload und löst `id` als Pointer auf.
    - `mode: "singleValue"` erwartet die Ref-ID `"value"` und gibt den Dateiinhalt zurück.
    - Der Pfad muss Eigentums-/Berechtigungsprüfungen bestehen.
    - Hinweis zu fail-closed unter Windows: Wenn die ACL-Verifizierung für einen Pfad nicht verfügbar ist, schlägt die Auflösung fehl. Nur für vertrauenswürdige Pfade können Sie `allowInsecurePath: true` auf diesem Provider setzen, um die Pfadsicherheitsprüfungen zu umgehen.
  </Accordion>
  <Accordion title="Exec-Provider">
    - Führt den konfigurierten absoluten Binary-Pfad aus, ohne Shell.
    - Standardmäßig muss `command` auf eine reguläre Datei zeigen (kein Symlink).
    - Setzen Sie `allowSymlinkCommand: true`, um Symlink-Befehlspfade zu erlauben (zum Beispiel Homebrew-Shims). OpenClaw validiert den aufgelösten Zielpfad.
    - Kombinieren Sie `allowSymlinkCommand` mit `trustedDirs` für Paketmanager-Pfade (zum Beispiel `["/opt/homebrew"]`).
    - Unterstützt Timeout, Timeout ohne Ausgabe, Limits für Ausgabe-Bytes, Env-Allowlist und vertrauenswürdige Verzeichnisse.
    - Hinweis zu fail-closed unter Windows: Wenn die ACL-Verifizierung für den Befehlspfad nicht verfügbar ist, schlägt die Auflösung fehl. Nur für vertrauenswürdige Pfade können Sie `allowInsecurePath: true` auf diesem Provider setzen, um die Pfadsicherheitsprüfungen zu umgehen.

    Request-Payload (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Response-Payload (stdout):

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

## Beispiele für Exec-Integration

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // erforderlich für von Homebrew verlinkte Binärdateien
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
            allowSymlinkCommand: true, // erforderlich für von Homebrew verlinkte Binärdateien
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
            allowSymlinkCommand: true, // erforderlich für von Homebrew verlinkte Binärdateien
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

MCP-Server-Umgebungsvariablen, die über `plugins.entries.acpx.config.mcpServers` konfiguriert werden, unterstützen SecretInput. Dadurch bleiben API-Schlüssel und Tokens aus der Klartext-Konfiguration heraus:

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

Klartext-String-Werte funktionieren weiterhin. Env-Template-Referenzen wie `${MCP_SERVER_API_KEY}` und SecretRef-Objekte werden während der Gateway-Aktivierung aufgelöst, bevor der MCP-Server-Prozess gestartet wird. Wie bei anderen SecretRef-Oberflächen blockieren nicht aufgelöste Referenzen die Aktivierung nur dann, wenn das Plugin `acpx` effektiv aktiv ist.

## SSH-Authentifizierungsmaterial für Sandboxing

Das Core-`ssh`-Sandbox-Backend unterstützt ebenfalls SecretRefs für SSH-Authentifizierungsmaterial:

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

- OpenClaw löst diese Referenzen während der Sandbox-Aktivierung auf, nicht lazy bei jedem einzelnen SSH-Aufruf.
- Aufgelöste Werte werden mit restriktiven Berechtigungen in temporäre Dateien geschrieben und in der generierten SSH-Konfiguration verwendet.
- Wenn das effektive Sandbox-Backend nicht `ssh` ist, bleiben diese Referenzen inaktiv und blockieren den Start nicht.

## Unterstützte Anmeldedaten-Oberfläche

Kanonische unterstützte und nicht unterstützte Anmeldedaten sind hier aufgeführt:

- [SecretRef Credential Surface](/de/reference/secretref-credential-surface)

<Note>
Zur Laufzeit erzeugte oder rotierende Anmeldedaten und OAuth-Refresh-Material sind absichtlich von der schreibgeschützten SecretRef-Auflösung ausgeschlossen.
</Note>

## Erforderliches Verhalten und Priorität

- Feld ohne Referenz: unverändert.
- Feld mit Referenz: auf aktiven Oberflächen während der Aktivierung erforderlich.
- Wenn sowohl Klartext als auch Referenz vorhanden sind, hat die Referenz auf unterstützten Prioritätspfaden Vorrang.
- Das Redaktions-Sentinel `__OPENCLAW_REDACTED__` ist für interne Konfigurations-Redaktion/-Wiederherstellung reserviert und wird als wörtlich übermittelte Konfigurationsdaten abgelehnt.

Warn- und Audit-Signale:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (Laufzeitwarnung)
- `REF_SHADOWED` (Audit-Befund, wenn Anmeldedaten aus `auth-profiles.json` Vorrang vor Referenzen aus `openclaw.json` haben)

Verhalten zur Google-Chat-Kompatibilität:

- `serviceAccountRef` hat Vorrang vor Klartext-`serviceAccount`.
- Der Klartextwert wird ignoriert, wenn die benachbarte Referenz gesetzt ist.

## Aktivierungs-Trigger

Die Secret-Aktivierung läuft bei:

- Start (Preflight plus finale Aktivierung)
- Hot-Apply-Pfad beim Konfigurations-Reload
- Restart-Check-Pfad beim Konfigurations-Reload
- Manuellem Reload über `secrets.reload`
- Preflight für Gateway-Konfigurations-Schreib-RPC (`config.set` / `config.apply` / `config.patch`) für die Auflösbarkeit von SecretRefs auf aktiven Oberflächen innerhalb der übermittelten Konfigurations-Payload vor dem Persistieren der Änderungen

Aktivierungsvertrag:

- Erfolg tauscht den Snapshot atomar aus.
- Startfehler bricht den Start des Gateway ab.
- Laufzeit-Reload-Fehler behält den Last-Known-Good-Snapshot.
- Ein Preflight-Fehler bei Schreib-RPC lehnt die übermittelte Konfiguration ab und lässt sowohl die Konfiguration auf dem Datenträger als auch den aktiven Laufzeit-Snapshot unverändert.
- Das Bereitstellen eines expliziten channelbezogenen Tokens pro Aufruf an einen ausgehenden Helper-/Tool-Aufruf löst keine SecretRef-Aktivierung aus; Aktivierungspunkte bleiben Start, Reload und explizites `secrets.reload`.

## Beeinträchtigte und wiederhergestellte Signale

Wenn die Aktivierung zur Reload-Zeit nach einem gesunden Zustand fehlschlägt, wechselt OpenClaw in einen beeinträchtigten Secrets-Zustand.

Einmalige Systemereignis- und Log-Codes:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Verhalten:

- Beeinträchtigt: Die Laufzeit behält den Last-Known-Good-Snapshot.
- Wiederhergestellt: wird einmal nach der nächsten erfolgreichen Aktivierung ausgegeben.
- Wiederholte Fehler im bereits beeinträchtigten Zustand protokollieren Warnungen, spammen aber keine Ereignisse.
- Start-Fail-Fast gibt keine beeinträchtigten Ereignisse aus, weil die Laufzeit nie aktiv wurde.

## Auflösung in Befehlspfaden

Befehlspfade können sich über Gateway-Snapshot-RPC für unterstützte SecretRef-Auflösung entscheiden.

Es gibt zwei grobe Verhaltensweisen:

<Tabs>
  <Tab title="Strikte Befehlspfade">
    Zum Beispiel `openclaw memory`-Remote-Memory-Pfade und `openclaw qr --remote`, wenn gemeinsame Remote-Secrets-Referenzen benötigt werden. Sie lesen aus dem aktiven Snapshot und schlagen fail-fast fehl, wenn ein erforderlicher SecretRef nicht verfügbar ist.
  </Tab>
  <Tab title="Schreibgeschützte Befehlspfade">
    Zum Beispiel `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` und schreibgeschützte Doctor-/Konfigurations-Reparaturabläufe. Sie bevorzugen ebenfalls den aktiven Snapshot, degradieren aber statt abzubrechen, wenn ein zielgerichteter SecretRef in diesem Befehlspfad nicht verfügbar ist.

    Schreibgeschütztes Verhalten:

    - Wenn das Gateway läuft, lesen diese Befehle zuerst aus dem aktiven Snapshot.
    - Wenn die Gateway-Auflösung unvollständig ist oder das Gateway nicht verfügbar ist, versuchen sie einen gezielten lokalen Fallback für die jeweilige Befehlsoberfläche.
    - Wenn ein zielgerichteter SecretRef weiterhin nicht verfügbar ist, läuft der Befehl mit beeinträchtigter schreibgeschützter Ausgabe und expliziten Diagnosen wie „konfiguriert, aber in diesem Befehlspfad nicht verfügbar“ weiter.
    - Dieses beeinträchtigte Verhalten gilt nur lokal für den Befehl. Es schwächt nicht den Laufzeit-Start, Reload oder Sende-/Authentifizierungspfade.

  </Tab>
</Tabs>

Weitere Hinweise:

- Die Snapshot-Aktualisierung nach Rotation von Backend-Secrets wird durch `openclaw secrets reload` behandelt.
- Von diesen Befehlspfaden verwendete Gateway-RPC-Methode: `secrets.resolve`.

## Workflow für Audit und Konfiguration

Standardablauf für Operatoren:

<Steps>
  <Step title="Aktuellen Zustand prüfen">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="SecretRefs konfigurieren">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="Erneut prüfen">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    Befunde umfassen:

    - Klartextwerte at rest (`openclaw.json`, `auth-profiles.json`, `.env` und generierte `agents/*/agent/models.json`)
    - Klartext-Reste sensibler Provider-Header in generierten `models.json`-Einträgen
    - nicht aufgelöste Referenzen
    - Prioritäts-Schatteneffekte (`auth-profiles.json` hat Vorrang vor Referenzen aus `openclaw.json`)
    - Legacy-Reste (`auth.json`, OAuth-Erinnerungen)

    Hinweis zu Exec:

    - Standardmäßig überspringt Audit Auflösbarkeitsprüfungen für Exec-SecretRefs, um Seiteneffekte von Befehlen zu vermeiden.
    - Verwenden Sie `openclaw secrets audit --allow-exec`, um Exec-Provider während des Audits auszuführen.

    Hinweis zu Header-Resten:

    - Die Erkennung sensibler Provider-Header basiert heuristisch auf Namen (häufige Header-Namen und -Fragmente für Authentifizierung/Anmeldedaten wie `authorization`, `x-api-key`, `token`, `secret`, `password` und `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Interaktiver Helfer, der:

    - zuerst `secrets.providers` konfiguriert (`env`/`file`/`exec`, hinzufügen/bearbeiten/entfernen)
    - Sie unterstützte Felder mit Secrets in `openclaw.json` plus `auth-profiles.json` für einen Agent-Scope auswählen lässt
    - direkt im Zielauswähler ein neues `auth-profiles.json`-Mapping erstellen kann
    - SecretRef-Details erfasst (`source`, `provider`, `id`)
    - eine Preflight-Auflösung ausführt
    - sofort anwenden kann

    Hinweis zu Exec:

    - Preflight überspringt Exec-SecretRef-Prüfungen, sofern `--allow-exec` nicht gesetzt ist.
    - Wenn Sie direkt aus `configure --apply` anwenden und der Plan Exec-Referenzen/-Provider enthält, lassen Sie `--allow-exec` auch für den Apply-Schritt gesetzt.

    Hilfreiche Modi:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Standardverhalten bei `configure`-Apply:

    - passende statische Anmeldedaten aus `auth-profiles.json` für die betroffenen Provider scrubben
    - statische Legacy-`api_key`-Einträge aus `auth.json` scrubben
    - passende bekannte Secret-Zeilen aus `<config-dir>/.env` scrubben

  </Accordion>
  <Accordion title="secrets apply">
    Einen gespeicherten Plan anwenden:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Hinweis zu Exec:

    - Dry-Run überspringt Exec-Prüfungen, sofern `--allow-exec` nicht gesetzt ist.
    - Der Schreibmodus lehnt Pläne ab, die Exec-SecretRefs/-Provider enthalten, sofern `--allow-exec` nicht gesetzt ist.

    Für Details zum strikten Ziel-/Pfadvertrag und den genauen Ablehnungsregeln siehe [Secrets Apply Plan Contract](/de/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Einweg-Sicherheitsrichtlinie

<Warning>
OpenClaw schreibt absichtlich keine Rollback-Backups, die historische Klartext-Secret-Werte enthalten.
</Warning>

Sicherheitsmodell:

- Preflight muss vor dem Schreibmodus erfolgreich sein
- Laufzeit-Aktivierung wird vor dem Commit validiert
- Apply aktualisiert Dateien mit atomarem Dateiersatz und Best-Effort-Wiederherstellung bei Fehlern

## Hinweise zur Legacy-Authentifizierungskompatibilität

Bei statischen Anmeldedaten hängt die Laufzeit nicht mehr von Legacy-Klartext-Authentifizierungsspeicherung ab.

- Quelle für Laufzeit-Anmeldedaten ist der aufgelöste In-Memory-Snapshot.
- Statische Legacy-`api_key`-Einträge werden beim Auffinden gescrubbt.
- OAuth-bezogenes Kompatibilitätsverhalten bleibt getrennt.

## Hinweis zur Web-UI

Einige SecretInput-Unions lassen sich im Raw-Editor-Modus leichter konfigurieren als im Formularmodus.

## Verwandt

- [Authentication](/de/gateway/authentication) — Einrichtung der Authentifizierung
- [CLI: secrets](/de/cli/secrets) — CLI-Befehle
- [Environment Variables](/de/help/environment) — Priorität von Umgebungsvariablen
- [SecretRef Credential Surface](/de/reference/secretref-credential-surface) — Anmeldedaten-Oberfläche
- [Secrets Apply Plan Contract](/de/gateway/secrets-plan-contract) — Details zum Planvertrag
- [Security](/de/gateway/security) — Sicherheitslage
