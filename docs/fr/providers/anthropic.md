---
read_when:
    - Vous voulez utiliser les modèles Anthropic dans OpenClaw
summary: Utiliser Anthropic Claude via des clés API ou la CLI Claude dans OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-04T15:15:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e6fd143b85bb448f65d5d1b35ce465cce7c6f41987b39b9665910cf71761032
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic développe la famille de modèles **Claude**. OpenClaw prend en charge deux méthodes d’authentification :

- **Clé API** — accès direct à l’API Anthropic avec facturation à l’usage (modèles `anthropic/*`)
- **Claude CLI** — réutilisation d’une connexion Claude Code existante sur le même hôte

<Warning>
Le backend Claude CLI d’OpenClaw exécute le Claude Code CLI installé en
mode d’impression non interactif. La documentation actuelle de Claude Code
d’Anthropic décrit `claude -p` comme une utilisation Agent SDK/programmatique.
La mise à jour de support d’Anthropic du 15 juin 2026 a suspendu le changement
de facturation Agent SDK annoncé. Pour l’instant, Anthropic indique que
l’utilisation de Claude Agent SDK, de `claude -p` et des applications tierces
continue de consommer les limites d’utilisation d’un abonnement. Le crédit
mensuel Agent SDK précédemment annoncé n’est pas disponible pendant qu’Anthropic
révise ce plan.

Claude Code interactif continue de consommer les limites du plan Claude connecté.
L’authentification par clé API reste une facturation API directe à l’usage. Pour
les hôtes Gateway de longue durée, l’automatisation partagée et des dépenses de
production prévisibles, utilisez une clé API Anthropic.

Consultez les articles de support actuels d’Anthropic avant de vous appuyer sur
le comportement de facturation par abonnement :

