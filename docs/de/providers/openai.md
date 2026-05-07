---
read_when:
    - Sie möchten OpenAI-Modelle in OpenClaw verwenden
    - Sie möchten die Codex-Abonnementauthentifizierung statt API-Schlüsseln verwenden
    - Sie benötigen ein strengeres Ausführungsverhalten für GPT-5-Agenten
summary: OpenAI über API-Schlüssel oder ein Codex-Abonnement in OpenClaw verwenden
title: OpenAI
x-i18n:
    generated_at: "2026-05-07T13:25:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a37c0b2c227674b6762aea70ce6d640d49044117c9244377058032ade561d6b
    source_path: providers/openai.md
    workflow: 16
---

OpenAI stellt Entwickler-APIs für GPT-Modelle bereit, und Codex ist auch als
Coding-Agent für ChatGPT-Tarife über die Codex-Clients von OpenAI verfügbar. OpenClaw hält diese
Oberflächen getrennt, damit die Konfiguration vorhersehbar bleibt.

OpenClaw verwendet `openai/*` als kanonische OpenAI-Modellroute. Eingebettete Agent-
Turns auf OpenAI-Modellen laufen standardmäßig über die native Codex-App-Server-Runtime;
direkte Authentifizierung per OpenAI-API-Schlüssel bleibt für Nicht-Agent-OpenAI-
Oberflächen wie Bilder, Embeddings, Sprache und Realtime verfügbar.

- **Agent-Modelle** - `openai/*`-Modelle über die Codex-Runtime; melden Sie sich mit
  `openai-codex`-Authentifizierung für die Nutzung eines ChatGPT-/Codex-Abonnements an, oder konfigurieren Sie ein
  `openai-codex`-API-Schlüsselprofil, wenn Sie bewusst API-Schlüssel-Authentifizierung verwenden möchten.
- **Nicht-Agent-OpenAI-APIs** - direkter OpenAI-Platform-Zugriff mit nutzungsbasierter
  Abrechnung über `OPENAI_API_KEY` oder das OpenAI-API-Schlüssel-Onboarding.
- **Legacy-Konfiguration** - `openai-codex/*`-Modellreferenzen werden durch
  `openclaw doctor --fix` zu `openai/*` plus der Codex-Runtime repariert.

OpenAI unterstützt die Nutzung von Abonnement-OAuth in externen Tools und Workflows wie OpenClaw ausdrücklich.

Provider, Modell, Runtime und Kanal sind getrennte Ebenen. Wenn diese Bezeichnungen
durcheinandergeraten, lesen Sie [Agent-Runtimes](/de/concepts/agent-runtimes), bevor
Sie die Konfiguration ändern.

## Schnellauswahl

| Ziel                                                 | Verwenden                                               | Hinweise                                                              |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| ChatGPT-/Codex-Abonnement mit nativer Codex-Runtime | `openai/gpt-5.5`                                        | Standardmäßige OpenAI-Agent-Einrichtung. Melden Sie sich mit `openai-codex`-Authentifizierung an. |
| Direkte API-Schlüssel-Abrechnung für Agent-Modelle   | `openai/gpt-5.5` plus ein `openai-codex`-API-Schlüsselprofil | Verwenden Sie `auth.order.openai-codex`, um dieses Profil zu bevorzugen. |
| Direkte API-Schlüssel-Abrechnung über explizites PI  | `openai/gpt-5.5` plus `agentRuntime.id: "pi"`           | Wählen Sie ein normales `openai`-API-Schlüsselprofil aus.             |
| Aktuellster ChatGPT-Instant-API-Alias                | `openai/chat-latest`                                    | Nur direkter API-Schlüssel. Beweglicher Alias für Experimente, nicht der Standard. |
| ChatGPT-/Codex-Abonnementauthentifizierung über explizites PI | `openai/gpt-5.5` plus `agentRuntime.id: "pi"`           | Wählen Sie ein `openai-codex`-Authentifizierungsprofil für die Kompatibilitätsroute aus. |
| Bilderzeugung oder -bearbeitung                      | `openai/gpt-image-2`                                    | Funktioniert entweder mit `OPENAI_API_KEY` oder OpenAI-Codex-OAuth.  |
| Bilder mit transparentem Hintergrund                 | `openai/gpt-image-1.5`                                  | Verwenden Sie `outputFormat=png` oder `webp` und `openai.background=transparent`. |

## Namensübersicht

Die Namen sind ähnlich, aber nicht austauschbar:

