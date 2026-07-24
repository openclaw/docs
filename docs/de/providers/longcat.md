---
read_when:
    - Sie möchten LongCat-2.0 mit OpenClaw verwenden
    - Sie benötigen den LongCat-API-Schlüssel oder die Modelllimits
summary: LongCat-API-Einrichtung für LongCat-2.0
title: LongCat
x-i18n:
    generated_at: "2026-07-24T04:03:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7c447f9c42e6547a69d2124debcb685c32fe59de29bfc551e18e791d9f280584
    source_path: providers/longcat.md
    workflow: 16
---

[LongCat](https://longcat.ai) stellt eine gehostete API für LongCat-2.0 bereit, ein
Reasoning-Modell für Coding- und agentische Workloads. OpenClaw stellt das
offizielle Plugin `longcat` für den OpenAI-kompatiblen Endpunkt von LongCat bereit.

| Eigenschaft | Wert                               |
| ----------- | ---------------------------------- |
| Provider    | `longcat`                 |
| Authentifizierung | `LONGCAT_API_KEY`          |
| API         | OpenAI-kompatible Chat Completions |
| Basis-URL   | `https://api.longcat.chat/openai`                 |
| Modell      | `longcat/LongCat-2.0`                 |
| Kontext     | 1,048,576 Token                    |
| Maximale Ausgabe | 131,072 Token               |
| Eingabe     | Text                               |

## Plugin installieren

Installieren Sie das offizielle Paket und starten Sie anschließend den Gateway neu:

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel erstellen">
    Melden Sie sich bei der [LongCat-API-Plattform](https://longcat.chat/platform/) an und
    erstellen Sie auf der Seite [API Keys](https://longcat.chat/platform/api_keys)
    einen Schlüssel.
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice longcat-api-key
    ```
  </Step>
  <Step title="Modell überprüfen">
    ```bash
    openclaw models list --provider longcat
    ```
  </Step>
</Steps>

Das Onboarding fügt den gehosteten Katalog hinzu und wählt `longcat/LongCat-2.0` aus, wenn noch
kein primäres Modell konfiguriert ist.

### Nicht interaktive Einrichtung

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

## Reasoning-Verhalten

LongCat bietet eine binäre Steuerung des Denkprozesses. OpenClaw ordnet aktivierte Denkstufen
`thinking: { type: "enabled" }` und `/think off`
`thinking: { type: "disabled" }` zu. LongCat dokumentiert derzeit
`reasoning_effort` nicht, daher sendet OpenClaw diesen Wert nicht.

LongCat gibt Reasoning in `reasoning_content` zurück. OpenClaw behält dieses Feld
bei der erneuten Wiedergabe von Assistenten-Turns mit Tool-Aufrufen bei, damit agentische Sitzungen über mehrere Turns
die vom Provider erwartete Nachrichtenstruktur beibehalten.

## Preise

Der integrierte Katalog verwendet die nutzungsabhängigen Listenpreise von LongCat in USD pro Million
Token: $0.75 für nicht zwischengespeicherte Eingaben, $0.015 für zwischengespeicherte Eingaben und $2.95 für Ausgaben. LongCat bietet möglicherweise
vorübergehende Rabatte an; maßgeblich sind die [Preisseite](https://longcat.chat/platform/docs/Pricing/LongCat-2.0.html)
und Ihre Abrechnungsunterlagen.

## Selbst gehostetes LongCat-2.0

Der Provider `longcat` ist auf die gehostete API von LongCat ausgerichtet. Stellen Sie für die offenen Gewichtungen auf
[Hugging Face](https://huggingface.co/meituan-longcat/LongCat-2.0) das
Modell über eine OpenAI-kompatible Laufzeit bereit und verwenden Sie stattdessen den bestehenden
[vLLM](/de/providers/vllm)- oder [SGLang](/de/providers/sglang)-Provider von OpenClaw.

Behalten Sie die exakte Modellkennung der Laufzeit im Katalog des selbst gehosteten Providers bei;
leiten Sie eine lokale Bereitstellung nicht über `longcat/LongCat-2.0`.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Der Schlüssel funktioniert in einer Shell, aber nicht im Gateway">
    Von einem Daemon verwaltete Gateway-Prozesse übernehmen nicht jede Variable der interaktiven Shell.
    Hinterlegen Sie `LONGCAT_API_KEY` in `~/.openclaw/.env`, konfigurieren Sie sie über das
    Onboarding oder verwenden Sie eine genehmigte Secret-Referenz.
  </Accordion>

  <Accordion title="Anfragen schlagen mit 402 oder 429 fehl">
    `402` bedeutet, dass das Konto nicht über ein ausreichendes Token-Kontingent verfügt. `429` bedeutet, dass der API-
    Schlüssel ein Ratenlimit erreicht hat. Prüfen Sie die [LongCat-Nutzung](https://longcat.chat/platform/usage)
    und wiederholen Sie ratenbegrenzte Anfragen nach Ablauf des Backoff-Zeitfensters des Providers.
  </Accordion>

  <Accordion title="Das Modell wird nicht angezeigt">
    Führen Sie `openclaw plugins list` aus und bestätigen Sie, dass das Plugin `longcat`
    aktiviert ist. Führen Sie anschließend `openclaw models list --provider longcat` aus.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Provider-Konfiguration, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="LongCat-API-Dokumentation" href="https://longcat.chat/platform/docs/" icon="arrow-up-right-from-square">
    Gehostete API-Endpunkte, Authentifizierung, Limits und Beispiele.
  </Card>
  <Card title="LongCat-2.0-Modellkarte" href="https://huggingface.co/meituan-longcat/LongCat-2.0" icon="arrow-up-right-from-square">
    Architektur, Bereitstellungshinweise und Modelldetails.
  </Card>
  <Card title="Secrets" href="/de/gateway/secrets" icon="key">
    Provider-Zugangsdaten speichern, ohne Klartext in die Konfiguration einzubetten.
  </Card>
</CardGroup>
