---
read_when:
    - Videos über den Agenten generieren
    - Provider und Modelle für die Videogenerierung konfigurieren
    - Die Parameter des Tools `video_generate` verstehen
sidebarTitle: Video generation
summary: Generieren Sie über video_generate Videos aus Text-, Bild- oder Videoreferenzen mit 16 Provider-Backends
title: Videogenerierung
x-i18n:
    generated_at: "2026-07-12T16:00:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dd34232a3b1a340fcd7dd51a8c5517f976b2300d86a87b56b86a35102ac2d502
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw-Agenten generieren über `video_generate` Videos aus Text-Prompts, Referenzbildern oder
vorhandenen Videos. Sechzehn Provider-Backends werden unterstützt; der Agent wählt anhand der Konfiguration und
der verfügbaren API-Schlüssel automatisch das passende aus.

<Note>
`video_generate` wird nur angezeigt, wenn mindestens ein Provider für die Videogenerierung
verfügbar ist. Wenn es in Ihren Agenten-Tools fehlt, legen Sie einen Provider-API-Schlüssel fest oder
konfigurieren Sie `agents.defaults.videoGenerationModel`.
</Note>

`video_generate` verfügt über drei Laufzeitmodi, die anhand der Referenzeingaben
im Aufruf bestimmt werden:

- `generate` - keine Referenzmedien (Text-zu-Video).
- `imageToVideo` - ein oder mehrere Referenzbilder.
- `videoToVideo` - ein oder mehrere Referenzvideos.

Provider können eine beliebige Teilmenge dieser Modi unterstützen. Das Tool validiert den
aktiven Modus vor dem Absenden und meldet unterstützte Modi in `action=list`.

## Schnellstart

