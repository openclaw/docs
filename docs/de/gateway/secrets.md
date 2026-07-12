---
read_when:
    - SecretRefs für Provider-Anmeldedaten und `auth-profiles.json`-Referenzen konfigurieren
    - Secrets in der Produktion sicher neu laden, prüfen, konfigurieren und anwenden
    - Fail-Fast beim Start, Filterung inaktiver Oberflächen und Last-Known-Good-Verhalten verstehen
sidebarTitle: Secrets management
summary: 'Geheimnisverwaltung: SecretRef-Vertrag, Verhalten von Laufzeit-Snapshots und sicheres unumkehrbares Bereinigen'
title: Verwaltung von Geheimnissen
x-i18n:
    generated_at: "2026-07-12T15:27:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 63cc331bc015d29e2b2cee170e09a1db9212338e97e21c07a9bfc73477cbd64a
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw unterstützt additive SecretRefs, sodass unterstützte Zugangsdaten nicht im Klartext in der Konfiguration gespeichert werden müssen.

<Note>
Klartext funktioniert weiterhin. SecretRefs sind für jede Zugangsdatenangabe optional.
</Note>

<Warning>
Klartext-Zugangsdaten bleiben für den Agenten lesbar, wenn sie sich in Dateien befinden, die der Agent einsehen kann, darunter `openclaw.json`, `auth-profiles.json`, `.env` oder generierte `agents/*/agent/models.json`-Dateien. SecretRefs verringern diesen lokalen Schadensradius erst, nachdem alle unterstützten Zugangsdaten migriert wurden und `openclaw secrets audit --check` keine Klartextreste mehr meldet.
</Warning>

## Laufzeitmodell

- Geheimnisse werden während der Aktivierung vorab in einen speicherinternen Laufzeit-Snapshot aufgelöst, nicht erst bei Bedarf in Anfragepfaden.
- Der Start schlägt sofort fehl, wenn eine tatsächlich aktive SecretRef nicht aufgelöst werden kann.
- Ein Neuladen erfolgt als atomarer Austausch: entweder vollständig erfolgreich oder der letzte als funktionsfähig bekannte Snapshot bleibt erhalten.
- Richtlinienverstöße (beispielsweise ein Authentifizierungsprofil im OAuth-Modus in Kombination mit einer SecretRef-Eingabe) lassen die Aktivierung vor dem Austausch des Laufzeit-Snapshots fehlschlagen.
- Laufzeitanfragen lesen ausschließlich den aktiven speicherinternen Snapshot. SecretRef-Zugangsdaten für Modell-Provider werden bis zur ausgehenden Übertragung als prozesslokale Sentinel-Werte durch den Authentifizierungsspeicher und die Stream-Optionen weitergegeben. Ausgehende Zustellungspfade (Discord-Antwort-/Thread-Zustellung, das Senden von Telegram-Aktionen) lesen ebenfalls diesen Snapshot und lösen Referenzen nicht bei jedem Sendevorgang erneut auf.

Dadurch wirken sich Ausfälle von Geheimnis-Providern nicht auf häufig genutzte Anfragepfade aus.

## Injektion bei der ausgehenden Übertragung (Sentinel-Werte)

Für Zugangsdaten von Modell-Providern, die auf SecretRefs basieren, erzeugt OpenClaw während der Auflösung der Modellauthentifizierung einen undurchsichtigen, prozesslokalen Sentinel-Wert. Authentifizierungsspeicher, Stream-Optionen, SDK-Konfiguration, Protokolle, Fehlerobjekte und die meisten Laufzeitinspektionen sehen daher einen Wert wie `oc-sent-v1-...` statt der Zugangsdaten des Providers. Der abgesicherte Modellabruf und verwaltete Zustandsprüfungen lokaler Provider ersetzen bekannte Sentinel-Werte in URL- und Header-Werten unmittelbar bevor die jeweilige Anfrage den Prozess verlässt.

