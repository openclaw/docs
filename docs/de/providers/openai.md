---
read_when:
    - Sie möchten OpenAI-Modelle in OpenClaw verwenden
    - Sie möchten die Codex-Abonnementauthentifizierung anstelle von API-Schlüsseln verwenden
    - Sie benötigen ein strikteres Ausführungsverhalten für GPT-5-Agenten
summary: OpenAI über API-Schlüssel oder ein Codex-Abonnement in OpenClaw verwenden
title: OpenAI
x-i18n:
    generated_at: "2026-07-12T15:44:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bc433abdf4fb8984430054acecdda3ba01b9795ad52cc89b19e10b09c6bcc8c3
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw verwendet eine einzige Provider-ID, `openai`, sowohl für die direkte Authentifizierung per API-Schlüssel als auch für die Authentifizierung über ein ChatGPT/Codex-Abonnement. `openai/*` ist die kanonische Modellroute.
Bei eingebetteten Agent-Durchläufen, für die keine Laufzeitrichtlinie festgelegt ist oder diese auf `auto` steht, entscheiden die Routeneigenschaften von OpenAI, ob OpenClaw implizit die gebündelte Codex-App-Server-Laufzeit auswählen darf. Das Präfix `openai/*` allein wählt keine Laufzeit aus.

- **Agent-Modelle** - `openai/*` über die Laufzeit, die durch eine explizite
  `agentRuntime`-Konfiguration oder die implizite Routenrichtlinie von OpenAI ausgewählt wird. Melden Sie sich für die Nutzung eines ChatGPT/Codex-Abonnements mit der Codex-Authentifizierung an oder konfigurieren Sie ein Authentifizierungsprofil mit API-Schlüssel, wenn Sie eine schlüsselbasierte Abrechnung wünschen.
- **OpenAI-APIs ohne Agent** - direkter Zugriff auf die OpenAI Platform mit nutzungsbasierter Abrechnung über `OPENAI_API_KEY` oder ein `openai`-Authentifizierungsprofil mit API-Schlüssel.
- **Veraltete Konfiguration** - alte Codex-Modellreferenzen und Profil-IDs werden durch `openclaw doctor --fix` auf `openai/*` korrigiert.

OpenAI unterstützt ausdrücklich die Verwendung von Abonnement-OAuth in externen Tools und Workflows wie OpenClaw.

## Nutzungs- und Kostenverfolgung

OpenClaw behandelt das Abonnementkontingent und die Abrechnung der Platform-API getrennt:

- ChatGPT/Codex OAuth zeigt den Abonnementtarif, die Kontingentzeiträume und das Guthaben an.
- `OPENAI_ADMIN_KEY` zeigt in der Control UI unter **Usage** die vom Provider gemeldeten Organisationskosten und die Completions-Nutzung der letzten 30 Tage an, einschließlich täglicher Ausgaben, Gesamtzahlen für Anfragen und Token, meistgenutzter Modelle und Kostenkategorien.
- `OPENAI_PROJECT_ID` beschränkt den Verlauf der Admin API optional auf ein einzelnes Projekt.
- OpenClaw sendet niemals `OPENAI_API_KEY` oder ein `openai`-Inferenzprofil an Organisations-APIs; diese Anmeldedaten können zu benutzerdefinierten, Azure- oder agentenlokalen Endpunkten gehören.

Ein expliziter Admin-Schlüssel hat Vorrang vor OAuth. Der vom Provider gemeldete Verlauf wird nicht mit den aus OpenClaw-Sitzungen abgeleiteten geschätzten Kosten zusammengeführt; er kann API-Aktivitäten anderer Clients und anbieterseitige Abrechnungsanpassungen enthalten.

