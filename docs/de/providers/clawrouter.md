---
read_when:
    - Sie möchten einen verwalteten Schlüssel für mehrere Modell-Provider.
    - Sie benötigen die ClawRouter-Modellerkennung oder Kontingentberichte in OpenClaw
summary: Modelle mit Anmeldedatenbereich über ClawRouter weiterleiten und verwaltete Kontingente anzeigen
title: ClawRouter
x-i18n:
    generated_at: "2026-07-12T15:51:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b9a83253b5de3022bb3d3113427e5183f4ac537161ed75723fec0dafc33ebb00
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter stellt OpenClaw einen richtliniengebundenen Schlüssel für mehrere vorgelagerte Modell-
Provider bereit. Das gebündelte Plugin `clawrouter` erkennt nur die für
diesen Schlüssel zulässigen Modelle, leitet jedes Modell über sein deklariertes Protokoll weiter und zeigt
das Budget des Schlüssels sowie die aggregierte Nutzung in den OpenClaw-Nutzungsansichten an.

Vorgelagerte Anmeldedaten und providerspezifische Weiterleitungen verbleiben in ClawRouter, sodass
Sie nicht jedes vorgelagerte Provider-Plugin auf dem
OpenClaw-Host installieren oder authentifizieren müssen. Das Plugin wird gebündelt mit OpenClaw ausgeliefert (`enabledByDefault: true`);
Sie benötigen lediglich von ClawRouter ausgestellte Anmeldedaten.

| Eigenschaft     | Wert                                     |
| --------------- | ---------------------------------------- |
| Provider        | `clawrouter`                             |
| Plugin          | gebündelt (in OpenClaw enthalten)        |
| Authentifizierung | `CLAWROUTER_API_KEY`                   |
| Standard-URL    | `https://clawrouter.openclaw.ai`         |
| Modellkatalog   | Anmeldedatengebunden über `/v1/catalog`  |
| Kontingente     | Monatsbudget und Nutzung über `/v1/usage` |

## Erste Schritte

<Steps>
  <Step title="Richtliniengebundene Anmeldedaten erhalten">
    Bitten Sie Ihren ClawRouter-Administrator um Anmeldedaten, deren Richtlinie
    die Provider, Modelle und das Monatsbudget umfasst, die Sie verwenden sollen. Anmeldedaten werden
    bei der Ausstellung einmalig angezeigt.
  </Step>
  <Step title="OpenClaw konfigurieren">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` ist gebündelt und standardmäßig aktiviert. Wenn Ihre Konfiguration
    `plugins.allow` festlegt, fügen Sie `clawrouter` dieser Liste hinzu, bevor Sie es aktivieren. Legen Sie für eine
    benutzerdefinierte Bereitstellung `models.providers.clawrouter.baseUrl` auf den
    ClawRouter-Ursprung fest; der Standardwert ist `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Freigegebene Modelle auflisten">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Verwenden Sie die zurückgegebenen Modellreferenzen exakt wie angezeigt. Sie behalten den vorgelagerten
    Namespace bei, beispielsweise `clawrouter/openai/gpt-5.5`,
    `clawrouter/anthropic/claude-sonnet-4-6` oder
    `clawrouter/google/gemini-3.5-flash`. Wenn `agents.defaults.models` in Ihrer
    Konfiguration eine Positivliste ist, fügen Sie ihr jede ausgewählte ClawRouter-Referenz hinzu.

  </Step>
  <Step title="Modell auswählen">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    Sie können ein zurückgegebenes Modell auch für einen einzelnen Durchlauf mit
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."` auswählen.

  </Step>
</Steps>

## Verwaltete nicht interaktive Bereitstellung

Bewahren Sie den Proxy-Schlüssel in der Secret-Einspeisung der Workload auf und speichern Sie in
`openclaw.json` nur eine SecretRef. Die kanonischen verwalteten Felder sind:

| Zweck              | Konfigurations- oder Umgebungsfeld                                       |
| ------------------ | ------------------------------------------------------------------------ |
| Router-Ursprung    | `models.providers.clawrouter.baseUrl`                                    |
| Anmeldedaten       | `models.providers.clawrouter.apiKey` -> env SecretRef                    |
| Secret-Wert        | `CLAWROUTER_API_KEY` in der Umgebung des Gateway-Prozesses               |
| Standardmodell     | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`       |
| Workload-Kennung   | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (optional) |

Beispielsweise kann ein Bereitstellungscontroller Eigentümer dieses JSON5-Patches sein:

```json5
{
  plugins: {
    entries: { clawrouter: { enabled: true } },
  },
  models: {
    providers: {
      clawrouter: {
        baseUrl: "https://clawrouter.internal.example",
        apiKey: {
          source: "env",
          provider: "default",
          id: "CLAWROUTER_API_KEY",
        },
        headers: {
          "X-ClawRouter-Project-Id": "fakeco",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "clawrouter/openai/gpt-5.5" },
    },
  },
}
```

Wenn die Bereitstellung `plugins.allow` festlegt, behalten Sie die vorhandenen Einträge bei und fügen Sie
`clawrouter` hinzu. Validieren und übernehmen Sie die Konfiguration ohne interaktiven Assistenten:

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

Der Probelauf löst die SecretRef auf, gibt ihren Wert jedoch niemals aus. Um die
Anmeldedaten zu rotieren, aktualisieren Sie das externe Secret, das `CLAWROUTER_API_KEY` bereitstellt, und
starten Sie die Gateway-Workload neu, damit die neue Prozessumgebung geladen wird. Die
Konfigurationsdatei und die Modellreferenz ändern sich nicht.

Für ein aus dem Quellcode erstelltes eigenständiges Docker-Gateway ist ClawRouter bereits in
der Root-Laufzeit enthalten. Wählen Sie nur das Kanal-Plugin aus, das separat paketiert werden muss,
beispielsweise `OPENCLAW_EXTENSIONS=clickclack`, `slack` oder `msteams`; siehe
[aus dem Quellcode erstellte Images mit ausgewählten Plugins](/de/install/docker#source-built-images-with-selected-plugins).
Archiv-/Appliance-Bereitstellungen müssen denselben übernommenen Quellcode über ihre
eigene Artefakt-Pipeline paketieren, statt das OCI-Image zu verwenden.

## Bereitschaft und Live-Nachweis

Diese Prüfungen weisen unterschiedliche Grenzen nach; ersetzen Sie keine durch eine andere:

```bash
# Nur Prozesszustand von ClawRouter; weder Anmeldedaten noch ein vorgelagertes Modell werden verwendet.
curl -fsS https://clawrouter.internal.example/v1/health

# Nur Startbereitschaft des OpenClaw-Gateways; es erfolgt kein Modellaufruf.
curl -fsS http://127.0.0.1:18789/readyz

# Anmeldedatengebundene Katalogerkennung.
openclaw models list --all --provider clawrouter --json

# Minimaler echter Inferenztest über den konfigurierten ClawRouter-Provider.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# Workload-Canary mit einer exakten freigegebenen Modellreferenz.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Antworten Sie exakt: CLAWROUTER_CANARY_OK" \
  --json
```

Verwenden Sie ein vom richtliniengebundenen Katalog zurückgegebenes Modell, anstatt das Beispielmodell
blind zu kopieren. Eine erfolgreiche `/readyz`-Antwort bedeutet, dass das Gateway
Anfragen verarbeiten kann; sie besagt nicht, dass ClawRouter, seine Anmeldedaten oder ein vorgelagerter
Provider bereit sind. Der Modelltest und der Agent-Canary sind die Inferenznachweise.

Führen Sie für eine Live-Diagnose den Canary aus und prüfen Sie die Standardprotokolle des Gateways.
Die vorhandene, ausschließlich Metadaten erfassende Modelltransportdiagnose gibt Zeilen in folgender Form aus:

```text
[model-fetch] Start Provider=clawrouter API=openai-responses Modell=openai/gpt-5.5 Methode=POST URL=https://clawrouter.internal.example/v1/responses
[model-fetch] Antwort Provider=clawrouter API=openai-responses Modell=openai/gpt-5.5 Status=200
```

Das Plugin sendet begrenzte Header `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id` und
`X-ClawRouter-Session-Id`, wenn diese Bezeichner verfügbar sind. Außerdem
ordnet es die diagnostische `callId` des Modellaufrufs (`<run-id>:model:<n>`)
`X-Request-ID` zu, sodass ein OpenClaw-Modellaufrufereignis mit dem ausschließlich
Metadaten enthaltenden Audit-Trail von ClawRouter verknüpft werden kann. Werte innerhalb des
Budgets von 128 Zeichen für die Anfrage-ID sind identisch. Längere Werte behalten das Suffix
`:model:<n>` und einen deterministischen Hash bei, sodass verschiedene Aufrufe begrenzt und
verknüpfbar bleiben. Statische Bereitstellungsmetadaten wie
`X-ClawRouter-Project-Id` können in der Provider-Map `headers` festgelegt werden.
Header zur Agent- und Sitzungszuordnung behalten ihre separate Grenze von 256 Zeichen bei.
Automatische Anfrage-IDs mit Zeichen außerhalb des ASCII-Bezeichnersatzes von ClawRouter
verwenden dieselbe deterministische, begrenzte Form.
Explizit konfigurierte Header, einschließlich aller Varianten der Groß-/Kleinschreibung von `X-Request-ID`, haben
Vorrang vor automatischen Werten. Die Transportdiagnose zeichnet Routing- und Antwortmetadaten
auf; sie protokolliert weder Anmeldedaten, Anfrage-IDs, Prompts noch Vervollständigungen.
Das eigene Audit-Ereignis von ClawRouter stellt den ausgewählten vorgelagerten Provider und
den Zustand der Inhaltsaufbewahrung bereit.

## Modellerkennung

`GET /v1/catalog` gibt `{ providers: [...] }` zurück, wobei jeder Provider-Eintrag
seine eigenen `models[]` (mit vorgelagerter ID, Fähigkeiten und Preisen) sowie seine
unterstützten Anfragerouten auflistet. OpenClaw liefert keine zweite, feste Liste von
ClawRouter-Modellen aus. Ein Katalogmodell wird als OpenClaw-Modell angeboten, wenn:

- die Richtlinie der Anmeldedaten seinen Provider freigibt;
- das Katalogmodell eine unterstützte LLM-Fähigkeit angibt (`llm.responses`,
  `llm.chat`, `llm.messages` oder `llm.stream` mit einer passenden Streaming-
  Route); und
- der Provider eine passende Route für einen der folgenden Transporte bereitstellt.

Das Hinzufügen eines Modells zu einem unterstützten ClawRouter-Provider erfordert keine OpenClaw-Version:
Bei der nächsten Katalogaktualisierung (60 Sekunden pro Anmeldedatenbereich zwischengespeichert) wird
es erkannt. Ein Modell, das ein neues Übertragungsprotokoll benötigt, erfordert zunächst Unterstützung durch das Plugin.

## Protokoll- und Provider-Plugins

ClawRouter verwaltet die vorgelagerten Anmeldedaten; sein Katalog teilt OpenClaw mit, welchen
Transport es verwenden soll, sodass Sie nicht das Authentifizierungs-Plugin jedes vorgelagerten Unternehmens installieren müssen.

| Katalogfähigkeit/-route                                  | OpenClaw-Transport      |
| -------------------------------------------------------- | ---------------------- |
| `llm.responses` (OpenAI-kompatibler Provider)            | `openai-responses`     |
| `llm.chat` (OpenAI-kompatibler Provider)                 | `openai-completions`   |
| `llm.messages` + Route `anthropic.messages`              | `anthropic-messages`   |
| `llm.stream` + Streaming-Route `google.generate_content` | `google-generative-ai` |

Das Plugin wendet außerdem die passenden Richtlinien für Replay und Tool-Schemas für diese
Familien an (Tool-Schema-Kompatibilität für OpenAI/DeepSeek/Gemini; native Replay-Richtlinien für Anthropic und
Google Gemini). Ein Katalog-Provider, der nur ein
nicht unterstütztes Anfrageformat bereitstellt, wird absichtlich nicht als OpenClaw-
Textmodell angeboten. Normalisieren Sie solche Provider in ClawRouter auf einen der unterstützten Verträge,
anstatt eine inkompatible Nutzlast zu senden.

## Kontingente und Nutzung

Die Antwort von ClawRouter unter `/v1/usage` speist die normalen OpenClaw-Ansichten für die
Provider-Nutzung: Gesamtwerte für Anfragen, Token und Ausgaben sowie ein monatliches Budgetfenster, wenn
der Schlüssel eine Begrenzung hat. Schlüssel ohne Verbrauchsmessung zeigen weiterhin die aggregierte Nutzung ohne ein
Prozentfenster an.

Die Kontingentabfrage verwendet denselben richtliniengebundenen Schlüssel wie die Modellerkennung. Eine fehlgeschlagene
Kontingentabfrage blockiert die Modellausführung nicht.

Prüfen Sie die Live-Momentaufnahme mit:

```bash
openclaw status --usage
openclaw models status
```

Dieselbe Provider-Momentaufnahme steht `/status` im Chat und der
Nutzungsoberfläche von OpenClaw zur Verfügung. Das Budget gilt richtlinienweit, sodass Anfragen eines anderen Clients, der
dieselbe ClawRouter-Richtlinie verwendet, den verbleibenden Prozentsatz verändern können.

## Fehlerbehebung

| Symptom                                  | Prüfung                                                                                                                                               |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keine ClawRouter-Modelle                 | Bestätigen Sie, dass das Plugin aktiviert und durch `plugins.allow` zugelassen ist, und prüfen Sie dann, ob die Anmeldedaten aktiv sind und mindestens einen bereiten Provider freigeben. |
| Ein konfiguriertes ClawRouter-Modell fehlt | Prüfen Sie die Unterstützung seiner Fähigkeit und Route in `/v1/catalog`. Nicht unterstützte Transportverträge werden absichtlich herausgefiltert.   |
| `Unknown model: clawrouter/...`          | Fügen Sie die exakte Katalogreferenz zu `agents.defaults.models` hinzu, wenn diese Konfigurations-Map als Positivliste verwendet wird.                  |
| `401` oder `403` von Katalog oder Nutzung | Stellen Sie die ClawRouter-Anmeldedaten neu oder mit einem angepassten Geltungsbereich aus; OpenClaw greift nicht auf Schlüssel vorgelagerter Provider zurück. |
| Modellaufruf schlägt nach der Erkennung fehl | Prüfen Sie in ClawRouter die Provider-Verbindung und den Zustand des vorgelagerten Dienstes und versuchen Sie es erneut, nachdem dessen Bereitschaft wiederhergestellt ist. |
| Nutzung enthält Gesamtwerte, aber keinen Prozentsatz | Die Richtlinie hat keine Verbrauchsmessung; fügen Sie in ClawRouter ein Monatsbudget hinzu, um ein Prozentfenster bereitzustellen.                      |

## Sicherheitsverhalten

- Die Katalogerkennung ist auf den konfigurierten Proxy-Schlüssel beschränkt und wird pro Anmeldedatenbereich zwischengespeichert (Agent-Verzeichnis, Workspace-Verzeichnis, Authentifizierungsprofil-ID und Basis-URL).
- Der Proxy-Schlüssel wird erst beim Senden der Anfrage angefügt; er wird nicht in den Modellmetadaten gespeichert.
- Werte für die automatische Zuordnung und Anfragekorrelation werden vor dem Senden von Leerzeichen bereinigt und bei enthaltenen Steuerzeichen abgelehnt. Zuordnungswerte sind auf 256 Zeichen begrenzt, Anfrage-IDs auf 128.
- Modelltransportdiagnosen enthalten ausschließlich Metadaten und niemals den Proxy-Schlüssel oder Modellinhalte.
- Native Anthropic- und Gemini-Modell-IDs werden erst beim Senden in ihre Upstream-IDs umgeschrieben.
- Nicht unterstützte oder nicht freigegebene Katalogeinträge werden nach dem Fail-Closed-Prinzip abgelehnt und können nicht ausgewählt werden.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Provider-Konfiguration und Modellauswahl.
  </Card>
  <Card title="Nutzungsverfolgung" href="/de/concepts/usage-tracking" icon="chart-line">
    OpenClaw-Oberflächen für Nutzung und Status.
  </Card>
</CardGroup>