<Steps>
  <Step title="Authentifizierung konfigurieren">
    Legen Sie einen API-Schlüssel für einen beliebigen unterstützten Provider fest:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Standardmodell auswählen (optional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Den Agenten anweisen">
    > Generieren Sie ein 5-sekündiges filmisches Video eines freundlichen Hummers, der bei Sonnenuntergang surft.

    Der Agent ruft `video_generate` automatisch auf. Eine Aufnahme des Tools in eine Positivliste
    ist nicht erforderlich.

  </Step>
</Steps>

## Funktionsweise der asynchronen Generierung

Die Videogenerierung erfolgt asynchron:

1. OpenClaw sendet die Anfrage an den Provider und gibt sofort eine Task-ID zurück.
2. Der Provider verarbeitet den Auftrag im Hintergrund (üblicherweise 30 Sekunden bis mehrere Minuten, abhängig vom Provider und der Auflösung; langsame, warteschlangenbasierte Provider können bis zum konfigurierten Zeitlimit benötigen).
3. Sobald das Video bereit ist, aktiviert OpenClaw dieselbe Sitzung mit einem internen Abschlussereignis.
4. Der Agent meldet es über den normalen Modus für sichtbare Antworten der Sitzung:
   als automatische abschließende Antwort oder über `message(action="send")`, wenn die Sitzung
   das Nachrichten-Tool erfordert. Wenn die anfragende Sitzung inaktiv ist oder ihre Aktivierung fehlschlägt und
   die generierten Medien weiterhin in der Abschlussantwort fehlen, sendet OpenClaw
   einen idempotenten direkten Fallback mit den Medien.

Während ein Auftrag ausgeführt wird, geben doppelte `video_generate`-Aufrufe in derselben
Sitzung den aktuellen Task-Status zurück, statt eine weitere
Generierung zu starten. Verwenden Sie `action: "status"`, um den Status zu prüfen, ohne eine neue
Generierung auszulösen, oder `openclaw tasks list` / `openclaw tasks show <lookup>` über die
CLI (siehe [Hintergrund-Tasks](/de/automation/tasks)).

Außerhalb sitzungsbasierter Agenten-Ausführungen (beispielsweise bei direkten Tool-Aufrufen)
greift das Tool auf Inline-Generierung zurück und gibt den endgültigen Medienpfad
im selben Durchlauf zurück.

Generierte Videodateien werden im von OpenClaw verwalteten Medienspeicher gespeichert, wenn der
Provider Bytes zurückgibt. Die Standardobergrenze beträgt 16MB (das gemeinsame Limit für
Videomedien); `agents.defaults.mediaMaxMb` erhöht sie für größere Renderings. Wenn ein
Provider zusätzlich eine gehostete Ausgabe-URL zurückgibt, stellt OpenClaw diese URL bereit,
statt den Task fehlschlagen zu lassen, falls die lokale Speicherung eine übergroße Datei ablehnt.

### Task-Lebenszyklus

| Status      | Bedeutung                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | Task erstellt; wartet darauf, dass der Provider ihn annimmt.                                           |
| `running`   | Der Provider verarbeitet ihn (üblicherweise 30 Sekunden bis mehrere Minuten, abhängig von Provider und Auflösung). |
| `succeeded` | Video bereit; der Agent wird aktiviert und veröffentlicht es in der Unterhaltung.                      |
| `failed`    | Provider-Fehler oder Zeitüberschreitung; der Agent wird mit Fehlerdetails aktiviert.                   |

Prüfen Sie den Status über die CLI:

```bash
openclaw tasks list
openclaw tasks show <lookup>
openclaw tasks cancel <lookup>
```

## Unterstützte Provider

| Provider              | Standardmodell                  | Text | Bildreferenz                                          | Videoreferenz                                   | Authentifizierung                        |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Ja (Remote-URL)                                      | Ja (Remote-URL)                                 | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | Bis zu 2 Bilder (nur I2V-Modelle; erstes + letztes Einzelbild) | -                                        | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | Bis zu 2 Bilder (erstes + letztes Einzelbild über Rolle) | -                                           | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | Bis zu 9 Referenzbilder                              | Bis zu 3 Videos                                 | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 Bild                                               | -                                               | `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 Bild; bis zu 9 mit Seedance Referenz-zu-Video      | Bis zu 3 Videos mit Seedance Referenz-zu-Video  | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 Bild                                               | 1 Video                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 Bild                                               | -                                               | `MINIMAX_API_KEY` oder MiniMax OAuth     |
| OpenAI                | `sora-2`                        |  ✓   | 1 Bild                                               | 1 Video                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | Bis zu 4 Bilder (erstes/letztes Einzelbild oder Referenzen) | -                                        | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | Ja (Remote-URL)                                      | Ja (Remote-URL)                                 | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 Bild                                               | 1 Video                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | nur `Wan-AI/Wan2.2-I2V-A14B`                         | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 Bild (`kling`)                                     | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | Classic: 1 erstes Einzelbild oder 7 Referenzen; 1.5: 1 Einzelbild | Classic: 1 Video                         | `XAI_API_KEY`                            |

Einige Provider akzeptieren zusätzliche oder alternative Umgebungsvariablen für API-Schlüssel. Einzelheiten finden Sie auf den
jeweiligen [Provider-Seiten](#related).

Führen Sie `video_generate action=list` aus, um verfügbare Provider, Modelle und
Laufzeitmodi zur Laufzeit zu prüfen.

### Funktionsmatrix

Der explizite Modusvertrag, der von `video_generate`, Vertragstests und
dem gemeinsamen Live-Durchlauf verwendet wird:

| Provider   | `generate` | `imageToVideo` | `videoToVideo` | Heutige gemeinsame Live-Testpfade                                                                                                       |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` wird übersprungen, da dieser Provider Remote-`http(s)`-Video-URLs benötigt                    |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | Nicht im gemeinsamen Durchlauf; Workflow-spezifische Abdeckung erfolgt durch Comfy-Tests                                                |
| DeepInfra  |     ✓      |       -        |       -        | `generate`; native DeepInfra-Videoschemas sind im Plugin-Vertrag Text-zu-Video                                                          |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` nur bei Verwendung von Seedance Referenz-zu-Video                                            |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; gemeinsames `videoToVideo` wird übersprungen, da der aktuelle puffergestützte Gemini/Veo-Durchlauf diese Eingabe nicht akzeptiert |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; gemeinsames `videoToVideo` wird übersprungen, da dieser Organisations-/Eingabepfad derzeit Provider-seitigen Zugriff auf die Videobearbeitung benötigt |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` wird übersprungen, da dieser Provider Remote-`http(s)`-Video-URLs benötigt                    |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` wird nur ausgeführt, wenn das ausgewählte Modell `runway/gen4_aleph` ist                      |
| Together   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`; gemeinsames `imageToVideo` wird übersprungen, da das gebündelte `veo3` nur Text unterstützt und das gebündelte `kling` eine Remote-Bild-URL erfordert |
| xAI        |     ✓      |       ✓        |       ✓        | Classic unterstützt alle Modi; Video 1.5 unterstützt nur Bild-zu-Video; Remote-MP4-Eingaben schließen `videoToVideo` aus dem gemeinsamen Durchlauf aus |

## Tool-Parameter

### Erforderlich

<ParamField path="prompt" type="string" required>
  Textbeschreibung des zu generierenden Videos. Erforderlich für `action: "generate"`.
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
Einzelne Referenzaudiodatei (Pfad oder URL). Wird für Hintergrundmusik oder als
Stimmreferenz verwendet, wenn der Provider Audioeingaben unterstützt.
</ParamField>
<ParamField path="audioRefs" type="string[]">Mehrere Referenzaudiodateien (bis zu 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Optionale positionsbezogene Rollenhinweise parallel zur kombinierten Audioliste.
Kanonischer Wert: `reference_audio`.
</ParamField>

<Note>
Rollenhinweise werden unverändert an den Provider weitergeleitet. Kanonische
Werte stammen aus der Union `VideoGenerationAssetRole`, Provider können jedoch
zusätzliche Rollen-Zeichenfolgen akzeptieren. `*Roles`-Arrays dürfen nicht mehr
Einträge als die entsprechende Referenzliste enthalten; Abweichungen um eins
führen zu einem eindeutigen Fehler. Verwenden Sie eine leere Zeichenfolge, um
einen Eintrag unbelegt zu lassen. Legen Sie für xAI jede Bildrolle auf
`reference_image` fest, um dessen Generierungsmodus `reference_images` zu
verwenden; lassen Sie die Rolle weg oder verwenden Sie `first_frame` für die
Bild-zu-Video-Generierung mit einem einzelnen Bild.
</Note>

### Stilsteuerung

<ParamField path="aspectRatio" type="string">
  Hinweis zum Seitenverhältnis wie `1:1`, `16:9`, `9:16`, `adaptive` oder ein providerspezifischer Wert. OpenClaw normalisiert oder ignoriert nicht unterstützte Werte je nach Provider.
</ParamField>
<ParamField path="resolution" type="string">Hinweis zur Auflösung wie `360P`, `480P`, `540P`, `720P`, `768P`, `1080P`, `4K` oder ein providerspezifischer Wert. OpenClaw normalisiert oder ignoriert nicht unterstützte Werte je nach Provider.</ParamField>
<ParamField path="durationSeconds" type="number">
  Zieldauer in Sekunden (auf den nächsten vom Provider unterstützten Wert gerundet).
</ParamField>
<ParamField path="size" type="string">Größenhinweis, wenn der Provider dies unterstützt.</ParamField>
<ParamField path="audio" type="boolean">
  Aktiviert erzeugtes Audio in der Ausgabe, sofern unterstützt. Unterscheidet sich von `audioRef*` (Eingaben).
</ParamField>
<ParamField path="watermark" type="boolean">Schaltet Wasserzeichen des Providers um, sofern unterstützt.</ParamField>

`adaptive` ist ein providerspezifischer Sentinelwert: Er wird unverändert an
Provider weitergeleitet, die `adaptive` in ihren Fähigkeiten deklarieren
(z. B. verwendet BytePlus Seedance ihn, um das Seitenverhältnis automatisch
anhand der Abmessungen des Eingabebilds zu erkennen). Provider, die ihn nicht
deklarieren, geben den Wert im Werkzeugergebnis über
`details.ignoredOverrides` aus, damit das Verwerfen sichtbar ist.

### Erweitert

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` gibt die aktuelle Aufgabe der Sitzung zurück; `"list"` prüft die Provider.
</ParamField>
<ParamField path="model" type="string">Überschreibung von Provider/Modell (z. B. `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Hinweis zum Ausgabedateinamen.</ParamField>
<ParamField path="timeoutMs" type="number">Optionales Zeitlimit für den Provider-Vorgang in Millisekunden. Wenn es nicht angegeben ist, verwendet OpenClaw den Wert `agents.defaults.videoGenerationModel.timeoutMs`, sofern dieser konfiguriert ist, andernfalls den vom Plugin definierten Standardwert des Providers, falls vorhanden.</ParamField>
<ParamField path="providerOptions" type="object">
  Providerspezifische Optionen als JSON-Objekt (z. B. `{"seed": 42, "draft": true}`).
  Provider, die ein typisiertes Schema deklarieren, validieren die Schlüssel und
  Typen; unbekannte Schlüssel oder Abweichungen führen dazu, dass der Kandidat
  beim Fallback übersprungen wird. Provider ohne deklariertes Schema erhalten
  die Optionen unverändert. Führen Sie `video_generate action=list` aus, um zu
  sehen, was die einzelnen Provider akzeptieren.
</ParamField>

<Note>
Nicht alle Provider unterstützen alle Parameter. OpenClaw normalisiert die
Dauer auf den nächstgelegenen vom Provider unterstützten Wert und ordnet
übersetzte Geometriehinweise wie Größe-zu-Seitenverhältnis neu zu, wenn ein
Fallback-Provider eine andere Steuerungsoberfläche bereitstellt. Tatsächlich
nicht unterstützte Überschreibungen werden nach bestem Bemühen ignoriert und
im Werkzeugergebnis als Warnungen gemeldet. Harte Fähigkeitsgrenzen (etwa zu
viele Referenzeingaben) führen vor der Übermittlung zu einem Fehler.
Werkzeugergebnisse melden die angewendeten Einstellungen;
`details.normalization` erfasst jede Übersetzung von angeforderten zu
angewendeten Werten.
</Note>

Referenzeingaben bestimmen den Laufzeitmodus:

- Keine Referenzmedien -> `generate`
- Beliebige Bildreferenz -> `imageToVideo`
- Beliebige Videoreferenz -> `videoToVideo`
- Referenzaudioeingaben ändern den aufgelösten Modus **nicht**; sie werden
  zusätzlich zu dem Modus angewendet, den die Bild-/Videoreferenzen auswählen,
  und funktionieren nur mit Providern, die `maxInputAudios` deklarieren.

Gemischte Bild- und Videoreferenzen sind keine stabile gemeinsame
Fähigkeitsoberfläche. Bevorzugen Sie einen Referenztyp pro Anfrage.

#### Fallback und typisierte Optionen

Einige Fähigkeitsprüfungen werden auf der Fallback-Ebene statt an der
Werkzeuggrenze angewendet, sodass eine Anfrage, welche die Grenzen des primären
Providers überschreitet, weiterhin bei einem geeigneten Fallback ausgeführt
werden kann:

- Ein aktiver Kandidat, der kein `maxInputAudios` (oder `0`) deklariert, wird
  übersprungen, wenn die Anfrage Audioreferenzen enthält; der nächste Kandidat
  wird versucht. Dieselbe Prüfung gilt für die Anzahl der Bild- und
  Videoreferenzen im Verhältnis zu `maxInputImages`/`maxInputVideos`.
- Liegt `maxDurationSeconds` des aktiven Kandidaten unter dem angeforderten
  Wert `durationSeconds`, ohne dass eine Liste `supportedDurationSeconds`
  deklariert ist, wird er übersprungen.
- Enthält die Anfrage `providerOptions` und deklariert der aktive Kandidat
  ausdrücklich ein typisiertes `providerOptions`-Schema, wird er übersprungen,
  wenn angegebene Schlüssel nicht im Schema enthalten sind oder Werttypen nicht
  übereinstimmen. Provider ohne deklariertes Schema erhalten die Optionen
  unverändert (abwärtskompatible Durchleitung). Ein Provider kann alle
  Provider-Optionen ablehnen, indem er ein leeres Schema
  (`capabilities.providerOptions: {}`) deklariert, was zum gleichen Überspringen
  wie eine Typabweichung führt.

Der erste Grund für das Überspringen in einer Anfrage wird mit `warn`
protokolliert, damit Betreiber erkennen, wenn ihr primärer Provider übergangen
wurde; weitere Überspringvorgänge werden mit `debug` protokolliert, damit lange
Fallback-Ketten übersichtlich bleiben. Wenn jeder Kandidat übersprungen wird,
enthält der zusammengefasste Fehler den jeweiligen Grund für jeden Kandidaten.

## Aktionen

| Aktion     | Funktion                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| `generate` | Standard. Erstellt ein Video aus der angegebenen Eingabeaufforderung und optionalen Referenzeingaben.         |
| `status`   | Prüft den Status der laufenden Videoaufgabe für die aktuelle Sitzung, ohne eine weitere Generierung zu starten. |
| `list`     | Zeigt verfügbare Provider, Modelle und deren Fähigkeiten an.                                                  |

## Modellauswahl

OpenClaw löst das Modell in dieser Reihenfolge auf:

1. **Werkzeugparameter `model`** – wenn der Agent beim Aufruf einen angibt.
2. **`videoGenerationModel.primary`** aus der Konfiguration.
3. **`videoGenerationModel.fallbacks`** in der angegebenen Reihenfolge.
4. **Automatische Erkennung** – Provider mit gültiger Authentifizierung,
   beginnend mit dem aktuellen Standard-Provider und anschließend die
   verbleibenden Provider in alphabetischer Reihenfolge.

Wenn ein Provider fehlschlägt, wird automatisch der nächste Kandidat versucht.
Wenn alle Kandidaten fehlschlagen, enthält der Fehler Details zu jedem Versuch.

Legen Sie `agents.defaults.mediaGenerationAutoProviderFallback: false` fest, um
nur die expliziten Einträge `model`, `primary` und `fallbacks` zu verwenden.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
        timeoutMs: 180000, // optionale Überschreibung des Zeitlimits für Provider-Anfragen pro Werkzeug
      },
    },
  },
}
```

## Hinweise zu Providern

<AccordionGroup>
  <Accordion title="Alibaba">
    Verwendet den asynchronen Endpunkt von DashScope / Model Studio.
    Referenzbilder und -videos müssen entfernte `http(s)`-URLs sein.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    Provider-ID: `byteplus`.

    Modelle: `seedance-1-0-pro-250528` (Standard),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    T2V-Modelle (`*-t2v-*`) akzeptieren keine Bildeingaben; I2V-Modelle und
    allgemeine `*-pro-*`-Modelle unterstützen ein einzelnes Referenzbild
    (erstes Einzelbild). Übergeben Sie das Bild positionsbezogen oder legen
    Sie `role: "first_frame"` fest. T2V-Modell-IDs werden automatisch auf die
    entsprechende I2V-Variante umgestellt, wenn ein Bild angegeben wird.

    Unterstützte `providerOptions`-Schlüssel: `seed` (Zahl), `draft`
    (boolescher Wert – erzwingt 480p), `camera_fixed` (boolescher Wert).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Erfordert das Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (extern, nicht enthalten). Provider-ID: `byteplus-seedance15`. Modell:
    `seedance-1-5-pro-251215`.

    Verwendet die einheitliche `content[]`-API. Unterstützt höchstens 2
    Eingabebilder (`first_frame` + `last_frame`). Alle Eingaben müssen entfernte
    `https://`-URLs sein. Legen Sie für jedes Bild `role: "first_frame"` /
    `"last_frame"` fest oder übergeben Sie die Bilder positionsbezogen.

    `aspectRatio: "adaptive"` erkennt das Seitenverhältnis automatisch anhand
    des Eingabebilds. `audio: true` wird `generate_audio` zugeordnet.
    `providerOptions.seed` (Zahl) wird weitergeleitet.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Erfordert das Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (extern, nicht enthalten). Provider-ID: `byteplus-seedance2`. Modelle:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Verwendet die einheitliche `content[]`-API. Unterstützt bis zu 9
    Referenzbilder, 3 Referenzvideos und 3 Referenzaudiodateien. Alle Eingaben
    müssen entfernte `https://`-URLs sein. Legen Sie `role` für jedes Asset fest –
    unterstützte Werte: `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` erkennt das Seitenverhältnis automatisch anhand
    des Eingabebilds. `audio: true` wird `generate_audio` zugeordnet.
    `providerOptions.seed` (Zahl) wird weitergeleitet.

  </Accordion>
  <Accordion title="ComfyUI">
    Workflow-gesteuerte lokale oder Cloud-Ausführung. Unterstützt Text-zu-Video und
    Bild-zu-Video über den konfigurierten Graphen.
  </Accordion>
  <Accordion title="fal">
    Verwendet einen warteschlangengestützten Ablauf für lang laufende Aufträge. OpenClaw wartet standardmäßig bis zu 20
    Minuten, bevor ein noch laufender fal-Warteschlangenauftrag als
    zeitüberschritten behandelt wird. Die meisten fal-Videomodelle
    akzeptieren eine einzelne Bildreferenz. Seedance-2.0-Referenz-zu-Video-
    Modelle akzeptieren bis zu 9 Bilder, 3 Videos und 3 Audioreferenzen, mit
    insgesamt höchstens 12 Referenzdateien.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Unterstützt eine Bild- oder eine Videoreferenz. Anfragen für generiertes Audio werden
    im Gemini-API-Pfad mit einer Warnung ignoriert, da diese API
    den Parameter `generateAudio` für die aktuelle Veo-Videogenerierung ablehnt.
  </Accordion>
  <Accordion title="MiniMax">
    Nur eine einzelne Bildreferenz. MiniMax akzeptiert die Auflösungen `768P` und `1080P`;
    Anfragen wie `720P` werden vor dem Absenden auf den nächstliegenden
    unterstützten Wert normalisiert.
  </Accordion>
  <Accordion title="OpenAI">
    Nur die Überschreibung `size` wird weitergeleitet. Andere Stilüberschreibungen
    (`aspectRatio`, `resolution`, `audio`, `watermark`) werden mit
    einer Warnung ignoriert.
  </Accordion>
  <Accordion title="OpenRouter">
    Verwendet die asynchrone `/videos`-API von OpenRouter. OpenClaw übermittelt den
    Auftrag, fragt `polling_url` ab und lädt entweder `unsigned_urls` oder den
    dokumentierten Inhaltsendpunkt des Auftrags herunter. Der gebündelte Standard `google/veo-3.1-fast`
    gibt Dauern von 4/6/8 Sekunden, Auflösungen von `720P`/`1080P` und
    Seitenverhältnisse von `16:9`/`9:16` an.
  </Accordion>
  <Accordion title="Qwen">
    Dasselbe DashScope-Backend wie Alibaba. Referenzeingaben müssen entfernte
    `http(s)`-URLs sein; lokale Dateien werden vorab abgelehnt.
  </Accordion>
  <Accordion title="Runway">
    Unterstützt lokale Dateien über Daten-URIs. Video-zu-Video erfordert
    `runway/gen4_aleph`. Reine Textausführungen bieten die Seitenverhältnisse `16:9` und `9:16`.
  </Accordion>
  <Accordion title="Together">
    Nur eine einzelne Bildreferenz.
  </Accordion>
  <Accordion title="Vydra">
    Verwendet `https://www.vydra.ai/api/v1` direkt, um Weiterleitungen zu vermeiden,
    bei denen Authentifizierungsdaten verloren gehen. `veo3` ist nur für Text-zu-Video gebündelt; `kling` erfordert
    eine entfernte Bild-URL.
  </Accordion>
  <Accordion title="xAI">
    Das Standardmodell `grok-imagine-video` unterstützt Text-zu-Video, Bild-zu-Video mit einem einzelnen
    Bild als erstem Frame, bis zu 7 `reference_image`-Eingaben über xAI-
    `reference_images` sowie Abläufe zum Bearbeiten und Erweitern entfernter Videos. Die Generierung verwendet standardmäßig
    `480P`; Bild-zu-Video mit einem einzelnen Bild übernimmt das Seitenverhältnis der Quelle, wenn
    `aspectRatio` weggelassen wird. Video-Bearbeitung und -Erweiterung übernehmen die Geometrie der Eingabe und
    akzeptieren keine Überschreibungen für Seitenverhältnis oder Auflösung. Die Erweiterung akzeptiert 2-10
    Sekunden.

    `grok-imagine-video-1.5` unterstützt nur Bild-zu-Video: Geben Sie genau ein Bild an.
    Es unterstützt 1-15 Sekunden und `480P`, `720P` oder `1080P`, standardmäßig
    `480P`; lassen Sie `aspectRatio` weg, um das Seitenverhältnis des Quellbilds zu übernehmen. Die Vorschau-
    und datierten 1.5-Bezeichner werden identisch validiert und unverändert
    weitergeleitet.

  </Accordion>
