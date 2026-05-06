---
read_when:
    - Sie möchten OpenAI-Modelle in OpenClaw verwenden
    - Sie möchten Codex-Abonnementauthentifizierung statt API-Schlüsseln
    - Sie benötigen ein strengeres Ausführungsverhalten für GPT-5-Agenten
summary: OpenAI in OpenClaw über API-Schlüssel oder ein Codex-Abonnement verwenden
title: OpenAI
x-i18n:
    generated_at: "2026-05-06T19:35:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fda2acdb0e249f0481ab1aa20bb5ff317709bc9536f60c45be9e2d63c44702e
    source_path: providers/openai.md
    workflow: 16
---

OpenAI stellt Entwickler-APIs für GPT-Modelle bereit, und Codex ist auch als
ChatGPT-Tarif-Coding-Agent über die Codex-Clients von OpenAI verfügbar. OpenClaw hält diese
Oberflächen getrennt, damit die Konfiguration vorhersehbar bleibt.

OpenClaw unterstützt drei Routen aus der OpenAI-Familie. Die meisten ChatGPT/Codex-Abonnenten,
die Codex-Verhalten wünschen, sollten die native Codex-App-Server-Runtime verwenden. Das
Modellpräfix wählt den Provider-/Modellnamen aus; eine separate Runtime-Einstellung legt fest,
wer die eingebettete Agentenschleife ausführt:

- **API-Schlüssel** - direkter Zugriff auf die OpenAI Platform mit nutzungsbasierter Abrechnung (`openai/*`-Modelle)
- **Codex-Abonnement mit nativer Codex-Runtime** - ChatGPT/Codex-Anmeldung plus Ausführung über den Codex-App-Server (`openai/*`-Modelle plus `agents.defaults.agentRuntime.id: "codex"`)
- **Codex-Abonnement über PI** - ChatGPT/Codex-Anmeldung mit dem normalen OpenClaw-PI-Runner (`openai-codex/*`-Modelle)

OpenAI unterstützt die OAuth-Nutzung von Abonnements in externen Tools und Workflows wie OpenClaw ausdrücklich.

Provider, Modell, Runtime und Kanal sind getrennte Ebenen. Wenn diese Bezeichnungen
durcheinandergeraten, lesen Sie [Agenten-Runtimes](/de/concepts/agent-runtimes), bevor
Sie die Konfiguration ändern.

## Schnellauswahl

| Ziel                                                 | Verwenden                                        | Hinweise                                                                  |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| ChatGPT/Codex-Abonnement mit nativer Codex-Runtime   | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | Empfohlene Codex-Einrichtung für die meisten Benutzer. Melden Sie sich mit `openai-codex`-Auth an. |
| Direkte Abrechnung per API-Schlüssel                 | `openai/gpt-5.5`                                 | Setzen Sie `OPENAI_API_KEY` oder führen Sie das OpenAI-API-Schlüssel-Onboarding aus. |
| ChatGPT/Codex-Abonnement-Auth über PI                | `openai-codex/gpt-5.5`                           | Verwenden Sie dies nur, wenn Sie bewusst den normalen PI-Runner wünschen. |
| Bilderzeugung oder -bearbeitung                      | `openai/gpt-image-2`                             | Funktioniert mit `OPENAI_API_KEY` oder OpenAI-Codex-OAuth.                |
| Bilder mit transparentem Hintergrund                 | `openai/gpt-image-1.5`                           | Verwenden Sie `outputFormat=png` oder `webp` und `openai.background=transparent`. |

## Namenszuordnung

Die Namen sind ähnlich, aber nicht austauschbar:

| Angezeigter Name                   | Ebene             | Bedeutung                                                                                         |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Provider-Präfix   | Direkte Route zur OpenAI Platform API.                                                            |
| `openai-codex`                     | Provider-Präfix   | OpenAI-Codex-OAuth-/Abonnementroute über den normalen OpenClaw-PI-Runner.                         |
| `codex` plugin                     | Plugin            | Mitgeliefertes OpenClaw-Plugin, das die native Codex-App-Server-Runtime und `/codex`-Chat-Steuerungen bereitstellt. |
| `agentRuntime.id: codex`           | Agenten-Runtime   | Erzwingt das native Codex-App-Server-Harness für eingebettete Turns.                              |
| `/codex ...`                       | Chat-Befehlssatz  | Bindet/steuert Codex-App-Server-Threads aus einer Unterhaltung heraus.                            |
| `runtime: "acp", agentId: "codex"` | ACP-Sitzungsroute | Expliziter Fallback-Pfad, der Codex über ACP/acpx ausführt.                                       |

