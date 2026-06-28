---
read_when:
    - Vous voulez une mémoire persistante qui fonctionne entre les sessions et les canaux
    - Vous voulez un rappel piloté par l’IA et une modélisation utilisateur
summary: mémoire inter-sessions native pour l’IA via le Plugin Honcho
title: mémoire Honcho
x-i18n:
    generated_at: "2026-04-24T07:06:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: d77af5c7281a4abafc184e426b1c37205a6d06a196b50353c1abbf67cc93bb97
    source_path: concepts/memory-honcho.md
    workflow: 15
    postprocess_version: locale-links-v1
---

[Honcho](https://honcho.dev) ajoute une mémoire native pour l’IA à OpenClaw. Il persiste
les conversations dans un service dédié et construit au fil du temps des modèles utilisateur et agent,
offrant à votre agent un contexte inter-sessions qui va au-delà des fichiers Markdown
de l’espace de travail.

## Ce qu’il fournit

- **Mémoire inter-sessions** -- les conversations sont persistées après chaque tour, de sorte que
  le contexte est conservé entre les réinitialisations de session, la Compaction et les changements de canal.
- **Modélisation utilisateur** -- Honcho maintient un profil pour chaque utilisateur (préférences,
  faits, style de communication) et pour l’agent (personnalité, comportements
  appris).
- **Recherche sémantique** -- recherche dans les observations issues des conversations passées, et pas
  seulement dans la session courante.
- **Conscience multi-agent** -- les agents parents suivent automatiquement les
  sous-agents générés, avec les parents ajoutés comme observateurs dans les sessions enfants.

## Outils disponibles

Honcho enregistre des outils que l’agent peut utiliser pendant la conversation :

**Récupération de données (rapide, sans appel LLM) :**

| Outil                       | Ce qu’il fait                                         |
| --------------------------- | ----------------------------------------------------- |
| `honcho_context`            | Représentation complète de l’utilisateur entre les sessions |
| `honcho_search_conclusions` | Recherche sémantique dans les conclusions stockées    |
| `honcho_search_messages`    | Trouver des messages entre les sessions (filtrer par expéditeur, date) |
| `honcho_session`            | Historique et résumé de la session courante           |

**Questions-réponses (piloté par LLM) :**

| Outil        | Ce qu’il fait                                                            |
| ------------ | ------------------------------------------------------------------------ |
| `honcho_ask` | Poser une question sur l’utilisateur. `depth='quick'` pour les faits, `'thorough'` pour la synthèse |

## Premiers pas

Installez le Plugin et exécutez la configuration :

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

La commande de configuration demande vos identifiants d’API, écrit la configuration et
migre éventuellement les fichiers mémoire existants de l’espace de travail.

<Info>
Honcho peut fonctionner entièrement en local (auto-hébergé) ou via l’API gérée à
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

Pour les instances auto-hébergées, pointez `baseUrl` vers votre serveur local (par exemple
`http://localhost:8000`) et omettez la clé API.

## Migration de la mémoire existante

Si vous avez des fichiers mémoire existants dans l’espace de travail (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), `openclaw honcho setup` les détecte et
propose de les migrer.

<Info>
La migration est non destructive -- les fichiers sont téléversés vers Honcho. Les originaux
ne sont jamais supprimés ni déplacés.
</Info>

## Fonctionnement

Après chaque tour IA, la conversation est persistée dans Honcho. Les messages utilisateur et
agent sont tous deux observés, ce qui permet à Honcho de construire et d’affiner ses modèles au fil
du temps.

Pendant la conversation, les outils Honcho interrogent le service dans la phase `before_prompt_build`,
injectant le contexte pertinent avant que le modèle ne voie le prompt. Cela garantit
des frontières de tour précises et un rappel pertinent.

## Honcho vs mémoire intégrée

|                   | Intégrée / QMD                | Honcho                              |
| ----------------- | ----------------------------- | ----------------------------------- |
| **Stockage**      | Fichiers Markdown d’espace de travail | Service dédié (local ou hébergé) |
| **Inter-sessions** | Via les fichiers mémoire     | Automatique, intégré                |
| **Modélisation utilisateur** | Manuelle (écrire dans `MEMORY.md`) | Profils automatiques         |
| **Recherche**     | Vecteur + mot-clé (hybride)   | Sémantique sur les observations     |
| **Multi-agent**   | Non suivi                     | Conscience parent/enfant            |
| **Dépendances**   | Aucune (intégrée) ou binaire QMD | Installation de Plugin           |

Honcho et le système de mémoire intégré peuvent fonctionner ensemble. Lorsque QMD est configuré,
des outils supplémentaires deviennent disponibles pour rechercher dans les fichiers Markdown locaux en plus
de la mémoire inter-sessions de Honcho.

## Commandes CLI

```bash
openclaw honcho setup                        # Configurer la clé API et migrer les fichiers
openclaw honcho status                       # Vérifier l’état de connexion
openclaw honcho ask <question>               # Interroger Honcho au sujet de l’utilisateur
openclaw honcho search <query> [-k N] [-d D] # Recherche sémantique dans la mémoire
```

## Pour aller plus loin

- [Code source du Plugin](https://github.com/plastic-labs/openclaw-honcho)
- [Documentation Honcho](https://docs.honcho.dev)
- [Guide d’intégration Honcho OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)
- [Mémoire](/fr/concepts/memory) -- vue d’ensemble de la mémoire OpenClaw
- [Moteurs de contexte](/fr/concepts/context-engine) -- fonctionnement des moteurs de contexte de Plugin

## Liens associés

- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Moteur de mémoire intégré](/fr/concepts/memory-builtin)
- [Moteur de mémoire QMD](/fr/concepts/memory-qmd)
