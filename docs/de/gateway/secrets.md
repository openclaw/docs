---
read_when:
    - SecretRefs für Provider-Anmeldedaten und `auth-profiles.json`-Referenzen konfigurieren
    - Secrets in der Produktion sicher neu laden, prüfen, konfigurieren und anwenden
    - Grundlegendes zu Fail-Fast beim Start, der Filterung inaktiver Oberflächen und dem Verhalten mit dem letzten bekannten funktionierenden Zustand
sidebarTitle: Secrets management
summary: 'Secret-Verwaltung: SecretRef-Vertrag, Laufzeit-Snapshot-Verhalten und sicheres Einweg-Bereinigen'
title: Secret-Verwaltung
x-i18n:
    generated_at: "2026-07-16T13:06:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9fbcac081a7b9bd8bc298b9fb2b7437f3bea4dad85338eed7db4cb4db051cfc7
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw unterstützt additive SecretRefs, sodass unterstützte Anmeldedaten nicht als Klartext in der Konfiguration gespeichert werden müssen.

<Note>
Klartext funktioniert weiterhin. SecretRefs werden für jede Anmeldeinformation separat aktiviert.
</Note>

<Warning>
Klartext-Anmeldedaten bleiben für den Agenten lesbar, wenn sie sich in Dateien befinden, die der Agent einsehen kann, einschließlich `openclaw.json`, `auth-profiles.json`, `.env` oder generierter `agents/*/agent/models.json`-Dateien. SecretRefs verringern diesen lokalen Schadensradius erst, nachdem alle unterstützten Anmeldedaten migriert wurden und `openclaw secrets audit --check` keine Klartextreste meldet.
</Warning>

## Laufzeitmodell

- Secrets werden während der Aktivierung im Voraus in einen speicherinternen Laufzeit-Snapshot aufgelöst, nicht verzögert in Anfragepfaden.
- Der Start schlägt sofort fehl, wenn eine tatsächlich aktive SecretRef nicht aufgelöst werden kann.
- Das Neuladen ist ein atomarer Austausch: entweder vollständiger Erfolg oder Beibehaltung des letzten als funktionsfähig bekannten Snapshots.
- Richtlinienverstöße (beispielsweise ein Authentifizierungsprofil im OAuth-Modus in Kombination mit einer SecretRef-Eingabe) lassen die Aktivierung vor dem Austausch des Laufzeit-Snapshots fehlschlagen.
- Laufzeitanfragen lesen ausschließlich den aktiven speicherinternen Snapshot. SecretRef-Anmeldedaten für Modell-Provider durchlaufen den Authentifizierungsspeicher und die Stream-Optionen als prozesslokale Sentinelwerte bis zur Ausgabe. Pfade für ausgehende Zustellungen (Discord-Antwort-/Thread-Zustellung, Telegram-Aktionssendungen) lesen ebenfalls diesen Snapshot und lösen Referenzen nicht bei jedem Sendevorgang erneut auf.

Dadurch bleiben Ausfälle von Secret-Providern aus häufig genutzten Anfragepfaden heraus.

## Injektion zum Ausgabezeitpunkt (Sentinelwerte)

Für durch SecretRefs gestützte Anmeldedaten von Modell-Providern erzeugt OpenClaw während der Auflösung der Modellauthentifizierung einen undurchsichtigen, prozesslokalen Sentinelwert. Authentifizierungsspeicher, Stream-Optionen, SDK-Konfiguration, Protokolle, Fehlerobjekte und die meisten Laufzeitinspektionen sehen daher einen Wert wie `oc-sent-v1-...` und nicht die Anmeldeinformation des Providers. Der geschützte Modell-Fetch und die verwalteten Zustandsprüfungen lokaler Provider ersetzen bekannte Sentinelwerte in URL- und Headerwerten unmittelbar bevor die jeweilige Anfrage den Prozess verlässt.

Unbekannte Werte im Sentinelformat führen vor jeglicher Netzwerkaktivität zu einem sicheren Abbruch. OpenClaw weigert sich, die Anfrage zu senden, anstatt einen nicht aufgelösten Sentinelwert an einen Provider weiterzuleiten. Aufgelöste Secret-Werte werden außerdem zur exakten wertbasierten Protokollschwärzung registriert, um mehrschichtigen Schutz zu gewährleisten.