Unbekannte Werte im Sentinel-Format führen vor jeglicher Netzwerkaktivität zu einem sicheren Abbruch. OpenClaw verweigert das Senden der Anfrage, statt einen nicht aufgelösten Sentinel-Wert an einen Provider weiterzuleiten. Aufgelöste Geheimniswerte werden außerdem zur exakten wertbasierten Schwärzung in Protokollen registriert, um eine zusätzliche Schutzebene zu schaffen.

Provider-Adapter verwenden den spätestmöglichen Injektionspunkt, den ihr SDK unterstützt:

- SDKs mit einer benutzerdefinierten Fetch-Option erhalten den abgesicherten Fetch von OpenClaw, sodass das SDK den Sentinel-Wert beibehält.
- SDKs ohne benutzerdefinierte Fetch-Option entpacken den Sentinel-Wert unmittelbar vor der Client-Erstellung. Plugin-eigene Provider-Streams und Agent-Harnesses entpacken ihn bei der letzten vom Kern verwalteten Übergabe, da diese Transporte den abgesicherten Fetch von OpenClaw nicht gemeinsam nutzen.

Sentinel-Werte verringern die Klartextexposition entlang der Modellaufrufkette, stellen jedoch keine Prozessisolierung dar. Der echte Wert ist weiterhin im Speicher desselben Prozesses vorhanden und erscheint an der abschließenden Adaptergrenze. Einfache Umgebungs-Zugangsdaten, die nicht über SecretRefs konfiguriert sind, bleiben im Klartext und fallen nicht unter diesen Mechanismus.

Setzen Sie `OPENCLAW_SECRET_SENTINELS=off` (akzeptiert ohne Berücksichtigung der Groß-/Kleinschreibung auch `0` oder `false`), um die Erzeugung von Sentinel-Werten bei der Reaktion auf Vorfälle oder bei der Behebung von Kompatibilitätsproblemen zu deaktivieren. Der Notausschalter deaktiviert nicht die Registrierung für die exakte wertbasierte Schwärzung.

## Grenze des Agentenzugriffs

SecretRefs verhindern, dass Zugangsdaten in Konfigurationsdateien und generierten Modelldateien gespeichert werden, stellen jedoch keine Prozessisolierungsgrenze dar. Klartext-Zugangsdaten, die auf dem Datenträger in einem für den Agenten lesbaren Pfad verbleiben, können weiterhin über Datei- oder Shell-Werkzeuge gelesen werden, wodurch die Schwärzung auf API-Ebene umgangen wird.

Betrachten Sie bei Produktionsbereitstellungen, in denen für Agenten zugängliche Dateien relevant sind, die Migration erst dann als abgeschlossen, wenn alle folgenden Bedingungen erfüllt sind:

- Unterstützte Zugangsdaten verwenden SecretRefs anstelle von Klartextwerten.
- Veraltete Klartextreste wurden aus `openclaw.json`, `auth-profiles.json`, `.env` und generierten `models.json`-Dateien entfernt.
- `openclaw secrets audit --check` meldet nach der Migration keine Probleme.
- Alle verbleibenden nicht unterstützten oder rotierenden Zugangsdaten werden durch Betriebssystemisolierung, Containerisolierung oder einen externen Zugangsdaten-Proxy geschützt.

Deshalb ist der Audit-/Konfigurations-/Anwendungs-Workflow ein Sicherheitstor für die Migration und nicht nur eine Komfortfunktion.

<Warning>
SecretRefs machen beliebige lesbare Dateien nicht sicher. Sicherungen, kopierte Konfigurationen, alte generierte Modellkataloge und nicht unterstützte Zugangsdatenklassen bleiben Produktionsgeheimnisse, bis sie gelöscht, außerhalb der Vertrauensgrenze des Agenten verschoben oder separat isoliert wurden.
</Warning>

## Filterung aktiver Oberflächen

SecretRefs werden nur auf tatsächlich aktiven Oberflächen validiert:

- **Aktivierte Oberflächen**: Nicht aufgelöste Referenzen blockieren den Start/das Neuladen.
- **Inaktive Oberflächen**: Nicht aufgelöste Referenzen blockieren den Start/das Neuladen nicht; sie erzeugen eine nicht schwerwiegende `SECRETS_REF_IGNORED_INACTIVE_SURFACE`-Diagnose.

