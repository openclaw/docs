---
read_when:
    - Vous souhaitez utiliser les modèles Tencent Hy avec OpenClaw
    - Vous avez besoin de la configuration de la clé API TokenHub
summary: Configuration de Tencent Cloud TokenHub
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-23T07:10:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90fce0d5957b261439cacd2b4df2362ed69511cb047af6a76ccaf54004806041
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

Tencent Cloud est fourni comme **plugin fournisseur intégré** dans OpenClaw. Il donne accès aux modèles Tencent Hy via le point de terminaison TokenHub (`tencent-tokenhub`).

Le fournisseur utilise une API compatible OpenAI.

## Démarrage rapide

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## Exemple non interactif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Fournisseurs et points de terminaison

| Fournisseur        | Point de terminaison          | Cas d’usage             |
| ------------------ | ----------------------------- | ----------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Hy via Tencent TokenHub |

## Modèles disponibles

### tencent-tokenhub

- **hy3-preview** — aperçu Hy3 (contexte 256K, raisonnement, par défaut)

## Remarques

- Les références de modèle TokenHub utilisent `tencent-tokenhub/<modelId>`.
- Le plugin intègre des métadonnées de tarification Hy3 par paliers, de sorte que les estimations de coût sont renseignées sans surcharge manuelle de tarification.
- Remplacez la tarification et les métadonnées de contexte dans `models.providers` si nécessaire.

## Remarque sur l’environnement

Si le Gateway s’exécute comme daemon (launchd/systemd), assurez-vous que `TOKENHUB_API_KEY`
est disponible pour ce processus (par exemple dans `~/.openclaw/.env` ou via
`env.shellEnv`).

## Documentation associée

- [Configuration OpenClaw](/fr/gateway/configuration)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
