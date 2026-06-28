---
read_when:
    - Sie möchten Anthropic-Modelle in OpenClaw verwenden
summary: Anthropic Claude über API-Schlüssel oder Claude CLI in OpenClaw verwenden
title: Anthropic
x-i18n:
    generated_at: "2026-06-28T20:44:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48a2792e464175b3ebe6acd92606c20231fd31940f56e2432bb45657eb0a68d7
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic entwickelt die **Claude**-Modellfamilie. OpenClaw unterstützt zwei Authentifizierungswege:

- **API-Schlüssel** — direkter Anthropic-API-Zugriff mit nutzungsbasierter Abrechnung (`anthropic/*`-Modelle)
- **Claude CLI** — Wiederverwendung einer bestehenden Claude Code-Anmeldung auf demselben Host

<Warning>
Das Claude CLI-Backend von OpenClaw führt die installierte Claude Code CLI im
nicht interaktiven Print-Modus aus. Die aktuellen Claude Code-Dokumente von Anthropic beschreiben
`claude -p` als Agent SDK-/programmgesteuerte Nutzung. Das Support-Update von Anthropic vom 15. Juni 2026
hat die angekündigte Änderung der Agent SDK-Abrechnung pausiert. Derzeit sagt Anthropic,
dass Claude Agent SDK, `claude -p` und die Nutzung von Drittanbieter-Apps weiterhin die
Nutzungslimits eines Abonnements beanspruchen. Das zuvor angekündigte monatliche Agent SDK-Guthaben
ist nicht verfügbar, solange Anthropic diesen Plan überarbeitet.

Interaktives Claude Code beansprucht weiterhin die Limits des angemeldeten Claude-Plans. Die Authentifizierung per API-Schlüssel
bleibt direkte Pay-as-you-go-API-Abrechnung. Verwenden Sie für langfristig betriebene Gateway-Hosts,
gemeinsam genutzte Automatisierung und planbare Produktionskosten einen Anthropic-API-Schlüssel.

Prüfen Sie die aktuellen Support-Artikel von Anthropic, bevor Sie sich auf das
Abrechnungsverhalten von Abonnements verlassen:

- [Claude Code CLI-Referenz](https://code.claude.com/docs/en/cli-usage)
- [Das Claude Agent SDK mit Ihrem Claude-Plan verwenden](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Claude Code mit Ihrem Pro- oder Max-Plan verwenden](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Claude Code mit Ihrem Team- oder Enterprise-Plan verwenden](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Claude Code-Kosten verwalten](https://code.claude.com/docs/en/costs)

</Warning>

## Erste Schritte

<Tabs>
  <Tab title="API-Schlüssel">
    **Am besten geeignet für:** standardmäßigen API-Zugriff und nutzungsbasierte Abrechnung.

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
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Am besten geeignet für:** die Wiederverwendung einer bestehenden Claude CLI-Anmeldung ohne separaten API-Schlüssel.

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

        OpenClaw erkennt die bestehenden Claude CLI-Anmeldedaten und verwendet sie wieder.
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

    <Warning>
    Die Wiederverwendung von Claude CLI setzt voraus, dass der OpenClaw-Prozess auf demselben Host wie die
    Claude CLI-Anmeldung läuft. Docker-Installationen können ein Container-Home beibehalten und sich dort bei
    Claude Code anmelden; siehe
    [Claude CLI-Backend in Docker](/de/install/docker#claude-cli-backend-in-docker).
    Andere Container-Installationen wie [Podman](/de/install/podman) mounten das Host-Verzeichnis
    `~/.claude` nicht in Setup oder Laufzeit; verwenden Sie dort einen Anthropic-API-Schlüssel oder wählen Sie
    einen Provider mit von OpenClaw verwaltetem OAuth, etwa
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
    Kompatibilitätsgründen weiterhin, aber neue Konfigurationen sollten die Provider-/Modellauswahl als
    `anthropic/*` beibehalten und das Ausführungs-Backend in die Provider-/Modell-Laufzeitrichtlinie legen.

    ### Abrechnung und `claude -p`

    OpenClaw verwendet den nicht interaktiven `claude -p`-Pfad von Claude Code für Claude CLI-
    Läufe. Anthropic behandelt diesen Pfad derzeit als Agent SDK-/programmgesteuerte Nutzung:

    - Das Support-Update von Anthropic vom 15. Juni 2026 hat den zuvor angekündigten
      separaten Agent SDK-Guthabenplan pausiert.
    - Derzeit beanspruchen Claude Agent SDK, `claude -p` und die Nutzung von Drittanbieter-
      Apps im Rahmen eines Abonnementplans weiterhin die Nutzungslimits des angemeldeten Abonnements.
    - Das zuvor angekündigte monatliche Agent SDK-Guthaben ist nicht verfügbar, solange
      Anthropic diesen Plan überarbeitet.
    - Console-/API-Schlüssel-Anmeldungen verwenden Pay-as-you-go-API-Abrechnung und erhalten
      das Agent SDK-Guthaben des Abonnements nicht.

    Lesen Sie den [Agent SDK-Planartikel](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    von Anthropic für den Hinweis zur Pausierung sowie die Claude Code-Planartikel zum
    Abonnementverhalten für
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    und
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic kann das Abrechnungs- und Rate-Limit-Verhalten von Claude Code ohne ein
    OpenClaw-Release ändern. Prüfen Sie `claude auth status`, `/status` und
    die verlinkten Dokumente von Anthropic, wenn planbare Abrechnung wichtig ist.

    <Tip>
    Verwenden Sie für gemeinsam genutzte Produktionsautomatisierung einen Anthropic-API-Schlüssel statt
    Claude CLI. OpenClaw unterstützt außerdem abonnementähnliche Optionen von
    [OpenAI Codex](/de/providers/openai), [Qwen Cloud](/de/providers/qwen),
    [MiniMax](/de/providers/minimax) und [Z.AI / GLM](/de/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Thinking-Standards (Claude Fable 5, 4.8 und 4.6)

`anthropic/claude-fable-5` verwendet immer adaptives Denken und standardmäßig `high`
Aufwand. Da Anthropic nicht erlaubt, Thinking für dieses Modell zu deaktivieren,
verwenden `/think off` und `/think minimal` den Aufwand `low`. OpenClaw lässt außerdem benutzerdefinierte
Temperaturwerte bei Fable 5-Anfragen weg.

Claude Opus 4.8 lässt Thinking in OpenClaw standardmäßig ausgeschaltet. Wenn Sie adaptives Denken ausdrücklich mit `/think high|xhigh|max` aktivieren, sendet OpenClaw die Opus 4.8-Aufwandswerte von Anthropic; Claude 4.6-Modelle verwenden standardmäßig `adaptive`.

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
- [Adaptives Denken](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Erweitertes Denken](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Prompt-Caching

OpenClaw unterstützt Anthropics Prompt-Caching-Funktion für die Authentifizierung per API-Schlüssel.

| Wert                | Cache-Dauer    | Beschreibung                                      |
| ------------------- | -------------- | ------------------------------------------------- |
| `"short"` (Standard) | 5 Minuten      | Wird automatisch für API-Schlüssel-Authentifizierung angewendet |
| `"long"`            | 1 Stunde       | Erweiterter Cache                                 |
| `"none"`            | Kein Caching   | Prompt-Caching deaktivieren                       |

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
    Verwenden Sie Modellparameter als Basis und überschreiben Sie dann bestimmte Agents über `agents.list[].params`:

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

    So kann ein Agent einen langlebigen Cache behalten, während ein anderer Agent auf demselben Modell das Caching für stoßartigen Traffic mit geringer Wiederverwendung deaktiviert.

  </Accordion>

  <Accordion title="Bedrock Claude-Hinweise">
    - Anthropic Claude-Modelle auf Bedrock (`amazon-bedrock/*anthropic.claude*`) akzeptieren `cacheRetention`-Durchleitung, wenn sie konfiguriert ist.
    - Nicht-Anthropic-Bedrock-Modelle werden zur Laufzeit auf `cacheRetention: "none"` gezwungen.
    - Intelligente Standards für API-Schlüssel setzen außerdem `cacheRetention: "short"` für Claude-on-Bedrock-Refs, wenn kein expliziter Wert festgelegt ist.

  </Accordion>
</AccordionGroup>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Schnellmodus">
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
    - Bei Konten ohne Priority Tier-Kapazität kann `service_tier: "auto"` zu `standard` aufgelöst werden.

    </Note>

  </Accordion>

  <Accordion title="Medienverständnis (Bild und PDF)">
    Das gebündelte Anthropic-Plugin registriert Bild- und PDF-Verständnis. OpenClaw
    löst Medienfähigkeiten automatisch aus der konfigurierten Anthropic-Authentifizierung auf — es ist keine
    zusätzliche Konfiguration erforderlich.

    | Eigenschaft       | Wert                  |
    | --------------- | --------------------- |
    | Standardmodell   | `claude-opus-4-8`     |
    | Unterstützte Eingabe | Bilder, PDF-Dokumente |

    Wenn ein Bild oder PDF an eine Unterhaltung angehängt wird, leitet OpenClaw es automatisch
    über den Provider für Anthropic-Medienverständnis.

  </Accordion>

  <Accordion title="1M-Kontextfenster">
    Das 1M-Kontextfenster von Anthropic ist für GA-fähige Claude 4.x-Modelle verfügbar,
    etwa Opus 4.8, Opus 4.7, Opus 4.6 und Sonnet 4.6. OpenClaw dimensioniert diese Modelle automatisch auf
    1M:

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

    Ältere Konfigurationen können `params.context1m: true` beibehalten, aber OpenClaw sendet den
    eingestellten Beta-Header `context-1m-2025-08-07` nicht mehr. Ältere `anthropicBeta`-Konfigurations-
    einträge mit diesem Wert werden bei der Auflösung von Anfrage-Headern ignoriert, und
    nicht unterstützte ältere Claude-Modelle bleiben bei ihrem normalen Kontextfenster.

    `params.context1m: true` gilt außerdem für das Claude CLI-Backend
    (`claude-cli/*`) für berechtigte GA-fähige Opus- und Sonnet-Modelle, sodass
    das Laufzeit-Kontextfenster für diese CLI-Sitzungen erhalten bleibt und dem direkten API-
    Verhalten entspricht.

    <Warning>
    Erfordert Long-Context-Zugriff für Ihre Anthropic-Anmeldedaten. OAuth-/Abonnement-Token-Authentifizierung behält ihre erforderlichen Anthropic-Beta-Header bei, aber OpenClaw entfernt den eingestellten 1M-Beta-Header, wenn er in älteren Konfigurationen verbleibt.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M-Kontext">
    `anthropic/claude-opus-4-8` und seine `claude-cli`-Variante verfügen standardmäßig über ein 1M-Kontextfenster – `params.context1m: true` ist nicht nötig.
  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="401-Fehler / Token plötzlich ungültig">
    Die Anthropic-Token-Authentifizierung läuft ab und kann widerrufen werden. Verwenden Sie für neue Einrichtungen stattdessen einen Anthropic-API-Schlüssel.
  </Accordion>

  <Accordion title='Kein API-Schlüssel für Provider "anthropic" gefunden'>
    Die Anthropic-Authentifizierung gilt **pro Agent** – neue Agents übernehmen die Schlüssel des Haupt-Agents nicht. Führen Sie das Onboarding für diesen Agent erneut aus (oder konfigurieren Sie einen API-Schlüssel auf dem Gateway-Host) und prüfen Sie anschließend mit `openclaw models status`.
  </Accordion>

  <Accordion title='Keine Zugangsdaten für Profil "anthropic:default" gefunden'>
    Führen Sie `openclaw models status` aus, um zu sehen, welches Authentifizierungsprofil aktiv ist. Führen Sie das Onboarding erneut aus oder konfigurieren Sie einen API-Schlüssel für diesen Profilpfad.
  </Accordion>

  <Accordion title="Kein verfügbares Authentifizierungsprofil (alle in Abklingzeit)">
    Prüfen Sie `openclaw models status --json` auf `auth.unusableProfiles`. Anthropic-Rate-Limit-Abklingzeiten können modellspezifisch sein, sodass ein verwandtes Anthropic-Modell möglicherweise weiterhin nutzbar ist. Fügen Sie ein weiteres Anthropic-Profil hinzu oder warten Sie die Abklingzeit ab.
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
    Einrichtung des Claude-CLI-Backends und Laufzeitdetails.
  </Card>
  <Card title="Prompt-Caching" href="/de/reference/prompt-caching" icon="database">
    So funktioniert Prompt-Caching über Provider hinweg.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Authentifizierungsdetails und Regeln zur Wiederverwendung von Zugangsdaten.
  </Card>
</CardGroup>
