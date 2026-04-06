---
read_when:
    - Sie möchten Anthropic-Modelle in OpenClaw verwenden
summary: Anthropic Claude über API-Schlüssel in OpenClaw verwenden
title: Anthropic
x-i18n:
    generated_at: "2026-04-06T03:10:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbc6c4938674aedf20ff944bc04e742c9a7e77a5ff10ae4f95b5718504c57c2d
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic entwickelt die Modellfamilie **Claude** und bietet Zugriff über eine API.
In OpenClaw sollte die neue Anthropic-Einrichtung einen API-Schlüssel verwenden. Bestehende ältere
Anthropic-Token-Profile werden zur Laufzeit weiterhin berücksichtigt, wenn sie bereits
konfiguriert sind.

<Warning>
Für Anthropic in OpenClaw gilt folgende Abrechnungsaufteilung:

- **Anthropic-API-Schlüssel**: normale Anthropic-API-Abrechnung.
- **Claude-Subscription-Authentifizierung innerhalb von OpenClaw**: Anthropic teilte OpenClaw-Nutzern am
  **4. April 2026 um 12:00 PM PT / 8:00 PM BST** mit, dass dies als
  Nutzung über ein Drittanbieter-Harness zählt und **Extra Usage** erfordert (Pay-as-you-go,
  getrennt vom Abonnement abgerechnet).

Unsere lokalen Reproduktionen bestätigen diese Aufteilung:

- direktes `claude -p` kann weiterhin funktionieren
- `claude -p --append-system-prompt ...` kann die Extra-Usage-Sperre auslösen, wenn
  der Prompt OpenClaw identifiziert
- derselbe OpenClaw-ähnliche System-Prompt reproduziert die Sperre **nicht** auf dem
  Anthropic-SDK- + `ANTHROPIC_API_KEY`-Pfad

Die praktische Regel lautet also: **Anthropic-API-Schlüssel oder Claude-Subscription mit
Extra Usage**. Wenn Sie den klarsten Produktionspfad möchten, verwenden Sie einen Anthropic-API-
Schlüssel.

Anthropics aktuelle öffentliche Dokumentation:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

Wenn Sie den klarsten Abrechnungspfad möchten, verwenden Sie stattdessen einen Anthropic-API-Schlüssel.
OpenClaw unterstützt auch andere Optionen im Stil eines Abonnements, darunter [OpenAI
Codex](/de/providers/openai), [Qwen Cloud Coding Plan](/de/providers/qwen),
[MiniMax Coding Plan](/de/providers/minimax) und [Z.AI / GLM Coding
Plan](/de/providers/glm).
</Warning>

## Option A: Anthropic-API-Schlüssel

**Am besten geeignet für:** standardmäßigen API-Zugriff und nutzungsbasierte Abrechnung.
Erstellen Sie Ihren API-Schlüssel in der Anthropic Console.

### CLI-Einrichtung

