---
read_when:
    - Sie installieren, konfigurieren oder prüfen das microsoft-foundry-Plugin.
summary: Fügt Unterstützung für den Microsoft-Foundry-Modell-Provider zu OpenClaw hinzu.
title: Microsoft Foundry-Plugin
x-i18n:
    generated_at: "2026-07-16T13:22:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2ea554ce16cffeb4cc315e53d986d6f07b5e113fbb844c61c6575f19f8ad291
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Microsoft-Foundry-Plugin

Fügt OpenClaw Unterstützung für den Microsoft-Foundry-Modell-Provider hinzu.

## Distribution

- Paket: `@openclaw/microsoft-foundry`
- Installationsweg: in OpenClaw enthalten

## Oberfläche

Provider: `microsoft-foundry`; Verträge: `imageGenerationProviders`

<!-- openclaw-plugin-reference:manual-start -->

- Provider für die Bildgenerierung: `microsoft-foundry`

## Anforderungen

- Eine Microsoft-Foundry- oder Azure-AI-Foundry-Ressource mit Bereitstellungen.
- Authentifizierung per API-Schlüssel über `AZURE_OPENAI_API_KEY` oder einen konfigurierten Provider-API-Schlüssel.
- Installieren Sie für die Entra-ID-Authentifizierung die Azure CLI und führen Sie vor dem
  Onboarding `az login` aus. OpenClaw aktualisiert Microsoft-Foundry-Laufzeittoken über
  `az account get-access-token`.

## Chatmodelle

Microsoft-Foundry-Chatbereitstellungen verwenden die Provider-Modellreferenz
`microsoft-foundry/<deployment-name>`. Beim Onboarding werden mithilfe der Azure CLI Foundry-Ressourcen
und -Bereitstellungen ermittelt. Anschließend wird der Name der ausgewählten Bereitstellung in
die Modellkonfiguration geschrieben.

OpenClaw verwendet für unterstützte OpenAI-kompatible Chat-APIs den Foundry-Endpunkt
`/openai/v1`:

- Die Modellfamilien GPT, `o*`, `computer-use-preview` und DeepSeek-V4 verwenden standardmäßig
  `openai-responses`.
- MAI-DS-R1 und andere Chat-Completion-Bereitstellungen verwenden `openai-completions`,
  sofern keine explizite unterstützte API konfiguriert ist.
- MAI-DS-R1 wird über Reasoning-Inhalte als Reasoning-fähig erfasst, nicht
  über `reasoning_effort`. Die Metadaten für Kontext- und Ausgabetoken betragen
  163,840 Token.

Anthropic-Claude-Bereitstellungen in Microsoft Foundry verwenden das Format der Anthropic Messages
API und nicht das OpenAI-kompatible Format `/openai/v1`. Konfigurieren Sie diese als
benutzerdefinierten Provider `anthropic-messages`, bis das Microsoft-Foundry-Plugin über eine
native Anthropic-Laufzeit verfügt. Wenn sich der Name der Foundry-Bereitstellung von der
Claude-Modell-ID unterscheidet, legen Sie im Modelleintrag `params.canonicalModelId` fest, damit OpenClaw
modellspezifische Übertragungsverträge anwenden, `/think off` korrekt zuordnen und
signierte Denkprozesse sicher bewahren kann.

## MAI-Bildgenerierung

Das Plugin registriert `microsoft-foundry` für `image_generate` mit den aktuellen
Microsoft-AI-Bildmodellen:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Verwenden Sie den Namen einer bereitgestellten MAI-Bildbereitstellung als Modellreferenz. Der Provider
deklariert kein Standardbildmodell, da die MAI-API den Namen Ihrer Bereitstellung
im Anforderungsfeld `model` benötigt:

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

Bei einer Generierung nur anhand eines Prompts wird der MAI-Generierungsendpunkt von Microsoft Foundry aufgerufen:
`/mai/v1/images/generations`. Bearbeitungen mit einem Referenzbild rufen
`/mai/v1/images/edits` auf und sind auf Bereitstellungen von `MAI-Image-2.5-Flash` und
`MAI-Image-2.5` beschränkt.

Für die Generierung nur anhand eines Prompts kann ein benutzerdefinierter Bereitstellungsname verwendet werden, wenn lediglich der Foundry-
Endpunkt konfiguriert ist. Wählen Sie für Bildbearbeitungen mit einem benutzerdefinierten Bereitstellungsnamen die
Bereitstellung beim Onboarding aus oder fügen Sie Modellmetadaten hinzu, damit OpenClaw überprüfen kann,
ob die Bereitstellung auf `MAI-Image-2.5-Flash` oder `MAI-Image-2.5` basiert.

Einschränkungen für MAI-Bilder:

- Ausgabe: ein PNG-Bild pro Anfrage.
- Größe: standardmäßig `1024x1024`; Breite und Höhe müssen jeweils mindestens 768 px betragen.
- Gesamtpixelzahl: Breite × Höhe darf höchstens 1,048,576 betragen.
- Bearbeitungen: ein PNG- oder JPEG-Eingabebild.
- Nicht unterstützte gemeinsame Hinweise wie `aspectRatio`, `resolution`, `quality`,
  `background` und von PNG abweichende Angaben für `outputFormat` werden nicht an Microsoft Foundry gesendet.

## Fehlerbehebung

- `az: command not found`: Installieren Sie die Azure CLI oder verwenden Sie die Authentifizierung per API-Schlüssel.
- `Microsoft Foundry endpoint missing for MAI image generation`: Wählen Sie beim Onboarding eine
  Foundry-Bereitstellung aus oder fügen Sie `models.providers.microsoft-foundry.baseUrl` hinzu.
- `supports MAI image deployments only`: Das ausgewählte Bildmodell verweist auf eine
  Nicht-MAI-Bereitstellung. Verwenden Sie für `image_generate` ein bereitgestelltes MAI-Bildmodell.

<!-- openclaw-plugin-reference:manual-end -->
