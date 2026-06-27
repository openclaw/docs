---
read_when:
    - Sie möchten Perplexity als Websuch-Provider konfigurieren
    - Sie benötigen den Perplexity-API-Schlüssel oder die OpenRouter-Proxy-Einrichtung
summary: Einrichtung des Perplexity-Websuch-Providers (API-Schlüssel, Suchmodi, Filterung)
title: Perplexity
x-i18n:
    generated_at: "2026-06-27T18:06:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3be6f5066ba180a63ea8b374f641613c815be0f84ee1d3577feea04e31ab4694
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Das Perplexity-Plugin stellt Websuchfunktionen über die Perplexity Search API
oder Perplexity Sonar über OpenRouter bereit.

<Note>
Diese Seite beschreibt die Einrichtung des Perplexity-**Providers**. Für das Perplexity-**Tool** (wie der Agent es verwendet), siehe [Perplexity-Tool](/de/tools/perplexity-search).
</Note>

| Eigenschaft | Wert                                                                   |
| ----------- | ---------------------------------------------------------------------- |
| Typ         | Websuch-Provider (kein Modell-Provider)                                |
| Auth        | `PERPLEXITY_API_KEY` (direkt) oder `OPENROUTER_API_KEY` (über OpenRouter) |
| Konfigurationspfad | `plugins.entries.perplexity.config.webSearch.apiKey`             |

## Plugin installieren

Installieren Sie das offizielle Plugin und starten Sie anschließend den Gateway neu:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel festlegen">
    Führen Sie den interaktiven Konfigurationsablauf für die Websuche aus:

    ```bash
    openclaw configure --section web
    ```

    Oder legen Sie den Schlüssel direkt fest:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Suche starten">
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
    Wenn Ihr Schlüssel mit `sk-or-` beginnt, leitet OpenClaw über OpenRouter weiter und verwendet
    das Perplexity Sonar-Modell. Dieser Transport gibt KI-generierte Antworten mit
    Zitierungen zurück.
  </Tab>
</Tabs>

| Schlüsselpräfix | Transport                    | Funktionen                                       |
| ---------------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`          | Native Perplexity Search API | Strukturierte Ergebnisse, Domain-/Sprach-/Datumsfilter |
| `sk-or-`         | OpenRouter (Sonar)           | KI-generierte Antworten mit Zitierungen          |

## Filterung mit der nativen API

<Note>
Filteroptionen sind nur verfügbar, wenn die native Perplexity API
(`pplx-`-Schlüssel) verwendet wird. OpenRouter/Sonar-Suchen unterstützen diese Parameter nicht.
</Note>

Bei Verwendung der nativen Perplexity API unterstützen Suchen die folgenden Filter:

| Filter         | Beschreibung                          | Beispiel                            |
| -------------- | ------------------------------------- | ----------------------------------- |
| Land           | 2-Buchstaben-Ländercode               | `us`, `de`, `jp`                    |
| Sprache        | ISO-639-1-Sprachcode                  | `en`, `fr`, `zh`                    |
| Datumsbereich  | Aktualitätsfenster                    | `day`, `week`, `month`, `year`      |
| Domainfilter   | Allowlist oder Denylist (max. 20 Domains) | `example.com`                   |
| Inhaltsbudget  | Token-Limits pro Antwort / pro Seite  | `max_tokens`, `max_tokens_per_page` |

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Umgebungsvariable für Daemon-Prozesse">
    Wenn der OpenClaw Gateway als Daemon (launchd/systemd) läuft, stellen Sie sicher,
    dass `PERPLEXITY_API_KEY` für diesen Prozess verfügbar ist.

    <Warning>
    Ein Schlüssel, der nur in einer interaktiven Shell exportiert wurde, ist für einen
    launchd/systemd-Daemon nicht sichtbar, sofern diese Umgebung nicht ausdrücklich importiert wird. Legen Sie
    den Schlüssel in `~/.openclaw/.env` oder über `env.shellEnv` fest, damit der Gateway-
    Prozess ihn lesen kann.
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter-Proxy-Einrichtung">
    Wenn Sie Perplexity-Suchen lieber über OpenRouter weiterleiten möchten, legen Sie
    `OPENROUTER_API_KEY` (Präfix `sk-or-`) anstelle eines nativen Perplexity-Schlüssels fest.
    OpenClaw erkennt das Präfix und wechselt automatisch zum Sonar-Transport.

    <Tip>
    Der OpenRouter-Transport ist nützlich, wenn Sie bereits ein OpenRouter-Konto haben
    und eine konsolidierte Abrechnung über mehrere Provider hinweg wünschen.
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
