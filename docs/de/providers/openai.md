---
read_when:
    - Sie möchten OpenAI-Modelle in OpenClaw verwenden
    - Sie möchten Codex-Abonnementauthentifizierung anstelle von API-Schlüsseln verwenden
    - Sie benötigen strengeres GPT-5-Agent-Ausführungsverhalten
summary: OpenAI in OpenClaw über API-Schlüssel oder Codex-Abonnement verwenden
title: OpenAI
x-i18n:
    generated_at: "2026-06-27T18:05:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f5346c6bb85341c4e1709e3023dee8b32a413189d5564778e9c919b7eaa78f1
    source_path: providers/openai.md
    workflow: 16
---

OpenAI stellt Entwickler-APIs für GPT-Modelle bereit, und Codex ist über OpenAIs Codex-Clients auch als Coding-Agent in einem
ChatGPT-Tarif verfügbar. OpenClaw verwendet eine
Provider-ID, `openai`, für beide Authentifizierungsformen.

OpenClaw verwendet `openai/*` als kanonische OpenAI-Modellroute. Eingebettete Agent-
Turns auf OpenAI-Modellen laufen standardmäßig über die native Codex-App-Server-Laufzeit;
direkte Authentifizierung per OpenAI-API-Schlüssel bleibt für OpenAI-Oberflächen ohne Agent
wie Bilder, Embeddings, Sprache und Realtime verfügbar.

- **Agent-Modelle** - `openai/*`-Modelle über die Codex-Laufzeit; melden Sie sich mit
  Codex-Auth für die Nutzung von ChatGPT-/Codex-Abonnements an, oder konfigurieren Sie ein Codex-kompatibles
  OpenAI-API-Schlüssel-Backup, wenn Sie bewusst API-Schlüssel-Auth verwenden möchten.
- **OpenAI-APIs ohne Agent** - direkter OpenAI-Platform-Zugriff mit nutzungsbasierter
  Abrechnung über `OPENAI_API_KEY` oder OpenAI-API-Schlüssel-Onboarding.
- **Legacy-Konfiguration** - Legacy-Codex-Modellreferenzen werden durch
  `openclaw doctor --fix` zu `openai/*` plus Codex-Laufzeit repariert.

OpenAI unterstützt ausdrücklich die OAuth-Nutzung von Abonnements in externen Tools und Workflows wie OpenClaw.

Provider, Modell, Laufzeit und Kanal sind separate Ebenen. Wenn diese Bezeichnungen
vermischt werden, lesen Sie [Agent-Laufzeiten](/de/concepts/agent-runtimes), bevor
Sie die Konfiguration ändern.

## Schnellauswahl

| Ziel                                                 | Verwenden                                                | Hinweise                                                              |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| ChatGPT-/Codex-Abonnement mit nativer Codex-Laufzeit | `openai/gpt-5.5`                                         | Standardmäßige OpenAI-Agent-Einrichtung. Melden Sie sich mit Codex-Auth an. |
| Direkte API-Schlüssel-Abrechnung für Agent-Modelle   | `openai/gpt-5.5` plus Codex-kompatibles API-Schlüssel-Profil | Verwenden Sie `auth.order.openai`, um das Backup nach der Abonnement-Auth zu platzieren. |
| Direkte API-Schlüssel-Abrechnung über explizites OpenClaw | `openai/gpt-5.5` plus Provider-/Modell-Laufzeit `openclaw` | Wählen Sie ein normales `openai`-API-Schlüssel-Profil aus.            |
| Neuester ChatGPT Instant API-Alias                   | `openai/chat-latest`                                     | Nur direkter API-Schlüssel. Beweglicher Alias für Experimente, nicht der Standard. |
| ChatGPT-/Codex-Abonnement-Auth über OpenClaw         | `openai/gpt-5.5` plus Provider-/Modell-Laufzeit `openclaw` | Wählen Sie ein `openai`-OAuth-Profil für die Kompatibilitätsroute aus. |
| Bilderzeugung oder -bearbeitung                      | `openai/gpt-image-2`                                     | Funktioniert entweder mit `OPENAI_API_KEY` oder OpenAI-Codex-OAuth.  |
| Bilder mit transparentem Hintergrund                 | `openai/gpt-image-1.5`                                   | Verwenden Sie `outputFormat=png` oder `webp` und `openai.background=transparent`. |

## Namenszuordnung

Die Namen sind ähnlich, aber nicht austauschbar:

| Name, den Sie sehen                     | Ebene             | Bedeutung                                                                                         |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Provider-Präfix   | Kanonische OpenAI-Modellroute; Agent-Turns verwenden die Codex-Laufzeit.                          |
| Legacy-OpenAI-Codex-Präfix              | Legacy-Präfix     | Älterer Modell-/Profil-Namespace. `openclaw doctor --fix` migriert ihn zu `openai`.              |
| `codex`-Plugin                          | Plugin            | Gebündeltes OpenClaw-Plugin, das native Codex-App-Server-Laufzeit und `/codex`-Chatsteuerungen bereitstellt. |
| Provider-/Modell `agentRuntime.id: codex` | Agent-Laufzeit   | Erzwingt das native Codex-App-Server-Harness für passende eingebettete Turns.                     |
| `/codex ...`                            | Chatbefehlssatz   | Codex-App-Server-Threads aus einer Unterhaltung binden/steuern.                                  |
| `runtime: "acp", agentId: "codex"`      | ACP-Sitzungsroute | Expliziter Fallback-Pfad, der Codex über ACP/acpx ausführt.                                      |

Das bedeutet, dass eine Konfiguration absichtlich `openai/*`-Modellreferenzen enthalten kann, während Auth-
Profile entweder auf API-Schlüssel- oder ChatGPT-/Codex-OAuth-Anmeldedaten verweisen. Verwenden Sie
`auth.order.openai` für die Konfiguration; `openclaw doctor --fix` schreibt Legacy-
Codex-Modellreferenzen, Legacy-Codex-Auth-Profil-IDs und
Legacy-Codex-Auth-Reihenfolge auf die kanonische OpenAI-Route um.

