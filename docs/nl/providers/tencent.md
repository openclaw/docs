---
read_when:
    - Je wilt Tencent hy3 gebruiken met OpenClaw
    - Je moet de API-sleutel voor TokenHub of TokenPlan instellen.
summary: Configuratie van Tencent Cloud TokenHub en TokenPlan voor hy3
title: Tencent Cloud (TokenHub / TokenPlan)
x-i18n:
    generated_at: "2026-07-12T09:15:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

Installeer de officiële providerplugin van Tencent Cloud om via twee eindpunten toegang te krijgen tot Tencent Hy3 — TokenHub (`tencent-tokenhub`) en TokenPlan (`tencent-tokenplan`) — met een OpenAI-compatibele API.

| Eigenschap                           | Waarde                                                |
| ------------------------------------ | ----------------------------------------------------- |
| Provider-id's                        | `tencent-tokenhub`, `tencent-tokenplan`               |
| Pakket                               | `@openclaw/tencent-provider`                          |
| Omgevingsvariabele voor TokenHub-authenticatie  | `TOKENHUB_API_KEY`                         |
| Omgevingsvariabele voor TokenPlan-authenticatie | `TOKENPLAN_API_KEY`                        |
| Onboarding-vlag voor TokenHub        | `--auth-choice tokenhub-api-key`                      |
| Onboarding-vlag voor TokenPlan       | `--auth-choice tokenplan-api-key`                     |
| Directe CLI-vlag voor TokenHub       | `--tokenhub-api-key <key>`                            |
| Directe CLI-vlag voor TokenPlan      | `--tokenplan-api-key <key>`                           |
| API                                  | OpenAI-compatibel (`openai-completions`)              |
| Basis-URL van TokenHub               | `https://tokenhub.tencentmaas.com/v1`                 |
| Algemene basis-URL van TokenHub      | `https://tokenhub-intl.tencentmaas.com/v1` (overschrijving) |
| Basis-URL van TokenPlan              | `https://api.lkeap.cloud.tencent.com/plan/v3`         |
| Standaardmodel                       | `tencent-tokenhub/hy3`                                |

## Snel aan de slag

<Steps>
  <Step title="Create a Tencent API key">
    Maak een API-sleutel voor Tencent Cloud TokenHub en TokenPlan. Als je voor de sleutel een beperkt toegangsbereik kiest, neem dan **hy3** op in de toegestane modellen (en **hy3 preview** als je dit model met TokenHub wilt gebruiken).
  </Step>
  <Step title="Run onboarding">
    <CodeGroup>

```bash TokenHub onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash TokenHub direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash TokenPlan onboarding
openclaw onboard --auth-choice tokenplan-api-key
```

```bash TokenPlan direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash Env only
export TOKENHUB_API_KEY=...
export TOKENPLAN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Verify the model">
    ```bash
    openclaw models list --provider tencent-tokenhub
    openclaw models list --provider tencent-tokenplan
    ```
  </Step>
</Steps>

## Niet-interactieve configuratie

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
`--accept-risk` is vereist in combinatie met `--non-interactive`.
</Note>

## Ingebouwde catalogus

| Modelreferentie                | Naam                   | Invoer | Context | Maximale uitvoer | Opmerkingen                 |
| ------------------------------ | ---------------------- | ------ | ------- | ---------------- | --------------------------- |
| `tencent-tokenhub/hy3-preview` | hy3-preview (TokenHub) | tekst  | 256,000 | 64,000           | ondersteuning voor redeneren |
| `tencent-tokenhub/hy3`         | hy3 (TokenHub)         | tekst  | 256,000 | 64,000           | ondersteuning voor redeneren |
| `tencent-tokenplan/hy3`        | hy3 (TokenPlan)        | tekst  | 256,000 | 64,000           | ondersteuning voor redeneren |

hy3 is het grote MoE-taalmodel van Tencent Hunyuan voor redeneren, het volgen van instructies met een lange context, code en agentworkflows. De OpenAI-compatibele voorbeelden van Tencent gebruiken `hy3` als model-id en ondersteunen standaardtoolaanroepen voor chatvoltooiingen, plus `reasoning_effort`.

<Tip>
  De model-id is `hy3`. Verwar deze niet met de `HY-3D-*`-modellen van Tencent. Dit zijn API's voor 3D-generatie en niet het OpenClaw-chatmodel dat door deze provider wordt geconfigureerd.
</Tip>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Endpoint override">
    De ingebouwde catalogus van OpenClaw gebruikt het eindpunt `https://tokenhub.tencentmaas.com/v1` van Tencent Cloud. Overschrijf dit alleen als je TokenHub-account of -regio een ander eindpunt vereist:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    Als de Gateway als beheerde service wordt uitgevoerd (launchd, systemd, Docker), moeten `TOKENHUB_API_KEY` en `TOKENPLAN_API_KEY` zichtbaar zijn voor dat proces. Stel ze in via `~/.openclaw/.env` of `env.shellEnv`, zodat uitvoeringsomgevingen van launchd, systemd of Docker ze kunnen lezen.

    <Warning>
      Sleutels die alleen in een interactieve shell zijn geëxporteerd, zijn niet zichtbaar voor beheerde Gateway-processen. Gebruik het omgevingsbestand of het configuratiekoppelpunt voor permanente beschikbaarheid.
    </Warning>

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model providers" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Configuration reference" href="/nl/gateway/configuration-reference" icon="gear">
    Volledig configuratieschema, inclusief providerinstellingen.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    De productpagina van Tencent Cloud TokenHub.
  </Card>
  <Card title="Hy3 preview model card" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Details en benchmarks van de Tencent Hunyuan Hy3-preview.
  </Card>
</CardGroup>
