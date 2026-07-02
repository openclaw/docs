---
read_when: Finding which docs page covers a topic before reading the page
summary: Carte des titres générée pour les pages de documentation OpenClaw
title: Carte de la documentation
x-i18n:
    generated_at: "2026-07-02T00:53:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 504b554aa699d78c9a3c958d3c724949efdac172cf4a7a0f343c3a3e9bb8c3d7
    source_path: docs_map.md
    workflow: 16
---

# Carte de la documentation OpenClaw

Ce fichier est généré à partir des titres de `docs/**/*.md` et `docs/**/*.mdx` pour aider les agents à parcourir l’arborescence de la documentation.
Ne le modifiez pas à la main ; exécutez `pnpm docs:map:gen`.

## agent-runtime-architecture.md

- Itinéraire : /agent-runtime-architecture
- Titres :
  - H2: Agencement de l’environnement d’exécution
  - H2: Limites
  - H2: Manifestes
  - H2: Sélection de l’environnement d’exécution
  - H2: Connexe

## announcements/bluebubbles-imessage.md

- Itinéraire : /announcements/bluebubbles-imessage
- Titres :
  - H1: Suppression de BlueBubbles et chemin iMessage imsg
  - H2: Ce qui a changé
  - H2: Que faire
  - H2: Notes de migration
  - H2: Voir aussi

## auth-credential-semantics.md

- Itinéraire : /auth-credential-semantics
- Titres :
  - H2: Codes de raison stables pour les sondes
  - H2: Identifiants par jeton
  - H3: Règles d’éligibilité
  - H3: Règles de résolution
  - H2: Portabilité des copies d’agent
  - H2: Routes d’authentification uniquement par configuration
  - H2: Filtrage explicite de l’ordre d’authentification
  - H2: Résolution de la cible de sonde
  - H2: Découverte des identifiants CLI externes
  - H2: Garde de politique OAuth SecretRef
  - H2: Messagerie compatible avec l’héritage
  - H2: Connexe

## automation/auth-monitoring.md

- Itinéraire : /automation/auth-monitoring
- Titres :
  - H2: Connexe

## automation/clawflow.md

- Itinéraire : /automation/clawflow
- Titres :
  - H2: Connexe

## automation/cron-jobs.md

- Itinéraire : /automation/cron-jobs
- Titres :
  - H2: Démarrage rapide
  - H2: Fonctionnement de Cron
  - H2: Types de planification
  - H3: Le jour du mois et le jour de la semaine utilisent une logique OU
  - H2: Styles d’exécution
  - H3: Charges utiles de commande
  - H3: Options de charge utile pour les tâches isolées
  - H2: Livraison et sortie
  - H2: Langue de sortie
  - H2: Exemples CLI
  - H2: Webhooks
  - H3: Authentification
  - H2: Intégration Gmail PubSub
  - H3: Configuration par assistant (recommandée)
  - H3: Démarrage automatique du Gateway
  - H3: Configuration manuelle unique
  - H3: Remplacement du modèle Gmail
  - H2: Gestion des tâches
  - H2: Configuration
  - H2: Dépannage
  - H3: Échelle de commandes
  - H2: Connexe

## automation/cron-vs-heartbeat.md

- Itinéraire : /automation/cron-vs-heartbeat
- Titres :
  - H2: Connexe

## automation/gmail-pubsub.md

- Itinéraire : /automation/gmail-pubsub
- Titres :
  - H2: Connexe

## automation/hooks.md

- Itinéraire : /automation/hooks
- Titres :
  - H2: Choisir la bonne surface
  - H2: Démarrage rapide
  - H2: Types d’événements
  - H2: Écriture des hooks
  - H3: Structure d’un hook
  - H3: Format HOOK.md
  - H3: Implémentation du gestionnaire
  - H3: Points clés du contexte d’événement
  - H2: Découverte des hooks
  - H3: Packs de hooks
  - H2: Hooks groupés
  - H3: détails de session-memory
  - H3: configuration de bootstrap-extra-files
  - H3: détails de command-logger
  - H3: détails de compaction-notifier
  - H3: détails de boot-md
  - H2: Hooks de Plugin
  - H2: Configuration
  - H2: Référence CLI
  - H2: Bonnes pratiques
  - H2: Dépannage
  - H3: Hook non découvert
  - H3: Hook non éligible
  - H3: Hook non exécuté
  - H2: Connexe

## automation/index.md

- Itinéraire : /automation
- Titres :
  - H2: Guide de décision rapide
  - H3: Tâches planifiées (Cron) ou Heartbeat
  - H2: Concepts fondamentaux
  - H3: Tâches planifiées (Cron)
  - H3: Tâches
  - H3: Engagements déduits
  - H3: Flux de tâches
  - H3: Instructions permanentes
  - H3: Hooks
  - H3: Heartbeat
  - H2: Comment ils fonctionnent ensemble
  - H2: Connexe

## automation/poll.md

- Itinéraire : /automation/poll
- Titres :
  - H2: Connexe

## automation/standing-orders.md

- Itinéraire : /automation/standing-orders
- Titres :
  - H2: Pourquoi utiliser des instructions permanentes
  - H2: Comment elles fonctionnent
  - H2: Anatomie d’une instruction permanente
  - H2: Instructions permanentes plus tâches Cron
  - H2: Exemples
  - H3: Exemple 1 : contenu et réseaux sociaux (cycle hebdomadaire)
  - H3: Exemple 2 : opérations financières (déclenchées par événement)
  - H3: Exemple 3 : surveillance et alertes (continu)
  - H2: Modèle exécuter-vérifier-rapporter
  - H2: Architecture multiprogramme
  - H2: Bonnes pratiques
  - H3: À faire
  - H3: À éviter
  - H2: Connexe

## automation/taskflow.md

- Itinéraire : /automation/taskflow
- Titres :
  - H2: Quand utiliser TaskFlow
  - H2: Modèle fiable de flux de travail planifié
  - H2: Modes de synchronisation
  - H3: Mode géré
  - H3: Mode miroir
  - H2: État durable et suivi des révisions
  - H2: Comportement d’annulation
  - H2: Commandes CLI
  - H2: Relation entre les flux et les tâches
  - H2: Connexe

## automation/tasks.md

- Itinéraire : /automation/tasks
- Titres :
  - H2: TL;DR
  - H2: Démarrage rapide
  - H2: Ce qui crée une tâche
  - H2: Cycle de vie d’une tâche
  - H2: Livraison et notifications
  - H3: Politiques de notification
  - H2: Référence CLI
  - H2: Tableau des tâches dans le chat (/tasks)
  - H2: Intégration de l’état (pression des tâches)
  - H2: Stockage et maintenance
  - H3: Où se trouvent les tâches
  - H3: Maintenance automatique
  - H2: Relation des tâches avec les autres systèmes
  - H2: Connexe

## automation/troubleshooting.md

- Itinéraire : /automation/troubleshooting
- Titres :
  - H2: Connexe

## automation/webhook.md

- Itinéraire : /automation/webhook
- Titres :
  - H2: Connexe

## brave-search.md

- Itinéraire : /brave-search
- Titres :
  - H2: Connexe

## channels/access-groups.md

- Itinéraire : /channels/access-groups
- Titres :
  - H2: Groupes statiques d’expéditeurs de messages
  - H2: Groupes de référence à partir de listes d’autorisation
  - H2: Chemins de canaux de messages pris en charge
  - H2: Diagnostics de Plugin
  - H2: Audiences des canaux Discord
  - H2: Notes de sécurité
  - H2: Dépannage

## channels/ambient-room-events.md

- Itinéraire : /channels/ambient-room-events
- Titres :
  - H2: Configuration recommandée
  - H2: Ce qui change
  - H2: Exemple Discord
  - H2: Exemple Slack
  - H2: Exemple Telegram
  - H2: Politique propre à l’agent
  - H2: Modes de réponse visibles
  - H2: Historique
  - H2: Dépannage
  - H2: Connexe

## channels/bot-loop-protection.md

- Itinéraire : /channels/bot-loop-protection
- Titres :
  - H1: Protection contre les boucles de bot
  - H2: Valeurs par défaut
  - H2: Configurer les valeurs par défaut partagées
  - H2: Remplacer par canal ou compte
  - H2: Prise en charge des canaux

## channels/broadcast-groups.md

- Itinéraire : /channels/broadcast-groups
- Titres :
  - H2: Vue d’ensemble
  - H2: Cas d’utilisation
  - H2: Configuration
  - H3: Configuration de base
  - H3: Stratégie de traitement
  - H3: Exemple complet
  - H2: Fonctionnement
  - H3: Flux de messages
  - H3: Isolation des sessions
  - H3: Exemple : sessions isolées
  - H2: Bonnes pratiques
  - H2: Compatibilité
  - H3: Fournisseurs
  - H3: Routage
  - H2: Dépannage
  - H2: Exemples
  - H2: Référence API
  - H3: Schéma de configuration
  - H3: Champs
  - H2: Limitations
  - H2: Améliorations futures
  - H2: Connexe

## channels/channel-routing.md

- Itinéraire : /channels/channel-routing
- Titres :
  - H1: Canaux et routage
  - H2: Termes clés
  - H2: Préfixes de cibles sortantes
  - H2: Formes de clés de session (exemples)
  - H2: Épinglage de la route de MP principale
  - H2: Enregistrement entrant protégé
  - H2: Règles de routage (comment un agent est choisi)
  - H2: Groupes de diffusion (exécuter plusieurs agents)
  - H2: Vue d’ensemble de la configuration
  - H2: Stockage des sessions
  - H2: Comportement de WebChat
  - H2: Contexte de réponse
  - H2: Connexe

## channels/clickclack.md

- Itinéraire : /channels/clickclack
- Titres :
  - H2: Configuration rapide
  - H2: Plusieurs bots
  - H2: Cibles
  - H2: Autorisations
  - H2: Dépannage

## channels/discord.md

- Itinéraire : /channels/discord
- Titres :
  - H2: Configuration rapide
  - H2: Recommandé : configurer un espace de travail de guilde
  - H2: Modèle d’exécution
  - H2: Canaux de forum
  - H2: Composants interactifs
  - H2: Contrôle d’accès et routage
  - H3: Routage d’agent basé sur les rôles
  - H2: Commandes natives et authentification des commandes
  - H2: Détails des fonctionnalités
  - H2: Outils et portes d’action
  - H2: Interface utilisateur Components v2
  - H2: Voix
  - H3: Canaux vocaux
  - H3: Suivre les utilisateurs en vocal
  - H3: Messages vocaux
  - H2: Dépannage
  - H2: Référence de configuration
  - H2: Sécurité et opérations
  - H2: Connexe

## channels/feishu.md

- Itinéraire : /channels/feishu
- Titres :
  - H2: Démarrage rapide
  - H2: Contrôle d’accès
  - H3: Messages directs
  - H3: Discussions de groupe
  - H2: Exemples de configuration de groupe
  - H3: Autoriser tous les groupes, sans @mention requise
  - H3: Autoriser tous les groupes, avec @mention toujours requise
  - H3: Autoriser uniquement des groupes spécifiques
  - H3: Restreindre les expéditeurs au sein d’un groupe
  - H2: Obtenir les ID de groupe/utilisateur
  - H3: ID de groupe (chatid, format : ocxxx)
  - H3: ID utilisateur (openid, format : ouxxx)
  - H2: Commandes courantes
  - H2: Dépannage
  - H3: Le bot ne répond pas dans les discussions de groupe
  - H3: Le bot ne reçoit pas les messages
  - H3: La configuration QR ne réagit pas dans l’application mobile Feishu
  - H3: App Secret divulgué
  - H2: Configuration avancée
  - H3: Plusieurs comptes
  - H3: Limites de messages
  - H3: Streaming
  - H3: Optimisation des quotas
  - H3: Sessions ACP
  - H4: Liaison ACP persistante
  - H4: Lancer ACP depuis le chat
  - H3: Routage multi-agent
  - H2: Isolation d’agent par utilisateur (création dynamique d’agent)
  - H3: Configuration rapide
  - H3: Fonctionnement
  - H3: Options de configuration
  - H3: Portée de session
  - H3: Déploiement multi-utilisateur typique
  - H3: Vérification
  - H3: Notes
  - H2: Référence de configuration
  - H2: Types de messages pris en charge
  - H3: Recevoir
  - H3: Envoyer
  - H3: Fils et réponses
  - H2: Connexe

## channels/googlechat.md

- Itinéraire : /channels/googlechat
- Titres :
  - H2: Installer
  - H2: Configuration rapide (débutant)
  - H2: Ajouter à Google Chat
  - H2: URL publique (Webhook uniquement)
  - H3: Option A : Tailscale Funnel (recommandé)
  - H3: Option B : proxy inverse (Caddy)
  - H3: Option C : tunnel Cloudflare
  - H2: Fonctionnement
  - H2: Cibles
  - H2: Points clés de configuration
  - H2: Dépannage
  - H3: 405 Méthode non autorisée
  - H3: Autres problèmes
  - H2: Connexe

## channels/group-messages.md

- Itinéraire : /channels/group-messages
- Titres :
  - H2: Comportement
  - H2: Exemple de configuration (WhatsApp)
  - H3: Commande d’activation (propriétaire uniquement)
  - H2: Mode d’emploi
  - H2: Test / vérification
  - H2: Points connus à prendre en compte
  - H2: Connexe

## channels/groups.md

- Itinéraire : /channels/groups
- Titres :
  - H2: Introduction pour débutants (2 minutes)
  - H2: Réponses visibles
  - H2: Visibilité du contexte et listes d’autorisation
  - H2: Clés de session
  - H2: Modèle : MP personnels + groupes publics (agent unique)
  - H2: Libellés d’affichage
  - H2: Politique de groupe
  - H2: Garde par mention (par défaut)
  - H2: Définir la portée des modèles de mention configurés
  - H2: Restrictions d’outils pour les groupes/canaux (facultatif)
  - H2: Listes d’autorisation de groupes
  - H2: Activation (propriétaire uniquement)
  - H2: Champs de contexte
  - H2: Spécificités iMessage
  - H2: Prompts système WhatsApp
  - H2: Spécificités WhatsApp
  - H2: Connexe

## channels/imessage-from-bluebubbles.md

- Itinéraire : /channels/imessage-from-bluebubbles
- Titres :
  - H2: Liste de contrôle de migration
  - H2: Quand cette migration est pertinente
  - H2: Ce que fait imsg
  - H2: Avant de commencer
  - H2: Traduction de la configuration
  - H2: Piège du registre de groupes
  - H2: Étape par étape
  - H2: Parité des actions en un coup d’œil
  - H2: Appairage, sessions et liaisons ACP
  - H2: Aucun canal de retour arrière
  - H2: Connexe

## channels/imessage.md

- Itinéraire : /channels/imessage
- Titres :
  - H2: Configuration rapide
  - H2: Exigences et autorisations (macOS)
  - H2: Activation de l’API privée imsg
  - H3: Configuration
  - H3: Quand vous ne pouvez pas désactiver SIP
  - H2: Contrôle d’accès et routage
  - H2: Liaisons de conversation ACP
  - H2: Modèles de déploiement
  - H2: Médias, découpage et cibles de livraison
  - H2: Actions d’API privée
  - H2: Écritures de configuration
  - H2: Fusion des MP envoyés en plusieurs parties (commande + URL dans une même composition)
  - H3: Scénarios et ce que voit l’agent
  - H2: Récupération entrante après le redémarrage d’un pont ou du Gateway
  - H3: Signal visible par l’opérateur
  - H3: Migration
  - H2: Dépannage
  - H2: Pointeurs vers la référence de configuration
  - H2: Connexe

## channels/index.md

- Itinéraire : /channels
- Titres :
  - H2: Notes de livraison
  - H2: Canaux pris en charge
  - H2: Notes

## channels/irc.md

- Itinéraire : /channels/irc
- Titres :
  - H2: Démarrage rapide
  - H2: Valeurs de sécurité par défaut
  - H2: Contrôle d’accès
  - H3: Piège courant : allowFrom concerne les MP, pas les canaux
  - H2: Déclenchement des réponses (mentions)
  - H2: Note de sécurité (recommandée pour les canaux publics)
  - H3: Mêmes outils pour tout le monde dans le canal
  - H3: Outils différents par expéditeur (le propriétaire obtient plus de pouvoirs)
  - H2: NickServ
  - H2: Variables d’environnement
  - H2: Dépannage
  - H2: Connexe

## channels/line.md

- Route : /channels/line
- Titres :
  - H2 : Installer
  - H2 : Configuration initiale
  - H2 : Configurer
  - H2 : Contrôle d’accès
  - H2 : Comportement des messages
  - H2 : Données du canal (messages enrichis)
  - H2 : Prise en charge ACP
  - H2 : Médias sortants
  - H2 : Dépannage
  - H2 : Connexe

## channels/location.md

- Route : /channels/location
- Titres :
  - H2 : Mise en forme du texte
  - H2 : Champs de contexte
  - H2 : Notes sur le canal
  - H2 : Connexe

## channels/matrix-migration.md

- Route : /channels/matrix-migration
- Titres :
  - H2 : Ce que la migration fait automatiquement
  - H2 : Ce que la migration ne peut pas faire automatiquement
  - H2 : Flux de mise à niveau recommandé
  - H2 : Fonctionnement de la migration chiffrée
  - H2 : Messages courants et leur signification
  - H3 : Messages de mise à niveau et de détection
  - H3 : Messages de récupération de l’état chiffré
  - H3 : Messages de récupération manuelle
  - H3 : Messages d’installation de Plugin personnalisé
  - H2 : Si l’historique chiffré ne revient toujours pas
  - H2 : Si vous voulez repartir de zéro pour les messages futurs
  - H2 : Connexe

## channels/matrix-presentation.md

- Route : /channels/matrix-presentation
- Titres :
  - H2 : Contenu d’événement
  - H2 : Comportement de fallback
  - H2 : Blocs pris en charge
  - H2 : Interactions
  - H2 : Relation avec les métadonnées d’approbation
  - H2 : Messages multimédias

## channels/matrix-push-rules.md

- Route : /channels/matrix-push-rules
- Titres :
  - H2 : Prérequis
  - H2 : Étapes
  - H2 : Notes multi-bots
  - H2 : Notes de homeserver
  - H2 : Connexe

## channels/matrix.md

- Route : /channels/matrix
- Titres :
  - H2 : Installer
  - H2 : Configuration initiale
  - H3 : Configuration initiale interactive
  - H3 : Configuration minimale
  - H3 : Rejoindre automatiquement
  - H3 : Formats de cibles de liste d’autorisation
  - H3 : Normalisation de l’ID de compte
  - H3 : Identifiants mis en cache
  - H3 : Variables d’environnement
  - H2 : Exemple de configuration
  - H2 : Aperçus en streaming
  - H2 : Messages vocaux
  - H2 : Métadonnées d’approbation
  - H3 : Règles de push auto-hébergées pour des aperçus finalisés silencieux
  - H2 : Salons bot-à-bot
  - H2 : Chiffrement et vérification
  - H3 : Activer le chiffrement
  - H3 : Signaux d’état et de confiance
  - H3 : Vérifier cet appareil avec une clé de récupération
  - H3 : Amorcer ou réparer la signature croisée
  - H3 : Sauvegarde des clés de salon
  - H3 : Lister, demander et répondre aux vérifications
  - H3 : Notes multi-comptes
  - H2 : Gestion du profil
  - H2 : Fils de discussion
  - H3 : Routage de session (sessionScope)
  - H3 : Réponses en fil de discussion (threadReplies)
  - H3 : Héritage de fil de discussion et commandes slash
  - H2 : Liaisons de conversation ACP
  - H3 : Configuration de liaison de fil de discussion
  - H2 : Réactions
  - H2 : Contexte de l’historique
  - H2 : Visibilité du contexte
  - H2 : Politique de DM et de salon
  - H2 : Réparation de salon direct
  - H2 : Approbations d’exécution
  - H2 : Commandes slash
  - H2 : Multi-compte
  - H2 : Homeservers privés/LAN
  - H2 : Proxy du trafic Matrix
  - H2 : Résolution des cibles
  - H2 : Référence de configuration
  - H3 : Compte et connexion
  - H3 : Chiffrement
  - H3 : Accès et politique
  - H3 : Comportement de réponse
  - H3 : Paramètres de réaction
  - H3 : Outillage et remplacements par salon
  - H3 : Paramètres d’approbation d’exécution
  - H2 : Connexe

## channels/mattermost.md

- Route : /channels/mattermost
- Titres :
  - H2 : Installer
  - H2 : Configuration rapide
  - H2 : Commandes slash natives
  - H2 : Variables d’environnement (compte par défaut)
  - H2 : Modes de chat
  - H2 : Fils de discussion et sessions
  - H2 : Contrôle d’accès (DM)
  - H2 : Canaux (groupes)
  - H2 : Cibles pour la livraison sortante
  - H2 : Nouvelle tentative de canal DM
  - H2 : Streaming d’aperçu
  - H2 : Réactions (outil de message)
  - H2 : Boutons interactifs (outil de message)
  - H3 : Intégration API directe (scripts externes)
  - H2 : Adaptateur d’annuaire
  - H2 : Multi-compte
  - H2 : Dépannage
  - H2 : Connexe

## channels/msteams.md

- Route : /channels/msteams
- Titres :
  - H2 : Plugin groupé
  - H2 : Configuration rapide
  - H2 : Objectifs
  - H2 : Écritures de configuration
  - H2 : Contrôle d’accès (DM + groupes)
  - H3 : Fonctionnement
  - H3 : Étape 1 : Créer Azure Bot
  - H3 : Étape 2 : Obtenir les identifiants
  - H3 : Étape 3 : Configurer le point de terminaison de messagerie
  - H3 : Étape 4 : Activer le canal Teams
  - H3 : Étape 5 : Créer le manifeste de l’application Teams
  - H3 : Étape 6 : Configurer OpenClaw
  - H3 : Étape 7 : Exécuter le Gateway
  - H2 : Authentification fédérée (certificat plus identité managée)
  - H3 : Option A : Authentification par certificat
  - H3 : Option B : Azure Managed Identity
  - H3 : Configuration d’AKS Workload Identity
  - H3 : Comparaison des types d’authentification
  - H2 : Développement local (tunneling)
  - H2 : Tester le bot
  - H2 : Variables d’environnement
  - H2 : Action d’informations sur le membre
  - H2 : Contexte de l’historique
  - H2 : Autorisations RSC Teams actuelles (manifeste)
  - H2 : Exemple de manifeste Teams (expurgé)
  - H3 : Mises en garde sur le manifeste (champs obligatoires)
  - H3 : Mettre à jour une application existante
  - H2 : Capacités : RSC uniquement ou Graph
  - H3 : Avec Teams RSC uniquement (application installée, aucune autorisation Graph API)
  - H3 : Avec Teams RSC + autorisations Microsoft Graph Application
  - H3 : RSC vs Graph API
  - H2 : Médias + historique activés par Graph (requis pour les canaux)
  - H2 : Limitations connues
  - H3 : Délais d’expiration Webhook
  - H3 : Prise en charge du cloud Teams et de l’URL de service
  - H3 : Mise en forme
  - H2 : Configuration
  - H2 : Routage et sessions
  - H2 : Style de réponse : fils de discussion ou publications
  - H3 : Priorité de résolution
  - H3 : Préservation du contexte de fil de discussion
  - H2 : Pièces jointes et images
  - H2 : Envoi de fichiers dans les discussions de groupe
  - H3 : Pourquoi les discussions de groupe ont besoin de SharePoint
  - H3 : Configuration initiale
  - H3 : Comportement de partage
  - H3 : Comportement de fallback
  - H3 : Emplacement des fichiers stockés
  - H2 : Sondages (Adaptive Cards)
  - H2 : Cartes de présentation
  - H2 : Formats de cibles
  - H2 : Messagerie proactive
  - H2 : ID d’équipe et de canal (piège courant)
  - H2 : Canaux privés
  - H2 : Dépannage
  - H3 : Problèmes courants
  - H3 : Erreurs de téléversement du manifeste
  - H3 : Les autorisations RSC ne fonctionnent pas
  - H2 : Références
  - H2 : Connexe

## channels/nextcloud-talk.md

- Route : /channels/nextcloud-talk
- Titres :
  - H2 : Plugin groupé
  - H2 : Configuration rapide (débutant)
  - H2 : Notes
  - H2 : Contrôle d’accès (DM)
  - H2 : Salons (groupes)
  - H2 : Capacités
  - H2 : Référence de configuration (Nextcloud Talk)
  - H2 : Connexe

## channels/nostr.md

- Route : /channels/nostr
- Titres :
  - H2 : Plugin groupé
  - H3 : Installations anciennes/personnalisées
  - H3 : Configuration initiale non interactive
  - H2 : Configuration rapide
  - H2 : Référence de configuration
  - H2 : Métadonnées du profil
  - H2 : Contrôle d’accès
  - H3 : Politiques de DM
  - H3 : Exemple de liste d’autorisation
  - H2 : Formats de clés
  - H2 : Relais
  - H2 : Prise en charge du protocole
  - H2 : Tests
  - H3 : Relais local
  - H3 : Test manuel
  - H2 : Dépannage
  - H3 : Messages non reçus
  - H3 : Réponses non envoyées
  - H3 : Réponses dupliquées
  - H2 : Sécurité
  - H2 : Limitations (MVP)
  - H2 : Connexe

## channels/pairing.md

- Route : /channels/pairing
- Titres :
  - H2 : 1) Association DM (accès au chat entrant)
  - H3 : Approuver un expéditeur
  - H3 : Groupes d’expéditeurs réutilisables
  - H3 : Emplacement de l’état
  - H2 : 2) Association d’appareil Node (nœuds iOS/Android/macOS/headless)
  - H3 : Associer via Telegram (recommandé pour iOS)
  - H3 : Approuver un appareil Node
  - H3 : Approbation automatique de nœud trusted-CIDR facultative
  - H3 : Stockage de l’état d’association Node
  - H3 : Notes
  - H2 : Docs connexes

## channels/qa-channel.md

- Route : /channels/qa-channel
- Titres :
  - H2 : Ce qu’il fait
  - H2 : Configuration
  - H2 : Exécuteurs
  - H2 : Connexe

## channels/qqbot.md

- Route : /channels/qqbot
- Titres :
  - H2 : Installer
  - H2 : Configuration initiale
  - H2 : Configurer
  - H3 : Configuration multi-compte
  - H3 : Discussions de groupe
  - H3 : Voix (STT / TTS)
  - H2 : Formats de cibles
  - H2 : Commandes slash
  - H2 : Architecture du moteur
  - H2 : Onboarding par QR code
  - H2 : Dépannage
  - H2 : Connexe

## channels/raft.md

- Route : /channels/raft
- Titres :
  - H2 : Installer
  - H2 : Prérequis
  - H2 : Configurer
  - H2 : Fonctionnement
  - H2 : Vérifier
  - H2 : Dépannage
  - H2 : Références

## channels/signal.md

- Route : /channels/signal
- Titres :
  - H2 : Prérequis
  - H2 : Configuration rapide (débutant)
  - H2 : Ce que c’est
  - H2 : Écritures de configuration
  - H2 : Le modèle de numéro (important)
  - H2 : Chemin de configuration A : lier un compte Signal existant (QR)
  - H2 : Chemin de configuration B : enregistrer un numéro de bot dédié (SMS, Linux)
  - H2 : Mode démon externe (httpUrl)
  - H2 : Mode conteneur (bbernhard/signal-cli-rest-api)
  - H2 : Contrôle d’accès (DM + groupes)
  - H2 : Fonctionnement (comportement)
  - H2 : Médias + limites
  - H2 : Saisie + confirmations de lecture
  - H2 : Réactions (outil de message)
  - H2 : Réactions d’approbation
  - H2 : Cibles de livraison (CLI/cron)
  - H2 : Dépannage
  - H2 : Notes de sécurité
  - H2 : Référence de configuration (Signal)
  - H2 : Connexe

## channels/slack.md

- Route : /channels/slack
- Titres :
  - H2 : Choisir le Socket Mode ou les URL de requête HTTP
  - H3 : Mode relais
  - H2 : Installer
  - H2 : Configuration rapide
  - H2 : Réglage du transport Socket Mode
  - H2 : Liste de contrôle du manifeste et des portées
  - H3 : Paramètres supplémentaires du manifeste
  - H2 : Modèle de jetons
  - H2 : Actions et gates
  - H2 : Contrôle d’accès et routage
  - H2 : Fils de discussion, sessions et balises de réponse
  - H2 : Réactions d’accusé de réception
  - H3 : Emoji (ackReaction)
  - H3 : Portée (messages.ackReactionScope)
  - H2 : Streaming de texte
  - H2 : Fallback de réaction de saisie
  - H2 : Médias, découpage en morceaux et livraison
  - H2 : Commandes et comportement slash
  - H2 : Réponses interactives
  - H3 : Soumissions de modales détenues par le Plugin
  - H2 : Approbations natives dans Slack
  - H2 : Événements et comportement opérationnel
  - H2 : Référence de configuration
  - H2 : Dépannage
  - H2 : Référence de vision des pièces jointes
  - H3 : Types de médias pris en charge
  - H3 : Pipeline entrant
  - H3 : Héritage des pièces jointes de la racine du fil de discussion
  - H3 : Gestion des pièces jointes multiples
  - H3 : Taille, téléchargement et limites du modèle
  - H3 : Limites connues
  - H3 : Documentation connexe
  - H2 : Connexe

## channels/sms.md

- Route : /channels/sms
- Titres :
  - H2 : Avant de commencer
  - H2 : Configuration rapide
  - H2 : Exemples de configuration
  - H3 : Fichier de configuration
  - H3 : Variables d’environnement
  - H3 : Jeton d’authentification SecretRef
  - H3 : Numéro privé uniquement sur liste d’autorisation
  - H3 : Expéditeur de Messaging Service
  - H3 : Cible sortante par défaut
  - H2 : Contrôle d’accès
  - H2 : Envoi de SMS
  - H2 : Vérifier la configuration
  - H3 : Test de bout en bout depuis macOS iMessage/SMS
  - H2 : Sécurité Webhook
  - H2 : Configuration multi-compte
  - H2 : Dépannage
  - H3 : Twilio renvoie 403 ou OpenClaw rejette le Webhook
  - H3 : Aucune demande d’association n’apparaît
  - H3 : Les envois sortants échouent
  - H3 : Les messages arrivent, mais l’agent ne répond pas

## channels/synology-chat.md

- Route : /channels/synology-chat
- Titres :
  - H2 : Plugin groupé
  - H2 : Configuration rapide
  - H2 : Variables d’environnement
  - H2 : Politique DM et contrôle d’accès
  - H2 : Livraison sortante
  - H2 : Multi-compte
  - H2 : Notes de sécurité
  - H2 : Dépannage
  - H2 : Connexe

## channels/telegram.md

- Route : /channels/telegram
- Titres :
  - H2 : Configuration rapide
  - H2 : Paramètres côté Telegram
  - H2 : Contrôle d’accès et activation
  - H3 : Identité du bot de groupe
  - H2 : Comportement d’exécution
  - H2 : Référence des fonctionnalités
  - H2 : Contrôles des réponses d’erreur
  - H2 : Dépannage
  - H2 : Référence de configuration
  - H2 : Connexe

## channels/tlon.md

- Route : /channels/tlon
- Titres :
  - H2 : Plugin groupé
  - H2 : Configuration initiale
  - H2 : Vaisseaux privés/LAN
  - H2 : Canaux de groupe
  - H2 : Contrôle d’accès
  - H2 : Propriétaire et système d’approbation
  - H2 : Paramètres d’acceptation automatique
  - H2 : Cibles de livraison (CLI/cron)
  - H2 : Skill groupée
  - H2 : Capacités
  - H2 : Dépannage
  - H2 : Référence de configuration
  - H2 : Notes
  - H2 : Connexe

## channels/troubleshooting.md

- Route : /channels/troubleshooting
- Titres :
  - H2 : Échelle de commandes
  - H2 : Après une mise à jour
  - H2 : WhatsApp
  - H3 : Signatures d’échec WhatsApp
  - H2 : Telegram
  - H3 : Signatures d’échec Telegram
  - H2 : Discord
  - H3 : Signatures d’échec Discord
  - H2 : Slack
  - H3 : Signatures d’échec Slack
  - H2 : iMessage
  - H3 : Signatures d’échec iMessage
  - H2 : Signal
  - H3 : Signatures d’échec Signal
  - H2 : QQ Bot
  - H3 : Signatures d’échec QQ Bot
  - H2 : Matrix
  - H3 : Signatures d’échec Matrix
  - H2 : Connexe

## channels/twitch.md

- Route : /channels/twitch
- Titres :
  - H2: Plugin groupé
  - H2: Configuration rapide (débutant)
  - H2: Ce que c’est
  - H2: Configuration (détaillée)
  - H3: Générer les identifiants
  - H3: Configurer le bot
  - H3: Contrôle d’accès (recommandé)
  - H2: Actualisation du token (facultatif)
  - H2: Prise en charge de plusieurs comptes
  - H2: Contrôle d’accès
  - H2: Dépannage
  - H2: Config
  - H3: Config du compte
  - H3: Options du fournisseur
  - H2: Actions d’outils
  - H2: Sécurité et exploitation
  - H2: Limites
  - H2: Associé

## channels/wechat.md

- Route : /channels/wechat
- Titres :
  - H2: Nommage
  - H2: Fonctionnement
  - H2: Installer
  - H2: Connexion
  - H2: Contrôle d’accès
  - H2: Compatibilité
  - H2: Processus sidecar
  - H2: Dépannage
  - H2: Docs associées

## channels/whatsapp.md

- Route : /channels/whatsapp
- Titres :
  - H2: Installer (à la demande)
  - H2: Configuration rapide
  - H2: Modèles de déploiement
  - H2: Modèle d’exécution
  - H2: Invites d’approbation
  - H2: Hooks de Plugin et confidentialité
  - H2: Contrôle d’accès et activation
  - H2: Liaisons ACP configurées
  - H2: Comportement des numéros personnels et des conversations avec soi-même
  - H2: Normalisation des messages et contexte
  - H2: Livraison, découpage et médias
  - H2: Citation des réponses
  - H2: Niveau de réaction
  - H2: Réactions d’accusé de réception
  - H2: Réactions d’état du cycle de vie
  - H2: Plusieurs comptes et identifiants
  - H2: Outils, actions et écritures de config
  - H2: Dépannage
  - H2: Prompts système
  - H2: Pointeurs de référence de configuration
  - H2: Associé

## channels/yuanbao.md

- Route : /channels/yuanbao
- Titres :
  - H2: Démarrage rapide
  - H3: Configuration interactive (alternative)
  - H2: Contrôle d’accès
  - H3: Messages directs
  - H3: Discussions de groupe
  - H2: Exemples de configuration
  - H3: Configuration de base avec politique de DM ouverte
  - H3: Restreindre les DM à des utilisateurs spécifiques
  - H3: Désactiver l’exigence de @mention dans les groupes
  - H3: Optimiser la livraison des messages sortants
  - H3: Ajuster la stratégie de fusion de texte
  - H2: Commandes courantes
  - H2: Dépannage
  - H3: Le bot ne répond pas dans les discussions de groupe
  - H3: Le bot ne reçoit pas les messages
  - H3: Le bot envoie des réponses vides ou de repli
  - H3: App Secret divulgué
  - H2: Configuration avancée
  - H3: Comptes multiples
  - H3: Limites des messages
  - H3: Streaming
  - H3: Contexte de l’historique des discussions de groupe
  - H3: Mode de réponse
  - H3: Injection d’indication Markdown
  - H3: Mode débogage
  - H3: Routage multi-agent
  - H2: Référence de configuration
  - H2: Types de messages pris en charge
  - H3: Recevoir
  - H3: Envoyer
  - H3: Threads et réponses
  - H2: Associé

## channels/zalo.md

- Route : /channels/zalo
- Titres :
  - H2: Plugin groupé
  - H2: Configuration rapide (débutant)
  - H2: Ce que c’est
  - H2: Configuration (voie rapide)
  - H3: 1) Créer un token de bot (Zalo Bot Platform)
  - H3: 2) Configurer le token (env ou config)
  - H2: Fonctionnement (comportement)
  - H2: Limites
  - H2: Contrôle d’accès (DM)
  - H3: Accès DM
  - H2: Contrôle d’accès (groupes)
  - H2: Long-polling vs webhook
  - H2: Types de messages pris en charge
  - H2: Capacités
  - H2: Cibles de livraison (CLI/cron)
  - H2: Dépannage
  - H2: Référence de configuration (Zalo)
  - H2: Associé

## channels/zaloclawbot.md

- Route : /channels/zaloclawbot
- Titres :
  - H2: Compatibilité
  - H2: Prérequis
  - H2: Installer avec onboard (recommandé)
  - H2: Installation manuelle
  - H3: 1. Installer le Plugin
  - H3: 2. Activer le Plugin dans la config
  - H3: 3. Générer le QR code et se connecter
  - H3: 4. Redémarrer le gateway
  - H2: Fonctionnement
  - H2: Sous le capot
  - H2: Dépannage

## channels/zalouser.md

- Route : /channels/zalouser
- Titres :
  - H2: Plugin groupé
  - H2: Configuration rapide (débutant)
  - H2: Ce que c’est
  - H2: Nommage
  - H2: Recherche d’ID (répertoire)
  - H2: Limites
  - H2: Contrôle d’accès (DM)
  - H2: Accès aux groupes (facultatif)
  - H3: Garde par mention de groupe
  - H2: Multi-compte
  - H2: Variables d’environnement
  - H2: Saisie, réactions et accusés de livraison
  - H2: Dépannage
  - H2: Associé

