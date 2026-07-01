---
read_when:
    - Sie möchten OpenClaw mit Cloud- oder lokalen Modellen über Ollama ausführen
    - Sie benötigen Unterstützung bei Einrichtung und Konfiguration von Ollama
    - Sie möchten Ollama-Vision-Modelle für das Bildverständnis
summary: OpenClaw mit Ollama ausführen (Cloud- und lokale Modelle)
title: Ollama
x-i18n:
    generated_at: "2026-07-01T05:35:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e047ee6c0531d1d0231d5ccad00f9af0889039d527cd1247c9b802bc406eadf
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw integriert sich mit Ollamas nativer API (`/api/chat`) für gehostete Cloud-Modelle und lokale/selbst gehostete Ollama-Server. Sie können Ollama in drei Modi verwenden: `Cloud + Local` über einen erreichbaren Ollama-Host, `Cloud only` gegen `https://ollama.com` oder `Local only` gegen einen erreichbaren Ollama-Host.

OpenClaw registriert außerdem `ollama-cloud` als Provider-ID erster Klasse für
die direkte Nutzung von Ollama Cloud. Verwenden Sie Referenzen wie `ollama-cloud/kimi-k2.5:cloud`, wenn Sie
reines Cloud-Routing möchten, ohne die lokale Provider-ID `ollama` zu teilen.

Die dedizierte Einrichtungsseite nur für die Cloud finden Sie unter [Ollama Cloud](/de/providers/ollama-cloud).

<Warning>
**Remote-Ollama-Nutzer**: Verwenden Sie mit OpenClaw nicht die OpenAI-kompatible `/v1`-URL (`http://host:11434/v1`). Dadurch wird Tool Calling beschädigt, und Modelle können rohes Tool-JSON als Klartext ausgeben. Verwenden Sie stattdessen die native Ollama-API-URL: `baseUrl: "http://host:11434"` (ohne `/v1`).
</Warning>

Die Ollama-Provider-Konfiguration verwendet `baseUrl` als kanonischen Schlüssel. OpenClaw akzeptiert aus Kompatibilitätsgründen mit OpenAI-SDK-ähnlichen Beispielen auch `baseURL`, neue Konfigurationen sollten jedoch `baseUrl` bevorzugen.

## Authentifizierungsregeln

<AccordionGroup>
  <Accordion title="Lokale Hosts und LAN-Hosts">
    Lokale und LAN-Ollama-Hosts benötigen keinen echten Bearer-Token. OpenClaw verwendet die lokale Markierung `ollama-local` nur für Loopback-, private Netzwerk-, `.local`- und reine Hostname-Ollama-Basis-URLs.
  </Accordion>
  <Accordion title="Remote-Hosts und Ollama-Cloud-Hosts">
    Öffentliche Remote-Hosts und Ollama Cloud (`https://ollama.com`) benötigen echte Zugangsdaten über `OLLAMA_API_KEY`, ein Authentifizierungsprofil oder den `apiKey` des Providers. Für die direkte gehostete Nutzung bevorzugen Sie den Provider `ollama-cloud`.
  </Accordion>
  <Accordion title="Benutzerdefinierte Provider-IDs">
    Benutzerdefinierte Provider-IDs, die `api: "ollama"` setzen, folgen denselben Regeln. Beispielsweise kann ein `ollama-remote`-Provider, der auf einen privaten LAN-Ollama-Host zeigt, `apiKey: "ollama-local"` verwenden, und Sub-Agents lösen diese Markierung über den Ollama-Provider-Hook auf, statt sie als fehlende Zugangsdaten zu behandeln. Die Speichersuche kann außerdem `agents.defaults.memorySearch.provider` auf diese benutzerdefinierte Provider-ID setzen, damit Embeddings den passenden Ollama-Endpunkt verwenden.
  </Accordion>
  <Accordion title="Authentifizierungsprofile">
    `auth-profiles.json` speichert die Zugangsdaten für eine Provider-ID. Legen Sie Endpunkteinstellungen (`baseUrl`, `api`, Modell-IDs, Header, Timeouts) in `models.providers.<id>` ab. Ältere flache Authentifizierungsprofildateien wie `{ "ollama-windows": { "apiKey": "ollama-local" } }` sind kein Laufzeitformat; führen Sie `openclaw doctor --fix` aus, um sie mit einem Backup in das kanonische API-Key-Profil `ollama-windows:default` umzuschreiben. `baseUrl` in dieser Datei ist Kompatibilitätsrauschen und sollte in die Provider-Konfiguration verschoben werden.
  </Accordion>
  <Accordion title="Geltungsbereich für Speicher-Embeddings">
    Wenn Ollama für Speicher-Embeddings verwendet wird, ist die Bearer-Authentifizierung auf den Host beschränkt, auf dem sie deklariert wurde:

    - Ein Schlüssel auf Provider-Ebene wird nur an den Ollama-Host dieses Providers gesendet.
    - `agents.*.memorySearch.remote.apiKey` wird nur an seinen Remote-Embedding-Host gesendet.
    - Ein reiner `OLLAMA_API_KEY`-Umgebungswert wird als Ollama-Cloud-Konvention behandelt und standardmäßig nicht an lokale oder selbst gehostete Hosts gesendet.

  </Accordion>
</AccordionGroup>

## Erste Schritte

Wählen Sie Ihre bevorzugte Einrichtungsmethode und Ihren Modus.

