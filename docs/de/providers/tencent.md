---
read_when:
    - Sie möchten Tencent hy3 mit OpenClaw verwenden
    - Sie müssen den API-Schlüssel für TokenHub oder TokenPlan einrichten
summary: Einrichtung von Tencent Cloud TokenHub und TokenPlan für hy3
title: Tencent Cloud (TokenHub / TokenPlan)
x-i18n:
    generated_at: "2026-07-24T04:39:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

Installieren Sie das offizielle Tencent-Cloud-Provider-Plugin, um über zwei Endpunkte — TokenHub (`tencent-tokenhub`) und TokenPlan (`tencent-tokenplan`) — mithilfe einer OpenAI-kompatiblen API auf Tencent Hy3 zuzugreifen.

| Eigenschaft                    | Wert                                                  |
| ------------------------------ | ----------------------------------------------------- |
| Provider-IDs                   | `tencent-tokenhub`, `tencent-tokenplan`               |
| Paket                          | `@openclaw/tencent-provider`                                    |
| TokenHub-Umgebungsvariable für die Authentifizierung | `TOKENHUB_API_KEY`                    |
| TokenPlan-Umgebungsvariable für die Authentifizierung | `TOKENPLAN_API_KEY`                   |
| TokenHub-Onboarding-Flag       | `--auth-choice tokenhub-api-key`                                    |
| TokenPlan-Onboarding-Flag      | `--auth-choice tokenplan-api-key`                                    |
| Direktes TokenHub-CLI-Flag     | `--tokenhub-api-key <key>`                                    |
| Direktes TokenPlan-CLI-Flag    | `--tokenplan-api-key <key>`                                    |
| API                            | OpenAI-kompatibel (`openai-completions`)                |
| TokenHub-Basis-URL             | `https://tokenhub.tencentmaas.com/v1`                                    |
| Globale TokenHub-Basis-URL     | `https://tokenhub-intl.tencentmaas.com/v1` (Überschreibung)                   |
| TokenPlan-Basis-URL            | `https://api.lkeap.cloud.tencent.com/plan/v3`                                    |
| Standardmodell                 | `tencent-tokenhub/hy3`                                    |

## Schnellstart

<Steps>
  <Step title="Tencent-API-Schlüssel erstellen">
    Erstellen Sie einen API-Schlüssel für Tencent Cloud TokenHub und TokenPlan. Wenn Sie für den Schlüssel einen eingeschränkten Zugriffsbereich wählen, nehmen Sie **hy3** (und **hy3 preview**, falls Sie es auf TokenHub verwenden möchten) in die zulässigen Modelle auf.
  </Step>
  <Step title="Onboarding ausführen">
    <CodeGroup>

```bash TokenHub-Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Direktes TokenHub-Flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash TokenPlan-Onboarding
openclaw onboard --auth-choice tokenplan-api-key
```

```bash Direktes TokenPlan-Flag
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash Nur Umgebung
export TOKENHUB_API_KEY=...
export TOKENPLAN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Modell überprüfen">
    ```bash
    openclaw models list --provider tencent-tokenhub
    openclaw models list --provider tencent-tokenplan
    ```
  </Step>
</Steps>

## Nicht interaktive Einrichtung

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# TokenPlan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY" \
  --skip-health \
  --accept-risk
```

<Note>
`--accept-risk` ist zusammen mit `--non-interactive` erforderlich.
</Note>

## Integrierter Katalog

| Modellreferenz                 | Name                   | Eingabe | Kontext | Max. Ausgabe | Hinweise                  |
| ------------------------------ | ---------------------- | ------- | ------- | ------------ | ------------------------- |
| `tencent-tokenhub/hy3-preview` | hy3 preview (TokenHub) | Text    | 256,000 | 64,000       | Reasoning-fähig           |
| `tencent-tokenhub/hy3`         | hy3 (TokenHub)         | Text    | 256,000 | 64,000       | Reasoning-fähig           |
| `tencent-tokenplan/hy3`        | hy3 (TokenPlan)        | Text    | 256,000 | 64,000       | Reasoning-fähig           |

hy3 ist Tencent Hanyuans großes MoE-Sprachmodell für Reasoning, das Befolgen von Anweisungen mit langem Kontext, Code und Agenten-Workflows. Tencents OpenAI-kompatible Beispiele verwenden `hy3` als Modell-ID und unterstützen standardmäßige Tool-Aufrufe über Chat Completions sowie `reasoning_effort`.

<Tip>
  Die Modell-ID lautet `hy3`. Verwechseln Sie sie nicht mit Tencents `HY-3D-*`-Modellen. Diese sind APIs zur 3D-Generierung und nicht das von diesem Provider konfigurierte OpenClaw-Chatmodell.
</Tip>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Endpunkt überschreiben">
    Der integrierte Katalog von OpenClaw verwendet den `https://tokenhub.tencentmaas.com/v1`-Endpunkt von Tencent Cloud. Überschreiben Sie ihn nur, wenn Ihr TokenHub-Konto oder Ihre Region einen anderen erfordert:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="Umgebungsverfügbarkeit für den Daemon">
    Wenn der Gateway als verwalteter Dienst ausgeführt wird (launchd, systemd, Docker), müssen `TOKENHUB_API_KEY` und `TOKENPLAN_API_KEY` für diesen Prozess sichtbar sein. Legen Sie sie in `~/.openclaw/.env` oder über `env.shellEnv` fest, damit launchd-, systemd- oder Docker-Exec-Umgebungen darauf zugreifen können.

    <Warning>
      Schlüssel, die nur in einer interaktiven Shell exportiert wurden, sind für verwaltete Gateway-Prozesse nicht sichtbar. Verwenden Sie für dauerhafte Verfügbarkeit die Umgebungsdatei oder die Konfigurationsschnittstelle.
    </Warning>

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema einschließlich Provider-Einstellungen.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    TokenHub-Produktseite von Tencent Cloud.
  </Card>
  <Card title="Modellkarte für Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Details und Benchmarks zur Vorschauversion von Tencent Hunyuan Hy3.
  </Card>
</CardGroup>
