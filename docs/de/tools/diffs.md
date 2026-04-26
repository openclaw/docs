---
read_when:
    - Sie möchten, dass Agents Code- oder Markdown-Änderungen als Diffs anzeigen
    - Sie möchten eine Canvas-fähige Viewer-URL oder eine gerenderte Diff-Datei
    - Sie benötigen kontrollierte, temporäre Diff-Artefakte mit sicheren Standardeinstellungen
sidebarTitle: Diffs
summary: Schreibgeschützter Diff-Viewer und Datei-Renderer für Agents (optionales Plugin-Tool)
title: Diffs
x-i18n:
    generated_at: "2026-04-26T11:40:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af098a294a4ba56e1a8df3b4f9650802fc53392634fee97b330f03b69e10781
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` ist ein optionales Plugin-Tool mit kurzer integrierter Systemanleitung und einem begleitenden Skill, der Änderungsinhalte in ein schreibgeschütztes Diff-Artefakt für Agents umwandelt.

Es akzeptiert entweder:

- Text `before` und `after`
- ein einheitliches `patch`

Es kann zurückgeben:

- eine Gateway-Viewer-URL für die Darstellung im Canvas
- einen gerenderten Dateipfad (PNG oder PDF) für die Nachrichtenzustellung
- beide Ausgaben in einem Aufruf

Wenn es aktiviert ist, stellt das Plugin eine knappe Nutzungshilfe dem System-Prompt-Bereich voran und stellt außerdem einen detaillierten Skill für Fälle bereit, in denen der Agent ausführlichere Anweisungen benötigt.

## Schnellstart

<Steps>
  <Step title="Das Plugin aktivieren">
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
  <Step title="Einen Modus auswählen">
    <Tabs>
      <Tab title="view">
        Canvas-zentrierte Abläufe: Agents rufen `diffs` mit `mode: "view"` auf und öffnen `details.viewerUrl` mit `canvas present`.
      </Tab>
      <Tab title="file">
        Datei-Zustellung im Chat: Agents rufen `diffs` mit `mode: "file"` auf und senden `details.filePath` mit `message` unter Verwendung von `path` oder `filePath`.
      </Tab>
      <Tab title="both">
        Kombiniert: Agents rufen `diffs` mit `mode: "both"` auf, um beide Artefakte in einem Aufruf zu erhalten.
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

Dies blockiert den Hook `before_prompt_build` des Diffs-Plugins, während Plugin, Tool und begleitender Skill verfügbar bleiben.

Wenn Sie sowohl die Anleitung als auch das Tool deaktivieren möchten, deaktivieren Sie stattdessen das Plugin.

## Typischer Agent-Ablauf

<Steps>
  <Step title="Diffs aufrufen">
    Der Agent ruft das Tool `diffs` mit Eingabe auf.
  </Step>
  <Step title="Details lesen">
    Der Agent liest die Felder `details` aus der Antwort.
  </Step>
  <Step title="Darstellen">
    Der Agent öffnet entweder `details.viewerUrl` mit `canvas present`, sendet `details.filePath` mit `message` unter Verwendung von `path` oder `filePath`, oder macht beides.
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
  Ursprünglicher Text. Erforderlich zusammen mit `after`, wenn `patch` weggelassen wird.
</ParamField>
<ParamField path="after" type="string">
  Aktualisierter Text. Erforderlich zusammen mit `before`, wenn `patch` weggelassen wird.
</ParamField>
<ParamField path="patch" type="string">
  Einheitlicher Diff-Text. Schließt `before` und `after` gegenseitig aus.
</ParamField>
<ParamField path="path" type="string">
  Anzeigename der Datei für den Modus „Vorher und nachher“.
</ParamField>
<ParamField path="lang" type="string">
  Hinweis zur Sprachüberschreibung für den Modus „Vorher und nachher“. Unbekannte Werte fallen auf Klartext zurück.
</ParamField>
<ParamField path="title" type="string">
  Überschreibung des Viewer-Titels.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Ausgabemodus. Standard ist der Plugin-Standard `defaults.mode`. Veralteter Alias: `"image"` verhält sich wie `"file"` und wird aus Gründen der Abwärtskompatibilität weiterhin akzeptiert.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Viewer-Thema. Standard ist der Plugin-Standard `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diff-Layout. Standard ist der Plugin-Standard `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Unveränderte Abschnitte erweitern, wenn vollständiger Kontext verfügbar ist. Nur Option pro Aufruf (kein Plugin-Standardschlüssel).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Format der gerenderten Datei. Standard ist der Plugin-Standard `defaults.fileFormat`.
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
  TTL des Artefakts in Sekunden für Viewer- und eigenständige Dateiausgaben. Maximal 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Überschreibung des Ursprungs der Viewer-URL. Überschreibt `viewerBaseUrl` des Plugins. Muss `http` oder `https` sein, ohne Query/Hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Ältere Eingabe-Aliasse">
    Aus Gründen der Abwärtskompatibilität weiterhin akzeptiert:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validierung und Limits">
    - `before` und `after` jeweils maximal 512 KiB.
    - `patch` maximal 2 MiB.
    - `path` maximal 2048 Byte.
    - `lang` maximal 128 Byte.
    - `title` maximal 1024 Byte.
    - Komplexitätsgrenze für Patches: maximal 128 Dateien und 120000 Zeilen insgesamt.
    - `patch` zusammen mit `before` oder `after` wird abgelehnt.
    - Sicherheitslimits für gerenderte Dateien (gelten für PNG und PDF):
      - `fileQuality: "standard"`: maximal 8 MP (8.000.000 gerenderte Pixel).
      - `fileQuality: "hq"`: maximal 14 MP (14.000.000 gerenderte Pixel).
      - `fileQuality: "print"`: maximal 24 MP (24.000.000 gerenderte Pixel).
      - PDF hat außerdem ein Maximum von 50 Seiten.
  </Accordion>
</AccordionGroup>

## Vertrag für Ausgabedetails

Das Tool gibt strukturierte Metadaten unter `details` zurück.

<AccordionGroup>
  <Accordion title="Viewer-Felder">
    Gemeinsame Felder für Modi, die einen Viewer erzeugen:

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
  <Accordion title="Datei-Felder">
    Datei-Felder, wenn PNG oder PDF gerendert wird:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (derselbe Wert wie `filePath`, für Kompatibilität mit dem Message-Tool)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Kompatibilitäts-Aliasse">
    Werden auch für bestehende Aufrufer zurückgegeben:

    - `format` (derselbe Wert wie `fileFormat`)
    - `imagePath` (derselbe Wert wie `filePath`)
    - `imageBytes` (derselbe Wert wie `fileBytes`)
    - `imageQuality` (derselbe Wert wie `fileQuality`)
    - `imageScale` (derselbe Wert wie `fileScale`)
    - `imageMaxWidth` (derselbe Wert wie `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Zusammenfassung des Verhaltens nach Modus:

| Modus    | Was zurückgegeben wird                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| `"view"` | Nur Viewer-Felder.                                                                                               |
| `"file"` | Nur Datei-Felder, kein Viewer-Artefakt.                                                                          |
| `"both"` | Viewer-Felder plus Datei-Felder. Wenn das Datei-Rendering fehlschlägt, wird der Viewer dennoch mit `fileError` und Alias `imageError` zurückgegeben. |

## Eingeklappte unveränderte Abschnitte

- Der Viewer kann Zeilen wie `N unmodified lines` anzeigen.
- Steuerelemente zum Erweitern auf diesen Zeilen sind bedingt und werden nicht für jede Eingabeart garantiert.
- Steuerelemente zum Erweitern erscheinen, wenn das gerenderte Diff erweiterbare Kontextdaten enthält, was bei Eingaben mit Vorher/Nachher typisch ist.
- Bei vielen einheitlichen Patch-Eingaben sind ausgelassene Kontext-Bodies in den geparsten Patch-Hunks nicht verfügbar, sodass die Zeile ohne Steuerelemente zum Erweitern erscheinen kann. Dies ist erwartetes Verhalten.
- `expandUnchanged` gilt nur, wenn erweiterbarer Kontext vorhanden ist.

## Plugin-Standards

Setzen Sie pluginweite Standards in `~/.openclaw/openclaw.json`:

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
          },
        },
      },
    },
  },
}
```

Unterstützte Standards:

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

Explizite Tool-Parameter überschreiben diese Standards.

### Persistente Viewer-URL-Konfiguration

<ParamField path="viewerBaseUrl" type="string">
  Plugin-eigener Fallback für zurückgegebene Viewer-Links, wenn ein Tool-Aufruf kein `baseUrl` übergibt. Muss `http` oder `https` sein, ohne Query/Hash.
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
  `false`: Nicht-Loopback-Anfragen an Viewer-Routen werden abgelehnt. `true`: Remote-Viewer sind erlaubt, wenn der tokenisierte Pfad gültig ist.
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

## Lebenszyklus und Speicherung von Artefakten

- Artefakte werden im Temp-Unterordner gespeichert: `$TMPDIR/openclaw-diffs`.
- Viewer-Artefakt-Metadaten enthalten:
  - zufällige Artefakt-ID (20 Hex-Zeichen)
  - zufälliges Token (48 Hex-Zeichen)
  - `createdAt` und `expiresAt`
  - gespeicherten Pfad `viewer.html`
- Standard-TTL für Artefakte ist 30 Minuten, wenn nichts angegeben wird.
- Maximal akzeptierte Viewer-TTL ist 6 Stunden.
- Bereinigung läuft opportunistisch nach der Erstellung eines Artefakts.
- Abgelaufene Artefakte werden gelöscht.
- Eine Fallback-Bereinigung entfernt veraltete Ordner, die älter als 24 Stunden sind, wenn Metadaten fehlen.

## Viewer-URL und Netzwerkverhalten

Viewer-Route:

- `/plugins/diffs/view/{artifactId}/{token}`

Viewer-Assets:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Das Viewer-Dokument löst diese Assets relativ zur Viewer-URL auf, sodass ein optionales `baseUrl`-Pfadpräfix auch für beide Asset-Anfragen erhalten bleibt.

Verhalten beim Aufbau der URL:

- Wenn `baseUrl` im Tool-Aufruf angegeben ist, wird es nach strenger Validierung verwendet.
- Andernfalls wird, falls `viewerBaseUrl` des Plugins konfiguriert ist, dieses verwendet.
- Ohne eine der beiden Überschreibungen wird die Viewer-URL standardmäßig auf Loopback `127.0.0.1` gesetzt.
- Wenn der Bind-Modus des Gateway `custom` ist und `gateway.customBindHost` gesetzt ist, wird dieser Host verwendet.

Regeln für `baseUrl`:

- Muss `http://` oder `https://` sein.
- Query und Hash werden abgelehnt.
- Ursprung plus optionaler Basispfad sind zulässig.

