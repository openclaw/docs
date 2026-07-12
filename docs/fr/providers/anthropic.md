---
read_when:
    - Vous souhaitez utiliser les modèles Anthropic dans OpenClaw
    - Vous souhaitez parcourir les sessions Claude CLI ou Claude Desktop sur des ordinateurs appairés
summary: Utilisez Anthropic Claude via des clés API ou la CLI Claude dans OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-12T15:41:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f15c88c33120f64d0c1c64b291380f4b8824c13262ba0b2a57662003cfb26adc
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic développe la famille de modèles **Claude**. OpenClaw prend en charge deux modes d’authentification :

- **Clé API** - accès direct à l’API Anthropic avec facturation à l’usage (modèles `anthropic/*`)
- **Claude CLI** - réutilisation d’une connexion Claude Code existante sur le même hôte

## Suivi de l’utilisation et des coûts

OpenClaw détecte l’identifiant Anthropic disponible et sélectionne l’interface d’utilisation correspondante :

- Les identifiants d’abonnement/de configuration Claude affichent les fenêtres de quota et le budget facultatif d’utilisation supplémentaire.
- `ANTHROPIC_ADMIN_KEY` ou `ANTHROPIC_ADMIN_API_KEY` affiche 30 jours de coûts d’organisation et d’utilisation de l’API Messages déclarés par le fournisseur dans **Usage** de l’interface de contrôle, notamment les dépenses quotidiennes, les totaux de jetons/cache, les principaux modèles et les catégories de coûts.
- Un identifiant `sk-ant-admin...` stocké dans le profil du fournisseur Anthropic est automatiquement détecté comme clé de l’API Admin.

L’historique des coûts de l’API Admin provient de l’[API d’utilisation et de coûts](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) d’Anthropic. Il correspond à la facturation réelle du fournisseur, distincte du coût estimé par OpenClaw à partir des sessions.

<Warning>
Le backend Claude CLI d’OpenClaw exécute la CLI Claude Code installée en mode
d’impression non interactif (`claude -p`). La documentation Claude Code actuelle
d’Anthropic décrit ce mode comme une utilisation programmatique/de l’Agent SDK.
La mise à jour de l’assistance d’Anthropic du 15 juin 2026 a suspendu la
modification annoncée de la facturation séparée de l’Agent SDK : l’utilisation
de Claude Agent SDK, de `claude -p` et des applications tierces continue d’être
déduite des limites d’utilisation de l’abonnement connecté, et le crédit mensuel
Agent SDK précédemment annoncé n’est pas disponible pendant qu’Anthropic révise
ce dispositif.

Claude Code interactif continue d’être déduit des limites de l’offre Claude
connectée. L’authentification par clé API est directement facturée à l’usage et
ne dépend pas de cette offre. Pour les hôtes Gateway de longue durée,
l’automatisation partagée et des dépenses de production prévisibles, utilisez
une clé API Anthropic.

Les articles d’assistance actuels d’Anthropic peuvent modifier ce comportement
sans nouvelle version d’OpenClaw :

