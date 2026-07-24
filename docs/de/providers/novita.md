---
read_when:
    - Sie möchten OpenClaw mit NovitaAI-Modellen ausführen
    - Sie benötigen die Provider-ID, den Schlüssel oder den Endpunkt von Novita
summary: Verwenden Sie die OpenAI-kompatible API von NovitaAI mit OpenClaw
title: NovitaAI
x-i18n:
    generated_at: "2026-07-24T04:05:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 83e0e43e68d85d73e790023858a49f971b683129dbbdf6092fbd8bba4d8da331
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI ist ein gehosteter KI-Infrastruktur-Provider mit einer OpenAI-kompatiblen API.
Er wird als gebündelter OpenClaw-Provider bereitgestellt (keine separate Plugin-Installation), daher
werden Anmeldedaten über den normalen Modellauthentifizierungsablauf verwaltet und Modellreferenzen sehen wie
`novita/deepseek/deepseek-v3-0324` aus.

## Einrichtung

Erstellen Sie einen API-Schlüssel unter [novita.ai/settings/key-management](https://novita.ai/settings/key-management) und führen Sie anschließend Folgendes aus:

```bash
openclaw onboard --auth-choice novita-api-key
```

Oder legen Sie Folgendes fest:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## Standardwerte

| Einstellung       | Wert                              |
| ------------- | ---------------------------------- |
| Provider-ID   | `novita`                           |
| Aliase       | `novita-ai`, `novitaai`            |
| Basis-URL      | `https://api.novita.ai/openai/v1`  |
| Umgebungsvariable       | `NOVITA_API_KEY`                   |
| Standardmodell | `novita/deepseek/deepseek-v3-0324` |

## Gebündelter Modellkatalog

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

Dies ist ein Ausgangspunkt, kein Live-Katalog. Ihr Konto, Ihre Region oder
das aktuelle Angebot von Novita kann Routen hinzufügen, entfernen oder einschränken. Prüfen Sie dies, bevor Sie
einen langfristigen Standardwert festlegen:

```bash
openclaw models list --provider novita
```

## Wann Novita die richtige Wahl ist

- Gehosteter Zugriff auf Open-Weight-Modelle über eine OpenAI-kompatible API.
- Routen für DeepSeek, Kimi, MiniMax, GLM oder die Qwen-Familie über ein einziges Provider-
  Konto.
- Ein weiterer gehosteter Fallback-Pfad neben DeepInfra, GMI, OpenRouter oder direkten
  Anbieter-APIs.
- Modellhosting durch den Provider, statt eine Infrastruktur mit LM Studio, Ollama,
  SGLang oder vLLM zu betreiben.

Wählen Sie einen direkten Anbieter-Provider, wenn Sie anbieterspezifische Anfrageparameter
oder Supportverträge benötigen. Wählen Sie einen lokalen Provider, wenn das Modell
auf Ihrer eigenen Hardware oder innerhalb Ihrer Netzwerkgrenze ausgeführt werden muss.

## Fehlerbehebung

- `401`/`403`: Überprüfen Sie den Schlüssel auf der Schlüsselverwaltungsseite von Novita und führen Sie
  `openclaw onboard --auth-choice novita-api-key` erneut aus, wenn das gespeicherte Profil
  veraltet ist.
- Fehler wegen unbekannter Modelle: Verwenden Sie den exakten Wert `novita/<route-id>`, der von
  `openclaw models list --provider novita` zurückgegeben wird.
- Langsame oder fehlgeschlagene Routen: Probieren Sie eine andere Novita-Modellroute aus oder legen Sie Novita als
  Fallback-Provider für Workloads fest, die providerspezifische
  Abweichungen tolerieren können.

## Verwandte Themen

- [Modell-Provider](/de/concepts/model-providers)
- [Provider-Verzeichnis](/de/providers/index)
