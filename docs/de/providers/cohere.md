---
read_when:
    - Sie möchten Cohere mit OpenClaw verwenden
    - Sie benötigen entweder die Umgebungsvariable für den Cohere-API-Schlüssel oder die Authentifizierungsauswahl der CLI.
summary: Cohere-Einrichtung (Authentifizierung + Modellauswahl)
title: Cohere
x-i18n:
    generated_at: "2026-07-12T02:04:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fee46bf80609bd5e8211d6be507713f4de178653941effb81ebae48d8bb6528a
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) bietet über seine Compatibility API eine OpenAI-kompatible Inferenz. OpenClaw bündelt den Cohere-Provider während der Umstellung auf eine externe Bereitstellung und veröffentlicht ihn außerdem als offizielles externes Plugin.

| Eigenschaft             | Wert                                                       |
| ----------------------- | ---------------------------------------------------------- |
| Provider-ID             | `cohere`                                                   |
| Plugin                  | während der Umstellung gebündelt; offizielles externes Paket |
| Umgebungsvariable für Authentifizierung | `COHERE_API_KEY`                              |
| Onboarding-Flag         | `--auth-choice cohere-api-key`                             |
| Direktes CLI-Flag       | `--cohere-api-key <key>`                                   |
| API                     | OpenAI-kompatibel (`openai-completions`)                   |
| Basis-URL               | `https://api.cohere.ai/compatibility/v1`                   |
| Standardmodell          | `cohere/command-a-plus-05-2026`                            |
| Kontextfenster          | 128.000 Token                                              |

## Integrierter Katalog

| Modellreferenz                       | Eingabe     | Kontext | Max. Ausgabe | Hinweise                                                   |
| ------------------------------------ | ----------- | ------- | ------------ | ---------------------------------------------------------- |
| `cohere/command-a-plus-05-2026`      | Text, Bild  | 128.000 | 64.000       | Standard; führendes agentisches Reasoning-Modell            |
| `cohere/command-a-03-2025`           | Text        | 256.000 | 8.000        | Vorheriges Command-A-Modell                                |
| `cohere/command-a-reasoning-08-2025` | Text        | 256.000 | 32.000       | Agentisches Reasoning und Werkzeugnutzung                  |
| `cohere/command-a-vision-07-2025`    | Text, Bild  | 128.000 | 8.000        | Bild- und Dokumentanalyse; keine Werkzeugnutzung           |
| `cohere/north-mini-code-1-0`         | Text, Bild  | 256.000 | 64.000       | Agentisches Programmieren; Reasoning; kostenlose Kontingente |

Reasoning-fähige Cohere-Modelle unterstützen zwei Reasoning-Modi der Compatibility API. OpenClaw ordnet **deaktiviert** `none` und jede aktivierte Denkstufe `high` zu. Command A Vision unterstützt keine Werkzeugnutzung, daher lässt OpenClaw die Agentenwerkzeuge für dieses Modell deaktiviert.

## Erste Schritte

1. Cohere ist in aktuellen OpenClaw-Paketen enthalten. Falls es fehlt, installieren Sie das externe Paket und starten Sie den Gateway neu:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Erstellen Sie einen Cohere-API-Schlüssel.
3. Führen Sie das Onboarding aus:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. Bestätigen Sie, dass der Katalog verfügbar ist:

```bash
openclaw models list --provider cohere
```

Das Onboarding legt Cohere nur dann als primäres Modell fest, wenn noch kein primäres Modell konfiguriert ist.

## Einrichtung nur über die Umgebung

Stellen Sie `COHERE_API_KEY` dem Gateway-Prozess zur Verfügung und wählen Sie anschließend das Cohere-Modell aus:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-plus-05-2026" },
    },
  },
}
```

<Note>
Wenn der Gateway als Daemon oder in Docker ausgeführt wird, legen Sie `COHERE_API_KEY` für diesen Dienst fest. Wenn Sie die Variable nur in einer interaktiven Shell exportieren, steht sie einem bereits laufenden Gateway nicht zur Verfügung.
</Note>

## Verwandte Themen

- [Modell-Provider](/de/concepts/model-providers)
- [Modell-CLI](/de/cli/models)
- [Provider-Verzeichnis](/de/providers/index)