## Sicherheitsmodell

<AccordionGroup>
  <Accordion title="Härtung des Viewers">
    - Standardmäßig nur Loopback.
    - Tokenisierte Viewer-Pfade mit strenger Validierung von ID und Token.
    - CSP der Viewer-Antwort:
      - `default-src 'none'`
      - Skripte und Assets nur von self
      - kein ausgehendes `connect-src`
    - Drosselung bei Remote-Fehlschlägen, wenn Remote-Zugriff aktiviert ist:
      - 40 Fehlschläge pro 60 Sekunden
      - 60 Sekunden Sperrung (`429 Too Many Requests`)
  </Accordion>
  <Accordion title="Härtung beim Datei-Rendering">
    - Request-Routing des Screenshot-Browsers ist standardmäßig deny-by-default.
    - Nur lokale Viewer-Assets aus `http://127.0.0.1/plugins/diffs/assets/*` sind erlaubt.
    - Externe Netzwerkanfragen werden blockiert.
  </Accordion>
</AccordionGroup>

## Browser-Anforderungen für den Dateimodus

`mode: "file"` und `mode: "both"` benötigen einen Chromium-kompatiblen Browser.

Reihenfolge der Auflösung:

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
    Fallback zur Erkennung von Plattformbefehl/-pfad.
  </Step>