<Accordion title="Beispiele für inaktive Oberflächen">
- Deaktivierte Kanal-/Kontoeinträge.
- Zugangsdaten auf oberster Kanalebene, die von keinem aktivierten Konto übernommen werden.
- Deaktivierte Werkzeug-/Funktionsoberflächen.
- Providerspezifische Schlüssel für die Websuche, die nicht durch `tools.web.search.provider` ausgewählt wurden. Im automatischen Modus (Provider nicht festgelegt) werden die Schlüssel in ihrer Rangfolge zur automatischen Erkennung herangezogen, bis einer aufgelöst wird; nach der Auswahl sind die Schlüssel nicht ausgewählter Provider inaktiv.
- SSH-Authentifizierungsmaterial für die Sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData` sowie agentenspezifische Überschreibungen) ist nur aktiv, wenn das tatsächlich verwendete Sandbox-Backend `ssh` ist und der Sandbox-Modus weder für den Standard-Agenten noch für einen aktivierten Agenten auf `off` gesetzt ist.
- SecretRefs für `gateway.remote.token` / `gateway.remote.password` sind aktiv, wenn eine der folgenden Bedingungen erfüllt ist:
  - `gateway.mode=remote`
  - `gateway.remote.url` ist konfiguriert
  - `gateway.tailscale.mode` ist `serve` oder `funnel`
  - Im lokalen Modus ohne diese Remote-Oberflächen: `gateway.remote.token` ist aktiv, wenn Token-Authentifizierung Vorrang haben kann und kein Umgebungs-/Authentifizierungstoken konfiguriert ist; `gateway.remote.password` ist nur aktiv, wenn Passwortauthentifizierung Vorrang haben kann und kein Umgebungs-/Authentifizierungspasswort konfiguriert ist.
- Die SecretRef `gateway.auth.token` ist für die Auflösung der Startauthentifizierung inaktiv, wenn `OPENCLAW_GATEWAY_TOKEN` gesetzt ist, da die Token-Eingabe aus der Umgebung für diese Laufzeit Vorrang hat.

</Accordion>

## Diagnose der Gateway-Authentifizierungsoberflächen

Wenn eine SecretRef für `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` oder `gateway.remote.password` festgelegt ist, protokolliert der Gateway-Start bzw. das Neuladen den Oberflächenstatus unter dem Code `SECRETS_GATEWAY_AUTH_SURFACE`:

- `active`: Die SecretRef ist Teil der tatsächlich verwendeten Authentifizierungsoberfläche und muss aufgelöst werden.
- `inactive`: Eine andere Authentifizierungsoberfläche hat Vorrang oder die Remote-Authentifizierung ist deaktiviert/nicht aktiv.

Der Protokolleintrag enthält den Grund, den die Richtlinie für aktive Oberflächen verwendet hat.

## Vorabprüfung von Referenzen beim Onboarding

Wenn Sie beim interaktiven Onboarding die Speicherung als SecretRef auswählen, wird vor dem Speichern eine Vorabvalidierung ausgeführt:

- Umgebungsreferenzen: Der Name der Umgebungsvariable wird validiert und es wird bestätigt, dass während der Einrichtung ein nicht leerer Wert sichtbar ist.
- Provider-Referenzen (`file` oder `exec`): Die Provider-Auswahl wird validiert, `id` wird aufgelöst und der Typ des aufgelösten Werts wird geprüft.
- Schnellstart-Workflow: Wenn `gateway.auth.token` bereits eine SecretRef ist, löst das Onboarding sie vor der Initialisierung der Prüfung/des Dashboards mit derselben Sofortabbruchprüfung auf (für `env`-, `file`- und `exec`-Referenzen).

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

    Kurzschreibweisen als Zeichenfolgen werden in SecretInput-Feldern ebenfalls akzeptiert:

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
    - RFC-6901-Escaping in Segmenten: `~` wird zu `~0`, `/` wird zu `~1`

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
        mode: "json", // oder "singleValue"
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
- `mode: "json"` (Standard) erwartet eine JSON-Objektnutzlast und löst `id` als JSON-Zeiger auf.
- `mode: "singleValue"` erwartet die Referenz-ID `"value"` und gibt den unverarbeiteten Dateiinhalt zurück (abschließender Zeilenumbruch wird entfernt).
- Der Pfad muss Eigentums-/Berechtigungsprüfungen bestehen; `timeoutMs` (Standard 5000) und `maxBytes` (Standard 1 MiB) begrenzen den Lesevorgang.
- Sicherer Abbruch unter Windows: Wenn die ACL-Prüfung für den Pfad nicht verfügbar ist, schlägt die Auflösung fehl. Legen Sie ausschließlich für vertrauenswürdige Pfade `allowInsecurePath: true` für diesen Provider fest, um die Prüfung zu umgehen.

</Accordion>

<Accordion title="Exec-Provider">
- Führt den konfigurierten absoluten Binärpfad direkt und ohne Shell aus.
- Standardmäßig muss `command` eine reguläre Datei und darf kein symbolischer Link sein. Legen Sie `allowSymlinkCommand: true` fest, um Befehlspfade über symbolische Links zuzulassen (beispielsweise Homebrew-Shims), und kombinieren Sie dies mit `trustedDirs` (beispielsweise `["/opt/homebrew"]`), sodass nur Pfade des Paketmanagers zulässig sind.
- Unterstützt `timeoutMs` (Standard 5000), `noOutputTimeoutMs` (standardmäßig gleich `timeoutMs`), `maxOutputBytes` (Standard 1 MiB), eine Positivliste für `env`/`passEnv` sowie `trustedDirs`.
- `jsonOnly` ist standardmäßig `true`. Bei `jsonOnly: false` und genau einer angeforderten ID wird eine einfache Nicht-JSON-Standardausgabe als Wert dieser ID akzeptiert.
- Sicherer Abbruch unter Windows: Wenn die ACL-Prüfung für den Befehlspfad nicht verfügbar ist, schlägt die Auflösung fehl. Legen Sie ausschließlich für vertrauenswürdige Pfade `allowInsecurePath: true` für diesen Provider fest, um die Prüfung zu umgehen.
- Von Plugins verwaltete Exec-Provider können `pluginIntegration` anstelle eines kopierten `command`/`args` verwenden. OpenClaw löst die aktuellen Befehlsdetails während des Starts/Neuladens aus dem Manifest des installierten Plugins auf. Wenn das Plugin deaktiviert, entfernt oder nicht vertrauenswürdig ist oder die Integration nicht mehr deklariert, führen aktive SecretRefs für diesen Provider zu einem sicheren Abbruch.

Anfragenutzlast (Standardeingabe):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Antwortnutzlast (Standardausgabe):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
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
Codes und frei definierbare Felder wie `message` werden aus Gründen der Protokoll-v1-Kompatibilität akzeptiert,
aber nicht angezeigt, da die Resolver-Ausgabe Zugangsdaten enthalten kann.

</Accordion>

## Dateibasierte API-Schlüssel

Setzen Sie keine `file:...`-Zeichenfolgen in den Konfigurationsblock `env`. Dieser Block ist literal und überschreibt nichts, daher wird `file:...` dort niemals aufgelöst.

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

Für `mode: "singleValue"` lautet die SecretRef-`id` `"value"`. Verwenden Sie für `mode: "json"` einen absoluten JSON-Zeiger wie `"/providers/xai/apiKey"`.

Die Felder, die SecretRefs akzeptieren, finden Sie unter [SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface).

## Beispiele für die Exec-Integration

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // erforderlich für über Homebrew verknüpfte Binärdateien
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
    Verwenden Sie einen Resolver-Wrapper, um SecretRef-IDs den Elementschlüsseln von Bitwarden Secrets Manager zuzuordnen. Das Repository enthält `scripts/secrets/openclaw-bws-resolver.mjs`; installieren oder kopieren Sie ihn in einen absoluten vertrauenswürdigen Pfad auf dem Host, auf dem der Gateway ausgeführt wird.

    Voraussetzungen:

    - Die Bitwarden Secrets Manager CLI (`bws`) ist auf dem Gateway-Host installiert.
    - `BWS_ACCESS_TOKEN` steht dem Gateway-Dienst zur Verfügung.
    - `PATH` wird an den Resolver übergeben oder `BWS_BIN` ist auf den absoluten Pfad der `bws`-Binärdatei gesetzt.
    - `BWS_SERVER_URL` ist bei Verwendung einer selbst gehosteten Bitwarden-Instanz in der Umgebung gesetzt.

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

    Der Resolver bündelt die angeforderten IDs, führt `bws secret list` aus und gibt Werte für übereinstimmende geheime `key`-Felder zurück. Verwenden Sie Schlüssel, die dem ID-Vertrag der Exec-SecretRef entsprechen, etwa `openclaw/providers/openai/apiKey`; Schlüssel im Stil von Umgebungsvariablen mit Unterstrichen werden abgelehnt, bevor der Resolver ausgeführt wird. Wenn mehrere sichtbare Bitwarden-Secrets denselben angeforderten Schlüssel verwenden, meldet der Resolver diese ID als mehrdeutig, anstatt zu raten. Überprüfen Sie nach der Aktualisierung der Konfiguration den Resolver-Pfad:

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
            allowSymlinkCommand: true, // erforderlich für über Homebrew verknüpfte Binärdateien
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
    Verwenden Sie einen kleinen Resolver-Wrapper, um SecretRef-IDs direkt `pass`-Einträgen zuzuordnen. Speichern Sie ihn als ausführbare Datei unter einem absoluten Pfad, der Ihre Pfadprüfungen für Exec-Provider besteht, beispielsweise `/usr/local/bin/openclaw-pass-resolver`. Die Shebang `#!/usr/bin/env node` löst `node` über den `PATH` des Resolver-Prozesses auf; nehmen Sie daher `PATH` in `passEnv` auf. Wenn `pass` nicht in diesem `PATH` enthalten ist, setzen Sie `PASS_BIN` in der übergeordneten Umgebung und nehmen Sie es ebenfalls in `passEnv` auf:

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
          errors[id] = { message: (result.stderr || `pass wurde mit ${result.status} beendet`).trim() };
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

    Belassen Sie das Secret in der ersten Zeile des `pass`-Eintrags oder passen Sie den Wrapper so an, dass stattdessen die vollständige Ausgabe von `pass show` zurückgegeben wird. Überprüfen Sie nach der Aktualisierung der Konfiguration sowohl das statische Audit als auch den Pfad des Exec-Resolvers:

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
            allowSymlinkCommand: true, // erforderlich für über Homebrew verknüpfte Binärdateien
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

