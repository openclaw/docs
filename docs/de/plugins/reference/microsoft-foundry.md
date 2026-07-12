---
read_when:
    - Sie installieren, konfigurieren oder prüfen das Plugin microsoft-foundry.
summary: Fügt Unterstützung für den Microsoft-Foundry-Modell-Provider zu OpenClaw hinzu.
title: Microsoft-Foundry-Plugin
x-i18n:
    generated_at: "2026-07-12T01:57:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Microsoft-Foundry-Plugin

Fügt OpenClaw Unterstützung für den Microsoft-Foundry-Modell-Provider hinzu.

## Distribution

- Paket: `@openclaw/microsoft-foundry`
- Installationsweg: in OpenClaw enthalten

## Oberfläche

Provider: microsoft-foundry; Verträge: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Provider für die Bilderzeugung: `microsoft-foundry`

## Anforderungen

- Eine Microsoft-Foundry- oder Azure-AI-Foundry-Ressource mit Bereitstellungen.
- API-Schlüssel-Authentifizierung über `AZURE_OPENAI_API_KEY` oder einen konfigurierten Provider-API-Schlüssel.
- Installieren Sie für die Entra-ID-Authentifizierung die Azure CLI und führen Sie vor dem
  Onboarding `az login` aus. OpenClaw aktualisiert Microsoft-Foundry-Laufzeittoken über
  `az account get-access-token`.

## Chatmodelle

Microsoft-Foundry-Chatbereitstellungen verwenden die Provider-Modellreferenz
`microsoft-foundry/<deployment-name>`. Beim Onboarding werden Foundry-Ressourcen
und -Bereitstellungen über die Azure CLI ermittelt. Anschließend wird der Name der ausgewählten Bereitstellung in
die Modellkonfiguration geschrieben.

OpenClaw verwendet den Foundry-Endpunkt `/openai/v1` für unterstützte OpenAI-kompatible
Chat-APIs:

- Die Modellfamilien GPT, `o*`, `computer-use-preview` und DeepSeek-V4 verwenden standardmäßig
  `openai-responses`.
- MAI-DS-R1 und andere Chat-Completion-Bereitstellungen verwenden `openai-completions`,
  sofern keine explizite unterstützte API konfiguriert ist.
- MAI-DS-R1 wird über Reasoning-Inhalte als Reasoning-fähig erfasst, nicht
  über `reasoning_effort`. Die Metadaten für Kontext- und Ausgabetoken betragen
  163.840 Token.

Anthropic-Claude-Bereitstellungen in Microsoft Foundry verwenden das Format der Anthropic Messages
API und nicht das OpenAI-kompatible Format `/openai/v1`. Konfigurieren Sie diese als
benutzerdefinierten `anthropic-messages`-Provider, bis das Microsoft-Foundry-Plugin über eine
native Anthropic-Laufzeit verfügt. Wenn der Name der Foundry-Bereitstellung von der
Claude-Modell-ID abweicht, legen Sie `params.canonicalModelId` im Modelleintrag fest, damit OpenClaw
modellspezifische Übertragungsverträge anwenden, `/think off` korrekt zuordnen und
signierte Denkprozesse sicher erhalten kann.

## MAI-Bilderzeugung

Das Plugin registriert `microsoft-foundry` für `image_generate` mit den aktuellen
Microsoft-AI-Bildmodellen:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Verwenden Sie den Namen einer bereitgestellten MAI-Bildbereitstellung als Modellreferenz. Der Provider
legt kein Standardbildmodell fest, da die MAI-API den Namen Ihrer Bereitstellung
im Anfragefeld `model` erfordert:

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

Bei einer Erzeugung nur anhand einer Eingabeaufforderung wird der MAI-Erzeugungsendpunkt von Microsoft Foundry aufgerufen:
`/mai/v1/images/generations`. Bearbeitungen mit Referenzbildern rufen
`/mai/v1/images/edits` auf und sind auf Bereitstellungen von `MAI-Image-2.5-Flash` und
`MAI-Image-2.5` beschränkt.

Für die Erzeugung nur anhand einer Eingabeaufforderung kann ein benutzerdefinierter Bereitstellungsname verwendet werden, wenn lediglich der Foundry-
Endpunkt konfiguriert ist. Wählen Sie für Bildbearbeitungen mit einem benutzerdefinierten Bereitstellungsnamen die
Bereitstellung beim Onboarding aus oder fügen Sie Modellmetadaten hinzu, damit OpenClaw überprüfen kann,
dass die Bereitstellung auf `MAI-Image-2.5-Flash` oder `MAI-Image-2.5` basiert.

Einschränkungen für MAI-Bilder:

- Ausgabe: ein PNG-Bild pro Anfrage.
- Größe: standardmäßig `1024x1024`; Breite und Höhe müssen jeweils mindestens 768 px betragen.
- Gesamtpixelzahl: Breite × Höhe darf höchstens 1.048.576 betragen.
- Bearbeitungen: ein PNG- oder JPEG-Eingabebild.
- Nicht unterstützte gemeinsame Hinweise wie `aspectRatio`, `resolution`, `quality`,
  `background` und andere Werte als PNG für `outputFormat` werden nicht an Microsoft Foundry gesendet.

## Fehlerbehebung

- `az: command not found`: Installieren Sie die Azure CLI oder verwenden Sie die API-Schlüssel-Authentifizierung.
- `Microsoft Foundry endpoint missing for MAI image generation`: Wählen Sie beim
  Onboarding eine Foundry-Bereitstellung aus oder fügen Sie `models.providers.microsoft-foundry.baseUrl` hinzu.
- `supports MAI image deployments only`: Das ausgewählte Bildmodell verweist auf eine
  Nicht-MAI-Bereitstellung. Verwenden Sie für `image_generate` ein bereitgestelltes MAI-Bildmodell.

<!-- openclaw-plugin-reference:manual-end -->
