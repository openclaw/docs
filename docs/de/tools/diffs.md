---
read_when:
    - Sie möchten, dass Agenten Code- oder Markdown-Änderungen als Diffs anzeigen
    - Sie möchten eine Canvas-fähige Viewer-URL oder eine gerenderte Diff-Datei
    - Sie benötigen kontrollierte, temporäre Diff-Artefakte mit sicheren Standardeinstellungen
sidebarTitle: Diffs
summary: Schreibgeschützter Diff-Viewer und Dateirenderer für Agenten (optionales Plugin-Tool)
title: Unterschiede
x-i18n:
    generated_at: "2026-05-02T06:47:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 935f19ce45ff9a91d2c87c70603ce39b0f27f3fe58e52d809f25000a0c1ae82f
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` ist ein optionales Plugin-Tool mit kurzer integrierter Systemanleitung und einer begleitenden Skill, die Änderungsinhalte in ein schreibgeschütztes Diff-Artefakt für Agenten umwandelt.

Es akzeptiert entweder:

- Text für `before` und `after`
- einen vereinheitlichten `patch`

Es kann zurückgeben:

- eine Gateway-Viewer-URL für die Canvas-Darstellung
- einen gerenderten Dateipfad (PNG oder PDF) für die Nachrichtenzustellung
- beide Ausgaben in einem Aufruf

Wenn aktiviert, stellt das Plugin dem System-Prompt-Bereich eine knappe Nutzungsanleitung voran und stellt außerdem eine ausführliche Skill für Fälle bereit, in denen der Agent vollständigere Anweisungen benötigt.

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
        Canvas-zentrierte Abläufe: Agenten rufen `diffs` mit `mode: "view"` auf und öffnen `details.viewerUrl` mit `canvas present`.
      </Tab>
      <Tab title="file">
        Chat-Dateizustellung: Agenten rufen `diffs` mit `mode: "file"` auf und senden `details.filePath` mit `message` unter Verwendung von `path` oder `filePath`.
      </Tab>
      <Tab title="both">
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

Dadurch wird der Hook `before_prompt_build` des diffs-Plugins blockiert, während Plugin, Tool und begleitende Skill verfügbar bleiben.

Wenn Sie sowohl die Anleitung als auch das Tool deaktivieren möchten, deaktivieren Sie stattdessen das Plugin.

## Typischer Agenten-Workflow

<Steps>
  <Step title="diffs aufrufen">
    Der Agent ruft das Tool `diffs` mit Eingabe auf.
  </Step>
  <Step title="Details lesen">
    Der Agent liest die Felder aus `details` aus der Antwort.
  </Step>
  <Step title="Präsentieren">
    Der Agent öffnet entweder `details.viewerUrl` mit `canvas present`, sendet `details.filePath` mit `message` unter Verwendung von `path` oder `filePath`, oder führt beides aus.
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
  Vereinheitlichter Diff-Text. Gegenseitig ausgeschlossen mit `before` und `after`.
</ParamField>
<ParamField path="path" type="string">
  Anzuzeigender Dateiname für den Vorher-Nachher-Modus.
</ParamField>
<ParamField path="lang" type="string">
  Hinweis zur Sprachüberschreibung für den Vorher-Nachher-Modus. Unbekannte Werte fallen auf Nur-Text zurück.
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
  Artefakt-TTL in Sekunden für Viewer- und eigenständige Dateiausgaben. Maximal 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Überschreibung des Viewer-URL-Ursprungs. Überschreibt Plugin `viewerBaseUrl`. Muss `http` oder `https` sein, ohne Query/Hash.
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
  <Accordion title="Validierung und Limits">
    - `before` und `after` jeweils maximal 512 KiB.
    - `patch` maximal 2 MiB.
    - `path` maximal 2048 Byte.
    - `lang` maximal 128 Byte.
    - `title` maximal 1024 Byte.
    - Obergrenze für Patch-Komplexität: maximal 128 Dateien und insgesamt 120000 Zeilen.
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
  <Accordion title="Dateifelder">
    Dateifelder, wenn PNG oder PDF gerendert wird:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (derselbe Wert wie `filePath`, für Kompatibilität mit dem Nachrichtentool)
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
| `"both"` | Viewer-Felder plus Dateifelder. Wenn das Datei-Rendering fehlschlägt, wird der Viewer weiterhin mit dem Alias `fileError` und `imageError` zurückgegeben. |

## Eingeklappte unveränderte Abschnitte

- Der Viewer kann Zeilen wie `N unmodified lines` anzeigen.
- Erweiterungssteuerelemente in diesen Zeilen sind bedingt und nicht für jede Eingabeart garantiert.
- Erweiterungssteuerelemente erscheinen, wenn der gerenderte Diff erweiterbare Kontextdaten enthält, was für Vorher-Nachher-Eingaben typisch ist.
- Bei vielen vereinheitlichten Patch-Eingaben sind ausgelassene Kontextkörper in den geparsten Patch-Hunks nicht verfügbar, sodass die Zeile ohne Erweiterungssteuerelemente erscheinen kann. Dies ist erwartetes Verhalten.
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

Explizite Tool-Parameter überschreiben diese Standardeinstellungen.

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
  `false`: Nicht-loopback-Anfragen an Viewer-Routen werden verweigert. `true`: Remote-Viewer sind erlaubt, wenn der tokenisierte Pfad gültig ist.
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

## Artefakt-Lebenszyklus und Speicherung

- Artefakte werden im temporären Unterordner gespeichert: `$TMPDIR/openclaw-diffs`.
- Viewer-Artefaktmetadaten enthalten:
  - zufällige Artefakt-ID (20 Hex-Zeichen)
  - zufälliges Token (48 Hex-Zeichen)
  - `createdAt` und `expiresAt`
  - gespeicherter Pfad `viewer.html`
- Die Standard-Artefakt-TTL beträgt 30 Minuten, wenn nicht angegeben.
- Die maximal akzeptierte Viewer-TTL beträgt 6 Stunden.
- Die Bereinigung wird nach der Artefakterstellung opportunistisch ausgeführt.
- Abgelaufene Artefakte werden gelöscht.
- Die Fallback-Bereinigung entfernt veraltete Ordner, die älter als 24 Stunden sind, wenn Metadaten fehlen.

## Viewer-URL und Netzwerkverhalten

Viewer-Route:

- `/plugins/diffs/view/{artifactId}/{token}`

Viewer-Assets:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Das Viewer-Dokument löst diese Assets relativ zur Viewer-URL auf, sodass ein optionales `baseUrl`-Pfadpräfix auch für beide Asset-Anfragen erhalten bleibt.

Verhalten bei der URL-Erstellung:

- Wenn `baseUrl` im Tool-Aufruf angegeben ist, wird es nach strenger Validierung verwendet.
- Andernfalls wird, wenn Plugin `viewerBaseUrl` konfiguriert ist, dieser Wert verwendet.
- Ohne eine der beiden Überschreibungen verwendet die Viewer-URL standardmäßig loopback `127.0.0.1`.
- Wenn der Gateway-Bindemodus `custom` ist und `gateway.customBindHost` gesetzt ist, wird dieser Host verwendet.

`baseUrl`-Regeln:

- Muss `http://` oder `https://` sein.
- Query und Hash werden abgelehnt.
- Ursprung plus optionaler Basispfad ist erlaubt.