Über `plugins.entries.acpx.config.mcpServers` konfigurierte Umgebungsvariablen für MCP-Server akzeptieren SecretInput, sodass API-Schlüssel und Token nicht im Klartext in der Konfiguration stehen:

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

Zeichenfolgenwerte im Klartext funktionieren weiterhin. Referenzen aus Umgebungsvorlagen wie `${MCP_SERVER_API_KEY}` und SecretRef-Objekte werden während der Gateway-Aktivierung aufgelöst, bevor der MCP-Serverprozess gestartet wird. Wie bei anderen SecretRef-Oberflächen blockieren nicht aufgelöste Referenzen die Aktivierung nur, wenn das `acpx`-Plugin tatsächlich aktiv ist.

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

- OpenClaw löst diese Referenzen während der Sandbox-Aktivierung auf, nicht verzögert bei jedem SSH-Aufruf.
- Aufgelöste Werte werden mit restriktiven Dateiberechtigungen (`0o600`) in ein temporäres Verzeichnis geschrieben und in der generierten SSH-Konfiguration verwendet.
- Wenn das tatsächlich verwendete Sandbox-Backend nicht `ssh` ist (oder der Sandbox-Modus `off` lautet), bleiben diese Referenzen inaktiv und blockieren den Start nicht.

## Unterstützte Anmeldedatenoberfläche

