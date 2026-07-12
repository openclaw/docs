---
read_when:
    - Sie möchten Grok für web_search verwenden
    - Sie möchten xAI OAuth oder einen XAI_API_KEY für die Websuche verwenden
summary: Grok-Websuche über webgestützte Antworten von xAI
title: Grok-Suche
x-i18n:
    generated_at: "2026-07-12T15:58:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw unterstützt Grok als `web_search`-Provider und verwendet dabei webgestützte
Antworten von xAI, um KI-generierte Antworten zu erstellen, die durch aktuelle Suchergebnisse
mit Quellenangaben belegt sind.

Die Grok-Websuche verwendet bevorzugt eine bestehende xAI-OAuth-Anmeldung, sofern eine verfügbar ist.
Wenn kein OAuth-Profil vorhanden ist, dient derselbe xAI-API-Schlüssel auch dem integrierten
Tool `x_search` für die Suche nach Beiträgen auf X (ehemals Twitter) sowie dem Tool `code_execution`.
Wenn Sie den Schlüssel unter `plugins.entries.xai.config.webSearch.apiKey` speichern, kann
OpenClaw ihn außerdem als Fallback für den gebündelten xAI-Modell-Provider wiederverwenden.

Für beitragsspezifische X-Metriken (Reposts, Antworten, Lesezeichen, Aufrufe) verwenden Sie
[`x_search`](/de/tools/web#x_search) mit der exakten Beitrags-URL oder Status-ID
anstelle einer allgemeinen Suchanfrage.

## Onboarding und Konfiguration

Wenn Sie während `openclaw onboard` oder `openclaw configure --section
web` **Grok** auswählen, kann OpenClaw ein bestehendes xAI-OAuth-Profil wiederverwenden, ohne
zur Eingabe eines separaten Websuchschlüssels aufzufordern. Ohne OAuth greift es auf die Einrichtung eines xAI-API-Schlüssels zurück.

Anschließend bietet OpenClaw einen weiteren Schritt an, um `x_search` mit denselben xAI-
Anmeldedaten zu aktivieren. Dieser weitere Schritt:

  - wird erst angezeigt, nachdem Sie Grok für `web_search` ausgewählt haben
  - ist keine separate Websuch-Provider-Option auf oberster Ebene
  - kann optional das `x_search`-Modell im selben Ablauf festlegen

  Überspringen Sie diesen Schritt, um `x_search` später in der Konfiguration zu aktivieren oder zu ändern.

  ## Anmelden oder API-Schlüssel abrufen

  <Steps>
  <Step title="xAI OAuth verwenden">
    Wenn Sie sich bereits während des Onboardings oder der Modellauthentifizierung bei xAI angemeldet haben, wählen Sie
    Grok als `web_search`-Provider. Es ist kein separater API-Schlüssel erforderlich:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="API-Schlüssel als Ausweichlösung verwenden">
    Rufen Sie einen API-Schlüssel von [xAI](https://console.x.ai/) ab, wenn OAuth nicht verfügbar ist
    oder Sie bewusst eine schlüsselbasierte Websuchkonfiguration verwenden möchten.
  </Step>
  <Step title="Schlüssel speichern">
    Legen Sie `XAI_API_KEY` in der Gateway-Umgebung fest oder konfigurieren Sie ihn über:

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
            apiKey: "xai-...", // optional, wenn xAI OAuth oder XAI_API_KEY verfügbar ist
            baseUrl: "https://api.x.ai/v1", // optionale Überschreibung der Proxy-/Basis-URL der Responses API
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

**Alternativen für Anmeldedaten:** `openclaw models auth login --provider xai
--method oauth`, `XAI_API_KEY` in der Gateway-Umgebung oder
`plugins.entries.xai.config.webSearch.apiKey`. Legen Sie bei einer Gateway-Installation
Umgebungsvariablen in `~/.openclaw/.env` ab.

## Funktionsweise

Grok verwendet webgestützte Antworten von xAI, um Antworten mit Inline-
Quellenangaben zu erstellen, ähnlich dem Grounding-Ansatz von Gemini mit der Google-Suche.

## Unterstützte Parameter

Die Grok-Suche unterstützt `query`. `count` wird aus Kompatibilitätsgründen mit dem
gemeinsamen `web_search` akzeptiert, Grok gibt jedoch immer eine synthetisierte Antwort
mit Quellenangaben statt einer Liste mit N Ergebnissen zurück. Provider-spezifische
Filter werden nicht unterstützt.

Für Grok gilt standardmäßig ein Zeitlimit von 60 Sekunden, da webgestützte
Suchen mit xAI Responses länger dauern können als das Standardzeitlimit des gemeinsamen
`web_search`. Überschreiben Sie es mit `tools.web.search.timeoutSeconds`.

## Überschreibungen der Basis-URL

Legen Sie `plugins.entries.xai.config.webSearch.baseUrl` fest, um die Grok-Websuche
über einen Betreiber-Proxy oder einen xAI-kompatiblen Responses-Endpunkt zu leiten. OpenClaw
sendet Anfragen nach dem Entfernen abschließender Schrägstriche an `<baseUrl>/responses`. `x_search`
greift auf dieselbe `webSearch.baseUrl` zurück, sofern
`plugins.entries.xai.config.xSearch.baseUrl` nicht festgelegt ist.

## Verwandte Themen

- [Übersicht über die Websuche](/de/tools/web) -- alle Provider und automatische Erkennung
- [x_search in der Websuche](/de/tools/web#x_search) -- direkte X-Suche über xAI
- [Gemini-Suche](/de/tools/gemini-search) -- KI-synthetisierte Antworten über Google-Grounding
