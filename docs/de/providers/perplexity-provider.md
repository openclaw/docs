---
read_when:
    - Sie möchten Perplexity als Websuchanbieter konfigurieren
    - Sie benötigen den API-Schlüssel für Perplexity oder die Einrichtung des OpenRouter-Proxys
summary: Einrichtung des Perplexity-Websuchanbieters (API-Schlüssel, Suchmodi, Filterung)
title: Perplexity
x-i18n:
    generated_at: "2026-04-25T13:55:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: d913d71c1b3a5cfbd755efff9235adfd5dd460ef606a6d229d2cceb5134174d3
    source_path: providers/perplexity-provider.md
    workflow: 15
---

Das Perplexity Plugin bietet Websuchfunktionen über die Perplexity
Search API oder Perplexity Sonar über OpenRouter.

<Note>
Diese Seite behandelt die Einrichtung des Perplexity-**Anbieters**. Für das Perplexity-
**Tool** (wie der Agent es verwendet), siehe [Perplexity-Tool](/de/tools/perplexity-search).
</Note>

| Property    | Value                                                                    |
| ----------- | ------------------------------------------------------------------------ |
| Type        | Websuchanbieter (kein Modellanbieter)                                    |
| Auth        | `PERPLEXITY_API_KEY` (direkt) oder `OPENROUTER_API_KEY` (über OpenRouter) |
| Config path | `plugins.entries.perplexity.config.webSearch.apiKey`                     |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel festlegen">
    Führen Sie den interaktiven Konfigurationsablauf für die Websuche aus:

    ```bash
    openclaw configure --section web
    ```

    Oder setzen Sie den Schlüssel direkt:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Mit der Suche beginnen">
    Der Agent verwendet Perplexity automatisch für Websuchen, sobald der Schlüssel
    konfiguriert ist. Es sind keine weiteren Schritte erforderlich.
  </Step>
</Steps>

## Suchmodi

Das Plugin wählt den Transport automatisch anhand des API-Schlüsselpräfixes aus:

<Tabs>
  <Tab title="Native Perplexity API (pplx-)">
    Wenn Ihr Schlüssel mit `pplx-` beginnt, verwendet OpenClaw die native Perplexity Search
    API. Dieser Transport gibt strukturierte Ergebnisse zurück und unterstützt Domain-,
    Sprach- und Datumsfilter (siehe Filteroptionen unten).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Wenn Ihr Schlüssel mit `sk-or-` beginnt, leitet OpenClaw über OpenRouter unter Verwendung
    des Perplexity-Sonar-Modells weiter. Dieser Transport gibt KI-synthetisierte Antworten mit
    Zitaten zurück.
  </Tab>
</Tabs>

| Key prefix | Transport                    | Features                                           |
| ---------- | ---------------------------- | -------------------------------------------------- |
| `pplx-`    | Native Perplexity Search API | Strukturierte Ergebnisse, Domain-/Sprach-/Datumsfilter |
| `sk-or-`   | OpenRouter (Sonar)           | KI-synthetisierte Antworten mit Zitaten            |

## Filterung der nativen API

<Note>
Filteroptionen sind nur verfügbar, wenn die native Perplexity API
(Schlüssel `pplx-`) verwendet wird. OpenRouter-/Sonar-Suchen unterstützen diese Parameter nicht.
</Note>

Bei Verwendung der nativen Perplexity API unterstützen Suchen die folgenden Filter:

| Filter         | Beschreibung                           | Beispiel                            |
| -------------- | -------------------------------------- | ----------------------------------- |
| Land           | 2-stelliger Ländercode                 | `us`, `de`, `jp`                    |
| Sprache        | ISO-639-1-Sprachcode                   | `en`, `fr`, `zh`                    |
| Datumsbereich  | Aktualitätsfenster                     | `day`, `week`, `month`, `year`      |
| Domain-Filter  | Zulassungsliste oder Sperrliste (max. 20 Domains) | `example.com`                       |
| Inhaltsbudget  | Token-Limits pro Antwort / pro Seite   | `max_tokens`, `max_tokens_per_page` |

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Umgebungsvariable für Daemon-Prozesse">
    Wenn das OpenClaw Gateway als Daemon (launchd/systemd) ausgeführt wird, stellen Sie sicher,
    dass `PERPLEXITY_API_KEY` diesem Prozess zur Verfügung steht.

    <Warning>
    Ein Schlüssel, der nur in `~/.profile` gesetzt ist, ist für einen launchd/systemd-
    Daemon nicht sichtbar, es sei denn, diese Umgebung wird ausdrücklich importiert. Setzen Sie den Schlüssel in
    `~/.openclaw/.env` oder über `env.shellEnv`, damit der Gateway-Prozess ihn lesen kann.
    </Warning>

  </Accordion>

  <Accordion title="Einrichtung des OpenRouter-Proxys">
    Wenn Sie Perplexity-Suchen lieber über OpenRouter weiterleiten möchten, setzen Sie
    statt eines nativen Perplexity-Schlüssels einen `OPENROUTER_API_KEY` (Präfix `sk-or-`).
    OpenClaw erkennt das Präfix und wechselt automatisch zum Sonar-Transport.

    <Tip>
    Der OpenRouter-Transport ist nützlich, wenn Sie bereits ein OpenRouter-Konto
    haben und eine konsolidierte Abrechnung über mehrere Anbieter hinweg möchten.
    </Tip>

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Perplexity-Suchtool" href="/de/tools/perplexity-search" icon="magnifying-glass">
    Wie der Agent Perplexity-Suchen aufruft und Ergebnisse interpretiert.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz einschließlich Plugin-Einträgen.
  </Card>
</CardGroup>
