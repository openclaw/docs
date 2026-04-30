---
read_when:
    - Vous maintenez un Plugin OpenClaw
    - Un avertissement de compatibilité de plugin s’affiche
    - Vous planifiez une migration du SDK de Plugin ou du manifeste
summary: Contrats de compatibilité Plugin, métadonnées d'obsolescence et attentes relatives à la migration
title: Compatibilité Plugin
x-i18n:
    generated_at: "2026-04-30T07:38:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 344dbaac86db7259adc09bc91b7fbe7ba540fc6fdd96cc422918ccf2c34d9cec
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw garde les anciens contrats de Plugin câblés via des adaptateurs de compatibilité nommés avant de les supprimer. Cela protège les Plugins intégrés et externes existants pendant que les contrats du SDK, du manifeste, de la configuration initiale, de la config et du runtime d’agent évoluent.

## Registre de compatibilité

Les contrats de compatibilité des Plugins sont suivis dans le registre central à
`src/plugins/compat/registry.ts`.

Chaque enregistrement contient :

- un code de compatibilité stable
- un statut : `active`, `deprecated`, `removal-pending` ou `removed`
- un propriétaire : SDK, config, configuration initiale, canal, fournisseur, exécution de Plugin, runtime d’agent,
  ou noyau
- les dates d’introduction et de dépréciation, le cas échéant
- des consignes de remplacement
- la documentation, les diagnostics et les tests qui couvrent l’ancien et le nouveau comportement

Le registre est la source pour la planification des mainteneurs et les futurs contrôles de l’inspecteur de Plugins. Si un comportement exposé aux Plugins change, ajoutez ou mettez à jour l’enregistrement de compatibilité dans le même changement que celui qui ajoute l’adaptateur.

La compatibilité des réparations et migrations de doctor est suivie séparément dans
`src/commands/doctor/shared/deprecation-compat.ts`. Ces enregistrements couvrent les anciennes formes de config, les structures de registre d’installation et les shims de réparation qui peuvent devoir rester disponibles après la suppression du chemin de compatibilité runtime.

Les revues de release doivent vérifier les deux registres. Ne supprimez pas une migration de doctor simplement parce que l’enregistrement de compatibilité runtime ou config correspondant a expiré ; vérifiez d’abord qu’aucun chemin de mise à niveau pris en charge n’a encore besoin de la réparation. Revalidez aussi chaque annotation de remplacement pendant la planification de release, car la propriété des Plugins et l’empreinte de config peuvent changer à mesure que les fournisseurs et canaux sortent du noyau.

## Package d’inspecteur de Plugins

L’inspecteur de Plugins doit vivre hors du dépôt OpenClaw principal, sous forme de package/dépôt séparé adossé aux contrats versionnés de compatibilité et de manifeste.

La CLI initiale doit être :

```sh
openclaw-plugin-inspector ./my-plugin
```

Elle doit émettre :

- la validation du manifeste/schéma
- la version de compatibilité du contrat vérifiée
- les contrôles de métadonnées d’installation/source
- les contrôles d’import de chemin froid
- les avertissements de dépréciation et de compatibilité

Utilisez `--json` pour une sortie stable lisible par machine dans les annotations CI. Le noyau OpenClaw doit exposer les contrats et fixtures que l’inspecteur peut consommer, mais ne doit pas publier le binaire de l’inspecteur depuis le package principal `openclaw`.

### Voie d’acceptation des mainteneurs

Utilisez Blacksmith Testbox pour la voie d’acceptation du package installable lors de la validation de l’inspecteur externe avec les packages de Plugins OpenClaw. Exécutez-la depuis un checkout OpenClaw propre après la construction du package :

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

Gardez cette voie optionnelle pour les mainteneurs, car elle installe un package npm externe et peut inspecter des packages de Plugins clonés hors du dépôt. Les garde-fous locaux du dépôt couvrent la carte d’exports du SDK, les métadonnées du registre de compatibilité, la réduction des imports SDK dépréciés et les frontières d’import des Plugins intégrés ; la preuve de l’inspecteur dans Testbox couvre le package tel que les auteurs de Plugins externes le consomment.

## Politique de dépréciation

OpenClaw ne doit pas supprimer un contrat de Plugin documenté dans la même release que celle qui introduit son remplacement.

La séquence de migration est :