Provider-Adapter verwenden den spätestmöglichen Injektionspunkt, den ihr SDK unterstützt:

- SDKs mit einer benutzerdefinierten Fetch-Option erhalten den geschützten Fetch von OpenClaw, sodass das SDK den Sentinelwert beibehält.
- SDKs ohne benutzerdefinierte Fetch-Option lösen den Sentinelwert unmittelbar vor der Client-Erstellung auf. Plugin-eigene Provider-Streams und Agent-Harnesses lösen ihn bei der letzten kernseitig verwalteten Übergabe auf, da diese Transporte nicht den geschützten Fetch von OpenClaw verwenden.

Sentinelwerte verringern die Klartextexposition entlang der Modellaufrufkette, stellen jedoch keine Prozessisolierung dar. Der tatsächliche Wert ist weiterhin im Speicher desselben Prozesses vorhanden und erscheint an der finalen Adaptergrenze. Einfache Umgebungsanmeldedaten, die nicht über SecretRefs konfiguriert sind, bleiben Klartext und liegen außerhalb dieses Mechanismus.

Setzen Sie `OPENCLAW_SECRET_SENTINELS=off` (akzeptiert außerdem `0` oder `false`, ohne Beachtung der Groß-/Kleinschreibung), um die Erzeugung von Sentinelwerten während der Reaktion auf Sicherheitsvorfälle oder bei der Kompatibilitätsfehlerbehebung zu deaktivieren. Dieser Notausschalter deaktiviert nicht die Registrierung zur exakten wertbasierten Schwärzung.

## Agentenzugriffsgrenze

SecretRefs verhindern, dass Anmeldedaten in der Konfiguration und in generierten Modelldateien dauerhaft gespeichert werden, stellen jedoch keine Prozessisolierungsgrenze dar. Eine Klartext-Anmeldeinformation, die sich weiterhin in einem für den Agenten lesbaren Pfad auf dem Datenträger befindet, kann weiterhin über Datei- oder Shell-Tools gelesen werden und umgeht damit die Schwärzung auf API-Ebene.

Betrachten Sie bei Produktionsbereitstellungen, in denen für Agenten zugängliche Dateien relevant sind, die Migration erst als abgeschlossen, wenn alle folgenden Bedingungen erfüllt sind:

- Unterstützte Anmeldedaten verwenden SecretRefs anstelle von Klartextwerten.
- Veraltete Klartextreste wurden aus `openclaw.json`, `auth-profiles.json`, `.env` und generierten `models.json`-Dateien entfernt.
- `openclaw secrets audit --check` weist nach der Migration keine Rückstände auf.
- Alle verbleibenden nicht unterstützten oder rotierenden Anmeldedaten werden durch Betriebssystemisolierung, Containerisolierung oder einen externen Anmeldedaten-Proxy geschützt.

Deshalb ist der Workflow zum Prüfen, Konfigurieren und Anwenden ein Sicherheitsmigrations-Gate und nicht lediglich ein komfortables Hilfswerkzeug.

<Warning>
SecretRefs machen nicht beliebige lesbare Dateien sicher. Sicherungen, kopierte Konfigurationen, alte generierte Modellkataloge und nicht unterstützte Anmeldedatenklassen bleiben Produktions-Secrets, bis sie gelöscht, aus der Vertrauensgrenze des Agenten verschoben oder separat isoliert wurden.
</Warning>

## Filterung aktiver Oberflächen

SecretRefs werden nur auf tatsächlich aktiven Oberflächen validiert:

- **Aktivierte Oberflächen**: Nicht aufgelöste Referenzen blockieren den Start bzw. das Neuladen.
- **Inaktive Oberflächen**: Nicht aufgelöste Referenzen blockieren den Start bzw. das Neuladen nicht; sie erzeugen eine nicht schwerwiegende `SECRETS_REF_IGNORED_INACTIVE_SURFACE`-Diagnose.

