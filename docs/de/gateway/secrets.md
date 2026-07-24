---
read_when:
    - SecretRefs für Provider-Anmeldedaten und `auth-profiles.json`-Referenzen konfigurieren
    - Secrets in der Produktion sicher neu laden, prüfen, konfigurieren und anwenden
    - Grundlegendes zu schnellem Fehlschlagen beim Start, zur Filterung inaktiver Oberflächen und zum Verhalten mit der letzten als funktionsfähig bekannten Version
sidebarTitle: Secrets management
summary: 'Secret-Verwaltung: SecretRef-Vertrag, Verhalten von Runtime-Snapshots und sicheres unidirektionales Bereinigen'
title: Secret-Verwaltung
x-i18n:
    generated_at: "2026-07-24T04:57:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d10989ebbce367c68d28768244d4e3649028af5ab63c9523974352c270a3c55e
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw unterstützt additive SecretRefs, sodass unterstützte Zugangsdaten nicht als Klartext in der Konfiguration gespeichert werden müssen.

<Note>
Klartext funktioniert weiterhin. SecretRefs sind für jede Zugangsdatenangabe optional.
</Note>

<Warning>
Klartext-Zugangsdaten bleiben für den Agenten lesbar, wenn sie sich in Dateien befinden, die der Agent einsehen kann, einschließlich `openclaw.json`, `auth-profiles.json`, `.env` oder generierter `agents/*/agent/models.json`-Dateien. SecretRefs verringern diesen lokalen Schadensradius erst, wenn alle unterstützten Zugangsdaten migriert wurden und `openclaw secrets audit --check` keine Klartextreste meldet.
</Warning>

## Laufzeitmodell

- Secrets werden während der Aktivierung vorab in einen speicherinternen Laufzeit-Snapshot aufgelöst, nicht verzögert in Anfragepfaden.
- Beim Kaltstart des Gateways wird ein wiederholbarer SecretRef-Fehler auf einen bekannten Nicht-Gateway-Eigentümer begrenzt, sofern dieser Eigentümer Isolation unterstützt. Zu den zugeordneten Eigentümerklassen gehören Modell-Provider und Skills, Medien-/TTS-/Cron-Provider, geeignete Authentifizierungsprofile, agentenspezifischer Speicher, Sandbox-SSH, Kanalkonten und im Manifest deklarierte Plugin-Routen. Das Gateway startet, erfasst den Eigentümer als konfiguriert, aber nicht verfügbar, und gibt eine bereinigte Warnung über die eingeschränkte Funktion aus. Gateway-Eingangsauthentifizierung, strukturell ungültige Referenzen oder aufgelöste Werte, ausfallsicher geschlossene Eigentümer und Referenzen, deren Laufzeiteigentümer nicht zugeordnet ist, verhindern weiterhin den Start.
- Beim Neuladen wird jeder zugeordnete Eigentümer unabhängig validiert und anschließend ein einzelner atomarer Snapshot veröffentlicht. Fehlerfreie Eigentümer werden aktualisiert. Ein geeigneter fehlgeschlagener Eigentümer behält seinen letzten als funktionsfähig bekannten Wert und wird nur dann als veraltet markiert, wenn seine Referenzidentitäten, Provider-Definitionen und sein vollständiger, nicht geheimer Eigentümervertrag unverändert sind; ein geänderter oder neuer fehlgeschlagener Eigentümer wird kalt. Ein strenger Fehler verwirft das Neuladen und behält den aktiven Snapshot bei.
- Richtlinienverstöße (beispielsweise ein Authentifizierungsprofil im OAuth-Modus in Kombination mit einer SecretRef-Eingabe) lassen die Aktivierung vor dem Austausch der Laufzeit fehlschlagen.
- Laufzeitanfragen lesen ausschließlich den aktiven speicherinternen Snapshot. SecretRef-Zugangsdaten von Modell-Providern werden bis zur ausgehenden Übertragung als prozesslokale Sentinel-Werte durch den Authentifizierungsspeicher und die Stream-Optionen weitergegeben. Ausgehende Zustellungspfade (Discord-Antwort-/Thread-Zustellung, Telegram-Aktionssendungen) lesen ebenfalls diesen Snapshot und lösen Referenzen nicht für jede Sendung erneut auf.

Dadurch wirken sich Ausfälle von Secret-Providern nicht auf häufig verwendete Anfragepfade aus.

