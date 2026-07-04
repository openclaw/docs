---
read_when:
    - Sie möchten Anthropic-Modelle in OpenClaw verwenden
summary: Anthropic Claude über API-Schlüssel oder Claude CLI in OpenClaw verwenden
title: Anthropic
x-i18n:
    generated_at: "2026-07-04T15:12:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e6fd143b85bb448f65d5d1b35ce465cce7c6f41987b39b9665910cf71761032
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic entwickelt die Modellfamilie **Claude**. OpenClaw unterstützt zwei Authentifizierungswege:

- **API-Schlüssel** — direkter Anthropic-API-Zugriff mit nutzungsbasierter Abrechnung (`anthropic/*`-Modelle)
- **Claude CLI** — eine vorhandene Claude Code-Anmeldung auf demselben Host wiederverwenden

<Warning>
Das Claude-CLI-Backend von OpenClaw führt die installierte Claude Code CLI im
nicht interaktiven Ausgabemodus aus. Die aktuellen Claude Code-Dokumente von
Anthropic beschreiben `claude -p` als Agent-SDK-/programmatische Nutzung. Das Support-Update
von Anthropic vom 15. Juni 2026 hat die angekündigte Änderung der Agent-SDK-Abrechnung
pausiert. Derzeit gibt Anthropic an, dass Claude Agent SDK, `claude -p` und die Nutzung
von Drittanbieter-Apps weiterhin auf die Nutzungslimits eines Abonnements angerechnet
werden. Das zuvor angekündigte monatliche Agent-SDK-Guthaben ist nicht verfügbar,
während Anthropic diesen Plan überarbeitet.

Interaktiver Claude Code wird weiterhin auf die Limits des angemeldeten Claude-Plans
angerechnet. Authentifizierung per API-Schlüssel bleibt direkte Pay-as-you-go-API-Abrechnung. Verwenden Sie für langlebige Gateway-Hosts,
gemeinsam genutzte Automatisierung und planbare Produktionsausgaben einen Anthropic-API-Schlüssel.

Prüfen Sie die aktuellen Support-Artikel von Anthropic, bevor Sie sich auf das
Abrechnungsverhalten von Abonnements verlassen:

- [Claude Code CLI-Referenz](https://code.claude.com/docs/en/cli-usage)
- [Claude Agent SDK mit Ihrem Claude-Plan verwenden](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Claude Code mit Ihrem Pro- oder Max-Plan verwenden](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Claude Code mit Ihrem Team- oder Enterprise-Plan verwenden](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Claude Code-Kosten verwalten](https://code.claude.com/docs/en/costs)

</Warning>

## Erste Schritte

<Tabs>
  <Tab title="API-Schlüssel">
    **Am besten geeignet für:** standardmäßigen API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="Ihren API-Schlüssel abrufen">
        Erstellen Sie einen API-Schlüssel in der [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Oder übergeben Sie den Schlüssel direkt:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Überprüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Am besten geeignet für:** Wiederverwendung einer vorhandenen Claude-CLI-Anmeldung ohne separaten API-Schlüssel.

    <Steps>
      <Step title="Sicherstellen, dass Claude CLI installiert und angemeldet ist">
        Prüfen Sie dies mit:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw erkennt die vorhandenen Claude-CLI-Anmeldedaten und verwendet sie wieder.
      </Step>
      <Step title="Überprüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Einrichtungs- und Laufzeitdetails für das Claude-CLI-Backend finden Sie unter [CLI-Backends](/de/gateway/cli-backends).
    </Note>

    <Warning>
    Die Wiederverwendung der Claude CLI setzt voraus, dass der OpenClaw-Prozess auf demselben Host wie die
    Claude-CLI-Anmeldung läuft. Docker-Installationen können ein Container-Home persistent machen und sich dort bei
    Claude Code anmelden; siehe
    [Claude-CLI-Backend in Docker](/de/install/docker#claude-cli-backend-in-docker).
    Andere Container-Installationen wie [Podman](/de/install/podman) binden das Host-
    `~/.claude` nicht in Einrichtung oder Laufzeit ein; verwenden Sie dort einen Anthropic-API-Schlüssel oder wählen Sie
    einen Provider mit von OpenClaw verwaltetem OAuth wie
    [OpenAI Codex](/de/providers/openai).
    </Warning>

    ### Konfigurationsbeispiel

    Bevorzugen Sie die kanonische Anthropic-Modellreferenz plus eine CLI-Laufzeitüberschreibung:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Legacy-Modellreferenzen wie `claude-cli/claude-opus-4-7` funktionieren aus
    Kompatibilitätsgründen weiterhin, neue Konfigurationen sollten die Provider-/Modellauswahl jedoch als
    `anthropic/*` beibehalten und das Ausführungs-Backend in der Provider-/Modell-Laufzeitrichtlinie festlegen.

    ### Abrechnung und `claude -p`

    OpenClaw verwendet den nicht interaktiven `claude -p`-Pfad von Claude Code für Claude-CLI-
    Ausführungen. Anthropic behandelt diesen Pfad derzeit als Agent-SDK-/programmatische Nutzung:

    - Das Support-Update von Anthropic vom 15. Juni 2026 hat den zuvor angekündigten
      separaten Agent-SDK-Guthabenplan pausiert.
    - Derzeit werden Claude Agent SDK, `claude -p` und die Nutzung von Drittanbieter-
      Apps in Abonnementplänen weiterhin auf die Nutzungslimits des angemeldeten Abonnements angerechnet.
    - Das zuvor angekündigte monatliche Agent-SDK-Guthaben ist nicht verfügbar, während
      Anthropic diesen Plan überarbeitet.
    - Console-/API-Schlüssel-Anmeldungen verwenden Pay-as-you-go-API-Abrechnung und erhalten nicht
      das Agent-SDK-Guthaben des Abonnements.

    Weitere Informationen zur Pausenmitteilung finden Sie im [Agent-SDK-Planartikel](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    von Anthropic und zum Abonnementverhalten in den Claude Code-Planartikeln für
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    und
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic kann die Abrechnung und das Rate-Limit-Verhalten von Claude Code ohne
    OpenClaw-Release ändern. Prüfen Sie `claude auth status`, `/status` und
    die verlinkten Dokumente von Anthropic, wenn planbare Abrechnung wichtig ist.

    <Tip>
    Verwenden Sie für gemeinsam genutzte Produktionsautomatisierung einen Anthropic-API-Schlüssel statt
    Claude CLI. OpenClaw unterstützt außerdem Optionen im Abonnementstil von
    [OpenAI Codex](/de/providers/openai), [Qwen Cloud](/de/providers/qwen),
    [MiniMax](/de/providers/minimax) und [Z.AI / GLM](/de/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Thinking-Standards (Claude Fable 5, 4.8 und 4.6)

`anthropic/claude-fable-5` verwendet immer adaptives Thinking und setzt standardmäßig
den Aufwand auf `high`. Da Anthropic nicht erlaubt, Thinking für dieses Modell zu deaktivieren,
verwenden `/think off` und `/think minimal` den Aufwand `low`. OpenClaw lässt außerdem benutzerdefinierte
Temperaturwerte für Fable-5-Anfragen weg.

Claude Opus 4.8 lässt Thinking in OpenClaw standardmäßig deaktiviert. Wenn Sie adaptives Thinking explizit mit `/think high|xhigh|max` aktivieren, sendet OpenClaw die Opus-4.8-Aufwandswerte von Anthropic; Claude-4.6-Modelle verwenden standardmäßig `adaptive`.

Überschreiben Sie dies pro Nachricht mit `/think:<level>` oder in den Modellparametern:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
Zugehörige Anthropic-Dokumente:
- [Adaptives Thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Erweitertes Thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Fallback bei Sicherheitsablehnung (Claude Fable 5)

<Warning>
Die Verwendung von Claude Fable 5 bedeutet auch die Verwendung von Claude Opus 4.8. Fable 5 wird mit
Sicherheitsklassifikatoren ausgeliefert, die eine Anfrage ablehnen können, und Anthropic gibt als
vorgesehene Wiederherstellung vor, dass `claude-opus-4-8` diese Runde bedient. OpenClaw aktiviert dies
automatisch für direkte API-Schlüssel-Anfragen, sodass einige Fable-Runden von Claude Opus 4.8 beantwortet
und abgerechnet werden. Wenn Ihre Richtlinie oder Ihr Budget von Opus bediente Runden nicht akzeptieren kann,
wählen Sie nicht `anthropic/claude-fable-5`.
</Warning>

### Warum dies existiert

Fable-5-Klassifikatoren geben `stop_reason: "refusal"` bei Anfragen in eingeschränkten
Domänen zurück, und sie erzeugen außerdem False Positives bei angrenzend unbedenklicher Arbeit (Sicherheits-
Tools, Life Sciences oder sogar die Aufforderung an das Modell, seine rohe
Argumentation wiederzugeben). Ohne Fallback schlägt die Runde mit einem Fehler fehl, obwohl
ein anderes Claude-Modell sie problemlos bedienen würde — die eigene Ablehnungsnachricht von Anthropic
weist API-Integratoren an, ein Fallback-Modell zu konfigurieren.

### Funktionsweise

1. Für jede direkte API-Schlüssel-Anfrage an `anthropic/claude-fable-5` sendet OpenClaw
   Anthropics serverseitige Fallback-Aktivierung: den
   Beta-Header `server-side-fallback-2026-06-01` plus
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 ist das einzige
   Fallback-Ziel, das Anthropic für Fable 5 erlaubt.
2. Nur eine Ablehnung durch einen Sicherheitsklassifikator löst den Fallback aus. Rate Limits,
   Überlastungen und Serverfehler verhalten sich exakt wie zuvor und laufen über
   OpenClaws normalen [Modell-Failover](/de/concepts/model-failover).
3. Die Rettung erfolgt innerhalb desselben Aufrufs. Eine Ablehnung vor jeder Ausgabe ist
   bis auf die Latenz unsichtbar; die gesamte Antwort stammt von Opus 4.8. Bei einer
   Ablehnung mitten im Stream wird der Teiltext als Präfix beibehalten, ab dem das Fallback-
   Modell fortsetzt, während die Argumentation und Tool-Aufrufe des abgelehnten Modells
   gemäß den Replay-Regeln von Anthropic verworfen werden (sie dürfen nicht zurückgegeben oder
   ausgeführt werden).
4. Wenn Claude Opus 4.8 ebenfalls ablehnt, zeigt die Runde die Ablehnung als
   Fehler an, exakt wie vor dieser Funktion.

Der Fallback erfolgt auf Ebene der Anthropic API, daher muss `claude-opus-4-8` nicht
in Ihrer konfigurierten Modellliste oder Fallback-Kette enthalten sein — ein Fable-fähiger
API-Schlüssel kann Opus immer bedienen.

### Beobachtbarkeit und Abrechnung

- Eine per Fallback bediente Runde zeichnet eine `provider_fallback`-Diagnose in der
  Assistentennachricht auf, die `fromModel` und `toModel` benennt, und das
  `responseModel` der Nachricht meldet `claude-opus-4-8`.
- Anthropic rechnet pro Versuch ab: Eine Ablehnung vor der Ausgabe ist kostenlos, und die Rettung
  wird zu Claude-Opus-4.8-Tarifen abgerechnet (derzeit die Hälfte der Fable-5-Tarife). OpenClaws
  Kostenschätzung pro Runde bepreist per Fallback bediente Runden entsprechend mit Opus-Tarifen.
- Eine Ablehnung mitten im Stream berechnet zusätzlich den bereits gestreamten Fable-Teil
  auf Anthropic-Seite; dieser Anteil wird in der nutzungsbasierten Aufschlüsselung pro Versuch der API gemeldet,
  aber nicht in OpenClaws Kostenschätzung pro Runde eingerechnet.

### Geltungsbereich

Gilt für `anthropic/claude-fable-5` mit API-Schlüssel-Authentifizierung gegen
`api.anthropic.com`. OAuth (Wiederverwendung eines Claude-CLI-Abonnements), Proxy-Basis-URLs,
Bedrock-, Vertex- und Foundry-Anfragen bleiben unverändert und zeigen dort weiterhin
Ablehnungen als Fehler an.

Live verifiziert: Ein unbedenklicher Prompt, der Fable 5 auffordert, seine rohe Chain of
Thought wiederzugeben, wird ohne Fallbacks mit `category: "reasoning_extraction"` abgelehnt,
und derselbe Prompt über OpenClaw gibt eine normale von Opus bediente
Antwort mit angehängter `provider_fallback`-Diagnose zurück.

Siehe Anthropics [Leitfaden zu Ablehnungen und Fallback](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
für das zugrunde liegende Verhalten.

## Prompt-Caching

OpenClaw unterstützt die Prompt-Caching-Funktion von Anthropic für API-Schlüssel-Authentifizierung.

| Wert                | Cache-Dauer     | Beschreibung                                      |
| ------------------- | --------------- | ------------------------------------------------- |
| `"short"` (Standard) | 5 Minuten      | Automatisch für API-Schlüssel-Authentifizierung angewendet |
| `"long"`            | 1 Stunde        | Erweiterter Cache                                 |
| `"none"`            | Kein Caching    | Prompt-Caching deaktivieren                       |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Cache-Überschreibungen pro Agent">
    Verwenden Sie Parameter auf Modellebene als Basis und überschreiben Sie dann bestimmte Agents über `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Reihenfolge der Config-Zusammenführung:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (passende `id`, überschreibt nach Schlüssel)

    Dadurch kann ein Agent einen langlebigen Cache behalten, während ein anderer Agent mit demselben Modell das Caching für stoßartigen Traffic mit geringer Wiederverwendung deaktiviert.

  </Accordion>

  <Accordion title="Bedrock-Claude-Hinweise">
    - Anthropic-Claude-Modelle auf Bedrock (`amazon-bedrock/*anthropic.claude*`) akzeptieren `cacheRetention` als Pass-through, wenn es konfiguriert ist.
    - Nicht-Anthropic-Bedrock-Modelle werden zur Laufzeit auf `cacheRetention: "none"` erzwungen.
    - Intelligente Standardwerte für API-Schlüssel setzen außerdem `cacheRetention: "short"` für Claude-on-Bedrock-Refs, wenn kein expliziter Wert festgelegt ist.

  </Accordion>
</AccordionGroup>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Schneller Modus">
    Der gemeinsame `/fast`-Schalter von OpenClaw unterstützt direkten Anthropic-Traffic (API-Schlüssel und OAuth zu `api.anthropic.com`).

    | Befehl | Wird abgebildet auf |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Wird nur für direkte `api.anthropic.com`-Anfragen injiziert. Proxy-Routen lassen `service_tier` unverändert.
    - Explizite `serviceTier`- oder `service_tier`-Parameter überschreiben `/fast`, wenn beide gesetzt sind.
    - Bei Konten ohne Priority-Tier-Kapazität kann `service_tier: "auto"` zu `standard` aufgelöst werden.

    </Note>

  </Accordion>

  <Accordion title="Medienverständnis (Bild und PDF)">
    Das gebündelte Anthropic-Plugin registriert Bild- und PDF-Verständnis. OpenClaw
    löst Medienfunktionen automatisch aus der konfigurierten Anthropic-Authentifizierung auf — es ist keine
    zusätzliche Config erforderlich.

    | Eigenschaft        | Wert                 |
    | --------------- | --------------------- |
    | Standardmodell   | `claude-opus-4-8`     |
    | Unterstützte Eingabe | Bilder, PDF-Dokumente |

    Wenn ein Bild oder eine PDF an eine Unterhaltung angehängt wird, leitet OpenClaw sie automatisch
    über den Anthropic-Provider für Medienverständnis.

  </Accordion>

  <Accordion title="1M-Kontextfenster">
    Anthropic's 1M-Kontextfenster ist für GA-fähige Claude-4.x-Modelle
    wie Opus 4.8, Opus 4.7, Opus 4.6 und Sonnet 4.6 verfügbar. OpenClaw dimensioniert diese Modelle
    automatisch auf 1M:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Ältere Configs können `params.context1m: true` beibehalten, aber OpenClaw sendet den
    ausgemusterten Beta-Header `context-1m-2025-08-07` nicht mehr. Ältere `anthropicBeta`-Config-
    Einträge mit diesem Wert werden bei der Auflösung der Anfrage-Header ignoriert, und
    nicht unterstützte ältere Claude-Modelle bleiben bei ihrem normalen Kontextfenster.

    `params.context1m: true` gilt außerdem für das Claude-CLI-Backend
    (`claude-cli/*`) für berechtigte GA-fähige Opus- und Sonnet-Modelle und erhält
    das Laufzeit-Kontextfenster für diese CLI-Sitzungen, damit es dem Verhalten der direkten API
    entspricht.

    <Warning>
    Erfordert Long-Context-Zugriff für Ihre Anthropic-Zugangsdaten. OAuth-/Abonnement-Token-Authentifizierung behält ihre erforderlichen Anthropic-Beta-Header bei, aber OpenClaw entfernt den ausgemusterten 1M-Beta-Header, falls er in älteren Configs verbleibt.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M-Kontext">
    `anthropic/claude-opus-4-8` und seine `claude-cli`-Variante haben standardmäßig ein 1M-Kontextfenster — kein `params.context1m: true` erforderlich.
  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="401-Fehler / Token plötzlich ungültig">
    Anthropic-Token-Authentifizierung läuft ab und kann widerrufen werden. Verwenden Sie für neue Setups stattdessen einen Anthropic-API-Schlüssel.
  </Accordion>

  <Accordion title='Kein API-Schlüssel für Provider "anthropic" gefunden'>
    Anthropic-Authentifizierung ist **pro Agent** — neue Agents übernehmen die Schlüssel des Haupt-Agents nicht. Führen Sie das Onboarding für diesen Agent erneut aus (oder konfigurieren Sie einen API-Schlüssel auf dem Gateway-Host), und prüfen Sie anschließend mit `openclaw models status`.
  </Accordion>

  <Accordion title='Keine Zugangsdaten für Profil "anthropic:default" gefunden'>
    Führen Sie `openclaw models status` aus, um zu sehen, welches Authentifizierungsprofil aktiv ist. Führen Sie das Onboarding erneut aus, oder konfigurieren Sie einen API-Schlüssel für diesen Profilpfad.
  </Accordion>

  <Accordion title="Kein verfügbares Authentifizierungsprofil (alle in Abklingzeit)">
    Prüfen Sie `openclaw models status --json` auf `auth.unusableProfiles`. Anthropic-Rate-Limit-Abklingzeiten können modellspezifisch sein, daher kann ein verwandtes Anthropic-Modell weiterhin verwendbar sein. Fügen Sie ein weiteres Anthropic-Profil hinzu, oder warten Sie auf die Abklingzeit.
  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="CLI-Backends" href="/de/gateway/cli-backends" icon="terminal">
    Einrichtung und Laufzeitdetails des Claude-CLI-Backends.
  </Card>
  <Card title="Prompt-Caching" href="/de/reference/prompt-caching" icon="database">
    Wie Prompt-Caching Provider-übergreifend funktioniert.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Authentifizierungsdetails und Regeln für die Wiederverwendung von Zugangsdaten.
  </Card>
</CardGroup>
