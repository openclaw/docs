---
read_when:
    - Generieren von Videos über den Agenten
    - Konfigurieren von Providern und Modellen für die Videogenerierung
    - Verstehen der Parameter des Tools `video_generate`
summary: Generieren Sie Videos aus Text, Bildern oder vorhandenen Videos mit 14 Provider-Backends
title: Videogenerierung
x-i18n:
    generated_at: "2026-04-25T18:23:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: f04c9ac25a0ad08036266ab0c61a6ddf41ad944f64aa273ba31e09fc5774ac74
    source_path: tools/video-generation.md
    workflow: 15
---

OpenClaw-Agenten können Videos aus Text-Prompts, Referenzbildern oder vorhandenen Videos generieren. Vierzehn Provider-Backends werden unterstützt, jeweils mit unterschiedlichen Modelloptionen, Eingabemodi und Funktionsumfängen. Der Agent wählt automatisch den passenden Provider anhand Ihrer Konfiguration und der verfügbaren API-Schlüssel aus.

<Note>
Das Tool `video_generate` erscheint nur, wenn mindestens ein Provider für die Videogenerierung verfügbar ist. Wenn Sie es nicht in den Agent-Tools sehen, setzen Sie einen API-Schlüssel für einen Provider oder konfigurieren Sie `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw behandelt die Videogenerierung als drei Laufzeitmodi:

- `generate` für Text-zu-Video-Anfragen ohne Referenzmedien
- `imageToVideo`, wenn die Anfrage ein oder mehrere Referenzbilder enthält
- `videoToVideo`, wenn die Anfrage ein oder mehrere Referenzvideos enthält

Provider können jede beliebige Teilmenge dieser Modi unterstützen. Das Tool validiert den aktiven
Modus vor dem Absenden und meldet unterstützte Modi in `action=list`.

## Schnellstart

1. Setzen Sie einen API-Schlüssel für einen unterstützten Provider:

```bash
export GEMINI_API_KEY="your-key"
```

2. Legen Sie optional ein Standardmodell fest:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Fragen Sie den Agenten:

> Erzeuge ein 5 Sekunden langes cineastisches Video von einem freundlichen Hummer, der bei Sonnenuntergang surft.

Der Agent ruft `video_generate` automatisch auf. Eine Tool-Allowlist ist nicht erforderlich.

## Was passiert, wenn Sie ein Video generieren

Die Videogenerierung erfolgt asynchron. Wenn der Agent `video_generate` in einer Sitzung aufruft:

1. OpenClaw sendet die Anfrage an den Provider und gibt sofort eine Task-ID zurück.
2. Der Provider verarbeitet den Job im Hintergrund (typischerweise 30 Sekunden bis 5 Minuten, abhängig von Provider und Auflösung).
3. Wenn das Video bereit ist, weckt OpenClaw dieselbe Sitzung mit einem internen Abschlussereignis auf.
4. Der Agent sendet das fertige Video zurück in die ursprüngliche Konversation.

Während ein Job läuft, geben doppelte `video_generate`-Aufrufe in derselben Sitzung den aktuellen Task-Status zurück, anstatt eine neue Generierung zu starten. Verwenden Sie `openclaw tasks list` oder `openclaw tasks show <taskId>`, um den Fortschritt über die CLI zu prüfen.

Außerhalb sitzungsgestützter Agent-Läufe (zum Beispiel bei direkten Tool-Aufrufen) fällt das Tool auf Inline-Generierung zurück und gibt im selben Turn den finalen Medienpfad zurück.

Generierte Videodateien werden im von OpenClaw verwalteten Medienspeicher gespeichert, wenn der
Provider Bytes zurückgibt. Die Standardobergrenze für das Speichern generierter Videos folgt dem Limit
für Videomedien, und `agents.defaults.mediaMaxMb` erhöht sie für größere Renderings.
Wenn ein Provider zusätzlich eine gehostete Ausgabe-URL zurückgibt, kann OpenClaw diese URL zustellen,
anstatt die Task fehlschlagen zu lassen, falls die lokale Persistenz eine übergroße Datei ablehnt.

### Task-Lebenszyklus

Jede `video_generate`-Anfrage durchläuft vier Zustände:

1. **queued** -- Task erstellt, wartet darauf, dass der Provider sie annimmt.
2. **running** -- Provider verarbeitet die Anfrage (typischerweise 30 Sekunden bis 5 Minuten, abhängig von Provider und Auflösung).
3. **succeeded** -- Video bereit; der Agent wacht auf und sendet es in die Konversation.
4. **failed** -- Provider-Fehler oder Timeout; der Agent wacht mit Fehlerdetails auf.

Status über die CLI prüfen:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Verhinderung von Duplikaten: Wenn für die aktuelle Sitzung bereits eine Video-Task `queued` oder `running` ist, gibt `video_generate` den Status der vorhandenen Task zurück, anstatt eine neue zu starten. Verwenden Sie `action: "status"`, um dies explizit zu prüfen, ohne eine neue Generierung auszulösen.

## Unterstützte Provider

| Provider              | Standardmodell                  | Text | Bildreferenz                                         | Videoreferenz    | API-Schlüssel                            |
| --------------------- | ------------------------------- | ---- | ---------------------------------------------------- | ---------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    | Ja   | Ja (Remote-URL)                                      | Ja (Remote-URL)  | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       | Ja   | Bis zu 2 Bilder (nur I2V-Modelle; erstes + letztes Bild) | Nein          | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       | Ja   | Bis zu 2 Bilder (erstes + letztes Bild über Rolle)   | Nein             | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  | Ja   | Bis zu 9 Referenzbilder                              | Bis zu 3 Videos  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      | Ja   | 1 Bild                                               | Nein             | `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  | Ja   | 1 Bild                                               | Nein             | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` | Ja   | 1 Bild                                               | 1 Video          | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            | Ja   | 1 Bild                                               | Nein             | `MINIMAX_API_KEY`                        |
| OpenAI                | `sora-2`                        | Ja   | 1 Bild                                               | 1 Video          | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                    | Ja   | Ja (Remote-URL)                                      | Ja (Remote-URL)  | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        | Ja   | 1 Bild                                               | 1 Video          | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        | Ja   | 1 Bild                                               | Nein             | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          | Ja   | 1 Bild (`kling`)                                     | Nein             | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            | Ja   | 1 Bild für den ersten Frame oder bis zu 7 `reference_image`s | 1 Video    | `XAI_API_KEY`                            |

Einige Provider akzeptieren zusätzliche oder alternative API-Schlüssel-Umgebungsvariablen. Siehe die einzelnen [Provider-Seiten](#related) für Details.

Führen Sie `video_generate action=list` aus, um verfügbare Provider, Modelle und
Laufzeitmodi zur Laufzeit zu prüfen.

### Deklarierte Fähigkeitsmatrix

Dies ist der explizite Modusvertrag, der von `video_generate`, Vertragstests
und dem gemeinsamen Live-Sweep verwendet wird.

| Provider | `generate` | `imageToVideo` | `videoToVideo` | Gemeinsame Live-Lanes heute                                                                                                              |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; `videoToVideo` wird übersprungen, weil dieser Provider Remote-`http(s)`-Video-URLs benötigt                |
| BytePlus | Ja         | Ja             | Nein           | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  | Ja         | Ja             | Nein           | Nicht im gemeinsamen Sweep; workflowspezifische Abdeckung liegt bei den Comfy-Tests                                                     |
| fal      | Ja         | Ja             | Nein           | `generate`, `imageToVideo`                                                                                                               |
| Google   | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; gemeinsames `videoToVideo` wird übersprungen, weil der aktuelle buffer-gestützte Gemini/Veo-Sweep diese Eingabe nicht akzeptiert |
| MiniMax  | Ja         | Ja             | Nein           | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; gemeinsames `videoToVideo` wird übersprungen, weil dieser Org-/Eingabepfad derzeit providerseitigen Zugriff auf Inpaint/Remix benötigt |
| Qwen     | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; `videoToVideo` wird übersprungen, weil dieser Provider Remote-`http(s)`-Video-URLs benötigt                |
| Runway   | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; `videoToVideo` läuft nur, wenn das ausgewählte Modell `runway/gen4_aleph` ist                              |
| Together | Ja         | Ja             | Nein           | `generate`, `imageToVideo`                                                                                                               |
| Vydra    | Ja         | Ja             | Nein           | `generate`; gemeinsames `imageToVideo` wird übersprungen, weil gebündeltes `veo3` nur Text unterstützt und gebündeltes `kling` eine Remote-Bild-URL erfordert |
| xAI      | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; `videoToVideo` wird übersprungen, weil dieser Provider derzeit eine Remote-MP4-URL benötigt                |

## Tool-Parameter

### Erforderlich

| Parameter | Typ    | Beschreibung                                                                  |
| --------- | ------ | ----------------------------------------------------------------------------- |
| `prompt`  | string | Textbeschreibung des zu generierenden Videos (erforderlich für `action: "generate"`) |

### Inhaltseingaben

| Parameter    | Typ      | Beschreibung                                                                                                                           |
| ------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `image`      | string   | Einzelnes Referenzbild (Pfad oder URL)                                                                                                 |
| `images`     | string[] | Mehrere Referenzbilder (bis zu 9)                                                                                                      |
| `imageRoles` | string[] | Optionale Rollenhinweise pro Position parallel zur kombinierten Bildliste. Kanonische Werte: `first_frame`, `last_frame`, `reference_image` |
| `video`      | string   | Einzelnes Referenzvideo (Pfad oder URL)                                                                                                |
| `videos`     | string[] | Mehrere Referenzvideos (bis zu 4)                                                                                                      |
| `videoRoles` | string[] | Optionale Rollenhinweise pro Position parallel zur kombinierten Videoliste. Kanonischer Wert: `reference_video`                       |
| `audioRef`   | string   | Einzelne Audio-Referenz (Pfad oder URL). Verwendet z. B. für Hintergrundmusik oder Stimmreferenz, wenn der Provider Audioeingaben unterstützt |
| `audioRefs`  | string[] | Mehrere Audio-Referenzen (bis zu 3)                                                                                                    |
| `audioRoles` | string[] | Optionale Rollenhinweise pro Position parallel zur kombinierten Audioliste. Kanonischer Wert: `reference_audio`                       |

Rollenhinweise werden unverändert an den Provider weitergeleitet. Kanonische Werte stammen aus
der Union `VideoGenerationAssetRole`, Provider können jedoch zusätzliche
Rollen-Strings akzeptieren. `*Roles`-Arrays dürfen nicht mehr Einträge haben als die
entsprechende Referenzliste; Off-by-one-Fehler schlagen mit einer klaren Fehlermeldung fehl.
Verwenden Sie eine leere Zeichenkette, um einen Slot nicht zu setzen. Für xAI setzen Sie jede Bildrolle auf
`reference_image`, um dessen Generierungsmodus `reference_images` zu verwenden; lassen Sie die Rolle weg
oder verwenden Sie `first_frame` für Bild-zu-Video mit einem einzelnen Bild.

### Stilsteuerung

| Parameter         | Typ     | Beschreibung                                                                            |
| ----------------- | ------- | --------------------------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` oder `adaptive` |
| `resolution`      | string  | `480P`, `720P`, `768P` oder `1080P`                                                     |
| `durationSeconds` | number  | Zieldauer in Sekunden (auf den nächsten vom Provider unterstützten Wert gerundet)       |
| `size`            | string  | Größenhinweis, wenn der Provider dies unterstützt                                       |
| `audio`           | boolean | Aktiviert generiertes Audio in der Ausgabe, wenn unterstützt. Unterscheidet sich von `audioRef*` (Eingaben) |
| `watermark`       | boolean | Schaltet Watermarking des Providers ein oder aus, wenn unterstützt                      |