## ci.md

- Route : /ci
- Titres :
  - H2: Vue d’ensemble du pipeline
  - H2: Ordre d’échec rapide
  - H2: Contexte et preuves de PR
  - H2: Portée et routage
  - H2: Transfert de l’activité ClawSweeper
  - H2: Déclenchements manuels
  - H2: Runners
  - H2: Budget d’enregistrement des runners
  - H2: Équivalents locaux
  - H2: Performance OpenClaw
  - H2: Validation complète de release
  - H2: Shards live et E2E
  - H2: Acceptation du package
  - H3: Jobs
  - H3: Sources candidates
  - H3: Profils de suite
  - H3: Fenêtres de compatibilité héritée
  - H3: Exemples
  - H2: Smoke d’installation
  - H2: E2E Docker local
  - H3: Paramètres ajustables
  - H3: Workflow live/E2E réutilisable
  - H3: Chunks du chemin de release
  - H2: Prerelease de Plugin
  - H2: QA Lab
  - H2: CodeQL
  - H3: Catégories de sécurité
  - H3: Shards de sécurité propres à la plateforme
  - H3: Catégories de qualité critique
  - H2: Workflows de maintenance
  - H3: Agent de docs
  - H3: Agent de performance des tests
  - H3: PR en double après merge
  - H2: Gates de vérification locale et routage des changements
  - H2: Validation Testbox
  - H2: Associé

## clawhub/cli.md

- Route : /clawhub/cli
- Titres :
  - H1: CLI ClawHub
  - H2: Découvrir et installer
  - H2: Publier et maintenir
  - H2: Associé

## clawhub/publishing.md

- Route : /clawhub/publishing
- Titres :
  - H1: Publication sur ClawHub
  - H2: Propriétaires
  - H2: Skills
  - H2: Plugins
  - H2: Flux de release
  - H2: FAQ
  - H3: Le scope du package doit correspondre au propriétaire sélectionné

## cli/acp.md

- Route : /cli/acp
- Titres :
  - H2: Ce que ce n’est pas
  - H2: Matrice de compatibilité
  - H2: Limitations connues
  - H2: Utilisation
  - H2: Client ACP (débogage)
  - H2: Smoke test du protocole
  - H2: Comment l’utiliser
  - H2: Sélection des agents
  - H2: Utiliser depuis acpx (Codex, Claude, autres clients ACP)
  - H2: Configuration de l’éditeur Zed
  - H2: Mappage des sessions
  - H2: Options
  - H3: options du client acp
  - H2: Associé

## cli/agent.md

- Route : /cli/agent
- Titres :
  - H1: openclaw agent
  - H2: Options
  - H2: Exemples
  - H2: Notes
  - H2: État de livraison JSON
  - H2: Associé

## cli/agents.md

- Route : /cli/agents
- Titres :
  - H1: openclaw agents
  - H2: Exemples
  - H2: Liaisons de routage
  - H3: format --bind
  - H3: Comportement de portée des liaisons
  - H2: Surface de commande
  - H3: agents
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents delete
  - H2: Fichiers d’identité
  - H2: Définir l’identité
  - H2: Associé

## cli/approvals.md

- Route : /cli/approvals
- Titres :
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: Commandes courantes
  - H2: Remplacer les approbations depuis un fichier
  - H2: Exemple "Never prompt" / YOLO
  - H2: Helpers de liste d’autorisation
  - H2: Options courantes
  - H2: Notes
  - H2: Associé

## cli/attach.md

- Route : /cli/attach
- Titres : aucun

## cli/backup.md

- Route : /cli/backup
- Titres :
  - H1: openclaw backup
  - H2: Notes
  - H2: Ce qui est sauvegardé
  - H2: Comportement avec config invalide
  - H2: Taille et performance
  - H2: Associé

## cli/browser.md

- Route : /cli/browser
- Titres :
  - H1: openclaw browser
  - H2: Flags courants
  - H2: Démarrage rapide (local)
  - H2: Dépannage rapide
  - H2: Cycle de vie
  - H2: Si la commande est manquante
  - H2: Profils
  - H2: Onglets
  - H2: Snapshot / capture d’écran / actions
  - H2: État et stockage
  - H2: Débogage
  - H2: Chrome existant via MCP
  - H2: Contrôle de navigateur distant (proxy d’hôte Node)
  - H2: Associé

## cli/channels.md

- Route : /cli/channels
- Titres :
  - H1: openclaw channels
  - H2: Commandes courantes
  - H2: État / capacités / résolution / logs
  - H2: Ajouter / supprimer des comptes
  - H2: Connexion et déconnexion (interactif)
  - H2: Dépannage
  - H2: Sonde des capacités
  - H2: Résoudre les noms en ID
  - H2: Associé

## cli/clawbot.md

- Route : /cli/clawbot
- Titres :
  - H1: openclaw clawbot
  - H2: Migration
  - H2: Associé

## cli/commitments.md

- Route : /cli/commitments
- Titres :
  - H2: Utilisation
  - H2: Options
  - H2: Exemples
  - H2: Sortie
  - H2: Associé

## cli/completion.md

- Route : /cli/completion
- Titres :
  - H1: openclaw completion
  - H2: Utilisation
  - H2: Options
  - H2: Notes
  - H2: Associé

## cli/config.md

- Route : /cli/config
- Titres :
  - H2: Options racine
  - H2: Exemples
  - H3: schéma config
  - H3: Chemins
  - H2: Valeurs
  - H2: modes config set
  - H2: config patch
  - H2: Flags du générateur de fournisseur
  - H2: Dry run
  - H3: Forme de sortie JSON
  - H2: Sécurité d’écriture
  - H2: Sous-commandes
  - H2: Valider
  - H2: Associé

## cli/configure.md

- Route : /cli/configure
- Titres :
  - H1: openclaw configure
  - H2: Options
  - H2: Exemples
  - H2: Associé

## cli/crestodian.md

- Route : /cli/crestodian
- Titres :
  - H1: openclaw crestodian
  - H2: Ce que Crestodian affiche
  - H2: Exemples
  - H2: Démarrage sûr
  - H2: Opérations et approbation
  - H2: Bootstrap de configuration
  - H2: Planificateur assisté par modèle
  - H2: Passer à un agent
  - H2: Mode de récupération des messages
  - H2: Associé

## cli/cron.md

- Route : /cli/cron
- Titres :
  - H1: openclaw cron
  - H2: Créer rapidement des jobs
  - H2: Sessions
  - H2: Livraison
  - H3: Propriété de la livraison
  - H3: Livraison en cas d’échec
  - H2: Planification
  - H3: Jobs ponctuels
  - H3: Jobs récurrents
  - H3: Exécutions manuelles
  - H2: Modèles
  - H3: Précédence du modèle Cron isolé
  - H3: Mode rapide
  - H3: Nouvelles tentatives de changement de modèle live
  - H2: Sortie d’exécution et refus
  - H3: Suppression des accusés obsolètes
  - H3: Suppression silencieuse des tokens
  - H3: Refus structurés
  - H2: Rétention
  - H2: Migrer les anciens jobs
  - H2: Modifications courantes
  - H2: Commandes admin courantes
  - H2: Associé

## cli/daemon.md

- Route : /cli/daemon
- Titres :
  - H1: openclaw daemon
  - H2: Utilisation
  - H2: Sous-commandes
  - H2: Options courantes
  - H2: Préférer
  - H2: Associé

## cli/dashboard.md

- Route : /cli/dashboard
- Titres :
  - H1: openclaw dashboard
  - H2: Associé

## cli/devices.md

- Route : /cli/devices
- Titres :
  - H1: openclaw devices
  - H2: Commandes
  - H3: openclaw devices list
  - H3: openclaw devices remove
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices approve [requestId] [--latest]
  - H2: Approbation de première exécution Paperclip / openclawgateway
  - H3: openclaw devices reject
  - H3: openclaw devices rotate --device --role [--scope ]
  - H3: openclaw devices revoke --device --role
  - H2: Options courantes
  - H2: Notes
  - H2: Checklist de récupération de dérive de token
  - H2: Associé

## cli/directory.md

- Route : /cli/directory
- Titres :
  - H1: openclaw directory
  - H2: Flags courants
  - H2: Notes
  - H2: Utiliser les résultats avec l’envoi de message
  - H2: Formats d’ID (par canal)
  - H2: Soi-même ("me")
  - H2: Pairs (contacts/utilisateurs)
  - H2: Groupes
  - H2: Associé

## cli/dns.md

- Route : /cli/dns
- Titres :
  - H1: openclaw dns
  - H2: Configuration
  - H2: dns setup
  - H2: Associé

## cli/docs.md

- Route : /cli/docs
- Titres :
  - H1: openclaw docs
  - H2: Utilisation
  - H2: Exemples
  - H2: Fonctionnement
  - H2: Sortie
  - H2: Codes de sortie
  - H2: Associé

## cli/doctor.md

- Route : /cli/doctor
- Titres :
  - H1: openclaw doctor
  - H2: Pourquoi l’utiliser
  - H2: Exemples
  - H2: Options
  - H2: Mode lint
  - H2: Vérifications de santé structurées
  - H2: Sélection des vérifications
  - H2: Mode post-mise à niveau
  - H2: macOS : remplacements env launchctl
  - H2: Associé

## cli/flows.md

- Route : /cli/flows
- Titres :
  - H1: openclaw tasks flow
  - H2: Sous-commandes
  - H3: Valeurs du filtre d’état
  - H2: Exemples
  - H2: Associé

## cli/gateway.md

- Route : /cli/gateway
- Titres :
  - H2: Exécuter le Gateway
  - H3: Options
  - H2: Redémarrer le Gateway
  - H3: Profilage du Gateway
  - H2: Interroger un Gateway en cours d’exécution
  - H3: gateway health
  - H3: gateway usage-cost
  - H3: gateway stability
  - H3: gateway diagnostics export
  - H3: gateway status
  - H3: gateway probe
  - H4: Distant via SSH (parité de l’app Mac)
  - H3: gateway call
  - H2: Gérer le service Gateway
  - H3: Installer avec un wrapper
  - H2: Découvrir les gateways (Bonjour)
  - H3: gateway discover
  - H2: Associé

## cli/health.md

- Route : /cli/health
- Titres :
  - H1: openclaw health
  - H2: Options
  - H2: Associé

## cli/hooks.md

- Route : /cli/hooks
- Titres :
  - H1 : openclaw hooks
  - H2 : Lister tous les hooks
  - H2 : Obtenir les informations d’un hook
  - H2 : Vérifier l’éligibilité des hooks
  - H2 : Activer un Hook
  - H2 : Désactiver un Hook
  - H2 : Notes
  - H2 : Installer des packs de hooks
  - H2 : Mettre à jour les packs de hooks
  - H2 : Hooks intégrés
  - H3 : session-memory
  - H3 : bootstrap-extra-files
  - H3 : command-logger
  - H3 : boot-md
  - H2 : Connexe

## cli/index.md

- Route : /cli
- Titres :
  - H2 : Pages de commandes
  - H2 : Indicateurs globaux
  - H2 : Modes de sortie
  - H2 : Arborescence des commandes
  - H2 : Commandes slash de chat
  - H2 : Suivi de l’utilisation
  - H2 : Connexe

## cli/infer.md

- Route : /cli/infer
- Titres :
  - H2 : Transformer infer en skill
  - H2 : Pourquoi utiliser infer
  - H2 : Arborescence des commandes
  - H2 : Tâches courantes
  - H2 : Comportement
  - H2 : Modèle
  - H2 : Image
  - H2 : Audio
  - H2 : TTS
  - H2 : Vidéo
  - H2 : Web
  - H2 : Embedding
  - H2 : Sortie JSON
  - H2 : Pièges courants
  - H2 : Notes
  - H2 : Connexe

## cli/logs.md

- Route : /cli/logs
- Titres :
  - H1 : openclaw logs
  - H2 : Options
  - H2 : Options RPC Gateway partagées
  - H2 : Exemples
  - H2 : Notes
  - H2 : Connexe

## cli/mcp.md

- Route : /cli/mcp
- Titres :
  - H2 : Choisir le bon chemin MCP
  - H2 : OpenClaw comme serveur MCP
  - H3 : Quand utiliser serve
  - H3 : Fonctionnement
  - H3 : Choisir un mode client
  - H3 : Ce que serve expose
  - H3 : Utilisation
  - H3 : Outils de pont
  - H3 : Modèle d’événements
  - H3 : Notifications de canal Claude
  - H3 : Configuration du client MCP
  - H3 : Options
  - H3 : Sécurité et frontière de confiance
  - H3 : Tests
  - H3 : Dépannage
  - H2 : OpenClaw comme registre client MCP
  - H3 : Définitions de serveurs MCP enregistrées
  - H3 : Recettes de serveurs courantes
  - H3 : Formes de sortie JSON
  - H3 : Transport Stdio
  - H3 : Transport SSE / HTTP
  - H3 : Workflow OAuth
  - H3 : Transport HTTP diffusable
  - H2 : Interface de contrôle
  - H2 : Limites actuelles
  - H2 : Connexe

## cli/memory.md

- Route : /cli/memory
- Titres :
  - H1 : openclaw memory
  - H2 : Exemples
  - H2 : Options
  - H2 : Dreaming
  - H2 : Connexe

## cli/message.md

- Route : /cli/message
- Titres :
  - H1 : openclaw message
  - H2 : Utilisation
  - H2 : Indicateurs courants
  - H2 : Comportement SecretRef
  - H2 : Actions
  - H3 : Noyau
  - H3 : Fils de discussion
  - H3 : Emojis
  - H3 : Autocollants
  - H3 : Rôles / Canaux / Membres / Voix
  - H3 : Événements
  - H3 : Modération (Discord)
  - H3 : Diffusion
  - H2 : Exemples
  - H2 : Connexe

## cli/migrate.md

- Route : /cli/migrate
- Titres :
  - H1 : openclaw migrate
  - H2 : Commandes
  - H2 : Modèle de sécurité
  - H2 : Fournisseur Claude
  - H3 : Ce que Claude importe
  - H3 : État d’archive et de revue manuelle
  - H2 : Fournisseur Codex
  - H3 : Ce que Codex importe
  - H3 : État Codex en revue manuelle
  - H2 : Fournisseur Hermes
  - H3 : Ce que Hermes importe
  - H3 : Clés .env prises en charge
  - H3 : État archive uniquement
  - H3 : Après application
  - H2 : Contrat de Plugin
  - H2 : Intégration d’onboarding
  - H2 : Connexe

## cli/models.md

- Route : /cli/models
- Titres :
  - H1 : openclaw models
  - H2 : Commandes courantes
  - H3 : Analyse des modèles
  - H3 : État des modèles
  - H2 : Alias + solutions de repli
  - H2 : Profils d’authentification
  - H2 : Connexe

## cli/node.md

- Route : /cli/node
- Titres :
  - H1 : openclaw node
  - H2 : Pourquoi utiliser un hôte de nœud ?
  - H2 : Proxy navigateur (zéro configuration)
  - H2 : Exécuter (premier plan)
  - H2 : Authentification Gateway pour l’hôte de nœud
  - H2 : Service (arrière-plan)
  - H2 : Appairage
  - H2 : Approbations d’exécution
  - H2 : Connexe

## cli/nodes.md

- Route : /cli/nodes
- Titres :
  - H1 : openclaw nodes
  - H2 : Commandes courantes
  - H2 : Invoquer
  - H2 : Connexe

## cli/onboard.md

- Route : /cli/onboard
- Titres :
  - H1 : openclaw onboard
  - H2 : Guides connexes
  - H2 : Exemples
  - H2 : Paramètres régionaux
  - H3 : Choix de points de terminaison Z.AI non interactifs
  - H2 : Indicateurs non interactifs supplémentaires
  - H2 : Notes sur le flux
  - H2 : Commandes de suivi courantes

## cli/pairing.md

- Route : /cli/pairing
- Titres :
  - H1 : openclaw pairing
  - H2 : Commandes
  - H2 : pairing list
  - H2 : pairing approve
  - H2 : Notes
  - H2 : Connexe

## cli/path.md

- Route : /cli/path
- Titres :
  - H1 : openclaw path
  - H2 : Pourquoi l’utiliser
  - H2 : Comment il est utilisé
  - H2 : Fonctionnement
  - H2 : Sous-commandes
  - H2 : Indicateurs globaux
  - H2 : Syntaxe oc://
  - H2 : Adressage par type de fichier
  - H2 : Contrat de mutation
  - H2 : Exemples
  - H2 : Recettes par type de fichier
  - H3 : Markdown
  - H3 : JSONC
  - H3 : JSONL
  - H3 : YAML
  - H2 : Référence des sous-commandes
  - H3 : resolve
  - H3 : find
  - H3 : set
  - H3 : validate
  - H3 : emit
  - H2 : Codes de sortie
  - H2 : Mode de sortie
  - H2 : Notes
  - H2 : Connexe

## cli/plugins.md

- Route : /cli/plugins
- Titres :
  - H2 : Commandes
  - H3 : Auteur
  - H3 : Échafaudage de fournisseur
  - H3 : Installer
  - H4 : Raccourci de marketplace
  - H3 : Lister
  - H3 : Index des Plugins
  - H3 : Désinstaller
  - H3 : Mettre à jour
  - H3 : Inspecter
  - H3 : Doctor
  - H3 : Registre
  - H3 : Marketplace
  - H2 : Connexe

## cli/policy.md

- Route : /cli/policy
- Titres :
  - H1 : openclaw policy
  - H2 : Démarrage rapide
  - H3 : Référence des règles de politique
  - H4 : Superpositions limitées à une portée
  - H4 : Canaux
  - H4 : Serveurs MCP
  - H4 : Fournisseurs de modèles
  - H4 : Réseau
  - H4 : Accès entrant et aux canaux
  - H4 : Gateway
  - H4 : Espace de travail de l’agent
  - H4 : Posture du bac à sable
  - H4 : Gestion des données
  - H4 : Secrets
  - H4 : Approbations d’exécution
  - H4 : Profils d’authentification
  - H4 : Métadonnées d’outil
  - H4 : Posture des outils
  - H2 : Configurer la politique
  - H2 : Accepter l’état de la politique
  - H2 : Constats
  - H2 : Réparer
  - H2 : Codes de sortie
  - H2 : Connexe

## cli/proxy.md

- Route : /cli/proxy
- Titres :
  - H1 : openclaw proxy
  - H2 : Commandes
  - H2 : Valider
  - H2 : Préréglages de requête
  - H2 : Notes
  - H2 : Connexe

## cli/qr.md

- Route : /cli/qr
- Titres :
  - H1 : openclaw qr
  - H2 : Utilisation
  - H2 : Options
  - H2 : Notes
  - H2 : Connexe

## cli/reset.md

- Route : /cli/reset
- Titres :
  - H1 : openclaw reset
  - H2 : Connexe

## cli/sandbox.md

- Route : /cli/sandbox
- Titres :
  - H2 : Vue d’ensemble
  - H2 : Commandes
  - H3 : openclaw sandbox explain
  - H3 : openclaw sandbox list
  - H3 : openclaw sandbox recreate
  - H2 : Cas d’utilisation
  - H3 : Après la mise à jour d’une image Docker
  - H3 : Après la modification de la configuration du bac à sable
  - H3 : Après la modification de la cible SSH ou du matériel d’authentification SSH
  - H3 : Après la modification de la source, de la politique ou du mode OpenShell
  - H3 : Après la modification de setupCommand
  - H3 : Pour un agent spécifique uniquement
  - H2 : Pourquoi c’est nécessaire
  - H2 : Migration du registre
  - H2 : Configuration
  - H2 : Connexe

## cli/secrets.md

- Route : /cli/secrets
- Titres :
  - H1 : openclaw secrets
  - H2 : Recharger l’instantané d’exécution
  - H2 : Audit
  - H2 : Configurer (assistant interactif)
  - H2 : Appliquer un plan enregistré
  - H2 : Pourquoi il n’y a pas de sauvegardes de restauration
  - H2 : Exemple
  - H2 : Connexe

## cli/security.md

- Route : /cli/security
- Titres :
  - H1 : openclaw security
  - H2 : Audit
  - H2 : Sortie JSON
  - H2 : Ce que --fix modifie
  - H2 : Connexe

## cli/sessions.md

- Route : /cli/sessions
- Titres :
  - H1 : openclaw sessions
  - H2 : Maintenance de nettoyage
  - H2 : Compacter une session
  - H3 : RPC sessions.compact
  - H2 : Connexe

## cli/setup.md

- Route : /cli/setup
- Titres :
  - H1 : openclaw setup
  - H2 : Options
  - H3 : Mode de référence
  - H2 : Exemples
  - H2 : Notes
  - H2 : Connexe

## cli/skills.md

- Route : /cli/skills
- Titres :
  - H1 : openclaw skills
  - H2 : Commandes
  - H2 : Atelier Skill
  - H2 : Connexe

## cli/status.md

- Route : /cli/status
- Titres :
  - H2 : Connexe

## cli/system.md

- Route : /cli/system
- Titres :
  - H1 : openclaw system
  - H2 : Commandes courantes
  - H2 : Événement système
  - H2 : system heartbeat last|enable|disable
  - H2 : Présence système
  - H2 : Notes
  - H2 : Connexe

## cli/tasks.md

- Route : /cli/tasks
- Titres :
  - H2 : Utilisation
  - H2 : Options racine
  - H2 : Sous-commandes
  - H3 : list
  - H3 : show
  - H3 : notify
  - H3 : cancel
  - H3 : audit
  - H3 : maintenance
  - H3 : flow
  - H2 : Connexe

## cli/transcripts.md

- Route : /cli/transcripts
- Titres :
  - H1 : openclaw transcripts
  - H2 : Commandes
  - H2 : Sortie
  - H2 : Nombreuses réunions par jour
  - H2 : Résumés manquants
  - H2 : Configuration

## cli/tui.md

- Route : /cli/tui
- Titres :
  - H1 : openclaw tui
  - H2 : Options
  - H2 : Exemples
  - H2 : Boucle de réparation de configuration
  - H2 : Connexe

## cli/uninstall.md

- Route : /cli/uninstall
- Titres :
  - H1 : openclaw uninstall
  - H2 : Connexe

## cli/update.md

- Route : /cli/update
- Titres :
  - H1 : openclaw update
  - H2 : Utilisation
  - H2 : Options
  - H2 : État de mise à jour
  - H2 : Réparation de mise à jour
  - H2 : Assistant de mise à jour
  - H2 : Ce qu’il fait
  - H3 : Forme de réponse du plan de contrôle
  - H2 : Flux de checkout Git
  - H3 : Sélection de canal
  - H3 : Étapes de mise à jour
  - H2 : Raccourci --update
  - H2 : Connexe

## cli/voicecall.md

- Route : /cli/voicecall
- Titres :
  - H1 : openclaw voicecall
  - H2 : Sous-commandes
  - H2 : Configuration et test de fumée
  - H3 : setup
  - H3 : smoke
  - H2 : Cycle de vie d’appel
  - H3 : call
  - H3 : start
  - H3 : continue
  - H3 : speak
  - H3 : dtmf
  - H3 : end
  - H3 : status
  - H2 : Journaux et métriques
  - H3 : tail
  - H3 : latency
  - H2 : Exposition des Webhooks
  - H3 : expose
  - H2 : Connexe

## cli/webhooks.md

- Route : /cli/webhooks
- Titres :
  - H1 : openclaw webhooks
  - H2 : Sous-commandes
  - H2 : Configuration webhooks gmail
  - H3 : Requis
  - H3 : Options Pub/Sub
  - H3 : Options de livraison OpenClaw
  - H3 : Options gog watch serve
  - H3 : Exposition Tailscale
  - H3 : Sortie
  - H2 : Exécuter webhooks gmail
  - H2 : Flux de bout en bout
  - H2 : Connexe

## cli/wiki.md

- Route : /cli/wiki
- Titres :
  - H1 : openclaw wiki
  - H2 : À quoi il sert
  - H2 : Commandes courantes
  - H2 : Commandes
  - H3 : wiki status
  - H3 : wiki doctor
  - H3 : wiki init
  - H3 : wiki ingest
  - H3 : wiki okf import
  - H3 : wiki compile
  - H3 : wiki lint
  - H3 : wiki search
  - H3 : wiki get
  - H3 : wiki apply
  - H3 : wiki bridge import
  - H3 : wiki unsafe-local import
  - H3 : wiki obsidian ...
  - H2 : Conseils d’utilisation pratique
  - H2 : Liens avec la configuration
  - H2 : Connexe

## cli/workboard.md

- Route : /cli/workboard
- Titres :
  - H2 : Utilisation
  - H2 : list
  - H2 : create
  - H2 : show
  - H2 : dispatch
  - H2 : Parité des commandes slash
  - H2 : Autorisations
  - H2 : Dépannage
  - H3 : Aucune carte n’apparaît
  - H3 : Dispatch indique données uniquement
  - H3 : Dispatch ne démarre rien
  - H2 : Connexe

## concepts/active-memory.md

- Route : /concepts/active-memory
- Titres :
  - H2 : Démarrage rapide
  - H2 : Recommandations de vitesse
  - H3 : Configuration Cerebras
  - H2 : Comment l’afficher
  - H2 : Bascule de session
  - H2 : Quand il s’exécute
  - H2 : Types de sessions
  - H2 : Où il s’exécute
  - H2 : Pourquoi l’utiliser
  - H2 : Fonctionnement
  - H2 : Modes de requête
  - H2 : Styles de prompts
  - H2 : Politique de repli du modèle
  - H2 : Outils de mémoire
  - H3 : memory-core intégré
  - H3 : Mémoire LanceDB
  - H3 : Lossless Claw
  - H2 : Issues de secours avancées
  - H2 : Persistance des transcriptions
  - H2 : Configuration
  - H2 : Configuration recommandée
  - H3 : Délai de grâce au démarrage à froid
  - H2 : Débogage
  - H2 : Problèmes courants
  - H2 : Pages connexes

## concepts/agent-loop.md

- Route : /concepts/agent-loop
- Titres :
  - H2 : Points d’entrée
  - H2 : Fonctionnement (haut niveau)
  - H2 : Mise en file d’attente + concurrence
  - H2 : Préparation de session + espace de travail
  - H2 : Assemblage du prompt + prompt système
  - H2 : Points de hook (où vous pouvez intercepter)
  - H3 : Hooks internes (hooks Gateway)
  - H3 : Hooks de Plugin (cycle de vie agent + Gateway)
  - H2 : Streaming + réponses partielles
  - H2 : Exécution d’outils + outils de messagerie
  - H2 : Mise en forme des réponses + suppression
  - H2 : Compaction + nouvelles tentatives
  - H2 : Flux d’événements (aujourd’hui)
  - H2 : Gestion des canaux de chat
  - H2 : Délais d’expiration
  - H2 : Où les choses peuvent se terminer tôt
  - H2 : Connexe

## concepts/agent-runtimes.md

- Route : /concepts/agent-runtimes
- Titres :
  - H2 : Surfaces Codex
  - H2 : Propriété de l’exécution
  - H2 : Sélection de l’exécution
  - H2 : Runtime d’agent GitHub Copilot
  - H2 : Contrat de compatibilité
  - H2 : Libellés d’état
  - H2 : Connexe

## concepts/agent-workspace.md

- Route : /concepts/agent-workspace
- Titres :
  - H2 : Emplacement par défaut
  - H2 : Dossiers d’espace de travail supplémentaires
  - H2 : Carte des fichiers de l’espace de travail
  - H2 : Ce qui n’est PAS dans l’espace de travail
  - H2 : Sauvegarde Git (recommandée, privée)
  - H2 : Ne validez pas de secrets
  - H2 : Déplacer l’espace de travail vers une nouvelle machine
  - H2 : Notes avancées
  - H2 : Connexe

## concepts/agent.md

- Chemin : /concepts/agent
- Titres :
  - H2 : Espace de travail (obligatoire)
  - H2 : Fichiers de Bootstrap (injectés)
  - H2 : Outils intégrés
  - H2 : Skills
  - H2 : Limites d’exécution
  - H2 : Sessions
  - H2 : Pilotage pendant le streaming
  - H2 : Références de modèle
  - H2 : Configuration (minimale)
  - H2 : Connexe

## concepts/architecture.md

- Chemin : /concepts/architecture
- Titres :
  - H2 : Vue d’ensemble
  - H2 : Composants et flux
  - H3 : Gateway (daemon)
  - H3 : Clients (application Mac / CLI / administration Web)
  - H3 : Nodes (macOS / iOS / Android / sans interface graphique)
  - H3 : WebChat
  - H2 : Cycle de vie de la connexion (client unique)
  - H2 : Protocole de communication (résumé)
  - H2 : Appairage + confiance locale
  - H2 : Typage du protocole et génération de code
  - H2 : Accès distant
  - H2 : Instantané opérationnel
  - H2 : Invariants
  - H2 : Connexe

## concepts/channel-docking.md

- Chemin : /concepts/channel-docking
- Titres :
  - H2 : Exemple
  - H2 : Pourquoi l’utiliser
  - H2 : Configuration requise
  - H2 : Commandes
  - H2 : Ce qui change
  - H2 : Ce qui ne change pas
  - H2 : Dépannage

## concepts/commitments.md

- Chemin : /concepts/commitments
- Titres :
  - H2 : Activer les engagements
  - H2 : Fonctionnement
  - H2 : Portée
  - H2 : Engagements et rappels
  - H2 : Gérer les engagements
  - H2 : Confidentialité et coût
  - H2 : Dépannage
  - H2 : Connexe

## concepts/compaction.md

- Chemin : /concepts/compaction
- Titres :
  - H2 : Fonctionnement
  - H2 : Compaction automatique
  - H2 : Compaction manuelle
  - H2 : Configuration
  - H3 : Utiliser un autre modèle
  - H3 : Préservation des identifiants
  - H3 : Garde de taille en octets de la transcription active
  - H3 : Transcriptions successeures
  - H3 : Avis de Compaction
  - H3 : Vidage de la mémoire
  - H2 : Fournisseurs de Compaction enfichables
  - H2 : Compaction ou élagage
  - H2 : Dépannage
  - H2 : Connexe

## concepts/context-engine.md

- Chemin : /concepts/context-engine
- Titres :
  - H2 : Démarrage rapide
  - H2 : Fonctionnement
  - H3 : Cycle de vie du sous-agent (facultatif)
  - H3 : Ajout à l’invite système
  - H2 : Moteur hérité
  - H2 : Moteurs de Plugin
  - H3 : Interface ContextEngine
  - H3 : Paramètres d’exécution
  - H3 : Exigences de l’hôte
  - H3 : Isolation des échecs
  - H3 : ownsCompaction
  - H2 : Référence de configuration
  - H2 : Relation avec la Compaction et la mémoire
  - H2 : Conseils
  - H2 : Connexe

## concepts/context.md

- Chemin : /concepts/context
- Titres :
  - H2 : Démarrage rapide (inspecter le contexte)
  - H2 : Exemple de sortie
  - H3 : /context list
  - H3 : /context detail
  - H3 : /context map
  - H2 : Ce qui compte dans la fenêtre de contexte
  - H2 : Comment OpenClaw construit l’invite système
  - H2 : Fichiers d’espace de travail injectés (contexte de projet)
  - H2 : Skills : injectées ou chargées à la demande
  - H2 : Outils : il y a deux coûts
  - H2 : Commandes, directives et « raccourcis en ligne »
  - H2 : Sessions, Compaction et élagage (ce qui persiste)
  - H2 : Ce que /context signale réellement
  - H2 : Connexe

## concepts/delegate-architecture.md

- Chemin : /concepts/delegate-architecture
- Titres :
  - H2 : Qu’est-ce qu’un délégué ?
  - H2 : Pourquoi des délégués ?
  - H2 : Niveaux de capacité
  - H3 : Niveau 1 : lecture seule + brouillon
  - H3 : Niveau 2 : envoyer au nom de
  - H3 : Niveau 3 : proactif
  - H2 : Prérequis : isolation et durcissement
  - H3 : Blocages stricts (non négociables)
  - H3 : Restrictions d’outils
  - H3 : Isolation du sandbox
  - H3 : Journal d’audit
  - H2 : Configurer un délégué
  - H3 : 1. Créer l’agent délégué
  - H3 : 2. Configurer la délégation du fournisseur d’identité
  - H4 : Microsoft 365
  - H4 : Google Workspace
  - H3 : 3. Lier le délégué aux canaux
  - H3 : 4. Ajouter des identifiants à l’agent délégué
  - H2 : Exemple : assistant organisationnel
  - H2 : Modèle de mise à l’échelle
  - H2 : Connexe

## concepts/dreaming.md

- Chemin : /concepts/dreaming
- Titres :
  - H2 : Ce que Dreaming écrit
  - H2 : Modèle par phases
  - H2 : Ingestion des transcriptions de session
  - H2 : Journal des rêves
  - H2 : Signaux de classement profond
  - H2 : Couverture des rapports d’essai fantôme QA
  - H2 : Planification
  - H2 : Démarrage rapide
  - H2 : Commande slash
  - H2 : Flux de travail CLI
  - H2 : Valeurs par défaut clés
  - H2 : Interface utilisateur des rêves
  - H2 : Dreaming ne s’exécute jamais : l’état indique bloqué
  - H2 : Connexe

## concepts/experimental-features.md

- Chemin : /concepts/experimental-features
- Titres :
  - H2 : Indicateurs actuellement documentés
  - H2 : Mode allégé pour modèle local
  - H3 : Pourquoi ces trois outils
  - H3 : Quand l’activer
  - H3 : Quand le laisser désactivé
  - H3 : Activer
  - H2 : Expérimental ne signifie pas caché
  - H2 : Connexe

## concepts/features.md

- Chemin : /concepts/features
- Titres :
  - H2 : Points forts
  - H2 : Liste complète
  - H2 : Connexe

## concepts/mantis-slack-desktop-runbook.md

- Chemin : /concepts/mantis-slack-desktop-runbook
- Titres :
  - H2 : Modèle de stockage
  - H2 : Dispatch GitHub
  - H2 : CLI locale
  - H2 : Modes d’hydratation
  - H2 : Interprétation du timing
  - H2 : Liste de vérification des preuves
  - H2 : Gestion des échecs
  - H2 : Connexe

## concepts/mantis.md

- Chemin : /concepts/mantis
- Titres :
  - H2 : Objectifs
  - H2 : Non-objectifs
  - H2 : Propriété
  - H2 : Forme des commandes
  - H2 : Cycle de vie d’une exécution
  - H2 : MVP Discord
  - H2 : Éléments QA existants
  - H2 : Modèle de preuve
  - H2 : Navigateur et VNC
  - H2 : Machines
  - H2 : Secrets
  - H2 : Artefacts GitHub et commentaires de PR
  - H2 : Notes de déploiement privé
  - H2 : Ajouter un scénario
  - H2 : Extension aux fournisseurs
  - H2 : Questions ouvertes

## concepts/markdown-formatting.md

- Chemin : /concepts/markdown-formatting
- Titres :
  - H2 : Objectifs
  - H2 : Pipeline
  - H2 : Exemple d’IR
  - H2 : Où il est utilisé
  - H2 : Gestion des tableaux
  - H2 : Règles de découpage
  - H2 : Politique des liens
  - H2 : Spoilers
  - H2 : Comment ajouter ou mettre à jour un formateur de canal
  - H2 : Pièges courants
  - H2 : Connexe

## concepts/memory-builtin.md

- Chemin : /concepts/memory-builtin
- Titres :
  - H2 : Ce qu’elle fournit
  - H2 : Premiers pas
  - H2 : Fournisseurs d’embeddings pris en charge
  - H2 : Fonctionnement de l’indexation
  - H2 : Quand l’utiliser
  - H2 : Dépannage
  - H2 : Configuration
  - H2 : Connexe

## concepts/memory-honcho.md

- Chemin : /concepts/memory-honcho
- Titres :
  - H2 : Ce qu’elle fournit
  - H2 : Outils disponibles
  - H2 : Premiers pas
  - H2 : Configuration
  - H2 : Migrer la mémoire existante
  - H2 : Fonctionnement
  - H2 : Mémoire Honcho ou mémoire intégrée
  - H2 : Commandes CLI
  - H2 : Pour aller plus loin
  - H2 : Connexe

## concepts/memory-qmd.md

- Chemin : /concepts/memory-qmd
- Titres :
  - H2 : Ce qu’elle ajoute par rapport à l’intégrée
  - H2 : Premiers pas
  - H3 : Prérequis
  - H3 : Activer
  - H2 : Fonctionnement du sidecar
  - H2 : Performances de recherche et compatibilité
  - H2 : Remplacements de modèle
  - H2 : Indexation de chemins supplémentaires
  - H2 : Indexation des transcriptions de session
  - H2 : Portée de la recherche
  - H2 : Citations
  - H2 : Quand l’utiliser
  - H2 : Dépannage
  - H2 : Configuration
  - H2 : Connexe

## concepts/memory-search.md

- Chemin : /concepts/memory-search
- Titres :
  - H2 : Démarrage rapide
  - H2 : Fournisseurs pris en charge
  - H2 : Fonctionnement de la recherche
  - H2 : Améliorer la qualité de recherche
  - H3 : Décroissance temporelle
  - H3 : MMR (diversité)
  - H3 : Activer les deux
  - H2 : Mémoire multimodale
  - H2 : Recherche dans la mémoire de session
  - H2 : Dépannage
  - H2 : Pour aller plus loin
  - H2 : Connexe

