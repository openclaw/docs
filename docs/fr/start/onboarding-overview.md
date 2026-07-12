---
read_when:
    - Choisir un parcours d’intégration
    - Configuration d’un nouvel environnement
sidebarTitle: Onboarding Overview
summary: Présentation des options et des parcours d’intégration d’OpenClaw
title: Présentation de l’intégration
x-i18n:
    generated_at: "2026-07-12T15:51:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3460887108dc078c963802a32238133814afcc7d36b27eb4760280328ee070e5
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw propose une intégration initiale dans le terminal et dans l’app macOS. Toutes deux commencent par établir l’inférence :
elles détectent les accès à l’IA existants, exigent une génération effective, puis seulement
lancent Crestodian pour configurer le reste de l’installation. Si un Gateway accessible et configuré
dispose déjà d’un modèle configuré pour son agent par défaut, l’intégration initiale est ignorée et
l’interface utilisateur normale de l’agent s’ouvre. Le parcours dans le terminal propose également l’assistant classique complet pour
une configuration détaillée.

## Quel parcours utiliser ?

|                 | Intégration initiale avec la CLI                      | Intégration initiale avec l’app macOS |
| --------------- | ---------------------------------------------------- | ------------------------------------- |
| **Plateformes** | macOS, Linux, Windows (natif ou WSL2)                | macOS uniquement                      |
| **Interface**   | Configuration de l’inférence, puis Crestodian        | Configuration de l’inférence, puis Crestodian |
| **Idéal pour**  | Serveurs, sans interface graphique, contrôle complet | Mac de bureau, configuration visuelle |
| **Automatisation** | `--non-interactive` pour les scripts              | Manuelle uniquement                   |
| **Commande**    | `openclaw onboard`                                   | Lancer l’app                          |

La plupart des utilisateurs devraient commencer par **l’intégration initiale avec la CLI** — elle fonctionne
partout et vous offre le plus de contrôle.

## Ce que configure l’intégration initiale

La phase guidée d’inférence établit uniquement :

1. **Fournisseur de modèle et authentification** — accès détecté ou clé d’API vérifiée
2. **Inférence vérifiée** — une génération réelle avec le modèle effectif de
   l’agent par défaut

Une fois cette génération validée, Crestodian peut configurer l’espace de travail, le Gateway,
le service Gateway, les canaux, les agents, les plugins et d’autres fonctionnalités facultatives.

L’assistant CLI classique peut également configurer :

1. **Canaux** (facultatif) — canaux de discussion intégrés et fournis tels que
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   Telegram, WhatsApp, entre autres
2. **Contrôles avancés du Gateway** — mode distant, paramètres réseau et choix du démon

## Intégration initiale avec la CLI

Exécutez dans n’importe quel terminal :

```bash
openclaw onboard
```

Le parcours guidé détecte les accès à l’IA existants, teste effectivement les candidats dans l’ordre,
passe au suivant en cas d’échec et propose la saisie manuelle masquée d’une clé. Il enregistre le
modèle et l’identifiant uniquement après une génération réussie, puis lance Crestodian
pour configurer l’espace de travail, le Gateway, les canaux, les agents, les plugins et d’autres
fonctionnalités facultatives. Il n’existe aucun Crestodian avant l’inférence, aucun parcours permettant d’ignorer l’IA, ni
aucun transfert vers l’assistant classique au sein du parcours. Quittez et exécutez `openclaw onboard --classic` si vous
souhaitez plutôt utiliser l’assistant classique.

Une fois l’inférence validée, Crestodian peut confier la configuration des canaux à un assistant de terminal
avec saisie masquée. Il n’ouvre pas la configuration guidée ou classique des fournisseurs ; quittez Crestodian et
exécutez `openclaw onboard` pour modifier le fournisseur de modèle ou son authentification.

Utilisez `openclaw onboard --classic` pour une configuration détaillée du modèle et de l’authentification, des canaux, des Skills,
du Gateway distant ou de l’importation. L’ajout de `--install-daemon` sélectionne également le
parcours classique et installe le service en arrière-plan en une seule étape. Utilisez `openclaw
crestodian` pour une configuration et une réparation conversationnelles sans inférence. `openclaw
onboard --modern` est un alias de compatibilité qui utilise la même
étape de validation par inférence effective.

Référence complète : [Intégration initiale (CLI)](/fr/start/wizard)
Documentation de la commande CLI : [`openclaw onboard`](/fr/cli/onboard)

## Intégration initiale avec l’app macOS

Ouvrez l’app OpenClaw. Si son Gateway local ou distant configuré est accessible
et que l’agent par défaut dispose déjà d’un modèle configuré, l’app ignore l’intégration initiale
et Crestodian, puis ouvre immédiatement l’interface utilisateur normale de l’agent.

Pour un Gateway nouveau ou incomplet, le parcours de première exécution détecte les accès à l’IA
existants (Claude Code, Codex ou clés d’API), teste effectivement la meilleure
option et ne l’enregistre qu’après une réponse réelle — en passant automatiquement à une solution de repli et
en proposant une étape vérifiée de saisie manuelle d’une clé d’API si aucun accès n’est trouvé. Les identifiants
sensibles utilisent une saisie masquée. Une fois l’inférence validée, Crestodian démarre et
aide à configurer le reste.

Gemini CLI reste disponible pour les agents normaux après la configuration, mais n’est pas
proposé pour cette étape de validation de l’inférence, car il ne peut pas imposer la requête de test sans outil.

Référence complète : [Intégration initiale (app macOS)](/fr/start/onboarding)

## Fournisseurs personnalisés ou non répertoriés

Si votre fournisseur n’est pas répertorié, exécutez `openclaw onboard --classic`, choisissez
**Fournisseur personnalisé**, puis saisissez :

- Compatibilité du point de terminaison : compatible avec OpenAI (`/chat/completions`), compatible avec OpenAI Responses (`/responses`), compatible avec Anthropic (`/messages`) ou inconnue (teste les trois et effectue une détection automatique)
- URL de base et clé d’API (la clé d’API est facultative si le point de terminaison n’en exige pas)
- ID du modèle et alias de modèle facultatif

Plusieurs points de terminaison personnalisés peuvent coexister — chacun reçoit son propre ID de point de terminaison.

## Ressources associées

- [Bien démarrer](/fr/start/getting-started)
- [Référence de configuration avec la CLI](/fr/start/wizard-cli-reference)
