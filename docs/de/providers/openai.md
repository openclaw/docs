---
read_when:
    - Sie möchten OpenAI-Modelle in OpenClaw verwenden
    - Sie möchten die Codex-Abonnement-Authentifizierung anstelle von API-Schlüsseln verwenden
    - Sie benötigen strengeres Ausführungsverhalten für GPT-5-Agenten
summary: OpenAI über API-Schlüssel oder ein Codex-Abonnement in OpenClaw verwenden
title: OpenAI
x-i18n:
    generated_at: "2026-05-11T20:36:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: d63b8eff93ecffd85c2110f42044c26621ff50eb62c35b7cc99a07f0e6be1ffb
    source_path: providers/openai.md
    workflow: 16
---

OpenAI stellt Entwickler-APIs für GPT-Modelle bereit, und Codex ist außerdem als
Coding-Agent für ChatGPT-Abos über die Codex-Clients von OpenAI verfügbar. OpenClaw hält diese
Oberflächen getrennt, damit die Konfiguration vorhersehbar bleibt.

OpenClaw verwendet `openai/*` als kanonische OpenAI-Modellroute. Eingebettete Agenten-
Turns auf OpenAI-Modellen laufen standardmäßig über die native Codex-App-Server-Laufzeit;
direkte OpenAI-API-Key-Authentifizierung bleibt für Nicht-Agenten-OpenAI-
Oberflächen wie Bilder, Embeddings, Sprache und Realtime verfügbar.

- **Agentenmodelle** - `openai/*`-Modelle über die Codex-Laufzeit; melden Sie sich mit
  Codex-Authentifizierung für die Nutzung eines ChatGPT-/Codex-Abos an, oder konfigurieren Sie eine Codex-kompatible
  OpenAI-API-Key-Reserve, wenn Sie bewusst API-Key-Authentifizierung verwenden möchten.
- **Nicht-Agenten-OpenAI-APIs** - direkter OpenAI-Platform-Zugriff mit nutzungsbasierter
  Abrechnung über `OPENAI_API_KEY` oder OpenAI-API-Key-Onboarding.
- **Legacy-Konfiguration** - `openai-codex/*`-Modellrefs werden von
  `openclaw doctor --fix` zu `openai/*` plus der Codex-Laufzeit repariert.

OpenAI unterstützt ausdrücklich die Nutzung von Abonnement-OAuth in externen Tools und Workflows wie OpenClaw.

Provider, Modell, Laufzeit und Kanal sind separate Ebenen. Wenn diese Bezeichnungen
durcheinandergeraten, lesen Sie [Agenten-Laufzeiten](/de/concepts/agent-runtimes), bevor
Sie die Konfiguration ändern.

## Schnellauswahl

| Ziel                                                 | Verwenden                                                | Hinweise                                                              |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| ChatGPT-/Codex-Abo mit nativer Codex-Laufzeit        | `openai/gpt-5.5`                                         | Standardmäßige OpenAI-Agenteneinrichtung. Mit Codex-Auth anmelden.   |
| Direkte API-Key-Abrechnung für Agentenmodelle        | `openai/gpt-5.5` plus ein Codex-kompatibles API-Key-Profil | Verwenden Sie `auth.order.openai`, um die Reserve nach der Abo-Auth zu platzieren. |
| Direkte API-Key-Abrechnung über explizites PI        | `openai/gpt-5.5` plus Provider-/Modell-Laufzeit `pi`     | Wählen Sie ein normales `openai`-API-Key-Profil aus.                 |
| Neuester ChatGPT-Instant-API-Alias                   | `openai/chat-latest`                                     | Nur direkter API-Key. Veränderlicher Alias für Experimente, nicht der Standard. |
| ChatGPT-/Codex-Abo-Auth über explizites PI           | `openai/gpt-5.5` plus Provider-/Modell-Laufzeit `pi`     | Wählen Sie ein `openai-codex`-Auth-Profil für die Kompatibilitätsroute aus. |
| Bilderzeugung oder -bearbeitung                      | `openai/gpt-image-2`                                     | Funktioniert entweder mit `OPENAI_API_KEY` oder OpenAI Codex OAuth. |
| Bilder mit transparentem Hintergrund                 | `openai/gpt-image-1.5`                                   | Verwenden Sie `outputFormat=png` oder `webp` und `openai.background=transparent`. |

## Namenszuordnung

Die Namen sind ähnlich, aber nicht austauschbar:

| Angezeigter Name                         | Ebene                      | Bedeutung                                                                                                            |
| ---------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `openai`                                 | Provider-Präfix            | Kanonische OpenAI-Modellroute; Agenten-Turns verwenden die Codex-Laufzeit.                                          |
| `openai-codex`                           | Legacy-Auth-/Profilpräfix  | Älterer OpenAI-Codex-OAuth-/Abo-Profil-Namespace. Vorhandene Profile und `auth.order.openai-codex` funktionieren weiterhin. |
| `codex`-Plugin                           | Plugin                     | Gebündeltes OpenClaw-Plugin, das die native Codex-App-Server-Laufzeit und `/codex`-Chatsteuerungen bereitstellt.    |
| Provider-/Modell-`agentRuntime.id: codex` | Agenten-Laufzeit           | Erzwingt das native Codex-App-Server-Harness für passende eingebettete Turns.                                       |
| `/codex ...`                             | Chat-Befehlssatz           | Codex-App-Server-Threads aus einer Unterhaltung heraus binden/steuern.                                              |
| `runtime: "acp", agentId: "codex"`       | ACP-Sitzungsroute          | Expliziter Fallback-Pfad, der Codex über ACP/acpx ausführt.                                                         |

