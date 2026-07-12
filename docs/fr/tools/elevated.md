---
read_when:
    - Ajustement des valeurs par défaut du mode élevé, des listes d’autorisation ou du comportement des commandes slash
    - Comprendre comment les agents en bac à sable peuvent accéder à l’hôte
summary: 'Mode d’exécution avec privilèges élevés : exécutez des commandes hors du bac à sable depuis un agent placé dans un bac à sable'
title: Mode privilégié
x-i18n:
    generated_at: "2026-07-12T15:52:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ab035f2f0d0074da4e7661d9d690d89aa5eea25b7920ce48a2a03dffccded85b
    source_path: tools/elevated.md
    workflow: 16
---

Lorsqu’un agent s’exécute dans un bac à sable, ses commandes `exec` sont confinées à l’environnement du bac à sable. Le **mode élevé** permet à l’agent d’en sortir et d’exécuter des commandes en dehors du bac à sable, avec des contrôles d’approbation configurables.

<Info>
  Le mode élevé ne modifie le comportement que lorsque l’agent est **dans un bac à sable**. Pour les agents sans bac à sable, exec s’exécute déjà sur l’hôte.
</Info>

## Directives

Contrôlez le mode élevé par session à l’aide de commandes obliques :

| Directive        | Fonctionnement                                                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/elevated on`   | Exécute les commandes en dehors du bac à sable sur le chemin d’hôte configuré, tout en conservant les approbations                                        |
| `/elevated ask`  | Identique à `on` (alias)                                                                                                                                  |
| `/elevated full` | Exécute les commandes en dehors du bac à sable sur le chemin d’hôte configuré et ignore les approbations lorsque la politique d’approbation du mode ou de l’hôte est déjà permissive |
| `/elevated off`  | Rétablit l’exécution confinée au bac à sable                                                                                                              |

Également disponible sous la forme `/elev on|off|ask|full`.

Envoyez `/elevated` sans argument pour afficher le niveau actuel.

## Fonctionnement

<Steps>
  <Step title="Vérifier la disponibilité">
    Le mode élevé doit être activé dans la configuration et l’expéditeur doit figurer dans la liste d’autorisation :

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

    Vous pouvez également l’utiliser en ligne (elle s’applique uniquement à ce message) :

    ```
    /elevated on exécuter le script de déploiement
    ```

  </Step>

  <Step title="Les commandes s’exécutent en dehors du bac à sable">
    Lorsque le mode élevé est actif, les appels `exec` quittent le bac à sable. L’hôte effectif est
    `gateway` par défaut, ou `node` lorsque la cible d’exécution configurée ou propre à la session est
    `node`. En mode `full`, les approbations d’exécution sont ignorées lorsque la politique d’approbation
    du mode ou de l’hôte d’exécution résolue est déjà entièrement permissive (sécurité `full`,
    demande `off`) ; sinon, la politique d’approbation normale continue de s’appliquer. En mode
    `on`/`ask`, les règles d’approbation configurées s’appliquent toujours.
  </Step>
</Steps>

## Ordre de résolution

1. **Directive en ligne** dans le message (s’applique uniquement à ce message)
2. **Remplacement pour la session** (défini par l’envoi d’un message contenant uniquement une directive)
3. **Valeur globale par défaut** (`agents.defaults.elevatedDefault` dans la configuration)

## Disponibilité et listes d’autorisation

- **Contrôle global** : `tools.elevated.enabled` (doit être `true`)
- **Liste d’autorisation des expéditeurs** : `tools.elevated.allowFrom` avec des listes par canal
- **Contrôle par agent** : `agents.list[].tools.elevated.enabled` (peut uniquement ajouter des restrictions ; les contrôles global et par agent doivent tous deux être définis sur `true`)
- **Liste d’autorisation par agent** : `agents.list[].tools.elevated.allowFrom` (l’expéditeur doit correspondre aux listes globale et par agent)
- **Liste d’autorisation de secours fournie par le canal** : les plugins de canal peuvent éventuellement fournir une liste d’autorisation de secours par l’intermédiaire d’un hook d’adaptateur SDK, utilisée lorsque `tools.elevated.allowFrom.<provider>` n’est pas configuré. Aucun canal fourni n’implémente actuellement ce hook ; en pratique, chaque fournisseur nécessite donc aujourd’hui une entrée `tools.elevated.allowFrom.<provider>` explicite.
- **Tous les contrôles doivent être validés** ; sinon, le mode élevé est considéré comme indisponible

Formats des entrées de la liste d’autorisation :

| Préfixe                 | Correspondance                                          |
| ----------------------- | ------------------------------------------------------- |
| (aucun)                 | ID de l’expéditeur, E.164 ou champ From                 |
| `name:`                 | Nom d’affichage de l’expéditeur                         |
| `username:`             | Nom d’utilisateur de l’expéditeur                       |
| `tag:`                  | Étiquette de l’expéditeur                               |
| `id:`, `from:`, `e164:` | Ciblage explicite de l’identité                         |

## Ce que le mode élevé ne contrôle pas

- **Politique des outils** : si `exec` est refusé par la politique des outils, le mode élevé ne peut pas contourner ce refus.
- **Politique de sélection de l’hôte** : le mode élevé ne transforme pas `auto` en un remplacement libre entre les hôtes. Il utilise les règles de cible d’exécution configurées ou propres à la session et choisit `node` uniquement lorsque la cible est déjà `node`.
- **Distinct de `/exec`** : la directive `/exec` ajuste les valeurs d’exécution par défaut de la session (hôte, sécurité, demande, nœud) pour les expéditeurs autorisés et ne nécessite pas le mode élevé.

<Note>
  La commande de discussion bash (préfixe `!` ; alias `/bash`) est soumise à un contrôle distinct qui exige l’activation de `tools.elevated` en plus de son propre indicateur `tools.bash.enabled`. La désactivation du mode élevé bloque également les commandes d’interpréteur `!`.
</Note>

## Voir aussi

<CardGroup cols={2}>
  <Card title="Outil Exec" href="/fr/tools/exec" icon="terminal">
    Exécution de commandes d’interpréteur par l’agent.
  </Card>
  <Card title="Approbations Exec" href="/fr/tools/exec-approvals" icon="shield">
    Système d’approbation et de liste d’autorisation pour `exec`.
  </Card>
  <Card title="Mise en bac à sable" href="/fr/gateway/sandboxing" icon="box">
    Configuration du bac à sable au niveau du Gateway.
  </Card>
  <Card title="Bac à sable, politique des outils et mode élevé" href="/fr/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    Fonctionnement combiné des trois contrôles lors d’un appel d’outil.
  </Card>
</CardGroup>
