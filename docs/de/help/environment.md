---
read_when:
    - Sie müssen wissen, welche Umgebungsvariablen in welcher Reihenfolge geladen werden.
    - Sie beheben fehlende API-Schlüssel im Gateway.
    - Sie dokumentieren Provider-Authentifizierung oder Bereitstellungsumgebungen
summary: Wo OpenClaw Umgebungsvariablen lädt und welche Prioritätsreihenfolge gilt
title: Umgebungsvariablen
x-i18n:
    generated_at: "2026-07-12T15:30:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e0010465008969ea1ebf7bb79d01ee86b7be20f7b6d0d90da72d8b0a3b1ed273
    source_path: help/environment.md
    workflow: 16
---

OpenClaw bezieht Umgebungsvariablen aus mehreren Quellen. Dabei gilt die Regel: **Vorhandene Werte niemals überschreiben**.
`.env`-Dateien im Workspace sind eine Quelle mit geringerem Vertrauensniveau: OpenClaw ignoriert Provider-Anmeldedaten und geschützte Laufzeitsteuerungen aus der `.env` des Workspace, bevor die Rangfolge angewendet wird.

## Rangfolge (höchste bis niedrigste)

1. **Prozessumgebung** (was der Gateway-Prozess bereits von der übergeordneten Shell bzw. dem Daemon übernommen hat).
2. **`.env` im aktuellen Arbeitsverzeichnis** (dotenv-Standard; überschreibt nicht; Provider-Anmeldedaten und geschützte Laufzeitsteuerungen werden ignoriert).
3. **Globale `.env`** unter `~/.openclaw/.env` (auch `$OPENCLAW_STATE_DIR/.env`; für Provider-API-Schlüssel empfohlen; überschreibt nicht).
4. **Konfigurationsblock `env`** in `~/.openclaw/openclaw.json` (wird nur bei fehlenden Werten angewendet).
5. **Optionaler Import aus der Anmelde-Shell** (`env.shellEnv.enabled` oder `OPENCLAW_LOAD_SHELL_ENV=1`), der nur auf fehlende erwartete Schlüssel angewendet wird.

Bei neuen Ubuntu-Installationen, die das standardmäßige Zustandsverzeichnis verwenden, behandelt OpenClaw außerdem `~/.config/openclaw/gateway.env` nach der globalen `.env` als Kompatibilitäts-Fallback. Wenn beide Dateien vorhanden sind und voneinander abweichen, behält OpenClaw `~/.openclaw/.env` bei und gibt eine Warnung aus.

Wenn die Konfigurationsdatei vollständig fehlt, wird Schritt 4 übersprungen; der Shell-Import wird weiterhin ausgeführt, sofern er aktiviert ist.

## Provider-Anmeldedaten und die `.env` des Workspace

Bewahren Sie Provider-API-Schlüssel nicht ausschließlich in einer `.env` des Workspace auf. OpenClaw blockiert zahlreiche Schlüssel für Provider-Anmeldedaten und Endpunktumleitungen aus `.env`-Dateien im Workspace, darunter alle bekannten Umgebungsvariablen für die Provider-Authentifizierung (zum Beispiel `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`), außerdem alle Schlüssel, die auf `_API_HOST`, `_BASE_URL` oder `_HOMESERVER` enden, sowie die vollständigen Namensräume `OPENCLAW_*`, `CLAWHUB_*`, `ANTHROPIC_API_KEY_*` und `OPENAI_API_KEY_*`.

Verwenden Sie für Provider-Anmeldedaten stattdessen eine der folgenden vertrauenswürdigen Quellen:

- Die Prozessumgebung des Gateway, beispielsweise eine Shell, eine launchd-/systemd-Unit, ein Container-Secret oder ein CI-Secret.
- Die globale dotenv-Laufzeitdatei unter `~/.openclaw/.env` oder `$OPENCLAW_STATE_DIR/.env`.
- Den Konfigurationsblock `env` in `~/.openclaw/openclaw.json`.
- Den optionalen Import aus der Anmelde-Shell, wenn `env.shellEnv.enabled` oder `OPENCLAW_LOAD_SHELL_ENV=1` aktiviert ist.

Wenn Sie Provider-Schlüssel zuvor ausschließlich in einer `.env` des Workspace gespeichert haben, verschieben Sie sie in eine der oben genannten vertrauenswürdigen Quellen. Die `.env` des Workspace kann weiterhin gewöhnliche Projektvariablen bereitstellen, bei denen es sich nicht um Anmeldedaten, Endpunktumleitungen, Host-Überschreibungen oder `OPENCLAW_*`-Laufzeitsteuerungen handelt.