`adaptive` ist ein providerspezifischer Sentinel: Er wird unverändert an
Provider weitergeleitet, die `adaptive` in ihren Fähigkeiten deklarieren (z. B. BytePlus
Seedance verwendet dies, um das Verhältnis automatisch aus den
Abmessungen des Eingabebilds zu erkennen). Provider, die dies nicht deklarieren, geben den Wert über
`details.ignoredOverrides` im Tool-Ergebnis aus, sodass das Ignorieren sichtbar ist.

### Erweitert

| Parameter         | Typ    | Beschreibung                                                                                                                                                                                                                                                                                                                                         |
| ----------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`          | string | `"generate"` (Standard), `"status"` oder `"list"`                                                                                                                                                                                                                                                                                                    |
| `model`           | string | Provider-/Modell-Überschreibung (z. B. `runway/gen4.5`)                                                                                                                                                                                                                                                                                              |
| `filename`        | string | Hinweis für den Ausgabedateinamen                                                                                                                                                                                                                                                                                                                    |
| `timeoutMs`       | number | Optionales Timeout für Provider-Anfragen in Millisekunden                                                                                                                                                                                                                                                                                            |
| `providerOptions` | object | Providerspezifische Optionen als JSON-Objekt (z. B. `{"seed": 42, "draft": true}`). Provider, die ein typisiertes Schema deklarieren, validieren Schlüssel und Typen; unbekannte Schlüssel oder Abweichungen führen dazu, dass der Kandidat beim Fallback übersprungen wird. Provider ohne deklariertes Schema erhalten die Optionen unverändert. Führen Sie `video_generate action=list` aus, um zu sehen, was jeder Provider akzeptiert |

Nicht alle Provider unterstützen alle Parameter. OpenClaw normalisiert die Dauer bereits auf den nächstgelegenen vom Provider unterstützten Wert und mappt auch übersetzte Geometriehinweise wie Größe-zu-Seitenverhältnis um, wenn ein Fallback-Provider eine andere Steuerungsoberfläche bereitstellt. Wirklich nicht unterstützte Überschreibungen werden bestmöglich ignoriert und als Warnungen im Tool-Ergebnis gemeldet. Harte Fähigkeitsgrenzen (wie zu viele Referenzeingaben) schlagen vor dem Absenden fehl.

Tool-Ergebnisse melden die angewendeten Einstellungen. Wenn OpenClaw Dauer oder Geometrie während des Provider-Fallbacks ummappt, spiegeln die zurückgegebenen Werte `durationSeconds`, `size`, `aspectRatio` und `resolution` wider, was tatsächlich übermittelt wurde, und `details.normalization` erfasst die Übersetzung von angefordert zu angewendet.

Referenzeingaben wählen außerdem den Laufzeitmodus aus:

- Keine Referenzmedien: `generate`
- Irgendeine Bildreferenz: `imageToVideo`
- Irgendeine Videoreferenz: `videoToVideo`
- Referenz-Audioeingaben ändern den aufgelösten Modus nicht; sie werden zusätzlich zu dem Modus angewendet, den Bild-/Videoreferenzen auswählen, und funktionieren nur mit Providern, die `maxInputAudios` deklarieren

Gemischte Bild- und Videoreferenzen sind keine stabile gemeinsame Fähigkeitsoberfläche.
Bevorzugen Sie einen Referenztyp pro Anfrage.

#### Fallback und typisierte Optionen

Einige Fähigkeitsprüfungen werden auf der Fallback-Ebene statt an der
Tool-Grenze angewendet, sodass eine Anfrage, die die Grenzen des primären Providers überschreitet,
dennoch auf einem geeigneten Fallback ausgeführt werden kann:

- Wenn der aktive Kandidat kein `maxInputAudios` deklariert (oder dies als
  `0` deklariert), wird er übersprungen, wenn die Anfrage Audio-Referenzen enthält, und der
  nächste Kandidat wird versucht.
- Wenn `maxDurationSeconds` des aktiven Kandidaten unter den angeforderten
  `durationSeconds` liegt und der Kandidat keine
  Liste `supportedDurationSeconds` deklariert, wird er übersprungen.
- Wenn die Anfrage `providerOptions` enthält und der aktive Kandidat
  explizit ein typisiertes Schema für `providerOptions` deklariert, wird der Kandidat
  übersprungen, wenn die angegebenen Schlüssel nicht im Schema stehen oder die Werttypen nicht
  übereinstimmen. Provider, die noch kein Schema deklariert haben, erhalten die
  Optionen unverändert (rückwärtskompatibler Pass-through). Ein Provider kann
  explizit alle Provider-Optionen ablehnen, indem er ein leeres Schema
  deklariert (`capabilities.providerOptions: {}`), was zum selben Überspringen wie bei
  einem Typkonflikt führt.

Der erste Überspringgrund in einer Anfrage wird mit `warn` protokolliert, sodass Operatoren sehen,
wann ihr primärer Provider übergangen wurde; nachfolgende Überspringungen werden mit
`debug` protokolliert, um lange Fallback-Ketten ruhig zu halten. Wenn jeder Kandidat übersprungen wird,
enthält der aggregierte Fehler den Überspringgrund für jeden einzelnen.

## Aktionen

- **generate** (Standard) -- erstellt ein Video aus dem angegebenen Prompt und optionalen Referenzeingaben.
- **status** -- prüft den Status der laufenden Video-Task für die aktuelle Sitzung, ohne eine weitere Generierung zu starten.
- **list** -- zeigt verfügbare Provider, Modelle und ihre Fähigkeiten an.

## Modellauswahl

Beim Generieren eines Videos löst OpenClaw das Modell in dieser Reihenfolge auf:

1. **Tool-Parameter `model`** -- wenn der Agent ihn im Aufruf angibt.
2. **`videoGenerationModel.primary`** -- aus der Konfiguration.
3. **`videoGenerationModel.fallbacks`** -- werden in Reihenfolge versucht.
4. **Automatische Erkennung** -- verwendet Provider mit gültiger Auth, beginnend mit dem aktuellen Standard-Provider, dann die übrigen Provider in alphabetischer Reihenfolge.

Wenn ein Provider fehlschlägt, wird automatisch der nächste Kandidat versucht. Wenn alle Kandidaten fehlschlagen, enthält der Fehler Details aus jedem Versuch.

Setzen Sie `agents.defaults.mediaGenerationAutoProviderFallback: false`, wenn Sie möchten,
dass die Videogenerierung nur die expliziten Einträge `model`, `primary` und `fallbacks`
verwendet.

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
    Verwendet den asynchronen Endpunkt von DashScope / Model Studio. Referenzbilder und -videos müssen Remote-`http(s)`-URLs sein.
  </Accordion>

  <Accordion title="BytePlus (1.0)">
    Provider-ID: `byteplus`.

    Modelle: `seedance-1-0-pro-250528` (Standard), `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`, `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    T2V-Modelle (`*-t2v-*`) akzeptieren keine Bildeingaben; I2V-Modelle und allgemeine `*-pro-*`-Modelle unterstützen ein einzelnes Referenzbild (erster Frame). Übergeben Sie das Bild positionell oder setzen Sie `role: "first_frame"`. T2V-Modell-IDs werden automatisch auf die entsprechende I2V-Variante umgestellt, wenn ein Bild bereitgestellt wird.

    Unterstützte `providerOptions`-Schlüssel: `seed` (number), `draft` (boolean — erzwingt 480p), `camera_fixed` (boolean).

  </Accordion>

  <Accordion title="BytePlus Seedance 1.5">
    Erfordert das Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). Provider-ID: `byteplus-seedance15`. Modell: `seedance-1-5-pro-251215`.

    Verwendet die einheitliche API `content[]`. Unterstützt höchstens 2 Eingabebilder (`first_frame` + `last_frame`). Alle Eingaben müssen Remote-`https://`-URLs sein. Setzen Sie `role: "first_frame"` / `"last_frame"` für jedes Bild oder übergeben Sie Bilder positionell.

    `aspectRatio: "adaptive"` erkennt das Verhältnis automatisch aus dem Eingabebild. `audio: true` wird auf `generate_audio` gemappt. `providerOptions.seed` (number) wird weitergeleitet.

  </Accordion>

  <Accordion title="BytePlus Seedance 2.0">
    Erfordert das Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). Provider-ID: `byteplus-seedance2`. Modelle: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`.

    Verwendet die einheitliche API `content[]`. Unterstützt bis zu 9 Referenzbilder, 3 Referenzvideos und 3 Referenz-Audios. Alle Eingaben müssen Remote-`https://`-URLs sein. Setzen Sie `role` für jedes Asset — unterstützte Werte: `"first_frame"`, `"last_frame"`, `"reference_image"`, `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` erkennt das Verhältnis automatisch aus dem Eingabebild. `audio: true` wird auf `generate_audio` gemappt. `providerOptions.seed` (number) wird weitergeleitet.

  </Accordion>

  <Accordion title="ComfyUI">
    Workflow-gesteuerte lokale oder Cloud-Ausführung. Unterstützt Text-zu-Video und Bild-zu-Video über den konfigurierten Graphen.
  </Accordion>

  <Accordion title="fal">
    Verwendet einen warteschlangengestützten Ablauf für lang laufende Jobs. Nur eine einzelne Bildreferenz.
  </Accordion>

  <Accordion title="Google (Gemini / Veo)">
    Unterstützt eine Bild- oder eine Videoreferenz.
  </Accordion>

  <Accordion title="MiniMax">
    Nur eine einzelne Bildreferenz.
  </Accordion>

  <Accordion title="OpenAI">
    Nur die Überschreibung `size` wird weitergeleitet. Andere Stil-Überschreibungen (`aspectRatio`, `resolution`, `audio`, `watermark`) werden mit einer Warnung ignoriert.
  </Accordion>

  <Accordion title="Qwen">
    Verwendet dasselbe DashScope-Backend wie Alibaba. Referenzeingaben müssen Remote-`http(s)`-URLs sein; lokale Dateien werden vorab abgelehnt.
  </Accordion>

  <Accordion title="Runway">
    Unterstützt lokale Dateien über Daten-URIs. Video-zu-Video erfordert `runway/gen4_aleph`. Reine Textläufe bieten die Seitenverhältnisse `16:9` und `9:16`.
  </Accordion>

  <Accordion title="Together">
    Nur eine einzelne Bildreferenz.
  </Accordion>

  <Accordion title="Vydra">
    Verwendet `https://www.vydra.ai/api/v1` direkt, um Weiterleitungen zu vermeiden, bei denen Auth verloren geht. `veo3` ist gebündelt nur als Text-zu-Video verfügbar; `kling` erfordert eine Remote-Bild-URL.
  </Accordion>

  <Accordion title="xAI">
    Unterstützt Text-zu-Video, Bild-zu-Video mit einem einzelnen ersten Frame, bis zu 7 `reference_image`-Eingaben über xAI `reference_images` und Remote-Abläufe zum Bearbeiten/Erweitern von Videos.
  </Accordion>