<Accordion title="Beispiele für inaktive Oberflächen">
- Deaktivierte Kanal-/Kontoeinträge.
- Anmeldedaten auf oberster Kanalebene, die von keinem aktivierten Konto übernommen werden.
- Deaktivierte Werkzeug-/Funktionsoberflächen.
- Providerspezifische Schlüssel für die Websuche, die nicht durch `tools.web.search.provider` ausgewählt wurden. Im automatischen Modus (Provider nicht festgelegt) werden die Schlüssel entsprechend ihrer Priorität zur automatischen Erkennung herangezogen, bis einer aufgelöst werden kann; nach der Auswahl sind die Schlüssel nicht ausgewählter Provider inaktiv.
- SSH-Authentifizierungsmaterial für die Sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData` sowie agentenspezifische Überschreibungen) ist nur aktiv, wenn das tatsächlich verwendete Sandbox-Backend `ssh` ist und der Sandbox-Modus nicht `off` lautet, und zwar für den Standardagenten oder einen aktivierten Agenten.
- `gateway.remote.token`- / `gateway.remote.password`-SecretRefs sind aktiv, wenn eine der folgenden Bedingungen erfüllt ist:
  - `gateway.mode=remote`
  - `gateway.remote.url` ist konfiguriert
  - `gateway.tailscale.mode` ist `serve` oder `funnel`
  - Im lokalen Modus ohne diese Remote-Oberflächen ist `gateway.remote.token` aktiv, wenn sich die Token-Authentifizierung durchsetzen kann und kein Umgebungs-/Authentifizierungstoken konfiguriert ist; `gateway.remote.password` ist nur aktiv, wenn sich die Passwortauthentifizierung durchsetzen kann und kein Umgebungs-/Authentifizierungspasswort konfiguriert ist.
- Die `gateway.auth.token`-SecretRef ist für die Auflösung der Startauthentifizierung inaktiv, wenn `OPENCLAW_GATEWAY_TOKEN` gesetzt ist, da für diese Laufzeit die Token-Eingabe aus der Umgebung Vorrang hat.

</Accordion>

## Diagnose der Gateway-Authentifizierungsoberfläche

Wenn für `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` oder `gateway.remote.password` eine SecretRef festgelegt ist, protokolliert der Start bzw. das Neuladen des Gateway den Oberflächenstatus unter dem Code `SECRETS_GATEWAY_AUTH_SURFACE`:

- `active`: Die SecretRef ist Teil der tatsächlich verwendeten Authentifizierungsoberfläche und muss aufgelöst werden.
- `inactive`: Eine andere Authentifizierungsoberfläche hat Vorrang oder die Remote-Authentifizierung ist deaktiviert bzw. nicht aktiv.

Der Protokolleintrag enthält den Grund, den die Richtlinie für aktive Oberflächen verwendet hat.

## Vorabprüfung von Referenzen beim Onboarding

Wird beim interaktiven Onboarding die Speicherung als SecretRef ausgewählt, erfolgt vor dem Speichern eine Vorabvalidierung:

- Umgebungsreferenzen: Validiert den Namen der Umgebungsvariable und bestätigt, dass während der Einrichtung ein nicht leerer Wert sichtbar ist.
- Provider-Referenzen (`file` oder `exec`): Validiert die Provider-Auswahl, löst `id` auf und prüft den Typ des aufgelösten Werts.
- Schnellstart-Workflow: Wenn `gateway.auth.token` bereits eine SecretRef ist, löst das Onboarding sie vor dem Start der Prüfung/des Dashboards (für `env`-, `file`- und `exec`-Referenzen) über dasselbe Gate für sofortiges Fehlschlagen auf.

Bei einem Validierungsfehler wird der Fehler angezeigt und Sie können es erneut versuchen.

## SecretRef-Vertrag

Überall dieselbe Objektstruktur:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    In SecretInput-Feldern werden auch Kurzzeichenfolgen akzeptiert:

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
    - `id` muss ein absoluter JSON-Zeiger (`/...`) oder für `singleValue`-Provider das Literal `value` sein
    - RFC-6901-Escaping in Segmenten: Aus `~` wird `~0`, aus `/` wird `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Validierung:

    - `provider` muss `^[a-z][a-z0-9_-]{0,63}$` entsprechen
    - `id` muss `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` entsprechen (unterstützt Selektoren wie `secret#json_key`)
    - `id` darf `.` oder `..` nicht als durch Schrägstriche getrennte Pfadsegmente enthalten (beispielsweise wird `a/../b` abgelehnt)

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

<Accordion title="Umgebungs-Provider">
- Optionale Positivliste exakter Namen über `allowlist`.
- Fehlende oder leere Umgebungswerte lassen die Auflösung fehlschlagen.

