---
read_when:
    - Videos über den Agenten generieren
    - Videogenerierungs-Provider und -Modelle konfigurieren
    - Parameter des Tools video_generate verstehen
sidebarTitle: Video generation
summary: Generieren Sie Videos über video_generate aus Text-, Bild- oder Videoreferenzen über 16 Provider-Backends hinweg
title: Videogenerierung
x-i18n:
    generated_at: "2026-04-30T07:20:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91409057210af560d389513c2049d643c3e1602df51aa9825ceb01571626cdf
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw-Agenten können Videos aus Textprompts, Referenzbildern oder
vorhandenen Videos erzeugen. Sechzehn Provider-Backends werden unterstützt,
jeweils mit unterschiedlichen Modelloptionen, Eingabemodi und Funktionsumfängen.
Der Agent wählt anhand Ihrer Konfiguration und der verfügbaren API-Schlüssel
automatisch den richtigen Provider aus.

<Note>
Das Tool `video_generate` erscheint nur, wenn mindestens ein Provider für
Videogenerierung verfügbar ist. Wenn Sie es in Ihren Agent-Tools nicht sehen,
setzen Sie einen Provider-API-Schlüssel oder konfigurieren Sie
`agents.defaults.videoGenerationModel`.
</Note>

OpenClaw behandelt Videogenerierung als drei Laufzeitmodi:

- `generate` — Text-zu-Video-Anfragen ohne Referenzmedien.
- `imageToVideo` — Anfrage enthält ein oder mehrere Referenzbilder.
- `videoToVideo` — Anfrage enthält ein oder mehrere Referenzvideos.

Provider können beliebige Teilmengen dieser Modi unterstützen. Das Tool
validiert den aktiven Modus vor dem Absenden und meldet unterstützte Modi in
`action=list`.

## Schnellstart