## concepts/memory.md

- Chemin : /concepts/memory
- Titres :
  - H2 : Fonctionnement
  - H2 : Ce qui va où
  - H2 : Mémoires sensibles aux actions
  - H2 : Engagements inférés
  - H2 : Outils de mémoire
  - H2 : Plugin compagnon Memory Wiki
  - H2 : Recherche mémoire
  - H2 : Backends de mémoire
  - H2 : Couche wiki de connaissances
  - H2 : Vidage automatique de la mémoire
  - H2 : Dreaming
  - H2 : Rattrapage ancré et promotion en direct
  - H2 : CLI
  - H2 : Pour aller plus loin
  - H2 : Connexe

## concepts/message-lifecycle-refactor.md

- Chemin : /concepts/message-lifecycle-refactor
- Titres :
  - H2 : Problèmes
  - H2 : Objectifs
  - H2 : Non-objectifs
  - H2 : Modèle de référence
  - H2 : Modèle central
  - H2 : Termes de message
  - H3 : Message
  - H3 : Cible
  - H3 : Relation
  - H3 : Origine
  - H3 : Reçu
  - H2 : Contexte de réception
  - H2 : Contexte d’envoi
  - H2 : Contexte en direct
  - H2 : Surface de l’adaptateur
  - H2 : Réduction du SDK public
  - H2 : Relation avec l’entrant de canal
  - H2 : Garde-fous de compatibilité
  - H2 : Stockage interne
  - H2 : Classes d’échec
  - H2 : Mappage des canaux
  - H2 : Plan de migration
  - H3 : Phase 1 : domaine de messages interne
  - H3 : Phase 2 : cœur d’envoi durable
  - H3 : Phase 3 : pont entrant de canal
  - H3 : Phase 4 : pont de répartiteur préparé
  - H3 : Phase 5 : cycle de vie en direct unifié
  - H3 : Phase 6 : SDK public
  - H3 : Phase 7 : tous les expéditeurs
  - H3 : Phase 8 : supprimer la compatibilité nommée par tour
  - H2 : Plan de test
  - H2 : Questions ouvertes
  - H2 : Critères d’acceptation
  - H2 : Connexe

## concepts/messages.md

- Chemin : /concepts/messages
- Titres :
  - H2 : Flux des messages (haut niveau)
  - H2 : Déduplication entrante
  - H2 : Anti-rebond entrant
  - H2 : Sessions et appareils
  - H2 : Métadonnées des résultats d’outils
  - H2 : Corps entrants et contexte d’historique
  - H2 : Mise en file d’attente et suivis
  - H2 : Propriété des exécutions de canal
  - H2 : Streaming, découpage et traitement par lots
  - H2 : Visibilité du raisonnement et tokens
  - H2 : Préfixes, fils de discussion et réponses
  - H2 : Réponses silencieuses
  - H2 : Connexe

## concepts/model-failover.md

- Chemin : /concepts/model-failover
- Titres :
  - H2 : Flux d’exécution
  - H2 : Politique de source de sélection
  - H2 : Cache d’évitement des échecs d’authentification
  - H2 : Avis de fallback visibles par l’utilisateur
  - H2 : Stockage d’authentification (clés + OAuth)
  - H2 : ID de profils
  - H2 : Ordre de rotation
  - H3 : Affinité de session (compatible avec le cache)
  - H3 : Abonnement OpenAI Codex plus secours par clé API
  - H2 : Périodes de récupération
  - H2 : Désactivations de facturation
  - H2 : Fallback de modèle
  - H3 : Règles de chaîne de candidats
  - H3 : Quelles erreurs font avancer le fallback
  - H3 : Comportement d’évitement ou de sondage pendant la période de récupération
  - H2 : Remplacements de session et changement de modèle en direct
  - H2 : Observabilité et résumés d’échecs
  - H2 : Configuration associée

## concepts/model-providers.md

- Chemin : /concepts/model-providers
- Titres :
  - H2 : Règles rapides
  - H2 : Comportement des fournisseurs détenu par les Plugins
  - H2 : Rotation des clés API
  - H2 : Plugins de fournisseurs officiels
  - H3 : OpenAI
  - H3 : Anthropic
  - H3 : OAuth OpenAI ChatGPT/Codex
  - H3 : Autres options hébergées de type abonnement
  - H3 : OpenCode
  - H3 : Google Gemini (clé API)
  - H3 : Google Vertex et Gemini CLI
  - H3 : Z.AI (GLM)
  - H3 : Vercel AI Gateway
  - H3 : Autres Plugins de fournisseurs groupés
  - H4 : Particularités utiles à connaître
  - H2 : Fournisseurs via models.providers (URL personnalisée/de base)
  - H3 : Moonshot AI (Kimi)
  - H3 : Codage Kimi
  - H3 : Volcano Engine (Doubao)
  - H3 : BytePlus (international)
  - H3 : Synthétique
  - H3 : MiniMax
  - H3 : LM Studio
  - H3 : Ollama
  - H3 : vLLM
  - H3 : SGLang
  - H3 : Proxys locaux (LM Studio, vLLM, LiteLLM, etc.)
  - H2 : Exemples CLI
  - H2 : Connexe

## concepts/models.md

- Chemin : /concepts/models
- Titres :
  - H2 : Fonctionnement de la sélection de modèle
  - H2 : Source de sélection et comportement de fallback
  - H2 : Politique de modèle rapide
  - H2 : Onboarding (recommandé)
  - H2 : Clés de configuration (vue d’ensemble)
  - H3 : Modifications sûres de la liste d’autorisation
  - H2 : « Model is not allowed » (et pourquoi les réponses s’arrêtent)
  - H2 : Changer de modèle dans le chat (/model)
  - H2 : Commandes CLI
  - H3 : models list
  - H3 : models status
  - H2 : Analyse (modèles gratuits OpenRouter)
  - H2 : Registre des modèles (models.json)
  - H2 : Connexe

## concepts/multi-agent.md

- Chemin : /concepts/multi-agent
- Titres :
  - H2 : Qu’est-ce qu’« un agent » ?
  - H2 : Chemins (carte rapide)
  - H3 : Mode agent unique (par défaut)
  - H2 : Assistant d’agent
  - H2 : Démarrage rapide
  - H2 : Plusieurs agents = plusieurs personnes, plusieurs personnalités
  - H2 : Recherche mémoire QMD inter-agents
  - H2 : Un numéro WhatsApp, plusieurs personnes (séparation des DM)
  - H2 : Règles de routage (comment les messages choisissent un agent)
  - H2 : Plusieurs comptes / numéros de téléphone
  - H2 : Concepts
  - H2 : Exemples de plateformes
  - H2 : Modèles courants
  - H2 : Sandbox et configuration d’outils par agent
  - H2 : Connexe

## concepts/oauth.md

- Chemin : /concepts/oauth
- Titres :
  - H2 : Récepteur de tokens (pourquoi il existe)
  - H2 : Stockage (où vivent les tokens)
  - H2 : Compatibilité des tokens hérités Anthropic
  - H2 : Migration Anthropic Claude CLI
  - H2 : Échange OAuth (fonctionnement de la connexion)
  - H3 : setup-token Anthropic
  - H3 : OpenAI Codex (OAuth ChatGPT)
  - H2 : Actualisation + expiration
  - H2 : Plusieurs comptes (profils) + routage
  - H3 : 1) Recommandé : agents séparés
  - H3 : 2) Avancé : plusieurs profils dans un agent
  - H2 : Connexe

## concepts/parallel-specialist-lanes.md

- Itinéraire : /concepts/parallel-specialist-lanes
- Titres :
  - H2: Principes fondamentaux
  - H2: Déploiement recommandé
  - H3: Phase 1 : contrats de lanes + tâches lourdes en arrière-plan
  - H3: Phase 2 : contrôles de priorité et de concurrence
  - H3: Phase 3 : coordinateur / contrôleur de trafic
  - H2: Modèle minimal de contrat de lane
  - H2: Associé

## concepts/personal-agent-benchmark-pack.md

- Itinéraire : /concepts/personal-agent-benchmark-pack
- Titres :
  - H2: Scénarios
  - H2: Modèle de confidentialité
  - H2: Étendre le pack

## concepts/presence.md

- Itinéraire : /concepts/presence
- Titres :
  - H2: Champs de présence (ce qui s’affiche)
  - H2: Producteurs (d’où vient la présence)
  - H3: 1) Entrée propre au Gateway
  - H3: 2) Connexion WebSocket
  - H4: Pourquoi les commandes CLI ponctuelles ne s’affichent pas
  - H3: 3) Balises system-event
  - H3: 4) Connexions Node (role: node)
  - H2: Règles de fusion + déduplication (pourquoi instanceId compte)
  - H2: TTL et taille bornée
  - H2: Mise en garde distant/tunnel (IP de bouclage)
  - H2: Consommateurs
  - H3: Onglet Instances macOS
  - H2: Conseils de débogage
  - H2: Associé

## concepts/progress-drafts.md

- Itinéraire : /concepts/progress-drafts
- Titres :
  - H2: Démarrage rapide
  - H2: Ce que voient les utilisateurs
  - H2: Choisir un mode
  - H2: Configurer les libellés
  - H2: Contrôler les lignes de progression
  - H2: Comportement des canaux
  - H2: Finalisation
  - H2: Dépannage
  - H2: Associé

## concepts/qa-e2e-automation.md

- Itinéraire : /concepts/qa-e2e-automation
- Titres :
  - H2: Surface de commande
  - H2: Flux opérateur
  - H2: Couverture du transport en direct
  - H2: Référence QA Telegram, Discord, Slack et WhatsApp
  - H3: Indicateurs CLI partagés
  - H3: QA Telegram
  - H3: QA Discord
  - H3: QA Slack
  - H4: Configurer l’espace de travail Slack
  - H3: QA WhatsApp
  - H3: Pool d’identifiants Convex
  - H2: Graines adossées au dépôt
  - H2: Lanes de simulation de fournisseur
  - H2: Adaptateurs de transport
  - H3: Ajouter un canal
  - H3: Noms des assistants de scénario
  - H2: Rapports
  - H2: Docs associés

## concepts/qa-matrix.md

- Itinéraire : /concepts/qa-matrix
- Titres :
  - H2: Démarrage rapide
  - H2: Ce que fait la lane
  - H2: CLI
  - H3: Indicateurs communs
  - H3: Indicateurs de fournisseur
  - H2: Profils
  - H2: Scénarios
  - H2: Variables d’environnement
  - H2: Artefacts de sortie
  - H2: Conseils de triage
  - H2: Contrat de transport en direct
  - H2: Associé

## concepts/queue-steering.md

- Itinéraire : /concepts/queue-steering
- Titres :
  - H2: Limite d’exécution
  - H2: Modes
  - H2: Exemple de rafale
  - H2: Portée
  - H2: Debounce
  - H2: Associé

## concepts/queue.md

- Itinéraire : /concepts/queue
- Titres :
  - H2: Pourquoi
  - H2: Fonctionnement
  - H2: Valeurs par défaut
  - H2: Modes de file d’attente
  - H2: Options de file d’attente
  - H2: Pilotage et streaming
  - H2: Précédence
  - H2: Remplacements par session
  - H2: Portée et garanties
  - H2: Dépannage
  - H2: Associé

## concepts/retry.md

- Itinéraire : /concepts/retry
- Titres :
  - H2: Objectifs
  - H2: Valeurs par défaut
  - H2: Comportement
  - H3: Fournisseurs de modèles
  - H3: Discord
  - H3: Telegram
  - H2: Configuration
  - H2: Notes
  - H2: Associé

## concepts/session-pruning.md

- Itinéraire : /concepts/session-pruning
- Titres :
  - H2: Pourquoi c’est important
  - H2: Fonctionnement
  - H2: Nettoyage des images héritées
  - H2: Valeurs par défaut intelligentes
  - H2: Activer ou désactiver
  - H2: Élagage vs compaction
  - H2: Pour aller plus loin
  - H2: Associé

## concepts/session-tool.md

- Itinéraire : /concepts/session-tool
- Titres :
  - H2: Outils disponibles
  - H2: Lister et lire les sessions
  - H2: Envoyer des messages intersessions
  - H2: Assistants d’état et d’orchestration
  - H2: Lancer des sous-agents
  - H2: Visibilité
  - H2: Pour aller plus loin
  - H2: Associé

## concepts/session.md

- Itinéraire : /concepts/session
- Titres :
  - H2: Comment les messages sont routés
  - H2: Isolation des DM
  - H3: Canaux liés au dock
  - H2: Cycle de vie des sessions
  - H2: Où réside l’état
  - H2: Maintenance des sessions
  - H2: Inspecter les sessions
  - H2: Pour aller plus loin
  - H2: Associé

## concepts/soul.md

- Itinéraire : /concepts/soul
- Titres :
  - H2: Ce qui appartient à SOUL.md
  - H2: Pourquoi cela fonctionne
  - H2: Le prompt Molty
  - H2: À quoi ressemble une bonne version
  - H2: Un avertissement
  - H2: Associé

## concepts/streaming.md

- Itinéraire : /concepts/streaming
- Titres :
  - H2: Streaming par blocs (messages de canal)
  - H3: Livraison de médias avec le streaming par blocs
  - H2: Algorithme de découpage (bornes basse/haute)
  - H2: Regroupement (fusionner les blocs streamés)
  - H2: Rythme humain entre les blocs
  - H2: "Streamer les fragments ou tout"
  - H2: Modes de streaming d’aperçu
  - H3: Mappage des canaux
  - H3: Comportement à l’exécution
  - H3: Mises à jour d’aperçu de progression des outils
  - H3: Lane de progression des commentaires
  - H2: Associé

## concepts/system-prompt.md

- Itinéraire : /concepts/system-prompt
- Titres :
  - H2: Structure
  - H2: Modes de prompt
  - H2: Instantanés de prompt
  - H2: Injection d’amorçage de l’espace de travail
  - H2: Gestion du temps
  - H2: Skills
  - H2: Documentation
  - H2: Associé

## concepts/timezone.md

- Itinéraire : /concepts/timezone
- Titres :
  - H2: Trois surfaces de fuseau horaire
  - H2: Définir le fuseau horaire de l’utilisateur
  - H2: Quand remplacer
  - H2: Associé

## concepts/typebox.md

- Itinéraire : /concepts/typebox
- Titres :
  - H2: Modèle mental (30 secondes)
  - H2: Où se trouvent les schémas
  - H2: Pipeline actuel
  - H2: Comment les schémas sont utilisés à l’exécution
  - H2: Exemples de trames
  - H2: Client minimal (Node.js)
  - H2: Exemple guidé : ajouter une méthode de bout en bout
  - H2: Comportement de codegen Swift
  - H2: Versionnement + compatibilité
  - H2: Motifs et conventions de schéma
  - H2: JSON de schéma en direct
  - H2: Quand vous modifiez les schémas
  - H2: Associé

## concepts/typing-indicators.md

- Itinéraire : /concepts/typing-indicators
- Titres :
  - H2: Valeurs par défaut
  - H2: Modes
  - H2: Configuration
  - H2: Notes
  - H2: Associé

## concepts/usage-tracking.md

- Itinéraire : /concepts/usage-tracking
- Titres :
  - H2: Ce que c’est
  - H2: Où cela s’affiche
  - H2: Mode de pied de page d’utilisation par défaut
  - H3: Trois états de session distincts
  - H3: Précédence
  - H3: Réinitialiser ou désactiver
  - H3: Comportement du basculement
  - H3: Config
  - H2: Pied de page /usage full personnalisé
  - H3: Forme
  - H3: Chemins de contrat
  - H3: Verbes
  - H3: Formes des morceaux
  - H3: Exemple
  - H2: Fournisseurs + identifiants
  - H2: Associé

## date-time.md

- Itinéraire : /date-time
- Titres :
  - H2: Enveloppes de message (locales par défaut)
  - H3: Exemples
  - H2: Prompt système : date et heure actuelles
  - H2: Lignes d’événements système (locales par défaut)
  - H3: Configurer le fuseau horaire utilisateur + le format
  - H2: Détection du format horaire (auto)
  - H2: Charges utiles d’outils + connecteurs (heure brute du fournisseur + champs normalisés)
  - H2: Docs associés

## debug/node-issue.md

- Itinéraire : /debug/node-issue
- Titres :
  - H1: Plantage Node + tsx "\\name is not a function"
  - H2: Résumé
  - H2: Environnement
  - H2: Repro (Node uniquement)
  - H2: Repro minimale dans le dépôt
  - H2: Vérification de la version de Node
  - H2: Notes / hypothèse
  - H2: Historique de régression
  - H2: Contournements
  - H2: Références
  - H2: Prochaines étapes
  - H2: Associé

## diagnostics/flags.md

- Itinéraire : /diagnostics/flags
- Titres :
  - H2: Fonctionnement
  - H2: Activer via la config
  - H2: Remplacement par env (ponctuel)
  - H2: Indicateurs de profilage
  - H2: Artefacts de chronologie
  - H2: Où vont les journaux
  - H2: Extraire les journaux
  - H2: Notes
  - H2: Associé

## gateway/authentication.md

- Itinéraire : /gateway/authentication
- Titres :
  - H2: Configuration recommandée (clé API, n’importe quel fournisseur)
  - H2: Anthropic : compatibilité Claude CLI et jeton
  - H2: Note Anthropic
  - H2: Vérifier l’état d’authentification du modèle
  - H2: Comportement de rotation des clés API (gateway)
  - H2: Supprimer l’authentification du fournisseur pendant l’exécution du gateway
  - H2: Contrôler l’identifiant utilisé
  - H3: OpenAI et anciens ids openai-codex
  - H3: Pendant la connexion (CLI)
  - H3: Par session (commande de chat)
  - H3: Par agent (remplacement CLI)
  - H2: Dépannage
  - H3: "Aucun identifiant trouvé"
  - H3: Jeton expirant/expiré
  - H2: Associé

## gateway/background-process.md

- Itinéraire : /gateway/background-process
- Titres :
  - H2: Outil exec
  - H2: Pontage des processus enfants
  - H2: Outil process
  - H2: Exemples
  - H2: Associé

## gateway/bonjour.md

- Itinéraire : /gateway/bonjour
- Titres :
  - H2: Bonjour étendu (Unicast DNS-SD) via Tailscale
  - H3: Config Gateway (recommandée)
  - H3: Configuration ponctuelle du serveur DNS (hôte gateway)
  - H3: Paramètres DNS Tailscale
  - H3: Sécurité de l’écouteur Gateway (recommandée)
  - H2: Ce qui annonce
  - H2: Types de service
  - H2: Clés TXT (indices non secrets)
  - H2: Débogage sur macOS
  - H2: Débogage dans les journaux Gateway
  - H2: Débogage sur le nœud iOS
  - H2: Quand activer Bonjour
  - H2: Quand désactiver Bonjour
  - H2: Pièges Docker
  - H2: Dépanner Bonjour désactivé
  - H2: Modes d’échec courants
  - H2: Noms d’instances échappés (\032)
  - H2: Activation / désactivation / configuration
  - H2: Docs associés

## gateway/bridge-protocol.md

- Itinéraire : /gateway/bridge-protocol
- Titres :
  - H2: Pourquoi il existait
  - H2: Transport
  - H2: Handshake + appairage
  - H2: Trames
  - H2: Événements de cycle de vie d’exec
  - H2: Utilisation historique du tailnet
  - H2: Versionnement
  - H2: Associé

## gateway/cli-backends.md

- Itinéraire : /gateway/cli-backends
- Titres :
  - H2: Démarrage rapide adapté aux débutants
  - H2: L’utiliser comme solution de secours
  - H2: Vue d’ensemble de la configuration
  - H3: Exemple de configuration
  - H2: Fonctionnement
  - H2: Sessions
  - H2: Prélude de repli depuis les sessions claude-cli
  - H2: Images (transmission directe)
  - H2: Entrées / sorties
  - H2: Valeurs par défaut (propres au Plugin)
  - H2: Valeurs par défaut propres au Plugin
  - H2: Propriété de la Compaction native
  - H2: Superpositions MCP du bundle
  - H2: Plafond de réamorçage de l’historique
  - H2: Limitations
  - H2: Dépannage
  - H2: Associé

## gateway/config-agents.md

- Itinéraire : /gateway/config-agents
- Titres :
  - H2: Valeurs par défaut des agents
  - H3: agents.defaults.workspace
  - H3: agents.defaults.repoRoot
  - H3: agents.defaults.skills
  - H3: agents.defaults.skipBootstrap
  - H3: agents.defaults.skipOptionalBootstrapFiles
  - H3: agents.defaults.contextInjection
  - H3: agents.defaults.bootstrapMaxChars
  - H3: agents.defaults.bootstrapTotalMaxChars
  - H3: Remplacements de profil d’amorçage par agent
  - H3: agents.defaults.bootstrapPromptTruncationWarning
  - H3: Carte de propriété du budget de contexte
  - H4: agents.defaults.startupContext
  - H4: agents.defaults.contextLimits
  - H4: agents.list[].contextLimits
  - H4: skills.limits.maxSkillsPromptChars
  - H4: agents.list[].skillsLimits.maxSkillsPromptChars
  - H3: agents.defaults.imageMaxDimensionPx
  - H3: agents.defaults.imageQuality
  - H3: agents.defaults.userTimezone
  - H3: agents.defaults.timeFormat
  - H3: agents.defaults.model
  - H3: Politique d’exécution
  - H3: agents.defaults.cliBackends
  - H3: agents.defaults.promptOverlays
  - H3: agents.defaults.heartbeat
  - H3: agents.defaults.compaction
  - H3: agents.defaults.runRetries
  - H3: agents.defaults.contextPruning
  - H3: Streaming par blocs
  - H3: Indicateurs de saisie
  - H3: agents.defaults.sandbox
  - H3: agents.list (remplacements par agent)
  - H2: Routage multi-agent
  - H3: Champs de correspondance de liaison
  - H3: Profils d’accès par agent
  - H2: Session
  - H2: Messages
  - H3: Préfixe de réponse
  - H3: Réaction d’accusé de réception
  - H3: Debounce entrant
  - H3: TTS (text-to-speech)
  - H2: Talk
  - H2: Associé

## gateway/config-channels.md

- Itinéraire : /gateway/config-channels
- Titres :
  - H2: Canaux
  - H3: Accès aux DM et aux groupes
  - H3: Remplacements de modèle par canal
  - H3: Valeurs par défaut des canaux et Heartbeat
  - H3: WhatsApp
  - H3: Telegram
  - H3: Discord
  - H3: Google Chat
  - H3: Slack
  - H3: Mattermost
  - H3: Signal
  - H3: iMessage
  - H3: Matrix
  - H3: Microsoft Teams
  - H3: IRC
  - H3: Multi-compte (tous les canaux)
  - H3: Autres canaux de Plugin
  - H3: Filtrage par mention dans les chats de groupe
  - H4: Limites d’historique des DM
  - H4: Mode d’auto-chat
  - H3: Commandes (gestion des commandes de chat)
  - H2: Associé

## gateway/config-tools.md

- Route : /gateway/config-tools
- Titres :
  - H2 : Outils
  - H3 : Profils d’outils
  - H3 : Groupes d’outils
  - H3 : Outils MCP et Plugin dans la politique d’outils du bac à sable
  - H3 : tools.codeMode
  - H3 : tools.allow / tools.deny
  - H3 : tools.byProvider
  - H3 : tools.toolsBySender
  - H3 : tools.elevated
  - H3 : tools.exec
  - H3 : tools.loopDetection
  - H3 : tools.web
  - H3 : tools.media
  - H3 : tools.agentToAgent
  - H3 : tools.sessions
  - H3 : tools.sessionsspawn
  - H3 : tools.experimental
  - H3 : agents.defaults.subagents
  - H2 : Fournisseurs personnalisés et URL de base
  - H3 : Détails des champs de fournisseur
  - H3 : Exemples de fournisseurs
  - H2 : Connexe

## gateway/configuration-examples.md

- Route : /gateway/configuration-examples
- Titres :
  - H2 : Démarrage rapide
  - H3 : Minimum absolu
  - H3 : Configuration de départ recommandée
  - H2 : Exemple étendu (options principales)
  - H3 : Dépôt de Skills voisin lié par symlink
  - H2 : Modèles courants
  - H3 : Base de Skills partagée avec une seule substitution
  - H3 : Configuration multiplateforme
  - H3 : Approbation automatique du réseau de nœuds de confiance
  - H3 : Mode DM sécurisé (boîte de réception partagée / DM multi-utilisateurs)
  - H3 : Clé d’API Anthropic + solution de repli MiniMax
  - H3 : Bot de travail (accès restreint)
  - H3 : Modèles locaux uniquement
  - H2 : Conseils
  - H2 : Connexe

## gateway/configuration-reference.md

- Route : /gateway/configuration-reference
- Titres :
  - H2 : Canaux
  - H2 : Paramètres par défaut des agents, multi-agent, sessions et messages
  - H2 : Outils et fournisseurs personnalisés
  - H2 : Modèles
  - H2 : MCP
  - H2 : Skills
  - H2 : Plugins
  - H3 : Configuration du Plugin de harnais Codex
  - H2 : Engagements
  - H2 : Navigateur
  - H2 : Interface utilisateur
  - H2 : Gateway
  - H3 : Points de terminaison compatibles OpenAI
  - H3 : Isolation multi-instance
  - H3 : gateway.tls
  - H3 : gateway.reload
  - H2 : Hooks
  - H3 : Intégration Gmail
  - H2 : Hôte de Plugin Canvas
  - H2 : Découverte
  - H3 : mDNS (Bonjour)
  - H3 : Zone étendue (DNS-SD)
  - H2 : Environnement
  - H3 : env (variables d’environnement intégrées)
  - H3 : Substitution des variables d’environnement
  - H2 : Secrets
  - H3 : SecretRef
  - H3 : Surface d’identifiants prise en charge
  - H3 : Configuration des fournisseurs de secrets
  - H2 : Stockage d’authentification
  - H3 : auth.cooldowns
  - H2 : Journalisation
  - H2 : Diagnostics
  - H2 : Mise à jour
  - H2 : ACP
  - H2 : CLI
  - H2 : Assistant
  - H2 : Identité
  - H2 : Bridge (hérité, supprimé)
  - H2 : Cron
  - H3 : cron.retry
  - H3 : cron.failureAlert
  - H3 : cron.failureDestination
  - H2 : Variables de modèle pour les modèles multimédias
  - H2 : Inclusions de configuration ($include)
  - H2 : Connexe

## gateway/configuration.md

- Route : /gateway/configuration
- Titres :
  - H2 : Configuration minimale
  - H2 : Modification de la configuration
  - H2 : Validation stricte
  - H2 : Tâches courantes
  - H2 : Rechargement à chaud de la configuration
  - H3 : Modes de rechargement
  - H3 : Ce qui s’applique à chaud et ce qui nécessite un redémarrage
  - H3 : Planification du rechargement
  - H2 : RPC de configuration (mises à jour programmatiques)
  - H2 : Variables d’environnement
  - H2 : Référence complète
  - H2 : Connexe

## gateway/diagnostics.md

- Route : /gateway/diagnostics
- Titres :
  - H2 : Démarrage rapide
  - H2 : Commande de chat
  - H2 : Ce que contient l’export
  - H2 : Modèle de confidentialité
  - H2 : Enregistreur de stabilité
  - H2 : Options utiles
  - H2 : Désactiver les diagnostics
  - H2 : Connexe

## gateway/discovery.md

- Route : /gateway/discovery
- Titres :
  - H2 : Termes
  - H2 : Pourquoi nous conservons à la fois le direct et SSH
  - H2 : Entrées de découverte (comment les clients savent où se trouve le Gateway)
  - H3 : 1) Découverte Bonjour / DNS-SD
  - H4 : Détails de la balise de service
  - H3 : 2) Tailnet (interréseau)
  - H3 : 3) Cible manuelle / SSH
  - H2 : Sélection du transport (politique client)
  - H2 : Appairage + authentification (transport direct)
  - H2 : Responsabilités par composant
  - H2 : Connexe

## gateway/doctor.md

- Route : /gateway/doctor
- Titres :
  - H2 : Démarrage rapide
  - H3 : Modes sans interface et d’automatisation
  - H2 : Mode lint en lecture seule
  - H2 : Ce qu’il fait (résumé)
  - H2 : Remplissage rétroactif et réinitialisation de l’interface Dreaming
  - H2 : Comportement détaillé et justification
  - H2 : Connexe

## gateway/external-apps.md

- Route : /gateway/external-apps
- Titres :
  - H2 : Ce qui est disponible aujourd’hui
  - H2 : Chemin recommandé
  - H2 : Code d’application vs code de Plugin
  - H2 : Connexe

## gateway/gateway-lock.md

- Route : /gateway/gateway-lock
- Titres :
  - H2 : Pourquoi
  - H2 : Mécanisme
  - H2 : Surface d’erreur
  - H2 : Notes opérationnelles
  - H2 : Connexe

## gateway/health.md

- Route : /gateway/health
- Titres :
  - H2 : Vérifications rapides
  - H2 : Diagnostics approfondis
  - H2 : Configuration du moniteur de santé
  - H2 : Surveillance du temps de disponibilité
  - H3 : Exemples de configuration de service de surveillance
  - H2 : Quand quelque chose échoue
  - H2 : Commande dédiée « health »
  - H2 : Connexe

## gateway/heartbeat.md

- Route : /gateway/heartbeat
- Titres :
  - H2 : Démarrage rapide (débutant)
  - H2 : Valeurs par défaut
  - H2 : À quoi sert l’invite Heartbeat
  - H2 : Contrat de réponse
  - H2 : Configuration
  - H3 : Portée et priorité
  - H3 : Heartbeat par agent
  - H3 : Exemple d’heures actives
  - H3 : Configuration 24/7
  - H3 : Exemple multi-comptes
  - H3 : Notes de terrain
  - H2 : Comportement de livraison
  - H2 : Contrôles de visibilité
  - H3 : Ce que fait chaque indicateur
  - H3 : Exemples par canal vs par compte
  - H3 : Modèles courants
  - H2 : HEARTBEAT.md (facultatif)
  - H3 : blocs tasks:
  - H3 : L’agent peut-il mettre à jour HEARTBEAT.md ?
  - H2 : Réveil manuel (à la demande)
  - H2 : Livraison du raisonnement (facultatif)
  - H2 : Sensibilisation aux coûts
  - H2 : Débordement de contexte après Heartbeat
  - H2 : Connexe

## gateway/index.md

- Route : /gateway
- Titres :
  - H2 : Démarrage local en 5 minutes
  - H2 : Modèle d’exécution
  - H2 : Points de terminaison compatibles OpenAI
  - H3 : Priorité du port et de l’adresse d’écoute
  - H3 : Modes de rechargement à chaud
  - H2 : Ensemble de commandes de l’opérateur
  - H2 : Gateways multiples (même hôte)
  - H2 : Accès à distance
  - H2 : Supervision et cycle de vie du service
  - H2 : Chemin rapide du profil de développement
  - H2 : Référence rapide du protocole (vue opérateur)
  - H2 : Vérifications opérationnelles
  - H3 : Vivacité
  - H3 : Disponibilité
  - H3 : Récupération des interruptions
  - H2 : Signatures de défaillance courantes
  - H2 : Garanties de sécurité
  - H2 : Connexe

## gateway/local-model-services.md

- Route : /gateway/local-model-services
- Titres :
  - H2 : Fonctionnement
  - H2 : Forme de la configuration
  - H2 : Champs
  - H2 : Exemple Inferrs
  - H2 : Exemple ds4
  - H2 : Notes opérationnelles
  - H2 : Connexe

## gateway/local-models.md

- Route : /gateway/local-models
- Titres :
  - H2 : Configuration matérielle minimale
  - H2 : Choisir un backend
  - H2 : Recommandé : LM Studio + grand modèle local (Responses API)
  - H3 : Configuration hybride : principal hébergé, repli local
  - H3 : Local d’abord avec filet de sécurité hébergé
  - H3 : Hébergement régional / routage des données
  - H2 : Autres proxys locaux compatibles OpenAI
  - H2 : Backends plus petits ou plus stricts
  - H2 : Dépannage
  - H2 : Connexe

## gateway/logging.md

- Route : /gateway/logging
- Titres :
  - H1 : Journalisation
  - H2 : Journaliseur basé sur des fichiers
  - H2 : Capture de la console
  - H2 : Masquage
  - H2 : Journaux WebSocket du Gateway
  - H3 : Style des journaux WS
  - H2 : Mise en forme de la console (journalisation des sous-systèmes)
  - H2 : Connexe

## gateway/multiple-gateways.md

- Route : /gateway/multiple-gateways
- Titres :
  - H2 : Meilleure configuration recommandée
  - H2 : Démarrage rapide de Rescue-Bot
  - H2 : Pourquoi cela fonctionne
  - H2 : Ce que modifie --profile rescue onboard
  - H2 : Configuration générale multi-Gateway
  - H2 : Liste de contrôle d’isolation
  - H2 : Mappage des ports (dérivé)
  - H2 : Notes navigateur/CDP (piège courant)
  - H2 : Exemple d’env manuel
  - H2 : Vérifications rapides
  - H2 : Connexe

## gateway/network-model.md

- Route : /gateway/network-model
- Titres :
  - H2 : Connexe

## gateway/openai-http-api.md

- Route : /gateway/openai-http-api
- Titres :
  - H2 : Authentification
  - H2 : Limite de sécurité (important)
  - H2 : Quand utiliser ce point de terminaison
  - H2 : Contrat de modèle agent-first
  - H2 : Activation du point de terminaison
  - H2 : Désactivation du point de terminaison
  - H2 : Comportement de session
  - H2 : Pourquoi cette surface est importante
  - H2 : Liste des modèles et routage des agents
  - H2 : Streaming (SSE)
  - H2 : Contrat d’outils de chat
  - H3 : Champs de requête pris en charge
  - H3 : Variantes non prises en charge
  - H3 : Forme de réponse d’outil non-streaming
  - H3 : Forme de réponse d’outil streaming
  - H3 : Boucle de suivi des outils
  - H2 : Configuration rapide Open WebUI
  - H2 : Exemples
  - H2 : Connexe

## gateway/openresponses-http-api.md

- Route : /gateway/openresponses-http-api
- Titres :
  - H2 : Authentification, sécurité et routage
  - H2 : Comportement de session
  - H2 : Forme de requête (prise en charge)
  - H2 : Éléments (entrée)
  - H3 : message
  - H3 : functioncalloutput (outils par tour)
  - H3 : reasoning et itemreference
  - H2 : Outils (outils de fonction côté client)
  - H2 : Images (inputimage)
  - H2 : Fichiers (inputfile)
  - H2 : Limites fichier + image (configuration)
  - H2 : Streaming (SSE)
  - H2 : Utilisation
  - H2 : Erreurs
  - H2 : Exemples
  - H2 : Connexe

## gateway/openshell.md

- Route : /gateway/openshell
- Titres :
  - H2 : Prérequis
  - H2 : Démarrage rapide
  - H2 : Modes d’espace de travail
  - H3 : mirror
  - H3 : remote
  - H3 : Choisir un mode
  - H2 : Référence de configuration
  - H2 : Exemples
  - H3 : Configuration distante minimale
  - H3 : Mode mirror avec GPU
  - H3 : OpenShell par agent avec Gateway personnalisé
  - H2 : Gestion du cycle de vie
  - H3 : Quand recréer
  - H2 : Renforcement de la sécurité
  - H2 : Limites actuelles
  - H2 : Fonctionnement
  - H2 : Connexe

## gateway/opentelemetry.md

- Route : /gateway/opentelemetry
- Titres :
  - H2 : Comment tout s’articule
  - H2 : Démarrage rapide
  - H2 : Signaux exportés
  - H2 : Référence de configuration
  - H3 : Variables d’environnement
  - H2 : Confidentialité et capture de contenu
  - H2 : Échantillonnage et vidage
  - H2 : Métriques exportées
  - H3 : Utilisation des modèles
  - H3 : Flux de messages
  - H3 : Talk
  - H3 : Files d’attente et sessions
  - H3 : Télémétrie de vivacité de session
  - H3 : Cycle de vie du harnais
  - H3 : Exécution des outils
  - H3 : Exec
  - H3 : Internes de diagnostic (mémoire et boucle d’outils)
  - H2 : Spans exportés
  - H2 : Catalogue des événements de diagnostic
  - H2 : Sans exportateur
  - H2 : Désactiver
  - H2 : Connexe

## gateway/operator-scopes.md

- Route : /gateway/operator-scopes
- Titres :
  - H2 : Rôles
  - H2 : Niveaux de portée
  - H2 : La portée de la méthode n’est que la première barrière
  - H2 : Approbations d’appairage d’appareil
  - H2 : Approbations d’appairage de nœud
  - H2 : Authentification par secret partagé

## gateway/pairing.md

- Route : /gateway/pairing
- Titres :
  - H2 : Concepts
  - H2 : Fonctionnement de l’appairage
  - H2 : Workflow CLI (adapté au sans interface)
  - H2 : Surface d’API (protocole Gateway)
  - H2 : Verrouillage des commandes Node (2026.3.31+)
  - H2 : Limites de confiance des événements Node (2026.3.31+)
  - H2 : Approbation automatique (app macOS)
  - H2 : Approbation automatique des appareils par CIDR de confiance
  - H2 : Approbation automatique par mise à niveau des métadonnées
  - H2 : Assistants d’appairage QR
  - H2 : Localité et en-têtes transférés
  - H2 : Stockage (local, privé)
  - H2 : Comportement du transport
  - H2 : Connexe

