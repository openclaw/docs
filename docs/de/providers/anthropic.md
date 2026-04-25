---
read_when:
    - Sie möchten Anthropic-Modelle in OpenClaw verwenden.
summary: Anthropic Claude in OpenClaw über API-Keys oder Claude CLI verwenden
title: Anthropic
x-i18n:
    generated_at: "2026-04-25T13:54:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: daba524d9917321d2aec55222d0df7b850ddf7f5c1c13123b62807eebd1a7a1b
    source_path: providers/anthropic.md
    workflow: 15
---

Anthropic entwickelt die Modellfamilie **Claude**. OpenClaw unterstützt zwei Authentifizierungswege:

- **API key** — direkter Zugriff auf die Anthropic-API mit nutzungsbasierter Abrechnung (`anthropic/*`-Modelle)
- **Claude CLI** — Wiederverwendung einer bestehenden Claude CLI-Anmeldung auf demselben Host

<Warning>
Mitarbeitende von Anthropic haben uns mitgeteilt, dass OpenClaw-artige Claude CLI-Nutzung wieder erlaubt ist, daher
behandelt OpenClaw die Wiederverwendung von Claude CLI und die Nutzung von `claude -p` als zulässig, sofern
Anthropic keine neue Richtlinie veröffentlicht.

Für langlebige Gateway-Hosts sind Anthropic-API-Schlüssel weiterhin der klarste und
vorhersehbarste Produktionspfad.

Anthropics aktuelle öffentliche Dokumentation:

- [Claude Code CLI-Referenz](https://code.claude.com/docs/en/cli-reference)
- [Überblick über das Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Claude Code mit Ihrem Pro- oder Max-Tarif verwenden](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Claude Code mit Ihrem Team- oder Enterprise-Tarif verwenden](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Erste Schritte

<Tabs>
  <Tab title="API key">
    **Am besten geeignet für:** Standard-API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="API key abrufen">
        Erstellen Sie einen API-Schlüssel in der [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Oder den Schlüssel direkt übergeben:

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
    **Am besten geeignet für:** Wiederverwendung einer bestehenden Claude CLI-Anmeldung ohne separaten API-Schlüssel.

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
        # choose: Claude CLI
        ```

        OpenClaw erkennt die bestehenden Claude CLI-Anmeldedaten und verwendet sie erneut.
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Einrichtungs- und Laufzeitdetails für das Claude CLI-Backend finden Sie unter [CLI-Backends](/de/gateway/cli-backends).
    </Note>

    <Tip>
    Wenn Sie den klarsten Abrechnungsweg möchten, verwenden Sie stattdessen einen Anthropic-API-Schlüssel. OpenClaw unterstützt auch abonnementartige Optionen von [OpenAI Codex](/de/providers/openai), [Qwen Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und [Z.AI / GLM](/de/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Standardwerte für Thinking (Claude 4.6)

Claude-4.6-Modelle verwenden in OpenClaw standardmäßig `adaptive` Thinking, wenn kein explizites Thinking-Level festgelegt ist.

Pro Nachricht mit `/think:<level>` oder in den Modellparametern überschreiben:

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
- [Adaptive Thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended Thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Prompt-Caching

OpenClaw unterstützt Anthropics Prompt-Caching-Funktion für die Authentifizierung per API-Schlüssel.

| Wert                | Cache-Dauer  | Beschreibung                          |
| ------------------- | ------------ | ------------------------------------- |
| `"short"` (Standard) | 5 Minuten    | Wird für API-key-Authentifizierung automatisch angewendet |
| `"long"`            | 1 Stunde     | Erweiterter Cache                     |
| `"none"`            | Kein Caching | Prompt-Caching deaktivieren           |

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

    Reihenfolge der Konfigurationszusammenführung:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (übereinstimmende `id`, überschreibt nach Schlüssel)

    Dadurch kann ein Agent einen langlebigen Cache behalten, während ein anderer Agent auf demselben Modell das Caching für sprunghaften Traffic mit geringer Wiederverwendung deaktiviert.

  </Accordion>

  <Accordion title="Hinweise zu Bedrock Claude">
    - Anthropic-Claude-Modelle auf Bedrock (`amazon-bedrock/*anthropic.claude*`) akzeptieren konfiguriertes `cacheRetention` per Pass-through.
    - Für Nicht-Anthropic-Bedrock-Modelle wird zur Laufzeit `cacheRetention: "none"` erzwungen.
    - Smart-Defaults für API-Schlüssel setzen auch `cacheRetention: "short"` für Claude-on-Bedrock-Referenzen, wenn kein expliziter Wert festgelegt ist.
  </Accordion>
</AccordionGroup>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Schnellmodus">
    OpenClaws gemeinsamer Schalter `/fast` unterstützt direkten Anthropic-Traffic (API-Schlüssel und OAuth zu `api.anthropic.com`).

    | Command | Entspricht |
    |---------|------------|
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
    - Bei Konten ohne Priority-Tier-Kapazität kann `service_tier: "auto"` zu `standard` aufgelöst werden.
    </Note>

  </Accordion>

  <Accordion title="Medienverständnis (Bild und PDF)">
    Das gebündelte Anthropic-Plugin registriert Bild- und PDF-Verständnis. OpenClaw
    löst Medienfähigkeiten automatisch aus der konfigurierten Anthropic-Authentifizierung auf — keine
    zusätzliche Konfiguration ist erforderlich.

    | Property       | Wert                 |
    | -------------- | -------------------- |
    | Standardmodell | `claude-opus-4-6`    |
    | Unterstützte Eingabe | Bilder, PDF-Dokumente |

    Wenn ein Bild oder PDF an eine Unterhaltung angehängt wird, leitet OpenClaw es automatisch
    über den Anthropic-Anbieter für Medienverständnis weiter.

  </Accordion>

  <Accordion title="1M-Kontextfenster (Beta)">
    Anthropics 1M-Kontextfenster ist Beta-gesteuert. Aktivieren Sie es pro Modell:

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

    OpenClaw ordnet dies in Anfragen `anthropic-beta: context-1m-2025-08-07` zu.

    <Warning>
    Erfordert Long-Context-Zugriff für Ihre Anthropic-Anmeldedaten. Legacy-Token-Authentifizierung (`sk-ant-oat-*`) wird für 1M-Kontextanfragen abgelehnt — OpenClaw protokolliert eine Warnung und fällt auf das Standard-Kontextfenster zurück.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M-Kontext">
    `anthropic/claude-opus-4.7` und seine Variante `claude-cli` haben standardmäßig ein 1M-Kontextfenster —
    kein `params.context1m: true` erforderlich.
  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="401-Fehler / Token plötzlich ungültig">
    Anthropics Token-Authentifizierung läuft ab und kann widerrufen werden. Verwenden Sie für neue Setups stattdessen einen Anthropic-API-Schlüssel.
  </Accordion>

  <Accordion title='Kein API-Schlüssel für Anbieter "anthropic" gefunden'>
    Anthropic-Authentifizierung ist **pro Agent** — neue Agents übernehmen die Schlüssel des Haupt-Agents nicht. Führen Sie das Onboarding für diesen Agent erneut aus (oder konfigurieren Sie einen API-Schlüssel auf dem Gateway-Host) und prüfen Sie dann mit `openclaw models status`.
  </Accordion>

  <Accordion title='Keine Anmeldedaten für Profil "anthropic:default" gefunden'>
    Führen Sie `openclaw models status` aus, um zu sehen, welches Authentifizierungsprofil aktiv ist. Führen Sie das Onboarding erneut aus oder konfigurieren Sie einen API-Schlüssel für diesen Profilpfad.
  </Accordion>

  <Accordion title="Kein verfügbares Authentifizierungsprofil (alle in Cooldown)">
    Prüfen Sie `openclaw models status --json` auf `auth.unusableProfiles`. Anthropic-Ratenlimit-Cooldowns können modellspezifisch sein, daher kann ein benachbartes Anthropic-Modell weiterhin verwendbar sein. Fügen Sie ein weiteres Anthropic-Profil hinzu oder warten Sie auf das Ende des Cooldowns.
  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Anbieter, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="CLI-Backends" href="/de/gateway/cli-backends" icon="terminal">
    Einrichtungs- und Laufzeitdetails für das Claude CLI-Backend.
  </Card>
  <Card title="Prompt-Caching" href="/de/reference/prompt-caching" icon="database">
    Wie Prompt-Caching anbieterübergreifend funktioniert.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Details zur Authentifizierung und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