- [Référence du Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Utiliser le Claude Agent SDK avec votre plan Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Utiliser Claude Code avec votre plan Pro ou Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Utiliser Claude Code avec votre plan Team ou Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
- [Gérer les coûts de Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Premiers pas

<Tabs>
  <Tab title="Clé API">
    **Idéal pour :** l’accès API standard et la facturation à l’usage.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez une clé API dans l’[Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Ou transmettez directement la clé :

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Exemple de configuration

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Idéal pour :** réutiliser une connexion Claude CLI existante sans clé API distincte.

    <Steps>
      <Step title="Vérifier que Claude CLI est installé et connecté">
        Vérifiez avec :

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw détecte et réutilise les identifiants Claude CLI existants.
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Les détails de configuration et d’exécution pour le backend Claude CLI se trouvent dans [Backends CLI](/fr/gateway/cli-backends).
    </Note>

    <Warning>
    La réutilisation de Claude CLI suppose que le processus OpenClaw s’exécute
    sur le même hôte que la connexion Claude CLI. Les installations Docker
    peuvent conserver un répertoire personnel de conteneur et s’y connecter à
    Claude Code ; consultez
    [Backend Claude CLI dans Docker](/fr/install/docker#claude-cli-backend-in-docker).
    Les autres installations de conteneurs, comme [Podman](/fr/install/podman), ne
    montent pas le `~/.claude` de l’hôte dans la configuration ou l’exécution ;
    utilisez-y une clé API Anthropic, ou choisissez un fournisseur avec OAuth
    géré par OpenClaw, comme
    [OpenAI Codex](/fr/providers/openai).
    </Warning>

    ### Exemple de configuration

    Préférez la référence de modèle Anthropic canonique avec une substitution d’exécution CLI :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Les références de modèle historiques `claude-cli/claude-opus-4-7` fonctionnent
    encore pour compatibilité, mais les nouvelles configurations doivent garder
    la sélection fournisseur/modèle sous la forme `anthropic/*` et placer le
    backend d’exécution dans la politique d’exécution fournisseur/modèle.

    ### Facturation et `claude -p`

    OpenClaw utilise le chemin non interactif `claude -p` de Claude Code pour les
    exécutions Claude CLI. Anthropic traite actuellement ce chemin comme une
    utilisation Agent SDK/programmatique :

    - La mise à jour de support d’Anthropic du 15 juin 2026 a suspendu le plan
      de crédit Agent SDK distinct précédemment annoncé.
    - Pour l’instant, l’utilisation de Claude Agent SDK, de `claude -p` et
      d’applications tierces avec un plan d’abonnement continue de consommer les
      limites d’utilisation de l’abonnement connecté.
    - Le crédit mensuel Agent SDK précédemment annoncé n’est pas disponible
      pendant qu’Anthropic révise ce plan.
    - Les connexions Console/clé API utilisent la facturation API à l’usage et
      ne reçoivent pas le crédit Agent SDK d’abonnement.

    Consultez l’[article sur le plan Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    d’Anthropic pour l’avis de suspension, ainsi que les articles sur les plans Claude Code pour le
    comportement des abonnements
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    et
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic peut modifier le comportement de facturation et de limitation de
    débit de Claude Code sans publication d’OpenClaw. Consultez `claude auth status`, `/status` et
    la documentation liée d’Anthropic lorsque la prévisibilité de la facturation compte.

    <Tip>
    Pour l’automatisation de production partagée, utilisez une clé API Anthropic
    plutôt que Claude CLI. OpenClaw prend également en charge des options de
    type abonnement avec
    [OpenAI Codex](/fr/providers/openai), [Qwen Cloud](/fr/providers/qwen),
    [MiniMax](/fr/providers/minimax) et [Z.AI / GLM](/fr/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Valeurs par défaut de raisonnement (Claude Fable 5, 4.8 et 4.6)

`anthropic/claude-fable-5` utilise toujours le raisonnement adaptatif et a `high`
comme effort par défaut. Comme Anthropic ne permet pas de désactiver le
raisonnement pour ce modèle, `/think off` et `/think minimal` utilisent l’effort
`low`. OpenClaw omet également les valeurs de température personnalisées pour
les requêtes Fable 5.

Claude Opus 4.8 garde le raisonnement désactivé par défaut dans OpenClaw. Lorsque vous activez explicitement le raisonnement adaptatif avec `/think high|xhigh|max`, OpenClaw envoie les valeurs d’effort Opus 4.8 d’Anthropic ; les modèles Claude 4.6 utilisent `adaptive` par défaut.

Remplacez par message avec `/think:<level>` ou dans les paramètres de modèle :

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
Documentation Anthropic connexe :
- [Raisonnement adaptatif](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Raisonnement étendu](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Repli en cas de refus de sécurité (Claude Fable 5)

<Warning>
Utiliser Claude Fable 5 implique aussi d’utiliser Claude Opus 4.8. Fable 5 est
fourni avec des classificateurs de sécurité qui peuvent refuser une requête, et
la récupération sanctionnée par Anthropic consiste à faire traiter ce tour par
`claude-opus-4-8`. OpenClaw active cela automatiquement pour les requêtes
directes par clé API ; certains tours Fable reçoivent donc une réponse et sont
facturés comme Claude Opus 4.8. Si votre politique ou votre budget ne peut pas
accepter les tours traités par Opus, ne sélectionnez pas `anthropic/claude-fable-5`.
</Warning>

### Pourquoi cela existe

Les classificateurs Fable 5 renvoient `stop_reason: "refusal"` pour les requêtes
dans des domaines restreints, et produisent aussi des faux positifs sur du
travail adjacent bénin (outillage de sécurité, sciences de la vie, ou même
demander au modèle de reproduire son raisonnement brut). Sans repli, le tour
échoue avec une erreur alors qu’un autre modèle Claude pourrait le traiter sans
problème — le propre message de refus d’Anthropic demande aux intégrateurs API
de configurer un modèle de repli.

### Fonctionnement

1. Pour chaque requête directe par clé API vers `anthropic/claude-fable-5`, OpenClaw
   envoie l’activation du repli côté serveur d’Anthropic : l’en-tête bêta
   `server-side-fallback-2026-06-01` plus
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 est la seule
   cible de repli autorisée par Anthropic pour Fable 5.
2. Seul un refus par classificateur de sécurité déclenche le repli. Les limites
   de débit, les surcharges et les erreurs serveur se comportent exactement
   comme avant et passent par le [basculement de modèle](/fr/concepts/model-failover)
   normal d’OpenClaw.
3. Le sauvetage se produit dans le même appel. Un refus avant toute sortie est
   invisible en dehors de la latence ; toute la réponse provient d’Opus 4.8. En
   cas de refus au milieu du flux, le texte partiel est conservé comme préfixe à
   partir duquel le modèle de repli continue, tandis que le raisonnement et les
   appels d’outils du modèle refusé sont supprimés conformément aux règles de
   relecture d’Anthropic (ils ne doivent pas être renvoyés ni exécutés).
4. Si Claude Opus 4.8 refuse également, le tour expose le refus comme une
   erreur, exactement comme avant cette fonctionnalité.

Le repli se produit au niveau de l’API Anthropic ; `claude-opus-4-8` n’a donc pas
besoin de figurer dans votre liste de modèles configurée ni dans votre chaîne de
repli — une clé API compatible Fable peut toujours servir Opus.

### Observabilité et facturation

- Un tour servi par repli enregistre un diagnostic `provider_fallback` sur le
  message de l’assistant indiquant `fromModel` et `toModel`, et le
  `responseModel` du message indique `claude-opus-4-8`.
- Anthropic facture par tentative : un refus avant sortie est gratuit, et le
  sauvetage est facturé aux tarifs de Claude Opus 4.8 (actuellement la moitié
  des tarifs de Fable 5). L’estimation du coût par tour d’OpenClaw valorise les
  tours servis par repli aux tarifs Opus pour correspondre.
- Un refus au milieu du flux facture en plus le partiel Fable déjà diffusé côté
  Anthropic ; cette portion est indiquée dans l’utilisation par tentative de
  l’API, mais n’est pas intégrée à l’estimation par tour d’OpenClaw.

### Portée

S’applique à `anthropic/claude-fable-5` avec authentification par clé API auprès de
`api.anthropic.com`. Les requêtes OAuth (réutilisation d’abonnement Claude CLI),
URL de base proxy, Bedrock, Vertex et Foundry restent inchangées et continuent
d’exposer les refus comme des erreurs dans ces cas.

Vérifié en direct : une invite bénigne demandant à Fable 5 de reproduire sa chaîne
de pensée brute est refusée avec `category: "reasoning_extraction"` lorsqu’elle
est envoyée sans replis, et la même invite via OpenClaw renvoie une réponse
normale servie par Opus avec le diagnostic `provider_fallback` attaché.

Consultez le [guide des refus et du repli](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
d’Anthropic pour le comportement sous-jacent.

## Mise en cache des invites

OpenClaw prend en charge la fonctionnalité de mise en cache des invites d’Anthropic pour l’authentification par clé API.

| Valeur              | Durée du cache | Description                                           |
| ------------------- | -------------- | ----------------------------------------------------- |
| `"short"` (par défaut) | 5 minutes      | Appliqué automatiquement pour l’authentification par clé API |
| `"long"`            | 1 heure        | Cache étendu                                         |
| `"none"`            | Pas de mise en cache | Désactiver la mise en cache des invites              |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Substitutions du cache par agent">
    Utilisez les paramètres au niveau du modèle comme base, puis remplacez des agents spécifiques via `agents.list[].params` :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Ordre de fusion de la configuration :

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (`id` correspondant, remplace par clé)

    Cela permet à un agent de conserver un cache de longue durée tandis qu’un autre agent utilisant le même modèle désactive la mise en cache pour le trafic en rafales ou peu réutilisé.

  </Accordion>

  <Accordion title="Notes sur Bedrock Claude">
    - Les modèles Anthropic Claude sur Bedrock (`amazon-bedrock/*anthropic.claude*`) acceptent le transfert direct de `cacheRetention` lorsqu’il est configuré.
    - Les modèles Bedrock non Anthropic sont forcés à `cacheRetention: "none"` à l’exécution.
    - Les valeurs par défaut intelligentes avec clé API définissent aussi `cacheRetention: "short"` pour les refs Claude sur Bedrock lorsqu’aucune valeur explicite n’est définie.

  </Accordion>
</AccordionGroup>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Mode rapide">
    Le bouton partagé `/fast` d’OpenClaw prend en charge le trafic Anthropic direct (clé API et OAuth vers `api.anthropic.com`).

    | Commande | Correspond à |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Injecté uniquement pour les requêtes directes vers `api.anthropic.com`. Les routes proxy laissent `service_tier` inchangé.
    - Les paramètres explicites `serviceTier` ou `service_tier` remplacent `/fast` lorsque les deux sont définis.
    - Sur les comptes sans capacité Priority Tier, `service_tier: "auto"` peut se résoudre en `standard`.

    </Note>

  </Accordion>

  <Accordion title="Compréhension des médias (image et PDF)">
    Le Plugin Anthropic intégré enregistre la compréhension des images et des PDF. OpenClaw
    résout automatiquement les capacités média à partir de l’authentification Anthropic configurée — aucune
    configuration supplémentaire n’est nécessaire.

    | Propriété       | Valeur                |
    | --------------- | --------------------- |
    | Modèle par défaut | `claude-opus-4-8`     |
    | Entrée prise en charge | Images, documents PDF |

    Lorsqu’une image ou un PDF est joint à une conversation, OpenClaw l’achemine automatiquement
    via le fournisseur de compréhension média Anthropic.

  </Accordion>

  <Accordion title="Fenêtre de contexte 1M">
    La fenêtre de contexte 1M d’Anthropic est disponible sur les modèles Claude 4.x compatibles GA,
    comme Opus 4.8, Opus 4.7, Opus 4.6 et Sonnet 4.6. OpenClaw dimensionne automatiquement ces modèles à
    1M :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Les anciennes configurations peuvent conserver `params.context1m: true`, mais OpenClaw n’envoie plus
    l’en-tête bêta retiré `context-1m-2025-08-07`. Les anciennes entrées de configuration `anthropicBeta`
    avec cette valeur sont ignorées lors de la résolution des en-têtes de requête, et
    les anciens modèles Claude non pris en charge conservent leur fenêtre de contexte normale.

    `params.context1m: true` s’applique également au backend Claude CLI
    (`claude-cli/*`) pour les modèles Opus et Sonnet éligibles compatibles GA, en préservant
    la fenêtre de contexte d’exécution pour ces sessions CLI afin qu’elle corresponde au
    comportement de l’API directe.

    <Warning>
    Nécessite l’accès au contexte long sur votre identifiant Anthropic. L’authentification par jeton OAuth/abonnement conserve ses en-têtes bêta Anthropic requis, mais OpenClaw supprime l’en-tête bêta 1M retiré s’il reste dans une ancienne configuration.
    </Warning>

  </Accordion>

  <Accordion title="Contexte 1M de Claude Opus 4.8">
    `anthropic/claude-opus-4-8` et sa variante `claude-cli` disposent d’une fenêtre de contexte
    1M par défaut — aucun `params.context1m: true` n’est nécessaire.
  </Accordion>
</AccordionGroup>

## Dépannage

<AccordionGroup>
  <Accordion title="Erreurs 401 / jeton soudainement invalide">
    L’authentification par jeton Anthropic expire et peut être révoquée. Pour les nouvelles configurations, utilisez plutôt une clé API Anthropic.
  </Accordion>

  <Accordion title='Aucune clé API trouvée pour le fournisseur "anthropic"'>
    L’authentification Anthropic est **propre à chaque agent** — les nouveaux agents n’héritent pas des clés de l’agent principal. Relancez l’onboarding pour cet agent (ou configurez une clé API sur l’hôte Gateway), puis vérifiez avec `openclaw models status`.
  </Accordion>

  <Accordion title='Aucun identifiant trouvé pour le profil "anthropic:default"'>
    Exécutez `openclaw models status` pour voir quel profil d’authentification est actif. Relancez l’onboarding ou configurez une clé API pour ce chemin de profil.
  </Accordion>

  <Accordion title="Aucun profil d’authentification disponible (tous en période de refroidissement)">
    Consultez `openclaw models status --json` pour `auth.unusableProfiles`. Les périodes de refroidissement liées aux limites de débit Anthropic peuvent être propres à un modèle, donc un modèle Anthropic voisin peut encore être utilisable. Ajoutez un autre profil Anthropic ou attendez la fin de la période de refroidissement.
  </Accordion>
</AccordionGroup>

<Note>
Aide supplémentaire : [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Note>

## Connexe

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les refs de modèles et le comportement de basculement.
  </Card>
  <Card title="Backends CLI" href="/fr/gateway/cli-backends" icon="terminal">
    Configuration du backend Claude CLI et détails d’exécution.
  </Card>
  <Card title="Mise en cache des prompts" href="/fr/reference/prompt-caching" icon="database">
    Fonctionnement de la mise en cache des prompts entre les fournisseurs.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d’authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
