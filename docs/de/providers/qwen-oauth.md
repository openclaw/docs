---
read_when:
    - Sie möchten die Provider-ID `qwen-oauth` konfigurieren.
    - Sie haben zuvor Qwen-Portal-OAuth-Anmeldedaten verwendet
    - Sie benötigen den Qwen-Portal-Endpunkt oder eine Migrationsanleitung
summary: Verwenden Sie die Provider-ID des Qwen-Portals mit OpenClaw
title: Qwen OAuth / Portal
x-i18n:
    generated_at: "2026-07-12T15:49:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` ist die Provider-ID des Qwen-Portals, die vom Qwen-Plugin
(`@openclaw/qwen-provider`) registriert wird. Sie ist auf den Qwen-Portal-Endpunkt unter
`https://portal.qwen.ai/v1` ausgerichtet und hält ältere Qwen-OAuth-/Portal-Konfigurationen
über eine eigene Provider-ID adressierbar, getrennt vom kanonischen Provider `qwen`.

Wählen Sie `qwen-oauth`, wenn Sie bereits über ein funktionierendes Qwen-Portal-Token verfügen,
einen älteren Qwen-OAuth- oder Qwen-CLI-Workflow migrieren oder speziell den
Qwen-Portal-Endpunkt testen müssen. Bevorzugen Sie für neue Konfigurationen
[Qwen](/de/providers/qwen) mit dem Standard-ModelStudio-Endpunkt: Dieser deckt neue
API-Schlüssel-Konfigurationen, eine größere Endpunktauswahl, nutzungsabhängige Standard-Abrechnung, den Coding Plan
und den vollständigen Katalog des Qwen-Plugins ab.

## Einrichtung

Installieren Sie das Qwen-Plugin, falls Sie dies noch nicht getan haben:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

Geben Sie Ihr Portal-Token während des Onboardings an:

```bash
openclaw onboard --auth-choice qwen-oauth
```

Nicht interaktive Ausführungen lesen das Token aus `--qwen-oauth-token <token>`. Alternativ setzen Sie:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

Das Onboarding speichert das Token in einem `qwen-oauth`-Authentifizierungsprofil, initialisiert den
Portal-Modellkatalog und legt `qwen-oauth/qwen3.5-plus` als Standardmodell fest, wenn
keines konfiguriert ist.

## Standardwerte

- Provider: `qwen-oauth`
- Aliasse: `qwen-portal`, `qwen-cli`
- Basis-URL: `https://portal.qwen.ai/v1`
- Umgebungsvariable: `QWEN_API_KEY`
- API-Stil: OpenAI-kompatibel
- Standardmodell: `qwen-oauth/qwen3.5-plus`

## Unterschiede zu Qwen

OpenClaw verfügt über zwei auf Qwen ausgerichtete Provider-IDs:

| Provider     | Endpunktfamilie                                          | Am besten geeignet für                                                                    |
| ------------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `qwen`       | Qwen Cloud / Alibaba DashScope und Coding-Plan-Endpunkte | Neue API-Schlüssel-Konfigurationen, nutzungsabhängige Standard-Abrechnung, Coding Plan, multimodale DashScope-Funktionen |
| `qwen-oauth` | Qwen-Portal-Endpunkt unter `portal.qwen.ai/v1`           | Bestehende Qwen-Portal-Token und ältere Qwen-OAuth-/CLI-Konfigurationen                    |

Beide Provider verwenden OpenAI-kompatible Anfrageformate, stellen jedoch separate
Authentifizierungsoberflächen dar. Ein für `qwen-oauth` gespeichertes Token darf nicht als DashScope-
oder ModelStudio-Schlüssel behandelt werden. Ein neuer DashScope-Schlüssel sollte stattdessen den
kanonischen Provider `qwen` verwenden.

## Modelle

Das Qwen-Plugin initialisiert diesen statischen Katalog für den Qwen-Portal-Endpunkt. Alle
Einträge unterstützen eine maximale Ausgabe von 65,536 Token; die Verfügbarkeit hängt vom aktuellen
Qwen-Portal-Konto und -Token ab.

| Modellreferenz                    | Eingabe     | Kontext   | Hinweise       |
| --------------------------------- | ----------- | --------- | -------------- |
| `qwen-oauth/qwen3.5-plus`         | Text, Bild  | 1,000,000 | Standardmodell |
| `qwen-oauth/qwen3.6-plus`         | Text, Bild  | 1,000,000 |                |
| `qwen-oauth/qwen3-max-2026-01-23` | Text        | 262,144   |                |
| `qwen-oauth/qwen3-coder-next`     | Text        | 262,144   |                |
| `qwen-oauth/qwen3-coder-plus`     | Text        | 1,000,000 |                |
| `qwen-oauth/MiniMax-M2.5`         | Text        | 1,000,000 | Schlussfolgern |
| `qwen-oauth/glm-5`                | Text        | 202,752   |                |
| `qwen-oauth/glm-4.7`              | Text        | 202,752   |                |
| `qwen-oauth/kimi-k2.5`            | Text, Bild  | 262,144   |                |

Wenn Ihr Konto stattdessen ModelStudio-/DashScope-API-Schlüssel verwendet, konfigurieren Sie den
kanonischen Provider `qwen`:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## Migration

Ältere OAuth-Profile des Qwen-Portals können nicht aktualisiert werden; `openclaw doctor` kennzeichnet
sie. Wenn ein Portal-Profil nicht mehr funktioniert, führen Sie das Onboarding mit einem aktuellen Token
erneut aus oder wechseln Sie zum Standard-Qwen-Provider:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Das globale Standard-ModelStudio verwendet:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## Fehlerbehebung

- Fehler beim Aktualisieren von Portal-OAuth: Ältere OAuth-Profile des Qwen-Portals können nicht
  aktualisiert werden. Führen Sie das Onboarding mit einem aktuellen Token erneut aus.
- Fehler durch falschen Endpunkt: Vergewissern Sie sich, dass die Modellreferenz mit `qwen-oauth/` beginnt,
  wenn Sie ein Portal-Token verwenden. Verwenden Sie Referenzen mit `qwen/` nur für den kanonischen Qwen-Provider.
- Verwechslung bei `QWEN_API_KEY`: Beide Qwen-Seiten erwähnen diese Umgebungsvariable, aber das Onboarding
  speichert Anmeldedaten unter der ausgewählten Provider-ID. Bevorzugen Sie das Onboarding, wenn Sie
  sowohl `qwen` als auch `qwen-oauth` auf demselben Rechner verfügbar halten.

## Verwandte Themen

- [Qwen](/de/providers/qwen)
- [Alibaba Model Studio](/de/providers/alibaba)
- [Modell-Provider](/de/concepts/model-providers)
- [Alle Provider](/de/providers/index)