<Steps>
  <Step title="Authentifizierung konfigurieren">
    Setzen Sie einen API-Schlüssel für einen beliebigen unterstützten Provider:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Standardmodell auswählen (optional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Den Agenten fragen">
    > Erzeuge ein 5-sekündiges filmisches Video eines freundlichen Hummers, der bei Sonnenuntergang surft.

    Der Agent ruft `video_generate` automatisch auf. Es ist keine
    Tool-Zulassungsliste erforderlich.

  </Step>
</Steps>

## So funktioniert asynchrone Generierung

Videogenerierung ist asynchron. Wenn der Agent `video_generate` in einer
Sitzung aufruft:

1. OpenClaw sendet die Anfrage an den Provider und gibt sofort eine Task-ID zurück.
2. Der Provider verarbeitet den Auftrag im Hintergrund (typischerweise 30 Sekunden bis 5 Minuten, abhängig von Provider und Auflösung).
3. Wenn das Video bereit ist, weckt OpenClaw dieselbe Sitzung mit einem internen Abschlussereignis.
4. Der Agent postet das fertige Video zurück in die ursprüngliche Unterhaltung.

Während ein Auftrag läuft, geben doppelte `video_generate`-Aufrufe in derselben
Sitzung den aktuellen Task-Status zurück, statt eine weitere Generierung zu
starten. Verwenden Sie `openclaw tasks list` oder `openclaw tasks show <taskId>`,
um den Fortschritt über die CLI zu prüfen.

Außerhalb sitzungsgebundener Agent-Ausführungen (zum Beispiel bei direkten
Tool-Aufrufen) fällt das Tool auf Inline-Generierung zurück und gibt den finalen
Medienpfad im selben Zug zurück.

Generierte Videodateien werden im von OpenClaw verwalteten Medienspeicher
gespeichert, wenn der Provider Bytes zurückgibt. Die standardmäßige
Speicherobergrenze für generierte Videos folgt dem Videomedienlimit, und
`agents.defaults.mediaMaxMb` erhöht sie für größere Renderings. Wenn ein
Provider zusätzlich eine gehostete Ausgabe-URL zurückgibt, kann OpenClaw diese
URL ausliefern, statt den Task fehlschlagen zu lassen, wenn die lokale
Persistierung eine zu große Datei ablehnt.

### Task-Lebenszyklus

| Zustand     | Bedeutung                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | Task erstellt, wartet darauf, dass der Provider ihn annimmt.                                      |
| `running`   | Provider verarbeitet ihn (typischerweise 30 Sekunden bis 5 Minuten, abhängig von Provider und Auflösung). |
| `succeeded` | Video bereit; der Agent wacht auf und postet es in die Unterhaltung.                              |
| `failed`    | Provider-Fehler oder Timeout; der Agent wacht mit Fehlerdetails auf.                              |

Status über die CLI prüfen:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Wenn für die aktuelle Sitzung bereits ein Video-Task `queued` oder `running`
ist, gibt `video_generate` den bestehenden Task-Status zurück, statt einen neuen
zu starten. Verwenden Sie `action: "status"`, um ausdrücklich zu prüfen, ohne
eine neue Generierung auszulösen.

## Unterstützte Provider

| Provider              | Standardmodell                  | Text | Bildreferenz                                        | Videoreferenz                                  | Authentifizierung                       |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Ja (Remote-URL)                                      | Ja (Remote-URL)                                 | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | Bis zu 2 Bilder (nur I2V-Modelle; erstes + letztes Frame) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | Bis zu 2 Bilder (erstes + letztes Frame über Rolle)  | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | Bis zu 9 Referenzbilder                              | Bis zu 3 Videos                                 | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 Bild                                               | —                                               | `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 Bild; bis zu 9 mit Seedance Reference-to-Video     | Bis zu 3 Videos mit Seedance Reference-to-Video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 Bild                                               | 1 Video                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 Bild                                               | —                                               | `MINIMAX_API_KEY` oder MiniMax OAuth     |
| OpenAI                | `sora-2`                        |  ✓   | 1 Bild                                               | 1 Video                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | Bis zu 4 Bilder (erstes/letztes Frame oder Referenzen) | —                                             | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | Ja (Remote-URL)                                      | Ja (Remote-URL)                                 | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 Bild                                               | 1 Video                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 Bild                                               | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 Bild (`kling`)                                     | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 Erst-Frame-Bild oder bis zu 7 `reference_image`s   | 1 Video                                         | `XAI_API_KEY`                            |

Einige Provider akzeptieren zusätzliche oder alternative API-Schlüssel-Umgebungsvariablen.
Details finden Sie auf den einzelnen [Provider-Seiten](#related).

Führen Sie `video_generate action=list` aus, um verfügbare Provider, Modelle
und Laufzeitmodi zur Laufzeit zu prüfen.

### Funktionsmatrix

Der explizite Modusvertrag, der von `video_generate`, Vertragstests und dem
gemeinsamen Live-Sweep verwendet wird:

| Provider   | `generate` | `imageToVideo` | `videoToVideo` | Gemeinsame Live-Lanes heute                                                                                                             |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` übersprungen, da dieser Provider Remote-`http(s)`-Video-URLs benötigt                         |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | Nicht im gemeinsamen Sweep; workflow-spezifische Abdeckung liegt bei den Comfy-Tests                                                     |
| DeepInfra  |     ✓      |       —        |       —        | `generate`; native DeepInfra-Videoschemas sind Text-zu-Video im gebündelten Vertrag                                                      |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` nur bei Verwendung von Seedance Reference-to-Video                                             |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; gemeinsames `videoToVideo` übersprungen, da der aktuelle pufferbasierte Gemini/Veo-Sweep diese Eingabe nicht akzeptiert |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; gemeinsames `videoToVideo` übersprungen, da dieser Organisations-/Eingabepfad derzeit Provider-seitigen Inpaint-/Remix-Zugriff benötigt |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` übersprungen, da dieser Provider Remote-`http(s)`-Video-URLs benötigt                         |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` läuft nur, wenn das ausgewählte Modell `runway/gen4_aleph` ist                                |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`; gemeinsames `imageToVideo` übersprungen, da das gebündelte `veo3` nur Text unterstützt und das gebündelte `kling` eine Remote-Bild-URL erfordert |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` übersprungen, da dieser Provider derzeit eine Remote-MP4-URL benötigt                         |

## Tool-Parameter

### Erforderlich

<ParamField path="prompt" type="string" required>
  Textbeschreibung des zu erzeugenden Videos. Erforderlich für `action: "generate"`.
</ParamField>

### Inhaltseingaben

<ParamField path="image" type="string">Einzelnes Referenzbild (Pfad oder URL).</ParamField>
<ParamField path="images" type="string[]">Mehrere Referenzbilder (bis zu 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Optionale positionsbezogene Rollenhinweise parallel zur kombinierten Bildliste.
Kanonische Werte: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Einzelnes Referenzvideo (Pfad oder URL).</ParamField>
<ParamField path="videos" type="string[]">Mehrere Referenzvideos (bis zu 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Optionale positionsbezogene Rollenhinweise parallel zur kombinierten Videoliste.
Kanonischer Wert: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Einzelnes Referenzaudio (Pfad oder URL). Wird für Hintergrundmusik oder als
Stimmreferenz verwendet, wenn der Provider Audioeingaben unterstützt.
</ParamField>
<ParamField path="audioRefs" type="string[]">Mehrere Referenzaudios (bis zu 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Optionale positionsbezogene Rollenhinweise parallel zur kombinierten Audioliste.
Kanonischer Wert: `reference_audio`.
</ParamField>

<Note>
Rollenhinweise werden unverändert an den Provider weitergeleitet. Kanonische
Werte stammen aus der Union `VideoGenerationAssetRole`, aber Provider können
zusätzliche Rollen-Strings akzeptieren. `*Roles`-Arrays dürfen nicht mehr
Einträge haben als die entsprechende Referenzliste; Off-by-one-Fehler schlagen
mit einer klaren Fehlermeldung fehl. Verwenden Sie eine leere Zeichenfolge,
um einen Slot nicht festzulegen. Für xAI setzen Sie jede Bildrolle auf
`reference_image`, um den Generierungsmodus `reference_images` zu verwenden;
lassen Sie die Rolle weg oder verwenden Sie `first_frame` für Bild-zu-Video
mit einem einzelnen Bild.
</Note>

### Stilsteuerungen

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` oder `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P` oder `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  Zieldauer in Sekunden (auf den nächstgelegenen vom Provider unterstützten Wert gerundet).
</ParamField>
<ParamField path="size" type="string">Größenhinweis, wenn der Provider ihn unterstützt.</ParamField>
<ParamField path="audio" type="boolean">
  Aktivieren Sie generiertes Audio in der Ausgabe, wenn unterstützt. Unterschiedlich von `audioRef*` (Eingaben).
</ParamField>
<ParamField path="watermark" type="boolean">Provider-Wasserzeichen umschalten, wenn unterstützt.</ParamField>

`adaptive` ist ein Provider-spezifischer Sentinel: Er wird unverändert an
Provider weitergeleitet, die `adaptive` in ihren Fähigkeiten deklarieren
(z. B. verwendet BytePlus Seedance dies, um das Seitenverhältnis automatisch
aus den Abmessungen des Eingabebilds zu erkennen). Provider, die dies nicht
deklarieren, zeigen den Wert über `details.ignoredOverrides` im Tool-Ergebnis
an, sodass das Verwerfen sichtbar ist.

### Erweitert

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` gibt die aktuelle Session-Aufgabe zurück; `"list"` prüft Provider.
</ParamField>
<ParamField path="model" type="string">Provider-/Modell-Override (z. B. `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Hinweis für den Ausgabedateinamen.</ParamField>
<ParamField path="timeoutMs" type="number">Optionales Timeout für Provider-Anfragen in Millisekunden.</ParamField>
<ParamField path="providerOptions" type="object">
  Provider-spezifische Optionen als JSON-Objekt (z. B. `{"seed": 42, "draft": true}`).
  Provider, die ein typisiertes Schema deklarieren, validieren die Schlüssel und Typen;
  unbekannte Schlüssel oder Nichtübereinstimmungen überspringen den Kandidaten während
  des Fallbacks. Provider ohne deklariertes Schema erhalten die Optionen unverändert.
  Führen Sie `video_generate action=list` aus, um zu sehen, was jeder Provider akzeptiert.
</ParamField>

<Note>
Nicht alle Provider unterstützen alle Parameter. OpenClaw normalisiert die
Dauer auf den nächstgelegenen vom Provider unterstützten Wert und ordnet
übersetzte Geometriehinweise wie Größe-zu-Seitenverhältnis neu zu, wenn ein
Fallback-Provider eine andere Steuerungsoberfläche bereitstellt. Wirklich
nicht unterstützte Overrides werden nach bestem Aufwand ignoriert und im
Tool-Ergebnis als Warnungen gemeldet. Harte Fähigkeitsgrenzen (z. B. zu viele
Referenzeingaben) schlagen vor dem Absenden fehl. Tool-Ergebnisse melden die
angewendeten Einstellungen; `details.normalization` erfasst jede Übersetzung
von angefragt zu angewendet.
</Note>

Referenzeingaben wählen den Laufzeitmodus aus:

- Keine Referenzmedien → `generate`
- Beliebige Bildreferenz → `imageToVideo`
- Beliebige Videoreferenz → `videoToVideo`
- Referenzaudio-Eingaben ändern den aufgelösten Modus **nicht**; sie werden
  zusätzlich zu dem Modus angewendet, den die Bild-/Videoreferenzen auswählen,
  und funktionieren nur mit Providern, die `maxInputAudios` deklarieren.

Gemischte Bild- und Videoreferenzen sind keine stabile gemeinsame Fähigkeitsoberfläche.
Bevorzugen Sie einen Referenztyp pro Anfrage.

#### Fallback und typisierte Optionen

Einige Fähigkeitsprüfungen werden auf der Fallback-Ebene statt an der
Tool-Grenze angewendet, sodass eine Anfrage, die die Grenzen des primären
Providers überschreitet, weiterhin auf einem geeigneten Fallback ausgeführt
werden kann:

- Aktiver Kandidat, der kein `maxInputAudios` (oder `0`) deklariert, wird
  übersprungen, wenn die Anfrage Audioreferenzen enthält; der nächste Kandidat
  wird ausprobiert.
- `maxDurationSeconds` des aktiven Kandidaten liegt unter dem angefragten
  `durationSeconds` und es gibt keine deklarierte Liste `supportedDurationSeconds`
  → übersprungen.
- Anfrage enthält `providerOptions` und der aktive Kandidat deklariert explizit
  ein typisiertes `providerOptions`-Schema → übersprungen, wenn bereitgestellte
  Schlüssel nicht im Schema enthalten sind oder Werttypen nicht übereinstimmen.
  Provider ohne deklariertes Schema erhalten Optionen unverändert
  (rückwärtskompatible Durchreichung). Ein Provider kann alle Provider-Optionen
  ablehnen, indem er ein leeres Schema deklariert (`capabilities.providerOptions: {}`),
  was zum gleichen Überspringen wie eine Typabweichung führt.

Der erste Überspringgrund in einer Anfrage wird mit `warn` protokolliert,
damit Betreiber sehen, wenn ihr primärer Provider übergangen wurde; nachfolgende
Überspringvorgänge werden mit `debug` protokolliert, um lange Fallback-Ketten
ruhig zu halten. Wenn jeder Kandidat übersprungen wird, enthält der aggregierte
Fehler den Überspringgrund für jeden Kandidaten.

## Aktionen

| Aktion     | Was sie tut                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| `generate` | Standard. Erstellt ein Video aus dem angegebenen Prompt und optionalen Referenzeingaben.                     |
| `status`   | Prüft den Status der laufenden Videoaufgabe für die aktuelle Session, ohne eine weitere Generierung zu starten. |
| `list`     | Zeigt verfügbare Provider, Modelle und deren Fähigkeiten an.                                                  |

## Modellauswahl

OpenClaw löst das Modell in dieser Reihenfolge auf:

1. **`model`-Tool-Parameter** — wenn der Agent einen im Aufruf angibt.
2. **`videoGenerationModel.primary`** aus der Konfiguration.
3. **`videoGenerationModel.fallbacks`** der Reihe nach.
4. **Automatische Erkennung** — Provider mit gültiger Authentifizierung, beginnend mit dem
   aktuellen Standard-Provider, danach die verbleibenden Provider in alphabetischer
   Reihenfolge.

Wenn ein Provider fehlschlägt, wird der nächste Kandidat automatisch ausprobiert.
Wenn alle Kandidaten fehlschlagen, enthält der Fehler Details zu jedem Versuch.

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

## Provider-Hinweise

<AccordionGroup>
  <Accordion title="Alibaba">
    Verwendet den asynchronen Endpunkt von DashScope / Model Studio. Referenzbilder
    und -videos müssen entfernte `http(s)`-URLs sein.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    Provider-ID: `byteplus`.

    Modelle: `seedance-1-0-pro-250528` (Standard),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    T2V-Modelle (`*-t2v-*`) akzeptieren keine Bildeingaben; I2V-Modelle und
    allgemeine `*-pro-*`-Modelle unterstützen ein einzelnes Referenzbild
    (erstes Frame). Übergeben Sie das Bild positionsbezogen oder setzen Sie
    `role: "first_frame"`. T2V-Modell-IDs werden automatisch auf die entsprechende
    I2V-Variante umgestellt, wenn ein Bild bereitgestellt wird.

    Unterstützte `providerOptions`-Schlüssel: `seed` (number), `draft` (boolean —
    erzwingt 480p), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Erfordert das Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Provider-ID: `byteplus-seedance15`. Modell:
    `seedance-1-5-pro-251215`.

    Verwendet die einheitliche `content[]`-API. Unterstützt höchstens 2 Eingabebilder
    (`first_frame` + `last_frame`). Alle Eingaben müssen entfernte `https://`-URLs
    sein. Setzen Sie `role: "first_frame"` / `"last_frame"` für jedes Bild, oder
    übergeben Sie Bilder positionsbezogen.

    `aspectRatio: "adaptive"` erkennt das Seitenverhältnis automatisch aus dem Eingabebild.
    `audio: true` wird auf `generate_audio` abgebildet. `providerOptions.seed`
    (number) wird weitergeleitet.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Erfordert das Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Provider-ID: `byteplus-seedance2`. Modelle:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Verwendet die einheitliche `content[]`-API. Unterstützt bis zu 9 Referenzbilder,
    3 Referenzvideos und 3 Referenzaudios. Alle Eingaben müssen entfernte
    `https://`-URLs sein. Setzen Sie `role` für jedes Asset — unterstützte Werte:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` erkennt das Seitenverhältnis automatisch aus dem Eingabebild.
    `audio: true` wird auf `generate_audio` abgebildet. `providerOptions.seed`
    (number) wird weitergeleitet.

  </Accordion>
  <Accordion title="ComfyUI">
    Workflow-gesteuerte lokale oder Cloud-Ausführung. Unterstützt Text-zu-Video und
    Bild-zu-Video über den konfigurierten Graphen.
  </Accordion>
  <Accordion title="fal">
    Verwendet einen warteschlangengestützten Ablauf für lang laufende Jobs. Die meisten
    fal-Videomodelle akzeptieren eine einzelne Bildreferenz. Seedance-2.0-Referenz-zu-Video-
    Modelle akzeptieren bis zu 9 Bilder, 3 Videos und 3 Audioreferenzen mit
    höchstens 12 Referenzdateien insgesamt.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Unterstützt eine Bild- oder eine Videoreferenz.
  </Accordion>
  <Accordion title="MiniMax">
    Nur einzelne Bildreferenz.
  </Accordion>
  <Accordion title="OpenAI">
    Nur der `size`-Override wird weitergeleitet. Andere Stil-Overrides
    (`aspectRatio`, `resolution`, `audio`, `watermark`) werden mit einer
    Warnung ignoriert.
  </Accordion>
  <Accordion title="OpenRouter">
    Verwendet die asynchrone `/videos`-API von OpenRouter. OpenClaw sendet den
    Job, fragt `polling_url` ab und lädt entweder `unsigned_urls` oder den
    dokumentierten Inhaltsendpunkt des Jobs herunter. Der gebündelte Standard
    `google/veo-3.1-fast` bewirbt Dauern von 4/6/8 Sekunden, Auflösungen
    `720P`/`1080P` und Seitenverhältnisse `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Dasselbe DashScope-Backend wie Alibaba. Referenzeingaben müssen entfernte
    `http(s)`-URLs sein; lokale Dateien werden im Voraus abgelehnt.
  </Accordion>
  <Accordion title="Runway">
    Unterstützt lokale Dateien über Daten-URIs. Video-zu-Video erfordert
    `runway/gen4_aleph`. Reine Textläufe stellen Seitenverhältnisse `16:9`
    und `9:16` bereit.
  </Accordion>
  <Accordion title="Together">
    Nur einzelne Bildreferenz.
  </Accordion>
  <Accordion title="Vydra">
    Verwendet `https://www.vydra.ai/api/v1` direkt, um Weiterleitungen zu vermeiden,
    die Authentifizierung entfernen. `veo3` ist nur als Text-zu-Video gebündelt;
    `kling` erfordert eine entfernte Bild-URL.
  </Accordion>
  <Accordion title="xAI">
    Unterstützt Text-zu-Video, Bild-zu-Video mit einem einzelnen ersten Frame, bis zu
    7 `reference_image`-Eingaben über xAI `reference_images` sowie entfernte
    Video-Bearbeitungs-/Erweiterungsabläufe.
  </Accordion>
</AccordionGroup>

## Provider-Fähigkeitsmodi

Der gemeinsame Vertrag für die Videogenerierung unterstützt modusbezogene Fähigkeiten
statt nur flacher aggregierter Limits. Neue Provider-Implementierungen
sollten explizite Modusblöcke bevorzugen:

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

Flache aggregierte Felder wie `maxInputImages` und `maxInputVideos` reichen
**nicht** aus, um Unterstützung für Transformationsmodi auszuweisen. Provider sollten
`generate`, `imageToVideo` und `videoToVideo` explizit deklarieren, damit Live-Tests,
Vertragstests und das gemeinsame Tool `video_generate` die Modusunterstützung
deterministisch validieren können.

Wenn ein Modell in einem Provider breitere Unterstützung für Referenzeingaben hat als
die übrigen, verwenden Sie `maxInputImagesByModel`, `maxInputVideosByModel` oder
`maxInputAudiosByModel`, statt das modusweite Limit zu erhöhen.

## Live-Tests

Optionale Live-Abdeckung für die gemeinsamen gebündelten Provider:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Repo-Wrapper:

```bash
pnpm test:live:media video
```

Diese Live-Datei lädt fehlende Provider-Umgebungsvariablen aus `~/.profile`, bevorzugt
standardmäßig Live-/Umgebungs-API-Schlüssel vor gespeicherten Authentifizierungsprofilen
und führt standardmäßig einen release-sicheren Smoke-Test aus:

- `generate` für jeden Nicht-FAL-Provider im Sweep.
- Einsekündiger Hummer-Prompt.
- Vorgangslimit pro Provider aus
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` standardmäßig).

FAL ist optional, da die Queue-Latenz auf Provider-Seite die Release-Zeit dominieren kann:

```bash
pnpm test:live:media video --video-providers fal
```

Setzen Sie `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, um zusätzlich deklarierte
Transformationsmodi auszuführen, die der gemeinsame Sweep sicher mit lokalen Medien
ausüben kann:

- `imageToVideo`, wenn `capabilities.imageToVideo.enabled`.
- `videoToVideo`, wenn `capabilities.videoToVideo.enabled` und der
  Provider/das Modell pufferbasierte lokale Videoeingaben im gemeinsamen
  Sweep akzeptiert.

Derzeit deckt die gemeinsame `videoToVideo`-Live-Lane `runway` nur ab, wenn Sie
`runway/gen4_aleph` auswählen.

## Konfiguration

Legen Sie das Standardmodell für die Videogenerierung in Ihrer OpenClaw-Konfiguration fest:

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
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenverfolgung für asynchrone Videogenerierung
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
- [Tools-Übersicht](/de/tools)
- [Vydra](/de/providers/vydra)
- [xAI](/de/providers/xai)