</AccordionGroup>

## Provider-Fähigkeitsmodi

Der gemeinsame Vertrag für die Videogenerierung unterstützt modusspezifische Fähigkeiten
anstelle ausschließlich flacher aggregierter Grenzwerte. Neue Provider-Implementierungen
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
**nicht** aus, um die Unterstützung von Transformationsmodi anzugeben. Provider sollten
`generate`, `imageToVideo` und `videoToVideo` explizit deklarieren, damit Live-
Tests, Vertragstests und das gemeinsame Tool `video_generate` die
Modusunterstützung deterministisch validieren können.

Wenn ein Modell eines Providers eine umfassendere Unterstützung für Referenzeingaben als die
übrigen Modelle bietet, verwenden Sie `maxInputImagesByModel`, `maxInputVideosByModel` oder
`maxInputAudiosByModel`, anstatt den modusweiten Grenzwert zu erhöhen.

## Live-Tests

Optional aktivierbare Live-Abdeckung für die gemeinsam gebündelten Provider:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Repo-Wrapper:

```bash
pnpm test:live:media video
```

Diese Live-Datei verwendet standardmäßig bereits exportierte Provider-Umgebungsvariablen vor gespeicherten
Authentifizierungsprofilen und führt standardmäßig einen release-sicheren Smoke-Test aus:

