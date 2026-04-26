---
read_when:
    - Sie möchten OpenAI-Modelle in OpenClaw verwenden.
    - Sie möchten die Authentifizierung über ein Codex-Abonnement statt über API-Schlüssel verwenden.
    - Sie benötigen strengeres GPT-5-Agentenausführungsverhalten.
summary: OpenAI über API-Schlüssel oder ein Codex-Abonnement in OpenClaw verwenden
title: OpenAI
x-i18n:
    generated_at: "2026-04-26T11:38:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4c3e734217ca82e1a5965c41686341a8bd87b4d2194c6d9e286e1087fa53320
    source_path: providers/openai.md
    workflow: 15
---

  OpenAI stellt Entwickler-APIs für GPT-Modelle bereit, und Codex ist außerdem als
  Coding-Agent mit ChatGPT-Tarif über die Codex-Clients von OpenAI verfügbar. OpenClaw hält diese
  Oberflächen getrennt, damit die Konfiguration vorhersehbar bleibt.

  OpenClaw unterstützt drei Routen der OpenAI-Familie. Das Modellpräfix wählt die
  Anbieter-/Authentifizierungsroute aus; eine separate Laufzeiteinstellung wählt aus, wer die
  eingebettete Agentenschleife ausführt:

  - **API-Schlüssel** — direkter Zugriff auf die OpenAI-Platform mit nutzungsbasierter Abrechnung (`openai/*`-Modelle)
  - **Codex-Abonnement über PI** — ChatGPT-/Codex-Anmeldung mit Abonnementzugriff (`openai-codex/*`-Modelle)
  - **Codex-App-Server-Harness** — native Ausführung über den Codex-App-Server (`openai/*`-Modelle plus `agents.defaults.agentRuntime.id: "codex"`)

  OpenAI unterstützt die Nutzung von OAuth-Abonnements in externen Tools und Workflows wie OpenClaw ausdrücklich.

  Anbieter, Modell, Laufzeit und Kanal sind separate Ebenen. Wenn diese Bezeichnungen
  vermischt werden, lesen Sie vor einer Konfigurationsänderung [Agent-Laufzeiten](/de/concepts/agent-runtimes).

  ## Schnellauswahl

  | Ziel                                          | Verwenden Sie                                  | Hinweise                                                                     |
  | --------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
  | Direkte Abrechnung über API-Schlüssel         | `openai/gpt-5.5`                               | Setzen Sie `OPENAI_API_KEY` oder führen Sie das Onboarding für OpenAI-API-Schlüssel aus. |
  | GPT-5.5 mit ChatGPT-/Codex-Abonnement-Auth    | `openai-codex/gpt-5.5`                         | Standard-PI-Route für Codex OAuth. Beste erste Wahl für Setups mit Abonnement. |
  | GPT-5.5 mit nativem Codex-App-Server-Verhalten | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | Erzwingt das Codex-App-Server-Harness für diese Modellreferenz.             |
  | Bildgenerierung oder -bearbeitung             | `openai/gpt-image-2`                           | Funktioniert entweder mit `OPENAI_API_KEY` oder OpenAI Codex OAuth.         |
  | Bilder mit transparentem Hintergrund          | `openai/gpt-image-1.5`                         | Verwenden Sie `outputFormat=png` oder `webp` und `openai.background=transparent`. |

  ## Namenszuordnung

  Die Namen sind ähnlich, aber nicht austauschbar:

  | Sichtbarer Name                     | Ebene             | Bedeutung                                                                                           |
  | ----------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------- |
  | `openai`                            | Anbieterpräfix    | Direkte API-Route zur OpenAI Platform.                                                              |
  | `openai-codex`                      | Anbieterpräfix    | OpenAI-Codex-OAuth-/Abonnement-Route über die normale OpenClaw-PI-Laufzeit.                        |
  | `codex` Plugin                      | Plugin            | Gebündeltes OpenClaw-Plugin, das die native Codex-App-Server-Laufzeit und Chat-Steuerungen `/codex` bereitstellt. |
  | `agentRuntime.id: codex`            | Agent-Laufzeit    | Erzwingt das native Codex-App-Server-Harness für eingebettete Turns.                                |
  | `/codex ...`                        | Chat-Befehlssatz  | Bindet/steuert Codex-App-Server-Threads aus einer Unterhaltung heraus.                              |
  | `runtime: "acp", agentId: "codex"`  | ACP-Sitzungsroute | Expliziter Fallback-Pfad, der Codex über ACP/acpx ausführt.                                         |

  Das bedeutet, dass eine Konfiguration absichtlich sowohl `openai-codex/*` als auch das
  Plugin `codex` enthalten kann. Das ist gültig, wenn Sie Codex OAuth über PI verwenden und zugleich
  native Chat-Steuerungen `/codex` verfügbar haben möchten. `openclaw doctor` warnt vor dieser
  Kombination, damit Sie bestätigen können, dass sie beabsichtigt ist; die Konfiguration wird nicht umgeschrieben.

  <Note>
  GPT-5.5 ist sowohl über direkten Zugriff auf die OpenAI Platform per API-Schlüssel als auch über
  Abonnement-/OAuth-Routen verfügbar. Verwenden Sie `openai/gpt-5.5` für direkten Verkehr über `OPENAI_API_KEY`,
  `openai-codex/gpt-5.5` für Codex OAuth über PI oder
  `openai/gpt-5.5` mit `agentRuntime.id: "codex"` für das native Codex-
  App-Server-Harness.
  </Note>

  <Note>
  Das Aktivieren des OpenAI-Plugins oder das Auswählen eines Modells `openai-codex/*`
  aktiviert nicht das gebündelte Codex-App-Server-Plugin. OpenClaw aktiviert dieses Plugin nur,
  wenn Sie das native Codex-Harness explizit mit
  `agentRuntime.id: "codex"` auswählen oder eine Legacy-Modellreferenz `codex/*` verwenden.
  Wenn das gebündelte Plugin `codex` aktiviert ist, `openai-codex/*` aber weiterhin
  über PI aufgelöst wird, warnt `openclaw doctor` und lässt die Route unverändert.
  </Note>

  ## OpenClaw-Feature-Abdeckung

  | OpenAI-Fähigkeit          | OpenClaw-Oberfläche                                      | Status                                                 |
  | ------------------------- | -------------------------------------------------------- | ------------------------------------------------------ |
  | Chat / Responses          | Modellanbieter `openai/<model>`                          | Ja                                                     |
  | Codex-Abonnementmodelle   | `openai-codex/<model>` mit `openai-codex` OAuth          | Ja                                                     |
  | Codex-App-Server-Harness  | `openai/<model>` mit `agentRuntime.id: codex`            | Ja                                                     |
  | Serverseitige Websuche    | Natives OpenAI-Responses-Tool                            | Ja, wenn Websuche aktiviert ist und kein Anbieter angeheftet ist |
  | Bilder                    | `image_generate`                                         | Ja                                                     |
  | Videos                    | `video_generate`                                         | Ja                                                     |
  | Text-to-Speech            | `messages.tts.provider: "openai"` / `tts`                | Ja                                                     |
  | Batch-Speech-to-Text      | `tools.media.audio` / Medienverständnis                  | Ja                                                     |
  | Streaming-Speech-to-Text  | Voice Call `streaming.provider: "openai"`                | Ja                                                     |
  | Realtime Voice            | Voice Call `realtime.provider: "openai"` / Control UI Talk | Ja                                                   |
  | Embeddings                | Memory-Einbettungsanbieter                               | Ja                                                     |

  ## Erste Schritte

  Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungsschritten.

  <Tabs>
  <Tab title="API-Schlüssel (OpenAI Platform)">
    **Am besten geeignet für:** direkten API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="Ihren API-Schlüssel beschaffen">
        Erstellen oder kopieren Sie einen API-Schlüssel aus dem [OpenAI-Platform-Dashboard](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Oder den Schlüssel direkt übergeben:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Routenübersicht

    | Modellreferenz         | Laufzeitkonfiguration               | Route                      | Authentifizierung |
    | ---------------------- | ---------------------------------- | -------------------------- | ----------------- |
    | `openai/gpt-5.5`       | weggelassen / `agentRuntime.id: "pi"`   | Direkte OpenAI-Platform-API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | weggelassen / `agentRuntime.id: "pi"`   | Direkte OpenAI-Platform-API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`              | Codex-App-Server-Harness   | Codex-App-Server |

    <Note>
    `openai/*` ist die direkte OpenAI-API-Schlüssel-Route, sofern Sie nicht explizit
    das Codex-App-Server-Harness erzwingen. Verwenden Sie `openai-codex/*` für Codex OAuth über
    die Standard-PI-Laufzeit oder `openai/gpt-5.5` mit
    `agentRuntime.id: "codex"` für die native Ausführung über den Codex-App-Server.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw stellt **nicht** `openai/gpt-5.3-codex-spark` bereit. Live-Anfragen an die OpenAI-API lehnen dieses Modell ab, und auch der aktuelle Codex-Katalog bietet es nicht an.
    </Warning>

  </Tab>

  <Tab title="Codex-Abonnement">
    **Am besten geeignet für:** die Nutzung Ihres ChatGPT-/Codex-Abonnements statt eines separaten API-Schlüssels. Codex Cloud erfordert eine ChatGPT-Anmeldung.

    <Steps>
      <Step title="Codex OAuth ausführen">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oder OAuth direkt ausführen:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Fügen Sie für headless oder callback-unfreundliche Setups `--device-code` hinzu, um sich mit einem ChatGPT-Device-Code-Flow statt über den Browser-Callback auf localhost anzumelden:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Das Standardmodell festlegen">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Routenübersicht

    | Modellreferenz | Laufzeitkonfiguration | Route | Authentifizierung |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | weggelassen / `runtime: "pi"` | ChatGPT-/Codex-OAuth über PI | Codex-Anmeldung |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Weiterhin PI, sofern nicht ein Plugin explizit `openai-codex` beansprucht | Codex-Anmeldung |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Codex-App-Server-Harness | Codex-App-Server-Auth |

    <Note>
    Verwenden Sie weiterhin die Anbieter-ID `openai-codex` für Authentifizierungs-/Profilbefehle. Das
    Modellpräfix `openai-codex/*` ist auch die explizite PI-Route für Codex OAuth.
    Es wählt weder das gebündelte Codex-App-Server-Harness aus noch aktiviert es dieses automatisch.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Das Onboarding importiert OAuth-Material nicht mehr aus `~/.codex`. Melden Sie sich mit Browser-OAuth (Standard) oder mit dem obigen Device-Code-Flow an — OpenClaw verwaltet die entstehenden Zugangsdaten in seinem eigenen Auth-Speicher für Agenten.
    </Note>

    ### Statusanzeige

    Chat-`/status` zeigt an, welche Modell-Laufzeit für die aktuelle Sitzung aktiv ist.
    Das standardmäßige PI-Harness erscheint als `Runtime: OpenClaw Pi Default`. Wenn das
    gebündelte Codex-App-Server-Harness ausgewählt ist, zeigt `/status`
    `Runtime: OpenAI Codex` an. Vorhandene Sitzungen behalten ihre aufgezeichnete Harness-ID, verwenden Sie also
    `/new` oder `/reset` nach dem Ändern von `agentRuntime`, wenn `/status`
    eine neue PI-/Codex-Auswahl widerspiegeln soll.

    ### Doctor-Warnung

    Wenn das gebündelte Plugin `codex` aktiviert ist, während die Route `openai-codex/*`
    aus diesem Tab ausgewählt ist, warnt `openclaw doctor`, dass das Modell
    weiterhin über PI aufgelöst wird. Lassen Sie die Konfiguration unverändert, wenn dies die
    beabsichtigte Route für die Authentifizierung per Abonnement ist. Wechseln Sie nur zu `openai/<model>` plus
    `agentRuntime.id: "codex"`, wenn Sie die native Ausführung über den Codex-
    App-Server möchten.

    ### Limit des Kontextfensters

    OpenClaw behandelt Modellmetadaten und die Laufzeitobergrenze für den Kontext als getrennte Werte.

    Für `openai-codex/gpt-5.5` über Codex OAuth:

    - Natives `contextWindow`: `1000000`
    - Standardmäßige Laufzeitobergrenze `contextTokens`: `272000`

    Die kleinere Standardobergrenze hat in der Praxis bessere Latenz- und Qualitätsmerkmale. Überschreiben Sie sie mit `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Verwenden Sie `contextWindow`, um native Modellmetadaten zu deklarieren. Verwenden Sie `contextTokens`, um das Laufzeit-Kontextbudget zu begrenzen.
    </Note>

    ### Katalogwiederherstellung

    OpenClaw verwendet Upstream-Codex-Katalogmetadaten für `gpt-5.5`, wenn sie
    vorhanden sind. Wenn die Live-Codex-Erkennung die Zeile `openai-codex/gpt-5.5` auslässt, während
    das Konto authentifiziert ist, synthetisiert OpenClaw diese OAuth-Modellzeile, damit
    Cron-, Unteragenten- und konfigurierte Standardmodell-Ausführungen nicht mit
    `Unknown model` fehlschlagen.

  </Tab>
</Tabs>

## Bildgenerierung

Das gebündelte Plugin `openai` registriert die Bildgenerierung über das Tool `image_generate`.
Es unterstützt sowohl die Bildgenerierung per OpenAI-API-Schlüssel als auch die Bild-
generierung per Codex OAuth über dieselbe Modellreferenz `openai/gpt-image-2`.

| Fähigkeit                | OpenAI-API-Schlüssel                | Codex OAuth                          |
| ------------------------ | ----------------------------------- | ------------------------------------ |
| Modellreferenz           | `openai/gpt-image-2`                | `openai/gpt-image-2`                 |
| Authentifizierung        | `OPENAI_API_KEY`                    | OpenAI-Codex-OAuth-Anmeldung         |
| Transport                | OpenAI Images API                   | Codex-Responses-Backend              |
| Maximale Bilder pro Anfrage | 4                                | 4                                    |
| Bearbeitungsmodus        | Aktiviert (bis zu 5 Referenzbilder) | Aktiviert (bis zu 5 Referenzbilder)  |
| Größen-Overrides         | Unterstützt, einschließlich 2K-/4K-Größen | Unterstützt, einschließlich 2K-/4K-Größen |
| Seitenverhältnis / Auflösung | Nicht an die OpenAI Images API weitergegeben | Wird bei Sicherheit auf eine unterstützte Größe abgebildet |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Siehe [Bildgenerierung](/de/tools/image-generation) für gemeinsame Tool-Parameter, Anbieterauswahl und Failover-Verhalten.
</Note>

`gpt-image-2` ist der Standard sowohl für die OpenAI-Text-zu-Bild-Generierung als auch für die Bild-
bearbeitung. `gpt-image-1.5`, `gpt-image-1` und `gpt-image-1-mini` bleiben als
explizite Modell-Overrides nutzbar. Verwenden Sie `openai/gpt-image-1.5` für PNG-/WebP-Ausgabe
mit transparentem Hintergrund; die aktuelle `gpt-image-2`-API lehnt
`background: "transparent"` ab.

Für eine Anfrage mit transparentem Hintergrund sollten Agenten `image_generate` mit
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` oder `"webp"` und
`background: "transparent"` aufrufen; die ältere anbieterspezifische Option `openai.background` wird
weiterhin akzeptiert. OpenClaw schützt außerdem die öffentlichen OpenAI- und
OpenAI-Codex-OAuth-Routen, indem standardmäßige transparente Anfragen an `openai/gpt-image-2`
auf `gpt-image-1.5` umgeschrieben werden; Azure- und benutzerdefinierte OpenAI-kompatible Endpunkte behalten
ihre konfigurierten Bereitstellungs-/Modellnamen.

Dieselbe Einstellung ist auch für Headless-CLI-Ausführungen verfügbar:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Verwenden Sie dieselben Flags `--output-format` und `--background` mit
`openclaw infer image edit`, wenn Sie von einer Eingabedatei ausgehen.
`--openai-background` bleibt als OpenAI-spezifischer Alias verfügbar.

Behalten Sie für Installationen mit Codex OAuth dieselbe Referenz `openai/gpt-image-2` bei. Wenn ein
OAuth-Profil `openai-codex` konfiguriert ist, löst OpenClaw das gespeicherte OAuth-
Zugriffstoken auf und sendet Bildanfragen über das Codex-Responses-Backend. Es
versucht dafür nicht zuerst `OPENAI_API_KEY` und fällt für diese
Anfrage auch nicht stillschweigend auf einen API-Schlüssel zurück. Konfigurieren Sie `models.providers.openai` explizit mit einem API-Schlüssel,
einer benutzerdefinierten Basis-URL oder einem Azure-Endpunkt, wenn Sie stattdessen die direkte
Route über die OpenAI Images API möchten.
Wenn sich dieser benutzerdefinierte Bildendpunkt in einem vertrauenswürdigen LAN/unter einer privaten Adresse befindet, setzen Sie zusätzlich
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw blockiert
private/interne OpenAI-kompatible Bildendpunkte weiterhin, sofern dieses Opt-in nicht
vorhanden ist.

Generieren:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Ein transparentes PNG generieren:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Bearbeiten:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Videogenerierung

Das gebündelte Plugin `openai` registriert die Videogenerierung über das Tool `video_generate`.

| Fähigkeit       | Wert                                                                              |
| --------------- | --------------------------------------------------------------------------------- |
| Standardmodell  | `openai/sora-2`                                                                   |
| Modi            | Text-zu-Video, Bild-zu-Video, Bearbeitung eines einzelnen Videos                  |
| Referenzeingaben | 1 Bild oder 1 Video                                                              |
| Größen-Overrides | Unterstützt                                                                      |
| Andere Overrides | `aspectRatio`, `resolution`, `audio`, `watermark` werden mit einer Tool-Warnung ignoriert |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Siehe [Videogenerierung](/de/tools/video-generation) für gemeinsame Tool-Parameter, Anbieterauswahl und Failover-Verhalten.
</Note>

## GPT-5-Prompt-Beitrag

OpenClaw fügt für Ausführungen der GPT-5-Familie über Anbieter hinweg einen gemeinsamen GPT-5-Prompt-Beitrag hinzu. Er wird nach Modell-ID angewendet, sodass `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` und andere kompatible GPT-5-Referenzen dasselbe Overlay erhalten. Ältere GPT-4.x-Modelle tun das nicht.

Das gebündelte native Codex-Harness verwendet dasselbe GPT-5-Verhalten und dasselbe Heartbeat-Overlay über Entwickleranweisungen des Codex-App-Servers, sodass Sitzungen `openai/gpt-5.x`, die über `agentRuntime.id: "codex"` erzwungen werden, dieselbe Anleitung für konsequente Weiterverfolgung und proaktiven Heartbeat behalten, auch wenn Codex den Rest des Harness-Prompts verwaltet.

Der GPT-5-Beitrag fügt einen getaggten Verhaltensvertrag für Persona-Persistenz, Ausführungssicherheit, Tool-Disziplin, Ausgabeform, Abschlussprüfungen und Verifizierung hinzu. Kanalspezifisches Antwort- und Verhalten bei stillen Nachrichten bleibt im gemeinsamen OpenClaw-Systemprompt und in der Richtlinie für ausgehende Auslieferung. Die GPT-5-Anleitung ist für passende Modelle immer aktiviert. Die Ebene für den freundlichen Interaktionsstil ist davon getrennt und konfigurierbar.

| Wert                   | Effekt                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (Standard) | Aktiviert die Ebene für den freundlichen Interaktionsstil |
| `"on"`                 | Alias für `"friendly"`                      |
| `"off"`                | Deaktiviert nur die Ebene für den freundlichen Stil |

<Tabs>
  <Tab title="Konfiguration">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Werte werden zur Laufzeit ohne Beachtung der Groß-/Kleinschreibung behandelt, sodass sowohl `"Off"` als auch `"off"` die Ebene für den freundlichen Stil deaktivieren.
</Tip>

<Note>
Das Legacy-Feld `plugins.entries.openai.config.personality` wird weiterhin als Kompatibilitäts-Fallback gelesen, wenn die gemeinsame Einstellung `agents.defaults.promptOverlays.gpt5.personality` nicht gesetzt ist.
</Note>

## Stimme und Sprache

<AccordionGroup>
  <Accordion title="Sprachsynthese (TTS)">
    Das gebündelte Plugin `openai` registriert Sprachsynthese für die Oberfläche `messages.tts`.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Stimme | `messages.tts.providers.openai.voice` | `coral` |
    | Geschwindigkeit | `messages.tts.providers.openai.speed` | (nicht gesetzt) |
    | Anweisungen | `messages.tts.providers.openai.instructions` | (nicht gesetzt, nur `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` für Sprachnachrichten, `mp3` für Dateien |
    | API-Schlüssel | `messages.tts.providers.openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |
    | Basis-URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Verfügbare Modelle: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Verfügbare Stimmen: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Setzen Sie `OPENAI_TTS_BASE_URL`, um die TTS-Basis-URL zu überschreiben, ohne den Chat-API-Endpunkt zu beeinflussen.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-Text">
    Das gebündelte Plugin `openai` registriert Batch-Speech-to-Text über
    die Transkriptionsoberfläche für Medienverständnis von OpenClaw.

    - Standardmodell: `gpt-4o-transcribe`
    - Endpunkt: OpenAI-REST `/v1/audio/transcriptions`
    - Eingabepfad: Multipart-Upload einer Audiodatei
    - In OpenClaw überall unterstützt, wo eingehende Audiotranskription
      `tools.media.audio` verwendet, einschließlich Discord-Sprachkanalsegmenten und
      Audioanhängen in Kanälen

    Um OpenAI für die Transkription eingehender Audiodaten zu erzwingen:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Sprach- und Prompt-Hinweise werden an OpenAI weitergegeben, wenn sie von der
    gemeinsamen Audio-Medienkonfiguration oder einer Transkriptionsanforderung pro Aufruf bereitgestellt werden.

  </Accordion>

  <Accordion title="Realtime-Transkription">
    Das gebündelte Plugin `openai` registriert Realtime-Transkription für das Voice-Call-Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Sprache | `...openai.language` | (nicht gesetzt) |
    | Prompt | `...openai.prompt` | (nicht gesetzt) |
    | Stille-Dauer | `...openai.silenceDurationMs` | `800` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | API-Schlüssel | `...openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |

    <Note>
    Verwendet eine WebSocket-Verbindung zu `wss://api.openai.com/v1/realtime` mit G.711 u-law (`g711_ulaw` / `audio/pcmu`) Audio. Dieser Streaming-Anbieter ist für den Realtime-Transkriptionspfad von Voice Call gedacht; Discord Voice zeichnet derzeit stattdessen kurze Segmente auf und verwendet den Batch-Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime Voice">
    Das gebündelte Plugin `openai` registriert Realtime Voice für das Voice-Call-Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Stimme | `...openai.voice` | `alloy` |
    | Temperatur | `...openai.temperature` | `0.8` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | Stille-Dauer | `...openai.silenceDurationMs` | `500` |
    | API-Schlüssel | `...openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |

    <Note>
    Unterstützt Azure OpenAI über die Konfigurationsschlüssel `azureEndpoint` und `azureDeployment`. Unterstützt bidirektionales Tool-Calling. Verwendet das Audioformat G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure-OpenAI-Endpunkte

Der gebündelte Anbieter `openai` kann für die Bildgenerierung eine Azure-OpenAI-Ressource ansprechen, indem die Basis-URL überschrieben wird. Auf dem Pfad für die Bildgenerierung erkennt OpenClaw
Azure-Hostnamen in `models.providers.openai.baseUrl` und wechselt dann automatisch zur Request-Form von
Azure.

<Note>
Realtime Voice verwendet einen separaten Konfigurationspfad
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
und wird nicht von `models.providers.openai.baseUrl` beeinflusst. Siehe das Akkordeon **Realtime
Voice** unter [Stimme und Sprache](#voice-and-speech) für dessen Azure-
Einstellungen.
</Note>

Verwenden Sie Azure OpenAI, wenn:

- Sie bereits ein Azure-OpenAI-Abonnement, Kontingent oder Enterprise Agreement haben
- Sie regionale Datenresidenz oder Compliance-Kontrollen benötigen, die Azure bereitstellt
- Sie den Datenverkehr innerhalb eines bestehenden Azure-Tenants halten möchten

### Konfiguration

Für Azure-Bildgenerierung über den gebündelten Anbieter `openai` richten Sie
`models.providers.openai.baseUrl` auf Ihre Azure-Ressource und setzen `apiKey` auf
den Azure-OpenAI-Schlüssel (nicht auf einen OpenAI-Platform-Schlüssel):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw erkennt diese Azure-Host-Suffixe für die Azure-Route zur Bildgenerierung:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Für Bildgenerierungsanfragen an einen erkannten Azure-Host führt OpenClaw Folgendes aus:

- Sendet den Header `api-key` statt `Authorization: Bearer`
- Verwendet deploymentbezogene Pfade (`/openai/deployments/{deployment}/...`)
- Hängt an jede Anfrage `?api-version=...` an
- Verwendet einen Standard-Request-Timeout von 600 Sekunden für Azure-Bildgenerierungsaufrufe.
  Werte von `timeoutMs` pro Aufruf überschreiben diesen Standard weiterhin.

Andere Basis-URLs (öffentliches OpenAI, OpenAI-kompatible Proxys) behalten die Standard-
Request-Form für OpenAI-Bilder bei.

<Note>
Azure-Routing für den Bildgenerierungspfad des Anbieters `openai` erfordert
OpenClaw 2026.4.22 oder neuer. Frühere Versionen behandeln jede benutzerdefinierte
`openai.baseUrl` wie den öffentlichen OpenAI-Endpunkt und schlagen bei Azure-
Bild-Deployments fehl.
</Note>

### API-Version

Setzen Sie `AZURE_OPENAI_API_VERSION`, um für den Azure-Pfad zur Bildgenerierung eine bestimmte Azure-Preview- oder GA-Version
festzulegen:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Standardmäßig wird `2024-12-01-preview` verwendet, wenn die Variable nicht gesetzt ist.

### Modellnamen sind Deployment-Namen

Azure OpenAI bindet Modelle an Deployments. Für Azure-Bildgenerierungsanfragen,
die über den gebündelten Anbieter `openai` geroutet werden, muss das Feld `model` in OpenClaw
der **Azure-Deployment-Name** sein, den Sie im Azure-Portal konfiguriert haben, nicht
die öffentliche OpenAI-Modell-ID.

Wenn Sie ein Deployment mit dem Namen `gpt-image-2-prod` erstellen, das `gpt-image-2` bereitstellt:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Dieselbe Regel für Deployment-Namen gilt für Bildgenerierungsaufrufe, die über
den gebündelten Anbieter `openai` geroutet werden.

### Regionale Verfügbarkeit

Azure-Bildgenerierung ist derzeit nur in einer Teilmenge von Regionen verfügbar
(zum Beispiel `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Prüfen Sie die aktuelle Regionenliste von Microsoft, bevor Sie ein
Deployment erstellen, und bestätigen Sie, dass das jeweilige Modell in Ihrer Region angeboten wird.

### Parameterunterschiede

Azure OpenAI und öffentliches OpenAI akzeptieren nicht immer dieselben Bildparameter.
Azure kann Optionen ablehnen, die öffentliches OpenAI erlaubt (zum Beispiel bestimmte
Werte von `background` bei `gpt-image-2`) oder sie nur für bestimmte Modell-
versionen bereitstellen. Diese Unterschiede stammen von Azure und dem zugrunde liegenden Modell, nicht von
OpenClaw. Wenn eine Azure-Anfrage mit einem Validierungsfehler fehlschlägt, prüfen Sie die
für Ihr konkretes Deployment und Ihre API-Version unterstützten Parameter im
Azure-Portal.

<Note>
Azure OpenAI verwendet natives Transport- und Kompatibilitätsverhalten, erhält aber nicht
die versteckten Attributions-Header von OpenClaw — siehe das Akkordeon **Nativ vs. OpenAI-kompatible
Routen** unter [Erweiterte Konfiguration](#advanced-configuration).

Für Chat- oder Responses-Datenverkehr auf Azure (über die Bildgenerierung hinaus) verwenden Sie den
Onboarding-Flow oder eine dedizierte Azure-Anbieterkonfiguration — `openai.baseUrl` allein
übernimmt nicht die Azure-API-/Authentifizierungsform. Es gibt einen separaten
Anbieter `azure-openai-responses/*`; siehe
das untenstehende Akkordeon zu serverseitiger Compaction.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs. SSE)">
    OpenClaw verwendet WebSocket-first mit SSE-Fallback (`"auto"`) sowohl für `openai/*` als auch für `openai-codex/*`.

    Im Modus `"auto"` führt OpenClaw Folgendes aus:
    - Wiederholt einen frühen WebSocket-Fehler einmal, bevor auf SSE zurückgefallen wird
    - Markiert WebSocket nach einem Fehler für etwa 60 Sekunden als degradiert und verwendet während der Abkühlphase SSE
    - Hängt stabile Header für Sitzungs- und Turn-Identität für Wiederholungen und Reconnects an
    - Normalisiert Nutzungszähler (`input_tokens` / `prompt_tokens`) über Transportvarianten hinweg

    | Wert | Verhalten |
    |-------|----------|
    | `"auto"` (Standard) | Erst WebSocket, dann SSE-Fallback |
    | `"sse"` | Nur SSE erzwingen |
    | `"websocket"` | Nur WebSocket erzwingen |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Zugehörige OpenAI-Dokumentation:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket-Warm-up">
    OpenClaw aktiviert standardmäßig WebSocket-Warm-up für `openai/*` und `openai-codex/*`, um die Latenz des ersten Turns zu reduzieren.

    ```json5
    // Warm-up deaktivieren
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Fast-Modus">
    OpenClaw stellt einen gemeinsamen Fast-Modus-Schalter für `openai/*` und `openai-codex/*` bereit:

    - **Chat/UI:** `/fast status|on|off`
    - **Konfiguration:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Wenn aktiviert, ordnet OpenClaw den Fast-Modus dem priorisierten OpenAI-Processing zu (`service_tier = "priority"`). Vorhandene Werte von `service_tier` bleiben erhalten, und der Fast-Modus überschreibt weder `reasoning` noch `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Sitzungs-Overrides haben Vorrang vor der Konfiguration. Wenn der Sitzungs-Override in der Sessions-UI gelöscht wird, kehrt die Sitzung zum konfigurierten Standard zurück.
    </Note>

  </Accordion>

  <Accordion title="Priorisierte Verarbeitung (service_tier)">
    Die OpenAI-API stellt priorisierte Verarbeitung über `service_tier` bereit. Setzen Sie dies in OpenClaw pro Modell:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Unterstützte Werte: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` wird nur an native OpenAI-Endpunkte (`api.openai.com`) und native Codex-Endpunkte (`chatgpt.com/backend-api`) weitergegeben. Wenn Sie einen der beiden Anbieter über einen Proxy routen, lässt OpenClaw `service_tier` unverändert.
    </Warning>

  </Accordion>

  <Accordion title="Serverseitige Compaction (Responses API)">
    Für direkte OpenAI-Responses-Modelle (`openai/*` auf `api.openai.com`) aktiviert der Stream-Wrapper des Pi-Harness im OpenAI-Plugin serverseitige Compaction automatisch:

    - Erzwingt `store: true` (sofern die Modellkompatibilität nicht `supportsStore: false` setzt)
    - Injiziert `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Standard für `compact_threshold`: 70 % von `contextWindow` (oder `80000`, wenn nicht verfügbar)

    Dies gilt für den Pfad des integrierten Pi-Harness und für OpenAI-Anbieter-Hooks, die von eingebetteten Ausführungen verwendet werden. Das native Codex-App-Server-Harness verwaltet seinen Kontext selbst über Codex und wird separat mit `agents.defaults.agentRuntime.id` konfiguriert.

    <Tabs>
      <Tab title="Explizit aktivieren">
        Nützlich für kompatible Endpunkte wie Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Benutzerdefinierter Schwellenwert">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Deaktivieren">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` steuert nur die Injektion von `context_management`. Direkte OpenAI-Responses-Modelle erzwingen weiterhin `store: true`, sofern die Kompatibilität nicht `supportsStore: false` setzt.
    </Note>

  </Accordion>

  <Accordion title="Strenger agentischer GPT-Modus">
    Für Ausführungen der GPT-5-Familie auf `openai/*` kann OpenClaw einen strengeren eingebetteten Ausführungsvertrag verwenden:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Mit `strict-agentic` gilt in OpenClaw:
    - Ein Turn, der nur einen Plan enthält, wird nicht mehr als erfolgreicher Fortschritt behandelt, wenn eine Tool-Aktion verfügbar ist
    - Der Turn wird mit einer Handlungsaufforderung zum sofortigen Ausführen erneut versucht
    - `update_plan` wird für umfangreiche Arbeit automatisch aktiviert
    - Ein expliziter blockierter Status wird angezeigt, wenn das Modell weiter plant, ohne zu handeln

    <Note>
    Nur auf OpenAI- und Codex-Ausführungen der GPT-5-Familie begrenzt. Andere Anbieter und ältere Modellfamilien behalten das Standardverhalten.
    </Note>

  </Accordion>

  <Accordion title="Nativ vs. OpenAI-kompatible Routen">
    OpenClaw behandelt direkte OpenAI-, Codex- und Azure-OpenAI-Endpunkte anders als generische OpenAI-kompatible `/v1`-Proxys:

    **Native Routen** (`openai/*`, Azure OpenAI):
    - Behalten `reasoning: { effort: "none" }` nur für Modelle bei, die den OpenAI-Wert `none` für `effort` unterstützen
    - Lassen deaktiviertes Reasoning bei Modellen oder Proxys weg, die `reasoning.effort: "none"` ablehnen
    - Setzen Tool-Schemata standardmäßig auf den strikten Modus
    - Hängen versteckte Attributions-Header nur auf verifizierten nativen Hosts an
    - Behalten OpenAI-spezifische Request-Formung (`service_tier`, `store`, Reasoning-Kompatibilität, Prompt-Cache-Hinweise) bei

    **Proxy-/kompatible Routen:**
    - Verwenden lockereres Kompatibilitätsverhalten
    - Entfernen `store` aus Completions-Payloads `openai-completions`, die nicht nativ sind
    - Akzeptieren erweitertes Pass-through-JSON `params.extra_body`/`params.extraBody` für OpenAI-kompatible Completions-Proxys
    - Akzeptieren `params.chat_template_kwargs` für OpenAI-kompatible Completions-Proxys wie vLLM
    - Erzwingen weder strikte Tool-Schemata noch native-only-Header

    Azure OpenAI verwendet natives Transport- und Kompatibilitätsverhalten, erhält aber nicht die versteckten Attributions-Header.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Anbietern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter des Bild-Tools und Anbieterauswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Video-Tools und Anbieterauswahl.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Details zur Authentifizierung und Regeln zur Wiederverwendung von Zugangsdaten.
  </Card>
</CardGroup>
