---
read_when:
    - Sie möchten Featherless AI mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den Featherless-API-Schlüssel oder das Format der Modellreferenz.
summary: Einrichtung von Featherless AI, Modellauswahl und Tool-Aufrufe
title: Featherless AI
x-i18n:
    generated_at: "2026-07-12T02:03:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9112f7e65b4089bf96933c632d0b62f7fb87d42998d985ca85eb92dc392636b6
    source_path: providers/featherless.md
    workflow: 16
---

[Featherless AI](https://featherless.ai) stellt offene Modelle über eine
OpenAI-kompatible API bereit. OpenClaw installiert Featherless als offizielles externes
Provider-Plugin und hält den integrierten Katalog klein, während zur Laufzeit exakte
Modell-IDs von Featherless akzeptiert werden.

| Eigenschaft            | Wert                                     |
| ---------------------- | ---------------------------------------- |
| Provider-ID            | `featherless`                            |
| Paket                  | `@openclaw/featherless-provider`         |
| Umgebungsvariable für Authentifizierung | `FEATHERLESS_API_KEY` |
| Onboarding-Flag        | `--auth-choice featherless-api-key`      |
| Direktes CLI-Flag      | `--featherless-api-key <key>`            |
| API                    | OpenAI-kompatibel (`openai-completions`) |
| Basis-URL              | `https://api.featherless.ai/v1`          |
| Standardmodell         | `featherless/Qwen/Qwen3-32B`             |

## Einrichtung

Installieren Sie das Plugin und starten Sie den Gateway neu:

```bash
openclaw plugins install @openclaw/featherless-provider
openclaw gateway restart
```

Führen Sie das Onboarding aus:

```bash
openclaw onboard --auth-choice featherless-api-key
```

Für die nicht interaktive Einrichtung:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice featherless-api-key \
  --featherless-api-key "$FEATHERLESS_API_KEY"
```

Alternativ können Sie den Schlüssel für den Gateway-Prozess bereitstellen:

```bash
export FEATHERLESS_API_KEY="<your-featherless-api-key>" # pragma: allowlist secret
```

Überprüfen Sie den Provider:

```bash
openclaw models list --provider featherless
```

## Standardmodell

Das Plugin verwendet `Qwen/Qwen3-32B` als Standardmodell für die Einrichtung, weil Featherless
native Werkzeugaufrufe für die Qwen-3-Familie dokumentiert. OpenClaw konfiguriert das
Kontextfenster mit 32.768 Token, ein konservatives Ausgabelimit von 4.096 Token und
die Denksteuerung der Qwen-Chatvorlage.

Die Kostenfelder des Katalogs sind null, da Featherless mehrere Abrechnungsmodelle
unterstützt und OpenClaw keine kontospezifischen Tarife oder Preise pro Anfrage
hinterlegt.

## Weitere Featherless-Modelle

Verwenden Sie nach dem Provider-Präfix `featherless/` die exakte Featherless-Modell-ID:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "featherless/moonshotai/Kimi-K2-Instruct",
      },
    },
  },
}
```

OpenClaw übernimmt den vollständigen öffentlichen Modellindex von Featherless bewusst nicht in
die Auswahl. Der Index ist umfangreich und stellt nicht genügend strukturierte Metadaten zu den
Fähigkeiten bereit, um jedes Text-, Bildverarbeitungs-, Einbettungs- und Reasoning-Modell sicher
zu klassifizieren. Unbekannte IDs werden daher mit konservativen Standardwerten für reine
Textverarbeitung ohne Reasoning aufgelöst: einem Kontextfenster mit 4.096 Token und einem
Ausgabelimit von 1.024 Token.

Fügen Sie einen expliziten Provider-Modelleintrag hinzu, wenn ein Modell abweichende Metadaten benötigt:

```json5
{
  models: {
    mode: "merge",
    providers: {
      featherless: {
        baseUrl: "https://api.featherless.ai/v1",
        apiKey: "${FEATHERLESS_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-3-27b-it",
            name: "Gemma 3 27B",
            input: ["text", "image"],
            reasoning: false,
            contextWindow: 32768,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

Prüfen Sie vor dem Hinzufügen benutzerdefinierter Metadaten im Modellkatalog von Featherless
die aktuelle Verfügbarkeit der Modelle und deren Fähigkeitskennzeichnungen.

## Fehlerbehebung

- `401` oder `403`: Stellen Sie sicher, dass `FEATHERLESS_API_KEY` für den Gateway-
  Prozess sichtbar ist, oder führen Sie das Onboarding erneut aus.
- Unbekanntes Modell: Verwenden Sie nach dem Präfix `featherless/` die exakte, die Groß-
  und Kleinschreibung berücksichtigende ID von Featherless.
- Werkzeugaufrufe werden als Text zurückgegeben: Wählen Sie eine Modellfamilie, für die
  Featherless native Funktionsaufrufe dokumentiert, beispielsweise Qwen 3.
- Verwalteter Gateway kann nicht auf den Schlüssel zugreifen: Hinterlegen Sie ihn in
  `~/.openclaw/.env` oder einer anderen vom Dienst geladenen Umgebungsquelle und starten
  Sie anschließend den Gateway neu.

## Verwandte Themen

- [Modell-Provider](/de/concepts/model-providers)
- [Alle Provider](/de/providers/index)
- [Denkmodi](/de/tools/thinking)
