---
read_when:
    - Sie möchten Cohere mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den Cohere-API-Schlüssel oder die CLI-Authentifizierungsauswahl
summary: Cohere-Einrichtung (Authentifizierung + Modellauswahl)
title: Cohere
x-i18n:
    generated_at: "2026-06-27T18:03:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76365a5d358bd5576d83a24d62ef30e203ee204bca90a2e50c56cc4c549b52af
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) stellt OpenAI-kompatible Inferenz über seine Compatibility API bereit. OpenClaw liefert den Cohere-Provider während seiner Externalisierungsphase mit und veröffentlicht ihn außerdem als offizielles externes Plugin mit dem Command A-Modellkatalog.

| Eigenschaft          | Wert                                                        |
| -------------------- | ----------------------------------------------------------- |
| Provider-ID          | `cohere`                                                    |
| Plugin               | während der Übergangsphase gebündelt; offizielles externes Paket |
| Auth-Umgebungsvariable | `COHERE_API_KEY`                                          |
| Onboarding-Flag      | `--auth-choice cohere-api-key`                              |
| Direkte CLI-Flag     | `--cohere-api-key <key>`                                    |
| API                  | OpenAI-kompatibel (`openai-completions`)                    |
| Basis-URL            | `https://api.cohere.ai/compatibility/v1`                    |
| Standardmodell       | `cohere/command-a-03-2025`                                  |

## Erste Schritte

1. Cohere ist in aktuellen OpenClaw-Paketen enthalten. Falls es nicht verfügbar ist, installieren Sie das externe Paket und starten Sie den Gateway neu:

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

Das Standardmodell wird nur festgelegt, wenn noch kein primäres Modell konfiguriert ist.

## Einrichtung nur über Umgebung

Machen Sie `COHERE_API_KEY` für den Gateway-Prozess verfügbar, und wählen Sie dann das Cohere-Modell aus:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-03-2025" },
    },
  },
}
```

<Note>
Wenn der Gateway als Daemon oder in Docker läuft, konfigurieren Sie `COHERE_API_KEY` für diesen Dienst. Ein Export nur in einer interaktiven Shell macht die Variable für einen bereits laufenden Gateway nicht verfügbar.
</Note>

## Verwandte Themen

- [Modell-Provider](/de/concepts/model-providers)
- [Modelle-CLI](/de/cli/models)
- [Provider-Verzeichnis](/de/providers)
