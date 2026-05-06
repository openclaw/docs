---
read_when:
    - Je wilt de Tencent Hy3-preview gebruiken met OpenClaw
    - Je moet de TokenHub API-sleutel instellen
summary: Tencent Cloud TokenHub-configuratie voor Hy3-preview
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-05-06T09:30:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: a194e10b0e77e2567e6835f08d1cc0fa2a32fa8d37b1851fb83024b172a03fe3
    source_path: providers/tencent.md
    workflow: 16
---

Tencent Cloud wordt als gebundelde provider-Plugin in OpenClaw geleverd. Het geeft toegang tot Tencent Hy3 preview via het TokenHub-eindpunt (`tencent-tokenhub`) met een OpenAI-compatibele API.

| Eigenschap        | Waarde                                                |
| ----------------- | ----------------------------------------------------- |
| Provider-id       | `tencent-tokenhub`                                    |
| Plugin            | gebundeld, `enabledByDefault: true`                   |
| Auth-env-var      | `TOKENHUB_API_KEY`                                    |
| Onboarding-vlag   | `--auth-choice tokenhub-api-key`                      |
| Directe CLI-vlag  | `--tokenhub-api-key <key>`                            |
| API               | OpenAI-compatibel (`openai-completions`)              |
| Standaard basis-URL | `https://tokenhub.tencentmaas.com/v1`               |
| Globale basis-URL | `https://tokenhub-intl.tencentmaas.com/v1` (override) |
| Standaardmodel    | `tencent-tokenhub/hy3-preview`                        |

## Snelle start

<Steps>
  <Step title="Een TokenHub-API-sleutel aanmaken">
    Maak een API-sleutel aan in Tencent Cloud TokenHub. Als je een beperkte toegangsscope voor de sleutel kiest, neem dan **Hy3 preview** op in de toegestane modellen.
  </Step>
  <Step title="Onboarding uitvoeren">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Env only
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Het model verifiëren">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Niet-interactieve configuratie

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Ingebouwde catalogus

| Model-ref                      | Naam                   | Invoer | Context | Maximale uitvoer | Opmerkingen                |
| ------------------------------ | ---------------------- | ------ | ------- | ---------------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | tekst  | 256,000 | 64,000           | Standaard; reasoning-enabled |

Hy3 preview is het grote MoE-taalmodel van Tencent Hunyuan voor redeneren, instructies volgen met lange context, code en agentworkflows. De OpenAI-compatibele voorbeelden van Tencent gebruiken `hy3-preview` als model-id en ondersteunen standaard toolaanroepen voor chat-completions plus `reasoning_effort`.

<Tip>
  De model-id is `hy3-preview`. Verwar dit niet met de `HY-3D-*`-modellen van Tencent; dat zijn API's voor 3D-generatie en niet het OpenClaw-chatmodel dat door deze provider is geconfigureerd.
</Tip>

## Gelaagde prijzen

De gebundelde catalogus levert gelaagde kostenmetadata die schaalt met de lengte van het invoervenster, zodat kostenschattingen worden ingevuld zonder handmatige overrides.

| Bereik invoertokens | Invoertarief | Uitvoertarief | Cache-lezen |
| ------------------- | ------------ | ------------- | ----------- |
| 0 - 16,000          | 0.176        | 0.587         | 0.059       |
| 16,000 - 32,000     | 0.235        | 0.939         | 0.088       |
| 32,000+             | 0.293        | 1.173         | 0.117       |

Tarieven zijn per miljoen tokens in USD zoals geadverteerd door Tencent. Overschrijf prijzen onder `models.providers.tencent-tokenhub` alleen wanneer je een ander oppervlak nodig hebt.

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Eindpunt-override">
    OpenClaw gebruikt standaard het eindpunt `https://tokenhub.tencentmaas.com/v1` van Tencent Cloud. Tencent documenteert ook een internationaal TokenHub-eindpunt:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    Overschrijf het eindpunt alleen wanneer je TokenHub-account of regio dit vereist.

  </Accordion>

  <Accordion title="Beschikbaarheid van de omgeving voor de daemon">
    Als de Gateway als beheerde service draait (launchd, systemd, Docker), moet `TOKENHUB_API_KEY` zichtbaar zijn voor dat proces. Stel deze in `~/.openclaw/.env` of via `env.shellEnv` in, zodat launchd-, systemd- of Docker exec-omgevingen deze kunnen lezen.

    <Warning>
      Sleutels die alleen in `~/.profile` zijn ingesteld, zijn niet zichtbaar voor beheerde gatewayprocessen. Gebruik het env-bestand of de configuratienaad voor blijvende beschikbaarheid.
    </Warning>

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelproviders" href="/nl/concepts/model-providers" icon="layers">
    Providers, model-refs en failovergedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration" icon="gear">
    Volledig configuratieschema, inclusief providerinstellingen.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    De TokenHub-productpagina van Tencent Cloud.
  </Card>
  <Card title="Hy3 preview-modelkaart" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Details en benchmarks van Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
