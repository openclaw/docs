---
read_when:
    - Vous souhaitez utiliser DeepSeek avec OpenClaw
    - Vous avez besoin de la variable d’environnement de la clé API ou de l’option d’authentification de la CLI
summary: Configuration de DeepSeek (authentification + sélection du modèle)
title: DeepSeek
x-i18n:
    generated_at: "2026-07-12T03:14:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77e074756d593205d7d05f499da93b9bd3c63acdce7092b42fb5562023577925
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) fournit de puissants modèles d’IA avec une API compatible avec OpenAI.

| Propriété    | Valeur                     |
| ------------ | -------------------------- |
| Fournisseur  | `deepseek`                 |
| Authentification | `DEEPSEEK_API_KEY`     |
| API          | Compatible avec OpenAI     |
| URL de base  | `https://api.deepseek.com` |

## Installer le Plugin

Installez le Plugin officiel, puis redémarrez le Gateway :

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## Prise en main

<Steps>
  <Step title="Obtenir votre clé d’API">
    Créez une clé d’API sur [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Exécuter l’intégration initiale">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Vous invite à saisir votre clé d’API et définit `deepseek/deepseek-v4-flash` comme modèle par défaut.

  </Step>
  <Step title="Vérifier que les modèles sont disponibles">
    ```bash
    openclaw models list --provider deepseek
    ```

    Pour consulter le catalogue statique du Plugin sans Gateway en cours d’exécution :

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Configuration non interactive">
    Pour les installations automatisées par script ou sans interface graphique, transmettez directement tous les indicateurs :

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Si le Gateway s’exécute en tant que démon (launchd/systemd), assurez-vous que `DEEPSEEK_API_KEY` est
accessible à ce processus (par exemple dans `~/.openclaw/.env` ou via
`env.shellEnv`).
</Warning>

## Catalogue intégré

| Référence du modèle          | Nom               | Entrée | Contexte  | Sortie maximale | Remarques                                                    |
| ---------------------------- | ----------------- | ------ | --------- | --------------- | ------------------------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | texte  | 1,000,000 | 384,000         | Modèle par défaut ; interface V4 prenant en charge le raisonnement |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | texte  | 1,000,000 | 384,000         | Interface V4 prenant en charge le raisonnement               |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | texte  | 1,000,000 | 384,000         | Nom de compatibilité obsolète de V4 Flash sans raisonnement  |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | texte  | 1,000,000 | 384,000         | Nom de compatibilité obsolète de V4 Flash avec raisonnement  |

<Warning>
DeepSeek retirera `deepseek-chat` et `deepseek-reasoner` le 24 juillet 2026
à 15 h 59 UTC. Ils sont actuellement redirigés vers DeepSeek V4 Flash,
respectivement en mode sans raisonnement et avec raisonnement. Remplacez les
références de modèles configurées par `deepseek/deepseek-v4-flash` ou
`deepseek/deepseek-v4-pro` avant cette échéance.
</Warning>

Les estimations locales des coûts d’OpenClaw suivent les tarifs publiés par DeepSeek
pour les accès avec cache, sans cache et les sorties. DeepSeek peut modifier ces tarifs ;
sa page [Modèles et tarification](https://api-docs.deepseek.com/quick_start/pricing/)
fait autorité pour la facturation.

<Tip>
Les modèles V4 prennent en charge le contrôle `thinking` de DeepSeek. OpenClaw
rejoue également le champ `reasoning_content` de DeepSeek lors des tours suivants afin que
les sessions de raisonnement comportant des appels d’outils puissent se poursuivre.
Utilisez `/think xhigh` ou `/think max` avec les modèles DeepSeek V4 pour demander
la valeur maximale de `reasoning_effort` de DeepSeek ; les deux correspondent à `"max"`.
</Tip>

## Raisonnement et outils

Les sessions de raisonnement DeepSeek V4 exigent que les messages précédents de
l’assistant issus d’un tour avec raisonnement incluent `reasoning_content` dans les
requêtes suivantes. Le Plugin DeepSeek d’OpenClaw renseigne automatiquement ce champ ;
l’utilisation normale d’outils sur plusieurs tours fonctionne donc avec
`deepseek/deepseek-v4-flash` et `deepseek/deepseek-v4-pro`, même lorsque l’historique
provient d’un autre fournisseur compatible avec OpenAI (sans `reasoning_content` natif)
ou d’un simple message de l’assistant. Il n’est pas nécessaire d’utiliser `/new` après
avoir changé de fournisseur en cours de session.

Lorsque le raisonnement est désactivé (y compris avec la sélection **None** dans
l’interface), OpenClaw envoie `thinking: { type: "disabled" }` et retire le champ
`reasoning_content` rejoué de l’historique sortant, afin de maintenir la session sur
le chemin DeepSeek sans raisonnement.

Utilisez `deepseek/deepseek-v4-flash` comme option rapide par défaut. Utilisez
`deepseek/deepseek-v4-pro` pour bénéficier du modèle le plus performant lorsque vous
pouvez accepter un coût ou une latence plus élevés.

## Tests en conditions réelles

Pour exécuter uniquement les vérifications directes des modèles DeepSeek V4 de la suite moderne de tests en conditions réelles des modèles :

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Vérifie que les deux modèles V4 terminent leur exécution et que les tours suivants
avec raisonnement et outils préservent la charge utile rejouée exigée par DeepSeek.

## Exemple de configuration

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Pages connexes

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de la configuration des agents, des modèles et des fournisseurs.
  </Card>
</CardGroup>