| Name, den Sie sehen                 | Ebene               | Bedeutung                                                                                         |
| ---------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Provider-Präfix     | Kanonische OpenAI-Modellroute; Agent-Turns verwenden die Codex-Runtime.                           |
| `openai-codex`                     | Authentifizierungs-/Profilpräfix | OpenAI-Codex-OAuth-/Abonnement-Authentifizierungsprofil-Provider.                                 |
| `codex` plugin                     | Plugin              | Gebündeltes OpenClaw-Plugin, das die native Codex-App-Server-Runtime und `/codex`-Chatsteuerungen bereitstellt. |
| `agentRuntime.id: codex`           | Agent-Runtime       | Erzwingt den nativen Codex-App-Server-Harness für eingebettete Turns.                             |
| `/codex ...`                       | Chat-Befehlssatz    | Codex-App-Server-Threads aus einer Unterhaltung binden/steuern.                                   |
| `runtime: "acp", agentId: "codex"` | ACP-Sitzungsroute   | Expliziter Fallback-Pfad, der Codex über ACP/acpx ausführt.                                       |

Das bedeutet, dass eine Konfiguration bewusst sowohl `openai/*`-Modellreferenzen als auch
`openai-codex`-Authentifizierungsprofile enthalten kann. `openclaw doctor --fix` schreibt Legacy-
`openai-codex/*`-Modellreferenzen auf die kanonische OpenAI-Modellroute um.

<Note>
GPT-5.5 ist sowohl über direkten OpenAI-Platform-Zugriff per API-Schlüssel als auch über
Abonnement-/OAuth-Routen verfügbar. Für ChatGPT-/Codex-Abonnement plus native Codex-
Ausführung verwenden Sie `openai/gpt-5.5`; eine nicht gesetzte Runtime-Konfiguration wählt jetzt den Codex-
Harness für OpenAI-Agent-Turns aus. Verwenden Sie OpenAI-API-Schlüsselprofile nur, wenn Sie
direkte API-Schlüssel-Authentifizierung für ein OpenAI-Agent-Modell wünschen.
</Note>

<Note>
OpenAI-Agent-Modell-Turns erfordern das gebündelte Codex-App-Server-Plugin. Explizite
PI-Runtime-Konfiguration bleibt als Opt-in-Kompatibilitätsroute verfügbar. Wenn PI
explizit mit einem `openai-codex`-Authentifizierungsprofil ausgewählt wird, behält OpenClaw die
öffentliche Modellreferenz als `openai/*` bei und routet PI intern über den Legacy-
Codex-Auth-Transport. Führen Sie `openclaw doctor --fix` aus, um veraltete
`openai-codex/*`-Modellreferenzen oder alte PI-Sitzungs-Pins zu reparieren, die nicht aus
expliziter Runtime-Konfiguration stammen.
</Note>

## OpenClaw-Funktionsabdeckung

| OpenAI-Fähigkeit         | OpenClaw-Oberfläche                                             | Status                                                 |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | `openai/<model>`-Modell-Provider                                 | Ja                                                     |
| Codex-Abonnementmodelle   | `openai/<model>` mit `openai-codex` OAuth                        | Ja                                                     |
| Legacy-Codex-Modellreferenzen | `openai-codex/<model>`                                       | Durch doctor zu `openai/<model>` repariert             |
| Codex-App-Server-Harness  | `openai/<model>` mit ausgelassener Runtime oder `agentRuntime.id: codex` | Ja                                             |
| Serverseitige Websuche    | Natives OpenAI-Responses-Tool                                    | Ja, wenn Websuche aktiviert ist und kein Provider festgelegt wurde |
| Bilder                    | `image_generate`                                                 | Ja                                                     |
| Videos                    | `video_generate`                                                 | Ja                                                     |
| Text-zu-Sprache           | `messages.tts.provider: "openai"` / `tts`                        | Ja                                                     |
| Batch-Sprache-zu-Text     | `tools.media.audio` / Medienverständnis                          | Ja                                                     |
| Streaming-Sprache-zu-Text | Voice Call `streaming.provider: "openai"`                        | Ja                                                     |
| Realtime-Sprache          | Voice Call `realtime.provider: "openai"` / Control UI Talk       | Ja                                                     |
| Embeddings                | Memory-Embedding-Provider                                        | Ja                                                     |

## Memory-Embeddings

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

