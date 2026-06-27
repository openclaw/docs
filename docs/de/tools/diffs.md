---
read_when:
    - Sie möchten, dass Agents Code- oder Markdown-Änderungen als Diffs anzeigen
    - Sie möchten eine canvas-fertige Viewer-URL oder eine gerenderte Diff-Datei
    - Sie benötigen kontrollierte, temporäre Diff-Artefakte mit sicheren Standardeinstellungen
sidebarTitle: Diffs
summary: Schreibgeschützter Diff-Viewer und Datei-Renderer für Agenten (optionales Plugin-Tool)
title: Unterschiede
x-i18n:
    generated_at: "2026-06-27T18:16:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea3d8e9e026e10b2f3658b795c07ea21062896ab0d45a8cb2dc7e0e9ed9aa658
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` ist ein optionales Plugin-Tool mit kurzer integrierter Systemanleitung und einem zugehörigen Skill, der Änderungsinhalte in ein schreibgeschütztes Diff-Artefakt für Agenten umwandelt.

Es akzeptiert entweder:

- `before`- und `after`-Text
- einen vereinheitlichten `patch`

Es kann Folgendes zurückgeben:

- eine Gateway-Viewer-URL für die Canvas-Darstellung
- einen gerenderten Dateipfad (PNG oder PDF) für die Nachrichtenzustellung
- beide Ausgaben in einem Aufruf

Wenn aktiviert, stellt das Plugin eine knappe Nutzungsanleitung im System-Prompt-Bereich voran und stellt außerdem einen ausführlichen Skill für Fälle bereit, in denen der Agent vollständigere Anweisungen benötigt.

## Schnellstart

<Steps>
  <Step title="Plugin installieren">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Plugin aktivieren">
    ```json5
    {
      plugins: {
        entries: {
          diffs: {
            enabled: true,
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Modus auswählen">
    <Tabs>
      <Tab title="Anzeigen">
        Canvas-zentrierte Abläufe: Agenten rufen `diffs` mit `mode: "view"` auf und öffnen `details.viewerUrl` mit `canvas present`.
      </Tab>
      <Tab title="Datei">
        Chat-Dateizustellung: Agenten rufen `diffs` mit `mode: "file"` auf und senden `details.filePath` mit `message` unter Verwendung von `path` oder `filePath`.
      </Tab>
      <Tab title="Beides">
        Kombiniert: Agenten rufen `diffs` mit `mode: "both"` auf, um beide Artefakte in einem Aufruf zu erhalten.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Integrierte Systemanleitung deaktivieren

Wenn Sie das Tool `diffs` aktiviert lassen, aber seine integrierte System-Prompt-Anleitung deaktivieren möchten, setzen Sie `plugins.entries.diffs.hooks.allowPromptInjection` auf `false`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

Dies blockiert den Hook `before_prompt_build` des diffs-Plugins, während Plugin, Tool und zugehöriger Skill verfügbar bleiben.

Wenn Sie sowohl die Anleitung als auch das Tool deaktivieren möchten, deaktivieren Sie stattdessen das Plugin.

## Typischer Agenten-Workflow

<Steps>
  <Step title="diffs aufrufen">
    Der Agent ruft das Tool `diffs` mit Eingaben auf.
  </Step>
  <Step title="Details lesen">
    Der Agent liest `details`-Felder aus der Antwort.
  </Step>
  <Step title="Präsentieren">
    Der Agent öffnet entweder `details.viewerUrl` mit `canvas present`, sendet `details.filePath` mit `message` unter Verwendung von `path` oder `filePath` oder führt beides aus.
  </Step>
</Steps>

## Eingabebeispiele

<Tabs>
  <Tab title="Vorher und nachher">
    ```json
    {
      "before": "# Hello\n\nOne",
      "after": "# Hello\n\nTwo",
      "path": "docs/example.md",
      "mode": "view"
    }
    ```
  </Tab>
  <Tab title="Patch">
    ```json
    {
      "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
      "mode": "both"
    }
    ```
  </Tab>
</Tabs>

## Referenz für Tool-Eingaben

Alle Felder sind optional, sofern nicht anders angegeben.

<ParamField path="before" type="string">
  Ursprünglicher Text. Erforderlich mit `after`, wenn `patch` weggelassen wird.
</ParamField>
<ParamField path="after" type="string">
  Aktualisierter Text. Erforderlich mit `before`, wenn `patch` weggelassen wird.
</ParamField>
<ParamField path="patch" type="string">
  Vereinheitlichter Diff-Text. Schließt sich gegenseitig mit `before` und `after` aus.
</ParamField>
<ParamField path="path" type="string">
  Anzuzeigender Dateiname für den Vorher-und-nachher-Modus.
</ParamField>
<ParamField path="lang" type="string">
  Hinweis zum Überschreiben der Sprache für den Vorher-und-nachher-Modus. Unbekannte Werte und Sprachen außerhalb des Standard-Viewer-Sets fallen auf Nur-Text zurück, sofern das
  Diff Viewer Language Pack plugin nicht installiert ist.
</ParamField>

<ParamField path="title" type="string">
  Überschreibung des Viewer-Titels.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Ausgabemodus. Standardmäßig der Plugin-Standardwert `defaults.mode`. Veralteter Alias: `"image"` verhält sich wie `"file"` und wird aus Gründen der Abwärtskompatibilität weiterhin akzeptiert.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Viewer-Theme. Standardmäßig der Plugin-Standardwert `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diff-Layout. Standardmäßig der Plugin-Standardwert `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Unveränderte Abschnitte erweitern, wenn vollständiger Kontext verfügbar ist. Nur eine Option pro Aufruf (kein Plugin-Standardschlüssel).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Gerendertes Dateiformat. Standardmäßig der Plugin-Standardwert `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Qualitätsvorgabe für PNG- oder PDF-Rendering.
</ParamField>
<ParamField path="fileScale" type="number">
  Überschreibung der Geräteskalierung (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Maximale Renderbreite in CSS-Pixeln (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  Artefakt-TTL in Sekunden für Viewer- und eigenständige Dateiausgaben. Maximal 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Überschreibung des Ursprungs der Viewer-URL. Überschreibt Plugin-`viewerBaseUrl`. Muss `http` oder `https` sein, ohne Abfrage/Hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy-Eingabealiase">
    Werden aus Gründen der Abwärtskompatibilität weiterhin akzeptiert:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validierung und Grenzwerte">
    - `before` und `after` jeweils maximal 512 KiB.
    - `patch` maximal 2 MiB.
    - `path` maximal 2048 Byte.
    - `lang` maximal 128 Byte.
    - `title` maximal 1024 Byte.
    - Obergrenze für Patch-Komplexität: maximal 128 Dateien und insgesamt 120000 Zeilen.
    - `patch` zusammen mit `before` oder `after` wird abgelehnt.
    - Sicherheitsgrenzwerte für gerenderte Dateien (gelten für PNG und PDF):
      - `fileQuality: "standard"`: maximal 8 MP (8.000.000 gerenderte Pixel).
      - `fileQuality: "hq"`: maximal 14 MP (14.000.000 gerenderte Pixel).
      - `fileQuality: "print"`: maximal 24 MP (24.000.000 gerenderte Pixel).
      - PDF hat außerdem ein Maximum von 50 Seiten.

  </Accordion>
</AccordionGroup>

## Syntaxhervorhebung

OpenClaw enthält Syntaxhervorhebung für gängige Quellcode-, Konfigurations- und Dokumentationssprachen:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` und `toml`.

Gängige Aliase wie `js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt` und `ps1` werden auf diese Standardsprachen normalisiert.

Installieren Sie das Diff Viewer Language Pack Plugin, um weitere Sprachen hervorzuheben:

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Wenn das Language Pack verfügbar ist, kann OpenClaw deutlich mehr Sprachen hervorheben. Wenn das Pack nicht installiert ist, werden Dateien außerhalb der Standardliste weiterhin als lesbarer Klartext dargestellt. Beispiele sind Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI und Diff-Dateien.

Weitere Details finden Sie unter [Diffs Language Pack Plugin](/de/plugins/reference/diffs-language-pack) und den Upstream-Sprach- und Alias-Katalog von Shiki unter [Shiki-Sprachen](https://shiki.style/languages).

## Vertrag für Ausgabedetails

Das Tool gibt strukturierte Metadaten unter `details` zurück.

<AccordionGroup>
  <Accordion title="Viewer fields">
    Gemeinsame Felder für Modi, die einen Viewer erstellen:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId`, sofern verfügbar)

  </Accordion>
  <Accordion title="File fields">
    Dateifelder, wenn PNG oder PDF gerendert wird:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (derselbe Wert wie `filePath`, für Kompatibilität mit Message-Tools)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Compatibility aliases">
    Wird für bestehende Aufrufer ebenfalls zurückgegeben:

    - `format` (derselbe Wert wie `fileFormat`)
    - `imagePath` (derselbe Wert wie `filePath`)
    - `imageBytes` (derselbe Wert wie `fileBytes`)
    - `imageQuality` (derselbe Wert wie `fileQuality`)
    - `imageScale` (derselbe Wert wie `fileScale`)
    - `imageMaxWidth` (derselbe Wert wie `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Zusammenfassung des Modusverhaltens:

| Modus    | Zurückgegebene Werte                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Nur Viewer-Felder.                                                                                                     |
| `"file"` | Nur Dateifelder, kein Viewer-Artefakt.                                                                                 |
| `"both"` | Viewer-Felder plus Dateifelder. Wenn das Datei-Rendering fehlschlägt, wird der Viewer dennoch mit `fileError` und dem Alias `imageError` zurückgegeben. |

## Eingeklappte unveränderte Abschnitte

- Der Viewer kann Zeilen wie `N unmodified lines` anzeigen.
- Erweiterungssteuerelemente in diesen Zeilen sind bedingt und nicht für jede Eingabeart garantiert.
- Erweiterungssteuerelemente erscheinen, wenn der gerenderte Diff erweiterbare Kontextdaten enthält, was typisch für Vorher- und Nachher-Eingaben ist.
- Bei vielen Unified-Patch-Eingaben sind ausgelassene Kontextkörper in den geparsten Patch-Hunks nicht verfügbar, sodass die Zeile ohne Erweiterungssteuerelemente erscheinen kann. Dieses Verhalten ist erwartet.
- `expandUnchanged` gilt nur, wenn erweiterbarer Kontext vorhanden ist.

## Plugin-Standardeinstellungen

Legen Sie Plugin-weite Standardeinstellungen in `~/.openclaw/openclaw.json` fest:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
            ttlSeconds: 21600,
          },
        },
      },
    },
  },
}
```

Unterstützte Standardeinstellungen:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`
- `ttlSeconds`

