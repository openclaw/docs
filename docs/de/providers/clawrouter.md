---
read_when:
    - Sie möchten einen zentral verwalteten Schlüssel für mehrere Modell-Provider.
    - Sie benötigen die ClawRouter-Modellerkennung oder Kontingentberichte in OpenClaw
summary: Modelle mit Anmeldedatenbereich über ClawRouter weiterleiten und verwaltete Kontingente anzeigen
title: ClawRouter
x-i18n:
    generated_at: "2026-07-16T13:11:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 684405818b701448b37431302b0c2cc66e106c2c6d482545569d9dfc7f7fe8e5
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter stellt OpenClaw einen richtliniengebundenen Schlüssel für mehrere
vorgelagerte Modell-Provider bereit. Das gebündelte Plugin `clawrouter` erkennt nur die
für diesen Schlüssel zugelassenen Modelle, leitet jedes Modell über sein deklariertes
Protokoll weiter und zeigt das Budget sowie die aggregierte Nutzung des Schlüssels
in den Nutzungsansichten von OpenClaw an.

Vorgelagerte Zugangsdaten und Provider-spezifische Weiterleitungen verbleiben in
ClawRouter, sodass Sie nicht jedes vorgelagerte Provider-Plugin auf dem
OpenClaw-Host installieren oder authentifizieren müssen. Das Plugin ist im Lieferumfang
von OpenClaw enthalten (`enabledByDefault: true`); Sie benötigen lediglich ausgestellte
ClawRouter-Zugangsdaten.

| Eigenschaft    | Wert                                     |
| -------------- | ---------------------------------------- |
| Provider       | `clawrouter`                       |
| Plugin         | gebündelt (in OpenClaw enthalten)        |
| Authentifizierung | `CLAWROUTER_API_KEY`                   |
| Standard-URL   | `https://clawrouter.openclaw.ai`                       |
| Modellkatalog  | Über `/v1/catalog` auf die Zugangsdaten beschränkt |
| Kontingente    | Monatliches Budget und Nutzung über `/v1/usage` |

## Erste Schritte

<Steps>
  <Step title="Richtliniengebundene Zugangsdaten erhalten">
    Bitten Sie Ihre ClawRouter-Administration um Zugangsdaten, deren Richtlinie
    die Provider, Modelle und das monatliche Budget umfasst, die Sie verwenden
    sollen. Zugangsdaten werden bei der Ausstellung einmalig angezeigt.
  </Step>
  <Step title="OpenClaw konfigurieren">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` ist gebündelt und standardmäßig aktiviert. Wenn Ihre
    Konfiguration `plugins.allow` festlegt, fügen Sie dieser Liste vor der
    Aktivierung `clawrouter` hinzu. Legen Sie bei einer benutzerdefinierten
    Bereitstellung `models.providers.clawrouter.baseUrl` auf den ClawRouter-Ursprung fest; der
    Standardwert ist `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Freigegebene Modelle auflisten">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Verwenden Sie die zurückgegebenen Modellreferenzen genau wie angezeigt.
    Sie behalten den vorgelagerten Namensraum bei, beispielsweise
    `clawrouter/openai/gpt-5.5`, `clawrouter/anthropic/claude-sonnet-4-6` oder
    `clawrouter/google/gemini-3.5-flash`. Wenn `agents.defaults.models` in Ihrer
    Konfiguration eine Zulassungsliste ist, fügen Sie ihr jede ausgewählte
    ClawRouter-Referenz hinzu.

  </Step>
  <Step title="Modell auswählen">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    Sie können mit `openclaw agent --model clawrouter/<provider>/<model> --message "..."` auch ein zurückgegebenes Modell für einen
    einzelnen Lauf auswählen.

  </Step>
</Steps>

## Verwaltete nicht interaktive Bereitstellung

Bewahren Sie den Proxy-Schlüssel in der Secret-Injektion der Workload auf und
speichern Sie in `openclaw.json` ausschließlich eine SecretRef. Die
kanonischen verwalteten Felder sind:

| Zweck             | Konfigurations- oder Umgebungsfeld                                      |
| ----------------- | ------------------------------------------------------------------------ |
| Router-Ursprung   | `models.providers.clawrouter.baseUrl`                                                       |
| Zugangsdaten      | `models.providers.clawrouter.apiKey` -> Umgebungs-SecretRef                                |
| Secret-Wert       | `CLAWROUTER_API_KEY` in der Prozessumgebung des Gateways                   |
| Standardmodell    | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`                                |
| Workload-Kennung  | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (optional)                                            |

Beispielsweise kann ein Bereitstellungscontroller diesen JSON5-Patch verwalten:

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

Wenn die Bereitstellung `plugins.allow` festlegt, behalten Sie die vorhandenen
Einträge bei und fügen Sie `clawrouter` hinzu. Validieren und übernehmen
Sie den Patch ohne interaktiven Assistenten:

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

Der Probelauf löst die SecretRef auf, gibt ihren Wert jedoch niemals aus. Um die
Zugangsdaten zu rotieren, aktualisieren Sie das externe Secret, das
`CLAWROUTER_API_KEY` bereitstellt, und starten Sie die Gateway-Workload neu,
damit die neue Prozessumgebung geladen wird. Die Konfigurationsdatei und die
Modellreferenz ändern sich nicht.

Bei einem aus dem Quellcode erstellten eigenständigen Docker-Gateway ist
ClawRouter bereits in der Root-Laufzeit enthalten. Wählen Sie nur das
Kanal-Plugin aus, das separat paketiert werden muss, beispielsweise
`OPENCLAW_EXTENSIONS=clickclack`, `slack` oder `msteams`; siehe
[aus dem Quellcode erstellte Images mit ausgewählten Plugins](/de/install/docker#source-built-images-with-selected-plugins).
Archiv-/Appliance-Bereitstellungen müssen denselben übernommenen Quellcode über
ihre eigene Artefakt-Pipeline paketieren, anstatt das OCI-Image zu verwenden.

## Bereitschaft und Live-Nachweis

Diese Prüfungen weisen unterschiedliche Grenzen nach; ersetzen Sie keine durch
eine andere:

```bash
# Nur Prozesszustand von ClawRouter; weder Zugangsdaten noch ein vorgelagertes Modell werden verwendet.
curl -fsS https://clawrouter.internal.example/v1/health

# Nur Startbereitschaft des OpenClaw-Gateways; es erfolgt kein Modellaufruf.
curl -fsS http://127.0.0.1:18789/readyz

# Auf die Zugangsdaten beschränkte Katalogerkennung.
openclaw models list --all --provider clawrouter --json

# Minimaler echter Inferenztest über den konfigurierten ClawRouter-Provider.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# Workload-Canary mit einer exakten freigegebenen Modellreferenz.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Antworten Sie exakt mit: CLAWROUTER_CANARY_OK" \
  --json