<Tabs>
  <Tab title="Onboarding (empfohlen)">
    **Am besten geeignet für:** den schnellsten Weg zu einer funktionierenden Ollama-Cloud- oder lokalen Einrichtung.

    <Steps>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard
        ```

        Wählen Sie **Ollama** aus der Provider-Liste aus.
      </Step>
      <Step title="Modus wählen">
        - **Cloud + Local** — lokaler Ollama-Host plus über diesen Host geroutete Cloud-Modelle
        - **Cloud only** — gehostete Ollama-Modelle über `https://ollama.com`
        - **Local only** — nur lokale Modelle

      </Step>
      <Step title="Modell auswählen">
        `Cloud only` fragt nach `OLLAMA_API_KEY` und schlägt gehostete Cloud-Standardwerte vor. `Cloud + Local` und `Local only` fragen nach einer Ollama-Basis-URL, erkennen verfügbare Modelle und ziehen das ausgewählte lokale Modell automatisch, falls es noch nicht verfügbar ist. Wenn Ollama ein installiertes `:latest`-Tag wie `gemma4:latest` meldet, zeigt die Einrichtung dieses installierte Modell einmal an, statt sowohl `gemma4` als auch `gemma4:latest` anzuzeigen oder den reinen Alias erneut zu ziehen. `Cloud + Local` prüft außerdem, ob dieser Ollama-Host für Cloud-Zugriff angemeldet ist.
      </Step>
      <Step title="Verifizieren, dass das Modell verfügbar ist">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Nicht interaktiver Modus

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    Geben Sie optional eine benutzerdefinierte Basis-URL oder ein Modell an:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Manuelle Einrichtung">
    **Am besten geeignet für:** vollständige Kontrolle über die Cloud- oder lokale Einrichtung.

    <Steps>
      <Step title="Cloud oder lokal wählen">
        - **Cloud + Local**: Installieren Sie Ollama, melden Sie sich mit `ollama signin` an und routen Sie Cloud-Anfragen über diesen Host
        - **Cloud only**: Verwenden Sie `https://ollama.com` mit einem `OLLAMA_API_KEY`
        - **Local only**: Installieren Sie Ollama von [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Ein lokales Modell ziehen (nur lokal)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Ollama für OpenClaw aktivieren">
        Verwenden Sie für `Cloud only` Ihren echten `OLLAMA_API_KEY`. Für hostgestützte Einrichtungen funktioniert jeder Platzhalterwert:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Ihr Modell prüfen und festlegen">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Oder legen Sie den Standard in der Konfiguration fest:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Cloud-Modelle

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` verwendet einen erreichbaren Ollama-Host als Steuerpunkt sowohl für lokale als auch für Cloud-Modelle. Dies ist Ollamas bevorzugter Hybrid-Ablauf.

    Verwenden Sie während der Einrichtung **Cloud + Local**. OpenClaw fragt nach der Ollama-Basis-URL, erkennt lokale Modelle von diesem Host und prüft mit `ollama signin`, ob der Host für Cloud-Zugriff angemeldet ist. Wenn der Host angemeldet ist, schlägt OpenClaw außerdem gehostete Cloud-Standardwerte wie `kimi-k2.5:cloud`, `minimax-m2.7:cloud` und `glm-5.1:cloud` vor.

    Wenn der Host noch nicht angemeldet ist, behält OpenClaw die Einrichtung nur lokal bei, bis Sie `ollama signin` ausführen.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` läuft gegen Ollamas gehostete API unter `https://ollama.com`.

    Verwenden Sie während der Einrichtung **Cloud only**. OpenClaw fragt nach `OLLAMA_API_KEY`, setzt `baseUrl: "https://ollama.com"` und initialisiert die Liste der gehosteten Cloud-Modelle. Dieser Pfad erfordert keinen lokalen Ollama-Server und kein `ollama signin`.

    Die während `openclaw onboard` angezeigte Cloud-Modellliste wird live aus `https://ollama.com/api/tags` befüllt und auf 500 Einträge begrenzt, sodass die Auswahl den aktuellen gehosteten Katalog statt eines statischen Startbestands widerspiegelt. Wenn `ollama.com` während der Einrichtung nicht erreichbar ist oder keine Modelle zurückgibt, fällt OpenClaw auf die bisherigen fest codierten Vorschläge zurück, damit das Onboarding trotzdem abgeschlossen wird.

    Sie können den Cloud-Provider erster Klasse auch direkt konfigurieren:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    Im rein lokalen Modus erkennt OpenClaw Modelle aus der konfigurierten Ollama-Instanz. Dieser Pfad ist für lokale oder selbst gehostete Ollama-Server vorgesehen.

    OpenClaw schlägt derzeit `gemma4` als lokalen Standard vor.

  </Tab>
</Tabs>

## Modellerkennung (impliziter Provider)

Wenn Sie `OLLAMA_API_KEY` (oder ein Authentifizierungsprofil) setzen und **nicht** `models.providers.ollama` oder einen anderen benutzerdefinierten Remote-Provider mit `api: "ollama"` definieren, erkennt OpenClaw Modelle aus der lokalen Ollama-Instanz unter `http://127.0.0.1:11434`.

| Verhalten            | Detail                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Katalogabfrage       | Fragt `/api/tags` ab                                                                                                                                                 |
| Fähigkeitserkennung  | Verwendet Best-Effort-`/api/show`-Lookups, um `contextWindow`, erweiterte `num_ctx`-Modelfile-Parameter und Fähigkeiten einschließlich Vision/Tools zu lesen         |
| Vision-Modelle       | Modelle mit einer von `/api/show` gemeldeten `vision`-Fähigkeit werden als bildfähig markiert (`input: ["text", "image"]`), sodass OpenClaw Bilder automatisch in den Prompt injiziert |
| Reasoning-Erkennung  | Verwendet `/api/show`-Fähigkeiten, sofern verfügbar, einschließlich `thinking`; fällt auf eine Modellnamen-Heuristik (`r1`, `reasoning`, `think`) zurück, wenn Ollama Fähigkeiten auslässt |
| Token-Limits         | Setzt `maxTokens` auf die von OpenClaw verwendete standardmäßige Ollama-Max-Token-Obergrenze                                                                          |
| Kosten               | Setzt alle Kosten auf `0`                                                                                                                                            |

Dadurch werden manuelle Modelleinträge vermieden, während der Katalog mit der lokalen Ollama-Instanz abgeglichen bleibt. Sie können eine vollständige Referenz wie `ollama/<pulled-model>:latest` in lokalem `infer model run` verwenden; OpenClaw löst dieses installierte Modell aus Ollamas Live-Katalog auf, ohne einen handgeschriebenen `models.json`-Eintrag zu benötigen.

Bei angemeldeten Ollama-Hosts können einige `:cloud`-Modelle über `/api/chat`
und `/api/show` nutzbar sein, bevor sie in `/api/tags` erscheinen. Wenn Sie explizit eine
vollständige Referenz `ollama/<model>:cloud` auswählen, validiert OpenClaw genau dieses fehlende Modell mit
`/api/show` und fügt es nur dann dem Laufzeitkatalog hinzu, wenn Ollama Modellmetadaten
bestätigt. Tippfehler schlagen weiterhin als unbekannte Modelle fehl, statt automatisch erstellt zu werden.

```bash
# See what models are available
ollama list
openclaw models list
```

Für einen schlanken Smoke-Test zur Textgenerierung, der die vollständige Agent-Tool-Oberfläche vermeidet,
verwenden Sie lokales `infer model run` mit einer vollständigen Ollama-Modellreferenz:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Dieser Pfad verwendet weiterhin den konfigurierten Provider, die Authentifizierung und den nativen Ollama-
Transport von OpenClaw, startet jedoch keinen Chat-Agent-Turn und lädt keinen MCP-/Tool-Kontext. Wenn
dies erfolgreich ist, während normale Agent-Antworten fehlschlagen, untersuchen Sie als Nächstes die Agent-
Prompt-/Tool-Kapazität des Modells.

Für einen schlanken Smoke-Test eines Vision-Modells auf demselben schlanken Pfad fügen Sie eine oder mehrere
Bilddateien zu `infer model run` hinzu. Dadurch werden Prompt und Bild direkt an
das ausgewählte Ollama-Vision-Modell gesendet, ohne Chat-Tools, Speicher oder vorherigen
Sitzungskontext zu laden:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` akzeptiert Dateien, die als `image/*` erkannt werden, einschließlich gängiger PNG-,
JPEG- und WebP-Eingaben. Nicht-Bilddateien werden abgelehnt, bevor Ollama aufgerufen wird.
Für Spracherkennung verwenden Sie stattdessen `openclaw infer audio transcribe`.

Wenn Sie eine Unterhaltung mit `/model ollama/<model>` umstellen, behandelt OpenClaw
dies als exakte Benutzerauswahl. Wenn die konfigurierte Ollama-`baseUrl` nicht
erreichbar ist, schlägt die nächste Antwort mit dem Provider-Fehler fehl, statt stillschweigend
von einem anderen konfigurierten Fallback-Modell zu antworten.

Isolierte Cron-Jobs führen eine zusätzliche lokale Sicherheitsprüfung aus, bevor sie den Agent-
Turn starten. Wenn das ausgewählte Modell zu einem lokalen, privaten Netzwerk- oder `.local`-
Ollama-Provider aufgelöst wird und `/api/tags` nicht erreichbar ist, zeichnet OpenClaw diesen Cron-Lauf
als `skipped` auf, mit dem ausgewählten `ollama/<model>` im Fehlertext. Der Endpoint-
Preflight wird 5 Minuten lang zwischengespeichert, sodass mehrere Cron-Jobs, die auf denselben
gestoppten Ollama-Daemon zeigen, nicht alle fehlschlagende Modellanfragen starten.

Verifizieren Sie den lokalen Textpfad, den nativen Stream-Pfad und Embeddings live gegen
lokales Ollama mit:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Für Ollama Cloud API-Key-Smoke-Tests richten Sie den Live-Test auf `https://ollama.com`
und wählen Sie ein gehostetes Modell aus dem aktuellen Katalog:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Der Cloud-Smoke-Test führt Text, nativen Stream und Websuche aus. Embeddings werden
standardmäßig für `https://ollama.com` übersprungen, weil Ollama Cloud API-Keys möglicherweise
`/api/embed` nicht autorisieren. Setzen Sie `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, wenn Sie ausdrücklich möchten,
dass der Live-Test fehlschlägt, falls der konfigurierte Cloud-Key den Embed-Endpoint nicht verwenden kann.

Um ein neues Modell hinzuzufügen, ziehen Sie es einfach mit Ollama:

```bash
ollama pull mistral
```

Das neue Modell wird automatisch erkannt und steht zur Nutzung bereit.

<Note>
Wenn Sie `models.providers.ollama` explizit setzen oder einen benutzerdefinierten Remote-Provider wie `models.providers.ollama-cloud` mit `api: "ollama"` konfigurieren, wird die automatische Erkennung übersprungen und Sie müssen Modelle manuell definieren. Benutzerdefinierte Loopback-Provider wie `http://127.0.0.2:11434` werden weiterhin als lokal behandelt. Siehe den Abschnitt zur expliziten Konfiguration unten.
</Note>

## Vision und Bildbeschreibung

Das gebündelte Ollama-Plugin registriert Ollama als bildfähigen Provider für Medienverständnis. Dadurch kann OpenClaw explizite Bildbeschreibungsanfragen und konfigurierte Standardwerte für Bildmodelle an lokale oder gehostete Ollama-Vision-Modelle weiterleiten.

Für lokale Vision ziehen Sie ein Modell, das Bilder unterstützt:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Verifizieren Sie dann mit der infer-CLI:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` muss eine vollständige `<provider/model>`-Referenz sein. Wenn sie gesetzt ist, versucht `openclaw infer image describe` zuerst dieses Modell, statt die Beschreibung zu überspringen, weil das Modell native Vision unterstützt. Wenn der Modellaufruf fehlschlägt, kann OpenClaw über konfigurierte `agents.defaults.imageModel.fallbacks` fortfahren; Fehler bei der Datei- oder URL-Vorbereitung schlagen weiterhin vor Fallback-Versuchen fehl.

Verwenden Sie `infer image describe`, wenn Sie den Bildverständnis-Provider-Flow von OpenClaw, das konfigurierte `agents.defaults.imageModel` und die Ausgabeform für Bildbeschreibungen möchten. Verwenden Sie `infer model run --file`, wenn Sie einen rohen multimodalen Modelltest mit einem benutzerdefinierten Prompt und einem oder mehreren Bildern möchten.

Um Ollama als Standardmodell für Bildverständnis bei eingehenden Medien festzulegen, konfigurieren Sie `agents.defaults.imageModel`:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

Bevorzugen Sie die vollständige `ollama/<model>`-Referenz. Wenn dasselbe Modell unter `models.providers.ollama.models` mit `input: ["text", "image"]` aufgeführt ist und kein anderer konfigurierter Bild-Provider diese bloße Modell-ID bereitstellt, normalisiert OpenClaw auch eine bloße `imageModel`-Referenz wie `qwen2.5vl:7b` zu `ollama/qwen2.5vl:7b`. Wenn mehr als ein konfigurierter Bild-Provider dieselbe bloße ID hat, verwenden Sie das Provider-Präfix explizit.

Langsame lokale Vision-Modelle können ein längeres Timeout für Bildverständnis benötigen als Cloud-Modelle. Sie können auch abstürzen oder stoppen, wenn Ollama versucht, den vollständig beworbenen Vision-Kontext auf eingeschränkter Hardware zuzuweisen. Setzen Sie ein Capability-Timeout und begrenzen Sie `num_ctx` im Modelleintrag, wenn Sie nur einen normalen Bildbeschreibungs-Turn benötigen:

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

Dieses Timeout gilt für eingehendes Bildverständnis und für das explizite `image`-Tool, das der Agent während eines Turns aufrufen kann. `models.providers.ollama.timeoutSeconds` auf Provider-Ebene steuert weiterhin den zugrunde liegenden Ollama-HTTP-Request-Guard für normale Modellaufrufe.

Verifizieren Sie das explizite Bild-Tool live gegen lokales Ollama mit:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Wenn Sie `models.providers.ollama.models` manuell definieren, markieren Sie Vision-Modelle mit Unterstützung für Bildeingaben:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw lehnt Bildbeschreibungsanfragen für Modelle ab, die nicht als bildfähig markiert sind. Bei impliziter Erkennung liest OpenClaw dies von Ollama, wenn `/api/show` eine Vision-Capability meldet.

## Konfiguration

<Tabs>
  <Tab title="Basic (implicit discovery)">
    Der einfachste Aktivierungspfad nur für lokale Nutzung erfolgt über eine Umgebungsvariable:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Wenn `OLLAMA_API_KEY` gesetzt ist, können Sie `apiKey` im Provider-Eintrag weglassen und OpenClaw füllt ihn für Verfügbarkeitsprüfungen aus.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Verwenden Sie explizite Konfiguration, wenn Sie eine gehostete Cloud-Einrichtung möchten, Ollama auf einem anderen Host/Port läuft, Sie bestimmte Kontextfenster oder Modelllisten erzwingen möchten oder vollständig manuelle Modelldefinitionen wünschen.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="Custom base URL">
    Wenn Ollama auf einem anderen Host oder Port läuft (explizite Konfiguration deaktiviert die automatische Erkennung, definieren Sie Modelle daher manuell):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
            timeoutSeconds: 300, // Optional: give cold local models longer to connect and stream
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Optional: keep the model loaded between turns
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Fügen Sie der URL nicht `/v1` hinzu. Der Pfad `/v1` verwendet den OpenAI-kompatiblen Modus, in dem Tool Calling nicht zuverlässig ist. Verwenden Sie die Basis-Ollama-URL ohne Pfadsuffix.
    </Warning>

  </Tab>
</Tabs>

## Häufige Rezepte

Verwenden Sie diese als Ausgangspunkte und ersetzen Sie Modell-IDs durch die exakten Namen aus `ollama list` oder `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    Verwenden Sie dies, wenn Ollama auf derselben Maschine wie der Gateway läuft und Sie möchten, dass OpenClaw die installierten Modelle automatisch erkennt.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Dieser Pfad hält die Konfiguration minimal. Fügen Sie keinen `models.providers.ollama`-Block hinzu, es sei denn, Sie möchten Modelle manuell definieren.

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
    Verwenden Sie native Ollama-URLs für LAN-Hosts. Fügen Sie `/v1` nicht hinzu.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow` ist das OpenClaw-seitige Kontextbudget. `params.num_ctx` wird für die Anfrage an Ollama gesendet. Halten Sie sie aufeinander abgestimmt, wenn Ihre Hardware nicht den vollständig beworbenen Kontext des Modells ausführen kann.

  </Accordion>

  <Accordion title="Ollama Cloud only">
    Verwenden Sie dies, wenn Sie keinen lokalen Daemon ausführen und gehostete Ollama-Modelle direkt nutzen möchten.

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Cloud plus local through a signed-in daemon">
    Verwenden Sie dies, wenn ein lokaler oder LAN-Ollama-Daemon mit `ollama signin` angemeldet ist und sowohl lokale Modelle als auch `:cloud`-Modelle bereitstellen soll.

    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Mehrere Ollama-Hosts">
    Verwenden Sie benutzerdefinierte Provider-IDs, wenn Sie mehr als einen Ollama-Server haben. Jeder Provider erhält seinen eigenen Host, eigene Modelle, eigene Authentifizierung, eigenes Timeout und eigene Modellreferenzen.

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    Wenn OpenClaw die Anfrage sendet, wird das aktive Provider-Präfix entfernt, sodass `ollama-large/qwen3.5:27b` Ollama als `qwen3.5:27b` erreicht.

  </Accordion>

  <Accordion title="Schlankes lokales Modellprofil">
    Einige lokale Modelle können einfache Prompts beantworten, haben aber Schwierigkeiten mit der vollständigen Tool-Oberfläche des Agents. Begrenzen Sie zunächst Tools und Kontext, bevor Sie globale Laufzeiteinstellungen ändern.

    ```json5
    {
      agents: {
        list: [
          {
            id: "local",
            experimental: {
              localModelLean: true,
            },
            model: { primary: "ollama/gemma4" },
          },
        ],
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    Verwenden Sie `compat.supportsTools: false` nur, wenn das Modell oder der Server bei Tool-Schemas zuverlässig fehlschlägt. Dies tauscht Agent-Fähigkeiten gegen Stabilität ein.
    `localModelLean` entfernt Browser-, Cron- und Nachrichten-Tools aus der direkten Agent-Oberfläche und legt größere Kataloge standardmäßig hinter strukturierten Tool-Search-Steuerelementen ab, außer wenn ein Lauf die Semantik der direkten Nachrichtenzustellung beibehalten muss. Es ändert jedoch weder Ollamas Laufzeitkontext noch den Thinking-Modus. Kombinieren Sie es mit explizitem `params.num_ctx` und `params.thinking: false` für kleine Qwen-artige Thinking-Modelle, die in Schleifen geraten oder ihr Antwortbudget für verborgenes Reasoning verbrauchen.

  </Accordion>
</AccordionGroup>

### Modellauswahl

Nach der Konfiguration sind alle Ihre Ollama-Modelle verfügbar:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

Benutzerdefinierte Ollama-Provider-IDs werden ebenfalls unterstützt. Wenn eine Modellreferenz das aktive
Provider-Präfix verwendet, zum Beispiel `ollama-spark/qwen3:32b`, entfernt OpenClaw nur dieses
Präfix, bevor Ollama aufgerufen wird, sodass der Server `qwen3:32b` empfängt.

Für langsame lokale Modelle sollten Sie Provider-spezifische Anfrageabstimmung bevorzugen, bevor Sie das
Timeout der gesamten Agent-Laufzeit erhöhen:

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` gilt für die Modell-HTTP-Anfrage, einschließlich Verbindungsaufbau,
Headern, Body-Streaming und dem gesamten geschützten Fetch-Abbruch. `params.keep_alive`
wird bei nativen `/api/chat`-Anfragen als `keep_alive` auf oberster Ebene an Ollama weitergeleitet;
legen Sie es pro Modell fest, wenn die Ladezeit des ersten Turns der Engpass ist.

### Schnelle Verifizierung

```bash
# Ollama daemon visible to this machine
curl http://127.0.0.1:11434/api/tags

# OpenClaw catalog and selected model
openclaw models list --provider ollama
openclaw models status

# Direct model smoke
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

Ersetzen Sie bei entfernten Hosts `127.0.0.1` durch den in `baseUrl` verwendeten Host. Wenn `curl` funktioniert, OpenClaw aber nicht, prüfen Sie, ob der Gateway auf einem anderen Computer, in einem Container oder unter einem anderen Dienstkonto läuft.

## Ollama-Websuche

OpenClaw unterstützt **Ollama-Websuche** als gebündelten `web_search`-Provider.

| Eigenschaft | Detail                                                                                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | Verwendet Ihren konfigurierten Ollama-Host (`models.providers.ollama.baseUrl`, wenn gesetzt, andernfalls `http://127.0.0.1:11434`); `https://ollama.com` verwendet die gehostete API direkt |
| Auth        | Ohne Schlüssel für angemeldete lokale Ollama-Hosts; `OLLAMA_API_KEY` oder konfigurierte Provider-Authentifizierung für direkte Suche über `https://ollama.com` oder auth-geschützte Hosts |
| Anforderung | Lokale/selbstgehostete Hosts müssen laufen und mit `ollama signin` angemeldet sein; direkte gehostete Suche erfordert `baseUrl: "https://ollama.com"` plus einen echten Ollama-API-Schlüssel |

Wählen Sie **Ollama-Websuche** während `openclaw onboard` oder `openclaw configure --section web`, oder legen Sie fest:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Für direkte gehostete Suche über Ollama Cloud:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

Für einen angemeldeten lokalen Daemon verwendet OpenClaw den `/api/experimental/web_search`-Proxy des Daemons. Für `https://ollama.com` ruft es den gehosteten `/api/web_search`-Endpunkt direkt auf.

<Note>
Die vollständigen Einrichtungs- und Verhaltensdetails finden Sie unter [Ollama-Websuche](/de/tools/ollama-search).
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **Tool Calling ist im OpenAI-kompatiblen Modus nicht zuverlässig.** Verwenden Sie diesen Modus nur, wenn Sie das OpenAI-Format für einen Proxy benötigen und nicht von nativem Tool-Calling-Verhalten abhängen.
    </Warning>

    Wenn Sie stattdessen den OpenAI-kompatiblen Endpunkt verwenden müssen (zum Beispiel hinter einem Proxy, der nur das OpenAI-Format unterstützt), setzen Sie `api: "openai-completions"` explizit:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Dieser Modus unterstützt Streaming und Tool Calling möglicherweise nicht gleichzeitig. Möglicherweise müssen Sie Streaming mit `params: { streaming: false }` in der Modellkonfiguration deaktivieren.

    Wenn `api: "openai-completions"` mit Ollama verwendet wird, injiziert OpenClaw standardmäßig `options.num_ctx`, damit Ollama nicht stillschweigend auf ein Kontextfenster von 4096 zurückfällt. Wenn Ihr Proxy/Upstream unbekannte `options`-Felder ablehnt, deaktivieren Sie dieses Verhalten:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Kontextfenster">
    Für automatisch erkannte Modelle verwendet OpenClaw das von Ollama gemeldete Kontextfenster, sofern verfügbar, einschließlich größerer `PARAMETER num_ctx`-Werte aus benutzerdefinierten Modelfiles. Andernfalls fällt es auf das von OpenClaw verwendete Standard-Ollama-Kontextfenster zurück.

    Sie können Provider-weite Standardwerte für `contextWindow`, `contextTokens` und `maxTokens` für jedes Modell unter diesem Ollama-Provider festlegen und sie bei Bedarf pro Modell überschreiben. `contextWindow` ist OpenClaws Prompt- und Compaction-Budget. Native Ollama-Anfragen lassen `options.num_ctx` ungesetzt, sofern Sie `params.num_ctx` nicht explizit konfigurieren, sodass Ollama sein eigenes modell-, `OLLAMA_CONTEXT_LENGTH`- oder VRAM-basiertes Standardverhalten anwenden kann. Um Ollamas Laufzeitkontext pro Anfrage zu begrenzen oder zu erzwingen, ohne ein Modelfile neu zu erstellen, setzen Sie `params.num_ctx`; ungültige, nullwertige, negative und nicht endliche Werte werden ignoriert. Wenn Sie eine ältere Konfiguration aktualisiert haben, die nur `contextWindow` oder `maxTokens` verwendet hat, um einen nativen Ollama-Anfragekontext zu erzwingen, führen Sie `openclaw doctor --fix` aus, um diese expliziten Provider- oder Modellbudgets nach `params.num_ctx` zu kopieren. Der OpenAI-kompatible Ollama-Adapter injiziert weiterhin standardmäßig `options.num_ctx` aus dem konfigurierten `params.num_ctx` oder `contextWindow`; deaktivieren Sie dies mit `injectNumCtxForOpenAICompat: false`, wenn Ihr Upstream `options` ablehnt.

    Native Ollama-Modelleinträge akzeptieren außerdem die üblichen Ollama-Laufzeitoptionen unter `params`, einschließlich `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` und `use_mmap`. OpenClaw leitet nur Ollama-Anfrageschlüssel weiter, sodass OpenClaw-Laufzeitparameter wie `streaming` nicht an Ollama weitergegeben werden. Verwenden Sie `params.think` oder `params.thinking`, um `think` auf oberster Ollama-Ebene zu senden; `false` deaktiviert Thinking auf API-Ebene für Qwen-artige Thinking-Modelle.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    Pro Modell funktioniert `agents.defaults.models["ollama/<model>"].params.num_ctx` ebenfalls. Wenn beides konfiguriert ist, gewinnt der explizite Provider-Modelleintrag gegenüber dem Agent-Standardwert.

  </Accordion>

  <Accordion title="Thinking-Steuerung">
    Für native Ollama-Modelle leitet OpenClaw die Thinking-Steuerung so weiter, wie Ollama sie erwartet: `think` auf oberster Ebene, nicht `options.think`. Automatisch erkannte Modelle, deren `/api/show`-Antwort die `thinking`-Fähigkeit enthält, stellen `/think low`, `/think medium`, `/think high` und `/think max` bereit; nicht denkende Modelle stellen nur `/think off` bereit.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Sie können auch einen Modellstandard festlegen:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    Pro Modell kann `params.think` oder `params.thinking` Ollama-API-Thinking für ein bestimmtes konfiguriertes Modell deaktivieren oder erzwingen. OpenClaw bewahrt diese expliziten Modellparameter, wenn der aktive Lauf nur den impliziten Standardwert `off` hat; Runtime-Befehle ungleich off wie `/think medium` überschreiben den aktiven Lauf weiterhin.

  </Accordion>

  <Accordion title="Reasoning-Modelle">
    OpenClaw behandelt Modelle mit Namen wie `deepseek-r1`, `reasoning` oder `think` standardmäßig als reasoning-fähig.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Es ist keine zusätzliche Konfiguration erforderlich. OpenClaw markiert sie automatisch.

  </Accordion>

  <Accordion title="Modellkosten">
    Ollama ist kostenlos und wird lokal ausgeführt, daher sind alle Modellkosten auf 0 $ gesetzt. Das gilt sowohl für automatisch erkannte als auch für manuell definierte Modelle.
  </Accordion>

  <Accordion title="Memory-Embeddings">
    Das gebündelte Ollama-Plugin registriert einen Memory-Embedding-Provider für
    [Memory-Suche](/de/concepts/memory). Es verwendet die konfigurierte Ollama-Basis-URL
    und den API-Schlüssel, ruft Ollamas aktuellen Endpunkt `/api/embed` auf und bündelt
    mehrere Memory-Abschnitte nach Möglichkeit in einer `input`-Anfrage.

    Wenn `proxy.enabled=true` ist, verwenden Ollama-Memory-Embedding-Anfragen an den exakten
    hostlokalen local loopback-Ursprung, der aus der konfigurierten `baseUrl` abgeleitet wird,
    den geschützten direkten Pfad von OpenClaw statt des verwalteten Weiterleitungs-Proxys. Der
    konfigurierte Hostname muss selbst `localhost` oder ein Loopback-IP-Literal sein;
    DNS-Namen, die lediglich zu Loopback auflösen, verwenden weiterhin den verwalteten Proxy-Pfad.
    LAN-, Tailnet-, private Netzwerk- und öffentliche Ollama-Hosts bleiben ebenfalls auf dem
    verwalteten Proxy-Pfad. Weiterleitungen zu einem anderen Host oder Port erben kein Vertrauen.
    Betreiber können weiterhin die globale Einstellung `proxy.loopbackMode: "proxy"` setzen, um
    Loopback-Datenverkehr durch den Proxy zu senden, oder `proxy.loopbackMode: "block"`, um
    Loopback-Verbindungen vor dem Öffnen einer Verbindung abzulehnen; siehe
    [Verwalteter Proxy](/de/security/network-proxy#gateway-loopback-mode) für die
    prozessweite Wirkung dieser Einstellung.

    | Eigenschaft    | Wert                |
    | ------------- | ------------------- |
    | Standardmodell | `nomic-embed-text`  |
    | Auto-pull      | Ja — das Embedding-Modell wird automatisch abgerufen, wenn es lokal nicht vorhanden ist |

    Embeddings zur Abfragezeit verwenden Retrieval-Präfixe für Modelle, die diese erfordern oder empfehlen, darunter `nomic-embed-text`, `qwen3-embedding` und `mxbai-embed-large`. Memory-Dokumentbatches bleiben unverändert, damit vorhandene Indizes keine Formatmigration benötigen.

    So wählen Sie Ollama als Embedding-Provider für die Memory-Suche aus:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Default for Ollama. Raise on larger hosts if reindexing is too slow.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    Halten Sie die Authentifizierung für einen entfernten Embedding-Host auf diesen Host beschränkt:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Streaming-Konfiguration">
    Die Ollama-Integration von OpenClaw verwendet standardmäßig die **native Ollama-API** (`/api/chat`), die Streaming und Tool-Aufrufe gleichzeitig vollständig unterstützt. Es ist keine besondere Konfiguration erforderlich.

    Für native `/api/chat`-Anfragen leitet OpenClaw außerdem die Thinking-Steuerung direkt an Ollama weiter: `/think off` und `openclaw agent --thinking off` senden `think: false` auf oberster Ebene, sofern kein expliziter Modellwert `params.think`/`params.thinking` konfiguriert ist, während `/think low|medium|high` die passende `think`-Aufwandszeichenfolge auf oberster Ebene senden. `/think max` wird Ollamas höchstem nativem Aufwand zugeordnet, `think: "high"`.

    <Tip>
    Wenn Sie den OpenAI-kompatiblen Endpunkt verwenden müssen, lesen Sie den Abschnitt „Legacy OpenAI-compatible mode“ oben. Streaming und Tool-Aufrufe funktionieren in diesem Modus möglicherweise nicht gleichzeitig.
    </Tip>

  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="WSL2-Absturzschleife (wiederholte Neustarts)">
    Unter WSL2 mit NVIDIA/CUDA erstellt der offizielle Ollama-Linux-Installer eine systemd-Einheit `ollama.service` mit `Restart=always`. Wenn dieser Dienst automatisch startet und während des WSL2-Starts ein GPU-gestütztes Modell lädt, kann Ollama Hostspeicher belegen, während das Modell geladen wird. Die Hyper-V-Speicherrückgewinnung kann diese belegten Seiten nicht immer zurückgewinnen, sodass Windows die WSL2-VM beenden kann, systemd Ollama erneut startet und sich die Schleife wiederholt.

    Typische Hinweise:

    - wiederholte WSL2-Neustarts oder -Beendigungen von Windows-Seite
    - hohe CPU-Auslastung in `app.slice` oder `ollama.service` kurz nach dem WSL2-Start
    - SIGTERM von systemd statt eines Linux-OOM-Killer-Ereignisses

    OpenClaw protokolliert beim Start eine Warnung, wenn WSL2, ein aktivierter `ollama.service` mit `Restart=always` und sichtbare CUDA-Markierungen erkannt werden.

    Abhilfe:

    ```bash
    sudo systemctl disable ollama
    ```

    Fügen Sie dies auf der Windows-Seite zu `%USERPROFILE%\.wslconfig` hinzu und führen Sie dann `wsl --shutdown` aus:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Legen Sie in der Ollama-Dienstumgebung eine kürzere Keep-alive-Zeit fest, oder starten Sie Ollama nur manuell, wenn Sie es benötigen:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Siehe [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama wird nicht erkannt">
    Stellen Sie sicher, dass Ollama ausgeführt wird, dass Sie `OLLAMA_API_KEY` (oder ein Authentifizierungsprofil) gesetzt haben und dass Sie **keinen** expliziten Eintrag `models.providers.ollama` definiert haben:

    ```bash
    ollama serve
    ```

    Prüfen Sie, ob die API erreichbar ist:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Keine Modelle verfügbar">
    Wenn Ihr Modell nicht aufgeführt ist, rufen Sie das Modell entweder lokal ab oder definieren Sie es explizit in `models.providers.ollama`.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Verbindung abgelehnt">
    Prüfen Sie, ob Ollama auf dem richtigen Port ausgeführt wird:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Entfernter Host funktioniert mit curl, aber nicht mit OpenClaw">
    Prüfen Sie dies von derselben Maschine und Runtime aus, auf der der Gateway läuft:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Häufige Ursachen:

    - `baseUrl` zeigt auf `localhost`, aber der Gateway läuft in Docker oder auf einem anderen Host.
    - Die URL verwendet `/v1`, wodurch OpenAI-kompatibles Verhalten statt nativem Ollama ausgewählt wird.
    - Der entfernte Host benötigt Firewall- oder LAN-Binding-Änderungen auf Ollama-Seite.
    - Das Modell ist auf dem Daemon Ihres Laptops vorhanden, aber nicht auf dem entfernten Daemon.

  </Accordion>

  <Accordion title="Modell gibt Tool-JSON als Text aus">
    Das bedeutet normalerweise, dass der Provider den OpenAI-kompatiblen Modus verwendet oder das Modell keine Tool-Schemas verarbeiten kann.

    Bevorzugen Sie den nativen Ollama-Modus:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    Wenn ein kleines lokales Modell bei Tool-Schemas weiterhin fehlschlägt, setzen Sie `compat.supportsTools: false` für diesen Modelleintrag und testen Sie erneut.

  </Accordion>

  <Accordion title="Kimi oder GLM gibt verstümmelte Symbole zurück">
    Gehostete Kimi/GLM-Antworten, die lange, nichtsprachliche Symbolfolgen sind, werden als fehlgeschlagene Provider-Ausgabe statt als erfolgreiche Assistentenantwort behandelt. Dadurch können normale Wiederholungs-, Fallback- oder Fehlerbehandlungen übernehmen, ohne den beschädigten Text in der Sitzung zu speichern.

    Wenn dies wiederholt auftritt, erfassen Sie den rohen Modellnamen, die aktuelle Sitzungsdatei und ob der Lauf `Cloud + Local` oder `Cloud only` verwendet hat. Versuchen Sie dann eine neue Sitzung und ein Fallback-Modell:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Kaltes lokales Modell überschreitet das Zeitlimit">
    Große lokale Modelle können vor Beginn des Streamings eine lange erste Ladezeit benötigen. Beschränken Sie das Zeitlimit auf den Ollama-Provider und bitten Sie Ollama optional, das Modell zwischen Turns geladen zu halten:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    Wenn der Host selbst Verbindungen nur langsam annimmt, verlängert `timeoutSeconds` auch das geschützte Undici-Verbindungszeitlimit für diesen Provider.

  </Accordion>

  <Accordion title="Modell mit großem Kontext ist zu langsam oder hat nicht genug Arbeitsspeicher">
    Viele Ollama-Modelle geben Kontexte an, die größer sind, als Ihre Hardware komfortabel ausführen kann. Natives Ollama verwendet Ollamas eigenen Standard für den Runtime-Kontext, sofern Sie `params.num_ctx` nicht setzen. Begrenzen Sie sowohl das Budget von OpenClaw als auch den Anfragekontext von Ollama, wenn Sie eine vorhersagbare Latenz bis zum ersten Token wünschen:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    Senken Sie zuerst `contextWindow`, wenn OpenClaw zu viel Prompt sendet. Senken Sie `params.num_ctx`, wenn Ollama einen Runtime-Kontext lädt, der für die Maschine zu groß ist. Senken Sie `maxTokens`, wenn die Generierung zu lange läuft.

  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Übersicht über alle Provider, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/models" icon="brain">
    So wählen und konfigurieren Sie Modelle.
  </Card>
  <Card title="Ollama-Websuche" href="/de/tools/ollama-search" icon="magnifying-glass">
    Vollständige Einrichtungs- und Verhaltensdetails für die Ollama-gestützte Websuche.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz.
  </Card>
</CardGroup>