Das bedeutet, dass eine Konfiguration absichtlich sowohl `openai-codex/*` als auch das
`codex`-Plugin enthalten kann. Das ist gültig, wenn Sie Codex-OAuth über PI wünschen und
gleichzeitig native `/codex`-Chat-Steuerungen verfügbar haben möchten. `openclaw doctor` warnt vor dieser
Kombination, damit Sie bestätigen können, dass sie beabsichtigt ist; sie wird nicht umgeschrieben.

<Note>
GPT-5.5 ist sowohl über direkten OpenAI-Platform-Zugriff per API-Schlüssel als auch über
Abonnement-/OAuth-Routen verfügbar. Für ChatGPT/Codex-Abonnement plus native Codex-Ausführung
verwenden Sie `openai/gpt-5.5` mit `agentRuntime.id: "codex"`. Verwenden Sie
`openai-codex/gpt-5.5` nur für Codex-OAuth über PI oder `openai/gpt-5.5`
ohne Codex-Runtime-Override für direkten `OPENAI_API_KEY`-Traffic.
</Note>

<Note>
Das Aktivieren des OpenAI-Plugins oder die Auswahl eines `openai-codex/*`-Modells
aktiviert nicht das mitgelieferte Codex-App-Server-Plugin. OpenClaw aktiviert dieses Plugin nur,
wenn Sie das native Codex-Harness mit
`agentRuntime.id: "codex"` explizit auswählen oder eine ältere `codex/*`-Modellreferenz verwenden.
Wenn das mitgelieferte `codex`-Plugin aktiviert ist, `openai-codex/*` aber weiterhin
über PI aufgelöst wird, warnt `openclaw doctor` und lässt die Route unverändert.
</Note>

## OpenClaw-Funktionsabdeckung

| OpenAI-Fähigkeit         | OpenClaw-Oberfläche                                      | Status                                                 |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses         | `openai/<model>`-Modell-Provider                         | Ja                                                     |
| Codex-Abonnementmodelle  | `openai-codex/<model>` mit `openai-codex`-OAuth          | Ja                                                     |
| Codex-App-Server-Harness | `openai/<model>` mit `agentRuntime.id: codex`            | Ja                                                     |
| Serverseitige Websuche   | Natives OpenAI-Responses-Tool                            | Ja, wenn Websuche aktiviert ist und kein Provider festgelegt ist |
| Bilder                   | `image_generate`                                         | Ja                                                     |
| Videos                   | `video_generate`                                         | Ja                                                     |
| Text-to-Speech           | `messages.tts.provider: "openai"` / `tts`                | Ja                                                     |
| Batch-Speech-to-Text     | `tools.media.audio` / Medienverständnis                  | Ja                                                     |
| Streaming-Speech-to-Text | Voice Call `streaming.provider: "openai"`                | Ja                                                     |
| Echtzeit-Sprache         | Voice Call `realtime.provider: "openai"` / Control UI Talk | Ja                                                   |
| Embeddings               | Speicher-Embedding-Provider                              | Ja                                                     |

## Speicher-Embeddings

OpenClaw kann OpenAI oder einen OpenAI-kompatiblen Embedding-Endpunkt für
`memory_search`-Indexierung und Abfrage-Embeddings verwenden:

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

