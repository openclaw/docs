---
read_when:
    - Sie möchten OpenAI-Modelle in OpenClaw verwenden
    - Sie möchten die Codex-Abonnementauthentifizierung statt API-Schlüsseln
    - Sie benötigen ein strengeres Ausführungsverhalten für GPT-5-Agenten
summary: OpenAI in OpenClaw über API-Schlüssel oder Codex-Abonnement verwenden
title: OpenAI
x-i18n:
    generated_at: "2026-07-01T07:57:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7078798b1d73bd1efca4820eae6d3fb6510e802b2c9193d0c135d8ab28c58fca
    source_path: providers/openai.md
    workflow: 16
---

OpenAI stellt Entwickler-APIs für GPT-Modelle bereit, und Codex ist außerdem als
Coding-Agent für ChatGPT-Tarife über die Codex-Clients von OpenAI verfügbar. OpenClaw verwendet eine
Provider-ID, `openai`, für beide Authentifizierungsformen.

OpenClaw verwendet `openai/*` als kanonische OpenAI-Modellroute. Eingebettete Agent-
Turns auf OpenAI-Modellen laufen standardmäßig über die native Codex-App-Server-Laufzeit;
direkte Authentifizierung per OpenAI-API-Schlüssel bleibt für OpenAI-Oberflächen ohne Agent
wie Bilder, Embeddings, Sprache und Realtime verfügbar.

- **Agent-Modelle** - `openai/*`-Modelle über die Codex-Laufzeit; melden Sie sich mit
  Codex-Authentifizierung für die Nutzung eines ChatGPT-/Codex-Abonnements an, oder konfigurieren Sie ein Codex-kompatibles
  OpenAI-API-Schlüssel-Backup, wenn Sie bewusst API-Schlüssel-Authentifizierung möchten.
- **OpenAI-APIs ohne Agent** - direkter Zugriff auf die OpenAI Platform mit nutzungsbasierter
  Abrechnung über `OPENAI_API_KEY` oder OpenAI-API-Schlüssel-Onboarding.
- **Legacy-Konfiguration** - Legacy-Codex-Modellreferenzen werden durch
  `openclaw doctor --fix` zu `openai/*` plus der Codex-Laufzeit repariert.

OpenAI unterstützt ausdrücklich die Nutzung von Abonnement-OAuth in externen Tools und Workflows wie OpenClaw.

Provider, Modell, Laufzeit und Kanal sind getrennte Ebenen. Wenn diese Bezeichnungen
durcheinandergeraten, lesen Sie [Agent-Laufzeiten](/de/concepts/agent-runtimes), bevor
Sie die Konfiguration ändern.

## Schnellauswahl

| Ziel                                                 | Verwenden                                                | Hinweise                                                              |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| ChatGPT-/Codex-Abonnement mit nativer Codex-Laufzeit | `openai/gpt-5.5`                                         | Standardmäßige OpenAI-Agent-Einrichtung. Mit Codex-Auth anmelden.     |
| Eingeschränkte GPT-5.6-Vorschau                      | `openai/gpt-5.6-sol`, `-terra` oder `-luna`              | Erfordert eine von OpenAI genehmigte API-Organisation oder einen Codex-Workspace. |
| Direkte API-Schlüssel-Abrechnung für Agent-Modelle   | `openai/gpt-5.5` plus ein Codex-kompatibles API-Schlüsselprofil | Verwenden Sie `auth.order.openai`, um das Backup nach der Abonnement-Auth zu platzieren. |
| Direkte API-Schlüssel-Abrechnung über explizites OpenClaw | `openai/gpt-5.5` plus Provider-/Modell-Laufzeit `openclaw` | Wählen Sie ein normales `openai`-API-Schlüsselprofil aus.             |
| Aktueller ChatGPT Instant API-Alias                  | `openai/chat-latest`                                     | Nur direkter API-Schlüssel. Beweglicher Alias für Experimente, nicht der Standard. |
| ChatGPT-/Codex-Abonnement-Auth über OpenClaw         | `openai/gpt-5.5` plus Provider-/Modell-Laufzeit `openclaw` | Wählen Sie ein `openai`-OAuth-Profil für die Kompatibilitätsroute aus. |
| Bilderzeugung oder -bearbeitung                      | `openai/gpt-image-2`                                     | Funktioniert entweder mit `OPENAI_API_KEY` oder OpenAI Codex OAuth.   |
| Bilder mit transparentem Hintergrund                 | `openai/gpt-image-1.5`                                   | Verwenden Sie `outputFormat=png` oder `webp` und `openai.background=transparent`. |

## Namenszuordnung

Die Namen sind ähnlich, aber nicht austauschbar:

| Name, den Sie sehen                      | Ebene             | Bedeutung                                                                                         |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Provider-Präfix   | Kanonische OpenAI-Modellroute; Agent-Turns verwenden die Codex-Laufzeit.                          |
| Legacy-OpenAI-Codex-Präfix              | Legacy-Präfix     | Älterer Modell-/Profil-Namespace. `openclaw doctor --fix` migriert ihn zu `openai`.               |
| `codex`-Plugin                          | Plugin            | Gebündeltes OpenClaw-Plugin, das die native Codex-App-Server-Laufzeit und `/codex`-Chatsteuerungen bereitstellt. |
| Provider-/Modell-`agentRuntime.id: codex` | Agent-Laufzeit  | Erzwingt das native Codex-App-Server-Harness für passende eingebettete Turns.                     |
| `/codex ...`                            | Chat-Befehlssatz  | Bindet/steuert Codex-App-Server-Threads aus einer Konversation heraus.                            |
| `runtime: "acp", agentId: "codex"`      | ACP-Sitzungsroute | Expliziter Fallback-Pfad, der Codex über ACP/acpx ausführt.                                       |