- `generate` für jeden Nicht-FAL-Provider im Durchlauf.
- Einsekündiger Lobster-Prompt.
- Provider-spezifisches Zeitlimit für Vorgänge aus
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (standardmäßig `180000`).

FAL muss optional aktiviert werden, da die providerseitige Warteschlangenlatenz die Release-
Dauer dominieren kann:

```bash
pnpm test:live:media video --video-providers fal
```

Setzen Sie `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, um zusätzlich deklarierte
Transformationsmodi auszuführen, die der gemeinsame Durchlauf mit lokalen Medien sicher testen kann:

- `imageToVideo`, wenn `capabilities.imageToVideo.enabled`.
- `videoToVideo`, wenn `capabilities.videoToVideo.enabled` und das
  Provider-/Modellpaar im gemeinsamen
  Durchlauf puffergestützte lokale Videoeingaben akzeptiert.

Derzeit deckt die gemeinsame `videoToVideo`-Live-Lane `runway` nur ab, wenn Sie
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

## Verwandte Themen

- [Alibaba Model Studio](/de/providers/alibaba)
- [Hintergrundaufgaben](/de/automation/tasks) - Aufgabenverfolgung für die asynchrone Videogenerierung
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
- [Tool-Übersicht](/de/tools)
- [Vydra](/de/providers/vydra)
- [xAI](/de/providers/xai)
