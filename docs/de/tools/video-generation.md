---
read_when:
    - Videos über den Agenten generieren
    - Konfiguration von Videogenerierungs-Providern und -Modellen
    - Die Parameter des Tools video_generate verstehen
sidebarTitle: Video generation
summary: Videos über video_generate aus Text-, Bild- oder Videoreferenzen über 16 Provider-Backends hinweg generieren
title: Videogenerierung
x-i18n:
    generated_at: "2026-06-27T18:22:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64c8a3191262613a1acf684496570a6dd8893ebb3a2a7e5ae41337d58555c401
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw-Agenten können Videos aus Text-Prompts, Referenzbildern oder
vorhandenen Videos generieren. Sechzehn Provider-Backends werden unterstützt,
jeweils mit unterschiedlichen Modelloptionen, Eingabemodi und Funktionsumfängen.
Der Agent wählt den passenden Provider automatisch anhand Ihrer Konfiguration
und der verfügbaren API-Schlüssel aus.

<Note>
Das Tool `video_generate` wird nur angezeigt, wenn mindestens ein
Provider für Videogenerierung verfügbar ist. Wenn Sie es in Ihren
Agent-Tools nicht sehen, setzen Sie einen Provider-API-Schlüssel oder
konfigurieren Sie `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw behandelt Videogenerierung als drei Laufzeitmodi:

- `generate` - Text-zu-Video-Anfragen ohne Referenzmedien.
- `imageToVideo` - die Anfrage enthält ein oder mehrere Referenzbilder.
- `videoToVideo` - die Anfrage enthält ein oder mehrere Referenzvideos.

Provider können eine beliebige Teilmenge dieser Modi unterstützen. Das Tool
validiert den aktiven Modus vor der Übermittlung und meldet unterstützte
Modi in `action=list`.

## Schnellstart

<Steps>
  <Step title="Authentifizierung konfigurieren">
    Legen Sie einen API-Schlüssel für einen unterstützten Provider fest:

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
    > Generieren Sie ein 5-sekündiges filmisches Video eines freundlichen Hummers, der bei Sonnenuntergang surft.

    Der Agent ruft `video_generate` automatisch auf. Es ist keine Tool-Allowlist
    erforderlich.

  </Step>
</Steps>

## So funktioniert asynchrone Generierung

Videogenerierung ist asynchron. Wenn der Agent `video_generate` in einer
Sitzung aufruft:

1. OpenClaw übermittelt die Anfrage an den Provider und gibt sofort eine Aufgaben-ID zurück.
2. Der Provider verarbeitet den Auftrag im Hintergrund (typischerweise 30 Sekunden bis mehrere Minuten, je nach Provider und Auflösung; langsame queue-gestützte Provider können bis zum konfigurierten Timeout laufen).
3. Wenn das Video bereit ist, weckt OpenClaw dieselbe Sitzung mit einem internen Abschlussereignis.
4. Der Agent informiert den Benutzer über den normalen sichtbaren Antwortmodus der Sitzung:
   endgültige Antwortzustellung, wenn automatisch, oder `message(action="send")`,
   wenn die Sitzung das Nachrichtentool erfordert. Wenn die anfragende Sitzung
   inaktiv ist oder ihr aktives Wecken fehlschlägt und in der Abschlussantwort
   noch generiertes Video fehlt, sendet OpenClaw einen idempotenten direkten
   Fallback nur mit dem fehlenden Video.

Während ein Auftrag läuft, geben doppelte `video_generate`-Aufrufe in
derselben Sitzung den aktuellen Aufgabenstatus zurück, statt eine weitere
Generierung zu starten. Verwenden Sie `openclaw tasks list` oder
`openclaw tasks show <taskId>`, um den Fortschritt über die CLI zu prüfen.

Außerhalb von sitzungsgestützten Agent-Läufen (zum Beispiel bei direkten
Tool-Aufrufen) fällt das Tool auf Inline-Generierung zurück und gibt den
finalen Medienpfad im selben Turn zurück.

Generierte Videodateien werden im von OpenClaw verwalteten Medienspeicher
gespeichert, wenn der Provider Bytes zurückgibt. Die Standard-Speichergrenze
für generierte Videos folgt dem Videomedienlimit, und
`agents.defaults.mediaMaxMb` erhöht sie für größere Renderings. Wenn ein
Provider zusätzlich eine gehostete Ausgabe-URL zurückgibt, kann OpenClaw
diese URL ausliefern, statt die Aufgabe fehlschlagen zu lassen, falls die
lokale Persistierung eine übergroße Datei ablehnt.

### Aufgabenlebenszyklus

| Status      | Bedeutung                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| `queued`    | Aufgabe erstellt, wartet darauf, dass der Provider sie akzeptiert.                                    |
| `running`   | Provider verarbeitet sie (typischerweise 30 Sekunden bis mehrere Minuten, je nach Provider und Auflösung). |
| `succeeded` | Video bereit; der Agent wacht auf und postet es in die Unterhaltung.                                  |
| `failed`    | Provider-Fehler oder Timeout; der Agent wacht mit Fehlerdetails auf.                                  |

Status über die CLI prüfen:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Wenn für die aktuelle Sitzung bereits eine Videoaufgabe `queued` oder
`running` ist, gibt `video_generate` den vorhandenen Aufgabenstatus zurück,
statt eine neue zu starten. Verwenden Sie `action: "status"`, um explizit
zu prüfen, ohne eine neue Generierung auszulösen.

## Unterstützte Provider

| Provider              | Standardmodell                  | Text | Bildref.                                             | Videoref.                                       | Auth                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Ja (Remote-URL)                                      | Ja (Remote-URL)                                 | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | Bis zu 2 Bilder (nur I2V-Modelle; erstes + letztes Frame) | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | Bis zu 2 Bilder (erstes + letztes Frame per Rolle)   | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | Bis zu 9 Referenzbilder                              | Bis zu 3 Videos                                 | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 Bild                                               | -                                               | `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 Bild; bis zu 9 mit Seedance reference-to-video     | Bis zu 3 Videos mit Seedance reference-to-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 Bild                                               | 1 Video                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 Bild                                               | -                                               | `MINIMAX_API_KEY` oder MiniMax OAuth     |
| OpenAI                | `sora-2`                        |  ✓   | 1 Bild                                               | 1 Video                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | Bis zu 4 Bilder (erstes/letztes Frame oder Referenzen) | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | Ja (Remote-URL)                                      | Ja (Remote-URL)                                 | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 Bild                                               | 1 Video                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | Nur `Wan-AI/Wan2.2-I2V-A14B`                         | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 Bild (`kling`)                                     | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 Erst-Frame-Bild oder bis zu 7 `reference_image`s   | 1 Video                                         | `XAI_API_KEY`                            |

