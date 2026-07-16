---
read_when:
    - Sie möchten OpenAI-Modelle in OpenClaw verwenden
    - Sie möchten die Codex-Abonnementauthentifizierung anstelle von API-Schlüsseln verwenden
    - Sie benötigen ein strengeres Ausführungsverhalten für GPT-5-Agenten
summary: OpenAI über API-Schlüssel oder ein Codex-Abonnement in OpenClaw verwenden
title: OpenAI
x-i18n:
    generated_at: "2026-07-16T13:20:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 18efddc44f2b06ae9592cdbc01c0aadc4621ddf99e818793a4d835c741a2464e
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw verwendet eine einzige Provider-ID, `openai`, sowohl für die direkte Authentifizierung per API-Schlüssel als auch für die
ChatGPT/Codex-Abonnementauthentifizierung. `openai/*` ist die kanonische Modellroute.
Bei eingebetteten Agent-Durchläufen, für die keine Laufzeitrichtlinie oder `auto` festgelegt ist, bestimmen die
Routeninformationen von OpenAI, ob OpenClaw implizit die gebündelte Codex-App-Server-Laufzeit
auswählen darf. Das Präfix `openai/*` allein wählt keine Laufzeit aus.

- **Agent-Modelle** – `openai/*` über die Laufzeit, die durch eine explizite
  `agentRuntime`-Konfiguration oder die implizite Routenrichtlinie von OpenAI ausgewählt wurde. Melden Sie sich für die Nutzung eines ChatGPT/Codex-Abonnements mit der Codex-Authentifizierung
  an oder konfigurieren Sie ein Authentifizierungsprofil mit API-Schlüssel,
  wenn Sie eine schlüsselbasierte Abrechnung wünschen.
- **OpenAI-APIs ohne Agent** – direkter Zugriff auf die OpenAI Platform mit nutzungsbasierter Abrechnung
  über `OPENAI_API_KEY` oder ein `openai`-Authentifizierungsprofil mit API-Schlüssel.
- **Veraltete Konfiguration** – Verweise auf `codex/*` und `openai-codex/*` werden durch
  `openclaw doctor --fix` zu `openai/*` sowie zum modellbezogenen
  `agentRuntime.id: "codex"` korrigiert.

OpenAI unterstützt die Nutzung von Abonnement-OAuth in externen Tools und
Workflows wie OpenClaw ausdrücklich.

## Nutzungs- und Kostenverfolgung

OpenClaw behandelt das Abonnementkontingent und die Abrechnung der Platform-API getrennt:

- ChatGPT/Codex OAuth zeigt den Abonnementtarif, die Kontingentzeiträume und das Guthaben an.
- `OPENAI_ADMIN_KEY` zeigt in der Control UI unter **Nutzung** 30 Tage der vom Provider gemeldeten Organisationskosten und Completions-Nutzung an, einschließlich täglicher Ausgaben, Gesamtzahlen für Anfragen und Token, meistgenutzter Modelle und Kostenkategorien.
- `OPENAI_PROJECT_ID` beschränkt den Verlauf der Admin-API optional auf ein Projekt.
- OpenClaw sendet niemals `OPENAI_API_KEY` oder ein `openai`-Inferenzprofil an Organisations-APIs; diese Anmeldedaten können zu benutzerdefinierten, Azure- oder agentenlokalen Endpunkten gehören.

Ein expliziter Admin-Schlüssel hat Vorrang vor OAuth. Der vom Provider gemeldete Verlauf wird nicht mit den aus Sitzungen abgeleiteten geschätzten Kosten von OpenClaw zusammengeführt; er kann API-Aktivitäten anderer Clients und anbieterseitige Abrechnungsanpassungen enthalten.

