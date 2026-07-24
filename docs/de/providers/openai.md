---
read_when:
    - Sie möchten OpenAI-Modelle in OpenClaw verwenden
    - Sie möchten die Codex-Abonnementauthentifizierung anstelle von API-Schlüsseln verwenden
    - Sie benötigen ein strengeres Ausführungsverhalten für GPT-5-Agenten
summary: OpenAI über API-Schlüssel oder ein Codex-Abonnement in OpenClaw verwenden
title: OpenAI
x-i18n:
    generated_at: "2026-07-24T04:53:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 612a36760899e01126364ddca523f0a6340036253cf349ae2755ba15c6451ba6
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw verwendet eine Provider-ID, `openai`, sowohl für die direkte Authentifizierung per API-Schlüssel als auch für die
ChatGPT/Codex-Abonnementauthentifizierung. `openai/*` ist die kanonische Modellroute.
Bei eingebetteten Agent-Durchläufen, für die keine Laufzeitrichtlinie oder `auto` festgelegt ist, bestimmen die
Routeninformationen von OpenAI, ob OpenClaw implizit die gebündelte Codex-App-Server-Laufzeit
auswählen darf. Das Präfix `openai/*` allein wählt keine Laufzeit aus.

- **Agent-Modelle** – `openai/*` über die durch die explizite
  `agentRuntime`-Konfiguration oder die implizite Routenrichtlinie von OpenAI ausgewählte Laufzeit. Melden Sie sich für die Nutzung eines ChatGPT/Codex-Abonnements mit der Codex-
  Authentifizierung an oder konfigurieren Sie ein Authentifizierungsprofil mit API-Schlüssel,
  wenn Sie eine schlüsselbasierte Abrechnung wünschen.
- **OpenAI-APIs ohne Agent** – direkter Zugriff auf die OpenAI Platform mit nutzungsbasierter Abrechnung
  über `OPENAI_API_KEY` oder ein Authentifizierungsprofil mit `openai`-API-Schlüssel.
- **Veraltete Konfiguration** – Referenzen auf `codex/*` und `openai-codex/*` werden durch
  `openclaw doctor --fix` in `openai/*` sowie das modellbezogene
  `agentRuntime.id: "codex"` überführt.

OpenAI unterstützt ausdrücklich die Verwendung von Abonnement-OAuth in externen Tools und
Workflows wie OpenClaw.

## Nutzungs- und Kostenverfolgung

OpenClaw behandelt Abonnementkontingente und die Abrechnung der Platform API getrennt:

- ChatGPT/Codex OAuth zeigt den Abonnementtarif, die Kontingentzeiträume und das Guthaben an.
- `OPENAI_ADMIN_KEY` zeigt in der Control UI unter **Nutzung** die von dem Provider gemeldeten Organisationskosten und die Completions-Nutzung der letzten 30 Tage an, einschließlich täglicher Ausgaben, Gesamtzahlen für Anfragen und Token, meistgenutzter Modelle und Kostenkategorien.
- `OPENAI_PROJECT_ID` beschränkt den Verlauf der Admin API optional auf ein Projekt.
- OpenClaw sendet niemals `OPENAI_API_KEY` oder ein `openai`-Inferenzprofil an Organisations-APIs; diese Anmeldedaten können zu benutzerdefinierten, Azure- oder agentenlokalen Endpunkten gehören.

Ein expliziter Admin-Schlüssel hat Vorrang vor OAuth. Der vom Provider gemeldete Verlauf wird nicht mit den aus OpenClaw-Sitzungen abgeleiteten geschätzten Kosten zusammengeführt; er kann API-Aktivitäten anderer Clients und providerseitige Abrechnungsanpassungen enthalten.

