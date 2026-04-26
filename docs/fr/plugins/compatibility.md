---
read_when:
    - Vous maintenez un Plugin OpenClaw
    - Vous voyez un avertissement de compatibilité du Plugin
    - Vous planifiez une migration du SDK Plugin ou du manifeste de Plugin
summary: Contrats de compatibilité des Plugins, métadonnées de dépréciation, et attentes de migration
title: Compatibilité des Plugins
x-i18n:
    generated_at: "2026-04-26T11:34:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b4e11dc57c29eac72844b91bec75a9d48005bbd3c89a2a9d7a5634ab782e5fc
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw maintient les anciens contrats de Plugin via des adaptateurs de
compatibilité nommés avant de les supprimer. Cela protège les Plugins intégrés et externes existants
pendant que les contrats du SDK, du manifeste, de la configuration, de la config et du runtime d’agent évoluent.

## Registre de compatibilité

Les contrats de compatibilité des Plugins sont suivis dans le registre central à
`src/plugins/compat/registry.ts`.

Chaque enregistrement comporte :

- un code de compatibilité stable
- un statut : `active`, `deprecated`, `removal-pending`, ou `removed`
- un propriétaire : SDK, config, setup, canal, fournisseur, exécution de Plugin, runtime d’agent,
  ou noyau
- des dates d’introduction et de dépréciation le cas échéant
- des consignes de remplacement
- de la documentation, des diagnostics et des tests couvrant l’ancien et le nouveau comportement

Le registre est la source de vérité pour la planification des mainteneurs et les futures vérifications de l’inspecteur de Plugin. Si un comportement visible par les Plugins change, ajoutez ou mettez à jour l’enregistrement de compatibilité dans la même modification que celle qui ajoute l’adaptateur.

La compatibilité de migration et de réparation Doctor est suivie séparément dans
`src/commands/doctor/shared/deprecation-compat.ts`. Ces enregistrements couvrent les anciennes
formes de configuration, dispositions du registre d’installation, et shims de réparation qui peuvent devoir rester
disponibles après la suppression du chemin de compatibilité d’exécution.

Les vérifications globales de release doivent examiner les deux registres. Ne supprimez pas une migration doctor
simplement parce que l’enregistrement de compatibilité d’exécution ou de configuration correspondant a expiré ; vérifiez d’abord qu’il n’existe aucun chemin de mise à niveau pris en charge nécessitant encore cette réparation. Revalidez également chaque annotation de remplacement pendant la planification de release, car la propriété des Plugins et l’empreinte de configuration peuvent changer à mesure que les fournisseurs et canaux sortent du noyau.

## Package d’inspecteur de Plugin

L’inspecteur de Plugin doit vivre hors du dépôt central OpenClaw en tant que package/dépôt séparé
adossé aux contrats versionnés de compatibilité et de manifeste.

La CLI du premier jour devrait être :

```sh
openclaw-plugin-inspector ./my-plugin
```

Elle devrait produire :

- validation du manifeste/schéma
- la version du contrat de compatibilité en cours de vérification
- vérifications des métadonnées d’installation/source
- vérifications d’importation de chemin à froid
- avertissements de dépréciation et de compatibilité

Utilisez `--json` pour une sortie stable lisible par machine dans les annotations CI. Le noyau OpenClaw
doit exposer des contrats et des fixtures que l’inspecteur peut consommer, mais ne doit
pas publier le binaire inspecteur depuis le package principal `openclaw`.

## Politique de dépréciation

OpenClaw ne doit pas supprimer un contrat de Plugin documenté dans la même release
que celle qui introduit son remplacement.

La séquence de migration est :

1. Ajouter le nouveau contrat.
2. Conserver l’ancien comportement câblé via un adaptateur de compatibilité nommé.
3. Émettre des diagnostics ou avertissements lorsque les auteurs de Plugin peuvent agir.
4. Documenter le remplacement et le calendrier.
5. Tester à la fois l’ancien et le nouveau chemin.
6. Attendre pendant la fenêtre de migration annoncée.
7. Supprimer uniquement avec une approbation explicite de release incompatible.

Les enregistrements dépréciés doivent inclure une date de début d’avertissement, un remplacement, un lien de documentation,
et une date finale de suppression au plus trois mois après le début de l’avertissement. N’ajoutez pas un chemin de compatibilité déprécié avec une fenêtre de suppression ouverte sauf
si les mainteneurs décident explicitement qu’il s’agit d’une compatibilité permanente et le marquent alors `active`.

## Zones de compatibilité actuelles

Les enregistrements de compatibilité actuels incluent :

- les anciens imports larges du SDK tels que `openclaw/plugin-sdk/compat`
- les anciennes formes de Plugin basées uniquement sur les hooks et `before_agent_start`
- les anciens points d’entrée de Plugin `activate(api)` pendant que les Plugins migrent vers
  `register(api)`
- les anciens alias SDK tels que `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, les builders de statut `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils`, et les alias de type `ClawdbotConfig` /
  `OpenClawSchemaType`
- le comportement de liste d’autorisation et d’activation des Plugins intégrés
- les anciennes métadonnées de manifeste de variables d’environnement fournisseur/canal
- les anciens hooks et alias de type des Plugins fournisseur pendant que les fournisseurs migrent vers
  des hooks explicites de catalogue, auth, thinking, replay, et transport
- les anciens alias runtime tels que `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, et `api.runtime.stt`
- l’ancienne inscription fractionnée des Plugins mémoire pendant que les Plugins mémoire migrent vers
  `registerMemoryCapability`
- les anciens helpers SDK de canal pour les schémas de messages natifs, le filtrage des mentions,
  le formatage d’enveloppe entrante, et l’imbrication des capacités d’approbation
- les indices d’activation remplacés par la propriété des contributions du manifeste
- le fallback d’exécution `setup-api` pendant que les descripteurs de setup migrent vers les métadonnées froides
  `setup.requiresRuntime: false`
- les hooks `discovery` de fournisseur pendant que les hooks de catalogue fournisseur migrent vers
  `catalog.run(...)`
- les métadonnées de canal `showConfigured` / `showInSetup` pendant que les packages de canal migrent
  vers `openclaw.channel.exposure`
- les anciennes clés de configuration de politique d’exécution pendant que doctor migre les opérateurs vers
  `agentRuntime`
- le fallback de métadonnées de configuration de canal intégré généré pendant que les métadonnées
  `channelConfigs` registry-first arrivent
- les drapeaux env persistés de désactivation du registre de Plugin et de migration d’installation pendant que
  les flux de réparation migrent les opérateurs vers `openclaw plugins registry --refresh` et
  `openclaw doctor --fix`
- les anciens chemins de configuration détenus par le Plugin pour web search, web fetch, et x_search pendant que
  doctor les migre vers `plugins.entries.<plugin>.config`
- l’ancienne configuration rédigée `plugins.installs` et les alias de chemin de chargement de Plugins intégrés pendant que les métadonnées d’installation migrent vers le ledger de Plugin géré par l’état

Le nouveau code de Plugin doit préférer le remplacement listé dans le registre et dans le
guide de migration spécifique. Les Plugins existants peuvent continuer à utiliser un chemin de compatibilité
jusqu’à ce que la documentation, les diagnostics et les notes de release annoncent une fenêtre de suppression.

## Notes de release

Les notes de release doivent inclure les dépréciations de Plugin à venir avec leurs dates cibles et
des liens vers la documentation de migration. Cet avertissement doit intervenir avant qu’un chemin de compatibilité ne passe à `removal-pending` ou `removed`.
