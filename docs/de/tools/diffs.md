---
read_when:
    - Sie möchten, dass Agenten Änderungen an Code oder Markdown als Diffs anzeigen
    - Sie möchten eine für Canvas geeignete Viewer-URL oder eine gerenderte Diff-Datei
    - Sie benötigen kontrollierte, temporäre Diff-Artefakte mit sicheren Standardeinstellungen
sidebarTitle: Diffs
summary: Schreibgeschützter Diff-Viewer und Datei-Renderer für Agenten (optionales Plugin-Tool)
title: Differenzen
x-i18n:
    generated_at: "2026-07-12T16:03:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f28a8ac4191f72376ba5c8823337bd337e3fac236ea4ecc2204e6dcf2930e607
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` ist ein optionales gebündeltes Plugin-Tool, das Vorher-/Nachher-Text oder einen Unified Patch in ein schreibgeschütztes Diff-Artefakt umwandelt. Es stellt dem System-Prompt außerdem kurze Anweisungen für den Agenten voran und enthält ein begleitendes Skill mit ausführlicheren Anweisungen.

Eingabe: `before`- und `after`-Text oder ein Unified `patch` (gegenseitig ausschließend).

Ausgabe: eine Gateway-Viewer-URL für die Canvas-Darstellung, ein gerenderter PNG-/PDF-Dateipfad für die Nachrichtenzustellung oder beides.

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
        Canvas-orientierte Abläufe: Agenten rufen `diffs` mit `mode: "view"` auf und öffnen `details.viewerUrl` mit `canvas present`.
      </Tab>
      <Tab title="file">
        Dateizustellung im Chat: Agenten rufen `diffs` mit `mode: "file"` auf und senden `details.filePath` mit `message` unter Verwendung von `path` oder `filePath`.
      </Tab>
      <Tab title="both">
        Kombiniert (Standard): Agenten rufen `diffs` mit `mode: "both"` auf, um beide Artefakte mit einem einzigen Aufruf zu erhalten.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Integrierte Systemanweisungen deaktivieren

Um das Tool beizubehalten, aber die vorangestellten System-Prompt-Anweisungen zu entfernen, setzen Sie `plugins.entries.diffs.hooks.allowPromptInjection` auf `false`:

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

Dadurch wird der Hook `before_prompt_build` des Plugins blockiert, während das Tool und das Skill verfügbar bleiben. Um sowohl die Anweisungen als auch das Tool zu deaktivieren, deaktivieren Sie stattdessen das Plugin.

## Referenz der Tool-Eingaben

Alle Felder sind optional, sofern nicht anders angegeben.

<ParamField path="before" type="string">
  Ursprünglicher Text. Zusammen mit `after` erforderlich, wenn `patch` weggelassen wird.
</ParamField>
<ParamField path="after" type="string">
  Aktualisierter Text. Zusammen mit `before` erforderlich, wenn `patch` weggelassen wird.
</ParamField>
<ParamField path="patch" type="string">
  Unified-Diff-Text. Schließt sich gegenseitig mit `before` und `after` aus.
</ParamField>
<ParamField path="path" type="string">
  Angezeigter Dateiname für den Vorher-/Nachher-Modus.
</ParamField>
<ParamField path="lang" type="string">
  Hinweis zum Überschreiben der Sprache für den Vorher-/Nachher-Modus. Unbekannte Werte und Sprachen außerhalb des standardmäßigen Viewer-Satzes fallen auf einfachen Text zurück, sofern das Diff Viewer Language Pack Plugin nicht installiert ist.
</ParamField>
<ParamField path="title" type="string">
  Überschreibung des Viewer-Titels.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Ausgabemodus. Verwendet standardmäßig den Plugin-Standardwert `defaults.mode` (`both`). Veralteter Alias: `"image"` verhält sich identisch zu `"file"`.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Viewer-Design. Verwendet standardmäßig den Plugin-Standardwert `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diff-Layout. Verwendet standardmäßig den Plugin-Standardwert `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Unveränderte Abschnitte erweitern, wenn der vollständige Kontext verfügbar ist. Nur eine Option pro Aufruf (kein Plugin-Standardschlüssel).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Gerendertes Dateiformat. Verwendet standardmäßig den Plugin-Standardwert `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Qualitätsvoreinstellung für das PNG-/PDF-Rendering.
