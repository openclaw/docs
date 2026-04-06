---
read_when:
    - Sie möchten Qwen mit OpenClaw verwenden
    - Sie haben zuvor Qwen OAuth verwendet
summary: Qwen Cloud über den gebündelten Provider `qwen` von OpenClaw verwenden
title: Qwen
x-i18n:
    generated_at: "2026-04-06T03:11:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: f175793693ab6a4c3f1f4d42040e673c15faf7603a500757423e9e06977c989d
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Qwen OAuth wurde entfernt.** Die OAuth-Integration der kostenlosen Stufe
(`qwen-portal`), die `portal.qwen.ai`-Endpunkte verwendete, ist nicht mehr verfügbar.
Hintergrundinformationen finden Sie in [Issue #49557](https://github.com/openclaw/openclaw/issues/49557).

</Warning>

## Empfohlen: Qwen Cloud

OpenClaw behandelt Qwen jetzt als erstklassigen gebündelten Provider mit der kanonischen ID
`qwen`. Der gebündelte Provider zielt auf die Endpunkte von Qwen Cloud / Alibaba DashScope und
Coding Plan und hält ältere `modelstudio`-IDs weiterhin als
Kompatibilitätsalias funktionsfähig.

- Provider: `qwen`
- Bevorzugte Env-Variable: `QWEN_API_KEY`
- Ebenfalls aus Kompatibilitätsgründen akzeptiert: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API-Stil: OpenAI-kompatibel

Wenn Sie `qwen3.6-plus` verwenden möchten, bevorzugen Sie den Endpunkt **Standard (Pay-as-you-go)**.
Die Unterstützung im Coding Plan kann hinter dem öffentlichen Katalog zurückbleiben.

```bash
# Globaler Coding-Plan-Endpunkt
openclaw onboard --auth-choice qwen-api-key

# Chinesischer Coding-Plan-Endpunkt
openclaw onboard --auth-choice qwen-api-key-cn

# Globaler Standard-Endpunkt (Pay-as-you-go)
openclaw onboard --auth-choice qwen-standard-api-key

# Chinesischer Standard-Endpunkt (Pay-as-you-go)
openclaw onboard --auth-choice qwen-standard-api-key-cn
```

Ältere `modelstudio-*`-`auth-choice`-IDs und Modellreferenzen vom Typ `modelstudio/...` funktionieren weiterhin
als Kompatibilitätsalias, neue Einrichtungsabläufe sollten jedoch die kanonischen
`qwen-*`-`auth-choice`-IDs und Modellreferenzen vom Typ `qwen/...` bevorzugen.

Legen Sie nach dem Onboarding ein Standardmodell fest:

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## Plantypen und Endpunkte

| Plan                       | Region | Auth choice                | Endpunkt                                        |
| -------------------------- | ------ | -------------------------- | ----------------------------------------------- |
| Standard (Pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`     |
| Standard (Pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (Abonnement)   | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`              |
| Coding Plan (Abonnement)   | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`         |

Der Provider wählt den Endpunkt anhand Ihrer `auth-choice` automatisch aus. Kanonische
Auswahlen verwenden die Familie `qwen-*`; `modelstudio-*` bleibt nur für Kompatibilität erhalten.
Sie können dies mit einer benutzerdefinierten `baseUrl` in der Konfiguration überschreiben.

Native Model-Studio-Endpunkte signalisieren Streaming-Nutzungskompatibilität auf dem
gemeinsamen Transport `openai-completions`. OpenClaw leitet dies jetzt aus den Fähigkeiten des Endpunkts ab,
sodass DashScope-kompatible benutzerdefinierte Provider-IDs, die auf dieselben nativen Hosts zeigen,
dasselbe Verhalten für Streaming-Nutzung übernehmen, statt
speziell die integrierte Provider-ID `qwen` zu erfordern.

## API-Schlüssel abrufen

- **Schlüssel verwalten**: [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
- **Dokumentation**: [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)

## Integrierter Katalog

OpenClaw enthält derzeit diesen gebündelten Qwen-Katalog:

| Modellreferenz              | Eingabe     | Kontext   | Hinweise                                           |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | Text, Bild  | 1,000,000 | Standardmodell                                     |
| `qwen/qwen3.6-plus`         | Text, Bild  | 1,000,000 | Bevorzugen Sie Standard-Endpunkte, wenn Sie dieses Modell benötigen |
| `qwen/qwen3-max-2026-01-23` | Text        | 262,144   | Qwen-Max-Linie                                     |
| `qwen/qwen3-coder-next`     | Text        | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`     | Text        | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`         | Text        | 1,000,000 | Reasoning aktiviert                                |
| `qwen/glm-5`                | Text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | Text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | Text, Bild  | 262,144   | Moonshot AI über Alibaba                           |

Die Verfügbarkeit kann weiterhin je nach Endpunkt und Abrechnungsplan variieren, selbst wenn ein Modell
im gebündelten Katalog vorhanden ist.

Kompatibilität mit nativer Streaming-Nutzung gilt sowohl für die Coding-Plan-Hosts als auch für
die Standard-DashScope-kompatiblen Hosts:

- `https://coding.dashscope.aliyuncs.com/v1`
- `https://coding-intl.dashscope.aliyuncs.com/v1`
- `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## Verfügbarkeit von Qwen 3.6 Plus

`qwen3.6-plus` ist auf den Standard-Endpunkten (Pay-as-you-go) von Model Studio
verfügbar:

- China: `dashscope.aliyuncs.com/compatible-mode/v1`
- Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

Wenn die Coding-Plan-Endpunkte für
`qwen3.6-plus` einen Fehler vom Typ „unsupported model“ zurückgeben, wechseln Sie zu Standard (Pay-as-you-go) anstelle des
Endpunkts/Schlüsselpaares des Coding Plan.

## Capability-Plan

Die Erweiterung `qwen` wird als das anbieterseitige Zuhause für die vollständige Qwen-
Cloud-Oberfläche positioniert, nicht nur für Coding-/Textmodelle.

- Text-/Chatmodelle: jetzt gebündelt
- Tool-Calling, strukturierte Ausgabe, Thinking: werden vom OpenAI-kompatiblen Transport geerbt
- Bildgenerierung: auf der Ebene des Provider-Plugins geplant
- Bild-/Videoverständnis: jetzt auf dem Standard-Endpunkt gebündelt
- Sprache/Audio: auf der Ebene des Provider-Plugins geplant
- Memory-Embeddings/Reranking: über die Embedding-Adapter-Oberfläche geplant
- Videogenerierung: jetzt über die gemeinsame Videogenerierungs-Capability gebündelt

## Multimodale Add-ons

Die Erweiterung `qwen` stellt jetzt außerdem Folgendes bereit:

- Videoverständnis über `qwen-vl-max-latest`
- Wan-Videogenerierung über:
  - `wan2.6-t2v` (Standard)
  - `wan2.6-i2v`
  - `wan2.6-r2v`
  - `wan2.6-r2v-flash`
  - `wan2.7-r2v`

Diese multimodalen Oberflächen verwenden die **Standard**-DashScope-Endpunkte, nicht die
Coding-Plan-Endpunkte.

- Globale/Internationale Standard-`baseUrl`: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- Chinesische Standard-`baseUrl`: `https://dashscope.aliyuncs.com/compatible-mode/v1`

Für die Videogenerierung ordnet OpenClaw die konfigurierte Qwen-Region dem passenden
DashScope-AIGC-Host zu, bevor der Job gesendet wird:

- Global/International: `https://dashscope-intl.aliyuncs.com`
- China: `https://dashscope.aliyuncs.com`

Das bedeutet, dass eine normale `models.providers.qwen.baseUrl`, die entweder auf die
Hosts von Coding Plan oder Standard Qwen verweist, die Videogenerierung weiterhin auf dem korrekten
regionalen DashScope-Videoendpunkt hält.

Legen Sie für die Videogenerierung explizit ein Standardmodell fest:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Aktuelle Grenzen der gebündelten Qwen-Videogenerierung:

- Bis zu **1** Ausgabevideo pro Anfrage
- Bis zu **1** Eingabebild
- Bis zu **4** Eingabevideos
- Bis zu **10 Sekunden** Dauer
- Unterstützt `size`, `aspectRatio`, `resolution`, `audio` und `watermark`
- Der Referenzbild-/Referenzvideo-Modus erfordert derzeit **entfernte http(s)-URLs**. Lokale
  Dateipfade werden vorab abgelehnt, da der DashScope-Videoendpunkt keine
  hochgeladenen lokalen Buffer für diese Referenzen akzeptiert.

Siehe [Videogenerierung](/tools/video-generation) für die gemeinsamen Tool-
Parameter, Providerauswahl und das Failover-Verhalten.

## Hinweis zur Umgebung

Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `QWEN_API_KEY`
für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über
`env.shellEnv`).
