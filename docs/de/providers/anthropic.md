---
read_when:
    - Sie möchten Anthropic-Modelle in OpenClaw verwenden
summary: Anthropic Claude über API-Schlüssel oder die Claude CLI in OpenClaw verwenden
title: Anthropic
x-i18n:
    generated_at: "2026-04-30T07:09:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfaba2eea6a2d263d76036d1e6859fc3b487e886ec460ef2ced83e5e8e834327
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic entwickelt die Modellfamilie **Claude**. OpenClaw unterstützt zwei Authentifizierungswege:

- **API-Schlüssel** — direkter Anthropic-API-Zugriff mit nutzungsbasierter Abrechnung (`anthropic/*`-Modelle)
- **Claude CLI** — Wiederverwendung einer vorhandenen Claude CLI-Anmeldung auf demselben Host

<Warning>
Anthropic-Mitarbeiter haben uns mitgeteilt, dass die Claude CLI-Nutzung im OpenClaw-Stil wieder zulässig ist. Daher behandelt
OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` als genehmigt, sofern
Anthropic keine neue Richtlinie veröffentlicht.

Für langlebige Gateway-Hosts sind Anthropic-API-Schlüssel weiterhin der klarste und
am besten vorhersehbare Produktionspfad.

Aktuelle öffentliche Anthropic-Dokumentation:

- [Claude Code CLI-Referenz](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK-Übersicht](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Claude Code mit Ihrem Pro- oder Max-Tarif verwenden](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Claude Code mit Ihrem Team- oder Enterprise-Tarif verwenden](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Erste Schritte

<Tabs>
  <Tab title="API-Schlüssel">
    **Am besten geeignet für:** Standard-API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="API-Schlüssel abrufen">
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
    **Am besten geeignet für:** Wiederverwendung einer vorhandenen Claude CLI-Anmeldung ohne separaten API-Schlüssel.

    <Steps>
      <Step title="Sicherstellen, dass die Claude CLI installiert und angemeldet ist">
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

        OpenClaw erkennt die vorhandenen Claude CLI-Anmeldedaten und verwendet sie erneut.
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Einrichtung und Laufzeitdetails für das Claude CLI-Backend finden Sie unter [CLI-Backends](/de/gateway/cli-backends).
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

    Alte `claude-cli/claude-opus-4-7`-Modellreferenzen funktionieren aus
    Kompatibilitätsgründen weiterhin, aber neue Konfigurationen sollten die Provider-/Modellauswahl bei
    `anthropic/*` belassen und das Ausführungs-Backend in `agentRuntime.id` angeben.

    <Tip>
    Wenn Sie den klarsten Abrechnungspfad möchten, verwenden Sie stattdessen einen Anthropic-API-Schlüssel. OpenClaw unterstützt außerdem abonnementartige Optionen von [OpenAI Codex](/de/providers/openai), [Qwen Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und [Z.AI / GLM](/de/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Thinking-Standards (Claude 4.6)

Claude 4.6-Modelle verwenden in OpenClaw standardmäßig `adaptive` Thinking, wenn keine explizite Thinking-Stufe festgelegt ist.

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

| Wert                | Cache-Dauer | Beschreibung                                      |
| ------------------- | ----------- | ------------------------------------------------- |
| `"short"` (Standard) | 5 Minuten   | Wird automatisch für API-Schlüssel-Authentifizierung angewendet |
| `"long"`            | 1 Stunde    | Erweiterter Cache                                 |
| `"none"`            | Kein Caching | Prompt-Caching deaktivieren                       |

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
    2. `agents.list[].params` (passende `id`, überschreibt nach Schlüssel)

    So kann ein Agent einen langlebigen Cache beibehalten, während ein anderer Agent auf demselben Modell das Caching für stoßartigen Datenverkehr mit geringer Wiederverwendung deaktiviert.

  </Accordion>

  <Accordion title="Bedrock-Claude-Hinweise">
    - Anthropic Claude-Modelle auf Bedrock (`amazon-bedrock/*anthropic.claude*`) akzeptieren bei entsprechender Konfiguration `cacheRetention` als Durchreichung.
    - Nicht-Anthropic-Bedrock-Modelle werden zur Laufzeit auf `cacheRetention: "none"` erzwungen.
    - API-Schlüssel-Smart-Standards setzen außerdem `cacheRetention: "short"` für Claude-on-Bedrock-Referenzen, wenn kein expliziter Wert festgelegt ist.

  </Accordion>
</AccordionGroup>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Schnellmodus">
    Der gemeinsame `/fast`-Schalter von OpenClaw unterstützt direkten Anthropic-Datenverkehr (API-Schlüssel und OAuth zu `api.anthropic.com`).

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
    - Wird nur für direkte Anfragen an `api.anthropic.com` injiziert. Proxy-Routen lassen `service_tier` unverändert.
    - Explizite `serviceTier`- oder `service_tier`-Parameter überschreiben `/fast`, wenn beide gesetzt sind.
    - Bei Konten ohne Priority-Tier-Kapazität kann `service_tier: "auto"` zu `standard` aufgelöst werden.

    </Note>

  </Accordion>

  <Accordion title="Medienverständnis (Bild und PDF)">
    Das gebündelte Anthropic-Plugin registriert Bild- und PDF-Verständnis. OpenClaw
    löst Medienfunktionen automatisch aus der konfigurierten Anthropic-Authentifizierung auf. Es ist keine
    zusätzliche Konfiguration erforderlich.

    | Eigenschaft    | Wert                 |
    | --------------- | -------------------- |
    | Standardmodell  | `claude-opus-4-6`    |
    | Unterstützte Eingabe | Bilder, PDF-Dokumente |

    Wenn ein Bild oder eine PDF an eine Unterhaltung angehängt wird, leitet OpenClaw sie automatisch
    über den Anthropic-Provider für Medienverständnis weiter.

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

    OpenClaw bildet dies bei Anfragen auf `anthropic-beta: context-1m-2025-08-07` ab.

    `params.context1m: true` gilt außerdem für das Claude CLI-Backend
    (`claude-cli/*`) für berechtigte Opus- und Sonnet-Modelle und erweitert das Laufzeit-
    Kontextfenster für diese CLI-Sitzungen so, dass es dem Verhalten der direkten API entspricht.

    <Warning>
    Erfordert Langkontextzugriff für Ihre Anthropic-Anmeldedaten. Alte Token-Authentifizierung (`sk-ant-oat-*`) wird für 1M-Kontextanfragen abgelehnt. OpenClaw protokolliert eine Warnung und fällt auf das Standard-Kontextfenster zurück.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M-Kontext">
    `anthropic/claude-opus-4.7` und seine `claude-cli`-Variante haben standardmäßig ein 1M-Kontext-
    fenster. Es ist kein `params.context1m: true` erforderlich.
  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="401-Fehler / Token plötzlich ungültig">
    Anthropic-Token-Authentifizierung läuft ab und kann widerrufen werden. Verwenden Sie für neue Einrichtungen stattdessen einen Anthropic-API-Schlüssel.
  </Accordion>

  <Accordion title='Kein API-Schlüssel für Provider "anthropic" gefunden'>
    Anthropic-Authentifizierung erfolgt **pro Agent**. Neue Agenten erben die Schlüssel des Haupt-Agenten nicht. Führen Sie das Onboarding für diesen Agenten erneut aus (oder konfigurieren Sie einen API-Schlüssel auf dem Gateway-Host) und prüfen Sie anschließend mit `openclaw models status`.
  </Accordion>

  <Accordion title='Keine Anmeldedaten für Profil "anthropic:default" gefunden'>
    Führen Sie `openclaw models status` aus, um zu sehen, welches Authentifizierungsprofil aktiv ist. Führen Sie das Onboarding erneut aus oder konfigurieren Sie einen API-Schlüssel für diesen Profilpfad.
  </Accordion>

  <Accordion title="Kein verfügbares Authentifizierungsprofil (alle in Abkühlzeit)">
    Prüfen Sie `openclaw models status --json` auf `auth.unusableProfiles`. Anthropic-Rate-Limit-Abkühlzeiten können modellspezifisch sein, sodass ein verwandtes Anthropic-Modell möglicherweise weiterhin nutzbar ist. Fügen Sie ein weiteres Anthropic-Profil hinzu oder warten Sie die Abkühlzeit ab.
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
    Einrichtung und Laufzeitdetails für das Claude CLI-Backend.
  </Card>
  <Card title="Prompt-Caching" href="/de/reference/prompt-caching" icon="database">
    Wie Prompt-Caching Provider-übergreifend funktioniert.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Authentifizierungsdetails und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
</CardGroup>