Gateway-Eingangsschutz, strukturell ungültige Konfigurationen oder aufgelöste Werte, Richtlinienverstöße und unbekannte Eigentümerschaft führen weiterhin zu einem geschlossenen Fehlerzustand. Isolierte Eigentümer greifen niemals auf eine Zugangsdatenquelle mit niedrigerer Priorität zurück.

## Einfügung bei der ausgehenden Übertragung (Sentinel-Werte)

Für durch SecretRefs gestützte Zugangsdaten von Modell-Providern erzeugt OpenClaw während der Auflösung der Modellauthentifizierung einen undurchsichtigen, prozesslokalen Sentinel-Wert. Authentifizierungsspeicher, Stream-Optionen, SDK-Konfiguration, Protokolle, Fehlerobjekte und die meisten Laufzeitinspektionen sehen daher einen Wert wie `oc-sent-v1-...` und nicht die Zugangsdaten des Providers. Der abgesicherte Modellabruf und verwaltete Zustandsprüfungen lokaler Provider ersetzen bekannte Sentinel-Werte in URL- und Header-Werten unmittelbar bevor eine Anfrage den Prozess verlässt.

Unbekannte Werte in Sentinel-Form führen vor jeder Netzwerkaktivität zu einem geschlossenen Fehlerzustand. OpenClaw verweigert das Senden der Anfrage, statt einen nicht aufgelösten Sentinel-Wert an einen Provider weiterzuleiten. Aufgelöste Secret-Werte werden zudem als zusätzliche Schutzmaßnahme zur Protokollbereinigung exakter Werte registriert.

Provider-Adapter verwenden den spätestmöglichen Einfügungspunkt, den ihr SDK unterstützt:

- SDKs mit einer benutzerdefinierten Abrufoption erhalten den abgesicherten Abruf von OpenClaw, sodass das SDK den Sentinel-Wert beibehält.
- SDKs ohne benutzerdefinierte Abrufoption entpacken den Sentinel-Wert unmittelbar vor der Client-Erstellung. Plugin-eigene Provider-Streams und Agenten-Harnesse entpacken ihn bei der letzten vom Kern verwalteten Übergabe, da diese Transporte den abgesicherten Abruf von OpenClaw nicht gemeinsam nutzen.

Sentinel-Werte verringern die Klartextexposition entlang der Modellaufrufkette, stellen jedoch keine Prozessisolation dar. Der tatsächliche Wert ist weiterhin im Speicher desselben Prozesses vorhanden und erscheint an der letzten Adaptergrenze. Einfache Umgebungszugangsdaten, die nicht über SecretRefs konfiguriert sind, bleiben Klartext und liegen außerhalb dieses Mechanismus.

Setzen Sie `OPENCLAW_SECRET_SENTINELS=off` (akzeptiert außerdem `0` oder `false`, ohne Berücksichtigung der Groß-/Kleinschreibung), um die Erzeugung von Sentinel-Werten bei der Reaktion auf Sicherheitsvorfälle oder der Behebung von Kompatibilitätsproblemen zu deaktivieren. Der Deaktivierungsschalter deaktiviert nicht die Registrierung zur Bereinigung exakter Werte.

## Agentenzugriffsgrenze

SecretRefs verhindern, dass Zugangsdaten in Konfigurations- und generierten Modelldateien dauerhaft gespeichert werden, stellen jedoch keine Prozessisolationsgrenze dar. Klartext-Zugangsdaten, die in einem für den Agenten lesbaren Pfad auf dem Datenträger verbleiben, können weiterhin über Datei- oder Shell-Werkzeuge gelesen werden, wodurch die Bereinigung auf API-Ebene umgangen wird.

Bei Produktionsbereitstellungen, in denen für Agenten zugängliche Dateien relevant sind, gilt die Migration erst dann als abgeschlossen, wenn alle folgenden Bedingungen erfüllt sind:

- Unterstützte Zugangsdaten verwenden SecretRefs anstelle von Klartextwerten.
- Veraltete Klartextreste wurden aus `openclaw.json`, `auth-profiles.json`, `.env` und generierten `models.json`-Dateien entfernt.
- `openclaw secrets audit --check` weist nach der Migration keine Rückstände auf.
- Alle verbleibenden nicht unterstützten oder rotierenden Zugangsdaten werden durch Betriebssystemisolation, Container-Isolation oder einen externen Zugangsdaten-Proxy geschützt.