1. Ajouter le nouveau contrat.
2. Garder l’ancien comportement câblé via un adaptateur de compatibilité nommé.
3. Émettre des diagnostics ou avertissements lorsque les auteurs de Plugins peuvent agir.
4. Documenter le remplacement et le calendrier.
5. Tester les anciens et les nouveaux chemins.
6. Attendre pendant la fenêtre de migration annoncée.
7. Supprimer uniquement avec une approbation explicite de release avec rupture.

Les enregistrements dépréciés doivent inclure une date de début d’avertissement, un remplacement, un lien de documentation et une date de suppression finale au plus tard trois mois après le début de l’avertissement. N’ajoutez pas de chemin de compatibilité déprécié avec une fenêtre de suppression ouverte, sauf si les mainteneurs décident explicitement qu’il s’agit d’une compatibilité permanente et le marquent plutôt `active`.

## Zones de compatibilité actuelles

Les enregistrements de compatibilité actuels incluent :

- les anciens imports SDK larges tels que `openclaw/plugin-sdk/compat`
- les anciennes formes de Plugins fondées uniquement sur les hooks et `before_agent_start`
- les anciens points d’entrée de Plugins `activate(api)` pendant que les Plugins migrent vers
  `register(api)`
- les anciens alias SDK tels que `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, les constructeurs de statut `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` (remplacé par des sous-chemins de test ciblés
  `openclaw/plugin-sdk/*`), et les alias de types `ClawdbotConfig` /
  `OpenClawSchemaType`
- le comportement de liste d’autorisation et d’activation des Plugins intégrés
- les anciennes métadonnées de manifeste de variables d’environnement pour fournisseurs/canaux
- les anciens hooks de Plugins fournisseurs et alias de types pendant que les fournisseurs migrent vers des hooks explicites de catalogue, d’authentification, de réflexion, de relecture et de transport
- les anciens alias runtime tels que `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt`, et les fonctions dépréciées
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- l’ancien enregistrement scindé des Plugins de mémoire pendant que les Plugins de mémoire migrent vers
  `registerMemoryCapability`
- les anciens helpers du SDK de canal pour les schémas de messages natifs, le filtrage des mentions, le formatage des enveloppes entrantes et l’imbrication de capacité d’approbation
- les anciens alias de clé de route de canal et de helper de cible comparable pendant que les Plugins migrent vers `openclaw/plugin-sdk/channel-route`
- les indices d’activation remplacés par la propriété des contributions de manifeste
- le chargement implicite déprécié des sidecars au démarrage pour les Plugins qui n’ont pas déclaré
  `activation.onStartup` ; les mainteneurs peuvent tester le futur comportement plus strict avec
  `OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1`
- le fallback runtime `setup-api` pendant que les descripteurs de configuration initiale migrent vers les métadonnées froides
  `setup.requiresRuntime: false`
- les hooks `discovery` des fournisseurs pendant que les hooks de catalogue fournisseur migrent vers
  `catalog.run(...)`
- les métadonnées de canal `showConfigured` / `showInSetup` pendant que les packages de canal migrent vers
  `openclaw.channel.exposure`
- les anciennes clés de config de politique runtime pendant que doctor migre les opérateurs vers
  `agentRuntime`
- le fallback des métadonnées générées de config des canaux intégrés pendant que les métadonnées
  `channelConfigs` priorisant le registre arrivent
- les indicateurs d’environnement de désactivation du registre de Plugins persistant et de migration d’installation pendant que les flux de réparation migrent les opérateurs vers `openclaw plugins registry --refresh` et
  `openclaw doctor --fix`
- les anciens chemins de config de recherche web, de récupération web et de x_search détenus par les Plugins pendant que doctor les migre vers `plugins.entries.<plugin>.config`
- l’ancienne config rédigée `plugins.installs` et les alias de chemin de chargement des Plugins intégrés pendant que les métadonnées d’installation migrent vers le registre de Plugins géré par l’état

Le nouveau code de Plugin doit préférer le remplacement indiqué dans le registre et dans le guide de migration spécifique. Les Plugins existants peuvent continuer à utiliser un chemin de compatibilité jusqu’à ce que la documentation, les diagnostics et les notes de release annoncent une fenêtre de suppression.

## Notes de release

Les notes de release doivent inclure les dépréciations de Plugins à venir avec les dates cibles et les liens vers la documentation de migration. Cet avertissement doit avoir lieu avant qu’un chemin de compatibilité passe à `removal-pending` ou `removed`.
