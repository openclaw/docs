---
read_when:
    - Vous maintenez un Plugin OpenClaw
    - Vous voyez un avertissement de compatibilité de Plugin
    - Vous planifiez une migration du SDK de Plugin ou du manifeste
summary: Contrats de compatibilité Plugin, métadonnées de dépréciation et attentes de migration
title: Compatibilité des Plugins
x-i18n:
    generated_at: "2026-05-11T20:45:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1afd37697f55721ca8419256a6e8187c398d4b20fb11a65776b755050dd5368b
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw conserve les anciens contrats de Plugin câblés via des adaptateurs de compatibilité nommés avant de les supprimer. Cela protège les Plugins intégrés et externes existants pendant que les contrats du SDK, du manifeste, de la configuration initiale, de la configuration et du runtime d’agent évoluent.

## Registre de compatibilité

Les contrats de compatibilité des Plugins sont suivis dans le registre principal à
`src/plugins/compat/registry.ts`.

Chaque enregistrement comporte :

- un code de compatibilité stable
- un statut : `active`, `deprecated`, `removal-pending` ou `removed`
- un propriétaire : SDK, configuration, configuration initiale, canal, fournisseur, exécution du Plugin, runtime d’agent,
  ou cœur
- des dates d’introduction et de dépréciation le cas échéant
- des consignes de remplacement
- la documentation, les diagnostics et les tests qui couvrent l’ancien et le nouveau comportement

Le registre est la source pour la planification des mainteneurs et les futurs contrôles de l’inspecteur de Plugins. Si un comportement exposé aux Plugins change, ajoutez ou mettez à jour l’enregistrement de compatibilité dans la même modification que celle qui ajoute l’adaptateur.

La compatibilité des réparations et migrations de doctor est suivie séparément dans
`src/commands/doctor/shared/deprecation-compat.ts`. Ces enregistrements couvrent les anciennes formes de configuration, les agencements de journal d’installation et les shims de réparation qui peuvent devoir rester disponibles après la suppression du chemin de compatibilité du runtime.

Les balayages de release doivent vérifier les deux registres. Ne supprimez pas une migration doctor simplement parce que l’enregistrement de compatibilité runtime ou configuration correspondant a expiré ; vérifiez d’abord qu’aucun chemin de mise à niveau pris en charge n’a encore besoin de la réparation. Revalidez aussi chaque annotation de remplacement pendant la planification de release, car la propriété des Plugins et l’empreinte de configuration peuvent changer à mesure que les fournisseurs et les canaux sortent du cœur.

## Package d’inspecteur de Plugins

L’inspecteur de Plugins doit vivre en dehors du dépôt OpenClaw principal en tant que package/dépôt séparé, adossé aux contrats de compatibilité et de manifeste versionnés.

La CLI du premier jour doit être :

```sh
openclaw-plugin-inspector ./my-plugin
```

Elle doit émettre :

- une validation de manifeste/schéma
- la version de compatibilité de contrat vérifiée
- des contrôles de métadonnées d’installation/source
- des contrôles d’importation en chemin froid
- des avertissements de dépréciation et de compatibilité

Utilisez `--json` pour une sortie stable lisible par machine dans les annotations CI. Le cœur d’OpenClaw doit exposer les contrats et fixtures que l’inspecteur peut consommer, mais ne doit pas publier le binaire de l’inspecteur depuis le package `openclaw` principal.

### Voie d’acceptation des mainteneurs

Utilisez le Blacksmith Testbox adossé à Crabbox pour la voie d’acceptation de package installable lors de la validation de l’inspecteur externe avec les packages de Plugins OpenClaw. Exécutez-la depuis un checkout OpenClaw propre après la construction du package :

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Gardez cette voie optionnelle pour les mainteneurs, car elle installe un package npm externe et peut inspecter des packages de Plugins clonés en dehors du dépôt. Les garde-fous du dépôt local couvrent la carte d’exports du SDK, les métadonnées du registre de compatibilité, la réduction des imports SDK dépréciés et les limites d’importation des extensions intégrées ; la preuve de l’inspecteur Testbox couvre le package tel que les auteurs de Plugins externes le consomment.

## Politique de dépréciation

OpenClaw ne doit pas supprimer un contrat de Plugin documenté dans la même release que celle qui introduit son remplacement.

