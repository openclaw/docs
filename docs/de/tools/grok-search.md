---
read_when:
    - Sie möchten Grok für web_search verwenden
    - Sie möchten xAI OAuth oder einen XAI_API_KEY für die Websuche verwenden
summary: Grok-Websuche über webbasierte Antworten von xAI
title: Grok-Suche
x-i18n:
    generated_at: "2026-07-24T05:23:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw unterstützt Grok als `web_search`-Provider und nutzt mit Web-Quellen fundierte
Antworten von xAI, um KI-generierte Antworten zu erstellen, die auf aktuellen Suchergebnissen
mit Quellenangaben basieren.

Die Grok-Websuche bevorzugt eine bestehende xAI-OAuth-Anmeldung, sofern eine verfügbar ist.
Wenn kein OAuth-Profil vorhanden ist, dient derselbe xAI-API-Schlüssel auch als Grundlage für das integrierte
`x_search`-Tool zur Suche nach Beiträgen auf X (ehemals Twitter) und das `code_execution`-
Tool. Wenn der Schlüssel unter `plugins.entries.xai.config.webSearch.apiKey` gespeichert wird, kann
OpenClaw ihn außerdem als Fallback für den mitgelieferten xAI-Modell-Provider wiederverwenden.

Verwenden Sie für Metriken einzelner X-Beiträge (Reposts, Antworten, Lesezeichen, Aufrufe)
[`x_search`](/de/tools/web#x_search) mit der exakten Beitrags-URL oder Status-ID
anstelle einer allgemeinen Suchanfrage.

## Onboarding und Konfiguration

Wenn Sie während `openclaw onboard` oder `openclaw configure --section
web` **Grok** auswählen, kann OpenClaw ein bestehendes xAI-OAuth-Profil wiederverwenden, ohne
nach einem separaten Schlüssel für die Websuche zu fragen. Ohne OAuth greift es auf die Einrichtung eines xAI-API-Schlüssels zurück.

OpenClaw bietet anschließend einen weiteren Schritt an, um `x_search` mit denselben xAI-
Anmeldedaten zu aktivieren. Dieser zusätzliche Schritt:

- wird nur angezeigt, nachdem Sie Grok für `web_search` ausgewählt haben
- ist keine separate Websuch-Provider-Auswahl auf oberster Ebene
- kann optional im selben Ablauf das Modell `x_search` festlegen

Überspringen Sie ihn, um `x_search` später in der Konfiguration zu aktivieren oder zu ändern.

## Anmelden oder API-Schlüssel abrufen

<Steps>
  <Step title="xAI OAuth verwenden">
    Wenn Sie sich bereits während des Onboardings oder der Modellauthentifizierung bei xAI angemeldet haben, wählen Sie
    Grok als `web_search`-Provider aus. Ein separater API-Schlüssel ist nicht erforderlich:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="API-Schlüssel als Fallback verwenden">
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
            baseUrl: "https://api.x.ai/v1", // optionale Überschreibung der Proxy-/Basis-URL für die Responses API
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
`plugins.entries.xai.config.webSearch.apiKey`. Legen Sie bei einer Gateway-Installation die Umgebungsvariablen
in `~/.openclaw/.env` ab.

## Funktionsweise

Grok verwendet mit Web-Quellen fundierte Antworten von xAI, um Antworten mit eingebetteten
Quellenangaben zu generieren, ähnlich dem Grounding-Ansatz von Gemini mit der Google-Suche.

## Unterstützte Parameter

Die Grok-Suche unterstützt `query`. `count` wird für die gemeinsame `web_search`-
Kompatibilität akzeptiert, Grok gibt jedoch stets eine einzelne generierte Antwort mit Quellenangaben
statt einer Liste mit N Ergebnissen zurück. Provider-spezifische Filter werden nicht unterstützt.

Für Grok gilt standardmäßig ein Zeitlimit von 60 Sekunden, da mit Web-Quellen fundierte
Suchen über xAI Responses länger dauern können als der gemeinsame Standardwert von `web_search`. Überschreiben Sie ihn
mit `tools.web.search.timeoutSeconds`.

## Überschreibungen der Basis-URL

Legen Sie `plugins.entries.xai.config.webSearch.baseUrl` fest, um die Grok-Websuche
über einen Betreiber-Proxy oder einen xAI-kompatiblen Responses-Endpunkt zu leiten. OpenClaw
sendet POST-Anfragen an `<baseUrl>/responses`, nachdem abschließende Schrägstriche entfernt wurden. `x_search`
greift auf denselben Wert von `webSearch.baseUrl` zurück, sofern
`plugins.entries.xai.config.xSearch.baseUrl` nicht festgelegt ist.

## Verwandte Themen

- [Übersicht zur Websuche](/de/tools/web) -- alle Provider und automatische Erkennung
- [x_search in der Websuche](/de/tools/web#x_search) -- direkte X-Suche über xAI
- [Gemini-Suche](/de/tools/gemini-search) -- KI-generierte Antworten über Google-Grounding