<Note>
GPT-5.5 ist sowohl über direkten OpenAI-Platform-API-Schlüssel-Zugriff als auch über
Abonnement-/OAuth-Routen verfügbar. Für ChatGPT-/Codex-Abonnement plus native Codex-
Ausführung verwenden Sie `openai/gpt-5.5`; eine nicht gesetzte Laufzeitkonfiguration wählt jetzt das Codex-
Harness für OpenAI-Agent-Turns aus. Verwenden Sie OpenAI-API-Schlüssel-Profile nur, wenn Sie
direkte API-Schlüssel-Auth für ein OpenAI-Agent-Modell möchten.
</Note>

<Note>
OpenAI-Agent-Modell-Turns erfordern das gebündelte Codex-App-Server-Plugin. Explizite
OpenClaw-Laufzeitkonfiguration bleibt als optionale Kompatibilitätsroute verfügbar. Wenn OpenClaw
explizit mit einem `openai`-OAuth-Profil ausgewählt wird, behält OpenClaw die
öffentliche Modellreferenz als `openai/*` bei und leitet intern über den Codex-Auth-
Transport. Führen Sie `openclaw doctor --fix` aus, um veraltete
Legacy-Codex-Modellreferenzen, `codex-cli/*` oder alte Laufzeit-Sitzungs-Pins zu reparieren, die nicht aus
expliziter Laufzeitkonfiguration stammen.
</Note>

## OpenClaw-Funktionsabdeckung

| OpenAI-Fähigkeit         | OpenClaw-Oberfläche                                                                          | Status                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Chat / Responses          | `openai/<model>`-Modell-Provider                                                              | Ja                                                                     |
| Codex-Abonnementmodelle   | `openai/<model>` mit OpenAI-OAuth                                                             | Ja                                                                     |
| Legacy-Codex-Modellreferenzen | Legacy-Codex-Modellreferenzen oder `codex-cli/<model>`                                    | Wird von doctor zu `openai/<model>` repariert                          |
| Codex-App-Server-Harness  | `openai/<model>` mit ausgelassener Laufzeit oder Provider-/Modell `agentRuntime.id: codex`    | Ja                                                                     |
| Serverseitige Websuche    | Natives OpenAI-Responses-Tool                                                                  | Ja, wenn Websuche aktiviert ist und kein Provider festgelegt ist       |
| Bilder                    | `image_generate`                                                                              | Ja                                                                     |
| Videos                    | `video_generate`                                                                              | Ja                                                                     |
| Text-to-speech            | `messages.tts.provider: "openai"` / `tts`                                                     | Ja                                                                     |
| Batch speech-to-text      | `tools.media.audio` / Medienverständnis                                                       | Ja                                                                     |
| Streaming speech-to-text  | Voice Call `streaming.provider: "openai"`                                                     | Ja                                                                     |
| Realtime-Sprache          | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Ja (erfordert OpenAI-Platform-Guthaben, kein Codex-/ChatGPT-Abonnement) |
| Embeddings                | Memory-Embedding-Provider                                                                     | Ja                                                                     |

<Note>
  OpenAI-Realtime-Sprache (verwendet von Voice Calls `realtime.provider: "openai"` und
  Control UI Talk mit `talk.realtime.provider: "openai"`) läuft über die
  öffentliche **OpenAI Platform Realtime API**, die gegen OpenAI-
  Platform-Guthaben abgerechnet wird statt gegen Codex-/ChatGPT-Abonnementkontingent. Ein Konto
  mit funktionierendem OpenAI-OAuth, das Codex-gestützte Chatmodelle problemlos ausführt,
  benötigt trotzdem ein OpenAI-API-Schlüssel-Auth-Profil oder einen Platform-API-Schlüssel mit finanzierter
  Platform-Abrechnung für Realtime-Sprache.