Einige Provider akzeptieren zusätzliche oder alternative API-Schlüssel-Umgebungsvariablen.
Weitere Details finden Sie auf den jeweiligen [Provider-Seiten](#related).

Führen Sie `video_generate action=list` aus, um verfügbare Provider, Modelle und
Laufzeitmodi zur Laufzeit zu prüfen.

### Capability-Matrix

Der explizite Modusvertrag, der von `video_generate`, Vertragstests und
dem gemeinsamen Live-Sweep verwendet wird:

| Provider   | `generate` | `imageToVideo` | `videoToVideo` | Gemeinsame Live-Lanes heute                                                                                                             |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` übersprungen, weil dieser Provider Remote-`http(s)`-Video-URLs benötigt                      |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | Nicht im gemeinsamen Sweep; workflowspezifische Abdeckung liegt bei den Comfy-Tests                                                     |
| DeepInfra  |     ✓      |       -        |       -        | `generate`; native DeepInfra-Videoschemas sind im Plugin-Vertrag Text-zu-Video                                                          |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` nur bei Verwendung von Seedance reference-to-video                                            |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; gemeinsames `videoToVideo` übersprungen, weil der aktuelle buffer-gestützte Gemini/Veo-Sweep diese Eingabe nicht akzeptiert |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; gemeinsames `videoToVideo` übersprungen, weil diese Organisation/dieser Eingabepfad derzeit Provider-seitigen Video-Edit-Zugriff benötigt |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` übersprungen, weil dieser Provider Remote-`http(s)`-Video-URLs benötigt                      |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` läuft nur, wenn das ausgewählte Modell `runway/gen4_aleph` ist                               |
| Together   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`; gemeinsames `imageToVideo` übersprungen, weil das gebündelte `veo3` nur Text unterstützt und das gebündelte `kling` eine Remote-Bild-URL erfordert |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` übersprungen, weil dieser Provider derzeit eine Remote-MP4-URL benötigt                      |

## Tool-Parameter

### Erforderlich

<ParamField path="prompt" type="string" required>
  Textbeschreibung des zu generierenden Videos. Erforderlich für `action: "generate"`.
</ParamField>

### Inhaltseingaben

<ParamField path="image" type="string">Einzelnes Referenzbild (Pfad oder URL).</ParamField>
<ParamField path="images" type="string[]">Mehrere Referenzbilder (bis zu 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Optionale Rollenhinweise pro Position, parallel zur kombinierten Bildliste.
Kanonische Werte: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Einzelnes Referenzvideo (Pfad oder URL).</ParamField>
<ParamField path="videos" type="string[]">Mehrere Referenzvideos (bis zu 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Optionale Rollenhinweise pro Position, parallel zur kombinierten Videoliste.
Kanonischer Wert: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Einzelne Referenzaudiodatei (Pfad oder URL). Wird für Hintergrundmusik oder eine
Stimmreferenz verwendet, wenn der Provider Audioeingaben unterstützt.
</ParamField>
<ParamField path="audioRefs" type="string[]">Mehrere Referenzaudiodateien (bis zu 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Optionale Rollenhinweise pro Position, parallel zur kombinierten Audioliste.
Kanonischer Wert: `reference_audio`.
</ParamField>

<Note>
Rollenhinweise werden unverändert an den Provider weitergegeben. Kanonische Werte stammen aus
der Union `VideoGenerationAssetRole`, aber Provider können zusätzliche
Rollenzeichenfolgen akzeptieren. `*Roles`-Arrays dürfen nicht mehr Einträge haben als die
entsprechende Referenzliste; Off-by-one-Fehler schlagen mit einer klaren Fehlermeldung fehl.
Verwenden Sie eine leere Zeichenfolge, um einen Slot nicht zu setzen. Legen Sie für xAI jede Bildrolle auf
`reference_image` fest, um den Generierungsmodus `reference_images` zu verwenden; lassen Sie die
Rolle weg oder verwenden Sie `first_frame` für Image-to-Video mit einem einzelnen Bild.
</Note>

### Stilsteuerungen

<ParamField path="aspectRatio" type="string">
  Hinweis zum Seitenverhältnis, z. B. `1:1`, `16:9`, `9:16`, `adaptive` oder ein providerspezifischer Wert. OpenClaw normalisiert oder ignoriert nicht unterstützte Werte je Provider.
</ParamField>
<ParamField path="resolution" type="string">Hinweis zur Auflösung, z. B. `480P`, `720P`, `768P`, `1080P`, `4K` oder ein providerspezifischer Wert. OpenClaw normalisiert oder ignoriert nicht unterstützte Werte je Provider.</ParamField>
<ParamField path="durationSeconds" type="number">
  Zieldauer in Sekunden (auf den nächstgelegenen vom Provider unterstützten Wert gerundet).
</ParamField>
<ParamField path="size" type="string">Größenhinweis, wenn der Provider ihn unterstützt.</ParamField>
<ParamField path="audio" type="boolean">
  Aktiviert generiertes Audio in der Ausgabe, sofern unterstützt. Unterscheidet sich von `audioRef*` (Eingaben).
</ParamField>
<ParamField path="watermark" type="boolean">Schaltet Provider-Wasserzeichen um, sofern unterstützt.</ParamField>

`adaptive` ist ein providerspezifischer Sentinel: Er wird unverändert an
Provider weitergegeben, die `adaptive` in ihren Fähigkeiten deklarieren (z. B. verwendet BytePlus
Seedance dies, um das Verhältnis automatisch aus den Abmessungen des Eingabebilds
zu erkennen). Provider, die dies nicht deklarieren, geben den Wert über
`details.ignoredOverrides` im Tool-Ergebnis aus, sodass das Verwerfen sichtbar ist.

### Erweitert

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` gibt die aktuelle Sitzungsaufgabe zurück; `"list"` prüft Provider.
</ParamField>
<ParamField path="model" type="string">Provider-/Modell-Override (z. B. `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Hinweis zum Ausgabedateinamen.</ParamField>
<ParamField path="timeoutMs" type="number">Optionales Timeout für Provider-Vorgänge in Millisekunden. Wenn ausgelassen, verwendet OpenClaw `agents.defaults.videoGenerationModel.timeoutMs`, sofern konfiguriert, andernfalls den vom Plugin festgelegten Provider-Standard, wenn einer existiert.</ParamField>
<ParamField path="providerOptions" type="object">
  Providerspezifische Optionen als JSON-Objekt (z. B. `{"seed": 42, "draft": true}`).
  Provider, die ein typisiertes Schema deklarieren, validieren die Schlüssel und Typen; unbekannte
  Schlüssel oder Abweichungen überspringen den Kandidaten während des Fallbacks. Provider ohne
  deklariertes Schema erhalten die Optionen unverändert. Führen Sie `video_generate action=list`
  aus, um zu sehen, was die einzelnen Provider akzeptieren.
</ParamField>

<Note>
Nicht alle Provider unterstützen alle Parameter. OpenClaw normalisiert die Dauer auf
den nächstgelegenen vom Provider unterstützten Wert und bildet übersetzte Geometriehinweise
wie Größe-zu-Seitenverhältnis neu ab, wenn ein Fallback-Provider eine andere
Steuerungsoberfläche bereitstellt. Wirklich nicht unterstützte Overrides werden nach bestem Bemühen
ignoriert und im Tool-Ergebnis als Warnungen gemeldet. Harte Fähigkeitsgrenzen
(z. B. zu viele Referenzeingaben) schlagen vor der Übermittlung fehl. Tool-Ergebnisse
melden angewendete Einstellungen; `details.normalization` erfasst jede
Übersetzung von angefordert zu angewendet.
</Note>

Referenzeingaben wählen den Laufzeitmodus aus:

- Keine Referenzmedien → `generate`
- Beliebige Bildreferenz → `imageToVideo`
- Beliebige Videoreferenz → `videoToVideo`
- Referenz-Audioeingaben ändern den aufgelösten Modus **nicht**; sie werden auf
  den Modus angewendet, den die Bild-/Videoreferenzen auswählen, und funktionieren nur
  mit Providern, die `maxInputAudios` deklarieren.

Gemischte Bild- und Videoreferenzen sind keine stabile gemeinsame Fähigkeitsoberfläche.
Bevorzugen Sie einen Referenztyp pro Anfrage.

#### Fallback und typisierte Optionen

Einige Fähigkeitsprüfungen werden auf der Fallback-Ebene statt an der
Tool-Grenze angewendet, sodass eine Anfrage, die die Grenzen des primären Providers überschreitet,
weiterhin auf einem fähigen Fallback ausgeführt werden kann:

- Aktiver Kandidat, der kein `maxInputAudios` (oder `0`) deklariert, wird übersprungen, wenn
  die Anfrage Audioreferenzen enthält; der nächste Kandidat wird versucht.
- `maxDurationSeconds` des aktiven Kandidaten liegt unter dem angeforderten `durationSeconds`
  und es ist keine Liste `supportedDurationSeconds` deklariert → übersprungen.
- Anfrage enthält `providerOptions` und der aktive Kandidat deklariert explizit
  ein typisiertes `providerOptions`-Schema → übersprungen, wenn gelieferte Schlüssel
  nicht im Schema enthalten sind oder Werttypen nicht übereinstimmen. Provider ohne
  deklariertes Schema erhalten Optionen unverändert (rückwärtskompatible
  Durchreichung). Ein Provider kann alle Provider-Optionen ablehnen, indem er
  ein leeres Schema deklariert (`capabilities.providerOptions: {}`), was
  denselben Skip wie eine Typabweichung verursacht.

Der erste Skip-Grund in einer Anfrage wird mit `warn` protokolliert, damit Operatoren sehen,
wann ihr primärer Provider übergangen wurde; nachfolgende Skips werden mit `debug`
protokolliert, um lange Fallback-Ketten ruhig zu halten. Wenn jeder Kandidat übersprungen wird,
enthält der aggregierte Fehler den Skip-Grund für jeden.

## Aktionen

| Aktion     | Funktion                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | Standard. Erstellt ein Video aus dem angegebenen Prompt und optionalen Referenzeingaben.                 |
| `status`   | Prüft den Status der laufenden Videoaufgabe für die aktuelle Sitzung, ohne eine weitere Generierung zu starten. |
| `list`     | Zeigt verfügbare Provider, Modelle und deren Fähigkeiten an.                                             |

## Modellauswahl

OpenClaw löst das Modell in dieser Reihenfolge auf:

1. **Tool-Parameter `model`** - wenn der Agent im Aufruf einen angibt.
2. **`videoGenerationModel.primary`** aus der Konfiguration.
3. **`videoGenerationModel.fallbacks`** der Reihe nach.
4. **Automatische Erkennung** - Provider mit gültiger Authentifizierung, beginnend mit dem
   aktuellen Standard-Provider, anschließend verbleibende Provider in alphabetischer
   Reihenfolge.

Wenn ein Provider fehlschlägt, wird der nächste Kandidat automatisch versucht. Wenn alle
Kandidaten fehlschlagen, enthält der Fehler Details aus jedem Versuch.

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
    Verwendet den asynchronen DashScope-/Model-Studio-Endpunkt. Referenzbilder und
    Videos müssen entfernte `http(s)`-URLs sein.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    Provider-ID: `byteplus`.

    Modelle: `seedance-1-0-pro-250528` (Standard),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    T2V-Modelle (`*-t2v-*`) akzeptieren keine Bildeingaben; I2V-Modelle und
    allgemeine `*-pro-*`-Modelle unterstützen ein einzelnes Referenzbild (erstes
    Frame). Übergeben Sie das Bild positionsbasiert oder setzen Sie `role: "first_frame"`.
    T2V-Modell-IDs werden automatisch auf die entsprechende I2V-
    Variante umgeschaltet, wenn ein Bild bereitgestellt wird.

    Unterstützte `providerOptions`-Schlüssel: `seed` (Zahl), `draft` (boolesch -
    erzwingt 480p), `camera_fixed` (boolesch).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Erfordert das Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Provider-ID: `byteplus-seedance15`. Modell:
    `seedance-1-5-pro-251215`.

    Verwendet die einheitliche `content[]`-API. Unterstützt höchstens 2 Eingabebilder
    (`first_frame` + `last_frame`). Alle Eingaben müssen entfernte `https://`-
    URLs sein. Setzen Sie `role: "first_frame"` / `"last_frame"` für jedes Bild oder
    übergeben Sie Bilder positionsbasiert.

    `aspectRatio: "adaptive"` erkennt das Verhältnis automatisch aus dem Eingabebild.
    `audio: true` wird auf `generate_audio` abgebildet. `providerOptions.seed`
    (Zahl) wird weitergegeben.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Erfordert das Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    Provider-ID: `byteplus-seedance2`. Modelle:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Verwendet die einheitliche `content[]`-API. Unterstützt bis zu 9 Referenzbilder,
    3 Referenzvideos und 3 Referenzaudiodateien. Alle Eingaben müssen entfernte
    `https://`-URLs sein. Setzen Sie `role` für jedes Asset - unterstützte Werte:
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
    Verwendet einen warteschlangengestützten Ablauf für lang laufende Jobs. OpenClaw wartet
    standardmäßig bis zu 20 Minuten, bevor ein laufender fal-Warteschlangenjob als
    abgelaufen behandelt wird. Die meisten fal-Videomodelle
    akzeptieren eine einzelne Bildreferenz. Seedance-2.0-Referenz-zu-Video-
    Modelle akzeptieren bis zu 9 Bilder, 3 Videos und 3 Audioreferenzen, mit
    höchstens 12 Referenzdateien insgesamt.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Unterstützt eine Bild- oder eine Videoreferenz. Anfragen für generiertes Audio werden
    auf dem Gemini-API-Pfad mit einer Warnung ignoriert, weil diese API
    den Parameter `generateAudio` für die aktuelle Veo-Videogenerierung ablehnt.
  </Accordion>
  <Accordion title="MiniMax">
    Nur eine einzelne Bildreferenz. MiniMax akzeptiert die Auflösungen `768P` und `1080P`;
    Anfragen wie `720P` werden vor der Übermittlung auf den nächstliegenden
    unterstützten Wert normalisiert.
  </Accordion>
  <Accordion title="OpenAI">
    Nur die `size`-Überschreibung wird weitergeleitet. Andere Stilüberschreibungen
    (`aspectRatio`, `resolution`, `audio`, `watermark`) werden mit
    einer Warnung ignoriert.
  </Accordion>
  <Accordion title="OpenRouter">
    Verwendet die asynchrone `/videos`-API von OpenRouter. OpenClaw übermittelt den
    Job, fragt `polling_url` ab und lädt entweder `unsigned_urls` oder den
    dokumentierten Job-Inhaltsendpunkt herunter. Der gebündelte Standard `google/veo-3.1-fast`
    bewirbt Dauern von 4/6/8 Sekunden, Auflösungen `720P`/`1080P` und
    Seitenverhältnisse `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Dasselbe DashScope-Backend wie Alibaba. Referenzeingaben müssen entfernte
    `http(s)`-URLs sein; lokale Dateien werden vorab abgelehnt.
  </Accordion>
  <Accordion title="Runway">
    Unterstützt lokale Dateien über Daten-URIs. Video-zu-Video erfordert
    `runway/gen4_aleph`. Reine Textläufe stellen die Seitenverhältnisse `16:9` und `9:16`
    bereit.
  </Accordion>
  <Accordion title="Together">
    Nur eine einzelne Bildreferenz.
  </Accordion>
  <Accordion title="Vydra">
    Verwendet `https://www.vydra.ai/api/v1` direkt, um auth-verwerfende
    Weiterleitungen zu vermeiden. `veo3` ist nur als Text-zu-Video gebündelt; `kling` erfordert
    eine entfernte Bild-URL.
  </Accordion>
  <Accordion title="xAI">
    Unterstützt Text-zu-Video, Bild-zu-Video mit einem einzelnen ersten Frame, bis zu 7
    `reference_image`-Eingaben über xAI `reference_images` sowie entfernte
    Video-Bearbeitungs- und Erweiterungsabläufe.
  </Accordion>
</AccordionGroup>

## Provider-Fähigkeitsmodi

Der gemeinsame Videogenerierungsvertrag unterstützt modusspezifische Fähigkeiten
statt nur flache aggregierte Grenzen. Neue Provider-Implementierungen
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
`generate`, `imageToVideo` und `videoToVideo` explizit deklarieren, damit Live-
Tests, Vertragstests und das gemeinsame Tool `video_generate` die
Modusunterstützung deterministisch validieren können.

Wenn ein Modell in einem Provider breitere Unterstützung für Referenzeingaben hat als der
Rest, verwenden Sie `maxInputImagesByModel`, `maxInputVideosByModel` oder
`maxInputAudiosByModel`, statt die modusweite Grenze anzuheben.

## Live-Tests

Opt-in-Live-Abdeckung für die gemeinsam gebündelten Provider:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Repo-Wrapper:

```bash
pnpm test:live:media video
```

Diese Live-Datei verwendet standardmäßig bereits exportierte Provider-Umgebungsvariablen
vor gespeicherten Authentifizierungsprofilen und führt standardmäßig einen release-sicheren
Smoke-Test aus:

- `generate` für jeden Nicht-FAL-Provider in der Prüfung.
- Einsekündiger Hummer-Prompt.
- Vorgangslimit pro Provider aus
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (standardmäßig `180000`).

FAL ist opt-in, weil die Warteschlangenlatenz auf Provider-Seite die Release-
Zeit dominieren kann:

```bash
pnpm test:live:media video --video-providers fal
```

Setzen Sie `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, um auch deklarierte
Transformationsmodi auszuführen, die die gemeinsame Prüfung mit lokalen Medien sicher testen kann:

- `imageToVideo`, wenn `capabilities.imageToVideo.enabled`.
- `videoToVideo`, wenn `capabilities.videoToVideo.enabled` und das
  Provider-/Modell pufferbasierte lokale Videoeingabe in der gemeinsamen
  Prüfung akzeptiert.

Heute deckt die gemeinsame `videoToVideo`-Live-Lane `runway` nur ab, wenn Sie
`runway/gen4_aleph` auswählen.

## Konfiguration

Legen Sie das standardmäßige Videogenerierungsmodell in Ihrer OpenClaw-Konfiguration fest:

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
- [Hintergrundaufgaben](/de/automation/tasks) - Aufgabenverfolgung für asynchrone Videogenerierung
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