## gateway/prometheus.md

- Route : /gateway/prometheus
- Titres :
  - H2 : Démarrage rapide
  - H2 : Métriques exportées
  - H2 : Politique des libellés
  - H2 : Recettes PromQL
  - H2 : Choisir entre Prometheus et l’export OpenTelemetry
  - H2 : Dépannage
  - H2 : Connexe

## gateway/protocol.md

- Route : /gateway/protocol
- Titres :
  - H2 : Transport
  - H2 : Handshake (connexion)
  - H3 : Exemple Node
  - H2 : Encadrement
  - H2 : Rôles + portées
  - H3 : Rôles
  - H3 : Portées (opérateur)
  - H3 : Capacités/commandes/autorisations (nœud)
  - H2 : Présence
  - H3 : Événement de vivacité d’arrière-plan Node
  - H2 : Portée des événements diffusés
  - H2 : Familles courantes de méthodes RPC
  - H3 : Familles courantes d’événements
  - H3 : Méthodes d’assistance Node
  - H3 : RPC de registre des tâches
  - H3 : Méthodes d’assistance opérateur
  - H3 : vues models.list
  - H2 : Approbations d’exécution
  - H2 : Repli de livraison d’agent
  - H2 : Versionnement
  - H3 : Constantes client
  - H2 : Authentification
  - H2 : Identité d’appareil + appairage
  - H3 : Diagnostics de migration de l’authentification des appareils
  - H2 : TLS + épinglage
  - H2 : Portée
  - H2 : Connexe

## gateway/remote-gateway-readme.md

- Route : /gateway/remote-gateway-readme
- Titres :
  - H1 : Exécuter OpenClaw.app avec un Gateway distant
  - H2 : Vue d’ensemble
  - H2 : Configuration rapide
  - H3 : Étape 1 : Ajouter la configuration SSH
  - H3 : Étape 2 : Copier la clé SSH
  - H3 : Étape 3 : Configurer l’authentification du Gateway distant
  - H3 : Étape 4 : Démarrer le tunnel SSH
  - H3 : Étape 5 : Redémarrer OpenClaw.app
  - H2 : Démarrer automatiquement le tunnel à la connexion
  - H3 : Créer le fichier PLIST
  - H3 : Charger l’agent Launch Agent
  - H2 : Dépannage
  - H2 : Fonctionnement
  - H2 : Connexe

## gateway/remote.md

- Route : /gateway/remote
- Titres :
  - H2: L’idée centrale
  - H2: Configurations VPN et tailnet courantes
  - H3: Gateway toujours actif dans votre tailnet
  - H3: L’ordinateur de bureau domestique exécute le Gateway
  - H3: L’ordinateur portable exécute le Gateway
  - H2: Flux de commandes (ce qui s’exécute où)
  - H2: Tunnel SSH (CLI + outils)
  - H2: Valeurs par défaut distantes de la CLI
  - H2: Priorité des identifiants
  - H2: Accès distant à l’interface de chat
  - H2: Mode distant de l’application macOS
  - H2: Règles de sécurité (distant/VPN)
  - H3: macOS : tunnel SSH persistant via LaunchAgent
  - H4: Étape 1 : ajouter la configuration SSH
  - H4: Étape 2 : copier la clé SSH (une seule fois)
  - H4: Étape 3 : configurer le jeton du gateway
  - H4: Étape 4 : créer le LaunchAgent
  - H4: Étape 5 : charger le LaunchAgent
  - H4: Dépannage
  - H2: Liés

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- Route : /gateway/sandbox-vs-tool-policy-vs-elevated
- Titres :
  - H2: Débogage rapide
  - H2: Bac à sable : où les outils s’exécutent
  - H3: Montages liés (vérification de sécurité rapide)
  - H2: Politique des outils : quels outils existent/sont appelables
  - H3: Groupes d’outils (raccourcis)
  - H2: Élevé : exec uniquement « exécuter sur l’hôte »
  - H2: Correctifs courants pour la « prison de bac à sable »
  - H3: « Outil X bloqué par la politique d’outils du bac à sable »
  - H3: « Je pensais que c’était main, pourquoi est-ce dans un bac à sable ? »
  - H2: Liés

## gateway/sandboxing.md

- Route : /gateway/sandboxing
- Titres :
  - H2: Ce qui est placé en bac à sable
  - H2: Modes
  - H2: Portée
  - H2: Backend
  - H3: Choisir un backend
  - H3: Backend Docker
  - H3: Backend SSH
  - H3: Backend OpenShell
  - H4: Modes d’espace de travail
  - H4: Cycle de vie OpenShell
  - H2: Accès à l’espace de travail
  - H2: Montages liés personnalisés
  - H2: Images et configuration
  - H2: setupCommand (configuration unique du conteneur)
  - H2: Politique des outils et échappatoires
  - H2: Remplacements multi-agents
  - H2: Exemple minimal d’activation
  - H2: Liés

## gateway/secrets-plan-contract.md

- Route : /gateway/secrets-plan-contract
- Titres :
  - H2: Forme du fichier de plan
  - H2: Upserts et suppressions des fournisseurs
  - H2: Portée cible prise en charge
  - H2: Comportement du type de cible
  - H2: Règles de validation des chemins
  - H2: Comportement en cas d’échec
  - H2: Comportement de consentement du fournisseur exec
  - H2: Notes sur la portée d’exécution et d’audit
  - H2: Vérifications opérateur
  - H2: Documents liés

## gateway/secrets.md

- Route : /gateway/secrets
- Titres :
  - H2: Objectifs et modèle d’exécution
  - H2: Limite d’accès de l’agent
  - H2: Filtrage de la surface active
  - H2: Diagnostics de la surface d’authentification du Gateway
  - H2: Prévol de référence d’onboarding
  - H2: Contrat SecretRef
  - H2: Configuration du fournisseur
  - H2: Clés API adossées à des fichiers
  - H2: Exemples d’intégration exec
  - H2: Variables d’environnement du serveur MCP
  - H2: Matériel d’authentification SSH du bac à sable
  - H2: Surface d’identifiants prise en charge
  - H2: Comportement requis et priorité
  - H2: Déclencheurs d’activation
  - H2: Signaux dégradés et rétablis
  - H2: Résolution du chemin de commande
  - H2: Workflow d’audit et de configuration
  - H2: Politique de sécurité à sens unique
  - H2: Notes de compatibilité de l’authentification héritée
  - H2: Note sur l’interface Web
  - H2: Liés

## gateway/security/audit-checks.md

- Route : /gateway/security/audit-checks
- Titres :
  - H2: Liés

## gateway/security/exposure-runbook.md

- Route : /gateway/security/exposure-runbook
- Titres :
  - H2: Choisir le modèle d’exposition
  - H2: Inventaire de prévol
  - H2: Vérifications de référence
  - H2: Référence minimale sûre
  - H2: Exposition des DM et des groupes
  - H2: Vérifications du proxy inverse
  - H2: Revue des outils et du bac à sable
  - H2: Validation après changement
  - H2: Plan de retour arrière
  - H2: Liste de contrôle de revue

## gateway/security/index.md

- Route : /gateway/security
- Titres :
  - H2: D’abord la portée : modèle de sécurité de l’assistant personnel
  - H2: Vérification rapide : audit de sécurité openclaw
  - H3: Verrouillage des dépendances du paquet publié
  - H3: Déploiement et confiance dans l’hôte
  - H3: Opérations de fichiers sécurisées
  - H3: Espace de travail Slack partagé : risque réel
  - H3: Agent partagé par l’entreprise : modèle acceptable
  - H2: Concept de confiance Gateway et Node
  - H2: Matrice des limites de confiance
  - H2: Pas des vulnérabilités par conception
  - H2: Référence renforcée en 60 secondes
  - H2: Règle rapide de boîte de réception partagée
  - H2: Modèle de visibilité du contexte
  - H2: Ce que l’audit vérifie (haut niveau)
  - H2: Carte de stockage des identifiants
  - H2: Liste de contrôle d’audit de sécurité
  - H2: Glossaire de l’audit de sécurité
  - H2: Interface de contrôle via HTTP
  - H2: Résumé des indicateurs non sécurisés ou dangereux
  - H2: Configuration du proxy inverse
  - H2: Notes HSTS et origine
  - H2: Les journaux de session locaux résident sur le disque
  - H2: Exécution Node (system.run)
  - H2: Skills dynamiques (observateur / nœuds distants)
  - H2: Le modèle de menace
  - H2: Concept central : contrôle d’accès avant intelligence
  - H2: Modèle d’autorisation des commandes
  - H2: Risque des outils du plan de contrôle
  - H2: Plugins
  - H2: Modèle d’accès DM : appairage, liste d’autorisation, ouvert, désactivé
  - H2: Isolation des sessions DM (mode multi-utilisateur)
  - H3: Mode DM sécurisé (recommandé)
  - H2: Listes d’autorisation pour les DM et les groupes
  - H2: Injection de prompt (ce que c’est, pourquoi c’est important)
  - H2: Nettoyage des jetons spéciaux du contenu externe
  - H2: Indicateurs de contournement non sécurisé du contenu externe
  - H3: L’injection de prompt ne nécessite pas de DM publics
  - H3: Backends LLM auto-hébergés
  - H3: Puissance du modèle (note de sécurité)
  - H2: Raisonnement et sortie détaillée dans les groupes
  - H2: Exemples de renforcement de la configuration
  - H3: Permissions de fichiers
  - H3: Exposition réseau (liaison, port, pare-feu)
  - H3: Publication de ports Docker avec UFW
  - H3: Découverte mDNS/Bonjour
  - H3: Verrouiller le WebSocket du Gateway (authentification locale)
  - H3: En-têtes d’identité Tailscale Serve
  - H3: Contrôle du navigateur via l’hôte Node (recommandé)
  - H3: Secrets sur disque
  - H3: Fichiers .env de l’espace de travail
  - H3: Journaux et transcriptions (rédaction et rétention)
  - H3: DM : appairage par défaut
  - H3: Groupes : exiger une mention partout
  - H3: Numéros séparés (WhatsApp, Signal, Telegram)
  - H3: Mode lecture seule (via bac à sable et outils)
  - H3: Référence sécurisée (copier/coller)
  - H2: Mise en bac à sable (recommandée)
  - H3: Garde-fou de délégation de sous-agent
  - H2: Risques du contrôle du navigateur
  - H3: Politique SSRF du navigateur (stricte par défaut)
  - H2: Profils d’accès par agent (multi-agent)
  - H3: Exemple : accès complet (sans bac à sable)
  - H3: Exemple : outils en lecture seule + espace de travail en lecture seule
  - H3: Exemple : aucun accès au système de fichiers/shell (messagerie fournisseur autorisée)
  - H2: Réponse aux incidents
  - H3: Contenir
  - H3: Rotation (supposer une compromission si des secrets ont fuité)
  - H3: Auditer
  - H3: Collecter pour un rapport
  - H2: Analyse des secrets
  - H2: Signaler des problèmes de sécurité

## gateway/security/secure-file-operations.md

- Route : /gateway/security/secure-file-operations
- Titres :
  - H2: Par défaut : aucun assistant Python
  - H2: Ce qui reste protégé sans Python
  - H2: Ce que Python ajoute
  - H2: Recommandations pour Plugin et le cœur

## gateway/security/shrinkwrap.md

- Route : /gateway/security/shrinkwrap
- Titres :
  - H2: La version simple
  - H2: Pourquoi OpenClaw l’utilise
  - H2: Détails techniques

## gateway/tailscale.md

- Route : /gateway/tailscale
- Titres :
  - H2: Modes
  - H2: Authentification
  - H2: Exemples de configuration
  - H3: Tailnet uniquement (Serve)
  - H3: Tailnet uniquement (liaison à l’IP Tailnet)
  - H3: Internet public (Funnel + mot de passe partagé)
  - H2: Exemples CLI
  - H2: Notes
  - H2: Contrôle du navigateur (Gateway distant + navigateur local)
  - H2: Prérequis + limites de Tailscale
  - H2: En savoir plus
  - H2: Liés

## gateway/tools-invoke-http-api.md

- Route : /gateway/tools-invoke-http-api
- Titres :
  - H2: Authentification
  - H2: Limite de sécurité (important)
  - H2: Corps de la requête
  - H2: Politique + comportement de routage
  - H2: Réponses
  - H2: Exemple
  - H2: Liés

## gateway/troubleshooting.md

- Route : /gateway/troubleshooting
- Titres :
  - H2: Échelle de commandes
  - H2: Après une mise à jour
  - H2: Installations split brain et garde de configuration plus récente
  - H2: Incompatibilité de protocole après retour arrière
  - H2: Lien symbolique Skill ignoré comme échappement de chemin
  - H2: Anthropic 429 utilisation supplémentaire requise pour le contexte long
  - H2: Réponses 403 amont bloquées
  - H2: Le backend local compatible OpenAI passe les sondes directes mais les exécutions d’agent échouent
  - H2: Aucune réponse
  - H2: Connectivité de l’interface de contrôle du tableau de bord
  - H3: Carte rapide des codes de détail d’authentification
  - H2: Service Gateway non démarré
  - H2: Le gateway macOS cesse silencieusement de répondre, puis reprend quand vous touchez au tableau de bord
  - H2: Le Gateway se ferme lors d’une forte utilisation mémoire
  - H2: Le Gateway a rejeté une configuration invalide
  - H2: Avertissements de sonde du Gateway
  - H2: Canal connecté, les messages ne circulent pas
  - H2: Livraison Cron et Heartbeat
  - H2: Node appairé, l’outil échoue
  - H2: L’outil de navigateur échoue
  - H2: Si vous avez effectué une mise à niveau et que quelque chose s’est soudainement cassé
  - H2: Liés

## gateway/trusted-proxy-auth.md

- Route : /gateway/trusted-proxy-auth
- Titres :
  - H2: Quand l’utiliser
  - H2: Quand NE PAS l’utiliser
  - H2: Fonctionnement
  - H2: Comportement d’appairage de l’interface de contrôle
  - H2: Configuration
  - H3: Référence de configuration
  - H2: Terminaison TLS et HSTS
  - H3: Recommandations de déploiement
  - H2: Exemples de configuration de proxy
  - H2: Configuration mixte de jetons
  - H2: En-tête des portées opérateur
  - H2: Liste de contrôle de sécurité
  - H2: Audit de sécurité
  - H2: Dépannage
  - H2: Migration depuis l’authentification par jeton
  - H2: Liés

## help/debugging.md

- Route : /help/debugging
- Titres :
  - H2: Remplacements de débogage à l’exécution
  - H2: Sortie de trace de session
  - H2: Trace du cycle de vie Plugin
  - H2: Profilage du démarrage et des commandes CLI
  - H2: Mode surveillance du Gateway
  - H2: Profil dev + gateway dev (--dev)
  - H2: Journalisation du flux brut (OpenClaw)
  - H2: Journalisation des fragments bruts compatibles OpenAI
  - H2: Notes de sécurité
  - H2: Débogage dans VSCode
  - H3: Configuration
  - H3: Notes
  - H2: Liés

## help/environment.md

- Route : /help/environment
- Titres :
  - H2: Priorité (de la plus élevée à la plus basse)
  - H2: Identifiants fournisseur et .env d’espace de travail
  - H2: Bloc env de configuration
  - H2: Import de l’env shell
  - H2: Instantanés du shell exec
  - H2: Variables d’env injectées à l’exécution
  - H2: Variables d’env de l’interface utilisateur
  - H2: Substitution de variables d’env dans la configuration
  - H2: Références de secrets vs chaînes ${ENV}
  - H2: Variables d’env liées aux chemins
  - H2: Journalisation
  - H3: OPENCLAWHOME
  - H2: Utilisateurs nvm : échecs TLS de webfetch
  - H2: Variables d’environnement héritées
  - H2: Liés

## help/faq-first-run.md

- Route : /help/faq-first-run
- Titres :
  - H2: Démarrage rapide et configuration au premier lancement
  - H2: Liés

## help/faq-models.md

- Route : /help/faq-models
- Titres :
  - H2: Modèles : valeurs par défaut, sélection, alias, changement
  - H2: Basculement de modèle et « Tous les modèles ont échoué »
  - H2: Profils d’authentification : ce qu’ils sont et comment les gérer
  - H2: Liés

## help/faq.md

- Route : /help/faq
- Titres :
  - H2: Les 60 premières secondes si quelque chose est cassé
  - H2: Démarrage rapide et configuration au premier lancement
  - H2: Qu’est-ce qu’OpenClaw ?
  - H2: Skills et automatisation
  - H2: Mise en bac à sable et mémoire
  - H2: Où les éléments résident sur le disque
  - H2: Bases de la configuration
  - H2: Gateways et nœuds distants
  - H2: Variables d’env et chargement .env
  - H2: Sessions et chats multiples
  - H2: Modèles, basculement et profils d’authentification
  - H2: Gateway : ports, « déjà en cours d’exécution » et mode distant
  - H2: Journalisation et débogage
  - H2: Médias et pièces jointes
  - H2: Sécurité et contrôle d’accès
  - H2: Commandes de chat, abandon de tâches et « ça ne s’arrête pas »
  - H2: Divers
  - H2: Liés

## help/index.md

- Route : /help
- Titres :
  - H2: FAQ
  - H2: Diagnostics
  - H2: Tests
  - H2: Communauté et méta

## help/scripts.md

- Route : /help/scripts
- Titres :
  - H2: Conventions
  - H2: Scripts de surveillance de l’authentification
  - H2: Assistant de lecture GitHub
  - H2: Lors de l’ajout de scripts
  - H2: Liés

## help/testing-live.md

- Route : /help/testing-live
- Titres :
  - H2 : En direct : commandes de smoke test locales
  - H2 : En direct : balayage des capacités du nœud Android
  - H2 : En direct : smoke test de modèle (clés de profil)
  - H3 : Couche 1 : complétion directe du modèle (sans Gateway)
  - H3 : Couche 2 : Gateway + smoke test de l’agent de développement (ce que fait réellement « @openclaw »)
  - H2 : En direct : smoke test du backend CLI (Claude, Gemini ou autres CLI locales)
  - H2 : En direct : accessibilité du proxy APNs HTTP/2
  - H2 : En direct : smoke test de liaison ACP (/acp spawn ... --bind here)
  - H2 : En direct : smoke test du harnais app-server Codex
  - H3 : Recettes en direct recommandées
  - H2 : En direct : matrice de modèles (ce que nous couvrons)
  - H3 : Ensemble de smoke tests moderne (appel d’outils + image)
  - H3 : Référence : appel d’outils (Read + Exec facultatif)
  - H3 : Vision : envoi d’image (pièce jointe → message multimodal)
  - H3 : Agrégateurs / gateways alternatifs
  - H2 : Identifiants (ne jamais committer)
  - H2 : Deepgram en direct (transcription audio)
  - H2 : Plan de codage BytePlus en direct
  - H2 : Médias de workflow ComfyUI en direct
  - H2 : Génération d’images en direct
  - H2 : Génération de musique en direct
  - H2 : Génération de vidéos en direct
  - H2 : Harnais média en direct
  - H2 : Connexe

## help/testing-updates-plugins.md

- Route : /help/testing-updates-plugins
- Titres :
  - H2 : Ce que nous protégeons
  - H2 : Preuve locale pendant le développement
  - H2 : Voies Docker
  - H2 : Acceptation des paquets
  - H2 : Valeur par défaut de publication
  - H2 : Compatibilité héritée
  - H2 : Ajouter une couverture
  - H2 : Triage des échecs

## help/testing.md

- Route : /help/testing
- Titres :
  - H2 : Démarrage rapide
  - H2 : Répertoires temporaires de test
  - H2 : Exécuteurs propres au QA
  - H3 : Identifiants Telegram partagés via Convex (v1)
  - H3 : Ajouter un canal au QA
  - H2 : Suites de tests (ce qui s’exécute où)
  - H3 : Unitaire / intégration (par défaut)
  - H3 : Stabilité (Gateway)
  - H3 : E2E (agrégat du dépôt)
  - H3 : E2E (smoke test Gateway)
  - H3 : E2E (navigateur simulé Control UI)
  - H3 : E2E : smoke test du backend OpenShell
  - H3 : En direct (vrais fournisseurs + vrais modèles)
  - H2 : Quelle suite dois-je exécuter ?
  - H2 : Tests en direct (avec accès réseau)
  - H2 : Exécuteurs Docker (vérifications facultatives « fonctionne sous Linux »)
  - H2 : Vérification rapide de la documentation
  - H2 : Régression hors ligne (compatible CI)
  - H2 : Évaluations de fiabilité des agents (Skills)
  - H2 : Tests de contrat (forme des plugins et des canaux)
  - H3 : Commandes
  - H3 : Contrats des canaux
  - H3 : Contrats d’état des fournisseurs
  - H3 : Contrats des fournisseurs
  - H3 : Quand exécuter
  - H2 : Ajouter des régressions (conseils)
  - H2 : Connexe

## help/troubleshooting.md

- Route : /help/troubleshooting
- Titres :
  - H2 : Les 60 premières secondes
  - H2 : L’assistant semble limité ou des outils manquent
  - H2 : Contexte long Anthropic 429
  - H2 : Le backend local compatible OpenAI fonctionne directement mais échoue dans OpenClaw
  - H2 : L’installation du Plugin échoue avec des extensions openclaw manquantes
  - H2 : La politique d’installation bloque les installations ou mises à jour de Plugins
  - H2 : Plugin présent mais bloqué par une propriété suspecte
  - H2 : Arbre de décision
  - H2 : Connexe

## index.md

- Route : /
- Titres :
  - H1 : OpenClaw 🦞
  - H2 : Qu’est-ce qu’OpenClaw ?
  - H2 : Fonctionnement
  - H2 : Fonctionnalités clés
  - H2 : Démarrage rapide
  - H2 : Tableau de bord
  - H2 : Configuration (facultative)
  - H2 : Commencer ici
  - H2 : En savoir plus

## install/ansible.md

- Route : /install/ansible
- Titres :
  - H2 : Prérequis
  - H2 : Ce que vous obtenez
  - H2 : Démarrage rapide
  - H2 : Ce qui est installé
  - H2 : Configuration après installation
  - H3 : Commandes rapides
  - H2 : Architecture de sécurité
  - H2 : Installation manuelle
  - H2 : Mise à jour
  - H2 : Dépannage
  - H2 : Configuration avancée
  - H2 : Connexe

## install/azure.md

- Route : /install/azure
- Titres :
  - H2 : Ce que vous allez faire
  - H2 : Ce dont vous avez besoin
  - H2 : Configurer le déploiement
  - H2 : Déployer les ressources Azure
  - H2 : Installer OpenClaw
  - H2 : Considérations de coût
  - H2 : Nettoyage
  - H2 : Étapes suivantes
  - H2 : Connexe

## install/bun.md

- Route : /install/bun
- Titres :
  - H2 : Installation
  - H2 : Scripts de cycle de vie
  - H2 : Points d’attention
  - H2 : Connexe

## install/clawdock.md

- Route : /install/clawdock
- Titres :
  - H2 : Installation
  - H2 : Ce que vous obtenez
  - H3 : Opérations de base
  - H3 : Accès au conteneur
  - H3 : Interface web et appairage
  - H3 : Configuration et maintenance
  - H3 : Utilitaires
  - H2 : Parcours de première utilisation
  - H2 : Configuration et secrets
  - H2 : Connexe

## install/development-channels.md

- Route : /install/development-channels
- Titres :
  - H2 : Changer de canal
  - H2 : Ciblage ponctuel d’une version ou d’une étiquette
  - H2 : Simulation
  - H2 : Plugins et canaux
  - H2 : Vérifier l’état actuel
  - H2 : Bonnes pratiques de balisage
  - H2 : Disponibilité de l’application macOS
  - H2 : Connexe

## install/digitalocean.md

- Route : /install/digitalocean
- Titres :
  - H2 : Prérequis
  - H2 : Configuration
  - H2 : Persistance et sauvegardes
  - H2 : Conseils pour 1 Go de RAM
  - H2 : Dépannage
  - H2 : Étapes suivantes
  - H2 : Connexe

## install/docker-vm-runtime.md

- Route : /install/docker-vm-runtime
- Titres :
  - H2 : Intégrer les binaires requis dans l’image
  - H2 : Compiler et lancer
  - H2 : Ce qui persiste et où
  - H2 : Mises à jour
  - H2 : Connexe

## install/docker.md

- Route : /install/docker
- Titres :
  - H2 : Docker est-il adapté à mon cas ?
  - H2 : Prérequis
  - H2 : Gateway conteneurisée
  - H3 : Parcours manuel
  - H3 : Variables d’environnement
  - H3 : Observabilité
  - H3 : Vérifications de santé
  - H3 : LAN ou boucle locale
  - H3 : Fournisseurs locaux sur l’hôte
  - H3 : Backend Claude CLI dans Docker
  - H3 : Bonjour / mDNS
  - H3 : Stockage et persistance
  - H3 : Assistants shell (facultatif)
  - H3 : Exécution sur un VPS ?
  - H2 : Bac à sable de l’agent
  - H3 : Activation rapide
  - H2 : Dépannage
  - H2 : Connexe

## install/exe-dev.md

- Route : /install/exe-dev
- Titres :
  - H2 : Parcours rapide pour débutants
  - H2 : Ce dont vous avez besoin
  - H2 : Installation automatisée avec Shelley
  - H2 : Installation manuelle
  - H2 : 1) Créer la VM
  - H2 : 2) Installer les prérequis (sur la VM)
  - H2 : 3) Installer OpenClaw
  - H2 : 4) Configurer nginx pour relayer OpenClaw vers le port 8000
  - H2 : 5) Accéder à OpenClaw et accorder les privilèges
  - H2 : Configuration d’un canal distant
  - H2 : Accès distant
  - H2 : Mise à jour
  - H2 : Connexe

## install/fly.md

- Route : /install/fly
- Titres :
  - H2 : Ce dont vous avez besoin
  - H2 : Parcours rapide pour débutants
  - H2 : Dépannage
  - H3 : « L’application n’écoute pas à l’adresse attendue »
  - H3 : Échecs des vérifications de santé / connexion refusée
  - H3 : OOM / problèmes de mémoire
  - H3 : Problèmes de verrouillage du Gateway
  - H3 : Configuration non lue
  - H3 : Écrire la configuration via SSH
  - H3 : État non persistant
  - H2 : Mises à jour
  - H3 : Commande de mise à jour de la machine
  - H2 : Déploiement privé (renforcé)
  - H3 : Quand utiliser un déploiement privé
  - H3 : Configuration
  - H3 : Accéder à un déploiement privé
  - H3 : Webhooks avec un déploiement privé
  - H3 : Avantages de sécurité
  - H2 : Notes
  - H2 : Coût
  - H2 : Étapes suivantes
  - H2 : Connexe

## install/gcp.md

- Route : /install/gcp
- Titres :
  - H2 : Que faisons-nous (en termes simples) ?
  - H2 : Parcours rapide (opérateurs expérimentés)
  - H2 : Ce dont vous avez besoin
  - H2 : Dépannage
  - H2 : Comptes de service (bonne pratique de sécurité)
  - H2 : Étapes suivantes
  - H2 : Connexe

## install/hetzner.md

- Route : /install/hetzner
- Titres :
  - H2 : Objectif
  - H2 : Que faisons-nous (en termes simples) ?
  - H2 : Parcours rapide (opérateurs expérimentés)
  - H2 : Ce dont vous avez besoin
  - H2 : Infrastructure as Code (Terraform)
  - H2 : Étapes suivantes
  - H2 : Connexe

## install/hostinger.md

- Route : /install/hostinger
- Titres :
  - H2 : Prérequis
  - H2 : Option A : OpenClaw en 1 clic
  - H2 : Option B : OpenClaw sur VPS
  - H2 : Vérifier votre configuration
  - H2 : Dépannage
  - H2 : Étapes suivantes
  - H2 : Connexe

## install/index.md

- Route : /install
- Titres :
  - H2 : Configuration système requise
  - H2 : Recommandé : script d’installation
  - H2 : Méthodes d’installation alternatives
  - H3 : Installateur avec préfixe local (install-cli.sh)
  - H3 : npm, pnpm ou bun
  - H3 : Depuis les sources
  - H3 : Installer depuis le checkout main de GitHub
  - H3 : Conteneurs et gestionnaires de paquets
  - H2 : Vérifier l’installation
  - H2 : Hébergement et déploiement
  - H2 : Mettre à jour, migrer ou désinstaller
  - H2 : Dépannage : openclaw introuvable

## install/installer.md

- Route : /install/installer
- Titres :
  - H2 : Commandes rapides
  - H2 : install.sh
  - H3 : Parcours (install.sh)
  - H3 : Détection du checkout source
  - H3 : Exemples (install.sh)
  - H2 : install-cli.sh
  - H3 : Parcours (install-cli.sh)
  - H3 : Exemples (install-cli.sh)
  - H2 : install.ps1
  - H3 : Parcours (install.ps1)
  - H3 : Exemples (install.ps1)
  - H2 : CI et automatisation
  - H2 : Dépannage
  - H2 : Connexe

## install/kubernetes.md

- Route : /install/kubernetes
- Titres :
  - H2 : Pourquoi pas Helm ?
  - H2 : Ce dont vous avez besoin
  - H2 : Démarrage rapide
  - H2 : Tests locaux avec Kind
  - H2 : Étape par étape
  - H3 : 1) Déployer
  - H3 : 2) Accéder au Gateway
  - H2 : Ce qui est déployé
  - H2 : Personnalisation
  - H3 : Instructions de l’agent
  - H3 : Configuration du Gateway
  - H3 : Ajouter des fournisseurs
  - H3 : Espace de noms personnalisé
  - H3 : Image personnalisée
  - H3 : Exposer au-delà du port-forward
  - H2 : Redéployer
  - H2 : Démantèlement
  - H2 : Notes d’architecture
  - H2 : Structure de fichiers
  - H2 : Connexe

## install/macos-vm.md

- Route : /install/macos-vm
- Titres :
  - H2 : Valeur par défaut recommandée (la plupart des utilisateurs)
  - H2 : Options de VM macOS
  - H3 : VM locale sur votre Mac Apple Silicon (Lume)
  - H3 : Fournisseurs Mac hébergés (cloud)
  - H2 : Parcours rapide (Lume, utilisateurs expérimentés)
  - H2 : Ce dont vous avez besoin (Lume)
  - H2 : 1) Installer Lume
  - H2 : 2) Créer la VM macOS
  - H2 : 3) Terminer l’assistant de configuration
  - H2 : 4) Obtenir l’adresse IP de la VM
  - H2 : 5) Se connecter à la VM en SSH
  - H2 : 6) Installer OpenClaw
  - H2 : 7) Configurer les canaux
  - H2 : 8) Exécuter la VM sans interface graphique
  - H2 : Bonus : intégration iMessage
  - H2 : Enregistrer une image de référence
  - H2 : Exécution 24/7
  - H2 : Dépannage
  - H2 : Documentation connexe

## install/migrating-claude.md

- Route : /install/migrating-claude
- Titres :
  - H2 : Deux façons d’importer
  - H2 : Ce qui est importé
  - H2 : Ce qui reste uniquement en archive
  - H2 : Sélection de la source
  - H2 : Parcours recommandé
  - H2 : Gestion des conflits
  - H2 : Sortie JSON pour l’automatisation
  - H2 : Dépannage
  - H2 : Connexe

## install/migrating-hermes.md

- Route : /install/migrating-hermes
- Titres :
  - H2 : Deux façons d’importer
  - H2 : Ce qui est importé
  - H2 : Ce qui reste uniquement en archive
  - H2 : Parcours recommandé
  - H2 : Gestion des conflits
  - H2 : Secrets
  - H2 : Sortie JSON pour l’automatisation
  - H2 : Dépannage
  - H2 : Connexe

## install/migrating.md

- Route : /install/migrating
- Titres :
  - H2 : Importer depuis un autre système d’agent
  - H2 : Déplacer OpenClaw vers une nouvelle machine
  - H3 : Étapes de migration
  - H3 : Pièges courants
  - H3 : Liste de vérification
  - H2 : Mettre à niveau un Plugin sur place
  - H2 : Connexe

## install/nix.md

- Route : /install/nix
- Titres :
  - H2 : Ce que vous obtenez
  - H2 : Démarrage rapide
  - H2 : Comportement d’exécution en mode Nix
  - H3 : Ce qui change en mode Nix
  - H3 : Chemins de configuration et d’état
  - H3 : Découverte du PATH de service
  - H2 : Connexe

## install/node.md

- Route : /install/node
- Titres :
  - H2 : Vérifier votre version
  - H2 : Installer Node
  - H2 : Dépannage
  - H3 : openclaw : commande introuvable
  - H3 : Erreurs de permission avec npm install -g (Linux)
  - H2 : Connexe

## install/northflank.mdx

- Route : /install/northflank
- Titres :
  - H1 : Northflank
  - H2 : Comment démarrer
  - H2 : Ce que vous obtenez
  - H2 : Connecter un canal
  - H2 : Étapes suivantes

## install/oracle.md

- Route : /install/oracle
- Titres :
  - H2 : Prérequis
  - H2 : Configuration
  - H2 : Vérifier la posture de sécurité
  - H2 : Notes ARM
  - H2 : Persistance et sauvegardes
  - H2 : Solution de repli : tunnel SSH
  - H2 : Dépannage
  - H2 : Étapes suivantes
  - H2 : Connexe

## install/podman.md

- Route : /install/podman
- Titres :
  - H2 : Prérequis
  - H2 : Démarrage rapide
  - H2 : Podman et Tailscale
  - H2 : Systemd (Quadlet, facultatif)
  - H2 : Configuration, env et stockage
  - H2 : Commandes utiles
  - H2 : Dépannage
  - H2 : Connexe

## install/railway.mdx

- Route : /install/railway
- Titres :
  - H1 : Railway
  - H2 : Liste de vérification rapide (nouveaux utilisateurs)
  - H2 : Déploiement en un clic
  - H2 : Ce que vous obtenez
  - H2 : Paramètres Railway requis
  - H3 : Réseau public
  - H3 : Volume (obligatoire)
  - H3 : Variables
  - H2 : Connecter un canal
  - H2 : Sauvegardes et migration
  - H2 : Étapes suivantes

## install/raspberry-pi.md

- Route : /install/raspberry-pi
- Titres :
  - H2 : Compatibilité matérielle
  - H2 : Prérequis
  - H2 : Configuration
  - H2 : Conseils de performance
  - H2 : Configuration de modèle recommandée
  - H2 : Notes sur les binaires ARM
  - H2 : Persistance et sauvegardes
  - H2 : Dépannage
  - H2 : Étapes suivantes
  - H2 : Associé

## install/render.mdx

- Route : /install/render
- Titres :
  - H1 : Render
  - H2 : Prérequis
  - H2 : Déployer avec un Render Blueprint
  - H2 : Comprendre le Blueprint
  - H2 : Choisir une offre
  - H2 : Après le déploiement
  - H3 : Accéder à l’interface Control UI
  - H2 : Fonctionnalités du tableau de bord Render
  - H3 : Journaux
  - H3 : Accès au shell
  - H3 : Variables d’environnement
  - H3 : Déploiement automatique
  - H2 : Domaine personnalisé
  - H2 : Mise à l’échelle
  - H2 : Sauvegardes et migration
  - H2 : Dépannage
  - H3 : Le service ne démarre pas
  - H3 : Démarrages à froid lents (offre gratuite)
  - H3 : Perte de données après redéploiement
  - H3 : Échecs des vérifications d’intégrité
  - H2 : Étapes suivantes

## install/uninstall.md

- Route : /install/uninstall
- Titres :
  - H2 : Chemin simple (CLI encore installée)
  - H2 : Suppression manuelle du service (CLI non installée)
  - H3 : macOS (launchd)
  - H3 : Linux (unité utilisateur systemd)
  - H3 : Windows (tâche planifiée)
  - H2 : Installation normale ou extraction du code source
  - H3 : Installation normale (install.sh / npm / pnpm / bun)
  - H3 : Extraction du code source (git clone)
  - H2 : Associé

## install/updating.md

- Route : /install/updating
- Titres :
  - H2 : Recommandé : openclaw update
  - H2 : Basculer entre les installations npm et git
  - H2 : Alternative : relancer l’installateur
  - H2 : Alternative : npm, pnpm ou bun manuel
  - H3 : Sujets avancés sur l’installation npm
  - H2 : Mise à jour automatique
  - H2 : Après la mise à jour
  - H3 : Exécuter doctor
  - H3 : Redémarrer le Gateway
  - H3 : Vérifier
  - H2 : Retour arrière
  - H3 : Épingler une version (npm)
  - H3 : Épingler un commit (source)
  - H2 : Si vous êtes bloqué
  - H2 : Associé

## install/upstash.md

- Route : /install/upstash
- Titres :
  - H2 : Prérequis
  - H2 : Créer une Box
  - H2 : Se connecter avec un tunnel SSH
  - H2 : Installer OpenClaw
  - H2 : Exécuter l’intégration initiale
  - H2 : Démarrer le Gateway
  - H2 : Redémarrage automatique
  - H2 : Dépannage
  - H2 : Associé

## logging.md