Lösung: Laden Sie Platform-Guthaben unter
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
für die Organisation auf, die Ihre Realtime-Anmeldedaten stützt. Realtime-Sprache akzeptiert
das durch `openclaw onboard --auth-choice openai-api-key` erstellte `openai`-API-Schlüssel-Auth-Profil,
einen Platform-`OPENAI_API_KEY`, der über `talk.realtime.providers.openai.apiKey`
für Control UI Talk konfiguriert ist, `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
für Voice Call oder die Umgebungsvariable `OPENAI_API_KEY`. OpenAI-OAuth-
Profile können weiterhin Codex-gestützte `openai/*`-Chatmodelle in derselben
OpenClaw-Installation ausführen, konfigurieren aber keine Realtime-Sprache.
</Note>

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
diese als Provider-spezifische `input_type`-Anfragefelder weiter: Abfrage-Embeddings verwenden
`queryInputType`; indexierte Memory-Chunks und Batch-Indexierung verwenden
`documentInputType`. Das vollständige Beispiel finden Sie in der [Memory-Konfigurationsreferenz](/de/reference/memory-config#provider-specific-config).

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="API-Schlüssel (OpenAI Platform)">
    **Am besten geeignet für:** direkten API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen oder kopieren Sie einen API-Schlüssel aus dem [OpenAI Platform Dashboard](https://platform.openai.com/api-keys).
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

    | Modellreferenz         | Laufzeitkonfiguration       | Route                       | Auth             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | ausgelassen / Provider-/Modell `agentRuntime.id: "codex"` | Codex-App-Server-Harness | Codex-kompatibles OpenAI-Profil |
    | `openai/gpt-5.4-mini` | ausgelassen / Provider-/Modell `agentRuntime.id: "codex"` | Codex-App-Server-Harness | Codex-kompatibles OpenAI-Profil |
    | `openai/gpt-5.5`      | Provider-/Modell `agentRuntime.id: "openclaw"`              | Eingebettete OpenClaw-Laufzeit | Ausgewähltes `openai`-Profil |

    <Note>
    `openai/*`-Agent-Modelle verwenden das Codex-App-Server-Harness. Um API-Schlüssel-
    Authentifizierung für ein Agent-Modell zu verwenden, erstellen Sie ein Codex-kompatibles API-Schlüssel-Profil und ordnen
    es mit `auth.order.openai`; `OPENAI_API_KEY` bleibt der direkte Fallback für
    Nicht-Agent-OpenAI-API-Oberflächen. Führen Sie `openclaw doctor --fix` aus, um ältere
    Legacy-Codex-Auth-Order-Einträge zu migrieren.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Um das aktuelle Instant-Modell von ChatGPT aus der OpenAI API auszuprobieren, setzen Sie das Modell
    auf `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` ist ein beweglicher Alias. OpenAI dokumentiert ihn als das neueste Instant-
    Modell, das in ChatGPT verwendet wird, und empfiehlt `gpt-5.5` für die produktive API-Nutzung. Behalten Sie daher
    `openai/gpt-5.5` als stabilen Standard bei, es sei denn, Sie möchten ausdrücklich dieses
    Alias-Verhalten. Der Alias akzeptiert derzeit nur `medium`-Textausführlichkeit, daher
    normalisiert OpenClaw inkompatible OpenAI-Textausführlichkeits-Overrides für dieses
    Modell.

    <Warning>
    OpenClaw stellt `gpt-5.3-codex-spark` **nicht** über die direkte OpenAI-API-Schlüssel-Route bereit. Es ist nur über Codex-Abonnement-Katalogeinträge verfügbar, wenn Ihr angemeldetes Konto es bereitstellt.
    </Warning>

  </Tab>

  <Tab title="Codex-Abonnement">
    **Am besten geeignet für:** die Nutzung Ihres ChatGPT/Codex-Abonnements mit nativer Codex-App-Server-Ausführung statt eines separaten API-Schlüssels. Codex Cloud erfordert eine ChatGPT-Anmeldung.

    <Steps>
      <Step title="Codex OAuth ausführen">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Oder führen Sie OAuth direkt aus:

        ```bash
        openclaw models auth login --provider openai
        ```

        Fügen Sie für headless oder Callback-feindliche Setups `--device-code` hinzu, um sich mit einem ChatGPT-Gerätecode-Flow statt mit dem Localhost-Browser-Callback anzumelden:

        ```bash
        openclaw models auth login --provider openai --device-code
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
      <Step title="Verifizieren, dass Codex-Authentifizierung verfügbar ist">
        ```bash
        openclaw models list --provider openai
        ```

        Nachdem der Gateway läuft, senden Sie `/codex status` oder `/codex models`
        im Chat, um die native App-Server-Runtime zu verifizieren.
      </Step>
    </Steps>

    ### Routenübersicht

    | Modell-Ref | Runtime-Konfiguration | Route | Auth |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | ausgelassen / Provider/Modell `agentRuntime.id: "codex"` | Natives Codex-App-Server-Harness | Codex-Anmeldung oder geordnetes `openai`-Auth-Profil |
    | `openai/gpt-5.5` | Provider/Modell `agentRuntime.id: "openclaw"` | Eingebettete OpenClaw-Runtime mit internem Codex-Auth-Transport | Ausgewähltes `openai`-OAuth-Profil |
    | Legacy-Codex-GPT-5.5-Ref | von doctor repariert | Legacy-Route in `openai/gpt-5.5` umgeschrieben | Migriertes OpenAI-OAuth-Profil |
    | `codex-cli/gpt-5.5` | von doctor repariert | Legacy-CLI-Route in `openai/gpt-5.5` umgeschrieben | Codex-App-Server-Auth |

    <Warning>
    Bevorzugen Sie `openai/gpt-5.5` für neue abonnementgestützte Agent-Konfiguration. Ältere
    Legacy-Codex-GPT-Refs sind Legacy-OpenClaw-Routen, nicht der native Codex-Runtime-
    Pfad; führen Sie `openclaw doctor --fix` aus, wenn Sie sie zu kanonischen
    `openai/*`-Refs migrieren möchten. `gpt-5.3-codex-spark` bleibt auf Konten beschränkt, deren
    Codex-Abonnement-Katalog dieses Modell bewirbt; direkte OpenAI-API-Schlüssel- und
    Azure-Refs dafür bleiben unterdrückt.
    </Warning>

    <Note>
    Das Legacy-Codex-Modellpräfix ist Legacy-Konfiguration, die von doctor repariert wird. Für
    das übliche Setup aus Abonnement plus nativer Runtime melden Sie sich mit Codex-Auth an,
    behalten aber die Modell-Ref als `openai/gpt-5.5` bei. Neue Konfiguration sollte die OpenAI-
    Agent-Auth-Order unter `auth.order.openai` ablegen; doctor migriert ältere
    Legacy-Codex-Auth-Order-Einträge.
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
    Auth-Order unter `openai` ab. OpenClaw versucht zuerst das Abonnement, dann
    den API-Schlüssel, während es auf dem Codex-Harness bleibt:

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
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    Onboarding importiert kein OAuth-Material mehr aus `~/.codex`. Melden Sie sich mit Browser-OAuth (Standard) oder dem Gerätecode-Flow oben an — OpenClaw verwaltet die resultierenden Anmeldedaten in seinem eigenen Agent-Auth-Speicher.
    </Note>

    ### Codex-OAuth-Routing prüfen und wiederherstellen

    Verwenden Sie diese Befehle, um zu sehen, welches Modell, welche Runtime und welche Auth-Route Ihr Standard-
    Agent verwendet:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Fügen Sie für einen bestimmten Agent `--agent <id>` hinzu:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Wenn eine ältere Konfiguration noch Legacy-Codex-GPT-Refs oder einen veralteten OpenAI-Runtime-
    Session-Pin ohne explizite Runtime-Konfiguration enthält, reparieren Sie sie:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Wenn `models auth list --provider openai` kein nutzbares Profil anzeigt, melden Sie sich
    erneut an:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Verwenden Sie `--profile-id`, wenn Sie mehrere Codex-OAuth-Anmeldungen im selben
    Agent möchten und diese später über Auth-Ordering oder `/model ...@<profileId>` steuern möchten:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` ist die Modellroute für OpenAI-Agent-Turns über Codex. Führen Sie
    `openclaw doctor --fix` aus, um ältere Legacy-OpenAI-Codex-Präfix-Profil-IDs und
    Order-Einträge zu migrieren, bevor Sie sich auf Profil-Ordering verlassen.

    ### Statusanzeige

    Chat `/status` zeigt, welche Modell-Runtime für die aktuelle Sitzung aktiv ist.
    Das gebündelte Codex-App-Server-Harness erscheint als `Runtime: OpenAI Codex` für
    OpenAI-Agent-Modell-Turns. Veraltete OpenAI-Runtime-Session-Pins werden zu Codex repariert, es sei denn,
    die Konfiguration pinnt ausdrücklich OpenClaw.

    ### Doctor-Warnung

    Wenn Legacy-Codex-Modell-Refs oder veraltete OpenAI-Runtime-Pins in der Konfiguration oder im
    Sitzungsstatus verbleiben, schreibt `openclaw doctor --fix` sie in `openai/*` mit der
    Codex-Runtime um, sofern OpenClaw nicht ausdrücklich konfiguriert ist.

    ### Kontextfenster-Obergrenze

    OpenClaw behandelt Modellmetadaten und die Runtime-Kontextobergrenze als getrennte Werte.

    Für `openai/gpt-5.5` über den Codex-OAuth-Katalog:

    - Native `contextWindow`: `1000000`
    - Standardmäßige Runtime-`contextTokens`-Obergrenze: `272000`

    Die kleinere Standardobergrenze hat in der Praxis bessere Latenz- und Qualitätsmerkmale. Überschreiben Sie sie mit `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          openai: {
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
    vorhanden sind. Wenn die Live-Codex-Ermittlung die `gpt-5.5`-Zeile auslässt, während
    das Konto authentifiziert ist, synthetisiert OpenClaw diese OAuth-Modellzeile, damit
    Cron-, Sub-Agent- und konfigurierte Standardmodell-Läufe nicht mit
    `Unknown model` fehlschlagen.

  </Tab>
</Tabs>

## Native Codex-App-Server-Auth

Das native Codex-App-Server-Harness verwendet `openai/*`-Modell-Refs plus ausgelassene
Runtime-Konfiguration oder Provider/Modell `agentRuntime.id: "codex"`, aber seine Authentifizierung ist
weiterhin kontobasiert. OpenClaw wählt Auth in dieser Reihenfolge aus:

1. Geordnete OpenAI-Auth-Profile für den Agent, vorzugsweise unter
   `auth.order.openai`. Führen Sie `openclaw doctor --fix` aus, um ältere
   Legacy-Codex-Auth-Profil-IDs und Legacy-Codex-Auth-Order zu migrieren.
2. Das vorhandene Konto des App-Servers, etwa eine lokale Codex-CLI-ChatGPT-Anmeldung.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn der App-Server kein Konto meldet und weiterhin
   OpenAI-Auth erfordert.

Das bedeutet, dass eine lokale ChatGPT/Codex-Abonnement-Anmeldung nicht ersetzt wird, nur
weil der Gateway-Prozess auch `OPENAI_API_KEY` für direkte OpenAI-Modelle
oder Embeddings hat. Env-API-Schlüssel-Fallback ist nur der lokale stdio-Pfad ohne Konto; er
wird nicht an WebSocket-App-Server-Verbindungen gesendet. Wenn ein abonnementartiges Codex-
Profil ausgewählt ist, hält OpenClaw außerdem `CODEX_API_KEY` und `OPENAI_API_KEY`
aus dem gestarteten stdio-App-Server-Kindprozess heraus und sendet die ausgewählten Anmeldedaten
über den App-Server-Login-RPC. Wenn dieses Abonnementprofil durch ein
Codex-Nutzungslimit blockiert ist, kann OpenClaw zum nächsten geordneten `openai:*`-API-Schlüssel-
Profil rotieren, ohne das ausgewählte Modell zu ändern oder aus dem Codex-
Harness herauszufallen. Sobald die Rücksetzzeit des Abonnements verstrichen ist, ist das Abonnementprofil
wieder berechtigt.

## Bildgenerierung

Das gebündelte `openai`-Plugin registriert Bildgenerierung über das Tool `image_generate`.
Es unterstützt sowohl OpenAI-API-Schlüssel-Bildgenerierung als auch Codex-OAuth-Bild-
generierung über dieselbe `openai/gpt-image-2`-Modell-Ref.

| Fähigkeit                 | OpenAI-API-Schlüssel              | Codex OAuth                         |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Modell-Ref                | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | OpenAI-Codex-OAuth-Anmeldung         |
| Transport                 | OpenAI Images API                  | Codex Responses-Backend              |
| Maximale Bilder pro Anfrage | 4                                | 4                                    |
| Bearbeitungsmodus         | Aktiviert (bis zu 5 Referenzbilder) | Aktiviert (bis zu 5 Referenzbilder) |
| Größen-Overrides          | Unterstützt, einschließlich 2K/4K-Größen | Unterstützt, einschließlich 2K/4K-Größen |
| Seitenverhältnis / Auflösung | Nicht an OpenAI Images API weitergeleitet | Wird sicherheitsabhängig einer unterstützten Größe zugeordnet |

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

`gpt-image-2` ist der Standard sowohl für OpenAI-Text-zu-Bild-Generierung als auch für Bild-
bearbeitung. `gpt-image-1.5`, `gpt-image-1` und `gpt-image-1-mini` bleiben als
explizite Modell-Overrides nutzbar. Verwenden Sie `openai/gpt-image-1.5` für PNG/WebP-Ausgabe
mit transparentem Hintergrund; die aktuelle `gpt-image-2`-API lehnt
`background: "transparent"` ab.

Bei einer Anfrage mit transparentem Hintergrund sollten Agents `image_generate` mit
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` oder `"webp"` und
`background: "transparent"` aufrufen; die ältere Provider-Option
`openai.background` wird weiterhin akzeptiert. OpenClaw schützt außerdem die
öffentlichen OAuth-Routen von OpenAI und OpenAI Codex, indem transparente
Standardanfragen für `openai/gpt-image-2` auf `gpt-image-1.5` umgeschrieben
werden; Azure und benutzerdefinierte OpenAI-kompatible Endpunkte behalten ihre
konfigurierten Deployment-/Modellnamen.

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
`openclaw infer image edit`, wenn Sie mit einer Eingabedatei beginnen.
`--openai-background` bleibt als OpenAI-spezifischer Alias verfügbar.
Verwenden Sie `--quality low|medium|high|auto`, wenn Sie Qualität und Kosten von
OpenAI Images steuern müssen. Verwenden Sie `--openai-moderation low|auto`, um
OpenAIs providerspezifischen Moderationshinweis aus `image generate` oder
`image edit` zu übergeben.

Behalten Sie bei ChatGPT-/Codex-OAuth-Installationen dieselbe
`openai/gpt-image-2`-Referenz bei. Wenn ein `openai`-OAuth-Profil konfiguriert
ist, löst OpenClaw dieses gespeicherte OAuth-Zugriffstoken auf und sendet
Bildanfragen über das Codex Responses-Backend. Es versucht für diese Anfrage
nicht zuerst `OPENAI_API_KEY` und fällt auch nicht stillschweigend auf einen
API-Schlüssel zurück. Konfigurieren Sie `models.providers.openai` explizit mit
einem API-Schlüssel, einer benutzerdefinierten Basis-URL oder einem
Azure-Endpunkt, wenn Sie stattdessen die direkte OpenAI-Images-API-Route
verwenden möchten.
Wenn sich dieser benutzerdefinierte Bildendpunkt in einem vertrauenswürdigen
LAN oder unter einer privaten Adresse befindet, setzen Sie außerdem
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw blockiert
private/interne OpenAI-kompatible Bildendpunkte, sofern dieses Opt-in nicht
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

Das gebündelte `openai`-Plugin registriert die Videogenerierung über das Tool `video_generate`.

| Fähigkeit        | Wert                                                                              |
| ---------------- | --------------------------------------------------------------------------------- |
| Standardmodell   | `openai/sora-2`                                                                   |
| Modi             | Text-zu-Video, Bild-zu-Video, Einzelvideo-Bearbeitung                             |
| Referenzeingaben | 1 Bild oder 1 Video                                                               |
| Größenüberschreibungen | Für Text-zu-Video und Bild-zu-Video unterstützt                            |
| Andere Überschreibungen | `aspectRatio`, `resolution`, `audio`, `watermark` werden mit einer Tool-Warnung ignoriert |

OpenAI-Bild-zu-Video-Anfragen verwenden `POST /v1/videos` mit einer Bild-
`input_reference`. Einzelvideo-Bearbeitungen verwenden `POST /v1/videos/edits`
mit dem hochgeladenen Video im Feld `video`.

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

OpenClaw fügt einen gemeinsamen GPT-5-Prompt-Beitrag für Läufe der GPT-5-Familie
auf von OpenClaw zusammengesetzten Prompt-Oberflächen hinzu. Er wird anhand der
Modell-ID angewendet, sodass OpenClaw-/Provider-Routen wie veraltete
Pre-Repair-Referenzen (veraltete Codex-GPT-5.5-Referenz),
`openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` und andere kompatible
GPT-5-Referenzen dasselbe Overlay erhalten. Ältere GPT-4.x-Modelle erhalten es
nicht.

Das gebündelte native Codex-Harness erhält dieses OpenClaw-GPT-5-Overlay nicht
über Codex-App-Server-Developer-Instructions. Native Codex behält das von Codex
verwaltete Basis-, Modell- und Projekt-Dokumentverhalten bei, während OpenClaw
die integrierte Persönlichkeit von Codex für native Threads deaktiviert, damit
Persönlichkeitsdateien im Agent-Arbeitsbereich maßgeblich bleiben. OpenClaw
trägt nur Laufzeitkontext wie Channel-Zustellung, dynamische OpenClaw-Tools,
ACP-Delegierung, Arbeitsbereichskontext und OpenClaw-Skills bei.

Der GPT-5-Beitrag fügt einen getaggten Verhaltensvertrag für
Persona-Persistenz, Ausführungssicherheit, Tool-Disziplin, Ausgabeform,
Abschlussprüfungen und Verifizierung bei passenden, von OpenClaw
zusammengesetzten Prompts hinzu. Channelspezifisches Antwort- und
Silent-Message-Verhalten bleibt im gemeinsamen OpenClaw-Systemprompt und in der
ausgehenden Zustellungsrichtlinie. Die freundliche Interaktionsstil-Ebene ist
separat und konfigurierbar.

| Wert                   | Wirkung                                         |
| ---------------------- | ----------------------------------------------- |
| `"friendly"` (Standard) | Aktiviert die freundliche Interaktionsstil-Ebene |
| `"on"`                 | Alias für `"friendly"`                          |
| `"off"`                | Deaktiviert nur die freundliche Stil-Ebene       |

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
Bei der Laufzeit wird Groß-/Kleinschreibung für Werte ignoriert, daher deaktivieren `"Off"` und `"off"` beide die freundliche Stil-Ebene.
</Tip>

<Note>
Das veraltete `plugins.entries.openai.config.personality` wird weiterhin als Kompatibilitäts-Fallback gelesen, wenn die gemeinsame Einstellung `agents.defaults.promptOverlays.gpt5.personality` nicht gesetzt ist.
</Note>

## Stimme und Sprache

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    Das gebündelte `openai`-Plugin registriert Sprachsynthese für die Oberfläche `messages.tts`.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Stimme | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | Geschwindigkeit | `messages.tts.providers.openai.speed` | (nicht gesetzt) |
    | Anweisungen | `messages.tts.providers.openai.instructions` | (nicht gesetzt, nur `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` für Sprachnachrichten, `mp3` für Dateien |
    | API-Schlüssel | `messages.tts.providers.openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |
    | Basis-URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Zusätzlicher Body | `messages.tts.providers.openai.extraBody` / `extra_body` | (nicht gesetzt) |

    Verfügbare Modelle: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Verfügbare Stimmen: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` wird nach den von OpenClaw generierten Feldern in das JSON der Anfrage an `/audio/speech` zusammengeführt. Verwenden Sie dies daher für OpenAI-kompatible Endpunkte, die zusätzliche Schlüssel wie `lang` erfordern. Prototyp-Schlüssel werden ignoriert.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Setzen Sie `OPENAI_TTS_BASE_URL`, um die TTS-Basis-URL zu überschreiben, ohne den Chat-API-Endpunkt zu beeinflussen. OpenAI TTS und Realtime Voice werden beide über einen OpenAI-Platform-API-Schlüssel konfiguriert; reine OAuth-Installationen können weiterhin Codex-gestützte Chat-Modelle verwenden, aber kein OpenAI-Live-Talkback.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Das gebündelte `openai`-Plugin registriert Batch-Sprache-zu-Text über
    OpenClaws Transkriptionsoberfläche für Medienverständnis.

    - Standardmodell: `gpt-4o-transcribe`
    - Endpunkt: OpenAI REST `/v1/audio/transcriptions`
    - Eingabepfad: Multipart-Audiodatei-Upload
    - Unterstützt durch OpenClaw überall dort, wo eingehende Audiotranskription
      `tools.media.audio` verwendet, einschließlich Discord-Sprachkanal-Segmenten und
      Channel-Audioanhängen

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
    gemeinsamen Audio-Medienkonfiguration oder der Transkriptionsanfrage pro Aufruf
    bereitgestellt werden.

  </Accordion>

  <Accordion title="Realtime transcription">
    Das gebündelte `openai`-Plugin registriert Realtime-Transkription für das Voice-Call-Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Sprache | `...openai.language` | (nicht gesetzt) |
    | Prompt | `...openai.prompt` | (nicht gesetzt) |
    | Dauer der Stille | `...openai.silenceDurationMs` | `800` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | Authentifizierung | `...openai.apiKey`, `OPENAI_API_KEY` oder `openai` OAuth | API-Schlüssel verbinden direkt; OAuth prägt ein Realtime-Transkriptions-Client-Secret |

    <Note>
    Verwendet eine WebSocket-Verbindung zu `wss://api.openai.com/v1/realtime` mit G.711 u-law (`g711_ulaw` / `audio/pcmu`)-Audio. Wenn nur `openai` OAuth konfiguriert ist, prägt das Gateway ein kurzlebiges Realtime-Transkriptions-Client-Secret, bevor es den WebSocket öffnet. Dieser Streaming-Provider ist für den Realtime-Transkriptionspfad von Voice Call vorgesehen; Discord Voice zeichnet derzeit kurze Segmente auf und verwendet stattdessen den Batch-Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    Das gebündelte `openai`-Plugin registriert Realtime Voice für das Voice-Call-Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Stimme | `...openai.voice` | `alloy` |
    | Temperatur (Azure-Deployment-Bridge) | `...openai.temperature` | `0.8` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | Dauer der Stille | `...openai.silenceDurationMs` | `500` |
    | Präfix-Padding | `...openai.prefixPaddingMs` | `300` |
    | Reasoning-Aufwand | `...openai.reasoningEffort` | (nicht gesetzt) |
    | Authentifizierung | `openai` API-Key-Auth-Profil, `...openai.apiKey` oder `OPENAI_API_KEY` | OpenAI-Platform-API-Schlüssel erforderlich; OpenAI OAuth konfiguriert Realtime Voice nicht |

    Verfügbare integrierte Realtime-Stimmen für `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI empfiehlt `marin` und `cedar` für die beste Realtime-Qualität. Dies
    ist eine separate Menge gegenüber den Text-to-Speech-Stimmen oben; nehmen Sie
    nicht an, dass eine TTS-Stimme wie `fable`, `nova` oder `onyx` für
    Realtime-Sitzungen gültig ist.

    <Note>
    Backend-OpenAI-Realtime-Bridges verwenden die GA-Realtime-WebSocket-Sitzungsform, die `session.temperature` nicht akzeptiert. Azure-OpenAI-Deployments bleiben über `azureEndpoint` und `azureDeployment` verfügbar und behalten die deploymentkompatible Sitzungsform bei. Unterstützt bidirektionale Tool-Aufrufe und G.711 u-law-Audio.
    </Note>

    <Note>
    Realtime Voice wird ausgewählt, wenn die Sitzung erstellt wird. OpenAI erlaubt, dass die meisten Sitzungsfelder später geändert werden, aber die Stimme kann nicht mehr geändert werden, nachdem das Modell in dieser Sitzung Audio ausgegeben hat. OpenClaw stellt derzeit die integrierten Realtime-Voice-IDs als Strings bereit.
    </Note>

    <Note>
    Control UI Talk verwendet OpenAI-Browser-Echtzeitsitzungen mit einem vom Gateway ausgestellten
    kurzlebigen Client-Secret und einem direkten Browser-WebRTC-SDP-Austausch mit der
    OpenAI Realtime API. Das Gateway stellt dieses Client-Secret mit dem ausgewählten
    `openai`-API-Schlüssel-Authentifizierungsprofil oder dem konfigurierten OpenAI Platform API-Schlüssel aus. Gateway-
    Relay- und Voice Call-Backend-Echtzeit-WebSocket-Bridges verwenden denselben
    Authentifizierungspfad ausschließlich per API-Schlüssel für native OpenAI-Endpunkte. Live-Verifizierung für Maintainer
    ist verfügbar mit
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    die OpenAI-Abschnitte verifizieren sowohl die Backend-WebSocket-Bridge als auch den Browser-
    WebRTC-SDP-Austausch, ohne Secrets zu protokollieren.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI-Endpunkte

Der gebündelte `openai`-Provider kann eine Azure OpenAI-Ressource für die Bildgenerierung
ansteuern, indem die Basis-URL überschrieben wird. Auf dem Bildgenerierungspfad erkennt OpenClaw
Azure-Hostnamen in `models.providers.openai.baseUrl` und wechselt automatisch zur
Anfrageform von Azure.

<Note>
Echtzeit-Sprache verwendet einen separaten Konfigurationspfad
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
und wird nicht von `models.providers.openai.baseUrl` beeinflusst. Die Azure-
Einstellungen finden Sie im Accordion **Echtzeit-Sprache**
unter [Sprache und Sprachausgabe](#voice-and-speech).
</Note>

Verwenden Sie Azure OpenAI, wenn:

- Sie bereits über ein Azure OpenAI-Abonnement, Kontingent oder eine Unternehmensvereinbarung verfügen
- Sie regionale Datenresidenz oder von Azure bereitgestellte Compliance-Kontrollen benötigen
- Sie Datenverkehr innerhalb eines bestehenden Azure-Mandanten halten möchten

### Konfiguration

Für Azure-Bildgenerierung über den gebündelten `openai`-Provider richten Sie
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

OpenClaw erkennt diese Azure-Hostsuffixe für die Azure-Bildgenerierungsroute:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Bei Bildgenerierungsanfragen an einen erkannten Azure-Host führt OpenClaw Folgendes aus:

- Sendet den Header `api-key` statt `Authorization: Bearer`
- Verwendet bereitstellungsbezogene Pfade (`/openai/deployments/{deployment}/...`)
- Hängt `?api-version=...` an jede Anfrage an
- Verwendet ein standardmäßiges Anfrage-Timeout von 600 s für Azure-Bildgenerierungsaufrufe.
  Pro-Aufruf-Werte für `timeoutMs` überschreiben diesen Standard weiterhin.

Andere Basis-URLs (öffentliches OpenAI, OpenAI-kompatible Proxys) behalten die standardmäßige
OpenAI-Bildanfrageform bei.

<Note>
Azure-Routing für den Bildgenerierungspfad des `openai`-Providers erfordert
OpenClaw 2026.4.22 oder höher. Frühere Versionen behandeln jede benutzerdefinierte
`openai.baseUrl` wie den öffentlichen OpenAI-Endpunkt und schlagen bei Azure-
Bildbereitstellungen fehl.
</Note>

### API-Version

Setzen Sie `AZURE_OPENAI_API_VERSION`, um eine bestimmte Azure-Preview- oder GA-Version
für den Azure-Bildgenerierungspfad festzulegen:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Der Standard ist `2024-12-01-preview`, wenn die Variable nicht gesetzt ist.

### Modellnamen sind Bereitstellungsnamen

Azure OpenAI bindet Modelle an Bereitstellungen. Für Azure-Bildgenerierungsanfragen,
die über den gebündelten `openai`-Provider geroutet werden, muss das Feld `model` in OpenClaw
der **Azure-Bereitstellungsname** sein, den Sie im Azure-Portal konfiguriert haben, nicht
die öffentliche OpenAI-Modell-ID.

Wenn Sie eine Bereitstellung namens `gpt-image-2-prod` erstellen, die `gpt-image-2` bereitstellt:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Dieselbe Regel für Bereitstellungsnamen gilt für Bildgenerierungsaufrufe, die über
den gebündelten `openai`-Provider geroutet werden.

### Regionale Verfügbarkeit

Azure-Bildgenerierung ist derzeit nur in einer Teilmenge von Regionen verfügbar
(zum Beispiel `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Prüfen Sie Microsofts aktuelle Regionsliste, bevor Sie eine
Bereitstellung erstellen, und bestätigen Sie, dass das konkrete Modell in Ihrer Region angeboten wird.

### Parameterunterschiede

Azure OpenAI und öffentliches OpenAI akzeptieren nicht immer dieselben Bildparameter.
Azure kann Optionen ablehnen, die öffentliches OpenAI erlaubt (zum Beispiel bestimmte
`background`-Werte bei `gpt-image-2`), oder sie nur in bestimmten Modellversionen
bereitstellen. Diese Unterschiede stammen von Azure und dem zugrunde liegenden Modell, nicht
von OpenClaw. Wenn eine Azure-Anfrage mit einem Validierungsfehler fehlschlägt, prüfen Sie den
Parametersatz, der von Ihrer konkreten Bereitstellung und API-Version im
Azure-Portal unterstützt wird.

<Note>
Azure OpenAI verwendet natives Transport- und Kompatibilitätsverhalten, erhält aber nicht
die versteckten Attribution-Header von OpenClaw — siehe das Accordion **Native vs. OpenAI-kompatible
Routen** unter [Erweiterte Konfiguration](#advanced-configuration).

Für Chat- oder Responses-Datenverkehr auf Azure (über Bildgenerierung hinaus) verwenden Sie den
Onboarding-Flow oder eine dedizierte Azure-Provider-Konfiguration — `openai.baseUrl` allein
übernimmt nicht die Azure-API-/Authentifizierungsform. Ein separater
`azure-openai-responses/*`-Provider existiert; siehe
das Accordion zur serverseitigen Compaction unten.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs. SSE)">
    OpenClaw verwendet WebSocket zuerst mit SSE-Fallback (`"auto"`) für `openai/*`.

    Im Modus `"auto"` führt OpenClaw Folgendes aus:
    - Wiederholt einen frühen WebSocket-Fehler einmal, bevor auf SSE zurückgefallen wird
    - Markiert WebSocket nach einem Fehler für ca. 60 Sekunden als beeinträchtigt und verwendet SSE während der Abkühlphase
    - Hängt stabile Sitzungs- und Turn-Identitätsheader für Wiederholungen und Wiederverbindungen an
    - Normalisiert Nutzungszähler (`input_tokens` / `prompt_tokens`) über Transportvarianten hinweg

    | Wert | Verhalten |
    |-------|----------|
    | `"auto"` (Standard) | WebSocket zuerst, SSE-Fallback |
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

    Verwandte OpenAI-Dokumentation:
    - [Realtime API mit WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming-API-Antworten (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Schnellmodus">
    OpenClaw stellt einen gemeinsamen Schnellmodus-Schalter für `openai/*` bereit:

    - **Chat/UI:** `/fast status|auto|on|off`
    - **Konfiguration:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Wenn aktiviert, ordnet OpenClaw den Schnellmodus der OpenAI-Prioritätsverarbeitung zu (`service_tier = "priority"`). Bestehende `service_tier`-Werte bleiben erhalten, und der Schnellmodus schreibt `reasoning` oder `text.verbosity` nicht um. `fastMode: "auto"` startet neue Modellaufrufe bis zum automatischen Grenzwert schnell und startet spätere Wiederholungs-, Fallback-, Tool-Ergebnis- oder Fortsetzungsaufrufe dann ohne Schnellmodus. Der Grenzwert beträgt standardmäßig 60 Sekunden; setzen Sie `params.fastAutoOnSeconds` am aktiven Modell, um ihn zu ändern.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    Sitzungsüberschreibungen haben Vorrang vor der Konfiguration. Wenn die Sitzungsüberschreibung in der Sessions UI gelöscht wird, kehrt die Sitzung zum konfigurierten Standard zurück.
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
    `serviceTier` wird nur an native OpenAI-Endpunkte (`api.openai.com`) und native Codex-Endpunkte (`chatgpt.com/backend-api`) weitergeleitet. Wenn Sie einen der Provider über einen Proxy routen, lässt OpenClaw `service_tier` unverändert.
    </Warning>

  </Accordion>

  <Accordion title="Serverseitige Compaction (Responses API)">
    Für direkte OpenAI-Responses-Modelle (`openai/*` auf `api.openai.com`) aktiviert der OpenClaw-Stream-Wrapper des OpenAI-Plugins automatisch serverseitige Compaction:

    - Erzwingt `store: true` (sofern die Modellkompatibilität nicht `supportsStore: false` setzt)
    - Injiziert `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Standardwert für `compact_threshold`: 70 % von `contextWindow` (oder `80000`, wenn nicht verfügbar)

    Dies gilt für den integrierten OpenClaw-Laufzeitpfad und für OpenAI-Provider-Hooks, die von eingebetteten Läufen verwendet werden. Das native Codex-App-Server-Harness verwaltet seinen eigenen Kontext über Codex und wird durch die standardmäßige Agent-Route von OpenAI oder die Provider-/Modell-Laufzeitrichtlinie konfiguriert.

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
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Mit `strict-agentic` führt OpenClaw Folgendes aus:
    - Aktiviert `update_plan` bei umfangreicher Arbeit automatisch
    - Wiederholt strukturell leere oder reine Reasoning-Turns mit einer Fortsetzung mit sichtbarer Antwort
    - Verwendet explizite Harness-Planereignisse, wenn das ausgewählte Harness sie bereitstellt

    OpenClaw klassifiziert Assistentenprosa nicht, um zu entscheiden, ob ein Turn ein Plan, eine Fortschrittsaktualisierung oder eine finale Antwort ist.

    <Note>
    Nur auf OpenAI- und Codex-Läufe der GPT-5-Familie beschränkt. Andere Provider und ältere Modellfamilien behalten das Standardverhalten bei.
    </Note>

  </Accordion>

  <Accordion title="Native vs. OpenAI-kompatible Routen">
    OpenClaw behandelt direkte OpenAI-, Codex- und Azure OpenAI-Endpunkte anders als generische OpenAI-kompatible `/v1`-Proxys:

    **Native Routen** (`openai/*`, Azure OpenAI):
    - Behalten `reasoning: { effort: "none" }` nur für Modelle bei, die den OpenAI-Aufwand `none` unterstützen
    - Lassen deaktiviertes Reasoning für Modelle oder Proxys weg, die `reasoning.effort: "none"` ablehnen
    - Setzen Tool-Schemas standardmäßig auf strikten Modus
    - Hängen versteckte Attribution-Header nur auf verifizierten nativen Hosts an
    - Behalten OpenAI-spezifische Anfrageformung (`service_tier`, `store`, Reasoning-Kompatibilität, Prompt-Cache-Hinweise)

    **Proxy-/kompatible Routen:**
    - Lockereres Kompatibilitätsverhalten verwenden
    - Completions-`store` aus nicht nativen `openai-completions`-Payloads entfernen
    - Erweitertes Durchreichen von JSON via `params.extra_body`/`params.extraBody` für OpenAI-kompatible Completions-Proxys akzeptieren
    - `params.chat_template_kwargs` für OpenAI-kompatible Completions-Proxys wie vLLM akzeptieren
    - Keine strikten Tool-Schemas oder rein native Header erzwingen

    Azure OpenAI verwendet nativen Transport und Kompatibilitätsverhalten, erhält aber nicht die versteckten Zuordnungs-Header.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter des Bild-Tools und Provider-Auswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Video-Tools und Provider-Auswahl.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Authentifizierungsdetails und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
