---
read_when:
    - Videos über den Agent generieren
    - Provider und Modelle für Videogenerierung konfigurieren
    - Die Parameter des Tools `video_generate` verstehen
sidebarTitle: Video generation
summary: Videos über `video_generate` aus Text-, Bild- oder Video-Referenzen über 14 Provider-Backends hinweg generieren
title: Videogenerierung
x-i18n:
    generated_at: "2026-04-26T11:41:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b70f4d47318c822f06d979308a0e1fce87de40be9c213f64b4c815dcedba944b
    source_path: tools/video-generation.md
    workflow: 15
---

OpenClaw-Agents können Videos aus Text-Prompts, Referenzbildern oder
vorhandenen Videos generieren. Vierzehn Provider-Backends werden unterstützt, jedes mit
unterschiedlichen Modelloptionen, Eingabemodi und Funktionssätzen. Der Agent wählt den
richtigen Provider automatisch auf Basis Ihrer Konfiguration und der verfügbaren API-
Schlüssel aus.

<Note>
Das Tool `video_generate` erscheint nur, wenn mindestens ein Provider für Videogenerierung
verfügbar ist. Wenn Sie es nicht in den Tools Ihres Agent sehen, setzen Sie einen
API-Schlüssel für einen Provider oder konfigurieren Sie `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw behandelt Videogenerierung als drei Laufzeitmodi:

- `generate` — Text-zu-Video-Anfragen ohne Referenzmedien.
- `imageToVideo` — die Anfrage enthält ein oder mehrere Referenzbilder.
- `videoToVideo` — die Anfrage enthält ein oder mehrere Referenzvideos.

Provider können jede Teilmenge dieser Modi unterstützen. Das Tool validiert den
aktiven Modus vor dem Absenden und meldet unterstützte Modi in `action=list`.

## Schnellstart

<Steps>
  <Step title="Authentifizierung konfigurieren">
    Setzen Sie einen API-Schlüssel für einen unterstützten Provider:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Ein Standardmodell auswählen (optional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Den Agent fragen">
    > Erzeuge ein 5 Sekunden langes cineastisches Video eines freundlichen Hummers, der bei Sonnenuntergang surft.

    Der Agent ruft `video_generate` automatisch auf. Kein Tool-Allowlisting
    erforderlich.

  </Step>
</Steps>

## Wie asynchrone Generierung funktioniert

Videogenerierung ist asynchron. Wenn der Agent in einer
Sitzung `video_generate` aufruft:

1. OpenClaw übermittelt die Anfrage an den Provider und gibt sofort eine Aufgaben-ID zurück.
2. Der Provider verarbeitet den Job im Hintergrund (typischerweise 30 Sekunden bis 5 Minuten, abhängig von Provider und Auflösung).
3. Wenn das Video fertig ist, weckt OpenClaw dieselbe Sitzung mit einem internen Abschlussereignis.
4. Der Agent postet das fertige Video zurück in die ursprüngliche Konversation.

Während ein Job läuft, geben doppelte `video_generate`-Aufrufe in derselben
Sitzung den aktuellen Aufgabenstatus zurück, statt eine weitere
Generierung zu starten. Verwenden Sie `openclaw tasks list` oder `openclaw tasks show <taskId>`, um
den Fortschritt über die CLI zu prüfen.

Außerhalb sitzungsgebundener Agent-Läufe (zum Beispiel bei direkten Tool-Aufrufen)
fällt das Tool auf Inline-Generierung zurück und gibt den finalen Medienpfad
im selben Durchlauf zurück.

Erzeugte Videodateien werden im von OpenClaw verwalteten Medienspeicher abgelegt, wenn
der Provider Bytes zurückgibt. Die Standardobergrenze für das Speichern generierter Videos folgt
dem Medienlimit für Videos, und `agents.defaults.mediaMaxMb` erhöht sie für
größere Renderings. Wenn ein Provider zusätzlich eine gehostete Ausgabe-URL zurückgibt, kann OpenClaw
diese URL ausliefern, statt die Aufgabe fehlschlagen zu lassen, falls lokale Persistenz
eine übergroße Datei ablehnt.

### Aufgabenlebenszyklus

| Status      | Bedeutung                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | Aufgabe erstellt, wartet darauf, dass der Provider sie annimmt.                                  |
| `running`   | Der Provider verarbeitet sie (typischerweise 30 Sekunden bis 5 Minuten, je nach Provider und Auflösung). |
| `succeeded` | Video ist bereit; der Agent wird geweckt und postet es in die Konversation.                      |
| `failed`    | Provider-Fehler oder Timeout; der Agent wird mit Fehlerdetails geweckt.                          |

Status über die CLI prüfen:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Wenn für die aktuelle Sitzung bereits eine Videoaufgabe `queued` oder `running` ist,
gibt `video_generate` den bestehenden Aufgabenstatus zurück, statt eine neue zu starten.
Verwenden Sie `action: "status"`, um explizit zu prüfen, ohne eine neue
Generierung auszulösen.

## Unterstützte Provider

| Provider              | Standardmodell                  | Text | Bild-Ref                                             | Video-Ref                                       | Auth                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Ja (Remote-URL)                                      | Ja (Remote-URL)                                 | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | Bis zu 2 Bilder (nur I2V-Modelle; erstes + letztes Frame) | —                                           | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | Bis zu 2 Bilder (erstes + letztes Frame über Rolle)  | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | Bis zu 9 Referenzbilder                              | Bis zu 3 Videos                                 | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 Bild                                               | —                                               | `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 Bild; bis zu 9 mit Seedance reference-to-video     | Bis zu 3 Videos mit Seedance reference-to-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 Bild                                               | 1 Video                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 Bild                                               | —                                               | `MINIMAX_API_KEY` oder MiniMax OAuth     |
| OpenAI                | `sora-2`                        |  ✓   | 1 Bild                                               | 1 Video                                         | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | Ja (Remote-URL)                                      | Ja (Remote-URL)                                 | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 Bild                                               | 1 Video                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 Bild                                               | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 Bild (`kling`)                                     | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 Bild für das erste Frame oder bis zu 7 `reference_image`s | 1 Video                                  | `XAI_API_KEY`                            |