Die Sicherheitsbegründung finden Sie unter [`.env`-Dateien im Workspace](/de/gateway/security#workspace-env-files).

## Konfigurationsblock `env`

Es gibt zwei gleichwertige Möglichkeiten, eingebettete Umgebungsvariablen festzulegen (beide überschreiben keine vorhandenen Werte):

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

Der Konfigurationsblock `env` akzeptiert ausschließlich literale Zeichenfolgenwerte. Er expandiert keine
`file:...`-Werte; beispielsweise wird `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
genau als diese Zeichenfolge an Provider übergeben.

Verwenden Sie für dateibasierte Provider-Schlüssel eine SecretRef im Anmeldedatenfeld, das
dies unterstützt:

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

Unter [Secret-Verwaltung](/de/gateway/secrets) und auf der
[SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface) finden Sie die
unterstützten Felder.

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
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000` (Standardwert `15000`)

## Shell-Snapshots für Exec

Auf Nicht-Windows-Gateway-Hosts verwenden bash- und zsh-`exec`-Befehle standardmäßig einen Start-Snapshot.
Legen Sie `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` in der Prozessumgebung des Gateway fest, um diesen Pfad zu deaktivieren.
Die Werte `false`, `no` und `off` deaktivieren ihn ebenfalls. Aufrufspezifische `exec.env`-Werte können
Snapshots weder umschalten noch den Snapshot-Cache umleiten.

## Zur Laufzeit injizierte Umgebungsvariablen

OpenClaw injiziert außerdem Kontextmarkierungen in gestartete untergeordnete Prozesse:

- `OPENCLAW_SHELL=exec`: wird für Befehle festgelegt, die über das Tool `exec` ausgeführt werden.
- `OPENCLAW_SHELL=acp-client`: wird für `openclaw acp client` festgelegt, wenn es den ACP-Bridge-Prozess startet.
- `OPENCLAW_SHELL=tui-local`: wird für lokale TUI-Shell-Befehle mit `!` festgelegt.
- `OPENCLAW_CLI=1`: wird für untergeordnete Prozesse festgelegt, die vom CLI-Einstiegspunkt gestartet werden.

Dies sind Laufzeitmarkierungen (keine erforderliche Benutzerkonfiguration). Sie können in der Shell-/Profillogik verwendet werden,
um kontextspezifische Regeln anzuwenden.

## Umgebungsvariablen der Benutzeroberfläche

- `OPENCLAW_THEME=light`: erzwingt die helle TUI-Palette, wenn Ihr Terminal einen hellen Hintergrund hat.
- `OPENCLAW_THEME=dark`: erzwingt die dunkle TUI-Palette.
- `COLORFGBG`: Wenn Ihr Terminal diese Variable exportiert, verwendet OpenClaw den Hinweis zur Hintergrundfarbe, um die TUI-Palette automatisch auszuwählen.

## Ersetzung von Umgebungsvariablen in der Konfiguration

Sie können Umgebungsvariablen in Zeichenfolgenwerten der Konfiguration mit der Syntax `${VAR_NAME}` direkt referenzieren:

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

OpenClaw unterstützt zwei umgebungsbasierte Muster:

- `${VAR}`-Zeichenfolgenersetzung in Konfigurationswerten.
- SecretRef-Objekte (`{ source: "env", provider: "default", id: "VAR" }`) für Felder, die Secret-Referenzen unterstützen.

Beide werden zum Aktivierungszeitpunkt aus der Prozessumgebung aufgelöst. Einzelheiten zu SecretRef sind unter [Secret-Verwaltung](/de/gateway/secrets) dokumentiert.
Der Konfigurationsblock `env` selbst löst weder SecretRefs noch abgekürzte
`file:...`-Werte auf.

## Pfadbezogene Umgebungsvariablen

| Variable                 | Zweck                                                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Überschreibt das für interne OpenClaw-Pfadstandardwerte verwendete Home-Verzeichnis (`~/.openclaw/`, Agent-Verzeichnisse, Sitzungen, Anmeldedaten, Installer-Onboarding und den standardmäßigen Entwicklungs-Checkout). Nützlich, wenn OpenClaw als dedizierter Dienstbenutzer ausgeführt wird. |
| `OPENCLAW_STATE_DIR`     | Überschreibt das Zustandsverzeichnis (Standardwert `~/.openclaw`).                                                                                                                                                                                   |
| `OPENCLAW_CONFIG_PATH`   | Überschreibt den Pfad der Konfigurationsdatei (Standardwert `~/.openclaw/openclaw.json`).                                                                                                                                                                    |
| `OPENCLAW_INCLUDE_ROOTS` | Pfadliste der Verzeichnisse, in denen `$include`-Direktiven Dateien außerhalb des Konfigurationsverzeichnisses auflösen dürfen (Standardwert: keine – `$include` ist auf das Konfigurationsverzeichnis beschränkt). Tilden werden expandiert.                                                         |

## Protokollierung

| Variable                         | Zweck                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Überschreibt die Protokollierungsstufe sowohl für Datei als auch Konsole (z. B. `debug`, `trace`). Hat Vorrang vor `logging.level` und `logging.consoleLevel` in der Konfiguration. Ungültige Werte werden mit einer Warnung ignoriert. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Gibt gezielte Diagnoseinformationen zur zeitlichen Abfolge von Modellanfragen und -antworten auf der Stufe `info` aus, ohne globale Debug-Protokolle zu aktivieren.                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnose für Modellnutzlasten: `summary`, `tools` oder `full-redacted`. `full-redacted` ist größenbegrenzt und geschwärzt, kann jedoch Prompt-/Nachrichtentext enthalten.                                               |
| `OPENCLAW_DEBUG_SSE`             | Streaming-Diagnose: `events` für die zeitliche Abfolge von erstem/abschließendem Ereignis, `peek`, um die ersten fünf geschwärzten SSE-Ereignisse einzubeziehen.                                                                                 |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnose der Modelloberfläche im Code-Modus, einschließlich des Ausblendens von Provider-Tools sowie kompakter Steuerung und direkter Durchsetzung.                                                                                  |

### `OPENCLAW_HOME`

Wenn `OPENCLAW_HOME` festgelegt ist, ersetzt es das Home-Verzeichnis des Systems (`$HOME` / `os.homedir()`) für interne OpenClaw-Pfadstandardwerte. Dazu gehören das standardmäßige Zustandsverzeichnis, der Konfigurationspfad, Agent-Verzeichnisse, Anmeldedaten, der Onboarding-Workspace des Installers und der standardmäßige Entwicklungs-Checkout, den `openclaw update --channel dev` verwendet.

**Rangfolge:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > Termux-`PREFIX`-Home-Fallback unter Android > `os.homedir()`

**Beispiel** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` kann auch auf einen Tildenpfad (z. B. `~/svc`) gesetzt werden, der vor der Verwendung anhand derselben OS-Home-Fallback-Kette expandiert wird.

Explizite Pfadvariablen wie `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` und `OPENCLAW_GIT_DIR` haben weiterhin Vorrang. Aufgaben im Zusammenhang mit dem Betriebssystemkonto, etwa die Erkennung von Shell-Startdateien, die Einrichtung des Paketmanagers und die Host-Expansion von `~`, können weiterhin das tatsächliche Home-Verzeichnis des Systems verwenden.

## nvm-Benutzer: TLS-Fehler bei web_fetch

Wenn Node.js über **nvm** (und nicht über den Paketmanager des Systems) installiert wurde, verwendet das integrierte `fetch()`
den mit nvm gebündelten CA-Speicher, in dem möglicherweise moderne Stammzertifizierungsstellen fehlen (ISRG Root X1/X2 für Let's Encrypt,
DigiCert Global Root G2 usw.). Dadurch schlägt `web_fetch` auf den meisten HTTPS-Websites mit `"fetch failed"` fehl.

Unter Linux erkennt OpenClaw nvm automatisch und wendet die Korrektur in der tatsächlichen Startumgebung an:

- `openclaw gateway install` schreibt `NODE_EXTRA_CA_CERTS` in die Umgebung des systemd-Dienstes
- der CLI-Einstiegspunkt `openclaw` führt sich vor dem Start von Node erneut mit gesetztem `NODE_EXTRA_CA_CERTS` aus

**Manuelle Korrektur (für ältere Versionen oder direkte Starts mit `node ...`):**

Exportieren Sie die Variable, bevor Sie OpenClaw starten:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Verlassen Sie sich bei dieser Variable nicht darauf, sie ausschließlich in `~/.openclaw/.env` einzutragen; Node liest
`NODE_EXTRA_CA_CERTS` beim Prozessstart.

## Veraltete Umgebungsvariablen

OpenClaw liest ausschließlich `OPENCLAW_*`-Umgebungsvariablen. Die veralteten Präfixe
`CLAWDBOT_*` und `MOLTBOT_*` aus früheren Versionen werden stillschweigend
ignoriert.

Wenn beim Start des Gateway-Prozesses noch solche Variablen festgelegt sind, gibt OpenClaw eine
einzelne Node-Veraltungswarnung (`OPENCLAW_LEGACY_ENV_VARS`) aus, in der die
erkannten Präfixe und deren Gesamtanzahl aufgeführt sind. Benennen Sie jeden Wert um, indem Sie das
veraltete Präfix durch `OPENCLAW_` ersetzen (beispielsweise `CLAWDBOT_GATEWAY_TOKEN` durch
`OPENCLAW_GATEWAY_TOKEN`); die alten Namen haben keine Wirkung.

## Verwandte Themen

- [Gateway-Konfiguration](/de/gateway/configuration)
- [FAQ: Umgebungsvariablen und Laden von .env-Dateien](/de/help/faq#env-vars-and-env-loading)
- [Modellübersicht](/de/concepts/models)
