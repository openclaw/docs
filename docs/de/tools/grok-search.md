---
read_when:
    - Sie möchten Grok für web_search verwenden
    - Sie möchten xAI OAuth oder einen XAI_API_KEY für die Websuche verwenden
summary: Grok-Websuche über webgestützte Antworten von xAI
title: Grok-Suche
x-i18n:
    generated_at: "2026-06-27T18:19:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d18866f12648c5c194112633f6e888711cab83628dcc06ac58cb7801841a73b
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw unterstützt Grok als `web_search`-Provider und nutzt webgestützte
Antworten von xAI, um KI-synthetisierte Antworten zu erstellen, die durch
Live-Suchergebnisse mit Quellenangaben belegt sind.

Die Grok-Websuche bevorzugt Ihre bestehende xAI-OAuth-Anmeldung, wenn eine
verfügbar ist. Wenn kein OAuth-Profil vorhanden ist, kann derselbe xAI-API-
Schlüssel auch das integrierte Tool `x_search` für die Suche nach Beiträgen auf
X (ehemals Twitter) und das Tool `code_execution` betreiben. Wenn Sie den
Schlüssel unter `plugins.entries.xai.config.webSearch.apiKey` speichern,
verwendet OpenClaw ihn außerdem als Fallback für den gebündelten xAI-
Modell-Provider.

Für X-Metriken auf Beitragsebene wie Reposts, Antworten, Lesezeichen oder
Aufrufe verwenden Sie bevorzugt `x_search` mit der exakten Beitrags-URL oder
Status-ID statt einer breiten Suchabfrage.

## Onboarding und Konfiguration

Wenn Sie **Grok** auswählen während:

- `openclaw onboard`
- `openclaw configure --section web`

kann OpenClaw ein bestehendes xAI-OAuth-Profil verwenden, ohne nach einem
separaten Websuchschlüssel zu fragen. Wenn OAuth nicht verfügbar ist, fällt es
auf die Einrichtung per xAI-API-Schlüssel zurück. OpenClaw kann außerdem einen
separaten Folgeschritt anzeigen, um `x_search` mit derselben xAI-Anmeldedaten
zu aktivieren. Dieser Folgeschritt:

- erscheint nur, nachdem Sie Grok für `web_search` ausgewählt haben
- ist keine separate Websuche-Provider-Auswahl auf oberster Ebene
- kann optional im selben Ablauf das `x_search`-Modell festlegen

Wenn Sie ihn überspringen, können Sie `x_search` später in der Konfiguration
aktivieren oder ändern.

## Anmelden oder API-Schlüssel erhalten

<Steps>
  <Step title="Use xAI OAuth">
    Wenn Sie sich bereits während des Onboardings oder der Modellauthentifizierung
    mit xAI angemeldet haben, wählen Sie Grok als `web_search`-Provider. Es ist
    kein separater API-Schlüssel erforderlich:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Use an API key fallback">
    Holen Sie sich einen API-Schlüssel von [xAI](https://console.x.ai/), wenn
    OAuth nicht verfügbar ist oder Sie bewusst eine schlüsselgestützte
    Websuche-Konfiguration verwenden möchten.
  </Step>
  <Step title="Store the key">
    Setzen Sie `XAI_API_KEY` in der Gateway-Umgebung oder konfigurieren Sie ihn
    über:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Konfiguration

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if xAI OAuth or XAI_API_KEY is available
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**Alternative Anmeldedaten:** Melden Sie sich mit `openclaw models auth login
--provider xai --method oauth` an, setzen Sie `XAI_API_KEY` in der Gateway-
Umgebung oder speichern Sie `plugins.entries.xai.config.webSearch.apiKey`. Bei
einer Gateway-Installation legen Sie Umgebungsvariablen in `~/.openclaw/.env`
ab.

## Funktionsweise

Grok nutzt webgestützte Antworten von xAI, um Antworten mit Inline-
Quellenangaben zu synthetisieren, ähnlich wie Geminis Ansatz für Google Search
Grounding.

## Unterstützte Parameter

Die Grok-Suche unterstützt `query`.

`count` wird aus Kompatibilitätsgründen mit dem gemeinsamen `web_search`
akzeptiert, aber Grok gibt weiterhin eine synthetisierte Antwort mit
Quellenangaben zurück statt einer Liste mit N Ergebnissen.

Provider-spezifische Filter werden derzeit nicht unterstützt.

Grok verwendet ein Provider-spezifisches Standard-Timeout von 60 Sekunden, weil
webgestützte Suchläufe der xAI Responses API länger dauern können als der
gemeinsame `web_search`-Standard. Setzen Sie
`tools.web.search.timeoutSeconds`, um es zu überschreiben.

## Base-URL-Überschreibungen

Setzen Sie `plugins.entries.xai.config.webSearch.baseUrl`, wenn die Grok-
Websuche über einen Betreiber-Proxy oder einen xAI-kompatiblen Responses-
Endpunkt geleitet werden soll. OpenClaw sendet nach dem Entfernen nachfolgender
Schrägstriche an `<baseUrl>/responses`. `x_search` verwendet denselben
Fallback `webSearch.baseUrl`, sofern
`plugins.entries.xai.config.xSearch.baseUrl` nicht gesetzt ist.

## Verwandte Themen

- [Übersicht zur Websuche](/de/tools/web) -- alle Provider und automatische Erkennung
- [x_search in der Websuche](/de/tools/web#x_search) -- erstklassige X-Suche über xAI
- [Gemini Search](/de/tools/gemini-search) -- KI-synthetisierte Antworten über Google Grounding