</AccordionGroup>

## Fähigkeitsmodi von Providern

Der gemeinsame Vertrag für Videogenerierung erlaubt Providern jetzt, modusspezifische
Fähigkeiten zu deklarieren, statt nur flache aggregierte Grenzwerte. Neue Provider-
Implementierungen sollten explizite Modusblöcke bevorzugen:

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

Flache aggregierte Felder wie `maxInputImages` und `maxInputVideos` sind nicht
ausreichend, um Unterstützung für Transformationsmodi bekanntzugeben. Provider sollten
`generate`, `imageToVideo` und `videoToVideo` explizit deklarieren, damit Live-Tests,
Vertragstests und das gemeinsame Tool `video_generate` die Modusunterstützung
deterministisch validieren können.

## Live-Tests

Opt-in-Live-Abdeckung für die gemeinsam gebündelten Provider:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Repo-Wrapper:

```bash
pnpm test:live:media video
```

Diese Live-Datei lädt fehlende Provider-Umgebungsvariablen aus `~/.profile`, bevorzugt
standardmäßig Live-/env-API-Schlüssel vor gespeicherten Auth-Profilen und führt standardmäßig einen release-sicheren Smoke-Test aus:

- `generate` für jeden Nicht-FAL-Provider im Sweep
- ein einsekündiger Hummer-Prompt
- providerspezifische Operationsgrenze aus `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`
  (standardmäßig `180000`)

