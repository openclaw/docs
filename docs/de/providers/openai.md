---
read_when:
    - Sie möchten OpenAI-Modelle in OpenClaw verwenden
    - Sie möchten die Codex-Abonnementauthentifizierung anstelle von API-Schlüsseln verwenden
    - Sie benötigen ein strengeres Ausführungsverhalten für GPT-5-Agenten
summary: OpenAI über API-Schlüssel oder ein Codex-Abonnement in OpenClaw verwenden
title: OpenAI
x-i18n:
    generated_at: "2026-05-02T21:01:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0caf43895c1bc8494b1a0d4aeef98e575bb31aca047430a63156875bed3bb112
    source_path: providers/openai.md
    workflow: 16
---

OpenAI stellt Entwickler-APIs für GPT-Modelle bereit, und Codex ist über die Codex-Clients von OpenAI auch als Coding-Agent für ChatGPT-Pläne verfügbar. OpenClaw hält diese Oberflächen getrennt, damit die Konfiguration vorhersehbar bleibt.

OpenClaw unterstützt drei Routen aus der OpenAI-Familie. Die meisten ChatGPT-/Codex-Abonnenten, die Codex-Verhalten wünschen, sollten die native Codex-App-Server-Laufzeit verwenden. Das Modellpräfix wählt den Provider-/Modellnamen aus; eine separate Laufzeiteinstellung wählt aus, wer die eingebettete Agent-Schleife ausführt:

- **API-Schlüssel** - direkter OpenAI Platform-Zugriff mit nutzungsbasierter Abrechnung (`openai/*`-Modelle)
- **Codex-Abonnement mit nativer Codex-Laufzeit** - ChatGPT-/Codex-Anmeldung plus Codex-App-Server-Ausführung (`openai/*`-Modelle plus `agents.defaults.agentRuntime.id: "codex"`)
- **Codex-Abonnement über PI** - ChatGPT-/Codex-Anmeldung mit dem normalen OpenClaw-PI-Runner (`openai-codex/*`-Modelle)

OpenAI unterstützt ausdrücklich die Nutzung von Abonnement-OAuth in externen Tools und Workflows wie OpenClaw.

Provider, Modell, Laufzeit und Kanal sind separate Ebenen. Wenn diese Bezeichnungen vermischt werden, lesen Sie [Agent-Laufzeiten](/de/concepts/agent-runtimes), bevor Sie die Konfiguration ändern.

## Schnellauswahl

| Ziel                                                 | Verwenden                                        | Hinweise                                                                  |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| ChatGPT-/Codex-Abonnement mit nativer Codex-Laufzeit | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | Empfohlene Codex-Einrichtung für die meisten Benutzer. Melden Sie sich mit `openai-codex`-Auth an. |
| Direkte API-Schlüssel-Abrechnung                     | `openai/gpt-5.5`                                 | Setzen Sie `OPENAI_API_KEY` oder führen Sie das Onboarding für OpenAI-API-Schlüssel aus. |
| ChatGPT-/Codex-Abonnement-Auth über PI               | `openai-codex/gpt-5.5`                           | Nur verwenden, wenn Sie ausdrücklich den normalen PI-Runner möchten.      |
| Bilderzeugung oder -bearbeitung                      | `openai/gpt-image-2`                             | Funktioniert mit `OPENAI_API_KEY` oder OpenAI Codex OAuth.                |
| Bilder mit transparentem Hintergrund                 | `openai/gpt-image-1.5`                           | Verwenden Sie `outputFormat=png` oder `webp` und `openai.background=transparent`. |

## Namensübersicht

Die Namen sind ähnlich, aber nicht austauschbar:

| Angezeigter Name                    | Ebene             | Bedeutung                                                                                         |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Provider-Präfix   | Direkte OpenAI Platform-API-Route.                                                                |
| `openai-codex`                     | Provider-Präfix   | OpenAI Codex OAuth-/Abonnement-Route über den normalen OpenClaw-PI-Runner.                        |
| `codex` plugin                     | Plugin            | Gebündeltes OpenClaw-Plugin, das die native Codex-App-Server-Laufzeit und `/codex`-Chatsteuerungen bereitstellt. |
| `agentRuntime.id: codex`           | Agent-Laufzeit    | Erzwingt den nativen Codex-App-Server-Harness für eingebettete Turns.                             |
| `/codex ...`                       | Chat-Befehlssatz  | Bindet/steuert Codex-App-Server-Threads aus einer Unterhaltung.                                   |
| `runtime: "acp", agentId: "codex"` | ACP-Sitzungsroute | Expliziter Fallback-Pfad, der Codex über ACP/acpx ausführt.                                       |

