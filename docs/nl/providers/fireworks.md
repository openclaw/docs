---
read_when:
    - Je wilt Fireworks gebruiken met OpenClaw
    - Je hebt de Fireworks API-sleutelomgevingsvariabele of de standaardmodel-id nodig
summary: Fireworks-configuratie (authenticatie + modelselectie)
title: Vuurwerk
x-i18n:
    generated_at: "2026-04-29T23:09:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 66ad831b9a04897c8850f28d246ec6c1efe1006c2a7f59295a8a78746c78e645
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) biedt open-weight- en gerouteerde modellen via een OpenAI-compatibele API. OpenClaw bevat een gebundelde Fireworks-provider-Plugin.

| Eigenschap    | Waarde                                                 |
| ------------- | ------------------------------------------------------ |
| Provider      | `fireworks`                                            |
| Auth          | `FIREWORKS_API_KEY`                                    |
| API           | OpenAI-compatibele chat/completions                    |
| Basis-URL     | `https://api.fireworks.ai/inference/v1`                |
| Standaardmodel | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Aan de slag

<Steps>
  <Step title="Fireworks-authenticatie instellen via onboarding">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    Hiermee wordt je Fireworks-sleutel opgeslagen in de OpenClaw-configuratie en wordt het Fire Pass-startmodel ingesteld als standaard.

  </Step>
  <Step title="Controleren of het model beschikbaar is">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## Niet-interactief voorbeeld

Geef voor scripts of CI-installaties alle waarden op de opdrachtregel door:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Ingebouwde catalogus

| Modelreferentie                                       | Naam                        | Invoer     | Context | Maximale uitvoer | Opmerkingen                                                                                                                                                        |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | text,image | 262,144 | 262,144          | Nieuwste Kimi-model op Fireworks. Denken is uitgeschakeld voor Fireworks K2.6-aanvragen; routeer rechtstreeks via Moonshot als je Kimi-denkuitvoer nodig hebt. |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000          | Standaard gebundeld startmodel op Fireworks                                                                                                                       |

<Tip>
Als Fireworks een nieuwer model publiceert, zoals een nieuwe Qwen- of Gemma-release, kun je er rechtstreeks naar overschakelen door de Fireworks-model-id te gebruiken zonder te wachten op een update van de gebundelde catalogus.
</Tip>

## Aangepaste Fireworks-model-id's

OpenClaw accepteert ook dynamische Fireworks-model-id's. Gebruik de exacte model- of router-id die Fireworks toont en prefix deze met `fireworks/`.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Hoe model-id-prefixing werkt">
    Elke Fireworks-modelreferentie in OpenClaw begint met `fireworks/`, gevolgd door de exacte id of het routerpad van het Fireworks-platform. Bijvoorbeeld:

    - Routermodel: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Direct model: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw verwijdert de prefix `fireworks/` bij het bouwen van de API-aanvraag en stuurt het resterende pad naar het Fireworks-eindpunt.

  </Accordion>

  <Accordion title="Omgevingsnotitie">
    Als de Gateway buiten je interactieve shell draait, zorg er dan voor dat `FIREWORKS_API_KEY` ook beschikbaar is voor dat proces.

    <Warning>
    Een sleutel die alleen in `~/.profile` staat, helpt een launchd/systemd-daemon niet, tenzij die omgeving daar ook wordt geïmporteerd. Stel de sleutel in `~/.openclaw/.env` of via `env.shellEnv` in om ervoor te zorgen dat het Gateway-proces deze kan lezen.
    </Warning>

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failover-gedrag kiezen.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Algemene probleemoplossing en veelgestelde vragen.
  </Card>
</CardGroup>
