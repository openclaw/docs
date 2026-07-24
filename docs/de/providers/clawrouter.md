---
read_when:
    - Sie möchten einen verwalteten Schlüssel für mehrere Modell-Provider verwenden
    - Sie benötigen die ClawRouter-Modellerkennung oder Kontingentberichte in OpenClaw
summary: Modelle mit Anmeldedatenbereich über ClawRouter weiterleiten und verwaltete Kontingente anzeigen
title: ClawRouter
x-i18n:
    generated_at: "2026-07-24T05:11:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 929a93e8d1d003e21f792d0fdab9542553ffab374f59d4d0505819b0f719591f
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter stellt OpenClaw einen richtliniengebundenen Schlüssel für mehrere vorgelagerte Modell-
Provider bereit. Das mitgelieferte Plugin `clawrouter` erkennt nur die für
diesen Schlüssel zugelassenen Modelle, leitet jedes Modell über das jeweils deklarierte Protokoll weiter
und zeigt das Budget des Schlüssels sowie die aggregierte Nutzung in den OpenClaw-Nutzungsansichten an.

Vorgelagerte Anmeldedaten und Provider-spezifische Weiterleitungen verbleiben in ClawRouter, sodass
Sie nicht für jeden vorgelagerten Provider ein Plugin auf dem
OpenClaw-Host installieren oder authentifizieren müssen. Das Plugin wird mit OpenClaw mitgeliefert (`enabledByDefault: true`);
Sie benötigen lediglich ausgestellte ClawRouter-Anmeldedaten.

| Eigenschaft   | Wert                                     |
| ------------- | ---------------------------------------- |
| Provider      | `clawrouter`                       |
| Plugin        | mitgeliefert (in OpenClaw enthalten)     |
| Authentifizierung | `CLAWROUTER_API_KEY`                  |
| Standard-URL  | `https://clawrouter.openclaw.ai`                       |
| Modellkatalog | Anmeldedatengebunden über `/v1/catalog` |
| Kontingente   | Monatsbudget und Nutzung über `/v1/usage` |

## Erste Schritte

<Steps>
  <Step title="Richtliniengebundene Anmeldedaten anfordern">
    Bitten Sie Ihre ClawRouter-Administration um Anmeldedaten, deren Richtlinie
    die Provider, Modelle und das Monatsbudget umfasst, die Sie verwenden sollen. Anmeldedaten werden
    bei der Ausstellung einmalig angezeigt.
  </Step>
  <Step title="OpenClaw konfigurieren">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` wird mitgeliefert und ist standardmäßig aktiviert. Wenn Ihre Konfiguration
    `plugins.allow` festlegt, fügen Sie `clawrouter` dieser Liste hinzu, bevor Sie es aktivieren. Legen Sie bei einer
    benutzerdefinierten Bereitstellung `models.providers.clawrouter.baseUrl` auf den
    ClawRouter-Ursprung fest; der Standardwert ist `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Freigegebene Modelle auflisten">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Verwenden Sie die zurückgegebenen Modellreferenzen genau wie angezeigt. Sie behalten den vorgelagerten
    Namensraum bei, beispielsweise `clawrouter/openai/gpt-5.5`,
    `clawrouter/anthropic/claude-sonnet-4-6` oder
    `clawrouter/google/gemini-3.5-flash`. Wenn `agents.defaults.modelPolicy.allow`
    konfiguriert ist, fügen Sie jede ausgewählte ClawRouter-Referenz hinzu.

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

Bewahren Sie den Proxy-Schlüssel in der Secret-Einspeisung der Workload auf und speichern Sie nur eine
SecretRef in `openclaw.json`. Die kanonischen verwalteten Felder sind:

| Zweck              | Konfigurations- oder Umgebungsfeld                                        |
| ------------------ | ------------------------------------------------------------------------- |
| Router-Ursprung    | `models.providers.clawrouter.baseUrl`                                                        |
| Anmeldedaten       | `models.providers.clawrouter.apiKey` -> Umgebungs-SecretRef                                 |
| Secret-Wert        | `CLAWROUTER_API_KEY` in der Prozessumgebung des Gateways                    |
| Standardmodell     | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`                                 |
| Workload-Kennung   | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (optional)                                             |

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

Bei einem aus dem Quellcode erstellten eigenständigen Docker-Gateway ist ClawRouter bereits in
der Root-Laufzeit enthalten. Wählen Sie nur das Kanal-Plugin aus, das separat paketiert werden muss,
beispielsweise `OPENCLAW_EXTENSIONS=clickclack`, `slack` oder `msteams`; siehe
[aus dem Quellcode erstellte Images mit ausgewählten Plugins](/de/install/docker#source-built-images-with-selected-plugins).
Archiv-/Appliance-Bereitstellungen müssen denselben übernommenen Quellcode über ihre
eigene Artefakt-Pipeline paketieren, statt das OCI-Image zu verwenden.

## Bereitschaft und Live-Nachweis

Diese Prüfungen weisen unterschiedliche Grenzen nach; ersetzen Sie keine durch eine andere:

```bash
# Nur Zustand des ClawRouter-Prozesses; weder Anmeldedaten noch ein vorgelagertes Modell werden verwendet.
curl -fsS https://clawrouter.internal.example/v1/health