Aus diesem Grund ist der Ablauf für Prüfung, Konfiguration und Anwendung ein Sicherheitsmigrations-Gate und nicht nur eine praktische Hilfsfunktion.

<Warning>
SecretRefs machen beliebige lesbare Dateien nicht sicher. Sicherungen, kopierte Konfigurationen, alte generierte Modellkataloge und nicht unterstützte Zugangsdatenklassen bleiben Produktions-Secrets, bis sie gelöscht, außerhalb der Vertrauensgrenze des Agenten verschoben oder separat isoliert werden.
</Warning>

## Filterung aktiver Oberflächen

SecretRefs werden nur auf tatsächlich aktiven Oberflächen validiert:

- **Aktivierte Oberflächen**: Wiederholbare Fehler für zugeordnete, isolierbare Eigentümer führen zu einer kalten oder veralteten Einschränkung. Strenge, ausfallsicher geschlossene, vom Gateway benötigte oder nicht zugeordnete Fehler blockieren den Start beziehungsweise das Neuladen.
- **Inaktive Oberflächen**: Nicht aufgelöste Referenzen blockieren den Start beziehungsweise das Neuladen nicht; sie geben eine nicht schwerwiegende `SECRETS_REF_IGNORED_INACTIVE_SURFACE`-Diagnose aus.

