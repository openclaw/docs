---
read_when:
    - Sie möchten Cohere mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den Cohere-API-Schlüssel oder die CLI-Authentifizierungsauswahl.
summary: Cohere-Einrichtung (Authentifizierung + Modellauswahl)
title: Cohere
x-i18n:
    generated_at: "2026-07-24T04:04:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fee46bf80609bd5e8211d6be507713f4de178653941effb81ebae48d8bb6528a
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) bietet über seine Compatibility API OpenAI-kompatible Inferenz. OpenClaw bündelt den Cohere-Provider während dessen Übergangs zur Externalisierung und veröffentlicht ihn außerdem als offizielles externes Plugin.

| Eigenschaft       | Wert                                                |
| ----------------- | --------------------------------------------------- |
| Provider-ID       | `cohere`                                  |
| Plugin            | während des Übergangs gebündelt; offizielles externes Paket |
| Authentifizierungs-Umgebungsvariable | `COHERE_API_KEY`                  |
| Onboarding-Flag   | `--auth-choice cohere-api-key`                                  |
| Direktes CLI-Flag | `--cohere-api-key <key>`                                  |
| API               | OpenAI-kompatibel (`openai-completions`)              |
| Basis-URL         | `https://api.cohere.ai/compatibility/v1`                                  |
| Standardmodell    | `cohere/command-a-plus-05-2026`                                  |
| Kontextfenster    | 128,000 Tokens                                      |

## Integrierter Katalog

| Modellreferenz                       | Eingabe     | Kontext | Maximale Ausgabe | Hinweise                                      |
| ------------------------------------ | ----------- | ------- | ---------------- | --------------------------------------------- |
| `cohere/command-a-plus-05-2026`                   | Text, Bild  | 128,000 | 64,000           | Standard; führendes agentisches Reasoning-Modell |
| `cohere/command-a-03-2025`                   | Text        | 256,000 | 8,000            | Vorheriges Command-A-Modell                   |
| `cohere/command-a-reasoning-08-2025`                   | Text        | 256,000 | 32,000           | Agentisches Reasoning und Werkzeugnutzung     |
| `cohere/command-a-vision-07-2025`                   | Text, Bild  | 128,000 | 8,000            | Bild- und Dokumentanalyse; keine Werkzeugnutzung |
| `cohere/north-mini-code-1-0`                   | Text, Bild  | 256,000 | 64,000           | Agentisches Programmieren; Reasoning; kostenlose Limits |

Reasoning-fähige Cohere-Modelle unterstützen zwei Reasoning-Modi der Compatibility API. OpenClaw ordnet **aus** `none` und jede aktivierte Denkstufe `high` zu. Command A Vision unterstützt keine Werkzeugnutzung, daher lässt OpenClaw die Agentenwerkzeuge für dieses Modell deaktiviert.

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

## Einrichtung ausschließlich über Umgebungsvariablen

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
- [Modelle-CLI](/de/cli/models)
- [Provider-Verzeichnis](/de/providers/index)
