---
read_when:
    - Videos über den Agenten generieren
    - Provider und Modelle für die Videogenerierung konfigurieren
    - Die Parameter des Tools `video_generate` verstehen
summary: Videos aus Text, Bildern oder vorhandenen Videos mit 14 Provider-Backends generieren
title: Videogenerierung
x-i18n:
    generated_at: "2026-04-25T13:59:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a16c56939967a6268e62a267598fe03d2eb3195384ad805652498004fdaf886
    source_path: tools/video-generation.md
    workflow: 15
---

OpenClaw-Agenten können Videos aus Text-Prompts, Referenzbildern oder vorhandenen Videos generieren. Vierzehn Provider-Backends werden unterstützt, jedes mit unterschiedlichen Modelloptionen, Eingabemodi und Funktionsumfängen. Der Agent wählt automatisch den richtigen Provider auf Basis Ihrer Konfiguration und der verfügbaren API-Keys.

<Note>
Das Tool `video_generate` erscheint nur dann, wenn mindestens ein Provider für die Videogenerierung verfügbar ist. Wenn Sie es nicht in den Tools Ihres Agenten sehen, setzen Sie einen API-Key für einen Provider oder konfigurieren Sie `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw behandelt Videogenerierung als drei Laufzeitmodi:

- `generate` für Text-zu-Video-Anfragen ohne Referenzmedien
- `imageToVideo`, wenn die Anfrage ein oder mehrere Referenzbilder enthält
- `videoToVideo`, wenn die Anfrage ein oder mehrere Referenzvideos enthält

Provider können jede beliebige Teilmenge dieser Modi unterstützen. Das Tool validiert den aktiven
Modus vor dem Absenden und meldet unterstützte Modi in `action=list`.

## Schnellstart

1. Setzen Sie einen API-Key für einen beliebigen unterstützten Provider:

```bash
export GEMINI_API_KEY="your-key"
```

2. Fixieren Sie optional ein Standardmodell:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Fragen Sie den Agenten:

> Generate a 5-second cinematic video of a friendly lobster surfing at sunset.

Der Agent ruft `video_generate` automatisch auf. Kein Allowlisting für Tools erforderlich.

## Was beim Generieren eines Videos geschieht

Videogenerierung ist asynchron. Wenn der Agent `video_generate` in einer Sitzung aufruft:

1. OpenClaw sendet die Anfrage an den Provider und gibt sofort eine Task-ID zurück.
2. Der Provider verarbeitet den Job im Hintergrund (typischerweise 30 Sekunden bis 5 Minuten, abhängig von Provider und Auflösung).
3. Wenn das Video bereit ist, weckt OpenClaw dieselbe Sitzung mit einem internen Abschlussereignis.
4. Der Agent postet das fertige Video zurück in die ursprüngliche Konversation.

Während ein Job läuft, geben doppelte `video_generate`-Aufrufe in derselben Sitzung den aktuellen Task-Status zurück, anstatt eine weitere Generierung zu starten. Verwenden Sie `openclaw tasks list` oder `openclaw tasks show <taskId>`, um den Fortschritt über die CLI zu prüfen.

Außerhalb agentengestützter Läufe mit Sitzungsbindung (zum Beispiel bei direkten Tool-Aufrufen) fällt das Tool auf Inline-Generierung zurück und gibt den endgültigen Medienpfad im selben Zug zurück.

Generierte Videodateien werden im von OpenClaw verwalteten Medienspeicher gespeichert, wenn der
Provider Bytes zurückgibt. Die standardmäßige Speichergrenze für generierte Videos folgt der Video-
Mediengrenze, und `agents.defaults.mediaMaxMb` erhöht sie für größere Renderings.
Wenn ein Provider zusätzlich eine gehostete Ausgabe-URL zurückgibt, kann OpenClaw stattdessen diese URL zustellen, statt den Task fehlschlagen zu lassen, wenn die lokale Persistierung eine zu große Datei ablehnt.

### Task-Lebenszyklus

Jede Anfrage an `video_generate` durchläuft vier Zustände:

1. **queued** -- Task erstellt und wartet darauf, dass der Provider ihn annimmt.
2. **running** -- Provider verarbeitet den Task (typischerweise 30 Sekunden bis 5 Minuten, abhängig von Provider und Auflösung).
3. **succeeded** -- Video bereit; der Agent wird geweckt und postet es in die Konversation.
4. **failed** -- Provider-Fehler oder Timeout; der Agent wird mit Fehlerdetails geweckt.

Status über die CLI prüfen:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Vermeidung von Duplikaten: Wenn für die aktuelle Sitzung bereits ein Video-Task `queued` oder `running` ist, gibt `video_generate` den bestehenden Task-Status zurück, statt eine neue Generierung zu starten. Verwenden Sie `action: "status"`, um dies explizit zu prüfen, ohne eine neue Generierung auszulösen.

## Unterstützte Provider

| Provider              | Standardmodell                 | Text | Bildreferenz                                         | Videoreferenz     | API-Key                                  |
| --------------------- | ------------------------------ | ---- | ---------------------------------------------------- | ----------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                   | Ja   | Ja (Remote-URL)                                      | Ja (Remote-URL)   | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`      | Ja   | Bis zu 2 Bilder (nur I2V-Modelle; erstes + letztes Bild) | Nein          | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`      | Ja   | Bis zu 2 Bilder (erstes + letztes Bild über Rolle)   | Nein              | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128` | Ja   | Bis zu 9 Referenzbilder                              | Bis zu 3 Videos   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                     | Ja   | 1 Bild                                               | Nein              | `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live` | Ja   | 1 Bild                                               | Nein              | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` | Ja  | 1 Bild                                               | 1 Video           | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`           | Ja   | 1 Bild                                               | Nein              | `MINIMAX_API_KEY`                        |
| OpenAI                | `sora-2`                       | Ja   | 1 Bild                                               | 1 Video           | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                   | Ja   | Ja (Remote-URL)                                      | Ja (Remote-URL)   | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                       | Ja   | 1 Bild                                               | 1 Video           | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`       | Ja   | 1 Bild                                               | Nein              | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                         | Ja   | 1 Bild (`kling`)                                     | Nein              | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`           | Ja   | 1 Bild                                               | 1 Video           | `XAI_API_KEY`                            |