<Accordion title="Beispiele für inaktive Oberflächen">
- Deaktivierte Kanal-/Kontoeinträge.
- Zugangsdaten auf oberster Kanalebene, die von keinem aktivierten Konto geerbt werden.
- Deaktivierte Werkzeug-/Funktionsoberflächen.
- Provider-spezifische Schlüssel für die Websuche, die nicht durch `tools.web.search.provider` ausgewählt wurden. Im automatischen Modus (Provider nicht festgelegt) werden Schlüssel gemäß ihrer Priorität zur automatischen Erkennung herangezogen, bis einer aufgelöst wird; nach der Auswahl sind die Schlüssel nicht ausgewählter Provider inaktiv.
- Sandbox-SSH-Authentifizierungsmaterial (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData` sowie agentenspezifische Überschreibungen) ist nur aktiv, wenn das effektive Sandbox-Backend `ssh` ist und der Sandbox-Modus für den Standardagenten oder einen aktivierten Agenten nicht `off` ist.
- `gateway.remote.token`- bzw. `gateway.remote.password`-SecretRefs sind aktiv, wenn eine der folgenden Bedingungen erfüllt ist:
  - `gateway.mode=remote`
  - `gateway.remote.url` ist konfiguriert
  - `gateway.tailscale.mode` ist `serve` oder `funnel`
  - Im lokalen Modus ohne diese entfernten Oberflächen: `gateway.remote.token` ist aktiv, wenn Token-Authentifizierung Vorrang haben kann und kein Umgebungs-/Authentifizierungs-Token konfiguriert ist; `gateway.remote.password` ist nur aktiv, wenn Passwortauthentifizierung Vorrang haben kann und kein Umgebungs-/Authentifizierungspasswort konfiguriert ist.
- Die `gateway.auth.token`-SecretRef ist für die Auflösung der Startauthentifizierung inaktiv, wenn `OPENCLAW_GATEWAY_TOKEN` gesetzt ist, da die Token-Eingabe aus der Umgebung für diese Laufzeit Vorrang hat.

</Accordion>

## Diagnose der Gateway-Authentifizierungsoberfläche

Wenn eine SecretRef für `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` oder `gateway.remote.password` festgelegt ist, protokolliert der Start beziehungsweise das Neuladen des Gateways den Oberflächenstatus unter dem Code `SECRETS_GATEWAY_AUTH_SURFACE`:

- `active`: Die SecretRef ist Teil der effektiven Authentifizierungsoberfläche und muss aufgelöst werden.
- `inactive`: Eine andere Authentifizierungsoberfläche hat Vorrang oder die entfernte Authentifizierung ist deaktiviert beziehungsweise nicht aktiv.

Der Protokolleintrag enthält die Begründung, die von der Richtlinie für aktive Oberflächen verwendet wurde.

## Referenz-Vorabprüfung beim Onboarding

Beim interaktiven Onboarding wird bei Auswahl der SecretRef-Speicherung vor dem Speichern eine Vorabvalidierung ausgeführt:

- Umgebungsreferenzen: Validiert den Namen der Umgebungsvariable und bestätigt, dass während der Einrichtung ein nicht leerer Wert sichtbar ist.
- Provider-Referenzen (`file` oder `exec`): Validieren die Provider-Auswahl, lösen `id` auf und prüfen den Typ des aufgelösten Werts.
- Schnellstartablauf: Wenn `gateway.auth.token` bereits eine SecretRef ist, löst das Onboarding sie vor der Initialisierung der Prüfung beziehungsweise des Dashboards auf (für `env`-, `file`- und `exec`-Referenzen), wobei dasselbe sofort abbrechende Gate verwendet wird.

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

    Auf SecretInput-Feldern werden außerdem Kurzform-Zeichenfolgen akzeptiert:

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
- `mode: "singleValue"` erwartet die Referenz-ID `"value"` und gibt den unverarbeiteten Dateiinhalt zurück (abschließender Zeilenumbruch entfernt).
- Der Pfad muss die Eigentums-/Berechtigungsprüfungen bestehen; `timeoutMs` (Standardwert 5000) und `maxBytes` (Standardwert 1 MiB) begrenzen den Lesevorgang.
- Geschlossener Fehlerzustand unter Windows: Wenn für den Pfad keine ACL-Prüfung verfügbar ist, schlägt die Auflösung fehl. Legen Sie nur für vertrauenswürdige Pfade `allowInsecurePath: true` für diesen Provider fest, um die Prüfung zu umgehen.

</Accordion>

<Accordion title="Exec-Provider">
- Führt den konfigurierten absoluten Binärpfad direkt und ohne Shell aus.
- Standardmäßig muss `command` eine reguläre Datei und darf kein Symlink sein. Legen Sie `allowSymlinkCommand: true` fest, um Symlink-Befehlspfade zuzulassen (beispielsweise Homebrew-Shims), und kombinieren Sie dies mit `trustedDirs` (beispielsweise `["/opt/homebrew"]`), damit nur Paketmanagerpfade zulässig sind.
- Unterstützt `timeoutMs` (Standardwert 5000), `noOutputTimeoutMs` (Standardwert entspricht `timeoutMs`), `maxOutputBytes` (Standardwert 1 MiB), die Positivliste `env`/`passEnv` und `trustedDirs`.
- `jsonOnly` ist standardmäßig `true`. Bei `jsonOnly: false` und einer einzelnen angeforderten ID wird eine einfache, nicht als JSON formatierte Standardausgabe als Wert dieser ID akzeptiert.
- Windows arbeitet nach dem Fail-Closed-Prinzip: Wenn die ACL-Überprüfung für den Befehlspfad nicht verfügbar ist, schlägt die Auflösung fehl. Legen Sie ausschließlich für vertrauenswürdige Pfade bei diesem Provider `allowInsecurePath: true` fest, um die Prüfung zu umgehen.
- Von Plugins verwaltete Exec-Provider können `pluginIntegration` anstelle eines kopierten `command`/`args` verwenden. OpenClaw löst die aktuellen Befehlsdetails beim Starten/Neuladen aus dem Manifest des installierten Plugins auf. Wenn das Plugin deaktiviert, entfernt oder nicht vertrauenswürdig ist oder die Integration nicht mehr deklariert, schlagen aktive SecretRefs bei diesem Provider nach dem Fail-Closed-Prinzip fehl.

Anfrage-Payload (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Antwort-Payload (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // Pragma: Geheimnis auf der Positivliste zulassen
```

Optionale Fehler pro ID:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` ist eine optionale, maschinenlesbare Diagnose. OpenClaw zeigt die erkannten
Codes `NOT_FOUND` und `AMBIGUOUS_DUPLICATE_KEY` zusammen mit dem Provider und der Referenz-ID an. Andere
Codes und frei definierbare Felder wie `message` werden zur Kompatibilität mit Protokoll v1 akzeptiert,
aber nicht angezeigt, da die Resolver-Ausgabe Anmeldedaten enthalten kann.

</Accordion>

## Dateibasierte API-Schlüssel

Fügen Sie keine `file:...`-Zeichenfolgen in den `env`-Block der Konfiguration ein. Dieser Block ist literal und kann nicht überschrieben werden, daher wird `file:...` dort niemals aufgelöst.

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

Unter [SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface) finden Sie die Felder, die SecretRefs akzeptieren.

## Beispiele für Exec-Integrationen

Eine spezielle 1Password-Anleitung zu Dienstkonten, dem mitgelieferten Agent-Skill und zur Fehlerbehebung finden Sie unter [1Password](/de/gateway/1password).

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
    Verwenden Sie einen Resolver-Wrapper, um SecretRef-IDs den Elementschlüsseln von Bitwarden Secrets Manager zuzuordnen. Das Repository enthält `scripts/secrets/openclaw-bws-resolver.mjs`. Installieren oder kopieren Sie ihn in einen absoluten, vertrauenswürdigen Pfad auf dem Host, auf dem der Gateway ausgeführt wird.

    Anforderungen:

    - Bitwarden Secrets Manager CLI (`bws`) ist auf dem Gateway-Host installiert.
    - `BWS_ACCESS_TOKEN` ist für den Gateway-Dienst verfügbar.
    - `PATH` wird an den Resolver übergeben oder `BWS_BIN` ist auf den absoluten Pfad der `bws`-Binärdatei festgelegt.
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

    Der Resolver verarbeitet angeforderte IDs gebündelt, führt `bws secret list` aus und gibt Werte für übereinstimmende geheime `key`-Felder zurück. Verwenden Sie Schlüssel, die dem ID-Vertrag für Exec-SecretRefs entsprechen, beispielsweise `openclaw/providers/openai/apiKey`. Schlüssel im Stil von Umgebungsvariablen mit Unterstrichen werden abgelehnt, bevor der Resolver ausgeführt wird. Wenn mehrere sichtbare Bitwarden-Geheimnisse denselben angeforderten Schlüssel verwenden, meldet der Resolver diese ID als mehrdeutig, statt eine Annahme zu treffen. Überprüfen Sie nach der Aktualisierung der Konfiguration den Resolver-Pfad:

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
    Verwenden Sie einen kleinen Resolver-Wrapper, um SecretRef-IDs direkt `pass`-Einträgen zuzuordnen. Speichern Sie diesen als ausführbare Datei unter einem absoluten Pfad, der die Pfadprüfungen Ihres Exec-Providers besteht, beispielsweise `/usr/local/bin/openclaw-pass-resolver`. Der `#!/usr/bin/env node`-Shebang löst `node` anhand von `PATH` des Resolver-Prozesses auf. Nehmen Sie daher `PATH` in `passEnv` auf. Wenn sich `pass` nicht in diesem `PATH` befindet, legen Sie `PASS_BIN` in der übergeordneten Umgebung fest und nehmen Sie es ebenfalls in `passEnv` auf:

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
        process.stderr.write(`Anfrage konnte nicht analysiert werden: ${err.message}\n`);
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

    Speichern Sie das Geheimnis in der ersten Zeile des `pass`-Eintrags oder passen Sie den Wrapper so an, dass stattdessen die vollständige `pass show`-Ausgabe zurückgegeben wird. Überprüfen Sie nach der Aktualisierung der Konfiguration sowohl das statische Audit als auch den Pfad des Exec-Resolvers:

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

## Umgebungsvariablen des MCP-Servers

Über `plugins.entries.acpx.config.mcpServers` konfigurierte Umgebungsvariablen des MCP-Servers akzeptieren SecretInput, sodass API-Schlüssel und Tokens nicht im Klartext in der Konfiguration gespeichert werden:

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

Zeichenfolgenwerte im Klartext funktionieren weiterhin. Umgebungsvariablen-Vorlagenreferenzen wie `${MCP_SERVER_API_KEY}` und SecretRef-Objekte werden während der Gateway-Aktivierung aufgelöst, bevor der MCP-Serverprozess gestartet wird. Wie bei anderen SecretRef-Oberflächen blockieren nicht aufgelöste Referenzen die Aktivierung nur, wenn das `acpx`-Plugin tatsächlich aktiv ist.

## SSH-Authentifizierungsmaterial für die Sandbox

Das zentrale `ssh`-Sandbox-Backend unterstützt außerdem SecretRefs für SSH-Authentifizierungsmaterial:

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
- Wenn das effektive Sandbox-Backend nicht `ssh` ist (oder der Sandbox-Modus `off` ist), bleiben diese Referenzen inaktiv und blockieren den Start nicht.

## Unterstützte Anmeldedatenoberfläche

Kanonisch unterstützte und nicht unterstützte Anmeldedaten sind unter [SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface) aufgeführt.

<Note>
Zur Laufzeit erzeugte oder rotierende Anmeldedaten sowie OAuth-Aktualisierungsmaterial sind absichtlich von der schreibgeschützten SecretRef-Auflösung ausgeschlossen.
</Note>

## Erforderliches Verhalten und Rangfolge

- Feld ohne Referenz: unverändert.
- Feld mit Referenz: während der Aktivierung auf aktiven Oberflächen erforderlich.
- Wenn sowohl Klartext als auch eine Referenz vorhanden sind, hat die Referenz auf unterstützten Rangfolgepfaden Vorrang.
- Der Schwärzungs-Sentinel `__OPENCLAW_REDACTED__` ist für die interne Schwärzung/Wiederherstellung der Konfiguration reserviert und wird als wörtlich übermittelter Konfigurationswert abgelehnt.

Warn- und Auditsignale:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (Laufzeitwarnung)
- `REF_SHADOWED` (Auditbefund, wenn `auth-profiles.json`-Anmeldedaten Vorrang vor `openclaw.json`-Referenzen haben)

Google Chat `serviceAccount` akzeptiert Inline-JSON oder eine SecretRef. Doctor verschiebt das eingestellte veraltete Geschwisterfeld `serviceAccountRef` in dieses kanonische Feld, wenn dieses nicht gesetzt ist.

## Aktivierungsauslöser

Die Geheimnisaktivierung wird ausgeführt bei:

- Start (Vorprüfung plus abschließende Aktivierung)
- Hot-Apply-Pfad beim erneuten Laden der Konfiguration
- Neustartprüfungspfad beim erneuten Laden der Konfiguration
- Manuellem Neuladen über `secrets.reload`
- Vorprüfung des Gateway-RPC zum Schreiben der Konfiguration (`config.set` / `config.apply` / `config.patch`), wobei SecretRefs aktiver Oberflächen innerhalb der übermittelten Konfigurationsnutzlast validiert werden, bevor Änderungen gespeichert werden

Aktivierungsvertrag:

- Bei Erfolg wird der Snapshot atomar ausgetauscht.
- Ein strikter Startfehler bricht den Start des Gateways ab.
- Während eines Kaltstarts kann bei einem wiederholbaren Auflösungsfehler für einen zugeordneten, isolierbaren Nicht-Gateway-Eigentümer der Snapshot veröffentlicht werden, wobei genau dieser Eigentümer als konfiguriert, aber nicht verfügbar markiert ist. Anfragen an den Eigentümer schlagen mit `SECRET_SURFACE_UNAVAILABLE` fehl; Eigentümer von Modell-Providern greifen nach dem Fehlschlagen einer expliziten Referenz nicht auf Anmeldedaten aus der Umgebung oder aus Authentifizierungsprofilen zurück.
- Neuladen und Neustartprüfung isolieren geeignete zugeordnete Eigentümer. Unveränderte Referenzidentitäten mit unveränderten Providerdefinitionen und einem unveränderten vollständigen, nicht geheimen Eigentümervertrag behalten ihre exakten letzten bekannten funktionsfähigen Werte als veraltet bei; geänderte oder neu konfigurierte, nicht aufgelöste Referenzen werden nur für diesen Eigentümer kalt veröffentlicht. Ein strikter Fehler beim Neuladen behält den zuvor aktiven Snapshot bei.
- `config.set`, `config.apply` und `config.patch` akzeptieren syntaktisch gültige, nicht aufgelöste Referenzen für isolierbare Eigentümer und geben einen geschwärzten `degradedSecretOwners`-Bericht zurück. Gateway-Eingangsauthentifizierung, strukturell ungültige Konfigurationen oder aufgelöste Werte, Richtlinienverstöße und unbekannte Eigentümer werden weiterhin vor einer Datenträgeränderung abgelehnt.
- Funktionsfähige Geschwister-Eigentümer werden normal aufgelöst und veröffentlicht, auch wenn ein anderer Eigentümer kalt oder veraltet ist.
- Die Angabe eines expliziten kanalspezifischen Tokens pro Aufruf bei einem ausgehenden Hilfs-/Tool-Aufruf löst keine SecretRef-Aktivierung aus; die Aktivierungspunkte bleiben Start, Neuladen und explizites `secrets.reload`.

## Signale für beeinträchtigten und wiederhergestellten Zustand

Wenn die Aktivierung während des Neuladens nach einem funktionsfähigen Zustand fehlschlägt, wechselt OpenClaw in einen Zustand mit beeinträchtigten Geheimnissen und gibt einmalige Systemereignisse und Protokollcodes aus:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Verhalten:

- Beeinträchtigt: Funktionsfähige Eigentümer werden aktualisiert, veraltete Eigentümer behalten den letzten bekannten funktionsfähigen Zustand bei und kalte Eigentümer bleiben nicht verfügbar.
- Wiederhergestellt: Wird nach der nächsten erfolgreichen Aktivierung einmal ausgegeben.
- Wiederholte Fehler, während der Zustand bereits beeinträchtigt ist, protokollieren Warnungen, geben das Ereignis jedoch nicht erneut aus.
- Ein strikter Startfehler gibt niemals ein Ereignis für einen beeinträchtigten Zustand aus, da die Laufzeit nie aktiv wurde. Ein erfolgreicher Start mit kalten Eigentümern protokolliert die Beeinträchtigung des Eigentümers, gibt jedoch kein Ereignis des Neuladers aus.
- Referenzbezogene Start- und Neuladefehler geben für jeden betroffenen Eigentümer eine strukturierte `SECRETS_DEGRADED`-Warnung aus. Providerbezogene Ausfälle geben eine `SECRETS_PROVIDER_DEGRADED`-Warnung mit dem Provider und der vollständigen Liste der betroffenen Eigentümer aus, anstatt den Providerfehler für jeden Eigentümer zu wiederholen. Warnungen enthalten einen geschwärzten Grund, den Eigentümerzustand `cold` oder `stale` und den Wiederholungshinweis `openclaw secrets reload`. Sie enthalten niemals aufgelöste Werte oder SecretRef-IDs.
- `openclaw doctor` listet kalte und veraltete Eigentümer mit ihren betroffenen Konfigurationspfaden, einem geschwärzten Grund und Hinweisen zur Wiederholung auf.

## Auflösung von Befehlspfaden

Befehlspfade können sich über einen Gateway-Snapshot-RPC für die unterstützte SecretRef-Auflösung entscheiden. Es gelten zwei allgemeine Verhaltensweisen:

<Tabs>
  <Tab title="Strikte Befehlspfade">
    Beispielsweise `openclaw memory`-Pfade für entfernten Speicher und `openclaw qr --remote`, wenn entfernte Referenzen auf gemeinsam genutzte Geheimnisse benötigt werden. Sie lesen aus dem aktiven Snapshot und schlagen sofort fehl, wenn eine erforderliche SecretRef nicht verfügbar ist.
  </Tab>
  <Tab title="Schreibgeschützte Befehlspfade">
    Beispielsweise `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` sowie schreibgeschützte Doctor-/Konfigurationsreparaturabläufe. Sie bevorzugen ebenfalls den aktiven Snapshot, wechseln jedoch in einen beeinträchtigten Zustand, statt abzubrechen, wenn eine gezielte SecretRef nicht verfügbar ist.

    Schreibgeschütztes Verhalten:

    - Wenn das Gateway ausgeführt wird, lesen diese Befehle zuerst aus dem aktiven Snapshot.
    - Wenn die Gateway-Auflösung unvollständig oder das Gateway nicht verfügbar ist, versuchen sie einen gezielten lokalen Rückgriff für diese Befehlsoberfläche.
    - Wenn eine gezielte SecretRef weiterhin nicht verfügbar ist, wird der Befehl mit beeinträchtigter schreibgeschützter Ausgabe und einer expliziten Diagnose fortgesetzt, dass die Referenz konfiguriert, aber in diesem Befehlspfad nicht verfügbar ist.
    - Dieses beeinträchtigte Verhalten gilt nur lokal für den Befehl; es schwächt weder den Laufzeitstart noch Neulade-, Sende- oder Authentifizierungspfade.

  </Tab>
</Tabs>

Weitere Hinweise:

- Die Snapshot-Aktualisierung nach einer Geheimnisrotation im Backend wird von `openclaw secrets reload` verarbeitet.
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

Betrachten Sie die Migration erst dann als abgeschlossen, wenn die erneute Prüfung keine Befunde ergibt. Wenn das Audit weiterhin gespeicherte Klartextwerte meldet, besteht das Risiko für den Agentenzugriff fort, selbst wenn Laufzeit-APIs geschwärzte Werte zurückgeben.

Wenn Sie während `configure` einen Plan speichern, anstatt ihn anzuwenden, wenden Sie diesen gespeicherten Plan vor der erneuten Prüfung mit `openclaw secrets apply --from <plan-path>` an.

<AccordionGroup>
  <Accordion title="secrets audit">
    Die Befunde umfassen:

    - Gespeicherte Klartextwerte (`openclaw.json`, `auth-profiles.json`, `.env` und generierte `agents/*/agent/models.json`).
    - Klartextreste sensibler Provider-Header in generierten `models.json`-Einträgen.
    - Nicht aufgelöste Referenzen.
    - Überschattung durch Rangfolge (`auth-profiles.json` hat Vorrang vor `openclaw.json`-Referenzen).
    - Altlasten (`auth.json`, OAuth-Erinnerungen).

    Hinweis zu Exec: Standardmäßig überspringt das Audit die Auflösbarkeitsprüfungen für Exec-SecretRefs, um Nebenwirkungen von Befehlen zu vermeiden. Verwenden Sie `openclaw secrets audit --allow-exec`, um Exec-Provider während des Audits auszuführen.

    Hinweis zu Header-Resten: Die Erkennung sensibler Provider-Header basiert auf Namensheuristiken (gängige Namen und Fragmente von Authentifizierungs-/Anmeldedaten-Headern wie `authorization`, `x-api-key`, `token`, `secret`, `password` und `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Interaktive Hilfe mit folgenden Funktionen:

    - Konfiguriert zuerst `secrets.providers` (`env`/`file`/`exec`, hinzufügen/bearbeiten/entfernen).
    - Ermöglicht die Auswahl unterstützter geheimnistragender Felder in `openclaw.json` sowie `auth-profiles.json` für einen Agentenbereich.
    - Kann direkt in der Zielauswahl eine neue `auth-profiles.json`-Zuordnung erstellen.
    - Erfasst SecretRef-Details (`source`, `provider`, `id`).
    - Führt die Vorabauflösung aus und kann sofort anwenden.

    Hinweis zu Exec: Die Vorprüfung überspringt Prüfungen von Exec-SecretRefs, sofern `--allow-exec` nicht gesetzt ist. Wenn Sie direkt aus `configure --apply` anwenden und der Plan Exec-Referenzen/-Provider enthält, lassen Sie `--allow-exec` auch für den Anwendungsschritt gesetzt.

    Hilfreiche Modi:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Standardwerte für die Anwendung mit `configure`:

    - Entfernt passende statische Anmeldedaten für die ausgewählten Provider aus `auth-profiles.json`.
    - Entfernt veraltete statische `api_key`-Einträge aus `auth.json`.
    - Entfernt passende bekannte Geheimniszeilen aus den `.env`-Dateien des effektiven Zustands und der aktiven Konfiguration (dedupliziert, wenn beide Pfade übereinstimmen).

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
OpenClaw schreibt absichtlich keine Rollback-Sicherungen, die historische Klartextwerte von Geheimnissen enthalten.
</Warning>

Sicherheitsmodell:

- Die Vorprüfung muss vor dem Schreibmodus erfolgreich sein.
- Die Laufzeitaktivierung wird vor dem Commit validiert.
- Beim Anwenden werden Dateien durch atomaren Dateiaustausch aktualisiert und bei einem Fehler nach bestem Bemühen wiederhergestellt.

## Hinweise zur Kompatibilität mit veralteter Authentifizierung

Bei statischen Anmeldedaten hängt die Laufzeit nicht mehr von der veralteten Klartextspeicherung für die Authentifizierung ab.

- Die Quelle der Laufzeitanmeldedaten ist der aufgelöste In-Memory-Snapshot.
- Veraltete statische `api_key`-Einträge werden entfernt, wenn sie erkannt werden.
- OAuth-bezogenes Kompatibilitätsverhalten bleibt davon getrennt.

## Hinweis zur Webbenutzeroberfläche

Einige SecretInput-Unions lassen sich im Rohbearbeitungsmodus einfacher konfigurieren als im Formularmodus.

## Verwandte Themen

- [Authentifizierung](/de/gateway/authentication) - Authentifizierung einrichten
- [CLI: Geheimnisse](/de/cli/secrets) - CLI-Befehle
- [Vault SecretRefs](/de/plugins/vault) - HashiCorp-Vault-Provider einrichten
- [Umgebungsvariablen](/de/help/environment) - Rangfolge der Umgebungsvariablen
- [SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface) - Anmeldedatenoberfläche
- [Vertrag für den Plan zur Anwendung von Geheimnissen](/de/gateway/secrets-plan-contract) - Details zum Planvertrag
- [Sicherheit](/de/gateway/security) - Sicherheitskonzept
