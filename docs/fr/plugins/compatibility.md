---
read_when:
    - Vous maintenez un Plugin OpenClaw
    - Vous voyez un avertissement de compatibilité de Plugin
    - Vous planifiez une migration du SDK Plugin ou du manifeste
summary: Contrats de compatibilité Plugin, métadonnées d’obsolescence et attentes de migration
title: Compatibilité des Plugins
x-i18n:
    generated_at: "2026-05-02T07:13:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: eecf94743cf34c5b773bfa8066164f90b7c8a75667c43f3f1002d32ec1d04902
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw conserve les anciens contrats de plugins câblés via des adaptateurs de compatibilité nommés avant de les supprimer. Cela protège les plugins groupés et externes existants pendant que les contrats du SDK, du manifeste, de la configuration initiale, de la configuration et de l’environnement d’exécution des agents évoluent.

## Registre de compatibilité

Les contrats de compatibilité des plugins sont suivis dans le registre principal à l’emplacement
`src/plugins/compat/registry.ts`.

Chaque enregistrement contient :

- un code de compatibilité stable
- statut : `active`, `deprecated`, `removal-pending` ou `removed`
- propriétaire : SDK, configuration, configuration initiale, canal, fournisseur, exécution de plugin, environnement d’exécution d’agent,
  ou noyau
- dates d’introduction et de dépréciation, le cas échéant
- recommandations de remplacement
- documentation, diagnostics et tests couvrant l’ancien et le nouveau comportement

Le registre est la source pour la planification des mainteneurs et les futures vérifications de l’inspecteur de plugins. Si un comportement visible par les plugins change, ajoutez ou mettez à jour l’enregistrement de compatibilité dans le même changement que celui qui ajoute l’adaptateur.

La compatibilité des réparations et migrations de doctor est suivie séparément à l’emplacement
`src/commands/doctor/shared/deprecation-compat.ts`. Ces enregistrements couvrent les anciennes formes de configuration, les dispositions de registre d’installation et les shims de réparation qui peuvent devoir rester disponibles après la suppression du chemin de compatibilité d’exécution.

Les balayages de version doivent vérifier les deux registres. Ne supprimez pas une migration doctor simplement parce que l’enregistrement de compatibilité d’exécution ou de configuration correspondant a expiré ; vérifiez d’abord qu’aucun chemin de mise à niveau pris en charge n’a encore besoin de la réparation. Revalidez également chaque annotation de remplacement pendant la planification de version, car la propriété des plugins et l’empreinte de configuration peuvent changer à mesure que les fournisseurs et les canaux sortent du noyau.

## Paquet d’inspecteur de plugins

L’inspecteur de plugins doit vivre en dehors du dépôt principal OpenClaw sous forme de paquet/dépôt séparé, adossé aux contrats de compatibilité et de manifeste versionnés.

La CLI du premier jour doit être :

```sh
openclaw-plugin-inspector ./my-plugin
```

Elle doit émettre :

- validation du manifeste/schéma
- la version de compatibilité du contrat en cours de vérification
- vérifications des métadonnées d’installation/source
- vérifications d’importation du chemin froid
- avertissements de dépréciation et de compatibilité

Utilisez `--json` pour une sortie stable lisible par machine dans les annotations de CI. Le noyau OpenClaw doit exposer des contrats et des fixtures que l’inspecteur peut consommer, mais ne doit pas publier le binaire de l’inspecteur depuis le paquet principal `openclaw`.

### Voie d’acceptation des mainteneurs

Utilisez Blacksmith Testbox pour la voie d’acceptation du paquet installable lors de la validation de l’inspecteur externe avec les paquets de plugins OpenClaw. Exécutez-la depuis un checkout OpenClaw propre après la construction du paquet :

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

Gardez cette voie facultative pour les mainteneurs, car elle installe un paquet npm externe et peut inspecter des paquets de plugins clonés en dehors du dépôt. Les garde-fous du dépôt local couvrent la carte d’export du SDK, les métadonnées du registre de compatibilité, la réduction des importations SDK obsolètes et les frontières d’importation des extensions groupées ; la preuve de l’inspecteur Testbox couvre le paquet tel que les auteurs de plugins externes le consomment.

## Politique de dépréciation