</Steps>

Häufiger Fehlertext:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Beheben Sie dies, indem Sie Chrome, Chromium, Edge oder Brave installieren oder eine der Optionen für den ausführbaren Pfad oben setzen.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Fehler bei der Eingabevalidierung">
    - `Provide patch or both before and after text.` — geben Sie sowohl `before` als auch `after` an oder liefern Sie `patch`.
    - `Provide either patch or before/after input, not both.` — mischen Sie die Eingabemodi nicht.
    - `Invalid baseUrl: ...` — verwenden Sie einen `http(s)`-Ursprung mit optionalem Pfad, ohne Query/Hash.
    - `{field} exceeds maximum size (...)` — reduzieren Sie die Größe der Nutzlast.
    - Ablehnung eines großen Patches — reduzieren Sie die Dateianzahl oder die Gesamtzahl der Zeilen im Patch.
  </Accordion>
  <Accordion title="Zugänglichkeit des Viewers">
    - Die Viewer-URL wird standardmäßig zu `127.0.0.1` aufgelöst.
    - Für Szenarien mit Remote-Zugriff entweder:
      - setzen Sie `viewerBaseUrl` des Plugins, oder
      - übergeben Sie `baseUrl` pro Tool-Aufruf, oder
      - verwenden Sie `gateway.bind=custom` und `gateway.customBindHost`
    - Wenn `gateway.trustedProxies` Loopback für einen Proxy auf demselben Host enthält (zum Beispiel Tailscale Serve), schlagen rohe Loopback-Viewer-Anfragen ohne weitergeleitete Header für die Client-IP absichtlich fail-closed fehl.
    - Für diese Proxy-Topologie:
      - bevorzugen Sie `mode: "file"` oder `mode: "both"`, wenn Sie nur einen Anhang benötigen, oder
      - aktivieren Sie absichtlich `security.allowRemoteViewer` und setzen Sie `viewerBaseUrl` des Plugins oder übergeben Sie ein Proxy-/öffentliches `baseUrl`, wenn Sie eine teilbare Viewer-URL benötigen
    - Aktivieren Sie `security.allowRemoteViewer` nur, wenn Sie externen Viewer-Zugriff beabsichtigen.
  </Accordion>
  <Accordion title="Zeile für unveränderte Zeilen hat keinen Expand-Button">
    Dies kann bei Patch-Eingaben passieren, wenn der Patch keinen erweiterbaren Kontext enthält. Das ist erwartetes Verhalten und weist nicht auf einen Fehler des Viewers hin.
  </Accordion>
  <Accordion title="Artefakt nicht gefunden">
    - Artefakt aufgrund der TTL abgelaufen.
    - Token oder Pfad wurde geändert.
    - Bereinigung hat veraltete Daten entfernt.
  </Accordion>
</AccordionGroup>

## Betriebshinweise

- Bevorzugen Sie `mode: "view"` für lokale interaktive Reviews im Canvas.
- Bevorzugen Sie `mode: "file"` für ausgehende Chat-Kanäle, die einen Anhang benötigen.
- Lassen Sie `allowRemoteViewer` deaktiviert, sofern Ihre Bereitstellung keine Remote-Viewer-URLs erfordert.
- Setzen Sie für sensible Diffs explizit kurze `ttlSeconds`.
- Vermeiden Sie es, Secrets in Diff-Eingaben zu senden, wenn dies nicht erforderlich ist.
- Wenn Ihr Kanal Bilder stark komprimiert (zum Beispiel Telegram oder WhatsApp), bevorzugen Sie PDF-Ausgabe (`fileFormat: "pdf"`).

<Note>
Diff-Rendering-Engine von [Diffs](https://diffs.com).
</Note>

## Verwandt

- [Browser](/de/tools/browser)
- [Plugins](/de/tools/plugin)
- [Tools overview](/de/tools)
