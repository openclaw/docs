---
read_when:
    - Choisir un parcours d’intégration
    - Configuration d’un nouvel environnement
sidebarTitle: Onboarding Overview
summary: Présentation des options et des parcours d’intégration d’OpenClaw
title: Vue d’ensemble de la prise en main
x-i18n:
    generated_at: "2026-07-16T13:49:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4bcda1dcfb91f388ca6bef59f9bdf5177571d93c0d89c45025ef837628fa7ba0
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw propose un parcours d’intégration dans le terminal et dans l’app macOS. Les deux commencent par établir l’inférence :
ils détectent les accès existants à l’IA, exigent une complétion en direct, puis seulement
démarrent OpenClaw afin de configurer le reste de l’installation. Un Gateway accessible et configuré,
dont l’agent par défaut dispose déjà d’un modèle configuré, ignore l’intégration et ouvre
l’interface utilisateur normale de l’agent. Le parcours dans le terminal propose également l’assistant classique complet pour
une configuration détaillée.

## Quel parcours utiliser ?

|                 | Intégration via la CLI                     | Intégration via l’app macOS       |
| --------------- | ------------------------------------------ | --------------------------------- |
| **Plateformes** | macOS, Linux, Windows (natif ou WSL2)      | macOS uniquement                  |
| **Interface**   | Configuration de l’inférence, puis OpenClaw | Configuration de l’inférence, puis OpenClaw |
| **Idéal pour**  | Serveurs, sans interface graphique, contrôle total | Mac de bureau, configuration visuelle |
| **Automatisation** | `--non-interactive` pour les scripts     | Manuelle uniquement               |
| **Commande**    | `openclaw onboard`                         | Lancer l’app                      |

La plupart des utilisateurs devraient commencer par **l’intégration via la CLI** : elle fonctionne partout et vous offre
le plus de contrôle.

## Ce que configure l’intégration

La phase guidée d’inférence établit uniquement :

1. **Fournisseur de modèle et authentification** — accès détecté ou connexion vérifiée à un fournisseur,
   clé API ou jeton
2. **Inférence vérifiée** — une véritable complétion avec le modèle effectif
   de l’agent par défaut

Une fois cette complétion réussie, OpenClaw peut configurer l’espace de travail, le Gateway,
le service Gateway, les canaux, les agents, les plugins et d’autres fonctionnalités facultatives.

L’assistant CLI classique peut également configurer :

1. **Canaux** (facultatif) — canaux de discussion intégrés et fournis, tels que
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   Telegram, WhatsApp, et bien d’autres
2. **Contrôles avancés du Gateway** — mode distant, paramètres réseau et choix du démon

## Intégration via la CLI

Exécutez dans n’importe quel terminal :

```bash
openclaw onboard
```

Le parcours guidé détecte les accès existants à l’IA, teste en direct les candidats dans l’ordre,
et passe au suivant en cas d’échec. Si toutes les options détectées sont épuisées, il affiche d’abord OpenAI,
Anthropic, xAI (Grok), Google et OpenRouter. **Plus…** contient les
autres fournisseurs, regroupés par fournisseur, avec les régions, les offres et les méthodes prises en charge
par navigateur, appareil, clé API ou jeton dans un second menu. Il n’enregistre le modèle
et l’identifiant qu’après une complétion réussie, puis démarre OpenClaw afin de
configurer l’espace de travail, le Gateway, les canaux, les agents, les plugins et d’autres fonctionnalités
facultatives. **Ignorer pour le moment** quitte sans démarrer OpenClaw. Il n’existe aucun
passage au parcours classique en cours de processus ; quittez, puis exécutez `openclaw onboard --classic` si vous préférez
utiliser l’assistant classique.

Une fois l’inférence réussie, OpenClaw peut confier la configuration des canaux à un assistant
de terminal avec saisie masquée. Il n’ouvre pas la configuration guidée ou classique du fournisseur ; quittez OpenClaw et
exécutez `openclaw onboard` pour modifier le fournisseur de modèle ou son authentification.

Utilisez `openclaw onboard --classic` pour une configuration détaillée du modèle/de l’authentification, des canaux, des Skills,
du Gateway distant ou de l’importation. L’ajout de `--install-daemon` sélectionne également le
parcours classique et installe le service en arrière-plan en une seule étape. Utilisez `openclaw
openclaw` pour la configuration conversationnelle hors inférence et la réparation. `openclaw
onboard --modern` est un alias de compatibilité qui utilise la même étape obligatoire
d’inférence en direct.

Référence complète : [Intégration (CLI)](/fr/start/wizard)
Documentation de la commande CLI : [`openclaw onboard`](/fr/cli/onboard)

## Intégration via l’app macOS

Ouvrez l’app OpenClaw. Si son Gateway local ou distant configuré est accessible
et que l’agent par défaut dispose déjà d’un modèle configuré, l’app ignore l’intégration
et OpenClaw, puis ouvre immédiatement l’interface utilisateur normale de l’agent.

Pour un Gateway nouveau ou incomplet, le parcours de premier démarrage détecte les accès existants à l’IA
(Claude Code, Codex ou clés API), teste en direct la meilleure
option et ne l’enregistre qu’après une véritable réponse — en se rabattant automatiquement
sur une autre option et en proposant une étape manuelle vérifiée de saisie de clé API si rien n’est trouvé. Les identifiants
sensibles utilisent une saisie masquée. Une fois l’inférence réussie, OpenClaw démarre et
aide à configurer le reste.

Gemini CLI reste disponible pour les agents normaux après la configuration, mais n’est pas
proposé pour cette étape obligatoire d’inférence, car il ne peut pas imposer la sonde sans outil.

Référence complète : [Intégration (app macOS)](/fr/start/onboarding)

## Fournisseurs personnalisés ou non répertoriés

Si votre fournisseur n’est pas répertorié, exécutez `openclaw onboard --classic`, choisissez
**Fournisseur personnalisé**, puis saisissez :

- Compatibilité du point de terminaison : compatible avec OpenAI (`/chat/completions`), compatible avec OpenAI Responses (`/responses`), compatible avec Anthropic (`/messages`) ou inconnue (teste les trois et effectue une détection automatique)
- URL de base et clé API (la clé API est facultative si le point de terminaison n’en exige pas)
- ID du modèle et alias facultatif du modèle

Plusieurs points de terminaison personnalisés peuvent coexister — chacun reçoit son propre ID de point de terminaison.

## Pages connexes

- [Bien démarrer](/fr/start/getting-started)
- [Référence de configuration de la CLI](/fr/start/wizard-cli-reference)