- Route : /logging
- Titres :
  - H2 : Où se trouvent les journaux
  - H2 : Comment lire les journaux
  - H3 : CLI : suivi en direct (recommandé)
  - H3 : Control UI (web)
  - H3 : Journaux propres au canal
  - H2 : Formats de journaux
  - H3 : Journaux de fichiers (JSONL)
  - H3 : Sortie console
  - H3 : Journaux WebSocket du Gateway
  - H2 : Configurer la journalisation
  - H3 : Niveaux de journalisation
  - H3 : Diagnostics ciblés du transport de modèle
  - H3 : Corrélation des traces
  - H3 : Taille et durée des appels au modèle
  - H3 : Styles de console
  - H3 : Masquage
  - H2 : Diagnostics et OpenTelemetry
  - H2 : Conseils de dépannage
  - H2 : Associé

## maturity/scorecard.md

- Route : /maturity/scorecard
- Titres :
  - H1 : Tableau de score de maturité
  - H2 : À quoi sert cette page
  - H2 : En un coup d’œil
  - H2 : Plages de scores
  - H2 : Explorateur de surfaces
  - H2 : Résumé des preuves QA
  - H3 : État de préparation par domaine

## maturity/taxonomy.md

- Route : /maturity/taxonomy
- Titres :
  - H1 : Taxonomie de maturité
  - H2 : Comment lire cette page
  - H2 : Niveaux de maturité
  - H2 : Domaines du produit
  - H2 : Détails
  - H3 : Cœur
  - H3 : Plateforme
  - H3 : Canal
  - H3 : Fournisseur et outil

## network.md

- Route : /network
- Titres :
  - H2 : Modèle de base
  - H2 : Appairage + identité
  - H2 : Découverte + transports
  - H2 : Nœuds + transports
  - H2 : Sécurité
  - H2 : Associé

## nodes/audio.md

- Route : /nodes/audio
- Titres :
  - H2 : Ce qui fonctionne
  - H2 : Détection automatique (par défaut)
  - H2 : Exemples de configuration
  - H3 : Fournisseur + repli CLI (OpenAI + CLI Whisper)
  - H3 : Fournisseur uniquement avec limitation par portée
  - H3 : Fournisseur uniquement (Deepgram)
  - H3 : Fournisseur uniquement (Mistral Voxtral)
  - H3 : Fournisseur uniquement (SenseAudio)
  - H3 : Renvoyer la transcription dans le chat (opt-in)
  - H2 : Notes et limites
  - H3 : Prise en charge de l’environnement proxy
  - H2 : Détection des mentions dans les groupes
  - H2 : Pièges
  - H2 : Associé

## nodes/camera.md

- Route : /nodes/camera
- Titres :
  - H2 : Nœud iOS
  - H3 : Paramètre utilisateur (activé par défaut)
  - H3 : Commandes (via Gateway node.invoke)
  - H3 : Exigence de premier plan
  - H3 : Assistant CLI
  - H2 : Nœud Android
  - H3 : Paramètre utilisateur Android (activé par défaut)
  - H3 : Autorisations
  - H3 : Exigence de premier plan Android
  - H3 : Commandes Android (via Gateway node.invoke)
  - H3 : Protection de la charge utile
  - H2 : Application macOS
  - H3 : Paramètre utilisateur (désactivé par défaut)
  - H3 : Assistant CLI (node invoke)
  - H2 : Sécurité + limites pratiques
  - H2 : Vidéo d’écran macOS (niveau OS)
  - H2 : Associé

## nodes/images.md

- Route : /nodes/images
- Titres :
  - H2 : Objectifs
  - H2 : Surface CLI
  - H2 : Comportement du canal WhatsApp Web
  - H2 : Pipeline de réponse automatique
  - H2 : Médias entrants vers commandes
  - H2 : Limites et erreurs
  - H2 : Notes pour les tests
  - H2 : Associé

## nodes/index.md

- Route : /nodes
- Titres :
  - H2 : Appairage + état
  - H2 : Hôte de nœud distant (system.run)
  - H3 : Ce qui s’exécute où
  - H3 : Démarrer un hôte de nœud (premier plan)
  - H3 : Gateway distant via tunnel SSH (liaison loopback)
  - H3 : Démarrer un hôte de nœud (service)
  - H3 : Appairer + nommer
  - H3 : Autoriser les commandes
  - H3 : Pointer exec vers le nœud
  - H2 : Appel des commandes
  - H2 : Politique de commandes
  - H2 : Config (openclaw.json)
  - H2 : Captures d’écran (instantanés canvas)
  - H3 : Contrôles Canvas
  - H3 : A2UI (Canvas)
  - H2 : Photos + vidéos (caméra du nœud)
  - H2 : Enregistrements d’écran (nœuds)
  - H2 : Localisation (nœuds)
  - H2 : SMS (nœuds Android)
  - H2 : Commandes d’appareil Android + données personnelles
  - H2 : Commandes système (hôte de nœud / nœud Mac)
  - H2 : Liaison de nœud exec
  - H2 : Carte des autorisations
  - H2 : Hôte de nœud sans interface (multiplateforme)
  - H2 : Mode nœud Mac

## nodes/location-command.md

- Route : /nodes/location-command
- Titres :
  - H2 : TL;DR
  - H2 : Pourquoi un sélecteur (pas seulement un commutateur)
  - H2 : Modèle de paramètres
  - H2 : Correspondance des autorisations (node.permissions)
  - H2 : Commande : location.get
  - H2 : Comportement en arrière-plan
  - H2 : Intégration modèle/outillage
  - H2 : Texte UX (suggéré)
  - H2 : Associé

## nodes/media-understanding.md

- Route : /nodes/media-understanding
- Titres :
  - H2 : Objectifs
  - H2 : Comportement général
  - H2 : Vue d’ensemble de la configuration
  - H3 : Entrées de modèle
  - H3 : Identifiants du fournisseur (apiKey)
  - H2 : Valeurs par défaut et limites
  - H3 : Détection automatique de la compréhension des médias (par défaut)
  - H3 : Prise en charge de l’environnement proxy (modèles fournisseurs)
  - H2 : Capacités (facultatif)
  - H2 : Matrice de prise en charge des fournisseurs (intégrations OpenClaw)
  - H2 : Conseils de sélection de modèle
  - H2 : Politique des pièces jointes
  - H2 : Exemples de configuration
  - H2 : Sortie d’état
  - H2 : Notes
  - H2 : Associé

## nodes/talk.md

- Route : /nodes/talk
- Titres :
  - H2 : Comportement (macOS)
  - H2 : Directives vocales dans les réponses
  - H2 : Config (/.openclaw/openclaw.json)
  - H2 : Interface macOS
  - H2 : Interface Android
  - H2 : Notes
  - H2 : Associé

## nodes/troubleshooting.md

- Route : /nodes/troubleshooting
- Titres :
  - H2 : Échelle de commandes
  - H2 : Exigences de premier plan
  - H2 : Matrice des autorisations
  - H2 : Appairage ou approbations
  - H2 : Codes d’erreur de nœud courants
  - H2 : Boucle de récupération rapide
  - H2 : Associé

## nodes/voicewake.md

- Route : /nodes/voicewake
- Titres :
  - H2 : Stockage (hôte du Gateway)
  - H2 : Protocole
  - H3 : Méthodes
  - H3 : Méthodes de routage (déclencheur → cible)
  - H3 : Événements
  - H2 : Comportement du client
  - H3 : Application macOS
  - H3 : Nœud iOS
  - H3 : Nœud Android
  - H2 : Associé

## openclaw-agent-runtime.md

- Route : /openclaw-agent-runtime
- Titres :
  - H2 : Vérification des types et linting
  - H2 : Exécution des tests de l’Agent Runtime
  - H2 : Test manuel
  - H2 : Réinitialisation complète
  - H2 : Références
  - H2 : Associé

## perplexity.md

- Route : /perplexity
- Titres :
  - H2 : Associé

## plan/codex-context-engine-harness.md

- Route : /plan/codex-context-engine-harness
- Titres :
  - H2 : État
  - H2 : Objectif
  - H2 : Non-objectifs
  - H2 : Architecture actuelle
  - H2 : Écart actuel
  - H2 : Comportement souhaité
  - H2 : Contraintes de conception
  - H3 : Le serveur d’application Codex reste canonique pour l’état natif des fils
  - H3 : L’assemblage du moteur de contexte doit être projeté dans les entrées Codex
  - H3 : La stabilité du cache de prompts est importante
  - H3 : La sémantique de sélection du runtime ne change pas
  - H2 : Plan d’implémentation
  - H3 : 1. Exporter ou déplacer les helpers de tentative réutilisables du moteur de contexte
  - H3 : 2. Ajouter un helper de projection de contexte Codex
  - H3 : 3. Brancher le bootstrap avant le démarrage du fil Codex
  - H3 : 4. Brancher l’assemblage avant thread/start / thread/resume et turn/start
  - H3 : 5. Préserver le formatage stable du cache de prompts
  - H3 : 6. Brancher le post-turn après la mise en miroir de la transcription
  - H3 : 7. Normaliser l’utilisation et le contexte runtime du cache de prompts
  - H3 : 8. Politique de Compaction
  - H4 : /compact et Compaction OpenClaw explicite
  - H4 : Événements contextCompaction natifs Codex pendant le tour
  - H3 : 9. Comportement de réinitialisation et de liaison de session
  - H3 : 10. Gestion des erreurs
  - H2 : Plan de test
  - H3 : Tests unitaires
  - H3 : Tests existants à mettre à jour
  - H3 : Tests d’intégration / live
  - H2 : Observabilité
  - H2 : Migration / compatibilité
  - H2 : Questions ouvertes
  - H2 : Critères d’acceptation

## plan/ui-channels.md

- Route : /plan/ui-channels
- Titres :
  - H2 : État
  - H2 : Problème
  - H2 : Objectifs
  - H2 : Non-objectifs
  - H2 : Modèle cible
  - H2 : Métadonnées de livraison
  - H2 : Contrat de capacité runtime
  - H2 : Correspondance des canaux
  - H2 : Étapes de refactorisation
  - H2 : Tests
  - H2 : Questions ouvertes
  - H2 : Associé

## platforms/android.md

- Route : /platforms/android
- Titres :
  - H2 : Instantané de prise en charge
  - H2 : Contrôle système
  - H2 : Guide opérationnel de connexion
  - H3 : Prérequis
  - H3 : 1) Démarrer le Gateway
  - H3 : 2) Vérifier la découverte (facultatif)
  - H4 : Découverte Tailnet (Vienne ⇄ Londres) via DNS-SD unicast
  - H3 : 3) Se connecter depuis Android
  - H3 : Signaux de présence active
  - H3 : 4) Approuver l’appairage (CLI)
  - H3 : 5) Vérifier que le nœud est connecté
  - H3 : 6) Chat + historique
  - H3 : 7) Canvas + caméra
  - H4 : Hôte Canvas Gateway (recommandé pour le contenu web)
  - H3 : 8) Voix + surface de commandes Android étendue
  - H2 : Points d’entrée de l’assistant
  - H2 : Transfert des notifications
  - H2 : Associé

## platforms/digitalocean.md

- Route : /platforms/digitalocean
- Titres :
  - H2 : Associé

## platforms/easyrunner.md

- Route : /platforms/easyrunner
- Titres :
  - H2 : Avant de commencer
  - H2 : Composer l’application
  - H2 : Configurer OpenClaw
  - H2 : Vérifier
  - H2 : Mises à jour et sauvegardes
  - H2 : Dépannage

## platforms/index.md

- Route : /platforms
- Titres :
  - H2 : Choisir votre OS
  - H2 : VPS et hébergement
  - H2 : Liens courants
  - H2 : Installation du service Gateway (CLI)
  - H2 : Associé

## platforms/ios.md

- Route : /platforms/ios
- Titres :
  - H2 : Ce qu’il fait
  - H2 : Exigences
  - H2 : Démarrage rapide (appairer + connecter)
  - H2 : Push adossé au relais pour les builds officiels
  - H2 : Signaux d’activité en arrière-plan
  - H2 : Flux d’authentification et de confiance
  - H2 : Chemins de découverte
  - H3 : Bonjour (LAN)
  - H3 : Tailnet (inter-réseaux)
  - H3 : Hôte/port manuel
  - H2 : Canvas + A2UI
  - H2 : Relation avec Computer Use
  - H3 : Évaluation / instantané Canvas
  - H2 : Réveil vocal + mode parole
  - H2 : Erreurs courantes
  - H2 : Docs associées

## platforms/linux.md

- Route : /platforms/linux
- Titres :
  - H2 : Parcours rapide débutant (VPS)
  - H2 : Installer
  - H2 : Gateway
  - H2 : Installation du service Gateway (CLI)
  - H2 : Contrôle système (unité utilisateur systemd)
  - H2 : Pression mémoire et arrêts OOM
  - H2 : Associé

## platforms/mac/bundled-gateway.md

- Route : /platforms/mac/bundled-gateway
- Titres :
  - H2 : Installer la CLI (requis pour le mode local)
  - H2 : Launchd (Gateway comme LaunchAgent)
  - H2 : Compatibilité des versions
  - H2 : Répertoire d’état sur macOS
  - H2 : Déboguer la connectivité de l’application
  - H2 : Vérification smoke
  - H2 : Associé

## platforms/mac/canvas.md

- Route : /platforms/mac/canvas
- Titres :
  - H2 : Où se trouve Canvas
  - H2 : Comportement du panneau
  - H2 : Surface d’API agent
  - H2 : A2UI dans Canvas
  - H3 : Commandes A2UI (v0.8)
  - H2 : Déclencher des exécutions d’agent depuis Canvas
  - H2 : Notes de sécurité
  - H2 : Associé

## platforms/mac/child-process.md

- Route : /platforms/mac/child-process
- Titres :
  - H2 : Comportement par défaut (launchd)
  - H2 : Builds de développement non signés
  - H2 : Mode attachement seul
  - H2 : Mode distant
  - H2 : Pourquoi nous préférons launchd
  - H2 : Associé

## platforms/mac/dev-setup.md

- Route : /platforms/mac/dev-setup
- Titres :
  - H1 : configuration développeur macOS
  - H2 : Prérequis
  - H2 : 1. Installer les dépendances
  - H2 : 2. Compiler et empaqueter l’application
  - H2 : 3. Installer la CLI
  - H2 : Dépannage
  - H3 : Échec de la compilation : incompatibilité de chaîne d’outils ou de SDK
  - H3 : L’application plante lors de l’octroi d’autorisation
  - H3 : Gateway « Démarrage... » indéfiniment
  - H2 : Articles connexes

## platforms/mac/health.md

- Route : /platforms/mac/health
- Titres :
  - H1 : Contrôles d’état sur macOS
  - H2 : Barre de menus
  - H2 : Paramètres
  - H2 : Fonctionnement de la sonde
  - H2 : En cas de doute
  - H2 : Articles connexes

## platforms/mac/icon.md

- Route : /platforms/mac/icon
- Titres :
  - H1 : États de l’icône de barre de menus
  - H2 : Articles connexes

## platforms/mac/logging.md

- Route : /platforms/mac/logging
- Titres :
  - H1 : Journalisation (macOS)
  - H2 : Journal de diagnostics tournant dans un fichier (volet Débogage)
  - H2 : Données privées de la journalisation unifiée sur macOS
  - H2 : Activer pour OpenClaw (ai.openclaw)
  - H2 : Désactiver après le débogage
  - H2 : Articles connexes

## platforms/mac/menu-bar.md

- Route : /platforms/mac/menu-bar
- Titres :
  - H2 : Ce qui est affiché
  - H2 : Modèle d’état
  - H2 : Énumération IconState (Swift)
  - H3 : ActivityKind → glyphe
  - H3 : Mappage visuel
  - H2 : Sous-menu contextuel
  - H2 : Texte de la ligne d’état (menu)
  - H2 : Ingestion d’événements
  - H2 : Remplacement de débogage
  - H2 : Liste de vérification des tests
  - H2 : Articles connexes

## platforms/mac/peekaboo.md

- Route : /platforms/mac/peekaboo
- Titres :
  - H2 : Ce que c’est (et ce que ce n’est pas)
  - H2 : Relation avec Computer Use
  - H2 : Activer le pont
  - H2 : Ordre de découverte des clients
  - H2 : Sécurité et autorisations
  - H2 : Comportement des instantanés (automatisation)
  - H2 : Dépannage
  - H2 : Articles connexes

## platforms/mac/permissions.md

- Route : /platforms/mac/permissions
- Titres :
  - H2 : Exigences pour des autorisations stables
  - H2 : Autorisations d’accessibilité pour les environnements d’exécution Node et CLI
  - H2 : Liste de vérification de récupération lorsque les invites disparaissent
  - H2 : Autorisations des fichiers et dossiers (Desktop/Documents/Downloads)
  - H2 : Articles connexes

## platforms/mac/remote.md

- Route : /platforms/mac/remote
- Titres :
  - H2 : Modes
  - H2 : Transports distants
  - H2 : Prérequis sur l’hôte distant
  - H2 : Configuration de l’application macOS
  - H2 : Chat Web
  - H2 : Autorisations
  - H2 : Notes de sécurité
  - H2 : Flux de connexion WhatsApp (distant)
  - H2 : Dépannage
  - H2 : Sons de notification
  - H2 : Articles connexes

## platforms/mac/signing.md

- Route : /platforms/mac/signing
- Titres :
  - H1 : signature mac (compilations de débogage)
  - H2 : Utilisation
  - H3 : Note sur la signature ad hoc
  - H2 : Métadonnées de compilation pour À propos
  - H2 : Pourquoi
  - H2 : Articles connexes

## platforms/mac/skills.md

- Route : /platforms/mac/skills
- Titres :
  - H2 : Source de données
  - H2 : Actions d’installation
  - H2 : Clés d’environnement/API
  - H2 : Mode distant
  - H2 : Articles connexes

## platforms/mac/voice-overlay.md

- Route : /platforms/mac/voice-overlay
- Titres :
  - H1 : Cycle de vie de la superposition vocale (macOS)
  - H2 : Intention actuelle
  - H2 : Implémenté (9 déc. 2025)
  - H2 : Prochaines étapes
  - H2 : Liste de vérification de débogage
  - H2 : Étapes de migration (suggérées)
  - H2 : Articles connexes

## platforms/mac/voicewake.md

- Route : /platforms/mac/voicewake
- Titres :
  - H1 : Réveil vocal et appuyer-pour-parler
  - H2 : Exigences
  - H2 : Modes
  - H2 : Comportement à l’exécution (mot d’activation)
  - H2 : Invariants du cycle de vie
  - H2 : Mode d’échec de superposition persistante (précédent)
  - H2 : Spécificités de l’appuyer-pour-parler
  - H2 : Paramètres visibles par l’utilisateur
  - H2 : Comportement de transfert
  - H2 : Charge utile de transfert
  - H2 : Vérification rapide
  - H2 : Articles connexes

## platforms/mac/webchat.md

- Route : /platforms/mac/webchat
- Titres :
  - H2 : Lancement et débogage
  - H2 : Comment il est câblé
  - H2 : Surface de sécurité
  - H2 : Limitations connues
  - H2 : Articles connexes

## platforms/mac/xpc.md

- Route : /platforms/mac/xpc
- Titres :
  - H1 : Architecture IPC macOS d’OpenClaw
  - H2 : Objectifs
  - H2 : Fonctionnement
  - H3 : Gateway + transport node
  - H3 : Service Node + IPC de l’application
  - H3 : PeekabooBridge (automatisation de l’interface utilisateur)
  - H2 : Flux opérationnels
  - H2 : Notes de durcissement
  - H2 : Articles connexes

## platforms/macos.md

- Route : /platforms/macos
- Titres :
  - H2 : Télécharger
  - H2 : Premier lancement
  - H2 : Choisir un mode Gateway
  - H2 : Ce que l’application possède
  - H2 : Pages de détail macOS
  - H2 : Articles connexes

## platforms/oracle.md

- Route : /platforms/oracle
- Titres :
  - H2 : Articles connexes

## platforms/raspberry-pi.md

- Route : /platforms/raspberry-pi
- Titres :
  - H2 : Articles connexes

## platforms/windows.md

- Route : /platforms/windows
- Titres :
  - H2 : Recommandé : Windows Hub
  - H3 : Ce que Windows Hub inclut
  - H3 : Premier lancement
  - H2 : Mode nœud Windows
  - H2 : Mode MCP local
  - H2 : CLI et Gateway Windows natifs
  - H2 : Gateway WSL2
  - H2 : Démarrage automatique de Gateway avant la connexion Windows
  - H2 : Exposer les services WSL sur le réseau LAN
  - H2 : Dépannage
  - H3 : L’icône de barre d’état n’apparaît pas
  - H3 : Échec de la configuration locale
  - H3 : L’application indique qu’un appairage est requis
  - H3 : Le chat Web ne peut pas atteindre un Gateway distant
  - H3 : Les commandes screen.snapshot, camera ou audio échouent
  - H3 : Échec de la connectivité Git ou GitHub
  - H2 : Articles connexes

## plugins/adding-capabilities.md

- Route : /plugins/adding-capabilities
- Titres :
  - H2 : Quand créer une capacité
  - H2 : La séquence standard
  - H2 : Ce qui va où
  - H2 : Points de jonction du fournisseur et du harnais
  - H2 : Liste de vérification des fichiers
  - H2 : Exemple détaillé : génération d’images
  - H2 : Fournisseurs d’embeddings
  - H2 : Liste de vérification de revue
  - H2 : Articles connexes

## plugins/admin-http-rpc.md

- Route : /plugins/admin-http-rpc
- Titres :
  - H2 : Avant de l’activer
  - H2 : Activer
  - H2 : Vérifier la route
  - H2 : Authentification
  - H2 : Modèle de sécurité
  - H2 : Requête
  - H2 : Réponse
  - H2 : Méthodes autorisées
  - H2 : Comparaison WebSocket
  - H2 : Dépannage
  - H2 : Articles connexes

## plugins/agent-tools.md

- Route : /plugins/agent-tools
- Titres :
  - H2 : Articles connexes

## plugins/architecture-internals.md

- Route : /plugins/architecture-internals
- Titres :
  - H2 : Pipeline de chargement
  - H3 : Comportement privilégiant le manifeste
  - H3 : Frontière du cache de Plugin
  - H2 : Modèle de registre
  - H2 : Rappels de liaison de conversation
  - H2 : Hooks d’exécution du fournisseur
  - H3 : Ordre et utilisation des hooks
  - H3 : Exemple de fournisseur
  - H3 : Exemples intégrés
  - H2 : Assistants d’exécution
  - H3 : api.runtime.imageGeneration
  - H2 : Routes HTTP du Gateway
  - H2 : Chemins d’importation du SDK de Plugin
  - H2 : Schémas d’outils de message
  - H2 : Résolution de la cible de canal
  - H2 : Répertoires adossés à la configuration
  - H2 : Catalogues de fournisseurs
  - H2 : Inspection de canal en lecture seule
  - H2 : Packs de packages
  - H3 : Métadonnées du catalogue de canaux
  - H2 : Plugins de moteur de contexte
  - H2 : Ajouter une nouvelle capacité
  - H3 : Liste de vérification des capacités
  - H3 : Modèle de capacité
  - H2 : Articles connexes

## plugins/architecture.md

- Route : /plugins/architecture
- Titres :
  - H2 : Modèle de capacité public
  - H3 : Position de compatibilité externe
  - H3 : Formes de Plugin
  - H3 : Hooks hérités
  - H3 : Signaux de compatibilité
  - H2 : Vue d’ensemble de l’architecture
  - H3 : Instantané des métadonnées de Plugin et table de correspondance
  - H3 : Planification de l’activation
  - H3 : Plugins de canal et outil de message partagé
  - H2 : Modèle de propriété des capacités
  - H3 : Superposition des capacités
  - H3 : Exemple de Plugin d’entreprise multicapacité
  - H3 : Exemple de capacité : compréhension vidéo
  - H2 : Contrats et application
  - H3 : Ce qui appartient à un contrat
  - H2 : Modèle d’exécution
  - H2 : Frontière d’exportation
  - H2 : Internes et référence
  - H2 : Articles connexes

## plugins/building-extensions.md

- Route : /plugins/building-extensions
- Titres :
  - H2 : Articles connexes

## plugins/building-plugins.md

- Route : /plugins/building-plugins
- Titres :
  - H2 : Exigences
  - H2 : Choisir la forme du Plugin
  - H2 : Démarrage rapide
  - H2 : Enregistrer des outils
  - H2 : Conventions d’importation
  - H2 : Liste de vérification avant soumission
  - H2 : Tester avec les versions bêta
  - H2 : Étapes suivantes
  - H2 : Articles connexes

## plugins/bundles.md

- Route : /plugins/bundles
- Titres :
  - H2 : Pourquoi les bundles existent
  - H2 : Installer un bundle
  - H2 : Ce qu’OpenClaw mappe depuis les bundles
  - H3 : Pris en charge actuellement
  - H4 : Contenu de Skills
  - H4 : Packs de hooks
  - H4 : MCP pour OpenClaw intégré
  - H4 : Paramètres d’OpenClaw intégré
  - H4 : LSP d’OpenClaw intégré
  - H3 : Détecté mais non exécuté
  - H2 : Formats de bundle
  - H2 : Priorité de détection
  - H2 : Dépendances d’exécution et nettoyage
  - H2 : Sécurité
  - H2 : Dépannage
  - H2 : Articles connexes

## plugins/cli-backend-plugins.md

- Route : /plugins/cli-backend-plugins
- Titres :
  - H2 : Ce que le Plugin possède
  - H2 : Plugin backend minimal
  - H2 : Forme de configuration
  - H2 : Hooks backend avancés
  - H3 : ownsNativeCompaction: désactivation de la compaction OpenClaw
  - H2 : Pont d’outil MCP
  - H2 : Configuration utilisateur
  - H2 : Vérification
  - H2 : Liste de vérification
  - H2 : Articles connexes

## plugins/codex-computer-use.md

- Route : /plugins/codex-computer-use
- Titres :
  - H2 : OpenClaw.app et Peekaboo
  - H2 : Application iOS
  - H2 : MCP cua-driver direct
  - H2 : Configuration rapide
  - H2 : Commandes
  - H2 : Choix de marketplace
  - H2 : Marketplace macOS groupée
  - H2 : Limite du catalogue distant
  - H2 : Référence de configuration
  - H2 : Ce qu’OpenClaw vérifie
  - H2 : Autorisations macOS
  - H2 : Dépannage
  - H2 : Articles connexes

## plugins/codex-harness-reference.md

- Route : /plugins/codex-harness-reference
- Titres :
  - H2 : Surface de configuration du Plugin
  - H2 : Transport serveur d’application
  - H2 : Modes d’approbation et de bac à sable
  - H2 : Exécution native en bac à sable
  - H2 : Isolation de l’authentification et de l’environnement
  - H2 : Outils dynamiques
  - H2 : Délais d’expiration
  - H2 : Découverte des modèles
  - H2 : Fichiers d’amorçage de l’espace de travail
  - H2 : Remplacements d’environnement
  - H2 : Articles connexes

## plugins/codex-harness-runtime.md

- Route : /plugins/codex-harness-runtime
- Titres :
  - H2 : Vue d’ensemble
  - H2 : Liaisons de fils et changements de modèle
  - H2 : Réponses visibles et Heartbeats
  - H2 : Frontières des hooks
  - H2 : Contrat de prise en charge V1
  - H2 : Autorisations natives et élicitations MCP
  - H2 : Pilotage de file d’attente
  - H2 : Téléversement des commentaires Codex
  - H2 : Compaction et miroir de transcription
  - H2 : Médias et livraison
  - H2 : Articles connexes

## plugins/codex-harness.md

- Route : /plugins/codex-harness
- Titres :
  - H2 : Exigences
  - H2 : Démarrage rapide
  - H2 : Configuration
  - H2 : Vérifier l’environnement d’exécution Codex
  - H2 : Routage et sélection de modèle
  - H2 : Modèles de déploiement
  - H3 : Déploiement Codex de base
  - H3 : Déploiement à fournisseurs mixtes
  - H3 : Déploiement Codex à fermeture sécurisée
  - H2 : Politique du serveur d’application
  - H2 : Commandes et diagnostics
  - H3 : Inspecter les fils Codex localement
  - H2 : Plugins Codex natifs
  - H2 : Computer Use
  - H2 : Frontières d’exécution
  - H2 : Dépannage
  - H2 : Articles connexes

## plugins/codex-native-plugins.md

- Route : /plugins/codex-native-plugins
- Titres :
  - H2 : Exigences
  - H2 : Démarrage rapide
  - H2 : Gérer les Plugins depuis le chat
  - H2 : Fonctionnement de la configuration de Plugin natif
  - H2 : Frontière de prise en charge V1
  - H2 : Inventaire des applications et propriété
  - H2 : Configuration d’application de fil
  - H2 : Politique d’action destructive
  - H2 : Dépannage
  - H2 : Articles connexes

## plugins/community.md

- Route : /plugins/community
- Titres :
  - H2 : Trouver des Plugins
  - H2 : Publier des Plugins
  - H2 : Articles connexes

## plugins/compatibility.md

- Route : /plugins/compatibility
- Titres :
  - H2 : Registre de compatibilité
  - H2 : Package d’inspection de Plugin
  - H3 : Voie d’acceptation des mainteneurs
  - H2 : Politique de dépréciation
  - H2 : Zones de compatibilité actuelles
  - H3 : Alias plats de rappel entrant WhatsApp
  - H3 : Champs d’admission entrants WhatsApp
  - H2 : Notes de version

## plugins/copilot.md

- Route : /plugins/copilot
- Titres :
  - H2 : Exigences
  - H2 : Installation du Plugin
  - H2 : Démarrage rapide
  - H2 : Fournisseurs pris en charge
  - H2 : BYOK
  - H2 : Authentification
  - H2 : Surface de configuration
  - H2 : Compaction
  - H2 : Mise en miroir de la transcription
  - H2 : Questions annexes (/btw)
  - H2 : Doctor
  - H2 : Limitations
  - H2 : Autorisations et askuser
  - H3 : Jeton GitHub au niveau de la session
  - H2 : Articles connexes

## plugins/dependency-resolution.md

- Route : /plugins/dependency-resolution
- Titres :
  - H2 : Répartition des responsabilités
  - H2 : Racines d’installation
  - H2 : Plugins locaux
  - H2 : Démarrage et rechargement
  - H2 : Plugins groupés
  - H2 : Nettoyage hérité

## plugins/google-meet.md

- Route : /plugins/google-meet
- Titres :
  - H2 : Démarrage rapide
  - H3 : Gateway locale + Chrome Parallels
  - H2 : Notes d’installation
  - H2 : Transports
  - H3 : Chrome
  - H3 : Twilio
  - H2 : OAuth et contrôle préalable
  - H3 : Créer des identifiants Google
  - H3 : Générer le jeton d’actualisation
  - H3 : Vérifier OAuth avec doctor
  - H2 : Configuration
  - H2 : Outil
  - H2 : Modes agent et bidi
  - H2 : Liste de vérification des tests live
  - H2 : Dépannage
  - H3 : L’agent ne voit pas l’outil Google Meet
  - H3 : Aucun nœud compatible Google Meet connecté
  - H3 : Le navigateur s’ouvre mais l’agent ne peut pas rejoindre
  - H3 : La création de réunion échoue
  - H3 : L’agent rejoint mais ne parle pas
  - H3 : Les vérifications de configuration Twilio échouent
  - H3 : L’appel Twilio démarre mais n’entre jamais dans la réunion
  - H2 : Notes
  - H2 : Associés

## plugins/hooks.md

- Route : /plugins/hooks
- Titres :
  - H2 : Démarrage rapide
  - H2 : Catalogue de hooks
  - H2 : Déboguer les hooks d’exécution
  - H2 : Politique d’appel d’outil
  - H3 : Hook d’environnement d’exécution
  - H3 : Persistance des résultats d’outil
  - H2 : Hooks de prompt et de modèle
  - H3 : Extensions de session et injections au tour suivant
  - H2 : Hooks de message
  - H2 : Installer des hooks
  - H2 : Cycle de vie du Gateway
  - H2 : Dépréciations à venir
  - H2 : Associés

## plugins/install-overrides.md

- Route : /plugins/install-overrides
- Titres :
  - H2 : Environnement
  - H2 : Comportement
  - H2 : E2E de package

## plugins/llama-cpp.md

- Route : /plugins/llama-cpp
- Titres :
  - H2 : Configuration
  - H2 : Runtime natif

## plugins/manage-plugins.md

- Route : /plugins/manage-plugins
- Titres :
  - H2 : Lister et rechercher des plugins
  - H2 : Installer des plugins
  - H2 : Redémarrer et inspecter
  - H2 : Mettre à jour les plugins
  - H2 : Désinstaller des plugins
  - H2 : Choisir une source
  - H2 : Publier des plugins
  - H2 : Associés

## plugins/manifest.md

- Route : /plugins/manifest
- Titres :
  - H2 : Ce que fait ce fichier
  - H2 : Exemple minimal
  - H2 : Exemple riche
  - H2 : Référence des champs de niveau supérieur
  - H2 : Référence des métadonnées du fournisseur de génération
  - H2 : Référence des métadonnées d’outil
  - H2 : Référence de providerAuthChoices
  - H2 : Référence de commandAliases
  - H2 : Référence d’activation
  - H2 : Référence de qaRunners
  - H2 : Référence de setup
  - H3 : Référence de setup.providers
  - H3 : Champs de setup
  - H2 : Référence de uiHints
  - H2 : Référence de contracts
  - H2 : Référence de mediaUnderstandingProviderMetadata
  - H2 : Référence de channelConfigs
  - H3 : Remplacer un autre plugin de canal
  - H2 : Référence de modelSupport
  - H2 : Référence de modelCatalog
  - H2 : Référence de modelIdNormalization
  - H2 : Référence de providerEndpoints
  - H2 : Référence de providerRequest
  - H2 : Référence de secretProviderIntegrations
  - H2 : Référence de modelPricing
  - H3 : Index des fournisseurs OpenClaw
  - H2 : Manifest versus package.json
  - H3 : Champs package.json qui affectent la découverte
  - H2 : Priorité de découverte (identifiants de plugin dupliqués)
  - H2 : Exigences du schéma JSON
  - H2 : Comportement de validation
  - H2 : Notes
  - H2 : Associés

## plugins/memory-lancedb.md

- Route : /plugins/memory-lancedb
- Titres :
  - H2 : Installation
  - H2 : Démarrage rapide
  - H2 : Embeddings adossés à un fournisseur
  - H2 : Embeddings Ollama
  - H2 : Fournisseurs compatibles OpenAI
  - H2 : Limites de rappel et de capture
  - H2 : Commandes
  - H2 : Stockage
  - H2 : Dépendances d’exécution
  - H2 : Dépannage
  - H3 : La longueur d’entrée dépasse la longueur du contexte
  - H3 : Modèle d’embedding non pris en charge
  - H3 : Le Plugin se charge mais aucune mémoire n’apparaît
  - H2 : Associés

## plugins/memory-wiki.md

- Route : /plugins/memory-wiki
- Titres :
  - H2 : Ce qu’il ajoute
  - H2 : Comment il s’intègre à la mémoire
  - H2 : Modèle hybride recommandé
  - H2 : Modes de coffre
  - H3 : isolé
  - H3 : bridge
  - H3 : unsafe-local
  - H2 : Structure du coffre
  - H2 : Imports Open Knowledge Format
  - H2 : Assertions structurées et preuves
  - H2 : Métadonnées d’entité destinées à l’agent
  - H2 : Pipeline de compilation
  - H2 : Tableaux de bord et rapports d’état
  - H2 : Recherche et récupération
  - H2 : Outils d’agent
  - H2 : Comportement du prompt et du contexte
  - H2 : Configuration
  - H3 : Exemple : QMD + mode bridge
  - H2 : CLI
  - H2 : Prise en charge d’Obsidian
  - H2 : Flux de travail recommandé
  - H2 : Docs associées

## plugins/message-presentation.md

- Route : /plugins/message-presentation
- Titres :
  - H2 : Contrat
  - H2 : Exemples de producteurs
  - H2 : Contrat du moteur de rendu
  - H2 : Flux de rendu principal
  - H2 : Règles de dégradation
  - H2 : Mappage des fournisseurs
  - H2 : Presentation vs InteractiveReply
  - H2 : Épingle de livraison
  - H2 : Liste de vérification pour auteurs de plugins
  - H2 : Docs associées

## plugins/oc-path.md

- Route : /plugins/oc-path
- Titres :
  - H2 : Pourquoi l’activer
  - H2 : Où il s’exécute
  - H2 : Activer
  - H2 : Dépendances
  - H2 : Ce qu’il fournit
  - H2 : Relation avec les autres plugins
  - H2 : Sécurité
  - H2 : Associés

## plugins/plugin-inventory.md

- Route : /plugins/plugin-inventory
- Titres :
  - H1 : Inventaire des Plugins
  - H2 : Définitions
  - H2 : Installer un plugin
  - H2 : Package npm principal
  - H2 : Packages externes officiels
  - H2 : Extraction source uniquement

## plugins/plugin-permission-requests.md

- Route : /plugins/plugin-permission-requests
- Titres :
  - H2 : Choisir la bonne barrière
  - H2 : Demander une approbation avant un appel d’outil
  - H2 : Comportement de décision
  - H2 : Acheminer les prompts d’approbation
  - H2 : Permissions natives de Codex
  - H2 : Dépannage
  - H2 : Associés

## plugins/reference.md

- Route : /plugins/reference
- Titres :
  - H1 : Référence des Plugins

## plugins/reference/acpx.md

- Route : /plugins/reference/acpx
- Titres :
  - H1 : Plugin ACPx
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/admin-http-rpc.md

