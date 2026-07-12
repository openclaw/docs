---
read_when:
    - Sie müssen wissen, welche Umgebungsvariablen in welcher Reihenfolge geladen werden
    - Sie beheben fehlende API-Schlüssel im Gateway.
    - Sie dokumentieren die Provider-Authentifizierung oder Bereitstellungsumgebungen
summary: Wo OpenClaw Umgebungsvariablen lädt und welche Rangfolge gilt
title: Umgebungsvariablen
x-i18n:
    generated_at: "2026-07-12T01:44:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0010465008969ea1ebf7bb79d01ee86b7be20f7b6d0d90da72d8b0a3b1ed273
    source_path: help/environment.md
    workflow: 16
---

OpenClaw lädt Umgebungsvariablen aus mehreren Quellen. Dabei gilt die Regel: **Vorhandene Werte niemals überschreiben**.
`.env`-Dateien im Workspace sind eine weniger vertrauenswürdige Quelle: OpenClaw ignoriert Provider-Anmeldedaten und geschützte Laufzeitsteuerungen aus der `.env`-Datei des Workspace, bevor die Rangfolge angewendet wird.

## Rangfolge (höchste bis niedrigste Priorität)

1. **Prozessumgebung** (die Umgebung, die der Gateway-Prozess bereits von der übergeordneten Shell bzw. dem Daemon übernommen hat).
2. **`.env` im aktuellen Arbeitsverzeichnis** (dotenv-Standard; überschreibt nichts; Provider-Anmeldedaten und geschützte Laufzeitsteuerungen werden ignoriert).
3. **Globale `.env`** unter `~/.openclaw/.env` (auch `$OPENCLAW_STATE_DIR/.env`; für Provider-API-Schlüssel empfohlen; überschreibt nichts).
4. **Konfigurationsblock `env`** in `~/.openclaw/openclaw.json` (wird nur bei fehlenden Werten angewendet).
5. **Optionaler Import aus der Anmelde-Shell** (`env.shellEnv.enabled` oder `OPENCLAW_LOAD_SHELL_ENV=1`), der nur für fehlende erwartete Schlüssel angewendet wird.

Bei neuen Ubuntu-Installationen, die das standardmäßige Zustandsverzeichnis verwenden, behandelt OpenClaw außerdem `~/.config/openclaw/gateway.env` nach der globalen `.env` als Kompatibilitätsrückfall. Wenn beide Dateien vorhanden sind und voneinander abweichen, behält OpenClaw die Werte aus `~/.openclaw/.env` bei und gibt eine Warnung aus.

Wenn die Konfigurationsdatei vollständig fehlt, wird Schritt 4 übersprungen; der Shell-Import wird weiterhin ausgeführt, sofern er aktiviert ist.

## Provider-Anmeldedaten und Workspace-`.env`

Bewahren Sie Provider-API-Schlüssel nicht ausschließlich in einer Workspace-`.env` auf. OpenClaw blockiert eine umfangreiche Menge von Schlüsseln für Provider-Anmeldedaten und Endpunktumleitungen aus Workspace-`.env`-Dateien. Dazu gehören alle bekannten Umgebungsvariablen für die Provider-Authentifizierung (beispielsweise `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`), alle Schlüssel mit der Endung `_API_HOST`, `_BASE_URL` oder `_HOMESERVER` sowie die vollständigen Namensräume `OPENCLAW_*`, `CLAWHUB_*`, `ANTHROPIC_API_KEY_*` und `OPENAI_API_KEY_*`.

Verwenden Sie für Provider-Anmeldedaten stattdessen eine der folgenden vertrauenswürdigen Quellen:

- Die Prozessumgebung des Gateway, beispielsweise eine Shell, eine launchd-/systemd-Unit, ein Container-Secret oder ein CI-Secret.
- Die globale dotenv-Laufzeitdatei unter `~/.openclaw/.env` oder `$OPENCLAW_STATE_DIR/.env`.
- Den Konfigurationsblock `env` in `~/.openclaw/openclaw.json`.
- Den optionalen Import aus der Anmelde-Shell, wenn `env.shellEnv.enabled` oder `OPENCLAW_LOAD_SHELL_ENV=1` aktiviert ist.

Wenn Sie Provider-Schlüssel bisher ausschließlich in einer Workspace-`.env` gespeichert haben, verschieben Sie sie in eine der oben genannten vertrauenswürdigen Quellen. Eine Workspace-`.env` kann weiterhin gewöhnliche Projektvariablen bereitstellen, sofern es sich nicht um Anmeldedaten, Endpunktumleitungen, Host-Überschreibungen oder `OPENCLAW_*`-Laufzeitsteuerungen handelt.

