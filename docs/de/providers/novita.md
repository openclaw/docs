---
read_when:
    - Sie möchten OpenClaw mit NovitaAI-Modellen ausführen
    - Sie benötigen die Novita-Provider-ID, den Schlüssel oder den Endpunkt
summary: Verwenden Sie die OpenAI-kompatible API von NovitaAI mit OpenClaw
title: NovitaAI
x-i18n:
    generated_at: "2026-06-27T18:05:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 602df700662dbf2176acabcad7d23950e8240158f58d115f8e56bf1fb9f43bcb
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI ist ein gehosteter KI-Infrastruktur-Provider mit einer OpenAI-kompatiblen Modell-API. In OpenClaw ist es ein gebündelter Modell-Provider, daher lautet die Provider-ID `novita`, Anmeldedaten laufen über den normalen Modell-Authentifizierungsfluss, und Modellreferenzen sehen wie `novita/deepseek/deepseek-v3-0324` aus.

Verwenden Sie Novita, wenn Sie gehosteten Zugriff auf Modelle mit offenen Gewichten und Modellrouten von Drittanbietern möchten, ohne einen eigenen Inferenzserver zu betreiben. Der gebündelte Katalog konzentriert sich auf Chatmodelle, die für Agent-Durchläufe praktisch sind, einschließlich DeepSeek-, Moonshot-, MiniMax-, GLM- und Qwen-Routen, die von Novita bereitgestellt werden.

Dieser Provider verwendet Novitas OpenAI-kompatiblen Endpunkt. OpenClaw übernimmt Provider-Registrierung, Authentifizierung, Aliasse, Normalisierung von Modellreferenzen und Auswahl der Basis-URL; Novita kontrolliert die aktuelle Modellverfügbarkeit, Kontoberechtigungen, Preise und Rate Limits.

## Einrichtung

Erstellen Sie einen API-Schlüssel unter [novita.ai/settings/key-management](https://novita.ai/settings/key-management), und führen Sie dann aus:

```bash
openclaw onboard --auth-choice novita-api-key
```

Oder setzen Sie:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## Standardwerte

- Provider: `novita`
- Aliasse: `novita-ai`, `novitaai`
- Basis-URL: `https://api.novita.ai/openai/v1`
- Umgebungsvariable: `NOVITA_API_KEY`
- Standardmodell: `novita/deepseek/deepseek-v3-0324`

## Wann Sie Novita wählen sollten

- Sie möchten gehosteten Zugriff auf Modelle mit offenen Gewichten über eine OpenAI-kompatible API.
- Sie möchten DeepSeek-, Kimi-, MiniMax-, GLM- oder Qwen-Familienrouten über ein einzelnes Provider-Konto nutzen.
- Sie möchten neben OpenRouter, GMI, DeepInfra oder direkten Hersteller-APIs einen weiteren gehosteten Fallback-Pfad.
- Sie bevorzugen Provider-seitiges Modellhosting gegenüber dem Betrieb eigener vLLM-, SGLang-, LM Studio- oder Ollama-Infrastruktur.

Wählen Sie einen direkten Hersteller-Provider, wenn Sie herstellerspezifische Anfrageparameter oder Supportverträge benötigen. Wählen Sie einen lokalen Provider, wenn das Modell auf Ihrer eigenen Hardware oder hinter Ihrer eigenen Netzwerkgrenze laufen muss.

## Modelle

Der gebündelte Katalog enthält häufig verfügbare NovitaAI-Routen-IDs, darunter:

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

Der Katalog ist ein Ausgangspunkt für die OpenClaw-Modellauswahl. Ihr Konto, Ihre Region oder Novitas aktueller Katalog kann Routen hinzufügen, entfernen oder einschränken. Prüfen Sie den Provider über die CLI, bevor Sie einen langfristigen Standardwert setzen:

```bash
openclaw models list --provider novita
```

## Fehlerbehebung

- `401` oder `403`: Überprüfen Sie den Schlüssel auf Novitas Schlüsselverwaltungsseite und führen Sie `openclaw onboard --auth-choice novita-api-key` erneut aus, wenn das gespeicherte Profil veraltet ist.
- Fehler wegen unbekannter Modelle: Verwenden Sie die genaue `novita/<route-id>`, die von `openclaw models list --provider novita` zurückgegeben wird.
- Langsame oder fehlgeschlagene Routen: Probieren Sie eine andere Novita-Modellroute aus oder legen Sie Novita als Fallback-Provider für Workloads fest, die Provider-spezifische Abweichungen tolerieren können.

## Verwandte Themen

- [Modell-Provider](/de/concepts/model-providers)
- [Alle Provider](/de/providers/index)