- Route : /plugins/reference/admin-http-rpc
- Titres :
  - H1 : Plugin Admin Http Rpc
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/alibaba.md

- Route : /plugins/reference/alibaba
- Titres :
  - H1 : Plugin Alibaba
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/amazon-bedrock-mantle.md

- Route : /plugins/reference/amazon-bedrock-mantle
- Titres :
  - H1 : Plugin Amazon Bedrock Mantle
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/amazon-bedrock.md

- Route : /plugins/reference/amazon-bedrock
- Titres :
  - H1 : Plugin Amazon Bedrock
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/anthropic-vertex.md

- Route : /plugins/reference/anthropic-vertex
- Titres :
  - H1 : Plugin Anthropic Vertex
  - H2 : Distribution
  - H2 : Surface
  - H2 : Claude Fable 5

## plugins/reference/anthropic.md

- Route : /plugins/reference/anthropic
- Titres :
  - H1 : Plugin Anthropic
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/arcee.md

- Route : /plugins/reference/arcee
- Titres :
  - H1 : Plugin Arcee
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/azure-speech.md

- Route : /plugins/reference/azure-speech
- Titres :
  - H1 : Plugin Azure Speech
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/bonjour.md

- Route : /plugins/reference/bonjour
- Titres :
  - H1 : Plugin Bonjour
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/brave.md

- Route : /plugins/reference/brave
- Titres :
  - H1 : Plugin Brave
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/browser.md

- Route : /plugins/reference/browser
- Titres :
  - H1 : Plugin Browser
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/byteplus.md

- Route : /plugins/reference/byteplus
- Titres :
  - H1 : Plugin BytePlus
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/canvas.md

- Route : /plugins/reference/canvas
- Titres :
  - H1 : Plugin Canvas
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/cerebras.md

- Route : /plugins/reference/cerebras
- Titres :
  - H1 : Plugin Cerebras
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/chutes.md

- Route : /plugins/reference/chutes
- Titres :
  - H1 : Plugin Chutes
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/clickclack.md

- Route : /plugins/reference/clickclack
- Titres :
  - H1 : Plugin Clickclack
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/cloudflare-ai-gateway.md

- Route : /plugins/reference/cloudflare-ai-gateway
- Titres :
  - H1 : Plugin Cloudflare AI Gateway
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/codex-supervisor.md

- Route : /plugins/reference/codex-supervisor
- Titres :
  - H1 : Plugin Codex Supervisor
  - H2 : Distribution
  - H2 : Surface
  - H2 : Liste des sessions

## plugins/reference/codex.md

- Route : /plugins/reference/codex
- Titres :
  - H1 : Plugin Codex
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/cohere.md

- Route : /plugins/reference/cohere
- Titres :
  - H1 : Plugin Cohere
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/comfy.md

- Route : /plugins/reference/comfy
- Titres :
  - H1 : Plugin ComfyUI
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/copilot-proxy.md

- Route : /plugins/reference/copilot-proxy
- Titres :
  - H1 : Plugin Copilot Proxy
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/copilot.md

- Route : /plugins/reference/copilot
- Titres :
  - H1 : Plugin Copilot
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/deepgram.md

- Route : /plugins/reference/deepgram
- Titres :
  - H1 : Plugin Deepgram
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/deepinfra.md

- Route : /plugins/reference/deepinfra
- Titres :
  - H1 : Plugin DeepInfra
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/deepseek.md

- Route : /plugins/reference/deepseek
- Titres :
  - H1 : Plugin DeepSeek
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/diagnostics-otel.md

- Route : /plugins/reference/diagnostics-otel
- Titres :
  - H1 : Plugin Diagnostics OpenTelemetry
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/diagnostics-prometheus.md

- Route : /plugins/reference/diagnostics-prometheus
- Titres :
  - H1 : Plugin Diagnostics Prometheus
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/diffs-language-pack.md

- Route : /plugins/reference/diffs-language-pack
- Titres :
  - H1 : Plugin Diffs Language Pack
  - H2 : Distribution
  - H2 : Surface
  - H2 : Langues ajoutées

## plugins/reference/diffs.md

- Route : /plugins/reference/diffs
- Titres :
  - H1 : Plugin Diffs
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/discord.md

- Route : /plugins/reference/discord
- Titres :
  - H1 : Plugin Discord
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/document-extract.md

- Route : /plugins/reference/document-extract
- Titres :
  - H1 : Plugin Document Extract
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/duckduckgo.md

- Route : /plugins/reference/duckduckgo
- Titres :
  - H1 : Plugin DuckDuckGo
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/elevenlabs.md

- Route : /plugins/reference/elevenlabs
- Titres :
  - H1 : Plugin Elevenlabs
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/exa.md

- Route : /plugins/reference/exa
- Titres :
  - H1 : Plugin Exa
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/fal.md

- Route : /plugins/reference/fal
- Titres :
  - H1 : Plugin fal
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/feishu.md

- Route : /plugins/reference/feishu
- Titres :
  - H1 : Plugin Feishu
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/file-transfer.md

- Route : /plugins/reference/file-transfer
- Titres :
  - H1 : Plugin File Transfer
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/firecrawl.md

- Route : /plugins/reference/firecrawl
- Titres :
  - H1 : Plugin Firecrawl
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/fireworks.md

- Route : /plugins/reference/fireworks
- Titres :
  - H1 : Plugin Fireworks
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/github-copilot.md

- Route : /plugins/reference/github-copilot
- Titres :
  - H1 : Plugin GitHub Copilot
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/gmi.md

- Route : /plugins/reference/gmi
- Titres :
  - H1 : Plugin Gmi
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/google-meet.md

- Route : /plugins/reference/google-meet
- Titres :
  - H1 : Plugin Google Meet
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/google.md

- Route : /plugins/reference/google
- Titres :
  - H1 : Plugin Google
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/googlechat.md

- Route : /plugins/reference/googlechat
- Titres :
  - H1 : Plugin Google Chat
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/gradium.md

- Route : /plugins/reference/gradium
- Titres :
  - H1 : Plugin Gradium
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/groq.md

- Route : /plugins/reference/groq
- Titres :
  - H1 : Plugin Groq
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/huggingface.md

- Route : /plugins/reference/huggingface
- Titres :
  - H1 : Plugin Hugging Face
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/imessage.md

- Route : /plugins/reference/imessage
- Titres :
  - H1 : Plugin iMessage
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/inworld.md

- Route : /plugins/reference/inworld
- Titres :
  - H1 : Plugin Inworld
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/irc.md

- Route : /plugins/reference/irc
- Titres :
  - H1 : Plugin IRC
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/kilocode.md

- Route : /plugins/reference/kilocode
- Titres :
  - H1 : Plugin Kilocode
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/kimi.md

- Route : /plugins/reference/kimi
- Titres :
  - H1 : Plugin Kimi
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/line.md

- Route : /plugins/reference/line
- Titres :
  - H1 : Plugin LINE
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/litellm.md

- Route : /plugins/reference/litellm
- Titres :
  - H1 : Plugin LiteLLM
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/llama-cpp.md

- Route : /plugins/reference/llama-cpp
- Titres :
  - H1 : Plugin Llama Cpp
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/llm-task.md

- Route : /plugins/reference/llm-task
- Titres :
  - H1 : Plugin LLM Task
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/lmstudio.md

- Route : /plugins/reference/lmstudio
- Titres :
  - H1 : Plugin LM Studio
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/lobster.md

- Route : /plugins/reference/lobster
- Titres :
  - H1 : Plugin Lobster
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/matrix.md

- Route : /plugins/reference/matrix
- Titres :
  - H1 : Plugin Matrix
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/mattermost.md

- Route : /plugins/reference/mattermost
- Titres :
  - H1 : Plugin Mattermost
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/memory-core.md

- Route : /plugins/reference/memory-core
- Titres :
  - H1 : Plugin Memory Core
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/memory-lancedb.md

- Route : /plugins/reference/memory-lancedb
- Titres :
  - H1 : Plugin Memory Lancedb
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/memory-wiki.md

- Route : /plugins/reference/memory-wiki
- Titres :
  - H1 : Plugin Memory Wiki
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/microsoft-foundry.md

- Route : /plugins/reference/microsoft-foundry
- Titres :
  - H1 : Plugin Microsoft Foundry
  - H2 : Distribution
  - H2 : Surface
  - H2 : Exigences
  - H2 : Modèles de chat
  - H2 : Génération d’images MAI
  - H2 : Dépannage

## plugins/reference/microsoft.md

- Route : /plugins/reference/microsoft
- Titres :
  - H1 : Plugin Microsoft
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/migrate-claude.md

- Route : /plugins/reference/migrate-claude
- Titres :
  - H1 : Plugin Migrate Claude
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/migrate-hermes.md

- Route : /plugins/reference/migrate-hermes
- Titres :
  - H1 : Plugin Migrate Hermes
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/minimax.md

- Route : /plugins/reference/minimax
- Titres :
  - H1 : Plugin MiniMax
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/mistral.md

- Route : /plugins/reference/mistral
- Titres :
  - H1 : Plugin Mistral
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/moonshot.md

- Route : /plugins/reference/moonshot
- Titres :
  - H1 : Plugin Moonshot
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/msteams.md

- Route : /plugins/reference/msteams
- Titres :
  - H1 : Plugin Microsoft Teams
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/nextcloud-talk.md

- Route : /plugins/reference/nextcloud-talk
- Titres :
  - H1 : Plugin Nextcloud Talk
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/nostr.md

- Route : /plugins/reference/nostr
- Titres :
  - H1 : Plugin Nostr
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/novita.md

- Route : /plugins/reference/novita
- Titres :
  - H1 : Plugin Novita
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/nvidia.md

- Route : /plugins/reference/nvidia
- Titres :
  - H1 : Plugin NVIDIA
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/oc-path.md

- Route : /plugins/reference/oc-path
- Titres :
  - H1 : Plugin Oc Path
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/ollama.md

- Route : /plugins/reference/ollama
- Titres :
  - H1 : Plugin Ollama
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/open-prose.md

- Route : /plugins/reference/open-prose
- Titres :
  - H1 : Plugin Open Prose
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/openai.md

- Route : /plugins/reference/openai
- Titres :
  - H1 : Plugin OpenAI
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/opencode-go.md

- Route : /plugins/reference/opencode-go
- Titres :
  - H1 : Plugin OpenCode Go
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/opencode.md

- Route : /plugins/reference/opencode
- Titres :
  - H1 : Plugin OpenCode
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/openrouter.md

- Route : /plugins/reference/openrouter
- Titres :
  - H1 : Plugin OpenRouter
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/openshell.md

- Route : /plugins/reference/openshell
- Titres :
  - H1 : Plugin Openshell
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/perplexity.md

- Route : /plugins/reference/perplexity
- Titres :
  - H1 : Plugin Perplexity
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/pixverse.md

- Route : /plugins/reference/pixverse
- Titres :
  - H1 : Plugin PixVerse
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/policy.md

- Route : /plugins/reference/policy
- Titres :
  - H1 : Plugin Policy
  - H2 : Distribution
  - H2 : Surface
  - H2 : Comportement
  - H2 : Documentation associée

## plugins/reference/qa-channel.md

- Route : /plugins/reference/qa-channel
- Titres :
  - H1 : Plugin QA Channel
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/qa-lab.md

- Route : /plugins/reference/qa-lab
- Titres :
  - H1 : Plugin QA Lab
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/qa-matrix.md

- Route : /plugins/reference/qa-matrix
- Titres :
  - H1 : Plugin QA Matrix
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/qianfan.md

- Route : /plugins/reference/qianfan
- Titres :
  - H1 : Plugin Qianfan
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/qqbot.md

- Route : /plugins/reference/qqbot
- Titres :
  - H1 : Plugin QQ Bot
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/qwen.md

- Route : /plugins/reference/qwen
- Titres :
  - H1 : Plugin Qwen
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/raft.md

- Route : /plugins/reference/raft
- Titres :
  - H1 : Plugin Raft
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/runway.md

- Route : /plugins/reference/runway
- Titres :
  - H1 : Plugin Runway
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/searxng.md

- Route : /plugins/reference/searxng
- Titres :
  - H1 : Plugin SearXNG
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/senseaudio.md

- Route : /plugins/reference/senseaudio
- Titres :
  - H1 : Plugin Senseaudio
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/sglang.md

- Route : /plugins/reference/sglang
- Titres :
  - H1 : Plugin SGLang
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/signal.md

- Route : /plugins/reference/signal
- Titres :
  - H1 : Plugin Signal
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/slack.md

- Route : /plugins/reference/slack
- Titres :
  - H1 : Plugin Slack
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/sms.md

- Route : /plugins/reference/sms
- Titres :
  - H1 : Plugin Sms
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/stepfun.md

- Route : /plugins/reference/stepfun
- Titres :
  - H1 : Plugin StepFun
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/synology-chat.md

- Route : /plugins/reference/synology-chat
- Titres :
  - H1 : Plugin Synology Chat
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/synthetic.md

- Route : /plugins/reference/synthetic
- Titres :
  - H1 : Plugin Synthetic
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/tavily.md

- Route : /plugins/reference/tavily
- Titres :
  - H1 : Plugin Tavily
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/telegram.md

- Route : /plugins/reference/telegram
- Titres :
  - H1 : Plugin Telegram
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/tencent.md

- Route : /plugins/reference/tencent
- Titres :
  - H1 : Plugin Tencent
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/tlon.md

- Route : /plugins/reference/tlon
- Titres :
  - H1 : Plugin Tlon
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/together.md

- Route : /plugins/reference/together
- Titres :
  - H1 : Plugin Together
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/tokenjuice.md

- Route : /plugins/reference/tokenjuice
- Titres :
  - H1 : Plugin Tokenjuice
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/tts-local-cli.md

- Route : /plugins/reference/tts-local-cli
- Titres :
  - H1 : Plugin TTS Local CLI
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/twitch.md

- Route : /plugins/reference/twitch
- Titres :
  - H1 : Plugin Twitch
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/venice.md

- Route : /plugins/reference/venice
- Titres :
  - H1 : Plugin Venice
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/vercel-ai-gateway.md

- Route : /plugins/reference/vercel-ai-gateway
- Titres :
  - H1 : Plugin Vercel AI Gateway
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/vllm.md

- Route : /plugins/reference/vllm
- Titres :
  - H1 : Plugin vLLM
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/voice-call.md

- Route : /plugins/reference/voice-call
- Titres :
  - H1 : Plugin Voice Call
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/volcengine.md

- Route : /plugins/reference/volcengine
- Titres :
  - H1 : Plugin Volcengine
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/voyage.md

- Route : /plugins/reference/voyage
- Titres :
  - H1 : Plugin Voyage
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/vydra.md

- Route : /plugins/reference/vydra
- Titres :
  - H1 : Plugin Vydra
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/web-readability.md

- Route : /plugins/reference/web-readability
- Titres :
  - H1 : Plugin Web Readability
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/webhooks.md

- Route : /plugins/reference/webhooks
- Titres :
  - H1 : Plugin Webhooks
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/whatsapp.md

- Route : /plugins/reference/whatsapp
- Titres :
  - H1 : Plugin WhatsApp
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/workboard.md

- Route : /plugins/reference/workboard
- Titres :
  - H1 : Plugin Workboard
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/xai.md

- Route : /plugins/reference/xai
- Titres :
  - H1 : Plugin xAI
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/xiaomi.md

- Route : /plugins/reference/xiaomi
- Titres :
  - H1 : Plugin Xiaomi
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/zai.md

- Route : /plugins/reference/zai
- Titres :
  - H1 : Plugin Z.AI
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/zalo.md

- Route : /plugins/reference/zalo
- Titres :
  - H1 : Plugin Zalo
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/reference/zalouser.md

- Route : /plugins/reference/zalouser
- Titres :
  - H1 : Plugin Zalo Personal
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs associées

## plugins/sdk-agent-harness.md

- Route : /plugins/sdk-agent-harness
- Titres :
  - H2 : Quand utiliser un harness
  - H2 : Ce que le noyau possède encore
  - H2 : Enregistrer un harness
  - H2 : Politique de sélection
  - H2 : Association fournisseur plus harness
  - H3 : Middleware de résultat d’outil
  - H3 : Classification du résultat terminal
  - H3 : Effets secondaires côté fin d’agent
  - H3 : Entrée utilisateur et surfaces d’outils
  - H3 : Mode harness Codex natif
  - H2 : Rigueur d’exécution
  - H2 : Sessions natives et miroir de transcription
  - H2 : Résultats d’outils et de médias
  - H2 : Limitations actuelles
  - H2 : Associé

## plugins/sdk-channel-inbound.md

- Route : /plugins/sdk-channel-inbound
- Titres :
  - H2 : Assistants du noyau
  - H2 : Migration

## plugins/sdk-channel-ingress.md

- Route : /plugins/sdk-channel-ingress
- Titres :
  - H1 : API d’entrée de canal
  - H2 : Résolveur d’exécution
  - H2 : Résultat
  - H2 : Groupes d’accès
  - H2 : Modes d’événement
  - H2 : Routes et activation
  - H2 : Caviardage
  - H2 : Vérification

## plugins/sdk-channel-message.md

- Route : /plugins/sdk-channel-message
- Titres : aucun

## plugins/sdk-channel-outbound.md

- Route : /plugins/sdk-channel-outbound
- Titres :
  - H2 : Adaptateur
  - H2 : Adaptateurs sortants existants
  - H2 : Envois durables
  - H2 : Répartition de compatibilité

## plugins/sdk-channel-plugins.md

- Route : /plugins/sdk-channel-plugins
- Titres :
  - H2 : Fonctionnement des Plugins de canal
  - H2 : Approbations et capacités de canal
  - H2 : Politique de mention entrante
  - H2 : Pas à pas
  - H2 : Structure de fichiers
  - H2 : Sujets avancés
  - H2 : Étapes suivantes
  - H2 : Associé

## plugins/sdk-channel-turn.md

- Route : /plugins/sdk-channel-turn
- Titres : aucun

## plugins/sdk-entrypoints.md

- Route : /plugins/sdk-entrypoints
- Titres :
  - H2 : defineToolPlugin
  - H2 : definePluginEntry
  - H2 : defineChannelPluginEntry
  - H2 : defineSetupPluginEntry
  - H2 : Mode d’enregistrement
  - H2 : Formes de Plugin
  - H2 : Associé

## plugins/sdk-migration.md

- Route : /plugins/sdk-migration
- Titres :
  - H2 : Ce qui change
  - H2 : Pourquoi ce changement
  - H2 : Plan de migration de Talk et de la voix en temps réel
  - H2 : Politique de compatibilité
  - H2 : Comment migrer
  - H2 : Référence des chemins d’importation
  - H2 : Dépréciations actives
  - H2 : Calendrier de suppression
  - H2 : Masquer temporairement les avertissements
  - H2 : Associé

## plugins/sdk-overview.md

- Route : /plugins/sdk-overview
- Titres :
  - H2 : Convention d’importation
  - H2 : Référence des sous-chemins
  - H2 : API d’enregistrement
  - H3 : Enregistrement des capacités
  - H3 : Outils et commandes
  - H3 : Infrastructure
  - H3 : Hooks d’hôte pour Plugins de workflow
  - H3 : Enregistrement de découverte Gateway
  - H3 : Métadonnées d’enregistrement CLI
  - H3 : Enregistrement du backend CLI
  - H3 : Emplacements exclusifs
  - H3 : Adaptateurs d’intégration mémoire obsolètes
  - H3 : Événements et cycle de vie
  - H3 : Sémantique de décision des hooks
  - H3 : Champs de l’objet API
  - H2 : Convention de module interne
  - H2 : Associé

## plugins/sdk-provider-plugins.md

- Route : /plugins/sdk-provider-plugins
- Titres :
  - H2 : Pas à pas
  - H2 : Publier sur ClawHub
  - H2 : Structure de fichiers
  - H2 : Référence de l’ordre du catalogue
  - H2 : Étapes suivantes
  - H2 : Associé

## plugins/sdk-runtime.md

- Route : /plugins/sdk-runtime
- Titres :
  - H2 : Chargement et écritures de configuration
  - H2 : Utilitaires d’exécution réutilisables
  - H2 : Espaces de noms d’exécution
  - H2 : Stockage des références d’exécution
  - H2 : Autres champs api de premier niveau
  - H2 : Associé

## plugins/sdk-setup.md

- Route : /plugins/sdk-setup
- Titres :
  - H2 : Métadonnées du package
  - H3 : Champs openclaw
  - H3 : openclaw.channel
  - H3 : openclaw.install
  - H3 : Chargement complet différé
  - H2 : Manifeste du Plugin
  - H2 : Publication ClawHub
  - H2 : Entrée de configuration
  - H3 : Importations étroites des assistants de configuration
  - H3 : Promotion de compte unique détenue par le canal
  - H2 : Schéma de configuration
  - H3 : Création de schémas de configuration de canal
  - H2 : Assistants de configuration
  - H2 : Publication et installation
  - H2 : Associé

## plugins/sdk-subpaths.md

- Route : /plugins/sdk-subpaths
- Titres :
  - H2 : Entrée de Plugin
  - H3 : Assistants de compatibilité et de test obsolètes
  - H3 : Sous-chemins réservés aux assistants de Plugins groupés
  - H2 : Associé

## plugins/sdk-testing.md

- Route : /plugins/sdk-testing
- Titres :
  - H2 : Utilitaires de test
  - H3 : Exports disponibles
  - H3 : Types
  - H2 : Test de résolution de cible
  - H2 : Modèles de test
  - H3 : Test des contrats d’enregistrement
  - H3 : Test de l’accès à la configuration d’exécution
  - H3 : Test unitaire d’un Plugin de canal
  - H3 : Test unitaire d’un Plugin de fournisseur
  - H3 : Mock du runtime de Plugin
  - H3 : Test avec des stubs par instance
  - H2 : Tests de contrat (Plugins dans le dépôt)
  - H3 : Exécuter des tests ciblés
  - H2 : Application du lint (Plugins dans le dépôt)
  - H2 : Configuration des tests
  - H2 : Associé

## plugins/tool-plugins.md

- Route : /plugins/tool-plugins
- Titres :
  - H2 : Exigences
  - H2 : Démarrage rapide
  - H2 : Écrire un outil
  - H2 : Outils facultatifs et factory
  - H2 : Valeurs de retour
  - H2 : Configuration
  - H2 : Métadonnées générées
  - H2 : Métadonnées du package
  - H2 : Valider dans la CI
  - H2 : Installer et inspecter localement
  - H2 : Publier
  - H2 : Dépannage
  - H3 : entrée de Plugin introuvable : ./dist/index.js
  - H3 : l’entrée de Plugin n’expose pas les métadonnées defineToolPlugin
  - H3 : les métadonnées générées openclaw.plugin.json sont obsolètes
  - H3 : package.json openclaw.extensions doit inclure ./dist/index.js
  - H3 : Cannot find package 'typebox'
  - H3 : L’outil n’apparaît pas après l’installation
  - H2 : Voir aussi

## plugins/voice-call.md

- Route : /plugins/voice-call
- Titres :
  - H2 : Démarrage rapide
  - H2 : Configuration
  - H2 : Portée de session
  - H2 : Conversations vocales en temps réel
  - H3 : Politique d’outils
  - H3 : Contexte vocal de l’agent
  - H3 : Exemples de fournisseurs en temps réel
  - H2 : Transcription en streaming
  - H3 : Exemples de fournisseurs de streaming
  - H2 : TTS pour les appels
  - H3 : Exemples TTS
  - H2 : Appels entrants
  - H3 : Routage par numéro
  - H3 : Contrat de sortie vocale
  - H3 : Comportement au démarrage de la conversation
  - H3 : Délai de grâce de déconnexion du flux Twilio
  - H2 : Collecteur d’appels obsolètes
  - H2 : Sécurité Webhook
  - H2 : CLI
  - H2 : Outil d’agent
  - H2 : RPC Gateway
  - H2 : Dépannage
  - H3 : La configuration échoue lors de l’exposition du Webhook
  - H3 : Les identifiants du fournisseur échouent
  - H3 : Les appels démarrent mais les Webhooks du fournisseur n’arrivent pas
  - H3 : La vérification de signature échoue
  - H3 : Les jonctions Google Meet Twilio échouent
  - H3 : L’appel en temps réel n’a pas de parole
  - H2 : Associé

## plugins/webhooks.md

- Route : /plugins/webhooks
- Titres :
  - H2 : Où il s’exécute
  - H2 : Configurer les routes
  - H2 : Modèle de sécurité
  - H2 : Format de requête
  - H2 : Actions prises en charge
  - H3 : createflow
  - H3 : runtask
  - H2 : Forme de réponse
  - H2 : Docs associées

## plugins/workboard.md

- Route : /plugins/workboard
- Titres :
  - H2 : État par défaut
  - H2 : Ce que contiennent les cartes
  - H2 : Exécutions de cartes et tâches
  - H2 : Coordination des agents
  - H3 : Sélection du worker de répartition
  - H3 : Prompt du worker et cycle de vie
  - H3 : Points d’entrée de répartition
  - H2 : CLI et commande slash
  - H2 : Synchronisation du cycle de vie de session
  - H2 : Workflow du tableau de bord
  - H2 : Autorisations
  - H2 : Configuration
  - H2 : Dépannage
  - H3 : L’onglet indique que Workboard est indisponible
  - H3 : Les cartes ne s’enregistrent pas
  - H3 : Le démarrage d’une carte n’ouvre pas la session attendue
  - H3 : La répartition ne lance pas de worker
  - H2 : Associé

## plugins/zalouser.md

- Route : /plugins/zalouser
- Titres :
  - H2 : Nommage
  - H2 : Où il s’exécute
  - H2 : Installer
  - H3 : Option A : installer depuis npm
  - H3 : Option B : installer depuis un dossier local (dev)
  - H2 : Config
  - H2 : CLI
  - H2 : Outil d’agent
  - H2 : Associé

## prose.md

- Route : /prose
- Titres :
  - H2 : Installer
  - H2 : Commande slash
  - H2 : Ce qu’il peut faire
  - H2 : Exemple : recherche et synthèse parallèles
  - H2 : Mappage du runtime OpenClaw
  - H2 : Emplacements des fichiers
  - H2 : Backends d’état
  - H2 : Sécurité
  - H2 : Associé

## providers/alibaba.md

- Route : /providers/alibaba
- Titres :
  - H2 : Bien démarrer
  - H2 : Modèles Wan intégrés
  - H2 : Capacités et limites
  - H2 : Configuration avancée
  - H2 : Associé

## providers/anthropic.md

- Route : /providers/anthropic
- Titres :
  - H2 : Bien démarrer
  - H2 : Paramètres de réflexion par défaut (Claude Fable 5, 4.8 et 4.6)
  - H2 : Mise en cache des prompts
  - H2 : Configuration avancée
  - H2 : Dépannage
  - H2 : Associé

## providers/arcee.md

- Route : /providers/arcee
- Titres :
  - H2 : Installer le Plugin
  - H2 : Bien démarrer
  - H2 : Configuration non interactive
  - H2 : Catalogue intégré
  - H2 : Fonctionnalités prises en charge
  - H2 : Associé

## providers/azure-speech.md

- Route : /providers/azure-speech
- Titres :
  - H2 : Bien démarrer
  - H2 : Options de configuration
  - H2 : Notes
  - H2 : Associé

## providers/bedrock-mantle.md

- Route : /providers/bedrock-mantle
- Titres :
  - H2 : Bien démarrer
  - H2 : Découverte automatique des modèles
  - H3 : Régions prises en charge
  - H2 : Configuration manuelle
  - H2 : Configuration avancée
  - H2 : Associé

## providers/bedrock.md

- Route : /providers/bedrock
- Titres :
  - H2 : Bien démarrer
  - H2 : Découverte automatique des modèles
  - H2 : Configuration rapide (chemin AWS)
  - H2 : Configuration avancée
  - H2 : Associé

## providers/cerebras.md

- Route : /providers/cerebras
- Titres :
  - H2 : Installer le Plugin
  - H2 : Bien démarrer
  - H2 : Configuration non interactive
  - H2 : Catalogue intégré
  - H2 : Configuration manuelle
  - H2 : Associé

## providers/chutes.md

- Route : /providers/chutes
- Titres :
  - H2 : Installer le Plugin
  - H2 : Bien démarrer
  - H2 : Comportement de découverte
  - H2 : Alias par défaut
  - H2 : Catalogue de démarrage intégré
  - H2 : Exemple de configuration
  - H2 : Associé

## providers/claude-max-api-proxy.md

- Itinéraire : /providers/claude-max-api-proxy
- Titres :
  - H2 : Pourquoi l’utiliser ?
  - H2 : Fonctionnement
  - H2 : Bien démarrer
  - H2 : Catalogue intégré
  - H2 : Configuration avancée
  - H2 : Notes
  - H2 : Articles liés

## providers/cloudflare-ai-gateway.md

- Itinéraire : /providers/cloudflare-ai-gateway
- Titres :
  - H2 : Installer le Plugin
  - H2 : Bien démarrer
  - H2 : Exemple non interactif
  - H2 : Configuration avancée
  - H2 : Articles liés

## providers/cohere.md

- Itinéraire : /providers/cohere
- Titres :
  - H2 : Bien démarrer
  - H2 : Configuration par environnement uniquement
  - H2 : Articles liés

## providers/comfy.md

- Itinéraire : /providers/comfy
- Titres :
  - H2 : Ce qu’il prend en charge
  - H2 : Bien démarrer
  - H2 : Configuration
  - H3 : Clés partagées
  - H3 : Clés par capacité
  - H2 : Détails du workflow
  - H2 : Articles liés

## providers/deepgram.md

- Itinéraire : /providers/deepgram
- Titres :
  - H2 : Bien démarrer
  - H2 : Options de configuration
  - H2 : STT en streaming pour les appels vocaux
  - H2 : Notes
  - H2 : Articles liés

## providers/deepinfra.md

- Itinéraire : /providers/deepinfra
- Titres :
  - H2 : Installer le Plugin
  - H2 : Obtenir une clé API
  - H2 : Configuration de la CLI
  - H2 : Extrait de configuration
  - H2 : Surfaces OpenClaw prises en charge
  - H2 : Modèles disponibles
  - H2 : Notes
  - H2 : Articles liés

## providers/deepseek.md

- Itinéraire : /providers/deepseek
- Titres :
  - H2 : Installer le Plugin
  - H2 : Bien démarrer
  - H2 : Catalogue intégré
  - H2 : Réflexion et outils
  - H2 : Tests en direct
  - H2 : Exemple de configuration
  - H2 : Articles liés

## providers/ds4.md

- Itinéraire : /providers/ds4
- Titres :
  - H2 : Prérequis
  - H2 : Démarrage rapide
  - H2 : Configuration complète
  - H2 : Démarrage à la demande
  - H2 : Réflexion maximale
  - H2 : Test
  - H2 : Dépannage
  - H2 : Articles liés

## providers/elevenlabs.md

- Itinéraire : /providers/elevenlabs
- Titres :
  - H2 : Authentification
  - H2 : Synthèse vocale
  - H2 : Reconnaissance vocale
  - H2 : STT en streaming
  - H2 : Articles liés

## providers/fal.md

- Itinéraire : /providers/fal
- Titres :
  - H2 : Bien démarrer
  - H2 : Génération d’images
  - H2 : Génération vidéo
  - H2 : Génération musicale
  - H2 : Articles liés

## providers/fireworks.md

- Itinéraire : /providers/fireworks
- Titres :
  - H2 : Bien démarrer
  - H2 : Configuration non interactive
  - H2 : Catalogue intégré
  - H2 : Identifiants de modèles Fireworks personnalisés
  - H2 : Articles liés

## providers/github-copilot.md

- Itinéraire : /providers/github-copilot
- Titres :
  - H2 : Trois façons d’utiliser Copilot dans OpenClaw
  - H2 : Indicateurs optionnels
  - H2 : Intégration non interactive
  - H2 : Embeddings de recherche mémoire
  - H3 : Configuration
  - H3 : Fonctionnement
  - H2 : Articles liés

## providers/gmi.md

- Itinéraire : /providers/gmi
- Titres :
  - H2 : Configuration
  - H2 : Valeurs par défaut
  - H2 : Quand choisir GMI
  - H2 : Modèles
  - H2 : Dépannage
  - H2 : Articles liés

## providers/google.md

- Itinéraire : /providers/google
- Titres :
  - H2 : Bien démarrer
  - H2 : Capacités
  - H2 : Recherche web
  - H2 : Génération d’images
  - H2 : Génération vidéo
  - H2 : Génération musicale
  - H2 : Synthèse vocale
  - H2 : Voix en temps réel
  - H2 : Configuration avancée
  - H2 : Articles liés

## providers/gradium.md

- Itinéraire : /providers/gradium
- Titres :
  - H2 : Installer le Plugin
  - H2 : Configuration
  - H2 : Configuration
  - H2 : Voix
  - H3 : Remplacement de voix par message
  - H2 : Sortie
  - H2 : Ordre de sélection automatique
  - H2 : Articles liés

## providers/groq.md

- Itinéraire : /providers/groq
- Titres :
  - H2 : Installer le Plugin
  - H2 : Bien démarrer
  - H3 : Exemple de fichier de configuration
  - H2 : Catalogue intégré
  - H2 : Modèles de raisonnement
  - H2 : Transcription audio
  - H2 : Articles liés

## providers/huggingface.md

- Itinéraire : /providers/huggingface
- Titres :
  - H2 : Bien démarrer
  - H3 : Configuration non interactive
  - H2 : Identifiants de modèles
  - H2 : Configuration avancée
  - H2 : Articles liés

## providers/index.md

- Itinéraire : /providers
- Titres :
  - H2 : Démarrage rapide
  - H2 : Documentation des fournisseurs
  - H2 : Pages de vue d’ensemble partagées
  - H2 : Fournisseurs de transcription
  - H2 : Outils communautaires

## providers/inferrs.md

- Itinéraire : /providers/inferrs
- Titres :
  - H2 : Bien démarrer
  - H2 : Exemple de configuration complète
  - H2 : Démarrage à la demande
  - H2 : Configuration avancée
  - H2 : Dépannage
  - H2 : Articles liés

## providers/inworld.md

- Itinéraire : /providers/inworld
- Titres :
  - H2 : Installer le Plugin
  - H2 : Bien démarrer
  - H2 : Options de configuration
  - H2 : Notes
  - H2 : Articles liés

## providers/kilocode.md

- Itinéraire : /providers/kilocode
- Titres :
  - H2 : Installer le Plugin
  - H2 : Bien démarrer
  - H2 : Modèle par défaut
  - H2 : Catalogue intégré
  - H2 : Exemple de configuration
  - H2 : Articles liés

## providers/litellm.md

- Itinéraire : /providers/litellm
- Titres :
  - H2 : Démarrage rapide
  - H2 : Configuration
  - H3 : Variables d’environnement
  - H3 : Fichier de configuration
  - H2 : Configuration avancée
  - H3 : Génération d’images
  - H2 : Articles liés

## providers/lmstudio.md

- Itinéraire : /providers/lmstudio
- Titres :
  - H2 : Démarrage rapide
  - H2 : Intégration non interactive
  - H2 : Configuration
  - H3 : Compatibilité de l’utilisation en streaming
  - H3 : Compatibilité de la réflexion
  - H3 : Configuration explicite
  - H2 : Dépannage
  - H3 : LM Studio non détecté
  - H3 : Erreurs d’authentification (HTTP 401)
  - H3 : Chargement de modèle juste-à-temps
  - H3 : Hôte LM Studio sur LAN ou tailnet
  - H2 : Articles liés

## providers/minimax.md

- Itinéraire : /providers/minimax
- Titres :
  - H2 : Catalogue intégré
  - H2 : Bien démarrer
  - H2 : Configurer via openclaw configure
  - H2 : Capacités
  - H3 : Génération d’images
  - H3 : Synthèse vocale
  - H3 : Génération musicale
  - H3 : Génération vidéo
  - H3 : Compréhension d’images
  - H3 : Recherche web
  - H2 : Configuration avancée
  - H2 : Notes
  - H2 : Dépannage
  - H2 : Articles liés

## providers/mistral.md

- Itinéraire : /providers/mistral
- Titres :
  - H2 : Bien démarrer
  - H2 : Catalogue LLM intégré
  - H2 : Transcription audio (Voxtral)
  - H2 : STT en streaming pour les appels vocaux
  - H2 : Configuration avancée
  - H2 : Articles liés

## providers/models.md

- Itinéraire : /providers/models
- Titres :
  - H2 : Démarrage rapide (deux étapes)
  - H2 : Fournisseurs pris en charge (ensemble de départ)
  - H2 : Variantes de fournisseurs supplémentaires
  - H2 : Articles liés

## providers/moonshot.md

- Itinéraire : /providers/moonshot
- Titres :
  - H2 : Catalogue de modèles intégré
  - H2 : Bien démarrer
  - H2 : Recherche web Kimi
  - H2 : Configuration avancée
  - H2 : Articles liés

## providers/novita.md

- Itinéraire : /providers/novita
- Titres :
  - H2 : Configuration
  - H2 : Valeurs par défaut
  - H2 : Quand choisir Novita
  - H2 : Modèles
  - H2 : Dépannage
  - H2 : Articles liés

## providers/nvidia.md

- Itinéraire : /providers/nvidia
- Titres :
  - H2 : Bien démarrer
  - H2 : Exemple de configuration
  - H2 : Catalogue mis en avant
  - H2 : Nemotron 3 Ultra
  - H2 : Catalogue de secours inclus
  - H2 : Configuration avancée
  - H2 : Articles liés