Die Sicherheitsbegründung finden Sie unter [Workspace-`.env`-Dateien](/de/gateway/security#workspace-env-files).

## Konfigurationsblock `env`

Es gibt zwei gleichwertige Möglichkeiten, Umgebungsvariablen direkt festzulegen (beide überschreiben keine vorhandenen Werte):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

Der Konfigurationsblock `env` akzeptiert ausschließlich literale Zeichenfolgenwerte. Er löst
`file:...`-Werte nicht auf; beispielsweise wird `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
genau als diese Zeichenfolge an Provider übergeben.

Verwenden Sie für dateibasierte Provider-Schlüssel eine SecretRef im Anmeldedatenfeld, das
diese unterstützt:

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

Unterstützte Felder finden Sie unter [Secret-Verwaltung](/de/gateway/secrets) und auf der
[SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface).

## Import der Shell-Umgebung

`env.shellEnv` führt Ihre Anmelde-Shell aus und importiert ausschließlich **fehlende** erwartete Schlüssel:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

Entsprechende Umgebungsvariablen:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000` (Standardwert: `15000`)

## Snapshots der Ausführungs-Shell

Auf Gateway-Hosts, die nicht Windows verwenden, nutzen `exec`-Befehle von bash und zsh standardmäßig einen Start-Snapshot.
Legen Sie `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` in der Prozessumgebung des Gateway fest, um diesen Pfad zu deaktivieren.
Auch die Werte `false`, `no` und `off` deaktivieren ihn. Aufrufspezifische `exec.env`-Werte können
Snapshots weder umschalten noch den Snapshot-Cache umleiten.

## Zur Laufzeit eingefügte Umgebungsvariablen

OpenClaw fügt außerdem Kontextmarkierungen in gestartete Kindprozesse ein:

- `OPENCLAW_SHELL=exec`: wird für Befehle festgelegt, die über das Werkzeug `exec` ausgeführt werden.
- `OPENCLAW_SHELL=acp-client`: wird für `openclaw acp client` festgelegt, wenn der ACP-Brückenprozess gestartet wird.
- `OPENCLAW_SHELL=tui-local`: wird für lokale TUI-Shell-Befehle mit `!` festgelegt.
- `OPENCLAW_CLI=1`: wird für Kindprozesse festgelegt, die vom CLI-Einstiegspunkt gestartet werden.

Dies sind Laufzeitmarkierungen (keine erforderliche Benutzerkonfiguration). Sie können in der Shell-/Profillogik verwendet werden,
um kontextspezifische Regeln anzuwenden.

## Umgebungsvariablen der Benutzeroberfläche

- `OPENCLAW_THEME=light`: erzwingt die helle TUI-Farbpalette, wenn Ihr Terminal einen hellen Hintergrund hat.
- `OPENCLAW_THEME=dark`: erzwingt die dunkle TUI-Farbpalette.
- `COLORFGBG`: Wenn Ihr Terminal diese Variable exportiert, verwendet OpenClaw den Hinweis zur Hintergrundfarbe, um die TUI-Farbpalette automatisch auszuwählen.

## Ersetzung von Umgebungsvariablen in der Konfiguration

Sie können mit der Syntax `${VAR_NAME}` direkt auf Umgebungsvariablen in Zeichenfolgenwerten der Konfiguration verweisen:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

Ausführliche Informationen finden Sie unter [Konfiguration: Ersetzung von Umgebungsvariablen](/de/gateway/configuration-reference#env-var-substitution).

## Secret-Referenzen im Vergleich zu `${ENV}`-Zeichenfolgen

OpenClaw unterstützt zwei auf Umgebungsvariablen basierende Muster:

- `${VAR}`-Zeichenfolgenersetzung in Konfigurationswerten.
- SecretRef-Objekte (`{ source: "env", provider: "default", id: "VAR" }`) für Felder, die Secret-Referenzen unterstützen.

Beide werden bei der Aktivierung anhand der Prozessumgebung aufgelöst. Einzelheiten zu SecretRef sind unter [Secret-Verwaltung](/de/gateway/secrets) dokumentiert.
Der Konfigurationsblock `env` selbst löst weder SecretRefs noch
`file:...`-Kurzschreibweisen auf.

## Pfadbezogene Umgebungsvariablen

| Variable                 | Zweck                                                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Überschreibt das Home-Verzeichnis, das für interne OpenClaw-Standardpfade verwendet wird (`~/.openclaw/`, Agentenverzeichnisse, Sitzungen, Anmeldedaten, Installer-Einrichtung und der standardmäßige Entwicklungs-Checkout). Nützlich, wenn OpenClaw unter einem dedizierten Dienstbenutzer ausgeführt wird. |
| `OPENCLAW_STATE_DIR`     | Überschreibt das Zustandsverzeichnis (Standardwert: `~/.openclaw`).                                                                                                                                                                    |
| `OPENCLAW_CONFIG_PATH`   | Überschreibt den Pfad der Konfigurationsdatei (Standardwert: `~/.openclaw/openclaw.json`).                                                                                                                                              |
| `OPENCLAW_INCLUDE_ROOTS` | Pfadliste der Verzeichnisse, aus denen `$include`-Direktiven Dateien außerhalb des Konfigurationsverzeichnisses auflösen dürfen (Standardwert: keine – `$include` ist auf das Konfigurationsverzeichnis beschränkt). Tilden werden expandiert. |

## Protokollierung

| Variable                         | Zweck                                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_LOG_LEVEL`             | Überschreibt die Protokollierungsstufe für Datei und Konsole (z. B. `debug`, `trace`). Hat Vorrang vor `logging.level` und `logging.consoleLevel` in der Konfiguration. Ungültige Werte werden mit einer Warnung ignoriert. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Gibt gezielte Zeitdiagnosen für Modellanforderungen und -antworten auf der Stufe `info` aus, ohne globale Debug-Protokolle zu aktivieren.                                                   |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnose der Modellnutzdaten: `summary`, `tools` oder `full-redacted`. `full-redacted` ist begrenzt und redigiert, kann jedoch Prompt- oder Nachrichtentext enthalten.                     |
| `OPENCLAW_DEBUG_SSE`             | Streaming-Diagnose: `events` für Zeitmessungen des ersten und des abschließenden Ereignisses, `peek` zum Einbeziehen der ersten fünf redigierten SSE-Ereignisse.                           |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnose der Modelloberfläche im Code-Modus, einschließlich des Ausblendens von Provider-Werkzeugen und der kompakten Durchsetzung von Steuerungs- bzw. Direktvorgaben.                   |

### `OPENCLAW_HOME`

Wenn `OPENCLAW_HOME` festgelegt ist, ersetzt es das Home-Verzeichnis des Systems (`$HOME` / `os.homedir()`) für interne OpenClaw-Standardpfade. Dies umfasst das standardmäßige Zustandsverzeichnis, den Konfigurationspfad, Agentenverzeichnisse, Anmeldedaten, den Einrichtungs-Workspace des Installers und den standardmäßigen Entwicklungs-Checkout, den `openclaw update --channel dev` verwendet.

**Rangfolge:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > Termux-`PREFIX`-Home-Rückfall unter Android > `os.homedir()`

**Beispiel** (macOS-LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` kann auch auf einen Pfad mit Tilde gesetzt werden (z. B. `~/svc`). Dieser wird vor der Verwendung über dieselbe Rückfallkette für das Betriebssystem-Home-Verzeichnis expandiert.

Explizite Pfadvariablen wie `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` und `OPENCLAW_GIT_DIR` haben weiterhin Vorrang. Aufgaben des Betriebssystemkontos wie die Erkennung von Shell-Startdateien, die Einrichtung des Paketmanagers und die Expansion von `~` auf dem Host können weiterhin das tatsächliche System-Home-Verzeichnis verwenden.

## nvm-Benutzer: TLS-Fehler bei web_fetch

Wenn Node.js über **nvm** und nicht über den Systempaketmanager installiert wurde, verwendet das integrierte `fetch()`
den mit nvm gebündelten CA-Speicher, in dem möglicherweise moderne Stammzertifizierungsstellen fehlen (ISRG Root X1/X2 für Let's Encrypt,
DigiCert Global Root G2 usw.). Dadurch schlägt `web_fetch` auf den meisten HTTPS-Websites mit `"fetch failed"` fehl.

Unter Linux erkennt OpenClaw nvm automatisch und wendet die Korrektur in der tatsächlichen Startumgebung an:

- `openclaw gateway install` schreibt `NODE_EXTRA_CA_CERTS` in die Umgebung des systemd-Dienstes.
- Der CLI-Einstiegspunkt `openclaw` führt sich vor dem Start von Node erneut mit gesetztem `NODE_EXTRA_CA_CERTS` aus.

**Manuelle Korrektur (für ältere Versionen oder direkte Aufrufe mit `node ...`):**

Exportieren Sie die Variable, bevor Sie OpenClaw starten:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Verlassen Sie sich für diese Variable nicht darauf, sie ausschließlich in `~/.openclaw/.env` zu schreiben; Node liest
`NODE_EXTRA_CA_CERTS` beim Prozessstart.

## Veraltete Umgebungsvariablen

OpenClaw liest ausschließlich `OPENCLAW_*`-Umgebungsvariablen. Die veralteten Präfixe
`CLAWDBOT_*` und `MOLTBOT_*` aus früheren Versionen werden stillschweigend
ignoriert.

Wenn beim Start des Gateway-Prozesses noch solche Variablen festgelegt sind, gibt OpenClaw eine
einzelne Node-Veraltungswarnung (`OPENCLAW_LEGACY_ENV_VARS`) aus, in der die
erkannten Präfixe und deren Gesamtanzahl aufgeführt werden. Benennen Sie jeden Wert um, indem Sie das
veraltete Präfix durch `OPENCLAW_` ersetzen (beispielsweise `CLAWDBOT_GATEWAY_TOKEN` durch
`OPENCLAW_GATEWAY_TOKEN`); die alten Namen haben keine Wirkung.

## Verwandte Themen

- [Gateway-Konfiguration](/de/gateway/configuration)
- [Häufig gestellte Fragen: Umgebungsvariablen und Laden von .env-Dateien](/de/help/faq#env-vars-and-env-loading)
- [Modellübersicht](/de/concepts/models)