# Nur Startbereitschaft des OpenClaw-Gateways; es erfolgt kein Modellaufruf.
curl -fsS http://127.0.0.1:18789/readyz

# Anmeldedatengebundene Katalogerkennung.
openclaw models list --all --provider clawrouter --json

# Minimale echte Inferenzprüfung über den konfigurierten ClawRouter-Provider.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# Workload-Canary mit einer exakten freigegebenen Modellreferenz.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Antworten Sie exakt: CLAWROUTER_CANARY_OK" \
  --json
```

Verwenden Sie ein vom richtliniengebundenen Katalog zurückgegebenes Modell, statt das Beispielmodell
blind zu kopieren. Eine erfolgreiche `/readyz`-Antwort bedeutet, dass das Gateway Anfragen bedienen
kann; sie besagt nicht, dass ClawRouter, dessen Anmeldedaten oder ein vorgelagerter
Provider bereit sind. Die Modellprüfung und die Agent-Canary sind die Inferenznachweise.

Führen Sie zur Live-Diagnose die Canary aus und prüfen Sie die Standardprotokolle des Gateways.
Die vorhandenen Modelltransportdiagnosen, die ausschließlich Metadaten enthalten, geben Zeilen in folgender Form aus:

```text
[model-fetch] Start provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] Antwort provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

Das Plugin sendet begrenzte Header `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id` und
`X-ClawRouter-Session-Id`, wenn diese Kennungen verfügbar sind. Es ordnet außerdem
die Diagnosekennung `callId` (`<run-id>:model:<n>`) des Modellaufrufs
`X-Request-ID` zu, sodass ein OpenClaw-Modellaufrufereignis mit dem
reinen Metadaten-Audit-Trail von ClawRouter verknüpft werden kann. Werte innerhalb des Budgets von 128 Zeichen für Anfrage-IDs sind
identisch. Längere Werte behalten das Suffix `:model:<n>` und einen deterministischen
Hash, sodass unterschiedliche Aufrufe begrenzt und verknüpfbar bleiben. Statische Bereitstellungsmetadaten
wie `X-ClawRouter-Project-Id` können in der Provider-Zuordnung `headers` festgelegt werden.
Attributions-Header für Agent und Sitzung behalten ihre separate Begrenzung auf 256 Zeichen.
Automatische Anfrage-IDs mit Zeichen außerhalb des ASCII-Kennungssatzes von ClawRouter
verwenden dieselbe deterministische begrenzte Form.
Explizit konfigurierte Header, einschließlich aller Varianten der Groß-/Kleinschreibung von `X-Request-ID`, haben
Vorrang vor automatischen Werten. Die Transportdiagnose zeichnet Routing- und Antwortmetadaten
auf; sie protokolliert keine Anmeldedaten, Anfrage-IDs, Prompts oder Vervollständigungen.
Das eigene Audit-Ereignis von ClawRouter liefert den ausgewählten vorgelagerten Provider und
den Status der Inhaltsaufbewahrung.

## Modellerkennung

`GET /v1/catalog` gibt `{ providers: [...] }` zurück, wobei jeder Provider-Eintrag
seine eigenen `models[]` (mit vorgelagerter ID, Fähigkeiten und Preisen) sowie seine
unterstützten Anfragerouten aufführt. OpenClaw liefert keine zweite, feste Liste von
ClawRouter-Modellen aus. Ein Katalogmodell wird als OpenClaw-Modell angeboten, wenn:

- die Richtlinie der Anmeldedaten seinen Provider freigibt;
- das Katalogmodell eine unterstützte LLM-Fähigkeit angibt (`llm.responses`,
  `llm.chat`, `llm.messages` oder `llm.stream` mit einer passenden Streaming-
  Route); und
- der Provider eine passende Route für einen der folgenden Transporte bereitstellt.

Das Hinzufügen eines Modells zu einem unterstützten ClawRouter-Provider erfordert keine OpenClaw-Version:
Bei der nächsten Katalogaktualisierung (60 Sekunden je Anmeldedatenbereich zwischengespeichert) wird
es erkannt. Ein Modell, das ein neues Übertragungsprotokoll benötigt, erfordert zunächst Unterstützung durch das Plugin.

## Protokoll- und Provider-Plugins

ClawRouter verwaltet die vorgelagerten Anmeldedaten; sein Katalog teilt OpenClaw mit, welcher
Transport verwendet werden soll, sodass Sie nicht die Authentifizierungs-Plugins sämtlicher vorgelagerter Unternehmen installieren müssen.

| Katalogfähigkeit/-route                                  | OpenClaw-Transport      |
| -------------------------------------------------------- | ----------------------- |
| `llm.responses` (OpenAI-kompatibler Provider)         | `openai-responses`      |
| `llm.chat` (OpenAI-kompatibler Provider)         | `openai-completions`      |
| `llm.messages` + Route `anthropic.messages`            | `anthropic-messages`      |
| `llm.stream` + Streaming-Route `google.generate_content`  | `google-generative-ai`      |

