---
read_when:
    - Ajustement des valeurs par défaut du mode élevé, des listes d’autorisation ou du comportement des commandes slash
    - Comprendre comment les agents isolés peuvent accéder à l’hôte
summary: 'Mode d’exécution privilégié : exécuter des commandes hors du bac à sable depuis un agent exécuté dans un bac à sable'
title: Mode avec privilèges élevés
x-i18n:
    generated_at: "2026-07-12T03:23:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab035f2f0d0074da4e7661d9d690d89aa5eea25b7920ce48a2a03dffccded85b
    source_path: tools/elevated.md
    workflow: 16
---

Lorsqu’un agent s’exécute dans un bac à sable, ses commandes `exec` sont confinées à l’environnement du bac à sable. Le **mode privilégié** permet à l’agent d’en sortir et d’exécuter des commandes en dehors du bac à sable, avec des contrôles d’approbation configurables.

<Info>
  Le mode privilégié ne modifie le comportement que lorsque l’agent est **dans un bac à sable**. Pour les agents sans bac à sable, `exec` s’exécute déjà sur l’hôte.
</Info>

## Directives

Contrôlez le mode privilégié pour chaque session à l’aide de commandes obliques :

| Directive        | Fonction                                                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/elevated on`   | Exécute les commandes hors du bac à sable sur le chemin d’hôte configuré, tout en conservant les approbations                                       |
| `/elevated ask`  | Identique à `on` (alias)                                                                                                                            |
| `/elevated full` | Exécute les commandes hors du bac à sable sur le chemin d’hôte configuré et ignore les approbations lorsque la politique d’approbation du mode ou de l’hôte est déjà permissive |
| `/elevated off`  | Rétablit l’exécution confinée au bac à sable                                                                                                        |

Également disponible sous la forme `/elev on|off|ask|full`.

Envoyez `/elevated` sans argument pour afficher le niveau actuel.

## Fonctionnement

<Steps>
  <Step title="Vérifier la disponibilité">
    Le mode privilégié doit être activé dans la configuration et l’expéditeur doit figurer dans la liste d’autorisation :

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Définir le niveau">
    Envoyez un message contenant uniquement une directive pour définir la valeur par défaut de la session :

    ```
    /elevated full
    ```

    Vous pouvez aussi l’utiliser dans le corps du message (elle ne s’applique alors qu’à ce message) :

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Les commandes s’exécutent hors du bac à sable">
    Lorsque le mode privilégié est actif, les appels `exec` quittent le bac à sable. L’hôte effectif est
    `gateway` par défaut, ou `node` lorsque la cible d’exécution configurée ou définie pour la session est
    `node`. En mode `full`, les approbations d’exécution sont ignorées lorsque la politique d’approbation
    du mode ou de l’hôte résolue est déjà entièrement permissive (sécurité `full`,
    demande `off`) ; sinon, la politique d’approbation normale continue de s’appliquer. En mode
    `on`/`ask`, les règles d’approbation configurées s’appliquent toujours.
  </Step>
</Steps>

## Ordre de résolution

1. **Directive intégrée** au message (s’applique uniquement à ce message)
2. **Remplacement de session** (défini en envoyant un message contenant uniquement une directive)
3. **Valeur globale par défaut** (`agents.defaults.elevatedDefault` dans la configuration)

## Disponibilité et listes d’autorisation

- **Contrôle global** : `tools.elevated.enabled` (doit être `true`)
- **Liste d’autorisation des expéditeurs** : `tools.elevated.allowFrom` avec des listes propres à chaque canal
- **Contrôle par agent** : `agents.list[].tools.elevated.enabled` (peut uniquement renforcer les restrictions ; les contrôles global et par agent doivent tous deux être `true`)
- **Liste d’autorisation par agent** : `agents.list[].tools.elevated.allowFrom` (l’expéditeur doit correspondre à la fois à la liste globale et à celle de l’agent)
- **Liste d’autorisation de secours fournie par le canal** : les plugins de canal peuvent éventuellement fournir une liste d’autorisation de secours via un point d’extension d’adaptateur du SDK, utilisée lorsque `tools.elevated.allowFrom.<provider>` n’est pas configuré. Aucun canal intégré n’implémente actuellement ce point d’extension ; en pratique, chaque fournisseur nécessite donc aujourd’hui une entrée `tools.elevated.allowFrom.<provider>` explicite.
- **Tous les contrôles doivent être validés** ; sinon, le mode privilégié est considéré comme indisponible

Formats des entrées de la liste d’autorisation :

| Préfixe                 | Correspondance                                      |
| ----------------------- | --------------------------------------------------- |
| (aucun)                 | ID de l’expéditeur, numéro E.164 ou champ From      |
| `name:`                 | Nom d’affichage de l’expéditeur                     |
| `username:`             | Nom d’utilisateur de l’expéditeur                   |
| `tag:`                  | Étiquette de l’expéditeur                           |
| `id:`, `from:`, `e164:` | Ciblage explicite de l’identité                     |

## Ce que le mode privilégié ne contrôle pas

- **Politique des outils** : si `exec` est interdit par la politique des outils, le mode privilégié ne peut pas contourner cette interdiction.
- **Politique de sélection de l’hôte** : le mode privilégié ne transforme pas `auto` en remplacement libre entre les hôtes. Il utilise les règles de cible d’exécution configurées ou définies pour la session et ne choisit `node` que lorsque la cible est déjà `node`.
- **Distinct de `/exec`** : la directive `/exec` ajuste les valeurs d’exécution par défaut de la session (hôte, sécurité, demande, nœud) pour les expéditeurs autorisés et ne nécessite pas le mode privilégié.

<Note>
  La commande de discussion bash (préfixe `!` ; alias `/bash`) dispose d’un contrôle distinct qui exige que `tools.elevated` soit activé en plus de son propre indicateur `tools.bash.enabled`. La désactivation du mode privilégié bloque également les commandes d’interpréteur `!`.
</Note>

## Voir aussi

<CardGroup cols={2}>
  <Card title="Outil Exec" href="/fr/tools/exec" icon="terminal">
    Exécution de commandes d’interpréteur depuis l’agent.
  </Card>
  <Card title="Approbations Exec" href="/fr/tools/exec-approvals" icon="shield">
    Système d’approbation et de liste d’autorisation pour `exec`.
  </Card>
  <Card title="Mise en bac à sable" href="/fr/gateway/sandboxing" icon="box">
    Configuration du bac à sable au niveau du Gateway.
  </Card>
  <Card title="Bac à sable, politique des outils et mode privilégié" href="/fr/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    Manière dont les trois contrôles se combinent lors d’un appel d’outil.
  </Card>
</CardGroup>