Die kanonisch unterstützten und nicht unterstützten Anmeldedaten sind unter [SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface) aufgeführt.

<Note>
Zur Laufzeit erzeugte oder rotierende Anmeldedaten sowie OAuth-Aktualisierungsmaterial sind absichtlich von der schreibgeschützten SecretRef-Auflösung ausgeschlossen.
</Note>

## Erforderliches Verhalten und Priorität

- Feld ohne Referenz: unverändert.
- Feld mit Referenz: auf aktiven Oberflächen während der Aktivierung erforderlich.
- Wenn sowohl Klartext als auch eine Referenz vorhanden sind, hat die Referenz auf unterstützten Prioritätspfaden Vorrang.
- Der Schwärzungs-Sentinel `__OPENCLAW_REDACTED__` ist für die interne Schwärzung/Wiederherstellung der Konfiguration reserviert und wird als literal übermittelte Konfigurationsangabe abgelehnt.

Warn- und Auditsignale:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (Laufzeitwarnung)
- `REF_SHADOWED` (Audit-Feststellung, wenn Anmeldedaten aus `auth-profiles.json` Vorrang vor Referenzen aus `openclaw.json` haben)

Google-Chat-Kompatibilität: `serviceAccountRef` hat Vorrang vor `serviceAccount` im Klartext; der Klartextwert wird ignoriert, sobald die gleichgeordnete Referenz gesetzt ist.