Das bedeutet, dass eine Konfiguration bewusst `openai/*`-Modellrefs enthalten kann, während Auth-
Profile weiterhin auf Codex-kompatible Anmeldedaten zeigen. Bevorzugen Sie `auth.order.openai`
für neue Konfigurationen; vorhandene `openai-codex:*`-Profile und `auth.order.openai-codex`
bleiben unterstützt. `openclaw doctor --fix` schreibt Legacy-`openai-codex/*`-Modell-
Refs auf die kanonische OpenAI-Modellroute um.

<Note>
GPT-5.5 ist sowohl über direkten OpenAI-Platform-API-Key-Zugriff als auch über
Abonnement-/OAuth-Routen verfügbar. Für ChatGPT-/Codex-Abo plus native Codex-
Ausführung verwenden Sie `openai/gpt-5.5`; nicht gesetzte Laufzeitkonfiguration wählt jetzt das Codex-
Harness für OpenAI-Agenten-Turns aus. Verwenden Sie OpenAI-API-Key-Profile nur, wenn Sie
direkte API-Key-Auth für ein OpenAI-Agentenmodell möchten.
</Note>

<Note>
OpenAI-Agentenmodell-Turns erfordern das gebündelte Codex-App-Server-Plugin. Explizite
PI-Laufzeitkonfiguration bleibt als optionale Kompatibilitätsroute verfügbar. Wenn PI
explizit mit einem `openai-codex`-Auth-Profil ausgewählt ist, behält OpenClaw die
öffentliche Modellref als `openai/*` bei und leitet PI intern über den Legacy-
Codex-Auth-Transport. Führen Sie `openclaw doctor --fix` aus, um veraltete
`openai-codex/*`-Modellrefs oder alte PI-Sitzungspins zu reparieren, die nicht aus
expliziter Laufzeitkonfiguration stammen.
</Note>

## OpenClaw-Funktionsabdeckung

| OpenAI-Fähigkeit          | OpenClaw-Oberfläche                                                              | Status                                                 |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | `openai/<model>`-Modell-Provider                                                 | Ja                                                     |
| Codex-Abo-Modelle         | `openai/<model>` mit `openai-codex` OAuth                                        | Ja                                                     |
| Legacy-Codex-Modellrefs   | `openai-codex/<model>`                                                           | Vom doctor zu `openai/<model>` repariert              |
| Codex-App-Server-Harness  | `openai/<model>` mit ausgelassener Laufzeit oder Provider-/Modell-`agentRuntime.id: codex` | Ja                                            |
| Serverseitige Websuche    | Natives OpenAI-Responses-Tool                                                    | Ja, wenn Websuche aktiviert ist und kein Provider fixiert wurde |
| Bilder                    | `image_generate`                                                                 | Ja                                                     |
| Videos                    | `video_generate`                                                                 | Ja                                                     |
| Text-to-Speech            | `messages.tts.provider: "openai"` / `tts`                                        | Ja                                                     |
| Batch-Speech-to-Text      | `tools.media.audio` / Medienverständnis                                          | Ja                                                     |
| Streaming-Speech-to-Text  | Voice Call `streaming.provider: "openai"`                                        | Ja                                                     |
| Realtime-Voice            | Voice Call `realtime.provider: "openai"` / Control UI Talk                       | Ja                                                     |
| Embeddings                | Memory-Embedding-Provider                                                        | Ja                                                     |

## Memory-Embeddings

