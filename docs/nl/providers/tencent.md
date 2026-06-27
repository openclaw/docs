---
read_when:
    - Je wilt Tencent Hy3 preview gebruiken met OpenClaw
    - Je moet de TokenHub API-sleutel instellen
summary: Tencent Cloud TokenHub instellen voor Hy3-preview
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-06-27T18:15:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62bcdd795cc0334f409405fa7c369ed9966854616a89dbc7153f91ee349895ad
    source_path: providers/tencent.md
    workflow: 16
---

Installeer de officiële Tencent Cloud-providerplugin om toegang te krijgen tot Tencent Hy3 preview via het TokenHub-endpoint (`tencent-tokenhub`) met een OpenAI-compatibele API.

| Eigenschap        | Waarde                                                |
| ----------------- | ----------------------------------------------------- |
| Provider-id       | `tencent-tokenhub`                                    |
| Pakket            | `@openclaw/tencent-provider`                          |
| Auth-env-var      | `TOKENHUB_API_KEY`                                    |
| Onboarding-flag   | `--auth-choice tokenhub-api-key`                      |
| Directe CLI-flag  | `--tokenhub-api-key <key>`                            |
| API               | OpenAI-compatibel (`openai-completions`)              |
| Standaardbasis-URL | `https://tokenhub.tencentmaas.com/v1`                |
| Globale basis-URL | `https://tokenhub-intl.tencentmaas.com/v1` (overschrijven) |
| Standaardmodel    | `tencent-tokenhub/hy3-preview`                        |

## Snel starten

<Steps>
  <Step title="Installeer de plugin">
    ```bash
    openclaw plugins install @openclaw/tencent-provider
    ```
  </Step>
  <Step title="Maak een TokenHub-API-sleutel">
    Maak een API-sleutel in Tencent Cloud TokenHub. Als je een beperkte toegangsscope voor de sleutel kiest, neem dan **Hy3 preview** op in de toegestane modellen.
  </Step>
  <Step title="Voer onboarding uit">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Directe flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Alleen env
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Verifieer het model">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Niet-interactieve installatie

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Ingebouwde catalogus

| Modelref                       | Naam                   | Invoer | Context | Maximale uitvoer | Opmerkingen                  |
| ------------------------------ | ---------------------- | ------ | ------- | ---------------- | ---------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | tekst  | 256,000 | 64,000           | Standaard; reasoning ingeschakeld |

Hy3 preview is het grote MoE-taalmodel van Tencent Hunyuan voor reasoning, instructies met lange context volgen, code en agentworkflows. De OpenAI-compatibele voorbeelden van Tencent gebruiken `hy3-preview` als model-id en ondersteunen standaard tool calling voor chat-completions plus `reasoning_effort`.

<Tip>
  De model-id is `hy3-preview`. Verwar dit niet met de `HY-3D-*`-modellen van Tencent, die 3D-generatie-API's zijn en niet het OpenClaw-chatmodel dat door deze provider is geconfigureerd.
</Tip>

## Gedifferentieerde prijzen

De providercatalogus wordt geleverd met gedifferentieerde kostenmetadata die schaalt met de lengte van het invoervenster, zodat kostenramingen worden ingevuld zonder handmatige overschrijvingen.

| Bereik invoertokens | Invoertarief | Uitvoertarief | Cache-lezen |
| ------------------- | ------------ | ------------- | ----------- |
| 0 - 16,000          | 0.176        | 0.587         | 0.059       |
| 16,000 - 32,000     | 0.235        | 0.939         | 0.088       |
| 32,000+             | 0.293        | 1.173         | 0.117       |

Tarieven zijn per miljoen tokens in USD zoals door Tencent gepubliceerd. Overschrijf prijzen onder `models.providers.tencent-tokenhub` alleen wanneer je een ander oppervlak nodig hebt.

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Endpoint overschrijven">
    OpenClaw gebruikt standaard het endpoint `https://tokenhub.tencentmaas.com/v1` van Tencent Cloud. Tencent documenteert ook een internationaal TokenHub-endpoint:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    Overschrijf het endpoint alleen wanneer je TokenHub-account of regio dit vereist.

  </Accordion>

  <Accordion title="Omgevingsbeschikbaarheid voor de daemon">
    Als de Gateway als beheerde service draait (launchd, systemd, Docker), moet `TOKENHUB_API_KEY` zichtbaar zijn voor dat proces. Stel dit in `~/.openclaw/.env` in of via `env.shellEnv`, zodat launchd-, systemd- of Docker exec-omgevingen het kunnen lezen.

    <Warning>
      Sleutels die alleen in een interactieve shell zijn geëxporteerd, zijn niet zichtbaar voor beheerde Gateway-processen. Gebruik het env-bestand of de configuratieseam voor blijvende beschikbaarheid.
    </Warning>

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelproviders" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failovergedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration" icon="gear">
    Volledig configuratieschema inclusief providerinstellingen.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    De TokenHub-productpagina van Tencent Cloud.
  </Card>
  <Card title="Hy3 preview-modelkaart" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Details en benchmarks van Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
