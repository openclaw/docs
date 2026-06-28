---
read_when:
    - Réglage des valeurs par défaut du mode élevé, des listes d’autorisation ou du comportement des commandes slash
    - Comprendre comment les agents en bac à sable peuvent accéder à l’hôte
summary: 'Mode d’exécution élevé : exécuter des commandes hors du bac à sable depuis un agent en bac à sable'
title: Mode élevé
x-i18n:
    generated_at: "2026-05-06T07:40:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91aab7c105643d8e5d07d89cd5ab176f0a40cd3d23e2b20b3986cbf76f575d64
    source_path: tools/elevated.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Lorsqu’un agent s’exécute dans un bac à sable, ses commandes `exec` sont confinées à l’environnement du bac à sable. Le **mode élevé** permet à l’agent d’en sortir et d’exécuter des commandes hors du bac à sable, avec des étapes d’approbation configurables.

<Info>
  Le mode élevé ne change le comportement que lorsque l’agent est **dans un bac à sable**. Pour les agents hors bac à sable, exec s’exécute déjà sur l’hôte.
</Info>

## Directives

Contrôlez le mode élevé par session avec des commandes slash :

| Directive        | Ce que cela fait                                                            |
| ---------------- | --------------------------------------------------------------------------- |
| `/elevated on`   | Exécute hors du bac à sable sur le chemin hôte configuré, garde les approbations |
| `/elevated ask`  | Identique à `on` (alias)                                                    |
| `/elevated full` | Exécute hors du bac à sable sur le chemin hôte configuré et ignore les approbations |
| `/elevated off`  | Revient à une exécution confinée au bac à sable                             |

Également disponible sous la forme `/elev on|off|ask|full`.

Envoyez `/elevated` sans argument pour voir le niveau actuel.

## Fonctionnement

<Steps>
  <Step title="Check availability">
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

  <Step title="Set the level">
    Envoyez un message contenant uniquement la directive pour définir la valeur par défaut de la session :

    ```
    /elevated full
    ```

    Ou utilisez-la en ligne (s’applique uniquement à ce message) :

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Commands run outside the sandbox">
    Lorsque le mode élevé est actif, les appels `exec` quittent le bac à sable. L’hôte effectif est `gateway` par défaut, ou `node` lorsque la cible exec configurée/de session est `node`. En mode `full`, les approbations exec sont ignorées. En mode `on`/`ask`, les règles d’approbation configurées s’appliquent toujours.
  </Step>
</Steps>

## Ordre de résolution

1. **Directive en ligne** dans le message (s’applique uniquement à ce message)
2. **Remplacement de session** (défini en envoyant un message contenant uniquement la directive)
3. **Valeur par défaut globale** (`agents.defaults.elevatedDefault` dans la configuration)

## Disponibilité et listes d’autorisation

- **Garde globale** : `tools.elevated.enabled` (doit valoir `true`)
- **Liste d’autorisation de l’expéditeur** : `tools.elevated.allowFrom` avec des listes par canal
- **Garde par agent** : `agents.list[].tools.elevated.enabled` (ne peut que restreindre davantage)
- **Liste d’autorisation par agent** : `agents.list[].tools.elevated.allowFrom` (l’expéditeur doit correspondre à la fois à la globale et à celle de l’agent)
- **Solution de repli Discord** : si `tools.elevated.allowFrom.discord` est omis, `channels.discord.allowFrom` est utilisé comme solution de repli
- **Toutes les gardes doivent réussir** ; sinon le mode élevé est considéré comme indisponible

Formats des entrées de liste d’autorisation :

| Préfixe                 | Correspond à                   |
| ----------------------- | ------------------------------ |
| (aucun)                 | ID d’expéditeur, E.164 ou champ From |
| `name:`                 | Nom d’affichage de l’expéditeur |
| `username:`             | Nom d’utilisateur de l’expéditeur |
| `tag:`                  | Tag de l’expéditeur            |
| `id:`, `from:`, `e164:` | Ciblage d’identité explicite   |

## Ce que le mode élevé ne contrôle pas

- **Politique d’outil** : si `exec` est refusé par la politique d’outil, le mode élevé ne peut pas la contourner.
- **Politique de sélection de l’hôte** : le mode élevé ne transforme pas `auto` en remplacement libre entre hôtes. Il utilise les règles de cible exec configurée/de session, en choisissant `node` uniquement lorsque la cible est déjà `node`.
- **Distinct de `/exec`** : la directive `/exec` ajuste les valeurs par défaut exec par session pour les expéditeurs autorisés et ne nécessite pas le mode élevé.

<Note>
  La commande de discussion bash (préfixe `!` ; alias `/bash`) est une garde distincte qui nécessite que `tools.elevated` soit activé en plus de son propre indicateur `tools.bash.enabled`. Désactiver le mode élevé bloque également les commandes shell `!`.
</Note>

## Connexe

<CardGroup cols={2}>
  <Card title="Exec tool" href="/fr/tools/exec" icon="terminal">
    Exécution de commandes shell depuis l’agent.
  </Card>
  <Card title="Exec approvals" href="/fr/tools/exec-approvals" icon="shield">
    Système d’approbation et de liste d’autorisation pour `exec`.
  </Card>
  <Card title="Sandboxing" href="/fr/gateway/sandboxing" icon="box">
    Configuration du bac à sable au niveau Gateway.
  </Card>
  <Card title="Sandbox vs Tool Policy vs Elevated" href="/fr/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    Comment les trois gardes se composent pendant un appel d’outil.
  </Card>
</CardGroup>
