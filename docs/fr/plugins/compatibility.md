---
read_when:
    - Vous maintenez un plugin OpenClaw
    - Vous voyez un avertissement de compatibilité de plugin
    - Vous planifiez une migration du SDK plugin ou du manifeste de Plugin
summary: Contrats de compatibilité des plugins, métadonnées de dépréciation et attentes de migration
title: Compatibilité des plugins
x-i18n:
    generated_at: "2026-04-25T13:52:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02e0cdbc763eed5a38b303fc44202ddd36e58bce43dc29b6348db3f5fea66f26
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw conserve les anciens contrats de plugins câblés via des
adaptateurs de compatibilité nommés avant de les supprimer. Cela protège les
plugins intégrés et externes existants pendant que les contrats du SDK, du manifeste, de la configuration, de la config et du runtime d’agent
évoluent.

## Registre de compatibilité

Les contrats de compatibilité des plugins sont suivis dans le registre cœur à
`src/plugins/compat/registry.ts`.

Chaque enregistrement comporte :

- un code de compatibilité stable
- un statut : `active`, `deprecated`, `removal-pending` ou `removed`
- un propriétaire : SDK, config, setup, canal, fournisseur, exécution du plugin, runtime d’agent,
  ou cœur
- les dates d’introduction et de dépréciation lorsqu’elles s’appliquent
- des indications de remplacement
- la documentation, les diagnostics et les tests qui couvrent l’ancien et le nouveau comportement

Le registre est la source de référence pour la planification des mainteneurs et pour les futures vérifications de l’inspecteur de plugins. Si un comportement exposé aux plugins change, ajoutez ou mettez à jour l’enregistrement de compatibilité dans le même changement que celui qui ajoute l’adaptateur.

## Package d’inspecteur de plugins

L’inspecteur de plugins doit vivre en dehors du dépôt cœur OpenClaw dans un package/dépôt séparé reposant sur les contrats versionnés de compatibilité et de manifeste.

La CLI day-one doit être :

```sh
openclaw-plugin-inspector ./my-plugin
```

Elle doit émettre :

- validation du manifeste/schéma
- la version de compatibilité du contrat en cours de vérification
- vérifications des métadonnées d’installation/source
- vérifications d’importation du chemin à froid
- avertissements de dépréciation et de compatibilité

Utilisez `--json` pour une sortie stable lisible par machine dans les annotations CI. Le cœur OpenClaw
doit exposer les contrats et fixtures que l’inspecteur peut consommer, mais ne doit
pas publier le binaire de l’inspecteur depuis le package principal `openclaw`.

## Politique de dépréciation

OpenClaw ne doit pas supprimer un contrat de plugin documenté dans la même version
que celle qui introduit son remplacement.

La séquence de migration est :

1. Ajouter le nouveau contrat.
2. Conserver l’ancien comportement câblé via un adaptateur de compatibilité nommé.
3. Émettre des diagnostics ou des avertissements lorsque les auteurs de plugins peuvent agir.
4. Documenter le remplacement et le calendrier.
5. Tester à la fois l’ancien et le nouveau chemin.
6. Attendre jusqu’à la fin de la fenêtre de migration annoncée.
7. Supprimer uniquement avec une approbation explicite de version cassante.

Les enregistrements dépréciés doivent inclure une date de début d’avertissement, un remplacement, un lien vers la documentation,
et une date cible de suppression lorsqu’elle est connue.

## Zones de compatibilité actuelles

Les enregistrements de compatibilité actuels incluent :

- les anciens imports larges du SDK tels que `openclaw/plugin-sdk/compat`
- les anciennes formes de plugins hook-only et `before_agent_start`
- le comportement d’allowlist et d’activation des plugins intégrés
- les anciennes métadonnées de manifeste des variables d’environnement fournisseur/canal
- les indices d’activation en cours de remplacement par la propriété des contributions de manifeste
- les alias de nommage `embeddedHarness` et `agent-harness` pendant que le nommage public évolue
  vers `agentRuntime`
- la solution de repli des métadonnées de configuration de canal intégré générées pendant que les
  métadonnées `channelConfigs` registry-first arrivent

Le nouveau code de plugin doit préférer le remplacement indiqué dans le registre et dans le
guide de migration spécifique. Les plugins existants peuvent continuer à utiliser un chemin de compatibilité
jusqu’à ce que la documentation, les diagnostics et les notes de version annoncent une fenêtre de suppression.

## Notes de version

Les notes de version doivent inclure les dépréciations de plugins à venir avec les dates cibles et
des liens vers la documentation de migration. Cet avertissement doit être émis avant qu’un chemin de compatibilité
passe à `removal-pending` ou `removed`.