OpenClaw kann OpenAI oder einen OpenAI-kompatiblen Embedding-Endpunkt für
`memory_search`-Indizierung und Abfrage-Embeddings verwenden:

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
diese als Provider-spezifische `input_type`-Request-Felder weiter: Abfrage-Embeddings verwenden
`queryInputType`; indizierte Memory-Chunks und Batch-Indizierung verwenden
`documentInputType`. Das vollständige Beispiel finden Sie in der [Referenz zur Memory-Konfiguration](/de/reference/memory-config#provider-specific-config).

## Erste Schritte

Wählen Sie Ihre bevorzugte Auth-Methode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="API-Key (OpenAI Platform)">
    **Am besten für:** direkten API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="API-Key abrufen">
        Erstellen oder kopieren Sie einen API-Key aus dem [OpenAI Platform-Dashboard](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Oder übergeben Sie den Key direkt:

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

    | Modellref              | Laufzeitkonfiguration      | Route                       | Auth             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | ausgelassen / Provider-/Modell-`agentRuntime.id: "codex"` | Codex-App-Server-Harness | Codex-kompatibles OpenAI-Profil |
    | `openai/gpt-5.4-mini` | ausgelassen / Provider-/Modell-`agentRuntime.id: "codex"` | Codex-App-Server-Harness | Codex-kompatibles OpenAI-Profil |
    | `openai/gpt-5.5`      | Provider-/Modell-`agentRuntime.id: "pi"`                  | Eingebettete PI-Laufzeit | `openai`-Profil oder ausgewähltes `openai-codex`-Profil |

    <Note>
    `openai/*`-Agentenmodelle verwenden das Codex-App-Server-Harness. Um API-Key-
    Auth für ein Agentenmodell zu verwenden, erstellen Sie ein Codex-kompatibles API-Key-Profil und ordnen
    es mit `auth.order.openai` ein; `OPENAI_API_KEY` bleibt der direkte Fallback für
    Nicht-Agenten-OpenAI-API-Oberflächen. Ältere `auth.order.openai-codex`-Einträge funktionieren weiterhin.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Um das aktuelle Instant-Modell von ChatGPT über die OpenAI API auszuprobieren, setzen Sie das Modell
    auf `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` ist ein veränderlicher Alias. OpenAI dokumentiert ihn als das neueste Instant-
    Modell, das in ChatGPT verwendet wird, und empfiehlt `gpt-5.5` für die produktive API-Nutzung. Behalten Sie daher
    `openai/gpt-5.5` als stabilen Standard bei, sofern Sie dieses Alias-Verhalten nicht ausdrücklich wünschen.
    Der Alias akzeptiert derzeit nur `medium`-Textausführlichkeit, daher normalisiert
    OpenClaw inkompatible OpenAI-Textausführlichkeits-Overrides für dieses
    Modell.

    <Warning>
    OpenClaw stellt `openai/gpt-5.3-codex-spark` **nicht** bereit. Live-OpenAI-API-Requests lehnen dieses Modell ab, und der aktuelle Codex-Katalog stellt es ebenfalls nicht bereit.
    </Warning>

  </Tab>

  <Tab title="Codex-Abonnement">
    **Am besten geeignet für:** die Nutzung Ihres ChatGPT/Codex-Abonnements mit nativer Codex-App-Server-Ausführung statt eines separaten API-Schlüssels. Codex Cloud erfordert die Anmeldung bei ChatGPT.

    <Steps>
      <Step title="Codex OAuth ausführen">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oder führen Sie OAuth direkt aus:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Fügen Sie für Headless- oder callback-unfreundliche Setups `--device-code` hinzu, um sich mit einem ChatGPT-Gerätecode-Flow statt über den localhost-Browser-Callback anzumelden:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Die kanonische OpenAI-Modellroute verwenden">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Für den Standardpfad ist keine Runtime-Konfiguration erforderlich. OpenAI-Agent-Turns
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

    ### Routenzusammenfassung

    | Modellreferenz | Runtime-Konfiguration | Route | Authentifizierung |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | weggelassen / Provider/Modell `agentRuntime.id: "codex"` | Nativer Codex-App-Server-Harness | Codex-Anmeldung oder geordnetes `openai`-Authentifizierungsprofil |
    | `openai/gpt-5.5` | Provider/Modell `agentRuntime.id: "pi"` | Eingebettete PI-Runtime mit internem Codex-Auth-Transport | Ausgewähltes `openai-codex`-Profil |
    | `openai-codex/gpt-5.5` | von doctor repariert | Legacy-Route, umgeschrieben zu `openai/gpt-5.5` | Vorhandenes `openai-codex`-Profil |

    <Warning>
    Konfigurieren Sie keine älteren Modellreferenzen wie `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` oder
    `openai-codex/gpt-5.3*`. ChatGPT/Codex-OAuth-Konten lehnen
    diese Modelle jetzt ab. Verwenden Sie `openai/gpt-5.5`; OpenAI-Agent-Turns wählen jetzt standardmäßig
    die Codex-Runtime aus.
    </Warning>

    <Note>
    Das Modellpräfix `openai-codex/*` ist Legacy-Konfiguration, die von doctor repariert wird. Für
    die übliche Einrichtung mit Abonnement plus nativer Runtime melden Sie sich mit Codex-Auth an,
    behalten die Modellreferenz aber als `openai/gpt-5.5` bei. Neue Konfiguration sollte die OpenAI-
    Agent-Authentifizierungsreihenfolge unter `auth.order.openai` ablegen; ältere Einträge unter `auth.order.openai-codex`
    bleiben gültig.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    Mit einem API-Schlüssel-Backup behalten Sie das Modell auf `openai/gpt-5.5` und legen die
    Authentifizierungsreihenfolge unter `openai` ab. OpenClaw versucht zuerst das Abonnement, dann
    den API-Schlüssel, während es im Codex-Harness bleibt:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai-codex:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    Onboarding importiert kein OAuth-Material mehr aus `~/.codex`. Melden Sie sich mit Browser-OAuth (Standard) oder dem Gerätecode-Flow oben an — OpenClaw verwaltet die resultierenden Anmeldedaten in seinem eigenen Agent-Authentifizierungsspeicher.
    </Note>

    ### Codex-OAuth-Routing prüfen und wiederherstellen

    Verwenden Sie diese Befehle, um zu sehen, welche Modell-, Runtime- und Authentifizierungsroute Ihr Standard-
    Agent verwendet:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Fügen Sie für einen bestimmten Agent `--agent <id>` hinzu:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Wenn eine ältere Konfiguration noch `openai-codex/gpt-*` oder eine veraltete OpenAI-PI-
    Sitzungsbindung ohne explizite Runtime-Konfiguration enthält, reparieren Sie sie:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Wenn `models auth list --provider openai-codex` kein nutzbares Profil anzeigt, melden Sie sich
    erneut an:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai/*` ist die Modellroute für OpenAI-Agent-Turns über Codex. Die
    Provider-ID `openai-codex` für Authentifizierung/Profile bleibt für vorhandene
    Profile und CLI-Auflistungen akzeptiert.

    ### Statusanzeige

    Chat `/status` zeigt, welche Modell-Runtime für die aktuelle Sitzung aktiv ist.
    Der gebündelte Codex-App-Server-Harness erscheint als `Runtime: OpenAI Codex` für
    OpenAI-Agent-Modell-Turns. Veraltete PI-Sitzungsbindungen werden zu Codex repariert, sofern
    die Konfiguration PI nicht explizit bindet.

    ### Doctor-Warnung

    Wenn `openai-codex/*`-Routen oder veraltete OpenAI-PI-Bindungen in der Konfiguration oder
    im Sitzungszustand verbleiben, schreibt `openclaw doctor --fix` sie zu `openai/*` mit der
    Codex-Runtime um, sofern PI nicht explizit konfiguriert ist.

    ### Kontextfensterobergrenze

    OpenClaw behandelt Modellmetadaten und die Runtime-Kontextobergrenze als separate Werte.

    Für `openai/gpt-5.5` über den Codex-OAuth-Katalog:

    - Native `contextWindow`: `1000000`
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
    vorhanden sind. Wenn die Live-Codex-Erkennung die Zeile `gpt-5.5` auslässt, obwohl
    das Konto authentifiziert ist, synthetisiert OpenClaw diese OAuth-Modellzeile, damit
    Cron-, Sub-Agent- und konfigurierte Standardmodell-Läufe nicht mit
    `Unknown model` fehlschlagen.

  </Tab>
</Tabs>

## Native Codex-App-Server-Authentifizierung

Der native Codex-App-Server-Harness verwendet `openai/*`-Modellreferenzen plus weggelassene
Runtime-Konfiguration oder Provider/Modell `agentRuntime.id: "codex"`, seine Authentifizierung ist
jedoch weiterhin kontobasiert. OpenClaw wählt die Authentifizierung in dieser Reihenfolge aus:

1. Geordnete OpenAI-Authentifizierungsprofile für den Agent, vorzugsweise unter
   `auth.order.openai`. Vorhandene `openai-codex:*`-Profile und
   `auth.order.openai-codex` bleiben für ältere Installationen gültig.
2. Das vorhandene Konto des App-Servers, etwa eine lokale Codex-CLI-ChatGPT-Anmeldung.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn der App-Server kein Konto meldet und weiterhin
   OpenAI-Authentifizierung benötigt.

Das bedeutet, dass eine lokale ChatGPT/Codex-Abonnementanmeldung nicht ersetzt wird, nur
weil der Gateway-Prozess auch `OPENAI_API_KEY` für direkte OpenAI-Modelle
oder Einbettungen hat. Env-API-Schlüssel-Fallback ist nur der lokale stdio-Pfad ohne Konto; er
wird nicht an WebSocket-App-Server-Verbindungen gesendet. Wenn ein Codex-Profil im Abonnementstil
ausgewählt ist, hält OpenClaw auch `CODEX_API_KEY` und `OPENAI_API_KEY`
aus dem gestarteten stdio-App-Server-Kindprozess heraus und sendet die ausgewählten Anmeldedaten
über den App-Server-Login-RPC. Wenn dieses Abonnementprofil durch ein
Codex-Nutzungslimit blockiert ist, kann OpenClaw zum nächsten geordneten `openai:*`-API-Schlüssel-
Profil rotieren, ohne das ausgewählte Modell zu ändern oder den Codex-
Harness zu verlassen. Sobald die Zurücksetzungszeit des Abonnements verstrichen ist, ist das Abonnementprofil
wieder berechtigt.

## Bilderzeugung

Das gebündelte `openai`-Plugin registriert Bilderzeugung über das Tool `image_generate`.
Es unterstützt sowohl OpenAI-Bilderzeugung mit API-Schlüssel als auch Codex-OAuth-Bilderzeugung
über dieselbe Modellreferenz `openai/gpt-image-2`.

| Fähigkeit                | OpenAI-API-Schlüssel                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Modellreferenz                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Authentifizierung                      | `OPENAI_API_KEY`                   | OpenAI-Codex-OAuth-Anmeldung           |
| Transport                 | OpenAI Images API                  | Codex Responses-Backend              |
| Max. Bilder pro Anfrage    | 4                                  | 4                                    |
| Bearbeitungsmodus                 | Aktiviert (bis zu 5 Referenzbilder) | Aktiviert (bis zu 5 Referenzbilder)   |
| Größenüberschreibungen            | Unterstützt, einschließlich 2K/4K-Größen   | Unterstützt, einschließlich 2K/4K-Größen     |
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

`gpt-image-2` ist der Standard für sowohl OpenAI-Text-zu-Bild-Erzeugung als auch Bild-
bearbeitung. `gpt-image-1.5`, `gpt-image-1` und `gpt-image-1-mini` bleiben als
explizite Modellüberschreibungen nutzbar. Verwenden Sie `openai/gpt-image-1.5` für
PNG/WebP-Ausgabe mit transparentem Hintergrund; die aktuelle `gpt-image-2`-API lehnt
`background: "transparent"` ab.

Für eine Anfrage mit transparentem Hintergrund sollten Agents `image_generate` mit
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` oder `"webp"` und
`background: "transparent"` aufrufen; die ältere Provider-Option `openai.background` wird
weiterhin akzeptiert. OpenClaw schützt außerdem die öffentlichen OpenAI- und
OpenAI-Codex-OAuth-Routen, indem standardmäßige transparente `openai/gpt-image-2`-Anfragen
zu `gpt-image-1.5` umgeschrieben werden; Azure- und benutzerdefinierte OpenAI-kompatible Endpunkte behalten
ihre konfigurierten Deployment-/Modellnamen.

Dieselbe Einstellung ist für Headless-CLI-Läufe verfügbar:

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
`openai-codex`-OAuth-Profil konfiguriert ist, löst OpenClaw dieses gespeicherte OAuth-
Zugriffstoken auf und sendet Bildanfragen über das Codex Responses-Backend. Es
versucht nicht zuerst `OPENAI_API_KEY` und fällt für diese Anfrage auch nicht stillschweigend auf einen API-Schlüssel
zurück. Konfigurieren Sie `models.providers.openai` explizit mit einem API-Schlüssel,
einer benutzerdefinierten Basis-URL oder einem Azure-Endpunkt, wenn Sie stattdessen die direkte OpenAI Images API-
Route verwenden möchten.
Wenn dieser benutzerdefinierte Bildendpunkt in einem vertrauenswürdigen LAN/einer privaten Adresse liegt, setzen Sie außerdem
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw hält
private/interne OpenAI-kompatible Bildendpunkte blockiert, sofern dieses Opt-in nicht
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

Das gebündelte `openai`-Plugin registriert Videogenerierung über das Tool `video_generate`.

| Fähigkeit        | Wert                                                                              |
| ---------------- | --------------------------------------------------------------------------------- |
| Standardmodell   | `openai/sora-2`                                                                   |
| Modi             | Text-zu-Video, Bild-zu-Video, Einzelvideo-Bearbeitung                             |
| Referenzeingaben | 1 Bild oder 1 Video                                                               |
| Größen-Overrides | Unterstützt                                                                       |
| Weitere Overrides | `aspectRatio`, `resolution`, `audio`, `watermark` werden mit einer Tool-Warnung ignoriert |

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
Siehe [Videogenerierung](/de/tools/video-generation) für gemeinsam genutzte Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## GPT-5-Prompt-Beitrag

OpenClaw fügt einen gemeinsamen GPT-5-Prompt-Beitrag für Läufe der GPT-5-Familie über Provider hinweg hinzu. Er wird nach Modell-ID angewendet, sodass `openai/gpt-5.5`, ältere Referenzen vor der Reparatur wie `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` und andere kompatible GPT-5-Referenzen dasselbe Overlay erhalten. Ältere GPT-4.x-Modelle erhalten es nicht.

Das gebündelte native Codex-Harness verwendet dasselbe GPT-5-Verhalten und Heartbeat-Overlay über Entwickleranweisungen des Codex-App-Servers, sodass über Codex geroutete `openai/gpt-5.x`-Sitzungen dieselbe Follow-through- und proaktive Heartbeat-Anleitung beibehalten, auch wenn Codex den Rest des Harness-Prompts besitzt.

Der GPT-5-Beitrag fügt einen getaggten Verhaltensvertrag für Persona-Persistenz, Ausführungssicherheit, Tool-Disziplin, Ausgabeform, Abschlussprüfungen und Verifizierung hinzu. Kanalspezifisches Antwort- und Silent-Message-Verhalten bleibt im gemeinsam genutzten OpenClaw-Systemprompt und in der Richtlinie für ausgehende Zustellung. Die GPT-5-Anleitung ist für passende Modelle immer aktiviert. Die freundliche Ebene für den Interaktionsstil ist separat und konfigurierbar.

| Wert                   | Wirkung                                      |
| ---------------------- | -------------------------------------------- |
| `"friendly"` (Standard) | Aktiviert die freundliche Interaktionsstil-Ebene |
| `"on"`                 | Alias für `"friendly"`                       |
| `"off"`                | Deaktiviert nur die freundliche Stil-Ebene   |

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
Werte beachten zur Laufzeit keine Groß-/Kleinschreibung, sodass `"Off"` und `"off"` beide die freundliche Stil-Ebene deaktivieren.
</Tip>

<Note>
Das ältere `plugins.entries.openai.config.personality` wird weiterhin als Kompatibilitäts-Fallback gelesen, wenn die gemeinsame Einstellung `agents.defaults.promptOverlays.gpt5.personality` nicht gesetzt ist.
</Note>

## Stimme und Sprache

<AccordionGroup>
  <Accordion title="Sprachsynthese (TTS)">
    Das gebündelte `openai`-Plugin registriert Sprachsynthese für die Oberfläche `messages.tts`.

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

    `extraBody` wird nach den von OpenClaw generierten Feldern in das Anfrage-JSON von `/audio/speech` zusammengeführt. Verwenden Sie es daher für OpenAI-kompatible Endpunkte, die zusätzliche Schlüssel wie `lang` erfordern. Prototype-Schlüssel werden ignoriert.

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
    Setzen Sie `OPENAI_TTS_BASE_URL`, um die TTS-Basis-URL zu überschreiben, ohne den Chat-API-Endpunkt zu beeinflussen. OpenAI TTS wird weiterhin über einen API-Schlüssel konfiguriert; für reine OAuth-Live-Rücksprache verwenden Sie den Realtime-Sprachpfad anstelle von STT -> TTS-Sprache im Agent-Modus.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Das gebündelte `openai`-Plugin registriert Batch-Spracherkennung über
    OpenClaws Transkriptionsoberfläche für Medienverständnis.

    - Standardmodell: `gpt-4o-transcribe`
    - Endpunkt: OpenAI REST `/v1/audio/transcriptions`
    - Eingabepfad: multipart-Audiodatei-Upload
    - Unterstützt von OpenClaw überall dort, wo Transkription eingehender Audiodaten
      `tools.media.audio` verwendet, einschließlich Discord-Sprachkanal-Segmenten und
      Kanal-Audioanhängen

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
    gemeinsamen Audiomedien-Konfiguration oder der Transkriptionsanfrage pro Aufruf bereitgestellt werden.

  </Accordion>

  <Accordion title="Realtime-Transkription">
    Das gebündelte `openai`-Plugin registriert Realtime-Transkription für das Voice Call-Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Sprache | `...openai.language` | (nicht festgelegt) |
    | Prompt | `...openai.prompt` | (nicht festgelegt) |
    | Dauer der Stille | `...openai.silenceDurationMs` | `800` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | Authentifizierung | `...openai.apiKey`, `OPENAI_API_KEY` oder `openai-codex` OAuth | API-Schlüssel verbinden direkt; OAuth erstellt ein Client Secret für Realtime-Transkription |

    <Note>
    Verwendet eine WebSocket-Verbindung zu `wss://api.openai.com/v1/realtime` mit G.711 u-law-Audio (`g711_ulaw` / `audio/pcmu`). Wenn nur `openai-codex` OAuth konfiguriert ist, erstellt der Gateway ein kurzlebiges Client Secret für Realtime-Transkription, bevor der WebSocket geöffnet wird. Dieser Streaming-Provider ist für den Realtime-Transkriptionspfad von Voice Call vorgesehen; Discord Voice zeichnet derzeit kurze Segmente auf und verwendet stattdessen den Batch-Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime-Sprache">
    Das gebündelte `openai`-Plugin registriert Realtime-Sprache für das Voice Call-Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Stimme | `...openai.voice` | `alloy` |
    | Temperatur (Azure-Deployment-Bridge) | `...openai.temperature` | `0.8` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | Dauer der Stille | `...openai.silenceDurationMs` | `500` |
    | Präfix-Padding | `...openai.prefixPaddingMs` | `300` |
    | Reasoning-Aufwand | `...openai.reasoningEffort` | (nicht festgelegt) |
    | Authentifizierung | `...openai.apiKey`, `OPENAI_API_KEY` oder `openai-codex` OAuth | Browser Talk und Nicht-Azure-Backend-Bridges können Codex OAuth verwenden |

    Verfügbare integrierte Realtime-Stimmen für `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI empfiehlt `marin` und `cedar` für die beste Realtime-Qualität. Dies
    ist ein separater Satz gegenüber den oben genannten Text-to-Speech-Stimmen; gehen Sie nicht davon aus, dass eine TTS-
    Stimme wie `fable`, `nova` oder `onyx` für Realtime-Sitzungen gültig ist.

    <Note>
    Backend-OpenAI-Realtime-Bridges verwenden die GA-Realtime-WebSocket-Sitzungsform, die `session.temperature` nicht akzeptiert. Azure OpenAI-Deployments bleiben über `azureEndpoint` und `azureDeployment` verfügbar und behalten die deploymentkompatible Sitzungsform bei. Unterstützt bidirektionales Tool-Calling und G.711 u-law-Audio.
    </Note>

    <Note>
    Die Realtime-Stimme wird ausgewählt, wenn die Sitzung erstellt wird. OpenAI erlaubt, die meisten
    Sitzungsfelder später zu ändern, aber die Stimme kann nicht geändert werden, nachdem das
    Modell in dieser Sitzung Audio ausgegeben hat. OpenClaw stellt derzeit die
    integrierten Realtime-Stimmen-IDs als Strings bereit.
    </Note>

    <Note>
    Control UI Talk verwendet OpenAI-Browser-Realtime-Sitzungen mit einem vom Gateway erstellten
    kurzlebigen Client Secret und einem direkten Browser-WebRTC-SDP-Austausch gegen die
    OpenAI Realtime API. Wenn kein direkter OpenAI-API-Schlüssel konfiguriert ist, kann der
    Gateway dieses Client Secret mit dem ausgewählten `openai-codex` OAuth-
    Profil erstellen. Gateway-Relay- und Voice Call-Backend-Realtime-WebSocket-Bridges verwenden
    denselben OAuth-Fallback für native OpenAI-Endpunkte. Maintainer-Live-
    Verifikation ist verfügbar mit
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    die OpenAI-Abschnitte verifizieren sowohl die Backend-WebSocket-Bridge als auch den Browser-
    WebRTC-SDP-Austausch, ohne Secrets zu protokollieren.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI-Endpunkte

Der gebündelte `openai`-Provider kann für die Bildgenerierung auf eine Azure OpenAI-Ressource
ausgerichtet werden, indem die Basis-URL überschrieben wird. Auf dem Bildgenerierungspfad erkennt OpenClaw
Azure-Hostnamen in `models.providers.openai.baseUrl` und wechselt automatisch zur
Request-Form von Azure.

<Note>
Realtime-Sprache verwendet einen separaten Konfigurationspfad
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
und wird nicht von `models.providers.openai.baseUrl` beeinflusst. Siehe das Accordion **Realtime-
Sprache** unter [Voice und Sprache](#voice-and-speech) für die Azure-
Einstellungen.
</Note>

Verwenden Sie Azure OpenAI, wenn:

- Sie bereits über ein Azure OpenAI-Abonnement, Kontingent oder eine Unternehmensvereinbarung verfügen
- Sie regionale Datenresidenz oder von Azure bereitgestellte Compliance-Kontrollen benötigen
- Sie Datenverkehr innerhalb einer bestehenden Azure-Tenancy halten möchten

### Konfiguration

Für Azure-Bildgenerierung über den gebündelten `openai`-Provider verweisen Sie
`models.providers.openai.baseUrl` auf Ihre Azure-Ressource und setzen Sie `apiKey` auf
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

OpenClaw erkennt diese Azure-Host-Suffixe für die Azure-Bildgenerierungs-
Route:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Für Bildgenerierungs-Requests auf einem erkannten Azure-Host führt OpenClaw Folgendes aus:

- Sendet den Header `api-key` statt `Authorization: Bearer`
- Verwendet deploymentbezogene Pfade (`/openai/deployments/{deployment}/...`)
- Hängt `?api-version=...` an jeden Request an
- Verwendet ein Standard-Request-Timeout von 600 s für Azure-Bildgenerierungsaufrufe.
  Pro-Aufruf-`timeoutMs`-Werte überschreiben diesen Standard weiterhin.

Andere Basis-URLs (öffentliches OpenAI, OpenAI-kompatible Proxys) behalten die standardmäßige
OpenAI-Bild-Request-Form bei.

<Note>
Azure-Routing für den Bildgenerierungspfad des `openai`-Providers erfordert
OpenClaw 2026.4.22 oder höher. Frühere Versionen behandeln jede benutzerdefinierte
`openai.baseUrl` wie den öffentlichen OpenAI-Endpunkt und schlagen bei Azure-
Bild-Deployments fehl.
</Note>

### API-Version

Setzen Sie `AZURE_OPENAI_API_VERSION`, um eine bestimmte Azure-Preview- oder GA-Version
für den Azure-Pfad zur Bildgenerierung festzulegen:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Der Standardwert ist `2024-12-01-preview`, wenn die Variable nicht gesetzt ist.

### Modellnamen sind Deployment-Namen

Azure OpenAI bindet Modelle an Deployments. Für Azure-Bildgenerierungsanfragen,
die über den gebündelten `openai`-Provider geroutet werden, muss das Feld `model`
in OpenClaw der **Azure-Deployment-Name** sein, den Sie im Azure-Portal konfiguriert
haben, nicht die öffentliche OpenAI-Modell-ID.

Wenn Sie ein Deployment namens `gpt-image-2-prod` erstellen, das `gpt-image-2` bereitstellt:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Dieselbe Regel für Deployment-Namen gilt für Bildgenerierungsaufrufe, die über
den gebündelten `openai`-Provider geroutet werden.

### Regionale Verfügbarkeit

Azure-Bildgenerierung ist derzeit nur in einer Teilmenge von Regionen verfügbar
(zum Beispiel `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Prüfen Sie Microsofts aktuelle Regionsliste, bevor Sie ein
Deployment erstellen, und bestätigen Sie, dass das spezifische Modell in Ihrer
Region angeboten wird.

### Parameterunterschiede

Azure OpenAI und öffentliches OpenAI akzeptieren nicht immer dieselben Bildparameter.
Azure kann Optionen ablehnen, die öffentliches OpenAI erlaubt (zum Beispiel bestimmte
`background`-Werte für `gpt-image-2`), oder sie nur für bestimmte Modellversionen
bereitstellen. Diese Unterschiede stammen von Azure und dem zugrunde liegenden
Modell, nicht von OpenClaw. Wenn eine Azure-Anfrage mit einem Validierungsfehler
fehlschlägt, prüfen Sie im Azure-Portal den Parametersatz, der von Ihrem spezifischen
Deployment und Ihrer API-Version unterstützt wird.

<Note>
Azure OpenAI verwendet nativen Transport und Kompatibilitätsverhalten, erhält aber
nicht die ausgeblendeten Attribution-Header von OpenClaw — siehe das Akkordeon
**Native vs OpenAI-kompatible Routen** unter [Erweiterte Konfiguration](#advanced-configuration).

Für Chat- oder Responses-Traffic auf Azure (über die Bildgenerierung hinaus) verwenden
Sie den Onboarding-Ablauf oder eine dedizierte Azure-Provider-Konfiguration —
`openai.baseUrl` allein übernimmt nicht die Azure-API-/Auth-Form. Ein separater
`azure-openai-responses/*`-Provider existiert; siehe das Akkordeon zur
serverseitigen Compaction unten.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw verwendet für `openai/*` bevorzugt WebSocket mit SSE-Fallback (`"auto"`).

    Im Modus `"auto"`:
    - Wiederholt OpenClaw einen frühen WebSocket-Fehler einmal, bevor auf SSE zurückgefallen wird
    - Markiert OpenClaw WebSocket nach einem Fehler für ca. 60 Sekunden als beeinträchtigt und verwendet während der Abkühlphase SSE
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

  <Accordion title="Schnellmodus">
    OpenClaw stellt einen gemeinsamen Schnellmodus-Schalter für `openai/*` bereit:

    - **Chat/UI:** `/fast status|on|off`
    - **Konfiguration:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Wenn aktiviert, ordnet OpenClaw den Schnellmodus der OpenAI-Prioritätsverarbeitung zu (`service_tier = "priority"`). Vorhandene `service_tier`-Werte bleiben erhalten, und der Schnellmodus überschreibt weder `reasoning` noch `text.verbosity`.

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
    Sitzungsüberschreibungen haben Vorrang vor der Konfiguration. Wenn Sie die Sitzungsüberschreibung in der Sessions-UI löschen, kehrt die Sitzung zum konfigurierten Standard zurück.
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
    `serviceTier` wird nur an native OpenAI-Endpunkte (`api.openai.com`) und native Codex-Endpunkte (`chatgpt.com/backend-api`) weitergeleitet. Wenn Sie einen der Provider über einen Proxy routen, lässt OpenClaw `service_tier` unverändert.
    </Warning>

  </Accordion>

  <Accordion title="Serverseitige Compaction (Responses API)">
    Für direkte OpenAI-Responses-Modelle (`openai/*` auf `api.openai.com`) aktiviert der Pi-Harness-Stream-Wrapper des OpenAI-Plugins automatisch serverseitige Compaction:

    - Erzwingt `store: true` (sofern Modellkompatibilität nicht `supportsStore: false` setzt)
    - Injiziert `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Standardwert für `compact_threshold`: 70 % von `contextWindow` (oder `80000`, wenn nicht verfügbar)

    Dies gilt für den integrierten Pi-Harness-Pfad und für OpenAI-Provider-Hooks, die von eingebetteten Läufen verwendet werden. Der native Codex-App-Server-Harness verwaltet seinen eigenen Kontext über Codex und wird durch OpenAIs Standard-Agent-Route oder Provider-/Modell-Laufzeitrichtlinie konfiguriert.

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

  <Accordion title="Strikter agentischer GPT-Modus">
    Für Läufe der GPT-5-Familie auf `openai/*` kann OpenClaw einen strengeren eingebetteten Ausführungsvertrag verwenden:

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
    - Behandelt OpenClaw einen reinen Planungs-Turn nicht mehr als erfolgreichen Fortschritt, wenn eine Tool-Aktion verfügbar ist
    - Wiederholt OpenClaw den Turn mit einer Jetzt-handeln-Steuerung
    - Aktiviert OpenClaw `update_plan` automatisch für umfangreiche Arbeiten
    - Zeigt OpenClaw einen expliziten blockierten Zustand an, wenn das Modell weiter plant, ohne zu handeln

    <Note>
    Nur auf OpenAI- und Codex-Läufe der GPT-5-Familie beschränkt. Andere Provider und ältere Modellfamilien behalten das Standardverhalten bei.
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-kompatible Routen">
    OpenClaw behandelt direkte OpenAI-, Codex- und Azure OpenAI-Endpunkte anders als generische OpenAI-kompatible `/v1`-Proxys:

    **Native Routen** (`openai/*`, Azure OpenAI):
    - Behalten `reasoning: { effort: "none" }` nur für Modelle bei, die den OpenAI-Aufwand `none` unterstützen
    - Lassen deaktiviertes Reasoning bei Modellen oder Proxys weg, die `reasoning.effort: "none"` ablehnen
    - Setzen Tool-Schemas standardmäßig in den strikten Modus
    - Fügen ausgeblendete Attribution-Header nur auf verifizierten nativen Hosts an
    - Behalten OpenAI-spezifische Anfrageformung bei (`service_tier`, `store`, Reasoning-Kompatibilität, Prompt-Cache-Hinweise)

    **Proxy-/kompatible Routen:**
    - Verwenden lockereres Kompatibilitätsverhalten
    - Entfernen Completions-`store` aus nicht nativen `openai-completions`-Payloads
    - Akzeptieren erweitertes Durchreichen von `params.extra_body`-/`params.extraBody`-JSON für OpenAI-kompatible Completions-Proxys
    - Akzeptieren `params.chat_template_kwargs` für OpenAI-kompatible Completions-Proxys wie vLLM
    - Erzwingen keine strikten Tool-Schemas oder nur nativen Header

    Azure OpenAI verwendet nativen Transport und Kompatibilitätsverhalten, erhält aber nicht die ausgeblendeten Attribution-Header.

  </Accordion>
</AccordionGroup>

## Verwandt

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
  <Card title="OAuth und Auth" href="/de/gateway/authentication" icon="key">
    Auth-Details und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