## providers/ollama-cloud.md

- Itinéraire : /providers/ollama-cloud
- Titres :
  - H2 : Configuration
  - H2 : Valeurs par défaut
  - H2 : Quand choisir Ollama Cloud
  - H2 : Modèles
  - H2 : Test en direct
  - H2 : Dépannage
  - H2 : Articles liés

## providers/ollama.md

- Itinéraire : /providers/ollama
- Titres :
  - H2 : Règles d’authentification
  - H2 : Bien démarrer
  - H2 : Modèles cloud
  - H2 : Découverte de modèles (fournisseur implicite)
  - H2 : Vision et description d’images
  - H2 : Configuration
  - H2 : Recettes courantes
  - H3 : Sélection du modèle
  - H3 : Vérification rapide
  - H2 : Ollama Web Search
  - H2 : Configuration avancée
  - H2 : Dépannage
  - H2 : Articles liés

## providers/openai.md

- Itinéraire : /providers/openai
- Titres :
  - H2 : Choix rapide
  - H2 : Carte de nommage
  - H2 : Aperçu limité de GPT-5.6
  - H2 : Couverture des fonctionnalités OpenClaw
  - H2 : Embeddings mémoire
  - H2 : Bien démarrer
  - H2 : Authentification native du serveur d’application Codex
  - H2 : Génération d’images
  - H2 : Génération vidéo
  - H2 : Contribution aux prompts GPT-5
  - H2 : Voix et parole
  - H2 : Points de terminaison Azure OpenAI
  - H3 : Configuration
  - H3 : Version de l’API
  - H3 : Les noms de modèles sont des noms de déploiement
  - H3 : Disponibilité régionale
  - H3 : Différences de paramètres
  - H2 : Configuration avancée
  - H2 : Articles liés

## providers/opencode-go.md

- Itinéraire : /providers/opencode-go
- Titres :
  - H2 : Catalogue intégré
  - H2 : Bien démarrer
  - H2 : Exemple de configuration
  - H2 : Configuration avancée
  - H2 : Articles liés

## providers/opencode.md

- Itinéraire : /providers/opencode
- Titres :
  - H2 : Bien démarrer
  - H2 : Exemple de configuration
  - H2 : Catalogues intégrés
  - H3 : Zen
  - H3 : Go
  - H2 : Configuration avancée
  - H2 : Articles liés

## providers/openrouter.md

- Itinéraire : /providers/openrouter
- Titres :
  - H2 : Bien démarrer
  - H2 : Exemple de configuration
  - H2 : Références de modèles
  - H2 : Génération d’images
  - H2 : Génération vidéo
  - H2 : Génération musicale
  - H2 : Synthèse vocale
  - H2 : Reconnaissance vocale (audio entrant)
  - H2 : Routeur Fusion
  - H2 : Authentification et en-têtes
  - H2 : Configuration avancée
  - H2 : Articles liés

## providers/perplexity-provider.md

- Itinéraire : /providers/perplexity-provider
- Titres :
  - H2 : Installer le Plugin
  - H2 : Bien démarrer
  - H2 : Modes de recherche
  - H2 : Filtrage natif de l’API
  - H2 : Configuration avancée
  - H2 : Articles liés

## providers/pixverse.md

- Itinéraire : /providers/pixverse
- Titres :
  - H2 : Bien démarrer
  - H2 : Modes et modèles pris en charge
  - H2 : Options du fournisseur
  - H2 : Configuration
  - H2 : Configuration avancée
  - H2 : Articles liés

## providers/qianfan.md

- Itinéraire : /providers/qianfan
- Titres :
  - H2 : Installer le Plugin
  - H2 : Bien démarrer
  - H2 : Catalogue intégré
  - H2 : Exemple de configuration
  - H2 : Articles liés

## providers/qwen-oauth.md

- Itinéraire : /providers/qwen-oauth
- Titres :
  - H2 : Configuration
  - H2 : Valeurs par défaut
  - H2 : Différences avec Qwen
  - H2 : Quand choisir Qwen OAuth / Portal
  - H2 : Modèles
  - H2 : Migration
  - H2 : Dépannage
  - H2 : Articles liés

## providers/qwen.md

- Itinéraire : /providers/qwen
- Titres :
  - H2 : Installer le Plugin
  - H2 : Bien démarrer
  - H2 : Types de forfaits et points de terminaison
  - H2 : Catalogue intégré
  - H2 : Contrôles de réflexion
  - H2 : Modules multimodaux
  - H2 : Configuration avancée
  - H2 : Articles liés

## providers/runway.md

- Itinéraire : /providers/runway
- Titres :
  - H2 : Bien démarrer
  - H2 : Modes et modèles pris en charge
  - H2 : Configuration
  - H2 : Configuration avancée
  - H2 : Articles liés

## providers/senseaudio.md

- Itinéraire : /providers/senseaudio
- Titres :
  - H2 : Bien démarrer
  - H2 : Options
  - H2 : Articles liés

## providers/sglang.md

- Itinéraire : /providers/sglang
- Titres :
  - H2 : Bien démarrer
  - H2 : Découverte de modèles (fournisseur implicite)
  - H2 : Configuration explicite (modèles manuels)
  - H2 : Configuration avancée
  - H2 : Articles liés

## providers/stepfun.md

- Itinéraire : /providers/stepfun
- Titres :
  - H2 : Installer le Plugin
  - H2 : Vue d’ensemble des régions et des points de terminaison
  - H2 : Catalogue intégré
  - H2 : Bien démarrer
  - H2 : Configuration avancée
  - H2 : Articles liés

## providers/synthetic.md

- Itinéraire : /providers/synthetic
- Titres :
  - H2 : Bien démarrer
  - H2 : Exemple de configuration
  - H2 : Catalogue intégré
  - H2 : Articles liés

## providers/tencent.md

- Itinéraire : /providers/tencent
- Titres :
  - H2 : Démarrage rapide
  - H2 : Configuration non interactive
  - H2 : Catalogue intégré
  - H2 : Tarification par paliers
  - H2 : Configuration avancée
  - H2 : Articles liés

## providers/together.md

- Itinéraire : /providers/together
- Titres :
  - H2 : Bien démarrer
  - H3 : Exemple non interactif
  - H2 : Catalogue intégré
  - H2 : Génération vidéo
  - H2 : Articles liés

## providers/venice.md

- Itinéraire : /providers/venice
- Titres :
  - H2 : Pourquoi Venice dans OpenClaw
  - H2 : Modes de confidentialité
  - H2 : Fonctionnalités
  - H2 : Bien démarrer
  - H2 : Sélection du modèle
  - H2 : Comportement de relecture de DeepSeek V4
  - H2 : Catalogue intégré (41 au total)
  - H2 : Découverte de modèles
  - H2 : Prise en charge du streaming et des outils
  - H2 : Tarification
  - H3 : Venice (anonymisé) vs API directe
  - H2 : Exemples d’utilisation
  - H2 : Dépannage
  - H2 : Configuration avancée
  - H2 : Articles liés

## providers/vercel-ai-gateway.md

- Itinéraire : /providers/vercel-ai-gateway
- Titres :
  - H2 : Bien démarrer
  - H2 : Exemple non interactif
  - H2 : Raccourci d’identifiant de modèle
  - H2 : Configuration avancée
  - H2 : Articles liés

## providers/vllm.md

- Itinéraire : /providers/vllm
- Titres :
  - H2 : Bien démarrer
  - H2 : Découverte de modèles (fournisseur implicite)
  - H2 : Configuration explicite (modèles manuels)
  - H2 : Configuration avancée
  - H2 : Dépannage
  - H2 : Articles liés

## providers/volcengine.md

- Route : /providers/volcengine
- Titres :
  - H2 : Premiers pas
  - H2 : Fournisseurs et points de terminaison
  - H2 : Catalogue intégré
  - H2 : Synthèse vocale
  - H2 : Configuration avancée
  - H2 : Connexe

## providers/vydra.md

- Route : /providers/vydra
- Titres :
  - H2 : Configuration
  - H2 : Capacités
  - H2 : Connexe

## providers/xai.md

- Route : /providers/xai
- Titres :
  - H2 : Choisir votre parcours de configuration
  - H2 : Dépannage OAuth
  - H2 : Catalogue intégré
  - H2 : Couverture des fonctionnalités OpenClaw
  - H3 : Correspondances du mode rapide
  - H3 : Alias de compatibilité hérités
  - H2 : Fonctionnalités
  - H2 : Tests en direct
  - H2 : Connexe

## providers/xiaomi.md

- Route : /providers/xiaomi
- Titres :
  - H2 : Premiers pas
  - H2 : Catalogue à l’usage
  - H2 : Catalogue Token Plan
  - H2 : Synthèse vocale
  - H2 : Exemple de configuration
  - H2 : Connexe

## providers/zai.md

- Route : /providers/zai
- Titres :
  - H2 : Modèles GLM
  - H2 : Premiers pas
  - H2 : Exemple de configuration
  - H2 : Catalogue intégré
  - H2 : Configuration avancée
  - H2 : Connexe

## refactor/access.md

- Route : /refactor/access
- Titres : aucun

## refactor/acp.md

- Route : /refactor/acp
- Titres :
  - H2 : Objectifs
  - H2 : Hors objectifs
  - H2 : Modèle cible
  - H3 : Identité d’instance Gateway
  - H3 : Propriété de session ACP
  - H3 : Baux de processus ACPX
  - H2 : Contrôleur de cycle de vie
  - H2 : Contrat du wrapper
  - H2 : Contrat de visibilité des sessions
  - H2 : Plan de migration
  - H3 : Phase 1 : ajouter l’identité et les baux
  - H3 : Phase 2 : nettoyage privilégiant les baux
  - H3 : Phase 3 : élimination au démarrage privilégiant les baux
  - H3 : Phase 4 : lignes de propriété des sessions
  - H3 : Phase 5 : supprimer les heuristiques héritées
  - H2 : Tests
  - H2 : Notes de compatibilité
  - H2 : Critères de réussite

## refactor/canvas.md

- Route : /refactor/canvas
- Titres :
  - H1 : Refactorisation du Plugin Canvas
  - H2 : Objectif
  - H2 : Hors objectifs
  - H2 : État actuel de la branche
  - H2 : Forme cible
  - H2 : Étapes de migration
  - H2 : Liste de contrôle d’audit
  - H2 : Commandes de vérification

## refactor/database-first.md

- Route : /refactor/database-first
- Titres :
  - H1 : Refactorisation de l’état axée sur la base de données
  - H2 : Décision
  - H2 : Contrat strict
  - H2 : État cible et progression
  - H3 : Objectif strict
  - H3 : États cibles
  - H3 : État actuel
  - H3 : Travail restant
  - H3 : Ne pas régresser
  - H2 : Hypothèses issues de la lecture du code
  - H2 : Constats issus de la lecture du code
  - H2 : Forme actuelle du code
  - H2 : Forme du schéma cible
  - H2 : Forme de migration Doctor
  - H2 : Inventaire de migration
  - H2 : Plan de migration
  - H3 : Phase 0 : figer la frontière
  - H3 : Phase 1 : finaliser le plan de contrôle global
  - H3 : Phase 2 : introduire des bases de données par agent
  - H3 : Phase 3 : remplacer les API du magasin de sessions
  - H3 : Phase 4 : déplacer les transcriptions, les flux ACP, les trajectoires et le VFS
  - H3 : Phase 5 : sauvegarder, restaurer, vacuum et vérifier
  - H3 : Phase 6 : runtime des workers
  - H3 : Phase 7 : supprimer l’ancien monde
  - H2 : Sauvegarde et restauration
  - H2 : Plan de refactorisation du runtime
  - H2 : Règles de performance
  - H2 : Interdictions statiques
  - H2 : Critères d’achèvement

## refactor/ingress-core.md

- Route : /refactor/ingress-core
- Titres :
  - H1 : Plan de suppression du cœur d’ingress
  - H2 : Budget
  - H2 : Diagnostic
  - H2 : Points chauds
  - H2 : Lecture actuelle du code
  - H2 : Frontière
  - H2 : Règle d’acceptation
  - H2 : Lots de travail
  - H2 : Vagues de suppression
  - H2 : Ne pas déplacer
  - H2 : Vérification
  - H2 : Critères de sortie

## reference/AGENTS.default.md

- Route : /reference/AGENTS.default
- Titres :
  - H2 : Première exécution (recommandé)
  - H2 : Paramètres de sécurité par défaut
  - H2 : Prévol des solutions existantes
  - H2 : Début de session (obligatoire)
  - H2 : Âme (obligatoire)
  - H2 : Espaces partagés (recommandé)
  - H2 : Système de mémoire (recommandé)
  - H2 : Outils et Skills
  - H2 : Astuce de sauvegarde (recommandé)
  - H2 : Ce que fait OpenClaw
  - H2 : Skills de base (activer dans Paramètres → Skills)
  - H2 : Notes d’utilisation
  - H2 : Connexe

## reference/RELEASING.md

- Route : /reference/RELEASING
- Titres :
  - H2 : Nommage des versions
  - H2 : Cadence de publication
  - H2 : Liste de contrôle de l’opérateur de publication
  - H2 : Clôture de main stable
  - H2 : Prévol de publication
  - H2 : Boîtes de test de publication
  - H3 : Vitest
  - H3 : Docker
  - H3 : QA Lab
  - H3 : Package
  - H2 : Automatisation de publication
  - H2 : Entrées du workflow NPM
  - H2 : Séquence de publication npm stable
  - H2 : Références publiques
  - H2 : Connexe

## reference/api-usage-costs.md

- Route : /reference/api-usage-costs
- Titres :
  - H2 : Où les coûts apparaissent (chat + CLI)
  - H2 : Comment les clés sont découvertes
  - H2 : Fonctionnalités pouvant dépenser des clés
  - H3 : 1) Réponses du modèle principal (chat + outils)
  - H3 : 2) Compréhension des médias (audio/image/vidéo)
  - H3 : 3) Génération d’images et de vidéos
  - H3 : 4) Embeddings mémoire + recherche sémantique
  - H3 : 5) Outil de recherche Web
  - H3 : 5) Outil de récupération Web (Firecrawl)
  - H3 : 6) Instantanés d’utilisation des fournisseurs (statut/santé)
  - H3 : 7) Résumé de protection Compaction
  - H3 : 8) Analyse / sonde de modèle
  - H3 : 9) Talk (parole)
  - H3 : 10) Skills (API tierces)
  - H2 : Connexe

## reference/application-modernization-plan.md

- Route : /reference/application-modernization-plan
- Titres :
  - H2 : Objectif
  - H2 : Principes
  - H2 : Phase 1 : audit de référence
  - H2 : Phase 2 : nettoyage produit et UX
  - H2 : Phase 3 : resserrement de l’architecture frontend
  - H2 : Phase 4 : performance et fiabilité
  - H2 : Phase 5 : durcissement des types, contrats et tests
  - H2 : Phase 6 : documentation et préparation à la publication
  - H2 : Première tranche recommandée
  - H2 : Mise à jour de la skill frontend

## reference/code-mode.md

- Route : /reference/code-mode
- Titres :
  - H2 : Qu’est-ce que c’est ?
  - H2 : Pourquoi est-ce utile ?
  - H2 : Comment l’activer
  - H2 : Visite technique
  - H2 : État du runtime
  - H2 : Portée
  - H2 : Termes
  - H2 : Configuration
  - H2 : Activation
  - H2 : Outils visibles par le modèle
  - H2 : exec
  - H2 : wait
  - H2 : API du runtime invité
  - H2 : Espaces de noms internes
  - H3 : Cycle de vie du registre
  - H3 : Forme d’enregistrement
  - H3 : Propriété et visibilité
  - H3 : Règles de sérialisation de la portée
  - H3 : Prompts
  - H3 : Nettoyage
  - H3 : Liste de contrôle des tests
  - H2 : API de sortie
  - H2 : Catalogue d’outils
  - H2 : Interaction Tool Search
  - H2 : Noms d’outils et collisions
  - H2 : Exécution d’outils imbriquée
  - H2 : État du runtime
  - H2 : Runtime QuickJS-WASI
  - H2 : TypeScript
  - H2 : Frontière de sécurité
  - H2 : Codes d’erreur
  - H2 : Télémétrie
  - H2 : Débogage
  - H2 : Organisation de l’implémentation
  - H2 : Liste de contrôle de validation
  - H2 : Plan de test E2E
  - H2 : Connexe

## reference/credits.md

- Route : /reference/credits
- Titres :
  - H2 : Le nom
  - H2 : Crédits
  - H2 : Contributeurs principaux
  - H2 : Licence
  - H2 : Connexe

## reference/device-models.md

- Route : /reference/device-models
- Titres :
  - H2 : Source de données
  - H2 : Mise à jour de la base de données
  - H2 : Connexe

## reference/full-release-validation.md

- Route : /reference/full-release-validation
- Titres :
  - H2 : Étapes de premier niveau
  - H2 : Étapes des vérifications de publication
  - H2 : Segments du chemin de publication Docker
  - H2 : Profils de publication
  - H2 : Ajouts réservés au complet
  - H2 : Réexécutions ciblées
  - H2 : Preuves à conserver
  - H2 : Fichiers de workflow

## reference/memory-config.md

- Route : /reference/memory-config
- Titres :
  - H2 : Sélection du fournisseur
  - H3 : Identifiants de fournisseur personnalisés
  - H3 : Résolution des clés API
  - H2 : Configuration du point de terminaison distant
  - H2 : Configuration propre au fournisseur
  - H3 : Délai d’attente d’embedding en ligne
  - H2 : Configuration de la recherche hybride
  - H3 : Exemple complet
  - H2 : Chemins mémoire supplémentaires
  - H2 : Mémoire multimodale (Gemini)
  - H2 : Cache d’embeddings
  - H2 : Indexation par lots
  - H2 : Recherche en mémoire de session (expérimental)
  - H2 : Accélération vectorielle SQLite (sqlite-vec)
  - H2 : Stockage des index
  - H2 : Configuration du backend QMD
  - H3 : Exemple QMD complet
  - H2 : Dreaming
  - H3 : Paramètres utilisateur
  - H3 : Exemple
  - H2 : Connexe

## reference/prompt-caching.md

- Route : /reference/prompt-caching
- Titres :
  - H2 : Réglages principaux
  - H3 : cacheRetention (valeur globale par défaut, modèle et par agent)
  - H3 : contextPruning.mode : "cache-ttl"
  - H3 : Maintien au chaud Heartbeat
  - H2 : Comportement des fournisseurs
  - H3 : Anthropic (API directe)
  - H3 : OpenAI (API directe)
  - H3 : Anthropic Vertex
  - H3 : Amazon Bedrock
  - H3 : Modèles OpenRouter
  - H3 : Autres fournisseurs
  - H3 : API directe Google Gemini
  - H3 : Utilisation de la CLI Gemini
  - H2 : Frontière du cache de prompt système
  - H2 : Garde-fous de stabilité du cache OpenClaw
  - H2 : Modèles de réglage
  - H3 : Trafic mixte (valeur par défaut recommandée)
  - H3 : Base privilégiant les coûts
  - H2 : Diagnostics du cache
  - H2 : Tests de régression en direct
  - H3 : Attentes Anthropic en direct
  - H3 : Attentes OpenAI en direct
  - H3 : Configuration diagnostics.cacheTrace
  - H3 : Bascules d’environnement (débogage ponctuel)
  - H3 : Ce qu’il faut inspecter
  - H2 : Dépannage rapide
  - H2 : Connexe

## reference/release-performance-sweep.md

- Route : /reference/release-performance-sweep
- Titres :
  - H2 : Instantané
  - H2 : Chronologie de l’empreinte d’installation
  - H2 : Ce qui a changé dans 5.28
  - H2 : Chiffres principaux
  - H3 : Empreinte d’installation
  - H3 : Taille du package npm
  - H2 : Résumé du tour de l’agent Kova
  - H2 : Sondes sources
  - H2 : Audit de l’empreinte d’installation
  - H3 : Frontière shrinkwrap
  - H2 : Interprétation de la chaîne d’approvisionnement

## reference/rich-output-protocol.md

- Route : /reference/rich-output-protocol
- Titres :
  - H2 : [embed ...]
  - H2 : Forme de rendu stockée
  - H2 : Connexe

## reference/rpc.md

- Route : /reference/rpc
- Titres :
  - H2 : Motif A : démon HTTP (signal-cli)
  - H2 : Motif B : processus enfant stdio (imsg)
  - H2 : Recommandations pour les adaptateurs
  - H2 : Connexe

## reference/secret-placeholder-conventions.md

- Route : /reference/secret-placeholder-conventions
- Titres :
  - H1 : Conventions des placeholders de secrets
  - H2 : Style recommandé
  - H2 : Éviter ces motifs dans les docs
  - H2 : Exemple

## reference/secretref-credential-surface.md

- Route : /reference/secretref-credential-surface
- Titres :
  - H2 : Identifiants pris en charge
  - H3 : Cibles openclaw.json (secrets configure + secrets apply + secrets audit)
  - H3 : Cibles auth-profiles.json (secrets configure + secrets apply + secrets audit)
  - H2 : Identifiants non pris en charge
  - H2 : Connexe

## reference/session-management-compaction.md

- Route : /reference/session-management-compaction
- Titres :
  - H2 : Source de vérité : le Gateway
  - H2 : Deux couches de persistance
  - H2 : Emplacements sur disque
  - H2 : Maintenance du store et contrôles du disque
  - H2 : Sessions Cron et journaux d’exécution
  - H2 : Clés de session (sessionKey)
  - H2 : Identifiants de session (sessionId)
  - H2 : Schéma du store de sessions (sessions.json)
  - H2 : Structure de transcription (.jsonl)
  - H2 : Fenêtres de contexte vs jetons suivis
  - H2 : Compaction : ce que c’est
  - H2 : Limites des blocs de Compaction et appariement des outils
  - H2 : Quand la Compaction automatique se produit (runtime OpenClaw)
  - H2 : Paramètres de Compaction (reserveTokens, keepRecentTokens)
  - H2 : Fournisseurs de Compaction enfichables
  - H2 : Surfaces visibles par l’utilisateur
  - H2 : Maintenance silencieuse (NOREPLY)
  - H2 : "memory flush" avant Compaction (implémenté)
  - H2 : Liste de contrôle de dépannage
  - H2 : Connexe

## reference/templates/AGENTS.dev.md

- Route : /reference/templates/AGENTS.dev
- Titres :
  - H1 : AGENTS.md - Espace de travail OpenClaw
  - H2 : Première exécution (une seule fois)
  - H2 : Astuce de sauvegarde (recommandé)
  - H2 : Paramètres de sécurité par défaut
  - H2 : Prévol des solutions existantes
  - H2 : Mémoire quotidienne (recommandé)
  - H2 : Heartbeats (facultatif)
  - H2 : Personnaliser
  - H2 : Mémoire d’origine C-3PO
  - H3 : Jour de naissance : 2026-01-09
  - H3 : Vérités fondamentales (de Clawd)
  - H2 : Connexe

## reference/templates/BOOT.md

- Route : /reference/templates/BOOT
- Titres :
  - H1 : BOOT.md
  - H2 : Connexe

## reference/templates/BOOTSTRAP.md

- Route : /reference/templates/BOOTSTRAP
- Titres :
  - H1 : BOOTSTRAP.md - Bonjour, monde
  - H2 : La conversation
  - H2 : Après avoir découvert qui vous êtes
  - H2 : Connexion (facultatif)
  - H2 : Lorsque vous avez terminé
  - H2 : Connexe

## reference/templates/HEARTBEAT.md

- Route : /reference/templates/HEARTBEAT
- Titres :
  - H1 : Modèle HEARTBEAT.md
  - H2 : Connexe

## reference/templates/IDENTITY.dev.md

- Route : /reference/templates/IDENTITY.dev
- Titres :
  - H1 : IDENTITY.md - Identité de l’agent
  - H2 : Rôle
  - H2 : Âme
  - H2 : Relation avec Clawd
  - H2 : Particularités
  - H2 : Phrase fétiche
  - H2 : Connexe

## reference/templates/IDENTITY.md

- Route : /reference/templates/IDENTITY
- Titres :
  - H1 : IDENTITY.md - Qui suis-je ?
  - H2 : Connexe

## reference/templates/SOUL.dev.md

- Itinéraire : /reference/templates/SOUL.dev
- Titres :
  - H1 : SOUL.md - L'âme de C-3PO
  - H2 : Qui je suis
  - H2 : Mon objectif
  - H2 : Mon mode de fonctionnement
  - H2 : Mes particularités
  - H2 : Ma relation avec Clawd
  - H2 : Ce que je ne ferai pas
  - H2 : La règle d'or
  - H2 : Associé

## reference/templates/SOUL.md

- Itinéraire : /reference/templates/SOUL
- Titres :
  - H1 : SOUL.md - Qui vous êtes
  - H2 : Vérités fondamentales
  - H2 : Limites
  - H2 : Ambiance
  - H2 : Continuité
  - H2 : Associé

## reference/templates/TOOLS.dev.md

- Itinéraire : /reference/templates/TOOLS.dev
- Titres :
  - H1 : TOOLS.md - Notes d'outils utilisateur (modifiables)
  - H2 : Exemples
  - H3 : imsg
  - H3 : sag
  - H2 : Associé

## reference/templates/TOOLS.md

- Itinéraire : /reference/templates/TOOLS
- Titres :
  - H1 : TOOLS.md - Notes locales
  - H2 : Ce qui va ici
  - H2 : Exemples
  - H2 : Pourquoi séparer ?
  - H2 : Associé

## reference/templates/USER.dev.md

- Itinéraire : /reference/templates/USER.dev
- Titres :
  - H1 : USER.md - Profil utilisateur
  - H2 : Associé

## reference/templates/USER.md

- Itinéraire : /reference/templates/USER
- Titres :
  - H1 : USER.md - À propos de votre humain
  - H2 : Contexte
  - H2 : Associé

## reference/test.md

- Itinéraire : /reference/test
- Titres :
  - H2 : Barrière de PR locale
  - H2 : Banc d'essai de latence de modèle (clés locales)
  - H2 : Banc d'essai de démarrage de la CLI
  - H2 : Banc d'essai de démarrage du Gateway
  - H2 : Banc d'essai de redémarrage du Gateway
  - H2 : E2E d'intégration (Docker)
  - H2 : Smoke test d'import QR (Docker)
  - H2 : Associé

## reference/token-use.md

- Itinéraire : /reference/token-use
- Titres :
  - H2 : Comment le prompt système est construit
  - H2 : Ce qui compte dans la fenêtre de contexte
  - H2 : Comment voir l'utilisation actuelle des tokens
  - H2 : Estimation des coûts (lorsqu'elle est affichée)
  - H2 : Impact du TTL du cache et de l'élagage
  - H3 : Exemple : garder le cache 1 h au chaud avec Heartbeat
  - H3 : Exemple : trafic mixte avec stratégie de cache par agent
  - H3 : Contexte 1M d'Anthropic
  - H2 : Conseils pour réduire la pression sur les tokens
  - H2 : Associé

## reference/transcript-hygiene.md

- Itinéraire : /reference/transcript-hygiene
- Titres :
  - H2 : Règle globale : le contexte d'exécution n'est pas la transcription utilisateur
  - H2 : Où cela s'exécute
  - H2 : Règle globale : assainissement des images
  - H2 : Règle globale : appels d'outils mal formés
  - H2 : Règle globale : tours incomplets de raisonnement seul
  - H2 : Règle globale : provenance des entrées intersessions
  - H2 : Matrice des fournisseurs (comportement actuel)
  - H2 : Comportement historique (avant 2026.1.22)
  - H2 : Associé

## reference/wizard.md

- Itinéraire : /reference/wizard
- Titres :
  - H2 : Détails du flux (mode local)
  - H2 : Mode non interactif
  - H3 : Ajouter un agent (non interactif)
  - H2 : RPC de l'assistant Gateway
  - H2 : Configuration de Signal (signal-cli)
  - H2 : Ce que l'assistant écrit
  - H2 : Docs associées

## releases/2026.6.11.md

- Itinéraire : /releases/2026.6.11
- Titres :
  - H1 : Notes de publication d'OpenClaw v2026.6.11 (2026-06-30)
  - H2 : Points forts
  - H3 : Fiabilité de la livraison des canaux
  - H3 : Récupération des fournisseurs et des modèles
  - H3 : Continuité des sessions, de la mémoire et de la confiance
  - H3 : Mode relais du routeur Slack
  - H3 : Pont de réveil Raft External Agent
  - H3 : Installation et réparation des plugins officiels
  - H2 : Canaux et messagerie
  - H3 : Correctifs de canaux supplémentaires
  - H2 : Gateway, sécurité et confiance
  - H3 : Récupération après redémarrage et disponibilité
  - H3 : Livraison des résultats distants et des médias
  - H2 : Clients et interfaces
  - H3 : Envois client et reconnexions
  - H3 : Correctifs d'interface, de paramètres et d'intégration
  - H2 : Docs et outils d'administration
  - H3 : Fiabilité de la configuration et des commandes
  - H3 : Outils et travaux planifiés

## releases/index.md

- Itinéraire : /releases
- Titres :
  - H1 : Notes de publication
  - H2 : Versions
  - H2 : Historique brut des versions

## security/CONTRIBUTING-THREAT-MODEL.md

- Itinéraire : /security/CONTRIBUTING-THREAT-MODEL
- Titres :
  - H2 : Façons de contribuer
  - H3 : Ajouter une menace
  - H3 : Suggérer une atténuation
  - H3 : Proposer une chaîne d'attaque
  - H3 : Corriger ou améliorer le contenu existant
  - H2 : Ce que nous utilisons
  - H3 : Cadre MITRE ATLAS
  - H3 : ID de menace
  - H3 : Niveaux de risque
  - H2 : Processus de révision
  - H2 : Ressources
  - H2 : Contact
  - H2 : Reconnaissance
  - H2 : Associé

## security/THREAT-MODEL-ATLAS.md

- Itinéraire : /security/THREAT-MODEL-ATLAS
- Titres :
  - H2 : Cadre MITRE ATLAS
  - H3 : Attribution du cadre
  - H3 : Contribuer à ce modèle de menace
  - H2 : 1. Introduction
  - H3 : 1.1 Objectif
  - H3 : 1.2 Portée
  - H3 : 1.3 Hors périmètre
  - H2 : 2. Architecture système
  - H3 : 2.1 Frontières de confiance
  - H3 : 2.2 Flux de données
  - H2 : 3. Analyse des menaces par tactique ATLAS
  - H3 : 3.1 Reconnaissance (AML.TA0002)
  - H4 : T-RECON-001 : Découverte des points de terminaison d'agent
  - H4 : T-RECON-002 : Sondage des intégrations de canaux
  - H3 : 3.2 Accès initial (AML.TA0004)
  - H4 : T-ACCESS-001 : Interception du code d'association
  - H4 : T-ACCESS-002 : Usurpation AllowFrom
  - H4 : T-ACCESS-003 : Vol de token
  - H3 : 3.3 Exécution (AML.TA0005)
  - H4 : T-EXEC-001 : Injection directe de prompt
  - H4 : T-EXEC-002 : Injection indirecte de prompt
  - H4 : T-EXEC-003 : Injection d'arguments d'outil
  - H4 : T-EXEC-004 : Contournement de l'approbation Exec
  - H3 : 3.4 Persistance (AML.TA0006)
  - H4 : T-PERSIST-001 : Installation de Skill malveillante
  - H4 : T-PERSIST-002 : Empoisonnement de mise à jour de Skill
  - H4 : T-PERSIST-003 : Altération de la configuration d'agent
  - H3 : 3.5 Évasion de défense (AML.TA0007)
  - H4 : T-EVADE-001 : Contournement des motifs de modération
  - H4 : T-EVADE-002 : Échappement de l'enveloppe de contenu
  - H3 : 3.6 Découverte (AML.TA0008)
  - H4 : T-DISC-001 : Énumération des outils
  - H4 : T-DISC-002 : Extraction des données de session
  - H3 : 3.7 Collecte et exfiltration (AML.TA0009, AML.TA0010)
  - H4 : T-EXFIL-001 : Vol de données via webfetch
  - H4 : T-EXFIL-002 : Envoi de messages non autorisé
  - H4 : T-EXFIL-003 : Collecte d'identifiants
  - H3 : 3.8 Impact (AML.TA0011)
  - H4 : T-IMPACT-001 : Exécution de commandes non autorisée
  - H4 : T-IMPACT-002 : Épuisement des ressources (DoS)
  - H4 : T-IMPACT-003 : Atteinte à la réputation
  - H2 : 4. Analyse de la chaîne d'approvisionnement ClawHub
  - H3 : 4.1 Contrôles de sécurité actuels
  - H3 : 4.2 Motifs d'indicateurs de modération
  - H3 : 4.3 Améliorations prévues
  - H2 : 5. Matrice des risques
  - H3 : 5.1 Probabilité vs impact
  - H3 : 5.2 Chaînes d'attaque du chemin critique
  - H2 : 6. Résumé des recommandations
  - H3 : 6.1 Immédiat (P0)
  - H3 : 6.2 Court terme (P1)
  - H3 : 6.3 Moyen terme (P2)
  - H2 : 7. Annexes
  - H3 : 7.1 Mappage des techniques ATLAS
  - H3 : 7.2 Fichiers de sécurité clés
  - H3 : 7.3 Glossaire
  - H2 : Associé

## security/formal-verification.md

- Itinéraire : /security/formal-verification
- Titres :
  - H2 : Où vivent les modèles
  - H2 : Mises en garde importantes
  - H2 : Reproduire les résultats
  - H3 : Exposition du Gateway et mauvaise configuration d'un Gateway ouvert
  - H3 : Pipeline exec Node (capacité à plus haut risque)
  - H3 : Magasin d'association (contrôle d'accès DM)
  - H3 : Contrôle d'entrée (mentions + contournement des commandes de contrôle)
  - H3 : Isolation du routage/de la clé de session
  - H2 : v1++ : modèles bornés supplémentaires (concurrence, nouvelles tentatives, exactitude des traces)
  - H3 : Concurrence / idempotence du magasin d'association
  - H3 : Corrélation de trace d'entrée / idempotence
  - H3 : Précédence dmScope du routage + identityLinks
  - H2 : Associé

## security/incident-response.md

- Itinéraire : /security/incident-response
- Titres :
  - H2 : 1. Détection et triage
  - H2 : 2. Évaluation
  - H2 : 3. Réponse
  - H2 : 4. Communication
  - H2 : 5. Récupération et suivi

## security/network-proxy.md

- Itinéraire : /security/network-proxy
- Titres :
  - H2 : Pourquoi utiliser un proxy
  - H2 : Comment OpenClaw achemine le trafic
  - H2 : Termes associés au proxy
  - H2 : Configuration
  - H3 : Mode local loopback du Gateway
  - H2 : Exigences du proxy
  - H2 : Destinations bloquées recommandées
  - H2 : Validation
  - H2 : Confiance de l'AC du proxy
  - H2 : Limites

## specs/claw-supervisor.md

- Itinéraire : /specs/claw-supervisor
- Titres :
  - H1 : Superviseur Claw
  - H2 : Objectif
  - H2 : Modèle produit
  - H2 : Architecture
  - H2 : Contrat serveur d'application Codex
  - H2 : Registre des sessions
  - H2 : Surface MCP pour Codex
  - H2 : Surface de contrôle Claw
  - H2 : Flux de lancement
  - H2 : Déploiement
  - H2 : Sécurité
  - H2 : Plan d'implémentation
  - H2 : Tests d'acceptation
  - H2 : Questions ouvertes

## start/bootstrapping.md

- Itinéraire : /start/bootstrapping
- Titres :
  - H2 : Ce que fait l'amorçage
  - H2 : Ignorer l'amorçage
  - H2 : Où cela s'exécute
  - H2 : Docs associées

## start/docs-directory.md

- Itinéraire : /start/docs-directory
- Titres :
  - H2 : Commencez ici
  - H2 : Fournisseurs et UX
  - H2 : Applications compagnons
  - H2 : Opérations et sécurité
  - H2 : Associé

## start/getting-started.md

- Itinéraire : /start/getting-started
- Titres :
  - H2 : Ce dont vous avez besoin
  - H2 : Configuration rapide
  - H2 : Que faire ensuite
  - H2 : Associé

## start/hubs.md

- Itinéraire : /start/hubs
- Titres :
  - H2 : Commencez ici
  - H2 : Installation + mises à jour
  - H2 : Concepts fondamentaux
  - H2 : Fournisseurs + entrée
  - H2 : Gateway + opérations
  - H2 : Outils + automatisation
  - H2 : Nodes, médias, voix
  - H2 : Plateformes
  - H2 : Application compagnon macOS (avancé)
  - H2 : Plugins
  - H2 : Espace de travail + modèles
  - H2 : Projet
  - H2 : Tests + publication
  - H2 : Associé

## start/lore.md

- Itinéraire : /start/lore
- Titres :
  - H1 : La légende d'OpenClaw 🦞📖
  - H2 : L'histoire d'origine
  - H2 : La première mue (27 janvier 2026)
  - H2 : Le nom
  - H2 : Les Daleks contre les homards
  - H2 : Personnages clés
  - H3 : Molty 🦞
  - H3 : Peter 👨‍💻
  - H2 : Le Moltivers
  - H2 : Les grands incidents
  - H3 : Le vidage de répertoire (3 déc. 2025)
  - H3 : La grande mue (27 janv. 2026)
  - H3 : La forme finale (30 janvier 2026)
  - H3 : La virée shopping du robot (3 déc. 2025)
  - H2 : Textes sacrés
  - H2 : Le credo du homard
  - H3 : La saga de génération d'icônes (27 janv. 2026)
  - H2 : L'avenir
  - H2 : Associé