Für OpenAI-kompatible Endpunkte, die asymmetrische Embedding-Labels erfordern, setzen Sie
`queryInputType` und `documentInputType` unter `memorySearch`. OpenClaw leitet
diese als providerspezifische `input_type`-Anforderungsfelder weiter: Abfrage-Embeddings verwenden
`queryInputType`; indexierte Memory-Chunks und Batch-Indexierung verwenden
`documentInputType`. Das vollständige Beispiel finden Sie in der [Memory-Konfigurationsreferenz](/de/reference/memory-config#provider-specific-config).

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="API-Schlüssel (OpenAI Platform)">
    **Am besten für:** direkten API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="Ihren API-Schlüssel abrufen">
        Erstellen oder kopieren Sie einen API-Schlüssel aus dem [OpenAI Platform dashboard](https://platform.openai.com/api-keys).
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

    | Modellreferenz         | Runtime-Konfiguration    | Route                       | Authentifizierung |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | ausgelassen / `agentRuntime.id: "codex"` | Codex-App-Server-Harness | `openai-codex`-Profil |
    | `openai/gpt-5.4-mini` | ausgelassen / `agentRuntime.id: "codex"` | Codex-App-Server-Harness | `openai-codex`-Profil |
    | `openai/gpt-5.5`      | `agentRuntime.id: "pi"`              | PI-eingebettete Runtime  | `openai`-Profil oder ausgewähltes `openai-codex`-Profil |

    <Note>
    `openai/*`-Agent-Modelle verwenden den Codex-App-Server-Harness. Um API-Schlüssel-
    Authentifizierung für ein Agent-Modell zu verwenden, erstellen Sie ein `openai-codex`-API-Schlüsselprofil und ordnen
    es mit `auth.order.openai-codex` an; `OPENAI_API_KEY` bleibt der direkte
    Fallback für Nicht-Agent-OpenAI-API-Oberflächen.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Um das aktuelle Instant-Modell von ChatGPT über die OpenAI-API auszuprobieren, setzen Sie das Modell
    auf `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` ist ein beweglicher Alias. OpenAI dokumentiert ihn als das aktuellste Instant-
    Modell, das in ChatGPT verwendet wird, und empfiehlt `gpt-5.5` für die API-Nutzung in Produktion. Behalten Sie daher
    `openai/gpt-5.5` als stabilen Standard bei, sofern Sie nicht ausdrücklich dieses
    Alias-Verhalten wünschen. Der Alias akzeptiert derzeit nur `medium`-Textausführlichkeit, daher
    normalisiert OpenClaw inkompatible OpenAI-Textausführlichkeits-Overrides für dieses
    Modell.

    <Warning>
    OpenClaw stellt `openai/gpt-5.3-codex-spark` **nicht** bereit. Live-OpenAI-API-Anfragen lehnen dieses Modell ab, und der aktuelle Codex-Katalog stellt es ebenfalls nicht bereit.
    </Warning>

  </Tab>

  <Tab title="Codex-Abonnement">
    **Am besten für:** die Nutzung Ihres ChatGPT-/Codex-Abonnements mit nativer Codex-App-Server-Ausführung statt eines separaten API-Schlüssels. Codex Cloud erfordert eine ChatGPT-Anmeldung.

    <Steps>
      <Step title="Codex OAuth ausführen">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oder führen Sie OAuth direkt aus:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Für headless oder callback-unfreundliche Setups fügen Sie `--device-code` hinzu, um sich mit einem ChatGPT-Gerätecode-Flow statt über den localhost-Browser-Callback anzumelden:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Die kanonische OpenAI-Modellroute verwenden">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Für den Standardpfad ist keine Runtime-Konfiguration erforderlich. OpenAI-Agentendurchläufe
        wählen automatisch die native Codex-App-Server-Runtime aus, und OpenClaw
        installiert oder repariert das gebündelte Codex-Plugin, wenn diese Route gewählt wird.
      </Step>
      <Step title="Prüfen, ob Codex-Authentifizierung verfügbar ist">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Nachdem der Gateway läuft, senden Sie `/codex status` oder `/codex models`
        im Chat, um die native App-Server-Runtime zu prüfen.
      </Step>
    </Steps>

    ### Routenübersicht

    | Modellreferenz | Runtime-Konfiguration | Route | Authentifizierung |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | ausgelassen / `agentRuntime.id: "codex"` | Nativer Codex-App-Server-Harness | Codex-Anmeldung oder ausgewähltes `openai-codex`-Profil |
    | `openai/gpt-5.5` | `agentRuntime.id: "pi"` | Eingebettete PI-Runtime mit internem Codex-Auth-Transport | Ausgewähltes `openai-codex`-Profil |
    | `openai-codex/gpt-5.5` | von doctor repariert | Legacy-Route, umgeschrieben zu `openai/gpt-5.5` | Vorhandenes `openai-codex`-Profil |

    <Warning>
    Konfigurieren Sie keine älteren Modellreferenzen wie `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` oder
    `openai-codex/gpt-5.3*`. ChatGPT-/Codex-OAuth-Konten lehnen
    diese Modelle inzwischen ab. Verwenden Sie `openai/gpt-5.5`; OpenAI-Agentendurchläufe wählen jetzt standardmäßig die Codex-
    Runtime aus.
    </Warning>

    <Note>
    Verwenden Sie die Provider-ID `openai-codex` weiterhin für Auth-/Profilbefehle. Das
    Modellpräfix `openai-codex/*` ist Legacy-Konfiguration, die von doctor repariert wird. Melden Sie sich für die
    übliche Einrichtung mit Abonnement plus nativer Runtime mit `openai-codex` an,
    behalten Sie die Modellreferenz jedoch als `openai/gpt-5.5` bei.
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

    <Note>
    Das Onboarding importiert kein OAuth-Material mehr aus `~/.codex`. Melden Sie sich mit Browser-OAuth (Standard) oder dem obigen Gerätecode-Ablauf an — OpenClaw verwaltet die resultierenden Anmeldedaten in seinem eigenen Agent-Auth-Speicher.
    </Note>

    ### Codex-OAuth-Routing prüfen und wiederherstellen

    Verwenden Sie diese Befehle, um zu sehen, welche Modell-, Runtime- und Auth-Route Ihr Standard-
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

    Wenn eine ältere Konfiguration noch `openai-codex/gpt-*` oder einen veralteten OpenAI-PI-
    Session-Pin ohne explizite Runtime-Konfiguration enthält, reparieren Sie sie:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Wenn `models auth list --provider openai-codex` kein verwendbares Profil anzeigt, melden Sie sich
    erneut an:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` bleibt die Auth-/Profil-Provider-ID. `openai/*` ist die
    Modellroute für OpenAI-Agentendurchläufe über Codex.

    ### Statusanzeige

    Chat `/status` zeigt, welche Modell-Runtime für die aktuelle Sitzung aktiv ist.
    Der gebündelte Codex-App-Server-Harness erscheint als `Runtime: OpenAI Codex` für
    OpenAI-Agentenmodell-Durchläufe. Veraltete PI-Session-Pins werden zu Codex repariert, es sei denn,
    die Konfiguration pinnt PI explizit.

    ### Doctor-Warnung

    Wenn `openai-codex/*`-Routen oder veraltete OpenAI-PI-Pins in der Konfiguration oder im
    Sitzungszustand verbleiben, schreibt `openclaw doctor --fix` sie zu `openai/*` mit der
    Codex-Runtime um, es sei denn, PI ist explizit konfiguriert.

    ### Kontextfenster-Obergrenze

    OpenClaw behandelt Modellmetadaten und die Runtime-Kontextobergrenze als separate Werte.

    Für `openai/gpt-5.5` über den Codex-OAuth-Katalog:

    - Nativer `contextWindow`: `1000000`
    - Standardmäßige Runtime-Obergrenze `contextTokens`: `272000`

    Die kleinere Standardobergrenze hat in der Praxis bessere Latenz- und Qualitätseigenschaften. Überschreiben Sie sie mit `contextTokens`:

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
    vorhanden sind. Wenn die Live-Codex-Erkennung die Zeile `gpt-5.5` auslässt, obwohl
    das Konto authentifiziert ist, synthetisiert OpenClaw diese OAuth-Modellzeile, damit
    Cron-, Sub-Agent- und konfigurierte Standardmodell-Läufe nicht mit
    `Unknown model` fehlschlagen.

  </Tab>
</Tabs>

## Native Codex-App-Server-Authentifizierung

Der native Codex-App-Server-Harness verwendet `openai/*`-Modellreferenzen plus ausgelassene
Runtime-Konfiguration oder `agentRuntime.id: "codex"`, seine Authentifizierung ist aber weiterhin
kontobasiert. OpenClaw
wählt die Authentifizierung in dieser Reihenfolge aus:

1. Ein explizites OpenClaw-Auth-Profil `openai-codex`, das an den Agent gebunden ist.
2. Das vorhandene Konto des App-Servers, etwa eine lokale Codex-CLI-ChatGPT-Anmeldung.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn der App-Server kein Konto meldet und weiterhin
   OpenAI-Authentifizierung benötigt.

Das bedeutet, dass eine lokale ChatGPT-/Codex-Abonnementanmeldung nicht ersetzt wird, nur
weil der Gateway-Prozess auch `OPENAI_API_KEY` für direkte OpenAI-Modelle
oder Einbettungen hat. Der Env-API-Key-Fallback ist nur der lokale stdio-Pfad ohne Konto; er
wird nicht an WebSocket-App-Server-Verbindungen gesendet. Wenn ein Codex-Profil im Abonnementstil
ausgewählt ist, hält OpenClaw auch `CODEX_API_KEY` und `OPENAI_API_KEY`
aus dem erzeugten stdio-App-Server-Kindprozess heraus und sendet die ausgewählten Anmeldedaten
über den App-Server-Login-RPC.

## Bilderzeugung

Das gebündelte `openai`-Plugin registriert Bilderzeugung über das Tool `image_generate`.
Es unterstützt sowohl Bilderzeugung mit OpenAI-API-Key als auch Codex-OAuth-Bilderzeugung
über dieselbe Modellreferenz `openai/gpt-image-2`.

| Fähigkeit                | OpenAI-API-Key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Modellreferenz                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Authentifizierung                      | `OPENAI_API_KEY`                   | OpenAI-Codex-OAuth-Anmeldung           |
| Transport                 | OpenAI Images API                  | Codex Responses Backend              |
| Maximale Bilder pro Anfrage    | 4                                  | 4                                    |
| Bearbeitungsmodus                 | Aktiviert (bis zu 5 Referenzbilder) | Aktiviert (bis zu 5 Referenzbilder)   |
| Größenüberschreibungen            | Unterstützt, einschließlich 2K-/4K-Größen   | Unterstützt, einschließlich 2K-/4K-Größen     |
| Seitenverhältnis / Auflösung | Nicht an OpenAI Images API weitergeleitet | Wird, wenn sicher, einer unterstützten Größe zugeordnet |

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

`gpt-image-2` ist der Standard sowohl für OpenAI-Text-zu-Bild-Erzeugung als auch für Bildbearbeitung.
`gpt-image-1.5`, `gpt-image-1` und `gpt-image-1-mini` bleiben als
explizite Modellüberschreibungen verwendbar. Verwenden Sie `openai/gpt-image-1.5` für PNG-/WebP-Ausgabe
mit transparentem Hintergrund; die aktuelle API von `gpt-image-2` lehnt
`background: "transparent"` ab.

Für eine Anfrage mit transparentem Hintergrund sollten Agenten `image_generate` mit
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` oder `"webp"` und
`background: "transparent"` aufrufen; die ältere Provider-Option `openai.background` wird
weiterhin akzeptiert. OpenClaw schützt außerdem die öffentlichen OpenAI- und
OpenAI-Codex-OAuth-Routen, indem standardmäßige transparente `openai/gpt-image-2`-
Anfragen zu `gpt-image-1.5` umgeschrieben werden; Azure und benutzerdefinierte OpenAI-kompatible Endpunkte behalten
ihre konfigurierten Deployment-/Modellnamen.

Dieselbe Einstellung wird für Headless-CLI-Läufe verfügbar gemacht:

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
Zugriffstoken auf und sendet Bildanfragen über das Codex Responses Backend. Es
versucht für diese Anfrage nicht zuerst `OPENAI_API_KEY` und fällt nicht stillschweigend auf einen API-Key zurück.
Konfigurieren Sie `models.providers.openai` explizit mit einem API-Key,
einer benutzerdefinierten Basis-URL oder einem Azure-Endpunkt, wenn Sie stattdessen die direkte OpenAI-Images-API-
Route verwenden möchten.
Wenn sich dieser benutzerdefinierte Bildendpunkt in einem vertrauenswürdigen LAN/einer privaten Adresse befindet, setzen Sie auch
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw hält
private/interne OpenAI-kompatible Bildendpunkte blockiert, sofern diese Opt-in-Option nicht
vorhanden ist.

Erzeugen:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Transparentes PNG erzeugen:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Bearbeiten:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Videoerzeugung

Das gebündelte `openai`-Plugin registriert Videoerzeugung über das Tool `video_generate`.

| Fähigkeit       | Wert                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Standardmodell    | `openai/sora-2`                                                                   |
| Modi            | Text-zu-Video, Bild-zu-Video, Einzelvideo-Bearbeitung                                  |
| Referenzeingaben | 1 Bild oder 1 Video                                                                |
| Größenüberschreibungen   | Unterstützt                                                                         |
| Weitere Überschreibungen  | `aspectRatio`, `resolution`, `audio`, `watermark` werden mit einer Tool-Warnung ignoriert |

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

OpenClaw fügt einen gemeinsamen GPT-5-Prompt-Beitrag für Läufe der GPT-5-Familie über Provider hinweg hinzu. Er wird nach Modell-ID angewendet, sodass `openai/gpt-5.5`, Legacy-Referenzen vor der Reparatur wie `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` und andere kompatible GPT-5-Referenzen dieselbe Überlagerung erhalten. Ältere GPT-4.x-Modelle nicht.

Der gebündelte native Codex-Harness verwendet dasselbe GPT-5-Verhalten und dieselbe Heartbeat-Überlagerung über Codex-App-Server-Entwickleranweisungen, sodass `openai/gpt-5.x`-Sitzungen, die über `agentRuntime.id: "codex"` erzwungen werden, dieselbe Anleitung für konsequente Nachverfolgung und proaktive Heartbeats behalten, auch wenn Codex den restlichen Harness-Prompt besitzt.

Der GPT-5-Beitrag ergänzt einen markierten Verhaltensvertrag für Persona-Persistenz, Ausführungssicherheit, Tool-Disziplin, Ausgabeform, Abschlussprüfungen und Verifizierung. Kanalspezifisches Antwortverhalten und Verhalten für stille Nachrichten bleiben im gemeinsamen OpenClaw-Systemprompt und in der Richtlinie für ausgehende Zustellung. Die GPT-5-Anleitung ist für passende Modelle immer aktiviert. Die freundliche Interaktionsstil-Ebene ist separat und konfigurierbar.

| Wert                   | Wirkung                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (Standard) | Freundliche Interaktionsstil-Ebene aktivieren |
| `"on"`                 | Alias für `"friendly"`                      |
| `"off"`                | Nur die freundliche Stil-Ebene deaktivieren |

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
Werte unterscheiden zur Laufzeit nicht zwischen Groß- und Kleinschreibung, sodass `"Off"` und `"off"` beide die freundliche Stil-Ebene deaktivieren.
</Tip>

<Note>
Das veraltete `plugins.entries.openai.config.personality` wird weiterhin als Kompatibilitäts-Fallback gelesen, wenn die gemeinsame Einstellung `agents.defaults.promptOverlays.gpt5.personality` nicht gesetzt ist.
</Note>

## Stimme und Sprache

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    Das mitgelieferte `openai` Plugin registriert Sprachsynthese für die Oberfläche `messages.tts`.

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

    `extraBody` wird nach den von OpenClaw generierten Feldern in das JSON der Anfrage an `/audio/speech` zusammengeführt. Verwenden Sie es daher für OpenAI-kompatible Endpunkte, die zusätzliche Schlüssel wie `lang` erfordern. Prototyp-Schlüssel werden ignoriert.

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
    Das mitgelieferte `openai` Plugin registriert Batch-Spracherkennung über
    OpenClaws Transkriptionsoberfläche für Medienverständnis.

    - Standardmodell: `gpt-4o-transcribe`
    - Endpunkt: OpenAI REST `/v1/audio/transcriptions`
    - Eingabepfad: Multipart-Audiodatei-Upload
    - Unterstützt von OpenClaw überall dort, wo eingehende Audiotranskription
      `tools.media.audio` verwendet, einschließlich Discord-Sprachkanal-Segmenten und
      Audioanhängen von Kanälen

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
    gemeinsamen Audiomedien-Konfiguration oder der Transkriptionsanfrage pro Aufruf
    bereitgestellt werden.

  </Accordion>

  <Accordion title="Realtime transcription">
    Das mitgelieferte `openai` Plugin registriert Echtzeittranskription für das Voice Call Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Sprache | `...openai.language` | (nicht gesetzt) |
    | Prompt | `...openai.prompt` | (nicht gesetzt) |
    | Stilledauer | `...openai.silenceDurationMs` | `800` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | API-Schlüssel | `...openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |

    <Note>
    Verwendet eine WebSocket-Verbindung zu `wss://api.openai.com/v1/realtime` mit G.711-u-law-Audio (`g711_ulaw` / `audio/pcmu`). Dieser Streaming-Provider ist für den Echtzeittranskriptionspfad von Voice Call vorgesehen; Discord Voice zeichnet derzeit kurze Segmente auf und verwendet stattdessen den Batch-Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    Das mitgelieferte `openai` Plugin registriert Echtzeitstimme für das Voice Call Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Stimme | `...openai.voice` | `alloy` |
    | Temperatur | `...openai.temperature` | `0.8` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | Stilledauer | `...openai.silenceDurationMs` | `500` |
    | API-Schlüssel | `...openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |

    <Note>
    Unterstützt Azure OpenAI über die Konfigurationsschlüssel `azureEndpoint` und `azureDeployment` für Backend-Echtzeit-Brücken. Unterstützt bidirektionale Tool-Aufrufe. Verwendet das Audioformat G.711 u-law.
    </Note>

    <Note>
    Control UI Talk verwendet OpenAI-Browser-Echtzeitsitzungen mit einem vom Gateway
    ausgestellten kurzlebigen Client-Secret und einem direkten Browser-WebRTC-SDP-Austausch mit der
    OpenAI Realtime API. Maintainer-Live-Verifizierung ist verfügbar mit
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    der OpenAI-Abschnitt stellt ein Client-Secret in Node aus, erzeugt ein Browser-SDP-Angebot
    mit gefälschten Mikrofonmedien, sendet es an OpenAI und wendet die SDP-Antwort an,
    ohne Secrets zu protokollieren.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI-Endpunkte

Der mitgelieferte `openai` Provider kann für die Bildgenerierung auf eine Azure OpenAI-Ressource
ausgerichtet werden, indem die Basis-URL überschrieben wird. Im Bildgenerierungspfad erkennt OpenClaw
Azure-Hostnamen in `models.providers.openai.baseUrl` und wechselt automatisch zur
Anfrageform von Azure.

<Note>
Echtzeitstimme verwendet einen separaten Konfigurationspfad
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
und wird nicht von `models.providers.openai.baseUrl` beeinflusst. Siehe das Akkordeon **Echtzeitstimme**
unter [Stimme und Sprache](#voice-and-speech) für die Azure-Einstellungen.
</Note>

Verwenden Sie Azure OpenAI, wenn:

- Sie bereits ein Azure OpenAI-Abonnement, Kontingent oder eine Enterprise-Vereinbarung haben
- Sie regionale Datenresidenz oder Compliance-Kontrollen benötigen, die Azure bereitstellt
- Sie den Datenverkehr innerhalb eines bestehenden Azure-Mandanten halten möchten

### Konfiguration

Für Azure-Bildgenerierung über den mitgelieferten `openai` Provider zeigen Sie
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

OpenClaw erkennt diese Azure-Host-Suffixe für die Azure-Bildgenerierungsroute:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Für Bildgenerierungsanfragen an einen erkannten Azure-Host gilt in OpenClaw:

- Sendet den Header `api-key` statt `Authorization: Bearer`
- Verwendet deployment-spezifische Pfade (`/openai/deployments/{deployment}/...`)
- Hängt `?api-version=...` an jede Anfrage an
- Verwendet ein Standard-Anfrage-Timeout von 600 s für Azure-Bildgenerierungsaufrufe.
  `timeoutMs`-Werte pro Aufruf überschreiben diesen Standard weiterhin.

Andere Basis-URLs (öffentliches OpenAI, OpenAI-kompatible Proxys) behalten die standardmäßige
OpenAI-Anfrageform für Bilder bei.

<Note>
Azure-Routing für den Bildgenerierungspfad des `openai` Providers erfordert
OpenClaw 2026.4.22 oder neuer. Frühere Versionen behandeln jede benutzerdefinierte
`openai.baseUrl` wie den öffentlichen OpenAI-Endpunkt und schlagen bei Azure-Bild-Deployments fehl.
</Note>

### API-Version

Setzen Sie `AZURE_OPENAI_API_VERSION`, um eine bestimmte Azure-Preview- oder GA-Version
für den Azure-Bildgenerierungspfad festzulegen:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Der Standard ist `2024-12-01-preview`, wenn die Variable nicht gesetzt ist.

### Modellnamen sind Deployment-Namen

Azure OpenAI bindet Modelle an Deployments. Für Azure-Bildgenerierungsanfragen,
die über den mitgelieferten `openai` Provider geroutet werden, muss das Feld `model` in OpenClaw
der **Azure-Deployment-Name** sein, den Sie im Azure-Portal konfiguriert haben, nicht
die öffentliche OpenAI-Modell-ID.

Wenn Sie ein Deployment namens `gpt-image-2-prod` erstellen, das `gpt-image-2` bereitstellt:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Dieselbe Deployment-Namen-Regel gilt für Bildgenerierungsaufrufe, die über
den mitgelieferten `openai` Provider geroutet werden.

### Regionale Verfügbarkeit

Azure-Bildgenerierung ist derzeit nur in einer Teilmenge von Regionen verfügbar
(zum Beispiel `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Prüfen Sie Microsofts aktuelle Regionsliste, bevor Sie ein
Deployment erstellen, und bestätigen Sie, dass das spezifische Modell in Ihrer Region angeboten wird.

### Parameterunterschiede

Azure OpenAI und öffentliches OpenAI akzeptieren nicht immer dieselben Bildparameter.
Azure kann Optionen ablehnen, die öffentliches OpenAI erlaubt (zum Beispiel bestimmte
`background`-Werte bei `gpt-image-2`), oder sie nur für bestimmte Modellversionen
bereitstellen. Diese Unterschiede stammen von Azure und dem zugrunde liegenden Modell, nicht von
OpenClaw. Wenn eine Azure-Anfrage mit einem Validierungsfehler fehlschlägt, prüfen Sie den
Parametersatz, der von Ihrem spezifischen Deployment und Ihrer API-Version im
Azure-Portal unterstützt wird.

<Note>
Azure OpenAI verwendet natives Transport- und Kompatibilitätsverhalten, erhält jedoch nicht
die versteckten Attribution-Header von OpenClaw — siehe das Akkordeon **Native vs OpenAI-kompatible
Routen** unter [Erweiterte Konfiguration](#advanced-configuration).

Für Chat- oder Responses-Datenverkehr auf Azure (über Bildgenerierung hinaus) verwenden Sie den
Onboarding-Flow oder eine dedizierte Azure-Provider-Konfiguration — `openai.baseUrl` allein
übernimmt nicht die Azure-API-/Authentifizierungsform. Ein separater
`azure-openai-responses/*` Provider existiert; siehe
das Akkordeon zur serverseitigen Compaction unten.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw verwendet für `openai/*` zuerst WebSocket mit SSE-Fallback (`"auto"`).

    Im Modus `"auto"` führt OpenClaw Folgendes aus:
    - Wiederholt einen frühen WebSocket-Fehler einmal, bevor auf SSE zurückgefallen wird
    - Markiert WebSocket nach einem Fehler für etwa 60 Sekunden als beeinträchtigt und verwendet während der Abkühlphase SSE
    - Fügt stabile Header für Sitzungs- und Turn-Identität für Wiederholungen und erneute Verbindungen an
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
          },
        },
      },
    }
    ```

    Zugehörige OpenAI-Dokumentation:
    - [Realtime API mit WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming-API-Antworten (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket-Vorwärmung">
    OpenClaw aktiviert die WebSocket-Vorwärmung standardmäßig für `openai/*`, um die Latenz der ersten Antwort zu reduzieren.

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

  <Accordion title="Schnellmodus">
    OpenClaw stellt einen gemeinsamen Schnellmodus-Schalter für `openai/*` bereit:

    - **Chat/UI:** `/fast status|on|off`
    - **Konfiguration:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Wenn aktiviert, ordnet OpenClaw den Schnellmodus der OpenAI-Prioritätsverarbeitung zu (`service_tier = "priority"`). Vorhandene `service_tier`-Werte bleiben erhalten, und der Schnellmodus schreibt `reasoning` oder `text.verbosity` nicht um.

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
    Sitzungsüberschreibungen haben Vorrang vor der Konfiguration. Wenn Sie die Sitzungsüberschreibung in der Sitzungs-UI löschen, wird die Sitzung auf den konfigurierten Standard zurückgesetzt.
    </Note>

  </Accordion>

  <Accordion title="Prioritätsverarbeitung (service_tier)">
    Die OpenAI-API stellt Prioritätsverarbeitung über `service_tier` bereit. Legen Sie sie in OpenClaw pro Modell fest:

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

  <Accordion title="Strenger agentischer GPT-Modus">
    Für GPT-5-Familien-Ausführungen auf `openai/*` kann OpenClaw einen strengeren eingebetteten Ausführungsvertrag verwenden:

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
    - Behandelt OpenClaw eine reine Planungsrunde nicht mehr als erfolgreichen Fortschritt, wenn eine Tool-Aktion verfügbar ist
    - Wiederholt OpenClaw die Runde mit einer Aufforderung zum sofortigen Handeln
    - Aktiviert OpenClaw `update_plan` automatisch für umfangreiche Arbeit
    - Zeigt OpenClaw einen expliziten blockierten Zustand an, wenn das Modell weiter plant, ohne zu handeln

    <Note>
    Nur auf OpenAI- und Codex-GPT-5-Familien-Ausführungen beschränkt. Andere Provider und ältere Modellfamilien behalten das Standardverhalten bei.
    </Note>

  </Accordion>

  <Accordion title="Native gegenüber OpenAI-kompatiblen Routen">
    OpenClaw behandelt direkte OpenAI-, Codex- und Azure-OpenAI-Endpunkte anders als generische OpenAI-kompatible `/v1`-Proxys:

    **Native Routen** (`openai/*`, Azure OpenAI):
    - Behalten `reasoning: { effort: "none" }` nur für Modelle bei, die den OpenAI-Aufwand `none` unterstützen
    - Lassen deaktiviertes Reasoning für Modelle oder Proxys weg, die `reasoning.effort: "none"` ablehnen
    - Setzen Tool-Schemas standardmäßig auf den strikten Modus
    - Hängen versteckte Attribution-Header nur bei verifizierten nativen Hosts an
    - Behalten ausschließlich für OpenAI vorgesehene Anfrageanpassungen bei (`service_tier`, `store`, Reasoning-Kompatibilität, Prompt-Cache-Hinweise)

    **Proxy-/kompatible Routen:**
    - Verwenden lockereres Kompatibilitätsverhalten
    - Entfernen Completions-`store` aus nicht nativen `openai-completions`-Payloads
    - Akzeptieren erweitertes `params.extra_body`/`params.extraBody`-Pass-through-JSON für OpenAI-kompatible Completions-Proxys
    - Akzeptieren `params.chat_template_kwargs` für OpenAI-kompatible Completions-Proxys wie vLLM
    - Erzwingen keine strikten Tool-Schemas oder nur native Header

    Azure OpenAI verwendet nativen Transport und Kompatibilitätsverhalten, erhält aber keine versteckten Attribution-Header.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
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