## Sicherheitsmodell

<AccordionGroup>
  <Accordion title="Viewer-Härtung">
    - Standardmäßig nur Loopback.
    - Tokenisierte Viewer-Pfade mit strenger ID- und Token-Validierung.
    - CSP für Viewer-Antworten:
      - `default-src 'none'`
      - Skripte und Assets nur von self
      - kein ausgehendes `connect-src`
    - Drosselung von Remote-Fehlschlägen, wenn Remote-Zugriff aktiviert ist:
      - 40 Fehlschläge pro 60 Sekunden
      - 60 Sekunden Sperre (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Härtung des Datei-Renderings">
    - Das Request-Routing des Screenshot-Browsers ist standardmäßig ablehnend.
    - Nur lokale Viewer-Assets aus `http://127.0.0.1/plugins/diffs/assets/*` sind zulässig.
    - Externe Netzwerkanfragen werden blockiert.

  </Accordion>
</AccordionGroup>

## Browser-Anforderungen für den Dateimodus

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
    Fallback für die Erkennung von Plattformbefehl/-pfad.
  </Step>
</Steps>

Häufiger Fehlertext:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Beheben Sie dies, indem Sie Chrome, Chromium, Edge oder Brave installieren oder eine der oben genannten Optionen für den ausführbaren Pfad festlegen.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Fehler bei der Eingabevalidierung">
    - `Provide patch or both before and after text.` — geben Sie sowohl `before` als auch `after` an oder stellen Sie `patch` bereit.
    - `Provide either patch or before/after input, not both.` — mischen Sie keine Eingabemodi.
    - `Invalid baseUrl: ...` — verwenden Sie einen `http(s)`-Origin mit optionalem Pfad, ohne Query/Hash.
    - `{field} exceeds maximum size (...)` — reduzieren Sie die Payload-Größe.
    - Ablehnung großer Patches — reduzieren Sie die Anzahl der Patch-Dateien oder die Gesamtzahl der Zeilen.

  </Accordion>
  <Accordion title="Viewer-Zugänglichkeit">
    - Die Viewer-URL wird standardmäßig zu `127.0.0.1` aufgelöst.
    - Für Szenarien mit Remote-Zugriff gilt entweder:
      - setzen Sie Plugin `viewerBaseUrl`, oder
      - übergeben Sie `baseUrl` pro Tool-Aufruf, oder
      - verwenden Sie `gateway.bind=custom` und `gateway.customBindHost`
    - Wenn `gateway.trustedProxies` Loopback für einen Proxy auf demselben Host enthält (zum Beispiel Tailscale Serve), schlagen rohe Loopback-Viewer-Anfragen ohne weitergeleitete Client-IP-Header konstruktionsbedingt geschlossen fehl.
    - Für diese Proxy-Topologie:
      - bevorzugen Sie `mode: "file"` oder `mode: "both"`, wenn Sie nur einen Anhang benötigen, oder
      - aktivieren Sie bewusst `security.allowRemoteViewer` und setzen Sie Plugin `viewerBaseUrl` oder übergeben Sie eine Proxy-/öffentliche `baseUrl`, wenn Sie eine teilbare Viewer-URL benötigen
    - Aktivieren Sie `security.allowRemoteViewer` nur, wenn Sie externen Viewer-Zugriff beabsichtigen.

  </Accordion>
  <Accordion title="Zeile mit unveränderten Zeilen hat keine Schaltfläche zum Erweitern">
    Dies kann bei Patch-Eingaben passieren, wenn der Patch keinen erweiterbaren Kontext enthält. Dies ist erwartet und weist nicht auf einen Viewer-Fehler hin.
  </Accordion>
  <Accordion title="Artefakt nicht gefunden">
    - Artefakt ist aufgrund von TTL abgelaufen.
    - Token oder Pfad wurde geändert.
    - Bereinigung hat veraltete Daten entfernt.

  </Accordion>
</AccordionGroup>

## Betriebliche Hinweise

- Bevorzugen Sie `mode: "view"` für lokale interaktive Reviews im Canvas.
- Bevorzugen Sie `mode: "file"` für ausgehende Chat-Kanäle, die einen Anhang benötigen.
- Lassen Sie `allowRemoteViewer` deaktiviert, sofern Ihre Bereitstellung keine Remote-Viewer-URLs erfordert.
- Legen Sie explizit kurze `ttlSeconds` für sensible Diffs fest.
- Vermeiden Sie es, Secrets in Diff-Eingaben zu senden, wenn dies nicht erforderlich ist.
- Wenn Ihr Kanal Bilder stark komprimiert (zum Beispiel Telegram oder WhatsApp), bevorzugen Sie PDF-Ausgabe (`fileFormat: "pdf"`).

<Note>
Diff-Rendering-Engine powered by [Diffs](https://diffs.com).
</Note>

## Verwandt

- [Browser](/de/tools/browser)
- [Plugins](/de/tools/plugin)
- [Tools-Übersicht](/de/tools)
