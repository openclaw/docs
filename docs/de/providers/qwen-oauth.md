---
read_when:
    - Sie möchten die Provider-ID qwen-oauth konfigurieren
    - Sie haben zuvor Qwen-Portal-OAuth-Zugangsdaten verwendet
    - Sie benötigen den Qwen-Portal-Endpunkt oder Migrationshinweise
summary: Verwenden Sie die Provider-ID des Qwen-Portals mit OpenClaw
title: Qwen OAuth / Portal
x-i18n:
    generated_at: "2026-06-27T18:06:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 46f147e3730024bf63e99827f666e2be791318723eace98941ca067c440dddd0
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` ist die Qwen Portal-Provider-ID. Sie zielt auf den Qwen Portal-Endpunkt
und hält ältere Qwen OAuth-/Portal-Einrichtungen über eine eigene
Provider-ID adressierbar.

Verwenden Sie diesen Provider, wenn Sie speziell ein aktuelles Qwen Portal-Token für
`https://portal.qwen.ai/v1` haben oder wenn Sie eine ältere Qwen Portal-/
Qwen CLI-Einrichtung migrieren und diese Anmeldedaten vom kanonischen
Qwen Cloud-Provider getrennt halten möchten. Für neue Qwen-Benutzer ist er nicht die empfohlene erste Wahl.

Für neue Qwen Cloud-Einrichtungen bevorzugen Sie [Qwen](/de/providers/qwen) mit dem Standard-
ModelStudio-Endpunkt, sofern Sie nicht speziell ein aktuelles Qwen Portal-Token haben.

## Einrichtung

Geben Sie Ihr Portal-Token beim Onboarding an:

```bash
openclaw onboard --auth-choice qwen-oauth
```

Oder setzen Sie:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

## Standardwerte

- Provider: `qwen-oauth`
- Aliase: `qwen-portal`, `qwen-cli`
- Basis-URL: `https://portal.qwen.ai/v1`
- Umgebungsvariable: `QWEN_API_KEY`
- API-Stil: OpenAI-kompatibel
- Standardmodell: `qwen-oauth/qwen3.5-plus`

## Unterschied zu Qwen

OpenClaw hat zwei Provider-IDs für Qwen:

| Provider     | Endpunktfamilie                                          | Am besten geeignet für                                                                  |
| ------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `qwen`       | Qwen Cloud-/Alibaba DashScope- und Coding Plan-Endpunkte | Neue API-Key-Einrichtungen, Standard-Pay-as-you-go, Coding Plan, multimodale DashScope-Funktionen |
| `qwen-oauth` | Qwen Portal-Endpunkt unter `portal.qwen.ai/v1`           | Bestehende Qwen Portal-Token und ältere Qwen OAuth-/CLI-Einrichtungen                   |

Beide Provider verwenden OpenAI-kompatible Anfrageformate, sind aber getrennte Authentifizierungs-
Oberflächen. Ein für `qwen-oauth` gespeichertes Token sollte nicht als DashScope-
oder ModelStudio-Schlüssel behandelt werden, und ein neuer DashScope-Schlüssel sollte stattdessen den kanonischen `qwen`-
Provider verwenden.

## Wann Qwen OAuth / Portal gewählt werden sollte

- Sie haben bereits ein funktionierendes Qwen Portal-Token.
- Sie bewahren einen älteren Qwen OAuth- oder Qwen CLI-Workflow, während Sie zum
  Provider-Modell von OpenClaw wechseln.
- Sie müssen die Kompatibilität speziell mit dem Qwen Portal-Endpunkt testen.

Wählen Sie [Qwen](/de/providers/qwen) für neue Einrichtungen, breitere Endpunktauswahl, Standard-
ModelStudio, Coding Plan und den vollständigen Qwen-Plugin-Katalog.

## Modelle

Der Qwen-Plugin-Katalog initialisiert den Qwen Portal-Standard:

- `qwen-oauth/qwen3.5-plus`

Die Verfügbarkeit hängt vom aktuellen Qwen Portal-Konto und Token ab. Wenn Ihr
Konto stattdessen ModelStudio-/DashScope-API-Keys verwendet, konfigurieren Sie den kanonischen
`qwen`-Provider:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## Migration

Ältere Qwen Portal-OAuth-Profile sind möglicherweise nicht aktualisierbar. Wenn ein Portal-Profil
nicht mehr funktioniert, authentifizieren Sie sich erneut mit einem aktuellen Token oder wechseln Sie zum Standard-
Qwen-Provider:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Standard Global ModelStudio verwendet:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## Fehlerbehebung

- Fehler beim Aktualisieren von Portal OAuth: Ältere Qwen Portal-OAuth-Profile sind möglicherweise nicht
  aktualisierbar. Führen Sie das Onboarding mit einem aktuellen Token erneut aus.
- Fehler durch falschen Endpunkt: Bestätigen Sie, dass die Modellreferenz mit `qwen-oauth/` beginnt, wenn
  Sie ein Portal-Token verwenden. Verwenden Sie `qwen/`-Referenzen nur für den kanonischen Qwen-Provider.
- Verwirrung um `QWEN_API_KEY`: Beide Qwen-Seiten erwähnen diese Umgebungsvariable, aber das Onboarding
  speichert Anmeldedaten unter der ausgewählten Provider-ID. Bevorzugen Sie Onboarding, wenn Sie
  sowohl `qwen` als auch `qwen-oauth` auf demselben Rechner verfügbar halten.

## Verwandte Themen

- [Qwen](/de/providers/qwen)
- [Alibaba Model Studio](/de/providers/alibaba)
- [Modell-Provider](/de/concepts/model-providers)
- [Alle Provider](/de/providers/index)
