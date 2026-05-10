---
read_when:
    - Sie möchten, dass Agenten Code- oder Markdown-Änderungen als Diffs anzeigen
    - Sie möchten eine für Canvas geeignete Viewer-URL oder eine gerenderte Diff-Datei
    - Sie benötigen kontrollierte, temporäre Diff-Artefakte mit sicheren Standardeinstellungen
sidebarTitle: Diffs
summary: Schreibgeschützter Diff-Betrachter und Dateidarsteller für Agenten (optionales Plugin-Werkzeug)
title: Unterschiede
x-i18n:
    generated_at: "2026-05-10T19:54:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9a3dfcab6b4c654645075e3768c13726e10df10632d62ffeeb4de7cc41edf58
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` ist ein optionales Plugin-Tool mit kurzer integrierter Systemanleitung und einer begleitenden Skill, die Änderungsinhalte in ein schreibgeschütztes Diff-Artefakt für Agents umwandelt.

Es akzeptiert entweder:

- `before`- und `after`-Text
- einen vereinheitlichten `patch`

Es kann zurückgeben:

- eine Gateway-Viewer-URL für Canvas-Präsentationen
- einen gerenderten Dateipfad (PNG oder PDF) für die Nachrichtenzustellung
- beide Ausgaben in einem Aufruf

Wenn es aktiviert ist, stellt das Plugin dem System-Prompt-Bereich eine knappe Nutzungsanleitung voran und stellt außerdem eine detaillierte Skill für Fälle bereit, in denen der Agent ausführlichere Anweisungen benötigt.

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
      <Tab title="view">
        Canvas-zuerst-Abläufe: Agents rufen `diffs` mit `mode: "view"` auf und öffnen `details.viewerUrl` mit `canvas present`.
      </Tab>
      <Tab title="file">
        Chat-Dateizustellung: Agents rufen `diffs` mit `mode: "file"` auf und senden `details.filePath` mit `message` unter Verwendung von `path` oder `filePath`.
      </Tab>
      <Tab title="both">
        Kombiniert: Agents rufen `diffs` mit `mode: "both"` auf, um beide Artefakte in einem Aufruf zu erhalten.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Integrierte Systemanleitung deaktivieren

Wenn Sie das `diffs`-Tool aktiviert lassen, aber seine integrierte System-Prompt-Anleitung deaktivieren möchten, setzen Sie `plugins.entries.diffs.hooks.allowPromptInjection` auf `false`:

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

Dies blockiert den `before_prompt_build`-Hook des diffs-Plugins, während Plugin, Tool und begleitende Skill verfügbar bleiben.

Wenn Sie sowohl die Anleitung als auch das Tool deaktivieren möchten, deaktivieren Sie stattdessen das Plugin.

## Typischer Agent-Workflow

<Steps>
  <Step title="diffs aufrufen">
    Der Agent ruft das `diffs`-Tool mit Eingabe auf.
  </Step>
  <Step title="Details lesen">
    Der Agent liest `details`-Felder aus der Antwort.
  </Step>
  <Step title="Präsentieren">
    Der Agent öffnet entweder `details.viewerUrl` mit `canvas present`, sendet `details.filePath` mit `message` unter Verwendung von `path` oder `filePath` oder tut beides.
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

## Tool-Eingabereferenz

Alle Felder sind optional, sofern nicht anders angegeben.

<ParamField path="before" type="string">
  Ursprünglicher Text. Erforderlich mit `after`, wenn `patch` ausgelassen wird.
</ParamField>
<ParamField path="after" type="string">
  Aktualisierter Text. Erforderlich mit `before`, wenn `patch` ausgelassen wird.
</ParamField>
<ParamField path="patch" type="string">
  Vereinheitlichter Diff-Text. Schließt sich gegenseitig mit `before` und `after` aus.
</ParamField>
<ParamField path="path" type="string">
  Anzuzeigender Dateiname für den Vorher-und-nachher-Modus.
</ParamField>
<ParamField path="lang" type="string">
  Sprachüberschreibungshinweis für den Vorher-und-nachher-Modus. Unbekannte Werte fallen auf Nur-Text zurück.
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
  Unveränderte Abschnitte erweitern, wenn vollständiger Kontext verfügbar ist. Nur Option pro Aufruf (kein Plugin-Standardschlüssel).
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
  Artefakt-TTL in Sekunden für Viewer- und eigenständige Dateiausgaben. Max. 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Überschreibung des Viewer-URL-Ursprungs. Überschreibt Plugin `viewerBaseUrl`. Muss `http` oder `https` sein, keine Abfrage/kein Hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy-Eingabealiase">
    Aus Gründen der Abwärtskompatibilität weiterhin akzeptiert:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validierung und Grenzwerte">
    - `before` und `after` jeweils max. 512 KiB.
    - `patch` max. 2 MiB.
    - `path` max. 2048 Byte.
    - `lang` max. 128 Byte.
    - `title` max. 1024 Byte.
    - Obergrenze für Patch-Komplexität: max. 128 Dateien und insgesamt 120000 Zeilen.
    - `patch` zusammen mit `before` oder `after` wird abgelehnt.
    - Sicherheitsgrenzwerte für gerenderte Dateien (gelten für PNG und PDF):
      - `fileQuality: "standard"`: max. 8 MP (8.000.000 gerenderte Pixel).
      - `fileQuality: "hq"`: max. 14 MP (14.000.000 gerenderte Pixel).
      - `fileQuality: "print"`: max. 24 MP (24.000.000 gerenderte Pixel).
      - PDF hat außerdem ein Maximum von 50 Seiten.

  </Accordion>
</AccordionGroup>

## Vertrag für Ausgabedetails

Das Tool gibt strukturierte Metadaten unter `details` zurück.

<AccordionGroup>
  <Accordion title="Viewer-Felder">
    Gemeinsame Felder für Modi, die einen Viewer erstellen:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId`, wenn verfügbar)

  </Accordion>
  <Accordion title="Dateifelder">
    Dateifelder, wenn PNG oder PDF gerendert wird:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (derselbe Wert wie `filePath`, für Kompatibilität mit dem message-Tool)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Kompatibilitätsaliase">
    Für bestehende Aufrufer ebenfalls zurückgegeben:

    - `format` (derselbe Wert wie `fileFormat`)
    - `imagePath` (derselbe Wert wie `filePath`)
    - `imageBytes` (derselbe Wert wie `fileBytes`)
    - `imageQuality` (derselbe Wert wie `fileQuality`)
    - `imageScale` (derselbe Wert wie `fileScale`)
    - `imageMaxWidth` (derselbe Wert wie `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Zusammenfassung des Modusverhaltens:

| Modus    | Was zurückgegeben wird                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Nur Viewer-Felder.                                                                                                     |
| `"file"` | Nur Dateifelder, kein Viewer-Artefakt.                                                                                 |
| `"both"` | Viewer-Felder plus Dateifelder. Wenn das Datei-Rendering fehlschlägt, wird der Viewer dennoch mit `fileError` und dem Alias `imageError` zurückgegeben. |

## Eingeklappte unveränderte Abschnitte

- Der Viewer kann Zeilen wie `N unmodified lines` anzeigen.
- Erweiterungssteuerelemente in diesen Zeilen sind bedingt und nicht für jede Eingabeart garantiert.
- Erweiterungssteuerelemente erscheinen, wenn der gerenderte Diff erweiterbare Kontextdaten enthält, was für Vorher-und-nachher-Eingaben typisch ist.
- Bei vielen vereinheitlichten Patch-Eingaben sind ausgelassene Kontextkörper in den geparsten Patch-Hunks nicht verfügbar, sodass die Zeile ohne Erweiterungssteuerelemente erscheinen kann. Dies ist erwartetes Verhalten.
- `expandUnchanged` gilt nur, wenn erweiterbarer Kontext vorhanden ist.

## Plugin-Standardwerte

Legen Sie Plugin-weite Standardwerte in `~/.openclaw/openclaw.json` fest:

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

Unterstützte Standardwerte:

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

Explizite Tool-Parameter überschreiben diese Standardwerte.

### Persistente Viewer-URL-Konfiguration

<ParamField path="viewerBaseUrl" type="string">
  Plugin-eigene Rückfalloption für zurückgegebene Viewer-Links, wenn ein Tool-Aufruf `baseUrl` nicht übergibt. Muss `http` oder `https` sein, keine Abfrage/kein Hash.
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
  `false`: Nicht-local-loopback-Anfragen an Viewer-Routen werden verweigert. `true`: Remote-Viewer sind erlaubt, wenn der tokenisierte Pfad gültig ist.
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
- Die standardmäßige Artefakt-TTL beträgt 30 Minuten, wenn sie nicht angegeben wird.
- Die maximal akzeptierte Viewer-TTL beträgt 6 Stunden.
- Die Bereinigung wird nach der Artefakterstellung opportunistisch ausgeführt.
- Abgelaufene Artefakte werden gelöscht.
- Die Rückfallbereinigung entfernt veraltete Ordner, die älter als 24 Stunden sind, wenn Metadaten fehlen.

## Viewer-URL und Netzwerkverhalten

Viewer-Route:

- `/plugins/diffs/view/{artifactId}/{token}`

Viewer-Assets:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Das Viewer-Dokument löst diese Assets relativ zur Viewer-URL auf, sodass ein optionales `baseUrl`-Pfadpräfix auch für beide Asset-Anfragen beibehalten wird.

URL-Konstruktionsverhalten:

- Wenn Tool-Aufruf-`baseUrl` angegeben ist, wird es nach strenger Validierung verwendet.
- Andernfalls, wenn Plugin `viewerBaseUrl` konfiguriert ist, wird es verwendet.
- Ohne eine der beiden Überschreibungen ist die Viewer-URL standardmäßig local loopback `127.0.0.1`.
- Wenn der Gateway-Bind-Modus `custom` ist und `gateway.customBindHost` gesetzt ist, wird dieser Host verwendet.

`baseUrl`-Regeln:

- Muss `http://` oder `https://` sein.
- Abfrage und Hash werden abgelehnt.
- Ursprung plus optionaler Basispfad ist erlaubt.

## Sicherheitsmodell

<AccordionGroup>
  <Accordion title="Härtung des Viewers">
    - Standardmäßig nur Loopback.
    - Tokenisierte Viewer-Pfade mit strenger ID- und Token-Validierung.
    - CSP für Viewer-Antworten:
      - `default-src 'none'`
      - Skripte und Assets nur von derselben Quelle
      - kein ausgehendes `connect-src`
    - Drosselung von Remote-Fehlversuchen, wenn Remote-Zugriff aktiviert ist:
      - 40 Fehlversuche pro 60 Sekunden
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
    Fallback für plattformspezifische Befehls-/Pfaderkennung.
  </Step>
</Steps>

Häufiger Fehlertext:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Beheben Sie dies, indem Sie Chrome, Chromium, Edge oder Brave installieren oder eine der oben genannten Optionen für den ausführbaren Pfad festlegen.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Eingabevalidierungsfehler">
    - `Provide patch or both before and after text.` — geben Sie sowohl `before` als auch `after` an, oder geben Sie `patch` an.
    - `Provide either patch or before/after input, not both.` — mischen Sie die Eingabemodi nicht.
    - `Invalid baseUrl: ...` — verwenden Sie einen `http(s)`-Ursprung mit optionalem Pfad, ohne Query/Hash.
    - `{field} exceeds maximum size (...)` — reduzieren Sie die Payload-Größe.
    - Ablehnung großer Patches — reduzieren Sie die Anzahl der Patch-Dateien oder die Gesamtzahl der Zeilen.

  </Accordion>
  <Accordion title="Viewer-Zugänglichkeit">
    - Die Viewer-URL wird standardmäßig zu `127.0.0.1` aufgelöst.
    - Für Remote-Zugriffsszenarien entweder:
      - Plugin-`viewerBaseUrl` festlegen, oder
      - `baseUrl` pro Tool-Aufruf übergeben, oder
      - `gateway.bind=custom` und `gateway.customBindHost` verwenden
    - Wenn `gateway.trustedProxies` Loopback für einen Proxy auf demselben Host enthält (zum Beispiel Tailscale Serve), schlagen rohe Loopback-Viewer-Anfragen ohne weitergeleitete Client-IP-Header absichtlich geschlossen fehl.
    - Für diese Proxy-Topologie:
      - bevorzugen Sie `mode: "file"` oder `mode: "both"`, wenn Sie nur einen Anhang benötigen, oder
      - aktivieren Sie bewusst `security.allowRemoteViewer` und legen Sie Plugin-`viewerBaseUrl` fest oder übergeben Sie eine Proxy-/öffentliche `baseUrl`, wenn Sie eine teilbare Viewer-URL benötigen
    - Aktivieren Sie `security.allowRemoteViewer` nur, wenn Sie externen Viewer-Zugriff beabsichtigen.

  </Accordion>
  <Accordion title="Zeile mit unveränderten Zeilen hat keine Aufklappschaltfläche">
    Dies kann bei Patch-Eingaben passieren, wenn der Patch keinen erweiterbaren Kontext enthält. Dies ist erwartet und deutet nicht auf einen Viewer-Fehler hin.
  </Accordion>
  <Accordion title="Artefakt nicht gefunden">
    - Artefakt ist aufgrund der TTL abgelaufen.
    - Token oder Pfad wurde geändert.
    - Bereinigung hat veraltete Daten entfernt.

  </Accordion>
</AccordionGroup>

## Betriebliche Hinweise

- Bevorzugen Sie `mode: "view"` für lokale interaktive Reviews in Canvas.
- Bevorzugen Sie `mode: "file"` für ausgehende Chat-Kanäle, die einen Anhang benötigen.
- Lassen Sie `allowRemoteViewer` deaktiviert, sofern Ihre Bereitstellung keine Remote-Viewer-URLs erfordert.
- Legen Sie für vertrauliche Diffs explizit kurze `ttlSeconds` fest.
- Vermeiden Sie es, Geheimnisse in Diff-Eingaben zu senden, wenn dies nicht erforderlich ist.
- Wenn Ihr Kanal Bilder stark komprimiert (zum Beispiel Telegram oder WhatsApp), bevorzugen Sie PDF-Ausgabe (`fileFormat: "pdf"`).

<Note>
Diff-Rendering-Engine bereitgestellt von [Diffs](https://diffs.com).
</Note>

## Verwandt

- [Browser](/de/tools/browser)
- [Plugins](/de/tools/plugin)
- [Tools-Übersicht](/de/tools)