Die Dokumentation zum [API Usage Dashboard](https://help.openai.com/en/articles/10478918) von OpenAI beschreibt die Anforderungen an Organisationseigentümer und explizite Usage-Dashboard-Berechtigungen für Nutzungsdaten.

Provider, Modell, Laufzeit und Kanal sind separate Ebenen. Wenn diese Bezeichnungen
vermischt werden, lesen Sie [Agent-Laufzeiten](/de/concepts/agent-runtimes), bevor Sie
die Konfiguration ändern.

## Schnellauswahl

| Ziel                                              | Verwenden                                                           | Hinweise                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| ChatGPT/Codex-Abonnement, native Codex-Laufzeit   | `openai/gpt-5.6-sol`                                               | Neue Abonnementeinrichtung; mit Codex-Authentifizierung anmelden.                  |
| Direkte Abrechnung per API-Schlüssel für Agent-Durchläufe | `openai/gpt-5.6` plus ein geordnetes Authentifizierungsprofil mit API-Schlüssel | Neue Einrichtung mit API-Schlüssel; die reine direkte API-ID wird zu Sol aufgelöst. |
| Eine bestimmte GPT-5.6-Stufe auswählen            | `openai/gpt-5.6-sol`, `-terra` oder `-luna`                         | Prüfen Sie mit `models list`, welche Stufen für dieses Konto verfügbar sind.        |
| Konto ohne Zugriff auf GPT-5.6                    | `openai/gpt-5.5`                                                   | Explizite Wiederherstellungsoption; OpenClaw führt kein stilles Downgrade durch.     |
| Direkte Abrechnung per API-Schlüssel, explizite OpenClaw-Laufzeit | `openai/gpt-5.6` plus Provider/Modell `agentRuntime.id: "openclaw"` | Wählen Sie ein normales `openai`-Authentifizierungsprofil mit API-Schlüssel aus.                           |
| Alias für das neueste ChatGPT-Instant-Modell      | `openai/chat-latest`                                               | Nur mit direktem API-Schlüssel; veränderlicher Alias, nicht der stabile Standardwert.          |
| Bilderzeugung oder -bearbeitung                    | `openai/gpt-image-2`                                               | Funktioniert mit `OPENAI_API_KEY` oder Codex OAuth.                         |
| Bilder mit transparentem Hintergrund              | `openai/gpt-image-1.5`                                             | Setzen Sie `outputFormat` auf `png` oder `webp` und `background=transparent`. |

## Namenszuordnung

| Angezeigter Name                         | Ebene             | Bedeutung                                                                                  |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | Provider-Präfix   | Kanonische OpenAI-Modellroute; die Routeninformationen bestimmen die implizite Laufzeit.                |
| `codex`-Plugin                          | Plugin            | Gebündeltes Plugin, das die native Codex-App-Server-Laufzeit und die `/codex`-Chatsteuerung bereitstellt. |
| Provider/Modell `agentRuntime.id: codex` | Agent-Laufzeit     | Erzwingt das native Codex-App-Server-Testgerüst für übereinstimmende eingebettete Durchläufe.                   |
| `/codex ...`                            | Chat-Befehlssatz  | Bindet und steuert Codex-App-Server-Threads aus einer Unterhaltung heraus.                               |
| `runtime: "acp", agentId: "codex"`      | ACP-Sitzungsroute | Expliziter Ausweichpfad, der Codex über ACP/acpx ausführt.                                 |

## Implizite Agent-Laufzeit

Wenn die Provider/Modell-Richtlinie `agentRuntime` nicht festgelegt oder auf `auto` gesetzt ist, wählt die
providereigene Routenrichtlinie von OpenAI die implizite Laufzeit anhand des effektiven
Endpunkts und Adapters aus:

| Effektive Routeninformationen                                                                                                                                          | Implizite Laufzeit    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Exakt offizieller Platform-HTTPS-Endpunkt mit `openai-responses` oder exakt offizieller ChatGPT-HTTPS-Endpunkt mit `openai-chatgpt-responses`; keine explizit festgelegte Anfrageüberschreibung | Codex kann ausgewählt werden |
| Explizit festgelegter `openai-completions`-Adapter                                                                                                                      | OpenClaw              |
| Benutzerdefinierter Endpunkt                                                                                                                                           | OpenClaw              |
| Expliziter, exakt offizieller Endpunkt mit HTTP                                                                                                                        | Abgelehnt             |
| Route mit einer explizit festgelegten Provider/Modell-Anfrageüberschreibung                                                                                            | OpenClaw              |

Eine explizite, nicht standardmäßige Provider/Modell-Einstellung `agentRuntime.id` bleibt maßgeblich.
Beispielsweise hält `agentRuntime.id: "openclaw"` eine ansonsten für Codex geeignete
Route auf OpenClaw, während `agentRuntime.id: "codex"` Codex voraussetzt und
geschlossen fehlschlägt, wenn die effektive Route nicht als Codex-kompatibel deklariert ist.
Die Laufzeitauswahl ändert weder die Art der Anmeldedaten noch die Abrechnung: Die Authentifizierung per Platform-API-Schlüssel
und die ChatGPT/Codex-Abonnementauthentifizierung bleiben getrennt.

`openclaw doctor --fix` migriert veraltete Modellverweise auf `codex/*` und `openai-codex/*`,
veraltete IDs von Codex-Authentifizierungsprofilen und veraltete Einträge der Codex-Authentifizierungsreihenfolge zur
kanonischen Route `openai`. Migrierte Modellverweise erhalten das modellbezogene
`agentRuntime.id: "codex"`; verwenden Sie `auth.order.openai` für neue Konfigurationen der Authentifizierungsreihenfolge.

<Note>
Bei einer neuen OpenAI-Einrichtung wird GPT-5.6 nur dann als primäres Modell festgelegt, wenn kein primäres Modell
konfiguriert ist. Beim Hinzufügen oder Aktualisieren der OpenAI-Authentifizierung bleibt eine vorhandene explizite
Auswahl einschließlich `openai/gpt-5.5` erhalten, sofern Sie nicht ausdrücklich
`models auth login --set-default` oder `models set` verwenden. Verwenden Sie ein Authentifizierungsprofil mit API-Schlüssel
nur, wenn Sie für ein Agent-Modell die Authentifizierung per API-Schlüssel wünschen.
</Note>

## Eingeschränkte Vorschau von GPT-5.6

OpenClaw erkennt die exakten Modell-IDs `openai/gpt-5.6-sol`,
`openai/gpt-5.6-terra` und `openai/gpt-5.6-luna`. Alle drei bieten im aktuellen Katalog
`xhigh`- und `max`-Reasoning. OpenAI bezeichnet Sol als
Flaggschiff-Stufe, Terra als ausgewogene Stufe und Luna als schnelle,
kostengünstigere Stufe. Siehe die
[Ankündigung zur Einführung von GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/)
und den [Zugriffsleitfaden](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

Bei direkter OpenAI-Authentifizierung per API-Schlüssel ist die reine ID `openai/gpt-5.6` ein Alias für
Sol und der Standardwert bei einer neuen Einrichtung. Der native Codex-Katalog wendet
diesen Alias der direkten API nicht clientseitig an; abhängig vom Workspace-Zugriff kann er
die exakten IDs von Sol, Terra und Luna anzeigen. Eine neue ChatGPT/Codex-OAuth-Einrichtung
verwendet daher `openai/gpt-5.6-sol`. Prüfen Sie das aktuelle Konto mit:

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
Geeignete, exakt offizielle HTTPS-Routen können das gebündelte Codex-App-Server-Plugin
auswählen, wenn keine Laufzeitrichtlinie festgelegt oder sie auf `auto` gesetzt ist; explizit festgelegte Completions-Routen,
benutzerdefinierte Endpunkte und Überschreibungen des Anfragetransports verbleiben auf OpenClaw. Unverschlüsselte
offizielle HTTP-Endpunkte werden abgelehnt. Eine explizite Provider/Modell-Laufzeitkonfiguration bleibt
maßgeblich. Führen Sie `openclaw doctor --fix` aus, um veraltete Codex-Modellverweise,
`codex-cli/*`-Verweise oder alte Laufzeit-Sitzungsbindungen zu korrigieren, die nicht durch eine
explizite Laufzeitkonfiguration festgelegt wurden.
</Note>

## Funktionsumfang von OpenClaw

| OpenAI-Funktion          | OpenClaw-Oberfläche                                                                          | Status                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Chat / Responses          | `openai/<model>`-Modell-Provider                                                               | Ja                                                             |
| Codex-Abonnementmodelle | `openai/<model>` mit OpenAI OAuth                                                            | Ja                                                             |
| Veraltete Codex-Modellreferenzen   | alte Codex-Modellreferenzen, `codex-cli/<model>`                                                     | Durch Doctor zu `openai/<model>` korrigiert                          |
| Codex-App-Server-Harness  | Codex-kompatible HTTPS-Route mit nicht festgelegter Runtime/`auto` oder explizitem `agentRuntime.id: codex`  | Ja                                                             |
| Serverseitige Websuche    | Natives OpenAI-Responses-Tool                                                                  | Ja, wenn die Websuche aktiviert und kein anderer Provider festgelegt ist |
| Bilder                    | `image_generate`                                                                              | Ja                                                             |
| Videos                    | `video_generate`                                                                              | Ja                                                             |
| Text-zu-Sprache           | `messages.tts.provider: "openai"` / `tts`                                                     | Ja                                                             |
| Batch-Sprache-zu-Text      | `tools.media.audio` / Medienverständnis                                                     | Ja                                                             |
| Streaming-Sprache-zu-Text  | Voice Call `streaming.provider: "openai"`                                                     | Ja                                                             |
| Echtzeit-Sprache            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Ja (OpenAI-Platform-API-Schlüssel)                                   |
| Embeddings                | Provider für Speicher-Embeddings                                                                     | Ja                                                             |

<Note>
OpenAI-Echtzeit-Sprache wird über die öffentliche **OpenAI Platform Realtime
API** verarbeitet und erfordert einen Platform-API-Schlüssel. Codex-OAuth-Tokens authentifizieren
stattdessen das ChatGPT-Codex-Backend; sie sind für die öffentlichen Realtime-Endpunkte
nicht mit Platform-API-Schlüsseln austauschbar.

Wenn die API-Schlüsselauthentifizierung eine fehlende Abrechnung meldet, laden Sie unter
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
Platform-Guthaben für die Organisation auf, die Ihren Realtime-Anmeldedaten zugrunde liegt,
wenn Sie die API-Schlüsselauthentifizierung verwenden. Echtzeit-Sprache akzeptiert das durch
`openclaw onboard --auth-choice openai-api-key` erstellte API-Schlüssel-Authentifizierungsprofil `openai`, einen über
`talk.realtime.providers.openai.apiKey` für Control UI Talk festgelegten Platform-API-Schlüssel oder
`plugins.entries.voice-call.config.realtime.providers.openai.apiKey` für Voice
Call oder die Umgebungsvariable `OPENAI_API_KEY`.
</Note>

## Speicher-Embeddings

OpenClaw kann OpenAI oder einen OpenAI-kompatiblen Embedding-Endpunkt für
die `memory_search`-Indizierung und Abfrage-Embeddings verwenden:

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

Legen Sie für OpenAI-kompatible Endpunkte, die asymmetrische Embedding-Bezeichnungen erfordern,
`queryInputType` und `documentInputType` unter `memorySearch` fest. OpenClaw
leitet diese als providerspezifische `input_type`-Anfragefelder weiter: Abfrage-
Embeddings verwenden `queryInputType`; indizierte Speicherabschnitte und die Batch-Indizierung verwenden
`documentInputType`. Das vollständige Beispiel finden Sie in der
[Referenz zur Speicherkonfiguration](/de/reference/memory-config#provider-specific-config).

## Erste Schritte

<Tabs>
  <Tab title="API-Schlüssel (OpenAI Platform)">
    **Optimal für:** direkten API-Zugriff und nutzungsabhängige Abrechnung.

    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen oder kopieren Sie einen API-Schlüssel aus dem [OpenAI-Platform-Dashboard](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Alternativ können Sie den Schlüssel direkt übergeben:

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

    | Modellreferenz        | Runtime-Richtlinie oder Routenmerkmale                                 | Route                     | Authentifizierung                              |
    | ---------------- | ------------------------------------------------------------- | ------------------------- | --------------------------------- |
    | `openai/gpt-5.6` | nicht festgelegt/`auto`, exakte offizielle native HTTPS-Route, keine Anfrageüberschreibung | Codex kann ausgewählt werden     | Geordnetes API-Schlüssel-Authentifizierungsprofil      |
    | `openai/gpt-5.6` | Provider/Modell `agentRuntime.id: "openclaw"`                  | Eingebettete OpenClaw-Runtime | Ausgewähltes `openai`-API-Schlüsselprofil |
    | `openai/gpt-5.5` | expliziter Provider/explizites Modell `agentRuntime.id`                     | Ausgewählte Agent-Runtime    | Ausgewähltes OpenAI-API-Schlüsselprofil   |
    | `openai/*`       | selbst definierte Completions, benutzerdefinierte Route oder Anfrageüberschreibung | Eingebettete OpenClaw-Runtime | Anmeldedatentyp bleibt unverändert |
    | `openai/*`       | offizieller Klartext-HTTP-Endpunkt                  | Abgelehnt                 | Anmeldedaten werden nicht gesendet             |

    <Note>
    Wenn die Runtime nicht festgelegt oder `auto` ist, kann nur eine geeignete exakte offizielle native HTTPS-
    Route implizit den Codex-App-Server-Harness auswählen. Erstellen Sie für die API-Schlüsselauthentifizierung
    bei einem Agent-Modell ein `openai`-API-Schlüssel-Authentifizierungsprofil und ordnen Sie es mit
    `auth.order.openai`; `OPENAI_API_KEY` bleibt der direkte Fallback für
    OpenAI-API-Oberflächen außerhalb von Agents. Führen Sie `openclaw doctor --fix` aus, um ältere
    veraltete Codex-Einträge der Authentifizierungsreihenfolge zu migrieren.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    Die einfache Direkt-API-ID `gpt-5.6` wird in die Sol-Stufe aufgelöst. Wenn diese API-
    Organisation GPT-5.6 nicht bereitstellt, legen Sie das primäre Modell explizit auf
    `openai/gpt-5.5` fest.

    Um das aktuelle Instant-Modell von ChatGPT über die OpenAI API auszuprobieren, legen Sie das Modell
    auf `openai/chat-latest` fest:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` ist ein dynamischer Alias. Eine neue Einrichtung mit OpenAI-API-Schlüssel verwendet stattdessen
    `openai/gpt-5.6`, dessen einfache Direkt-API-ID in Sol aufgelöst wird. Vorhandene
    explizite primäre Modelle, einschließlich `openai/gpt-5.5`, bleiben unverändert. Der
    Alias `chat-latest` akzeptiert nur die Textausführlichkeit `medium`; OpenClaw setzt
    jede andere angeforderte Ausführlichkeit für dieses Modell auf `medium`.

    <Warning>
    OpenClaw stellt `gpt-5.3-codex-spark` **nicht** über die direkte
    OpenAI-API-Schlüsselroute bereit. Es ist nur über Einträge im Codex-Abonnementkatalog
    verfügbar, wenn es für Ihr angemeldetes Konto bereitgestellt wird.
    </Warning>

  </Tab>

  <Tab title="Codex-Abonnement">
    **Optimal für:** die Verwendung Ihres ChatGPT-/Codex-Abonnements mit nativer Codex-
    App-Server-Ausführung anstelle eines separaten API-Schlüssels. Codex Cloud erfordert
    die Anmeldung bei ChatGPT.

    <Steps>
      <Step title="Codex OAuth ausführen">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Alternativ können Sie OAuth direkt ausführen:

        ```bash
        openclaw models auth login --provider openai
        ```

        Fügen Sie für Headless- oder Callback-unfreundliche Einrichtungen `--device-code` hinzu, um
        sich über einen ChatGPT-Gerätecode-Ablauf statt über den Browser-
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

        Senden Sie nach dem Start des Gateways `/codex status` oder `/codex models`
        im Chat, um die native App-Server-Runtime zu überprüfen.
      </Step>
    </Steps>

    ### Routenzusammenfassung

    | Modellreferenz                | Runtime-Richtlinie oder Routenmerkmale                                 | Route                                                    | Authentifizierung                                               |
    | ------------------------ | ------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.6-sol`     | nicht festgelegt/`auto`, exakte offizielle native HTTPS-Route, keine Anfrageüberschreibung | Codex kann ausgewählt werden                                    | Codex-Anmeldung oder ein geordnetes `openai`-Authentifizierungsprofil |
    | `openai/gpt-5.6-terra`   | nicht festgelegt/`auto`, exakte offizielle native HTTPS-Route, keine Anfrageüberschreibung | Codex kann ausgewählt werden                                    | Codex-Anmeldung, wenn Terra im Katalog verfügbar ist       |
    | `openai/gpt-5.6-luna`    | nicht festgelegt/`auto`, exakte offizielle native HTTPS-Route, keine Anfrageüberschreibung | Codex kann ausgewählt werden                                    | Codex-Anmeldung, wenn Luna im Katalog verfügbar ist        |
    | `openai/gpt-5.6-sol`     | Provider/Modell `agentRuntime.id: "openclaw"`                  | Eingebettete OpenClaw-Runtime, interner Codex-Authentifizierungstransport | Ausgewähltes `openai`-OAuth-Profil                    |
    | `openai/gpt-5.5`         | expliziter Provider/explizites Modell `agentRuntime.id`                     | Ausgewählte Agent-Runtime                                   | Ausgewähltes OpenAI-Authentifizierungsprofil                       |
    | `openai/*`               | selbst definierte Completions, benutzerdefinierte Route oder Anfrageüberschreibung | Eingebettete OpenClaw-Runtime                                | Anmeldedatenanforderung bleibt routenspezifisch      |
    | `openai/*`               | offizieller Klartext-HTTP-Endpunkt                  | Abgelehnt                                                 | Anmeldedaten werden nicht gesendet                              |
    | Veraltete Codex-GPT-5.5-Referenz | durch Doctor korrigiert                                            | In `openai/gpt-5.5` umgeschrieben                            | Migriertes OpenAI-OAuth-Profil                      |
    | `codex-cli/gpt-5.5`      | durch Doctor korrigiert                                            | In `openai/gpt-5.5` umgeschrieben                            | Codex-App-Server-Authentifizierung                              |

    <Warning>
    Die Einrichtung mit einem neuen Abonnement verwendet exakt `openai/gpt-5.6-sol`; der
    native Codex-Katalog kann außerdem exakte Terra- oder Luna-Referenzen bereitstellen. Wenn das
    Konto GPT-5.6 nicht bereitstellt, wählen Sie ausdrücklich `openai/gpt-5.5`. Ältere
    Codex-GPT-Referenzen sind veraltete OpenClaw-Routen und nicht der native Codex-Runtime-
    Pfad; führen Sie `openclaw doctor --fix` aus, um sie zu migrieren, ohne eine
    vorhandene explizite GPT-5.5-Auswahl zu aktualisieren. `gpt-5.3-codex-spark` bleibt auf
    Konten beschränkt, deren Codex-Abonnementkatalog es aufführt; direkte OpenAI-
    API-Schlüssel- und Azure-Referenzen dafür bleiben ausgeblendet.
    </Warning>

    <Note>
    Neue Konfigurationen sollten die Authentifizierungsreihenfolge für OpenAI-Agenten unter `auth.order.openai` ablegen;
    doctor migriert ältere veraltete Einträge der Codex-Authentifizierungsreihenfolge.
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

    Mit einem API-Schlüssel als Reserve behalten Sie das ausgewählte Modell unter `openai/*` bei und legen
    die Authentifizierungsreihenfolge unter `openai` ab. OpenClaw versucht zuerst das Abonnement und dann
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
    resultierenden Anmeldedaten in seinem eigenen Agent-Authentifizierungsspeicher.
    </Note>

    ### Codex-OAuth-Routing prüfen und wiederherstellen

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Fügen Sie für einen bestimmten Agenten `--agent <id>` hinzu:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Wenn eine ältere Konfiguration noch veraltete Codex-GPT-Referenzen oder eine veraltete OpenAI-
    Runtime-Sitzungsbindung ohne explizite Runtime-Konfiguration enthält, reparieren Sie sie:

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

    Verwenden Sie `--profile-id` für mehrere Codex-OAuth-Anmeldungen im selben Agenten und
    steuern Sie sie anschließend über die Authentifizierungsreihenfolge oder `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    Führen Sie `openclaw doctor --fix` aus, um ältere veraltete OpenAI-Codex-Präfix-
    Profil-IDs und Reihenfolgeeinträge zu migrieren, bevor Sie sich auf die Profilreihenfolge verlassen.

    ### Statusanzeige

    Chat `/status` zeigt an, welche Modell-Runtime für die aktuelle
    Sitzung aktiv ist. Das gebündelte Codex-App-Server-Harness erscheint als
    `Runtime: OpenAI Codex`, wenn eine geeignete implizite Route oder eine explizite
    Provider-/Modell-Runtime-Richtlinie es auswählt.

    ### Doctor-Warnung

    Wenn veraltete Codex-Modellreferenzen oder veraltete OpenAI-Runtime-Bindungen in der Konfiguration
    oder im Sitzungsstatus verbleiben, schreibt `openclaw doctor --fix` sie mit der
    Codex-Runtime in `openai/*` um, sofern OpenClaw nicht ausdrücklich anders konfiguriert ist.

    ### Begrenzung des Kontextfensters

    OpenClaw behandelt Modellmetadaten und die Runtime-Kontextbegrenzung als getrennte
    Werte. Für `openai/gpt-5.5` über den Codex-OAuth-Katalog:

    - Natives `contextWindow`: `400000`
    - Standardbegrenzung der Runtime für `contextTokens`: `272000`

    Die kleinere Standardbegrenzung bietet in der Praxis bessere Eigenschaften hinsichtlich
    Latenz und Qualität. Überschreiben Sie sie mit `contextTokens`:

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
    Verwenden Sie `contextWindow`, um native Modellmetadaten zu deklarieren. Verwenden Sie `contextTokens`,
    um das Runtime-Kontextbudget zu begrenzen. Die direkte OpenAI-API-Schlüsselroute
    meldet für `gpt-5.5` ein größeres natives `contextWindow` (`1000000`); die beiden
    Routen werden getrennt erfasst, da sich die vorgelagerten Kataloge unterscheiden.
    </Note>

    ### Katalogwiederherstellung

    OpenClaw verwendet vorgelagerte Codex-Katalogmetadaten für `gpt-5.5`, wenn sie
    vorhanden sind. Wenn die Live-Codex-Ermittlung die Zeile `gpt-5.5` auslässt, obwohl das Konto
    authentifiziert ist, erzeugt OpenClaw diese OAuth-Modellzeile, damit Cron-,
    Sub-Agent- und konfigurierte Standardmodell-Ausführungen nicht mit
    `Unknown model` fehlschlagen.

  </Tab>
</Tabs>

## Native Codex-App-Server-Authentifizierung

Das native Codex-App-Server-Harness verwendet `openai/*`-Modellreferenzen, wenn eine geeignete
exakte offizielle HTTPS-Route es implizit auswählt oder wenn Provider-/Modell-
`agentRuntime.id: "codex"` es explizit auswählt. Die Authentifizierung ist weiterhin
kontobasiert. OpenClaw wählt die Authentifizierung in dieser Reihenfolge aus:

1. Geordnete OpenAI-Authentifizierungsprofile für den Agenten, vorzugsweise unter
   `auth.order.openai`. Führen Sie `openclaw doctor --fix` aus, um ältere veraltete
   Codex-Authentifizierungsprofil-IDs und die Authentifizierungsreihenfolge zu migrieren.
2. Das vorhandene Konto des App-Servers, beispielsweise eine lokale ChatGPT-
   Anmeldung der Codex CLI. Für das standardmäßig isolierte Agenten-Home bindet OpenClaw dieses native
   CLI-Konto über dessen Anmelde-RPC in den App-Server ein; die
   Konfiguration, Plugins oder der Thread-Speicher der CLI werden nicht gemeinsam verwendet.
3. Nur für lokale stdio-App-Server-Starts und nur, wenn der App-Server
   kein Konto meldet: `CODEX_API_KEY`, dann `OPENAI_API_KEY`.

Eine lokale ChatGPT-/Codex-Abonnementanmeldung wird nicht ersetzt, nur weil der
Gateway-Prozess außerdem `OPENAI_API_KEY` für direkte OpenAI-Modelle oder
Einbettungen besitzt. Der Fallback auf den API-Schlüssel aus der Umgebung gilt nur für den lokalen stdio-Pfad
ohne Konto; er wird niemals über WebSocket-App-Server-Verbindungen gesendet. Wenn ein
abonnementbasiertes Codex-Profil ausgewählt ist, hält OpenClaw außerdem
`CODEX_API_KEY` und `OPENAI_API_KEY` aus dem gestarteten stdio-App-Server-Kindprozess
heraus und sendet die ausgewählten Anmeldedaten stattdessen über den Anmelde-RPC des App-Servers.

Wenn dieses Abonnementprofil durch ein Codex-Nutzungslimit blockiert wird, markiert OpenClaw
das Profil bis zu der von Codex angegebenen Rücksetzzeit als blockiert und ermöglicht der
Authentifizierungsreihenfolge den Wechsel zum nächsten `openai:*`-Profil, ohne das ausgewählte
Modell zu ändern oder das Codex-Harness zu verlassen. Nach Ablauf der Rücksetzzeit ist das
Abonnementprofil wieder auswählbar.

## Bilderzeugung

Das gebündelte Plugin `openai` registriert die Bilderzeugung über das
Tool `image_generate`. Es unterstützt sowohl die Bilderzeugung mit OpenAI-API-Schlüssel als auch mit Codex OAuth
über dieselbe Modellreferenz `openai/gpt-image-2`.

| Funktion                  | OpenAI-API-Schlüssel                | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Modellreferenz            | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Authentifizierung         | `OPENAI_API_KEY`                   | OpenAI-Codex-OAuth-Anmeldung          |
| Transport                 | OpenAI Images API                  | Codex-Responses-Backend              |
| Maximale Bilder pro Anfrage | 4                                | 4                                    |
| Bearbeitungsmodus         | Aktiviert (bis zu 5 Referenzbilder) | Aktiviert (bis zu 5 Referenzbilder) |
| Größenüberschreibungen    | Unterstützt, einschließlich 2K-/4K-Größen | Unterstützt, einschließlich 2K-/4K-Größen |
| Seitenverhältnis/Auflösung | Wird nicht an die OpenAI Images API weitergeleitet | Wird, sofern sicher, einer unterstützten Größe zugeordnet |

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
Unter [Bilderzeugung](/de/tools/image-generation) finden Sie gemeinsame Tool-Parameter,
die Provider-Auswahl und das Failover-Verhalten.
</Note>

`gpt-image-2` ist der Standard für die Text-zu-Bild-Erzeugung und Bildbearbeitung mit OpenAI.
`gpt-image-1.5`, `gpt-image-1` und `gpt-image-1-mini` können weiterhin
als explizite Modellüberschreibungen verwendet werden. Verwenden Sie `openai/gpt-image-1.5` für
PNG-/WebP-Ausgaben mit transparentem Hintergrund; die aktuelle `gpt-image-2`-API lehnt
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
`openclaw infer image edit`, wenn Sie mit einer Eingabedatei beginnen.
`--openai-background` bleibt als OpenAI-spezifischer Alias verfügbar. Verwenden Sie
`--quality low|medium|high|auto`, um Qualität und Kosten von OpenAI Images zu steuern.
Verwenden Sie `--openai-moderation low|auto`, um den Moderationshinweis von OpenAI entweder über
`image generate` oder `image edit` zu übergeben.

Behalten Sie bei ChatGPT-/Codex-OAuth-Installationen dieselbe Referenz `openai/gpt-image-2` bei. Wenn
ein OAuth-Profil `openai` konfiguriert ist, löst OpenClaw dieses gespeicherte OAuth-
Zugriffstoken auf und sendet Bildanfragen über das Codex-Responses-Backend; es
versucht nicht zuerst `OPENAI_API_KEY` und fällt nicht unbemerkt auf einen API-Schlüssel zurück.
Konfigurieren Sie `models.providers.openai` explizit mit einem API-Schlüssel, einer benutzerdefinierten Basis-
URL oder einem Azure-Endpunkt, wenn Sie stattdessen die direkte OpenAI-Images-API-Route
verwenden möchten. Wenn sich dieser benutzerdefinierte Bildendpunkt in einem vertrauenswürdigen LAN oder unter einer privaten Adresse befindet,
legen Sie außerdem `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` fest; OpenClaw
blockiert private/interne OpenAI-kompatible Bildendpunkte weiterhin, sofern diese
explizite Aktivierung nicht vorhanden ist.

Erzeugen:

```
/tool image_generate model=openai/gpt-image-2 prompt="Ein professionelles Veröffentlichungsplakat für OpenClaw unter macOS" size=3840x2160 count=1
```

Ein transparentes PNG erzeugen:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="Ein einfacher roter Kreisaufkleber auf transparentem Hintergrund" outputFormat=png background=transparent
```

Bearbeiten:

```
/tool image_generate model=openai/gpt-image-2 prompt="Die Form des Objekts beibehalten und das Material in durchscheinendes Glas ändern" image=/path/to/reference.png size=1024x1536
```

## Videoerzeugung

Das gebündelte Plugin `openai` registriert die Videoerzeugung über das
Tool `video_generate`.

| Funktion          | Wert                                                                               |
| ----------------- | ---------------------------------------------------------------------------------- |
| Standardmodell    | `openai/sora-2`                                                                    |
| Modi              | Text-zu-Video, Bild-zu-Video, Bearbeitung eines einzelnen Videos                   |
| Referenzeingaben  | 1 Bild oder 1 Video                                                                |
| Größenüberschreibungen | Unterstützt für Text-zu-Video und Bild-zu-Video                              |
| Seitenverhältnis  | Wird in die nächstgelegene unterstützte Größe umgewandelt und nicht unverändert weitergeleitet |
| Andere Überschreibungen | `resolution`, `audio`, `watermark` werden nicht unterstützt und mit einer Tool-Warnung verworfen |

OpenAI-Anfragen zur Bild-zu-Video-Generierung verwenden `POST /v1/videos` mit einem Bild
`input_reference`. Bearbeitungen einzelner Videos verwenden `POST /v1/videos/edits` mit dem
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

Der OpenAI-Provider deklariert `supportsSize`, aber nicht `supportsAspectRatio` oder
`supportsResolution`. Die gemeinsame Normalisierungsschicht von OpenClaw konvertiert ein
angefordertes `aspectRatio` in das am besten passende OpenAI-`size`, bevor die
Anfrage den Provider erreicht, sodass Anfragen zum Seitenverhältnis im Allgemeinen weiterhin funktionieren.
Für `resolution` gibt es keinen Größen-Fallback; es wird verworfen und dem Aufrufer als
`Ignored unsupported overrides for openai/<model>: resolution=<value>` angezeigt.
</Note>

## GPT-5-Prompt-Beitrag

OpenClaw fügt für Modelle der GPT-5-Familie beim Provider
`openai` einen gemeinsamen GPT-5-Prompt-Beitrag hinzu (einschließlich veralteter Codex-Referenzen vor der Reparatur, die zu
`openai/*` normalisiert werden). Andere Provider, die ebenfalls Modell-IDs der GPT-5-Familie bereitstellen,
wie OpenRouter oder opencode-Routen, erhalten dieses Overlay nicht; es ist an die
Provider-ID `openai` gebunden, nicht allein an die Modell-ID. Ältere GPT-4.x-Modelle erhalten
es nie.

Der native Codex-App-Server-Harness erhält den Persona-/Tool-
Disziplin-Verhaltensvertrag oder das Overlay für einen freundlichen Interaktionsstil nicht über
Entwickleranweisungen; natives Codex behält das Codex-eigene Verhalten für Basis, Modell und
Projektdokumentation bei, und OpenClaw deaktiviert die integrierte Persönlichkeit von Codex für
native Threads, damit die Persönlichkeitsdateien des Agent-Arbeitsbereichs maßgeblich bleiben.
OpenClaw stellt nativen Codex-Threads nur Laufzeitkontext bereit: Kanal-
zustellung, dynamische OpenClaw-Tools, ACP-Delegation, Arbeitsbereichskontext und
OpenClaw-Skills. Der Heartbeat-Anleitungstext aus demselben Beitrag ist die
einzige Ausnahme: Native Codex-Heartbeat-Durchläufe erhalten ihn als dedizierte
Anweisungen zur Zusammenarbeit statt über den gemeinsamen Hook für Prompt-Beiträge.

Der GPT-5-Beitrag fügt passenden, von OpenClaw zusammengestellten Prompts einen mit Tags versehenen Verhaltensvertrag für die
Persistenz der Persona, Ausführungssicherheit, Tool-Disziplin, Ausgabeform, Abschluss-
prüfungen und Verifizierung hinzu. Kanalspezifisches Antwort- und Verhalten bei stillen Nachrichten verbleibt im gemeinsamen OpenClaw-System-
Prompt und in der Richtlinie für ausgehende Zustellungen. Die Ebene für einen freundlichen Interaktionsstil ist
separat und konfigurierbar.

| Wert                  | Auswirkung                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (Standard) | Aktiviert die Ebene für einen freundlichen Interaktionsstil |
| `"on"`                 | Alias für `"friendly"`                      |
| `"off"`                | Deaktiviert nur die Ebene für den freundlichen Stil       |

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
Bei der Laufzeit wird die Groß-/Kleinschreibung der Werte nicht berücksichtigt, daher deaktivieren sowohl `"Off"` als auch `"off"` die
Ebene für den freundlichen Stil.
</Tip>

<Note>
Das veraltete `plugins.entries.openai.config.personality` wird weiterhin als
Kompatibilitäts-Fallback gelesen, wenn die gemeinsame Einstellung
`agents.defaults.promptOverlays.gpt5.personality` nicht gesetzt ist.
</Note>

## Stimme und Sprache

<AccordionGroup>
  <Accordion title="Sprachsynthese (TTS)">
    Das gebündelte Plugin `openai` registriert die Sprachsynthese für die
    Oberfläche `messages.tts`.

    | Einstellung      | Konfigurationspfad                                            | Standard                          |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | Modell        | `messages.tts.providers.openai.model`                  | `gpt-4o-mini-tts`                |
    | Stimme        | `messages.tts.providers.openai.speakerVoice`           | `coral`                          |
    | Geschwindigkeit        | `messages.tts.providers.openai.speed`                  | (nicht gesetzt)                          |
    | Anweisungen | `messages.tts.providers.openai.instructions`           | (nicht gesetzt, nur `gpt-4o-mini-tts`)  |
    | Format       | `messages.tts.providers.openai.responseFormat`         | `opus` für Sprachnachrichten, `mp3` für Dateien |
    | API-Schlüssel      | `messages.tts.providers.openai.apiKey`                 | Fällt auf `OPENAI_API_KEY` zurück   |
    | Basis-URL     | `messages.tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`      |
    | Zusätzlicher Body   | `messages.tts.providers.openai.extraBody` / `extra_body` | (nicht gesetzt)                        |

    Verfügbare Modelle: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Verfügbare Stimmen:
    `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`,
    `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` wird nach den von OpenClaw
    generierten Feldern mit dem JSON der `/audio/speech`-Anfrage zusammengeführt. Verwenden Sie es daher für OpenAI-kompatible Endpunkte, die
    zusätzliche Schlüssel wie `lang` erfordern. Prototyp-Schlüssel werden ignoriert.

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
    Setzen Sie `OPENAI_TTS_BASE_URL`, um die TTS-Basis-URL zu überschreiben, ohne den
    Endpunkt der Chat-API zu beeinflussen. OpenAI TTS und Realtime-Sprache werden beide
    über einen API-Schlüssel der OpenAI Platform konfiguriert; reine OAuth-Installationen können weiterhin
    Codex-gestützte Chatmodelle verwenden, aber keine Live-Sprachantworten von OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Sprache-zu-Text">
    Das gebündelte Plugin `openai` registriert die stapelweise Sprache-zu-Text-Verarbeitung über
    die Transkriptionsoberfläche für das Medienverständnis von OpenClaw.

    - Standardmodell: `gpt-4o-transcribe`
    - Endpunkt: OpenAI REST `/v1/audio/transcriptions`
    - Eingabepfad: Multipart-Upload einer Audiodatei
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

    Sprach- und Prompt-Hinweise werden an OpenAI weitergeleitet, wenn sie von der
    gemeinsamen Medienkonfiguration für Audio oder einer Transkriptionsanfrage pro Aufruf bereitgestellt werden.

  </Accordion>

  <Accordion title="Echtzeittranskription">
    Das gebündelte Plugin `openai` registriert die Echtzeittranskription für das
    Voice-Call-Plugin.

    | Einstellung          | Konfigurationspfad                                                          | Standard |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | Modell            | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Sprache         | `...openai.language`                                                 | (nicht gesetzt) |
    | Prompt           | `...openai.prompt`                                                   | (nicht gesetzt) |
    | Stilledauer | `...openai.silenceDurationMs`                                        | `800`   |
    | VAD-Schwellenwert    | `...openai.vadThreshold`                                             | `0.5`   |
    | Authentifizierung             | `...openai.apiKey`, `OPENAI_API_KEY` oder API-Schlüsselprofil `openai`    | API-Schlüssel der Platform erforderlich |

    <Note>
    Verwendet eine WebSocket-Verbindung zu `wss://api.openai.com/v1/realtime` mit
    G.711-u-law-Audio (`g711_ulaw` / `audio/pcmu`). Für ein API-Schlüsselprofil
    `openai` erstellt der Gateway vor dem Öffnen des WebSockets ein kurzlebiges
    Client-Secret für die Realtime-Transkription. Dieser Streaming-Provider dient dem Echtzeittranskriptionspfad
    von Voice Call; Discord-Sprachkanäle zeichnen derzeit kurze
    Segmente auf und verwenden stattdessen den stapelweisen Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Echtzeitstimme">
    Das gebündelte Plugin `openai` registriert die Echtzeitstimme für das Voice-Call-
    Plugin.

    | Einstellung                               | Konfigurationspfad                                                              | Standard             |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | Modell                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2.1`  |
    | Stimme                                  | `...openai.voice`                                                       | `alloy`             |
    | Temperatur (Azure-Bereitstellungsbrücke)  | `...openai.temperature`                                                 | `0.8`               |
    | VAD-Schwellenwert                          | `...openai.vadThreshold`                                                | `0.5`                |
    | Stilledauer                       | `...openai.silenceDurationMs`                                           | `500`                |
    | Präfix-Padding                         | `...openai.prefixPaddingMs`                                             | `300`                |
    | Reasoning-Aufwand                       | `...openai.reasoningEffort`                                             | (nicht gesetzt)              |
    | Authentifizierung                                   | API-Schlüsselprofil `openai`, `...openai.apiKey` oder `OPENAI_API_KEY` | API-Schlüssel der OpenAI Platform erforderlich |

    Verfügbare integrierte Realtime-Stimmen für `gpt-realtime-2.1`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI empfiehlt `marin` und `cedar` für die beste Realtime-Qualität. Dies
    ist eine separate Gruppe von den oben aufgeführten Text-zu-Sprache-Stimmen; eine reine TTS-Stimme
    wie `fable`, `nova` oder `onyx` ist für Realtime-Sitzungen nicht gültig.
    Setzen Sie das Modell ausdrücklich auf `gpt-realtime-2.1-mini`, wenn Sie die
    kleinere und kostengünstigere Realtime-2.1-Variante bevorzugen.

    <Note>
    **GPT-Live (in Kürze verfügbar).** Die Full-Duplex-Modelle `gpt-live-1` und
    `gpt-live-1-mini` von OpenAI ersetzten im Juli 2026 den ChatGPT-Sprachmodus; die
    Entwickler-API wird schrittweise für Organisationen mit Early Access eingeführt. OpenClaw
    erkennt die Modellfamilie, führt sie aber noch nicht aus: GPT-Live-Sitzungen verwenden
    ausschließlich WebRTC, steuern ihre Sprecherwechsel selbst (kein VAD) und delegieren Agent-Aufgaben
    über ein Handoff-Ereignisprotokoll, das die Realtime-Transporte von OpenClaw
    noch nicht implementieren. Die Konfiguration eines `gpt-live-*`-Modells schlägt sicher
    mit Hinweisen sowohl zur WebSocket-Brücke als auch zu Talk-Browsersitzungen fehl, anstatt
    Audio ohne Agent-Zugriff unbemerkt zu verbinden. Der API-Zugriff wird während des Early Access außerdem
    pro OpenAI-Organisation beschränkt. Behalten Sie `gpt-realtime-2.1` (den
    Standard) bei, bis die GPT-Live-Unterstützung verfügbar ist.
    </Note>

    <Note>
    Backend-Brücken für OpenAI Realtime verwenden die GA-Sitzungsstruktur für Realtime-WebSockets,
    die `session.temperature` nicht akzeptiert. Azure-OpenAI-
    Bereitstellungen bleiben über `azureEndpoint` und `azureDeployment` verfügbar und
    behalten die bereitstellungskompatible Sitzungsstruktur bei (einschließlich `temperature`).
    Unterstützt bidirektionale Tool-Aufrufe und G.711-u-law-Audio.
    </Note>

    <Note>
    Die Echtzeitstimme wird beim Erstellen der Sitzung ausgewählt. OpenAI erlaubt, die meisten
    Sitzungsfelder später zu ändern, aber die Stimme kann nicht mehr geändert werden, nachdem das
    Modell in dieser Sitzung Audio ausgegeben hat. OpenClaw stellt derzeit die
    integrierten IDs der Echtzeitstimmen als Zeichenfolgen bereit.
    </Note>

    <Note>
    Control UI Talk verwendet OpenAI-Echtzeitsitzungen im Browser mit einem vom Gateway
    ausgestellten kurzlebigen Client-Secret und einem direkten WebRTC-SDP-Austausch des Browsers
    mit der OpenAI Realtime API. Das Gateway stellt dieses Client-Secret mit den
    ausgewählten `openai`-Anmeldedaten aus. Konfigurierte Schlüssel, API-Schlüsselprofile und
    `OPENAI_API_KEY` haben Vorrang; ein `openai`-OAuth-Profil oder eine externe
    Codex-Anmeldung dient als Fallback. Gateway-Relay und Echtzeit-
    WebSocket-Bridges des Voice-Call-Backends verwenden für native OpenAI-Endpunkte
    dieselbe Reihenfolge der Anmeldedaten.
    Eine Live-Verifizierung für Maintainer ist mit
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verfügbar;
    die OpenAI-Abschnitte verifizieren sowohl die WebSocket-Bridge des Backends als auch den
    WebRTC-SDP-Austausch des Browsers, ohne Secrets zu protokollieren.
    Übergeben Sie `--openai-only`, um diese beiden Abschnitte ohne Google-Anmeldedaten auszuführen.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure-OpenAI-Endpunkte

Der gebündelte `openai`-Provider kann durch Überschreiben der Basis-URL eine Azure-OpenAI-Ressource
zur Bilderzeugung verwenden. Im Pfad zur Bilderzeugung erkennt OpenClaw
Azure-Hostnamen in `models.providers.openai.baseUrl` und wechselt automatisch zum
Anfrageformat von Azure.

<Note>
Die Echtzeitstimme verwendet einen separaten Konfigurationspfad
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
und wird nicht von `models.providers.openai.baseUrl` beeinflusst. Die Azure-
Einstellungen finden Sie im Akkordeon **Echtzeitstimme** unter [Stimme und Sprache](#voice-and-speech).
</Note>

Verwenden Sie Azure OpenAI, wenn:

- Sie bereits über ein Azure-OpenAI-Abonnement, ein Kontingent oder eine Unternehmens-
  vereinbarung verfügen
- Sie regionale Datenresidenz oder von Azure bereitgestellte Compliance-Kontrollen benötigen
- Sie den Datenverkehr innerhalb eines vorhandenen Azure-Mandanten halten möchten

### Konfiguration

Richten Sie für die Azure-Bilderzeugung über den gebündelten `openai`-Provider
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

OpenClaw erkennt diese Azure-Hostsuffixe für die Azure-Bilderzeugungs-
route:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Bei Bilderzeugungsanfragen an einen erkannten Azure-Host führt OpenClaw Folgendes aus:

- Sendet den Header `api-key` anstelle von `Authorization: Bearer`
- Verwendet bereitstellungsspezifische Pfade (`/openai/deployments/{deployment}/...`)
- Fügt jeder Anfrage `?api-version=...` hinzu
- Verwendet für Azure-Bilderzeugungsaufrufe ein standardmäßiges Anfrage-Timeout von 600s.
  Aufrufspezifische `timeoutMs`-Werte überschreiben diesen Standard weiterhin.

Andere Basis-URLs (öffentliches OpenAI, OpenAI-kompatible Proxys) behalten das standardmäßige
OpenAI-Anfrageformat für Bilder bei.

<Note>
Das Azure-Routing für den Bilderzeugungspfad des `openai`-Providers erfordert
OpenClaw 2026.4.22 oder neuer. Frühere Versionen behandeln jede benutzerdefinierte
`openai.baseUrl` wie den öffentlichen OpenAI-Endpunkt und schlagen bei Azure-Bild-
bereitstellungen fehl.
</Note>

### API-Version

Setzen Sie `AZURE_OPENAI_API_VERSION`, um für den Azure-Bilderzeugungspfad eine bestimmte Azure-Preview- oder GA-Version
festzulegen:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Wenn die Variable nicht gesetzt ist, lautet der Standardwert `2024-12-01-preview`.

### Modellnamen sind Bereitstellungsnamen

Azure OpenAI bindet Modelle an Bereitstellungen. Bei Azure-Bilderzeugungsanfragen,
die über den gebündelten `openai`-Provider geleitet werden, muss das Feld `model` in OpenClaw
dem **Azure-Bereitstellungsnamen** entsprechen, den Sie im Azure-Portal konfiguriert haben, und nicht
der öffentlichen OpenAI-Modell-ID.

Wenn Sie eine Bereitstellung namens `gpt-image-2-prod` erstellen, die `gpt-image-2` bereitstellt:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Ein übersichtliches Poster" size=1024x1024 count=1
```

Dieselbe Regel für Bereitstellungsnamen gilt für jeden Bilderzeugungsaufruf, der
über den gebündelten `openai`-Provider geleitet wird.

### Regionale Verfügbarkeit

Die Azure-Bilderzeugung ist derzeit nur in einer Teilmenge der Regionen verfügbar
(zum Beispiel `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Prüfen Sie vor dem Erstellen einer Bereitstellung die aktuelle Regionsliste von Microsoft
und vergewissern Sie sich, dass das jeweilige Modell in Ihrer Region angeboten wird.

### Parameterunterschiede

Azure OpenAI und das öffentliche OpenAI akzeptieren nicht immer dieselben Bildparameter.
Azure lehnt möglicherweise Optionen ab, die das öffentliche OpenAI zulässt (zum Beispiel bestimmte
`background`-Werte bei `gpt-image-2`), oder stellt sie nur in bestimmten Modell-
versionen bereit. Diese Unterschiede ergeben sich aus Azure und dem zugrunde liegenden Modell, nicht aus
OpenClaw. Wenn eine Azure-Anfrage mit einem Validierungsfehler fehlschlägt, prüfen Sie im
Azure-Portal den Parametersatz, den Ihre jeweilige Bereitstellung und API-Version unterstützen.

<Note>
Azure OpenAI verwendet nativen Transport und Kompatibilitätsverhalten, erhält jedoch nicht
die ausgeblendeten Attributionsheader von OpenClaw – siehe das Akkordeon **Native und OpenAI-kompatible
Routen** unter [Erweiterte Konfiguration](#advanced-configuration).

Verwenden Sie für Chat- oder Responses-Datenverkehr über Azure (über die Bilderzeugung hinaus) den
Onboarding-Ablauf oder eine dedizierte Azure-Providerkonfiguration; `openai.baseUrl` allein
übernimmt nicht das API-/Authentifizierungsformat von Azure. Es gibt einen separaten
`azure-openai-responses/*`-Provider; siehe das Akkordeon zur serverseitigen Compaction
weiter unten.
</Note>

## Erweiterte Konfiguration

Die nachstehenden Beispiele für `params` je Modell formen die eingebettete Provider-
anfrage von OpenClaw. Ihre Konfiguration stellt ein ausdrücklich festgelegtes Anfrageverhalten dar, sodass eine ansonsten geeignete
`auto`-Route bei OpenClaw verbleibt, statt Codex implizit auszuwählen. Das native
Codex-App-Server-Harness verwaltet seinen eigenen Transport und seine eigenen Anfrageeinstellungen; explizites
`agentRuntime.id: "codex"` schlägt kontrolliert fehl, wenn die effektive Route nicht als
Codex-kompatibel deklariert ist.

<AccordionGroup>
  <Accordion title="Transport (WebSocket oder SSE)">
    OpenClaw verwendet für `openai/*` vorrangig WebSocket mit SSE als Fallback (`"auto"`).

    Im Modus `"auto"` führt OpenClaw Folgendes aus:
    - Wiederholt einen frühzeitigen WebSocket-Fehler einmal, bevor auf SSE zurückgegriffen wird
    - Markiert WebSocket nach einem Fehler für 60 Sekunden als beeinträchtigt und verwendet
      während der Abkühlphase SSE
    - Fügt stabile Header für Sitzungs- und Turn-Identität für Wiederholungsversuche und
      erneute Verbindungen hinzu
    - Normalisiert Nutzungszähler (`input_tokens` / `prompt_tokens`) über
      Transportvarianten hinweg

    | Wert                | Verhalten                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"` (Standard)   | Zuerst WebSocket, SSE als Fallback     |
    | `"sse"`              | Nur SSE erzwingen                    |
    | `"websocket"`        | Nur WebSocket erzwingen              |

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

    Wenn er aktiviert ist, ordnet OpenClaw den Schnellmodus der priorisierten Verarbeitung von OpenAI
    (`service_tier = "priority"`) zu. Vorhandene `service_tier`-Werte werden
    beibehalten, und der Schnellmodus schreibt weder `reasoning` noch
    `text.verbosity` um. `fastMode: "auto"` startet neue Modellaufrufe bis zum
    automatischen Grenzwert im Schnellmodus und startet spätere Wiederholungs-, Fallback-, Werkzeugergebnis- oder
    Fortsetzungsaufrufe anschließend ohne Schnellmodus. Der Grenzwert beträgt standardmäßig 60 Sekunden;
    setzen Sie `params.fastAutoOnSeconds` für das aktive Modell, um ihn zu ändern.

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
    Sessions UI löschen, wird für die Sitzung wieder der konfigurierte Standard verwendet.
    </Note>

  </Accordion>

  <Accordion title="Priorisierte Verarbeitung (service_tier)">
    Die API von OpenAI stellt priorisierte Verarbeitung über `service_tier` bereit. Legen Sie sie in OpenClaw
    pro Modell fest:

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

    - Erzwingt `store: true` (sofern die Modellkompatibilität nicht `supportsStore: false` setzt)
    - Fügt `context_management: [{ type: "compaction", compact_threshold: ... }]` ein
    - Standardwert für `compact_threshold`: 70% von `contextWindow` (oder `80000`, wenn
      nicht verfügbar)

    Dies gilt für den integrierten OpenClaw-Laufzeitpfad und für Hooks des OpenAI-Providers,
    die bei eingebetteten Ausführungen verwendet werden. Das native Codex-App-Server-Harness verwaltet
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
    nicht `supportsStore: false` setzt.
    </Note>

  </Accordion>

  <Accordion title="Strikter agentischer GPT-Modus">
    Für GPT-5-Familienmodelle des `openai`-Providers, die über die eingebettete
    Laufzeit von OpenClaw ausgeführt werden, verwendet OpenClaw bereits standardmäßig einen strengeren Ausführungsvertrag namens
    `strict-agentic`. Er wird automatisch aktiviert, wenn der aufgelöste Provider
    `openai` ist und die Modell-ID der GPT-5-Familie entspricht, sofern die Konfiguration
    dies nicht ausdrücklich deaktiviert:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    Das explizite Festlegen von `"strict-agentic"` hat in einem unterstützten Ausführungspfad keine Wirkung (es
    ist bereits die Standardeinstellung) und bleibt bei nicht unterstützten Provider-/Modellpaaren wirkungslos.

    Wenn `strict-agentic` aktiv ist, führt OpenClaw Folgendes aus:
    - Aktiviert `update_plan` bei umfangreichen Aufgaben automatisch
    - Wiederholt strukturell leere oder ausschließlich schlussfolgernde Durchläufe mit einer Fortsetzung,
      die eine sichtbare Antwort erzeugt
    - Verwendet explizite Planereignisse des Harness, wenn das ausgewählte Harness
      diese bereitstellt

    OpenClaw klassifiziert den Text des Assistenten nicht, um zu entscheiden, ob es sich bei einem Durchlauf um einen
    Plan, eine Fortschrittsmeldung oder eine endgültige Antwort handelt.

    <Note>
    Dieser Vertrag ist vollständig im eingebetteten Agent-Runner von OpenClaw implementiert. Er gilt
    nicht für das native App-Server-Harness von Codex, das sein eigenes
    Durchlauf- und Planverhalten verwaltet; bei nativen Codex-Ausführungen ist die Auswahl des Harness
    wichtiger als die Einstellung des Ausführungsvertrags.
    </Note>

  </Accordion>

  <Accordion title="Native und OpenAI-kompatible Routen">
    OpenClaw behandelt direkte Endpunkte von OpenAI, Codex und Azure OpenAI
    anders als generische OpenAI-kompatible `/v1`-Proxys:

    **Native Routen** (`openai/*`, Azure OpenAI):
    - Behält `reasoning: { effort: "none" }` nur für Modelle bei, die den
      OpenAI-Aufwand `none` unterstützen
    - Lässt deaktiviertes Schlussfolgern bei Modellen oder Proxys weg, die
      `reasoning.effort: "none"` ablehnen
    - Verwendet standardmäßig den strikten Modus für Tool-Schemas
    - Fügt verborgene Attributionsheader nur bei verifizierten nativen Hosts hinzu (Azure
      OpenAI erhält diese Header nicht, obwohl es sich um eine native Route handelt)
    - Behält OpenAI-spezifische Anfrageanpassungen bei (`service_tier`, `store`,
      Schlussfolgerungskompatibilität, Hinweise für den Prompt-Cache)

    **Proxy-/kompatible Routen:**
    - Verwendet weniger striktes Kompatibilitätsverhalten
    - Entfernt Completions-`store` aus nicht nativen `openai-completions`-Payloads
    - Akzeptiert erweitertes `params.extra_body`-/`params.extraBody`-JSON zur unveränderten Weitergabe
      für OpenAI-kompatible Completions-Proxys
    - Akzeptiert `params.chat_template_kwargs` für OpenAI-kompatible Completions-
      Proxys wie vLLM
    - Erzwingt weder strikte Tool-Schemas noch ausschließlich nativen Routen vorbehaltene Header

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter für Bild-Tools und Providerauswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter für Video-Tools und Providerauswahl.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Details zur Authentifizierung und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
