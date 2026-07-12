---
read_when:
    - Sie möchten OpenClaw mit NovitaAI-Modellen ausführen
    - Sie benötigen die Novita-Provider-ID, den Schlüssel oder den Endpunkt
summary: Verwenden Sie die OpenAI-kompatible API von NovitaAI mit OpenClaw
title: NovitaAI
x-i18n:
    generated_at: "2026-07-12T15:54:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 83e0e43e68d85d73e790023858a49f971b683129dbbdf6092fbd8bba4d8da331
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI ist ein gehosteter KI-Infrastruktur-Provider mit einer OpenAI-kompatiblen API.
Er wird als gebündelter OpenClaw-Provider ausgeliefert (keine separate Plugin-Installation), daher
werden Anmeldedaten über den normalen Authentifizierungsablauf für Modelle verwaltet, und Modellreferenzen sehen wie folgt aus:
`novita/deepseek/deepseek-v3-0324`.

## Einrichtung

Erstellen Sie unter [novita.ai/settings/key-management](https://novita.ai/settings/key-management) einen API-Schlüssel und führen Sie anschließend Folgendes aus:

```bash
openclaw onboard --auth-choice novita-api-key
```

Alternativ setzen Sie:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## Standardwerte

| Einstellung    | Wert                               |
| -------------- | ---------------------------------- |
| Provider-ID    | `novita`                           |
| Aliase         | `novita-ai`, `novitaai`            |
| Basis-URL      | `https://api.novita.ai/openai/v1`  |
| Umgebungsvariable | `NOVITA_API_KEY`                |
| Standardmodell | `novita/deepseek/deepseek-v3-0324` |

## Gebündelter Modellkatalog

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

Dies ist ein Ausgangspunkt und kein Live-Katalog. Abhängig von Ihrem Konto, Ihrer Region oder
dem aktuellen Angebot von Novita können Routen hinzugefügt, entfernt oder eingeschränkt sein. Prüfen Sie dies, bevor Sie
ein langfristiges Standardmodell festlegen:

```bash
openclaw models list --provider novita
```

## Wann Sie Novita wählen sollten

- Gehosteter Zugriff auf Open-Weight-Modelle über eine OpenAI-kompatible API.
- Routen für die Modellfamilien DeepSeek, Kimi, MiniMax, GLM oder Qwen über ein einziges Provider-
  Konto.
- Ein weiterer gehosteter Ausweichpfad neben DeepInfra, GMI, OpenRouter oder direkten
  Anbieter-APIs.
- Modellhosting auf Provider-Seite, anstatt eine Infrastruktur mit LM Studio, Ollama,
  SGLang oder vLLM zu betreiben.

Wählen Sie einen direkten Anbieter-Provider, wenn Sie anbieterspezifische Anfrage-
parameter oder Supportverträge benötigen. Wählen Sie einen lokalen Provider, wenn das Modell
auf Ihrer eigenen Hardware oder innerhalb Ihrer eigenen Netzwerkgrenze ausgeführt werden muss.

## Fehlerbehebung

- `401`/`403`: Überprüfen Sie den Schlüssel auf der Schlüsselverwaltungsseite von Novita und führen Sie
  `openclaw onboard --auth-choice novita-api-key` erneut aus, wenn das gespeicherte Profil
  veraltet ist.
- Fehler wegen unbekannter Modelle: Verwenden Sie die genaue Kennung `novita/<route-id>`, die von
  `openclaw models list --provider novita` zurückgegeben wird.
- Langsame oder fehlgeschlagene Routen: Versuchen Sie eine andere Novita-Modellroute oder legen Sie Novita als
  Ausweich-Provider für Arbeitslasten fest, die providerspezifische
  Schwankungen tolerieren können.

## Verwandte Themen

- [Modell-Provider](/de/concepts/model-providers)
- [Provider-Verzeichnis](/de/providers/index)