## Aktivierungsauslöser

Die Secret-Aktivierung wird ausgelöst bei:

- Start (Vorabprüfung und abschließende Aktivierung)
- Hot-Apply-Pfad beim Neuladen der Konfiguration
- Neustartprüfungspfad beim Neuladen der Konfiguration
- Manuellem Neuladen über `secrets.reload`
- Vorabprüfung des Gateway-RPC zum Schreiben der Konfiguration (`config.set` / `config.apply` / `config.patch`), wobei vor dem Speichern von Änderungen geprüft wird, ob SecretRefs auf aktiven Oberflächen innerhalb der übermittelten Konfigurationsnutzlast aufgelöst werden können

Aktivierungsvertrag:

- Bei Erfolg wird der Snapshot atomar ausgetauscht.
- Ein Fehler beim Start bricht den Gateway-Start ab.
- Bei einem Fehler beim Neuladen zur Laufzeit bleibt der letzte bekanntermaßen funktionsfähige Snapshot erhalten.
- Schlägt die Vorabprüfung des Schreib-RPC fehl, wird die übermittelte Konfiguration abgelehnt; sowohl die Konfiguration auf dem Datenträger als auch der aktive Laufzeit-Snapshot bleiben unverändert.
- Die Angabe eines expliziten, aufrufsspezifischen Kanal-Tokens für einen ausgehenden Helfer-/Tool-Aufruf löst keine SecretRef-Aktivierung aus; die Aktivierungspunkte bleiben der Start, das Neuladen und der explizite Aufruf von `secrets.reload`.

## Signale für beeinträchtigten und wiederhergestellten Zustand

Wenn die Aktivierung beim Neuladen nach einem fehlerfreien Zustand fehlschlägt, wechselt OpenClaw in einen beeinträchtigten Secret-Zustand und gibt einmalige Systemereignisse und Protokollcodes aus:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Verhalten:

- Beeinträchtigt: Die Laufzeit behält den letzten bekanntermaßen funktionsfähigen Snapshot bei.
- Wiederhergestellt: Wird nach der nächsten erfolgreichen Aktivierung einmalig ausgegeben.
- Wiederholte Fehler, während bereits eine Beeinträchtigung besteht, werden als Warnungen protokolliert, lösen das Ereignis jedoch nicht erneut aus.
- Ein schneller Abbruch beim Start löst niemals ein Ereignis für eine Beeinträchtigung aus, da die Laufzeit nie aktiv wurde.

## Auflösung von Befehlspfaden

Befehlspfade können sich über einen Gateway-Snapshot-RPC für die unterstützte SecretRef-Auflösung entscheiden. Dabei gelten zwei allgemeine Verhaltensweisen:

