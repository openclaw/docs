---
read_when:
    - Sie möchten die Tencent Hy3-Vorschau mit OpenClaw verwenden
    - Sie müssen den TokenHub-API-Schlüssel einrichten
summary: Einrichtung von Tencent Cloud TokenHub für die Hy3-Vorschau
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-05-06T07:01:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: a194e10b0e77e2567e6835f08d1cc0fa2a32fa8d37b1851fb83024b172a03fe3
    source_path: providers/tencent.md
    workflow: 16
---

Tencent Cloud wird in OpenClaw als gebündeltes Provider-Plugin ausgeliefert. Es bietet Zugriff auf Tencent Hy3 preview über den TokenHub-Endpunkt (`tencent-tokenhub`) mit einer OpenAI-kompatiblen API.

| Eigenschaft      | Wert                                                  |
| ---------------- | ----------------------------------------------------- |
| Provider-ID      | `tencent-tokenhub`                                    |
| Plugin           | gebündelt, `enabledByDefault: true`                   |
| Auth-Env-Var     | `TOKENHUB_API_KEY`                                    |
| Onboarding-Flag  | `--auth-choice tokenhub-api-key`                      |
| Direkter CLI-Flag | `--tokenhub-api-key <key>`                           |
| API              | OpenAI-kompatibel (`openai-completions`)              |
| Standard-Basis-URL | `https://tokenhub.tencentmaas.com/v1`               |
| Globale Basis-URL | `https://tokenhub-intl.tencentmaas.com/v1` (Override) |
| Standardmodell   | `tencent-tokenhub/hy3-preview`                        |

## Schnellstart

<Steps>
  <Step title="TokenHub-API-Schlüssel erstellen">
    Erstellen Sie einen API-Schlüssel in Tencent Cloud TokenHub. Wenn Sie für den Schlüssel einen eingeschränkten Zugriffsbereich wählen, nehmen Sie **Hy3 preview** in die zulässigen Modelle auf.
  </Step>
  <Step title="Onboarding ausführen">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Direktes Flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Nur Env
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Modell überprüfen">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Nicht interaktive Einrichtung

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Integrierter Katalog

| Modellreferenz                 | Name                   | Eingabe | Kontext | Maximale Ausgabe | Hinweise                   |
| ------------------------------ | ---------------------- | ------- | ------- | ---------------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | Text    | 256.000 | 64.000           | Standard; reasoning-fähig  |

Hy3 preview ist das große MoE-Sprachmodell von Tencent Hunyuan für Reasoning, Befolgen von Anweisungen mit langem Kontext, Code und Agent-Workflows. Die OpenAI-kompatiblen Beispiele von Tencent verwenden `hy3-preview` als Modell-ID und unterstützen standardmäßiges Chat-Completions-Tool-Calling sowie `reasoning_effort`.

<Tip>
  Die Modell-ID lautet `hy3-preview`. Verwechseln Sie sie nicht mit Tencents `HY-3D-*`-Modellen. Diese sind APIs für 3D-Generierung und nicht das von diesem Provider konfigurierte OpenClaw-Chatmodell.
</Tip>

## Gestaffelte Preise

Der gebündelte Katalog enthält gestaffelte Kostenmetadaten, die mit der Länge des Eingabefensters skalieren, sodass Kostenschätzungen ohne manuelle Overrides befüllt werden.

| Bereich der Eingabe-Token | Eingaberate | Ausgaberate | Cache-Lesezugriff |
| ------------------------- | ----------- | ----------- | ----------------- |
| 0 - 16.000                | 0,176       | 0,587       | 0,059             |
| 16.000 - 32.000           | 0,235       | 0,939       | 0,088             |
| 32.000+                   | 0,293       | 1,173       | 0,117             |

Die Raten gelten pro Million Token in USD, wie von Tencent angegeben. Überschreiben Sie die Preise unter `models.providers.tencent-tokenhub` nur, wenn Sie eine andere Oberfläche benötigen.

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Endpunkt-Override">
    OpenClaw verwendet standardmäßig den Tencent-Cloud-Endpunkt `https://tokenhub.tencentmaas.com/v1`. Tencent dokumentiert außerdem einen internationalen TokenHub-Endpunkt:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    Überschreiben Sie den Endpunkt nur, wenn Ihr TokenHub-Konto oder Ihre Region dies erfordert.

  </Accordion>

  <Accordion title="Umgebungsverfügbarkeit für den Daemon">
    Wenn der Gateway als verwalteter Dienst ausgeführt wird (launchd, systemd, Docker), muss `TOKENHUB_API_KEY` für diesen Prozess sichtbar sein. Legen Sie ihn in `~/.openclaw/.env` oder über `env.shellEnv` fest, damit launchd-, systemd- oder Docker-Exec-Umgebungen ihn lesen können.

    <Warning>
      Schlüssel, die nur in `~/.profile` festgelegt sind, sind für verwaltete Gateway-Prozesse nicht sichtbar. Verwenden Sie die Env-Datei oder die Config-Seam für dauerhafte Verfügbarkeit.
    </Warning>

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration" icon="gear">
    Vollständiges Konfigurationsschema einschließlich Provider-Einstellungen.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Produktseite von Tencent Cloud TokenHub.
  </Card>
  <Card title="Hy3-preview-Modellkarte" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Details und Benchmarks zu Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