Die Dokumentation zum [API Usage Dashboard](https://help.openai.com/en/articles/10478918) von OpenAI beschreibt die Anforderungen an Organisationsinhaber und die ausdrückliche Usage-Dashboard-Berechtigung für Nutzungsdaten.

Provider, Modell, Laufzeit und Kanal sind separate Ebenen. Wenn diese Bezeichnungen
miteinander vermischt werden, lesen Sie [Agent-Laufzeiten](/de/concepts/agent-runtimes), bevor Sie die Konfiguration ändern.

## Schnellauswahl

| Ziel                                              | Verwenden                                                           | Hinweise                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| ChatGPT/Codex-Abonnement, native Codex-Laufzeit  | `openai/gpt-5.6-sol`                                               | Neue Abonnementeinrichtung; melden Sie sich mit der Codex-Authentifizierung an.                  |
| Direkte Abrechnung per API-Schlüssel für Agent-Durchläufe            | `openai/gpt-5.6` plus ein geordnetes Authentifizierungsprofil mit API-Schlüssel              | Neue Einrichtung per API-Schlüssel; die unqualifizierte direkte API-ID wird zu Sol aufgelöst.        |
| Eine genaue GPT-5.6-Stufe auswählen                      | `openai/gpt-5.6-sol`, `-terra` oder `-luna`                         | Prüfen Sie mit `models list`, welche Stufen für dieses Konto verfügbar sind.        |
| Konto ohne Zugriff auf GPT-5.6                    | `openai/gpt-5.5`                                                   | Explizite Wiederherstellungsoption; OpenClaw führt kein stilles Downgrade durch.     |
| Direkte Abrechnung per API-Schlüssel, explizite OpenClaw-Laufzeit | `openai/gpt-5.6` plus Provider/Modell `agentRuntime.id: "openclaw"` | Wählen Sie ein normales `openai`-Profil mit API-Schlüssel aus.                           |
| Neuester ChatGPT-Instant-Modellalias                | `openai/chat-latest`                                               | Nur direkter API-Schlüssel; dynamischer Alias, nicht der stabile Standardwert.          |
| Bilderzeugung oder -bearbeitung                       | `openai/gpt-image-2`                                               | Funktioniert mit `OPENAI_API_KEY` oder Codex OAuth.                         |
| Bilder mit transparentem Hintergrund                     | `openai/gpt-image-1.5`                                             | Setzen Sie `outputFormat` auf `png` oder `webp` und `background=transparent`. |

## Namenszuordnung

| Angezeigter Name                            | Ebene             | Bedeutung                                                                                  |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | Provider-Präfix   | Kanonische OpenAI-Modellroute; die Routeneigenschaften bestimmen die implizite Laufzeit.                |
| `codex`-Plugin                          | Plugin            | Gebündeltes Plugin, das die native Codex-App-Server-Laufzeit und die `/codex`-Chat-Steuerung bereitstellt. |
| Provider/Modell `agentRuntime.id: codex` | Agent-Laufzeit     | Erzwingt das native Codex-App-Server-Ausführungssystem für passende eingebettete Durchläufe.                   |
| `/codex ...`                            | Chat-Befehlssatz  | Bindet und steuert Codex-App-Server-Threads aus einer Unterhaltung heraus.                               |
| `runtime: "acp", agentId: "codex"`      | ACP-Sitzungsroute | Expliziter Ausweichpfad, der Codex über ACP/acpx ausführt.                                 |

## Implizite Agent-Laufzeit

Wenn die Provider/Modell-Richtlinie `agentRuntime` nicht festgelegt ist oder auf `auto` steht, wählt die Provider-eigene Routenrichtlinie von OpenAI die implizite Laufzeit anhand des effektiven Endpunkts und Adapters aus:

| Effektive Routeneigenschaften                                                                                                                                                  | Implizite Laufzeit      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Exakter offizieller Platform-HTTPS-Endpunkt mit `openai-responses` oder exakter offizieller ChatGPT-HTTPS-Endpunkt mit `openai-chatgpt-responses`; keine explizit konfigurierte Anfrageüberschreibung | Codex kann ausgewählt werden |
| Explizit konfigurierter `openai-completions`-Adapter                                                                                                                                  | OpenClaw              |
| Benutzerdefinierter Endpunkt                                                                                                                                                        | OpenClaw              |
| Expliziter exakter offizieller Endpunkt über HTTP                                                                                                                            | Abgelehnt              |
| Route mit einer explizit konfigurierten Provider/Modell-Anfrageüberschreibung                                                                                                                 | OpenClaw              |

Eine explizite, vom Standard abweichende Provider/Modell-Einstellung für `agentRuntime.id` bleibt maßgeblich.
Beispielsweise behält `agentRuntime.id: "openclaw"` eine ansonsten für Codex geeignete Route auf OpenClaw bei, während `agentRuntime.id: "codex"` Codex erfordert und die Ausführung sicher abbricht, wenn die effektive Route nicht als Codex-kompatibel deklariert ist.
Die Auswahl der Laufzeit ändert weder den Anmeldedatentyp noch die Abrechnung: Die Authentifizierung per Platform-API-Schlüssel und die Authentifizierung über ein ChatGPT/Codex-Abonnement bleiben getrennt.

`openclaw doctor --fix` migriert veraltete Codex-Modellreferenzen, veraltete Codex-Authentifizierungsprofil-IDs und veraltete Codex-Einträge für die Authentifizierungsreihenfolge zur kanonischen `openai`-Route. Verwenden Sie `auth.order.openai` für neue Konfigurationen der Authentifizierungsreihenfolge.

<Note>
Bei einer neuen OpenAI-Einrichtung wird GPT-5.6 nur dann als primäres Modell festgelegt, wenn noch kein primäres Modell konfiguriert ist. Beim Hinzufügen oder Aktualisieren der OpenAI-Authentifizierung bleibt eine vorhandene explizite Auswahl einschließlich `openai/gpt-5.5` erhalten, sofern Sie nicht ausdrücklich `models auth login --set-default` oder `models set` verwenden. Verwenden Sie ein Authentifizierungsprofil mit API-Schlüssel nur, wenn Sie für ein Agent-Modell eine Authentifizierung per API-Schlüssel wünschen.
</Note>

## Eingeschränkte Vorschau von GPT-5.6

OpenClaw erkennt die exakten Modell-IDs `openai/gpt-5.6-sol`,
`openai/gpt-5.6-terra` und `openai/gpt-5.6-luna`. Alle drei bieten im aktuellen Katalog die Reasoning-Stufen `xhigh` und `max`. OpenAI beschreibt Sol als Spitzenstufe, Terra als ausgewogene Stufe und Luna als schnelle, kostengünstigere Stufe. Weitere Informationen finden Sie in der
[Ankündigung zur Einführung von GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/)
und im [Zugriffsleitfaden](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

Bei direkter OpenAI-Authentifizierung per API-Schlüssel ist die unqualifizierte ID `openai/gpt-5.6` ein Alias für Sol und der Standardwert für neue Einrichtungen. Der native Codex-Katalog wendet diesen direkten API-Alias nicht clientseitig an; abhängig vom Workspace-Zugriff kann er die exakten Sol-, Terra- und Luna-IDs anzeigen. Eine neue ChatGPT/Codex-OAuth-Einrichtung verwendet daher `openai/gpt-5.6-sol`. Prüfen Sie das aktuelle Konto mit:

```bash
openclaw models list --provider openai
```

Der Zugriff der API-Organisation und des Codex-Workspace kann unterschiedlich sein. Wenn GPT-5.6 nicht verfügbar ist, wählen Sie GPT-5.5 explizit aus:

```bash
openclaw models set openai/gpt-5.5
```

OpenClaw zeigt den vorgelagerten Zugriffsfehler an und ersetzt eine GPT-5.6-Auswahl nicht stillschweigend durch GPT-5.5.

<Note>
Geeignete exakte offizielle HTTPS-Routen können das gebündelte Codex-App-Server-Plugin auswählen, wenn die Laufzeitrichtlinie nicht festgelegt ist oder auf `auto` steht; explizit konfigurierte Completions-Routen, benutzerdefinierte Endpunkte und Überschreibungen des Anfragetransports verbleiben auf OpenClaw. Unverschlüsselte offizielle HTTP-Endpunkte werden abgelehnt. Eine explizite Provider/Modell-Laufzeitkonfiguration bleibt maßgeblich. Führen Sie `openclaw doctor --fix` aus, um veraltete Codex-Modellreferenzen, `codex-cli/*`-Referenzen oder alte Laufzeit-Sitzungsbindungen zu korrigieren, die nicht durch eine explizite Laufzeitkonfiguration festgelegt wurden.
</Note>

## Funktionsumfang von OpenClaw

| OpenAI-Funktion                         | OpenClaw-Oberfläche                                                                          | Status                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Chat / Responses                        | Modell-Provider `openai/<model>`                                                              | Ja                                                                        |
| Codex-Abonnementmodelle                 | `openai/<model>` mit OpenAI OAuth                                                             | Ja                                                                        |
| Veraltete Codex-Modellreferenzen        | alte Codex-Modellreferenzen, `codex-cli/<model>`                                               | Werden von doctor zu `openai/<model>` korrigiert                          |
| Codex-App-Server-Harness                | Codex-kompatible HTTPS-Route mit nicht gesetzter Runtime/`auto` oder explizitem `agentRuntime.id: codex` | Ja                                                             |
| Serverseitige Websuche                  | Natives OpenAI-Responses-Tool                                                                 | Ja, wenn die Websuche aktiviert und kein anderer Provider festgelegt ist |
| Bilder                                  | `image_generate`                                                                              | Ja                                                                        |
| Videos                                  | `video_generate`                                                                              | Ja                                                                        |
| Text-zu-Sprache                         | `messages.tts.provider: "openai"` / `tts`                                                      | Ja                                                                        |
| Batch-Sprache-zu-Text                   | `tools.media.audio` / Medienverständnis                                                       | Ja                                                                        |
| Streaming-Sprache-zu-Text               | Voice Call `streaming.provider: "openai"`                                                      | Ja                                                                        |
| Echtzeitsprachkommunikation             | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Ja (OpenAI-Platform-API-Schlüssel)                                        |
| Einbettungen                            | Provider für Speichereinbettungen                                                             | Ja                                                                        |

<Note>
Die OpenAI-Echtzeitsprachkommunikation läuft über die öffentliche **OpenAI Platform Realtime
API** und erfordert einen Platform-API-Schlüssel. Codex-OAuth-Token authentifizieren
stattdessen das ChatGPT-Codex-Backend; sie sind nicht mit Platform-API-
Schlüsseln für die öffentlichen Realtime-Endpunkte austauschbar.

Wenn die API-Schlüssel-Authentifizierung eine fehlende Abrechnung meldet, laden Sie unter
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
Platform-Guthaben für die Organisation auf, zu der Ihre Realtime-Anmeldedaten gehören,
wenn Sie die API-Schlüssel-Authentifizierung verwenden. Die Echtzeitsprachkommunikation akzeptiert das
`openai`-API-Schlüssel-Authentifizierungsprofil, das mit
`openclaw onboard --auth-choice openai-api-key` erstellt wurde, einen über
`talk.realtime.providers.openai.apiKey` für Control UI Talk festgelegten Platform-API-Schlüssel oder
`plugins.entries.voice-call.config.realtime.providers.openai.apiKey` für Voice
Call oder die Umgebungsvariable `OPENAI_API_KEY`.
</Note>

## Speichereinbettungen

OpenClaw kann OpenAI oder einen OpenAI-kompatiblen Einbettungsendpunkt für die
`memory_search`-Indizierung und Abfrageeinbettungen verwenden:

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

Legen Sie für OpenAI-kompatible Endpunkte, die asymmetrische Einbettungsbezeichnungen erfordern,
`queryInputType` und `documentInputType` unter `memorySearch` fest. OpenClaw
leitet diese als providerspezifische `input_type`-Anfragefelder weiter: Abfrageeinbettungen
verwenden `queryInputType`; indizierte Speicherabschnitte und die Batch-Indizierung verwenden
`documentInputType`. Das vollständige Beispiel finden Sie in der
[Referenz zur Speicherkonfiguration](/de/reference/memory-config#provider-specific-config).

## Erste Schritte

<Tabs>
  <Tab title="API-Schlüssel (OpenAI Platform)">
    **Am besten geeignet für:** direkten API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen oder kopieren Sie einen API-Schlüssel im [OpenAI Platform dashboard](https://platform.openai.com/api-keys).
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

    | Modellreferenz   | Runtime-Richtlinie oder Routenfakten                              | Route                       | Authentifizierung                    |
    | ---------------- | ----------------------------------------------------------------- | --------------------------- | ------------------------------------ |
    | `openai/gpt-5.6` | nicht gesetzt/`auto`, exakte offizielle native HTTPS-Route, keine Anfrageüberschreibung | Codex kann ausgewählt werden | Geordnetes API-Schlüssel-Authentifizierungsprofil |
    | `openai/gpt-5.6` | Provider/Modell `agentRuntime.id: "openclaw"`                     | Eingebettete OpenClaw-Runtime | Ausgewähltes `openai`-API-Schlüsselprofil |
    | `openai/gpt-5.5` | explizite Provider-/Modell-`agentRuntime.id`                      | Ausgewählte Agent-Runtime     | Ausgewähltes OpenAI-API-Schlüsselprofil |
    | `openai/*`       | vorgegebene Completions, benutzerdefiniert oder Anfrageüberschreibung | Eingebettete OpenClaw-Runtime | Anmeldedatentyp bleibt unverändert |
    | `openai/*`       | offizieller Klartext-HTTP-Endpunkt                                | Abgelehnt                     | Anmeldedaten werden nicht gesendet |

    <Note>
    Bei nicht gesetzter Runtime oder `auto` kann nur eine geeignete, exakte offizielle native
    HTTPS-Route implizit den Codex-App-Server-Harness auswählen. Erstellen Sie für die
    API-Schlüssel-Authentifizierung bei einem Agent-Modell ein `openai`-API-Schlüssel-
    Authentifizierungsprofil und ordnen Sie es mit `auth.order.openai`; `OPENAI_API_KEY`
    bleibt der direkte Fallback für OpenAI-API-Oberflächen außerhalb von Agents. Führen Sie
    `openclaw doctor --fix` aus, um ältere veraltete Codex-Einträge der Authentifizierungsreihenfolge
    zu migrieren.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    Die reine Direct-API-ID `gpt-5.6` wird der Sol-Stufe zugeordnet. Wenn diese API-
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

    `chat-latest` ist ein dynamischer Alias. Eine neue Einrichtung mit OpenAI-API-Schlüssel verwendet
    stattdessen `openai/gpt-5.6`, dessen reine Direct-API-ID der Sol-Stufe zugeordnet wird. Bestehende
    explizite primäre Modelle, einschließlich `openai/gpt-5.5`, bleiben unverändert. Der
    Alias `chat-latest` akzeptiert nur die Textausführlichkeit `medium`; OpenClaw erzwingt
    für dieses Modell bei jeder anderen angeforderten Ausführlichkeit `medium`.

    <Warning>
    OpenClaw stellt `gpt-5.3-codex-spark` **nicht** über die direkte Route mit OpenAI-
    API-Schlüssel bereit. Es ist nur über Einträge im Codex-Abonnementkatalog
    verfügbar, wenn Ihr angemeldetes Konto es bereitstellt.
    </Warning>

  </Tab>

  <Tab title="Codex-Abonnement">
    **Am besten geeignet für:** die Verwendung Ihres ChatGPT-/Codex-Abonnements mit nativer Codex-
    App-Server-Ausführung anstelle eines separaten API-Schlüssels. Codex Cloud erfordert
    eine ChatGPT-Anmeldung.

    <Steps>
      <Step title="Codex OAuth ausführen">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Oder führen Sie OAuth direkt aus:

        ```bash
        openclaw models auth login --provider openai
        ```

        Fügen Sie für Headless-Umgebungen oder Umgebungen, die Callbacks verhindern, `--device-code` hinzu, um
        sich mit einem ChatGPT-Gerätecode-Ablauf anstelle des Browser-
        Callbacks über localhost anzumelden:

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

    | Modellreferenz           | Runtime-Richtlinie oder Routenfakten                              | Route                                                      | Authentifizierung                                      |
    | ------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
    | `openai/gpt-5.6-sol`     | nicht gesetzt/`auto`, exakte offizielle native HTTPS-Route, keine Anfrageüberschreibung | Codex kann ausgewählt werden                               | Codex-Anmeldung oder ein geordnetes `openai`-Authentifizierungsprofil |
    | `openai/gpt-5.6-terra`   | nicht gesetzt/`auto`, exakte offizielle native HTTPS-Route, keine Anfrageüberschreibung | Codex kann ausgewählt werden                               | Codex-Anmeldung, wenn der Katalog Terra bereitstellt   |
    | `openai/gpt-5.6-luna`    | nicht gesetzt/`auto`, exakte offizielle native HTTPS-Route, keine Anfrageüberschreibung | Codex kann ausgewählt werden                               | Codex-Anmeldung, wenn der Katalog Luna bereitstellt    |
    | `openai/gpt-5.6-sol`     | Provider/Modell `agentRuntime.id: "openclaw"`                     | Eingebettete OpenClaw-Runtime, interner Codex-Authentifizierungstransport | Ausgewähltes `openai`-OAuth-Profil |
    | `openai/gpt-5.5`         | explizite Provider-/Modell-`agentRuntime.id`                      | Ausgewählte Agent-Runtime                                  | Ausgewähltes OpenAI-Authentifizierungsprofil           |
    | `openai/*`               | vorgegebene Completions, benutzerdefiniert oder Anfrageüberschreibung | Eingebettete OpenClaw-Runtime                              | Anmeldedatenanforderung bleibt routenspezifisch         |
    | `openai/*`               | offizieller Klartext-HTTP-Endpunkt                                | Abgelehnt                                                   | Anmeldedaten werden nicht gesendet                      |
    | Veraltete Codex-GPT-5.5-Referenz | von doctor korrigiert                                      | Umgeschrieben zu `openai/gpt-5.5`                          | Migriertes OpenAI-OAuth-Profil                          |
    | `codex-cli/gpt-5.5`      | von doctor korrigiert                                             | Umgeschrieben zu `openai/gpt-5.5`                          | Codex-App-Server-Authentifizierung                      |

    <Warning>
    Bei einer neuen, abonnementbasierten Einrichtung wird exakt `openai/gpt-5.6-sol` verwendet; der
    native Codex-Katalog kann außerdem exakte Terra- oder Luna-Referenzen bereitstellen. Wenn das
    Konto GPT-5.6 nicht bereitstellt, wählen Sie ausdrücklich `openai/gpt-5.5` aus. Ältere
    Codex-GPT-Referenzen sind veraltete OpenClaw-Routen und nicht der native Codex-Laufzeitpfad;
    führen Sie `openclaw doctor --fix` aus, um sie zu migrieren, ohne eine
    bestehende explizite GPT-5.5-Auswahl zu aktualisieren. `gpt-5.3-codex-spark` bleibt auf
    Konten beschränkt, deren Codex-Abonnementkatalog es aufführt; direkte OpenAI-
    API-Schlüssel- und Azure-Referenzen dafür bleiben unterdrückt.
    </Warning>

    <Note>
    Neue Konfigurationen sollten die Reihenfolge der OpenAI-Agent-Authentifizierung unter `auth.order.openai`
    ablegen; Doctor migriert ältere veraltete Einträge für die Codex-Authentifizierungsreihenfolge.
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

    Behalten Sie bei einer Absicherung durch einen API-Schlüssel das ausgewählte Modell unter `openai/*` und legen Sie
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
    Laufzeitsitzungsbindung ohne explizite Laufzeitkonfiguration enthält, reparieren Sie sie:

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

    Führen Sie `openclaw doctor --fix` aus, um ältere veraltete OpenAI-Codex-Präfix-
    Profil-IDs und Reihenfolgeeinträge zu migrieren, bevor Sie sich auf die Profilreihenfolge verlassen.

    ### Statusanzeige

    `/status` im Chat zeigt, welche Modelllaufzeit für die aktuelle
    Sitzung aktiv ist. Das gebündelte Codex-App-Server-Harness wird als
    `Runtime: OpenAI Codex` angezeigt, wenn eine geeignete implizite Route oder eine explizite
    Provider-/Modell-Laufzeitrichtlinie es auswählt.

    ### Doctor-Warnung

    Wenn veraltete Codex-Modellreferenzen oder überholte OpenAI-Laufzeitbindungen in der Konfiguration
    oder im Sitzungszustand verbleiben, schreibt `openclaw doctor --fix` sie mit
    der Codex-Laufzeit in `openai/*` um, sofern OpenClaw nicht explizit konfiguriert ist.

    ### Kontextfensterbegrenzung

    OpenClaw behandelt Modellmetadaten und die Laufzeitbegrenzung des Kontexts als separate
    Werte. Für `openai/gpt-5.5` über den Codex-OAuth-Katalog:

    - Native `contextWindow`: `400000`
    - Standardmäßige Laufzeitbegrenzung für `contextTokens`: `272000`

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
    um das Laufzeit-Kontextbudget zu begrenzen. Die direkte OpenAI-Route mit API-Schlüssel
    meldet für `gpt-5.5` ein größeres natives `contextWindow` (`1000000`); die beiden
    Routen werden separat erfasst, da sich die vorgelagerten Kataloge unterscheiden.
    </Note>

    ### Katalogwiederherstellung

    OpenClaw verwendet vorgelagerte Codex-Katalogmetadaten für `gpt-5.5`, wenn diese
    vorhanden sind. Wenn die Live-Codex-Erkennung den Eintrag `gpt-5.5` auslässt, obwohl das Konto
    authentifiziert ist, erzeugt OpenClaw diesen OAuth-Modelleintrag, damit Cron-,
    Sub-Agent- und konfigurierte Standardmodellläufe nicht mit
    `Unknown model` fehlschlagen.

  </Tab>
</Tabs>

## Authentifizierung des nativen Codex-App-Servers

Das native Codex-App-Server-Harness verwendet `openai/*`-Modellreferenzen, wenn eine geeignete
exakte offizielle HTTPS-Route es implizit auswählt oder wenn Provider-/Modell-
`agentRuntime.id: "codex"` es explizit auswählt. Seine Authentifizierung ist weiterhin
kontobasiert. OpenClaw wählt die Authentifizierung in dieser Reihenfolge aus:

1. Geordnete OpenAI-Authentifizierungsprofile für den Agent, vorzugsweise unter
   `auth.order.openai`. Führen Sie `openclaw doctor --fix` aus, um ältere veraltete
   Codex-Authentifizierungsprofil-IDs und die Authentifizierungsreihenfolge zu migrieren.
2. Das bestehende Konto des App-Servers, beispielsweise eine lokale ChatGPT-
   Anmeldung der Codex CLI. Für das standardmäßig isolierte Agent-Home-Verzeichnis bindet OpenClaw dieses native
   CLI-Konto über dessen Anmelde-RPC in den App-Server ein; die Konfiguration, Plugins
   oder der Thread-Speicher der CLI werden nicht gemeinsam genutzt.
3. Nur für lokale stdio-Starts des App-Servers und nur, wenn der App-Server
   kein Konto meldet: `CODEX_API_KEY`, danach `OPENAI_API_KEY`.

Eine lokale ChatGPT-/Codex-Abonnementanmeldung wird nicht ersetzt, nur weil der
Gateway-Prozess außerdem `OPENAI_API_KEY` für direkte OpenAI-Modelle oder
Einbettungen besitzt. Der Rückgriff auf den API-Schlüssel aus der Umgebung gilt nur für den lokalen stdio-Pfad
ohne Konto; er wird niemals über WebSocket-App-Server-Verbindungen gesendet. Wenn ein
abonnementartiges Codex-Profil ausgewählt ist, hält OpenClaw außerdem
`CODEX_API_KEY` und `OPENAI_API_KEY` aus dem erzeugten stdio-App-Server-Unterprozess
heraus und sendet stattdessen die ausgewählten Anmeldedaten über den Anmelde-RPC des App-Servers.

Wenn dieses Abonnementprofil durch ein Codex-Nutzungslimit gesperrt ist, markiert OpenClaw
das Profil bis zur von Codex angegebenen Rücksetzzeit als gesperrt und ermöglicht der
Authentifizierungsreihenfolge den Wechsel zum nächsten `openai:*`-Profil, ohne das ausgewählte
Modell zu ändern oder das Codex-Harness zu verlassen. Nach Ablauf der Rücksetzzeit ist das
Abonnementprofil wieder auswählbar.

## Bilderzeugung

Das gebündelte `openai`-Plugin registriert die Bilderzeugung über das
Werkzeug `image_generate`. Es unterstützt sowohl die Bilderzeugung mit OpenAI-API-Schlüssel als auch mit Codex OAuth
über dieselbe Modellreferenz `openai/gpt-image-2`.

| Funktion                  | OpenAI-API-Schlüssel                  | Codex OAuth                           |
| ------------------------- | ------------------------------------- | ------------------------------------- |
| Modellreferenz            | `openai/gpt-image-2`                  | `openai/gpt-image-2`                  |
| Authentifizierung         | `OPENAI_API_KEY`                      | OpenAI-Codex-OAuth-Anmeldung          |
| Transport                 | OpenAI Images API                     | Codex-Responses-Backend               |
| Max. Bilder pro Anfrage   | 4                                     | 4                                     |
| Bearbeitungsmodus         | Aktiviert (bis zu 5 Referenzbilder)   | Aktiviert (bis zu 5 Referenzbilder)   |
| Größenüberschreibungen    | Unterstützt, einschließlich 2K/4K     | Unterstützt, einschließlich 2K/4K     |
| Seitenverhältnis/Auflösung | Nicht an OpenAI Images API weitergeleitet | Wenn sicher, einer unterstützten Größe zugeordnet |

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
Informationen zu gemeinsamen Werkzeugparametern, zur Provider-Auswahl und zum Ausweichverhalten finden Sie unter [Bilderzeugung](/de/tools/image-generation).
</Note>

`gpt-image-2` ist der Standard für die Text-zu-Bild-Erzeugung und Bildbearbeitung
mit OpenAI. `gpt-image-1.5`, `gpt-image-1` und `gpt-image-1-mini` bleiben
als explizite Modellüberschreibungen verwendbar. Verwenden Sie `openai/gpt-image-1.5` für
PNG-/WebP-Ausgaben mit transparentem Hintergrund; die aktuelle `gpt-image-2`-API lehnt
`background: "transparent"` ab.

Rufen Sie für eine Anfrage mit transparentem Hintergrund `image_generate` mit
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` oder `"webp"` und
`background: "transparent"` auf; die ältere Provider-Option `openai.background` wird
weiterhin akzeptiert. OpenClaw schützt außerdem die öffentlichen OpenAI- und OpenAI-Codex-OAuth-
Routen, indem es transparente Anfragen mit dem Standard `openai/gpt-image-2` auf
`gpt-image-1.5` umschreibt; Azure und benutzerdefinierte OpenAI-kompatible Endpunkte behalten ihre
konfigurierten Bereitstellungs-/Modellnamen.

Dieselbe Einstellung steht für Headless-CLI-Läufe zur Verfügung:

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
Verwenden Sie `--openai-moderation low|auto`, um den Moderationshinweis von OpenAI entweder von
`image generate` oder `image edit` zu übergeben.

Behalten Sie für ChatGPT-/Codex-OAuth-Installationen dieselbe Referenz `openai/gpt-image-2` bei. Wenn
ein `openai`-OAuth-Profil konfiguriert ist, löst OpenClaw das gespeicherte OAuth-
Zugriffstoken auf und sendet Bildanfragen über das Codex-Responses-Backend; es
versucht nicht zuerst `OPENAI_API_KEY` und greift nicht stillschweigend auf einen API-Schlüssel zurück.
Konfigurieren Sie `models.providers.openai` explizit mit einem API-Schlüssel, einer benutzerdefinierten Basis-
URL oder einem Azure-Endpunkt, wenn Sie stattdessen die direkte OpenAI-Images-API-Route
verwenden möchten. Wenn sich dieser benutzerdefinierte Bildendpunkt in einem vertrauenswürdigen LAN/an einer privaten Adresse befindet,
setzen Sie außerdem `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw
blockiert private/interne OpenAI-kompatible Bildendpunkte, sofern diese Zustimmung
nicht vorhanden ist.

Erzeugen:

```
/tool image_generate model=openai/gpt-image-2 prompt="Ein hochwertiges Veröffentlichungsposter für OpenClaw unter macOS" size=3840x2160 count=1
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

Das gebündelte `openai`-Plugin registriert die Videoerzeugung über das
Werkzeug `video_generate`.

| Funktion            | Wert                                                                               |
| ------------------- | ---------------------------------------------------------------------------------- |
| Standardmodell      | `openai/sora-2`                                                                    |
| Modi                | Text-zu-Video, Bild-zu-Video, Bearbeitung eines einzelnen Videos                   |
| Referenzeingaben    | 1 Bild oder 1 Video                                                                |
| Größenüberschreibungen | Für Text-zu-Video und Bild-zu-Video unterstützt                                 |
| Seitenverhältnis    | In die nächstgelegene unterstützte Größe umgewandelt, nicht unverändert weitergeleitet |
| Weitere Überschreibungen | `resolution`, `audio`, `watermark` werden nicht unterstützt und mit einer Werkzeugwarnung verworfen |

OpenAI-Anfragen für Bild-zu-Video verwenden `POST /v1/videos` mit einem Bild als
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

Der OpenAI-Provider deklariert `supportsSize`, aber weder `supportsAspectRatio` noch
`supportsResolution`. Die gemeinsame Normalisierungsschicht von OpenClaw wandelt ein
angefordertes `aspectRatio` in die nächstpassende OpenAI-`size` um, bevor die
Anfrage den Provider erreicht. Daher funktionieren Anforderungen an das Seitenverhältnis
im Allgemeinen weiterhin. Für `resolution` gibt es keinen Größen-Fallback; der Wert wird verworfen und dem Aufrufer als
`Ignored unsupported overrides for openai/<model>: resolution=<value>` gemeldet.
</Note>

## GPT-5-Prompt-Beitrag

OpenClaw fügt für Modelle der GPT-5-Familie beim
`openai`-Provider einen gemeinsamen GPT-5-Prompt-Beitrag hinzu (einschließlich älterer, noch nicht reparierter Codex-Referenzen, die
zu `openai/*` normalisiert werden). Andere Provider, die ebenfalls Modell-IDs der GPT-5-Familie bereitstellen,
etwa OpenRouter- oder opencode-Routen, erhalten dieses Overlay nicht; es wird anhand der
Provider-ID `openai` aktiviert, nicht allein anhand der Modell-ID. Ältere GPT-4.x-Modelle
erhalten es nie.

Die native Codex-App-Server-Testumgebung erhält den Verhaltensvertrag für Persona und Tool-
Disziplin sowie das Overlay für einen freundlichen Interaktionsstil nicht über
Entwickleranweisungen. Native Codex behält das Codex-eigene Basis-, Modell- und
Projektdokumentverhalten bei, und OpenClaw deaktiviert die integrierte Persönlichkeit von Codex für
native Threads, damit die Persönlichkeitsdateien des Agent-Arbeitsbereichs maßgeblich bleiben.
OpenClaw stellt nativen Codex-Threads nur Laufzeitkontext bereit: Kanalzustellung,
dynamische OpenClaw-Tools, ACP-Delegierung, Arbeitsbereichskontext und
OpenClaw-Skills. Der Heartbeat-Anleitungstext aus demselben Beitrag ist die
einzige Ausnahme: Native Codex-Heartbeat-Durchläufe erhalten ihn, wobei er als dedizierte
Anweisungen zur Zusammenarbeit statt über den gemeinsamen Hook für Prompt-Beiträge
eingefügt wird.

Der GPT-5-Beitrag fügt passenden, von OpenClaw zusammengestellten Prompts einen mit Tags versehenen Verhaltensvertrag für die
Beständigkeit der Persona, Ausführungssicherheit, Tool-Disziplin, Ausgabeform, Abschlussprüfungen
und Verifizierung hinzu. Kanalspezifisches Antwort- und Stummnachrichtenverhalten verbleibt im gemeinsamen OpenClaw-System-
Prompt und in der Richtlinie für ausgehende Zustellungen. Die Ebene für einen freundlichen Interaktionsstil ist
separat und konfigurierbar.

| Wert                   | Wirkung                                             |
| ---------------------- | --------------------------------------------------- |
| `"friendly"` (Standard) | Aktiviert die Ebene für einen freundlichen Interaktionsstil |
| `"on"`                 | Alias für `"friendly"`                              |
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
Bei der Laufzeit wird bei den Werten nicht zwischen Groß- und Kleinschreibung unterschieden. Daher deaktivieren sowohl `"Off"` als auch `"off"` die
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
    Das gebündelte `openai`-Plugin registriert die Sprachsynthese für die
    `messages.tts`-Oberfläche.

    | Einstellung | Konfigurationspfad                                     | Standard                            |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | Modell       | `messages.tts.providers.openai.model`                  | `gpt-4o-mini-tts`                   |
    | Stimme       | `messages.tts.providers.openai.speakerVoice`           | `coral`                             |
    | Geschwindigkeit | `messages.tts.providers.openai.speed`               | (nicht gesetzt)                     |
    | Anweisungen  | `messages.tts.providers.openai.instructions`           | (nicht gesetzt, nur `gpt-4o-mini-tts`) |
    | Format       | `messages.tts.providers.openai.responseFormat`         | `opus` für Sprachnachrichten, `mp3` für Dateien |
    | API-Schlüssel | `messages.tts.providers.openai.apiKey`                | Fällt auf `OPENAI_API_KEY` zurück   |
    | Basis-URL    | `messages.tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`         |
    | Zusätzlicher Body | `messages.tts.providers.openai.extraBody` / `extra_body` | (nicht gesetzt)                 |

    Verfügbare Modelle: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Verfügbare Stimmen:
    `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`,
    `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` wird nach den von OpenClaw
    generierten Feldern in das Anfrage-JSON für `/audio/speech` eingefügt. Verwenden Sie es daher für OpenAI-kompatible Endpunkte, die
    zusätzliche Schlüssel wie `lang` benötigen. Prototypschlüssel werden ignoriert.

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
    Setzen Sie `OPENAI_TTS_BASE_URL`, um die TTS-Basis-URL zu überschreiben, ohne
    den Chat-API-Endpunkt zu beeinflussen. OpenAI TTS und Realtime-Sprache werden beide
    über einen API-Schlüssel der OpenAI Platform konfiguriert. Installationen, die ausschließlich OAuth verwenden, können weiterhin
    Codex-gestützte Chatmodelle nutzen, jedoch keine Live-Sprachausgabe von OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Sprache-zu-Text">
    Das gebündelte `openai`-Plugin registriert die stapelweise Sprache-zu-Text-Verarbeitung über
    die Transkriptionsoberfläche der Medienanalyse von OpenClaw.

    - Standardmodell: `gpt-4o-transcribe`
    - Endpunkt: OpenAI REST `/v1/audio/transcriptions`
    - Eingabepfad: Multipart-Upload einer Audiodatei
    - Wird überall verwendet, wo die Transkription eingehender Audiodaten `tools.media.audio` liest,
      einschließlich Segmenten aus Discord-Sprachkanälen und Audioanhängen in Kanälen

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
    gemeinsamen Audiomedienkonfiguration oder einer Transkriptionsanfrage pro Aufruf bereitgestellt werden.

  </Accordion>

  <Accordion title="Realtime-Transkription">
    Das gebündelte `openai`-Plugin registriert die Realtime-Transkription für das
    Voice-Call-Plugin.

    | Einstellung      | Konfigurationspfad                                                    | Standard |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | Modell           | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Sprache          | `...openai.language`                                                 | (nicht gesetzt) |
    | Prompt           | `...openai.prompt`                                                   | (nicht gesetzt) |
    | Stilledauer      | `...openai.silenceDurationMs`                                        | `800`   |
    | VAD-Schwellenwert | `...openai.vadThreshold`                                            | `0.5`   |
    | Authentifizierung | `...openai.apiKey`, `OPENAI_API_KEY` oder `openai`-API-Schlüsselprofil | API-Schlüssel der Platform erforderlich |

    <Note>
    Verwendet eine WebSocket-Verbindung zu `wss://api.openai.com/v1/realtime` mit
    G.711-μ-Law-Audio (`g711_ulaw` / `audio/pcmu`). Bei einem `openai`-API-Schlüsselprofil
    erstellt der Gateway ein kurzlebiges Client-
    Secret für die Realtime-Transkription, bevor er den WebSocket öffnet. Dieser Streaming-Provider ist für den Realtime-
    Transkriptionspfad von Voice Call vorgesehen. Discord-Sprache zeichnet derzeit kurze
    Segmente auf und verwendet stattdessen den stapelweisen Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime-Sprache">
    Das gebündelte `openai`-Plugin registriert Realtime-Sprache für das Voice-Call-
    Plugin.

    | Einstellung                            | Konfigurationspfad                                                        | Standard             |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | Modell                                 | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2.1`  |
    | Stimme                                 | `...openai.voice`                                                       | `alloy`             |
    | Temperatur (Azure-Bereitstellungsbrücke) | `...openai.temperature`                                               | `0.8`               |
    | VAD-Schwellenwert                      | `...openai.vadThreshold`                                                | `0.5`                |
    | Stilledauer                            | `...openai.silenceDurationMs`                                           | `500`                |
    | Präfixauffüllung                       | `...openai.prefixPaddingMs`                                             | `300`                |
    | Reasoning-Aufwand                      | `...openai.reasoningEffort`                                             | (nicht gesetzt)       |
    | Authentifizierung                      | `openai`-API-Schlüsselprofil, `...openai.apiKey` oder `OPENAI_API_KEY` | API-Schlüssel der OpenAI Platform erforderlich |

    Verfügbare integrierte Realtime-Stimmen für `gpt-realtime-2.1`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI empfiehlt `marin` und `cedar` für die beste Realtime-Qualität. Dies
    ist ein separater Satz von den oben aufgeführten Text-zu-Sprache-Stimmen. Eine reine TTS-Stimme
    wie `fable`, `nova` oder `onyx` ist für Realtime-Sitzungen nicht gültig.
    Setzen Sie das Modell ausdrücklich auf `gpt-realtime-2.1-mini`, wenn Sie die
    kleinere, kostengünstigere Realtime-2.1-Variante bevorzugen.

    <Note>
    **GPT-Live (demnächst verfügbar).** Die Vollduplexmodelle `gpt-live-1` und
    `gpt-live-1-mini` von OpenAI ersetzten im Juli 2026 den Sprachmodus von ChatGPT. Die
    Entwickler-API wird schrittweise für Organisationen mit frühem Zugriff bereitgestellt. OpenClaw
    erkennt die Modellfamilie, führt sie jedoch noch nicht aus: GPT-Live-Sitzungen sind
    ausschließlich WebRTC-basiert, steuern ihren Sprecherwechsel selbst (ohne VAD) und delegieren Agent-Aufgaben
    über ein Übergabeereignisprotokoll, das die Realtime-Transportschichten von OpenClaw
    noch nicht implementieren. Die Konfiguration eines `gpt-live-*`-Modells schlägt sicher geschlossen fehl und zeigt
    sowohl für die WebSocket-Brücke als auch für Talk-Browsersitzungen entsprechende Hinweise an, statt
    unbemerkt Audio ohne Agent-Zugriff zu verbinden. Der API-Zugriff ist während des frühen Zugriffs außerdem
    je OpenAI-Organisation beschränkt. Behalten Sie `gpt-realtime-2.1` (den
    Standard) bei, bis die GPT-Live-Unterstützung verfügbar ist.
    </Note>

    <Note>
    Backend-Realtime-Brücken von OpenAI verwenden die allgemein verfügbare Form der Realtime-WebSocket-Sitzung,
    die `session.temperature` nicht akzeptiert. Azure-OpenAI-
    Bereitstellungen bleiben über `azureEndpoint` und `azureDeployment` verfügbar und
    behalten die bereitstellungskompatible Sitzungsform bei (einschließlich `temperature`).
    Unterstützt bidirektionale Tool-Aufrufe und G.711-μ-Law-Audio.
    </Note>

    <Note>
    Die Realtime-Stimme wird bei der Erstellung der Sitzung ausgewählt. OpenAI erlaubt, die meisten
    Sitzungsfelder später zu ändern, aber die Stimme kann nicht mehr geändert werden, nachdem das
    Modell in dieser Sitzung Audio ausgegeben hat. OpenClaw stellt die
    IDs der integrierten Realtime-Stimmen derzeit als Zeichenfolgen bereit.
    </Note>

    <Note>
    Control UI Talk verwendet OpenAI-Echtzeitsitzungen im Browser mit einem vom Gateway
    ausgestellten kurzlebigen Client-Secret und einem direkten WebRTC-SDP-Austausch des Browsers
    mit der OpenAI Realtime API. Das Gateway stellt dieses Client-Secret mit
    den ausgewählten `openai`-Anmeldedaten aus. Konfigurierte Schlüssel, API-Schlüsselprofile und
    `OPENAI_API_KEY` haben Vorrang; ein `openai`-OAuth-Profil oder eine externe
    Codex-Anmeldung dient als Fallback. Gateway-Relay und die Echtzeit-
    WebSocket-Brücken des Voice-Call-Backends verwenden für native OpenAI-Endpunkte
    dieselbe Reihenfolge der Anmeldedaten.
    Die Live-Verifizierung für Maintainer ist verfügbar mit
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    die OpenAI-Abschnitte überprüfen sowohl die WebSocket-Brücke des Backends als auch den
    WebRTC-SDP-Austausch des Browsers, ohne Secrets zu protokollieren.
    Übergeben Sie `--openai-only`, um diese beiden Abschnitte ohne Google-Anmeldedaten auszuführen.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure-OpenAI-Endpunkte

Der mitgelieferte `openai`-Provider kann für die Bildgenerierung auf eine
Azure-OpenAI-Ressource ausgerichtet werden, indem die Basis-URL überschrieben
wird. Im Bildgenerierungspfad erkennt OpenClaw Azure-Hostnamen in
`models.providers.openai.baseUrl` und wechselt automatisch zum
Anfrageformat von Azure.

<Note>
Echtzeit-Sprache verwendet einen separaten Konfigurationspfad
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
und wird von `models.providers.openai.baseUrl` nicht beeinflusst. Die
Azure-Einstellungen finden Sie im Akkordeon **Echtzeit-Sprache** unter
[Sprache und Sprachausgabe](#voice-and-speech).
</Note>

Verwenden Sie Azure OpenAI, wenn:

- Sie bereits über ein Azure-OpenAI-Abonnement, ein Kontingent oder eine
  Unternehmensvereinbarung verfügen
- Sie regionale Datenresidenz oder von Azure bereitgestellte Compliance-Kontrollen
  benötigen
- Sie den Datenverkehr innerhalb eines vorhandenen Azure-Mandanten halten möchten

### Konfiguration

Richten Sie für die Azure-Bildgenerierung über den mitgelieferten
`openai`-Provider `models.providers.openai.baseUrl` auf Ihre Azure-Ressource
und setzen Sie `apiKey` auf den Azure-OpenAI-Schlüssel (nicht auf einen
OpenAI-Platform-Schlüssel):

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

Bei Bildgenerierungsanfragen an einen erkannten Azure-Host führt OpenClaw
Folgendes aus:

- Sendet den Header `api-key` anstelle von `Authorization: Bearer`
- Verwendet bereitstellungsspezifische Pfade (`/openai/deployments/{deployment}/...`)
- Hängt jeder Anfrage `?api-version=...` an
- Verwendet für Azure-Bildgenerierungsaufrufe ein standardmäßiges
  Anfrage-Timeout von 600s. Aufrufspezifische `timeoutMs`-Werte überschreiben
  weiterhin diesen Standardwert.

Andere Basis-URLs (öffentliches OpenAI, OpenAI-kompatible Proxys) behalten das
standardmäßige Anfrageformat für OpenAI-Bilder bei.

<Note>
Das Azure-Routing für den Bildgenerierungspfad des `openai`-Providers erfordert
OpenClaw 2026.4.22 oder neuer. Frühere Versionen behandeln jede benutzerdefinierte
`openai.baseUrl` wie den öffentlichen OpenAI-Endpunkt und schlagen bei
Azure-Bildbereitstellungen fehl.
</Note>

### API-Version

Setzen Sie `AZURE_OPENAI_API_VERSION`, um für den Azure-Bildgenerierungspfad
eine bestimmte Azure-Vorschau- oder GA-Version festzulegen:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Wenn die Variable nicht gesetzt ist, lautet der Standardwert
`2024-12-01-preview`.

### Modellnamen sind Bereitstellungsnamen

Azure OpenAI bindet Modelle an Bereitstellungen. Bei Azure-Bildgenerierungsanfragen,
die über den mitgelieferten `openai`-Provider geleitet werden, muss das Feld
`model` in OpenClaw der **Azure-Bereitstellungsname** sein, den Sie im
Azure-Portal konfiguriert haben, nicht die öffentliche OpenAI-Modell-ID.

Wenn Sie eine Bereitstellung namens `gpt-image-2-prod` erstellen, die
`gpt-image-2` bereitstellt:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Ein übersichtliches Poster" size=1024x1024 count=1
```

Dieselbe Regel für Bereitstellungsnamen gilt für jeden Bildgenerierungsaufruf,
der über den mitgelieferten `openai`-Provider geleitet wird.

### Regionale Verfügbarkeit

Die Azure-Bildgenerierung ist derzeit nur in einer Teilmenge der Regionen
verfügbar (beispielsweise `eastus2`, `swedencentral`, `polandcentral`,
`westus3`, `uaenorth`). Prüfen Sie die aktuelle Regionsliste von Microsoft,
bevor Sie eine Bereitstellung erstellen, und vergewissern Sie sich, dass das
betreffende Modell in Ihrer Region angeboten wird.

### Parameterunterschiede

Azure OpenAI und das öffentliche OpenAI akzeptieren nicht immer dieselben
Bildparameter. Azure kann Optionen ablehnen, die das öffentliche OpenAI
zulässt (beispielsweise bestimmte `background`-Werte bei `gpt-image-2`), oder
sie nur für bestimmte Modellversionen bereitstellen. Diese Unterschiede
stammen von Azure und dem zugrunde liegenden Modell, nicht von OpenClaw.
Wenn eine Azure-Anfrage mit einem Validierungsfehler fehlschlägt, prüfen Sie
im Azure-Portal den Parametersatz, den Ihre konkrete Bereitstellung und
API-Version unterstützen.

<Note>
Azure OpenAI verwendet nativen Transport und Kompatibilitätsverhalten, erhält
jedoch nicht die verborgenen Attributions-Header von OpenClaw – siehe das
Akkordeon **Native und OpenAI-kompatible Routen** unter
[Erweiterte Konfiguration](#advanced-configuration).

Verwenden Sie für Chat- oder Responses-Datenverkehr auf Azure (über die
Bildgenerierung hinaus) den Onboarding-Ablauf oder eine dedizierte
Azure-Provider-Konfiguration; `openai.baseUrl` allein übernimmt nicht das
Azure-API-/Authentifizierungsformat. Es gibt einen separaten
`azure-openai-responses/*`-Provider; siehe das Akkordeon zur serverseitigen
Compaction weiter unten.
</Note>

## Erweiterte Konfiguration

Die folgenden `params`-Beispiele pro Modell gestalten die eingebettete
Provider-Anfrage von OpenClaw. Ihre Konfiguration stellt bewusst festgelegtes
Anfrageverhalten dar, sodass eine ansonsten geeignete `auto`-Route bei
OpenClaw verbleibt, statt Codex implizit auszuwählen. Das native
Codex-App-Server-Harness verwaltet seinen eigenen Transport und seine eigenen
Anfrageeinstellungen; ein explizites `agentRuntime.id: "codex"` schlägt
geschlossen fehl, wenn die effektive Route nicht als Codex-kompatibel
deklariert ist.

<AccordionGroup>
  <Accordion title="Transport (WebSocket oder SSE)">
    OpenClaw verwendet für `openai/*` vorrangig WebSocket mit SSE als Fallback (`"auto"`).

    Im Modus `"auto"` führt OpenClaw Folgendes aus:
    - Wiederholt einen frühen WebSocket-Fehler einmal, bevor auf SSE zurückgegriffen wird
    - Markiert WebSocket nach einem Fehler für 60 Sekunden als beeinträchtigt und verwendet
      während der Abkühlphase SSE
    - Fügt für Wiederholungen und erneute Verbindungen stabile Header für Sitzungs- und
      Durchlaufidentitäten hinzu
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

    Wenn aktiviert, ordnet OpenClaw den Schnellmodus der priorisierten
    Verarbeitung von OpenAI zu (`service_tier = "priority"`). Vorhandene
    `service_tier`-Werte bleiben erhalten, und der Schnellmodus ändert weder
    `reasoning` noch `text.verbosity`. `fastMode: "auto"` startet neue
    Modellaufrufe bis zum automatischen Grenzwert im Schnellmodus und startet
    spätere Wiederholungs-, Fallback-, Werkzeugergebnis- oder Fortsetzungsaufrufe
    anschließend ohne Schnellmodus. Der Grenzwert beträgt standardmäßig 60 Sekunden;
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
    Sitzungsüberschreibungen haben Vorrang vor der Konfiguration. Wenn Sie die
    Sitzungsüberschreibung in der Sessions UI löschen, kehrt die Sitzung zum
    konfigurierten Standardwert zurück.
    </Note>

  </Accordion>

  <Accordion title="Priorisierte Verarbeitung (service_tier)">
    Die API von OpenAI stellt priorisierte Verarbeitung über `service_tier`
    bereit. Legen Sie den Wert in OpenClaw pro Modell fest:

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
    `serviceTier` wird nur an native OpenAI-Endpunkte (`api.openai.com`) und
    native Codex-Endpunkte (`chatgpt.com/backend-api`) weitergeleitet.
    Wenn Sie einen der beiden Provider über einen Proxy leiten, lässt OpenClaw
    `service_tier` unverändert.
    </Warning>

  </Accordion>

  <Accordion title="Serverseitige Compaction (Responses API)">
    Für direkte OpenAI-Responses-Modelle (`openai/*` auf `api.openai.com`)
    aktiviert der OpenClaw-Stream-Wrapper des OpenAI-Plugins automatisch die
    serverseitige Compaction:

    - Erzwingt `store: true` (sofern die Modellkompatibilität nicht `supportsStore: false` festlegt)
    - Fügt `context_management: [{ type: "compaction", compact_threshold: ... }]` ein
    - Standardwert für `compact_threshold`: 70% von `contextWindow` (oder `80000`, wenn
      nicht verfügbar)

    Dies gilt für den integrierten OpenClaw-Laufzeitpfad und für
    OpenAI-Provider-Hooks, die von eingebetteten Ausführungen verwendet werden.
    Das native Codex-App-Server-Harness verwaltet seinen eigenen Kontext über
    Codex und wird von dieser Einstellung nicht beeinflusst.

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
      <Tab title="Benutzerdefinierter Grenzwert">
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
    `responsesServerCompaction` steuert nur das Einfügen von
    `context_management`. Direkte OpenAI-Responses-Modelle erzwingen weiterhin
    `store: true`, sofern die Kompatibilität nicht `supportsStore: false`
    festlegt.
    </Note>

  </Accordion>

  <Accordion title="Strikter agentischer GPT-Modus">
    Für Modelle der GPT-5-Familie des `openai`-Providers, die über die
    eingebettete Laufzeit von OpenClaw ausgeführt werden, verwendet OpenClaw
    bereits standardmäßig einen strengeren Ausführungsvertrag namens
    `strict-agentic`. Er wird automatisch aktiviert, wenn der aufgelöste
    Provider `openai` ist und die Modell-ID der GPT-5-Familie entspricht,
    sofern die Konfiguration ihn nicht ausdrücklich deaktiviert:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    Das explizite Festlegen von `"strict-agentic"` hat auf einem unterstützten
    Ausführungspfad keine Wirkung (es ist bereits der Standard) und bleibt bei
    nicht unterstützten Provider-/Modellpaaren wirkungslos.

    Bei aktivem `strict-agentic` führt OpenClaw Folgendes aus:
    - Aktiviert `update_plan` automatisch für umfangreiche Arbeiten
    - Wiederholt strukturell leere oder ausschließlich aus Reasoning bestehende
      Durchläufe mit einer Fortsetzung, die eine sichtbare Antwort erzeugt
    - Verwendet explizite Planereignisse des Harnesses, wenn das ausgewählte
      Harness sie bereitstellt

    OpenClaw klassifiziert Assistentenprosa nicht, um zu entscheiden, ob ein Turn ein
    Plan, eine Fortschrittsaktualisierung oder eine endgültige Antwort ist.

    <Note>
    Dieser Vertrag ist vollständig im eingebetteten Agent-Runner von OpenClaw verankert. Er gilt
    nicht für die native Codex-App-Server-Harness, die ihr eigenes
    Turn- und Planverhalten verwaltet; für native Codex-Ausführungen ist die Auswahl der Harness
    wichtiger als die Einstellung des Ausführungsvertrags.
    </Note>

  </Accordion>

  <Accordion title="Native und OpenAI-kompatible Routen">
    OpenClaw behandelt direkte OpenAI-, Codex- und Azure-OpenAI-Endpunkte
    anders als generische OpenAI-kompatible `/v1`-Proxys:

    **Native Routen** (`openai/*`, Azure OpenAI):
    - Behalten `reasoning: { effort: "none" }` nur für Modelle bei, die den
      OpenAI-Aufwand `none` unterstützen
    - Lassen deaktiviertes Reasoning bei Modellen oder Proxys weg, die
      `reasoning.effort: "none"` ablehnen
    - Verwenden für Tool-Schemas standardmäßig den strikten Modus
    - Fügen versteckte Zuordnungs-Header nur bei verifizierten nativen Hosts hinzu (Azure
      OpenAI erhält diese Header nicht, obwohl es sich um eine native Route handelt)
    - Behalten die OpenAI-spezifische Anfragegestaltung (`service_tier`, `store`,
      Reasoning-Kompatibilität, Prompt-Cache-Hinweise) bei

    **Proxy-/kompatible Routen:**
    - Verwenden ein weniger striktes Kompatibilitätsverhalten
    - Entfernen bei nicht nativen `openai-completions`-Payloads das Completions-Feld `store`
    - Akzeptieren die erweiterte JSON-Durchleitung über `params.extra_body`/`params.extraBody`
      für OpenAI-kompatible Completions-Proxys
    - Akzeptieren `params.chat_template_kwargs` für OpenAI-kompatible Completions-
      Proxys wie vLLM
    - Erzwingen weder strikte Tool-Schemas noch ausschließlich nativen Routen vorbehaltene Header

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter für Bild-Tools und Provider-Auswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter für Video-Tools und Provider-Auswahl.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Authentifizierungsdetails und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