Die Dokumentation zum [API Usage Dashboard](https://help.openai.com/en/articles/10478918) von OpenAI beschreibt die Anforderungen an die Rolle als Organisationseigentümer und die ausdrückliche Berechtigung für das Usage Dashboard, die für den Zugriff auf Nutzungsdaten gelten.

Provider, Modell, Laufzeit und Kanal sind separate Ebenen. Wenn diese Bezeichnungen
vermischt werden, lesen Sie [Agent-Laufzeiten](/de/concepts/agent-runtimes), bevor Sie
die Konfiguration ändern.

## Schnellauswahl

| Ziel                                              | Verwenden                                                           | Hinweise                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| ChatGPT/Codex-Abonnement, native Codex-Laufzeit  | `openai/gpt-5.6-sol`                                               | Neue Abonnementeinrichtung; mit Codex-Authentifizierung anmelden.                  |
| Direkte Abrechnung per API-Schlüssel für Agent-Durchläufe            | `openai/gpt-5.6` sowie ein geordnetes Authentifizierungsprofil mit API-Schlüssel              | Neue Einrichtung mit API-Schlüssel; die reine Direkt-API-ID wird als Sol aufgelöst.        |
| Eine bestimmte GPT-5.6-Stufe auswählen                      | `openai/gpt-5.6-sol`, `-terra` oder `-luna`                         | Prüfen Sie mit `models list`, welche Stufen für dieses Konto verfügbar sind.        |
| Konto ohne Zugriff auf GPT-5.6                    | `openai/gpt-5.5`                                                   | Explizite Wiederherstellungsoption; OpenClaw führt nicht stillschweigend ein Downgrade durch.     |
| Direkte Abrechnung per API-Schlüssel, explizite OpenClaw-Laufzeit | `openai/gpt-5.6` sowie Provider/Modell `agentRuntime.id: "openclaw"` | Wählen Sie ein reguläres Authentifizierungsprofil mit `openai`-API-Schlüssel aus.                           |
| Alias für das neueste ChatGPT-Instant-Modell                | `openai/chat-latest`                                               | Nur direkter API-Schlüssel; dynamischer Alias, nicht der stabile Standardwert.          |
| Bilderzeugung oder -bearbeitung                       | `openai/gpt-image-2`                                               | Funktioniert mit `OPENAI_API_KEY` oder Codex OAuth.                         |
| Bilder mit transparentem Hintergrund                     | `openai/gpt-image-1.5`                                             | Setzen Sie `outputFormat` auf `png` oder `webp` und `background=transparent`. |

## Zuordnung der Bezeichnungen

| Angezeigter Name                            | Ebene             | Bedeutung                                                                                  |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | Provider-Präfix   | Kanonische OpenAI-Modellroute; die Routeninformationen bestimmen die implizite Laufzeit.                |
| `codex`-Plugin                          | Plugin            | Gebündeltes Plugin, das die native Codex-App-Server-Laufzeit und die `/codex`-Chat-Steuerelemente bereitstellt. |
| Provider/Modell `agentRuntime.id: codex` | Agent-Laufzeit     | Erzwingt das native Codex-App-Server-Ausführungsmodul für übereinstimmende eingebettete Durchläufe.                   |
| `/codex ...`                            | Chat-Befehlssatz  | Bindet bzw. steuert Codex-App-Server-Threads aus einer Unterhaltung heraus.                               |
| `runtime: "acp", agentId: "codex"`      | ACP-Sitzungsroute | Expliziter Ausweichpfad, der Codex über ACP/acpx ausführt.                                 |

## Implizite Agent-Laufzeit

Wenn die Provider/Modell-Richtlinie `agentRuntime` nicht festgelegt oder auf `auto` gesetzt ist, wählt die
providereigene Routenrichtlinie von OpenAI die implizite Laufzeit anhand des effektiven
Endpunkts und Adapters aus:

| Effektive Routeninformationen                                                                                                                                                  | Implizite Laufzeit      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Exakter offizieller Platform-HTTPS-Endpunkt mit `openai-responses` oder exakter offizieller ChatGPT-HTTPS-Endpunkt mit `openai-chatgpt-responses`; keine vom Autor festgelegte Anfrageüberschreibung | Codex kann ausgewählt werden |
| Vom Autor festgelegter `openai-completions`-Adapter                                                                                                                                  | OpenClaw              |
| Benutzerdefinierter Endpunkt                                                                                                                                                        | OpenClaw              |
| Explizit festgelegter exakter offizieller Endpunkt mit HTTP                                                                                                                            | Abgelehnt              |
| Route mit einer vom Autor festgelegten Provider/Modell-Anfrageüberschreibung                                                                                                                 | OpenClaw              |

Eine explizite, vom Standard abweichende Provider/Modell-Einstellung `agentRuntime.id` bleibt maßgeblich.
Beispielsweise belässt `agentRuntime.id: "openclaw"` eine ansonsten für Codex geeignete
Route auf OpenClaw, während `agentRuntime.id: "codex"` Codex voraussetzt und mit einem
Fehler abbricht, wenn die effektive Route nicht als Codex-kompatibel deklariert ist.
Die Laufzeitauswahl ändert weder den Typ der Anmeldedaten noch die Abrechnung: Die Authentifizierung per Platform-API-Schlüssel
und die Authentifizierung per ChatGPT/Codex-Abonnement bleiben getrennt.

`openclaw doctor --fix` migriert veraltete Modellreferenzen auf `codex/*` und `openai-codex/*`,
veraltete Codex-Authentifizierungsprofil-IDs und veraltete Codex-Einträge der Authentifizierungsreihenfolge auf die
kanonische Route `openai`. Migrierte Modellreferenzen erhalten das modellbezogene
`agentRuntime.id: "codex"`; verwenden Sie `auth.order.openai` für eine neue Konfiguration der Authentifizierungsreihenfolge.

<Note>
Bei einer neuen OpenAI-Einrichtung wird nur dann ein primäres GPT-5.6-Modell festgelegt, wenn kein primäres Modell
konfiguriert ist. Beim Hinzufügen oder Aktualisieren der OpenAI-Authentifizierung bleibt eine vorhandene explizite
Auswahl einschließlich `openai/gpt-5.5` erhalten, sofern Sie nicht ausdrücklich
`models auth login --set-default` oder `models set` verwenden. Verwenden Sie ein Authentifizierungsprofil mit API-Schlüssel
nur, wenn Sie für ein Agent-Modell die Authentifizierung per API-Schlüssel wünschen.
</Note>

## Eingeschränkte Vorschau von GPT-5.6

OpenClaw erkennt die exakten Modell-IDs `openai/gpt-5.6-sol`,
`openai/gpt-5.6-terra` und `openai/gpt-5.6-luna`. Alle drei bieten im aktuellen Katalog die Reasoning-Stufen
`xhigh` und `max`. OpenAI beschreibt Sol als
Spitzenstufe, Terra als ausgewogene Stufe und Luna als schnelle,
kostengünstigere Stufe. Weitere Informationen finden Sie in der
[Ankündigung zur Einführung von GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/)
und im [Leitfaden zum Zugriff](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

Bei direkter OpenAI-Authentifizierung per API-Schlüssel ist die reine ID `openai/gpt-5.6` ein Alias für
Sol und der Standardwert bei einer neuen Einrichtung. Der native Codex-Katalog wendet
diesen Direkt-API-Alias nicht clientseitig an; abhängig vom Workspace-Zugriff kann er
die exakten Sol-, Terra- und Luna-IDs anzeigen. Eine neue ChatGPT/Codex-OAuth-Einrichtung verwendet daher
`openai/gpt-5.6-sol`. Prüfen Sie das aktuelle Konto mit:

```bash
openclaw models list --provider openai
```

Der Zugriff der API-Organisation und des Codex-Workspace kann unterschiedlich sein. Wenn GPT-5.6 nicht
verfügbar ist, wählen Sie GPT-5.5 explizit aus:

```bash
openclaw models set openai/gpt-5.5
```

OpenClaw zeigt den vorgelagerten Zugriffsfehler an und ersetzt eine
GPT-5.6-Auswahl nicht stillschweigend durch GPT-5.5.

<Note>
Geeignete exakte offizielle HTTPS-Routen können das gebündelte Codex-App-Server-
Plugin auswählen, wenn die Laufzeitrichtlinie nicht festgelegt oder auf `auto` gesetzt ist; vom Autor festgelegte Completions-Routen,
benutzerdefinierte Endpunkte und Überschreibungen des Anfragetransports verbleiben auf OpenClaw. Unverschlüsselte
offizielle HTTP-Endpunkte werden abgelehnt. Eine explizite Provider/Modell-Laufzeitkonfiguration bleibt
maßgeblich. Führen Sie `openclaw doctor --fix` aus, um veraltete Codex-Modellreferenzen,
`codex-cli/*`-Referenzen oder alte Laufzeit-Sitzungsbindungen zu reparieren, die nicht durch eine
explizite Laufzeitkonfiguration festgelegt wurden.
</Note>

## Funktionsumfang von OpenClaw

| OpenAI-Funktion         | OpenClaw-Oberfläche                                                                              | Status                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Chat / Responses          | `openai/<model>`-Modell-Provider                                                               | Ja                                                             |
| Codex-Abonnementmodelle | `openai/<model>` mit OpenAI OAuth                                                            | Ja                                                             |
| Veraltete Codex-Modellreferenzen   | alte Codex-Modellreferenzen, `codex-cli/<model>`                                                     | Durch doctor in `openai/<model>` korrigiert                          |
| Codex-App-Server-Harness  | Codex-kompatible HTTPS-Route mit nicht festgelegter Runtime/`auto` oder explizitem `agentRuntime.id: codex`  | Ja                                                             |
| Serverseitige Websuche    | Natives OpenAI-Responses-Tool                                                                  | Ja, wenn die Websuche aktiviert und kein anderer Provider festgelegt ist |
| Bilder                    | `image_generate`                                                                              | Ja                                                             |
| Videos                    | `video_generate`                                                                              | Ja                                                             |
| Text-to-Speech            | `tts.provider: "openai"` / `tts`                                                              | Ja                                                             |
| Batch-Speech-to-Text      | `tools.media.audio` / Medienverständnis                                                     | Ja                                                             |
| Streaming-Speech-to-Text  | Voice Call `streaming.provider: "openai"`                                                     | Ja                                                             |
| Echtzeit-Sprache            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Ja (OpenAI-Platform-API-Schlüssel)                                   |
| Embeddings                | Provider für Speicher-Embeddings                                                                     | Ja                                                             |

<Note>
OpenAI-Echtzeit-Sprache läuft über die öffentliche **OpenAI Platform Realtime
API** und erfordert einen Platform-API-Schlüssel. Codex-OAuth-Token authentifizieren
stattdessen das ChatGPT-Codex-Backend; sie sind für die öffentlichen Realtime-Endpunkte
nicht mit Platform-API-Schlüsseln austauschbar.

Wenn die API-Schlüsselauthentifizierung fehlende Abrechnung meldet, laden Sie unter
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
Platform-Guthaben für die Organisation auf, die Ihren Echtzeit-Anmeldedaten zugrunde
liegt. Echtzeit-Sprache akzeptiert das von
`openclaw onboard --auth-choice openai-api-key` erstellte API-Schlüssel-Authentifizierungsprofil `openai`,
einen über `talk.realtime.providers.openai.apiKey` für Control UI Talk festgelegten
Platform-API-Schlüssel, `plugins.entries.voice-call.config.realtime.providers.openai.apiKey` für Voice
Call oder die Umgebungsvariable `OPENAI_API_KEY`.

In Control UI Video Talk erhält OpenAI WebRTC den Kamerakontext bei Bedarf:
Wenn das Modell `describe_view` aufruft, sendet der Browser ein einzelnes begrenztes JPEG über
den Echtzeit-Datenkanal. OpenClaw fügt der OpenAI-Sitzung keinen kontinuierlichen
Kamerastream hinzu.
</Note>

## Speicher-Embeddings

OpenClaw kann OpenAI oder einen OpenAI-kompatiblen Embedding-Endpunkt für
die `memory_search`-Indizierung und Abfrage-Embeddings verwenden:

```json5
{
  memory: {
    search: {
      provider: "openai",
      model: "text-embedding-3-small",
    },
  },
}
```

Legen Sie für OpenAI-kompatible Endpunkte, die asymmetrische Embedding-Bezeichnungen
erfordern, `queryInputType` und `documentInputType` unter `memory.search` fest. OpenClaw
leitet diese als providerspezifische `input_type`-Anfragefelder weiter: Abfrage-
Embeddings verwenden `queryInputType`; indizierte Speicherabschnitte und die Batch-Indizierung verwenden
`documentInputType`. Das vollständige Beispiel finden Sie in der
[Referenz zur Speicherkonfiguration](/de/reference/memory-config#provider-specific-config).

## Erste Schritte

<Tabs>
  <Tab title="API-Schlüssel (OpenAI Platform)">
    **Am besten geeignet für:** direkten API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen oder kopieren Sie einen API-Schlüssel aus dem [OpenAI-Platform-Dashboard](https://platform.openai.com/api-keys).
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
      <Step title="Verfügbarkeit des Modells überprüfen">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Routenzusammenfassung

    | Modellreferenz        | Runtime-Richtlinie oder Routenfakten                                 | Route                     | Authentifizierung                              |
    | ---------------- | ------------------------------------------------------------- | ------------------------- | --------------------------------- |
    | `openai/gpt-5.6` | nicht festgelegt/`auto`, exakte offizielle native HTTPS-Route, keine Anfrageüberschreibung | Codex kann ausgewählt werden     | Geordnetes API-Schlüssel-Authentifizierungsprofil      |
    | `openai/gpt-5.6` | Provider/Modell `agentRuntime.id: "openclaw"`                  | Eingebettete OpenClaw-Runtime | Ausgewähltes `openai`-API-Schlüsselprofil |
    | `openai/gpt-5.5` | expliziter Provider/explizites Modell `agentRuntime.id`                     | Ausgewählte Agent-Runtime    | Ausgewähltes OpenAI-API-Schlüsselprofil   |
    | `openai/*`       | selbst definierte Completions, benutzerdefiniert oder Anfrageüberschreibung | Eingebettete OpenClaw-Runtime | Anmeldedatentyp bleibt unverändert |
    | `openai/*`       | offizieller Klartext-HTTP-Endpunkt                  | Abgelehnt                 | Anmeldedaten werden nicht gesendet             |

    <Note>
    Wenn die Runtime nicht festgelegt ist oder `auto` verwendet wird, kann nur eine geeignete exakte offizielle native
    HTTPS-Route den Codex-App-Server-Harness implizit auswählen. Erstellen Sie für die API-Schlüsselauthentifizierung
    bei einem Agent-Modell ein `openai`-API-Schlüssel-Authentifizierungsprofil und ordnen Sie es mit
    `auth.order.openai`; `OPENAI_API_KEY` bleibt der direkte Fallback für
    OpenAI-API-Oberflächen ohne Agent. Führen Sie `openclaw doctor --fix` aus, um ältere
    veraltete Einträge der Codex-Authentifizierungsreihenfolge zu migrieren.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    Die bloße Direct-API-ID `gpt-5.6` wird in die Sol-Stufe aufgelöst. Wenn diese API-
    Organisation GPT-5.6 nicht bereitstellt, setzen Sie das primäre Modell explizit auf
    `openai/gpt-5.5`.

    Um das aktuelle Instant-Modell von ChatGPT über die OpenAI API auszuprobieren, setzen Sie das Modell
    auf `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` ist ein dynamischer Alias. Eine neue Einrichtung mit OpenAI-API-Schlüssel verwendet stattdessen
    `openai/gpt-5.6`, dessen bloße Direct-API-ID in Sol aufgelöst wird. Vorhandene
    explizite primäre Modelle, einschließlich `openai/gpt-5.5`, bleiben unverändert. Der
    Alias `chat-latest` akzeptiert nur die Textausführlichkeit `medium`; OpenClaw setzt
    jede andere angeforderte Ausführlichkeit für dieses Modell auf `medium`.

    <Warning>
    OpenClaw stellt `gpt-5.3-codex-spark` **nicht** über die direkte Route mit OpenAI-
    API-Schlüssel bereit. Es ist nur über Einträge im Codex-Abonnementkatalog
    verfügbar, wenn Ihr angemeldetes Konto es bereitstellt.
    </Warning>

  </Tab>

  <Tab title="Codex-Abonnement">
    **Am besten geeignet für:** die Nutzung Ihres ChatGPT-/Codex-Abonnements mit nativer Codex-
    App-Server-Ausführung anstelle eines separaten API-Schlüssels. Codex Cloud erfordert
    die Anmeldung bei ChatGPT.

    <Steps>
      <Step title="Codex OAuth ausführen">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Oder führen Sie OAuth direkt aus:

        ```bash
        openclaw models auth login --provider openai
        ```

        Fügen Sie für Headless-Umgebungen oder Setups, in denen Callbacks problematisch sind, `--device-code` hinzu, um
        sich mit einem ChatGPT-Gerätecode-Ablauf statt über den Browser-
        Callback auf localhost anzumelden:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Kanonische OpenAI-Modellroute verwenden">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.6-sol
        ```

        Für diese exakte offizielle native HTTPS-Route ist keine Runtime-Konfiguration
        erforderlich. Sie kann die Codex-App-Server-Runtime automatisch auswählen, und
        OpenClaw installiert oder repariert das gebündelte Codex-Plugin, wenn diese Runtime
        ausgewählt wird.
      </Step>
      <Step title="Verfügbarkeit der Codex-Authentifizierung überprüfen">
        ```bash
        openclaw models list --provider openai
        ```

        Nachdem der Gateway ausgeführt wird, senden Sie `/codex status` oder `/codex models`
        im Chat, um die native App-Server-Runtime zu überprüfen.
      </Step>
    </Steps>

    ### Routenzusammenfassung

    | Modellreferenz                | Runtime-Richtlinie oder Routenfakten                                 | Route                                                    | Authentifizierung                                               |
    | ------------------------ | ------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.6-sol`     | nicht festgelegt/`auto`, exakte offizielle native HTTPS-Route, keine Anfrageüberschreibung | Codex kann ausgewählt werden                                    | Codex-Anmeldung oder ein geordnetes `openai`-Authentifizierungsprofil |
    | `openai/gpt-5.6-terra`   | nicht festgelegt/`auto`, exakte offizielle native HTTPS-Route, keine Anfrageüberschreibung | Codex kann ausgewählt werden                                    | Codex-Anmeldung, wenn der Katalog Terra bereitstellt       |
    | `openai/gpt-5.6-luna`    | nicht festgelegt/`auto`, exakte offizielle native HTTPS-Route, keine Anfrageüberschreibung | Codex kann ausgewählt werden                                    | Codex-Anmeldung, wenn der Katalog Luna bereitstellt        |
    | `openai/gpt-5.6-sol`     | Provider/Modell `agentRuntime.id: "openclaw"`                  | Eingebettete OpenClaw-Runtime, interner Codex-Authentifizierungstransport | Ausgewähltes `openai`-OAuth-Profil                    |
    | `openai/gpt-5.5`         | expliziter Provider/explizites Modell `agentRuntime.id`                     | Ausgewählte Agent-Runtime                                   | Ausgewähltes OpenAI-Authentifizierungsprofil                       |
    | `openai/*`               | selbst definierte Completions, benutzerdefiniert oder Anfrageüberschreibung | Eingebettete OpenClaw-Runtime                                | Anmeldedatenanforderung bleibt routenspezifisch      |
    | `openai/*`               | offizieller Klartext-HTTP-Endpunkt                  | Abgelehnt                                                 | Anmeldedaten werden nicht gesendet                              |
    | Veraltete Codex-GPT-5.5-Referenz | durch doctor korrigiert                                            | In `openai/gpt-5.5` umgeschrieben                            | Migriertes OpenAI-OAuth-Profil                      |
    | `codex-cli/gpt-5.5`      | durch doctor korrigiert                                            | In `openai/gpt-5.5` umgeschrieben                            | Codex-App-Server-Authentifizierung                              |

    <Warning>
    Die Einrichtung mit einem neuen abonnementbasierten Zugriff verwendet exakt `openai/gpt-5.6-sol`; der
    native Codex-Katalog kann außerdem exakte Terra- oder Luna-Referenzen bereitstellen. Wenn das
    Konto GPT-5.6 nicht bereitstellt, wählen Sie ausdrücklich `openai/gpt-5.5`. Ältere
    Codex-GPT-Referenzen sind veraltete OpenClaw-Routen und nicht der native Codex-Runtime-
    Pfad; führen Sie `openclaw doctor --fix` aus, um sie zu migrieren, ohne eine
    vorhandene explizite GPT-5.5-Auswahl zu aktualisieren. `gpt-5.3-codex-spark` bleibt auf
    Konten beschränkt, deren Codex-Abonnementkatalog es aufführt; direkte OpenAI-
    API-Schlüssel- und Azure-Referenzen dafür bleiben ausgeblendet.
    </Warning>

    <Note>
    Neue Konfigurationen sollten die OpenAI-Agent-Authentifizierungsreihenfolge unter `auth.order.openai` ablegen;
    Doctor migriert ältere veraltete Einträge für die Codex-Authentifizierungsreihenfolge.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
    }
    ```

    Bei einem API-Schlüssel als Ausweichlösung behalten Sie das ausgewählte Modell unter `openai/*` bei und legen
    die Authentifizierungsreihenfolge unter `openai` ab. OpenClaw versucht zuerst das Abonnement und anschließend
    den API-Schlüssel, während es im Codex-Harness verbleibt:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
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
    Das Onboarding importiert kein OAuth-Material mehr aus `~/.codex`. Melden Sie sich mit
    Browser-OAuth (Standard) oder dem oben beschriebenen Gerätecode-Ablauf an; OpenClaw verwaltet die
    daraus resultierenden Anmeldedaten in seinem eigenen Agent-Authentifizierungsspeicher.
    </Note>

    ### Codex-OAuth-Routing prüfen und wiederherstellen

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

    Wenn eine ältere Konfiguration noch veraltete Codex-GPT-Referenzen oder eine überholte OpenAI-
    Runtime-Sitzungsfixierung ohne explizite Runtime-Konfiguration enthält, reparieren Sie sie:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Wenn `models auth list --provider openai` kein verwendbares Profil anzeigt, melden Sie sich
    erneut an:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Verwenden Sie `--profile-id` für mehrere Codex-OAuth-Anmeldungen im selben Agent und
    steuern Sie diese anschließend über die Authentifizierungsreihenfolge oder `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    Führen Sie `openclaw doctor --fix` aus, um ältere veraltete Profil-IDs mit OpenAI-Codex-Präfix
    und Reihenfolgeeinträge zu migrieren, bevor Sie sich auf die Profilreihenfolge verlassen.

    ### Statusanzeige

    Der Chat-Befehl `/status` zeigt, welche Modell-Runtime für die aktuelle
    Sitzung aktiv ist. Das gebündelte Codex-App-Server-Harness erscheint als
    `Runtime: OpenAI Codex`, wenn eine geeignete implizite Route oder eine explizite
    Provider-/Modell-Runtime-Richtlinie es auswählt.

    ### Doctor-Warnung

    Wenn veraltete Codex-Modellreferenzen oder überholte OpenAI-Runtime-Fixierungen in der Konfiguration
    oder im Sitzungsstatus verbleiben, schreibt `openclaw doctor --fix` sie mit
    der Codex-Runtime in `openai/*` um, sofern OpenClaw nicht explizit konfiguriert ist.

    ### Standardwerte des Kontextfensters und Aktivierung eines langen Kontexts

    OpenClaw behandelt die native Modellkapazität und das aktive Runtime-Budget als
    getrennte Werte:

    - `contextWindow` gibt das gesamte Modellfenster des Providers an.
    - `contextTokens` begrenzt, wie viel von diesem Fenster OpenClaw für aktive Eingaben verwendet.

    ChatGPT-/Codex-OAuth folgt dem aktuellen Codex-Kontokatalog. Der aktuelle
    Katalog weist für GPT-5.6 üblicherweise ein aktives Fenster von `272000` Token aus.
    Direkte GPT-5.5- und GPT-5.6-Modelle mit API-Schlüssel verwenden ebenfalls standardmäßig `272000`
    `contextTokens`, obwohl die Platform API ein größeres natives
    Fenster bereitstellt. Dadurch bleibt das normale Profil für Latenz, Qualität und Kosten
    über alle Authentifizierungsmodi hinweg konsistent. Ein konfigurierter Wert für `agents.defaults.contextTokens` kann
    dieses Budget weiter verringern, ein Modell jedoch nicht über seine konfigurierte
    Obergrenze `contextTokens` hinaus anheben.

    Für direkte GPT-5.5- und GPT-5.6-Zugriffe mit API-Schlüssel dokumentiert OpenAI ein Provider-Fenster von
    `1050000` Token und `128000` maximale Ausgabe-Token. Wenn die
    vollständige Ausgabemenge reserviert wird, verbleiben `922000` Token für die Eingabe. Dies ist ein
    abgeleitetes Betriebsbudget und keine separat vom Provider veröffentlichte Eingabegrenze. Siehe den
    offiziellen [Modellvergleich](https://developers.openai.com/api/docs/models/compare)
    und die [GPT-5.5-Modellseite](https://developers.openai.com/api/docs/models/gpt-5.5).
    Im folgenden Beispiel wird für ein Terra-Modell diese Menge aktiviert und
    OpenAI angewiesen, bei `700000` aktiven Token eine Compaction durchzuführen:

    ```json5
    {
      models: {
        providers: {
          openai: {
            models: [
              {
                id: "gpt-5.6-terra",
                name: "GPT-5.6 Terra",
                contextWindow: 1050000,
                contextTokens: 922000,
                maxTokens: 128000,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-terra" },
          models: {
            "openai/gpt-5.6-terra": {
              agentRuntime: { id: "openclaw" },
              params: {
                responsesServerCompaction: true,
                responsesCompactThreshold: 700000,
              },
            },
          },
        },
      },
    }
    ```

    `agentRuntime.id: "openclaw"` ist in diesem Beispiel beabsichtigt. Es belegt, dass der
    eingebettete OpenClaw-Responses-Pfad die oben angegebenen Modellmetadaten und serverseitigen
    Compaction-Einstellungen verwendet. Ein Thread des nativen Codex-Harness verwaltet sein Kontextbudget
    stattdessen in der Codex-Konfiguration; siehe
    [Langer Kontext im Codex-Harness](/de/plugins/codex-harness#direct-api-long-context).

    <Warning>
    OpenAI berechnet höhere Preise für lange Kontexte, sobald eine GPT-5.5- oder GPT-5.6-
    Anfrage `272000` Eingabe-Token überschreitet: Die gesamte qualifizierende Anfrage wird
    mit dem 2-Fachen des Eingabe- und dem 1,5-Fachen des Ausgabetarifs abgerechnet. Große Prompts werden über
    mehrere Interaktionen hinweg erneut gesendet oder komprimiert, sodass eine Sitzung mit aktivierter Option
    erheblich mehr als die Standardeinstellung kosten kann, selbst wenn die sichtbare Antwort kurz ist. Siehe
    [OpenAI-API-Preise](https://developers.openai.com/api/docs/pricing). Die API
    bleibt für Kontozugriff, tatsächliche Grenzen und Abrechnung maßgeblich.
    </Warning>

    ### Katalogwiederherstellung

    OpenClaw verwendet die Upstream-Codex-Katalogmetadaten für `gpt-5.5`, sofern sie
    vorhanden sind. Wenn bei der Live-Codex-Erkennung die Zeile `gpt-5.5` fehlt, obwohl das Konto
    authentifiziert ist, erzeugt OpenClaw diese OAuth-Modellzeile, damit Cron-,
    Sub-Agent- und konfigurierte Standardmodell-Ausführungen nicht mit
    `Unknown model` fehlschlagen.

  </Tab>
</Tabs>

## Authentifizierung des nativen Codex-App-Servers

Das native Codex-App-Server-Harness verwendet `openai/*`-Modellreferenzen, wenn eine geeignete
exakte offizielle HTTPS-Route es implizit auswählt oder wenn die Provider-/Modelloption
`agentRuntime.id: "codex"` es explizit auswählt. Die Authentifizierung erfolgt weiterhin
kontobasiert. OpenClaw wählt die Authentifizierung in dieser Reihenfolge aus:

1. Geordnete OpenAI-Authentifizierungsprofile für den Agent, vorzugsweise unter
   `auth.order.openai`. Führen Sie `openclaw doctor --fix` aus, um ältere veraltete
   Codex-Authentifizierungsprofil-IDs und die Authentifizierungsreihenfolge zu migrieren.
2. Das vorhandene Konto des App-Servers, beispielsweise eine lokale ChatGPT-
   Anmeldung der Codex CLI. Für das standardmäßig isolierte Agent-Basisverzeichnis bindet OpenClaw dieses native
   CLI-Konto über seinen Anmelde-RPC in den App-Server ein; Konfiguration, Plugins
   und Thread-Speicher der CLI werden nicht gemeinsam genutzt.
3. Nur für lokale App-Server-Starts über stdio und nur, wenn der App-Server
   kein Konto meldet: `CODEX_API_KEY`, dann `OPENAI_API_KEY`.

Eine lokale ChatGPT-/Codex-Abonnementanmeldung wird nicht allein deshalb ersetzt, weil der
Gateway-Prozess außerdem `OPENAI_API_KEY` für direkte OpenAI-Modelle oder
Einbettungen enthält. Die Ausweichlösung mit einem API-Schlüssel aus der Umgebung gilt nur für den lokalen
stdio-Pfad ohne Konto; sie wird niemals über WebSocket-Verbindungen zum App-Server gesendet. Wenn ein
abonnementbasiertes Codex-Profil ausgewählt ist, hält OpenClaw außerdem
`CODEX_API_KEY` und `OPENAI_API_KEY` aus dem erzeugten stdio-App-Server-Kindprozess
heraus und übermittelt die ausgewählten Anmeldedaten stattdessen über den Anmelde-RPC des App-Servers.

Wenn dieses Abonnementprofil durch ein Codex-Nutzungslimit blockiert wird, markiert OpenClaw
das Profil bis zur von Codex angegebenen Rücksetzzeit als blockiert und lässt die
Authentifizierungsreihenfolge zum nächsten `openai:*`-Profil wechseln, ohne das ausgewählte
Modell zu ändern oder das Codex-Harness zu verlassen. Nach Ablauf der Rücksetzzeit ist das
Abonnementprofil wieder verwendbar.

## Bilderzeugung

Das gebündelte Plugin `openai` registriert die Bilderzeugung über das
Tool `image_generate`. Es unterstützt sowohl die Bilderzeugung mit OpenAI-API-Schlüssel als auch
mit Codex-OAuth über dieselbe Modellreferenz `openai/gpt-image-2`.

| Funktion                  | OpenAI-API-Schlüssel               | Codex-OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Modellreferenz            | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Authentifizierung         | `OPENAI_API_KEY`                   | OpenAI-Codex-OAuth-Anmeldung          |
| Transport                 | OpenAI Images API                  | Codex-Responses-Backend               |
| Max. Bilder pro Anfrage   | 4                                  | 4                                    |
| Bearbeitungsmodus         | Aktiviert (bis zu 5 Referenzbilder) | Aktiviert (bis zu 5 Referenzbilder)   |
| Größenüberschreibungen    | Unterstützt, einschließlich 2K-/4K-Größen | Unterstützt, einschließlich 2K-/4K-Größen |
| Seitenverhältnis/Auflösung | Nicht an die OpenAI Images API weitergeleitet | Wenn sicher, einer unterstützten Größe zugeordnet |

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
Weitere Informationen zu gemeinsamen Tool-Parametern, zur Provider-Auswahl und zum Failover-Verhalten finden Sie unter
[Bilderzeugung](/de/tools/image-generation).
</Note>

`gpt-image-2` ist die Standardeinstellung für die Text-zu-Bild-Erzeugung und Bildbearbeitung mit OpenAI.
`gpt-image-1.5`, `gpt-image-1` und `gpt-image-1-mini` können weiterhin
als explizite Modellüberschreibungen verwendet werden. Verwenden Sie `openai/gpt-image-1.5` für
PNG-/WebP-Ausgaben mit transparentem Hintergrund; die aktuelle API `gpt-image-2` lehnt
`background: "transparent"` ab.

Rufen Sie für eine Anfrage mit transparentem Hintergrund `image_generate` mit
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` oder `"webp"` sowie
`background: "transparent"` auf; die ältere Provider-Option `openai.background` wird
weiterhin akzeptiert. OpenClaw schützt außerdem die öffentlichen OpenAI- und OpenAI-Codex-OAuth-
Routen, indem standardmäßige transparente `openai/gpt-image-2`-Anfragen in
`gpt-image-1.5` umgeschrieben werden; Azure und benutzerdefinierte OpenAI-kompatible Endpunkte behalten ihre
konfigurierten Bereitstellungs-/Modellnamen bei.

Dieselbe Einstellung ist für Headless-CLI-Ausführungen verfügbar:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "Ein einfacher roter Kreisaufkleber auf transparentem Hintergrund" \
  --json
```

Verwenden Sie dieselben Flags `--output-format` und `--background` mit
`openclaw infer image edit`, wenn Sie von einer Eingabedatei ausgehen.
`--openai-background` bleibt als OpenAI-spezifischer Alias verfügbar. Verwenden Sie
`--quality low|medium|high|auto`, um Qualität und Kosten von OpenAI Images zu steuern.
Verwenden Sie `--openai-moderation low|auto`, um den Moderationshinweis von OpenAI entweder aus
`image generate` oder `image edit` zu übergeben.

Für ChatGPT-/Codex-OAuth-Installationen behalten Sie dieselbe `openai/gpt-image-2`-Referenz bei. Wenn
ein `openai`-OAuth-Profil konfiguriert ist, löst OpenClaw das gespeicherte OAuth-
Zugriffstoken auf und sendet Bildanfragen über das Codex-Responses-Backend; es
versucht nicht zuerst `OPENAI_API_KEY` und greift nicht stillschweigend auf einen API-Schlüssel zurück.
Konfigurieren Sie stattdessen `models.providers.openai` explizit mit einem API-Schlüssel, einer benutzerdefinierten Basis-
URL oder einem Azure-Endpunkt, wenn Sie den direkten Weg über die OpenAI Images API
verwenden möchten. Wenn sich dieser benutzerdefinierte Bildendpunkt in einem vertrauenswürdigen LAN bzw. unter einer privaten Adresse befindet,
legen Sie außerdem `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` fest; OpenClaw
blockiert private/interne OpenAI-kompatible Bildendpunkte weiterhin, sofern diese
explizite Aktivierung nicht vorhanden ist.

Generieren:

```
/tool image_generate model=openai/gpt-image-2 prompt="Ein hochwertiges Einführungsposter für OpenClaw unter macOS" size=3840x2160 count=1
```

Ein transparentes PNG generieren:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="Ein einfacher roter Kreisaufkleber auf transparentem Hintergrund" outputFormat=png background=transparent
```

Bearbeiten:

```
/tool image_generate model=openai/gpt-image-2 prompt="Die Form des Objekts beibehalten und das Material in durchscheinendes Glas ändern" image=/path/to/reference.png size=1024x1536
```

## Videogenerierung

Das gebündelte `openai`-Plugin registriert die Videogenerierung über das
`video_generate`-Tool.

| Funktion               | Wert                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------- |
| Standardmodell         | `openai/sora-2`                                                                 |
| Modi                   | Text-zu-Video, Bild-zu-Video, Bearbeitung eines einzelnen Videos                   |
| Referenzeingaben       | 1 Bild oder 1 Video                                                                |
| Größenüberschreibungen | Für Text-zu-Video und Bild-zu-Video unterstützt                                    |
| Seitenverhältnis       | Wird in die nächstgelegene unterstützte Größe umgewandelt, nicht unverändert weitergeleitet |
| Andere Überschreibungen | `resolution`, `audio`, `watermark` werden nicht unterstützt und mit einer Tool-Warnung verworfen |

OpenAI-Anfragen für Bild-zu-Video verwenden `POST /v1/videos` mit einem Bild-
`input_reference`. Bearbeitungen eines einzelnen Videos verwenden `POST /v1/videos/edits` mit dem
hochgeladenen Video im Feld `video`.

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
Unter [Videogenerierung](/de/tools/video-generation) finden Sie Informationen zu gemeinsamen Tool-Parametern,
zur Provider-Auswahl und zum Failover-Verhalten.

Der OpenAI-Provider deklariert `supportsSize`, jedoch nicht `supportsAspectRatio` oder
`supportsResolution`. Die gemeinsame Normalisierungsschicht von OpenClaw wandelt ein
angefordertes `aspectRatio` in die am besten passende OpenAI-`size` um, bevor die
Anfrage den Provider erreicht. Daher funktionieren Anfragen für Seitenverhältnisse im Allgemeinen weiterhin.
`resolution` verfügt über keinen Größen-Fallback und wird verworfen; dem Aufrufer wird dies als
`Ignored unsupported overrides for openai/<model>: resolution=<value>` angezeigt.
</Note>

## GPT-5-Prompt-Beitrag

OpenClaw fügt für Modelle der GPT-5-Familie beim
`openai`-Provider einen gemeinsamen GPT-5-Prompt-Beitrag hinzu (einschließlich älterer Codex-Referenzen vor der Reparatur, die zu
`openai/*` normalisiert werden). Andere Provider, die ebenfalls Modell-IDs der GPT-5-Familie bereitstellen, etwa
OpenRouter- oder opencode-Routen, erhalten dieses Overlay nicht; es wird anhand der
Provider-ID `openai` und nicht allein anhand der Modell-ID aktiviert. Ältere GPT-4.x-Modelle
erhalten es niemals.

Der native Codex-App-Server-Harness erhält weder den Vertrag für Persona- und Tool-
Disziplin noch das freundliche Interaktionsstil-Overlay über
Entwickleranweisungen; natives Codex behält das Codex-eigene Verhalten für Basis, Modell und
Projektdokumentation bei, und OpenClaw deaktiviert die integrierte Persönlichkeit von Codex für
native Threads, sodass die Persönlichkeitsdateien des Agent-Arbeitsbereichs maßgeblich bleiben.
OpenClaw stellt nativen Codex-Threads ausschließlich Laufzeitkontext bereit: Kanal-
zustellung, dynamische OpenClaw-Tools, ACP-Delegation, Arbeitsbereichskontext und
OpenClaw-Skills. Der Heartbeat-Leittext aus demselben Beitrag bildet die
einzige Ausnahme: Native Codex-Heartbeat-Durchläufe erhalten ihn, eingebunden als dedizierte
Anweisungen zur Zusammenarbeit und nicht über den gemeinsamen Hook für Prompt-Beiträge.

Der GPT-5-Beitrag fügt übereinstimmenden, von OpenClaw zusammengestellten Prompts einen mit Tags versehenen Verhaltensvertrag für die
Beibehaltung der Persona, Ausführungssicherheit, Tool-Disziplin, Ausgabeform, Abschluss-
prüfungen und Verifizierung hinzu. Kanalspezifisches Antwort- und Verhalten für stille Nachrichten verbleibt im gemeinsamen OpenClaw-System-
Prompt und in der Richtlinie für ausgehende Zustellung. Die Ebene für einen freundlichen Interaktionsstil ist
separat und konfigurierbar.

| Wert                         | Wirkung                                               |
| ---------------------------- | ----------------------------------------------------- |
| `"friendly"` (Standard) | Ebene für freundlichen Interaktionsstil aktivieren    |
| `"on"`           | Alias für `"friendly"`                          |
| `"off"`           | Nur die Ebene für freundlichen Stil deaktivieren      |

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
Bei der Laufzeit wird die Groß-/Kleinschreibung der Werte nicht berücksichtigt. Daher deaktivieren sowohl `"Off"` als auch `"off"` die
Ebene für freundlichen Stil.
</Tip>

<Note>
Das ältere `plugins.entries.openai.config.personality` wird weiterhin als
Kompatibilitäts-Fallback gelesen, wenn die gemeinsame
Einstellung `agents.defaults.promptOverlays.gpt5.personality` nicht gesetzt ist.
</Note>

## Stimme und Sprache

<AccordionGroup>
  <Accordion title="Sprachsynthese (TTS)">
    Das gebündelte `openai`-Plugin registriert die Sprachsynthese für die
    `tts`-Oberfläche.

    | Einstellung   | Konfigurationspfad                                      | Standard                            |
    | ------------- | ------------------------------------------------------- | ----------------------------------- |
    | Modell        | `tts.providers.openai.model`                                      | `gpt-4o-mini-tts`                  |
    | Stimme        | `tts.providers.openai.speakerVoice`                                      | `coral`                  |
    | Geschwindigkeit | `tts.providers.openai.speed`                                    | (nicht gesetzt)                     |
    | Anweisungen   | `tts.providers.openai.instructions`                                      | (nicht gesetzt, nur `gpt-4o-mini-tts`) |
    | Format        | `tts.providers.openai.responseFormat`                                      | `opus` für Sprachnachrichten, `mp3` für Dateien |
    | API-Schlüssel | `tts.providers.openai.apiKey`                                      | Greift auf `OPENAI_API_KEY` zurück |
    | Basis-URL     | `tts.providers.openai.baseUrl`                                      | `https://api.openai.com/v1`                  |
    | Zusätzlicher Body | `tts.providers.openai.extraBody` / `extra_body`             | (nicht gesetzt)                     |

    Verfügbare Modelle: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Verfügbare Stimmen:
    `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`,
    `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` wird nach den von OpenClaw generierten Feldern in den JSON-Anfragetext `/audio/speech` eingefügt.
    Verwenden Sie es daher für OpenAI-kompatible Endpunkte, die
    zusätzliche Schlüssel wie `lang` erfordern. Prototypschlüssel werden ignoriert.

    ```json5
    {
      tts: {
        providers: {
          openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
        },
      },
    }
    ```

    <Note>
    Legen Sie `OPENAI_TTS_BASE_URL` fest, um die TTS-Basis-URL zu überschreiben, ohne den
    Chat-API-Endpunkt zu beeinflussen. Sowohl OpenAI TTS als auch Realtime Voice werden
    über einen API-Schlüssel der OpenAI Platform konfiguriert. Installationen, die ausschließlich OAuth verwenden, können weiterhin
    Codex-gestützte Chatmodelle verwenden, jedoch keine Live-Sprachantworten von OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Sprache-zu-Text">
    Das gebündelte `openai`-Plugin registriert die Batch-Sprache-zu-Text-Funktion über
    die Transkriptionsoberfläche für das Medienverständnis von OpenClaw.

    - Standardmodell: `gpt-4o-transcribe`
    - Endpunkt: OpenAI REST `/v1/audio/transcriptions`
    - Eingabepfad: Mehrteiliger Audiodatei-Upload
    - Wird überall dort verwendet, wo die Transkription eingehender Audiodaten `tools.media.audio` liest,
      einschließlich Segmenten aus Discord-Sprachkanälen und Audioanhängen aus Kanälen

    So erzwingen Sie OpenAI für die Transkription eingehender Audiodaten:

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

    Sprach- und Prompt-Hinweise werden an OpenAI weitergeleitet, wenn sie über die
    gemeinsame Audiomedien-Konfiguration oder eine Transkriptionsanfrage pro Aufruf bereitgestellt werden.

  </Accordion>

  <Accordion title="Echtzeittranskription">
    Das gebündelte `openai`-Plugin registriert die Echtzeittranskription für das
    Voice-Call-Plugin.

    | Einstellung      | Konfigurationspfad                                                  | Standard |
    | ---------------- | ------------------------------------------------------------------- | -------- |
    | Modell           | `plugins.entries.voice-call.config.streaming.providers.openai.model`                                                  | `gpt-4o-transcribe` |
    | Sprache          | `...openai.language`                                                  | (nicht gesetzt) |
    | Prompt           | `...openai.prompt`                                                  | (nicht gesetzt) |
    | Stilledauer      | `...openai.silenceDurationMs`                                                  | `800` |
    | VAD-Schwellenwert | `...openai.vadThreshold`                                                 | `0.5` |
    | Authentifizierung | `...openai.apiKey`, `OPENAI_API_KEY` oder API-Schlüsselprofil `openai` | API-Schlüssel der Platform erforderlich |

    <Note>
    Verwendet eine WebSocket-Verbindung zu `wss://api.openai.com/v1/realtime` mit
    G.711-μ-law-Audio (`g711_ulaw` / `audio/pcmu`). Für ein `openai`-API-Schlüssel-
    profil stellt der Gateway ein kurzlebiges Client-
    Secret für die Echtzeittranskription aus, bevor der WebSocket geöffnet wird. Dieser Streaming-Provider ist für den Echtzeittranskriptionspfad von Voice
    Call vorgesehen; Discord Voice zeichnet derzeit kurze
    Segmente auf und verwendet stattdessen den Batch-Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Echtzeitstimme">
    Das gebündelte `openai`-Plugin registriert Echtzeitstimme für das Voice-Call-
    Plugin.

    | Einstellung                            | Konfigurationspfad                                                          | Standardwert                   |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------ |
    | Modell                                 | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2.1`  |
    | Stimme                                 | `...openai.voice`                                                       | `alloy`             |
    | Temperatur (Azure-Bereitstellungs-Bridge) | `...openai.temperature`                                                 | `0.8`               |
    | VAD-Schwellenwert                      | `...openai.vadThreshold`                                                | `0.5`                |
    | Stilledauer                            | `...openai.silenceDurationMs`                                           | `500`                |
    | Präfixauffüllung                       | `...openai.prefixPaddingMs`                                             | `300`                |
    | Reasoning-Aufwand                      | `...openai.reasoningEffort`                                             | (nicht festgelegt)              |
    | Authentifizierung                      | `openai` API-Schlüsselprofil, `...openai.apiKey` oder `OPENAI_API_KEY` | OpenAI-Platform-API-Schlüssel erforderlich |

    Verfügbare integrierte Realtime-Stimmen für `gpt-realtime-2.1`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI empfiehlt `marin` und `cedar` für die beste Realtime-Qualität. Dies
    ist ein separater Satz von den oben aufgeführten Text-to-Speech-Stimmen; eine reine TTS-Stimme
    wie `fable`, `nova` oder `onyx` ist für Realtime-Sitzungen nicht gültig.
    Legen Sie das Modell explizit auf `gpt-realtime-2.1-mini` fest, wenn Sie die
    kleinere, kostengünstigere Realtime-2.1-Variante bevorzugen.

    <Note>
    **GPT-Live (demnächst verfügbar).** Die Vollduplexmodelle `gpt-live-1` und
    `gpt-live-1-mini` von OpenAI ersetzten im Juli 2026 den ChatGPT-Sprachmodus; die
    Entwickler-API wird schrittweise für Organisationen mit Early Access bereitgestellt. OpenClaw
    erkennt die Modellfamilie, führt sie jedoch noch nicht aus: GPT-Live-Sitzungen sind
    ausschließlich WebRTC-basiert, steuern ihren Sprecherwechsel selbst (kein VAD) und delegieren Agentenarbeit
    über ein Handoff-Ereignisprotokoll, das die Realtime-Transporte von OpenClaw
    noch nicht implementieren. Die Konfiguration eines `gpt-live-*`-Modells schlägt kontrolliert fehl und
    zeigt Hinweise sowohl zur WebSocket-Bridge als auch zu Talk-Browsersitzungen an, statt
    Audio ohne Agentenzugriff unbemerkt zu verbinden. Der API-Zugriff wird während des Early Access
    außerdem pro OpenAI-Organisation freigeschaltet. Behalten Sie `gpt-realtime-2.1` (den
    Standardwert) bei, bis die GPT-Live-Unterstützung verfügbar ist.
    </Note>

    <Note>
    Backend-Realtime-Bridges für OpenAI verwenden das GA-Realtime-WebSocket-Sitzungsformat,
    das `session.temperature` nicht akzeptiert. Azure-OpenAI-
    Bereitstellungen bleiben über `azureEndpoint` und `azureDeployment` verfügbar und
    behalten das bereitstellungskompatible Sitzungsformat bei (einschließlich `temperature`).
    Unterstützt bidirektionale Tool-Aufrufe und G.711-u-law-Audio.
    </Note>

    <Note>
    Die Realtime-Stimme wird beim Erstellen der Sitzung ausgewählt. OpenAI erlaubt, die meisten
    Sitzungsfelder später zu ändern, die Stimme kann jedoch nicht mehr geändert werden, nachdem das
    Modell in dieser Sitzung Audio ausgegeben hat. OpenClaw stellt die
    integrierten Realtime-Stimmen-IDs derzeit als Zeichenfolgen bereit.
    </Note>

    <Note>
    Control UI Talk verwendet OpenAI-Realtime-Browsersitzungen mit einem vom Gateway
    ausgestellten kurzlebigen Client-Secret und einem direkten WebRTC-SDP-Austausch des Browsers
    mit der OpenAI Realtime API. Das Gateway stellt dieses Client-Secret mit
    den ausgewählten `openai`-Anmeldedaten aus. Konfigurierte Schlüssel, API-Schlüsselprofile und
    `OPENAI_API_KEY` haben Vorrang; ein `openai`-OAuth-Profil oder eine externe
    Codex-Anmeldung dient als Fallback. Gateway-Relay- und Voice-Call-Backend-Realtime-
    WebSocket-Bridges verwenden dieselbe Reihenfolge der Anmeldedaten für native OpenAI-Endpunkte.
    Eine Live-Verifizierung für Maintainer ist verfügbar mit
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    die OpenAI-Abschnitte überprüfen sowohl die Backend-WebSocket-Bridge als auch den
    WebRTC-SDP-Austausch des Browsers, ohne Secrets zu protokollieren.
    Übergeben Sie `--openai-only`, um diese beiden Abschnitte ohne Google-Anmeldedaten auszuführen.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure-OpenAI-Endpunkte

Der gebündelte Provider `openai` kann durch Überschreiben der Basis-URL eine
Azure-OpenAI-Ressource für die Bilderzeugung ansprechen. Im Bilderzeugungspfad erkennt OpenClaw
Azure-Hostnamen in `models.providers.openai.baseUrl` und wechselt
automatisch zum Anfrageformat von Azure.

<Note>
Die Realtime-Stimme verwendet einen separaten Konfigurationspfad
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
und wird von `models.providers.openai.baseUrl` nicht beeinflusst. Informationen zu den Azure-
Einstellungen finden Sie im Akkordeon **Realtime-Stimme** unter [Stimme und Sprache](#voice-and-speech).
</Note>

Verwenden Sie Azure OpenAI, wenn:

- Sie bereits über ein Azure-OpenAI-Abonnement, ein Kontingent oder eine Unternehmensvereinbarung
  verfügen
- Sie regionale Datenresidenz oder von Azure bereitgestellte Compliance-Kontrollen benötigen
- Sie den Datenverkehr innerhalb eines bestehenden Azure-Mandanten halten möchten

### Konfiguration

Richten Sie für die Azure-Bilderzeugung über den gebündelten Provider `openai`
`models.providers.openai.baseUrl` auf Ihre Azure-Ressource und setzen Sie `apiKey` auf
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

OpenClaw erkennt diese Azure-Hostsuffixe für die Azure-Bilderzeugungsroute:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Bei Bilderzeugungsanfragen an einen erkannten Azure-Host führt OpenClaw Folgendes aus:

- Sendet den Header `api-key` anstelle von `Authorization: Bearer`
- Verwendet bereitstellungsspezifische Pfade (`/openai/deployments/{deployment}/...`)
- Hängt `?api-version=...` an jede Anfrage an
- Verwendet ein standardmäßiges Anfrage-Timeout von 600s für Azure-Bilderzeugungsaufrufe.
  Aufrufspezifische Werte für `timeoutMs` überschreiben diesen Standardwert weiterhin.

Andere Basis-URLs (öffentliches OpenAI, OpenAI-kompatible Proxys) behalten das standardmäßige
OpenAI-Anfrageformat für Bilder bei.

<Note>
Das Azure-Routing für den Bilderzeugungspfad des Providers `openai` erfordert
OpenClaw 2026.4.22 oder höher. Frühere Versionen behandeln jede benutzerdefinierte
`openai.baseUrl` wie den öffentlichen OpenAI-Endpunkt und schlagen bei Azure-Bildbereitstellungen
fehl.
</Note>

### API-Version

Setzen Sie `AZURE_OPENAI_API_VERSION`, um eine bestimmte Azure-Preview- oder GA-Version
für den Azure-Bilderzeugungspfad festzulegen:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Wenn die Variable nicht gesetzt ist, lautet der Standardwert `2024-12-01-preview`.

### Modellnamen sind Bereitstellungsnamen

Azure OpenAI bindet Modelle an Bereitstellungen. Bei Azure-Bilderzeugungsanfragen,
die über den gebündelten Provider `openai` geleitet werden, muss das Feld `model` in OpenClaw
dem **Azure-Bereitstellungsnamen** entsprechen, den Sie im Azure-Portal konfiguriert haben, und nicht
der öffentlichen OpenAI-Modell-ID.

Wenn Sie eine Bereitstellung namens `gpt-image-2-prod` erstellen, die `gpt-image-2` bereitstellt:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Ein klares Poster" size=1024x1024 count=1
```

Dieselbe Regel für Bereitstellungsnamen gilt für jeden Bilderzeugungsaufruf, der
über den gebündelten Provider `openai` geleitet wird.

### Regionale Verfügbarkeit

Die Azure-Bilderzeugung ist derzeit nur in einer Teilmenge der Regionen verfügbar
(zum Beispiel `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Prüfen Sie vor dem Erstellen einer Bereitstellung die aktuelle
Regionsliste von Microsoft und vergewissern Sie sich, dass das jeweilige Modell in Ihrer Region angeboten wird.

### Parameterunterschiede

Azure OpenAI und das öffentliche OpenAI akzeptieren nicht immer dieselben Bildparameter.
Azure kann Optionen ablehnen, die das öffentliche OpenAI erlaubt (zum Beispiel bestimmte
Werte für `background` bei `gpt-image-2`), oder diese nur für bestimmte Modellversionen
bereitstellen. Diese Unterschiede stammen von Azure und dem zugrunde liegenden Modell, nicht von
OpenClaw. Wenn eine Azure-Anfrage mit einem Validierungsfehler fehlschlägt, prüfen Sie im
Azure-Portal den Parametersatz, den Ihre konkrete Bereitstellung und API-Version
unterstützt.

<Note>
Azure OpenAI verwendet nativen Transport und Kompatibilitätsverhalten, erhält jedoch nicht
die verborgenen Attributionsheader von OpenClaw – siehe das Akkordeon **Native und OpenAI-kompatible
Routen** unter [Erweiterte Konfiguration](#advanced-configuration).

Verwenden Sie für Chat- oder Responses-Datenverkehr in Azure (über die Bilderzeugung hinaus) den
Onboarding-Ablauf oder eine dedizierte Azure-Provider-Konfiguration; `openai.baseUrl` allein
übernimmt das Azure-API-/Authentifizierungsformat nicht. Es existiert ein separater
Provider `azure-openai-responses/*`; siehe das Akkordeon zur serverseitigen Compaction
weiter unten.
</Note>

## Erweiterte Konfiguration

Die folgenden modellspezifischen Beispiele für `params` bestimmen die eingebettete Provider-
Anfrage von OpenClaw. Ihre Konfiguration stellt explizit festgelegtes Anfrageverhalten dar, sodass eine ansonsten geeignete
Route `auto` bei OpenClaw verbleibt, statt Codex implizit auszuwählen. Das native
Codex-App-Server-Harness verwaltet seinen eigenen Transport und seine eigenen Anfrageeinstellungen; ein explizites
`agentRuntime.id: "codex"` schlägt kontrolliert fehl, wenn die effektive Route nicht als
Codex-kompatibel deklariert ist.

<AccordionGroup>
  <Accordion title="Transport (WebSocket oder SSE)">
    OpenClaw verwendet für `openai/*` zuerst WebSocket mit SSE-Fallback (`"auto"`).

    Im Modus `"auto"` führt OpenClaw Folgendes aus:
    - Wiederholt einen frühen WebSocket-Fehler einmal, bevor auf SSE zurückgegriffen wird
    - Markiert WebSocket nach einem Fehler für 60 Sekunden als beeinträchtigt und verwendet SSE
      während der Abkühlphase
    - Fügt stabile Sitzungs- und Turn-Identitätsheader für Wiederholungsversuche und
      Neuverbindungen hinzu
    - Normalisiert Nutzungszähler (`input_tokens` / `prompt_tokens`) über
      Transportvarianten hinweg

    | Wert                   | Verhalten                           |
    | ---------------------- | ----------------------------------- |
    | `"auto"` (Standard) | Zuerst WebSocket, SSE-Fallback |
    | `"sse"`              | Nur SSE erzwingen                  |
    | `"websocket"`        | Nur WebSocket erzwingen            |

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

    Wenn diese Option aktiviert ist, ordnet OpenClaw den Schnellmodus der priorisierten Verarbeitung von OpenAI
    (`service_tier = "priority"`) zu. Vorhandene Werte für `service_tier` bleiben
    erhalten, und der Schnellmodus schreibt weder `reasoning` noch
    `text.verbosity` um. `fastMode: "auto"` startet neue Modellaufrufe bis zum
    automatischen Grenzwert im Schnellmodus und startet spätere Wiederholungs-, Fallback-, Tool-Ergebnis- oder
    Fortsetzungsaufrufe anschließend ohne Schnellmodus. Der Grenzwert beträgt standardmäßig 60 Sekunden;
    setzen Sie `params.fastAutoOnSeconds` am aktiven Modell, um ihn zu ändern.

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
    Sitzungsüberschreibungen haben Vorrang vor der Konfiguration. Wenn Sie die Sitzungsüberschreibung in der
    Sessions UI löschen, verwendet die Sitzung wieder den konfigurierten Standardwert.
    </Note>

  </Accordion>

  <Accordion title="Prioritätsverarbeitung (service_tier)">
    Die API von OpenAI bietet über `service_tier` eine Prioritätsverarbeitung. Legen Sie diese pro
    Modell in OpenClaw fest:

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
    `serviceTier` wird nur an native OpenAI-Endpunkte
    (`api.openai.com`) und native Codex-Endpunkte (`chatgpt.com/backend-api`) weitergeleitet.
    Wenn Sie einen der beiden Provider über einen Proxy leiten, lässt OpenClaw
    `service_tier` unverändert.
    </Warning>

  </Accordion>

  <Accordion title="Serverseitige Compaction (Responses API)">
    Für direkte OpenAI-Responses-Modelle (`openai/*` auf `api.openai.com`) aktiviert der
    OpenClaw-Stream-Wrapper des OpenAI-Plugins automatisch die serverseitige
    Compaction:

    - Erzwingt `store: true` (sofern die Modellkompatibilität nicht `supportsStore: false` festlegt)
    - Fügt `context_management: [{ type: "compaction", compact_threshold: ... }]` ein
    - Standardwert für `compact_threshold`: 70 % von `contextWindow` (oder `80000`, wenn
      nicht verfügbar)

    Dies gilt für den integrierten OpenClaw-Laufzeitpfad und für Hooks des OpenAI-Providers,
    die von eingebetteten Ausführungen verwendet werden. Das native Codex-App-Server-Harness verwaltet
    seinen eigenen Kontext über Codex und wird von dieser Einstellung nicht beeinflusst.

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
    `responsesServerCompaction` steuert nur das Einfügen von `context_management`.
    Direkte OpenAI-Responses-Modelle erzwingen weiterhin `store: true`, sofern die Kompatibilität
    nicht `supportsStore: false` festlegt.
    </Note>

  </Accordion>

  <Accordion title="Strikt-agentischer GPT-Modus">
    Bei GPT-5-Familienmodellen des Providers `openai`, die über die eingebettete
    Laufzeit von OpenClaw ausgeführt werden, verwendet OpenClaw bereits standardmäßig einen strengeren Ausführungsvertrag namens
    `strict-agentic`. Er wird automatisch aktiviert, wenn der aufgelöste Provider
    `openai` ist und die Modell-ID der GPT-5-Familie entspricht, sofern die Konfiguration
    ihn nicht ausdrücklich deaktiviert:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    Das explizite Festlegen von `"strict-agentic"` hat auf einem unterstützten Pfad keine Wirkung (es
    ist bereits der Standard) und bleibt bei nicht unterstützten Provider-/Modellpaaren wirkungslos.

    Wenn `strict-agentic` aktiv ist, führt OpenClaw Folgendes aus:
    - Aktiviert `update_plan` bei umfangreichen Aufgaben automatisch
    - Wiederholt strukturell leere oder ausschließlich aus Reasoning bestehende Durchläufe mit einer Fortsetzung,
      die eine sichtbare Antwort erzeugt
    - Verwendet explizite Planereignisse des Harnesses, wenn das ausgewählte Harness
      diese bereitstellt

    OpenClaw klassifiziert den Text des Assistenten nicht, um zu entscheiden, ob ein Durchlauf ein
    Plan, eine Fortschrittsmeldung oder eine abschließende Antwort ist.

    <Note>
    Dieser Vertrag befindet sich vollständig im eingebetteten Agent-Runner von OpenClaw. Er gilt
    nicht für das native Codex-App-Server-Harness, das sein eigenes
    Durchlauf- und Planverhalten verwaltet; bei nativen Codex-Ausführungen ist die Auswahl des Harnesses wichtiger als die
    Einstellung des Ausführungsvertrags.
    </Note>

  </Accordion>

  <Accordion title="Native und OpenAI-kompatible Routen">
    OpenClaw behandelt direkte OpenAI-, Codex- und Azure-OpenAI-Endpunkte
    anders als generische OpenAI-kompatible `/v1`-Proxys:

    **Native Routen** (`openai/*`, Azure OpenAI):
    - Behält `reasoning: { effort: "none" }` nur für Modelle bei, die den OpenAI-Aufwand
      `none` unterstützen
    - Lässt deaktiviertes Reasoning bei Modellen oder Proxys weg, die
      `reasoning.effort: "none"` ablehnen
    - Verwendet standardmäßig den strikten Modus für Tool-Schemas
    - Fügt verborgene Zuordnungs-Header nur bei verifizierten nativen Hosts hinzu (Azure
      OpenAI erhält diese Header nicht, obwohl es sich um eine native Route handelt)
    - Behält OpenAI-spezifische Anfrageanpassungen bei (`service_tier`, `store`,
      Reasoning-Kompatibilität, Hinweise für den Prompt-Cache)

    **Proxy-/kompatible Routen:**
    - Verwenden ein weniger striktes Kompatibilitätsverhalten
    - Entfernen bei nicht nativen `openai-completions`-Nutzlasten das Completions-Feld `store`
    - Akzeptieren erweitertes JSON zur Durchleitung von `params.extra_body`/`params.extraBody`
      für OpenAI-kompatible Completions-Proxys
    - Akzeptieren `params.chat_template_kwargs` für OpenAI-kompatible Completions-
      Proxys wie vLLM
    - Erzwingen weder strikte Tool-Schemas noch ausschließlich für native Routen vorgesehene Header

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Bilderzeugung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter für Bild-Tools und Auswahl des Providers.
  </Card>
  <Card title="Videoerzeugung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter für Video-Tools und Auswahl des Providers.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Details zur Authentifizierung und Regeln für die Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