Explizite Tool-Parameter überschreiben diese Standardeinstellungen.

### Konfiguration persistenter Viewer-URLs

<ParamField path="viewerBaseUrl" type="string">
  Plugin-eigener Fallback für zurückgegebene Viewer-Links, wenn ein Tool-Aufruf keine `baseUrl` übergibt. Muss `http` oder `https` sein, ohne Query/Hash.
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## Sicherheitskonfiguration

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: Nicht-loopback-Anfragen an Viewer-Routen werden abgelehnt. `true`: Remote-Viewer sind zulässig, wenn der tokenisierte Pfad gültig ist.
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## Artefaktlebenszyklus und Speicherung

- Artefakte werden im temporären Unterordner gespeichert: `$TMPDIR/openclaw-diffs`.
- Viewer-Artefaktmetadaten enthalten:
  - zufällige Artefakt-ID (20 Hex-Zeichen)
  - zufälliges Token (48 Hex-Zeichen)
  - `createdAt` und `expiresAt`
  - gespeicherter `viewer.html`-Pfad
- Die Standard-TTL für Artefakte beträgt 30 Minuten, wenn nichts angegeben ist.
- Die maximal akzeptierte Viewer-TTL beträgt 6 Stunden.
- Die Bereinigung läuft opportunistisch nach der Artefakterstellung.
- Abgelaufene Artefakte werden gelöscht.
- Die Fallback-Bereinigung entfernt veraltete Ordner, die älter als 24 Stunden sind, wenn Metadaten fehlen.