Einige Provider akzeptieren zusätzliche oder alternative API-Key-Umgebungsvariablen. Details finden Sie auf den jeweiligen [Provider-Seiten](#related).

Führen Sie `video_generate action=list` aus, um verfügbare Provider, Modelle und
Laufzeitmodi zur Laufzeit zu prüfen.

### Deklarierte Fähigkeitsmatrix

Dies ist der explizite Mode-Vertrag, der von `video_generate`, Vertragstests
und dem gemeinsamen Live-Sweep verwendet wird.

| Provider | `generate` | `imageToVideo` | `videoToVideo` | Gemeinsame Live-Lanes heute                                                                                                             |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; `videoToVideo` wird übersprungen, da dieser Provider entfernte `http(s)`-Video-URLs benötigt               |
| BytePlus | Ja         | Ja             | Nein           | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  | Ja         | Ja             | Nein           | Nicht im gemeinsamen Sweep; workflowspezifische Abdeckung liegt bei den Comfy-Tests                                                     |
| fal      | Ja         | Ja             | Nein           | `generate`, `imageToVideo`                                                                                                               |
| Google   | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; gemeinsames `videoToVideo` wird übersprungen, da der aktuelle puffergestützte Gemini-/Veo-Sweep diese Eingabe nicht akzeptiert |
| MiniMax  | Ja         | Ja             | Nein           | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; gemeinsames `videoToVideo` wird übersprungen, da dieser Org-/Input-Pfad derzeit providerseitigen Inpaint-/Remix-Zugriff benötigt |
| Qwen     | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; `videoToVideo` wird übersprungen, da dieser Provider entfernte `http(s)`-Video-URLs benötigt               |
| Runway   | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; `videoToVideo` läuft nur, wenn das ausgewählte Modell `runway/gen4_aleph` ist                              |
| Together | Ja         | Ja             | Nein           | `generate`, `imageToVideo`                                                                                                               |
| Vydra    | Ja         | Ja             | Nein           | `generate`; gemeinsames `imageToVideo` wird übersprungen, weil das gebündelte `veo3` nur Text unterstützt und das gebündelte `kling` eine entfernte Bild-URL benötigt |
| xAI      | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; `videoToVideo` wird übersprungen, da dieser Provider derzeit eine entfernte MP4-URL benötigt               |

## Tool-Parameter

### Erforderlich

| Parameter | Typ    | Beschreibung                                                                |
| --------- | ------ | --------------------------------------------------------------------------- |
| `prompt`  | string | Textbeschreibung des zu generierenden Videos (erforderlich für `action: "generate"`) |

### Inhaltseingaben

| Parameter    | Typ      | Beschreibung                                                                                                                          |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `image`      | string   | Einzelnes Referenzbild (Pfad oder URL)                                                                                                |
| `images`     | string[] | Mehrere Referenzbilder (bis zu 9)                                                                                                     |
| `imageRoles` | string[] | Optionale positionsbezogene Rollenhinweise parallel zur kombinierten Bildliste. Kanonische Werte: `first_frame`, `last_frame`, `reference_image` |
| `video`      | string   | Einzelnes Referenzvideo (Pfad oder URL)                                                                                               |
| `videos`     | string[] | Mehrere Referenzvideos (bis zu 4)                                                                                                     |
| `videoRoles` | string[] | Optionale positionsbezogene Rollenhinweise parallel zur kombinierten Videoliste. Kanonischer Wert: `reference_video`                 |
| `audioRef`   | string   | Einzelne Referenz-Audiodatei (Pfad oder URL). Verwendet z. B. für Hintergrundmusik oder Sprachreferenz, wenn der Provider Audioeingaben unterstützt |
| `audioRefs`  | string[] | Mehrere Referenz-Audiodateien (bis zu 3)                                                                                              |
| `audioRoles` | string[] | Optionale positionsbezogene Rollenhinweise parallel zur kombinierten Audioliste. Kanonischer Wert: `reference_audio`                 |

Rollenhinweise werden unverändert an den Provider weitergeleitet. Kanonische Werte stammen
aus dem Union-Typ `VideoGenerationAssetRole`, aber Provider können zusätzliche
Rollen-Strings akzeptieren. Arrays mit `*Roles` dürfen nicht mehr Einträge enthalten als die
entsprechende Referenzliste; Off-by-one-Fehler schlagen mit einer klaren Fehlermeldung fehl.
Verwenden Sie einen leeren String, um einen Slot ungesetzt zu lassen.

### Stil-Steuerungen

| Parameter         | Typ     | Beschreibung                                                                            |
| ----------------- | ------- | --------------------------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` oder `adaptive` |
| `resolution`      | string  | `480P`, `720P`, `768P` oder `1080P`                                                     |
| `durationSeconds` | number  | Gewünschte Dauer in Sekunden (auf den nächstunterstützten Provider-Wert gerundet)       |
| `size`            | string  | Größenhinweis, wenn der Provider dies unterstützt                                       |
| `audio`           | boolean | Generiertes Audio in der Ausgabe aktivieren, wenn unterstützt. Unterschieden von `audioRef*` (Eingaben) |
| `watermark`       | boolean | Wasserzeichen des Providers aktivieren/deaktivieren, wenn unterstützt                   |

`adaptive` ist ein providerspezifischer Sentinel: Er wird unverändert an
Provider weitergegeben, die `adaptive` in ihren Fähigkeiten deklarieren (z. B. nutzt BytePlus
Seedance ihn, um das Verhältnis aus den Abmessungen des Eingabebildes automatisch zu erkennen). Provider, die dies nicht deklarieren, geben den Wert über
`details.ignoredOverrides` im Tool-Ergebnis aus, sodass das Weglassen sichtbar ist.

### Erweitert

| Parameter         | Typ    | Beschreibung                                                                                                                                                                                                                                                                                                                                      |
| ----------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`          | string | `"generate"` (Standard), `"status"` oder `"list"`                                                                                                                                                                                                                                                                                                |
| `model`           | string | Override für Provider/Modell (z. B. `runway/gen4.5`)                                                                                                                                                                                                                                                                                             |
| `filename`        | string | Hinweis auf den Ausgabedateinamen                                                                                                                                                                                                                                                                                                                 |
| `timeoutMs`       | number | Optionales Timeout für Provider-Anfragen in Millisekunden                                                                                                                                                                                                                                                                                        |
| `providerOptions` | object | Providerspezifische Optionen als JSON-Objekt (z. B. `{"seed": 42, "draft": true}`). Provider, die ein typisiertes Schema deklarieren, validieren Schlüssel und Typen; unbekannte Schlüssel oder Typfehler überspringen den Kandidaten während des Fallbacks. Provider ohne deklariertes Schema erhalten die Optionen unverändert. Führen Sie `video_generate action=list` aus, um zu sehen, was jeder Provider akzeptiert |

Nicht alle Provider unterstützen alle Parameter. OpenClaw normalisiert die Dauer bereits auf den nächstunterstützten Wert des Providers und ordnet auch übersetzte Geometriehinweise wie Größe-zu-Seitenverhältnis neu zu, wenn ein Fallback-Provider eine andere Steuerungsoberfläche bereitstellt. Wirklich nicht unterstützte Overrides werden best-effort ignoriert und als Warnungen im Tool-Ergebnis gemeldet. Harte Fähigkeitsgrenzen (wie zu viele Referenzeingaben) führen vor dem Absenden zu einem Fehler.

Tool-Ergebnisse melden die angewendeten Einstellungen. Wenn OpenClaw Dauer oder Geometrie beim Provider-Fallback neu zuordnet, spiegeln die zurückgegebenen Werte `durationSeconds`, `size`, `aspectRatio` und `resolution` wider, was abgesendet wurde, und `details.normalization` erfasst die Übersetzung von angefordert zu angewendet.

Referenzeingaben wählen außerdem den Laufzeitmodus:

- Keine Referenzmedien: `generate`
- Beliebige Bildreferenz: `imageToVideo`
- Beliebige Videoreferenz: `videoToVideo`
- Referenz-Audioeingaben ändern den aufgelösten Modus nicht; sie werden zusätzlich zu dem von Bild-/Videoreferenzen gewählten Modus angewendet und funktionieren nur mit Providern, die `maxInputAudios` deklarieren

Gemischte Bild- und Videoreferenzen sind keine stabile gemeinsame Fähigkeitsoberfläche.
Bevorzugen Sie einen Referenztyp pro Anfrage.

#### Fallback und typisierte Optionen

Einige Fähigkeitsprüfungen werden auf der Fallback-Ebene statt an der
Tool-Grenze angewendet, damit eine Anfrage, die die Grenzen des primären Providers überschreitet,
dennoch auf einem geeigneten Fallback laufen kann:

- Wenn der aktive Kandidat kein `maxInputAudios` deklariert (oder dieses
  als `0` deklariert), wird er übersprungen, wenn die Anfrage Audio-Referenzen enthält,
  und der nächste Kandidat wird versucht.
- Wenn `maxDurationSeconds` des aktiven Kandidaten unter den angeforderten
  `durationSeconds` liegt und der Kandidat keine Liste
  `supportedDurationSeconds` deklariert, wird er übersprungen.
- Wenn die Anfrage `providerOptions` enthält und der aktive Kandidat
  explizit ein typisiertes Schema für `providerOptions` deklariert, wird der Kandidat
  übersprungen, wenn die gelieferten Schlüssel nicht im Schema enthalten sind oder die Werttypen nicht
  passen. Provider, die noch kein Schema deklariert haben, erhalten die
  Optionen unverändert (rückwärtskompatibler Pass-through). Ein Provider kann
  explizit alle Provider-Optionen deaktivieren, indem er ein leeres Schema
  deklariert (`capabilities.providerOptions: {}`), was
  denselben Skip wie ein Typfehler verursacht.

Der erste Skip-Grund einer Anfrage wird auf `warn` protokolliert, sodass Operatoren sehen,
wann ihr primärer Provider übergangen wurde; spätere Skips werden auf
`debug` protokolliert, um lange Fallback-Ketten ruhig zu halten. Wenn jeder Kandidat übersprungen wird,
enthält der aggregierte Fehler für jeden den jeweiligen Skip-Grund.

## Aktionen

- **generate** (Standard) -- ein Video aus dem gegebenen Prompt und optionalen Referenzeingaben erstellen.
- **status** -- den Status des laufenden Video-Tasks für die aktuelle Sitzung prüfen, ohne eine weitere Generierung zu starten.
- **list** -- verfügbare Provider, Modelle und deren Fähigkeiten anzeigen.

## Modellauswahl

Bei der Generierung eines Videos löst OpenClaw das Modell in dieser Reihenfolge auf:

1. **`model`-Tool-Parameter** -- wenn der Agent ihn im Aufruf angibt.
2. **`videoGenerationModel.primary`** -- aus der Konfiguration.
3. **`videoGenerationModel.fallbacks`** -- werden der Reihe nach versucht.
4. **Auto-Erkennung** -- verwendet Provider mit gültiger Authentifizierung, beginnend mit dem aktuellen Standard-Provider, danach die übrigen Provider in alphabetischer Reihenfolge.

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
    Verwendet den asynchronen Endpunkt DashScope / Model Studio. Referenzbilder und -videos müssen entfernte `http(s)`-URLs sein.
  </Accordion>

  <Accordion title="BytePlus (1.0)">
    Provider-ID: `byteplus`.

    Modelle: `seedance-1-0-pro-250528` (Standard), `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`, `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    T2V-Modelle (`*-t2v-*`) akzeptieren keine Bildeingaben; I2V-Modelle und allgemeine `*-pro-*`-Modelle unterstützen ein einzelnes Referenzbild (erstes Bild). Übergeben Sie das Bild positionsbezogen oder setzen Sie `role: "first_frame"`. T2V-Modell-IDs werden automatisch auf die entsprechende I2V-Variante umgestellt, wenn ein Bild bereitgestellt wird.

    Unterstützte Schlüssel in `providerOptions`: `seed` (number), `draft` (boolean — erzwingt 480p), `camera_fixed` (boolean).

  </Accordion>

  <Accordion title="BytePlus Seedance 1.5">
    Erfordert das Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). Provider-ID: `byteplus-seedance15`. Modell: `seedance-1-5-pro-251215`.

    Verwendet die einheitliche API `content[]`. Unterstützt höchstens 2 Eingabebilder (`first_frame` + `last_frame`). Alle Eingaben müssen entfernte `https://`-URLs sein. Setzen Sie `role: "first_frame"` / `"last_frame"` für jedes Bild oder übergeben Sie Bilder positionsbezogen.

    `aspectRatio: "adaptive"` erkennt das Verhältnis automatisch aus dem Eingabebild. `audio: true` wird auf `generate_audio` abgebildet. `providerOptions.seed` (number) wird weitergeleitet.

  </Accordion>

  <Accordion title="BytePlus Seedance 2.0">
    Erfordert das Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). Provider-ID: `byteplus-seedance2`. Modelle: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`.

    Verwendet die einheitliche API `content[]`. Unterstützt bis zu 9 Referenzbilder, 3 Referenzvideos und 3 Referenz-Audiodateien. Alle Eingaben müssen entfernte `https://`-URLs sein. Setzen Sie `role` für jedes Asset — unterstützte Werte: `"first_frame"`, `"last_frame"`, `"reference_image"`, `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` erkennt das Verhältnis automatisch aus dem Eingabebild. `audio: true` wird auf `generate_audio` abgebildet. `providerOptions.seed` (number) wird weitergeleitet.

  </Accordion>

  <Accordion title="ComfyUI">
    Workflowgesteuerte lokale oder Cloud-Ausführung. Unterstützt Text-zu-Video und Bild-zu-Video über den konfigurierten Graphen.
  </Accordion>

  <Accordion title="fal">
    Verwendet einen queuegestützten Flow für lang laufende Jobs. Nur eine einzelne Bildreferenz.
  </Accordion>

  <Accordion title="Google (Gemini / Veo)">
    Unterstützt ein Bild oder ein Video als Referenz.
  </Accordion>

  <Accordion title="MiniMax">
    Nur eine einzelne Bildreferenz.
  </Accordion>

  <Accordion title="OpenAI">
    Nur das Override `size` wird weitergeleitet. Andere Stil-Overrides (`aspectRatio`, `resolution`, `audio`, `watermark`) werden mit einer Warnung ignoriert.
  </Accordion>

  <Accordion title="Qwen">
    Dasselbe DashScope-Backend wie Alibaba. Referenzeingaben müssen entfernte `http(s)`-URLs sein; lokale Dateien werden im Voraus abgelehnt.
  </Accordion>

  <Accordion title="Runway">
    Unterstützt lokale Dateien über Data-URIs. Video-zu-Video erfordert `runway/gen4_aleph`. Reine Textläufe exponieren die Seitenverhältnisse `16:9` und `9:16`.
  </Accordion>

  <Accordion title="Together">
    Nur eine einzelne Bildreferenz.
  </Accordion>

  <Accordion title="Vydra">
    Verwendet direkt `https://www.vydra.ai/api/v1`, um Redirects zu vermeiden, die Authentifizierung verlieren. `veo3` ist gebündelt nur als Text-zu-Video; `kling` erfordert eine entfernte Bild-URL.
  </Accordion>

  <Accordion title="xAI">
    Unterstützt Text-zu-Video, Bild-zu-Video und entfernte Flows zum Bearbeiten/Erweitern von Videos.
  </Accordion>