Einige Provider akzeptieren zusätzliche oder alternative Env-Variablen für API-Schlüssel. Siehe
die einzelnen [Provider-Seiten](#related) für Details.

Führen Sie `video_generate action=list` aus, um verfügbare Provider, Modelle und
Laufzeitmodi zur Laufzeit zu prüfen.

### Matrix der Fähigkeiten

Der explizite Modusvertrag, der von `video_generate`, Vertragstests und
dem gemeinsamen Live-Sweep verwendet wird:

| Provider | `generate` | `imageToVideo` | `videoToVideo` | Heutige gemeinsame Live-Lanes                                                                                                          |
| -------- | :--------: | :------------: | :------------: | -------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` wird übersprungen, weil dieser Provider Remote-Video-URLs mit `http(s)` benötigt           |
| BytePlus |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                             |
| ComfyUI  |     ✓      |       ✓        |       —        | Nicht im gemeinsamen Sweep; workflowspezifische Abdeckung liegt bei den Comfy-Tests                                                   |
| fal      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` nur bei Verwendung von Seedance reference-to-video                                         |
| Google   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; gemeinsames `videoToVideo` wird übersprungen, weil der aktuelle buffergestützte Gemini/Veo-Sweep diese Eingabe nicht akzeptiert |
| MiniMax  |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                             |
| OpenAI   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; gemeinsames `videoToVideo` wird übersprungen, weil dieser Pfad für Org/Eingaben derzeit providerseitigen Zugriff auf Inpaint/Remix benötigt |
| Qwen     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` wird übersprungen, weil dieser Provider Remote-Video-URLs mit `http(s)` benötigt           |
| Runway   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` läuft nur, wenn das ausgewählte Modell `runway/gen4_aleph` ist                            |
| Together |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                             |
| Vydra    |     ✓      |       ✓        |       —        | `generate`; gemeinsames `imageToVideo` wird übersprungen, weil das mitgelieferte `veo3` nur Text unterstützt und das mitgelieferte `kling` eine Remote-Bild-URL benötigt |
| xAI      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` wird übersprungen, weil dieser Provider derzeit eine Remote-MP4-URL benötigt              |

## Tool-Parameter

### Erforderlich

<ParamField path="prompt" type="string" required>
  Textbeschreibung des zu generierenden Videos. Erforderlich für `action: "generate"`.
</ParamField>

### Inhaltseingaben

<ParamField path="image" type="string">Einzelnes Referenzbild (Pfad oder URL).</ParamField>
<ParamField path="images" type="string[]">Mehrere Referenzbilder (bis zu 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Optionale Rollenhinweise pro Position parallel zur kombinierten Bildliste.
Kanonische Werte: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Einzelnes Referenzvideo (Pfad oder URL).</ParamField>
<ParamField path="videos" type="string[]">Mehrere Referenzvideos (bis zu 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Optionale Rollenhinweise pro Position parallel zur kombinierten Videoliste.
Kanonischer Wert: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Einzelnes Referenzaudio (Pfad oder URL). Wird für Hintergrundmusik oder Sprach-
Referenz verwendet, wenn der Provider Audioeingaben unterstützt.
</ParamField>
<ParamField path="audioRefs" type="string[]">Mehrere Referenzaudios (bis zu 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Optionale Rollenhinweise pro Position parallel zur kombinierten Audioliste.
Kanonischer Wert: `reference_audio`.
</ParamField>

<Note>
Rollenhinweise werden unverändert an den Provider weitergegeben. Kanonische Werte stammen aus
der Union `VideoGenerationAssetRole`, aber Provider können zusätzliche
Rollen-Strings akzeptieren. Arrays `*Roles` dürfen nicht mehr Einträge haben als die
entsprechende Referenzliste; Off-by-one-Fehler schlagen mit einer klaren Fehlermeldung fehl.
Verwenden Sie einen leeren String, um einen Platz ungesetzt zu lassen. Für xAI setzen Sie jede Bildrolle auf
`reference_image`, um dessen Generierungsmodus `reference_images` zu verwenden; lassen Sie die
Rolle weg oder verwenden Sie `first_frame` für image-to-video mit einem einzelnen Bild.
</Note>

### Stilsteuerungen

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` oder `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P` oder `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  Zieldauer in Sekunden (auf den nächstgelegenen vom Provider unterstützten Wert gerundet).
</ParamField>
<ParamField path="size" type="string">Hinweis zur Größe, wenn der Provider dies unterstützt.</ParamField>
<ParamField path="audio" type="boolean">
  Generiertes Audio in der Ausgabe aktivieren, wenn unterstützt. Unterscheidet sich von `audioRef*` (Eingaben).
</ParamField>
<ParamField path="watermark" type="boolean">Watermarking des Providers umschalten, wenn unterstützt.</ParamField>

`adaptive` ist ein provider-spezifischer Sentinel: Er wird unverändert an
Provider weitergegeben, die `adaptive` in ihren Fähigkeiten deklarieren (z. B. BytePlus
Seedance nutzt es, um das Verhältnis automatisch aus den Abmessungen des
Eingabebildes zu erkennen). Provider, die es nicht deklarieren, geben den Wert über
`details.ignoredOverrides` im Tool-Ergebnis aus, sodass das Verwerfen sichtbar ist.

### Erweitert

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` gibt die aktuelle Sitzungsaufgabe zurück; `"list"` prüft Provider.
</ParamField>
<ParamField path="model" type="string">Überschreibung von Provider/Modell (z. B. `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Hinweis auf den Ausgabedateinamen.</ParamField>
<ParamField path="timeoutMs" type="number">Optionales Timeout für Provider-Anfragen in Millisekunden.</ParamField>
<ParamField path="providerOptions" type="object">
  Provider-spezifische Optionen als JSON-Objekt (z. B. `{"seed": 42, "draft": true}`).
  Provider, die ein typisiertes Schema deklarieren, validieren Schlüssel und Typen; unbekannte
  Schlüssel oder Typabweichungen überspringen den Kandidaten beim Fallback. Provider ohne
  deklariertes Schema erhalten die Optionen unverändert. Führen Sie `video_generate action=list`
  aus, um zu sehen, was jeder Provider akzeptiert.
</ParamField>

<Note>
Nicht alle Provider unterstützen alle Parameter. OpenClaw normalisiert die Dauer auf
den nächstgelegenen vom Provider unterstützten Wert und ordnet übersetzte Geometrie-Hinweise
wie Größe-zu-Seitenverhältnis neu zu, wenn ein Fallback-Provider eine andere
Steuerungsoberfläche bereitstellt. Wirklich nicht unterstützte Überschreibungen werden best-effort ignoriert
und als Warnungen im Tool-Ergebnis gemeldet. Harte Fähigkeitsgrenzen
(wie zu viele Referenzeingaben) schlagen vor dem Absenden fehl. Tool-Ergebnisse
melden angewendete Einstellungen; `details.normalization` erfasst jede
Übersetzung von angefordert zu angewendet.
</Note>

Referenzeingaben wählen den Laufzeitmodus:

- Keine Referenzmedien → `generate`
- Beliebige Bildreferenz → `imageToVideo`
- Beliebige Videoreferenz → `videoToVideo`
- Referenz-Audioeingaben ändern den aufgelösten Modus **nicht**; sie werden auf
  den von Bild-/Videoreferenzen ausgewählten Modus aufgesetzt und funktionieren nur
  mit Providern, die `maxInputAudios` deklarieren.

Gemischte Bild- und Videoreferenzen sind keine stabile gemeinsame Oberfläche von Fähigkeiten.
Bevorzugen Sie einen Referenztyp pro Anfrage.

#### Fallback und typisierte Optionen

Einige Prüfungen von Fähigkeiten werden auf der Fallback-Ebene statt an der
Tool-Grenze angewendet, sodass eine Anfrage, die die Grenzen des primären Providers überschreitet, trotzdem
auf einem fähigen Fallback laufen kann:

- Aktiver Kandidat, der kein `maxInputAudios` (oder `0`) deklariert, wird übersprungen, wenn
  die Anfrage Audio-Referenzen enthält; der nächste Kandidat wird versucht.
- `maxDurationSeconds` des aktiven Kandidaten liegt unter der angeforderten `durationSeconds`
  und es gibt keine deklarierte Liste `supportedDurationSeconds` → wird übersprungen.
- Die Anfrage enthält `providerOptions` und der aktive Kandidat deklariert explizit
  ein typisiertes Schema für `providerOptions` → wird übersprungen, wenn angegebene Schlüssel
  nicht im Schema stehen oder Werttypen nicht passen. Provider ohne
  deklariertes Schema erhalten Optionen unverändert (abwärtskompatibles
  Durchreichen). Ein Provider kann alle Provider-Optionen deaktivieren, indem er
  ein leeres Schema deklariert (`capabilities.providerOptions: {}`), was
  denselben Skip wie ein Typkonflikt auslöst.

Der erste Skip-Grund in einer Anfrage wird auf `warn` protokolliert, damit Operatoren sehen,
wenn ihr primärer Provider übersprungen wurde; weitere Skips werden auf `debug` protokolliert, um
lange Fallback-Ketten ruhig zu halten. Wenn jeder Kandidat übersprungen wird, enthält der
aggregierte Fehler den Skip-Grund für jeden einzelnen.

## Aktionen

| Aktion     | Funktion                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| `generate` | Standard. Erstellt ein Video aus dem gegebenen Prompt und optionalen Referenzeingaben.                    |
| `status`   | Prüft den Status der laufenden Videoaufgabe für die aktuelle Sitzung, ohne eine weitere Generierung zu starten. |
| `list`     | Zeigt verfügbare Provider, Modelle und deren Fähigkeiten an.                                              |

## Modellauswahl

OpenClaw löst das Modell in dieser Reihenfolge auf:

1. **Tool-Parameter `model`** — wenn der Agent ihn im Aufruf angibt.
2. **`videoGenerationModel.primary`** aus der Konfiguration.
3. **`videoGenerationModel.fallbacks`** in Reihenfolge.
4. **Automatische Erkennung** — Provider mit gültiger Auth, beginnend mit dem
   aktuellen Standard-Provider, dann verbleibende Provider in alphabetischer
   Reihenfolge.

Wenn ein Provider fehlschlägt, wird automatisch der nächste Kandidat versucht. Wenn alle
Kandidaten fehlschlagen, enthält der Fehler Details zu jedem Versuch.

Setzen Sie `agents.defaults.mediaGenerationAutoProviderFallback: false`, um
nur die expliziten Einträge `model`, `primary` und `fallbacks` zu verwenden.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## Hinweise zu Providern

<AccordionGroup>
  <Accordion title="Alibaba">
    Verwendet den asynchronen Endpunkt von DashScope / Model Studio. Referenzbilder und
    -videos müssen Remote-URLs mit `http(s)` sein.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    Provider-ID: `byteplus`.

    Modelle: `seedance-1-0-pro-250528` (Standard),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    T2V-Modelle (`*-t2v-*`) akzeptieren keine Bildeingaben; I2V-Modelle und
    allgemeine `*-pro-*`-Modelle unterstützen ein einzelnes Referenzbild (erstes
    Frame). Übergeben Sie das Bild positional oder setzen Sie `role: "first_frame"`.
    T2V-Modell-IDs werden automatisch auf die entsprechende I2V-
    Variante umgeschaltet, wenn ein Bild angegeben wird.

    Unterstützte Schlüssel in `providerOptions`: `seed` (Zahl), `draft` (Boolean —
    erzwingt 480p), `camera_fixed` (Boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Erfordert das Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Provider-ID: `byteplus-seedance15`. Modell:
    `seedance-1-5-pro-251215`.

    Verwendet die vereinheitlichte API `content[]`. Unterstützt höchstens 2 Eingabebilder
    (`first_frame` + `last_frame`). Alle Eingaben müssen Remote-`https://`-
    URLs sein. Setzen Sie `role: "first_frame"` / `"last_frame"` für jedes Bild oder
    übergeben Sie Bilder positional.

    `aspectRatio: "adaptive"` erkennt das Verhältnis automatisch aus dem Eingabebild.
    `audio: true` wird auf `generate_audio` abgebildet. `providerOptions.seed`
    (Zahl) wird weitergegeben.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Erfordert das Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Provider-ID: `byteplus-seedance2`. Modelle:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Verwendet die vereinheitlichte API `content[]`. Unterstützt bis zu 9 Referenzbilder,
    3 Referenzvideos und 3 Referenz-Audios. Alle Eingaben müssen Remote-
    `https://`-URLs sein. Setzen Sie `role` für jedes Asset — unterstützte Werte:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` erkennt das Verhältnis automatisch aus dem Eingabebild.
    `audio: true` wird auf `generate_audio` abgebildet. `providerOptions.seed`
    (Zahl) wird weitergegeben.

  </Accordion>
  <Accordion title="ComfyUI">
    Workflow-gesteuerte lokale oder Cloud-Ausführung. Unterstützt Text-zu-Video und
    Bild-zu-Video über den konfigurierten Graphen.
  </Accordion>
  <Accordion title="fal">
    Verwendet einen queue-gestützten Ablauf für lang laufende Jobs. Die meisten Video-Modelle von fal
    akzeptieren eine einzelne Bildreferenz. Seedance 2.0 reference-to-video-
    Modelle akzeptieren bis zu 9 Bilder, 3 Videos und 3 Audio-Referenzen mit
    höchstens 12 Referenzdateien insgesamt.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Unterstützt ein Bild oder eine Videoreferenz.
  </Accordion>
  <Accordion title="MiniMax">
    Nur eine einzelne Bildreferenz.
  </Accordion>
  <Accordion title="OpenAI">
    Nur die Überschreibung `size` wird weitergegeben. Andere Stil-Überschreibungen
    (`aspectRatio`, `resolution`, `audio`, `watermark`) werden ignoriert und mit
    einer Warnung versehen.
  </Accordion>
  <Accordion title="Qwen">
    Dasselbe DashScope-Backend wie Alibaba. Referenzeingaben müssen Remote-
    `http(s)`-URLs sein; lokale Dateien werden bereits im Vorfeld abgelehnt.
  </Accordion>
  <Accordion title="Runway">
    Unterstützt lokale Dateien über Daten-URIs. Video-zu-Video erfordert
    `runway/gen4_aleph`. Reine Textläufe bieten die Seitenverhältnisse
    `16:9` und `9:16`.
  </Accordion>
  <Accordion title="Together">
    Nur eine einzelne Bildreferenz.
  </Accordion>
  <Accordion title="Vydra">
    Verwendet direkt `https://www.vydra.ai/api/v1`, um Weiterleitungen zu vermeiden,
    bei denen Auth verworfen wird. `veo3` ist nur für Text-zu-Video mitgeliefert; `kling` erfordert
    eine Remote-Bild-URL.
  </Accordion>
  <Accordion title="xAI">
    Unterstützt Text-zu-Video, Image-to-Video mit einem einzelnen ersten Frame, bis zu 7
    Eingaben `reference_image` über xAI `reference_images` und Remote-
    Video-Edit-/Extend-Abläufe.
  </Accordion>
</AccordionGroup>

## Provider-Fähigkeitsmodi

Der gemeinsame Vertrag für Videogenerierung unterstützt modusspezifische Fähigkeiten
anstatt nur flache aggregierte Limits. Neue Provider-Implementierungen
sollten explizite Modus-Blöcke bevorzugen:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxInputImagesByModel: { "provider/reference-to-video": 9 },
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

Flache aggregierte Felder wie `maxInputImages` und `maxInputVideos` sind
**nicht** ausreichend, um Unterstützung für Transformationsmodi zu bewerben. Provider sollten
`generate`, `imageToVideo` und `videoToVideo` explizit deklarieren, damit Live-
Tests, Vertragstests und das gemeinsame Tool `video_generate` die Unterstützung der Modi deterministisch validieren können.

Wenn ein Modell innerhalb eines Providers eine breitere Unterstützung für Referenzeingaben hat als der
Rest, verwenden Sie `maxInputImagesByModel`, `maxInputVideosByModel` oder
`maxInputAudiosByModel`, statt das modeweite Limit zu erhöhen.

## Live-Tests

Opt-in-Live-Abdeckung für die gemeinsamen mitgelieferten Provider:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Repo-Wrapper:

```bash
pnpm test:live:media video
```

Diese Live-Datei lädt fehlende Provider-Env-Variablen aus `~/.profile`, bevorzugt
standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen und führt
standardmäßig einen release-sicheren Smoke aus:

- `generate` für jeden Nicht-FAL-Provider im Sweep.
- Ein einsekündiger Lobster-Prompt.
- Obergrenze pro Provider-Vorgang aus
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` standardmäßig).

FAL ist Opt-in, weil providerseitige Queue-Latenz die Release-
Zeit dominieren kann:

```bash
pnpm test:live:media video --video-providers fal
```

Setzen Sie `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, um zusätzlich deklarierte
Transformationsmodi auszuführen, die der gemeinsame Sweep sicher mit lokalen Medien testen kann:

- `imageToVideo`, wenn `capabilities.imageToVideo.enabled`.
- `videoToVideo`, wenn `capabilities.videoToVideo.enabled` und das
  Provider-/Modellpaar im gemeinsamen Sweep lokal gepufferte Videoeingaben akzeptiert.

Heute deckt die gemeinsame Live-Lane `videoToVideo` nur `runway` ab, wenn Sie
`runway/gen4_aleph` auswählen.

## Konfiguration

Setzen Sie das Standardmodell für Videogenerierung in Ihrer OpenClaw-Konfiguration:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

Oder über die CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Verwandt

- [Alibaba Model Studio](/de/providers/alibaba)
- [Hintergrundaufgaben](/de/automation/tasks) — Nachverfolgung von Aufgaben für asynchrone Videogenerierung
- [BytePlus](/de/concepts/model-providers#byteplus-international)
- [ComfyUI](/de/providers/comfy)
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults)
- [fal](/de/providers/fal)
- [Google (Gemini)](/de/providers/google)
- [MiniMax](/de/providers/minimax)
- [Modelle](/de/concepts/models)
- [OpenAI](/de/providers/openai)
- [Qwen](/de/providers/qwen)
- [Runway](/de/providers/runway)
- [Together AI](/de/providers/together)
- [Tools overview](/de/tools)
- [Vydra](/de/providers/vydra)
- [xAI](/de/providers/xai)