OpenClaw ne doit pas supprimer un contrat de plugin documenté dans la même version que celle qui introduit son remplacement.

La séquence de migration est :

1. Ajouter le nouveau contrat.
2. Conserver l’ancien comportement câblé via un adaptateur de compatibilité nommé.
3. Émettre des diagnostics ou des avertissements lorsque les auteurs de plugins peuvent agir.
4. Documenter le remplacement et le calendrier.
5. Tester les anciens et les nouveaux chemins.
6. Attendre pendant la fenêtre de migration annoncée.
7. Supprimer uniquement avec une approbation explicite de version incompatible.

Les enregistrements obsolètes doivent inclure une date de début d’avertissement, un remplacement, un lien de documentation et une date de suppression finale au plus tard trois mois après le début de l’avertissement. N’ajoutez pas de chemin de compatibilité obsolète avec une fenêtre de suppression ouverte, sauf si les mainteneurs décident explicitement qu’il s’agit d’une compatibilité permanente et le marquent plutôt comme `active`.

## Zones de compatibilité actuelles

Les enregistrements de compatibilité actuels incluent :

- anciennes importations SDK larges telles que `openclaw/plugin-sdk/compat`
- anciennes formes de plugins limitées aux hooks et `before_agent_start`
- anciens points d’entrée de plugins `activate(api)` pendant que les plugins migrent vers
  `register(api)`
- anciens alias SDK tels que `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, générateurs de statut `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` (remplacé par des sous-chemins de test
  `openclaw/plugin-sdk/*` ciblés), ainsi que les alias de type `ClawdbotConfig` /
  `OpenClawSchemaType`
- comportement d’autorisation et d’activation des plugins groupés
- anciennes métadonnées de manifeste de variables d’environnement de fournisseur/canal
- anciens hooks de plugins de fournisseurs et alias de type pendant que les fournisseurs passent à des hooks explicites de catalogue, d’authentification, de réflexion, de relecture et de transport
- anciens alias d’exécution tels que `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt`, et les
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)` obsolètes
- ancien enregistrement scindé des plugins mémoire pendant que les plugins mémoire passent à
  `registerMemoryCapability`
- anciens assistants SDK de canal pour les schémas de messages natifs, le filtrage des mentions, la mise en forme des enveloppes entrantes et l’imbrication des capacités d’approbation
- ancienne clé de route de canal et alias d’assistants de cible comparable pendant que les plugins passent à `openclaw/plugin-sdk/channel-route`
- indications d’activation remplacées par la propriété des contributions du manifeste
- repli d’exécution `setup-api` pendant que les descripteurs de configuration initiale passent aux métadonnées froides
  `setup.requiresRuntime: false`
- hooks `discovery` de fournisseur pendant que les hooks de catalogue de fournisseur passent à
  `catalog.run(...)`
- métadonnées de canal `showConfigured` / `showInSetup` pendant que les paquets de canal passent à
  `openclaw.channel.exposure`
- anciennes clés de configuration de politique d’exécution pendant que doctor migre les opérateurs vers
  `agentRuntime`
- repli des métadonnées de configuration de canal groupé générées pendant l’arrivée des métadonnées
  `channelConfigs` axées d’abord sur le registre
- indicateurs d’environnement persistants de désactivation du registre de plugins et de migration d’installation pendant que les flux de réparation migrent les opérateurs vers `openclaw plugins registry --refresh` et
  `openclaw doctor --fix`
- anciens chemins de configuration de recherche web, récupération web et x_search appartenant à des plugins pendant que doctor les migre vers `plugins.entries.<plugin>.config`
- ancienne configuration rédigée `plugins.installs` et alias de chemin de chargement de plugins groupés pendant que les métadonnées d’installation passent dans le registre de plugins géré par l’état

Le nouveau code de plugin doit privilégier le remplacement indiqué dans le registre et dans le guide de migration spécifique. Les plugins existants peuvent continuer à utiliser un chemin de compatibilité jusqu’à ce que la documentation, les diagnostics et les notes de version annoncent une fenêtre de suppression.

## Notes de version

Les notes de version doivent inclure les prochaines dépréciations de plugins avec des dates cibles et des liens vers la documentation de migration. Cet avertissement doit avoir lieu avant qu’un chemin de compatibilité ne passe à `removal-pending` ou `removed`.