Das bedeutet, dass eine Konfiguration absichtlich sowohl `openai-codex/*` als auch das `codex`-Plugin enthalten kann. Das ist gültig, wenn Sie Codex OAuth über PI verwenden und außerdem native `/codex`-Chatsteuerungen verfügbar haben möchten. `openclaw doctor` warnt vor dieser Kombination, damit Sie bestätigen können, dass sie beabsichtigt ist; es schreibt sie nicht um.

<Note>
GPT-5.5 ist sowohl über direkten OpenAI Platform-API-Schlüssel-Zugriff als auch über Abonnement-/OAuth-Routen verfügbar. Für ein ChatGPT-/Codex-Abonnement plus native Codex-Ausführung verwenden Sie `openai/gpt-5.5` mit `agentRuntime.id: "codex"`. Verwenden Sie `openai-codex/gpt-5.5` nur für Codex OAuth über PI oder `openai/gpt-5.5` ohne Codex-Laufzeit-Override für direkten `OPENAI_API_KEY`-Traffic.
</Note>

<Note>
Das Aktivieren des OpenAI-Plugins oder die Auswahl eines `openai-codex/*`-Modells aktiviert nicht das gebündelte Codex-App-Server-Plugin. OpenClaw aktiviert dieses Plugin nur, wenn Sie den nativen Codex-Harness explizit mit `agentRuntime.id: "codex"` auswählen oder eine Legacy-Modellreferenz `codex/*` verwenden.
Wenn das gebündelte `codex`-Plugin aktiviert ist, `openai-codex/*` aber weiterhin über PI aufgelöst wird, warnt `openclaw doctor` und lässt die Route unverändert.
</Note>

## OpenClaw-Funktionsabdeckung

| OpenAI-Fähigkeit          | OpenClaw-Oberfläche                                      | Status                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | Modell-Provider `openai/<model>`                          | Ja                                                     |
| Codex-Abonnementmodelle   | `openai-codex/<model>` mit `openai-codex` OAuth           | Ja                                                     |
| Codex-App-Server-Harness  | `openai/<model>` mit `agentRuntime.id: codex`             | Ja                                                     |
| Serverseitige Websuche    | Natives OpenAI Responses-Tool                             | Ja, wenn die Websuche aktiviert ist und kein Provider festgelegt wurde |
| Bilder                    | `image_generate`                                           | Ja                                                     |
| Videos                    | `video_generate`                                           | Ja                                                     |
| Text-zu-Sprache           | `messages.tts.provider: "openai"` / `tts`                  | Ja                                                     |
| Batch-Spracherkennung     | `tools.media.audio` / Medienverständnis                    | Ja                                                     |
| Streaming-Spracherkennung | Voice Call `streaming.provider: "openai"`                  | Ja                                                     |
| Echtzeitstimme            | Voice Call `realtime.provider: "openai"` / Control UI Talk | Ja                                                     |
| Embeddings                | Memory-Embedding-Provider                                  | Ja                                                     |

## Memory-Embeddings

OpenClaw kann OpenAI oder einen OpenAI-kompatiblen Embedding-Endpunkt für `memory_search`-Indizierung und Query-Embeddings verwenden:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