## Viewer-URL und Netzwerkverhalten

Viewer-Route:

- `/plugins/diffs/view/{artifactId}/{token}`

Viewer-Assets:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js`, wenn das Diff eine Sprache aus dem Diff Viewer Language Pack verwendet

Das Viewer-Dokument löst diese Assets relativ zur Viewer-URL auf, sodass ein optionales `baseUrl`-Pfadpräfix auch für beide Asset-Anfragen beibehalten wird.

Verhalten bei der URL-Erstellung:

- Wenn beim Tool-Aufruf `baseUrl` angegeben ist, wird es nach strenger Validierung verwendet.
- Andernfalls wird, wenn im Plugin `viewerBaseUrl` konfiguriert ist, dieser Wert verwendet.
- Ohne eine der beiden Überschreibungen verwendet die Viewer-URL standardmäßig die Loopback-Adresse `127.0.0.1`.
- Wenn der Gateway-Bind-Modus `custom` ist und `gateway.customBindHost` gesetzt ist, wird dieser Host verwendet.

`baseUrl`-Regeln:

- Muss `http://` oder `https://` sein.
- Query und Hash werden abgelehnt.
- Origin plus optionaler Basispfad ist erlaubt.

## Sicherheitsmodell

<AccordionGroup>
  <Accordion title="Viewer-Härtung">
    - Standardmäßig nur Loopback.
    - Tokenisierte Viewer-Pfade mit strenger ID- und Token-Validierung.
    - CSP der Viewer-Antwort:
      - `default-src 'none'`
      - Skripte und Assets nur von self
      - kein ausgehendes `connect-src`
    - Drosselung von Remote-Fehlschlägen, wenn Remote-Zugriff aktiviert ist:
      - 40 Fehlschläge pro 60 Sekunden
      - 60 Sekunden Sperre (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Härtung des Datei-Renderings">
    - Das Routing von Screenshot-Browseranfragen ist standardmäßig verweigernd.
    - Nur lokale Viewer-Assets von `http://127.0.0.1/plugins/diffs/assets/*` sind erlaubt.
    - Externe Netzwerkanfragen werden blockiert.

  </Accordion>
</AccordionGroup>

## Browseranforderungen für den Dateimodus

`mode: "file"` und `mode: "both"` benötigen einen Chromium-kompatiblen Browser.

Auflösungsreihenfolge:

<Steps>
  <Step title="Konfiguration">
    `browser.executablePath` in der OpenClaw-Konfiguration.
  </Step>
  <Step title="Umgebungsvariablen">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Plattform-Fallback">
    Fallback für Plattform-Befehls-/Pfaderkennung.
  </Step>
</Steps>

Häufiger Fehlertext:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Beheben Sie dies, indem Sie Chrome, Chromium, Edge oder Brave installieren oder eine der oben genannten Optionen für den ausführbaren Pfad setzen.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Eingabevalidierungsfehler">
    - `Provide patch or both before and after text.` — geben Sie sowohl `before` als auch `after` an oder stellen Sie `patch` bereit.
    - `Provide either patch or before/after input, not both.` — mischen Sie die Eingabemodi nicht.
    - `Invalid baseUrl: ...` — verwenden Sie eine `http(s)`-Origin mit optionalem Pfad, ohne Query/Hash.
    - `{field} exceeds maximum size (...)` — reduzieren Sie die Payload-Größe.
    - Ablehnung großer Patches — reduzieren Sie die Anzahl der Patch-Dateien oder die Gesamtzahl der Zeilen.

  </Accordion>
  <Accordion title="Viewer-Zugänglichkeit">
    - Die Viewer-URL wird standardmäßig zu `127.0.0.1` aufgelöst.
    - Für Remote-Zugriffsszenarien können Sie entweder:
      - im Plugin `viewerBaseUrl` setzen, oder
      - `baseUrl` pro Tool-Aufruf übergeben, oder
      - `gateway.bind=custom` und `gateway.customBindHost` verwenden
    - Wenn `gateway.trustedProxies` Loopback für einen Same-Host-Proxy enthält (zum Beispiel Tailscale Serve), schlagen rohe Loopback-Viewer-Anfragen ohne weitergeleitete Client-IP-Header absichtlich fail-closed fehl.
    - Für diese Proxy-Topologie:
      - bevorzugen Sie `mode: "file"` oder `mode: "both"`, wenn Sie nur einen Anhang benötigen, oder
      - aktivieren Sie bewusst `security.allowRemoteViewer` und setzen Sie im Plugin `viewerBaseUrl` oder übergeben Sie eine Proxy-/öffentliche `baseUrl`, wenn Sie eine teilbare Viewer-URL benötigen
    - Aktivieren Sie `security.allowRemoteViewer` nur, wenn Sie externen Viewer-Zugriff beabsichtigen.

  </Accordion>
  <Accordion title="Zeile mit unveränderten Zeilen hat keine Aufklappschaltfläche">
    Dies kann bei Patch-Eingaben passieren, wenn der Patch keinen erweiterbaren Kontext enthält. Das ist erwartet und weist nicht auf einen Viewer-Fehler hin.
  </Accordion>
  <Accordion title="Artefakt nicht gefunden">
    - Artefakt ist wegen TTL abgelaufen.
    - Token oder Pfad wurde geändert.
    - Bereinigung hat veraltete Daten entfernt.

  </Accordion>
</AccordionGroup>

## Operative Leitlinien

- Bevorzugen Sie `mode: "view"` für lokale interaktive Reviews im Canvas.
- Bevorzugen Sie `mode: "file"` für ausgehende Chat-Kanäle, die einen Anhang benötigen.
- Lassen Sie `allowRemoteViewer` deaktiviert, sofern Ihre Bereitstellung keine Remote-Viewer-URLs erfordert.
- Setzen Sie explizite kurze `ttlSeconds` für sensible Diffs.
- Vermeiden Sie es, Secrets in Diff-Eingaben zu senden, wenn dies nicht erforderlich ist.
- Wenn Ihr Kanal Bilder stark komprimiert (zum Beispiel Telegram oder WhatsApp), bevorzugen Sie die PDF-Ausgabe (`fileFormat: "pdf"`).

<Note>
Diff-Rendering-Engine powered by [Diffs](https://diffs.com).
</Note>

## Verwandt

- [Browser](/de/tools/browser)
- [Plugins](/de/tools/plugin)
- [Tools-Übersicht](/de/tools)