Das Plugin wendet außerdem die passenden Wiederholungs- und Tool-Schema-Richtlinien für diese
Familien an (Tool-Schema-Kompatibilität für OpenAI/DeepSeek/Gemini/Perplexity; native
Wiederholungsrichtlinien für Anthropic und Google Gemini). Perplexity-Modelle erhalten eine strikte
Schemaumschreibung: `patternProperties` und `additionalProperties` werden entfernt und
jedes Objektschema deklariert `properties`, da Perplexity Tool-
Schemas ohne diese Angabe ablehnt. Ein Katalog-Provider, der ausschließlich ein
nicht unterstütztes Anfrageformat bereitstellt, wird bewusst nicht als OpenClaw-
Textmodell angeboten. Normalisieren Sie diese Provider in ClawRouter auf einen der unterstützten
Verträge, statt eine inkompatible Nutzlast zu senden.

## Kontingente und Nutzung

Die Antwort `/v1/usage` von ClawRouter speist die regulären OpenClaw-Ansichten zur Provider-Nutzung:
Anfrage-, Token- und Ausgabensummen sowie ein monatliches Budgetfenster, wenn
der Schlüssel eine Begrenzung besitzt. Schlüssel ohne Verbrauchsbegrenzung zeigen weiterhin die aggregierte Nutzung ohne
Prozentfenster an.

Die Kontingentabfrage verwendet denselben richtliniengebundenen Schlüssel wie die Modellerkennung. Eine fehlgeschlagene
Kontingentabfrage blockiert die Modellausführung nicht.

Prüfen Sie den Live-Snapshot mit:

```bash
openclaw status --usage
openclaw models status
```

Derselbe Provider-Snapshot ist für `/status` im Chat und in der OpenClaw-
Nutzungsoberfläche verfügbar. Das Budget gilt für die gesamte Richtlinie, sodass Anfragen eines anderen Clients mit
derselben ClawRouter-Richtlinie den verbleibenden Prozentsatz ändern können.

## Fehlerbehebung

| Symptom                                  | Prüfung                                                                                                                                        |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Keine ClawRouter-Modelle                 | Bestätigen Sie, dass das Plugin aktiviert und durch `plugins.allow` zugelassen ist, und prüfen Sie anschließend, ob die Anmeldedaten aktiv sind und mindestens einen bereiten Provider freigeben. |
| Ein konfiguriertes ClawRouter-Modell fehlt | Prüfen Sie dessen Fähigkeit `/v1/catalog` und die Routenunterstützung. Nicht unterstützte Transportverträge werden bewusst herausgefiltert. |
| Modellüberschreibung von Richtlinie abgelehnt | Fügen Sie die exakte Katalogreferenz oder `clawrouter/*` zu `agents.defaults.modelPolicy.allow` hinzu.                                                   |
| `401` oder `403` aus Katalog oder Nutzung | Stellen Sie die ClawRouter-Anmeldedaten neu aus oder ändern Sie deren Geltungsbereich; OpenClaw greift nicht auf Schlüssel vorgelagerter Provider zurück. |
| Modellaufruf schlägt nach Erkennung fehl | Prüfen Sie die Provider-Verbindung und den Zustand des vorgelagerten Dienstes in ClawRouter und versuchen Sie es erneut, nachdem dessen Bereitschaft wiederhergestellt wurde. |
| Nutzung enthält Summen, aber keinen Prozentsatz | Die Richtlinie ist nicht verbrauchsbegrenzt; fügen Sie in ClawRouter ein Monatsbudget hinzu, um ein Prozentfenster bereitzustellen.             |

## Sicherheitsverhalten

- Die Katalogerkennung ist auf den konfigurierten Proxy-Schlüssel beschränkt und wird pro Anmeldedatenbereich zwischengespeichert (Agentenverzeichnis, Arbeitsbereichsverzeichnis, Authentifizierungsprofil-ID und Basis-URL).
- Der Proxy-Schlüssel wird erst beim Senden der Anfrage angefügt; er wird nicht in den Modellmetadaten gespeichert.
- Werte für die automatische Zuordnung und Anfragekorrelation werden vor dem Senden gekürzt und bei enthaltenen Steuerzeichen abgelehnt. Zuordnungswerte sind auf 256 Zeichen begrenzt; Anfrage-IDs auf 128.
- Diagnosedaten zum Modelltransport enthalten ausschließlich Metadaten und niemals den Proxy-Schlüssel oder Modellinhalte.
- Native Anthropic- und Gemini-Modell-IDs werden erst beim Senden in ihre Upstream-IDs umgeschrieben.
- Nicht unterstützte oder nicht freigegebene Katalogeinträge werden standardmäßig abgelehnt und können nicht ausgewählt werden.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Provider-Konfiguration und Modellauswahl.
  </Card>
  <Card title="Nutzungsverfolgung" href="/de/concepts/usage-tracking" icon="chart-line">
    OpenClaw-Oberflächen für Nutzung und Status.
  </Card>
</CardGroup>
