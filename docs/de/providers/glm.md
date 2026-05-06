---
read_when:
    - Sie möchten GLM-Modelle in OpenClaw verwenden
    - Sie benötigen die Konvention zur Modellbenennung und die Einrichtung
summary: Überblick über die GLM-Modellfamilie und deren Verwendung in OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-05-06T07:00:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 190b8834e3f11cdb90c9bdb1844bfad3a79383776540f733e601437157b7a093
    source_path: providers/glm.md
    workflow: 16
---

GLM ist eine Modellfamilie (kein Unternehmen), die über die Plattform [Z.AI](https://z.ai) verfügbar ist. In OpenClaw werden GLM-Modelle über den gebündelten `zai`-Provider mit Refs wie `zai/glm-5.1` aufgerufen.

| Eigenschaft          | Wert                                                                        |
| -------------------- | --------------------------------------------------------------------------- |
| Provider-ID          | `zai`                                                                       |
| Plugin               | gebündelt, `enabledByDefault: true`                                         |
| Auth-Umgebungsvariablen | `ZAI_API_KEY` oder `Z_AI_API_KEY`                                        |
| Onboarding-Auswahlen | `zai-api-key`, `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` |
| API                  | OpenAI-kompatibel                                                           |
| Standard-Basis-URL   | `https://api.z.ai/api/paas/v4`                                              |
| Empfohlener Standard | `zai/glm-5.1`                                                               |
| Standard-Bildmodell  | `zai/glm-4.6v`                                                              |

## Erste Schritte

<Steps>
  <Step title="Authentifizierungsweg wählen und Onboarding ausführen">
    Wählen Sie die Onboarding-Auswahl, die zu Ihrem Z.AI-Tarif und Ihrer Region passt. Die generische Auswahl `zai-api-key` erkennt den passenden Endpunkt automatisch anhand der Schlüsselstruktur; verwenden Sie die expliziten regionalen Auswahlen, wenn Sie einen bestimmten Coding Plan oder eine allgemeine API-Oberfläche erzwingen möchten.

    | Auth-Auswahl        | Am besten geeignet für                              |
    | ------------------- | --------------------------------------------------- |
    | `zai-api-key`       | Generischer API-Schlüssel mit automatischer Endpunkterkennung |
    | `zai-coding-global` | Nutzer des Coding Plan (global)                     |
    | `zai-coding-cn`     | Nutzer des Coding Plan (Region China)               |
    | `zai-global`        | Allgemeine API (global)                             |
    | `zai-cn`            | Allgemeine API (Region China)                       |

    <CodeGroup>

```bash Automatisch erkennen
openclaw onboard --auth-choice zai-api-key
```

```bash Coding Plan (global)
openclaw onboard --auth-choice zai-coding-global
```

```bash Coding Plan (China)
openclaw onboard --auth-choice zai-coding-cn
```

```bash Allgemeine API (global)
openclaw onboard --auth-choice zai-global
```

```bash Allgemeine API (China)
openclaw onboard --auth-choice zai-cn
```

    </CodeGroup>

  </Step>
  <Step title="GLM als Standardmodell festlegen">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Verfügbarkeit der Modelle prüfen">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Konfigurationsbeispiel

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
  Mit `zai-api-key` kann OpenClaw den passenden Z.AI-Endpunkt anhand der Schlüsselstruktur erkennen und automatisch die richtige Basis-URL anwenden. Verwenden Sie die expliziten regionalen Auswahlen, wenn Sie einen bestimmten Coding Plan oder eine allgemeine API-Oberfläche festlegen möchten.
</Tip>

## Integrierter Katalog

Der gebündelte `zai`-Provider stellt 13 GLM-Modell-Refs bereit. Alle Einträge unterstützen Reasoning, sofern nicht anders angegeben; `glm-5v-turbo` und `glm-4.6v` akzeptieren Bildeingaben ebenso wie Text.

| Modell-Ref           | Hinweise                                           |
| -------------------- | -------------------------------------------------- |
| `zai/glm-5.1`        | Standardmodell. Reasoning, nur Text, 202k Kontext. |
| `zai/glm-5`          | Reasoning, nur Text, 202k Kontext.                 |
| `zai/glm-5-turbo`    | Reasoning, nur Text, 202k Kontext.                 |
| `zai/glm-5v-turbo`   | Reasoning, Text + Bild, 202k Kontext.              |
| `zai/glm-4.7`        | Reasoning, nur Text, 204k Kontext.                 |
| `zai/glm-4.7-flash`  | Reasoning, nur Text, 200k Kontext.                 |
| `zai/glm-4.7-flashx` | Reasoning, nur Text.                               |
| `zai/glm-4.6`        | Reasoning, nur Text.                               |
| `zai/glm-4.6v`       | Reasoning, Text + Bild. Standard-Bildmodell.       |
| `zai/glm-4.5`        | Reasoning, nur Text.                               |
| `zai/glm-4.5-air`    | Reasoning, nur Text.                               |
| `zai/glm-4.5-flash`  | Reasoning, nur Text.                               |
| `zai/glm-4.5v`       | Reasoning, Text + Bild.                            |

<Note>
  GLM-Versionen und Verfügbarkeit können sich ändern. Führen Sie `openclaw models list --provider zai` aus, um die Katalogzeilen anzuzeigen, die Ihrer installierten Version bekannt sind, und prüfen Sie die Dokumentation von Z.AI auf neu hinzugefügte oder veraltete Modelle.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Automatische Endpunkterkennung">
    Wenn Sie die Auth-Auswahl `zai-api-key` verwenden, prüft OpenClaw die Schlüsselstruktur, um die richtige Z.AI-Basis-URL zu bestimmen. Explizite regionale Auswahlen (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) überschreiben die automatische Erkennung und legen den Endpunkt direkt fest.
  </Accordion>

  <Accordion title="Provider-Details">
    GLM-Modelle werden vom Laufzeit-Provider `zai` bereitgestellt. Die vollständige Provider-Konfiguration, regionale Endpunkte und zusätzliche Funktionen finden Sie auf der [Z.AI-Provider-Seite](/de/providers/zai).
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Z.AI-Provider" href="/de/providers/zai" icon="server">
    Vollständige Z.AI-Provider-Konfiguration und regionale Endpunkte.
  </Card>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Provider auswählen, Modell-Refs verwenden und Failover-Verhalten konfigurieren.
  </Card>
  <Card title="Denkmodi" href="/de/tools/thinking" icon="brain">
    `/think`-Stufen für die Reasoning-fähige GLM-Familie.
  </Card>
  <Card title="Modelle-FAQ" href="/de/help/faq-models" icon="circle-question">
    Auth-Profile, Modellwechsel und Behebung von „kein Profil“-Fehlern.
  </Card>
</CardGroup>