Das bedeutet, dass eine Konfiguration absichtlich `openai/*`-Modellreferenzen enthalten kann, während Auth-
Profile entweder auf API-Schlüssel- oder ChatGPT-/Codex-OAuth-Anmeldedaten zeigen. Verwenden Sie
`auth.order.openai` für die Konfiguration; `openclaw doctor --fix` schreibt Legacy-
Codex-Modellreferenzen, Legacy-Codex-Auth-Profil-IDs und die
Legacy-Codex-Auth-Reihenfolge auf die kanonische OpenAI-Route um.

<Note>
GPT-5.5 ist sowohl über direkten OpenAI-Platform-API-Schlüsselzugriff als auch über
Abonnement-/OAuth-Routen verfügbar. Für ChatGPT-/Codex-Abonnement plus native Codex-
Ausführung verwenden Sie `openai/gpt-5.5`; eine nicht gesetzte Laufzeitkonfiguration wählt jetzt das Codex-
Harness für OpenAI-Agent-Turns aus. Verwenden Sie OpenAI-API-Schlüsselprofile nur, wenn Sie
direkte API-Schlüssel-Auth für ein OpenAI-Agent-Modell möchten.
</Note>

## Eingeschränkte GPT-5.6-Vorschau

OpenClaw erkennt die drei öffentlichen GPT-5.6-Modell-IDs:

- `openai/gpt-5.6-sol`
- `openai/gpt-5.6-terra`
- `openai/gpt-5.6-luna`