</ParamField>
<ParamField path="fileScale" type="number">
  Überschreibung des Geräteskalierungsfaktors (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Maximale Renderbreite in CSS-Pixeln (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  Artefakt-TTL in Sekunden für Viewer- und eigenständige Dateiausgaben. Maximal `21600`.
</ParamField>
<ParamField path="baseUrl" type="string">
  Überschreibung des Ursprungs der Viewer-URL. Überschreibt das Plugin-Feld `viewerBaseUrl`. Muss `http` oder `https` sein, ohne Abfragezeichenfolge/Hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Validierung und Grenzwerte">
    - `before`/`after`: jeweils maximal 512 KiB.
    - `patch`: maximal 2 MiB.
    - `path`: maximal 2048 Byte.
    - `lang`: maximal 128 Byte.
    - `title`: maximal 1024 Byte.
    - Obergrenze für die Patch-Komplexität: maximal 128 Dateien und insgesamt 120000 Zeilen.
    - `patch` zusammen mit `before`/`after` wird abgelehnt.
    - Sicherheitsgrenzwerte für gerenderte Dateien (PNG und PDF):
      - `fileQuality: "standard"`: maximal 8 MP (8,000,000 gerenderte Pixel).
      - `fileQuality: "hq"`: maximal 14 MP.
      - `fileQuality: "print"`: maximal 24 MP.
      - PDF ist außerdem auf 50 Seiten begrenzt.

  </Accordion>
</AccordionGroup>

## Syntaxhervorhebung

Integrierte Sprachen:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` und `toml`.

Gängige Aliase (`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1` usw.) werden auf diese Sprachen normalisiert.

Installieren Sie das Diff Viewer Language Pack Plugin für weitere Sprachen (Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff und weitere):

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Ohne das Paket werden nicht unterstützte Sprachen weiterhin als lesbarer einfacher Text gerendert. Im [Diffs Language Pack Plugin](/de/plugins/reference/diffs-language-pack) und unter [Shiki-Sprachen](https://shiki.style/languages) finden Sie den Upstream-Katalog.

## Vertrag für Ausgabedetails

Alle erfolgreichen Ergebnisse enthalten `changed`: Bei identischer Vorher-/Nachher-Eingabe wird `false` zurückgegeben, ohne ein Artefakt zu erstellen; gerenderte Ergebnisse geben `true` zurück.

<AccordionGroup>
  <Accordion title="Viewer-Felder (Modi view und both)">
    - `changed`
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
  <Accordion title="Dateifelder (Modi file und both)">
    - `changed`
    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (derselbe Wert wie `filePath`, zur Kompatibilität mit dem Nachrichten-Tool)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
</AccordionGroup>

| Modus    | Rückgabe                                                                                        |
| -------- | ----------------------------------------------------------------------------------------------- |
| `"view"` | Nur Viewer-Felder.                                                                              |
| `"file"` | Nur Dateifelder, kein Viewer-Artefakt.                                                          |
| `"both"` | Viewer-Felder plus Dateifelder. Wenn das Datei-Rendering fehlschlägt, wird der Viewer dennoch mit `fileError` zurückgegeben. |

### Eingeklappte unveränderte Abschnitte

Der Viewer zeigt Zeilen wie `N unmodified lines` an. Steuerelemente zum Erweitern erscheinen nur, wenn der gerenderte Diff erweiterbare Kontextdaten enthält (typischerweise bei Vorher-/Nachher-Eingaben). Bei vielen vereinheitlichten Patches fehlen die Kontextinhalte in den Hunks, sodass die Zeile ohne Steuerelement zum Erweitern erscheinen kann – dies ist erwartetes Verhalten und kein Fehler. `expandUnchanged` gilt nur, wenn erweiterbarer Kontext vorhanden ist.

### Navigation zwischen mehreren Dateien

Patches, die mehr als eine Datei betreffen, beginnen mit einer Übersichtskarte der geänderten Dateien: Gesamtzahlen für `+N` / `-N`, Zahlen pro Datei, Kennzeichnungen für hinzugefügte/gelöschte/umbenannte Dateien und Ankerlinks, die direkt zu den einzelnen Dateien führen. Gerenderte PNG-/PDF-Dateien behalten die Zahlen in den Kopfzeilen der einzelnen Dateien bei, lassen jedoch die interaktiven Ansichtsumschalter weg, da diese in einer statischen Datei funktionslose Steuerelemente wären.

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

Unterstützte `defaults`-Schlüssel: `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds`. Explizite Parameter eines Tool-Aufrufs überschreiben diese Einstellungen.

### Konfiguration der persistenten Viewer-URL

<ParamField path="viewerBaseUrl" type="string">
  Plugin-eigener Rückfallwert für zurückgegebene Viewer-Links, wenn bei einem Tool-Aufruf kein `baseUrl` übergeben wird. Muss `http` oder `https` verwenden, ohne Abfrageparameter oder Fragment.
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
  `false`: Nicht-Loopback-Anfragen an Viewer-Routen werden abgelehnt. `true`: Remote-Viewer sind zulässig, wenn der tokenisierte Pfad gültig ist.
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

- Artefakte befinden sich unter `$TMPDIR/openclaw-diffs`.
- Die Viewer-Metadaten speichern eine zufällige Artefakt-ID mit 20 Hexadezimalzeichen, ein zufälliges Token mit 48 Hexadezimalzeichen, `createdAt`/`expiresAt` und den gespeicherten Pfad zu `viewer.html`.
- Standard-TTL für Artefakte: 30 Minuten. Maximal akzeptierte TTL: 6 Stunden.
- Die Bereinigung wird nach jedem Aufruf zum Erstellen eines Artefakts opportunistisch ausgeführt; abgelaufene Artefakte werden gelöscht.
- Eine ersatzweise Bereinigung entfernt veraltete Ordner, die älter als 24 Stunden sind, wenn Metadaten fehlen.

## Viewer-URL und Netzwerkverhalten

Viewer-Route: `/plugins/diffs/view/{artifactId}/{token}`

Viewer-Ressourcen:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` (nur wenn der Diff eine Sprache aus einem Sprachpaket verwendet)

Das Viewer-Dokument löst diese Ressourcen relativ zur Viewer-URL auf, sodass ein optionales `baseUrl`-Pfadpräfix auch für Ressourcenanfragen übernommen wird.

Reihenfolge der URL-Auflösung: `baseUrl` des Tool-Aufrufs (nach strenger Validierung) -> Plugin-`viewerBaseUrl` -> standardmäßig Loopback `127.0.0.1`. Wenn der Gateway-Bindungsmodus `custom` ist und `gateway.customBindHost` festgelegt wurde, wird dieser Host anstelle von Loopback verwendet.

Regeln für `baseUrl`: Muss `http://` oder `https://` verwenden; Abfrageparameter und Fragmente werden abgelehnt; Ursprung plus optionaler Basispfad ist zulässig.

## Sicherheitsmodell

<AccordionGroup>
  <Accordion title="Absicherung des Viewers">
    - Standardmäßig nur Loopback.
    - Tokenisierte Viewer-Pfade mit strenger Validierung der ID- und Token-Muster.
    - CSP der Viewer-Antwort: `default-src 'none'`; Skripte/Ressourcen nur vom eigenen Ursprung; kein ausgehendes `connect-src`.
    - Drosselung fehlgeschlagener Remote-Zugriffe bei aktiviertem Remote-Zugriff: 40 Fehlschläge innerhalb von 60 Sekunden lösen eine 60-sekündige Sperre aus (`429 Too Many Requests`).

  </Accordion>
  <Accordion title="Absicherung der Dateidarstellung">
    - Das Routing von Browseranfragen für Screenshots verweigert standardmäßig alle Anfragen.
    - Nur lokale Viewer-Ressourcen unter `http://127.0.0.1/plugins/diffs/assets/*` sind zulässig.
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
    Übliche Installationspfade und `PATH`-Suchvorgänge für Chrome, Chromium, Edge und Brave.
  </Step>
</Steps>

Häufige Fehlermeldung: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`. Beheben Sie dies, indem Sie Chrome, Chromium, Edge oder Brave installieren oder eine der oben genannten Optionen für den Pfad zur ausführbaren Datei festlegen.

  ## Fehlerbehebung

  <AccordionGroup>
  <Accordion title="Eingabevalidierungsfehler">
    - `Provide patch or both before and after text.` -- Geben Sie sowohl `before` als auch `after` an oder stellen Sie `patch` bereit.
    - `Provide either patch or before/after input, not both.` -- Mischen Sie die Eingabemodi nicht.
    - `Invalid baseUrl: ...` -- Verwenden Sie einen `http(s)`-Ursprung mit optionalem Pfad, aber ohne Abfrageparameter oder Fragment.
    - `{field} exceeds maximum size (...)` -- Reduzieren Sie die Größe der Nutzdaten.
    - Ablehnung eines großen Patches -- Reduzieren Sie die Anzahl der Patch-Dateien oder die Gesamtzahl der Zeilen.

  </Accordion>
  <Accordion title="Zugänglichkeit des Viewers">
    - Die Viewer-URL wird standardmäßig zu `127.0.0.1` aufgelöst.
    - Legen Sie für den Remotezugriff entweder im Plugin `viewerBaseUrl` fest, übergeben Sie bei jedem Aufruf `baseUrl` oder verwenden Sie `gateway.bind=custom` mit `gateway.customBindHost`.
    - Wenn `gateway.trustedProxies` die Loopback-Adresse für einen Proxy auf demselben Host enthält (beispielsweise Tailscale Serve), schlagen direkte Loopback-Viewer-Anfragen ohne weitergeleitete Client-IP-Header standardmäßig sicher fehl.
    - Verwenden Sie für diese Proxy-Topologie vorzugsweise `mode: "file"`/`"both"` für einen Anhang oder aktivieren Sie gezielt `security.allowRemoteViewer` zusammen mit `viewerBaseUrl` im Plugin beziehungsweise einer Proxy-`baseUrl`, um einen teilbaren Viewer-Link bereitzustellen.
    - Aktivieren Sie `security.allowRemoteViewer` nur, wenn externer Viewer-Zugriff vorgesehen ist.

  </Accordion>
  <Accordion title="Zeile mit unveränderten Zeilen hat keine Schaltfläche zum Aufklappen">
    Erwartetes Verhalten bei Patch-Eingaben ohne aufklappbaren Kontext; kein Fehler des Viewers.
  </Accordion>
  <Accordion title="Artefakt nicht gefunden">
    - Das Artefakt ist aufgrund der TTL abgelaufen.
    - Token oder Pfad wurde geändert.
    - Bei der Bereinigung wurden veraltete Daten entfernt.

  </Accordion>
</AccordionGroup>

## Betriebshinweise

- Verwenden Sie für lokale interaktive Überprüfungen im Canvas vorzugsweise `mode: "view"`.
- Verwenden Sie für ausgehende Chat-Kanäle, die einen Anhang benötigen, vorzugsweise `mode: "file"`.
- Lassen Sie `allowRemoteViewer` deaktiviert, sofern Ihre Bereitstellung keine URLs für den Remote-Viewer erfordert.
- Legen Sie für vertrauliche Diffs einen expliziten kurzen Wert für `ttlSeconds` fest.
- Vermeiden Sie es, Geheimnisse in der Diff-Eingabe zu senden, wenn dies nicht erforderlich ist.
- Wenn Ihr Kanal Bilder stark komprimiert (beispielsweise Telegram oder WhatsApp), verwenden Sie vorzugsweise die PDF-Ausgabe (`fileFormat: "pdf"`).

<Note>
Die Diff-Rendering-Engine wird von [Diffs](https://diffs.com) bereitgestellt.
</Note>

## Verwandte Themen

- [Browser](/de/tools/browser)
- [Plugins](/de/tools/plugin)
- [Werkzeugübersicht](/de/tools)