Für OpenAI-kompatible Endpunkte, die asymmetrische Embedding-Labels benötigen, setzen Sie `queryInputType` und `documentInputType` unter `memorySearch`. OpenClaw leitet diese als providerspezifische `input_type`-Anfragefelder weiter: Query-Embeddings verwenden `queryInputType`; indizierte Memory-Chunks und Batch-Indizierung verwenden `documentInputType`. Das vollständige Beispiel finden Sie in der [Memory-Konfigurationsreferenz](/de/reference/memory-config#provider-specific-config).

## Erste Schritte

Wählen Sie Ihre bevorzugte Auth-Methode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="API-Schlüssel (OpenAI Platform)">
    **Am besten für:** direkten API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen oder kopieren Sie einen API-Schlüssel aus dem [OpenAI Platform-Dashboard](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Oder übergeben Sie den Schlüssel direkt:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verifizieren, dass das Modell verfügbar ist">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Routenzusammenfassung

    | Modellreferenz        | Laufzeitkonfiguration      | Route                       | Auth             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omitted / `agentRuntime.id: "pi"`    | Direkte OpenAI Platform-API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omitted / `agentRuntime.id: "pi"`    | Direkte OpenAI Platform-API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Codex-App-Server-Harness    | Codex-App-Server |

    <Note>
    `openai/*` ist die direkte OpenAI-API-Schlüssel-Route, sofern Sie nicht ausdrücklich den Codex-App-Server-Harness erzwingen. Verwenden Sie `openai-codex/*` für Codex OAuth über den standardmäßigen PI-Runner oder `openai/gpt-5.5` mit `agentRuntime.id: "codex"` für native Codex-App-Server-Ausführung.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw stellt `openai/gpt-5.3-codex-spark` **nicht** bereit. Live-OpenAI-API-Anfragen lehnen dieses Modell ab, und der aktuelle Codex-Katalog stellt es ebenfalls nicht bereit.
    </Warning>

  </Tab>

  <Tab title="Codex-Abonnement">
    **Am besten für:** die Nutzung Ihres ChatGPT-/Codex-Abonnements mit nativer Codex-App-Server-Ausführung anstelle eines separaten API-Schlüssels. Codex Cloud erfordert eine ChatGPT-Anmeldung.

    <Steps>
      <Step title="Codex OAuth ausführen">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oder führen Sie OAuth direkt aus:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Für Headless- oder Callback-feindliche Setups fügen Sie `--device-code` hinzu, um sich mit einem ChatGPT-Gerätecode-Flow anstelle des localhost-Browser-Callbacks anzumelden:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Native Codex-Laufzeit verwenden">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex","fallback":"none"}' --strict-json
        ```
      </Step>
      <Step title="Verifizieren, dass Codex-Auth verfügbar ist">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Nachdem das Gateway läuft, senden Sie `/codex status` oder `/codex models`
        im Chat, um die native App-Server-Laufzeit zu verifizieren.
      </Step>
    </Steps>

    ### Routenzusammenfassung

    | Modellreferenz | Laufzeitkonfiguration | Route | Auth |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Nativer Codex-App-Server-Harness | Codex-Anmeldung oder ausgewähltes `openai-codex`-Profil |
    | `openai-codex/gpt-5.5` | omitted / `runtime: "pi"` | ChatGPT/Codex OAuth über PI | Codex-Anmeldung |
    | `openai-codex/gpt-5.4-mini` | omitted / `runtime: "pi"` | ChatGPT/Codex OAuth über PI | Codex-Anmeldung |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Weiterhin PI, sofern nicht ein Plugin ausdrücklich `openai-codex` beansprucht | Codex-Anmeldung |

    <Note>
    Verwenden Sie für Authentifizierungs-/Profilbefehle weiterhin die Provider-ID `openai-codex`. Das
    Modellpräfix `openai-codex/*` ist außerdem die explizite PI-Route für Codex OAuth.
    Es wählt den gebündelten Codex-App-Server-Harness nicht aus und aktiviert ihn nicht automatisch. Für
    die übliche Einrichtung mit Abonnement plus nativer Laufzeit melden Sie sich mit
    `openai-codex` an, behalten aber die Modellreferenz `openai/gpt-5.5` bei und setzen
    `agentRuntime.id: "codex"`.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex", fallback: "none" },
        },
      },
    }
    ```

    Um Codex OAuth stattdessen auf dem normalen PI-Runner zu belassen, verwenden Sie
    `openai-codex/gpt-5.5` und lassen die Codex-Laufzeitüberschreibung weg.

    <Note>
    Das Onboarding importiert kein OAuth-Material mehr aus `~/.codex`. Melden Sie sich mit Browser-OAuth (Standard) oder dem oben beschriebenen Gerätecode-Ablauf an — OpenClaw verwaltet die daraus resultierenden Anmeldedaten in seinem eigenen Authentifizierungsspeicher für Agenten.
    </Note>

    ### Statusanzeige

    Chat `/status` zeigt an, welche Modelllaufzeit für die aktuelle Sitzung aktiv ist.
    Der Standard-PI-Harness erscheint als `Runtime: OpenClaw Pi Default`. Wenn der
    gebündelte Codex-App-Server-Harness ausgewählt ist, zeigt `/status`
    `Runtime: OpenAI Codex`. Bestehende Sitzungen behalten ihre aufgezeichnete Harness-ID; verwenden Sie daher
    `/new` oder `/reset`, nachdem Sie `agentRuntime` geändert haben, wenn `/status`
    eine neue PI-/Codex-Auswahl widerspiegeln soll.

    ### Doctor-Warnung

    Wenn das gebündelte `codex`-Plugin aktiviert ist, während eine `openai-codex/*`-Route
    ausgewählt ist, warnt `openclaw doctor`, dass das Modell weiterhin über PI aufgelöst wird.
    Lassen Sie die Konfiguration nur dann unverändert, wenn diese PI-Route mit Abonnementauthentifizierung
    beabsichtigt ist. Wechseln Sie zu `openai/<model>` plus `agentRuntime.id: "codex"`, wenn
    Sie eine native Codex-App-Server-Ausführung wünschen.

    ### Kontextfenster-Obergrenze

    OpenClaw behandelt Modellmetadaten und die Laufzeit-Kontextobergrenze als getrennte Werte.

    Für `openai-codex/gpt-5.5` über Codex OAuth:

    - Natives `contextWindow`: `1000000`
    - Standardmäßige Laufzeit-Obergrenze `contextTokens`: `272000`

    Die kleinere Standardobergrenze bietet in der Praxis bessere Latenz- und Qualitätseigenschaften. Überschreiben Sie sie mit `contextTokens`:

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
    das Konto authentifiziert ist, erzeugt OpenClaw diese OAuth-Modellzeile, damit
    Cron-, Sub-Agent- und konfigurierte Standardmodell-Ausführungen nicht mit
    `Unknown model` fehlschlagen.

  </Tab>
</Tabs>

## Native Codex-App-Server-Authentifizierung

Der native Codex-App-Server-Harness verwendet `openai/*`-Modellreferenzen plus
`agentRuntime.id: "codex"`, seine Authentifizierung ist jedoch weiterhin kontobasiert. OpenClaw
wählt die Authentifizierung in dieser Reihenfolge aus:

1. Ein explizites OpenClaw-Authentifizierungsprofil `openai-codex`, das an den Agenten gebunden ist.
2. Das bestehende Konto des App-Servers, etwa eine lokale Codex CLI-ChatGPT-Anmeldung.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn der App-Server kein Konto meldet und weiterhin
   OpenAI-Authentifizierung benötigt.

Das bedeutet, dass eine lokale ChatGPT-/Codex-Abonnementanmeldung nicht ersetzt wird, nur
weil der Gateway-Prozess auch `OPENAI_API_KEY` für direkte OpenAI-Modelle
oder Embeddings hat. Der Env-API-Schlüssel-Fallback ist nur der lokale stdio-Pfad ohne Konto; er
wird nicht an WebSocket-App-Server-Verbindungen gesendet. Wenn ein Codex-Profil
im Abonnementstil ausgewählt ist, hält OpenClaw außerdem `CODEX_API_KEY` und `OPENAI_API_KEY`
aus dem erzeugten stdio-App-Server-Kindprozess heraus und sendet die ausgewählten Anmeldedaten
über den App-Server-Login-RPC.

## Bildgenerierung

Das gebündelte `openai`-Plugin registriert Bildgenerierung über das Tool `image_generate`.
Es unterstützt sowohl OpenAI-Bildgenerierung mit API-Schlüssel als auch Codex OAuth-Bildgenerierung
über dieselbe Modellreferenz `openai/gpt-image-2`.

| Fähigkeit                 | OpenAI-API-Schlüssel              | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Modellreferenz            | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Authentifizierung         | `OPENAI_API_KEY`                   | OpenAI Codex OAuth-Anmeldung         |
| Transport                 | OpenAI Images API                  | Codex Responses-Backend              |
| Max. Bilder pro Anfrage   | 4                                  | 4                                    |
| Bearbeitungsmodus         | Aktiviert (bis zu 5 Referenzbilder) | Aktiviert (bis zu 5 Referenzbilder) |
| Größenüberschreibungen    | Unterstützt, einschließlich 2K-/4K-Größen | Unterstützt, einschließlich 2K-/4K-Größen |
| Seitenverhältnis / Auflösung | Nicht an OpenAI Images API weitergeleitet | Wird, wenn sicher, auf eine unterstützte Größe abgebildet |

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
Siehe [Bildgenerierung](/de/tools/image-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

`gpt-image-2` ist der Standard für OpenAI-Text-zu-Bild-Generierung und Bildbearbeitung.
`gpt-image-1.5`, `gpt-image-1` und `gpt-image-1-mini` bleiben als
explizite Modellüberschreibungen verwendbar. Verwenden Sie `openai/gpt-image-1.5` für PNG-/WebP-Ausgabe
mit transparentem Hintergrund; die aktuelle API `gpt-image-2` lehnt
`background: "transparent"` ab.

Für eine Anfrage mit transparentem Hintergrund sollten Agenten `image_generate` mit
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` oder `"webp"` und
`background: "transparent"` aufrufen; die ältere Provider-Option `openai.background`
wird weiterhin akzeptiert. OpenClaw schützt außerdem die öffentlichen OpenAI- und
OpenAI Codex OAuth-Routen, indem transparente Standardanfragen an `openai/gpt-image-2`
zu `gpt-image-1.5` umgeschrieben werden; Azure und benutzerdefinierte OpenAI-kompatible Endpunkte behalten
ihre konfigurierten Deployment-/Modellnamen.

Dieselbe Einstellung ist für Headless-CLI-Ausführungen verfügbar:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Verwenden Sie dieselben Flags `--output-format` und `--background` mit
`openclaw infer image edit`, wenn Sie von einer Eingabedatei starten.
`--openai-background` bleibt als OpenAI-spezifischer Alias verfügbar.

Behalten Sie bei Codex OAuth-Installationen dieselbe Referenz `openai/gpt-image-2` bei. Wenn ein
OAuth-Profil `openai-codex` konfiguriert ist, löst OpenClaw dieses gespeicherte OAuth-
Zugriffstoken auf und sendet Bildanfragen über das Codex Responses-Backend. Es
versucht nicht zuerst `OPENAI_API_KEY` und fällt für diese
Anfrage auch nicht stillschweigend auf einen API-Schlüssel zurück. Konfigurieren Sie `models.providers.openai`
explizit mit einem API-Schlüssel, einer benutzerdefinierten Basis-URL oder einem Azure-Endpunkt, wenn Sie stattdessen
die direkte OpenAI Images API-Route verwenden möchten.
Wenn sich dieser benutzerdefinierte Bildendpunkt in einem vertrauenswürdigen LAN/einer privaten Adresse befindet, setzen Sie außerdem
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw hält
private/interne OpenAI-kompatible Bildendpunkte blockiert, sofern diese explizite Zustimmung nicht
vorhanden ist.

Generieren:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Transparentes PNG generieren:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Bearbeiten:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Videogenerierung

Das gebündelte `openai`-Plugin registriert Videogenerierung über das Tool `video_generate`.

| Fähigkeit        | Wert                                                                              |
| ---------------- | --------------------------------------------------------------------------------- |
| Standardmodell   | `openai/sora-2`                                                                   |
| Modi             | Text-zu-Video, Bild-zu-Video, Einzelvideo-Bearbeitung                             |
| Referenzeingaben | 1 Bild oder 1 Video                                                               |
| Größenüberschreibungen | Unterstützt                                                                  |
| Andere Überschreibungen | `aspectRatio`, `resolution`, `audio`, `watermark` werden mit einer Tool-Warnung ignoriert |

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
Siehe [Videogenerierung](/de/tools/video-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## GPT-5-Prompt-Beitrag

OpenClaw fügt einen gemeinsamen GPT-5-Prompt-Beitrag für Ausführungen der GPT-5-Familie über Provider hinweg hinzu. Er wird anhand der Modell-ID angewendet, sodass `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` und andere kompatible GPT-5-Referenzen dieselbe Überlagerung erhalten. Ältere GPT-4.x-Modelle nicht.

Der gebündelte native Codex-Harness verwendet dasselbe GPT-5-Verhalten und dieselbe Heartbeat-Überlagerung über Codex-App-Server-Entwickleranweisungen, sodass `openai/gpt-5.x`-Sitzungen, die über `agentRuntime.id: "codex"` erzwungen werden, dieselben Hinweise zu konsequenter Weiterverfolgung und proaktivem Heartbeat beibehalten, auch wenn Codex den Rest des Harness-Prompts besitzt.

Der GPT-5-Beitrag fügt einen getaggten Verhaltensvertrag für Persona-Persistenz, Ausführungssicherheit, Tool-Disziplin, Ausgabeform, Abschlussprüfungen und Verifizierung hinzu. Kanalspezifisches Antwort- und Verhalten für stille Nachrichten bleibt im gemeinsamen OpenClaw-System-Prompt und in der Richtlinie für ausgehende Zustellung. Die GPT-5-Anleitung ist für passende Modelle immer aktiviert. Die freundliche Interaktionsstil-Ebene ist separat und konfigurierbar.

| Wert                   | Wirkung                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (Standard) | Freundliche Interaktionsstil-Ebene aktivieren |
| `"on"`                 | Alias für `"friendly"`                      |
| `"off"`                | Nur die freundliche Stilebene deaktivieren  |

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
Werte sind zur Laufzeit nicht groß-/kleinschreibungssensitiv, daher deaktivieren sowohl `"Off"` als auch `"off"` die freundliche Stilebene.
</Tip>

<Note>
Das veraltete `plugins.entries.openai.config.personality` wird weiterhin als Kompatibilitäts-Fallback gelesen, wenn die gemeinsame Einstellung `agents.defaults.promptOverlays.gpt5.personality` nicht gesetzt ist.
</Note>

## Stimme und Sprache

<AccordionGroup>
  <Accordion title="Sprachsynthese (TTS)">
    Das gebündelte `openai`-Plugin registriert Sprachsynthese für die Oberfläche `messages.tts`.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Stimme | `messages.tts.providers.openai.voice` | `coral` |
    | Geschwindigkeit | `messages.tts.providers.openai.speed` | (nicht festgelegt) |
    | Anweisungen | `messages.tts.providers.openai.instructions` | (nicht festgelegt, nur `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` für Sprachnachrichten, `mp3` für Dateien |
    | API-Schlüssel | `messages.tts.providers.openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |
    | Basis-URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Zusätzlicher Body | `messages.tts.providers.openai.extraBody` / `extra_body` | (nicht festgelegt) |

    Verfügbare Modelle: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Verfügbare Stimmen: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` wird nach den von OpenClaw generierten Feldern in das JSON der `/audio/speech`-Anfrage eingefügt. Verwenden Sie es daher für OpenAI-kompatible Endpunkte, die zusätzliche Schlüssel wie `lang` erfordern. Prototyp-Schlüssel werden ignoriert.

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

  <Accordion title="Speech-to-text">
    Das gebündelte `openai`-Plugin registriert Batch-Spracherkennung über
    OpenClaws Transkriptionsoberfläche für Medienverständnis.

    - Standardmodell: `gpt-4o-transcribe`
    - Endpunkt: OpenAI REST `/v1/audio/transcriptions`
    - Eingabepfad: Multipart-Audiodatei-Upload
    - Unterstützt von OpenClaw überall dort, wo eingehende Audiotranskription
      `tools.media.audio` verwendet, einschließlich Discord-Sprachkanal-Segmenten und Kanal-
      Audioanhängen

    Um OpenAI für eingehende Audiotranskription zu erzwingen:

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

    Sprach- und Prompt-Hinweise werden an OpenAI weitergeleitet, wenn sie von der
    gemeinsamen Audiomedienkonfiguration oder von einer Transkriptionsanfrage pro Aufruf bereitgestellt werden.

  </Accordion>

  <Accordion title="Realtime transcription">
    Das gebündelte `openai`-Plugin registriert Echtzeittranskription für das Voice Call-Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Sprache | `...openai.language` | (nicht festgelegt) |
    | Prompt | `...openai.prompt` | (nicht festgelegt) |
    | Stilledauer | `...openai.silenceDurationMs` | `800` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | API-Schlüssel | `...openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |

    <Note>
    Verwendet eine WebSocket-Verbindung zu `wss://api.openai.com/v1/realtime` mit G.711 u-law (`g711_ulaw` / `audio/pcmu`)-Audio. Dieser Streaming-Provider ist für den Echtzeittranskriptionspfad von Voice Call vorgesehen; Discord Voice zeichnet derzeit kurze Segmente auf und verwendet stattdessen den Batch-Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    Das gebündelte `openai`-Plugin registriert Echtzeitstimme für das Voice Call-Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Stimme | `...openai.voice` | `alloy` |
    | Temperatur | `...openai.temperature` | `0.8` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | Stilledauer | `...openai.silenceDurationMs` | `500` |
    | API-Schlüssel | `...openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |

    <Note>
    Unterstützt Azure OpenAI über die Konfigurationsschlüssel `azureEndpoint` und `azureDeployment` für Backend-Echtzeitbrücken. Unterstützt bidirektionale Tool-Aufrufe. Verwendet das Audioformat G.711 u-law.
    </Note>

    <Note>
    Control UI Talk verwendet OpenAI-Browser-Echtzeitsitzungen mit einem vom Gateway ausgestellten
    kurzlebigen Client Secret und einem direkten WebRTC-SDP-Austausch im Browser mit der
    OpenAI Realtime API. Live-Verifizierung für Maintainer ist verfügbar mit
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    der OpenAI-Zweig stellt ein Client Secret in Node aus, generiert ein Browser-SDP-Angebot
    mit simulierten Mikrofonmedien, sendet es an OpenAI und wendet die SDP-Antwort an,
    ohne Secrets zu protokollieren.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI-Endpunkte

Der gebündelte `openai`-Provider kann für die Bilderzeugung auf eine Azure OpenAI-Ressource
ausgerichtet werden, indem die Basis-URL überschrieben wird. Auf dem Bilderzeugungspfad erkennt OpenClaw
Azure-Hostnamen unter `models.providers.openai.baseUrl` und wechselt automatisch zur
Anfrageform von Azure.

<Note>
Echtzeitstimme verwendet einen separaten Konfigurationspfad
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
und wird nicht von `models.providers.openai.baseUrl` beeinflusst. Siehe das Accordion **Echtzeitstimme**
unter [Stimme und Sprache](#voice-and-speech) für die Azure-
Einstellungen.
</Note>

Verwenden Sie Azure OpenAI, wenn:

- Sie bereits ein Azure OpenAI-Abonnement, Kontingent oder Enterprise Agreement haben
- Sie regionale Datenresidenz oder Compliance-Kontrollen benötigen, die Azure bereitstellt
- Sie Datenverkehr innerhalb einer bestehenden Azure-Tenancy halten möchten

### Konfiguration

Für die Azure-Bilderzeugung über den gebündelten `openai`-Provider richten Sie
`models.providers.openai.baseUrl` auf Ihre Azure-Ressource und setzen `apiKey` auf
den Azure OpenAI-Schlüssel (nicht auf einen OpenAI Platform-Schlüssel):

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

OpenClaw erkennt diese Azure-Host-Suffixe für die Azure-Bilderzeugungsroute:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Für Bilderzeugungsanfragen an einen erkannten Azure-Host führt OpenClaw Folgendes aus:

- Sendet den Header `api-key` anstelle von `Authorization: Bearer`
- Verwendet deployment-bezogene Pfade (`/openai/deployments/{deployment}/...`)
- Hängt `?api-version=...` an jede Anfrage an
- Verwendet ein Standard-Request-Timeout von 600 s für Azure-Bilderzeugungsaufrufe.
  `timeoutMs`-Werte pro Aufruf überschreiben diesen Standard weiterhin.

Andere Basis-URLs (öffentliches OpenAI, OpenAI-kompatible Proxys) behalten die standardmäßige
OpenAI-Bildanfrageform bei.

<Note>
Azure-Routing für den Bilderzeugungspfad des `openai`-Providers erfordert
OpenClaw 2026.4.22 oder neuer. Frühere Versionen behandeln jede benutzerdefinierte
`openai.baseUrl` wie den öffentlichen OpenAI-Endpunkt und schlagen bei Azure-
Bild-Deployments fehl.
</Note>

### API-Version

Setzen Sie `AZURE_OPENAI_API_VERSION`, um eine bestimmte Azure-Preview- oder GA-Version
für den Azure-Bilderzeugungspfad festzulegen:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Der Standard ist `2024-12-01-preview`, wenn die Variable nicht festgelegt ist.

### Modellnamen sind Deployment-Namen

Azure OpenAI bindet Modelle an Deployments. Für Azure-Bilderzeugungsanfragen,
die über den gebündelten `openai`-Provider geroutet werden, muss das Feld `model` in OpenClaw
der **Azure-Deployment-Name** sein, den Sie im Azure-Portal konfiguriert haben, nicht
die öffentliche OpenAI-Modell-ID.

Wenn Sie ein Deployment namens `gpt-image-2-prod` erstellen, das `gpt-image-2` bereitstellt:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Dieselbe Regel für Deployment-Namen gilt für Bilderzeugungsaufrufe, die über
den gebündelten `openai`-Provider geroutet werden.

### Regionale Verfügbarkeit

Azure-Bilderzeugung ist derzeit nur in einer Teilmenge von Regionen verfügbar
(zum Beispiel `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Prüfen Sie die aktuelle Regionsliste von Microsoft, bevor Sie ein
Deployment erstellen, und bestätigen Sie, dass das jeweilige Modell in Ihrer Region angeboten wird.

### Parameterunterschiede

Azure OpenAI und öffentliches OpenAI akzeptieren nicht immer dieselben Bildparameter.
Azure kann Optionen ablehnen, die öffentliches OpenAI erlaubt (zum Beispiel bestimmte
`background`-Werte bei `gpt-image-2`), oder sie nur bei bestimmten Modellversionen
bereitstellen. Diese Unterschiede stammen von Azure und dem zugrunde liegenden Modell, nicht
von OpenClaw. Wenn eine Azure-Anfrage mit einem Validierungsfehler fehlschlägt, prüfen Sie den
Parametersatz, der von Ihrem spezifischen Deployment und Ihrer API-Version im
Azure-Portal unterstützt wird.

<Note>
Azure OpenAI verwendet nativen Transport und Kompatibilitätsverhalten, erhält aber nicht
OpenClaws versteckte Attribution-Header — siehe das Accordion **Native vs OpenAI-compatible
routes** unter [Erweiterte Konfiguration](#advanced-configuration).

Für Chat- oder Responses-Datenverkehr auf Azure (über die Bilderzeugung hinaus) verwenden Sie den
Onboarding-Ablauf oder eine dedizierte Azure-Provider-Konfiguration — `openai.baseUrl` allein
übernimmt nicht die Azure-API-/Authentifizierungsform. Ein separater
`azure-openai-responses/*`-Provider existiert; siehe
das Accordion zu serverseitiger Compaction unten.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw verwendet WebSocket-first mit SSE-Fallback (`"auto"`) sowohl für `openai/*` als auch für `openai-codex/*`.

    Im Modus `"auto"`:
    - Versucht OpenClaw einen frühen WebSocket-Fehler einmal erneut, bevor auf SSE zurückgefallen wird
    - Markiert OpenClaw WebSocket nach einem Fehler für etwa 60 Sekunden als beeinträchtigt und verwendet während der Abkühlphase SSE
    - Hängt stabile Sitzungs- und Turn-Identitäts-Header für Wiederholungen und Wiederverbindungen an
    - Normalisiert Nutzungszähler (`input_tokens` / `prompt_tokens`) über Transportvarianten hinweg

    | Wert | Verhalten |
    |-------|----------|
    | `"auto"` (Standard) | Zuerst WebSocket, SSE-Fallback |
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
    - [Realtime API mit WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming-API-Antworten (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket warm-up">
    OpenClaw aktiviert WebSocket-Warm-up standardmäßig für `openai/*` und `openai-codex/*`, um die Latenz des ersten Turns zu reduzieren.

    ```json5
    // Disable warm-up
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

  <Accordion title="Fast mode">
    OpenClaw stellt einen gemeinsamen Fast-Mode-Schalter für `openai/*` und `openai-codex/*` bereit:

    - **Chat/UI:** `/fast status|on|off`
    - **Konfiguration:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Wenn aktiviert, ordnet OpenClaw den Fast Mode der OpenAI-Prioritätsverarbeitung zu (`service_tier = "priority"`). Bestehende `service_tier`-Werte bleiben erhalten, und Fast Mode schreibt weder `reasoning` noch `text.verbosity` um.

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
    Sitzungsüberschreibungen haben Vorrang vor der Konfiguration. Das Löschen der Sitzungsüberschreibung in der Sessions UI setzt die Sitzung auf den konfigurierten Standard zurück.
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
    Die API von OpenAI stellt Prioritätsverarbeitung über `service_tier` bereit. Legen Sie sie pro Modell in OpenClaw fest:

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
    `serviceTier` wird nur an native OpenAI-Endpunkte (`api.openai.com`) und native Codex-Endpunkte (`chatgpt.com/backend-api`) weitergeleitet. Wenn Sie einen der beiden Provider über einen Proxy routen, lässt OpenClaw `service_tier` unverändert.
    </Warning>

  </Accordion>

  <Accordion title="Serverseitige Compaction (Responses API)">
    Für direkte OpenAI-Responses-Modelle (`openai/*` auf `api.openai.com`) aktiviert der Pi-Harness-Stream-Wrapper des OpenAI-Plugins automatisch serverseitige Compaction:

    - Erzwingt `store: true` (außer die Modellkompatibilität setzt `supportsStore: false`)
    - Fügt `context_management: [{ type: "compaction", compact_threshold: ... }]` ein
    - Standardwert für `compact_threshold`: 70 % von `contextWindow` (oder `80000`, wenn nicht verfügbar)

    Dies gilt für den integrierten Pi-Harness-Pfad und für OpenAI-Provider-Hooks, die von eingebetteten Ausführungen verwendet werden. Der native Codex-App-Server-Harness verwaltet seinen eigenen Kontext über Codex und wird separat mit `agents.defaults.agentRuntime.id` konfiguriert.

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
    `responsesServerCompaction` steuert nur die Einfügung von `context_management`. Direkte OpenAI-Responses-Modelle erzwingen weiterhin `store: true`, außer die Kompatibilität setzt `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Strikter agentischer GPT-Modus">
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

    Mit `strict-agentic` führt OpenClaw Folgendes aus:
    - Behandelt einen rein planenden Turn nicht mehr als erfolgreichen Fortschritt, wenn eine Tool-Aktion verfügbar ist
    - Wiederholt den Turn mit einer Jetzt-handeln-Steuerung
    - Aktiviert `update_plan` automatisch für umfangreiche Arbeiten
    - Zeigt einen expliziten blockierten Zustand an, wenn das Modell weiter plant, ohne zu handeln

    <Note>
    Gilt nur für OpenAI- und Codex-Ausführungen der GPT-5-Familie. Andere Provider und ältere Modellfamilien behalten das Standardverhalten bei.
    </Note>

  </Accordion>

  <Accordion title="Native vs. OpenAI-kompatible Routen">
    OpenClaw behandelt direkte OpenAI-, Codex- und Azure-OpenAI-Endpunkte anders als generische OpenAI-kompatible `/v1`-Proxys:

    **Native Routen** (`openai/*`, Azure OpenAI):
    - Behalten `reasoning: { effort: "none" }` nur für Modelle bei, die den OpenAI-Aufwand `none` unterstützen
    - Lassen deaktiviertes Reasoning für Modelle oder Proxys weg, die `reasoning.effort: "none"` ablehnen
    - Setzen Tool-Schemas standardmäßig auf den strikten Modus
    - Hängen versteckte Attributions-Header nur auf verifizierten nativen Hosts an
    - Behalten OpenAI-spezifische Anfrageformung bei (`service_tier`, `store`, Reasoning-Kompatibilität, Prompt-Cache-Hinweise)

    **Proxy-/kompatible Routen:**
    - Verwenden weniger striktes Kompatibilitätsverhalten
    - Entfernen Completions-`store` aus nicht nativen `openai-completions`-Payloads
    - Akzeptieren erweitertes Durchreichen von JSON über `params.extra_body`/`params.extraBody` für OpenAI-kompatible Completions-Proxys
    - Akzeptieren `params.chat_template_kwargs` für OpenAI-kompatible Completions-Proxys wie vLLM
    - Erzwingen keine strikten Tool-Schemas oder nur für native Routen vorgesehenen Header

    Azure OpenAI verwendet nativen Transport und Kompatibilitätsverhalten, erhält jedoch nicht die versteckten Attributions-Header.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Bild-Tool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Video-Tool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Authentifizierungsdetails und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