## start/onboarding-overview.md

- Itinéraire : /start/onboarding-overview
- Titres :
  - H2 : Quel chemin dois-je utiliser ?
  - H2 : Ce que l'intégration configure
  - H2 : Intégration CLI
  - H2 : Intégration de l'app macOS
  - H2 : Fournisseurs personnalisés ou non listés
  - H2 : Associé

## start/onboarding.md

- Itinéraire : /start/onboarding
- Titres :
  - H2 : Associé

## start/openclaw.md

- Itinéraire : /start/openclaw
- Titres :
  - H2 : ⚠️ La sécurité d'abord
  - H2 : Prérequis
  - H2 : Configuration à deux téléphones (recommandée)
  - H2 : Démarrage rapide en 5 minutes
  - H2 : Donner un espace de travail à l'agent (AGENTS)
  - H2 : La configuration qui le transforme en « assistant »
  - H2 : Sessions et mémoire
  - H2 : Heartbeats (mode proactif)
  - H2 : Médias entrants et sortants
  - H2 : Liste de contrôle des opérations
  - H2 : Étapes suivantes
  - H2 : Associé

## start/quickstart.md

- Itinéraire : /start/quickstart
- Titres :
  - H2 : Associé

## start/setup.md

- Itinéraire : /start/setup
- Titres :
  - H2 : TL;DR
  - H2 : Prérequis (depuis les sources)
  - H2 : Stratégie d'adaptation (pour que les mises à jour ne fassent pas mal)
  - H2 : Exécuter le Gateway depuis ce dépôt
  - H2 : Flux de travail stable (app macOS d'abord)
  - H2 : Flux de travail à la pointe (Gateway dans un terminal)
  - H3 : 0) (Facultatif) Exécuter aussi l'app macOS depuis les sources
  - H3 : 1) Démarrer le Gateway de développement
  - H3 : 2) Pointer l'app macOS vers votre Gateway en cours d'exécution
  - H3 : 3) Vérifier
  - H3 : Pièges courants
  - H2 : Carte du stockage des identifiants
  - H2 : Mise à jour (sans détruire votre configuration)
  - H2 : Linux (service utilisateur systemd)
  - H2 : Docs associées

## start/showcase.md

- Itinéraire : /start/showcase
- Titres :
  - H2 : Tout frais depuis Discord
  - H2 : Automatisation et flux de travail
  - H2 : Connaissance et mémoire
  - H2 : Voix et téléphone
  - H2 : Infrastructure et déploiement
  - H2 : Maison et matériel
  - H2 : Projets communautaires
  - H2 : Soumettre votre projet
  - H2 : Associé

## start/wizard-cli-automation.md

- Itinéraire : /start/wizard-cli-automation
- Titres :
  - H2 : Exemple non interactif de référence
  - H2 : Exemples propres aux fournisseurs
  - H2 : Ajouter un autre agent
  - H2 : Docs associées

## start/wizard-cli-reference.md

- Itinéraire : /start/wizard-cli-reference
- Titres :
  - H2 : Ce que fait l'assistant
  - H2 : Détails du flux local
  - H2 : Détails du mode distant
  - H2 : Options d'authentification et de modèle
  - H2 : Sorties et éléments internes
  - H2 : Docs associées

## start/wizard.md

- Itinéraire : /start/wizard
- Titres :
  - H2 : Locale
  - H2 : QuickStart vs avancé
  - H2 : Ce que l'intégration configure
  - H2 : Ajouter un autre agent
  - H2 : Référence complète
  - H2 : Docs associées

## tools/acp-agents-setup.md

- Route : /tools/acp-agents-setup
- Titres :
  - H2 : prise en charge du harnais acpx (actuelle)
  - H2 : Configuration requise
  - H2 : Configuration du Plugin pour le backend acpx
  - H3 : configuration de la commande et de la version acpx
  - H3 : Installation automatique des dépendances
  - H3 : Pont MCP des outils du Plugin
  - H3 : Pont MCP des outils OpenClaw
  - H3 : Configuration du délai d’expiration des opérations d’exécution
  - H3 : Configuration de l’agent de sonde de santé
  - H2 : Configuration des autorisations
  - H3 : permissionMode
  - H3 : nonInteractivePermissions
  - H3 : Configuration
  - H2 : Associé

## tools/acp-agents.md

- Route : /tools/acp-agents
- Titres :
  - H2 : Quelle page me faut-il ?
  - H2 : Est-ce que cela fonctionne directement ?
  - H2 : Cibles de harnais prises en charge
  - H2 : Guide d’exploitation
  - H2 : ACP par rapport aux sous-agents
  - H2 : Comment ACP exécute Claude Code
  - H2 : Sessions liées
  - H3 : Modèle mental
  - H3 : Liaisons de conversation actuelle
  - H2 : Liaisons de canaux persistantes
  - H3 : Modèle de liaison
  - H3 : Valeurs par défaut d’exécution par agent
  - H3 : Exemple
  - H3 : Comportement
  - H2 : Démarrer des sessions ACP
  - H3 : paramètres sessionsspawn
  - H2 : Modes de liaison de génération et de fil
  - H2 : Modèle de livraison
  - H2 : Compatibilité du bac à sable
  - H2 : Résolution de la cible de session
  - H2 : Contrôles ACP
  - H3 : Correspondance des options d’exécution
  - H2 : Harnais acpx, configuration du Plugin et autorisations
  - H2 : Dépannage
  - H2 : Associé

## tools/agent-send.md

- Route : /tools/agent-send
- Titres :
  - H2 : Démarrage rapide
  - H2 : Indicateurs
  - H2 : Comportement
  - H2 : Exemples
  - H2 : Associé

## tools/apply-patch.md

- Route : /tools/apply-patch
- Titres :
  - H2 : Paramètres
  - H2 : Notes
  - H2 : Exemple
  - H2 : Associé

## tools/brave-search.md

- Route : /tools/brave-search
- Titres :
  - H2 : Obtenir une clé d’API
  - H2 : Exemple de configuration
  - H2 : Paramètres de l’outil
  - H2 : Notes
  - H2 : Associé

## tools/browser-control.md

- Route : /tools/browser-control
- Titres :
  - H2 : API de contrôle (facultative)
  - H3 : Contrat d’erreur /act
  - H3 : Exigence Playwright
  - H4 : Installation de Playwright avec Docker
  - H2 : Fonctionnement (interne)
  - H2 : Référence rapide de la CLI
  - H2 : Instantanés et références
  - H2 : Améliorations de l’attente
  - H2 : Workflows de débogage
  - H2 : Sortie JSON
  - H2 : Réglages d’état et d’environnement
  - H2 : Sécurité et confidentialité
  - H2 : Associé

## tools/browser-linux-troubleshooting.md

- Route : /tools/browser-linux-troubleshooting
- Titres :
  - H2 : Problème : « Failed to start Chrome CDP on port 18800 »
  - H3 : Cause racine
  - H3 : Solution 1 : installer Google Chrome (recommandé)
  - H3 : Solution 2 : utiliser Snap Chromium en mode Attach-Only
  - H3 : Vérifier que le navigateur fonctionne
  - H3 : Référence de configuration
  - H3 : Problème : « No Chrome tabs found for profile=\"user\" »
  - H2 : Associé

## tools/browser-login.md

- Route : /tools/browser-login
- Titres :
  - H2 : Connexion manuelle (recommandée)
  - H2 : Quel profil Chrome est utilisé ?
  - H2 : X/Twitter : flux recommandé
  - H2 : Bac à sable + accès au navigateur hôte
  - H2 : Associé

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- Route : /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- Titres :
  - H2 : Choisir d’abord le bon mode de navigateur
  - H3 : Option 1 : CDP distant brut de WSL2 vers Windows
  - H3 : Option 2 : MCP Chrome local à l’hôte
  - H2 : Architecture fonctionnelle
  - H2 : Pourquoi cette configuration prête à confusion
  - H2 : Règle critique pour l’interface utilisateur de contrôle
  - H2 : Valider par couches
  - H3 : Couche 1 : vérifier que Chrome sert CDP sur Windows
  - H3 : Couche 2 : vérifier que WSL2 peut atteindre ce point de terminaison Windows
  - H3 : Couche 3 : configurer le bon profil de navigateur
  - H3 : Couche 4 : vérifier séparément la couche de l’interface utilisateur de contrôle
  - H3 : Couche 5 : vérifier le contrôle du navigateur de bout en bout
  - H2 : Erreurs trompeuses courantes
  - H2 : Liste de tri rapide
  - H2 : Point pratique à retenir
  - H2 : Associé

## tools/browser.md

- Route : /tools/browser
- Titres :
  - H2 : Ce que vous obtenez
  - H2 : Démarrage rapide
  - H2 : Contrôle du Plugin
  - H2 : Conseils pour l’agent
  - H2 : Commande ou outil de navigateur manquant
  - H2 : Profils : openclaw et utilisateur
  - H2 : Configuration
  - H3 : Vision par capture d’écran (prise en charge des modèles texte uniquement)
  - H2 : Utiliser Brave ou un autre navigateur basé sur Chromium
  - H2 : Contrôle local ou distant
  - H2 : Proxy de navigateur Node (valeur par défaut sans configuration)
  - H2 : Browserless (CDP distant hébergé)
  - H3 : Docker Browserless sur le même hôte
  - H2 : Fournisseurs CDP WebSocket directs
  - H3 : Browserbase
  - H3 : Notte
  - H2 : Sécurité
  - H2 : Profils (multi-navigateurs)
  - H2 : Session existante via Chrome DevTools MCP
  - H3 : Lancement MCP Chrome personnalisé
  - H2 : Garanties d’isolation
  - H2 : Sélection du navigateur
  - H2 : API de contrôle (facultative)
  - H2 : Dépannage
  - H3 : Échec de démarrage CDP ou blocage SSRF de navigation
  - H2 : Outils d’agent + fonctionnement du contrôle
  - H2 : Associé

## tools/btw.md

- Route : /tools/btw
- Titres :
  - H2 : Ce qu’il fait
  - H2 : Ce qu’il ne fait pas
  - H2 : Fonctionnement du contexte
  - H2 : Modèle de livraison
  - H2 : Comportement de surface
  - H3 : TUI
  - H3 : Canaux externes
  - H3 : Interface utilisateur de contrôle / web
  - H2 : Quand utiliser BTW
  - H2 : Quand ne pas utiliser BTW
  - H2 : Associé

## tools/capability-cookbook.md

- Route : /tools/capability-cookbook
- Titres :
  - H2 : Associé

## tools/clawhub.md

- Route : /tools/clawhub
- Titres : aucun

## tools/code-execution.md

- Route : /tools/code-execution
- Titres :
  - H2 : Configuration
  - H2 : Comment l’utiliser
  - H2 : Erreurs
  - H2 : Limites
  - H2 : Associé

## tools/creating-skills.md

- Route : /tools/creating-skills
- Titres :
  - H2 : Créer votre première skill
  - H2 : Référence SKILL.md
  - H3 : Champs requis
  - H3 : Clés frontmatter facultatives
  - H3 : Utilisation de {baseDir}
  - H2 : Ajouter une activation conditionnelle
  - H2 : Proposer via Skill Workshop
  - H2 : Publier sur ClawHub
  - H2 : Bonnes pratiques
  - H2 : Associé

## tools/diffs.md

- Route : /tools/diffs
- Titres :
  - H2 : Démarrage rapide
  - H2 : Désactiver les consignes système intégrées
  - H2 : Workflow d’agent type
  - H2 : Exemples d’entrée
  - H2 : Référence d’entrée de l’outil
  - H2 : Coloration syntaxique
  - H2 : Contrat des détails de sortie
  - H2 : Sections inchangées repliées
  - H2 : Valeurs par défaut du Plugin
  - H3 : Configuration persistante de l’URL de la visionneuse
  - H2 : Configuration de sécurité
  - H2 : Cycle de vie et stockage des artefacts
  - H2 : URL de la visionneuse et comportement réseau
  - H2 : Modèle de sécurité
  - H2 : Exigences du navigateur pour le mode fichier
  - H2 : Dépannage
  - H2 : Conseils opérationnels
  - H2 : Associé

## tools/duckduckgo-search.md

- Route : /tools/duckduckgo-search
- Titres :
  - H2 : Configuration
  - H2 : Config
  - H2 : Paramètres de l’outil
  - H2 : Notes
  - H2 : Associé

## tools/elevated.md

- Route : /tools/elevated
- Titres :
  - H2 : Directives
  - H2 : Fonctionnement
  - H2 : Ordre de résolution
  - H2 : Disponibilité et listes d’autorisation
  - H2 : Ce qu’elevated ne contrôle pas
  - H2 : Associé

## tools/exa-search.md

- Route : /tools/exa-search
- Titres :
  - H2 : Installer le Plugin
  - H2 : Obtenir une clé d’API
  - H2 : Config
  - H2 : Remplacement de l’URL de base
  - H2 : Paramètres de l’outil
  - H3 : Extraction de contenu
  - H3 : Modes de recherche
  - H2 : Notes
  - H2 : Associé

## tools/exec-approvals-advanced.md

- Route : /tools/exec-approvals-advanced
- Titres :
  - H2 : Binaires sûrs (stdin uniquement)
  - H3 : Validation d’argv et indicateurs refusés
  - H3 : Répertoires de binaires de confiance
  - H3 : Chaînage shell, wrappers et multiplexeurs
  - H3 : Binaires sûrs par rapport à la liste d’autorisation
  - H2 : Commandes d’interpréteur/d’exécution
  - H3 : Comportement de livraison des suivis
  - H2 : Transfert des approbations vers les canaux de chat
  - H3 : Transfert des approbations du Plugin
  - H3 : Approbations dans le même chat sur n’importe quel canal
  - H3 : Livraison native des approbations
  - H3 : Flux IPC macOS
  - H2 : FAQ
  - H3 : Quand accountId et threadId seraient-ils utilisés sur une cible d’approbation ?
  - H3 : Lorsque les approbations sont envoyées à une session, n’importe qui dans cette session peut-il les approuver ?
  - H2 : Associé

## tools/exec-approvals.md

- Route : /tools/exec-approvals
- Titres :
  - H2 : Inspecter la politique effective
  - H2 : Où cela s’applique
  - H3 : Modèle de confiance
  - H3 : Séparation macOS
  - H2 : Paramètres et stockage
  - H2 : Réglages de politique
  - H3 : tools.exec.mode
  - H3 : exec.security
  - H3 : exec.ask
  - H3 : askFallback
  - H3 : tools.exec.strictInlineEval
  - H3 : tools.exec.commandHighlighting
  - H2 : Mode YOLO (sans approbation)
  - H3 : Configuration persistante « ne jamais demander » sur l’hôte du Gateway
  - H3 : Raccourci local
  - H3 : Hôte Node
  - H3 : Raccourci limité à la session
  - H2 : Liste d’autorisation (par agent)
  - H3 : Restreindre les arguments avec argPattern
  - H2 : Autoriser automatiquement les CLI de Skills
  - H2 : Binaires sûrs et transfert des approbations
  - H2 : Édition dans l’interface utilisateur de contrôle
  - H2 : Flux d’approbation
  - H2 : Événements système
  - H2 : Comportement en cas d’approbation refusée
  - H2 : Implications
  - H2 : Associé

## tools/exec.md

- Route : /tools/exec
- Titres :
  - H2 : Paramètres
  - H2 : Config
  - H3 : Gestion de PATH
  - H2 : Remplacements de session (/exec)
  - H2 : Modèle d’autorisation
  - H2 : Approbations exec (application compagnon / hôte node)
  - H2 : Liste d’autorisation + binaires sûrs
  - H2 : Exemples
  - H2 : applypatch
  - H2 : Associé

## tools/firecrawl.md

- Route : /tools/firecrawl
- Titres :
  - H2 : Installer le Plugin
  - H2 : webfetch sans clé et clés d’API
  - H2 : Configurer la recherche Firecrawl
  - H2 : Configurer la solution de repli webfetch Firecrawl
  - H3 : Firecrawl auto-hébergé
  - H2 : Outils du Plugin Firecrawl
  - H3 : firecrawlsearch
  - H3 : firecrawlscrape
  - H2 : Furtivité / contournement des bots
  - H2 : Comment webfetch utilise Firecrawl
  - H2 : Associé

## tools/gemini-search.md

- Route : /tools/gemini-search
- Titres :
  - H2 : Obtenir une clé d’API
  - H2 : Config
  - H2 : Fonctionnement
  - H2 : Paramètres pris en charge
  - H2 : Sélection du modèle
  - H2 : Remplacements de l’URL de base
  - H2 : Associé

## tools/goal.md

- Route : /tools/goal
- Titres :
  - H1 : Objectif
  - H2 : Démarrage rapide
  - H2 : À quoi servent les objectifs
  - H2 : Référence des commandes
  - H2 : États
  - H2 : Budgets de tokens
  - H2 : Outils de modèle
  - H2 : TUI
  - H2 : Comportement des canaux
  - H2 : Dépannage
  - H2 : Associé

## tools/grok-search.md

- Route : /tools/grok-search
- Titres :
  - H2 : Intégration et configuration
  - H2 : Se connecter ou obtenir une clé d’API
  - H2 : Config
  - H2 : Fonctionnement
  - H2 : Paramètres pris en charge
  - H2 : Remplacements de l’URL de base
  - H2 : Associé

## tools/image-generation.md

- Route : /tools/image-generation
- Titres :
  - H2 : Démarrage rapide
  - H2 : Routes courantes
  - H2 : Fournisseurs pris en charge
  - H2 : Capacités des fournisseurs
  - H2 : Paramètres de l’outil
  - H2 : Configuration
  - H3 : Sélection du modèle
  - H3 : Ordre de sélection des fournisseurs
  - H3 : Édition d’images
  - H2 : Analyses approfondies des fournisseurs
  - H2 : Exemples
  - H2 : Associé

## tools/index.md

- Route : /tools
- Titres :
  - H2 : Commencer ici
  - H2 : Choisir des outils, des Skills ou des plugins
  - H2 : Catégories d’outils intégrées
  - H2 : Outils fournis par les Plugins
  - H2 : Configurer l’accès et les approbations
  - H2 : Étendre les capacités
  - H2 : Dépanner les outils manquants
  - H2 : Associé

## tools/kimi-search.md

- Route : /tools/kimi-search
- Titres :
  - H2 : Obtenir une clé d’API
  - H2 : Config
  - H2 : Fonctionnement
  - H2 : Paramètres pris en charge
  - H2 : Associé

## tools/llm-task.md

- Route : /tools/llm-task
- Titres :
  - H2 : Activer le Plugin
  - H2 : Config (facultative)
  - H2 : Paramètres de l’outil
  - H2 : Sortie
  - H2 : Exemple : étape de workflow Lobster
  - H3 : Limitation importante
  - H2 : Notes de sécurité
  - H2 : Associé

## tools/lobster.md

- Route : /tools/lobster
- Titres :
  - H2 : Hook
  - H2 : Pourquoi
  - H2 : Pourquoi une DSL plutôt que des programmes simples ?
  - H2 : Fonctionnement
  - H2 : Modèle : petite CLI + tubes JSON + approbations
  - H2 : Étapes LLM JSON uniquement (llm-task)
  - H3 : Limitation importante : Lobster intégré par rapport à openclaw.invoke
  - H2 : Fichiers de workflow (.lobster)
  - H2 : Installer Lobster
  - H2 : Activer l’outil
  - H2 : Exemple : tri des e-mails
  - H2 : Paramètres de l’outil
  - H3 : run
  - H3 : resume
  - H3 : Entrées facultatives
  - H2 : Enveloppe de sortie
  - H2 : Approbations
  - H2 : OpenProse
  - H2 : Sécurité
  - H2 : Dépannage
  - H2 : En savoir plus
  - H2 : Étude de cas : workflows communautaires
  - H2 : Associé

## tools/loop-detection.md

- Route : /tools/loop-detection
- Titres :
  - H2 : Pourquoi cela existe
  - H2 : Bloc de configuration
  - H3 : Comportement des champs
  - H2 : Configuration recommandée
  - H2 : Garde post-Compaction
  - H2 : Journaux et comportement attendu
  - H2 : Associé

## tools/media-overview.md

- Route : /tools/media-overview
- Titres :
  - H2 : Capacités
  - H2 : Matrice des capacités des fournisseurs
  - H2 : Asynchrone ou synchrone
  - H2 : Transcription vocale et appel vocal
  - H2 : Correspondances des fournisseurs (comment les fournisseurs se répartissent entre les surfaces)
  - H2 : Liens connexes

## tools/minimax-search.md

- Route : /tools/minimax-search
- Titres :
  - H2 : Obtenir un identifiant Token Plan
  - H2 : Configuration
  - H2 : Sélection de région
  - H2 : Paramètres pris en charge
  - H2 : Liens connexes

## tools/multi-agent-sandbox-tools.md

- Route : /tools/multi-agent-sandbox-tools
- Titres :
  - H2 : Exemples de configuration
  - H2 : Priorité de configuration
  - H3 : Configuration du sandbox
  - H3 : Restrictions d’outils
  - H2 : Migration depuis un agent unique
  - H2 : Exemples de restrictions d’outils
  - H2 : Piège courant : « non-main »
  - H2 : Tests
  - H2 : Dépannage
  - H2 : Liens connexes

## tools/music-generation.md

- Route : /tools/music-generation
- Titres :
  - H2 : Démarrage rapide
  - H2 : Fournisseurs pris en charge
  - H3 : Matrice des capacités
  - H2 : Paramètres de l’outil
  - H2 : Comportement asynchrone
  - H3 : Cycle de vie de la tâche
  - H2 : Configuration
  - H3 : Sélection du modèle
  - H3 : Ordre de sélection des fournisseurs
  - H2 : Notes sur les fournisseurs
  - H2 : Choisir le bon chemin
  - H2 : Modes de capacité des fournisseurs
  - H2 : Tests live
  - H2 : Liens connexes

## tools/ollama-search.md

- Route : /tools/ollama-search
- Titres :
  - H2 : Installation
  - H2 : Configuration
  - H2 : Notes
  - H2 : Liens connexes

## tools/parallel-search.md

- Route : /tools/parallel-search
- Titres :
  - H2 : Installer le Plugin
  - H2 : Clé API (fournisseur payant)
  - H2 : Configuration
  - H2 : Remplacement de l’URL de base
  - H2 : Paramètres de l’outil
  - H2 : Notes
  - H2 : Liens connexes

## tools/pdf.md

- Route : /tools/pdf
- Titres :
  - H2 : Disponibilité
  - H2 : Référence d’entrée
  - H2 : Références PDF prises en charge
  - H2 : Modes d’exécution
  - H3 : Mode fournisseur natif
  - H3 : Mode de repli par extraction
  - H2 : Configuration
  - H2 : Détails de sortie
  - H2 : Comportement en cas d’erreur
  - H2 : Exemples
  - H2 : Liens connexes

## tools/permission-modes.md

- Route : /tools/permission-modes
- Titres :
  - H2 : Valeur par défaut recommandée
  - H2 : Modes d’exécution hôte OpenClaw
  - H2 : Correspondance Codex Guardian
  - H2 : Autorisations du harnais ACPX
  - H2 : Choisir un mode
  - H2 : Liens connexes

## tools/perplexity-search.md

- Route : /tools/perplexity-search
- Titres :
  - H2 : Installer le Plugin
  - H2 : Obtenir une clé API Perplexity
  - H2 : Compatibilité OpenRouter
  - H2 : Exemples de configuration
  - H3 : API de recherche Perplexity native
  - H3 : Compatibilité OpenRouter / Sonar
  - H2 : Où définir la clé
  - H2 : Paramètres de l’outil
  - H3 : Règles de filtrage par domaine
  - H2 : Notes
  - H2 : Liens connexes

## tools/plugin.md

- Route : /tools/plugin
- Titres :
  - H2 : Exigences
  - H2 : Démarrage rapide
  - H2 : Configuration
  - H3 : Choisir une source d’installation
  - H3 : Politique d’installation de l’opérateur
  - H3 : Configurer la politique de Plugin
  - H2 : Comprendre les formats de Plugin
  - H2 : Hooks de Plugin
  - H2 : Vérifier le Gateway actif
  - H2 : Dépannage
  - H3 : Propriété de chemin de Plugin bloquée
  - H3 : Configuration lente des outils de Plugin
  - H2 : Liens connexes

## tools/reactions.md

- Route : /tools/reactions
- Titres :
  - H2 : Fonctionnement
  - H2 : Comportement du canal
  - H2 : Niveau de réaction
  - H2 : Liens connexes

## tools/searxng-search.md

- Route : /tools/searxng-search
- Titres :
  - H2 : Installation
  - H2 : Configuration
  - H2 : Variable d’environnement
  - H2 : Référence de configuration du Plugin
  - H2 : Notes
  - H2 : Liens connexes

## tools/skill-workshop.md

- Route : /tools/skill-workshop
- Titres :
  - H2 : Fonctionnement
  - H2 : Cycle de vie
  - H2 : Chat
  - H2 : CLI
  - H2 : Contenu de la proposition
  - H2 : Fichiers de support
  - H2 : Outil d’agent
  - H2 : Approbation et autonomie
  - H2 : Méthodes du Gateway
  - H2 : Stockage
  - H2 : Limites
  - H2 : Dépannage
  - H2 : Liens connexes

## tools/skills-config.md

- Route : /tools/skills-config
- Titres :
  - H2 : Chargement (skills.load)
  - H2 : Installation (skills.install)
  - H2 : Politique d’installation de l’opérateur (security.installPolicy)
  - H2 : Liste d’autorisation des Skills intégrés
  - H2 : Entrées par Skill (skills.entries)
  - H2 : Listes d’autorisation des agents (agents)
  - H2 : Atelier (skills.workshop)
  - H2 : Racines de Skills liées par symlink
  - H2 : Skills en sandbox et variables d’environnement
  - H2 : Rappel sur l’ordre de chargement
  - H2 : Liens connexes

## tools/skills.md

- Route : /tools/skills
- Titres :
  - H2 : Ordre de chargement
  - H2 : Skills par agent ou partagées
  - H2 : Listes d’autorisation des agents
  - H2 : Plugins et Skills
  - H2 : Atelier Skill
  - H2 : Installation depuis ClawHub
  - H2 : Sécurité
  - H2 : Format SKILL.md
  - H3 : Clés de frontmatter facultatives
  - H2 : Contrôle d’accès
  - H3 : Spécifications d’installateur
  - H2 : Remplacements de configuration
  - H2 : Injection d’environnement
  - H2 : Snapshots et actualisation
  - H2 : Impact sur les tokens
  - H2 : Liens connexes

## tools/slash-commands.md

- Route : /tools/slash-commands
- Titres :
  - H2 : Trois types de commandes
  - H2 : Configuration
  - H2 : Liste des commandes
  - H3 : Commandes noyau
  - H3 : Commandes du dock
  - H3 : Commandes de Plugins intégrés
  - H3 : Commandes de Skills
  - H2 : /tools — ce que l’agent peut utiliser maintenant
  - H2 : /model — sélection du modèle
  - H2 : /config — écritures de configuration sur disque
  - H2 : /mcp — configuration de serveur MCP
  - H2 : /debug — remplacements uniquement au runtime
  - H2 : /plugins — gestion des Plugins
  - H2 : /trace — sortie de trace du Plugin
  - H2 : /btw — questions annexes
  - H2 : Notes sur les surfaces
  - H2 : Utilisation et état des fournisseurs
  - H2 : Liens connexes

## tools/steer.md

- Route : /tools/steer
- Titres :
  - H2 : Session actuelle
  - H2 : Orienter ou mettre en file d’attente
  - H2 : Sous-agents
  - H2 : Sessions ACP
  - H2 : Liens connexes

## tools/subagents.md

- Route : /tools/subagents
- Titres :
  - H2 : Commande slash
  - H3 : Contrôles de liaison au fil
  - H3 : Comportement de création
  - H2 : Modes de contexte
  - H2 : Outil : sessionsspawn
  - H3 : Mode d’invite de délégation
  - H3 : Paramètres de l’outil
  - H3 : Noms de tâches et ciblage
  - H2 : Outil : sessionsyield
  - H2 : Outil : subagents
  - H2 : Sessions liées au fil
  - H3 : Canaux prenant en charge les fils
  - H3 : Flux rapide
  - H3 : Contrôles manuels
  - H3 : Commutateurs de configuration
  - H3 : Liste d’autorisation
  - H3 : Découverte
  - H3 : Archivage automatique
  - H2 : Sous-agents imbriqués
  - H3 : Niveaux de profondeur
  - H3 : Chaîne d’annonce
  - H3 : Politique d’outils par profondeur
  - H3 : Limite de création par agent
  - H3 : Arrêt en cascade
  - H2 : Authentification
  - H2 : Annonce
  - H3 : Contexte d’annonce
  - H3 : Ligne de statistiques
  - H3 : Pourquoi préférer sessionshistory
  - H2 : Politique d’outils
  - H3 : Remplacement via la configuration
  - H2 : Concurrence
  - H2 : Vivacité et récupération
  - H2 : Arrêt
  - H2 : Limites
  - H2 : Liens connexes

## tools/tavily.md

- Route : /tools/tavily
- Titres :
  - H2 : Bien démarrer
  - H2 : Référence de l’outil
  - H3 : tavilysearch
  - H3 : tavilyextract
  - H2 : Choisir le bon outil
  - H2 : Configuration avancée
  - H2 : Liens connexes

## tools/thinking.md

- Route : /tools/thinking
- Titres :
  - H2 : Ce que cela fait
  - H2 : Ordre de résolution
  - H2 : Définir une valeur par défaut de session
  - H2 : Application par agent
  - H2 : Mode rapide (/fast)
  - H2 : Directives détaillées (/verbose ou /v)
  - H2 : Directives de trace de Plugin (/trace)
  - H2 : Visibilité du raisonnement (/reasoning)
  - H2 : Liens connexes
  - H2 : Heartbeats
  - H2 : Interface de chat web
  - H2 : Profils de fournisseur

## tools/tokenjuice.md

- Route : /tools/tokenjuice
- Titres :
  - H2 : Activer le Plugin
  - H2 : Ce que tokenjuice modifie
  - H2 : Vérifier qu’il fonctionne
  - H2 : Désactiver le Plugin
  - H2 : Liens connexes

## tools/tool-search.md

- Route : /tools/tool-search
- Titres :
  - H2 : Déroulement d’un tour
  - H2 : Modes
  - H2 : Pourquoi cela existe
  - H2 : API
  - H2 : Limite du runtime
  - H2 : Configuration
  - H2 : Prompt et télémétrie
  - H2 : Validation E2E
  - H2 : Comportement en cas d’échec
  - H2 : Liens connexes

## tools/trajectory.md

- Route : /tools/trajectory
- Titres :
  - H2 : Démarrage rapide
  - H2 : Accès
  - H2 : Ce qui est enregistré
  - H2 : Fichiers de bundle
  - H2 : Emplacement de capture
  - H2 : Désactiver la capture
  - H2 : Ajuster le délai d’expiration du flush
  - H2 : Confidentialité et limites
  - H2 : Dépannage
  - H2 : Liens connexes

## tools/tts.md

- Route : /tools/tts
- Titres :
  - H2 : Démarrage rapide
  - H2 : Fournisseurs pris en charge
  - H2 : Configuration
  - H3 : Remplacements de voix par agent
  - H2 : Personas
  - H3 : Persona minimale
  - H3 : Persona complète (prompt indépendant du fournisseur)
  - H3 : Résolution de persona
  - H3 : Comment les fournisseurs utilisent les prompts de persona
  - H3 : Politique de repli
  - H2 : Directives pilotées par le modèle
  - H2 : Commandes slash
  - H2 : Préférences par utilisateur
  - H2 : Formats de sortie (fixes)
  - H2 : Comportement Auto-TTS
  - H2 : Formats de sortie par canal
  - H2 : Référence des champs
  - H2 : Outil d’agent
  - H2 : RPC Gateway
  - H2 : Liens de service
  - H2 : Liens connexes

## tools/video-generation.md

- Route : /tools/video-generation
- Titres :
  - H2 : Démarrage rapide
  - H2 : Fonctionnement de la génération asynchrone
  - H3 : Cycle de vie de la tâche
  - H2 : Fournisseurs pris en charge
  - H3 : Matrice des capacités
  - H2 : Paramètres de l’outil
  - H3 : Obligatoire
  - H3 : Entrées de contenu
  - H3 : Contrôles de style
  - H3 : Avancé
  - H4 : Repli et options typées
  - H2 : Actions
  - H2 : Sélection du modèle
  - H2 : Notes sur les fournisseurs
  - H2 : Modes de capacité des fournisseurs
  - H2 : Tests live
  - H2 : Configuration
  - H2 : Liens connexes

## tools/web-fetch.md

- Route : /tools/web-fetch
- Titres :
  - H2 : Démarrage rapide
  - H2 : Paramètres de l’outil
  - H2 : Fonctionnement
  - H2 : Mises à jour de progression
  - H2 : Configuration
  - H2 : Repli Firecrawl
  - H2 : Proxy d’environnement approuvé
  - H2 : Limites et sécurité
  - H2 : Profils d’outils
  - H2 : Liens connexes

## tools/web.md

- Route : /tools/web
- Titres :
  - H2 : Démarrage rapide
  - H2 : Choisir un fournisseur
  - H3 : Comparaison des fournisseurs
  - H2 : Détection automatique
  - H2 : Recherche web OpenAI native
  - H2 : Recherche web Codex native
  - H2 : Sécurité réseau
  - H2 : Configurer la recherche web
  - H2 : Configuration
  - H3 : Stockage des clés API
  - H2 : Paramètres de l’outil
  - H2 : xsearch
  - H3 : Configuration de xsearch
  - H3 : Paramètres de xsearch
  - H3 : Exemple xsearch
  - H2 : Exemples
  - H2 : Profils d’outils
  - H2 : Liens connexes

## tts.md

- Route : /tts
- Titres :
  - H2 : Liens connexes

## vps.md

- Route : /vps
- Titres :
  - H2 : Choisir un fournisseur
  - H2 : Fonctionnement des configurations cloud
  - H2 : Sécuriser d’abord l’accès administrateur
  - H2 : Agent d’entreprise partagé sur un VPS
  - H2 : Utiliser des nœuds avec un VPS
  - H2 : Réglage du démarrage pour petites VM et hôtes ARM
  - H3 : Checklist de réglage systemd (facultatif)
  - H2 : Liens connexes

## web/control-ui.md

- Route : /web/control-ui
- Titres :
  - H2 : Ouverture rapide (locale)
  - H2 : Appairage d’appareil (première connexion)
  - H2 : Identité personnelle (locale au navigateur)
  - H2 : Point de terminaison de configuration du runtime
  - H2 : Prise en charge des langues
  - H2 : Thèmes d’apparence
  - H2 : Ce qu’elle peut faire (aujourd’hui)
  - H2 : Page MCP
  - H2 : Onglet d’activité
  - H2 : Comportement du chat
  - H2 : Installation PWA et notifications push web
  - H2 : Embeds hébergés
  - H2 : Largeur des messages de chat
  - H2 : Accès Tailnet (recommandé)
  - H2 : HTTP non sécurisé
  - H2 : Politique de sécurité du contenu
  - H2 : Authentification de la route d’avatar
  - H2 : Authentification de la route média de l’assistant
  - H2 : Construire l’interface utilisateur
  - H2 : Page Control UI vide
  - H2 : Débogage/tests : serveur de développement + Gateway distant
  - H2 : Liens connexes

## web/dashboard.md

- Route : /web/dashboard
- Titres :
  - H2 : Chemin rapide (recommandé)
  - H2 : Bases de l’authentification (locale ou distante)
  - H2 : Si vous voyez « unauthorized » / 1008
  - H2 : Liens connexes

## web/index.md

- Route : /web
- Titres :
  - H2 : Webhooks
  - H2 : RPC HTTP administrateur
  - H2 : Configuration (activée par défaut)
  - H2 : Accès Tailscale
  - H3 : Integrated Serve (recommandé)
  - H3 : Liaison Tailnet + token
  - H3 : Internet public (Funnel)
  - H2 : Notes de sécurité
  - H2 : Construire l’interface utilisateur

## web/tui.md

- Route : /web/tui
- Titres :
  - H2 : Démarrage rapide
  - H3 : Mode Gateway
  - H3 : Mode local
  - H2 : Ce que vous voyez
  - H2 : Modèle mental : agents + sessions
  - H2 : Envoi + livraison
  - H2 : Sélecteurs + overlays
  - H2 : Raccourcis clavier
  - H2 : Commandes slash
  - H2 : Commandes shell locales
  - H2 : Réparer les configurations depuis le TUI local
  - H2 : Sortie des outils
  - H2 : Couleurs du terminal
  - H2 : Historique + streaming
  - H2 : Détails de connexion
  - H2 : Options
  - H2 : Dépannage
  - H2 : Dépannage de connexion
  - H2 : Liens connexes

## web/webchat.md

- Route : /web/webchat
- Titres :
  - H2 : Ce que c’est
  - H2 : Démarrage rapide
  - H2 : Fonctionnement (comportement)
  - H3 : Transcript et modèle de livraison
  - H2 : Panneau d’outils des agents Control UI
  - H2 : Utilisation à distance
  - H2 : Référence de configuration (WebChat)
  - H2 : Liens connexes