La séquence de migration est :

1. Ajouter le nouveau contrat.
2. Garder l’ancien comportement câblé via un adaptateur de compatibilité nommé.
3. Émettre des diagnostics ou des avertissements lorsque les auteurs de Plugins peuvent agir.
4. Documenter le remplacement et le calendrier.
5. Tester les anciens et nouveaux chemins.
6. Attendre pendant la fenêtre de migration annoncée.
7. Supprimer uniquement avec une approbation explicite de release avec breaking change.

Les enregistrements dépréciés doivent inclure une date de début d’avertissement, un remplacement, un lien de documentation et une date de suppression finale au plus tard trois mois après le début de l’avertissement. N’ajoutez pas de chemin de compatibilité déprécié avec une fenêtre de suppression ouverte, sauf si les mainteneurs décident explicitement qu’il s’agit d’une compatibilité permanente et le marquent plutôt comme `active`.

## Zones de compatibilité actuelles

Les enregistrements de compatibilité actuels incluent :

- les anciens imports SDK larges tels que `openclaw/plugin-sdk/compat`
- les anciennes formes de Plugins uniquement à hooks et `before_agent_start`
- les anciens points d’entrée de Plugin `activate(api)` pendant que les Plugins migrent vers
  `register(api)`
- les anciens alias SDK tels que `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, les builders de statut `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` (remplacé par des sous-chemins de test ciblés
  `openclaw/plugin-sdk/*`) et les alias de type `ClawdbotConfig` /
  `OpenClawSchemaType`
- le comportement de allowlist et d’activation des Plugins intégrés
- les anciennes métadonnées de manifeste de variables d’environnement fournisseur/canal
- les anciens hooks et alias de type de Plugins fournisseur pendant que les fournisseurs migrent vers
  des hooks explicites de catalogue, d’authentification, de réflexion, de replay et de transport
- les anciens alias de runtime tels que `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` et les
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
  dépréciés
- l’ancien enregistrement scindé des Plugins mémoire pendant que les Plugins mémoire migrent vers
  `registerMemoryCapability`
- les anciens helpers SDK de canal pour les schémas de messages natifs, le filtrage des mentions,
  le formatage d’enveloppes entrantes et l’imbrication des capacités d’approbation
- les anciens alias de clé de route de canal et de helpers de cible comparable pendant que les Plugins
  migrent vers `openclaw/plugin-sdk/channel-route`
- les indices d’activation remplacés par la propriété des contributions de manifeste
- le fallback runtime `setup-api` pendant que les descripteurs de configuration initiale migrent vers les métadonnées froides
  `setup.requiresRuntime: false`
- les hooks `discovery` de fournisseur pendant que les hooks de catalogue de fournisseur migrent vers
  `catalog.run(...)`
- les métadonnées de canal `showConfigured` / `showInSetup` pendant que les packages de canal migrent
  vers `openclaw.channel.exposure`
- les anciennes clés de configuration runtime-policy pendant que doctor migre les opérateurs vers
  `agentRuntime`
- le fallback de métadonnées générées de configuration des canaux intégrés pendant que les métadonnées `channelConfigs`
  axées d’abord sur le registre arrivent
- les indicateurs d’environnement persistés de désactivation du registre de Plugins et de migration d’installation pendant que
  les flux de réparation migrent les opérateurs vers `openclaw plugins registry --refresh` et
  `openclaw doctor --fix`
- les anciens chemins de configuration de recherche web, de récupération web et de x_search possédés par un Plugin pendant que
  doctor les migre vers `plugins.entries.<plugin>.config`
- l’ancienne configuration rédigée `plugins.installs` et les alias de chemin de chargement des Plugins intégrés pendant que les métadonnées d’installation migrent vers le journal de Plugins géré par l’état

Le nouveau code de Plugin doit préférer le remplacement indiqué dans le registre et dans le guide de migration spécifique. Les Plugins existants peuvent continuer à utiliser un chemin de compatibilité jusqu’à ce que la documentation, les diagnostics et les notes de release annoncent une fenêtre de suppression.

## Notes de release

Les notes de release doivent inclure les dépréciations de Plugins à venir avec des dates cibles et des liens vers la documentation de migration. Cet avertissement doit avoir lieu avant qu’un chemin de compatibilité passe à `removal-pending` ou `removed`.