```bash
openclaw onboard
# auswählen: Anthropic API key

# oder nicht interaktiv
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Anthropic-Konfigurationsbeispiel

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Standardwerte für Thinking (Claude 4.6)

- Anthropic-Claude-4.6-Modelle verwenden in OpenClaw standardmäßig `adaptive` Thinking, wenn kein explizites Thinking-Level gesetzt ist.
- Sie können dies pro Nachricht (`/think:<level>`) oder in Modellparametern überschreiben:
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- Zugehörige Anthropic-Dokumentation:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Fast-Modus (Anthropic-API)

Der gemeinsame Schalter `/fast` von OpenClaw unterstützt auch direkten öffentlichen Anthropic-Traffic, einschließlich per API-Schlüssel und OAuth authentifizierter Anfragen an `api.anthropic.com`.

- `/fast on` wird auf `service_tier: "auto"` abgebildet
- `/fast off` wird auf `service_tier: "standard_only"` abgebildet
- Standardkonfiguration:

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

Wichtige Einschränkungen:

- OpenClaw injiziert Anthropic-Service-Tiers nur für direkte Anfragen an `api.anthropic.com`. Wenn Sie `anthropic/*` über einen Proxy oder ein Gateway routen, lässt `/fast` `service_tier` unverändert.
- Explizite Anthropic-Modellparameter `serviceTier` oder `service_tier` überschreiben den Standard von `/fast`, wenn beide gesetzt sind.
- Anthropic meldet die effektive Stufe in der Antwort unter `usage.service_tier`. Bei Konten ohne Priority-Tier-Kapazität kann `service_tier: "auto"` dennoch zu `standard` aufgelöst werden.

## Prompt-Caching (Anthropic-API)

OpenClaw unterstützt Anthropics Prompt-Caching-Funktion. Dies ist **nur für die API** verfügbar; ältere Anthropic-Token-Authentifizierung berücksichtigt Cache-Einstellungen nicht.

### Konfiguration

Verwenden Sie den Parameter `cacheRetention` in Ihrer Modellkonfiguration:

| Wert    | Cache-Dauer  | Beschreibung              |
| ------- | ------------ | ------------------------- |
| `none`  | Kein Caching | Prompt-Caching deaktivieren |
| `short` | 5 Minuten    | Standard für API-Key-Auth |
| `long`  | 1 Stunde     | Erweiterter Cache         |

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

### Standardwerte

Bei Verwendung der Authentifizierung per Anthropic-API-Schlüssel wendet OpenClaw automatisch `cacheRetention: "short"` (5-Minuten-Cache) für alle Anthropic-Modelle an. Sie können dies überschreiben, indem Sie `cacheRetention` explizit in Ihrer Konfiguration festlegen.

### `cacheRetention`-Überschreibungen pro Agent

Verwenden Sie Modellparameter als Basis und überschreiben Sie dann spezifische Agenten über `agents.list[].params`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // Basis für die meisten Agenten
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // Überschreibung nur für diesen Agenten
    ],
  },
}
```

Reihenfolge beim Zusammenführen cachebezogener Parameter:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (passende `id`, überschreibt nach Schlüssel)

Dadurch kann ein Agent einen langlebigen Cache beibehalten, während ein anderer Agent auf demselben Modell das Caching deaktiviert, um Schreibkosten bei burstigem/selten wiederverwendetem Traffic zu vermeiden.

### Hinweise zu Bedrock Claude

- Anthropic-Claude-Modelle auf Bedrock (`amazon-bedrock/*anthropic.claude*`) akzeptieren konfiguriertes `cacheRetention` als Pass-through.
- Nicht-Anthropic-Bedrock-Modelle werden zur Laufzeit auf `cacheRetention: "none"` erzwungen.
- Die intelligenten Standardwerte für Anthropic-API-Schlüssel setzen auch für Claude-on-Bedrock-Modellreferenzen `cacheRetention: "short"`, wenn kein expliziter Wert festgelegt ist.

## 1M-Kontextfenster (Anthropic-Beta)

Anthropics 1M-Kontextfenster ist Beta-gesteuert. In OpenClaw aktivieren Sie es pro Modell
mit `params.context1m: true` für unterstützte Opus-/Sonnet-Modelle.

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

OpenClaw bildet dies bei Anthropic-Anfragen auf `anthropic-beta: context-1m-2025-08-07` ab.

Dies wird nur aktiviert, wenn `params.context1m` für
dieses Modell explizit auf `true` gesetzt ist.

Anforderung: Anthropic muss Long-Context-Nutzung für diese Anmeldedaten zulassen
(typischerweise API-Key-Abrechnung oder OpenClaws Claude-Login-Pfad / ältere Token-Authentifizierung
mit aktiviertem Extra Usage). Andernfalls gibt Anthropic zurück:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Hinweis: Anthropic lehnt derzeit `context-1m-*`-Beta-Anfragen bei Verwendung
älterer Anthropic-Token-Authentifizierung (`sk-ant-oat-*`) ab. Wenn Sie
`context1m: true` mit diesem älteren Auth-Modus konfigurieren, protokolliert OpenClaw eine Warnung und
fällt auf das Standard-Kontextfenster zurück, indem der Beta-Header für context1m
übersprungen wird, während die erforderlichen OAuth-Betas beibehalten werden.

## Entfernt: Claude-CLI-Backend

Das gebündelte Anthropic-`claude-cli`-Backend wurde entfernt.

- Anthropics Hinweis vom 4. April 2026 besagt, dass von OpenClaw gesteuerter Claude-Login-Traffic
  als Nutzung über ein Drittanbieter-Harness gilt und **Extra Usage** erfordert.
- Unsere lokalen Reproduktionen zeigen außerdem, dass direktes
  `claude -p --append-system-prompt ...` dieselbe Sperre auslösen kann, wenn der
  angehängte Prompt OpenClaw identifiziert.
- Derselbe OpenClaw-ähnliche System-Prompt löst diese Sperre auf dem
  Anthropic-SDK- + `ANTHROPIC_API_KEY`-Pfad nicht aus.
- Verwenden Sie Anthropic-API-Schlüssel für Anthropic-Traffic in OpenClaw.

## Hinweise

- Anthropics öffentliche Claude-Code-Dokumentation dokumentiert weiterhin direkte CLI-Nutzung wie
  `claude -p`, aber Anthropics separater Hinweis an OpenClaw-Nutzer besagt, dass der
  **OpenClaw**-Claude-Login-Pfad als Nutzung über ein Drittanbieter-Harness gilt und
  **Extra Usage** erfordert (Pay-as-you-go, getrennt vom Abonnement abgerechnet).
  Unsere lokalen Reproduktionen zeigen außerdem, dass direktes
  `claude -p --append-system-prompt ...` dieselbe Sperre auslösen kann, wenn der
  angehängte Prompt OpenClaw identifiziert, während dieselbe Prompt-Form
  auf dem Anthropic-SDK- + `ANTHROPIC_API_KEY`-Pfad nicht reproduziert wird. Für den Produktiveinsatz empfehlen wir stattdessen
  Anthropic-API-Schlüssel.
- Anthropic-Setup-Token ist in OpenClaw wieder als älterer/manueller Pfad verfügbar. Anthropics OpenClaw-spezifischer Abrechnungshinweis gilt weiterhin, verwenden Sie ihn also in der Erwartung, dass Anthropic für diesen Pfad **Extra Usage** verlangt.
- Auth-Details + Wiederverwendungsregeln finden Sie unter [/concepts/oauth](/de/concepts/oauth).

## Fehlerbehebung

**401-Fehler / Token plötzlich ungültig**

- Ältere Anthropic-Token-Authentifizierung kann ablaufen oder widerrufen werden.
- Für neue Setups auf einen Anthropic-API-Schlüssel migrieren.

**Kein API-Schlüssel für Provider "anthropic" gefunden**

- Auth ist **pro Agent**. Neue Agenten übernehmen die Schlüssel des Haupt-Agenten nicht.
- Führen Sie das Onboarding für diesen Agenten erneut aus oder konfigurieren Sie einen API-Schlüssel auf dem Gateway-
  Host und prüfen Sie dann mit `openclaw models status`.

**Keine Anmeldedaten für Profil `anthropic:default` gefunden**

- Führen Sie `openclaw models status` aus, um zu sehen, welches Auth-Profil aktiv ist.
- Führen Sie das Onboarding erneut aus oder konfigurieren Sie einen API-Schlüssel für diesen Profilpfad.

**Kein verfügbares Auth-Profil (alle in Cooldown/nicht verfügbar)**

- Prüfen Sie `openclaw models status --json` auf `auth.unusableProfiles`.
- Anthropic-Rate-Limit-Cooldowns können modellspezifisch sein, daher kann ein benachbartes Anthropic-
  Modell weiterhin nutzbar sein, selbst wenn das aktuelle in Cooldown ist.
- Fügen Sie ein weiteres Anthropic-Profil hinzu oder warten Sie auf das Ende des Cooldowns.

Mehr dazu: [/gateway/troubleshooting](/de/gateway/troubleshooting) und [/help/faq](/de/help/faq).
