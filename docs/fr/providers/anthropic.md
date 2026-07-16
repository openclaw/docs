---
read_when:
    - Vous souhaitez utiliser les modèles Anthropic dans OpenClaw
    - Vous souhaitez parcourir les sessions Claude CLI ou Claude Desktop sur des ordinateurs appairés
summary: Utilisez Anthropic Claude via des clés API ou la CLI Claude dans OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-16T13:40:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a61b4585092586727df48f7b809be73d80b0a9f1400294e76aea1b48313a216
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic développe la famille de modèles **Claude**. OpenClaw prend en charge deux méthodes d'authentification :

- **Clé API** - accès direct à l'API Anthropic avec facturation à l'usage (modèles `anthropic/*`)
- **CLI Claude** - réutilisation d'une connexion Claude Code existante sur le même hôte

## Suivi de l'utilisation et des coûts

OpenClaw détecte l'identifiant Anthropic disponible et sélectionne l'interface de suivi correspondante :

- Les identifiants d'abonnement ou de configuration Claude affichent les périodes de quota et le budget facultatif d'utilisation supplémentaire.
- `ANTHROPIC_ADMIN_KEY` ou `ANTHROPIC_ADMIN_API_KEY` affiche 30 jours de coûts d'organisation et d'utilisation de l'API Messages déclarés par le fournisseur dans **Usage** de l'interface de contrôle, notamment les dépenses quotidiennes, les totaux de tokens et de cache, les principaux modèles et les catégories de coûts.
- Un identifiant `sk-ant-admin...` stocké dans le profil du fournisseur Anthropic est automatiquement détecté comme clé d'API Admin.

L'historique des coûts de l'API Admin provient de l'[API Usage and Cost](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) d'Anthropic. Il correspond à la facturation réelle du fournisseur, distincte du coût estimé par OpenClaw à partir des sessions.

<Warning>
Le backend CLI Claude d'OpenClaw exécute la CLI Claude Code installée en mode
d'impression non interactif (`claude -p`). La documentation actuelle de Claude Code d'Anthropic
décrit ce mode comme une utilisation programmatique ou via l'Agent SDK. La mise à jour de l'assistance
d'Anthropic du 15 juin 2026 a suspendu la modification annoncée concernant la facturation distincte de l'Agent SDK :
l'Agent SDK Claude, `claude -p` et l'utilisation d'applications tierces sont toujours décomptés
des limites d'utilisation de l'abonnement connecté, et le crédit mensuel de l'Agent SDK
précédemment annoncé n'est pas disponible pendant qu'Anthropic révise ce projet.

Claude Code interactif est toujours décompté des limites de l'offre Claude connectée.
L'authentification par clé API utilise une facturation directe à l'usage et ne dépend pas de cette offre.
Pour les hôtes Gateway de longue durée, l'automatisation partagée et des dépenses de production
prévisibles, utilisez une clé API Anthropic.

Les articles d'assistance actuels d'Anthropic peuvent modifier ce comportement sans
nouvelle version d'OpenClaw :

