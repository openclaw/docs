---
read_when:
    - Sie möchten Anthropic-Modelle in OpenClaw verwenden
summary: Anthropic Claude über API-Schlüssel oder die Claude CLI in OpenClaw verwenden
title: Anthropic
x-i18n:
    generated_at: "2026-05-07T13:24:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15ae1d2751d0127a45ece3d0a25bead21fd6bacc2ffc80636188fc2cb5f3d7ce
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic entwickelt die **Claude**-Modellfamilie. OpenClaw unterstützt zwei Authentifizierungswege:

- **API-Schlüssel** — direkter Anthropic-API-Zugriff mit nutzungsbasierter Abrechnung (`anthropic/*`-Modelle)
- **Claude CLI** — eine vorhandene Claude-CLI-Anmeldung auf demselben Host wiederverwenden

<Warning>
Anthropic-Mitarbeitende haben uns mitgeteilt, dass die Nutzung der Claude CLI im OpenClaw-Stil wieder erlaubt ist. Daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` als genehmigt, sofern Anthropic keine neue Richtlinie veröffentlicht.

Für langlebige Gateway-Hosts bleiben Anthropic-API-Schlüssel weiterhin der klarste und vorhersehbarste Produktionspfad.

Aktuelle öffentliche Dokumentation von Anthropic:

- [Claude Code CLI-Referenz](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK-Überblick](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Claude Code mit Ihrem Pro- oder Max-Plan verwenden](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Claude Code mit Ihrem Team- oder Enterprise-Plan verwenden](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Erste Schritte

<Tabs>
  <Tab title="API key">
    **Am besten für:** standardmäßigen API-Zugriff und nutzungsbasierte Abrechnung.

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
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Am besten für:** die Wiederverwendung einer vorhandenen Claude-CLI-Anmeldung ohne separaten API-Schlüssel.

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

        OpenClaw erkennt die vorhandenen Claude-CLI-Anmeldedaten und verwendet sie wieder.
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Einrichtung und Laufzeitdetails für das Claude-CLI-Backend finden Sie unter [CLI-Backends](/de/gateway/cli-backends).
    </Note>

    ### Konfigurationsbeispiel

    Bevorzugen Sie die kanonische Anthropic-Modellreferenz plus eine CLI-Laufzeitüberschreibung:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          agentRuntime: { id: "claude-cli" },
        },
      },
    }
    ```

    Legacy-Modellreferenzen wie `claude-cli/claude-opus-4-7` funktionieren aus Kompatibilitätsgründen weiterhin, neue Konfigurationen sollten die Provider-/Modellauswahl jedoch als `anthropic/*` beibehalten und das Ausführungs-Backend in `agentRuntime.id` ablegen.

    <Tip>
    Wenn Sie den klarsten Abrechnungspfad wünschen, verwenden Sie stattdessen einen Anthropic-API-Schlüssel. OpenClaw unterstützt außerdem abonnementartige Optionen von [OpenAI Codex](/de/providers/openai), [Qwen Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und [Z.AI / GLM](/de/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Thinking-Standards (Claude 4.6)

Claude-4.6-Modelle verwenden in OpenClaw standardmäßig `adaptive` Thinking, wenn keine explizite Thinking-Stufe festgelegt ist.

Überschreiben Sie dies pro Nachricht mit `/think:<level>` oder in den Modellparametern:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
Zugehörige Anthropic-Dokumentation:
- [Adaptives Thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Erweitertes Thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Prompt-Caching

OpenClaw unterstützt Anthropics Prompt-Caching-Funktion für Authentifizierung per API-Schlüssel.

| Wert                | Cache-Dauer | Beschreibung                                               |
| ------------------- | ----------- | ---------------------------------------------------------- |
| `"short"` (Standard) | 5 Minuten   | Wird automatisch für API-Schlüssel-Authentifizierung angewendet |
| `"long"`            | 1 Stunde    | Erweiterter Cache                                          |
| `"none"`            | Kein Caching | Prompt-Caching deaktivieren                                |

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

    Zusammenführungsreihenfolge der Konfiguration:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (passende `id`, überschreibt nach Schlüssel)

    So kann ein Agent einen langlebigen Cache behalten, während ein anderer Agent mit demselben Modell das Caching für sprunghaften Traffic mit geringer Wiederverwendung deaktiviert.

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - Anthropic-Claude-Modelle auf Bedrock (`amazon-bedrock/*anthropic.claude*`) akzeptieren bei entsprechender Konfiguration `cacheRetention` als Durchleitung.
    - Nicht-Anthropic-Bedrock-Modelle werden zur Laufzeit auf `cacheRetention: "none"` gezwungen.
    - Intelligente Standards für API-Schlüssel setzen außerdem `cacheRetention: "short"` für Claude-on-Bedrock-Referenzen, wenn kein expliziter Wert festgelegt ist.

  </Accordion>
</AccordionGroup>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Fast mode">
    OpenClaws gemeinsamer `/fast`-Schalter unterstützt direkten Anthropic-Traffic (API-Schlüssel und OAuth zu `api.anthropic.com`).

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
    - Wird nur für direkte Anfragen an `api.anthropic.com` injiziert. Proxy-Routen lassen `service_tier` unverändert.
    - Explizite `serviceTier`- oder `service_tier`-Parameter überschreiben `/fast`, wenn beide gesetzt sind.
    - Bei Konten ohne Priority-Tier-Kapazität kann `service_tier: "auto"` zu `standard` aufgelöst werden.

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    Das gebündelte Anthropic-Plugin registriert Bild- und PDF-Verständnis. OpenClaw löst Medienfunktionen automatisch aus der konfigurierten Anthropic-Authentifizierung auf; zusätzliche Konfiguration ist nicht erforderlich.

    | Eigenschaft     | Wert                  |
    | --------------- | --------------------- |
    | Standardmodell  | `claude-opus-4-7`     |
    | Unterstützte Eingabe | Bilder, PDF-Dokumente |

    Wenn ein Bild oder PDF an eine Unterhaltung angehängt wird, leitet OpenClaw es automatisch über den Anthropic-Provider für Medienverständnis weiter.

  </Accordion>

  <Accordion title="1M context window (beta)">
    Anthropics 1M-Kontextfenster ist beta-gesteuert. Aktivieren Sie es pro Modell:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw ordnet dies bei Anfragen `anthropic-beta: context-1m-2025-08-07` zu.

    `params.context1m: true` gilt außerdem für das Claude-CLI-Backend (`claude-cli/*`) bei geeigneten Opus- und Sonnet-Modellen und erweitert das Laufzeit-Kontextfenster für diese CLI-Sitzungen so, dass es dem Direkt-API-Verhalten entspricht.

    <Warning>
    Erfordert Langkontext-Zugriff für Ihre Anthropic-Anmeldedaten. Legacy-Token-Authentifizierung (`sk-ant-oat-*`) wird für 1M-Kontextanfragen abgelehnt; OpenClaw protokolliert eine Warnung und fällt auf das Standard-Kontextfenster zurück.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M context">
    `anthropic/claude-opus-4.7` und seine `claude-cli`-Variante haben standardmäßig ein 1M-Kontextfenster; `params.context1m: true` ist nicht erforderlich.
  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="401 errors / token suddenly invalid">
    Anthropic-Token-Authentifizierung läuft ab und kann widerrufen werden. Verwenden Sie für neue Einrichtungen stattdessen einen Anthropic-API-Schlüssel.
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    Anthropic-Authentifizierung gilt **pro Agent**; neue Agents übernehmen die Schlüssel des Haupt-Agents nicht. Führen Sie das Onboarding für diesen Agent erneut aus (oder konfigurieren Sie einen API-Schlüssel auf dem Gateway-Host) und prüfen Sie anschließend mit `openclaw models status`.
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    Führen Sie `openclaw models status` aus, um zu sehen, welches Authentifizierungsprofil aktiv ist. Führen Sie das Onboarding erneut aus oder konfigurieren Sie einen API-Schlüssel für diesen Profilpfad.
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    Prüfen Sie `openclaw models status --json` auf `auth.unusableProfiles`. Anthropic-Rate-Limit-Cooldowns können modellspezifisch sein, sodass ein verwandtes Anthropic-Modell möglicherweise weiterhin verwendbar ist. Fügen Sie ein weiteres Anthropic-Profil hinzu oder warten Sie auf den Ablauf des Cooldowns.
  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Model selection" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="CLI backends" href="/de/gateway/cli-backends" icon="terminal">
    Einrichtung und Laufzeitdetails des Claude-CLI-Backends.
  </Card>
  <Card title="Prompt caching" href="/de/reference/prompt-caching" icon="database">
    So funktioniert Prompt-Caching über Provider hinweg.
  </Card>
  <Card title="OAuth and auth" href="/de/gateway/authentication" icon="key">
    Authentifizierungsdetails und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