Für OpenAI-kompatible Endpunkte, die asymmetrische Embedding-Labels benötigen, setzen Sie
`queryInputType` und `documentInputType` unter `memorySearch`. OpenClaw leitet
diese als provider-spezifische `input_type`-Anfragefelder weiter: Abfrage-Embeddings verwenden
`queryInputType`; indexierte Speicherabschnitte und Batch-Indexierung verwenden
`documentInputType`. Das vollständige Beispiel finden Sie in der [Referenz zur Speicherkonfiguration](/de/reference/memory-config#provider-specific-config).

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
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Routenzusammenfassung

    | Modellreferenz         | Runtime-Konfiguration     | Route                       | Auth             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | omitted / `agentRuntime.id: "pi"`    | Direkte OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | omitted / `agentRuntime.id: "pi"`    | Direkte OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Codex-App-Server-Harness   | Codex-App-Server |

    <Note>
    `openai/*` ist die direkte OpenAI-API-Schlüssel-Route, sofern Sie nicht explizit
    das Codex-App-Server-Harness erzwingen. Verwenden Sie `openai-codex/*` für Codex-OAuth über
    den standardmäßigen PI-Runner oder `openai/gpt-5.5` mit
    `agentRuntime.id: "codex"` für native Codex-App-Server-Ausführung.
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
    **Am besten für:** die Nutzung Ihres ChatGPT/Codex-Abonnements mit nativer Codex-App-Server-Ausführung statt eines separaten API-Schlüssels. Codex Cloud erfordert eine ChatGPT-Anmeldung.

    <Steps>
      <Step title="Codex-OAuth ausführen">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oder führen Sie OAuth direkt aus:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Fügen Sie für headless oder callback-unfreundliche Setups `--device-code` hinzu, um sich mit einem ChatGPT-Device-Code-Flow statt über den localhost-Browser-Callback anzumelden:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Native Codex-Runtime verwenden">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex"}' --strict-json
        ```
      </Step>
      <Step title="Prüfen, ob Codex-Auth verfügbar ist">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Nachdem der Gateway läuft, senden Sie `/codex status` oder `/codex models`
        im Chat, um die native App-Server-Runtime zu prüfen.
      </Step>
    </Steps>

    ### Routenzusammenfassung

    | Modellreferenz | Runtime-Konfiguration | Route | Auth |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Natives Codex-App-Server-Harness | Codex-Anmeldung oder ausgewähltes `openai-codex`-Profil |
    | `openai-codex/gpt-5.5` | omitted / `runtime: "pi"` | ChatGPT/Codex-OAuth über PI | Codex-Anmeldung |
    | `openai-codex/gpt-5.4-mini` | omitted / `runtime: "pi"` | ChatGPT/Codex-OAuth über PI | Codex-Anmeldung |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Weiterhin PI, sofern kein Plugin explizit `openai-codex` beansprucht | Codex-Anmeldung |

    <Warning>
    Konfigurieren Sie keine älteren Modellreferenzen wie `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` oder
    `openai-codex/gpt-5.3*`. ChatGPT/Codex-OAuth-Konten lehnen
    diese Modelle inzwischen ab. Verwenden Sie `openai-codex/gpt-5.5` für die PI-OAuth-Route oder
    `openai/gpt-5.5` mit `agentRuntime.id: "codex"` für native Codex-Runtime-
    Ausführung.
    </Warning>

    <Note>
    Verwenden Sie weiterhin die Provider-ID `openai-codex` für Authentifizierungs-/Profilbefehle. Das
    Modellpräfix `openai-codex/*` ist außerdem die explizite PI-Route für Codex OAuth.
    Es wählt das gebündelte Codex-App-Server-Harness nicht aus und aktiviert es nicht automatisch. Für
    die übliche Einrichtung mit Abonnement plus nativer Runtime melden Sie sich mit
    `openai-codex` an, behalten Sie aber die Modellreferenz als `openai/gpt-5.5` bei und setzen Sie
    `agentRuntime.id: "codex"`.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    Um Codex OAuth stattdessen auf dem normalen PI-Runner zu belassen, verwenden Sie
    `openai-codex/gpt-5.5` und lassen Sie die Codex-Runtime-Überschreibung weg.

    <Note>
    Das Onboarding importiert kein OAuth-Material mehr aus `~/.codex`. Melden Sie sich mit Browser-OAuth (Standard) oder dem oben beschriebenen Gerätecode-Flow an — OpenClaw verwaltet die daraus entstehenden Anmeldedaten in seinem eigenen Agent-Auth-Speicher.
    </Note>

    ### Codex-OAuth-Routing prüfen und wiederherstellen

    Verwenden Sie diese Befehle, um zu sehen, welches Modell, welche Runtime und welche Auth-Route Ihr Standard-
    Agent verwendet:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get agents.defaults.agentRuntime --json
    ```

    Fügen Sie für einen bestimmten Agent `--agent <id>` hinzu:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Wenn ein `doctor --fix`-Lauf in 2026.5.5 eine GPT-5.5-Abonnementeinrichtung von
    `openai-codex/gpt-5.5` zu `openai/gpt-5.5` geändert hat, stellen Sie den Standard-Agent wieder
    auf die Codex-OAuth-PI-Route um:

    ```bash
    openclaw models set openai-codex/gpt-5.5
    openclaw config validate
    ```

    Wenn `models auth list --provider openai-codex` kein verwendbares Profil anzeigt, melden Sie sich
    erneut an:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex/*` bedeutet ChatGPT/Codex OAuth über PI. `openai/*` mit
    `agentRuntime.id: "codex"` bedeutet native Codex-App-Server-Ausführung.

    ### Statusanzeige

    Chat `/status` zeigt, welche Modell-Runtime für die aktuelle Sitzung aktiv ist.
    Das Standard-PI-Harness erscheint als `Runtime: OpenClaw Pi Default`. Wenn das
    gebündelte Codex-App-Server-Harness ausgewählt ist, zeigt `/status`
    `Runtime: OpenAI Codex`. Bestehende Sitzungen behalten ihre aufgezeichnete Harness-ID. Verwenden Sie daher
    `/new` oder `/reset`, nachdem Sie `agentRuntime` geändert haben, wenn `/status` eine
    neue PI/Codex-Auswahl widerspiegeln soll.

    ### Doctor-Warnung

    Wenn das gebündelte `codex`-Plugin aktiviert ist, während eine `openai-codex/*`-Route
    ausgewählt ist, warnt `openclaw doctor`, dass das Modell weiterhin über PI aufgelöst wird.
    Lassen Sie die Konfiguration nur unverändert, wenn diese PI-Route mit Abonnementauthentifizierung
    beabsichtigt ist. Wechseln Sie zu `openai/<model>` plus `agentRuntime.id: "codex"`, wenn
    Sie native Codex-App-Server-Ausführung wünschen.

    ### Kontextfenster-Obergrenze

    OpenClaw behandelt Modellmetadaten und die Runtime-Kontextobergrenze als getrennte Werte.

    Für `openai-codex/gpt-5.5` über Codex OAuth:

    - Natives `contextWindow`: `1000000`
    - Standardmäßige Runtime-Obergrenze `contextTokens`: `272000`

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
    Verwenden Sie `contextWindow`, um native Modellmetadaten zu deklarieren. Verwenden Sie `contextTokens`, um das Runtime-Kontextbudget zu begrenzen.
    </Note>

    ### Katalogwiederherstellung

    OpenClaw verwendet Upstream-Codex-Katalogmetadaten für `gpt-5.5`, wenn sie
    vorhanden sind. Wenn die Live-Codex-Erkennung die Zeile `openai-codex/gpt-5.5` auslässt, während
    das Konto authentifiziert ist, synthetisiert OpenClaw diese OAuth-Modellzeile, damit
    Cron-, Sub-Agent- und konfigurierte Standardmodell-Läufe nicht mit
    `Unknown model` fehlschlagen.

  </Tab>
</Tabs>

## Native Codex-App-Server-Authentifizierung

Das native Codex-App-Server-Harness verwendet `openai/*`-Modellreferenzen plus
`agentRuntime.id: "codex"`, aber seine Authentifizierung ist weiterhin kontobasiert. OpenClaw
wählt Authentifizierung in dieser Reihenfolge aus:

1. Ein explizites OpenClaw-Auth-Profil `openai-codex`, das an den Agent gebunden ist.
2. Das vorhandene Konto des App-Servers, z. B. eine lokale Codex-CLI-ChatGPT-Anmeldung.
3. Nur für lokale stdio-App-Server-Starts `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn der App-Server kein Konto meldet und weiterhin
   OpenAI-Authentifizierung erfordert.

Das bedeutet, dass eine lokale ChatGPT/Codex-Abonnementanmeldung nicht ersetzt wird, nur
weil der Gateway-Prozess auch `OPENAI_API_KEY` für direkte OpenAI-Modelle
oder Einbettungen hat. Der Env-API-Key-Fallback ist nur der lokale stdio-Pfad ohne Konto; er
wird nicht an WebSocket-App-Server-Verbindungen gesendet. Wenn ein abonnementartiges Codex-
Profil ausgewählt ist, hält OpenClaw außerdem `CODEX_API_KEY` und `OPENAI_API_KEY`
aus dem erzeugten stdio-App-Server-Kindprozess heraus und sendet die ausgewählten Anmeldedaten
über den App-Server-Login-RPC.

## Bilderzeugung

Das gebündelte `openai`-Plugin registriert Bilderzeugung über das Tool `image_generate`.
Es unterstützt sowohl OpenAI-API-Key-Bilderzeugung als auch Codex-OAuth-Bilderzeugung
über dieselbe Modellreferenz `openai/gpt-image-2`.

| Fähigkeit                 | OpenAI-API-Key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Modellreferenz            | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Authentifizierung         | `OPENAI_API_KEY`                   | OpenAI Codex OAuth-Anmeldung         |
| Transport                 | OpenAI Images API                  | Codex Responses-Backend              |
| Max. Bilder pro Anfrage   | 4                                  | 4                                    |
| Bearbeitungsmodus         | Aktiviert (bis zu 5 Referenzbilder) | Aktiviert (bis zu 5 Referenzbilder) |
| Größenüberschreibungen    | Unterstützt, einschließlich 2K-/4K-Größen | Unterstützt, einschließlich 2K-/4K-Größen |
| Seitenverhältnis / Auflösung | Wird nicht an OpenAI Images API weitergeleitet | Wird einer unterstützten Größe zugeordnet, wenn es sicher ist |

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
Siehe [Bilderzeugung](/de/tools/image-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

`gpt-image-2` ist der Standard für OpenAI-Text-zu-Bild-Erzeugung und Bildbearbeitung.
`gpt-image-1.5`, `gpt-image-1` und `gpt-image-1-mini` bleiben als
explizite Modellüberschreibungen verwendbar. Verwenden Sie `openai/gpt-image-1.5` für PNG-/WebP-Ausgabe
mit transparentem Hintergrund; die aktuelle `gpt-image-2`-API lehnt
`background: "transparent"` ab.

Für eine Anfrage mit transparentem Hintergrund sollten Agenten `image_generate` mit
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` oder `"webp"` und
`background: "transparent"` aufrufen; die ältere Provider-Option `openai.background` wird
weiterhin akzeptiert. OpenClaw schützt außerdem die öffentlichen OpenAI- und
OpenAI-Codex-OAuth-Routen, indem standardmäßige transparente Anfragen für `openai/gpt-image-2`
zu `gpt-image-1.5` umgeschrieben werden; Azure- und benutzerdefinierte OpenAI-kompatible Endpunkte behalten
ihre konfigurierten Deployment-/Modellnamen.

Dieselbe Einstellung ist für headless CLI-Läufe verfügbar:

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

Behalten Sie für Codex-OAuth-Installationen dieselbe Referenz `openai/gpt-image-2` bei. Wenn ein
OAuth-Profil `openai-codex` konfiguriert ist, löst OpenClaw dieses gespeicherte OAuth-
Zugriffstoken auf und sendet Bildanfragen über das Codex Responses-Backend. Es
versucht für diese Anfrage nicht zuerst `OPENAI_API_KEY` und fällt nicht stillschweigend auf einen API-Key zurück.
Konfigurieren Sie `models.providers.openai` explizit mit einem API-Key,
einer benutzerdefinierten Basis-URL oder einem Azure-Endpunkt, wenn Sie stattdessen die direkte Route über OpenAI Images API
wünschen.
Wenn sich dieser benutzerdefinierte Bildendpunkt in einem vertrauenswürdigen LAN/einer privaten Adresse befindet, setzen Sie außerdem
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw hält
private/interne OpenAI-kompatible Bildendpunkte blockiert, sofern dieses Opt-in nicht
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

## Videoerzeugung

Das gebündelte `openai`-Plugin registriert Videoerzeugung über das Tool `video_generate`.

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
Siehe [Videoerzeugung](/de/tools/video-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## GPT-5-Prompt-Beitrag

OpenClaw fügt einen gemeinsamen GPT-5-Prompt-Beitrag für Läufe der GPT-5-Familie über Provider hinweg hinzu. Er gilt nach Modell-ID, sodass `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` und andere kompatible GPT-5-Referenzen dieselbe Überlagerung erhalten. Ältere GPT-4.x-Modelle erhalten sie nicht.

Das gebündelte native Codex-Harness verwendet dasselbe GPT-5-Verhalten und dieselbe Heartbeat-Überlagerung über Entwickleranweisungen des Codex-App-Servers, sodass `openai/gpt-5.x`-Sitzungen, die über `agentRuntime.id: "codex"` erzwungen werden, dieselbe Nachverfolgungs- und proaktive Heartbeat-Anleitung behalten, auch wenn Codex den Rest des Harness-Prompts besitzt.

Der GPT-5-Beitrag fügt einen markierten Verhaltensvertrag für Persona-Persistenz, Ausführungssicherheit, Tool-Disziplin, Ausgabeform, Abschlussprüfungen und Verifizierung hinzu. Kanalspezifisches Antwort- und Verhalten bei stillen Nachrichten bleibt im gemeinsamen OpenClaw-Systemprompt und in der Richtlinie für ausgehende Zustellung. Die GPT-5-Anleitung ist für passende Modelle immer aktiviert. Die freundliche Interaktionsstil-Ebene ist getrennt und konfigurierbar.

| Wert                   | Wirkung                                      |
| ---------------------- | -------------------------------------------- |
| `"friendly"` (Standard) | Aktiviert die freundliche Interaktionsstil-Ebene |
| `"on"`                 | Alias für `"friendly"`                       |
| `"off"`                | Deaktiviert nur die freundliche Stilebene    |

<Tabs>
  <Tab title="Config">
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
Werte werden zur Laufzeit ohne Berücksichtigung der Groß- und Kleinschreibung behandelt, daher deaktivieren sowohl `"Off"` als auch `"off"` die freundliche Stilebene.
</Tip>

<Note>
Das ältere `plugins.entries.openai.config.personality` wird weiterhin als Kompatibilitäts-Fallback gelesen, wenn die gemeinsame Einstellung `agents.defaults.promptOverlays.gpt5.personality` nicht gesetzt ist.
</Note>

## Stimme und Sprache

<AccordionGroup>
  <Accordion title="Sprachsynthese (TTS)">
    Das gebündelte `openai`-Plugin registriert Sprachsynthese für die `messages.tts`-Oberfläche.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Stimme | `messages.tts.providers.openai.voice` | `coral` |
    | Geschwindigkeit | `messages.tts.providers.openai.speed` | (nicht gesetzt) |
    | Anweisungen | `messages.tts.providers.openai.instructions` | (nicht gesetzt, nur `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` für Sprachnachrichten, `mp3` für Dateien |
    | API-Schlüssel | `messages.tts.providers.openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |
    | Basis-URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Zusätzlicher Body | `messages.tts.providers.openai.extraBody` / `extra_body` | (nicht gesetzt) |

    Verfügbare Modelle: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Verfügbare Stimmen: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` wird nach den von OpenClaw generierten Feldern in das Anfrage-JSON für `/audio/speech` eingefügt. Verwenden Sie es daher für OpenAI-kompatible Endpunkte, die zusätzliche Schlüssel wie `lang` erfordern. Prototyp-Schlüssel werden ignoriert.

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

  <Accordion title="Sprache-zu-Text">
    Das gebündelte `openai`-Plugin registriert Batch-Sprache-zu-Text über
    OpenClaws Transkriptionsoberfläche für Medienverständnis.

    - Standardmodell: `gpt-4o-transcribe`
    - Endpunkt: OpenAI REST `/v1/audio/transcriptions`
    - Eingabepfad: multipart-Audiodatei-Upload
    - Unterstützt von OpenClaw überall dort, wo die Transkription eingehender Audiodaten
      `tools.media.audio` verwendet, einschließlich Discord-Sprachkanalsegmenten und
      Audi Anhängen von Kanälen

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

    Sprach- und Prompt-Hinweise werden an OpenAI weitergeleitet, wenn sie von der
    gemeinsamen Audiomedien-Konfiguration oder der Transkriptionsanfrage pro Aufruf
    bereitgestellt werden.

  </Accordion>

  <Accordion title="Echtzeit-Transkription">
    Das gebündelte `openai`-Plugin registriert Echtzeit-Transkription für das Voice Call-Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Sprache | `...openai.language` | (nicht gesetzt) |
    | Prompt | `...openai.prompt` | (nicht gesetzt) |
    | Stilledauer | `...openai.silenceDurationMs` | `800` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | API-Schlüssel | `...openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |

    <Note>
    Verwendet eine WebSocket-Verbindung zu `wss://api.openai.com/v1/realtime` mit G.711 u-law-Audio (`g711_ulaw` / `audio/pcmu`). Dieser Streaming-Provider ist für den Echtzeit-Transkriptionspfad von Voice Call vorgesehen; Discord Voice zeichnet derzeit kurze Segmente auf und verwendet stattdessen den Batch-Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Echtzeit-Stimme">
    Das gebündelte `openai`-Plugin registriert Echtzeit-Stimme für das Voice Call-Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Stimme | `...openai.voice` | `alloy` |
    | Temperatur | `...openai.temperature` | `0.8` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | Stilledauer | `...openai.silenceDurationMs` | `500` |
    | API-Schlüssel | `...openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |

    <Note>
    Unterstützt Azure OpenAI über die Konfigurationsschlüssel `azureEndpoint` und `azureDeployment` für Backend-Echtzeit-Bridges. Unterstützt bidirektionale Tool-Aufrufe. Verwendet das Audioformat G.711 u-law.
    </Note>

    <Note>
    Control UI Talk verwendet OpenAI-Browser-Echtzeit-Sitzungen mit einem vom Gateway
    geprägten kurzlebigen Client-Secret und einem direkten Browser-WebRTC-SDP-Austausch mit der
    OpenAI Realtime API. Eine Live-Verifizierung für Maintainer ist verfügbar mit
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    der OpenAI-Teil prägt ein Client-Secret in Node, generiert ein Browser-SDP-Angebot
    mit simulierten Mikrofonmedien, sendet es an OpenAI und wendet die SDP-Antwort an,
    ohne Secrets zu protokollieren.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI-Endpunkte

Der gebündelte `openai`-Provider kann eine Azure OpenAI-Ressource für die Bildgenerierung
verwenden, indem die Basis-URL überschrieben wird. Auf dem Bildgenerierungspfad erkennt OpenClaw
Azure-Hostnamen auf `models.providers.openai.baseUrl` und wechselt automatisch zur
Anfrageform von Azure.

<Note>
Echtzeit-Stimme verwendet einen separaten Konfigurationspfad
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
und wird von `models.providers.openai.baseUrl` nicht beeinflusst. Siehe das Accordion **Echtzeit-Stimme**
unter [Stimme und Sprache](#voice-and-speech) für die Azure-Einstellungen.
</Note>

Verwenden Sie Azure OpenAI, wenn:

- Sie bereits ein Azure OpenAI-Abonnement, Kontingent oder Enterprise Agreement haben
- Sie regionale Datenresidenz oder Compliance-Kontrollen benötigen, die Azure bereitstellt
- Sie Datenverkehr innerhalb einer bestehenden Azure-Tenancy halten möchten

### Konfiguration

Für die Azure-Bildgenerierung über den gebündelten `openai`-Provider richten Sie
`models.providers.openai.baseUrl` auf Ihre Azure-Ressource aus und setzen `apiKey` auf
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

OpenClaw erkennt diese Azure-Host-Suffixe für die Azure-Bildgenerierungsroute:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Für Bildgenerierungsanfragen auf einem erkannten Azure-Host führt OpenClaw Folgendes aus:

- Sendet den Header `api-key` anstelle von `Authorization: Bearer`
- Verwendet deployment-bezogene Pfade (`/openai/deployments/{deployment}/...`)
- Hängt `?api-version=...` an jede Anfrage an
- Verwendet ein Standard-Anfrage-Timeout von 600 s für Azure-Bildgenerierungsaufrufe.
  `timeoutMs`-Werte pro Aufruf überschreiben diesen Standard weiterhin.

Andere Basis-URLs (öffentliches OpenAI, OpenAI-kompatible Proxys) behalten die standardmäßige
OpenAI-Bildanfrageform bei.

<Note>
Azure-Routing für den Bildgenerierungspfad des `openai`-Providers erfordert
OpenClaw 2026.4.22 oder neuer. Frühere Versionen behandeln jede benutzerdefinierte
`openai.baseUrl` wie den öffentlichen OpenAI-Endpunkt und schlagen bei Azure-
Bild-Deployments fehl.
</Note>

### API-Version

Setzen Sie `AZURE_OPENAI_API_VERSION`, um eine bestimmte Azure Preview- oder GA-Version
für den Azure-Bildgenerierungspfad festzulegen:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Der Standard ist `2024-12-01-preview`, wenn die Variable nicht gesetzt ist.

### Modellnamen sind Deployment-Namen

Azure OpenAI bindet Modelle an Deployments. Für Azure-Bildgenerierungsanfragen,
die über den gebündelten `openai`-Provider geroutet werden, muss das Feld `model` in OpenClaw
der **Azure-Deployment-Name** sein, den Sie im Azure-Portal konfiguriert haben, nicht
die öffentliche OpenAI-Modell-ID.

Wenn Sie ein Deployment mit dem Namen `gpt-image-2-prod` erstellen, das `gpt-image-2` bereitstellt:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Dieselbe Deployment-Namen-Regel gilt für Bildgenerierungsaufrufe, die über
den gebündelten `openai`-Provider geroutet werden.

### Regionale Verfügbarkeit

Azure-Bildgenerierung ist derzeit nur in einer Teilmenge von Regionen verfügbar
(zum Beispiel `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Prüfen Sie die aktuelle Regionsliste von Microsoft, bevor Sie ein
Deployment erstellen, und bestätigen Sie, dass das spezifische Modell in Ihrer Region angeboten wird.

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
die versteckten Zuordnungs-Header von OpenClaw — siehe das Accordion **Native vs OpenAI-compatible
routes** unter [Erweiterte Konfiguration](#advanced-configuration).

Für Chat- oder Responses-Datenverkehr auf Azure (über Bildgenerierung hinaus) verwenden Sie den
Onboarding-Ablauf oder eine dedizierte Azure-Provider-Konfiguration — `openai.baseUrl` allein
übernimmt nicht die Azure-API-/Auth-Form. Es gibt einen separaten
`azure-openai-responses/*`-Provider; siehe das Server-seitige Compaction-Accordion unten.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw verwendet WebSocket-first mit SSE-Fallback (`"auto"`) für sowohl `openai/*` als auch `openai-codex/*`.

    Im Modus `"auto"`:
    - Wiederholt OpenClaw einen frühen WebSocket-Fehler einmal, bevor auf SSE zurückgefallen wird
    - Markiert OpenClaw WebSocket nach einem Fehler für etwa 60 Sekunden als eingeschränkt und verwendet während der Abkühlphase SSE
    - Hängt stabile Header für Sitzungs- und Turn-Identität für Wiederholungen und Neuverbindungen an
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
    - [Streaming API-Antworten (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket-Aufwärmung">
    OpenClaw aktiviert WebSocket-Aufwärmung standardmäßig für `openai/*` und `openai-codex/*`, um die Latenz der ersten Turn zu reduzieren.

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

  <Accordion title="Schneller Modus">
    OpenClaw stellt einen gemeinsamen Umschalter für den schnellen Modus für `openai/*` und `openai-codex/*` bereit:

    - **Chat/UI:** `/fast status|on|off`
    - **Konfiguration:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Wenn aktiviert, ordnet OpenClaw den Schnellmodus der OpenAI-Prioritätsverarbeitung zu (`service_tier = "priority"`). Bestehende `service_tier`-Werte bleiben erhalten, und der Schnellmodus schreibt `reasoning` oder `text.verbosity` nicht um.

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
    Sitzungsüberschreibungen haben Vorrang vor der Konfiguration. Wenn Sie die Sitzungsüberschreibung in der Sitzungs-UI löschen, kehrt die Sitzung zum konfigurierten Standard zurück.
    </Note>

  </Accordion>

  <Accordion title="Prioritätsverarbeitung (service_tier)">
    Die API von OpenAI stellt Prioritätsverarbeitung über `service_tier` bereit. Legen Sie sie in OpenClaw pro Modell fest:

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
    `serviceTier` wird nur an native OpenAI-Endpunkte (`api.openai.com`) und native Codex-Endpunkte (`chatgpt.com/backend-api`) weitergeleitet. Wenn Sie einen der Provider über einen Proxy weiterleiten, lässt OpenClaw `service_tier` unverändert.
    </Warning>

  </Accordion>

  <Accordion title="Serverseitige Compaction (Responses API)">
    Für direkte OpenAI-Responses-Modelle (`openai/*` auf `api.openai.com`) aktiviert der Pi-Harness-Stream-Wrapper des OpenAI-Plugins automatisch serverseitige Compaction:

    - Erzwingt `store: true` (sofern die Modellkompatibilität nicht `supportsStore: false` setzt)
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
    `responsesServerCompaction` steuert nur das Einfügen von `context_management`. Direkte OpenAI-Responses-Modelle erzwingen weiterhin `store: true`, sofern die Kompatibilität nicht `supportsStore: false` setzt.
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

    Mit `strict-agentic`:
    - Behandelt OpenClaw einen reinen Planungsdurchlauf nicht mehr als erfolgreichen Fortschritt, wenn eine Tool-Aktion verfügbar ist
    - Wiederholt OpenClaw den Durchlauf mit einer Steuerung zum sofortigen Handeln
    - Aktiviert OpenClaw `update_plan` für umfangreichere Arbeit automatisch
    - Zeigt OpenClaw einen expliziten blockierten Zustand an, wenn das Modell weiterhin plant, ohne zu handeln

    <Note>
    Nur auf Ausführungen der OpenAI- und Codex-GPT-5-Familie beschränkt. Andere Provider und ältere Modellfamilien behalten das Standardverhalten bei.
    </Note>

  </Accordion>

  <Accordion title="Native vs. OpenAI-kompatible Routen">
    OpenClaw behandelt direkte OpenAI-, Codex- und Azure-OpenAI-Endpunkte anders als generische OpenAI-kompatible `/v1`-Proxys:

    **Native Routen** (`openai/*`, Azure OpenAI):
    - Behalten `reasoning: { effort: "none" }` nur für Modelle bei, die den OpenAI-Aufwand `none` unterstützen
    - Lassen deaktiviertes Reasoning für Modelle oder Proxys weg, die `reasoning.effort: "none"` ablehnen
    - Setzen Tool-Schemas standardmäßig auf den strikten Modus
    - Hängen versteckte Zuordnungsheader nur auf verifizierten nativen Hosts an
    - Behalten OpenAI-spezifische Anfrageformung bei (`service_tier`, `store`, Reasoning-Kompatibilität, Prompt-Cache-Hinweise)

    **Proxy-/kompatible Routen:**
    - Verwenden ein weniger striktes Kompatibilitätsverhalten
    - Entfernen Completions-`store` aus nicht nativen `openai-completions`-Payloads
    - Akzeptieren erweitertes `params.extra_body`/`params.extraBody`-Durchleitungs-JSON für OpenAI-kompatible Completions-Proxys
    - Akzeptieren `params.chat_template_kwargs` für OpenAI-kompatible Completions-Proxys wie vLLM
    - Erzwingen keine strikten Tool-Schemas oder nur für native Routen vorgesehenen Header

    Azure OpenAI verwendet nativen Transport und Kompatibilitätsverhalten, erhält aber nicht die versteckten Zuordnungsheader.

  </Accordion>
</AccordionGroup>

## Verwandt

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