</AccordionGroup>

## Modi für Provider-Fähigkeiten

Der gemeinsame Vertrag für Videogenerierung erlaubt Providern jetzt, modusspezifische
Fähigkeiten zu deklarieren, statt nur flache aggregierte Grenzen. Neue
Provider-Implementierungen sollten explizite Modus-Blöcke bevorzugen:

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

Flache aggregierte Felder wie `maxInputImages` und `maxInputVideos` reichen
nicht aus, um Unterstützung für Transform-Modi zu bewerben. Provider sollten
`generate`, `imageToVideo` und `videoToVideo` explizit deklarieren, damit Live-Tests,
Vertragstests und das gemeinsame Tool `video_generate` die Unterstützung von Modi
deterministisch validieren können.

## Live-Tests

Opt-in-Live-Abdeckung für die gemeinsamen gebündelten Provider:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Repository-Wrapper:

```bash
pnpm test:live:media video
```

Diese Live-Datei lädt fehlende Provider-Umgebungsvariablen aus `~/.profile`, bevorzugt
standardmäßig Live-/Env-API-Keys vor gespeicherten Auth-Profilen und führt
standardmäßig einen release-sicheren Smoke-Test aus:

- `generate` für jeden Nicht-FAL-Provider im Sweep
- ein einsekündiger Lobster-Prompt
- operationsbezogene Obergrenze pro Provider aus `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`
  (`180000` standardmäßig)

FAL ist Opt-in, weil providerseitige Queue-Latenz die Release-Zeit dominieren kann:

```bash
pnpm test:live:media video --video-providers fal
```

Setzen Sie `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, um zusätzlich deklarierte Transform-
Modi auszuführen, die der gemeinsame Sweep sicher mit lokalen Medien ausführen kann:

- `imageToVideo`, wenn `capabilities.imageToVideo.enabled`
- `videoToVideo`, wenn `capabilities.videoToVideo.enabled` und der Provider/das Modell
  puffergestützte lokale Videoeingaben im gemeinsamen Sweep akzeptiert

Heute deckt die gemeinsame Live-Lane für `videoToVideo` Folgendes ab:

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
- [Background Tasks](/de/automation/tasks) -- Task-Verfolgung für asynchrone Videogenerierung
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
- [Configuration Reference](/de/gateway/config-agents#agent-defaults)
- [Models](/de/concepts/models)
