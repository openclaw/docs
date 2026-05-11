---
read_when:
    - Choisir un parcours d’intégration
    - Configurer un nouvel environnement
sidebarTitle: Onboarding Overview
summary: Aperçu des options et des flux d’intégration d’OpenClaw
title: Vue d’ensemble de l’intégration
x-i18n:
    generated_at: "2026-05-11T20:55:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9b375b9090250992b9deead25ae6502592cb63c9774204782b2d4f69d8f3395
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw propose deux parcours de configuration initiale. Tous deux configurent l’authentification, le Gateway et
les canaux de discussion optionnels — ils diffèrent seulement par la façon dont vous interagissez avec la configuration.

## Quel parcours dois-je utiliser ?

|                | Configuration initiale via CLI          | Configuration initiale dans l’app macOS |
| -------------- | --------------------------------------- | --------------------------------------- |
| **Plateformes** | macOS, Linux, Windows (natif ou WSL2)  | macOS uniquement                        |
| **Interface**  | Assistant dans le terminal              | Interface guidée dans l’app             |
| **Idéal pour** | Serveurs, sans interface graphique, contrôle complet | Mac de bureau, configuration visuelle |
| **Automatisation** | `--non-interactive` pour les scripts | Manuel uniquement                       |
| **Commande**   | `openclaw onboard`                      | Lancer l’app                            |

La plupart des utilisateurs devraient commencer par la **configuration initiale via CLI** — elle fonctionne partout et vous donne
le plus de contrôle.

## Ce que configure la configuration initiale

Quel que soit le parcours choisi, la configuration initiale met en place :

1. **Fournisseur de modèle et authentification** — clé d’API, OAuth ou jeton de configuration pour le fournisseur choisi
2. **Espace de travail** — répertoire pour les fichiers d’agent, les modèles de démarrage et la mémoire
3. **Gateway** — port, adresse de liaison, mode d’authentification
4. **Canaux** (facultatif) — canaux de discussion intégrés et inclus, tels que
   iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp, et d’autres
5. **Démon** (facultatif) — service en arrière-plan pour que le Gateway démarre automatiquement

## Configuration initiale via CLI

Exécutez dans n’importe quel terminal :

```bash
openclaw onboard
```

Ajoutez `--install-daemon` pour installer également le service en arrière-plan en une seule étape.

Référence complète : [Configuration initiale (CLI)](/fr/start/wizard)
Documentation de la commande CLI : [`openclaw onboard`](/fr/cli/onboard)

## Configuration initiale dans l’app macOS

Ouvrez l’app OpenClaw. L’assistant de premier lancement vous guide à travers les mêmes étapes
avec une interface visuelle.

Référence complète : [Configuration initiale (app macOS)](/fr/start/onboarding)

## Fournisseurs personnalisés ou non répertoriés

Si votre fournisseur n’est pas listé dans la configuration initiale, choisissez **Fournisseur personnalisé** et
saisissez :

- Mode de compatibilité API (compatible OpenAI, compatible Anthropic ou détection automatique)
- URL de base et clé d’API
- ID du modèle et alias facultatif

Plusieurs points de terminaison personnalisés peuvent coexister — chacun reçoit son propre ID de point de terminaison.

## Liens connexes

- [Premiers pas](/fr/start/getting-started)
- [Référence de configuration CLI](/fr/start/wizard-cli-reference)