<Tabs>
  <Tab title="Strikte Befehlspfade">
    Dazu gehören beispielsweise Remote-Speicherpfade von `openclaw memory` und `openclaw qr --remote`, wenn der Befehl Verweise auf entfernte gemeinsame Geheimnisse benötigt. Sie lesen aus dem aktiven Snapshot und brechen sofort ab, wenn eine erforderliche SecretRef nicht verfügbar ist.
  </Tab>
  <Tab title="Schreibgeschützte Befehlspfade">
    Dazu gehören beispielsweise `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` sowie schreibgeschützte Doctor-/Konfigurationsreparaturabläufe. Sie bevorzugen ebenfalls den aktiven Snapshot, arbeiten jedoch mit eingeschränkter Funktionalität weiter, statt abzubrechen, wenn eine bestimmte SecretRef nicht verfügbar ist.

    Schreibgeschütztes Verhalten:

    - Wenn das Gateway ausgeführt wird, lesen diese Befehle zuerst aus dem aktiven Snapshot.
    - Wenn die Gateway-Auflösung unvollständig oder das Gateway nicht verfügbar ist, versuchen sie einen gezielten lokalen Fallback für die jeweilige Befehlsoberfläche.
    - Wenn eine bestimmte SecretRef weiterhin nicht verfügbar ist, wird der Befehl mit eingeschränkter schreibgeschützter Ausgabe und einer ausdrücklichen Diagnose fortgesetzt, dass der Verweis konfiguriert, in diesem Befehlspfad jedoch nicht verfügbar ist.
    - Dieses eingeschränkte Verhalten gilt nur lokal für den jeweiligen Befehl; es schwächt weder den Laufzeitstart noch Neulade-, Sende- oder Authentifizierungspfade.

  </Tab>
</Tabs>

Weitere Hinweise:

- Die Aktualisierung des Snapshots nach der Rotation eines Geheimnisses im Backend erfolgt über `openclaw secrets reload`.
- Von diesen Befehlspfaden verwendete Gateway-RPC-Methode: `secrets.resolve`.

## Audit- und Konfigurationsablauf

Standardablauf für Betreiber:

<Steps>
  <Step title="Aktuellen Zustand prüfen">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="SecretRefs konfigurieren und anwenden">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="Erneut prüfen">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

Betrachten Sie die Migration erst dann als abgeschlossen, wenn die erneute Prüfung keine Beanstandungen ergibt. Wenn das Audit weiterhin unverschlüsselte gespeicherte Werte meldet, besteht das Risiko des Agentenzugriffs fort, selbst wenn Laufzeit-APIs geschwärzte Werte zurückgeben.

Wenn Sie während `configure` einen Plan speichern, statt ihn anzuwenden, wenden Sie diesen gespeicherten Plan vor der erneuten Prüfung mit `openclaw secrets apply --from <plan-path>` an.

