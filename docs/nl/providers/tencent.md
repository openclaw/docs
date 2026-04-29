---
read_when:
    - Je wilt de previewversie van Tencent Hy3 gebruiken met OpenClaw
    - Je moet de TokenHub-API-sleutel instellen
summary: Tencent Cloud TokenHub instellen voor Hy3-preview
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-29T23:13:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: c64afffc66dccca256ec658235ae1fbc18e46608b594bc07875118f54b2a494d
    source_path: providers/tencent.md
    workflow: 16
---

# Tencent Cloud TokenHub

Tencent Cloud wordt geleverd als een **gebundelde provider-Plugin** in OpenClaw. Het geeft toegang tot Tencent Hy3 preview via het TokenHub-endpoint (`tencent-tokenhub`).

De provider gebruikt een OpenAI-compatibele API.

| Eigenschap     | Waarde                                     |
| -------------- | ------------------------------------------ |
| Provider       | `tencent-tokenhub`                         |
| Standaardmodel | `tencent-tokenhub/hy3-preview`             |
| Authenticatie  | `TOKENHUB_API_KEY`                         |
| API            | OpenAI-compatibele chatvoltooiingen        |
| Basis-URL      | `https://tokenhub.tencentmaas.com/v1`      |
| Globale URL    | `https://tokenhub-intl.tencentmaas.com/v1` |

## Snelstart

<Steps>
  <Step title="Maak een TokenHub API-sleutel">
    Maak een API-sleutel in Tencent Cloud TokenHub. Als je een beperkte toegangsscope voor de sleutel kiest, neem dan **Hy3 preview** op in de toegestane modellen.
  </Step>
  <Step title="Voer onboarding uit">
    ```bash
    openclaw onboard --auth-choice tokenhub-api-key
    ```
  </Step>
  <Step title="Verifieer het model">
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

| Modelverwijzing                | Naam                   | Invoer | Context | Max. uitvoer | Opmerkingen                         |
| ------------------------------ | ---------------------- | ------ | ------- | ------------ | ----------------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | tekst  | 256,000 | 64,000       | Standaard; redeneren ingeschakeld |

Hy3 preview is Tencents grote MoE-taalmodel van Hunyuan voor redeneren, instructies volgen met lange context, code en agentworkflows. Tencents OpenAI-compatibele voorbeelden gebruiken `hy3-preview` als model-id en ondersteunen standaard tool-aanroepen voor chatvoltooiingen plus `reasoning_effort`.

<Tip>
De model-id is `hy3-preview`. Verwar deze niet met Tencents `HY-3D-*`-modellen, die 3D-generatie-API's zijn en niet het OpenClaw-chatmodel dat door deze provider is geconfigureerd.
</Tip>

## Endpoint overschrijven

OpenClaw gebruikt standaard Tencents Cloud-endpoint `https://tokenhub.tencentmaas.com/v1`. Tencent documenteert ook een internationaal TokenHub-endpoint:

```bash
openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
```

Overschrijf het endpoint alleen wanneer je TokenHub-account of regio dit vereist.

## Opmerkingen

- TokenHub-modelverwijzingen gebruiken `tencent-tokenhub/<modelId>`.
- De gebundelde catalogus bevat momenteel `hy3-preview`.
- De Plugin markeert Hy3 preview als geschikt voor redeneren en geschikt voor streaminggebruik.
- De Plugin wordt geleverd met getrapte Hy3-prijsmetadata, zodat kostenramingen worden ingevuld zonder handmatige prijsoverrides.
- Overschrijf prijs-, context- of endpointmetadata in `models.providers` alleen wanneer dat nodig is.

## Omgevingsopmerking

Als de Gateway als daemon (launchd/systemd) draait, zorg er dan voor dat `TOKENHUB_API_KEY`
beschikbaar is voor dat proces (bijvoorbeeld in `~/.openclaw/.env` of via
`env.shellEnv`).

## Gerelateerde documentatie

- [OpenClaw-configuratie](/nl/gateway/configuration)
- [Modelproviders](/nl/concepts/model-providers)
- [Tencent TokenHub-productpagina](https://cloud.tencent.com/product/tokenhub)
- [Tencent TokenHub-tekstgeneratie](https://cloud.tencent.com/document/product/1823/130079)
- [Tencent TokenHub Cline-configuratie voor Hy3 preview](https://cloud.tencent.com/document/product/1823/130932)
- [Tencent Hy3 preview-modelkaart](https://huggingface.co/tencent/Hy3-preview)
