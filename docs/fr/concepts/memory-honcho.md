---
read_when:
    - Vous souhaitez une mémoire persistante qui fonctionne entre les sessions et les canaux
    - Vous souhaitez bénéficier d’une mémorisation et d’une modélisation des utilisateurs basées sur l’IA
summary: Mémoire intersessions native de l’IA via le plugin Honcho
title: Mémoire Honcho
x-i18n:
    generated_at: "2026-07-12T15:12:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fadcf6d8e2505ab4fe6a81340695b7c8fee49c3cb4889665af13389941619117
    source_path: concepts/memory-honcho.md
    workflow: 16
---

[Honcho](https://honcho.dev) ajoute à OpenClaw une mémoire native pour l’IA par l’intermédiaire d’un
plugin externe. Il conserve les conversations dans un service dédié et construit
au fil du temps des modèles de l’utilisateur et de l’agent, fournissant à votre agent un contexte intersession qui
va au-delà des fichiers Markdown de l’espace de travail.

## Fonctionnalités

- **Mémoire intersession** - les conversations sont conservées après chaque tour, de sorte que le
  contexte est maintenu lors des réinitialisations de session, de la Compaction et des changements de canal.
- **Modélisation de l’utilisateur** - Honcho maintient un profil pour chaque utilisateur (préférences,
  faits, style de communication) et pour l’agent (personnalité, comportements
  appris).
- **Recherche sémantique** - effectuez des recherches dans les observations issues des conversations passées, et pas
  seulement dans la session actuelle.
- **Connaissance multi-agent** - les agents parents suivent automatiquement les
  sous-agents générés, les parents étant ajoutés comme observateurs dans les sessions enfants.

## Outils disponibles

Honcho enregistre des outils que l’agent peut utiliser pendant la conversation :

**Récupération de données (rapide, sans appel au LLM) :**

| Outil                       | Fonction                                               |
| --------------------------- | ------------------------------------------------------ |
| `honcho_context`            | Représentation complète de l’utilisateur entre les sessions |
| `honcho_search_conclusions` | Recherche sémantique dans les conclusions enregistrées |
| `honcho_search_messages`    | Recherche de messages entre les sessions (filtrage par expéditeur et date) |
| `honcho_session`            | Historique et résumé de la session actuelle            |

**Questions-réponses (optimisées par un LLM) :**

| Outil        | Fonction                                                                    |
| ------------ | --------------------------------------------------------------------------- |
| `honcho_ask` | Pose une question sur l’utilisateur. `depth='quick'` pour les faits, `'thorough'` pour la synthèse |

## Prise en main

Installez le plugin et lancez la configuration :

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

La commande de configuration vous demande vos identifiants d’API, écrit la configuration et
peut éventuellement migrer les fichiers de mémoire existants de l’espace de travail.

<Info>
Honcho peut s’exécuter entièrement en local (auto-hébergé) ou par l’intermédiaire de l’API gérée à l’adresse
`api.honcho.dev`. Aucune dépendance externe n’est requise pour l’option
auto-hébergée.
</Info>

## Configuration

Les paramètres se trouvent sous `plugins.entries["openclaw-honcho"].config` :

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // omettre pour l’auto-hébergement
          workspaceId: "openclaw", // isolation de la mémoire
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

Pour les instances auto-hébergées, définissez `baseUrl` sur votre serveur local (par exemple
`http://localhost:8000`) et omettez la clé API.

## Migration de la mémoire existante

Si vous disposez de fichiers de mémoire existants dans l’espace de travail (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), `openclaw honcho setup` les détecte et
propose de les migrer.

<Info>
La migration est non destructive : les fichiers sont téléversés vers Honcho. Les originaux ne sont
jamais supprimés ni déplacés.
</Info>

## Fonctionnement

Après chaque tour de l’IA, la conversation est conservée dans Honcho. Les messages de l’utilisateur et de
l’agent sont tous deux observés, ce qui permet à Honcho de construire et d’affiner ses modèles au
fil du temps.

Pendant la conversation, les outils Honcho interrogent le service via le hook de plugin
`before_prompt_build` d’OpenClaw, en injectant le contexte pertinent avant que le modèle
ne voie le prompt.

## Honcho par rapport à la mémoire intégrée

|                   | Intégrée / QMD               | Honcho                              |
| ----------------- | ---------------------------- | ----------------------------------- |
| **Stockage**      | Fichiers Markdown de l’espace de travail | Service dédié (local ou hébergé) |
| **Intersession**  | Via les fichiers de mémoire  | Automatique, intégré                |
| **Modélisation de l’utilisateur** | Manuelle (écriture dans MEMORY.md) | Profils automatiques |
| **Recherche**     | Vectorielle + mots-clés (hybride) | Sémantique dans les observations |
| **Multi-agent**   | Non suivi                    | Connaissance des relations parent/enfant |
| **Dépendances**   | Aucune (intégrée) ou binaire QMD | Installation du plugin          |

Honcho et le système de mémoire intégré peuvent fonctionner conjointement. Lorsque QMD est
configuré, des outils supplémentaires permettent de rechercher dans les fichiers Markdown locaux
en parallèle de la mémoire intersession de Honcho.

## Commandes CLI

```bash
openclaw honcho setup                        # Configurer la clé API et migrer les fichiers
openclaw honcho status                       # Vérifier l’état de la connexion
openclaw honcho ask <question>               # Interroger Honcho au sujet de l’utilisateur
openclaw honcho search <query> [-k N] [-d D] # Recherche sémantique dans la mémoire
```

## Pour aller plus loin

- [Code source du plugin](https://github.com/plastic-labs/openclaw-honcho)
- [Documentation de Honcho](https://docs.honcho.dev)
- [Guide d’intégration de Honcho à OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)

## Pages connexes

- [Présentation de la mémoire](/fr/concepts/memory)
- [Moteur de mémoire intégré](/fr/concepts/memory-builtin)
- [Moteur de mémoire QMD](/fr/concepts/memory-qmd)
- [Moteurs de contexte](/fr/concepts/context-engine)