Alle drei stellen `max` Reasoning im aktuellen Codex-App-Server-Katalog bereit. Die
OpenAI-Launch-Ankündigung beschreibt Sol als die Flaggschiff-Stufe, Terra als die
ausgewogene Stufe und Luna als die schnelle, kostengünstigere Stufe. Siehe die
[GPT-5.6-Launch-Ankündigung](https://openai.com/index/previewing-gpt-5-6-sol/)
und den [Leitfaden zum Vorschauzugriff](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

Der Zugriff ist während der Vorschau per Allowlist beschränkt und kann separat für die
API und Codex gewährt werden. Ein kostenpflichtiger ChatGPT-Tarif allein gewährt keinen Zugriff. OpenClaw behält
`openai/gpt-5.5` als Standard bei; die Auswahl einer GPT-5.6-Referenz ohne Zugriff gibt
den Upstream-Zugriffsfehler zurück, statt stillschweigend zurückzufallen.

<Note>
OpenAI-Agent-Modell-Turns erfordern das gebündelte Codex-App-Server-Plugin. Explizite
OpenClaw-Laufzeitkonfiguration bleibt als opt-in Kompatibilitätsroute verfügbar. Wenn OpenClaw
explizit mit einem `openai`-OAuth-Profil ausgewählt wird, behält OpenClaw die
öffentliche Modellreferenz als `openai/*` bei und routet intern über den Codex-Auth-
Transport. Führen Sie `openclaw doctor --fix` aus, um veraltete
Legacy-Codex-Modellreferenzen, `codex-cli/*` oder alte Laufzeit-Sitzungs-Pins zu reparieren, die nicht aus
expliziter Laufzeitkonfiguration stammen.
</Note>

## OpenClaw-Funktionsabdeckung

| OpenAI-Fähigkeit        | OpenClaw-Oberfläche                                                                         | Status                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Chat / Responses          | `openai/<model>`-Modell-Provider                                                             | Ja                                                                     |
| Codex-Abonnement-Modelle  | `openai/<model>` mit OpenAI OAuth                                                            | Ja                                                                     |
| Legacy-Codex-Modellreferenzen | Legacy-Codex-Modellreferenzen oder `codex-cli/<model>`                                   | Durch doctor zu `openai/<model>` repariert                             |
| Codex-App-Server-Harness  | `openai/<model>` mit ausgelassener Laufzeit oder Provider-/Modell-`agentRuntime.id: codex`    | Ja                                                                     |
| Serverseitige Websuche    | Natives OpenAI Responses-Tool                                                                | Ja, wenn Websuche aktiviert ist und kein Provider gepinnt ist          |
| Bilder                    | `image_generate`                                                                              | Ja                                                                     |
| Videos                    | `video_generate`                                                                              | Ja                                                                     |
| Text-to-Speech            | `messages.tts.provider: "openai"` / `tts`                                                     | Ja                                                                     |
| Batch-Speech-to-Text      | `tools.media.audio` / Medienverständnis                                                       | Ja                                                                     |
| Streaming-Speech-to-Text  | Voice Call `streaming.provider: "openai"`                                                     | Ja                                                                     |
| Realtime-Sprache          | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Ja (erfordert OpenAI-Platform-Guthaben, kein Codex-/ChatGPT-Abonnement) |
| Embeddings                | Memory-Embedding-Provider                                                                     | Ja                                                                     |

<Note>
  OpenAI Realtime-Sprache (verwendet von Voice Calls `realtime.provider: "openai"` und
  Control UI Talk mit `talk.realtime.provider: "openai"`) läuft über die
  öffentliche **OpenAI Platform Realtime API**, die gegen OpenAI-
  Platform-Guthaben abgerechnet wird und nicht gegen das Codex-/ChatGPT-Abonnementkontingent. Ein Konto
  mit funktionierendem OpenAI OAuth, das Codex-gestützte Chat-Modelle problemlos ausführt,
  benötigt dennoch ein OpenAI-API-Schlüssel-Auth-Profil oder einen Platform-API-Schlüssel mit finanzierter
  Platform-Abrechnung für Realtime-Sprache.

Behebung: Laden Sie Platform-Guthaben unter
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
für die Organisation auf, die Ihre Realtime-Anmeldedaten stützt. Realtime-Sprache akzeptiert
das `openai`-API-Schlüssel-Auth-Profil, das durch `openclaw onboard --auth-choice openai-api-key` erstellt wird,
einen Platform-`OPENAI_API_KEY`, der über `talk.realtime.providers.openai.apiKey`
für Control UI Talk konfiguriert ist, `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
für Voice Call oder die Umgebungsvariable `OPENAI_API_KEY`. OpenAI-OAuth-
Profile können weiterhin Codex-gestützte `openai/*`-Chat-Modelle in derselben
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

    ### Routenübersicht

    | Modell-Ref              | Laufzeitkonfiguration             | Route                       | Authentifizierung             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | ausgelassen / Provider/Modell `agentRuntime.id: "codex"` | Codex-App-Server-Harness | Codex-kompatibles OpenAI-Profil |
    | `openai/gpt-5.4-mini` | ausgelassen / Provider/Modell `agentRuntime.id: "codex"` | Codex-App-Server-Harness | Codex-kompatibles OpenAI-Profil |
    | `openai/gpt-5.5`      | Provider/Modell `agentRuntime.id: "openclaw"`              | eingebettete OpenClaw-Laufzeit      | Ausgewähltes `openai`-Profil |

    <Note>
    Agent-Modelle vom Typ `openai/*` verwenden den Codex-App-Server-Harness. Um API-Schlüssel-
    Authentifizierung für ein Agent-Modell zu verwenden, erstellen Sie ein Codex-kompatibles API-Schlüsselprofil und ordnen
    es mit `auth.order.openai` ein; `OPENAI_API_KEY` bleibt der direkte Fallback für
    Nicht-Agent-OpenAI-API-Oberflächen. Führen Sie `openclaw doctor --fix` aus, um ältere
    Legacy-Einträge der Codex-Authentifizierungsreihenfolge zu migrieren.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Um das aktuelle Instant-Modell von ChatGPT über die OpenAI API auszuprobieren, setzen Sie das Modell
    auf `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` ist ein beweglicher Alias. OpenAI dokumentiert ihn als das neueste Instant-
    Modell, das in ChatGPT verwendet wird, und empfiehlt `gpt-5.5` für die produktive API-Nutzung. Behalten Sie daher
    `openai/gpt-5.5` als stabilen Standard bei, sofern Sie nicht ausdrücklich dieses
    Alias-Verhalten wünschen. Der Alias akzeptiert derzeit nur `medium` als Textausführlichkeit, daher
    normalisiert OpenClaw inkompatible OpenAI-Overrides für die Textausführlichkeit für dieses
    Modell.

    <Warning>
    OpenClaw stellt `gpt-5.3-codex-spark` **nicht** über die direkte OpenAI-API-Schlüsselroute bereit. Es ist nur über Codex-Abonnement-Katalogeinträge verfügbar, wenn Ihr angemeldetes Konto es bereitstellt.
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

        Für Headless- oder Callback-feindliche Setups fügen Sie `--device-code` hinzu, um sich mit einem ChatGPT-Gerätecode-Flow statt über den localhost-Browser-Callback anzumelden:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Die kanonische OpenAI-Modellroute verwenden">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Für den Standardpfad ist keine Laufzeitkonfiguration erforderlich. OpenAI-Agent-Turns
        wählen automatisch die native Codex-App-Server-Laufzeit aus, und OpenClaw
        installiert oder repariert das gebündelte Codex-Plugin, wenn diese Route ausgewählt wird.
      </Step>
      <Step title="Prüfen, ob Codex-Authentifizierung verfügbar ist">
        ```bash
        openclaw models list --provider openai
        ```

        Nachdem der Gateway läuft, senden Sie `/codex status` oder `/codex models`
        im Chat, um die native App-Server-Laufzeit zu prüfen.
      </Step>
    </Steps>

    ### Routenübersicht

    | Modell-Ref | Laufzeitkonfiguration | Route | Authentifizierung |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | ausgelassen / Provider/Modell `agentRuntime.id: "codex"` | Nativer Codex-App-Server-Harness | Codex-Anmeldung oder geordnetes `openai`-Authentifizierungsprofil |
    | `openai/gpt-5.5` | Provider/Modell `agentRuntime.id: "openclaw"` | Eingebettete OpenClaw-Laufzeit mit internem Codex-Auth-Transport | Ausgewähltes `openai`-OAuth-Profil |
    | Legacy-Codex-GPT-5.5-Ref | durch doctor repariert | Legacy-Route wird zu `openai/gpt-5.5` umgeschrieben | Migriertes OpenAI-OAuth-Profil |
    | `codex-cli/gpt-5.5` | durch doctor repariert | Legacy-CLI-Route wird zu `openai/gpt-5.5` umgeschrieben | Codex-App-Server-Authentifizierung |

    <Warning>
    Verwenden Sie für neue abonnementsbasierte Agent-Konfiguration bevorzugt `openai/gpt-5.5`. Ältere
    Legacy-Codex-GPT-Refs sind Legacy-OpenClaw-Routen, nicht der native Codex-Laufzeitpfad;
    führen Sie `openclaw doctor --fix` aus, wenn Sie sie zu kanonischen
    `openai/*`-Refs migrieren möchten. `gpt-5.3-codex-spark` bleibt auf Konten beschränkt, deren
    Codex-Abonnementkatalog dieses Modell ausweist; direkte OpenAI-API-Schlüssel- und
    Azure-Refs dafür bleiben unterdrückt.
    </Warning>

    <Note>
    Das Legacy-Codex-Modellpräfix ist Legacy-Konfiguration, die durch doctor repariert wird. Für
    das gängige Setup aus Abonnement plus nativer Laufzeit melden Sie sich mit Codex-Auth an,
    behalten die Modell-Ref aber als `openai/gpt-5.5` bei. Neue Konfiguration sollte die OpenAI-
    Agent-Authentifizierungsreihenfolge unter `auth.order.openai` ablegen; doctor migriert ältere
    Legacy-Einträge der Codex-Authentifizierungsreihenfolge.
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

    Mit einer API-Schlüssel-Sicherung behalten Sie das Modell auf `openai/gpt-5.5` und legen die
    Authentifizierungsreihenfolge unter `openai` ab. OpenClaw versucht zuerst das Abonnement, dann
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
    Onboarding importiert kein OAuth-Material mehr aus `~/.codex`. Melden Sie sich mit Browser-OAuth (Standard) oder dem oben genannten Gerätecode-Flow an — OpenClaw verwaltet die resultierenden Anmeldedaten in seinem eigenen Agent-Auth-Speicher.
    </Note>

    ### Codex-OAuth-Routing prüfen und wiederherstellen

    Verwenden Sie diese Befehle, um zu sehen, welches Modell, welche Laufzeit und welche Auth-Route Ihr Standard-
    Agent verwendet:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Für einen bestimmten Agent fügen Sie `--agent <id>` hinzu:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Wenn eine ältere Konfiguration noch Legacy-Codex-GPT-Refs oder eine veraltete OpenAI-Laufzeit-
    Sitzungsfixierung ohne ausdrückliche Laufzeitkonfiguration enthält, reparieren Sie sie:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Wenn `models auth list --provider openai` kein nutzbares Profil zeigt, melden
    Sie sich erneut an:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Verwenden Sie `--profile-id`, wenn Sie mehrere Codex-OAuth-Anmeldungen im selben
    Agent wünschen und sie später über die Authentifizierungsreihenfolge oder `/model ...@<profileId>` steuern möchten:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` ist die Modellroute für OpenAI-Agent-Turns über Codex. Führen Sie
    `openclaw doctor --fix` aus, um ältere Legacy-Profil-IDs mit OpenAI-Codex-Präfix und
    Reihenfolgeeinträge zu migrieren, bevor Sie sich auf die Profilreihenfolge verlassen.

    ### Statusanzeige

    Chat `/status` zeigt, welche Modelllaufzeit für die aktuelle Sitzung aktiv ist.
    Der gebündelte Codex-App-Server-Harness erscheint bei OpenAI-Agent-Modell-Turns als `Runtime: OpenAI Codex`.
    Veraltete OpenAI-Laufzeit-Sitzungsfixierungen werden zu Codex repariert, sofern
    die Konfiguration nicht ausdrücklich OpenClaw fixiert.

    ### Doctor-Warnung

    Wenn Legacy-Codex-Modell-Refs oder veraltete OpenAI-Laufzeitfixierungen in der Konfiguration oder
    im Sitzungsstatus verbleiben, schreibt `openclaw doctor --fix` sie zu `openai/*` mit der
    Codex-Laufzeit um, sofern OpenClaw nicht ausdrücklich konfiguriert ist.

    ### Kontextfenster-Obergrenze

    OpenClaw behandelt Modellmetadaten und die Laufzeit-Kontextobergrenze als separate Werte.

    Für `openai/gpt-5.5` über den Codex-OAuth-Katalog:

    - Natives `contextWindow`: `1000000`
    - Standardmäßige Laufzeit-Obergrenze `contextTokens`: `272000`

    Die kleinere Standardobergrenze bietet in der Praxis bessere Latenz- und Qualitätsmerkmale. Überschreiben Sie sie mit `contextTokens`:

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
    Verwenden Sie `contextWindow`, um native Modellmetadaten zu deklarieren. Verwenden Sie `contextTokens`, um das Laufzeit-Kontextbudget zu begrenzen.
    </Note>

    ### Katalogwiederherstellung

    OpenClaw verwendet Upstream-Codex-Katalogmetadaten für `gpt-5.5`, wenn sie
    vorhanden sind. Wenn die Live-Codex-Erkennung die Zeile `gpt-5.5` auslässt, während
    das Konto authentifiziert ist, synthetisiert OpenClaw diese OAuth-Modellzeile, damit
    Cron-, Sub-Agent- und konfigurierte Standardmodellläufe nicht mit
    `Unknown model` fehlschlagen.

  </Tab>
</Tabs>

## Native Codex-App-Server-Authentifizierung

Der native Codex-App-Server-Harness verwendet `openai/*`-Modell-Refs plus ausgelassene
Laufzeitkonfiguration oder Provider/Modell `agentRuntime.id: "codex"`, aber seine Authentifizierung ist
weiterhin kontobasiert. OpenClaw wählt Authentifizierung in dieser Reihenfolge aus:

1. Geordnete OpenAI-Authentifizierungsprofile für den Agent, vorzugsweise unter
   `auth.order.openai`. Führen Sie `openclaw doctor --fix` aus, um ältere
   Legacy-Codex-Authentifizierungsprofil-IDs und Legacy-Codex-Authentifizierungsreihenfolge zu migrieren.
2. Das vorhandene Konto des App-Servers, etwa eine lokale Codex-CLI-ChatGPT-Anmeldung.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn der App-Server kein Konto meldet und weiterhin
   OpenAI-Authentifizierung benötigt.

Das bedeutet, dass eine lokale ChatGPT/Codex-Abonnementanmeldung nicht ersetzt wird, nur
weil der Gateway-Prozess auch `OPENAI_API_KEY` für direkte OpenAI-Modelle
oder Embeddings hat. Der Env-API-Schlüssel-Fallback ist nur der lokale stdio-Pfad ohne Konto; er
wird nicht an WebSocket-App-Server-Verbindungen gesendet. Wenn ein Codex-Profil im Abonnementstil
ausgewählt ist, hält OpenClaw auch `CODEX_API_KEY` und `OPENAI_API_KEY`
aus dem gestarteten stdio-App-Server-Kindprozess heraus und sendet die ausgewählten Anmeldedaten
über den App-Server-Login-RPC. Wenn dieses Abonnementprofil durch ein
Codex-Nutzungslimit blockiert ist, kann OpenClaw zum nächsten geordneten `openai:*`-API-Schlüssel-
Profil wechseln, ohne das ausgewählte Modell zu ändern oder den Codex-
Harness zu verlassen. Sobald die Zurücksetzungszeit des Abonnements verstrichen ist, ist das Abonnementprofil
wieder geeignet.

## Bilderzeugung

Das gebündelte `openai`-Plugin registriert Bilderzeugung über das Tool `image_generate`.
Es unterstützt sowohl OpenAI-API-Schlüssel-Bilderzeugung als auch Codex-OAuth-Bilderzeugung
über dieselbe Modell-Ref `openai/gpt-image-2`.

| Fähigkeit                | OpenAI-API-Schlüssel              | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Modell-Ref                | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Authentifizierung         | `OPENAI_API_KEY`                   | OpenAI Codex OAuth-Anmeldung         |
| Transport                 | OpenAI Images API                  | Codex Responses-Backend              |
| Max. Bilder pro Anfrage   | 4                                  | 4                                    |
| Bearbeitungsmodus         | Aktiviert (bis zu 5 Referenzbilder) | Aktiviert (bis zu 5 Referenzbilder) |
| Größenüberschreibungen    | Unterstützt, einschließlich 2K/4K-Größen | Unterstützt, einschließlich 2K/4K-Größen |
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

`gpt-image-2` ist der Standard sowohl für OpenAI-Text-zu-Bild-Erzeugung als auch für die Bildbearbeitung. `gpt-image-1.5`, `gpt-image-1` und `gpt-image-1-mini` bleiben als explizite Modellüberschreibungen nutzbar. Verwenden Sie `openai/gpt-image-1.5` für PNG/WebP-Ausgabe mit transparentem Hintergrund; die aktuelle `gpt-image-2`-API lehnt `background: "transparent"` ab.

Für eine Anfrage mit transparentem Hintergrund sollten Agents `image_generate` mit `model: "openai/gpt-image-1.5"`, `outputFormat: "png"` oder `"webp"` und `background: "transparent"` aufrufen; die ältere Provider-Option `openai.background` wird weiterhin akzeptiert. OpenClaw schützt außerdem die öffentlichen OpenAI- und OpenAI Codex OAuth-Routen, indem standardmäßige transparente `openai/gpt-image-2`-Anfragen auf `gpt-image-1.5` umgeschrieben werden; Azure- und benutzerdefinierte OpenAI-kompatible Endpunkte behalten ihre konfigurierten Deployment-/Modellnamen.

Dieselbe Einstellung ist für headless CLI-Läufe verfügbar:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Verwenden Sie dieselben Flags `--output-format` und `--background` mit `openclaw infer image edit`, wenn Sie mit einer Eingabedatei beginnen. `--openai-background` bleibt als OpenAI-spezifischer Alias verfügbar. Verwenden Sie `--quality low|medium|high|auto`, wenn Sie Qualität und Kosten von OpenAI Images steuern müssen. Verwenden Sie `--openai-moderation low|auto`, um den OpenAI-spezifischen Moderationshinweis des Providers entweder von `image generate` oder `image edit` zu übergeben.

Behalten Sie bei ChatGPT/Codex OAuth-Installationen dieselbe `openai/gpt-image-2`-Ref bei. Wenn ein `openai`-OAuth-Profil konfiguriert ist, löst OpenClaw das gespeicherte OAuth-Zugriffstoken auf und sendet Bildanfragen über das Codex Responses-Backend. Für diese Anfrage wird nicht zuerst `OPENAI_API_KEY` versucht und es erfolgt kein stiller Rückfall auf einen API-Schlüssel. Konfigurieren Sie `models.providers.openai` explizit mit einem API-Schlüssel, einer benutzerdefinierten Basis-URL oder einem Azure-Endpunkt, wenn Sie stattdessen die direkte OpenAI Images API-Route verwenden möchten.
Wenn dieser benutzerdefinierte Bildendpunkt in einem vertrauenswürdigen LAN/privaten Adressbereich liegt, setzen Sie außerdem `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw blockiert private/interne OpenAI-kompatible Bildendpunkte, sofern dieses Opt-in nicht vorhanden ist.

Erzeugen:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Transparente PNG erzeugen:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Bearbeiten:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Videoerzeugung

Das gebündelte `openai`-Plugin registriert Videoerzeugung über das Tool `video_generate`.

| Fähigkeit       | Wert                                                                              |
| ---------------- | --------------------------------------------------------------------------------- |
| Standardmodell   | `openai/sora-2`                                                                   |
| Modi             | Text-zu-Video, Bild-zu-Video, Bearbeitung eines einzelnen Videos                  |
| Referenzeingaben | 1 Bild oder 1 Video                                                               |
| Größenüberschreibungen | Unterstützt für Text-zu-Video und Bild-zu-Video                              |
| Andere Überschreibungen | `aspectRatio`, `resolution`, `audio`, `watermark` werden mit einer Tool-Warnung ignoriert |

OpenAI-Anfragen für Bild-zu-Video verwenden `POST /v1/videos` mit einem Bild-`input_reference`. Bearbeitungen einzelner Videos verwenden `POST /v1/videos/edits` mit dem hochgeladenen Video im Feld `video`.

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

OpenClaw fügt einen gemeinsamen GPT-5-Prompt-Beitrag für Läufe der GPT-5-Familie auf von OpenClaw zusammengestellten Prompt-Oberflächen hinzu. Er wird nach Modell-ID angewendet, sodass OpenClaw-/Provider-Routen wie ältere Refs vor der Reparatur (ältere Codex-GPT-5.5-Ref), `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` und andere kompatible GPT-5-Refs dieselbe Überlagerung erhalten. Ältere GPT-4.x-Modelle erhalten sie nicht.

Das gebündelte native Codex-Harness erhält diese OpenClaw-GPT-5-Überlagerung nicht über Entwickleranweisungen des Codex-App-Servers. Native Codex behält Codex-eigenes Basis-, Modell- und Projektdokumentverhalten bei, während OpenClaw die integrierte Codex-Persönlichkeit für native Threads deaktiviert, damit Agent-Arbeitsbereichs-Persönlichkeitsdateien maßgeblich bleiben. OpenClaw trägt nur Laufzeitkontext wie Channel-Zustellung, dynamische OpenClaw-Tools, ACP-Delegation, Arbeitsbereichskontext und OpenClaw Skills bei.

Der GPT-5-Beitrag fügt einen getaggten Verhaltensvertrag für Persona-Persistenz, Ausführungssicherheit, Tool-Disziplin, Ausgabeform, Abschlussprüfungen und Verifizierung auf passenden von OpenClaw zusammengestellten Prompts hinzu. Channelspezifisches Antwort- und Stummnachrichtenverhalten bleibt im gemeinsamen OpenClaw-Systemprompt und in der Richtlinie für ausgehende Zustellung. Die freundliche Interaktionsstil-Ebene ist separat und konfigurierbar.

| Wert                   | Wirkung                                      |
| ---------------------- | -------------------------------------------- |
| `"friendly"` (Standard) | Freundliche Interaktionsstil-Ebene aktivieren |
| `"on"`                 | Alias für `"friendly"`                       |
| `"off"`                | Nur die freundliche Stil-Ebene deaktivieren  |

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
Bei der Laufzeit wird Groß-/Kleinschreibung bei Werten nicht berücksichtigt, sodass `"Off"` und `"off"` beide die freundliche Stil-Ebene deaktivieren.
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
    | Stimme | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | Geschwindigkeit | `messages.tts.providers.openai.speed` | (nicht gesetzt) |
    | Anweisungen | `messages.tts.providers.openai.instructions` | (nicht gesetzt, nur `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` für Sprachnachrichten, `mp3` für Dateien |
    | API-Schlüssel | `messages.tts.providers.openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |
    | Basis-URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Zusätzlicher Body | `messages.tts.providers.openai.extraBody` / `extra_body` | (nicht gesetzt) |

    Verfügbare Modelle: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Verfügbare Stimmen: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` wird nach den von OpenClaw erzeugten Feldern in das Anfrage-JSON für `/audio/speech` zusammengeführt. Verwenden Sie es daher für OpenAI-kompatible Endpunkte, die zusätzliche Schlüssel wie `lang` erfordern. Prototyp-Schlüssel werden ignoriert.

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
    Setzen Sie `OPENAI_TTS_BASE_URL`, um die TTS-Basis-URL zu überschreiben, ohne den Chat-API-Endpunkt zu beeinflussen. OpenAI TTS und Realtime Voice werden beide über einen OpenAI Platform API-Schlüssel konfiguriert; reine OAuth-Installationen können weiterhin Codex-gestützte Chatmodelle verwenden, aber keine OpenAI-Live-Sprachantworten.
    </Note>

  </Accordion>

  <Accordion title="Sprache-zu-Text">
    Das gebündelte `openai`-Plugin registriert Batch-Sprache-zu-Text über OpenClaws Oberfläche für Media-Understanding-Transkription.

    - Standardmodell: `gpt-4o-transcribe`
    - Endpunkt: OpenAI REST `/v1/audio/transcriptions`
    - Eingabepfad: Multipart-Audiodatei-Upload
    - Unterstützt von OpenClaw überall dort, wo die Transkription eingehender Audiodaten `tools.media.audio` verwendet, einschließlich Discord-Sprachkanalsegmenten und Channel-Audioanhängen

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

    Sprach- und Prompt-Hinweise werden an OpenAI weitergeleitet, wenn sie von der gemeinsamen Audiomedien-Konfiguration oder der Transkriptionsanfrage pro Aufruf bereitgestellt werden.

  </Accordion>

  <Accordion title="Realtime-Transkription">
    Das gebündelte `openai`-Plugin registriert Realtime-Transkription für das Voice Call-Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Sprache | `...openai.language` | (nicht gesetzt) |
    | Prompt | `...openai.prompt` | (nicht gesetzt) |
    | Dauer der Stille | `...openai.silenceDurationMs` | `800` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | Authentifizierung | `...openai.apiKey`, `OPENAI_API_KEY` oder `openai` OAuth | API-Schlüssel verbinden direkt; OAuth stellt ein Realtime-Transkriptions-Client-Secret aus |

    <Note>
    Verwendet eine WebSocket-Verbindung zu `wss://api.openai.com/v1/realtime` mit G.711 u-law-Audio (`g711_ulaw` / `audio/pcmu`). Wenn nur `openai` OAuth konfiguriert ist, stellt der Gateway ein kurzlebiges Realtime-Transkriptions-Client-Secret aus, bevor die WebSocket-Verbindung geöffnet wird. Dieser Streaming-Provider ist für den Realtime-Transkriptionspfad von Voice Call vorgesehen; Discord-Sprachdaten zeichnen derzeit kurze Segmente auf und verwenden stattdessen den Batch-Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime Voice">
    Das gebündelte `openai`-Plugin registriert Realtime Voice für das Voice Call-Plugin.

    | Einstellung | Konfigurationspfad | Standardwert |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Stimme | `...openai.voice` | `alloy` |
    | Temperatur (Azure-Deployment-Bridge) | `...openai.temperature` | `0.8` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | Stilledauer | `...openai.silenceDurationMs` | `500` |
    | Präfix-Padding | `...openai.prefixPaddingMs` | `300` |
    | Reasoning-Aufwand | `...openai.reasoningEffort` | (nicht gesetzt) |
    | Authentifizierung | `openai`-API-Schlüssel-Authentifizierungsprofil, `...openai.apiKey` oder `OPENAI_API_KEY` | OpenAI-Platform-API-Schlüssel erforderlich; OpenAI OAuth konfiguriert keine Echtzeit-Sprache |

    Verfügbare integrierte Echtzeit-Stimmen für `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI empfiehlt `marin` und `cedar` für die beste Echtzeitqualität. Dies
    ist ein separater Satz gegenüber den Text-to-Speech-Stimmen oben; gehen Sie
    nicht davon aus, dass eine TTS-Stimme wie `fable`, `nova` oder `onyx` für
    Echtzeit-Sitzungen gültig ist.

    <Note>
    Backend-OpenAI-Echtzeit-Bridges verwenden die GA-Echtzeit-WebSocket-Sitzungsform, die `session.temperature` nicht akzeptiert. Azure OpenAI-Deployments bleiben über `azureEndpoint` und `azureDeployment` verfügbar und behalten die deploymentkompatible Sitzungsform bei. Unterstützt bidirektionales Tool-Calling und G.711-u-law-Audio.
    </Note>

    <Note>
    Die Echtzeit-Stimme wird ausgewählt, wenn die Sitzung erstellt wird. OpenAI erlaubt,
    dass die meisten Sitzungsfelder später geändert werden, aber die Stimme kann nicht
    mehr geändert werden, nachdem das Modell in dieser Sitzung Audio ausgegeben hat.
    OpenClaw stellt derzeit die integrierten Echtzeit-Stimmen-IDs als Strings bereit.
    </Note>

    <Note>
    Control UI Talk verwendet OpenAI-Browser-Echtzeit-Sitzungen mit einem vom Gateway
    ausgestellten kurzlebigen Client Secret und einem direkten Browser-WebRTC-SDP-Austausch
    mit der OpenAI Realtime API. Das Gateway stellt dieses Client Secret mit dem ausgewählten
    `openai`-API-Schlüssel-Authentifizierungsprofil oder dem konfigurierten OpenAI-Platform-API-Schlüssel aus. Gateway
    Relay und Voice-Call-Backend-Echtzeit-WebSocket-Bridges verwenden denselben
    reinen API-Schlüssel-Authentifizierungspfad für native OpenAI-Endpunkte. Live-Verifizierung
    durch Maintainer ist verfügbar mit
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    die OpenAI-Abschnitte verifizieren sowohl die Backend-WebSocket-Bridge als auch den
    Browser-WebRTC-SDP-Austausch, ohne Geheimnisse zu protokollieren.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI-Endpunkte

Der gebündelte `openai`-Provider kann für die Bildgenerierung auf eine Azure OpenAI-Ressource
ausgerichtet werden, indem die Basis-URL überschrieben wird. Auf dem Bildgenerierungspfad erkennt OpenClaw
Azure-Hostnamen in `models.providers.openai.baseUrl` und wechselt automatisch zur
Azure-Anfrageform.

<Note>
Echtzeit-Sprache verwendet einen separaten Konfigurationspfad
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
und wird nicht von `models.providers.openai.baseUrl` beeinflusst. Siehe das **Echtzeit-Sprache**-Accordion
unter [Stimme und Sprache](#voice-and-speech) für die Azure-Einstellungen.
</Note>

Verwenden Sie Azure OpenAI, wenn:

- Sie bereits ein Azure OpenAI-Abonnement, Kontingent oder Enterprise Agreement haben
- Sie regionale Datenresidenz oder Compliance-Kontrollen benötigen, die Azure bereitstellt
- Sie Traffic innerhalb eines vorhandenen Azure-Tenants halten möchten

### Konfiguration

Für Azure-Bildgenerierung über den gebündelten `openai`-Provider zeigen Sie
`models.providers.openai.baseUrl` auf Ihre Azure-Ressource und setzen `apiKey` auf
den Azure OpenAI-Schlüssel (nicht auf einen OpenAI-Platform-Schlüssel):

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

- Sendet den `api-key`-Header statt `Authorization: Bearer`
- Verwendet deploymentbezogene Pfade (`/openai/deployments/{deployment}/...`)
- Hängt `?api-version=...` an jede Anfrage an
- Verwendet einen Standard-Anfrage-Timeout von 600 s für Azure-Bildgenerierungsaufrufe.
  Pro-Aufruf-`timeoutMs`-Werte überschreiben diesen Standardwert weiterhin.

Andere Basis-URLs (öffentliches OpenAI, OpenAI-kompatible Proxys) behalten die standardmäßige
OpenAI-Bildanfrageform bei.

<Note>
Azure-Routing für den Bildgenerierungspfad des `openai`-Providers erfordert
OpenClaw 2026.4.22 oder höher. Frühere Versionen behandeln jede benutzerdefinierte
`openai.baseUrl` wie den öffentlichen OpenAI-Endpunkt und schlagen bei Azure-Bilddeployments fehl.
</Note>

### API-Version

Setzen Sie `AZURE_OPENAI_API_VERSION`, um eine bestimmte Azure-Preview- oder GA-Version
für den Azure-Bildgenerierungspfad festzulegen:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Der Standardwert ist `2024-12-01-preview`, wenn die Variable nicht gesetzt ist.

### Modellnamen sind Deployment-Namen

Azure OpenAI bindet Modelle an Deployments. Für Azure-Bildgenerierungsanfragen,
die über den gebündelten `openai`-Provider geroutet werden, muss das Feld `model` in OpenClaw
der **Azure-Deployment-Name** sein, den Sie im Azure-Portal konfiguriert haben, nicht
die öffentliche OpenAI-Modell-ID.

Wenn Sie ein Deployment namens `gpt-image-2-prod` erstellen, das `gpt-image-2` bereitstellt:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Dieselbe Deployment-Namensregel gilt für Bildgenerierungsaufrufe, die über
den gebündelten `openai`-Provider geroutet werden.

### Regionale Verfügbarkeit

Azure-Bildgenerierung ist derzeit nur in einer Teilmenge von Regionen verfügbar
(zum Beispiel `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Prüfen Sie Microsofts aktuelle Regionsliste, bevor Sie ein
Deployment erstellen, und bestätigen Sie, dass das konkrete Modell in Ihrer Region angeboten wird.

### Parameterunterschiede

Azure OpenAI und öffentliches OpenAI akzeptieren nicht immer dieselben Bildparameter.
Azure kann Optionen ablehnen, die öffentliches OpenAI erlaubt (zum Beispiel bestimmte
`background`-Werte bei `gpt-image-2`), oder sie nur bei bestimmten Modellversionen verfügbar machen.
Diese Unterschiede stammen von Azure und dem zugrunde liegenden Modell, nicht von OpenClaw.
Wenn eine Azure-Anfrage mit einem Validierungsfehler fehlschlägt, prüfen Sie im
Azure-Portal den Parametersatz, der von Ihrem konkreten Deployment und Ihrer API-Version unterstützt wird.

<Note>
Azure OpenAI verwendet nativen Transport und Kompatibilitätsverhalten, erhält aber nicht
die versteckten Attributionsheader von OpenClaw — siehe das **Native vs. OpenAI-kompatible
Routen**-Accordion unter [Erweiterte Konfiguration](#advanced-configuration).

Für Chat- oder Responses-Traffic auf Azure (über Bildgenerierung hinaus) verwenden Sie den
Onboarding-Ablauf oder eine dedizierte Azure-Provider-Konfiguration — `openai.baseUrl` allein
übernimmt nicht die Azure-API-/Authentifizierungsform. Ein separater
`azure-openai-responses/*`-Provider existiert; siehe
das Accordion zur serverseitigen Compaction unten.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw verwendet für `openai/*` zuerst WebSocket mit SSE-Fallback (`"auto"`).

    Im Modus `"auto"` führt OpenClaw Folgendes aus:
    - Wiederholt einen frühen WebSocket-Fehler einmal, bevor auf SSE zurückgefallen wird
    - Markiert WebSocket nach einem Fehler für ca. 60 Sekunden als eingeschränkt und verwendet während der Abkühlphase SSE
    - Hängt stabile Sitzungs- und Turn-Identitätsheader für Wiederholungen und erneute Verbindungen an
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

    - **Chat/UI:** `/fast status|auto|on|off`
    - **Konfiguration:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Wenn aktiviert, ordnet OpenClaw den Schnellmodus der OpenAI-Prioritätsverarbeitung zu (`service_tier = "priority"`). Vorhandene `service_tier`-Werte bleiben erhalten, und der Schnellmodus schreibt weder `reasoning` noch `text.verbosity` um. `fastMode: "auto"` startet neue Modellaufrufe bis zum automatischen Grenzwert schnell und startet spätere Wiederholungs-, Fallback-, Tool-Ergebnis- oder Fortsetzungsaufrufe dann ohne Schnellmodus. Der Grenzwert ist standardmäßig 60 Sekunden; setzen Sie `params.fastAutoOnSeconds` beim aktiven Modell, um ihn zu ändern.

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
    Sitzungs-Overrides haben Vorrang vor der Konfiguration. Das Löschen des Sitzungs-Overrides in der Sessions UI setzt die Sitzung auf den konfigurierten Standard zurück.
    </Note>

  </Accordion>

  <Accordion title="Prioritätsverarbeitung (service_tier)">
    Die API von OpenAI stellt Prioritätsverarbeitung über `service_tier` bereit. Setzen Sie sie pro Modell in OpenClaw:

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

    - Erzwingt `store: true` (außer Modellkompatibilität setzt `supportsStore: false`)
    - Fügt `context_management: [{ type: "compaction", compact_threshold: ... }]` ein
    - Standard-`compact_threshold`: 70 % von `contextWindow` (oder `80000`, wenn nicht verfügbar)

    Dies gilt für den integrierten OpenClaw-Runtime-Pfad und für OpenAI-Provider-Hooks, die von eingebetteten Läufen verwendet werden. Der native Codex-App-Server-Harness verwaltet seinen eigenen Kontext über Codex und wird durch die Standard-Agent-Route von OpenAI oder die Provider-/Modell-Runtime-Policy konfiguriert.

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
    `responsesServerCompaction` steuert nur das Einfügen von `context_management`. Direkte OpenAI-Responses-Modelle erzwingen weiterhin `store: true`, außer Kompatibilität setzt `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Strikter agentischer GPT-Modus">
    Für Ausführungen der GPT-5-Familie auf `openai/*` kann OpenClaw einen strengeren eingebetteten Ausführungsvertrag verwenden:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Mit `strict-agentic`:
    - aktiviert OpenClaw `update_plan` automatisch für umfangreiche Arbeiten
    - wiederholt strukturell leere oder reine Reasoning-Durchläufe mit einer Fortsetzung, die eine sichtbare Antwort liefert
    - verwendet explizite Harness-Planereignisse, wenn das ausgewählte Harness sie bereitstellt

    OpenClaw klassifiziert Assistentenprosa nicht, um zu entscheiden, ob ein Durchlauf ein Plan, eine Fortschrittsaktualisierung oder eine finale Antwort ist.

    <Note>
    Nur auf OpenAI- und Codex-Ausführungen der GPT-5-Familie beschränkt. Andere Provider und ältere Modellfamilien behalten das Standardverhalten bei.
    </Note>

  </Accordion>

  <Accordion title="Native vs. OpenAI-kompatible Routen">
    OpenClaw behandelt direkte OpenAI-, Codex- und Azure OpenAI-Endpunkte anders als generische OpenAI-kompatible `/v1`-Proxys:

    **Native Routen** (`openai/*`, Azure OpenAI):
    - Behalten `reasoning: { effort: "none" }` nur für Modelle bei, die den OpenAI-Aufwand `none` unterstützen
    - Lassen deaktiviertes Reasoning für Modelle oder Proxys weg, die `reasoning.effort: "none"` ablehnen
    - Setzen Tool-Schemas standardmäßig in den strikten Modus
    - Hängen versteckte Attributions-Header nur bei verifizierten nativen Hosts an
    - Behalten OpenAI-spezifische Anfrageformung bei (`service_tier`, `store`, Reasoning-Kompatibilität, Prompt-Cache-Hinweise)

    **Proxy-/kompatible Routen:**
    - Verwenden lockereres Kompatibilitätsverhalten
    - Entfernen Completions-`store` aus nicht nativen `openai-completions`-Payloads
    - Akzeptieren erweiterten JSON-Pass-through über `params.extra_body`/`params.extraBody` für OpenAI-kompatible Completions-Proxys
    - Akzeptieren `params.chat_template_kwargs` für OpenAI-kompatible Completions-Proxys wie vLLM
    - Erzwingen keine strikten Tool-Schemas oder nur nativen Header

    Azure OpenAI verwendet nativen Transport und Kompatibilitätsverhalten, erhält jedoch nicht die versteckten Attributions-Header.

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
