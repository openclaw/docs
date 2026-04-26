---
read_when:
    - Sie möchten Anthropic-Modelle in OpenClaw verwenden
summary: Anthropic Claude über API-Keys oder Claude CLI in OpenClaw verwenden
title: Anthropic
x-i18n:
    generated_at: "2026-04-26T11:37:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: f26f117cb4f98790c323e056d39267c18f1278b0a7a8d3d43a7cbaddbb4523c1
    source_path: providers/anthropic.md
    workflow: 15
---

Anthropic entwickelt die Modellfamilie **Claude**. OpenClaw unterstützt zwei Authentifizierungswege:

- **API-Key** — direkter Zugriff auf die Anthropic-API mit nutzungsbasierter Abrechnung (`anthropic/*`-Modelle)
- **Claude CLI** — Wiederverwendung einer vorhandenen Claude-CLI-Anmeldung auf demselben Host

<Warning>
Anthropic-Mitarbeitende haben uns mitgeteilt, dass die Nutzung der Claude CLI im Stil von OpenClaw wieder erlaubt ist. Daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` als genehmigt, sofern
Anthropic keine neue Richtlinie veröffentlicht.

Für langlebige Gateway-Hosts sind Anthropic-API-Keys weiterhin der klarste und
vorhersehbarste Produktionspfad.

Aktuelle öffentliche Dokumentation von Anthropic:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Erste Schritte

<Tabs>
  <Tab title="API-Key">
    **Am besten geeignet für:** standardmäßigen API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="API-Key abrufen">
        Erstellen Sie einen API-Key in der [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard
        # wählen Sie: Anthropic API key
        ```

        Oder übergeben Sie den Key direkt:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
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
    **Am besten geeignet für:** Wiederverwendung einer vorhandenen Claude-CLI-Anmeldung ohne separaten API-Key.

    <Steps>
      <Step title="Sicherstellen, dass Claude CLI installiert und angemeldet ist">
        Prüfen Sie mit:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard
        # wählen Sie: Claude CLI
        ```

        OpenClaw erkennt die vorhandenen Claude-CLI-Anmeldedaten und verwendet sie wieder.
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Setup- und Laufzeitdetails für das Backend Claude CLI finden Sie unter [CLI Backends](/de/gateway/cli-backends).
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

    Veraltete Modellreferenzen wie `claude-cli/claude-opus-4-7` funktionieren
    aus Kompatibilitätsgründen weiterhin, aber neue Konfigurationen sollten die Auswahl von Provider/Modell als
    `anthropic/*` beibehalten und das Ausführungs-Backend in `agentRuntime.id` ablegen.

    <Tip>
    Wenn Sie den klarsten Abrechnungspfad möchten, verwenden Sie stattdessen einen Anthropic-API-Key. OpenClaw unterstützt auch abonnementartige Optionen von [OpenAI Codex](/de/providers/openai), [Qwen Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und [Z.AI / GLM](/de/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Standardwerte für Thinking (Claude 4.6)

Claude-4.6-Modelle verwenden in OpenClaw standardmäßig `adaptive` Thinking, wenn kein explizites Thinking-Level gesetzt ist.

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
Verwandte Anthropic-Dokumentation:
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Prompt Caching

OpenClaw unterstützt das Feature Prompt Caching von Anthropic für API-Key-Authentifizierung.

| Wert                | Cache-Dauer | Beschreibung                             |
| ------------------- | ----------- | ---------------------------------------- |
| `"short"` (Standard) | 5 Minuten   | Wird automatisch für API-Key-Authentifizierung angewendet |
| `"long"`            | 1 Stunde    | Erweiterter Cache                        |
| `"none"`            | Kein Caching | Prompt Caching deaktivieren              |

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

    Reihenfolge beim Zusammenführen der Konfiguration:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (passende `id`, überschreibt schlüsselweise)

    So kann ein Agent einen langlebigen Cache behalten, während ein anderer Agent auf demselben Modell das Caching für burstigen Traffic mit geringer Wiederverwendung deaktiviert.

  </Accordion>

  <Accordion title="Hinweise zu Bedrock Claude">
    - Anthropic-Claude-Modelle auf Bedrock (`amazon-bedrock/*anthropic.claude*`) akzeptieren konfiguriertes `cacheRetention` als Durchreichung.
    - Nicht-Anthropic-Bedrock-Modelle werden zur Laufzeit auf `cacheRetention: "none"` gezwungen.
    - Intelligente Standardwerte für API-Keys setzen außerdem `cacheRetention: "short"` für Claude-on-Bedrock-Referenzen, wenn kein expliziter Wert gesetzt ist.
  </Accordion>
</AccordionGroup>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Fast Mode">
    Der gemeinsame Schalter `/fast` von OpenClaw unterstützt direkten Anthropic-Traffic (`api.anthropic.com`) per API-Key und OAuth.

    | Befehl | Entspricht |
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
    - Wird nur für direkte Anfragen an `api.anthropic.com` eingefügt. Proxy-Routen lassen `service_tier` unverändert.
    - Explizite Parameter `serviceTier` oder `service_tier` überschreiben `/fast`, wenn beide gesetzt sind.
    - Bei Accounts ohne Priority-Tier-Kapazität kann `service_tier: "auto"` zu `standard` aufgelöst werden.
    </Note>

  </Accordion>

  <Accordion title="Medienverständnis (Bild und PDF)">
    Das gebündelte Anthropic-Plugin registriert Bild- und PDF-Verständnis. OpenClaw
    löst Medienfähigkeiten automatisch aus der konfigurierten Anthropic-Authentifizierung auf — zusätzliche
    Konfiguration ist nicht erforderlich.

    | Eigenschaft       | Wert                 |
    | -------------- | -------------------- |
    | Standardmodell  | `claude-opus-4-6`    |
    | Unterstützte Eingabe | Bilder, PDF-Dokumente |

    Wenn ein Bild oder PDF an eine Konversation angehängt wird, leitet OpenClaw
    es automatisch durch den Anthropic-Provider für Medienverständnis.

  </Accordion>

  <Accordion title="1M-Kontextfenster (Beta)">
    Das 1M-Kontextfenster von Anthropic ist Beta-gesteuert. Aktivieren Sie es pro Modell:

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

    OpenClaw bildet dies in Anfragen auf `anthropic-beta: context-1m-2025-08-07` ab.

    `params.context1m: true` gilt auch für das Backend Claude CLI
    (`claude-cli/*`) bei geeigneten Opus- und Sonnet-Modellen und erweitert das Laufzeit-
    Kontextfenster dieser CLI-Sitzungen so, dass es dem Verhalten der direkten API entspricht.

    <Warning>
    Erfordert Langkontext-Zugriff für Ihre Anthropic-Anmeldedaten. Legacy-Token-Authentifizierung (`sk-ant-oat-*`) wird für 1M-Kontext-Anfragen abgelehnt — OpenClaw protokolliert eine Warnung und fällt auf das Standard-Kontextfenster zurück.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M-Kontext">
    `anthropic/claude-opus-4.7` und seine Variante `claude-cli` haben standardmäßig ein 1M-Kontext-
    fenster — `params.context1m: true` ist nicht erforderlich.
  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="401-Fehler / Token plötzlich ungültig">
    Die Token-Authentifizierung von Anthropic läuft ab und kann widerrufen werden. Für neue Setups verwenden Sie stattdessen einen Anthropic-API-Key.
  </Accordion>

  <Accordion title='Kein API-Key für Provider "anthropic" gefunden'>
    Anthropic-Authentifizierung ist **pro Agent** — neue Agenten übernehmen die Keys des Hauptagenten nicht. Führen Sie das Onboarding für diesen Agenten erneut aus (oder konfigurieren Sie einen API-Key auf dem Gateway-Host) und prüfen Sie dann mit `openclaw models status`.
  </Accordion>

  <Accordion title='Keine Anmeldedaten für Profil "anthropic:default" gefunden'>
    Führen Sie `openclaw models status` aus, um zu sehen, welches Authentifizierungsprofil aktiv ist. Führen Sie das Onboarding erneut aus oder konfigurieren Sie einen API-Key für diesen Profilpfad.
  </Accordion>

  <Accordion title="Kein verfügbares Authentifizierungsprofil (alle im Cooldown)">
    Prüfen Sie `openclaw models status --json` auf `auth.unusableProfiles`. Anthropic-Cooldowns wegen Ratenlimits können modellspezifisch sein, daher kann ein benachbartes Anthropic-Modell weiterhin verwendbar sein. Fügen Sie ein weiteres Anthropic-Profil hinzu oder warten Sie, bis der Cooldown endet.
  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Verwandte Inhalte

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="CLI Backends" href="/de/gateway/cli-backends" icon="terminal">
    Setup- und Laufzeitdetails für das Backend Claude CLI.
  </Card>
  <Card title="Prompt Caching" href="/de/reference/prompt-caching" icon="database">
    Wie Prompt Caching providerübergreifend funktioniert.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Details zur Authentifizierung und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