FAL ist Opt-in, da die providerseitige Warteschlangenlatenz die Release-Zeit dominieren kann:

```bash
pnpm test:live:media video --video-providers fal
```

Setzen Sie `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, um zusätzlich deklarierte Transformations-
modi auszuführen, die der gemeinsame Sweep sicher mit lokalen Medien testen kann:

- `imageToVideo`, wenn `capabilities.imageToVideo.enabled`
- `videoToVideo`, wenn `capabilities.videoToVideo.enabled` und das Provider-/Modellpaar
  im gemeinsamen Sweep buffer-gestützte lokale Videoeingaben akzeptiert

Aktuell deckt die gemeinsame `videoToVideo`-Live-Lane ab:

- `runway` nur, wenn Sie `runway/gen4_aleph` auswählen

## Konfiguration

Setzen Sie das Standardmodell für die Videogenerierung in Ihrer OpenClaw-Konfiguration:

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

- [Tools Overview](/de/tools)
- [Background Tasks](/de/automation/tasks) -- Aufgabenverfolgung für asynchrone Videogenerierung
- [Alibaba Model Studio](/de/providers/alibaba)
- [BytePlus](/de/concepts/model-providers#byteplus-international)
- [ComfyUI](/de/providers/comfy)
- [fal](/de/providers/fal)
- [Google (Gemini)](/de/providers/google)
- [MiniMax](/de/providers/minimax)
- [OpenAI](/de/providers/openai)
- [Qwen](/de/providers/qwen)
- [Runway](/de/providers/runway)
- [Together AI](/de/providers/together)
- [Vydra](/de/providers/vydra)
- [xAI](/de/providers/xai)
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults)
- [Modelle](/de/concepts/models)