</Accordion>

<Accordion title="Datei-Provider">
- Liest die lokale Datei unter `path`.
- `mode: "json"` (Standard) erwartet als Nutzlast ein JSON-Objekt und löst `id` als JSON-Zeiger auf.
- `mode: "singleValue"` erwartet die Referenz-ID `"value"` und gibt den unverarbeiteten Dateiinhalt zurück (abschließender Zeilenumbruch wird entfernt).
- Der Pfad muss die Eigentums- und Berechtigungsprüfungen bestehen; `timeoutMs` (Standard: 5000) und `maxBytes` (Standard: 1 MiB) begrenzen den Lesevorgang.
- Sicherer Abbruch unter Windows: Wenn die ACL-Prüfung für den Pfad nicht verfügbar ist, schlägt die Auflösung fehl. Legen Sie ausschließlich für vertrauenswürdige Pfade bei diesem Provider `allowInsecurePath: true` fest, um die Prüfung zu umgehen.

</Accordion>

<Accordion title="Exec-Provider">
- Führt den konfigurierten absoluten Binärpfad direkt und ohne Shell aus.
- Standardmäßig muss `command` eine reguläre Datei und darf kein Symlink sein. Legen Sie `allowSymlinkCommand: true` fest, um Symlink-Befehlspfade (beispielsweise Homebrew-Shims) zuzulassen, und kombinieren Sie dies mit `trustedDirs` (beispielsweise `["/opt/homebrew"]`), damit nur Paketmanagerpfade zulässig sind.
- Unterstützt `timeoutMs` (Standardwert 5000), `noOutputTimeoutMs` (Standardwert entspricht `timeoutMs`), `maxOutputBytes` (Standardwert 1 MiB), die Positivliste `env`/`passEnv` sowie `trustedDirs`.
- `jsonOnly` verwendet standardmäßig `true`. Bei `jsonOnly: false` und einer einzelnen angeforderten ID wird eine einfache, nicht als JSON formatierte Standardausgabe als Wert dieser ID akzeptiert.
- Windows schlägt im Zweifel geschlossen fehl: Wenn die ACL-Prüfung für den Befehlspfad nicht verfügbar ist, schlägt die Auflösung fehl. Legen Sie ausschließlich für vertrauenswürdige Pfade bei diesem Provider `allowInsecurePath: true` fest, um die Prüfung zu umgehen.
- Von Plugins verwaltete Exec-Provider können `pluginIntegration` anstelle eines kopierten `command`/`args` verwenden. OpenClaw löst die aktuellen Befehlsdetails beim Start oder Neuladen aus dem Manifest des installierten Plugins auf. Wenn das Plugin deaktiviert, entfernt oder nicht vertrauenswürdig ist oder die Integration nicht mehr deklariert, schlagen aktive SecretRefs dieses Providers geschlossen fehl.

Anfrage-Payload (Standardeingabe):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Antwort-Payload (Standardausgabe):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: Positivliste für Secret
```

Optionale Fehler pro ID:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` ist eine optionale maschinenlesbare Diagnose. OpenClaw zeigt die erkannten
Codes `NOT_FOUND` und `AMBIGUOUS_DUPLICATE_KEY` zusammen mit dem Provider und der Referenz-ID an. Andere
Codes und frei definierbare Felder wie `message` werden zur Kompatibilität mit Protokoll v1 akzeptiert,
aber nicht angezeigt, da die Resolver-Ausgabe Anmeldedaten enthalten kann.

</Accordion>

## Dateibasierte API-Schlüssel

Fügen Sie keine `file:...`-Zeichenfolgen in den `env`-Block der Konfiguration ein. Dieser Block ist literal und wird nicht überschrieben, sodass `file:...` dort niemals aufgelöst wird.

Verwenden Sie stattdessen eine Datei-SecretRef in einem unterstützten Anmeldedatenfeld:

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

Für `mode: "singleValue"` lautet die SecretRef `id` `"value"`. Verwenden Sie für `mode: "json"` einen absoluten JSON-Zeiger wie `"/providers/xai/apiKey"`.

Unter [Anmeldedatenoberfläche für SecretRef](/de/reference/secretref-credential-surface) finden Sie die Felder, die SecretRefs akzeptieren.