```

Verwenden Sie ein vom richtliniengebundenen Katalog zurückgegebenes Modell,
anstatt das Beispielmodell ungeprüft zu kopieren. Eine erfolgreiche
`/readyz`-Antwort bedeutet, dass das Gateway Anfragen verarbeiten kann;
sie besagt nicht, dass ClawRouter, dessen Zugangsdaten oder ein vorgelagerter
Provider bereit sind. Der Modelltest und der Agent-Canary sind die
Inferenznachweise.

Führen Sie zur Live-Diagnose den Canary aus und prüfen Sie die Standardprotokolle
des Gateways. Die vorhandene, ausschließlich metadatenbasierte
Modelltransportdiagnose gibt Zeilen in folgender Form aus:

```text
[model-fetch] Start Provider=clawrouter API=openai-responses Modell=openai/gpt-5.5 Methode=POST URL=https://clawrouter.internal.example/v1/responses
[model-fetch] Antwort Provider=clawrouter API=openai-responses Modell=openai/gpt-5.5 Status=200
```

Das Plugin sendet begrenzte Header `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id` und
`X-ClawRouter-Session-Id`, wenn diese Kennungen verfügbar sind. Es ordnet außerdem
die Diagnosekennung `callId` (`<run-id>:model:<n>`) des Modellaufrufs
`X-Request-ID` zu, sodass ein OpenClaw-Modellaufrufereignis mit dem
ausschließlich metadatenbasierten Audit-Trail von ClawRouter verknüpft werden
kann. Werte innerhalb des 128-Zeichen-Budgets für Anfrage-IDs sind identisch.
Längere Werte behalten das Suffix `:model:<n>` und einen deterministischen
Hash, damit unterschiedliche Aufrufe begrenzt und verknüpfbar bleiben.
Statische Bereitstellungsmetadaten wie `X-ClawRouter-Project-Id` können in der
Provider-Map `headers` festgelegt werden. Header zur Agent- und
Sitzungszuordnung behalten ihre separate Begrenzung auf 256 Zeichen.
Automatische Anfrage-IDs mit Zeichen außerhalb des ASCII-Kennungssatzes von
ClawRouter verwenden dieselbe deterministische begrenzte Form.
Explizit konfigurierte Header, einschließlich aller Schreibweisen von
`X-Request-ID`, haben Vorrang vor automatischen Werten. Die
Transportdiagnose zeichnet Routing- und Antwortmetadaten auf; sie protokolliert
keine Zugangsdaten, Anfrage-IDs, Prompts oder Vervollständigungen. Das
ClawRouter-eigene Audit-Ereignis stellt den ausgewählten vorgelagerten Provider
und den Status der Inhaltsaufbewahrung bereit.

## Modellerkennung

`GET /v1/catalog` gibt `{ providers: [...] }` zurück, wobei jeder Provider-Eintrag
seine eigenen `models[]` (mit vorgelagerter ID, Funktionen und Preisen)
sowie seine unterstützten Anfragerouten auflistet. OpenClaw enthält keine zweite,
feste Liste von ClawRouter-Modellen. Ein Katalogmodell wird als OpenClaw-Modell
angeboten, wenn:

- die Richtlinie der Zugangsdaten dessen Provider freigibt;
- das Katalogmodell eine unterstützte LLM-Funktion ausweist
  (`llm.responses`, `llm.chat`, `llm.messages` oder
  `llm.stream` mit einer passenden Streaming-Route); und
- der Provider eine passende Route für einen der nachstehenden
  Transporte bereitstellt.

Das Hinzufügen eines Modells zu einem unterstützten ClawRouter-Provider
erfordert keine OpenClaw-Veröffentlichung: Bei der nächsten Katalogaktualisierung
(pro Zugangsdatenbereich 60 Sekunden zwischengespeichert) wird es erkannt.
Ein Modell, das ein neues Übertragungsprotokoll benötigt, erfordert zunächst
Unterstützung durch das Plugin.

## Protokoll- und Provider-Plugins

ClawRouter verwaltet die vorgelagerten Zugangsdaten; sein Katalog teilt OpenClaw
mit, welcher Transport zu verwenden ist, sodass Sie nicht das
Authentifizierungs-Plugin jedes vorgelagerten Unternehmens installieren müssen.

| Katalogfunktion/-route                                  | OpenClaw-Transport      |
| ------------------------------------------------------- | ----------------------- |
| `llm.responses` (OpenAI-kompatibler Provider)        | `openai-responses`      |
| `llm.chat` (OpenAI-kompatibler Provider)        | `openai-completions`      |
| `llm.messages` + Route `anthropic.messages`           | `anthropic-messages`      |
| `llm.stream` + Streaming-Route `google.generate_content` | `google-generative-ai`      |

Das Plugin wendet außerdem die passenden Wiederholungs- und
Werkzeugschema-Richtlinien für diese Familien an
(OpenAI-/DeepSeek-/Gemini-/Perplexity-Werkzeugschemakompatibilität sowie native
Wiederholungsrichtlinien für Anthropic und Google Gemini). Perplexity-Modelle
erhalten eine strikte Schemaumschreibung: `patternProperties` und
`additionalProperties` werden entfernt und jedes Objektschema deklariert
`properties`, da Perplexity Werkzeugschemas ohne diese Angaben ablehnt.
Ein Katalog-Provider, der ausschließlich ein nicht unterstütztes Anfrageformat
bereitstellt, wird bewusst nicht als OpenClaw-Textmodell angeboten.
Normalisieren Sie diese Provider in ClawRouter auf einen der unterstützten
Verträge, anstatt eine inkompatible Nutzlast zu senden.

## Kontingente und Nutzung

Die Antwort `/v1/usage` von ClawRouter speist die regulären
Provider-Nutzungsansichten von OpenClaw: Anfrage-, Token- und Ausgabensummen
sowie ein monatliches Budgetfenster, wenn der Schlüssel über ein Limit verfügt.
Schlüssel ohne Verbrauchsmessung zeigen weiterhin die aggregierte Nutzung,
jedoch ohne Prozentfenster.

Die Kontingentabfrage verwendet denselben richtliniengebundenen Schlüssel wie
die Modellerkennung. Eine fehlgeschlagene Kontingentabfrage blockiert die
Modellausführung nicht.

Prüfen Sie den aktuellen Snapshot mit:

```bash
openclaw status --usage
openclaw models status
```

Derselbe Provider-Snapshot steht `/status` im Chat und in der
Nutzungsoberfläche von OpenClaw zur Verfügung. Das Budget gilt für die gesamte
Richtlinie, sodass Anfragen eines anderen Clients mit derselben
ClawRouter-Richtlinie den verbleibenden Prozentsatz ändern können.

## Fehlerbehebung

| Symptom                                  | Prüfung                                                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Keine ClawRouter-Modelle                 | Bestätigen Sie, dass das Plugin aktiviert und durch `plugins.allow` zugelassen ist, und prüfen Sie anschließend, ob die Zugangsdaten aktiv sind und mindestens einen bereiten Provider freigeben. |
| Ein konfiguriertes ClawRouter-Modell fehlt | Prüfen Sie dessen Funktion `/v1/catalog` und die Routenunterstützung. Nicht unterstützte Transportverträge werden bewusst herausgefiltert. |
| `Unknown model: clawrouter/...`                       | Fügen Sie die exakte Katalogreferenz `agents.defaults.models` hinzu, wenn diese Konfigurations-Map als Zulassungsliste verwendet wird. |
| `401` oder `403` vom Katalog oder der Nutzung | Stellen Sie die ClawRouter-Zugangsdaten erneut aus oder passen Sie deren Geltungsbereich an; OpenClaw greift nicht auf Schlüssel vorgelagerter Provider zurück. |
| Modellaufruf schlägt nach der Erkennung fehl | Prüfen Sie die Provider-Verbindung und den Zustand des vorgelagerten Dienstes in ClawRouter und versuchen Sie es erneut, nachdem dessen Bereitschaft wiederhergestellt wurde. |
| Nutzung enthält Summen, aber keinen Prozentsatz | Die Richtlinie wird nicht verbrauchsabhängig gemessen; fügen Sie in ClawRouter ein monatliches Budget hinzu, um ein Prozentfenster bereitzustellen. |

## Sicherheitsverhalten

- Die Katalogermittlung ist auf den konfigurierten Proxy-Schlüssel beschränkt und wird pro Anmeldedatenbereich zwischengespeichert (Agent-Verzeichnis, Arbeitsbereichsverzeichnis, Authentifizierungsprofil-ID und Basis-URL).
- Der Proxy-Schlüssel wird erst beim Senden der Anfrage angefügt; er wird nicht in den Modellmetadaten gespeichert.
- Werte für die automatische Zuordnung und Anfragekorrelation werden vor dem Senden gekürzt und bei enthaltenen Steuerzeichen abgelehnt. Zuordnungswerte sind auf 256 Zeichen begrenzt, Anfrage-IDs auf 128.
- Diagnosedaten zum Modelltransport enthalten ausschließlich Metadaten und niemals den Proxy-Schlüssel oder Modellinhalte.
- Native Modell-IDs von Anthropic und Gemini werden erst beim Senden in ihre Upstream-IDs umgeschrieben.
- Nicht unterstützte oder nicht freigegebene Katalogzeilen werden standardmäßig abgelehnt und können nicht ausgewählt werden.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Provider-Konfiguration und Modellauswahl.
  </Card>
  <Card title="Nutzungsverfolgung" href="/de/concepts/usage-tracking" icon="chart-line">
    Oberflächen für Nutzung und Status von OpenClaw.
  </Card>
</CardGroup>