- [Référence de la CLI Claude Code](https://code.claude.com/docs/en/cli-usage)
- [Utiliser l'Agent SDK Claude avec votre offre Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Utiliser Claude Code avec votre offre Pro ou Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Utiliser Claude Code avec votre offre Team ou Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Gérer les coûts de Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Prise en main

<Tabs>
  <Tab title="Clé API">
    **Idéal pour :** l'accès standard à l'API et la facturation à l'usage.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez une clé API dans la [console Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Exécuter l'intégration">
        ```bash
        openclaw onboard
        # choisir : clé API Anthropic
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

  <Tab title="CLI Claude">
    **Idéal pour :** réutiliser une connexion à la CLI Claude existante sans clé API distincte.

    <Steps>
      <Step title="Vérifier que la CLI Claude est installée et connectée">
        Vérifiez avec :

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Exécuter l'intégration">
        ```bash
        openclaw onboard
        # choisir : CLI Claude
        ```

        OpenClaw détecte et réutilise les identifiants existants de la CLI Claude.
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Les détails de configuration et d'exécution du backend CLI Claude se trouvent dans [Backends CLI](/fr/gateway/cli-backends).
    </Note>

    <Warning>
    La réutilisation de la CLI Claude exige que le processus OpenClaw s'exécute sur le même hôte que la
    connexion à la CLI Claude. Les installations Docker peuvent conserver le répertoire personnel d'un conteneur et s'y connecter à
    Claude Code ; consultez
    [Backend CLI Claude dans Docker](/fr/install/docker#claude-cli-backend-in-docker).
    Les autres installations en conteneur, telles que [Podman](/fr/install/podman), ne montent pas le
    `~/.claude` de l'hôte lors de la configuration ou de l'exécution ; utilisez-y une clé API Anthropic, ou choisissez
    un fournisseur avec OAuth géré par OpenClaw, tel que
    [OpenAI Codex](/fr/providers/openai).
    </Warning>

    ### Obtenir un token de configuration

    Exécutez `claude setup-token` sur n'importe quelle machine où Claude Code est installé. La commande affiche
    un token de longue durée commençant par `sk-ant-oat01-`.

    Pendant l'intégration, collez le token dans l'application macOS en choisissant
    **Anthropic setup-token** sous **Connect with an API key or token**, ou utilisez :

    ```bash
    openclaw models auth login --provider anthropic --method setup-token
    ```

    ### Exemple de configuration

    Privilégiez la référence canonique du modèle Anthropic avec une substitution du runtime CLI :

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

    Les anciennes références de modèle `claude-cli/claude-opus-4-7` fonctionnent encore par
    compatibilité, mais les nouvelles configurations doivent conserver la sélection du fournisseur et du modèle sous la forme
    `anthropic/*` et placer le backend d'exécution dans la politique de runtime du fournisseur ou du modèle.

    ### Facturation et `claude -p`

    OpenClaw utilise le chemin non interactif `claude -p` de Claude Code pour les exécutions de la CLI Claude.
    Anthropic considère actuellement ce chemin comme une utilisation programmatique ou via l'Agent SDK :

    - La mise à jour de l'assistance d'Anthropic du 15 juin 2026 a suspendu le projet de crédit
      distinct de l'Agent SDK précédemment annoncé.
    - L'utilisation de l'Agent SDK Claude avec une offre d'abonnement, de `claude -p` et d'applications tierces
      reste décomptée des limites d'utilisation de l'abonnement connecté.
    - Le crédit mensuel de l'Agent SDK précédemment annoncé n'est pas disponible pendant
      qu'Anthropic révise ce projet.
    - Les connexions par console ou clé API utilisent la facturation de l'API à l'usage et ne bénéficient pas
      du crédit Agent SDK de l'abonnement.

    Consultez l'[article sur l'offre Agent SDK
    d'Anthropic](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    pour l'avis de suspension, ainsi que les articles sur les offres Claude Code concernant le comportement des abonnements
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    et
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic peut modifier la facturation et le comportement des limites de débit de Claude Code sans
    nouvelle version d'OpenClaw. Consultez `claude auth status`, `/status` et
    la documentation Anthropic référencée lorsque la prévisibilité de la facturation est importante.

    <Tip>
    Pour l'automatisation de production partagée, utilisez une clé API Anthropic plutôt que la
    CLI Claude. OpenClaw prend également en charge des options de type abonnement proposées par
    [OpenAI Codex](/fr/providers/openai), [Qwen Cloud](/fr/providers/qwen),
    [MiniMax](/fr/providers/minimax) et [Z.AI / GLM](/fr/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Sessions Claude sur plusieurs ordinateurs

Le plugin Anthropic intégré ajoute un groupe **Claude Code** à la barre latérale normale des sessions.
Les lignes s'ouvrent dans le volet Chat normal. Il détecte les sessions Claude
Code non archivées sur le Gateway et sur les hôtes Node connectés :

- Les sessions de la CLI Claude proviennent d'enregistrements d'index de projet valides et de fichiers JSONL
  actuels dont le préfixe borné de métadonnées identifie une session `sdk-cli`
  hors chaîne secondaire sous `~/.claude/projects/`.
- Les sessions Claude Desktop utilisent le titre du bureau, l'heure d'activité et
  l'état d'archivage lorsque leurs métadonnées pointent vers le même identifiant de session Claude Code.
- Une session exclusivement CLI ne possède aucun indicateur d'archivage ; elle reste donc visible tant que sa
  transcription est présente.

Aucune configuration OpenClaw supplémentaire n'est nécessaire pour la détection. Le plugin Anthropic
est intégré et activé par défaut ; un Node macOS natif annonce les commandes de session Claude
en lecture seule lorsque le répertoire local `~/.claude/projects/` existe.
Approuvez la mise à niveau de l'appairage du Node lorsque ces commandes apparaissent pour la première fois.

La barre latérale regroupe les lignes selon leur Gateway ou leur hôte Node appairé, commence par la
page bornée la plus récente de chaque hôte et s'actualise selon la cadence normale de 30 secondes.
Utilisez **Charger plus de sessions** sous un groupe de catalogue pour ajouter la page suivante
pour chaque hôte disposant d'un historique supplémentaire ; les lignes ajoutées restent visibles et sont
récupérées à nouveau à la même profondeur lors des actualisations. Les clients du catalogue utilisent
`sessions.catalog.list` ; l'ouverture d'une ligne utilise `sessions.catalog.read`.

La prise de contrôle du terminal résout `claude` depuis le PATH de l'interpréteur de commandes de connexion
de l'utilisateur de l'hôte propriétaire avant le PATH du service ou du démon. Ainsi, les sessions lancées
par l'application restent alignées sur la CLI Claude obtenue par l'opérateur dans un terminal normal.

La sélection d'une ligne lit d'abord la page de transcription la plus récente. **Charger les anciens éléments
de transcription** suit un curseur d'octets opaque et lit une autre section bornée du
fichier JSONL au lieu de charger tout l'historique. Le contenu normal de l'utilisateur, de l'assistant,
du raisonnement, des appels d'outils et des résultats d'outils est préservé. Tout élément
dépassant individuellement le plafond de sécurité du Node ou du Gateway est clairement marqué comme tronqué.

Pour une ligne `claude-cli` locale au Gateway, la saisie dans le composeur normal appelle
`sessions.catalog.continue`. OpenClaw résout à nouveau l'enregistrement local du catalogue,
crée ou réutilise une session native verrouillée sur le modèle, importe au maximum 200 éléments visibles
ou 512 Kio et initialise la liaison à la CLI Claude. Le premier tour reprend avec
`--fork-session` ; Claude attribue un nouvel identifiant de session à la bifurcation, de sorte que les tours suivants utilisent
la bifurcation et que la session source reste intacte.

Un hôte Node sans interface graphique peut également permettre la poursuite de ses lignes de la CLI Claude en activant
le paramètre local au Node ci-dessous et en redémarrant l'hôte Node :

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

Le Node annonce `agent.cli.claude.run.v1` uniquement lorsque le paramètre est activé
et que son exécutable local `claude` est résolu. OpenClaw résout à nouveau l'enregistrement du catalogue
sur ce Node, importe le même historique borné et lie la session adoptée
au Node et au répertoire de travail indiqué par le catalogue. Chaque tour exécute le véritable
processus `claude -p` du Node à l'aide des fichiers Claude et de la connexion de ce Node. La
politique d'approbation d'exécution du Node s'applique toujours ; le Gateway ne peut pas imposer l'activation.

La poursuite sur Node v1 est à usage unique uniquement. Elle omet la configuration MCP de bouclage du Gateway et
les arguments du plugin Skills du Gateway, ne réinitialise pas depuis une transcription du Gateway et
refuse les pièces jointes et les images. Les lignes Claude Desktop restent en lecture seule. Les Nodes
natifs de l'application macOS restent également en lecture seule jusqu'à ce que l'application annonce la commande d'exécution.

<Note>
Les sessions Claude des Nodes appairés restent en lecture seule sauf si le Node sans interface graphique annonce explicitement
`agent.cli.claude.run.v1`. OpenClaw ne modifie jamais les métadonnées de Claude Desktop
et n'archive jamais les sessions Claude. La page nécessite une connexion d'opérateur
avec une portée d'écriture, car elle utilise `node.invoke` authentifié ; la liste et la lecture
restent en lecture seule, même sur un Node où la poursuite est activée.
</Note>

Consultez [Nodes : sessions et transcriptions Claude](/fr/nodes#claude-sessions-and-transcripts)
pour connaître la commande du Node et la limite de sécurité.

## Paramètres de réflexion par défaut (Claude Sonnet 5, Mythos 5, Fable 5, 4.8 et 4.6)

`anthropic/claude-sonnet-5` utilise par défaut la réflexion adaptative avec un effort `high`.
Utilisez `/think off` pour désactiver la réflexion, ou `/think xhigh|max` pour les niveaux
d’effort natifs supérieurs du modèle. OpenClaw omet les budgets de réflexion manuels, les paramètres
d’échantillonnage personnalisés, les préremplissages de l’assistant et Priority Tier pour Sonnet 5, car
Anthropic ne prend pas en charge ces fonctionnalités de requête sur ce modèle.
Le catalogue utilise les tarifs d’entrée/sortie promotionnels `$2/$10` d’Anthropic jusqu’au
31 août 2026 ; les tarifs standard `$3/$15` commencent le 1er septembre 2026.

`anthropic/claude-fable-5` utilise toujours la réflexion adaptative et applique par défaut un effort
`high`. Anthropic ne permet pas de désactiver la réflexion pour ce modèle ; par conséquent,
`/think off` et `/think minimal` correspondent plutôt à un effort `low`. OpenClaw omet également
les valeurs de température personnalisées pour les requêtes Fable 5, car Anthropic rejette
toute substitution de température dans une requête où la réflexion est activée.

`anthropic/claude-mythos-5` est un modèle à accès limité soumis au même contrat de
réflexion adaptative toujours active. OpenClaw utilise par défaut `high`, associe `/think off` et
`/think minimal` à `low`, et omet les paramètres d’échantillonnage sélectionnés par l’appelant.
Le catalogue indique sa fenêtre de contexte de 1 000 000 de tokens, sa limite de sortie
de 128 000 tokens, la prise en charge des images en entrée et ses tarifs d’entrée/sortie `$10/$50`.

La réflexion reste désactivée par défaut pour Claude Opus 4.8 dans OpenClaw. Lorsque vous
activez explicitement la réflexion adaptative avec `/think high|xhigh|max`, OpenClaw envoie
les valeurs d’effort Opus 4.8 d’Anthropic ; les modèles Claude 4.6 (Opus 4.6 et Sonnet 4.6)
utilisent par défaut `adaptive`.

Remplacez ce réglage pour chaque message avec `/think:<level>` ou dans les paramètres du modèle :

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
- [Réflexion approfondie](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Repli en cas de refus de sécurité (Claude Fable 5)

<Warning>
Utiliser Claude Fable 5 implique également d’utiliser Claude Opus 4.8. Fable 5 intègre
des classificateurs de sécurité susceptibles de refuser une requête, et la procédure de
récupération approuvée par Anthropic consiste à faire traiter cette interaction par `claude-opus-4-8`. OpenClaw active
automatiquement cette option pour les requêtes directes utilisant une clé d’API ; certaines interactions Fable
reçoivent donc une réponse de Claude Opus 4.8 et sont facturées comme telles. Si votre politique ou votre budget
ne permet pas les interactions traitées par Opus, ne sélectionnez pas `anthropic/claude-fable-5`.
</Warning>

### Pourquoi ce mécanisme existe

Les classificateurs de Fable 5 renvoient `stop_reason: "refusal"` pour les requêtes appartenant à des
domaines restreints, et produisent également de faux positifs pour des tâches bénignes mais connexes
(outils de sécurité, sciences de la vie, ou même demande au modèle de reproduire son
raisonnement brut). Sans repli, l’interaction se termine par une erreur alors qu’un
autre modèle Claude pourrait la traiter sans difficulté ; le propre message de refus d’Anthropic
demande aux intégrateurs de l’API de configurer un modèle de repli.

### Fonctionnement

1. Pour chaque requête directe avec clé d’API adressée à `anthropic/claude-fable-5`, OpenClaw
   envoie l’activation du repli côté serveur d’Anthropic : l’en-tête bêta
   `server-side-fallback-2026-06-01` ainsi que
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 est la seule
   cible de repli autorisée par Anthropic pour Fable 5.
2. Seul un refus du classificateur de sécurité déclenche le repli. Les limites de débit,
   les surcharges et les erreurs de serveur se comportent exactement comme auparavant et passent par
   le [basculement de modèle](/fr/concepts/model-failover) habituel d’OpenClaw.
3. La récupération s’effectue dans le même appel. Un refus avant toute sortie est
   invisible, hormis la latence ; l’intégralité de la réponse provient d’Opus 4.8. En cas de
   refus en cours de diffusion, le texte partiel est conservé comme préfixe à partir duquel le modèle
   de repli poursuit la réponse, tandis que le raisonnement et les appels d’outils du modèle ayant refusé
   sont supprimés conformément aux règles de réexécution d’Anthropic (ils ne doivent être ni renvoyés ni
   exécutés).
4. Si Claude Opus 4.8 refuse également, l’interaction expose le refus sous forme
   d’erreur, exactement comme avant l’ajout de cette fonctionnalité.

Le repli s’effectue au niveau de l’API Anthropic ; `claude-opus-4-8` n’a donc pas
besoin de figurer dans votre liste de modèles configurés ni dans votre chaîne de repli : une clé d’API
compatible avec Fable peut toujours utiliser Opus.

### Observabilité et facturation

- Une interaction traitée par le modèle de repli enregistre un diagnostic `provider_fallback` dans le
  message de l’assistant, qui nomme `fromModel` et `toModel`, et le champ
  `responseModel` du message indique `claude-opus-4-8`.
- Anthropic facture chaque tentative : un refus avant toute sortie est gratuit, tandis que la récupération
  est facturée aux tarifs de Claude Opus 4.8 (actuellement deux fois moins élevés que ceux de Fable 5). L’estimation
  du coût par interaction d’OpenClaw applique les tarifs d’Opus aux interactions traitées par le modèle de repli afin de correspondre à cette facturation.
- Un refus en cours de diffusion entraîne également la facturation, côté Anthropic, de la partie
  déjà diffusée par Fable ; cette partie figure dans l’utilisation par tentative de l’API,
  mais n’est pas intégrée à l’estimation par interaction d’OpenClaw.

### Portée

S’applique à `anthropic/claude-fable-5` avec une authentification par clé d’API auprès de
`api.anthropic.com`. OAuth (réutilisation de l’abonnement Claude CLI), les URL de base de proxy,
Bedrock, Vertex et les requêtes Foundry restent inchangés et continuent d’exposer
les refus sous forme d’erreurs.

Vérification en conditions réelles : une invite bénigne demandant à Fable 5 de reproduire sa chaîne de
pensée brute est refusée avec `category: "reasoning_extraction"` lorsqu’elle est envoyée sans
repli, tandis que la même invite transmise par OpenClaw renvoie une réponse normale
traitée par Opus avec le diagnostic `provider_fallback` joint.

Consultez le [guide d’Anthropic sur les refus et le
repli](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
pour connaître le comportement sous-jacent.

## Mise en cache des invites

OpenClaw prend en charge la fonctionnalité de mise en cache des invites d’Anthropic pour l’authentification par clé d’API.

| Valeur               | Durée du cache | Description                                      |
| -------------------- | -------------- | ------------------------------------------------ |
| `"short"` (par défaut) | 5 minutes      | Appliqué automatiquement pour l’authentification par clé d’API |
| `"long"`            | 1 heure         | Cache prolongé                                   |
| `"none"`            | Aucune mise en cache | Désactive la mise en cache des invites       |

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
    Utilisez les paramètres au niveau du modèle comme référence, puis remplacez-les pour des agents précis via `agents.list[].params` :

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
    2. `agents.list[].params` (correspondant à `id`, remplace par clé)

    Cela permet à un agent de conserver un cache de longue durée tandis qu’un autre agent utilisant le même modèle désactive la mise en cache pour un trafic en rafales ou faiblement réutilisé.

  </Accordion>

  <Accordion title="Remarques sur Claude avec Bedrock">
    - Les modèles Anthropic Claude sur Bedrock (`amazon-bedrock/*anthropic.claude*`) acceptent la transmission directe de `cacheRetention` lorsqu’elle est configurée.
    - Les modèles Bedrock autres que ceux d’Anthropic sont forcés à `cacheRetention: "none"` lors de l’exécution.
    - Les valeurs par défaut intelligentes des clés d’API initialisent également `cacheRetention: "short"` pour les références Claude sur Bedrock lorsqu’aucune valeur explicite n’est définie.

  </Accordion>
</AccordionGroup>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Mode rapide">
    Le réglage partagé `/fast` d’OpenClaw définit le champ `service_tier` d’Anthropic pour le trafic direct utilisant une clé d’API vers `api.anthropic.com`.

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
    - S’applique uniquement aux requêtes directes `api.anthropic.com` effectuées avec une clé d’API. Les requêtes utilisant OAuth ou un token d’abonnement et les routes de proxy ne reçoivent jamais de champ `service_tier`.
    - Les paramètres explicites `serviceTier` ou `service_tier` remplacent `/fast` lorsque les deux sont définis.
    - Pour les comptes dépourvus de capacité Priority Tier, `service_tier: "auto"` peut être résolu en `standard`.

    </Note>

  </Accordion>

  <Accordion title="Compréhension des médias (images et PDF)">
    Le plugin Anthropic intégré fournit la compréhension des images et des PDF. OpenClaw
    détermine automatiquement les capacités multimédias à partir de l’authentification Anthropic configurée ;
    aucune configuration supplémentaire n’est nécessaire.

    | Propriété        | Valeur                |
    | ---------------- | --------------------- |
    | Modèle par défaut | `claude-opus-4-8`    |
    | Entrées prises en charge | Images, documents PDF |

    Lorsqu’une image ou un PDF est joint à une conversation, OpenClaw l’achemine
    automatiquement via le fournisseur de compréhension des médias Anthropic.

  </Accordion>

  <Accordion title="Fenêtre de contexte de 1M">
    Claude Sonnet 5, Mythos 5 et Fable 5 disposent d’une fenêtre d’entrée exacte de
    1 000 000 de tokens et prennent en charge jusqu’à 128 000 tokens de sortie. La fenêtre
    de contexte de 1M d’Anthropic est également disponible en version générale sur les modèles Claude 4.x
    avec réflexion adaptative : Opus 4.8, Opus 4.7, Opus 4.6 et Sonnet 4.6. OpenClaw dimensionne
    automatiquement ces modèles ; aucun `params.context1m` n’est nécessaire :

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

    Les anciennes configurations peuvent conserver `params.context1m: true` ; il s’agit d’une opération sans effet
    et sans conséquence pour ces modèles, et OpenClaw n’envoie plus l’ancien
    en-tête bêta `context-1m-2025-08-07` dans tous les cas. Les anciennes entrées de configuration `anthropicBeta`
    contenant cette valeur sont supprimées lors de la résolution des en-têtes de requête, tandis que
    les anciens modèles Claude non pris en charge conservent leur fenêtre de contexte normale.

    `params.context1m: true` se comporte de la même manière pour le moteur Claude CLI
    (`claude-cli/*`) : les modèles Opus et Sonnet admissibles et compatibles avec la version générale bénéficient déjà
    automatiquement de la fenêtre de 1M ; le paramètre y est donc également facultatif.

    <Warning>
    Nécessite un accès au contexte long pour vos identifiants Anthropic. L’authentification par OAuth ou token d’abonnement conserve les en-têtes bêta Anthropic requis, mais OpenClaw supprime l’ancien en-tête bêta de 1M s’il subsiste dans une ancienne configuration.
    </Warning>

  </Accordion>

  <Accordion title="Contexte de 1M de Claude Opus 4.8">
    `anthropic/claude-opus-4-8` et sa variante `claude-cli` disposent par défaut d’une fenêtre de contexte
    de 1M ; aucun `params.context1m: true` n’est nécessaire.
  </Accordion>
</AccordionGroup>

## Résolution des problèmes

<AccordionGroup>
  <Accordion title="Erreurs 401 / token soudainement invalide">
    L’authentification par token Anthropic expire et peut être révoquée. Pour les nouvelles configurations, utilisez plutôt une clé d’API Anthropic.
  </Accordion>

  <Accordion title='Aucune clé d’API trouvée pour le fournisseur "anthropic"'>
    L’authentification Anthropic est propre à **chaque agent** ; les nouveaux agents n’héritent pas des clés de l’agent principal. Relancez l’intégration pour cet agent (ou configurez une clé d’API sur l’hôte du Gateway), puis vérifiez avec `openclaw models status`.
  </Accordion>

  <Accordion title='Aucun identifiant trouvé pour le profil "anthropic:default"'>
    Exécutez `openclaw models status` pour voir quel profil d’authentification est actif. Relancez l’intégration ou configurez une clé d’API pour le chemin de ce profil.
  </Accordion>

  <Accordion title="Aucun profil d’authentification disponible (tous en période de récupération)">
    Consultez `openclaw models status --json` pour `auth.unusableProfiles`. Les périodes de récupération dues aux limites de débit d’Anthropic peuvent être propres à un modèle ; un autre modèle Anthropic peut donc rester utilisable. Ajoutez un autre profil Anthropic ou attendez la fin de la période de récupération.
  </Accordion>
</AccordionGroup>

<Note>
Aide supplémentaire : [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Note>

## Voir aussi

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Backends CLI" href="/fr/gateway/cli-backends" icon="terminal">
    Configuration du backend Claude CLI et détails d’exécution.
  </Card>
  <Card title="Mise en cache des prompts" href="/fr/reference/prompt-caching" icon="database">
    Fonctionnement de la mise en cache des prompts entre les fournisseurs.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails de l’authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
