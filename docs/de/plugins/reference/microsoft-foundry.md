---
read_when:
    - Sie installieren, konfigurieren oder prüfen das microsoft-foundry-Plugin
summary: Fügt OpenClaw Unterstützung für den Microsoft Foundry Modell-Provider hinzu.
title: Microsoft Foundry-Plugin
x-i18n:
    generated_at: "2026-06-27T17:55:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Microsoft Foundry Plugin

Fügt OpenClaw Unterstützung für den Microsoft Foundry-Modell-Provider hinzu.

## Verteilung

- Paket: `@openclaw/microsoft-foundry`
- Installationsweg: in OpenClaw enthalten

## Oberfläche

Provider: microsoft-foundry; contracts: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Provider für Bildgenerierung: `microsoft-foundry`

## Anforderungen

- Eine Microsoft Foundry- oder Azure AI Foundry-Ressource mit Deployments.
- API-Key-Authentifizierung über `AZURE_OPENAI_API_KEY` oder einen konfigurierten Provider-API-Key.
- Für Entra ID-Authentifizierung installieren Sie die Azure CLI und führen Sie vor dem
  Onboarding `az login` aus. OpenClaw aktualisiert Microsoft Foundry-Runtime-Token über
  `az account get-access-token`.

## Chatmodelle

Microsoft Foundry-Chat-Deployments verwenden die Provider-Modellreferenz
`microsoft-foundry/<deployment-name>`. Beim Onboarding werden Foundry-Ressourcen
und Deployments mit der Azure CLI erkannt, anschließend wird der ausgewählte Deployment-Name in
die Modellkonfiguration geschrieben.

OpenClaw verwendet den Foundry-Endpunkt `/openai/v1` für unterstützte OpenAI-kompatible
Chat-APIs:

- GPT-, `o*`-, `computer-use-preview`- und DeepSeek-V4-Modellfamilien verwenden standardmäßig
  `openai-responses`.
- MAI-DS-R1 und andere Chat-Completion-Deployments verwenden `openai-completions`,
  sofern keine explizit unterstützte API konfiguriert ist.
- MAI-DS-R1 wird über Reasoning-Inhalte als reasoning-fähig erfasst, nicht
  über `reasoning_effort`. Seine Metadaten für Kontext- und Ausgabetoken betragen
  163.840 Token.

Anthropic Claude-Deployments in Microsoft Foundry verwenden die Anthropic Messages
API-Form, nicht die OpenAI-kompatible Form `/openai/v1`. Konfigurieren Sie diese als
benutzerdefinierten `anthropic-messages`-Provider, bis das Microsoft Foundry Plugin eine
native Anthropic-Runtime erhält. Wenn der Foundry-Deployment-Name von der
Claude-Modell-ID abweicht, setzen Sie `params.canonicalModelId` im Modelleintrag, damit OpenClaw
modellspezifische Protokollverträge anwenden, `/think off` korrekt abbilden und
signiertes Denken sicher bewahren kann.

## MAI-Bildgenerierung

Das Plugin registriert `microsoft-foundry` für `image_generate` mit den aktuellen
Microsoft AI-Bildmodellen:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Verwenden Sie den Namen eines bereitgestellten MAI-Bild-Deployments als Modellreferenz. Der Provider
deklariert kein Standard-Bildmodell, weil die MAI-API Ihren Deployment-Namen
im Anfragefeld `model` benötigt:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "microsoft-foundry/<deployment-name>",
        timeoutMs: 600000,
      },
    },
  },
}
```

Reine Prompt-Generierungsaufrufe verwenden den MAI-Generierungsendpunkt von Microsoft Foundry:
`/mai/v1/images/generations`. Bearbeitungen mit Referenzbildern verwenden
`/mai/v1/images/edits` und sind auf Deployments von `MAI-Image-2.5-Flash` und
`MAI-Image-2.5` beschränkt.

Reine Prompt-Generierung kann einen benutzerdefinierten Deployment-Namen verwenden, wenn nur der Foundry-
Endpunkt konfiguriert ist. Für Bildbearbeitungen mit einem benutzerdefinierten Deployment-Namen wählen Sie das
Deployment über das Onboarding aus oder fügen Sie Modellmetadaten hinzu, damit OpenClaw prüfen kann,
dass das Deployment auf `MAI-Image-2.5-Flash` oder `MAI-Image-2.5` basiert.

MAI-Bildeinschränkungen:

- Ausgabe: ein PNG-Bild pro Anfrage.
- Größe: Standard `1024x1024`; Breite und Höhe müssen jeweils mindestens 768 px betragen.
- Gesamtpixel: Breite × Höhe darf höchstens 1.048.576 betragen.
- Bearbeitungen: ein PNG- oder JPEG-Eingabebild.
- Nicht unterstützte gemeinsame Hinweise wie `aspectRatio`, `resolution`, `quality`,
  `background` und Nicht-PNG-`outputFormat` werden nicht an Microsoft Foundry gesendet.

## Fehlerbehebung

- `az: command not found`: Installieren Sie die Azure CLI oder verwenden Sie API-Key-Authentifizierung.
- `Microsoft Foundry endpoint missing for MAI image generation`: Wählen Sie ein
  Foundry-Deployment über das Onboarding aus oder fügen Sie `models.providers.microsoft-foundry.baseUrl` hinzu.
- `supports MAI image deployments only`: Das ausgewählte Bildmodell verweist auf ein
  Nicht-MAI-Deployment. Verwenden Sie ein bereitgestelltes MAI-Bildmodell für `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