<AccordionGroup>
  <Accordion title="secrets audit">
    Die Befunde umfassen:

    - Unverschlüsselte gespeicherte Werte (`openclaw.json`, `auth-profiles.json`, `.env` und generierte `agents/*/agent/models.json`).
    - Verbliebene unverschlüsselte sensible Provider-Header in generierten `models.json`-Einträgen.
    - Nicht aufgelöste Verweise.
    - Überschattung durch Vorrangregeln (`auth-profiles.json` hat Vorrang vor Verweisen in `openclaw.json`).
    - Veraltete Überreste (`auth.json`, OAuth-Erinnerungen).

    Hinweis zu Exec: Standardmäßig überspringt das Audit Prüfungen der Auflösbarkeit von Exec-SecretRefs, um Nebeneffekte durch Befehle zu vermeiden. Verwenden Sie `openclaw secrets audit --allow-exec`, um Exec-Provider während des Audits auszuführen.

    Hinweis zu Header-Überresten: Die Erkennung sensibler Provider-Header basiert auf Heuristiken für Namen (gängige Namen von Authentifizierungs-/Anmeldedaten-Headern sowie Fragmente wie `authorization`, `x-api-key`, `token`, `secret`, `password` und `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Interaktive Hilfsfunktion, die:

    - Zuerst `secrets.providers` konfiguriert (`env`/`file`/`exec`, hinzufügen/bearbeiten/entfernen).
    - Sie unterstützte geheimnishaltige Felder in `openclaw.json` sowie `auth-profiles.json` für einen Agentenbereich auswählen lässt.
    - Direkt in der Zielauswahl eine neue `auth-profiles.json`-Zuordnung erstellen kann.
    - SecretRef-Details (`source`, `provider`, `id`) erfasst.
    - Eine Vorabauflösung durchführt und die Konfiguration sofort anwenden kann.

    Hinweis zu Exec: Die Vorabprüfung überspringt Prüfungen von Exec-SecretRefs, sofern `--allow-exec` nicht gesetzt ist. Wenn Sie direkt über `configure --apply` anwenden und der Plan Exec-Verweise/-Provider enthält, lassen Sie `--allow-exec` auch für den Anwendungsschritt gesetzt.

    Hilfreiche Modi:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Standardeinstellungen beim Anwenden mit `configure`:

    - Übereinstimmende statische Anmeldedaten für die betreffenden Provider aus `auth-profiles.json` entfernen.
    - Veraltete statische `api_key`-Einträge aus `auth.json` entfernen.
    - Übereinstimmende bekannte Geheimniszeilen aus `<config-dir>/.env` entfernen.

  </Accordion>
  <Accordion title="secrets apply">
    Einen gespeicherten Plan anwenden:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Hinweis zu Exec: Der Probelauf überspringt Exec-Prüfungen, sofern `--allow-exec` nicht gesetzt ist; der Schreibmodus lehnt Pläne mit Exec-SecretRefs/-Providern ab, sofern `--allow-exec` nicht gesetzt ist.

    Einzelheiten zum strikten Ziel-/Pfadvertrag und die genauen Ablehnungsregeln finden Sie unter [Vertrag für den Plan zur Anwendung von Geheimnissen](/de/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Einweg-Sicherheitsrichtlinie

<Warning>
OpenClaw erstellt absichtlich keine Rollback-Sicherungen, die frühere unverschlüsselte Geheimniswerte enthalten.
</Warning>

Sicherheitsmodell:

- Die Vorabprüfung muss erfolgreich sein, bevor der Schreibmodus beginnt.
- Die Laufzeitaktivierung wird vor dem Commit validiert.
- Beim Anwenden werden Dateien durch atomaren Dateiaustausch aktualisiert; bei einem Fehler wird nach Möglichkeit der vorherige Zustand wiederhergestellt.

## Hinweise zur Kompatibilität mit veralteter Authentifizierung

Bei statischen Anmeldedaten ist die Laufzeit nicht mehr von der veralteten unverschlüsselten Authentifizierungsspeicherung abhängig.

- Die Quelle der Laufzeitanmeldedaten ist der aufgelöste In-Memory-Snapshot.
- Veraltete statische `api_key`-Einträge werden entfernt, sobald sie gefunden werden.
- OAuth-bezogenes Kompatibilitätsverhalten bleibt davon getrennt.

## Hinweis zur Web-Benutzeroberfläche

Einige SecretInput-Unions lassen sich im Rohbearbeitungsmodus einfacher konfigurieren als im Formularmodus.

## Verwandte Themen

- [Authentifizierung](/de/gateway/authentication) - Einrichtung der Authentifizierung
- [CLI: Geheimnisse](/de/cli/secrets) - CLI-Befehle
- [Vault-SecretRefs](/de/plugins/vault) - Einrichtung des HashiCorp-Vault-Providers
- [Umgebungsvariablen](/de/help/environment) - Vorrang von Umgebungsvariablen
- [Anmeldedatenoberfläche für SecretRefs](/de/reference/secretref-credential-surface) - Anmeldedatenoberfläche
- [Vertrag für den Plan zur Anwendung von Geheimnissen](/de/gateway/secrets-plan-contract) - Einzelheiten zum Planvertrag
- [Sicherheit](/de/gateway/security) - Sicherheitskonzept