- [Référence de la CLI Claude Code](https://code.claude.com/docs/en/cli-usage)
- [Utiliser Claude Agent SDK avec votre offre Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Utiliser Claude Code avec votre offre Pro ou Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Utiliser Claude Code avec votre offre Team ou Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Gérer les coûts de Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Prise en main

<Tabs>
  <Tab title="Clé API">
    **Idéal pour :** l’accès standard à l’API et la facturation à l’usage.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez une clé API dans l’[Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Lancer la configuration initiale">
        ```bash
        openclaw onboard
        # choisir : Clé API Anthropic
        ```

        Vous pouvez également transmettre directement la clé :

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
      <Step title="Lancer la configuration initiale">
        ```bash
        openclaw onboard
        # choisir : Claude CLI
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
    Les détails de configuration et d’exécution du backend Claude CLI figurent dans [Backends CLI](/fr/gateway/cli-backends).
    </Note>

    <Warning>
    La réutilisation de Claude CLI exige que le processus OpenClaw s’exécute sur
    le même hôte que la connexion Claude CLI. Les installations Docker peuvent
    conserver le répertoire personnel d’un conteneur et s’y connecter à Claude
    Code ; consultez
    [Backend Claude CLI dans Docker](/fr/install/docker#claude-cli-backend-in-docker).
    Les autres installations en conteneur, comme [Podman](/fr/install/podman), ne
    montent pas le répertoire `~/.claude` de l’hôte lors de la configuration ou
    de l’exécution ; utilisez-y une clé API Anthropic, ou choisissez un
    fournisseur doté d’un OAuth géré par OpenClaw, comme
    [OpenAI Codex](/fr/providers/openai).
    </Warning>

    ### Exemple de configuration

    Préférez la référence canonique du modèle Anthropic avec une substitution du runtime CLI :

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

    Les anciennes références de modèle `claude-cli/claude-opus-4-7`
    fonctionnent toujours pour assurer la compatibilité, mais les nouvelles
    configurations doivent conserver la sélection du fournisseur/modèle sous
    la forme `anthropic/*` et placer le backend d’exécution dans la politique
    de runtime du fournisseur/modèle.

    ### Facturation et `claude -p`

    OpenClaw utilise le chemin non interactif `claude -p` de Claude Code pour
    les exécutions Claude CLI. Anthropic traite actuellement ce chemin comme
    une utilisation programmatique/de l’Agent SDK :

    - La mise à jour de l’assistance d’Anthropic du 15 juin 2026 a suspendu le
      dispositif de crédit Agent SDK distinct précédemment annoncé.
    - L’utilisation de Claude Agent SDK, de `claude -p` et des applications
      tierces dans le cadre d’une offre avec abonnement continue d’être déduite
      des limites d’utilisation de l’abonnement connecté.
    - Le crédit mensuel Agent SDK précédemment annoncé n’est pas disponible
      pendant qu’Anthropic révise ce dispositif.
    - Les connexions par Console/clé API utilisent la facturation de l’API à
      l’usage et ne bénéficient pas du crédit Agent SDK de l’abonnement.

    Consultez l’[article d’Anthropic sur l’offre Agent SDK
    ](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    pour l’avis de suspension, ainsi que les articles sur les offres Claude Code
    concernant le comportement des abonnements
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    et
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic peut modifier la facturation et le comportement des limites de
    débit de Claude Code sans nouvelle version d’OpenClaw. Consultez
    `claude auth status`, `/status` et la documentation Anthropic liée lorsque
    la prévisibilité de la facturation est importante.

    <Tip>
    Pour une automatisation de production partagée, utilisez une clé API
    Anthropic plutôt que Claude CLI. OpenClaw prend également en charge des
    options de type abonnement proposées par
    [OpenAI Codex](/fr/providers/openai), [Qwen Cloud](/fr/providers/qwen),
    [MiniMax](/fr/providers/minimax) et [Z.AI / GLM](/fr/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Sessions Claude sur plusieurs ordinateurs

Le plugin Anthropic intégré ajoute un groupe **Claude Code** à la barre latérale
habituelle des sessions. Les lignes s’ouvrent dans le volet de discussion
habituel. Il détecte les sessions Claude Code non archivées sur le Gateway et
sur les hôtes Node connectés :

- Les sessions Claude CLI proviennent d’enregistrements d’index de projet
  valides et de fichiers JSONL actuels dont le préfixe borné de métadonnées
  identifie une session `sdk-cli` hors chaîne secondaire sous
  `~/.claude/projects/`.
- Les sessions Claude Desktop utilisent le titre du bureau, l’heure d’activité
  et l’état d’archivage lorsque leurs métadonnées pointent vers le même
  identifiant de session Claude Code.
- Une session limitée à la CLI ne possède aucun indicateur d’archivage ; elle
  reste donc visible tant que sa transcription est présente.

Aucune configuration OpenClaw supplémentaire n’est nécessaire. Le plugin
Anthropic est intégré et activé par défaut ; un Node macOS natif publie les
commandes Claude de session en lecture seule lorsque le répertoire local
`~/.claude/projects/` existe. Approuvez la mise à niveau de l’association du
Node lorsque ces commandes apparaissent pour la première fois.

La barre latérale commence par la page bornée la plus récente de chaque hôte et
s’actualise selon la cadence habituelle de 30 secondes. Utilisez **Charger plus
de sessions** sous un groupe de catalogue pour ajouter la page suivante de
chaque hôte disposant d’un historique supplémentaire ; les lignes ajoutées
restent visibles et sont récupérées à nouveau jusqu’à la même profondeur lors
des actualisations. Les clients du catalogue utilisent
`sessions.catalog.list` ; l’ouverture d’une ligne utilise
`sessions.catalog.read`.

La sélection d’une ligne lit d’abord la page de transcription la plus récente.
**Charger des éléments de transcription plus anciens** suit un curseur d’octets
opaque et lit une autre section bornée du fichier JSONL au lieu de charger
l’intégralité de l’historique. Le contenu normal de l’utilisateur, de
l’assistant, du raisonnement, des appels d’outils et des résultats d’outils est
conservé. Tout élément individuel dépassant le plafond de sécurité du
Node/Gateway est clairement marqué comme tronqué.

Pour une ligne `claude-cli` locale au Gateway, la saisie dans le compositeur
habituel appelle `sessions.catalog.continue`. OpenClaw résout à nouveau
l’enregistrement local du catalogue, crée ou réutilise une session native
verrouillée sur le modèle, importe au maximum 200 éléments visibles ou 512 Kio,
et initialise la liaison Claude CLI. Le premier tour reprend avec
`--fork-session` ; Claude attribue un nouvel identifiant de session à la
bifurcation, de sorte que les tours suivants utilisent la bifurcation et que la
session source reste intacte. Les lignes Claude Desktop et celles des Nodes
associés sont en lecture seule.

<Note>
Les sessions Claude sur les Nodes associés sont en lecture seule. OpenClaw ne
modifie pas les métadonnées de Claude Desktop, n’archive pas les sessions Claude
et ne démarre pas un second exécuteur sur l’ordinateur propriétaire. La page
nécessite une connexion opérateur avec une portée d’écriture, car elle utilise
le transport authentifié `node.invoke`, même si les deux commandes Claude du
Node sont en lecture seule.
</Note>

Consultez [Nodes : sessions et transcriptions Claude](/fr/nodes#claude-sessions-and-transcripts)
pour la commande du Node et la limite de sécurité.

## Paramètres de réflexion par défaut (Claude Sonnet 5, Mythos 5, Fable 5, 4.8 et 4.6)

`anthropic/claude-sonnet-5` utilise par défaut la réflexion adaptative avec un
effort `high`. Utilisez `/think off` pour désactiver la réflexion, ou
`/think xhigh|max` pour les niveaux d’effort natifs supérieurs du modèle.
OpenClaw omet les budgets de réflexion manuels, les paramètres
d’échantillonnage personnalisés, les préremplissages de l’assistant et Priority
Tier pour Sonnet 5, car Anthropic ne prend pas en charge ces fonctionnalités de
requête sur ce modèle.
Le catalogue utilise le tarif de lancement d’Anthropic de `$2/$10` en
entrée/sortie jusqu’au 31 août 2026 ; le tarif standard de `$3/$15` commence le
1er septembre 2026.

`anthropic/claude-fable-5` utilise toujours la réflexion adaptative et applique
par défaut un effort `high`. Anthropic ne permet pas de désactiver la réflexion
pour ce modèle ; `/think off` et `/think minimal` correspondent donc à un effort
`low`. OpenClaw omet également les valeurs de température personnalisées pour
les requêtes Fable 5, car Anthropic rejette toute substitution de température
dans une requête où la réflexion est activée.

`anthropic/claude-mythos-5` est un modèle à accès limité qui applique le même
contrat de réflexion adaptative toujours active. OpenClaw utilise `high` par
défaut, associe `/think off` et `/think minimal` à `low`, et omet les paramètres
d’échantillonnage sélectionnés par l’appelant.
Le catalogue indique sa fenêtre de contexte de 1 000 000 de jetons, sa limite
de sortie de 128 000 jetons, la prise en charge des images en entrée et son
tarif de `$10/$50` en entrée/sortie.

Claude Opus 4.8 conserve la réflexion désactivée par défaut dans OpenClaw.
Lorsque vous activez explicitement la réflexion adaptative avec
`/think high|xhigh|max`, OpenClaw transmet les valeurs d’effort Opus 4.8
d’Anthropic ; les modèles Claude 4.6 (Opus 4.6 et Sonnet 4.6) utilisent
`adaptive` par défaut.

Remplacez ce réglage pour chaque message avec `/think:<level>` ou dans les
paramètres du modèle :

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
Documentation Anthropic associée :
- [Réflexion adaptative](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Réflexion étendue](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Solution de repli en cas de refus de sécurité (Claude Fable 5)

<Warning>
Utiliser Claude Fable 5 signifie également utiliser Claude Opus 4.8. Fable 5 intègre
des classificateurs de sécurité susceptibles de refuser une requête, et la procédure de
récupération approuvée par Anthropic consiste à confier ce tour à `claude-opus-4-8`.
OpenClaw active automatiquement cette option pour les requêtes directes avec clé API ;
certains tours Fable reçoivent donc une réponse de Claude Opus 4.8 et sont facturés
comme tels. Si votre politique ou votre budget ne permet pas les tours traités
par Opus, ne sélectionnez pas `anthropic/claude-fable-5`.
</Warning>

### Pourquoi cette fonctionnalité existe

Les classificateurs de Fable 5 renvoient `stop_reason: "refusal"` pour les requêtes
relevant de domaines restreints, et produisent également de faux positifs pour des
travaux bénins mais proches de ces domaines (outils de sécurité, sciences de la vie,
ou même demande au modèle de reproduire son raisonnement brut). Sans modèle de
secours, le tour se termine par une erreur, alors qu'un autre modèle Claude pourrait
parfaitement le traiter ; le message de refus d'Anthropic lui-même indique aux
intégrateurs d'API de configurer un modèle de secours.

### Fonctionnement

1. Pour chaque requête directe avec clé API vers `anthropic/claude-fable-5`, OpenClaw
   envoie l'activation du mécanisme de secours côté serveur d'Anthropic : l'en-tête bêta
   `server-side-fallback-2026-06-01` ainsi que
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 est la seule
   cible de secours qu'Anthropic autorise pour Fable 5.
2. Seul un refus du classificateur de sécurité déclenche le modèle de secours. Les limites
   de débit, les surcharges et les erreurs de serveur se comportent exactement comme
   auparavant et passent par le [basculement de modèle](/fr/concepts/model-failover)
   normal d'OpenClaw.
3. La récupération se produit au sein du même appel. Un refus avant toute sortie est
   invisible, hormis la latence ; l'intégralité de la réponse provient d'Opus 4.8. En cas
   de refus en cours de diffusion, le texte partiel est conservé comme préfixe à partir
   duquel le modèle de secours poursuit la réponse, tandis que le raisonnement et les
   appels d'outils du modèle ayant refusé sont éliminés conformément aux règles de
   relecture d'Anthropic (ils ne doivent être ni renvoyés ni exécutés).
4. Si Claude Opus 4.8 refuse également, le refus est exposé comme une erreur,
   exactement comme avant cette fonctionnalité.

Le mécanisme de secours intervient au niveau de l'API Anthropic ; `claude-opus-4-8`
n'a donc pas besoin de figurer dans votre liste de modèles configurée ni dans votre
chaîne de secours : une clé API compatible avec Fable peut toujours servir Opus.

### Observabilité et facturation

- Un tour traité par le modèle de secours enregistre un diagnostic `provider_fallback`
  sur le message de l'assistant, indiquant `fromModel` et `toModel`, et le champ
  `responseModel` du message indique `claude-opus-4-8`.
- Anthropic facture chaque tentative : un refus avant toute sortie est gratuit, tandis
  que la récupération est facturée aux tarifs de Claude Opus 4.8 (actuellement la
  moitié de ceux de Fable 5). L'estimation du coût par tour d'OpenClaw applique les
  tarifs d'Opus aux tours traités par le modèle de secours afin de rester cohérente.
- Un refus en cours de diffusion entraîne également la facturation, par Anthropic, de
  la partie Fable déjà diffusée ; cette partie figure dans l'utilisation par tentative
  de l'API, mais n'est pas intégrée à l'estimation par tour d'OpenClaw.

### Portée

S'applique à `anthropic/claude-fable-5` avec une authentification par clé API auprès
de `api.anthropic.com`. Les requêtes OAuth (réutilisation d'un abonnement Claude CLI),
les URL de base de proxy, Bedrock, Vertex et Foundry restent inchangées et continuent
d'exposer les refus comme des erreurs.

Vérification en conditions réelles : une invite bénigne demandant à Fable 5 de
reproduire sa chaîne de pensée brute est refusée avec
`category: "reasoning_extraction"` lorsqu'elle est envoyée sans modèle de secours,
tandis que la même invite via OpenClaw renvoie une réponse normale traitée par Opus,
accompagnée du diagnostic `provider_fallback`.

Consultez le [guide d'Anthropic sur les refus et les modèles de secours
](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
pour connaître le comportement sous-jacent.

## Mise en cache des invites

OpenClaw prend en charge la fonctionnalité de mise en cache des invites d'Anthropic
pour l'authentification par clé API.

| Valeur                | Durée du cache | Description                                              |
| --------------------- | -------------- | -------------------------------------------------------- |
| `"short"` (par défaut) | 5 minutes      | Appliquée automatiquement à l'authentification par clé API |
| `"long"`              | 1 heure        | Cache étendu                                             |
| `"none"`              | Aucun cache    | Désactive la mise en cache des invites                   |

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
  <Accordion title="Remplacements du cache par agent">
    Utilisez les paramètres au niveau du modèle comme base, puis remplacez-les pour certains agents via `agents.list[].params` :

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
    2. `agents.list[].params` (`id` correspondant, remplacement par clé)

    Cela permet à un agent de conserver un cache de longue durée, tandis qu'un autre agent utilisant le même modèle désactive la mise en cache pour un trafic en rafales ou à faible réutilisation.

  </Accordion>

  <Accordion title="Remarques sur Claude avec Bedrock">
    - Les modèles Anthropic Claude sur Bedrock (`amazon-bedrock/*anthropic.claude*`) acceptent la transmission de `cacheRetention` lorsqu'elle est configurée.
    - Les modèles Bedrock autres que ceux d'Anthropic sont forcés à utiliser `cacheRetention: "none"` lors de l'exécution.
    - Les valeurs par défaut intelligentes pour les clés API initialisent également `cacheRetention: "short"` pour les références Claude sur Bedrock lorsqu'aucune valeur explicite n'est définie.

  </Accordion>
</AccordionGroup>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Mode rapide">
    Le commutateur partagé `/fast` d'OpenClaw définit le champ `service_tier` d'Anthropic pour le trafic direct avec clé API vers `api.anthropic.com`.

    | Commande | Correspond à |
    |----------|--------------|
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
    - S'applique uniquement aux requêtes directes vers `api.anthropic.com` effectuées avec une clé API. Les requêtes OAuth ou avec jeton d'abonnement et les routes de proxy ne reçoivent jamais de champ `service_tier`.
    - Les paramètres explicites `serviceTier` ou `service_tier` remplacent `/fast` lorsque les deux sont définis.
    - Pour les comptes sans capacité Priority Tier, `service_tier: "auto"` peut être résolu en `standard`.

    </Note>

  </Accordion>

  <Accordion title="Compréhension des médias (images et PDF)">
    Le Plugin Anthropic fourni enregistre la compréhension des images et des PDF.
    OpenClaw détermine automatiquement les capacités multimédias à partir de
    l'authentification Anthropic configurée ; aucune configuration supplémentaire
    n'est nécessaire.

    | Propriété          | Valeur                |
    | ------------------ | --------------------- |
    | Modèle par défaut  | `claude-opus-4-8`     |
    | Entrées prises en charge | Images, documents PDF |

    Lorsqu'une image ou un PDF est joint à une conversation, OpenClaw l'achemine
    automatiquement par le fournisseur de compréhension multimédia d'Anthropic.

  </Accordion>

  <Accordion title="Fenêtre de contexte de 1M">
    Claude Sonnet 5, Mythos 5 et Fable 5 disposent d'une fenêtre d'entrée exacte de
    1,000,000 jetons et prennent en charge jusqu'à 128,000 jetons de sortie. La fenêtre
    de contexte de 1M d'Anthropic est également en disponibilité générale sur les modèles
    Claude 4.x avec réflexion adaptative : Opus 4.8, Opus 4.7, Opus 4.6 et Sonnet 4.6.
    OpenClaw dimensionne automatiquement ces modèles, sans nécessiter
    `params.context1m` :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-5": {},
            "anthropic/claude-mythos-5": {},
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Les anciennes configurations peuvent conserver `params.context1m: true` ; il
    s'agit d'une opération sans effet et sans conséquence pour ces modèles, et OpenClaw
    n'envoie plus l'en-tête bêta retiré `context-1m-2025-08-07`, quelle que soit la
    configuration. Les anciennes entrées de configuration `anthropicBeta` ayant cette
    valeur sont supprimées lors de la résolution des en-têtes de requête, tandis que
    les anciens modèles Claude non pris en charge conservent leur fenêtre de contexte
    normale.

    `params.context1m: true` se comporte de la même manière pour le backend Claude CLI
    (`claude-cli/*`) : les modèles Opus et Sonnet admissibles et compatibles avec la
    disponibilité générale bénéficient déjà automatiquement de la fenêtre de 1M ; ce
    paramètre y est donc également facultatif.

    <Warning>
    Nécessite l'accès au contexte long pour vos identifiants Anthropic. L'authentification OAuth ou par jeton d'abonnement conserve les en-têtes bêta Anthropic requis, mais OpenClaw supprime l'ancien en-tête bêta 1M s'il subsiste dans une ancienne configuration.
    </Warning>

  </Accordion>

  <Accordion title="Contexte de 1M de Claude Opus 4.8">
    `anthropic/claude-opus-4-8` et sa variante `claude-cli` disposent par défaut d'une
    fenêtre de contexte de 1M ; `params.context1m: true` n'est pas nécessaire.
  </Accordion>
</AccordionGroup>

## Résolution des problèmes

<AccordionGroup>
  <Accordion title="Erreurs 401 / jeton soudainement invalide">
    L'authentification par jeton Anthropic expire et peut être révoquée. Pour les nouvelles configurations, utilisez plutôt une clé API Anthropic.
  </Accordion>

  <Accordion title='Aucune clé API trouvée pour le fournisseur "anthropic"'>
    L'authentification Anthropic est **propre à chaque agent** ; les nouveaux agents n'héritent pas des clés de l'agent principal. Relancez l'intégration pour cet agent (ou configurez une clé API sur l'hôte du Gateway), puis vérifiez avec `openclaw models status`.
  </Accordion>

  <Accordion title='Aucun identifiant trouvé pour le profil "anthropic:default"'>
    Exécutez `openclaw models status` pour voir quel profil d'authentification est actif. Relancez l'intégration ou configurez une clé API pour le chemin de ce profil.
  </Accordion>

  <Accordion title="Aucun profil d'authentification disponible (tous en période de récupération)">
    Consultez `auth.unusableProfiles` dans la sortie de `openclaw models status --json`. Les périodes de récupération dues aux limites de débit d'Anthropic peuvent être propres à un modèle ; un autre modèle Anthropic peut donc rester utilisable. Ajoutez un autre profil Anthropic ou attendez la fin de la période de récupération.
  </Accordion>
</AccordionGroup>

<Note>
Aide supplémentaire : [Résolution des problèmes](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Note>

## Ressources associées

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Backends CLI" href="/fr/gateway/cli-backends" icon="terminal">
    Configuration du backend Claude CLI et détails d'exécution.
  </Card>
  <Card title="Mise en cache des invites" href="/fr/reference/prompt-caching" icon="database">
    Fonctionnement de la mise en cache des invites entre les fournisseurs.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails de l'authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
