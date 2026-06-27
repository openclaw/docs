---
read_when:
    - Sie möchten Anthropic-Modelle in OpenClaw verwenden
summary: Anthropic Claude über API-Schlüssel oder Claude CLI in OpenClaw verwenden
title: Anthropic
x-i18n:
    generated_at: "2026-06-27T18:01:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 299bb8661bb894c57ca7a60f350494d22f6b726061ffcb70df053c40a3f842b0
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic entwickelt die **Claude**-Modellfamilie. OpenClaw unterstützt zwei Authentifizierungswege:

- **API-Schlüssel** — direkter Anthropic-API-Zugriff mit nutzungsbasierter Abrechnung (`anthropic/*`-Modelle)
- **Claude CLI** — eine vorhandene Claude Code-Anmeldung auf demselben Host wiederverwenden

<Warning>
Das Claude CLI-Backend von OpenClaw führt die installierte Claude Code CLI im
nicht interaktiven Druckmodus aus. Die aktuellen Claude Code-Dokumente von
Anthropic beschreiben `claude -p` als Agent SDK-/programmatische Nutzung. Ab
dem 15. Juni 2026 sagt Anthropic, dass die Nutzung von `claude -p` mit
Abonnementtarifen nicht mehr aus den normalen Claude-Planlimits entnommen wird;
sie wird zuerst aus einem separaten monatlichen Agent SDK-Guthaben und danach
aus Nutzungsguthaben zu Standard-API-Tarifen entnommen, wenn diese Guthaben
aktiviert sind.

Interaktiver Claude Code wird weiterhin auf die Limits des angemeldeten
Claude-Plans angerechnet. Authentifizierung per API-Schlüssel bleibt direkte
nutzungsbasierte API-Abrechnung. Verwenden Sie für langlebige Gateway-Hosts,
gemeinsam genutzte Automatisierung und planbare Produktionskosten einen
Anthropic-API-Schlüssel.

Aktuelle öffentliche Dokumente von Anthropic:

- [Claude Code CLI-Referenz](https://code.claude.com/docs/en/cli-usage)
- [Das Claude Agent SDK mit Ihrem Claude-Plan verwenden](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Claude Code mit Ihrem Pro- oder Max-Plan verwenden](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Claude Code mit Ihrem Team- oder Enterprise-Plan verwenden](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Claude Code-Kosten verwalten](https://code.claude.com/docs/en/costs)

</Warning>

## Erste Schritte

<Tabs>
  <Tab title="API key">
    **Am besten geeignet für:** standardmäßigen API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="Get your API key">
        Erstellen Sie einen API-Schlüssel in der [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Oder übergeben Sie den Schlüssel direkt:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
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
    **Am besten geeignet für:** die Wiederverwendung einer vorhandenen Claude CLI-Anmeldung ohne separaten API-Schlüssel.

    <Steps>
      <Step title="Ensure Claude CLI is installed and logged in">
        Prüfen Sie dies mit:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw erkennt und verwendet die vorhandenen Claude CLI-Anmeldedaten wieder.
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Einrichtungs- und Laufzeitdetails für das Claude CLI-Backend finden Sie unter [CLI-Backends](/de/gateway/cli-backends).
    </Note>

    <Warning>
    Die Wiederverwendung der Claude CLI setzt voraus, dass der OpenClaw-Prozess
    auf demselben Host wie die Claude CLI-Anmeldung ausgeführt wird.
    Docker-Installationen können ein Container-Home beibehalten und sich dort
    bei Claude Code anmelden; siehe
    [Claude CLI-Backend in Docker](/de/install/docker#claude-cli-backend-in-docker).
    Andere Container-Installationen wie [Podman](/de/install/podman) hängen das
    Host-Verzeichnis `~/.claude` nicht in Einrichtung oder Laufzeit ein;
    verwenden Sie dort einen Anthropic-API-Schlüssel oder wählen Sie einen
    Provider mit von OpenClaw verwaltetem OAuth, etwa
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

    Ältere `claude-cli/claude-opus-4-7`-Modellreferenzen funktionieren aus
    Kompatibilitätsgründen weiterhin, aber neue Konfigurationen sollten die
    Provider-/Modellauswahl als `anthropic/*` beibehalten und das
    Ausführungs-Backend in der Provider-/Modell-Laufzeitrichtlinie festlegen.

    ### Abrechnung und `claude -p`

    OpenClaw verwendet den nicht interaktiven `claude -p`-Pfad von Claude Code
    für Claude CLI-Läufe. Anthropic behandelt diesen Pfad derzeit als Agent SDK-/programmatische Nutzung:

    - Bis zum 15. Juni 2026 folgt die Behandlung von Abonnementtarifen den
      aktiven Claude Code-Regeln von Anthropic für das angemeldete Konto.
    - Ab dem 15. Juni 2026 wird die Nutzung von `claude -p` mit
      Abonnementtarifen zuerst aus dem monatlichen Agent SDK-Guthaben des
      Benutzers und anschließend aus Nutzungsguthaben zu Standard-API-Tarifen
      entnommen, wenn Nutzungsguthaben aktiviert sind.
    - Console-/API-Schlüssel-Anmeldungen verwenden nutzungsbasierte API-Abrechnung
      und erhalten nicht das Agent SDK-Guthaben des Abonnements.

    Anthropic kann das Abrechnungs- und Ratenlimit-Verhalten von Claude Code
    ohne OpenClaw-Release ändern. Prüfen Sie `claude auth status`, `/status` und
    die verlinkten Dokumente von Anthropic, wenn planbare Abrechnung wichtig ist.

    <Tip>
    Verwenden Sie für gemeinsam genutzte Produktionsautomatisierung einen
    Anthropic-API-Schlüssel statt Claude CLI. OpenClaw unterstützt auch
    abonnementähnliche Optionen von [OpenAI Codex](/de/providers/openai),
    [Qwen Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und
    [Z.AI / GLM](/de/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Thinking-Standards (Claude Fable 5, 4.8 und 4.6)

`anthropic/claude-fable-5` verwendet immer adaptives Thinking und nutzt
standardmäßig `high`-Aufwand. Da Anthropic das Deaktivieren von Thinking für
dieses Modell nicht erlaubt, verwenden `/think off` und `/think minimal`
`low`-Aufwand. OpenClaw lässt außerdem benutzerdefinierte Temperaturwerte für
Fable 5-Anfragen weg.

Claude Opus 4.8 lässt Thinking in OpenClaw standardmäßig deaktiviert. Wenn Sie adaptives Thinking mit `/think high|xhigh|max` ausdrücklich aktivieren, sendet OpenClaw die Opus 4.8-Aufwandswerte von Anthropic; Claude 4.6-Modelle verwenden standardmäßig `adaptive`.

Überschreiben Sie dies pro Nachricht mit `/think:<level>` oder in Modellparametern:

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

## Prompt-Caching

OpenClaw unterstützt die Prompt-Caching-Funktion von Anthropic für Authentifizierung per API-Schlüssel.

| Wert                | Cache-Dauer       | Beschreibung                                           |
| ------------------- | ----------------- | ------------------------------------------------------ |
| `"short"` (Standard) | 5 Minuten         | Wird automatisch für Authentifizierung per API-Schlüssel angewendet |
| `"long"`            | 1 Stunde          | Erweiterter Cache                                      |
| `"none"`            | Kein Caching      | Prompt-Caching deaktivieren                            |

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
  <Accordion title="Per-agent cache overrides">
    Verwenden Sie Parameter auf Modellebene als Basis und überschreiben Sie dann bestimmte Agenten über `agents.list[].params`:

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

    Reihenfolge der Konfigurationszusammenführung:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (passende `id`, überschreibt nach Schlüssel)

    So kann ein Agent einen langlebigen Cache behalten, während ein anderer Agent auf demselben Modell das Caching für stoßweisen Traffic mit geringer Wiederverwendung deaktiviert.

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - Anthropic Claude-Modelle auf Bedrock (`amazon-bedrock/*anthropic.claude*`) akzeptieren `cacheRetention`-Durchreichung, wenn sie konfiguriert ist.
    - Nicht-Anthropic-Bedrock-Modelle werden zur Laufzeit auf `cacheRetention: "none"` erzwungen.
    - Intelligente Standards für API-Schlüssel setzen außerdem `cacheRetention: "short"` für Claude-auf-Bedrock-Referenzen, wenn kein expliziter Wert festgelegt ist.

  </Accordion>
</AccordionGroup>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Fast mode">
    Der gemeinsame `/fast`-Schalter von OpenClaw unterstützt direkten Anthropic-Traffic (API-Schlüssel und OAuth zu `api.anthropic.com`).

    | Befehl | Wird zugeordnet zu |
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
    - Bei Konten ohne Priority Tier-Kapazität kann `service_tier: "auto"` zu `standard` aufgelöst werden.

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    Das gebündelte Anthropic-Plugin registriert Bild- und PDF-Verständnis.
    OpenClaw löst Medienfähigkeiten automatisch aus der konfigurierten
    Anthropic-Authentifizierung auf — keine zusätzliche Konfiguration ist
    erforderlich.

    | Eigenschaft       | Wert                  |
    | ----------------- | --------------------- |
    | Standardmodell    | `claude-opus-4-8`     |
    | Unterstützte Eingabe | Bilder, PDF-Dokumente |

    Wenn ein Bild oder PDF an eine Unterhaltung angehängt wird, leitet OpenClaw
    es automatisch über den Anthropic-Provider für Medienverständnis.

  </Accordion>

  <Accordion title="1M context window">
    Das 1M-Kontextfenster von Anthropic ist auf GA-fähigen Claude 4.x-Modellen
    wie Opus 4.8, Opus 4.7, Opus 4.6 und Sonnet 4.6 verfügbar. OpenClaw
    dimensioniert diese Modelle automatisch auf 1M:

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

    Ältere Konfigurationen können `params.context1m: true` beibehalten, aber
    OpenClaw sendet den eingestellten `context-1m-2025-08-07`-Beta-Header nicht
    mehr. Ältere `anthropicBeta`-Konfigurationseinträge mit diesem Wert werden
    bei der Auflösung von Anfrage-Headern ignoriert, und nicht unterstützte
    ältere Claude-Modelle bleiben bei ihrem normalen Kontextfenster.

    `params.context1m: true` gilt auch für das Claude CLI-Backend
    (`claude-cli/*`) für geeignete GA-fähige Opus- und Sonnet-Modelle und
    bewahrt das Laufzeit-Kontextfenster für diese CLI-Sitzungen so, dass es dem
    direkten API-Verhalten entspricht.

    <Warning>
    Erfordert Long-Context-Zugriff für Ihre Anthropic-Anmeldedaten. OAuth-/Abonnementtoken-Authentifizierung behält ihre erforderlichen Anthropic-Beta-Header bei, aber OpenClaw entfernt den eingestellten 1M-Beta-Header, falls er in älteren Konfigurationen verbleibt.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M context">
    `anthropic/claude-opus-4-8` und seine `claude-cli`-Variante haben
    standardmäßig ein 1M-Kontextfenster — kein `params.context1m: true`
    erforderlich.
  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="401 errors / token suddenly invalid">
    Anthropic-Token-Authentifizierung läuft ab und kann widerrufen werden. Verwenden Sie für neue Einrichtungen stattdessen einen Anthropic-API-Schlüssel.
  </Accordion>

  <Accordion title='Kein API-Schlüssel für Provider "anthropic" gefunden'>
    Anthropic-Auth ist **pro Agent** — neue Agenten übernehmen die Schlüssel des Haupt-Agenten nicht. Führen Sie das Onboarding für diesen Agenten erneut aus (oder konfigurieren Sie einen API-Schlüssel auf dem Gateway-Host) und verifizieren Sie anschließend mit `openclaw models status`.
  </Accordion>

  <Accordion title='Keine Anmeldedaten für Profil "anthropic:default" gefunden'>
    Führen Sie `openclaw models status` aus, um zu sehen, welches Auth-Profil aktiv ist. Führen Sie das Onboarding erneut aus, oder konfigurieren Sie einen API-Schlüssel für diesen Profilpfad.
  </Accordion>

  <Accordion title="Kein verfügbares Auth-Profil (alle in der Abklingzeit)">
    Prüfen Sie `openclaw models status --json` auf `auth.unusableProfiles`. Anthropic-Ratenlimit-Abklingzeiten können modellbezogen sein, daher kann ein benachbartes Anthropic-Modell weiterhin nutzbar sein. Fügen Sie ein weiteres Anthropic-Profil hinzu oder warten Sie auf die Abklingzeit.
  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="CLI-Backends" href="/de/gateway/cli-backends" icon="terminal">
    Einrichtung und Laufzeitdetails des Claude CLI-Backends.
  </Card>
  <Card title="Prompt-Caching" href="/de/reference/prompt-caching" icon="database">
    Wie Prompt-Caching Provider-übergreifend funktioniert.
  </Card>
  <Card title="OAuth und Auth" href="/de/gateway/authentication" icon="key">
    Auth-Details und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