## Beispiele für Exec-Integrationen

Eine spezielle Anleitung zu 1Password, die Dienstkonten, den mitgelieferten Agent-Skill und die Fehlerbehebung behandelt, finden Sie unter [1Password](/gateway/1password).

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // für über Homebrew verknüpfte Binärdateien erforderlich
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
    Verwenden Sie einen Resolver-Wrapper, um SecretRef-IDs den Elementschlüsseln von Bitwarden Secrets Manager zuzuordnen. Das Repository enthält `scripts/secrets/openclaw-bws-resolver.mjs`; installieren oder kopieren Sie ihn auf dem Host, auf dem der Gateway ausgeführt wird, an einen absoluten vertrauenswürdigen Pfad.

    Anforderungen:

    - Bitwarden Secrets Manager CLI (`bws`) ist auf dem Gateway-Host installiert.
    - `BWS_ACCESS_TOKEN` ist für den Gateway-Dienst verfügbar.
    - `PATH` wird an den Resolver übergeben oder `BWS_BIN` ist auf den absoluten Pfad der Binärdatei `bws` gesetzt.
    - `BWS_SERVER_URL` ist bei Verwendung einer selbst gehosteten Bitwarden-Instanz in der Umgebung festgelegt.

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

    Der Resolver verarbeitet angeforderte IDs gebündelt, führt `bws secret list` aus und gibt Werte für übereinstimmende Secret-Felder `key` zurück. Verwenden Sie Schlüssel, die dem ID-Vertrag für Exec-SecretRefs entsprechen, beispielsweise `openclaw/providers/openai/apiKey`. Schlüssel im Stil von Umgebungsvariablen mit Unterstrichen werden abgelehnt, bevor der Resolver ausgeführt wird. Wenn mehrere sichtbare Bitwarden-Secrets denselben angeforderten Schlüssel verwenden, lässt der Resolver diese ID wegen Mehrdeutigkeit fehlschlagen, anstatt zu raten. Überprüfen Sie nach der Aktualisierung der Konfiguration den Resolver-Pfad:

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
            allowSymlinkCommand: true, // für über Homebrew verknüpfte Binärdateien erforderlich
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
    Verwenden Sie einen kleinen Resolver-Wrapper, um SecretRef-IDs direkt `pass`-Einträgen zuzuordnen. Speichern Sie diesen als ausführbare Datei unter einem absoluten Pfad, der die Pfadprüfungen Ihres Exec-Providers besteht, beispielsweise `/usr/local/bin/openclaw-pass-resolver`. Der `#!/usr/bin/env node`-Shebang löst `node` anhand von `PATH` des Resolver-Prozesses auf. Nehmen Sie daher `PATH` in `passEnv` auf. Wenn `pass` nicht in diesem `PATH` enthalten ist, legen Sie `PASS_BIN` in der übergeordneten Umgebung fest und nehmen Sie es ebenfalls in `passEnv` auf:

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
        process.stderr.write(`Anfrage konnte nicht geparst werden: ${err.message}\n`);
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
          errors[id] = { message: (result.stderr || `pass wurde mit Status ${result.status} beendet`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    Konfigurieren Sie anschließend den Exec-Provider und verweisen Sie mit `apiKey` auf den Pfad des `pass`-Eintrags:

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

    Belassen Sie das Secret in der ersten Zeile des `pass`-Eintrags oder passen Sie den Wrapper so an, dass stattdessen die vollständige `pass show`-Ausgabe zurückgegeben wird. Überprüfen Sie nach der Aktualisierung der Konfiguration sowohl das statische Audit als auch den Pfad des Exec-Resolvers:

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
            allowSymlinkCommand: true, // für über Homebrew verknüpfte Binärdateien erforderlich
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

## Umgebungsvariablen für MCP-Server

Über `plugins.entries.acpx.config.mcpServers` konfigurierte Umgebungsvariablen für MCP-Server akzeptieren SecretInput, wodurch API-Schlüssel und Token nicht im Klartext in der Konfiguration gespeichert werden:

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

Klartext-Zeichenfolgen funktionieren weiterhin. Referenzen auf Umgebungsvorlagen wie `${MCP_SERVER_API_KEY}` und SecretRef-Objekte werden während der Gateway-Aktivierung aufgelöst, bevor der MCP-Serverprozess gestartet wird. Wie bei anderen SecretRef-Oberflächen blockieren nicht aufgelöste Referenzen die Aktivierung nur, wenn das Plugin `acpx` tatsächlich aktiv ist.

## SSH-Authentifizierungsmaterial für die Sandbox

Das zentrale `ssh`-Sandbox-Backend unterstützt auch SecretRefs für SSH-Authentifizierungsmaterial:

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

- OpenClaw löst diese Referenzen bei der Sandbox-Aktivierung auf, nicht verzögert bei jedem SSH-Aufruf.
- Aufgelöste Werte werden mit restriktiven Dateiberechtigungen (`0o600`) in ein temporäres Verzeichnis geschrieben und in der generierten SSH-Konfiguration verwendet.
- Wenn das effektive Sandbox-Backend nicht `ssh` ist (oder der Sandbox-Modus `off` ist), bleiben diese Referenzen inaktiv und blockieren den Start nicht.

## Unterstützte Anmeldedatenoberfläche

Kanonisch unterstützte und nicht unterstützte Anmeldedaten sind unter [SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface) aufgeführt.

<Note>
Zur Laufzeit erzeugte oder rotierende Anmeldedaten sowie OAuth-Aktualisierungsmaterial sind bewusst von der schreibgeschützten SecretRef-Auflösung ausgeschlossen.
</Note>

## Erforderliches Verhalten und Vorrang

- Feld ohne Referenz: unverändert.
- Feld mit Referenz: während der Aktivierung auf aktiven Oberflächen erforderlich.
- Wenn sowohl Klartext als auch eine Referenz vorhanden sind, hat die Referenz auf unterstützten Vorrangpfaden Vorrang.
- Der Schwärzungs-Sentinel `__OPENCLAW_REDACTED__` ist für die interne Schwärzung/Wiederherstellung der Konfiguration reserviert und wird als literal übermittelter Konfigurationswert abgelehnt.

Warn- und Auditsignale:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (Laufzeitwarnung)
- `REF_SHADOWED` (Audit-Feststellung, wenn `auth-profiles.json`-Anmeldedaten Vorrang vor `openclaw.json`-Referenzen haben)

Google Chat-Kompatibilität: `serviceAccountRef` hat Vorrang vor dem Klartextwert `serviceAccount`; der Klartextwert wird ignoriert, sobald die zugehörige Referenz festgelegt ist.

## Aktivierungsauslöser

Die Secret-Aktivierung wird ausgeführt bei:

- Start (Vorabprüfung plus abschließende Aktivierung)
- Hot-Apply-Pfad beim Neuladen der Konfiguration
- Neustartprüfpfad beim Neuladen der Konfiguration
- Manuellem Neuladen über `secrets.reload`
- Vorabprüfung des Gateway-RPC zum Schreiben der Konfiguration (`config.set` / `config.apply` / `config.patch`), bei der die Auflösbarkeit von SecretRefs auf aktiven Oberflächen innerhalb der übermittelten Konfigurationsnutzlast geprüft wird, bevor Änderungen gespeichert werden

Aktivierungsvertrag:

- Bei Erfolg wird der Snapshot atomar ausgetauscht.
- Ein Fehler beim Start bricht den Start des Gateways ab.
- Bei einem Fehler während des Neuladens zur Laufzeit bleibt der letzte bekanntermaßen funktionsfähige Snapshot erhalten.
- Schlägt die Vorabprüfung des Schreib-RPC fehl, wird die übermittelte Konfiguration abgelehnt; sowohl die Konfiguration auf dem Datenträger als auch der aktive Laufzeit-Snapshot bleiben unverändert.
- Die Angabe eines expliziten kanalspezifischen Tokens pro Aufruf an einen ausgehenden Hilfs-/Tool-Aufruf löst keine SecretRef-Aktivierung aus; die Aktivierungspunkte bleiben Start, Neuladen und explizites `secrets.reload`.

## Signale für eingeschränkten und wiederhergestellten Zustand

Wenn die Aktivierung beim Neuladen nach einem fehlerfreien Zustand fehlschlägt, wechselt OpenClaw in einen eingeschränkten Secret-Zustand und gibt einmalige Systemereignisse und Protokollcodes aus:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Verhalten:

- Eingeschränkt: Die Laufzeit behält den letzten bekanntermaßen funktionsfähigen Snapshot bei.
- Wiederhergestellt: Wird nach der nächsten erfolgreichen Aktivierung einmal ausgegeben.
- Wiederholte Fehler im bereits eingeschränkten Zustand protokollieren Warnungen, geben das Ereignis jedoch nicht erneut aus.
- Der schnelle Abbruch beim Start gibt niemals ein Ereignis für den eingeschränkten Zustand aus, da die Laufzeit nie aktiv wurde.

## Auflösung in Befehlspfaden

Befehlspfade können sich über einen Gateway-Snapshot-RPC für die unterstützte SecretRef-Auflösung anmelden. Dabei gelten zwei grundlegende Verhaltensweisen:

<Tabs>
  <Tab title="Strikte Befehlspfade">
    Zum Beispiel `openclaw memory`-Remote-Memory-Pfade und `openclaw qr --remote`, wenn Remote-Referenzen auf gemeinsam genutzte Secrets benötigt werden. Sie lesen aus dem aktiven Snapshot und brechen sofort ab, wenn eine erforderliche SecretRef nicht verfügbar ist.
  </Tab>
  <Tab title="Schreibgeschützte Befehlspfade">
    Zum Beispiel `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` sowie schreibgeschützte Doctor-/Konfigurationsreparaturabläufe. Auch sie bevorzugen den aktiven Snapshot, arbeiten jedoch eingeschränkt weiter, statt abzubrechen, wenn eine gezielt benötigte SecretRef nicht verfügbar ist.

    Schreibgeschütztes Verhalten:

    - Wenn das Gateway ausgeführt wird, lesen diese Befehle zuerst aus dem aktiven Snapshot.
    - Wenn die Gateway-Auflösung unvollständig oder das Gateway nicht verfügbar ist, versuchen sie einen gezielten lokalen Fallback für diese Befehlsoberfläche.
    - Wenn eine gezielt benötigte SecretRef weiterhin nicht verfügbar ist, wird der Befehl mit eingeschränkter schreibgeschützter Ausgabe und einer ausdrücklichen Diagnose fortgesetzt, dass die Referenz konfiguriert, in diesem Befehlspfad jedoch nicht verfügbar ist.
    - Dieses eingeschränkte Verhalten gilt nur lokal für den Befehl; es schwächt weder den Laufzeitstart noch die Neulade-, Sende- oder Authentifizierungspfade.

  </Tab>
</Tabs>

Weitere Hinweise:

- Die Snapshot-Aktualisierung nach einer Secret-Rotation im Backend wird von `openclaw secrets reload` verarbeitet.
- Von diesen Befehlspfaden verwendete Gateway-RPC-Methode: `secrets.resolve`.

## Audit- und Konfigurationsworkflow

Standardablauf für Operatoren:

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

Betrachten Sie die Migration erst als abgeschlossen, wenn das erneute Audit keine Beanstandungen ergibt. Wenn das Audit weiterhin gespeicherte Klartextwerte meldet, bleibt das Risiko eines Agent-Zugriffs bestehen, selbst wenn Laufzeit-APIs geschwärzte Werte zurückgeben.

Wenn Sie während `configure` einen Plan speichern, statt ihn anzuwenden, wenden Sie diesen gespeicherten Plan vor dem erneuten Audit mit `openclaw secrets apply --from <plan-path>` an.

<AccordionGroup>
  <Accordion title="Secrets auditieren">
    Zu den Feststellungen gehören:

    - Gespeicherte Klartextwerte (`openclaw.json`, `auth-profiles.json`, `.env` und generierte `agents/*/agent/models.json`).
    - Verbliebene sensible Provider-Header im Klartext in generierten `models.json`-Einträgen.
    - Nicht aufgelöste Referenzen.
    - Vorrangbedingte Verschattung (`auth-profiles.json` haben Vorrang vor `openclaw.json`-Referenzen).
    - Veraltete Rückstände (`auth.json`, OAuth-Erinnerungen).

    Hinweis zu Exec: Standardmäßig überspringt das Audit Prüfungen der Auflösbarkeit von Exec-SecretRefs, um Nebenwirkungen durch Befehle zu vermeiden. Verwenden Sie `openclaw secrets audit --allow-exec`, um Exec-Provider während des Audits auszuführen.

    Hinweis zu Header-Rückständen: Die Erkennung sensibler Provider-Header basiert auf Namensheuristiken (gängige Namen und Bestandteile von Authentifizierungs-/Anmeldedaten-Headern wie `authorization`, `x-api-key`, `token`, `secret`, `password` und `credential`).

  </Accordion>
  <Accordion title="Secrets konfigurieren">
    Interaktives Hilfsprogramm, das:

    - Zuerst `secrets.providers` konfiguriert (`env`/`file`/`exec`, hinzufügen/bearbeiten/entfernen).
    - Sie unterstützte Secret-führende Felder in `openclaw.json` sowie `auth-profiles.json` für einen Agent-Bereich auswählen lässt.
    - Direkt in der Zielauswahl eine neue `auth-profiles.json`-Zuordnung erstellen kann.
    - SecretRef-Details erfasst (`source`, `provider`, `id`).
    - Eine Vorabauflösung ausführt und die Änderungen sofort anwenden kann.

    Hinweis zu Exec: Die Vorabprüfung überspringt Exec-SecretRef-Prüfungen, sofern `--allow-exec` nicht festgelegt ist. Wenn Sie direkt aus `configure --apply` anwenden und der Plan Exec-Referenzen/-Provider enthält, lassen Sie `--allow-exec` auch für den Anwendungsschritt festgelegt.

    Hilfreiche Modi:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Standardwerte beim Anwenden von `configure`:

    - Übereinstimmende statische Anmeldedaten für die ausgewählten Provider aus `auth-profiles.json` entfernen.
    - Veraltete statische `api_key`-Einträge aus `auth.json` entfernen.
    - Übereinstimmende bekannte Secret-Zeilen aus `<config-dir>/.env` entfernen.

  </Accordion>
  <Accordion title="Secrets anwenden">
    Einen gespeicherten Plan anwenden:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Hinweis zu Exec: Der Probelauf überspringt Exec-Prüfungen, sofern `--allow-exec` nicht festgelegt ist; der Schreibmodus lehnt Pläne mit Exec-SecretRefs/-Providern ab, sofern `--allow-exec` nicht festgelegt ist.

    Einzelheiten zum strikten Ziel-/Pfadvertrag und die genauen Ablehnungsregeln finden Sie unter [Vertrag für den Secrets-Anwendungsplan](/de/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Einweg-Sicherheitsrichtlinie

<Warning>
OpenClaw schreibt bewusst keine Rollback-Sicherungen, die historische Klartextwerte von Secrets enthalten.
</Warning>

Sicherheitsmodell:

- Die Vorabprüfung muss vor dem Schreibmodus erfolgreich sein.
- Die Laufzeitaktivierung wird vor dem Commit validiert.
- Beim Anwenden werden Dateien mittels atomarem Dateiaustausch aktualisiert; bei einem Fehler wird nach bestem Bemühen eine Wiederherstellung durchgeführt.

## Hinweise zur Kompatibilität mit veralteter Authentifizierung

Bei statischen Anmeldedaten ist die Laufzeit nicht mehr von veraltetem Klartextspeicher für die Authentifizierung abhängig.

- Die Quelle der Laufzeit-Anmeldedaten ist der aufgelöste In-Memory-Snapshot.
- Veraltete statische `api_key`-Einträge werden bei ihrer Erkennung entfernt.
- OAuth-bezogenes Kompatibilitätsverhalten bleibt davon getrennt.

## Hinweis zur Web-Benutzeroberfläche

Einige SecretInput-Unions lassen sich im Rohdaten-Editor-Modus einfacher konfigurieren als im Formularmodus.

## Verwandte Themen

- [Authentifizierung](/de/gateway/authentication) - Einrichtung der Authentifizierung
- [CLI: Secrets](/de/cli/secrets) - CLI-Befehle
- [Vault-SecretRefs](/de/plugins/vault) - Einrichtung des HashiCorp-Vault-Providers
- [Umgebungsvariablen](/de/help/environment) - Vorrang von Umgebungsvariablen
- [SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface) - Anmeldedatenoberfläche
- [Vertrag für den Secrets-Anwendungsplan](/de/gateway/secrets-plan-contract) - Einzelheiten zum Planvertrag
- [Sicherheit](/de/gateway/security) - Sicherheitskonzept
