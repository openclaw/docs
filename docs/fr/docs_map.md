---
read_when: Finding which docs page covers a topic before reading the page
summary: Carte des titres générée pour les pages de documentation OpenClaw
title: Plan de la documentation
x-i18n:
    generated_at: "2026-07-12T15:19:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 691c999d749d88c4c350c4b6dd197a57418dd915587a73e1bbeb6d54b45061de
    source_path: docs_map.md
    workflow: 16
---

# Carte de la documentation OpenClaw

Ce fichier est généré à partir des titres de `docs/**/*.md` et `docs/**/*.mdx` afin d’aider les agents à parcourir l’arborescence de la documentation.
Ne le modifiez pas manuellement ; exécutez `pnpm docs:map:gen`.

## agent-runtime-architecture.md

- Route : /agent-runtime-architecture
- Titres :
  - H2 : Organisation du runtime
  - H2 : Limites
  - H2 : Manifestes
  - H2 : Sélection du runtime
  - H2 : Voir aussi

## announcements/bluebubbles-imessage.md

- Route : /announcements/bluebubbles-imessage
- Titres :
  - H1 : Suppression de BlueBubbles et voie iMessage avec imsg
  - H2 : Modifications
  - H2 : Marche à suivre
  - H2 : Notes de migration
  - H2 : Voir aussi

## auth-credential-semantics.md

- Route : /auth-credential-semantics
- Titres :
  - H2 : Codes de motif stables des sondes
  - H2 : Identifiants par jeton
  - H3 : Règles d’éligibilité
  - H3 : Règles de résolution
  - H2 : Portabilité des copies d’agents
  - H2 : Routes d’authentification par configuration uniquement
  - H2 : Filtrage explicite de l’ordre d’authentification
  - H2 : Résolution de la cible de la sonde
  - H2 : Découverte des identifiants de CLI externes
  - H2 : Garde de stratégie OAuth SecretRef
  - H2 : Messagerie compatible avec les versions antérieures
  - H2 : Voir aussi

## automation/auth-monitoring.md

- Route : /automation/auth-monitoring
- Titres :
  - H2 : Voir aussi

## automation/clawflow.md

- Route : /automation/clawflow
- Titres :
  - H2 : Voir aussi

## automation/cron-jobs.md

- Route : /automation/cron-jobs
- Titres :
  - H2 : Démarrage rapide
  - H2 : Fonctionnement de Cron
  - H2 : Types de planification
  - H3 : Le jour du mois et le jour de la semaine utilisent une logique OU
  - H2 : Déclencheurs d’événements (observateurs de conditions)
  - H2 : Charges utiles
  - H3 : Options de tour d’agent
  - H3 : Charges utiles de commandes
  - H2 : Modes d’exécution
  - H2 : Livraison et sortie
  - H3 : Notifications d’échec
  - H3 : Langue de sortie
  - H2 : Exemples de CLI
  - H2 : Gestion des tâches
  - H2 : Webhooks
  - H3 : Authentification
  - H2 : Intégration Gmail PubSub
  - H3 : Configuration avec l’assistant (recommandée)
  - H3 : Démarrage automatique du Gateway
  - H3 : Configuration manuelle unique
  - H3 : Remplacement du modèle Gmail
  - H2 : Configuration
  - H2 : Résolution des problèmes
  - H3 : Séquence de commandes
  - H2 : Voir aussi

## automation/cron-vs-heartbeat.md

- Route : /automation/cron-vs-heartbeat
- Titres :
  - H2 : Voir aussi

## automation/gmail-pubsub.md

- Route : /automation/gmail-pubsub
- Titres :
  - H2 : Voir aussi

## automation/hooks.md

- Route : /automation/hooks
- Titres :
  - H2 : Choisir la surface adaptée
  - H2 : Démarrage rapide
  - H2 : Types d’événements
  - H2 : Écriture de hooks
  - H3 : Structure d’un hook
  - H3 : Format de HOOK.md
  - H3 : Implémentation du gestionnaire
  - H3 : Principaux éléments du contexte d’événement
  - H2 : Découverte des hooks
  - H3 : Packs de hooks
  - H2 : Hooks intégrés
  - H3 : Détails de session-memory
  - H3 : Configuration de bootstrap-extra-files
  - H3 : Détails de command-logger
  - H3 : Détails de compaction-notifier
  - H3 : Détails de boot-md
  - H2 : Hooks de Plugin
  - H2 : Configuration
  - H2 : Référence de la CLI
  - H2 : Bonnes pratiques
  - H2 : Résolution des problèmes
  - H3 : Hook non découvert
  - H3 : Hook non éligible
  - H3 : Hook non exécuté
  - H2 : Voir aussi

## automation/index.md

- Route : /automation
- Titres :
  - H2 : Guide de décision rapide
  - H3 : Tâches planifiées (Cron) ou Heartbeat
  - H2 : Concepts fondamentaux
  - H3 : Tâches planifiées (Cron)
  - H3 : Tâches
  - H3 : Engagements déduits
  - H3 : Flux de tâches
  - H3 : Ordres permanents
  - H3 : Hooks
  - H3 : Heartbeat
  - H2 : Fonctionnement conjoint
  - H2 : Voir aussi

## automation/poll.md

- Route : /automation/poll
- Titres :
  - H2 : Voir aussi

## automation/standing-orders.md

- Route : /automation/standing-orders
- Titres :
  - H2 : Pourquoi utiliser des ordres permanents
  - H2 : Fonctionnement
  - H2 : Anatomie d’un ordre permanent
  - H2 : Ordres permanents et tâches Cron
  - H2 : Exemples
  - H3 : Exemple 1 : contenu et réseaux sociaux (cycle hebdomadaire)
  - H3 : Exemple 2 : opérations financières (déclenchées par événement)
  - H3 : Exemple 3 : surveillance et alertes (en continu)
  - H2 : Modèle exécuter-vérifier-rendre compte
  - H2 : Architecture multiprogramme
  - H2 : Bonnes pratiques
  - H3 : À faire
  - H3 : À éviter
  - H2 : Voir aussi

## automation/taskflow.md

- Route : /automation/taskflow
- Titres :
  - H2 : Quand utiliser TaskFlow
  - H2 : Modes de synchronisation
  - H3 : Mode géré
  - H3 : Mode miroir
  - H2 : États des flux
  - H2 : État durable et suivi des révisions
  - H2 : Comportement d’annulation
  - H2 : Commandes de la CLI
  - H2 : Modèle fiable de workflow planifié
  - H2 : Relation entre les flux et les tâches
  - H2 : Voir aussi

## automation/tasks.md

- Route : /automation/tasks
- Titres :
  - H2 : En bref
  - H2 : Démarrage rapide
  - H2 : Éléments qui créent une tâche
  - H2 : Cycle de vie des tâches
  - H2 : Livraison et notifications
  - H3 : Stratégies de notification
  - H2 : Référence de la CLI
  - H2 : Tableau des tâches de la discussion (/tasks)
  - H3 : Interface de contrôle
  - H2 : Intégration de l’état (pression des tâches)
  - H2 : Stockage et maintenance
  - H3 : Emplacement des tâches
  - H3 : Maintenance automatique
  - H2 : Relation entre les tâches et les autres systèmes
  - H2 : Voir aussi

## automation/troubleshooting.md

- Route : /automation/troubleshooting
- Titres :
  - H2 : Voir aussi

## automation/webhook.md

- Route : /automation/webhook
- Titres :
  - H2 : Voir aussi

## brave-search.md

- Route : /brave-search
- Titres :
  - H2 : Voir aussi

## channels/access-groups.md

- Route : /channels/access-groups
- Titres :
  - H2 : Groupes statiques d’expéditeurs de messages
  - H2 : Groupes de référence issus des listes d’autorisation
  - H2 : Chemins pris en charge pour les canaux de messagerie
  - H2 : Audiences des canaux Discord
  - H2 : Diagnostics des Plugins
  - H2 : Notes de sécurité
  - H2 : Résolution des problèmes

## channels/ambient-room-events.md

- Route : /channels/ambient-room-events
- Titres :
  - H2 : Configuration recommandée
  - H2 : Modifications
  - H2 : Exemple Discord
  - H2 : Exemple Slack
  - H2 : Exemple Telegram
  - H2 : Stratégie propre à l’agent
  - H2 : Modes de réponse visibles
  - H2 : Historique
  - H2 : Résolution des problèmes
  - H2 : Voir aussi

## channels/bot-loop-protection.md

- Route : /channels/bot-loop-protection
- Titres :
  - H2 : Valeurs par défaut
  - H2 : Configurer les valeurs par défaut partagées
  - H2 : Remplacer les valeurs par canal, compte ou salon
  - H2 : Prise en charge des canaux

## channels/broadcast-groups.md

- Route : /channels/broadcast-groups
- Titres :
  - H2 : Vue d’ensemble
  - H2 : Configuration
  - H3 : Configuration de base
  - H3 : Stratégie de traitement
  - H3 : Exemple complet
  - H2 : Fonctionnement
  - H3 : Flux des messages
  - H3 : Isolation des sessions
  - H3 : Exemple : sessions isolées
  - H2 : Cas d’utilisation
  - H2 : Bonnes pratiques
  - H2 : Compatibilité
  - H3 : Fournisseurs
  - H3 : Routage
  - H2 : Résolution des problèmes
  - H2 : Exemples
  - H2 : Référence de l’API
  - H3 : Schéma de configuration
  - H3 : Champs
  - H2 : Limitations
  - H2 : Voir aussi

## channels/channel-routing.md

- Route : /channels/channel-routing
- Titres :
  - H1 : Canaux et routage
  - H2 : Termes clés
  - H2 : Préfixes des cibles sortantes
  - H2 : Formes des clés de session (exemples)
  - H2 : Épinglage de la route principale des messages privés
  - H2 : Enregistrement entrant protégé
  - H2 : Règles de routage (mode de sélection d’un agent)
  - H2 : Groupes de diffusion (exécuter plusieurs agents)
  - H2 : Vue d’ensemble de la configuration
  - H2 : Stockage des sessions
  - H2 : Comportement de WebChat
  - H2 : Contexte de réponse
  - H2 : Voir aussi

## channels/clickclack.md

- Route : /channels/clickclack
- Titres :
  - H2 : Configuration rapide
  - H3 : Clés de configuration du compte
  - H2 : Plusieurs bots
  - H2 : Modes de réponse
  - H2 : Lignes d’activité des agents
  - H2 : Cibles
  - H2 : Autorisations
  - H2 : Résolution des problèmes

## channels/discord.md

- Route : /channels/discord
- Titres :
  - H2 : Configuration rapide
  - H2 : Recommandation : configurer un espace de travail de serveur
  - H2 : Modèle de runtime
  - H2 : Canaux de forum
  - H2 : Composants interactifs
  - H2 : Contrôle d’accès et routage
  - H3 : Routage des agents selon le rôle
  - H2 : Commandes natives et authentification des commandes
  - H2 : Détails des fonctionnalités
  - H2 : Outils et contrôles des actions
  - H2 : Interface des composants v2
  - H2 : Voix
  - H3 : Canaux vocaux
  - H3 : Suivre les utilisateurs dans les canaux vocaux
  - H3 : Messages vocaux
  - H2 : Résolution des problèmes
  - H2 : Référence de configuration
  - H2 : Sécurité et exploitation
  - H2 : Voir aussi

## channels/feishu.md

- Route : /channels/feishu
- Titres :
  - H2 : Démarrage rapide
  - H2 : Contrôle d’accès
  - H3 : Messages privés
  - H3 : Discussions de groupe
  - H2 : Exemples de configuration des groupes
  - H3 : Autoriser tous les groupes sans exiger de @mention
  - H3 : Autoriser tous les groupes tout en exigeant une @mention
  - H3 : Autoriser uniquement des groupes spécifiques
  - H3 : Restreindre les expéditeurs au sein d’un groupe
  - H2 : Obtenir les identifiants de groupe ou d’utilisateur
  - H3 : Identifiants de groupe (chatid, format : ocxxx)
  - H3 : Identifiants d’utilisateur (openid, format : ouxxx)
  - H2 : Commandes courantes
  - H2 : Résolution des problèmes
  - H3 : Le bot ne répond pas dans les discussions de groupe
  - H3 : Le bot ne reçoit pas les messages
  - H3 : La configuration par code QR ne réagit pas dans l’application mobile Feishu
  - H3 : Fuite de l’App Secret
  - H2 : Configuration avancée
  - H3 : Plusieurs comptes
  - H3 : Limites des messages
  - H3 : Diffusion en continu
  - H3 : Optimisation des quotas
  - H3 : Portée des sessions de groupe et fils de discussion thématiques
  - H3 : Outils de l’espace de travail Feishu
  - H3 : Sessions ACP
  - H4 : Liaison ACP persistante
  - H4 : Lancer ACP depuis la discussion
  - H3 : Routage multi-agent
  - H2 : Isolation des agents par utilisateur (création dynamique d’agents)
  - H3 : Configuration rapide
  - H3 : Fonctionnement
  - H3 : Options de configuration
  - H3 : Portée des sessions
  - H3 : Déploiement multi-utilisateur type
  - H3 : Vérification
  - H3 : Remarques
  - H2 : Référence de configuration
  - H2 : Types de messages pris en charge
  - H3 : Réception
  - H3 : Envoi
  - H3 : Fils de discussion et réponses
  - H2 : Voir aussi

## channels/googlechat.md

- Route : /channels/googlechat
- Titres :
  - H2 : Installation
  - H2 : Configuration rapide (débutants)
  - H2 : Ajouter à Google Chat
  - H2 : URL publique (Webhook uniquement)
  - H3 : Option A : Tailscale Funnel (recommandée)
  - H3 : Option B : proxy inverse (Caddy)
  - H3 : Option C : tunnel Cloudflare
  - H2 : Fonctionnement
  - H2 : Cibles
  - H2 : Points clés de la configuration
  - H2 : Résolution des problèmes
  - H3 : 405 Method Not Allowed
  - H3 : Autres problèmes
  - H2 : Voir aussi

## channels/group-messages.md

- Route : /channels/group-messages
- Titres :
  - H2 : Comportement
  - H2 : Exemple de configuration (WhatsApp)
  - H3 : Commande d’activation (propriétaire uniquement)
  - H2 : Utilisation
  - H2 : Tests et vérification
  - H2 : Points à prendre en compte
  - H2 : Voir aussi

## channels/groups.md

- Route : /channels/groups
- Titres :
  - H2 : Présentation pour débutants (2 minutes)
  - H2 : Réponses visibles
  - H2 : Visibilité du contexte et listes d’autorisation
  - H2 : Clés de session
  - H2 : Modèle : messages privés personnels et groupes publics (un seul agent)
  - H2 : Libellés d’affichage
  - H2 : Stratégie de groupe
  - H2 : Filtrage par mention (par défaut)
  - H2 : Définir la portée des modèles de mention configurés
  - H2 : Restrictions des outils par groupe ou canal (facultatif)
  - H2 : Listes d’autorisation des groupes
  - H2 : Activation (propriétaire uniquement)
  - H2 : Champs de contexte
  - H2 : Particularités d’iMessage
  - H2 : Invites système de WhatsApp
  - H2 : Particularités de WhatsApp
  - H2 : Voir aussi

## channels/imessage-from-bluebubbles.md

- Route : /channels/imessage-from-bluebubbles
- Titres :
  - H2 : Liste de contrôle de la migration
  - H2 : Fonction d’imsg
  - H2 : Avant de commencer
  - H2 : Traduction de la configuration
  - H2 : Piège du registre des groupes
  - H2 : Procédure détaillée
  - H2 : Aperçu de la parité des actions
  - H2 : Appairage, sessions et liaisons ACP
  - H2 : Aucun canal de retour arrière
  - H2 : Voir aussi

## channels/imessage.md

- Route : /channels/imessage
- Titres :
  - H2 : Configuration rapide
  - H2 : Exigences et autorisations (macOS)
  - H2 : Activation de l’API privée d’imsg
  - H3 : Configuration
  - H3 : Lorsque SIP reste activé
  - H2 : Contrôle d’accès et routage
  - H2 : Liaisons des conversations ACP
  - H2 : Modèles de déploiement
  - H2 : Médias, segmentation et cibles de livraison
  - H2 : Actions de l’API privée
  - H2 : Écritures de configuration
  - H2 : Regroupement des messages privés envoyés séparément (commande et URL dans une même composition)
  - H3 : Scénarios et contenu visible par l’agent
  - H2 : Récupération des messages entrants après le redémarrage d’un pont ou du Gateway
  - H3 : Signal visible par l’opérateur
  - H3 : Migration
  - H2 : Résolution des problèmes
  - H2 : Pointeurs vers la référence de configuration
  - H2 : Voir aussi

## channels/index.md

- Route : /channels
- Titres :
  - H2 : Canaux pris en charge
  - H2 : Notes de livraison
  - H2 : Remarques

## channels/irc.md

- Route : /channels/irc
- Titres :
  - H2 : Démarrage rapide
  - H2 : Paramètres de connexion
  - H2 : Paramètres de sécurité par défaut
  - H2 : Contrôle d’accès
  - H3 : Piège courant : allowFrom s’applique aux messages privés, pas aux canaux
  - H2 : Déclenchement des réponses (mentions)
  - H2 : Note de sécurité (recommandée pour les canaux publics)
  - H3 : Les mêmes outils pour tous les utilisateurs du canal
  - H3 : Des outils différents selon l’expéditeur (le propriétaire dispose de plus de pouvoir)
  - H2 : NickServ
  - H2 : Variables d’environnement
  - H2 : Résolution des problèmes
  - H2 : Voir aussi

## channels/line.md

- Route : /channels/line
- Titres :
  - H2 : Installation
  - H2 : Configuration initiale
  - H2 : Configuration
  - H2 : Contrôle d’accès
  - H2 : Comportement des messages
  - H2 : Données du canal (messages enrichis)
  - H2 : Prise en charge d’ACP
  - H2 : Médias sortants
  - H2 : Résolution des problèmes
  - H2 : Voir aussi

## channels/location.md

- Route : /channels/location
- Titres :
  - H2 : Mise en forme du texte
  - H2 : Champs de contexte
  - H2 : Charges utiles sortantes
  - H2 : Remarques sur le canal
  - H2 : Voir aussi

## channels/matrix-migration.md

- Route : /channels/matrix-migration
- Titres :
  - H2 : Ce que la migration effectue automatiquement
  - H2 : Mise à niveau depuis les versions d’OpenClaw antérieures à 2026.4
  - H2 : Procédure de mise à niveau recommandée
  - H2 : Messages courants et leur signification
  - H3 : Messages de récupération manuelle
  - H2 : Si l’historique chiffré ne réapparaît toujours pas
  - H2 : Si vous souhaitez repartir de zéro pour les futurs messages
  - H2 : Voir aussi

## channels/matrix-presentation.md

- Route : /channels/matrix-presentation
- Titres :
  - H2 : Contenu des événements
  - H2 : Comportement de repli
  - H2 : Blocs pris en charge
  - H2 : Interactions
  - H2 : Relation avec les métadonnées d’approbation
  - H2 : Messages multimédias

## channels/matrix-push-rules.md

- Route : /channels/matrix-push-rules
- Titres :
  - H2 : Prérequis
  - H2 : Étapes
  - H2 : Remarques sur l’utilisation de plusieurs bots
  - H2 : Remarques sur le serveur d’accueil
  - H2 : Voir aussi

## channels/matrix.md

- Route : /channels/matrix
- Titres :
  - H2 : Installation
  - H2 : Configuration initiale
  - H3 : Configuration interactive
  - H3 : Configuration minimale
  - H3 : Connexion automatique
  - H3 : Formats de cible de la liste d’autorisation
  - H3 : Normalisation de l’identifiant de compte
  - H3 : Identifiants mis en cache
  - H3 : Variables d’environnement
  - H2 : Exemple de configuration
  - H2 : Aperçus diffusés en continu
  - H2 : Messages vocaux
  - H2 : Métadonnées d’approbation
  - H3 : Règles de notification auto-hébergées pour des aperçus finalisés silencieux
  - H2 : Salons de bot à bot
  - H2 : Chiffrement et vérification
  - H3 : Activer le chiffrement
  - H3 : Signaux d’état et de confiance
  - H3 : Vérifier cet appareil avec une clé de récupération
  - H3 : Initialiser ou réparer la signature croisée
  - H3 : Sauvegarde des clés de salon
  - H3 : Répertorier, demander et traiter les vérifications
  - H3 : Remarques sur l’utilisation de plusieurs comptes
  - H2 : Gestion du profil
  - H2 : Fils de discussion
  - H3 : Routage des sessions (sessionScope)
  - H3 : Réponses dans les fils de discussion (threadReplies)
  - H3 : Héritage des fils de discussion et commandes slash
  - H2 : Liaisons de conversations ACP
  - H3 : Configuration de la liaison aux fils de discussion
  - H2 : Réactions
  - H2 : Contexte de l’historique
  - H2 : Visibilité du contexte
  - H2 : Politique des messages privés et des salons
  - H2 : Réparation des salons directs
  - H2 : Approbations d’exécution
  - H2 : Commandes slash
  - H2 : Comptes multiples
  - H2 : Serveurs d’accueil privés/LAN
  - H2 : Mise en proxy du trafic Matrix
  - H2 : Résolution des cibles
  - H2 : Référence de configuration
  - H3 : Compte et connexion
  - H3 : Chiffrement
  - H3 : Accès et politique
  - H3 : Comportement des réponses
  - H3 : Paramètres des réactions
  - H3 : Outils et remplacements par salon
  - H3 : Paramètres d’approbation d’exécution
  - H2 : Voir aussi

## channels/mattermost.md

- Route : /channels/mattermost
- Titres :
  - H2 : Installation
  - H2 : Configuration rapide
  - H2 : Commandes slash natives
  - H2 : Variables d’environnement (compte par défaut)
  - H2 : Modes de discussion
  - H2 : Fils de discussion et sessions
  - H2 : Contrôle d’accès (messages privés)
  - H2 : Canaux (groupes)
  - H2 : Cibles de livraison sortante
  - H2 : Nouvelle tentative pour le canal de messages privés
  - H2 : Diffusion en continu des aperçus
  - H2 : Réactions (outil de messagerie)
  - H2 : Boutons interactifs (outil de messagerie)
  - H3 : Intégration directe à l’API (scripts externes)
  - H2 : Adaptateur d’annuaire
  - H2 : Comptes multiples
  - H2 : Résolution des problèmes
  - H2 : Voir aussi

## channels/msteams.md

- Route : /channels/msteams
- Titres :
  - H2 : Plugin inclus
  - H2 : Configuration rapide
  - H2 : Objectifs
  - H2 : Écritures de configuration
  - H2 : Contrôle d’accès (messages privés et groupes)
  - H3 : Fonctionnement
  - H3 : Étape 1 : créer un bot Azure
  - H3 : Étape 2 : obtenir les identifiants
  - H3 : Étape 3 : configurer le point de terminaison de messagerie
  - H3 : Étape 4 : activer le canal Teams
  - H3 : Étape 5 : créer le manifeste de l’application Teams
  - H3 : Étape 6 : configurer OpenClaw
  - H3 : Étape 7 : exécuter le Gateway
  - H2 : Authentification fédérée (certificat et identité managée)
  - H3 : Option A : authentification par certificat
  - H3 : Option B : identité managée Azure
  - H3 : Configuration d’AKS Workload Identity
  - H3 : Comparaison des types d’authentification
  - H2 : Développement local (tunnel)
  - H2 : Test du bot
  - H2 : Variables d’environnement
  - H2 : Action d’informations sur les membres
  - H2 : Contexte de l’historique
  - H2 : Autorisations RSC Teams actuelles (manifeste)
  - H2 : Exemple de manifeste Teams (expurgé)
  - H3 : Points d’attention concernant le manifeste (champs obligatoires)
  - H3 : Mise à jour d’une application existante
  - H2 : Capacités : RSC uniquement ou Graph
  - H3 : Avec Teams RSC uniquement (application installée, aucune autorisation de l’API Graph)
  - H3 : Avec Teams RSC et les autorisations d’application Microsoft Graph
  - H3 : RSC et API Graph
  - H2 : Médias et historique avec Graph activé
  - H3 : Récupération des fichiers de canal/groupe (graphMediaFallback)
  - H2 : Limitations connues
  - H3 : Délais d’expiration des Webhooks
  - H3 : Prise en charge du cloud Teams et des URL de service
  - H3 : Mise en forme
  - H2 : Configuration
  - H2 : Routage et sessions
  - H2 : Style de réponse : fils de discussion ou publications
  - H3 : Ordre de priorité de résolution
  - H3 : Conservation du contexte des fils de discussion
  - H2 : Pièces jointes et images
  - H2 : Envoi de fichiers dans les discussions de groupe
  - H3 : Pourquoi les discussions de groupe nécessitent SharePoint
  - H3 : Configuration initiale
  - H3 : Comportement du partage
  - H3 : Comportement de repli
  - H3 : Emplacement de stockage des fichiers
  - H2 : Sondages (cartes adaptatives)
  - H2 : Cartes de présentation
  - H2 : Formats de cible
  - H2 : Messagerie proactive
  - H2 : Identifiants d’équipe et de canal (piège courant)
  - H2 : Canaux privés
  - H2 : Résolution des problèmes
  - H3 : Problèmes courants
  - H3 : Erreurs de téléversement du manifeste
  - H3 : Les autorisations RSC ne fonctionnent pas
  - H2 : Références
  - H2 : Voir aussi

## channels/nextcloud-talk.md

- Route : /channels/nextcloud-talk
- Titres :
  - H2 : Installation
  - H2 : Configuration rapide (débutant)
  - H2 : Remarques
  - H2 : Contrôle d’accès (messages privés)
  - H2 : Salons (groupes)
  - H2 : Capacités
  - H2 : Référence de configuration (Nextcloud Talk)
  - H2 : Voir aussi

## channels/nostr.md

- Route : /channels/nostr
- Titres :
  - H2 : Installation
  - H3 : Configuration non interactive
  - H2 : Configuration rapide
  - H2 : Référence de configuration
  - H2 : Métadonnées du profil
  - H2 : Contrôle d’accès
  - H3 : Politiques des messages privés
  - H3 : Exemple de liste d’autorisation
  - H2 : Formats de clé
  - H2 : Relais
  - H2 : Prise en charge du protocole
  - H2 : Tests
  - H3 : Relais local
  - H3 : Test manuel
  - H2 : Résolution des problèmes
  - H3 : Aucun message reçu
  - H3 : Aucune réponse envoyée
  - H3 : Réponses en double
  - H2 : Sécurité
  - H2 : Limitations (MVP)
  - H2 : Voir aussi

## channels/pairing.md

- Route : /channels/pairing
- Titres :
  - H2 : 1) Appairage des messages privés (accès aux discussions entrantes)
  - H3 : Approuver un expéditeur
  - H3 : Groupes d’expéditeurs réutilisables
  - H3 : Emplacement de l’état
  - H2 : 2) Appairage d’appareils Node (nœuds iOS/Android/macOS/sans interface)
  - H3 : Appairer depuis l’interface de contrôle (recommandé)
  - H3 : Appairer via Telegram
  - H3 : Approuver un appareil Node
  - H3 : Approbation automatique facultative des nœuds par CIDR de confiance
  - H3 : Stockage de l’état d’appairage des nœuds
  - H3 : Remarques
  - H2 : Documentation associée

## channels/qa-channel.md

- Route : /channels/qa-channel
- Titres :
  - H2 : Fonctionnement
  - H2 : Configuration
  - H2 : Exécuteurs
  - H2 : Voir aussi

## channels/qqbot.md

- Route : /channels/qqbot
- Titres :
  - H2 : Installation
  - H2 : Configuration initiale
  - H2 : Configuration
  - H3 : Politique d’accès
  - H3 : Configuration de plusieurs comptes
  - H3 : Discussions de groupe
  - H3 : Voix (STT / TTS)
  - H2 : Formats de cible
  - H2 : Commandes slash
  - H2 : Médias et stockage
  - H2 : Résolution des problèmes
  - H2 : Voir aussi

## channels/raft.md

- Route : /channels/raft
- Titres :
  - H2 : Installation
  - H2 : Prérequis
  - H2 : Configuration
  - H2 : Fonctionnement
  - H2 : Vérification
  - H2 : Résolution des problèmes
  - H2 : Références

## channels/signal.md

- Route : /channels/signal
- Titres :
  - H2 : Le modèle de numéro (à lire en premier)
  - H2 : Installation
  - H2 : Configuration rapide
  - H2 : Présentation
  - H2 : Procédure de configuration A : lier un compte Signal existant (QR)
  - H2 : Procédure de configuration B : enregistrer un numéro de bot dédié (SMS, Linux)
  - H2 : Mode démon externe (httpUrl)
  - H2 : Mode conteneur (bbernhard/signal-cli-rest-api)
  - H2 : Contrôle d’accès (messages privés et groupes)
  - H2 : Fonctionnement (comportement)
  - H2 : Médias et limites
  - H2 : Indication de saisie et confirmations de lecture
  - H2 : Réactions d’état du cycle de vie
  - H2 : Réactions (outil de messagerie)
  - H2 : Réactions d’approbation
  - H2 : Cibles de livraison (CLI/cron)
  - H2 : Alias
  - H2 : Résolution des problèmes
  - H2 : Remarques de sécurité
  - H2 : Référence de configuration (Signal)
  - H2 : Voir aussi

## channels/slack.md

- Route : /channels/slack
- Titres :
  - H2 : Choisir un transport
  - H3 : Mode relais
  - H3 : Installations à l’échelle de l’organisation Enterprise Grid
  - H4 : Socket Mode
  - H4 : HTTP Request URLs
  - H2 : Installation
  - H2 : Configuration rapide
  - H2 : Réglage du transport Socket Mode
  - H2 : Liste de contrôle du manifeste et des portées
  - H3 : Paramètres supplémentaires du manifeste
  - H2 : Modèle de jeton
  - H2 : Actions et contrôles
  - H2 : Contrôle d’accès et routage
  - H2 : Fils de discussion, sessions et balises de réponse
  - H2 : Réactions d’accusé de réception
  - H3 : Emoji (ackReaction)
  - H3 : Portée (messages.ackReactionScope)
  - H2 : Diffusion du texte en continu
  - H2 : Réaction de repli pour l’indication de saisie
  - H2 : Entrée vocale
  - H2 : Médias, découpage et livraison
  - H2 : Commandes et comportement des commandes slash
  - H2 : Graphiques natifs
  - H2 : Tableaux natifs
  - H2 : Réponses interactives
  - H3 : Envoi de fenêtres modales géré par le Plugin
  - H2 : Approbations natives dans Slack
  - H2 : Événements et comportement opérationnel
  - H2 : Référence de configuration
  - H2 : Résolution des problèmes
  - H2 : Référence des médias en pièce jointe
  - H3 : Types de médias pris en charge
  - H3 : Pipeline entrant
  - H3 : Héritage des pièces jointes de la racine du fil de discussion
  - H3 : Gestion de plusieurs pièces jointes
  - H3 : Limites de taille, de téléchargement et du modèle
  - H3 : Limites connues
  - H3 : Documentation associée
  - H2 : Voir aussi

## channels/sms.md

- Route : /channels/sms
- Titres :
  - H2 : Avant de commencer
  - H2 : Configuration rapide
  - H2 : Exemples de configuration
  - H3 : Fichier de configuration
  - H3 : Variables d’environnement
  - H3 : Jeton d’authentification SecretRef
  - H3 : Expéditeur du service de messagerie
  - H3 : Cible sortante par défaut
  - H2 : Contrôle d’accès
  - H2 : Envoi de SMS
  - H2 : Vérification de la configuration
  - H3 : Test de bout en bout depuis iMessage/SMS sur macOS
  - H2 : Sécurité du Webhook
  - H2 : Configuration de plusieurs comptes
  - H2 : Résolution des problèmes
  - H3 : Twilio renvoie 403 ou OpenClaw rejette le Webhook
  - H3 : Aucune demande d’appairage n’apparaît
  - H3 : Échec des envois sortants
  - H3 : Les messages arrivent, mais l’agent ne répond pas

## channels/synology-chat.md

- Route : /channels/synology-chat
- Titres :
  - H2 : Installation
  - H2 : Configuration rapide
  - H2 : Variables d’environnement
  - H2 : Politique des messages privés et contrôle d’accès
  - H2 : Livraison sortante
  - H2 : Comptes multiples
  - H2 : Remarques de sécurité
  - H2 : Résolution des problèmes
  - H2 : Voir aussi

## channels/telegram.md

- Route : /channels/telegram
- Titres :
  - H2 : Configuration rapide
  - H2 : Paramètres côté Telegram
  - H2 : Mini-application du tableau de bord
  - H2 : Contrôle d’accès et activation
  - H3 : Identité du bot dans les groupes
  - H2 : Comportement à l’exécution
  - H2 : Référence des fonctionnalités
  - H2 : Contrôles des réponses d’erreur
  - H2 : Résolution des problèmes
  - H2 : Référence de configuration
  - H2 : Voir aussi

## channels/tlon.md

- Route : /channels/tlon
- Titres :
  - H2 : Plugin inclus
  - H2 : Configuration initiale
  - H2 : Vaisseaux privés/LAN
  - H2 : Canaux de groupe
  - H2 : Contrôle d’accès
  - H2 : Système de propriétaire et d’approbation
  - H2 : Paramètres d’acceptation automatique
  - H2 : Rechargement à chaud via le magasin de paramètres Urbit
  - H2 : Cibles de livraison (CLI/cron)
  - H2 : Skill inclus
  - H2 : Capacités
  - H2 : Résolution des problèmes
  - H2 : Référence de configuration
  - H2 : Remarques
  - H2 : Voir aussi

## channels/troubleshooting.md

- Route : /channels/troubleshooting
- Titres :
  - H2 : Séquence de commandes
  - H2 : Après une mise à jour
  - H2 : WhatsApp
  - H3 : Signatures d’échec de WhatsApp
  - H2 : Telegram
  - H3 : Signatures d’échec de Telegram
  - H2 : Discord
  - H3 : Signatures d’échec de Discord
  - H2 : Slack
  - H3 : Signatures d’échec de Slack
  - H2 : iMessage
  - H3 : Signatures d’échec d’iMessage
  - H2 : Signal
  - H3 : Signatures d’échec de Signal
  - H2 : QQ Bot
  - H3 : Signatures d’échec de QQ Bot
  - H2 : Matrix
  - H3 : Signatures d’échec de Matrix
  - H2 : Voir aussi

## channels/twitch.md

- Route : /channels/twitch
- Titres :
  - H2 : Installation
  - H2 : Configuration rapide
  - H2 : Présentation
  - H2 : Actualisation du jeton (facultative)
  - H2 : Prise en charge de plusieurs comptes
  - H2 : Contrôle d’accès
  - H2 : Résolution des problèmes
  - H2 : Configuration
  - H3 : Configuration du compte
  - H3 : Options du fournisseur
  - H2 : Actions des outils
  - H2 : Sécurité et exploitation
  - H2 : Limites
  - H2 : Pages connexes

## channels/wechat.md

- Route : /channels/wechat
- Titres :
  - H2 : Nommage
  - H2 : Fonctionnement
  - H2 : Installation
  - H2 : Connexion
  - H2 : Contrôle d’accès
  - H2 : Compatibilité
  - H2 : Processus auxiliaire
  - H2 : Résolution des problèmes
  - H2 : Documentation connexe

## channels/whatsapp.md

- Route : /channels/whatsapp
- Titres :
  - H2 : Installation
  - H2 : Configuration rapide
  - H2 : Modèles de déploiement
  - H2 : Modèle d’exécution
  - H2 : Appeler le demandeur actuel avec MeowCaller (expérimental)
  - H2 : Invites d’approbation
  - H2 : Hooks de Plugin et confidentialité
  - H2 : Contrôle d’accès et activation
  - H2 : Liaisons ACP configurées
  - H2 : Comportement avec un numéro personnel et une discussion avec soi-même
  - H2 : Normalisation des messages et contexte
  - H2 : Livraison, segmentation et médias
  - H2 : Citation des réponses
  - H2 : Niveau de réaction
  - H2 : Réactions d’accusé de réception
  - H2 : Réactions à l’état du cycle de vie
  - H2 : Comptes multiples et identifiants
  - H2 : Outils, actions et écritures de configuration
  - H2 : Résolution des problèmes
  - H2 : Invites système
  - H2 : Références de configuration
  - H2 : Pages connexes

## channels/yuanbao.md

- Route : /channels/yuanbao
- Titres :
  - H2 : Démarrage rapide
  - H3 : Configuration interactive (alternative)
  - H2 : Contrôle d’accès
  - H3 : Messages directs
  - H3 : Discussions de groupe
  - H2 : Exemples de configuration
  - H2 : Commandes courantes
  - H2 : Résolution des problèmes
  - H2 : Configuration avancée
  - H3 : Comptes multiples
  - H3 : Limites des messages
  - H3 : Diffusion en continu
  - H3 : Contexte de l’historique des discussions de groupe
  - H3 : Mode de réponse
  - H3 : Injection d’indications Markdown
  - H3 : Mode de débogage
  - H3 : Routage multi-agent
  - H2 : Référence de configuration
  - H2 : Types de messages pris en charge
  - H2 : Pages connexes

## channels/zalo.md

- Route : /channels/zalo
- Titres :
  - H2 : Plugin intégré
  - H2 : Configuration rapide
  - H2 : Présentation
  - H2 : Fonctionnement
  - H2 : Limites
  - H2 : Contrôle d’accès
  - H3 : Messages directs
  - H3 : Groupes
  - H2 : Interrogation longue ou webhook
  - H2 : Types de messages pris en charge
  - H2 : Fonctionnalités
  - H2 : Cibles de livraison (CLI/cron)
  - H2 : Résolution des problèmes
  - H2 : Référence de configuration
  - H2 : Pages connexes

## channels/zaloclawbot.md

- Route : /channels/zaloclawbot
- Titres :
  - H2 : Compatibilité
  - H2 : Prérequis
  - H2 : Installation avec onboard (recommandée)
  - H2 : Installation manuelle
  - H3 : 1. Installer le Plugin
  - H3 : 2. Activer le Plugin dans la configuration
  - H3 : 3. Générer un code QR et se connecter
  - H3 : 4. Redémarrer le Gateway
  - H2 : Fonctionnement
  - H2 : Fonctionnement interne
  - H2 : Résolution des problèmes
  - H2 : Pages connexes

## channels/zalouser.md

- Route : /channels/zalouser
- Titres :
  - H2 : Installation
  - H2 : Configuration rapide
  - H2 : Présentation
  - H2 : Nommage
  - H2 : Recherche d’identifiants (annuaire)
  - H2 : Limites
  - H2 : Contrôle d’accès (messages directs)
  - H2 : Accès aux groupes (facultatif)
  - H3 : Restriction par mention dans les groupes
  - H2 : Comptes multiples
  - H2 : Variables d’environnement
  - H2 : Indicateurs de saisie, réactions et accusés de livraison
  - H2 : Résolution des problèmes
  - H2 : Pages connexes

## ci.md

- Route : /ci
- Titres :
  - H2 : Vue d’ensemble du pipeline
  - H2 : Ordre d’arrêt rapide en cas d’échec
  - H2 : Contexte et preuves de la PR
  - H2 : Périmètre et routage
  - H2 : Transfert de l’activité ClawSweeper
  - H2 : Déclenchements manuels
  - H2 : Exécuteurs
  - H2 : Budget d’enregistrement des exécuteurs
  - H2 : Équivalents locaux
  - H2 : Performances d’OpenClaw
  - H2 : Validation complète de la version
  - H2 : Segments en direct et E2E
  - H2 : Validation du paquet
  - H3 : Tâches
  - H3 : Sources des versions candidates
  - H3 : Profils de suites
  - H3 : Fenêtres de compatibilité héritée
  - H3 : Exemples
  - H2 : Test rapide d’installation
  - H2 : E2E Docker local
  - H3 : Paramètres ajustables
  - H3 : Workflow en direct/E2E réutilisable
  - H3 : Segments du processus de publication
  - H2 : Préversion des Plugins
  - H2 : Laboratoire d’assurance qualité
  - H2 : CodeQL
  - H3 : Catégories de sécurité
  - H3 : Segments de sécurité propres aux plateformes
  - H3 : Catégories critiques de qualité
  - H2 : Workflows de maintenance
  - H3 : Agent de documentation
  - H3 : Agent de performance des tests
  - H3 : PR en double après fusion
  - H2 : Seuils de vérification locale et routage des modifications
  - H2 : Validation Testbox
  - H2 : Pages connexes

## clawhub/cli.md

- Route : /clawhub/cli
- Titres :
  - H1 : CLI ClawHub
  - H2 : Rechercher et installer
  - H3 : Confiance dans la version
  - H2 : Publier et maintenir
  - H2 : Pages connexes

## clawhub/publishing.md

- Route : /clawhub/publishing
- Titres :
  - H1 : Publication sur ClawHub
  - H2 : Propriétaires
  - H2 : Skills
  - H2 : Plugins
  - H2 : Processus de publication
  - H2 : FAQ
  - H3 : La portée du paquet doit correspondre au propriétaire sélectionné

## cli/acp.md

- Route : /cli/acp
- Titres :
  - H2 : Ce que ceci n’est pas
  - H2 : Matrice de compatibilité
  - H2 : Limites connues
  - H2 : Utilisation
  - H2 : Client ACP (débogage)
  - H2 : Tests rapides du protocole
  - H2 : Mode d’emploi
  - H2 : Sélection des agents
  - H2 : Utilisation depuis acpx (Codex, Claude et autres clients ACP)
  - H2 : Configuration de l’éditeur Zed
  - H2 : Mappage des sessions
  - H2 : Options
  - H3 : Options du client acp
  - H2 : Pages connexes

## cli/agent.md

- Route : /cli/agent
- Titres :
  - H1 : openclaw agent
  - H2 : Options
  - H2 : Exemples
  - H2 : Remarques
  - H2 : État de livraison JSON
  - H2 : Pages connexes

## cli/agents.md

- Route : /cli/agents
- Titres :
  - H1 : openclaw agents
  - H2 : Exemples
  - H2 : Interface de commandes
  - H3 : agents list
  - H3 : agents add [name]
  - H3 : agents bindings
  - H3 : agents bind
  - H3 : agents unbind
  - H3 : agents set-identity
  - H3 : agents delete &lt;id&gt;
  - H2 : Liaisons de routage
  - H3 : Format de --bind
  - H3 : Comportement de la portée des liaisons
  - H2 : Fichiers d’identité
  - H2 : Définir l’identité
  - H2 : Pages connexes

## cli/approvals.md

- Route : /cli/approvals
- Titres :
  - H1 : openclaw approvals
  - H2 : openclaw exec-policy
  - H2 : Commandes courantes
  - H2 : Remplacer les approbations depuis un fichier
  - H2 : Exemple « Never prompt » / YOLO
  - H2 : Utilitaires de liste d’autorisation
  - H2 : Options courantes
  - H2 : Remarques
  - H2 : Pages connexes

## cli/attach.md

- Route : /cli/attach
- Titres : aucun

## cli/audit.md

- Route : /cli/audit
- Titres :
  - H1 : openclaw audit
  - H2 : Filtres
  - H2 : Événements enregistrés
  - H2 : RPC du Gateway
  - H2 : Pages connexes

## cli/backup.md

- Route : /cli/backup
- Titres :
  - H1 : openclaw backup
  - H2 : Remarques
  - H2 : Éléments sauvegardés
  - H2 : Comportement en cas de configuration non valide
  - H2 : Taille et performances
  - H2 : Pages connexes

## cli/browser.md

- Route : /cli/browser
- Titres :
  - H1 : openclaw browser
  - H2 : Options courantes
  - H2 : Démarrage rapide (local)
  - H2 : Résolution rapide des problèmes
  - H2 : Cycle de vie
  - H2 : Si la commande est absente
  - H2 : Profils
  - H2 : Onglets
  - H2 : Instantané / capture d’écran / actions
  - H2 : État et stockage
  - H2 : Débogage
  - H2 : Chrome existant via MCP
  - H2 : Contrôle du navigateur distant (proxy de l’hôte Node)
  - H2 : Pages connexes

## cli/channels.md

- Route : /cli/channels
- Titres :
  - H1 : openclaw channels
  - H2 : Commandes courantes
  - H2 : État / capacités / résolution / journaux
  - H2 : Ajouter / supprimer des comptes
  - H2 : Connexion et déconnexion (interactives)
  - H2 : Dépannage
  - H2 : Sonde de capacités
  - H2 : Résoudre les noms en identifiants
  - H2 : Voir aussi

## cli/clawbot.md

- Route : /cli/clawbot
- Titres :
  - H1 : openclaw clawbot
  - H2 : Migration
  - H2 : Voir aussi

## cli/commitments.md

- Route : /cli/commitments
- Titres :
  - H2 : Utilisation
  - H2 : Options
  - H2 : Exemples
  - H2 : Sortie
  - H2 : Voir aussi

## cli/completion.md

- Route : /cli/completion
- Titres :
  - H1 : openclaw completion
  - H2 : Utilisation
  - H2 : Options
  - H2 : Processus d’installation
  - H2 : Remarques
  - H2 : Voir aussi

## cli/config.md

- Route : /cli/config
- Titres :
  - H2 : Options racines
  - H2 : Exemples
  - H3 : Chemins
  - H3 : config get
  - H3 : config file
  - H3 : config schema
  - H3 : config validate
  - H2 : Valeurs
  - H2 : Modes de config set
  - H3 : Indicateurs du générateur de fournisseur
  - H2 : config patch
  - H2 : Simulation
  - H3 : Structure de la sortie JSON
  - H2 : Application des modifications
  - H2 : Sécurité de l’écriture
  - H2 : Boucle de réparation
  - H2 : Voir aussi

## cli/configure.md

- Route : /cli/configure
- Titres :
  - H1 : openclaw configure
  - H2 : Options
  - H2 : Section du modèle
  - H2 : Section Web
  - H2 : Autres remarques
  - H2 : Voir aussi

## cli/crestodian.md

- Route : /cli/crestodian
- Titres :
  - H1 : openclaw crestodian
  - H2 : Quand il démarre
  - H2 : Ce qu’affiche Crestodian
  - H2 : Exemples
  - H2 : Opérations et approbation
  - H3 : Passer à la configuration masquée des canaux
  - H2 : Amorçage de la configuration
  - H2 : Conversation avec l’IA
  - H3 : Modèle de confiance du harnais CLI
  - H2 : Passer à un agent
  - H2 : Mode de récupération des messages
  - H2 : Voir aussi

## cli/cron.md

- Route : /cli/cron
- Titres :
  - H1 : openclaw cron
  - H2 : Créer rapidement des tâches
  - H2 : Sessions
  - H2 : Livraison
  - H3 : Responsabilité de la livraison
  - H3 : Livraison en cas d’échec
  - H2 : Planification
  - H3 : Tâches ponctuelles
  - H3 : Tâches récurrentes
  - H3 : Exécutions manuelles
  - H2 : Modèles
  - H3 : Priorité du modèle Cron isolé
  - H3 : Mode rapide
  - H3 : Nouvelles tentatives de changement de modèle en direct
  - H2 : Sortie d’exécution et refus
  - H3 : Suppression des accusés de réception obsolètes
  - H3 : Suppression des jetons silencieux
  - H3 : Refus structurés
  - H2 : Conservation
  - H2 : Migration des anciennes tâches
  - H2 : Modifications courantes
  - H2 : Commandes d’administration courantes
  - H2 : Voir aussi

## cli/daemon.md

- Route : /cli/daemon
- Titres :
  - H1 : openclaw daemon
  - H2 : Utilisation
  - H2 : Sous-commandes et options
  - H2 : Remarques
  - H2 : Voir aussi

## cli/dashboard.md

- Route : /cli/dashboard
- Titres :
  - H1 : openclaw dashboard
  - H2 : Voir aussi

## cli/devices.md

- Route : /cli/devices
- Titres :
  - H1 : openclaw devices
  - H2 : Options courantes
  - H2 : Commandes
  - H3 : openclaw devices list
  - H3 : openclaw devices approve [requestId] [--latest]
  - H3 : openclaw devices reject &lt;requestId&gt;
  - H3 : openclaw devices remove &lt;deviceId&gt;
  - H3 : openclaw devices rename --device &lt;id&gt; --name &lt;label&gt;
  - H3 : openclaw devices clear --yes [--pending]
  - H3 : openclaw devices rotate --device &lt;id&gt; --role &lt;role&gt; [--scope &lt;scope...&gt;]
  - H3 : openclaw devices revoke --device &lt;id&gt; --role &lt;role&gt;
  - H2 : Remarques
  - H2 : Liste de contrôle pour la récupération après dérive des jetons
  - H2 : Approbation de la première exécution de Paperclip / openclawgateway
  - H2 : Voir aussi

## cli/directory.md

- Route : /cli/directory
- Titres :
  - H1 : openclaw directory
  - H2 : Indicateurs courants
  - H2 : Remarques
  - H2 : Utiliser les résultats avec message send
  - H2 : Formats d’identifiants par canal
  - H2 : Soi-même (« me »)
  - H2 : Pairs (contacts/utilisateurs)
  - H2 : Groupes
  - H2 : Voir aussi

## cli/dns.md

- Route : /cli/dns
- Titres :
  - H1 : openclaw dns
  - H2 : dns setup
  - H2 : Voir aussi

## cli/docs.md

- Route : /cli/docs
- Titres :
  - H1 : openclaw docs
  - H2 : Utilisation
  - H2 : Exemples
  - H2 : Fonctionnement
  - H2 : Sortie
  - H2 : Codes de sortie
  - H2 : Voir aussi

## cli/doctor.md

- Route : /cli/doctor
- Titres :
  - H1 : openclaw doctor
  - H2 : Postures
  - H2 : Exemples
  - H2 : Options
  - H2 : Mode d’analyse statique
  - H2 : Contrôles d’intégrité structurés
  - H2 : Sélection des contrôles
  - H2 : Mode après mise à niveau
  - H2 : Compaction SQLite de l’état partagé
  - H2 : Migration SQLite des sessions
  - H3 : Rétrogradation après la migration SQLite des sessions
  - H2 : Remarques
  - H2 : macOS : substitutions des variables d’environnement de launchctl
  - H2 : Voir aussi

## cli/fleet.md

- Route : /cli/fleet
- Titres :
  - H1 : openclaw fleet
  - H2 : Démarrage rapide
  - H2 : Identifiants de locataires
  - H2 : fleet create
  - H3 : Options de création
  - H3 : Épinglage par condensat
  - H3 : Limites de disque
  - H3 : Politique de trafic sortant
  - H2 : fleet list
  - H2 : fleet status
  - H2 : fleet logs
  - H2 : fleet start, fleet stop et fleet restart
  - H2 : fleet upgrade
  - H2 : fleet backup et fleet restore
  - H2 : fleet doctor
  - H2 : fleet rm
  - H2 : Organisation du stockage et des conteneurs
  - H2 : Profil de sécurité
  - H2 : Gestion des jetons
  - H2 : Voir aussi

## cli/flows.md

- Route : /cli/flows
- Titres :
  - H1 : openclaw tasks flow
  - H2 : Sous-commandes
  - H3 : Valeurs du filtre d’état
  - H2 : Exemples
  - H2 : Voir aussi

## cli/gateway.md

- Route : /cli/gateway
- Titres :
  - H2 : Exécuter le Gateway
  - H3 : Options
  - H2 : Redémarrer le Gateway
  - H3 : Profilage du Gateway
  - H2 : Interroger un Gateway en cours d’exécution
  - H3 : gateway health
  - H3 : gateway usage-cost
  - H3 : gateway stability
  - H3 : gateway diagnostics export
  - H3 : gateway status
  - H3 : gateway probe
  - H4 : À distance via SSH (parité avec l’application Mac)
  - H3 : gateway call &lt;method&gt;
  - H2 : Gérer le service Gateway
  - H3 : Installer avec un wrapper
  - H2 : Découvrir les Gateway (Bonjour)
  - H3 : gateway discover
  - H2 : Voir aussi

## cli/health.md

- Route : /cli/health
- Titres :
  - H1 : openclaw health
  - H2 : Options
  - H2 : Comportement
  - H2 : Voir aussi

## cli/hooks.md

- Route : /cli/hooks
- Titres :
  - H1 : openclaw hooks
  - H2 : Répertorier les hooks
  - H2 : Obtenir les informations d’un hook
  - H2 : Vérifier l’éligibilité
  - H2 : Activer un hook
  - H2 : Désactiver un hook
  - H2 : Installer et mettre à jour les packs de hooks
  - H2 : Hooks intégrés
  - H3 : Fichier journal de command-logger
  - H2 : Remarques
  - H2 : Voir aussi

## cli/index.md

- Route : /cli
- Titres :
  - H2 : Pages des commandes
  - H2 : Options globales
  - H2 : Modes de sortie
  - H2 : Palette de couleurs
  - H2 : Arborescence des commandes
  - H2 : Commandes slash de discussion
  - H2 : Suivi de l’utilisation
  - H2 : Voir aussi

## cli/infer.md

- Route : /cli/infer
- Titres :
  - H2 : Transformer infer en skill
  - H2 : Arborescence des commandes
  - H2 : Tâches courantes
  - H2 : Comportement
  - H2 : Modèle
  - H2 : Image
  - H2 : Audio
  - H2 : TTS
  - H2 : Vidéo
  - H2 : Web
  - H2 : Plongement
  - H2 : Sortie JSON
  - H2 : Pièges courants
  - H2 : Voir aussi

## cli/logs.md

- Route : /cli/logs
- Titres :
  - H1 : openclaw logs
  - H2 : Options
  - H2 : Options RPC partagées du Gateway
  - H2 : Exemples
  - H2 : Comportement de repli et de récupération
  - H2 : Voir aussi

## cli/mcp.md

- Route : /cli/mcp
- Titres :
  - H2 : Choisir le bon parcours MCP
  - H2 : OpenClaw en tant que serveur MCP
  - H3 : Quand utiliser serve
  - H3 : Fonctionnement
  - H3 : Choisir un mode client
  - H3 : Ce qu’expose serve
  - H3 : Utilisation
  - H3 : Outils de pont
  - H3 : Modèle d’événements
  - H3 : Notifications du canal Claude
  - H3 : Configuration du client MCP
  - H3 : Options
  - H3 : Sécurité et frontière de confiance
  - H3 : Tests
  - H3 : Dépannage
  - H2 : OpenClaw en tant que registre de clients MCP
  - H3 : Définitions de serveurs MCP enregistrées
  - H3 : Recettes courantes de serveurs
  - H3 : Structures de sortie JSON
  - H3 : Transport stdio
  - H3 : Transport SSE / HTTP
  - H3 : Flux de travail OAuth
  - H3 : Transport HTTP diffusable
  - H2 : Interface de contrôle
  - H2 : Applications MCP
  - H2 : Limites actuelles
  - H2 : Voir aussi

## cli/memory.md

- Route : /cli/memory
- Titres :
  - H1 : openclaw memory
  - H2 : memory status
  - H2 : memory index
  - H2 : memory search
  - H2 : memory promote
  - H2 : memory promote-explain
  - H2 : memory rem-harness
  - H2 : memory rem-backfill
  - H2 : Dreaming
  - H2 : Dépendance du Gateway à SecretRef
  - H2 : Voir aussi

## cli/message.md

- Route : /cli/message
- Titres :
  - H1 : openclaw message
  - H2 : Sélection du canal
  - H2 : Formats de cible (-t, --target)
  - H2 : Options courantes
  - H2 : Résolution de SecretRef
  - H2 : Actions
  - H3 : Noyau
  - H3 : Envoyer
  - H3 : Sondage
  - H3 : Fils de discussion
  - H3 : Émojis
  - H3 : Autocollants
  - H3 : Rôles, canaux, voix, événements (Discord)
  - H3 : Modération (Discord)
  - H3 : Diffusion
  - H2 : Voir aussi

## cli/migrate.md

- Route : /cli/migrate
- Titres :
  - H1 : openclaw migrate
  - H2 : Commandes
  - H2 : Modèle de sécurité
  - H2 : Fournisseur Claude
  - H3 : Ce que Claude importe
  - H3 : État d’archivage et de révision manuelle
  - H2 : Fournisseur Codex
  - H3 : Ce que Codex importe
  - H3 : État Codex nécessitant une révision manuelle
  - H2 : Fournisseur Hermes
  - H3 : Ce que Hermes importe
  - H3 : Clés .env prises en charge
  - H3 : État réservé à l’archivage
  - H3 : Après l’application
  - H2 : Contrat du Plugin
  - H2 : Intégration de l’onboarding
  - H2 : Voir aussi

## cli/models.md

- Route : /cli/models
- Titres :
  - H1 : openclaw models
  - H2 : Commandes courantes
  - H3 : État
  - H3 : Liste
  - H3 : Définir le modèle par défaut / d’image
  - H3 : Analyser
  - H2 : Alias
  - H2 : Solutions de repli
  - H2 : Profils d’authentification
  - H2 : Voir aussi

## cli/node.md

- Route : /cli/node
- Titres :
  - H1 : openclaw node
  - H2 : Pourquoi utiliser un hôte Node ?
  - H2 : Proxy de navigateur (sans configuration)
  - H2 : Exécuter (au premier plan)
  - H2 : Authentification du Gateway pour l’hôte Node
  - H2 : Service (en arrière-plan)
  - H2 : Appairage
  - H3 : Identité et état d’appairage
  - H2 : Approbations d’exécution
  - H2 : Voir aussi

## cli/nodes.md

- Route : /cli/nodes
- Titres :
  - H1 : openclaw nodes
  - H2 : État
  - H2 : Appairage
  - H2 : Invoquer
  - H2 : Notification, push, localisation, écran
  - H2 : Voir aussi

## cli/onboard.md

- Route : /cli/onboard
- Titres :
  - H1 : openclaw onboard
  - H2 : Exemples
  - H2 : Parcours guidé
  - H2 : Réinitialisation
  - H2 : Paramètres régionaux
  - H2 : Configuration non interactive
  - H3 : Authentification du Gateway (non interactive)
  - H3 : État de santé du Gateway local
  - H3 : Mode de référence interactif
  - H3 : Choix de points de terminaison Z.AI
  - H2 : Options non interactives supplémentaires
  - H2 : Préfiltrage des fournisseurs
  - H2 : Étapes suivantes pour la recherche Web
  - H2 : Autres comportements
  - H2 : Commandes de suivi courantes

## cli/pairing.md

- Route : /cli/pairing
- Titres :
  - H1 : openclaw pairing
  - H2 : Commandes
  - H2 : pairing list
  - H2 : pairing approve
  - H3 : Amorçage du propriétaire
  - H2 : Voir aussi

## cli/path.md

- Route : /cli/path
- Titres :
  - H1 : openclaw path
  - H2 : Pourquoi l’utiliser
  - H2 : Comment il est utilisé
  - H2 : Fonctionnement
  - H2 : Sous-commandes
  - H2 : Options globales
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
  - H3 : resolve &lt;oc-path&gt;
  - H3 : find &lt;pattern&gt;
  - H3 : set &lt;oc-path&gt; &lt;value&gt;
  - H3 : validate &lt;oc-path&gt;
  - H3 : emit &lt;file&gt;
  - H2 : Codes de sortie
  - H2 : Mode de sortie
  - H2 : Remarques
  - H2 : Voir aussi

## cli/plugins.md

- Route : /cli/plugins
- Titres :
  - H2 : Commandes
  - H2 : Créer
  - H3 : Squelette de fournisseur
  - H2 : Installer
  - H3 : Forme abrégée de la place de marché
  - H2 : Liste
  - H3 : Index des Plugins
  - H2 : Désinstaller
  - H2 : Mettre à jour
  - H2 : Inspecter
  - H2 : Doctor
  - H2 : Registre
  - H2 : Place de marché
  - H2 : Voir aussi

## cli/policy.md

- Route : /cli/policy
- Titres :
  - H1 : openclaw policy
  - H2 : Démarrage rapide
  - H3 : Référence des règles de stratégie
  - H4 : Superpositions délimitées
  - H4 : Canaux
  - H4 : Serveurs MCP
  - H4 : Fournisseurs de modèles
  - H4 : Réseau
  - H4 : Accès entrant et accès aux canaux
  - H4 : Gateway
  - H4 : Espace de travail de l’agent
  - H4 : Posture du bac à sable
  - H4 : Traitement des données
  - H4 : Secrets
  - H4 : Approbations d’exécution
  - H4 : Profils d’authentification
  - H4 : Métadonnées des outils
  - H4 : Posture des outils
  - H2 : Exécuter les vérifications
  - H2 : Configurer la stratégie
  - H2 : Accepter l’état de la stratégie
  - H2 : Résultats
  - H2 : Réparer
  - H2 : Codes de sortie
  - H2 : Voir aussi

## cli/promos.md

- Route : /cli/promos
- Titres :
  - H1 : openclaw promos
  - H2 : Commandes
  - H2 : openclaw promos list
  - H2 : openclaw promos claim &lt;slug&gt;
  - H2 : Découverte passive dans la liste des modèles

## cli/proxy.md

- Route : /cli/proxy
- Titres :
  - H1 : openclaw proxy
  - H2 : Valider
  - H3 : Options
  - H2 : Déboguer le proxy
  - H2 : Voir aussi

## cli/qr.md

- Route : /cli/qr
- Titres :
  - H1 : openclaw qr
  - H2 : Options
  - H2 : Contenu du code de configuration
  - H2 : Résolution de l’URL du Gateway
  - H2 : Résolution de l’authentification (sans --remote)
  - H2 : Résolution de l’authentification (--remote)
  - H2 : Voir aussi

## cli/reset.md

- Route : /cli/reset
- Titres :
  - H1 : openclaw reset
  - H2 : Options
  - H2 : Portées
  - H2 : Remarques
  - H2 : Voir aussi

## cli/sandbox.md

- Route : /cli/sandbox
- Titres :
  - H2 : Commandes
  - H3 : openclaw sandbox list
  - H3 : openclaw sandbox recreate
  - H3 : openclaw sandbox explain
  - H2 : Pourquoi la recréation est nécessaire
  - H2 : Déclencheurs courants
  - H2 : Migration du registre
  - H2 : Configuration
  - H2 : Voir aussi

## cli/secrets.md

- Route : /cli/secrets
- Titres :
  - H1 : openclaw secrets
  - H2 : Recharger l’instantané d’exécution
  - H2 : Audit
  - H2 : Configurer (assistant interactif)
  - H3 : Sécurité du fournisseur d’exécution
  - H2 : Appliquer un plan enregistré
  - H3 : Pourquoi aucune sauvegarde de restauration
  - H2 : Exemple
  - H2 : Voir aussi

## cli/security.md

- Route : /cli/security
- Titres :
  - H1 : openclaw security
  - H2 : Modes d’audit
  - H2 : Ce qui est vérifié
  - H2 : Comportement de SecretRef
  - H2 : Suppressions
  - H2 : Sortie JSON
  - H2 : Ce que --fix modifie
  - H2 : Voir aussi

## cli/sessions.md

- Route : /cli/sessions
- Titres :
  - H1 : openclaw sessions
  - H2 : Suivre la progression de la trajectoire
  - H2 : Exporter un paquet de trajectoire
  - H2 : Maintenance de nettoyage
  - H2 : Compacter une session
  - H3 : RPC sessions.compact
  - H2 : Voir aussi

## cli/setup.md

- Route : /cli/setup
- Titres :
  - H1 : openclaw setup
  - H2 : Options
  - H3 : Mode de référence
  - H2 : Exemples
  - H2 : Remarques
  - H2 : Voir aussi

## cli/skills.md

- Route : /cli/skills
- Titres :
  - H1 : openclaw skills
  - H2 : Commandes
  - H2 : Atelier de Skills
  - H2 : Voir aussi

## cli/status.md

- Route : /cli/status
- Titres :
  - H2 : Résolution de la session et du modèle
  - H2 : Utilisation et quota
  - H2 : Vue d’ensemble et état des mises à jour
  - H2 : Secrets
  - H2 : Mémoire
  - H2 : Voir aussi

## cli/system.md

- Route : /cli/system
- Titres :
  - H1 : openclaw system
  - H2 : Commandes courantes
  - H2 : system event
  - H2 : system heartbeat last|enable|disable
  - H2 : system presence
  - H2 : Remarques
  - H2 : Voir aussi

## cli/tasks.md

- Route : /cli/tasks
- Titres :
  - H2 : Utilisation
  - H2 : Options racines
  - H2 : Sous-commandes
  - H3 : list
  - H3 : show
  - H3 : notify
  - H3 : cancel
  - H3 : audit
  - H3 : maintenance
  - H3 : flow
  - H2 : Voir aussi

## cli/transcripts.md

- Route : /cli/transcripts
- Titres :
  - H1 : openclaw transcripts
  - H2 : Commandes
  - H2 : Sortie
  - H2 : Plusieurs sessions par jour
  - H2 : Résumés manquants
  - H2 : Configuration

## cli/tui.md

- Route : /cli/tui
- Titres :
  - H1 : openclaw tui
  - H2 : Options
  - H2 : Remarques
  - H2 : Exemples
  - H2 : Boucle de réparation de la configuration
  - H2 : Voir aussi

## cli/uninstall.md

- Route : /cli/uninstall
- Titres :
  - H1 : openclaw uninstall
  - H2 : Options
  - H2 : Exemples
  - H2 : Remarques
  - H2 : Voir aussi

## cli/update.md

- Route : /cli/update
- Titres :
  - H1 : openclaw update
  - H2 : Utilisation
  - H2 : Options
  - H2 : update status
  - H2 : update repair
  - H2 : update wizard
  - H2 : Fonctionnement
  - H3 : Transfert du redémarrage
  - H3 : Structure de réponse du plan de contrôle
  - H2 : Flux d’extraction Git
  - H3 : Sélection du canal
  - H3 : Étapes de mise à jour
  - H3 : Détails de synchronisation des Plugins
  - H2 : Voir aussi

## cli/voicecall.md

- Route : /cli/voicecall
- Titres :
  - H1 : openclaw voicecall
  - H2 : Sous-commandes
  - H2 : Configuration et test rapide
  - H3 : setup
  - H3 : smoke
  - H2 : Cycle de vie des appels
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
  - H2 : Voir aussi

## cli/webhooks.md

- Route : /cli/webhooks
- Titres :
  - H1 : openclaw webhooks
  - H2 : Sous-commandes
  - H2 : webhooks gmail setup
  - H3 : Obligatoire
  - H3 : Options Pub/Sub
  - H3 : Options de livraison OpenClaw
  - H3 : Options de gog watch serve
  - H3 : Exposition Tailscale
  - H3 : Sortie
  - H2 : webhooks gmail run
  - H2 : Voir aussi

## cli/wiki.md

- Route : /cli/wiki
- Titres :
  - H1 : openclaw wiki
  - H2 : Commandes courantes
  - H2 : Sélection de l’agent
  - H2 : Commandes
  - H3 : wiki status
  - H3 : wiki doctor
  - H3 : wiki init
  - H3 : wiki ingest &lt;path&gt;
  - H3 : wiki okf import &lt;path&gt;
  - H3 : wiki compile
  - H3 : wiki lint
  - H3 : wiki search &lt;query&gt;
  - H3 : wiki get &lt;lookup&gt;
  - H3 : wiki apply
  - H3 : wiki bridge import
  - H3 : wiki unsafe-local import
  - H3 : wiki chatgpt import
  - H3 : wiki chatgpt rollback &lt;run-id&gt;
  - H3 : wiki obsidian ...
  - H2 : Conseils pratiques d’utilisation
  - H2 : Liens avec la configuration
  - H2 : Voir aussi

## cli/workboard.md

- Route : /cli/workboard
- Titres :
  - H2 : Utilisation
  - H2 : list
  - H2 : create
  - H2 : show
  - H2 : dispatch
  - H2 : Parité avec les commandes slash
  - H2 : Autorisations
  - H2 : Dépannage
  - H3 : Aucune carte ne s’affiche
  - H3 : dispatch indique data-only
  - H3 : dispatch ne démarre rien
  - H2 : Voir aussi

## concepts/active-memory.md

- Route : /concepts/active-memory
- Titres :
  - H2 : Démarrage rapide
  - H2 : Fonctionnement
  - H2 : Moment de l’exécution
  - H3 : Types de sessions
  - H2 : Activation ou désactivation par session
  - H2 : Comment l’afficher
  - H2 : Modes de requête
  - H2 : Styles d’invite
  - H2 : Politique de modèle de secours
  - H3 : Recommandations de vitesse
  - H4 : Configuration de Cerebras
  - H2 : Outils de mémoire
  - H3 : memory-core intégré
  - H3 : Mémoire LanceDB
  - H3 : Lossless Claw
  - H2 : Mécanismes d’échappement avancés
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
  - H2 : Séquence d’exécution
  - H2 : Mise en file d’attente et concurrence
  - H2 : Préparation de la session et de l’espace de travail
  - H2 : Assemblage de l’invite
  - H2 : Hooks
  - H3 : Hooks internes (hooks du Gateway)
  - H3 : Hooks de Plugin
  - H2 : Diffusion en continu
  - H2 : Exécution des outils
  - H2 : Mise en forme de la réponse
  - H2 : Compaction et nouvelles tentatives
  - H2 : Flux d’événements
  - H2 : Gestion des canaux de discussion
  - H2 : Délais d’expiration
  - H3 : Diagnostic des sessions bloquées
  - H2 : Cas où l’exécution peut se terminer prématurément
  - H2 : Pages connexes

## concepts/agent-runtimes.md

- Route : /concepts/agent-runtimes
- Titres :
  - H2 : Surfaces Codex
  - H2 : Propriété de l’environnement d’exécution
  - H2 : Sélection de l’environnement d’exécution
  - H2 : Environnement d’exécution de l’agent GitHub Copilot
  - H2 : Contrat de compatibilité
  - H2 : Libellés d’état
  - H2 : Pages connexes

## concepts/agent-workspace.md

- Route : /concepts/agent-workspace
- Titres :
  - H2 : Emplacement par défaut
  - H2 : Dossiers supplémentaires de l’espace de travail
  - H2 : Carte des fichiers de l’espace de travail
  - H2 : Ce qui ne se trouve PAS dans l’espace de travail
  - H2 : Sauvegarde Git (recommandée, privée)
  - H2 : Ne validez pas de secrets
  - H2 : Déplacement de l’espace de travail vers une nouvelle machine
  - H2 : Notes avancées
  - H2 : Pages connexes

## concepts/agent.md

- Route : /concepts/agent
- Titres :
  - H2 : Espace de travail (requis)
  - H2 : Fichiers d’amorçage (injectés)
  - H2 : Outils intégrés
  - H2 : Skills
  - H2 : Limites de l’environnement d’exécution
  - H2 : Sessions
  - H2 : Pilotage pendant la diffusion en continu
  - H2 : Références de modèles
  - H2 : Configuration (minimale)
  - H2 : Pages connexes

## concepts/architecture.md

- Route : /concepts/architecture
- Titres :
  - H2 : Vue d’ensemble
  - H2 : Composants et flux
  - H3 : Gateway (démon)
  - H3 : Clients (application Mac / CLI / administration web)
  - H3 : Nodes (macOS / iOS / Android / sans interface)
  - H3 : WebChat
  - H2 : Cycle de vie de la connexion (client unique)
  - H2 : Protocole filaire (résumé)
  - H2 : Appairage et confiance locale
  - H2 : Typage du protocole et génération de code
  - H2 : Accès à distance
  - H2 : Instantané des opérations
  - H2 : Invariants
  - H2 : Pages connexes

## concepts/channel-docking.md

- Route : /concepts/channel-docking
- Titres :
  - H2 : Exemple
  - H2 : Pourquoi l’utiliser
  - H2 : Configuration requise
  - H2 : Commandes
  - H2 : Ce qui change
  - H2 : Ce qui ne change pas
  - H2 : Résolution des problèmes

## concepts/commitments.md

- Route : /concepts/commitments
- Titres :
  - H2 : Activer les engagements
  - H2 : Fonctionnement
  - H2 : Portée
  - H2 : Engagements ou rappels
  - H2 : Gérer les engagements
  - H2 : Confidentialité et coût
  - H2 : Résolution des problèmes
  - H2 : Pages connexes

## concepts/compaction.md

- Route : /concepts/compaction
- Titres :
  - H2 : Fonctionnement
  - H2 : Compaction automatique
  - H2 : Compaction manuelle
  - H2 : Configuration
  - H3 : Utilisation d’un autre modèle
  - H3 : Préservation des identifiants
  - H3 : Protection du nombre d’octets de la transcription active
  - H3 : Transcriptions successives
  - H3 : Notifications de Compaction
  - H3 : Vidage de la mémoire
  - H2 : Fournisseurs de Compaction enfichables
  - H2 : Compaction ou élagage
  - H2 : Résolution des problèmes
  - H2 : Pages connexes

## concepts/context-engine.md

- Route : /concepts/context-engine
- Titres :
  - H2 : Démarrage rapide
  - H2 : Fonctionnement
  - H3 : Cycle de vie du sous-agent (facultatif)
  - H3 : Ajout à l’invite système
  - H2 : Moteur historique
  - H2 : Moteurs de Plugin
  - H3 : Interface ContextEngine
  - H3 : Paramètres de l’environnement d’exécution
  - H3 : Exigences de l’hôte
  - H3 : Isolation des défaillances
  - H3 : ownsCompaction
  - H2 : Référence de configuration
  - H2 : Relation avec la Compaction et la mémoire
  - H2 : Conseils
  - H2 : Pages connexes

## concepts/context.md

- Route : /concepts/context
- Titres :
  - H2 : Démarrage rapide (inspecter le contexte)
  - H2 : Exemple de sortie
  - H3 : /context list
  - H3 : /context detail
  - H3 : /context map
  - H2 : Éléments comptabilisés dans la fenêtre de contexte
  - H2 : Construction de l’invite système par OpenClaw
  - H2 : Fichiers injectés dans l’espace de travail (contexte du projet)
  - H2 : Skills : injectés ou chargés à la demande
  - H2 : Outils : deux types de coûts
  - H2 : Commandes, directives et « raccourcis intégrés »
  - H2 : Sessions, Compaction et élagage (ce qui persiste)
  - H2 : Ce que rapporte réellement /context
  - H2 : Pages connexes

## concepts/delegate-architecture.md

- Route : /concepts/delegate-architecture
- Titres :
  - H2 : Définition d’un délégué
  - H2 : Pourquoi utiliser des délégués
  - H2 : Niveaux de capacités
  - H3 : Niveau 1 : lecture seule et brouillon
  - H3 : Niveau 2 : envoi pour le compte d’un utilisateur
  - H3 : Niveau 3 : proactif
  - H2 : Prérequis : isolation et renforcement
  - H3 : Blocages stricts (non négociables)
  - H3 : Restrictions des outils
  - H3 : Isolation du bac à sable
  - H3 : Piste d’audit
  - H2 : Configuration d’un délégué
  - H3 : 1. Créer l’agent délégué
  - H3 : 2. Configurer la délégation du fournisseur d’identité
  - H4 : Microsoft 365
  - H4 : Google Workspace
  - H3 : 3. Associer le délégué aux canaux
  - H3 : 4. Ajouter les identifiants à l’agent délégué
  - H2 : Exemple : assistant organisationnel
  - H2 : Modèle de mise à l’échelle
  - H2 : Pages connexes

## concepts/dreaming.md

- Route : /concepts/dreaming
- Titres :
  - H2 : Ce qu’écrit Dreaming
  - H2 : Modèle de phases
  - H2 : Ingestion des transcriptions de sessions
  - H2 : Journal des rêves
  - H2 : Signaux de classement approfondis
  - H3 : Couverture du rapport d’essai fantôme d’assurance qualité
  - H2 : Planification
  - H2 : Démarrage rapide
  - H2 : Commande oblique
  - H2 : Flux de travail CLI
  - H2 : Principales valeurs par défaut
  - H2 : Interface des rêves
  - H2 : Pages connexes

## concepts/experimental-features.md

- Route : /concepts/experimental-features
- Titres :
  - H2 : Indicateurs actuellement documentés
  - H2 : Mode allégé pour les modèles locaux
  - H3 : Pourquoi ces outils
  - H3 : Quand l’activer
  - H3 : Quand le laisser désactivé
  - H3 : Activation
  - H2 : Expérimental ne signifie pas masqué
  - H2 : Pages connexes

## concepts/features.md

- Route : /concepts/features
- Titres :
  - H2 : Points forts
  - H2 : Liste complète
  - H2 : Pages connexes

## concepts/managed-worktrees.md

- Route : /concepts/managed-worktrees
- Titres :
  - H2 : Disposition et noms
  - H2 : Provisionnement des fichiers ignorés
  - H2 : Exécution de la configuration du dépôt
  - H2 : Arbres de travail des sessions
  - H2 : Instantanés, nettoyage et restauration
  - H2 : CLI
  - H2 : Méthodes du Gateway
  - H2 : Espaces de travail du tableau de travail

## concepts/mantis-slack-desktop-runbook.md

- Route : /concepts/mantis-slack-desktop-runbook
- Titres :
  - H2 : Modèle de stockage
  - H2 : Déclenchement GitHub
  - H2 : CLI locale
  - H2 : Modes d’hydratation
  - H2 : Interprétation des durées
  - H2 : Liste de contrôle des preuves
  - H2 : Gestion des défaillances
  - H2 : Pages connexes

## concepts/mantis.md

- Route : /concepts/mantis
- Titres :
  - H2 : Propriété
  - H2 : Commandes CLI
  - H3 : discord-smoke
  - H3 : run
  - H3 : desktop-browser-smoke
  - H3 : slack-desktop-smoke
  - H3 : telegram-desktop-builder
  - H2 : Manifeste des preuves
  - H2 : Automatisation GitHub
  - H2 : Machines et secrets
  - H2 : Résultats des exécutions
  - H2 : Ajout d’un scénario
  - H2 : Questions ouvertes

## concepts/markdown-formatting.md

- Route : /concepts/markdown-formatting
- Titres :
  - H2 : Pipeline
  - H2 : Exemple de représentation intermédiaire
  - H2 : Gestion des tableaux
  - H2 : Règles de découpage
  - H2 : Politique relative aux liens
  - H2 : Contenu masqué
  - H2 : Ajout ou mise à jour du formateur d’un canal
  - H2 : Pièges courants
  - H2 : Pages connexes

## concepts/memory-builtin.md

- Route : /concepts/memory-builtin
- Titres :
  - H2 : Fonctionnalités fournies
  - H2 : Prise en main
  - H2 : Fournisseurs d’incorporations pris en charge
  - H2 : Fonctionnement de l’indexation
  - H2 : Quand l’utiliser
  - H2 : Résolution des problèmes
  - H2 : Configuration
  - H2 : Pages connexes

## concepts/memory-honcho.md

- Route : /concepts/memory-honcho
- Titres :
  - H2 : Fonctionnalités fournies
  - H2 : Outils disponibles
  - H2 : Prise en main
  - H2 : Configuration
  - H2 : Migration de la mémoire existante
  - H2 : Fonctionnement
  - H2 : Honcho ou mémoire intégrée
  - H2 : Commandes CLI
  - H2 : Pour aller plus loin
  - H2 : Pages connexes

## concepts/memory-qmd.md

- Route : /concepts/memory-qmd
- Titres :
  - H2 : Fonctionnalités supplémentaires par rapport à la mémoire intégrée
  - H2 : Prise en main
  - H3 : Prérequis
  - H3 : Activation
  - H2 : Fonctionnement du processus auxiliaire
  - H2 : Performances de recherche et compatibilité
  - H2 : Remplacements de modèles
  - H2 : Indexation de chemins supplémentaires
  - H2 : Indexation des transcriptions de sessions
  - H2 : Portée de la recherche
  - H2 : Citations
  - H2 : Quand l’utiliser
  - H2 : Résolution des problèmes
  - H2 : Configuration
  - H2 : Pages connexes

## concepts/memory-search.md

- Route : /concepts/memory-search
- Titres :
  - H2 : Démarrage rapide
  - H2 : Fournisseurs pris en charge
  - H2 : Fonctionnement de la recherche
  - H2 : Amélioration de la qualité de la recherche
  - H3 : Décroissance temporelle
  - H3 : MMR (diversité)
  - H3 : Activer les deux
  - H2 : Mémoire multimodale
  - H2 : Recherche dans la mémoire des sessions
  - H2 : Résolution des problèmes
  - H2 : Pages connexes

## concepts/memory.md

- Route : /concepts/memory
- Titres :
  - H2 : Fonctionnement
  - H2 : Emplacement de chaque élément
  - H2 : Souvenirs sensibles aux actions
  - H2 : Engagements déduits
  - H2 : Outils de mémoire
  - H2 : Recherche dans la mémoire
  - H2 : Moteurs de stockage de la mémoire
  - H2 : Couche wiki de connaissances
  - H2 : Vidage automatique de la mémoire
  - H2 : Dreaming
  - H2 : Rétroremplissage étayé et promotion en direct
  - H2 : CLI
  - H2 : Pour aller plus loin

## concepts/message-lifecycle-refactor.md

- Route : /concepts/message-lifecycle-refactor
- Titres :
  - H2 : Raisons de cette refactorisation
  - H2 : Fonctionnalités livrées
  - H3 : Contexte d’envoi
  - H3 : Contexte de réception
  - H3 : Aperçu en direct
  - H3 : Accusés de réception persistants
  - H3 : Réduction du SDK public
  - H2 : Écarts entre l’implémentation et la conception d’origine
  - H2 : Risques concrets liés à la migration (toujours pertinents)
  - H2 : Classification des défaillances
  - H2 : Questions ouvertes
  - H2 : Pages connexes

## concepts/messages.md

- Route : /concepts/messages
- Titres :
  - H2 : Déduplication des messages entrants
  - H2 : Temporisation des messages entrants
  - H2 : Sessions et appareils
  - H2 : Corps des invites et contexte de l’historique
  - H2 : Métadonnées des résultats d’outils
  - H2 : Mise en file d’attente et suivis
  - H2 : Propriété de l’exécution du canal
  - H2 : Diffusion en continu, découpage et traitement par lots
  - H2 : Visibilité du raisonnement et jetons
  - H2 : Préfixes, fils de discussion et réponses
  - H2 : Réponses silencieuses
  - H2 : Pages connexes

## concepts/model-failover.md

- Route : /concepts/model-failover
- Titres :
  - H2 : Flux de l’environnement d’exécution
  - H2 : Politique de source de sélection
  - H2 : Cache d’exclusion après un échec d’authentification
  - H2 : Notifications de recours visibles par l’utilisateur
  - H2 : Stockage de l’authentification (clés + OAuth)
  - H2 : Identifiants de profils
  - H2 : Ordre de rotation
  - H3 : Persistance au sein d’une session (favorable au cache)
  - H3 : Abonnement OpenAI Codex avec clé API de secours
  - H2 : Délais de récupération
  - H2 : Désactivations pour facturation
  - H2 : Modèle de secours
  - H3 : Règles de la chaîne de candidats
  - H3 : Erreurs qui déclenchent le recours au candidat suivant
  - H3 : Ignorer pendant le délai de récupération ou effectuer une sonde
  - H2 : Remplacements par session et changement de modèle en direct
  - H2 : Observabilité et résumés des défaillances
  - H2 : Configuration associée

## concepts/model-providers.md

- Route : /concepts/model-providers
- Titres :
  - H2 : Règles rapides
  - H2 : Comportement du fournisseur appartenant au Plugin
  - H2 : Rotation des clés API
  - H2 : Plugins de fournisseurs officiels
  - H3 : OpenAI
  - H3 : Anthropic
  - H3 : OAuth OpenAI ChatGPT/Codex
  - H3 : Autres options hébergées sur abonnement
  - H3 : OpenCode
  - H3 : Google Gemini (clé API)
  - H3 : Google Vertex et Gemini CLI
  - H3 : Z.AI (GLM)
  - H3 : Vercel AI Gateway
  - H3 : Autres Plugins de fournisseurs intégrés
  - H4 : Particularités à connaître
  - H2 : Fournisseurs via models.providers (URL personnalisée/de base)
  - H3 : Moonshot AI (Kimi)
  - H3 : Kimi Coding
  - H3 : Volcano Engine (Doubao)
  - H3 : BytePlus (International)
  - H3 : Synthetic
  - H3 : MiniMax
  - H3 : LM Studio
  - H3 : Ollama
  - H3 : vLLM
  - H3 : SGLang
  - H3 : Serveurs mandataires locaux (LM Studio, vLLM, LiteLLM, etc.)
  - H2 : Exemples de CLI
  - H2 : Pages connexes

## concepts/models.md

- Route : /concepts/models
- Titres :
  - H2 : Ordre de sélection
  - H2 : Source de sélection et rigueur du recours
  - H2 : Politique rapide relative aux modèles
  - H2 : Intégration initiale
  - H2 : « Le modèle n’est pas autorisé » (et pourquoi les réponses s’arrêtent)
  - H2 : /model dans la discussion
  - H2 : CLI
  - H2 : Registre des modèles (models.json)
  - H2 : Pages connexes

## concepts/multi-agent.md

- Route : /concepts/multi-agent
- Titres :
  - H2 : Qu’est-ce qu’un agent
  - H2 : Chemins
  - H3 : Mode agent unique (par défaut)
  - H2 : Assistant d’agent
  - H2 : Démarrage rapide
  - H2 : Plusieurs agents, plusieurs personnalités
  - H2 : Coffres Memory Wiki propres à chaque agent
  - H2 : Recherche de mémoire QMD inter-agents
  - H2 : Un numéro WhatsApp, plusieurs personnes (séparation des messages privés)
  - H2 : Règles de routage
  - H2 : Plusieurs comptes / numéros de téléphone
  - H2 : Concepts
  - H2 : Exemples de plateformes
  - H2 : Modèles courants
  - H2 : Configuration du bac à sable et des outils par agent
  - H2 : Voir aussi

## concepts/oauth.md

- Route : /concepts/oauth
- Titres :
  - H2 : Le récepteur de jetons (pourquoi il existe)
  - H2 : Stockage (où résident les jetons)
  - H2 : Réutilisation de la CLI Anthropic Claude
  - H2 : Échange OAuth (fonctionnement de la connexion)
  - H3 : Jeton de configuration Anthropic
  - H3 : OpenAI Codex (OAuth ChatGPT)
  - H2 : Actualisation + expiration
  - H2 : Plusieurs comptes (profils) + routage
  - H3 : 1) Recommandé : agents distincts
  - H3 : 2) Avancé : plusieurs profils dans un même agent
  - H2 : Voir aussi

## concepts/parallel-specialist-lanes.md

- Route : /concepts/parallel-specialist-lanes
- Titres :
  - H2 : Principes fondamentaux
  - H2 : Déploiement recommandé
  - H3 : Phase 1 : contrats des files + tâches lourdes en arrière-plan
  - H3 : Phase 2 : contrôles de priorité et de concurrence
  - H3 : Phase 3 : coordinateur / contrôleur de trafic
  - H2 : Modèle minimal de contrat de file
  - H2 : Voir aussi

## concepts/personal-agent-benchmark-pack.md

- Route : /concepts/personal-agent-benchmark-pack
- Titres :
  - H2 : Scénarios
  - H2 : Modèle de confidentialité
  - H2 : Extension du pack

## concepts/presence.md

- Route : /concepts/presence
- Titres :
  - H2 : Champs de présence (ce qui est affiché)
  - H2 : Producteurs (origine de la présence)
  - H3 : 1) Entrée propre au Gateway
  - H3 : 2) Connexion WebSocket
  - H4 : Pourquoi les connexions éphémères du plan de contrôle ne sont pas affichées
  - H3 : 3) Balises system-event
  - H3 : 4) Connexions de Node (rôle : node)
  - H2 : Règles de fusion + déduplication (pourquoi instanceId est important)
  - H2 : TTL et taille limitée
  - H2 : Mise en garde concernant les connexions distantes/tunnels (adresses IP de bouclage)
  - H2 : Consommateurs
  - H3 : Page Appareils de l’interface de contrôle
  - H3 : Onglet Instances de macOS
  - H2 : Conseils de débogage
  - H2 : Voir aussi

## concepts/progress-drafts.md

- Route : /concepts/progress-drafts
- Titres :
  - H2 : Démarrage rapide
  - H2 : Ce que voient les utilisateurs
  - H2 : Choisir un mode
  - H2 : Configurer les libellés
  - H2 : Contrôler les lignes de progression
  - H3 : Mode détaillé
  - H3 : Texte de commande/d’exécution
  - H3 : File de commentaires
  - H3 : État commenté
  - H3 : Limites de lignes
  - H3 : Rendu enrichi (Slack)
  - H3 : Masquer les lignes d’outils/de tâches
  - H2 : Comportement des canaux
  - H2 : Finalisation
  - H2 : Dépannage
  - H2 : Voir aussi

## concepts/qa-e2e-automation.md

- Route : /concepts/qa-e2e-automation
- Titres :
  - H2 : Surface de commande
  - H3 : Exécution QA reposant sur un profil
  - H2 : Flux opérateur
  - H3 : Tests rapides d’observabilité
  - H3 : Files de tests rapides Matrix
  - H3 : Scénarios Discord Mantis
  - H3 : Exécuteurs Mantis pour le bureau Slack et les tâches visuelles
  - H3 : Vérification de l’état du pool d’identifiants
  - H2 : Couverture des transports en conditions réelles
  - H2 : Référence QA pour Discord, Slack, Telegram et WhatsApp
  - H3 : Options CLI communes
  - H3 : QA Telegram
  - H3 : QA Discord
  - H3 : QA Slack
  - H4 : Configuration de l’espace de travail Slack
  - H3 : QA WhatsApp
  - H3 : Pool d’identifiants Convex
  - H2 : Données initiales issues du dépôt
  - H2 : Files de fournisseurs simulés
  - H2 : Adaptateurs de transport
  - H3 : Ajout d’un canal
  - H3 : Noms des assistants de scénario
  - H2 : Rapports
  - H2 : Documentation associée

## concepts/qa-matrix.md

- Route : /concepts/qa-matrix
- Titres :
  - H2 : Démarrage rapide
  - H2 : Fonctionnement de la file
  - H2 : CLI
  - H3 : Options communes
  - H3 : Options des fournisseurs
  - H2 : Profils
  - H2 : Scénarios
  - H2 : Variables d’environnement
  - H2 : Artefacts de sortie
  - H2 : Conseils de diagnostic
  - H2 : Contrat de transport en conditions réelles
  - H2 : Voir aussi

## concepts/queue-steering.md

- Route : /concepts/queue-steering
- Titres :
  - H2 : Limite d’exécution
  - H2 : Modes
  - H2 : Exemple de rafale
  - H2 : Portée
  - H2 : Temporisation
  - H2 : Voir aussi

## concepts/queue.md

- Route : /concepts/queue
- Titres :
  - H2 : Pourquoi
  - H2 : Fonctionnement
  - H2 : Valeurs par défaut
  - H2 : Modes de file d’attente
  - H2 : Options de file d’attente
  - H2 : Pilotage et diffusion en continu
  - H2 : Priorité
  - H2 : Remplacements propres à chaque session
  - H2 : Annulation des tours en attente
  - H2 : Portée et garanties
  - H2 : Dépannage
  - H2 : Voir aussi

## concepts/retry.md

- Route : /concepts/retry
- Titres :
  - H2 : Objectifs
  - H2 : Valeurs par défaut
  - H2 : Comportement
  - H3 : Fournisseurs de modèles
  - H3 : Discord
  - H3 : Telegram
  - H2 : Configuration
  - H2 : Remarques
  - H2 : Voir aussi

## concepts/session-pruning.md

- Route : /concepts/session-pruning
- Titres :
  - H2 : Pourquoi c’est important
  - H2 : Fonctionnement
  - H2 : Nettoyage des images héritées
  - H2 : Valeurs par défaut intelligentes
  - H2 : Activer ou désactiver
  - H2 : Élagage ou Compaction
  - H2 : Pour aller plus loin
  - H2 : Voir aussi

## concepts/session-search.md

- Route : /concepts/session-search
- Titres :
  - H1 : Recherche de sessions
  - H2 : Visibilité et sortie
  - H2 : Cycle de vie de l’index
  - H2 : Recherche de sessions ou recherche en mémoire

## concepts/session-tool.md

- Route : /concepts/session-tool
- Titres :
  - H2 : Outils disponibles
  - H2 : Répertorier et lire les sessions
  - H2 : Envoyer des messages entre sessions
  - H2 : Assistants d’état et d’orchestration
  - H2 : Modifications de l’état des sessions
  - H2 : Création de sous-agents
  - H2 : Visibilité
  - H2 : Pour aller plus loin
  - H2 : Voir aussi

## concepts/session.md

- Route : /concepts/session
- Titres :
  - H2 : Routage des messages
  - H2 : Isolation des messages privés
  - H3 : Canaux liés au Dock
  - H2 : Cycle de vie des sessions
  - H2 : Emplacement de l’état
  - H2 : Maintenance des sessions
  - H2 : Inspection des sessions
  - H2 : Pour aller plus loin
  - H2 : Voir aussi

## concepts/soul.md

- Route : /concepts/soul
- Titres :
  - H2 : Ce qui doit figurer dans SOUL.md
  - H2 : Pourquoi cela fonctionne
  - H2 : Le prompt Molty
  - H2 : À quoi ressemble un bon résultat
  - H2 : Un avertissement
  - H2 : Voir aussi

## concepts/streaming.md

- Route : /concepts/streaming
- Titres :
  - H2 : Diffusion par blocs (messages de canal)
  - H3 : Livraison des médias avec la diffusion par blocs
  - H2 : Algorithme de découpage (limites basse/haute)
  - H2 : Regroupement (fusionner les blocs diffusés)
  - H2 : Rythme similaire à celui d’un humain entre les blocs
  - H2 : « Diffuser les fragments ou l’ensemble »
  - H2 : Modes de diffusion des aperçus
  - H3 : Mappage des canaux
  - H3 : Migration des clés héritées
  - H2 : Comportement à l’exécution
  - H3 : Telegram
  - H3 : Discord
  - H3 : Slack
  - H3 : Mattermost
  - H3 : Matrix
  - H2 : Mises à jour de l’aperçu de progression des outils
  - H2 : Rendu du brouillon de progression
  - H3 : File de progression des commentaires
  - H2 : Voir aussi

## concepts/system-prompt.md

- Route : /concepts/system-prompt
- Titres :
  - H2 : Structure
  - H2 : Modes de prompt
  - H2 : Instantanés de prompt
  - H2 : Injection de l’amorçage de l’espace de travail
  - H2 : Gestion du temps
  - H2 : Skills
  - H2 : Documentation
  - H2 : Voir aussi

## concepts/timezone.md

- Route : /concepts/timezone
- Titres :
  - H2 : Trois surfaces de fuseau horaire
  - H2 : Définition du fuseau horaire de l’utilisateur
  - H2 : Valeurs de fuseau horaire des enveloppes
  - H2 : Quand remplacer la valeur
  - H2 : Voir aussi

## concepts/typebox.md

- Route : /concepts/typebox
- Titres :
  - H2 : Modèle mental (30 secondes)
  - H2 : Emplacement des schémas
  - H2 : Pipeline actuel
  - H2 : Utilisation des schémas à l’exécution
  - H2 : Exemples de trames
  - H2 : Client minimal (Node.js)
  - H2 : Exemple détaillé : ajouter une méthode de bout en bout
  - H2 : Comportement de la génération de code Swift
  - H2 : Gestion des versions et compatibilité
  - H2 : Modèles et conventions de schémas
  - H2 : JSON du schéma en direct
  - H2 : Lorsque vous modifiez les schémas
  - H2 : Voir aussi

## concepts/typing-indicators.md

- Route : /concepts/typing-indicators
- Titres :
  - H2 : Valeurs par défaut
  - H2 : Modes
  - H2 : Configuration
  - H2 : Remarques
  - H2 : Voir aussi

## concepts/usage-tracking.md

- Route : /concepts/usage-tracking
- Titres :
  - H2 : Présentation
  - H2 : Où cela apparaît
  - H2 : Historique des coûts Anthropic et OpenAI
  - H2 : Mode par défaut du pied de page d’utilisation
  - H3 : Trois états de session distincts
  - H3 : Priorité
  - H3 : Réinitialiser ou désactiver
  - H3 : Comportement du bouton d’activation
  - H3 : Configuration
  - H2 : Pied de page personnalisé complet de /usage
  - H3 : Structure
  - H3 : Chemins du contrat
  - H3 : Verbes
  - H3 : Formes des éléments
  - H3 : Exemple
  - H2 : Fournisseurs + identifiants
  - H2 : Voir aussi

## date-time.md

- Route : /date-time
- Titres :
  - H2 : Enveloppes de messages (locales par défaut)
  - H3 : Exemples
  - H2 : Prompt système : date et heure actuelles
  - H2 : Lignes d’événements système (locales par défaut)
  - H3 : Configurer le fuseau horaire et le format de l’utilisateur
  - H2 : Détection du format horaire (automatique)
  - H2 : Charges utiles des outils + connecteurs (heure brute du fournisseur + champs normalisés)
  - H2 : Documentation associée

## debug/node-issue.md

- Route : /debug/node-issue
- Titres :
  - H1 : Plantage de Node + tsx « \\name n’est pas une fonction »
  - H2 : État
  - H2 : Symptôme initial
  - H2 : Cause
  - H2 : Vérification actuelle de la reproduction
  - H2 : Solutions de contournement (si le plantage réapparaît)
  - H2 : Références
  - H2 : Voir aussi

## diagnostics/flags.md

- Route : /diagnostics/flags
- Titres :
  - H2 : Fonctionnement
  - H2 : Indicateurs connus
  - H2 : Activer par la configuration
  - H2 : Remplacement par variable d’environnement (ponctuel)
  - H2 : Indicateurs du profileur
  - H2 : Artefacts de chronologie
  - H2 : Emplacement des journaux
  - H2 : Extraire les journaux
  - H2 : Remarques
  - H2 : Voir aussi

## gateway/audit.md

- Route : /gateway/audit
- Titres :
  - H1 : Historique d’audit
  - H2 : Familles d’enregistrements
  - H2 : Événements du cycle de vie des messages
  - H3 : Classification du type de conversation
  - H2 : Modèle de confidentialité
  - H2 : Limites de couverture et de preuve
  - H2 : Stockage, conservation et migration
  - H2 : Interrogation
  - H2 : Voir aussi

## gateway/authentication.md

- Route : /gateway/authentication
- Titres :
  - H2 : Configuration recommandée : clé API (tout fournisseur)
  - H2 : Anthropic : réutilisation de la CLI Claude
  - H2 : Saisie manuelle du jeton
  - H3 : Identifiants reposant sur SecretRef
  - H2 : Vérification de l’état d’authentification du modèle
  - H2 : Rotation de la clé API (Gateway)
  - H2 : Suppression de l’authentification du fournisseur pendant l’exécution du Gateway
  - H2 : Contrôle de l’identifiant utilisé
  - H3 : OpenAI et identifiants openai-codex hérités
  - H3 : Pendant la connexion (CLI)
  - H3 : Par session (commande de discussion)
  - H3 : Par agent (remplacement par la CLI)
  - H2 : Dépannage
  - H3 : « Aucun identifiant trouvé »
  - H3 : Jeton en cours d’expiration/expiré
  - H2 : Voir aussi

## gateway/background-process.md

- Route : /gateway/background-process
- Titres :
  - H2 : Outil exec
  - H3 : Remplacements par variables d’environnement
  - H3 : Configuration (préférable aux remplacements par variables d’environnement)
  - H2 : Pontage des processus enfants
  - H2 : Outil process
  - H2 : Exemples
  - H2 : Voir aussi

## gateway/bonjour.md

- Route : /gateway/bonjour
- Titres :
  - H2 : Bonjour étendu (DNS-SD monodiffusion) via Tailscale
  - H3 : Configuration du Gateway
  - H3 : Configuration ponctuelle du serveur DNS (hôte du Gateway, macOS uniquement)
  - H3 : Paramètres DNS de Tailscale
  - H3 : Sécurité de l’écouteur du Gateway
  - H2 : Ce qui est annoncé
  - H2 : Types de services
  - H2 : Clés TXT (indications non secrètes)
  - H2 : Débogage sur macOS
  - H2 : Débogage dans les journaux du Gateway
  - H2 : Débogage sur le Node iOS
  - H2 : Quand activer Bonjour
  - H2 : Quand désactiver Bonjour
  - H2 : Pièges de Docker
  - H2 : Dépannage lorsque Bonjour est désactivé
  - H2 : Modes d’échec courants
  - H2 : Noms d’instances échappés (\032)
  - H2 : Activation / désactivation / configuration
  - H2 : Documentation associée

## gateway/bridge-protocol.md

- Route : /gateway/bridge-protocol
- Titres :
  - H2 : Pourquoi il existait
  - H2 : Transport
  - H2 : Négociation et appairage
  - H2 : Trames
  - H2 : Événements du cycle de vie d’exécution
  - H2 : Utilisation historique du réseau privé
  - H2 : Gestion des versions
  - H2 : Voir aussi

## gateway/cli-backends.md

- Route : /gateway/cli-backends
- Titres :
  - H2 : Démarrage rapide
  - H2 : Utilisation comme solution de repli
  - H2 : Configuration
  - H2 : Fonctionnement
  - H3 : Spécificités de la CLI Claude
  - H2 : Sessions
  - H2 : Préambule de repli provenant des sessions claude-cli
  - H2 : Images
  - H2 : Entrées et sorties
  - H2 : Valeurs par défaut détenues par le Plugin
  - H2 : Surcouches de transformation du texte
  - H2 : Propriété de la Compaction native
  - H2 : Surcouches MCP du bundle
  - H2 : Limite de l’historique de réinitialisation
  - H2 : Limites
  - H2 : Dépannage
  - H2 : Voir aussi

## gateway/config-agents.md

- Route : /gateway/config-agents
- Titres :
  - H2 : Valeurs par défaut des agents
  - H3 : agents.defaults.workspace
  - H3 : agents.defaults.repoRoot
  - H3 : agents.defaults.skills
  - H3 : agents.defaults.skipBootstrap
  - H3 : agents.defaults.skipOptionalBootstrapFiles
  - H3 : agents.defaults.contextInjection
  - H3 : agents.defaults.bootstrapMaxChars
  - H3 : agents.defaults.bootstrapTotalMaxChars
  - H3 : Remplacements du profil d’amorçage par agent
  - H3 : agents.defaults.bootstrapPromptTruncationWarning
  - H3 : Carte de propriété du budget de contexte
  - H4 : agents.defaults.startupContext
  - H4 : agents.defaults.contextLimits
  - H4 : agents.list[].contextLimits
  - H4 : skills.limits.maxSkillsPromptChars
  - H4 : agents.list[].skillsLimits.maxSkillsPromptChars
  - H3 : agents.defaults.imageMaxDimensionPx
  - H3 : agents.defaults.imageQuality
  - H3 : agents.defaults.userTimezone
  - H3 : agents.defaults.timeFormat
  - H3 : agents.defaults.model
  - H3 : Politique d’exécution
  - H3 : agents.defaults.cliBackends
  - H3 : agents.defaults.promptOverlays
  - H3 : agents.defaults.heartbeat
  - H3 : agents.defaults.compaction
  - H3 : agents.defaults.runRetries
  - H3 : agents.defaults.contextPruning
  - H3 : Diffusion par blocs
  - H3 : Indicateurs de saisie
  - H3 : agents.defaults.sandbox
  - H3 : agents.list (remplacements par agent)
  - H2 : Routage multi-agent
  - H3 : Champs de correspondance des liaisons
  - H3 : Profils d’accès par agent
  - H2 : Session
  - H2 : Messages
  - H3 : Préfixe de réponse
  - H3 : Réaction d’accusé de réception
  - H3 : File d’attente
  - H3 : Anti-rebond des messages entrants
  - H3 : Autres clés de message
  - H3 : TTS (synthèse vocale)
  - H2 : Conversation
  - H2 : Voir aussi

## gateway/config-channels.md

- Route : /gateway/config-channels
- Titres :
  - H2 : Canaux
  - H3 : Accès aux messages privés et aux groupes
  - H3 : Remplacements du modèle par canal
  - H3 : Valeurs par défaut des canaux et Heartbeat
  - H3 : WhatsApp
  - H3 : Telegram
  - H3 : Discord
  - H3 : Google Chat
  - H3 : Slack
  - H3 : Mattermost
  - H3 : Signal
  - H3 : iMessage
  - H3 : Matrix
  - H3 : Microsoft Teams
  - H3 : IRC
  - H3 : Multicompte (tous les canaux)
  - H3 : Autres canaux de Plugin
  - H3 : Filtrage des mentions dans les conversations de groupe
  - H4 : Limites de l’historique des messages privés
  - H4 : Mode de conversation avec soi-même
  - H3 : Commandes (gestion des commandes de conversation)
  - H2 : Voir aussi

## gateway/config-tools.md

- Route : /gateway/config-tools
- Titres :
  - H2 : Outils
  - H3 : Profils d’outils
  - H3 : Groupes d’outils
  - H3 : Outils MCP et de Plugin dans la politique des outils de la sandbox
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
  - H3 : Détails des champs du fournisseur
  - H3 : Exemples de fournisseurs
  - H2 : Voir aussi

## gateway/configuration-examples.md

- Route : /gateway/configuration-examples
- Titres :
  - H2 : Démarrage rapide
  - H3 : Minimum absolu
  - H3 : Configuration initiale recommandée
  - H2 : Exemple étendu (options principales)
  - H3 : Dépôt de Skills frère lié symboliquement
  - H2 : Modèles courants
  - H3 : Base de Skills partagée avec un remplacement
  - H3 : Configuration multiplateforme
  - H3 : Approbation automatique du réseau de Nodes de confiance
  - H3 : Mode de messages privés sécurisé (boîte de réception partagée / messages privés multi-utilisateurs)
  - H3 : Clé API Anthropic avec MiniMax comme solution de repli
  - H3 : Bot professionnel (accès restreint)
  - H3 : Modèles locaux uniquement
  - H2 : Conseils
  - H2 : Voir aussi

## gateway/configuration-reference.md

- Route : /gateway/configuration-reference
- Titres :
  - H2 : Canaux
  - H2 : Valeurs par défaut des agents, multi-agent, sessions et messages
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
  - H3 : Points de terminaison compatibles avec OpenAI
  - H3 : Isolation multi-instance
  - H3 : gateway.tls
  - H3 : gateway.reload
  - H2 : Environnements d’exécution cloud
  - H3 : Profil Crabbox
  - H3 : Profil de développement SSH statique
  - H2 : Hooks
  - H3 : Intégration Gmail
  - H2 : Hôte du Plugin Canvas
  - H2 : Découverte
  - H3 : mDNS (Bonjour)
  - H3 : Réseau étendu (DNS-SD)
  - H2 : Environnement
  - H3 : env (variables d’environnement intégrées)
  - H3 : Substitution des variables d’environnement
  - H2 : Secrets
  - H3 : SecretRef
  - H3 : Surface d’identifiants prise en charge
  - H3 : Configuration des fournisseurs de secrets
  - H2 : Stockage de l’authentification
  - H3 : auth.cooldowns
  - H2 : Audit
  - H2 : Journalisation
  - H2 : Diagnostics
  - H2 : Mise à jour
  - H2 : ACP
  - H2 : CLI
  - H2 : Assistant
  - H2 : Identité
  - H2 : Pont (ancien, supprimé)
  - H2 : Cron
  - H3 : cron.retry
  - H3 : cron.failureAlert
  - H3 : cron.failureDestination
  - H2 : Variables de modèle pour les médias
  - H2 : Inclusions de configuration ($include)
  - H2 : Voir aussi

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
  - H2 : Voir aussi

## gateway/diagnostics.md

- Route : /gateway/diagnostics
- Titres :
  - H2 : Démarrage rapide
  - H2 : Commande de conversation
  - H2 : Contenu de l’exportation
  - H2 : Modèle de confidentialité
  - H2 : Enregistreur de stabilité
  - H2 : Options utiles
  - H2 : Désactiver les diagnostics
  - H2 : Voir aussi

## gateway/discovery.md

- Route : /gateway/discovery
- Titres :
  - H2 : Termes
  - H2 : Pourquoi les connexions directe et SSH coexistent
  - H2 : Sources de découverte
  - H3 : 1) Bonjour / DNS-SD
  - H4 : Détails de la balise de service
  - H3 : 2) Tailnet (interréseau)
  - H3 : 3) Cible manuelle / SSH
  - H2 : Sélection du transport (politique du client)
  - H2 : Appairage et authentification (transport direct)
  - H2 : Responsabilités par composant
  - H2 : Voir aussi

## gateway/doctor.md

- Route : /gateway/doctor
- Titres :
  - H2 : Démarrage rapide
  - H3 : Modes sans interface et d’automatisation
  - H2 : Mode de lint en lecture seule
  - H2 : Fonctionnement (résumé)
  - H2 : Rétroremplissage et réinitialisation de l’interface Dreams
  - H2 : Comportement détaillé et justification
  - H2 : Voir aussi

## gateway/external-apps.md

- Route : /gateway/external-apps
- Titres :
  - H2 : Ce qui est disponible aujourd’hui
  - H2 : Approche recommandée
  - H2 : Suspension coopérative de l’hôte
  - H2 : Code de l’application et code du Plugin
  - H2 : Voir aussi

## gateway/gateway-lock.md

- Route : /gateway/gateway-lock
- Titres :
  - H2 : Pourquoi
  - H2 : Deux couches
  - H3 : Verrouillage de fichier
  - H3 : Liaison du socket
  - H2 : Notes opérationnelles
  - H2 : Voir aussi

## gateway/health.md

- Route : /gateway/health
- Titres :
  - H2 : Vérifications rapides
  - H2 : Diagnostics approfondis
  - H2 : Configuration du moniteur d’état
  - H2 : Surveillance de la disponibilité
  - H3 : Exemples de configuration d’un service de surveillance
  - H2 : En cas d’échec
  - H2 : Commande « health » dédiée
  - H2 : Voir aussi

## gateway/heartbeat.md

- Route : /gateway/heartbeat
- Titres :
  - H2 : Démarrage rapide (débutant)
  - H2 : Valeurs par défaut
  - H2 : Rôle de l’invite Heartbeat
  - H2 : Contrat de réponse
  - H2 : Configuration
  - H3 : Portée et priorité
  - H3 : Heartbeats par agent
  - H3 : Exemple d’heures actives
  - H3 : Configuration 24/7
  - H3 : Exemple multicompte
  - H3 : Notes sur les champs
  - H2 : Comportement de livraison
  - H2 : Contrôles de visibilité
  - H3 : Rôle de chaque indicateur
  - H3 : Exemples par canal et par compte
  - H3 : Modèles courants
  - H2 : HEARTBEAT.md (facultatif)
  - H3 : Blocs tasks:
  - H3 : L’agent peut-il mettre à jour HEARTBEAT.md ?
  - H2 : Réveil manuel (à la demande)
  - H2 : Livraison du raisonnement (facultatif)
  - H2 : Maîtrise des coûts
  - H2 : Dépassement du contexte après le Heartbeat
  - H2 : Voir aussi

## gateway/index.md

- Route : /gateway
- Titres :
  - H2 : Démarrage local en 5 minutes
  - H2 : Modèle d’exécution
  - H2 : Points de terminaison compatibles avec OpenAI
  - H3 : Priorité du port et de la liaison
  - H3 : Modes de rechargement à chaud
  - H2 : Jeu de commandes de l’opérateur
  - H2 : Plusieurs Gateways (même hôte)
  - H2 : Accès distant
  - H2 : Supervision et cycle de vie du service
  - H2 : Parcours rapide du profil de développement
  - H2 : Référence rapide du protocole (vue de l’opérateur)
  - H2 : Vérifications opérationnelles
  - H3 : Vivacité
  - H3 : Disponibilité
  - H3 : Récupération des lacunes
  - H2 : Signatures d’échec courantes
  - H2 : Garanties de sécurité
  - H2 : Voir aussi

## gateway/local-model-services.md

- Route : /gateway/local-model-services
- Titres :
  - H2 : Fonctionnement
  - H2 : Structure de la configuration
  - H2 : Champs
  - H2 : Exemple Inferrs
  - H2 : Exemple ds4
  - H2 : Voir aussi

## gateway/local-models.md

- Route : /gateway/local-models
- Titres :
  - H2 : Configuration matérielle minimale
  - H2 : Choisir un backend
  - H2 : LM Studio avec un grand modèle local (API Responses)
  - H3 : Configuration hybride : principal hébergé, solution de repli locale
  - H3 : Hébergement régional / routage des données
  - H2 : Autres proxys locaux compatibles avec OpenAI
  - H2 : Backends plus petits ou plus stricts
  - H2 : Résolution des problèmes
  - H2 : Voir aussi

## gateway/logging.md

- Route : /gateway/logging
- Titres :
  - H1 : Journalisation
  - H2 : Journaliseur basé sur des fichiers
  - H3 : Mode détaillé et niveaux de journalisation
  - H2 : Capture de la console
  - H2 : Masquage
  - H2 : Journaux WebSocket du Gateway
  - H3 : Style des journaux WS
  - H2 : Mise en forme de la console (journalisation des sous-systèmes)
  - H2 : Voir aussi

## gateway/multi-tenant-hosting.md

- Route : /gateway/multi-tenant-hosting
- Titres :
  - H1 : Hébergement mutualisé
  - H2 : Pourquoi chaque locataire a besoin d’une cellule
  - H2 : Architecture
  - H2 : Frontière de confiance
  - H2 : Échelle d’isolation
  - H2 : Démarrage rapide
  - H2 : Reporté après le MVP
  - H2 : Voir aussi

## gateway/multiple-gateways.md

- Route : /gateway/multiple-gateways
- Titres :
  - H2 : Démarrage rapide du bot de secours
  - H3 : Modifications apportées par --profile rescue onboard
  - H2 : Configuration générale de plusieurs Gateways
  - H2 : Liste de contrôle de l’isolation
  - H2 : Mappage des ports (dérivé)
  - H2 : Notes sur le navigateur/CDP (piège courant)
  - H2 : Exemple manuel de variables d’environnement
  - H2 : Vérifications rapides
  - H2 : Voir aussi

## gateway/network-model.md

- Route : /gateway/network-model
- Titres :
  - H2 : Voir aussi

## gateway/openai-http-api.md

- Route : /gateway/openai-http-api
- Titres :
  - H2 : Activation du point de terminaison
  - H2 : Frontière de sécurité (important)
  - H2 : Authentification
  - H2 : Quand utiliser ce point de terminaison
  - H2 : Contrat de modèle centré sur l’agent
  - H2 : Comportement des sessions
  - H2 : Limites des requêtes (configuration)
  - H2 : Contrat des outils de conversation
  - H3 : Champs de requête pris en charge
  - H3 : Variantes non prises en charge
  - H3 : Structure de réponse d’outil sans diffusion
  - H3 : Structure de réponse d’outil en diffusion
  - H3 : Boucle de suivi des outils
  - H2 : Diffusion (SSE)
  - H2 : Configuration rapide d’Open WebUI
  - H2 : Exemples
  - H2 : Voir aussi

## gateway/openresponses-http-api.md

- Route : /gateway/openresponses-http-api
- Titres :
  - H2 : Authentification, sécurité et routage
  - H2 : Comportement des sessions
  - H2 : Structure de la requête
  - H2 : Éléments (entrée)
  - H3 : message
  - H3 : functioncalloutput (outils basés sur les tours)
  - H3 : reasoning et itemreference
  - H2 : Outils (outils de fonction côté client)
  - H2 : Images (inputimage)
  - H2 : Fichiers (inputfile)
  - H2 : Limites des fichiers et images (configuration)
  - H2 : Diffusion (SSE)
  - H2 : Utilisation
  - H2 : Erreurs
  - H2 : Exemples
  - H2 : Voir aussi

## gateway/openshell.md

- Route : /gateway/openshell
- Titres :
  - H2 : Prérequis
  - H2 : Démarrage rapide
  - H2 : Modes de l’espace de travail
  - H3 : mirror (par défaut)
  - H3 : remote
  - H3 : Choisir un mode
  - H2 : Référence de configuration
  - H2 : Exemples
  - H3 : Configuration distante minimale
  - H3 : Mode miroir avec GPU
  - H3 : OpenShell par agent avec Gateway personnalisée
  - H2 : Gestion du cycle de vie
  - H2 : Renforcement de la sécurité
  - H2 : Limites actuelles
  - H2 : Fonctionnement
  - H2 : Voir aussi

## gateway/opentelemetry.md

- Route : /gateway/opentelemetry
- Titres :
  - H2 : Démarrage rapide
  - H2 : Signaux exportés
  - H2 : Référence de configuration
  - H3 : Variables d’environnement
  - H2 : Confidentialité et capture du contenu
  - H2 : Échantillonnage et vidage
  - H2 : Métriques exportées
  - H3 : Utilisation du modèle
  - H3 : Flux des messages
  - H3 : Conversation
  - H3 : Files d’attente et sessions
  - H3 : Télémétrie de vivacité des sessions
  - H3 : Cycle de vie du harnais
  - H3 : Exécution des outils et détection des boucles
  - H3 : Exécution
  - H3 : Fonctionnement interne des diagnostics (mémoire, charges utiles, état de l’exportateur)
  - H2 : Étendues exportées
  - H2 : Catalogue des événements de diagnostic
  - H2 : Sans exportateur
  - H2 : Désactiver
  - H2 : Voir aussi

## gateway/operator-scopes.md

- Route : /gateway/operator-scopes
- Titres :
  - H2 : Rôles
  - H2 : Niveaux de portée
  - H2 : La portée de la méthode n’est que le premier contrôle
  - H2 : Approbations de l’association des appareils
  - H2 : Approbations de l’association des Node
  - H2 : Authentification par secret partagé

## gateway/pairing.md

- Route : /gateway/pairing
- Titres :
  - H2 : Fonctionnement de l’approbation des capacités
  - H2 : Processus CLI (adapté aux environnements sans interface graphique)
  - H2 : Surface de l’API (protocole du Gateway)
  - H2 : Contrôle des commandes des Node (2026.3.31+)
  - H2 : Limites de confiance des événements des Node (2026.3.31+)
  - H2 : Approbation automatique des appareils vérifiés par SSH (par défaut)
  - H2 : Approbation automatique (application macOS)
  - H2 : Approbation automatique des appareils via un CIDR de confiance
  - H2 : Nettoyage silencieux des associations remplacées
  - H2 : Approbation automatique des mises à niveau des métadonnées
  - H2 : Utilitaires d’association par code QR
  - H2 : Localité et en-têtes transférés
  - H2 : Stockage (local, privé)
  - H2 : Comportement du transport
  - H2 : Voir aussi

## gateway/prometheus.md

- Route : /gateway/prometheus
- Titres :
  - H2 : Démarrage rapide
  - H2 : Métriques exportées
  - H2 : Politique relative aux libellés
  - H2 : Recettes PromQL
  - H2 : Choisir entre l’export Prometheus et OpenTelemetry
  - H2 : Dépannage
  - H2 : Voir aussi

## gateway/protocol.md

- Route : /gateway/protocol
- Titres :
  - H2 : Transport et délimitation des trames
  - H2 : Établissement de la connexion
  - H3 : Rôle du worker et protocole fermé
  - H3 : Capacités du client
  - H3 : Exemple de connexion d’un Node
  - H2 : Rôles et portées
  - H3 : Capacités/commandes/autorisations (Node)
  - H2 : Présence
  - H3 : Événement de maintien en vie d’un Node en arrière-plan
  - H2 : Portée des événements diffusés
  - H2 : Familles de méthodes RPC
  - H3 : Familles d’événements courantes
  - H3 : Méthodes utilitaires des Node
  - H2 : RPC du registre d’audit
  - H2 : RPC du registre des tâches
  - H2 : Méthodes utilitaires de l’opérateur
  - H3 : Vues models.list
  - H2 : Approbations d’exécution
  - H2 : Solution de repli pour la remise à l’agent
  - H2 : Gestion des versions
  - H3 : Constantes du client
  - H2 : Authentification
  - H2 : Identité et association des appareils
  - H3 : Diagnostics de migration de l’authentification des appareils
  - H2 : TLS et épinglage
  - H2 : Portée
  - H2 : Voir aussi

## gateway/remote-gateway-readme.md

- Route : /gateway/remote-gateway-readme
- Titres :
  - H1 : Exécuter OpenClaw.app avec un Gateway distant
  - H2 : Configuration
  - H2 : Fonctionnement
  - H2 : Voir aussi

## gateway/remote.md

- Route : /gateway/remote
- Titres :
  - H2 : Principe fondamental
  - H2 : Options de topologie
  - H2 : Flux des commandes (où s’exécute chaque élément)
  - H2 : Tunnel SSH (CLI + outils)
  - H2 : Valeurs par défaut de la CLI distante
  - H2 : Ordre de priorité des identifiants
  - H2 : Accès distant à l’interface de discussion
  - H2 : Mode distant de l’application macOS
  - H2 : Règles de sécurité (accès distant/VPN)
  - H3 : macOS : tunnel SSH persistant via LaunchAgent
  - H4 : Étape 1 : ajouter la configuration SSH
  - H4 : Étape 2 : copier la clé SSH (une seule fois)
  - H4 : Étape 3 : configurer le jeton du Gateway
  - H4 : Étape 4 : créer le LaunchAgent
  - H4 : Étape 5 : charger le LaunchAgent
  - H4 : Dépannage
  - H2 : Voir aussi

## gateway/restart-recovery.md

- Route : /gateway/restart-recovery
- Titres :
  - H2 : Ce qui subsiste après un redémarrage
  - H2 : Les redémarrages progressifs attendent d’abord la fin des opérations
  - H2 : Détection des tâches interrompues
  - H2 : Reprise automatique
  - H3 : Sous-agents
  - H3 : Tâches en arrière-plan
  - H3 : Redémarrages demandés par l’agent
  - H2 : Mécanismes de sécurité et observabilité
  - H2 : Ce qui n’est pas repris

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- Route : /gateway/sandbox-vs-tool-policy-vs-elevated
- Titres :
  - H2 : Débogage rapide
  - H2 : Bac à sable : emplacement d’exécution des outils
  - H3 : Montages liés (vérification de sécurité rapide)
  - H2 : Politique des outils : outils disponibles et appelables
  - H3 : Groupes d’outils (raccourcis)
  - H2 : Mode élevé : « exécuter sur l’hôte » pour les exécutions uniquement
  - H2 : Correctifs courants pour les restrictions du bac à sable
  - H3 : « Outil X bloqué par la politique des outils du bac à sable »
  - H3 : « Je pensais qu’il s’agissait de l’environnement principal ; pourquoi est-il dans un bac à sable ? »
  - H2 : Voir aussi

## gateway/sandboxing.md

- Route : /gateway/sandboxing
- Titres :
  - H2 : Éléments placés dans un bac à sable
  - H2 : Modes, portée et moteur
  - H2 : Moteur Docker
  - H3 : Navigateur en bac à sable
  - H2 : Moteur SSH
  - H2 : Moteur OpenShell
  - H2 : Accès à l’espace de travail
  - H2 : Montages liés personnalisés
  - H2 : Images et configuration
  - H2 : setupCommand (configuration unique du conteneur)
  - H2 : Politique des outils et mécanismes de contournement
  - H2 : Remplacements pour plusieurs agents
  - H2 : Exemple minimal d’activation
  - H2 : Voir aussi

## gateway/secrets-plan-contract.md

- Route : /gateway/secrets-plan-contract
- Titres :
  - H2 : Structure du fichier de plan
  - H2 : Ajouts ou mises à jour et suppressions de fournisseurs
  - H2 : Portée cible prise en charge
  - H2 : Comportement des types de cible
  - H2 : Règles de validation des chemins
  - H2 : Comportement en cas d’échec
  - H2 : Comportement du consentement pour le fournisseur d’exécution
  - H2 : Remarques sur la portée de l’exécution et de l’audit
  - H2 : Vérifications de l’opérateur
  - H2 : Documentation associée

## gateway/secrets.md

- Route : /gateway/secrets
- Titres :
  - H2 : Modèle d’exécution
  - H2 : Injection lors de la sortie (sentinelles)
  - H2 : Limite d’accès de l’agent
  - H2 : Filtrage des surfaces actives
  - H2 : Diagnostics de la surface d’authentification du Gateway
  - H2 : Vérification préalable des références lors de l’intégration
  - H2 : Contrat SecretRef
  - H2 : Configuration des fournisseurs
  - H2 : Clés d’API stockées dans des fichiers
  - H2 : Exemples d’intégration de l’exécution
  - H2 : Variables d’environnement du serveur MCP
  - H2 : Éléments d’authentification SSH du bac à sable
  - H2 : Surface d’identifiants prise en charge
  - H2 : Comportement requis et ordre de priorité
  - H2 : Déclencheurs d’activation
  - H2 : Signaux de dégradation et de rétablissement
  - H2 : Résolution du chemin des commandes
  - H2 : Processus d’audit et de configuration
  - H2 : Politique de sécurité à sens unique
  - H2 : Remarques sur la compatibilité de l’ancienne authentification
  - H2 : Remarque sur l’interface Web
  - H2 : Voir aussi

## gateway/security/audit-checks.md

- Route : /gateway/security/audit-checks
- Titres :
  - H2 : Voir aussi

## gateway/security/exposure-runbook.md

- Route : /gateway/security/exposure-runbook
- Titres :
  - H2 : Choisir le modèle d’exposition
  - H2 : Inventaire préalable
  - H2 : Vérifications de référence
  - H2 : Référence minimale de sécurité
  - H2 : Exposition des messages privés et des groupes
  - H2 : Vérifications du proxy inverse
  - H2 : Examen des outils et du bac à sable
  - H2 : Validation après modification
  - H2 : Plan de retour en arrière
  - H2 : Liste de contrôle de la revue

## gateway/security/index.md

- Route : /gateway/security
- Titres :
  - H2 : Portée : modèle de sécurité de l’assistant personnel
  - H2 : Audit de sécurité d’openclaw
  - H3 : Éléments vérifiés par l’audit (vue d’ensemble)
  - H3 : Ordre de priorité pour le tri des résultats
  - H2 : Configuration de référence renforcée en 60 secondes
  - H2 : Matrice des limites de confiance
  - H2 : Comportements qui ne constituent pas des vulnérabilités par conception
  - H2 : Confiance accordée au Gateway et aux Node
  - H2 : Modèle de menace
  - H2 : Accès aux messages privés : association, liste d’autorisation, ouvert, désactivé
  - H3 : Listes d’autorisation (deux niveaux)
  - H3 : Isolation des sessions de messages privés (mode multi-utilisateur)
  - H2 : Visibilité du contexte et autorisation des déclencheurs
  - H2 : Injection d’invite
  - H3 : Contenu externe et encapsulation des entrées non fiables
  - H3 : Indicateurs de contournement (à désactiver en production)
  - H3 : Raisonnement et sortie détaillée dans les groupes
  - H2 : Autorisation des commandes
  - H2 : Outils du plan de contrôle
  - H2 : Exécution sur un Node (system.run)
  - H2 : Skills dynamiques (observateur / Node distants)
  - H2 : Plugins
  - H2 : Mise en bac à sable
  - H3 : Garde-fou pour la délégation aux sous-agents
  - H3 : Mode lecture seule
  - H2 : Profils d’accès par agent (multi-agent)
  - H3 : Accès complet (sans bac à sable)
  - H3 : Outils en lecture seule + espace de travail en lecture seule
  - H3 : Aucun accès au système de fichiers ou à l’interpréteur de commandes (messagerie du fournisseur autorisée)
  - H2 : Risques liés au contrôle du navigateur
  - H3 : Politique SSRF du navigateur (stricte par défaut)
  - H2 : Exposition réseau
  - H3 : Adresse d’écoute, port, pare-feu
  - H3 : Publication des ports Docker avec UFW
  - H3 : Découverte mDNS/Bonjour
  - H3 : Authentification WebSocket du Gateway
  - H3 : En-têtes d’identité de Tailscale Serve
  - H3 : Configuration du proxy inverse
  - H3 : Remarques sur HSTS et l’origine
  - H3 : Interface de contrôle via HTTP
  - H3 : Indicateurs non sécurisés ou dangereux
  - H2 : Déploiement et confiance accordée à l’hôte
  - H2 : Secrets sur le disque
  - H3 : Carte de stockage des identifiants
  - H3 : Autorisations des fichiers
  - H3 : Fichiers .env de l’espace de travail
  - H3 : Journaux et transcriptions
  - H2 : Configuration de référence sécurisée (copier-coller)
  - H3 : Numéros distincts (WhatsApp, Signal, Telegram)
  - H2 : Réponse aux incidents
  - H3 : Confinement
  - H3 : Rotation (supposez une compromission si des secrets ont fuité)
  - H3 : Audit
  - H3 : Éléments à recueillir pour un rapport
  - H2 : Analyse des secrets
  - H2 : Signalement des problèmes de sécurité

## gateway/security/secure-file-operations.md

- Route : /gateway/security/secure-file-operations
- Titres :
  - H2 : Par défaut : aucun utilitaire Python
  - H2 : Éléments qui restent protégés sans Python
  - H2 : Apports de Python
  - H2 : Recommandations pour les Plugins et le cœur

## gateway/security/shrinkwrap.md

- Route : /gateway/security/shrinkwrap
- Titres :
  - H2 : Importance
  - H2 : Génération et vérification
  - H2 : Inspection d’un paquet publié

## gateway/tailscale.md

- Route : /gateway/tailscale
- Titres :
  - H2 : Modes
  - H2 : Exemples de configuration
  - H3 : Tailnet uniquement (Serve)
  - H3 : Tailnet uniquement (écoute sur l’adresse IP du Tailnet)
  - H3 : Internet public (Funnel + mot de passe partagé)
  - H2 : Exemples de CLI
  - H2 : Authentification
  - H3 : En-têtes d’identité Tailscale (Serve uniquement)
  - H2 : Remarques
  - H3 : Prérequis et limites de Tailscale
  - H2 : Contrôle du navigateur (Gateway distant + navigateur local)
  - H2 : En savoir plus
  - H2 : Voir aussi

## gateway/tools-invoke-http-api.md

- Route : /gateway/tools-invoke-http-api
- Titres :
  - H2 : Authentification
  - H2 : Limite de sécurité (important)
  - H2 : Corps de la requête
  - H2 : Comportement de la politique et du routage
  - H2 : Réponses
  - H2 : Exemple
  - H2 : Voir aussi

## gateway/troubleshooting.md

- Route : /gateway/troubleshooting
- Titres :
  - H2 : Séquence de commandes
  - H2 : Après une mise à jour
  - H2 : Installations divergentes et protection contre les configurations plus récentes
  - H2 : Incompatibilité du protocole après un retour à une version antérieure
  - H2 : Lien symbolique de Skill ignoré en raison d’une sortie du chemin autorisé
  - H2 : Anthropic 429 : utilisation supplémentaire requise pour les contextes longs
  - H2 : Réponses en amont bloquées avec le code 403
  - H2 : Le moteur local compatible avec OpenAI réussit les tests directs, mais les exécutions d’agents échouent
  - H2 : Absence de réponses
  - H2 : Connectivité de l’interface de contrôle du tableau de bord
  - H3 : Tableau rapide des codes détaillés d’authentification
  - H2 : Service du Gateway non démarré
  - H2 : Le Gateway macOS cesse silencieusement de répondre, puis reprend lorsque vous interagissez avec le tableau de bord
  - H2 : Boucle du superviseur launchd de macOS avec des LaunchAgents du Gateway/Node en double
  - H2 : Le Gateway s’arrête lors d’une forte utilisation de la mémoire
  - H2 : Le Gateway a rejeté une configuration non valide
  - H2 : Avertissements des sondes du Gateway
  - H2 : Canal connecté, mais les messages ne circulent pas
  - H2 : Remise des Cron et Heartbeat
  - H2 : Node associé, mais l’outil échoue
  - H2 : Échec de l’outil de navigation
  - H2 : Si une défaillance soudaine survient après une mise à niveau
  - H2 : Voir aussi

## gateway/trusted-proxy-auth.md

- Route : /gateway/trusted-proxy-auth
- Titres :
  - H2 : Quand l’utiliser
  - H2 : Quand NE PAS l’utiliser
  - H2 : Fonctionnement
  - H2 : Configuration
  - H3 : Référence de configuration
  - H2 : Comportement de l’association dans l’interface de contrôle
  - H2 : En-tête des portées de l’opérateur
  - H2 : Terminaison TLS et HSTS
  - H3 : Recommandations de déploiement
  - H2 : Exemples de configuration de proxy
  - H2 : Configuration mixte des jetons
  - H2 : Liste de contrôle de sécurité
  - H2 : Audit de sécurité
  - H2 : Dépannage
  - H2 : Migration depuis l’authentification par jeton
  - H2 : Voir aussi

## help/debugging.md

- Route : /help/debugging
- Titres :
  - H2 : Remplacements de débogage à l’exécution
  - H2 : Sortie de trace de session
  - H2 : Trace du cycle de vie des Plugins
  - H2 : Profilage du démarrage et des commandes de la CLI
  - H2 : Mode de surveillance du Gateway
  - H2 : Profil de développement + Gateway de développement (--dev)
  - H2 : Journalisation du flux brut
  - H2 : Remarques de sécurité
  - H2 : Débogage dans VSCode
  - H3 : Configuration
  - H3 : Remarques
  - H2 : Voir aussi

## help/environment.md

- Route : /help/environment
- Titres :
  - H2 : Ordre de priorité (du plus élevé au plus faible)
  - H2 : Identifiants des fournisseurs et fichier .env de l’espace de travail
  - H2 : Bloc d’environnement de la configuration
  - H2 : Importation de l’environnement de l’interpréteur de commandes
  - H2 : Instantanés de l’interpréteur de commandes d’exécution
  - H2 : Variables d’environnement injectées à l’exécution
  - H2 : Variables d’environnement de l’interface utilisateur
  - H2 : Substitution des variables d’environnement dans la configuration
  - H2 : Références de secrets et chaînes ${ENV}
  - H2 : Variables d’environnement liées aux chemins
  - H2 : Journalisation
  - H3 : OPENCLAWHOME
  - H2 : Utilisateurs de nvm : échecs TLS de webfetch
  - H2 : Anciennes variables d’environnement
  - H2 : Voir aussi

## help/faq-first-run.md

- Route : /help/faq-first-run
- Titres :
  - H2 : Démarrage rapide et configuration initiale
  - H2 : Voir aussi

## help/faq-models.md

- Route : /help/faq-models
- Titres :
  - H2 : Modèles : valeurs par défaut, sélection, alias et changement
  - H2 : Basculement de modèle et « Échec de tous les modèles »
  - H2 : Profils d’authentification : définition et gestion
  - H2 : Voir aussi

## help/faq.md

- Route : /help/faq
- Titres :
  - H2 : Les 60 premières secondes en cas de problème
  - H2 : Démarrage rapide et configuration initiale
  - H2 : Qu’est-ce qu’OpenClaw ?
  - H2 : Skills et automatisation
  - H2 : Bac à sable et mémoire
  - H2 : Emplacement des éléments sur le disque
  - H2 : Principes de base de la configuration
  - H2 : Gateways et nœuds distants
  - H2 : Variables d’environnement et chargement de .env
  - H2 : Sessions et conversations multiples
  - H2 : Modèles, basculement et profils d’authentification
  - H2 : Gateway : ports, « déjà en cours d’exécution » et mode distant
  - H2 : Journalisation et débogage
  - H2 : Médias et pièces jointes
  - H2 : Sécurité et contrôle d’accès
  - H2 : Commandes de conversation, interruption des tâches et « cela ne s’arrête pas »
  - H2 : Divers
  - H2 : Voir aussi

## help/index.md

- Route : /help
- Titres :
  - H2 : FAQ
  - H2 : Diagnostics
  - H2 : Tests
  - H2 : Communauté et métadiscussion

## help/scripts.md

- Route : /help/scripts
- Titres :
  - H2 : Conventions
  - H2 : Scripts de surveillance de l’authentification
  - H2 : Utilitaire de lecture GitHub
  - H2 : Lors de l’ajout de scripts
  - H2 : Voir aussi

## help/testing-live.md

- Route : /help/testing-live
- Titres :
  - H2 : En direct : commandes de test rapide locales
  - H2 : En direct : vérification des capacités du nœud Android
  - H2 : En direct : test rapide des modèles (clés de profil)
  - H3 : Couche 1 : génération directe par le modèle (sans Gateway)
  - H3 : Couche 2 : Gateway + test rapide de l’agent de développement (ce que fait réellement « @openclaw »)
  - H2 : En direct : test rapide du moteur CLI (Claude, Gemini ou autres CLI locales)
  - H2 : En direct : accessibilité du proxy HTTP/2 APNs
  - H2 : En direct : test rapide de liaison ACP (/acp spawn ... --bind here)
  - H2 : En direct : test rapide du banc d’essai du serveur d’application Codex
  - H3 : Procédures recommandées pour les tests en direct
  - H2 : En direct : matrice des modèles (ce que nous couvrons)
  - H3 : Agrégateurs / Gateways alternatifs
  - H2 : Identifiants (ne jamais les valider dans le dépôt)
  - H2 : Deepgram en direct (transcription audio)
  - H2 : Forfait de programmation BytePlus en direct
  - H2 : Médias de flux de travail ComfyUI en direct
  - H2 : Génération d’images en direct
  - H2 : Génération de musique en direct
  - H2 : Génération de vidéos en direct
  - H2 : Banc d’essai multimédia en direct
  - H2 : Voir aussi

## help/testing-updates-plugins.md

- Route : /help/testing-updates-plugins
- Titres :
  - H2 : Ce que nous protégeons
  - H2 : Validation locale pendant le développement
  - H2 : Parcours Docker
  - H2 : Validation des paquets
  - H2 : Valeur par défaut de la version
  - H2 : Compatibilité avec les versions antérieures
  - H2 : Ajout de couverture
  - H2 : Triage des échecs

## help/testing.md

- Route : /help/testing
- Titres :
  - H2 : Démarrage rapide
  - H2 : Répertoires temporaires de test
  - H2 : Flux de travail en direct et Docker/Parallels
  - H2 : Exécuteurs propres à l’assurance qualité
  - H3 : Identifiants Telegram partagés via Convex (v1)
  - H3 : Ajout d’un canal à l’assurance qualité
  - H2 : Suites de tests (où chacune s’exécute)
  - H3 : Unitaires / intégration (par défaut)
  - H3 : Stabilité (Gateway)
  - H3 : E2E (agrégat du dépôt)
  - H3 : E2E (test rapide du Gateway)
  - H3 : E2E (navigateur simulé de l’interface de contrôle)
  - H3 : E2E : test rapide du moteur OpenShell
  - H3 : En direct (fournisseurs et modèles réels)
  - H2 : Quelle suite dois-je exécuter ?
  - H2 : Tests en direct (avec accès au réseau)
  - H2 : Exécuteurs Docker (vérifications facultatives du « fonctionnement sous Linux »)
  - H2 : Vérification élémentaire de la documentation
  - H2 : Régression hors ligne (compatible avec la CI)
  - H2 : Évaluations de la fiabilité des agents (Skills)
  - H2 : Tests de contrat (structure des Plugins et des canaux)
  - H3 : Commandes
  - H3 : Contrats des canaux
  - H3 : Contrats des fournisseurs
  - H3 : Quand les exécuter
  - H2 : Ajout de tests de régression (recommandations)
  - H2 : Voir aussi

## help/troubleshooting.md

- Route : /help/troubleshooting
- Titres :
  - H2 : Les 60 premières secondes
  - H2 : L’assistant semble limité ou certains outils sont absents
  - H2 : Erreur 429 d’Anthropic avec un contexte long
  - H2 : Le moteur local compatible avec OpenAI fonctionne directement, mais échoue dans OpenClaw
  - H2 : L’installation du Plugin échoue en raison d’extensions OpenClaw manquantes
  - H2 : La politique d’installation bloque l’installation ou la mise à jour des Plugins
  - H2 : Le Plugin est présent, mais bloqué en raison d’une propriété suspecte
  - H2 : Arbre de décision
  - H2 : Voir aussi

## index.md

- Route : /
- Titres :
  - H1 : OpenClaw 🦞
  - H2 : Parcourir la documentation
  - H2 : Qu’est-ce qu’OpenClaw ?
  - H2 : Fonctionnement
  - H2 : Fonctionnalités principales
  - H2 : Démarrage rapide
  - H2 : Tableau de bord
  - H2 : Configuration (facultative)
  - H2 : Commencez ici
  - H2 : En savoir plus

## install/ansible.md

- Route : /install/ansible
- Titres :
  - H2 : Prérequis
  - H2 : Ce que vous obtenez
  - H2 : Démarrage rapide
  - H2 : Éléments installés
  - H2 : Configuration après l’installation
  - H3 : Commandes rapides
  - H2 : Architecture de sécurité
  - H2 : Installation manuelle
  - H2 : Mise à jour
  - H2 : Dépannage
  - H2 : Configuration avancée
  - H2 : Voir aussi

## install/azure.md

- Route : /install/azure
- Titres :
  - H2 : Ce que vous allez faire
  - H2 : Ce dont vous avez besoin
  - H2 : Configurer le déploiement
  - H2 : Déployer les ressources Azure
  - H2 : Installer OpenClaw
  - H2 : Considérations relatives aux coûts
  - H2 : Nettoyage
  - H2 : Étapes suivantes
  - H2 : Voir aussi

## install/bun.md

- Route : /install/bun
- Titres :
  - H2 : Installation
  - H2 : Scripts de cycle de vie
  - H2 : Points d’attention
  - H2 : Voir aussi

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
  - H2 : Parcours initial
  - H2 : Configuration et secrets
  - H2 : Voir aussi

## install/development-channels.md

- Route : /install/development-channels
- Titres :
  - H2 : Changement de canal
  - H2 : Ciblage ponctuel d’une version ou d’une étiquette
  - H2 : Simulation
  - H2 : Plugins et canaux
  - H2 : Vérification de l’état actuel
  - H2 : Bonnes pratiques d’étiquetage
  - H2 : Disponibilité de l’application macOS
  - H2 : Voir aussi

## install/digitalocean.md

- Route : /install/digitalocean
- Titres :
  - H2 : Prérequis
  - H2 : Configuration
  - H2 : Persistance et sauvegardes
  - H2 : Conseils pour 1 GB de RAM
  - H2 : Dépannage
  - H2 : Étapes suivantes
  - H2 : Voir aussi

## install/docker-vm-runtime.md

- Route : /install/docker-vm-runtime
- Titres :
  - H2 : Intégrer les exécutables requis à l’image
  - H2 : Construire et lancer
  - H2 : Éléments persistants et emplacements correspondants
  - H2 : Mises à jour
  - H2 : Voir aussi

## install/docker.md

- Route : /install/docker
- Titres :
  - H2 : Prérequis
  - H2 : Gateway conteneurisé
  - H3 : Procédure manuelle
  - H3 : Mise à niveau des images de conteneur
  - H3 : Variables d’environnement
  - H3 : Images construites depuis les sources avec les Plugins sélectionnés
  - H3 : Observabilité
  - H3 : Contrôles d’intégrité
  - H3 : Réseau local ou interface de bouclage
  - H3 : Fournisseurs locaux de l’hôte
  - H3 : Moteur CLI Claude dans Docker
  - H3 : Bonjour / mDNS
  - H3 : Stockage et persistance
  - H3 : Utilitaires d’interpréteur de commandes (facultatifs)
  - H3 : Exécution sur un VPS ?
  - H2 : Bac à sable de l’agent
  - H3 : Activation rapide
  - H2 : Dépannage
  - H2 : Voir aussi

## install/exe-dev.md

- Route : /install/exe-dev
- Titres :
  - H2 : Ce dont vous avez besoin
  - H2 : Parcours rapide pour débutants
  - H2 : Installation automatisée avec Shelley
  - H2 : Installation manuelle
  - H2 : Configuration d’un canal distant
  - H2 : Accès distant
  - H2 : Mise à jour
  - H2 : Voir aussi

## install/fly.md

- Route : /install/fly
- Titres :
  - H2 : Ce dont vous avez besoin
  - H2 : Parcours rapide pour débutants
  - H2 : Dépannage
  - H3 : « L’application n’écoute pas à l’adresse attendue »
  - H3 : Échec des contrôles d’intégrité / connexion refusée
  - H3 : Mémoire insuffisante / problèmes de mémoire
  - H3 : Problèmes de verrouillage du Gateway
  - H3 : La configuration n’est pas lue
  - H3 : Écriture de la configuration via SSH
  - H3 : L’état n’est pas conservé
  - H2 : Mise à jour
  - H3 : Mise à jour de la commande de la machine
  - H2 : Déploiement privé (renforcé)
  - H3 : Quand utiliser un déploiement privé
  - H3 : Configuration
  - H3 : Accès à un déploiement privé
  - H3 : Webhooks avec un déploiement privé
  - H3 : Compromis en matière de sécurité
  - H2 : Remarques
  - H2 : Coût
  - H2 : Étapes suivantes
  - H2 : Voir aussi

## install/gcp.md

- Route : /install/gcp
- Titres :
  - H2 : Ce dont vous avez besoin
  - H2 : Parcours rapide
  - H2 : Dépannage
  - H2 : Comptes de service (bonne pratique de sécurité)
  - H2 : Étapes suivantes
  - H2 : Voir aussi

## install/hetzner.md

- Route : /install/hetzner
- Titres :
  - H2 : Ce dont vous avez besoin
  - H2 : Parcours rapide
  - H2 : Infrastructure en tant que code (Terraform)
  - H2 : Étapes suivantes
  - H2 : Voir aussi

## install/hostinger.md

- Route : /install/hostinger
- Titres :
  - H2 : Prérequis
  - H2 : Option A : OpenClaw en 1 clic
  - H2 : Option B : OpenClaw sur un VPS
  - H2 : Vérifier votre configuration
  - H2 : Dépannage
  - H2 : Étapes suivantes
  - H2 : Voir aussi

## install/index.md

- Route : /install
- Titres :
  - H2 : Configuration système requise
  - H2 : Recommandation : script d’installation
  - H2 : Autres méthodes d’installation
  - H3 : Programme d’installation avec préfixe local (install-cli.sh)
  - H3 : npm, pnpm ou bun
  - H3 : Depuis les sources
  - H3 : Installation depuis l’extraction principale de GitHub
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
  - H3 : Déroulement (install.sh)
  - H3 : Détection de l’extraction des sources
  - H3 : Exemples (install.sh)
  - H2 : install-cli.sh
  - H3 : Déroulement (install-cli.sh)
  - H3 : Exemples (install-cli.sh)
  - H2 : install.ps1
  - H3 : Déroulement (install.ps1)
  - H3 : Exemples (install.ps1)
  - H2 : CI et automatisation
  - H2 : Dépannage
  - H2 : Voir aussi

## install/kubernetes.md

- Route : /install/kubernetes
- Titres :
  - H2 : Pourquoi ne pas utiliser Helm
  - H2 : Ce dont vous avez besoin
  - H2 : Démarrage rapide
  - H2 : Tests locaux avec Kind
  - H2 : Procédure pas à pas
  - H3 : 1) Déployer
  - H3 : 2) Accéder au Gateway
  - H2 : Éléments déployés
  - H2 : Personnalisation
  - H3 : Instructions de l’agent
  - H3 : Configuration du Gateway
  - H3 : Ajouter des fournisseurs
  - H3 : Espace de noms personnalisé
  - H3 : Image personnalisée
  - H3 : Exposition au-delà de la redirection de port
  - H2 : Redéployer
  - H2 : Démantèlement
  - H2 : Remarques sur l’architecture
  - H2 : Structure des fichiers
  - H2 : Voir aussi

## install/macos-vm.md

- Route : /install/macos-vm
- Titres :
  - H2 : Option par défaut recommandée (pour la plupart des utilisateurs)
  - H2 : Options de machines virtuelles macOS
  - H3 : Machine virtuelle locale sur votre Mac Apple Silicon (Lume)
  - H3 : Fournisseurs de Mac hébergés (cloud)
  - H2 : Parcours rapide (Lume, utilisateurs expérimentés)
  - H2 : Ce dont vous avez besoin (Lume)
  - H2 : 1) Installer Lume
  - H2 : 2) Créer la machine virtuelle macOS
  - H2 : 3) Terminer l’assistant de configuration
  - H2 : 4) Obtenir l’adresse IP de la machine virtuelle
  - H2 : 5) Se connecter à la machine virtuelle par SSH
  - H2 : 6) Installer OpenClaw
  - H2 : 7) Configurer les canaux
  - H2 : 8) Exécuter la machine virtuelle sans interface graphique
  - H2 : Bonus : intégration d’iMessage
  - H2 : Enregistrer une image de référence
  - H2 : Exécution 24 h/24 et 7 j/7
  - H2 : Dépannage
  - H2 : Documentation associée

## install/migrating-claude.md

- Route : /install/migrating-claude
- Titres :
  - H2 : Deux méthodes d’importation
  - H2 : Éléments importés
  - H2 : Éléments conservés uniquement dans l’archive
  - H2 : Sélection de la source
  - H2 : Procédure recommandée
  - H2 : Gestion des conflits
  - H2 : Sortie JSON pour l’automatisation
  - H2 : Dépannage
  - H2 : Voir aussi

## install/migrating-hermes.md

- Route : /install/migrating-hermes
- Titres :
  - H2 : Deux méthodes d’importation
  - H2 : Éléments importés
  - H2 : Éléments conservés uniquement dans l’archive
  - H2 : Procédure recommandée
  - H2 : Gestion des conflits
  - H2 : Secrets
  - H2 : Sortie JSON pour l’automatisation
  - H2 : Dépannage
  - H2 : Voir aussi

## install/migrating.md

- Route : /install/migrating
- Titres :
  - H2 : Importer depuis un autre système d’agents
  - H2 : Déplacer OpenClaw vers une nouvelle machine
  - H3 : Étapes de migration
  - H3 : Erreurs courantes
  - H3 : Liste de contrôle de vérification
  - H2 : Mettre à niveau un Plugin sur place
  - H2 : Voir aussi

## install/nix.md

- Route : /install/nix
- Titres :
  - H2 : Ce que vous obtenez
  - H2 : Démarrage rapide
  - H2 : Comportement de l’environnement d’exécution en mode Nix
  - H3 : Changements en mode Nix
  - H3 : Chemins de configuration et d’état
  - H3 : Détection du PATH du service
  - H2 : Voir aussi

## install/node.md

- Route : /install/node
- Titres :
  - H2 : Vérifier votre version
  - H2 : Installer Node
  - H2 : Dépannage
  - H3 : openclaw : commande introuvable
  - H3 : Erreurs d’autorisation lors de npm install -g (Linux)
  - H2 : Voir aussi

## install/northflank.mdx

- Route : /install/northflank
- Titres :
  - H2 : Comment commencer
  - H2 : Ce que vous obtenez
  - H2 : Connecter un canal
  - H2 : Étapes suivantes

## install/oracle.md

- Route : /install/oracle
- Titres :
  - H2 : Prérequis
  - H2 : Configuration
  - H2 : Vérifier la posture de sécurité
  - H2 : Remarques sur ARM
  - H2 : Persistance et sauvegardes
  - H2 : Solution de repli : tunnel SSH
  - H2 : Dépannage
  - H2 : Étapes suivantes
  - H2 : Voir aussi

## install/podman.md

- Route : /install/podman
- Titres :
  - H2 : Prérequis
  - H2 : Démarrage rapide
  - H2 : Podman et Tailscale
  - H2 : Systemd (Quadlet, facultatif)
  - H2 : Configuration, environnement et stockage
  - H2 : Mise à niveau des images
  - H2 : Commandes utiles
  - H2 : Dépannage
  - H2 : Voir aussi

## install/railway.mdx

- Route : /install/railway
- Titres :
  - H2 : Déploiement en un clic
  - H2 : Ce que vous obtenez
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
  - H2 : Remarques sur les binaires ARM
  - H2 : Persistance et sauvegardes
  - H2 : Dépannage
  - H2 : Étapes suivantes
  - H2 : Voir aussi

## install/render.mdx

- Route : /install/render
- Titres :
  - H2 : Prérequis
  - H2 : Déployer
  - H2 : Le Blueprint
  - H2 : Choisir une offre
  - H2 : Après le déploiement
  - H3 : Accéder à l’interface de contrôle
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
  - H3 : Perte de données après un redéploiement
  - H3 : Échecs des vérifications d’intégrité
  - H2 : Étapes suivantes

## install/uninstall.md

- Route : /install/uninstall
- Titres :
  - H2 : Méthode simple (CLI toujours installée)
  - H2 : Suppression manuelle du service (CLI non installée)
  - H3 : macOS (launchd)
  - H3 : Linux (unité utilisateur systemd)
  - H3 : Windows (tâche planifiée)
  - H2 : Installation normale ou copie de travail des sources
  - H3 : Installation normale (install.sh / npm / pnpm / bun)
  - H3 : Copie de travail des sources (git clone)
  - H2 : Voir aussi

## install/updating.md

- Route : /install/updating
- Titres :
  - H2 : Recommandé : openclaw update
  - H2 : Basculer entre les installations npm et git
  - H2 : Autre possibilité : relancer le programme d’installation
  - H2 : Autre possibilité : utiliser manuellement npm, pnpm ou bun
  - H3 : Sujets avancés sur l’installation avec npm
  - H2 : Mise à jour automatique
  - H2 : Après la mise à jour
  - H3 : Exécuter doctor
  - H3 : Redémarrer le Gateway
  - H3 : Vérifier
  - H2 : Restauration d’une version antérieure
  - H3 : Épingler une version (npm)
  - H3 : Épingler un commit (sources)
  - H2 : Si vous êtes bloqué
  - H2 : Voir aussi

## install/upstash.md

- Route : /install/upstash
- Titres :
  - H2 : Prérequis
  - H2 : Créer une Box
  - H2 : Se connecter avec un tunnel SSH
  - H2 : Installer OpenClaw
  - H2 : Effectuer l’intégration initiale
  - H2 : Démarrer le Gateway
  - H2 : Redémarrage automatique
  - H2 : Dépannage
  - H2 : Voir aussi

## logging.md

- Route : /logging
- Titres :
  - H2 : Emplacement des journaux
  - H2 : Comment lire les journaux
  - H3 : CLI : suivi en direct (recommandé)
  - H3 : Interface de contrôle (web)
  - H3 : Journaux d’un canal uniquement
  - H2 : Formats des journaux
  - H3 : Journaux de fichiers (JSONL)
  - H3 : Sortie de la console
  - H3 : Journaux WebSocket du Gateway
  - H2 : Configuration de la journalisation
  - H3 : Niveaux de journalisation
  - H3 : Diagnostics ciblés du transport des modèles
  - H3 : Corrélation des traces
  - H3 : Taille et durée des appels de modèles
  - H3 : Styles de la console
  - H3 : Masquage
  - H2 : Diagnostics et OpenTelemetry
  - H2 : Conseils de dépannage
  - H2 : Voir aussi

## maturity/scorecard.md

- Route : /maturity/scorecard
- Titres :
  - H1 : Tableau de bord de maturité
  - H2 : Objectif de cette page
  - H2 : Vue d’ensemble
  - H2 : Plages de scores
  - H2 : Explorateur des surfaces
  - H2 : Résumé des preuves d’assurance qualité
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
  - H2 : Modèle central
  - H2 : Appairage et identité
  - H2 : Découverte et transports
  - H2 : Nodes et transports
  - H2 : Sécurité
  - H2 : Voir aussi

## nodes/audio.md

- Route : /nodes/audio
- Titres :
  - H2 : Fonctionnement
  - H2 : Détection automatique (par défaut)
  - H2 : Exemples de configuration
  - H3 : Fournisseur avec solution de repli CLI (OpenAI + CLI Whisper)
  - H3 : Fournisseur uniquement avec filtrage par portée
  - H3 : Fournisseur uniquement (Deepgram)
  - H3 : Fournisseur uniquement (Mistral Voxtral)
  - H3 : Fournisseur uniquement (SenseAudio)
  - H3 : Renvoyer la transcription dans la discussion (facultatif)
  - H2 : Remarques et limites
  - H3 : Reconnaissance vocale locale résidente
  - H3 : Prise en charge de l’environnement de proxy
  - H2 : Détection des mentions dans les groupes
  - H2 : Pièges
  - H2 : Voir aussi

## nodes/camera.md

- Route : /nodes/camera
- Titres :
  - H2 : Node iOS
  - H3 : Réglage utilisateur iOS
  - H3 : Commandes iOS (via Gateway node.invoke)
  - H3 : Exigence de premier plan sur iOS
  - H3 : Utilitaire CLI
  - H2 : Node Android
  - H3 : Réglage utilisateur Android
  - H3 : Autorisations
  - H3 : Exigence de premier plan sur Android
  - H3 : Commandes Android (via Gateway node.invoke)
  - H2 : Application macOS
  - H3 : Réglage utilisateur macOS
  - H3 : Utilitaire CLI (invocation de Node)
  - H2 : Sécurité et limites pratiques
  - H2 : Vidéo de l’écran macOS (au niveau du système d’exploitation)
  - H2 : Voir aussi

## nodes/computer-use.md

- Route : /nodes/computer-use
- Titres :
  - H2 : Exigences
  - H2 : Outil d’agent informatique
  - H2 : Commande de Node computer.act
  - H2 : Activer et armer
  - H2 : Sécurité
  - H2 : Relation avec les autres méthodes de contrôle du bureau

## nodes/images.md

- Route : /nodes/images
- Titres :
  - H2 : Objectifs
  - H2 : Interface CLI
  - H2 : Comportement du canal WhatsApp Web
  - H2 : Pipeline de réponse automatique
  - H2 : Transmission des médias entrants aux commandes
  - H2 : Limites et erreurs
  - H2 : Remarques pour les tests
  - H2 : Voir aussi

## nodes/index.md

- Route : /nodes
- Titres :
  - H2 : Appairage et état
  - H2 : Décalage des versions et ordre de mise à niveau
  - H2 : Hôte de Node distant (system.run)
  - H3 : Démarrer un hôte de Node (premier plan)
  - H3 : Gateway distant via un tunnel SSH (liaison à l’interface de bouclage)
  - H3 : Démarrer un hôte de Node (service)
  - H3 : Appairer et nommer
  - H3 : Serveurs MCP hébergés sur un Node
  - H3 : Skills hébergées sur un Node
  - H3 : État d’identité sans interface graphique
  - H3 : Ajouter les commandes à la liste d’autorisation
  - H3 : Diriger exec vers le Node
  - H3 : Inférence locale du modèle
  - H3 : Sessions et transcriptions Codex
  - H3 : Sessions et transcriptions Claude
  - H2 : Appel des commandes
  - H2 : Politique des commandes
  - H2 : Configuration (openclaw.json)
  - H2 : Captures d’écran (instantanés du canevas)
  - H3 : Commandes du canevas
  - H3 : A2UI (canevas)
  - H2 : Photos et vidéos (caméra du Node)
  - H2 : Enregistrements d’écran (Nodes)
  - H2 : Localisation (Nodes)
  - H2 : SMS (Nodes Android)
  - H2 : Commandes relatives à l’appareil et aux données personnelles
  - H2 : Commandes système (hôte de Node / Node Mac)
  - H2 : Liaison du Node d’exécution
  - H2 : Carte des autorisations
  - H2 : Hôte de Node sans interface graphique (multiplateforme)
  - H2 : Mode Node Mac

## nodes/location-command.md

- Route : /nodes/location-command
- Titres :
  - H2 : En bref
  - H2 : Pourquoi un sélecteur (et pas seulement un commutateur)
  - H2 : Modèle de réglages
  - H2 : Mappage des autorisations (node.permissions)
  - H2 : Commande : location.get
  - H2 : Comportement en arrière-plan
  - H2 : Intégration aux modèles et aux outils
  - H2 : Texte de l’expérience utilisateur (suggestion)
  - H2 : Voir aussi

## nodes/media-understanding.md

- Route : /nodes/media-understanding
- Titres :
  - H2 : Fonctionnement
  - H2 : Configuration
  - H3 : Entrées de modèles
  - H3 : Identifiants du fournisseur
  - H2 : Règles et comportement
  - H3 : Détection automatique (par défaut)
  - H3 : Prise en charge des proxys (appels au fournisseur audio/vidéo)
  - H2 : Capacités
  - H2 : Matrice de prise en charge des fournisseurs
  - H2 : Conseils pour la sélection du modèle
  - H2 : Politique des pièces jointes
  - H3 : Extraction des pièces jointes
  - H2 : Exemples de configuration
  - H2 : Sortie d’état
  - H2 : Remarques
  - H2 : Voir aussi

## nodes/presence.md

- Route : /nodes/presence
- Titres :
  - H2 : Exigences
  - H2 : Vérifier l’ordinateur actif
  - H2 : Comment l’activité devient une présence
  - H2 : Confidentialité et contexte du modèle
  - H2 : Acheminement des alertes de connexion
  - H2 : Dépannage
  - H2 : Voir aussi

## nodes/talk.md

- Route : /nodes/talk
- Titres :
  - H2 : Comportement (macOS)
  - H2 : Directives vocales dans les réponses
  - H2 : Configuration (/.openclaw/openclaw.json)
  - H2 : Interface macOS
  - H2 : Interface Android
  - H2 : Remarques
  - H2 : Voir aussi

## nodes/troubleshooting.md

- Route : /nodes/troubleshooting
- Titres :
  - H2 : Séquence de commandes
  - H2 : Exigences de premier plan
  - H2 : Matrice des autorisations
  - H2 : Appairage ou approbations
  - H2 : Codes d’erreur courants des Nodes
  - H2 : Boucle de récupération rapide
  - H2 : Voir aussi

## nodes/voicewake.md

- Route : /nodes/voicewake
- Titres :
  - H2 : Stockage
  - H2 : Protocole
  - H3 : Liste des déclencheurs
  - H3 : Acheminement (du déclencheur à la cible)
  - H3 : Événements
  - H2 : Comportement du client
  - H2 : Voir aussi

## openclaw-agent-runtime.md

- Route : /openclaw-agent-runtime
- Titres :
  - H2 : Vérification des types et analyse statique
  - H2 : Exécution des tests de l’environnement d’exécution de l’agent
  - H2 : Tests manuels
  - H2 : Réinitialisation complète
  - H2 : Références
  - H2 : Voir aussi

## perplexity.md

- Route : /perplexity
- Titres :
  - H2 : Voir aussi

## plan/cloud-workers.md

- Route : /plan/cloud-workers
- Titres :
  - H2 : État
  - H2 : Problème
  - H2 : Objectifs
  - H2 : Hors objectifs (v1)
  - H2 : Travaux antérieurs (ce que nous reprenons, ce que nous inversons)
  - H2 : Décision d’architecture : boucle sur le worker, inférence via le Gateway
  - H2 : Composants
  - H3 : 1. Machine à états de l’environnement et contrat du fournisseur
  - H3 : 2. Amorçage du worker : installer OpenClaw sur la machine
  - H3 : 3. Transport : tout via SSH
  - H3 : 4. Protocole du worker (dédié, distinct du protocole du Node)
  - H3 : 5. RPC du backend de session
  - H3 : 6. Synchronisation de l’espace de travail
  - H3 : 7. Machine à états de placement, sessions et interface utilisateur
  - H2 : Répartition et transfert
  - H2 : Modèle de sécurité
  - H2 : Capacité
  - H2 : Cycle de vie
  - H2 : Surface de configuration
  - H2 : Jalons
  - H2 : Questions ouvertes

## plan/path3-sqlite-session-artifact-family.md

- Route : /plan/path3-sqlite-session-artifact-family
- Titres :
  - H1 : Famille d’artefacts de session SQLite de la voie 3
  - H2 : Famille faisant autorité
  - H2 : Artefacts hors famille après le basculement
  - H2 : Points de modification
  - H2 : Tests ciblés

## plan/ui-channels.md

- Route : /plan/ui-channels
- Titres :
  - H2 : État
  - H2 : Problème
  - H2 : Objectifs
  - H2 : Hors objectifs
  - H2 : Modèle cible
  - H2 : Métadonnées de livraison
  - H2 : Contrat des capacités de l’environnement d’exécution
  - H2 : Mappage des canaux
  - H2 : Étapes de refactorisation
  - H2 : Tests
  - H2 : Questions ouvertes
  - H2 : Voir aussi

## platforms/android.md

- Route : /platforms/android
- Titres :
  - H2 : Aperçu de la prise en charge
  - H2 : Installation en dehors de Google Play
  - H2 : Répliquer et contrôler Android depuis un Mac distant
  - H3 : Avant de commencer
  - H3 : Activer ADB sur TCP
  - H3 : Autoriser uniquement le Mac contrôleur
  - H3 : Se connecter et démarrer la réplication
  - H3 : Dépannage
  - H2 : Procédure de connexion
  - H3 : Prérequis
  - H3 : 1. Démarrer le Gateway
  - H3 : 2. Vérifier la découverte (facultatif)
  - H4 : Découverte entre réseaux via DNS-SD monodiffusion
  - H3 : 3. Se connecter depuis Android
  - H3 : Plusieurs Gateways
  - H3 : Balises de présence active
  - H3 : 4. Approuver l’appairage (CLI)
  - H3 : 5. Vérifier que le Node est connecté
  - H3 : 6. Discussion et historique
  - H3 : 7. Canevas et caméra
  - H4 : Hôte de canevas du Gateway (recommandé pour le contenu web)
  - H3 : 8. Voix et surface étendue des commandes Android
  - H3 : 9. Fichiers de l’espace de travail (lecture seule)
  - H2 : Examiner les approbations de commandes
  - H2 : Points d’entrée de l’assistant
  - H2 : Transfert des notifications
  - H2 : Voir aussi

## platforms/digitalocean.md

- Route : /platforms/digitalocean
- Titres :
  - H2 : Voir aussi

## platforms/easyrunner.md

- Route : /platforms/easyrunner
- Titres :
  - H2 : Avant de commencer
  - H2 : Application Compose
  - H2 : Configurer OpenClaw
  - H2 : Vérifier
  - H2 : Mises à jour et sauvegardes
  - H2 : Dépannage

## platforms/index.md

- Route : /platforms
- Titres :
  - H2 : Choisir votre système d’exploitation
  - H2 : VPS et hébergement
  - H2 : Liens courants
  - H2 : Installation du service Gateway (CLI)
  - H2 : Voir aussi

## platforms/ios.md

- Route : /platforms/ios
- Titres :
  - H2 : Fonctionnement
  - H2 : Exigences
  - H2 : Démarrage rapide (appairage et connexion)
  - H2 : Examiner les approbations de commandes
  - H2 : Node Apple Watch direct facultatif
  - H2 : Notifications push relayées pour les versions officielles
  - H2 : Balises d’activité en arrière-plan
  - H2 : Flux d’authentification et de confiance
  - H2 : Méthodes de découverte
  - H3 : Bonjour (réseau local)
  - H3 : Tailnet (entre réseaux)
  - H3 : Hôte/port manuel
  - H2 : Plusieurs Gateways
  - H2 : Canevas et A2UI
  - H2 : Relation avec l’utilisation de l’ordinateur
  - H3 : Évaluation / instantané du canevas
  - H2 : Réveil vocal et mode conversation
  - H2 : Erreurs courantes
  - H2 : Documentation associée

## platforms/linux.md

- Route : /platforms/linux
- Titres :
  - H2 : Parcours rapide (VPS)
  - H2 : Installation
  - H2 : Service Gateway (systemd)
  - H2 : Pression mémoire et arrêts par manque de mémoire
  - H2 : Voir aussi

## platforms/mac/bundled-gateway.md

- Route : /platforms/mac/bundled-gateway
- Titres :
  - H2 : Configuration automatique
  - H2 : Récupération manuelle
  - H2 : Launchd (Gateway en tant que LaunchAgent)
  - H2 : Compatibilité des versions
  - H2 : Répertoire d’état sous macOS
  - H2 : Débogage de la connectivité de l’application
  - H2 : Vérification rapide
  - H2 : Voir aussi

## platforms/mac/canvas.md

- Route : /platforms/mac/canvas
- Titres :
  - H2 : Emplacement de Canvas
  - H2 : Comportement du panneau
  - H2 : Surface de l’API de l’agent
  - H2 : A2UI dans Canvas
  - H3 : Commandes A2UI (v0.8)
  - H2 : Déclenchement des exécutions d’agent depuis Canvas
  - H2 : Remarques de sécurité
  - H2 : Voir aussi

## platforms/mac/child-process.md

- Route : /platforms/mac/child-process
- Titres :
  - H2 : Comportement par défaut (launchd)
  - H2 : Builds de développement non signés
  - H2 : Mode connexion uniquement
  - H2 : Mode distant
  - H2 : Pourquoi nous privilégions launchd
  - H2 : Voir aussi

## platforms/mac/dev-setup.md

- Route : /platforms/mac/dev-setup
- Titres :
  - H1 : Configuration de l’environnement de développement macOS
  - H2 : Prérequis
  - H2 : 1. Installer les dépendances
  - H2 : 2. Compiler et empaqueter l’application
  - H2 : 3. Installer la CLI et le Gateway
  - H2 : Résolution des problèmes
  - H3 : Échec de la compilation : incompatibilité de la chaîne d’outils ou du SDK
  - H3 : L’application plante lors de l’octroi d’une autorisation
  - H3 : Le Gateway reste indéfiniment sur « Starting... »
  - H2 : Voir aussi

## platforms/mac/health.md

- Route : /platforms/mac/health
- Titres :
  - H1 : Contrôles d’intégrité sous macOS
  - H2 : Barre des menus
  - H2 : Paramètres
  - H2 : Fonctionnement de la sonde
  - H2 : En cas de doute
  - H2 : Voir aussi

## platforms/mac/icon.md

- Route : /platforms/mac/icon
- Titres :
  - H1 : États de l’icône de la barre des menus
  - H2 : États
  - H2 : Oreilles de l’activation vocale
  - H2 : Formes et tailles
  - H2 : Remarques sur le comportement
  - H2 : Voir aussi

## platforms/mac/logging.md

- Route : /platforms/mac/logging
- Titres :
  - H1 : Journalisation (macOS)
  - H2 : Fichier journal de diagnostic avec rotation (volet de débogage)
  - H2 : Données privées de la journalisation unifiée sous macOS
  - H2 : Activation pour OpenClaw (ai.openclaw)
  - H2 : Désactivation après le débogage
  - H2 : Voir aussi

## platforms/mac/menu-bar.md

- Route : /platforms/mac/menu-bar
- Titres :
  - H2 : Éléments affichés
  - H2 : Modèle d’état
  - H2 : Énumération IconState (Swift)
  - H3 : ActivityKind -&gt; symbole du badge
  - H3 : Correspondance visuelle
  - H2 : Sous-menu contextuel
  - H2 : Texte de la ligne d’état (menu)
  - H2 : Ingestion des événements
  - H2 : Remplacement pour le débogage
  - H2 : Liste de contrôle des tests
  - H2 : Voir aussi

## platforms/mac/peekaboo.md

- Route : /platforms/mac/peekaboo
- Titres :
  - H2 : Ce que c’est (et ce que ce n’est pas)
  - H2 : Relation avec les autres mécanismes de contrôle du bureau
  - H2 : Activation du pont
  - H2 : Ordre de découverte des clients
  - H2 : Sécurité et autorisations
  - H2 : Comportement des instantanés (automatisation)
  - H2 : Résolution des problèmes
  - H2 : Voir aussi

## platforms/mac/permissions.md

- Route : /platforms/mac/permissions
- Titres :
  - H2 : Conditions requises pour des autorisations stables
  - H2 : Autorisations d’accessibilité pour les environnements d’exécution Node et CLI
  - H2 : Liste de contrôle de récupération lorsque les invites disparaissent
  - H2 : Autorisations des fichiers et dossiers (Desktop/Documents/Downloads)
  - H2 : Voir aussi

## platforms/mac/remote.md

- Route : /platforms/mac/remote
- Titres :
  - H2 : Modes
  - H2 : Transports distants
  - H2 : Prérequis sur l’hôte distant
  - H2 : Configuration de l’application macOS
  - H2 : Chat Web
  - H2 : Autorisations
  - H2 : Remarques de sécurité
  - H2 : Flux de connexion WhatsApp (à distance)
  - H2 : Résolution des problèmes
  - H2 : Sons de notification
  - H2 : Voir aussi

## platforms/mac/signing.md

- Route : /platforms/mac/signing
- Titres :
  - H1 : Signature mac (builds de débogage)
  - H2 : Utilisation
  - H3 : Remarque sur la signature ad hoc
  - H2 : Métadonnées de build pour la section À propos
  - H2 : Voir aussi

## platforms/mac/skills.md

- Route : /platforms/mac/skills
- Titres :
  - H2 : Source de données
  - H2 : Actions d’installation
  - H2 : Variables d’environnement/clés d’API
  - H2 : Mode distant
  - H2 : Voir aussi

## platforms/mac/voice-overlay.md

- Route : /platforms/mac/voice-overlay
- Titres :
  - H1 : Cycle de vie de la superposition vocale (macOS)
  - H2 : Comportement
  - H2 : Implémentation
  - H2 : Journalisation
  - H2 : Liste de contrôle du débogage
  - H2 : Voir aussi

## platforms/mac/voicewake.md

- Route : /platforms/mac/voicewake
- Titres :
  - H1 : Activation vocale et appui pour parler
  - H2 : Conditions requises
  - H2 : Modes
  - H2 : Comportement à l’exécution (mot d’activation)
  - H2 : Invariants du cycle de vie
  - H2 : Particularités de l’appui pour parler
  - H2 : Paramètres visibles par l’utilisateur
  - H2 : Comportement du transfert
  - H2 : Charge utile du transfert
  - H2 : Vérification rapide
  - H2 : Voir aussi

## platforms/mac/webchat.md

- Route : /platforms/mac/webchat
- Titres :
  - H2 : Lancement et débogage
  - H2 : Fonctionnement du raccordement
  - H2 : Surface de sécurité
  - H2 : Limitations connues
  - H2 : Voir aussi

## platforms/mac/xpc.md

- Route : /platforms/mac/xpc
- Titres :
  - H1 : Architecture IPC d’OpenClaw sous macOS
  - H2 : Objectifs
  - H2 : Fonctionnement
  - H3 : Gateway + transport du Node
  - H3 : Service Node + IPC de l’application
  - H3 : PeekabooBridge (automatisation de l’interface utilisateur)
  - H2 : Flux opérationnels
  - H2 : Remarques sur le renforcement de la sécurité
  - H2 : Voir aussi

## platforms/macos.md

- Route : /platforms/macos
- Titres :
  - H2 : Téléchargement
  - H2 : Premier lancement
  - H2 : Mises à jour
  - H2 : Ouverture des liens du tableau de bord
  - H2 : Importation des connexions du navigateur
  - H2 : Choix d’un mode de Gateway
  - H2 : Éléments gérés par l’application
  - H2 : Pages détaillées sur macOS
  - H2 : Voir aussi

## platforms/oracle.md

- Route : /platforms/oracle
- Titres :
  - H2 : Voir aussi

## platforms/raspberry-pi.md

- Route : /platforms/raspberry-pi
- Titres :
  - H2 : Voir aussi

## platforms/windows.md

- Route : /platforms/windows
- Titres :
  - H2 : Recommandé : Windows Hub
  - H3 : Contenu de Windows Hub
  - H3 : Premier lancement
  - H2 : Mode Node sous Windows
  - H2 : Mode MCP local
  - H2 : CLI et Gateway Windows natifs
  - H2 : Gateway WSL2
  - H2 : Démarrage automatique du Gateway avant la connexion à Windows
  - H2 : Exposition des services WSL sur le réseau local
  - H2 : Résolution des problèmes
  - H3 : L’icône de la zone de notification n’apparaît pas
  - H3 : Échec de la configuration locale
  - H3 : L’application indique qu’un appairage est requis
  - H3 : Le chat Web ne peut pas joindre un Gateway distant
  - H3 : Échec des commandes screen.snapshot, de caméra ou audio
  - H3 : Échec de la connectivité à Git ou GitHub
  - H2 : Voir aussi

## plugins/adding-capabilities.md

- Route : /plugins/adding-capabilities
- Titres :
  - H2 : Quand créer une capacité
  - H2 : Séquence standard
  - H2 : Répartition des éléments
  - H2 : Points d’intégration du fournisseur et du harnais
  - H2 : Liste de contrôle des fichiers
  - H2 : Exemple détaillé : génération d’images
  - H2 : Fournisseurs d’embeddings
  - H2 : Liste de contrôle de la revue
  - H2 : Voir aussi

## plugins/admin-http-rpc.md

- Route : /plugins/admin-http-rpc
- Titres :
  - H2 : Avant l’activation
  - H2 : Activation
  - H2 : Vérification de la route
  - H2 : Authentification
  - H2 : Modèle de sécurité
  - H2 : Requête
  - H2 : Réponse
  - H2 : Méthodes autorisées
  - H2 : Comparaison avec WebSocket
  - H2 : Résolution des problèmes
  - H2 : Voir aussi

## plugins/agent-tools.md

- Route : /plugins/agent-tools
- Titres :
  - H2 : Voir aussi

## plugins/architecture-internals.md

- Route : /plugins/architecture-internals
- Titres :
  - H2 : Pipeline de chargement
  - H3 : Comportement privilégiant le manifeste
  - H3 : Limite du cache des Plugins
  - H2 : Modèle de registre
  - H2 : Rappels de liaison des conversations
  - H2 : Hooks d’exécution du fournisseur
  - H3 : Ordre et utilisation des hooks
  - H3 : Exemple de fournisseur
  - H3 : Exemples intégrés
  - H2 : Utilitaires d’exécution
  - H3 : api.runtime.imageGeneration
  - H2 : Routes HTTP du Gateway
  - H2 : Chemins d’importation du SDK des Plugins
  - H2 : Schémas des outils de messagerie
  - H2 : Résolution de la cible du canal
  - H2 : Répertoires fondés sur la configuration
  - H2 : Catalogues des fournisseurs
  - H2 : Inspection des canaux en lecture seule
  - H2 : Paquets groupés
  - H3 : Métadonnées du catalogue des canaux
  - H2 : Plugins de moteur de contexte
  - H2 : Ajout d’une nouvelle capacité
  - H3 : Liste de contrôle des capacités
  - H3 : Modèle de capacité
  - H2 : Voir aussi

## plugins/architecture.md

- Route : /plugins/architecture
- Titres :
  - H2 : Modèle public des capacités
  - H3 : Position sur la compatibilité externe
  - H3 : Formes des Plugins
  - H3 : Hooks hérités
  - H3 : Signaux de compatibilité
  - H2 : Vue d’ensemble de l’architecture
  - H3 : Instantané des métadonnées des Plugins et table de recherche
  - H3 : Planification de l’activation
  - H3 : Plugins de canal et outil de messagerie partagé
  - H2 : Modèle de propriété des capacités
  - H3 : Organisation en couches des capacités
  - H3 : Exemple de Plugin d’entreprise à capacités multiples
  - H3 : Exemple de capacité : compréhension vidéo
  - H2 : Contrats et application
  - H3 : Éléments à inclure dans un contrat
  - H2 : Modèle d’exécution
  - H2 : Limite d’exportation
  - H2 : Fonctionnement interne et référence
  - H2 : Voir aussi

## plugins/building-extensions.md

- Route : /plugins/building-extensions
- Titres :
  - H2 : Voir aussi

## plugins/building-plugins.md

- Route : /plugins/building-plugins
- Titres :
  - H2 : Conditions requises
  - H2 : Choix de la forme du Plugin
  - H2 : Démarrage rapide
  - H2 : Enregistrement des outils
  - H2 : Conventions d’importation
  - H2 : Liste de contrôle avant soumission
  - H2 : Test avec les versions bêta
  - H2 : Étapes suivantes
  - H2 : Voir aussi

## plugins/bundles.md

- Route : /plugins/bundles
- Titres :
  - H2 : Pourquoi les bundles existent
  - H2 : Installation d’un bundle
  - H2 : Éléments qu’OpenClaw mappe depuis les bundles
  - H3 : Pris en charge actuellement
  - H4 : Contenu des Skills
  - H4 : Paquets de hooks
  - H4 : MCP pour OpenClaw intégré
  - H4 : Paramètres d’OpenClaw intégré
  - H4 : LSP d’OpenClaw intégré
  - H3 : Détecté mais non exécuté
  - H2 : Formats des bundles
  - H2 : Ordre de priorité de la détection
  - H2 : Dépendances d’exécution et nettoyage
  - H2 : Sécurité
  - H2 : Résolution des problèmes
  - H2 : Voir aussi

## plugins/cli-backend-plugins.md

- Route : /plugins/cli-backend-plugins
- Titres :
  - H2 : Éléments gérés par le Plugin
  - H2 : Plugin de backend minimal
  - H2 : Forme de la configuration
  - H2 : Hooks de backend avancés
  - H3 : ownsNativeCompaction : désactivation de la Compaction d’OpenClaw
  - H2 : Pont d’outils MCP
  - H2 : Configuration utilisateur
  - H2 : Vérification
  - H2 : Liste de contrôle
  - H2 : Voir aussi

## plugins/codex-computer-use.md

- Route : /plugins/codex-computer-use
- Titres :
  - H2 : OpenClaw.app et Peekaboo
  - H2 : Application iOS
  - H2 : MCP cua-driver direct
  - H2 : Configuration rapide
  - H2 : Commandes
  - H2 : Choix de marketplaces
  - H2 : Marketplace macOS intégrée
  - H3 : Cache partagé des Plugins
  - H2 : Limite du catalogue distant
  - H2 : Référence de configuration
  - H2 : Éléments vérifiés par OpenClaw
  - H2 : Autorisations macOS
  - H2 : Résolution des problèmes
  - H2 : Voir aussi

## plugins/codex-harness-reference.md

- Route : /plugins/codex-harness-reference
- Titres :
  - H2 : Surface de configuration du Plugin
  - H2 : Supervision
  - H2 : Transport du serveur d’application
  - H2 : Modes d’approbation et de bac à sable
  - H2 : Exécution native en bac à sable
  - H2 : Isolation de l’authentification et de l’environnement
  - H2 : Outils dynamiques
  - H2 : Délais d’expiration
  - H2 : Découverte des modèles
  - H2 : Fichiers d’amorçage de l’espace de travail
  - H2 : Remplacements d’environnement
  - H2 : Voir aussi

## plugins/codex-harness-runtime.md

- Route : /plugins/codex-harness-runtime
- Titres :
  - H2 : Vue d’ensemble
  - H2 : Liaisons des fils de discussion et changements de modèle
  - H2 : Supervision et poursuite sécurisée
  - H2 : Réponses visibles et Heartbeats
  - H2 : Limites des hooks
  - H2 : Contrat de prise en charge V1
  - H2 : Autorisations natives et sollicitations MCP
  - H2 : Pilotage de la file d’attente
  - H2 : Téléversement des commentaires Codex
  - H2 : Compaction et miroir de la transcription
  - H2 : Médias et livraison
  - H2 : Voir aussi

## plugins/codex-harness.md

- Route : /plugins/codex-harness
- Titres :
  - H2 : Conditions requises
  - H2 : Démarrage rapide
  - H2 : Partage des fils de discussion avec Codex Desktop et la CLI
  - H2 : Supervision des sessions Codex
  - H2 : Configuration
  - H3 : Compaction
  - H2 : Vérification de l’environnement d’exécution Codex
  - H2 : Routage et sélection du modèle
  - H2 : Modèles de déploiement
  - H3 : Déploiement Codex de base
  - H3 : Déploiement avec fournisseurs mixtes
  - H3 : Déploiement Codex avec fermeture en cas d’échec
  - H2 : Politique du serveur d’application
  - H2 : Commandes et diagnostics
  - H3 : Inspection locale des fils de discussion Codex
  - H3 : Ordre d’authentification
  - H3 : Isolation de l’environnement
  - H3 : Outils dynamiques et recherche Web
  - H3 : Champs de configuration
  - H3 : Délais d’expiration des appels d’outils dynamiques
  - H3 : Remplacements des variables d’environnement pour les tests locaux
  - H2 : Plugins Codex natifs
  - H2 : Utilisation de l’ordinateur
  - H2 : Limites de l’environnement d’exécution
  - H2 : Résolution des problèmes
  - H2 : Voir aussi

## plugins/codex-native-plugins.md

- Route : /plugins/codex-native-plugins
- Titres :
  - H2 : Prérequis
  - H2 : Démarrage rapide
  - H2 : Gérer les Plugins depuis le chat
  - H2 : Fonctionnement de la configuration des Plugins natifs
  - H2 : Périmètre de prise en charge de la V1
  - H2 : Inventaire et propriété des applications
  - H2 : Applications des comptes connectés
  - H2 : Configuration des applications du fil de discussion
  - H2 : Politique relative aux actions destructrices
  - H2 : Dépannage
  - H2 : Voir aussi

## plugins/codex-supervision.md

- Route : /plugins/codex-supervision
- Titres :
  - H2 : Avant de commencer
  - H2 : Activer la supervision
  - H2 : Utiliser la CLI opérateur
  - H2 : Créer une branche depuis une session locale
  - H2 : Archiver une session locale
  - H2 : Comprendre les limites des Nodes appairés
  - H2 : Métadonnées et autorisations
  - H3 : Outils de compatibilité
  - H2 : Dépannage
  - H2 : Voir aussi

## plugins/community.md

- Route : /plugins/community
- Titres :
  - H2 : Trouver des Plugins
  - H2 : Publier des Plugins
  - H2 : Voir aussi

## plugins/compatibility.md

- Route : /plugins/compatibility
- Titres :
  - H2 : Registre de compatibilité
  - H2 : Politique d’obsolescence
  - H2 : Domaines de compatibilité actuels
  - H3 : Alias plats des rappels entrants WhatsApp
  - H3 : Champs d’admission entrants WhatsApp
  - H2 : Package d’inspection des Plugins
  - H3 : Voie d’acceptation des responsables de maintenance
  - H2 : Notes de version

## plugins/copilot.md

- Route : /plugins/copilot
- Titres :
  - H2 : Prérequis
  - H2 : Installation
  - H2 : Démarrage rapide
  - H2 : Fournisseurs pris en charge
  - H2 : BYOK
  - H2 : Authentification
  - H2 : Surface de configuration
  - H2 : Compaction
  - H2 : Mise en miroir de la transcription
  - H2 : Questions annexes (/btw)
  - H2 : Doctor
  - H2 : Limites
  - H2 : Autorisations et askuser
  - H3 : Jeton GitHub au niveau de la session
  - H2 : Voir aussi

## plugins/dependency-resolution.md

- Route : /plugins/dependency-resolution
- Titres :
  - H2 : Répartition des responsabilités
  - H2 : Racines d’installation
  - H2 : Plugins locaux
  - H2 : Démarrage et rechargement
  - H2 : Plugins intégrés
  - H2 : Nettoyage des éléments hérités

## plugins/google-meet.md

- Route : /plugins/google-meet
- Titres :
  - H2 : Démarrage rapide
  - H3 : Créer une réunion
  - H3 : Rejoindre en mode observation uniquement
  - H3 : État de santé de la session en temps réel
  - H2 : Gateway local + Chrome sous Parallels
  - H3 : Vérifications des défaillances courantes
  - H2 : Notes d’installation
  - H2 : Transports
  - H3 : Chrome
  - H3 : Twilio
  - H2 : OAuth et vérification préalable
  - H3 : Créer des identifiants Google
  - H3 : Générer le jeton d’actualisation
  - H3 : Vérifier OAuth avec Doctor
  - H3 : Résoudre, effectuer la vérification préalable et lire les artefacts
  - H3 : Test de bon fonctionnement en direct
  - H3 : Créer des exemples
  - H2 : Configuration
  - H3 : Valeurs par défaut
  - H3 : Remplacements facultatifs
  - H2 : Outil
  - H2 : Modes agent et bidirectionnel
  - H2 : Liste de contrôle des tests en direct
  - H2 : Dépannage
  - H3 : L’agent ne voit pas l’outil Google Meet
  - H3 : Aucun Node connecté compatible avec Google Meet
  - H3 : Le navigateur s’ouvre, mais l’agent ne peut pas rejoindre la réunion
  - H3 : La création de la réunion échoue
  - H3 : L’agent rejoint la réunion, mais ne parle pas
  - H3 : Les vérifications de configuration de Twilio échouent
  - H3 : L’appel Twilio démarre, mais n’entre jamais dans la réunion
  - H2 : Remarques
  - H2 : Voir aussi

## plugins/hooks.md

- Route : /plugins/hooks
- Titres :
  - H2 : Démarrage rapide
  - H2 : Catalogue des hooks
  - H3 : Demandes d’appairage de canaux
  - H2 : Déboguer les hooks d’exécution
  - H2 : Politique relative aux appels d’outils
  - H3 : Hook de l’environnement d’exécution
  - H3 : Persistance des résultats d’outils
  - H2 : Hooks de prompt et de modèle
  - H3 : Extensions de session et injections au tour suivant
  - H2 : Hooks de messages
  - H2 : Hooks d’installation
  - H2 : Cycle de vie du Gateway
  - H3 : Projection Cron externe sécurisée
  - H2 : Obsolescences à venir
  - H2 : Voir aussi

## plugins/install-overrides.md

- Route : /plugins/install-overrides
- Titres :
  - H2 : Environnement
  - H2 : Comportement
  - H2 : E2E du package

## plugins/llama-cpp.md

- Route : /plugins/llama-cpp
- Titres :
  - H2 : Configuration
  - H2 : Environnement d’exécution natif
  - H2 : Diagnostics d’exécution
  - H2 : Dépannage

## plugins/logbook.md

- Route : /plugins/logbook
- Titres :
  - H2 : Avant de commencer
  - H2 : Démarrage rapide
  - H2 : Fonctionnement
  - H2 : Flux du modèle et des données
  - H2 : Configuration
  - H3 : Sélection du modèle de vision
  - H2 : Onglet du tableau de bord
  - H2 : Méthodes du Gateway
  - H2 : Remarques relatives à la confidentialité
  - H2 : Dépannage
  - H3 : L’onglet Logbook est absent
  - H3 : La capture signale une erreur
  - H3 : Les captures réussissent, mais aucune carte n’apparaît
  - H2 : Voir aussi

## plugins/manage-plugins.md

- Route : /plugins/manage-plugins
- Titres :
  - H2 : Utiliser l’interface de contrôle
  - H2 : Répertorier et rechercher des Plugins
  - H2 : Activer et désactiver des Plugins
  - H2 : Installer des Plugins
  - H2 : Redémarrer et inspecter
  - H2 : Mettre à jour des Plugins
  - H2 : Désinstaller des Plugins
  - H2 : Choisir une source
  - H2 : Publier des Plugins
  - H2 : Voir aussi

## plugins/manifest.md

- Route : /plugins/manifest
- Titres :
  - H2 : Rôle de ce fichier
  - H2 : Exemple minimal
  - H2 : Exemple complet
  - H2 : Référence des champs de premier niveau
  - H2 : Référence de catalog
  - H2 : Référence des métadonnées du fournisseur de génération
  - H2 : Référence des métadonnées d’outil
  - H2 : Référence de providerAuthChoices
  - H2 : Référence de commandAliases
  - H2 : Référence de activation
  - H2 : Référence de qaRunners
  - H2 : Référence de setup
  - H3 : Référence de setup.providers
  - H3 : Champs de setup
  - H2 : Référence de uiHints
  - H2 : Référence de contracts
  - H2 : Référence de configContracts
  - H2 : Référence de mediaUnderstandingProviderMetadata
  - H2 : Référence de channelConfigs
  - H3 : Remplacer un autre Plugin de canal
  - H2 : Référence de modelSupport
  - H2 : Référence de modelCatalog
  - H2 : Référence de modelIdNormalization
  - H2 : Référence de providerEndpoints
  - H2 : Référence de providerRequest
  - H2 : Référence de secretProviderIntegrations
  - H2 : Référence de modelPricing
  - H3 : Index des fournisseurs OpenClaw
  - H2 : Manifeste ou package.json
  - H3 : Champs de package.json influant sur la découverte
  - H2 : Priorité de découverte (identifiants de Plugin en double)
  - H2 : Exigences du schéma JSON
  - H2 : Comportement de validation
  - H2 : Remarques
  - H2 : Voir aussi

## plugins/memory-lancedb.md

- Route : /plugins/memory-lancedb
- Titres :
  - H2 : Installation
  - H2 : Démarrage rapide
  - H2 : Configuration des embeddings
  - H3 : Dimensions
  - H2 : Embeddings Ollama
  - H2 : Limites de rappel et de capture
  - H2 : Commandes
  - H2 : Stockage
  - H2 : Dépendances d’exécution et prise en charge des plateformes
  - H2 : Dépannage
  - H3 : La longueur de l’entrée dépasse la longueur du contexte
  - H3 : Modèle d’embedding non pris en charge
  - H3 : Le Plugin se charge, mais aucun souvenir n’apparaît
  - H2 : Voir aussi

## plugins/memory-wiki.md

- Route : /plugins/memory-wiki
- Titres :
  - H2 : Modes du coffre
  - H2 : Structure du coffre
  - H2 : Importations au format Open Knowledge Format
  - H2 : Assertions structurées et éléments probants
  - H2 : Métadonnées d’entité destinées aux agents
  - H2 : Pipeline de compilation
  - H2 : Tableaux de bord et rapports d’état
  - H2 : Recherche et récupération
  - H2 : Outils des agents
  - H2 : Comportement du prompt et du contexte
  - H2 : Configuration
  - H3 : Coffres par agent
  - H3 : Exemple : QMD + mode pont
  - H2 : CLI
  - H2 : Prise en charge d’Obsidian
  - H2 : Flux de travail recommandé
  - H2 : Documentation associée

## plugins/message-presentation.md

- Route : /plugins/message-presentation
- Titres :
  - H2 : Contrat
  - H2 : Exemples de producteurs
  - H2 : Contrat du moteur de rendu
  - H2 : Flux de rendu principal
  - H2 : Règles de dégradation
  - H3 : Visibilité de la valeur de repli des boutons
  - H2 : Mappage des fournisseurs
  - H2 : Présentation ou InteractiveReply
  - H2 : Épinglage de la livraison
  - H2 : Liste de contrôle pour les auteurs de Plugins
  - H2 : Documentation associée

## plugins/oc-path.md

- Route : /plugins/oc-path
- Titres :
  - H2 : Pourquoi l’activer
  - H2 : Où il s’exécute
  - H2 : Activation
  - H2 : Dépendances
  - H2 : Ce qu’il fournit
  - H2 : Relation avec les autres Plugins
  - H2 : Sécurité
  - H2 : Voir aussi

## plugins/plugin-inventory.md

- Route : /plugins/plugin-inventory
- Titres :
  - H1 : Inventaire des Plugins
  - H2 : Définitions
  - H2 : Installer un Plugin
  - H2 : Package npm principal
  - H2 : Packages externes officiels
  - H2 : Uniquement dans une extraction du code source

## plugins/plugin-permission-requests.md

- Route : /plugins/plugin-permission-requests
- Titres :
  - H2 : Choisir le mécanisme de contrôle approprié
  - H2 : Demander une approbation avant un appel d’outil
  - H2 : Comportement des décisions
  - H2 : Acheminer les demandes d’approbation
  - H2 : Autorisations natives de Codex
  - H2 : Dépannage
  - H2 : Voir aussi

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
  - H2 : Documentation associée

## plugins/reference/admin-http-rpc.md

- Route : /plugins/reference/admin-http-rpc
- Titres :
  - H1 : Plugin Admin Http Rpc
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/alibaba.md

- Route : /plugins/reference/alibaba
- Titres :
  - H1 : Plugin Alibaba
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/amazon-bedrock-mantle.md

- Route : /plugins/reference/amazon-bedrock-mantle
- Titres :
  - H1 : Plugin Amazon Bedrock Mantle
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/amazon-bedrock.md

- Route : /plugins/reference/amazon-bedrock
- Titres :
  - H1 : Plugin Amazon Bedrock
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/anthropic-vertex.md

- Route : /plugins/reference/anthropic-vertex
- Titres :
  - H1 : Plugin Anthropic Vertex
  - H2 : Distribution
  - H2 : Surface
  - H2 : Claude Fable 5
  - H2 : Claude Sonnet 5

## plugins/reference/anthropic.md

- Route : /plugins/reference/anthropic
- Titres :
  - H1 : Plugin Anthropic
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/arcee.md

- Route : /plugins/reference/arcee
- Titres :
  - H1 : Plugin Arcee
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/azure-speech.md

- Route : /plugins/reference/azure-speech
- Titres :
  - H1 : Plugin Azure Speech
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

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
  - H2 : Documentation associée

## plugins/reference/browser.md

- Route : /plugins/reference/browser
- Titres :
  - H1 : Plugin de navigateur
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

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
  - H2 : Documentation associée

## plugins/reference/chutes.md

- Route : /plugins/reference/chutes
- Titres :
  - H1 : Plugin Chutes
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/clawrouter.md

- Route : /plugins/reference/clawrouter
- Titres :
  - H1 : Plugin ClawRouter
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/clickclack.md

- Route : /plugins/reference/clickclack
- Titres :
  - H1 : Plugin Clickclack
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/cloudflare-ai-gateway.md

- Route : /plugins/reference/cloudflare-ai-gateway
- Titres :
  - H1 : Plugin Cloudflare AI Gateway
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/codex.md

- Route : /plugins/reference/codex
- Titres :
  - H1 : Plugin Codex
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/cohere.md

- Route : /plugins/reference/cohere
- Titres :
  - H1 : Plugin Cohere
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/comfy.md

- Route : /plugins/reference/comfy
- Titres :
  - H1 : Plugin ComfyUI
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

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
  - H2 : Documentation associée

## plugins/reference/crabbox.md

- Route : /plugins/reference/crabbox
- Titres :
  - H1 : Plugin Crabbox
  - H2 : Distribution
  - H2 : Surface
  - H2 : Configuration

## plugins/reference/deepgram.md

- Route : /plugins/reference/deepgram
- Titres :
  - H1 : Plugin Deepgram
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/deepinfra.md

- Route : /plugins/reference/deepinfra
- Titres :
  - H1 : Plugin DeepInfra
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/deepseek.md

- Route : /plugins/reference/deepseek
- Titres :
  - H1 : Plugin DeepSeek
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/diagnostics-otel.md

- Route : /plugins/reference/diagnostics-otel
- Titres :
  - H1 : Plugin de diagnostic OpenTelemetry
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/diagnostics-prometheus.md

- Route : /plugins/reference/diagnostics-prometheus
- Titres :
  - H1 : Plugin de diagnostic Prometheus
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/diffs-language-pack.md

- Route : /plugins/reference/diffs-language-pack
- Titres :
  - H1 : Plugin de pack linguistique Diffs
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
  - H2 : Documentation associée

## plugins/reference/document-extract.md

- Route : /plugins/reference/document-extract
- Titres :
  - H1 : Plugin d’extraction de documents
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/duckduckgo.md

- Route : /plugins/reference/duckduckgo
- Titres :
  - H1 : Plugin DuckDuckGo
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/elevenlabs.md

- Route : /plugins/reference/elevenlabs
- Titres :
  - H1 : Plugin Elevenlabs
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/exa.md

- Route : /plugins/reference/exa
- Titres :
  - H1 : Plugin Exa
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/fal.md

- Route : /plugins/reference/fal
- Titres :
  - H1 : Plugin fal
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/featherless.md

- Route : /plugins/reference/featherless
- Titres :
  - H1 : Plugin Featherless
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/feishu.md

- Route : /plugins/reference/feishu
- Titres :
  - H1 : Plugin Feishu
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/file-transfer.md

- Route : /plugins/reference/file-transfer
- Titres :
  - H1 : Plugin de transfert de fichiers
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/firecrawl.md

- Route : /plugins/reference/firecrawl
- Titres :
  - H1 : Plugin Firecrawl
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

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
  - H1 : Plugin de tâche LLM
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

## plugins/reference/logbook.md

- Route : /plugins/reference/logbook
- Titres :
  - H1 : Plugin de journal
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/longcat.md

- Route : /plugins/reference/longcat
- Titres :
  - H1 : Plugin LongCat
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

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

## plugins/reference/meta.md

- Route : /plugins/reference/meta
- Titres :
  - H1 : Plugin Meta
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/microsoft-foundry.md

- Route : /plugins/reference/microsoft-foundry
- Titres :
  - H1 : Plugin Microsoft Foundry
  - H2 : Distribution
  - H2 : Surface
  - H2 : Prérequis
  - H2 : Modèles de conversation
  - H2 : Génération d’images MAI
  - H2 : Résolution des problèmes

## plugins/reference/microsoft.md

- Route : /plugins/reference/microsoft
- Titres :
  - H1 : Plugin Microsoft
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/migrate-claude.md

- Route : /plugins/reference/migrate-claude
- Titres :
  - H1 : Plugin de migration de Claude
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/migrate-hermes.md

- Route : /plugins/reference/migrate-hermes
- Titres :
  - H1 : Plugin de migration d’Hermes
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
  - H1 : Plugin de politique
  - H2 : Distribution
  - H2 : Surface
  - H2 : Comportement
  - H2 : Documentation associée

## plugins/reference/qa-channel.md

- Route : /plugins/reference/qa-channel
- Titres :
  - H1 : Plugin de canal d’assurance qualité
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/qa-lab.md

- Route : /plugins/reference/qa-lab
- Titres :
  - H1 : Plugin de laboratoire d’assurance qualité
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/qa-matrix.md

- Route : /plugins/reference/qa-matrix
- Titres :
  - H1 : Plugin de matrice d’assurance qualité
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
  - H1 : Plugin SMS
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
  - H1 : Plugin CLI TTS local
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/twitch.md

- Route : /plugins/reference/twitch
- Titres :
  - H1 : Plugin Twitch
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/vault.md

- Route : /plugins/reference/vault
- Titres :
  - H1 : Plugin Vault
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/venice.md

- Route : /plugins/reference/venice
- Titres :
  - H1 : Plugin Venice
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/vercel-ai-gateway.md

- Route : /plugins/reference/vercel-ai-gateway
- Titres :
  - H1 : Plugin Vercel AI Gateway
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/vllm.md

- Route : /plugins/reference/vllm
- Titres :
  - H1 : Plugin vLLM
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/voice-call.md

- Route : /plugins/reference/voice-call
- Titres :
  - H1 : Plugin d’appel vocal
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/volcengine.md

- Route : /plugins/reference/volcengine
- Titres :
  - H1 : Plugin Volcengine
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

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
  - H2 : Documentation associée

## plugins/reference/web-readability.md

- Route : /plugins/reference/web-readability
- Titres :
  - H1 : Plugin de lisibilité Web
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/webhooks.md

- Route : /plugins/reference/webhooks
- Titres :
  - H1 : Plugin Webhooks
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/whatsapp.md

- Route : /plugins/reference/whatsapp
- Titres :
  - H1 : Plugin WhatsApp
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/workboard.md

- Route : /plugins/reference/workboard
- Titres :
  - H1 : Plugin Workboard
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/workspaces.md

- Route : /plugins/reference/workspaces
- Titres :
  - H1 : Plugin d’espaces de travail
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/xai.md

- Route : /plugins/reference/xai
- Titres :
  - H1 : Plugin xAI
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/xiaomi.md

- Route : /plugins/reference/xiaomi
- Titres :
  - H1 : Plugin Xiaomi
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/zai.md

- Route : /plugins/reference/zai
- Titres :
  - H1 : Plugin Z.AI
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/zalo.md

- Route : /plugins/reference/zalo
- Titres :
  - H1 : Plugin Zalo
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/zalouser.md

- Route : /plugins/reference/zalouser
- Titres :
  - H1 : Plugin Zalo Personal
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/sdk-agent-harness.md

- Route : /plugins/sdk-agent-harness
- Titres :
  - H2 : Quand utiliser un harnais
  - H2 : Ce qui reste sous la responsabilité du cœur
  - H3 : Amorçage de l’authentification géré par le harnais
  - H3 : Artefacts d’exécution vérifiés pour la configuration
  - H3 : Contrat de transport des requêtes
  - H2 : Enregistrer un harnais
  - H3 : Exécution déléguée
  - H2 : Politique de sélection
  - H2 : Association d’un fournisseur et d’un harnais
  - H3 : Intergiciel des résultats d’outils
  - H3 : Classification du résultat terminal
  - H3 : Effets secondaires de fin d’agent
  - H3 : Entrées utilisateur et surfaces d’outils
  - H3 : Mode de harnais Codex natif
  - H2 : Rigueur de l’exécution
  - H2 : Sessions natives et miroir de transcription
  - H2 : Résultats d’outils et de médias
  - H2 : Limitations actuelles
  - H2 : Voir aussi

## plugins/sdk-channel-inbound.md

- Route : /plugins/sdk-channel-inbound
- Titres :
  - H2 : Utilitaires du cœur
  - H2 : Migration

## plugins/sdk-channel-ingress.md

- Route : /plugins/sdk-channel-ingress
- Titres :
  - H2 : Résolveur d’exécution
  - H2 : Résultat
  - H2 : Groupes d’accès
  - H2 : Modes d’événement
  - H2 : Routes et activation
  - H2 : Masquage
  - H2 : Vérification

## plugins/sdk-channel-message.md

- Route : /plugins/sdk-channel-message
- Titres : aucun

## plugins/sdk-channel-outbound.md

- Route : /plugins/sdk-channel-outbound
- Titres :
  - H2 : Adaptateur
  - H2 : Assainissement du texte brut
  - H2 : Preuve de livraison
  - H2 : Adaptateurs sortants existants
  - H2 : Envois durables
  - H2 : Admission des livraisons différées
  - H2 : Répartition de compatibilité

## plugins/sdk-channel-plugins.md

- Route : /plugins/sdk-channel-plugins
- Titres :
  - H2 : Ce qui relève de votre Plugin
  - H2 : Adaptateur de messages
  - H3 : Entrée des messages entrants (expérimental)
  - H3 : Indicateurs de saisie
  - H3 : Paramètres de source des médias
  - H3 : Mise en forme de la charge utile native
  - H3 : Grammaire des conversations de session
  - H3 : Prise en charge de la liaison des conversations limitée au compte
  - H2 : Approbations et capacités du canal
  - H3 : Authentification des approbations
  - H3 : Cycle de vie de la charge utile et conseils de configuration
  - H3 : Livraison native des approbations
  - H3 : Sous-chemins d’exécution plus restreints pour les approbations
  - H3 : Sous-chemins de configuration
  - H3 : Autres sous-chemins de canal restreints
  - H2 : Politique de mention des messages entrants
  - H2 : Procédure détaillée
  - H2 : Structure des fichiers
  - H2 : Sujets avancés
  - H2 : Étapes suivantes
  - H2 : Voir aussi

## plugins/sdk-channel-turn.md

- Route : /plugins/sdk-channel-turn
- Titres : aucun

## plugins/sdk-entrypoints.md

- Route : /plugins/sdk-entrypoints
- Titres :
  - H2 : Entrées du paquet
  - H2 : defineToolPlugin
  - H2 : definePluginEntry
  - H2 : defineChannelPluginEntry
  - H2 : defineSetupPluginEntry
  - H2 : Mode d’enregistrement
  - H2 : Formes de Plugin
  - H2 : Voir aussi

## plugins/sdk-migration.md

- Route : /plugins/sdk-migration
- Titres :
  - H2 : Ce qui a changé
  - H3 : Pourquoi
  - H2 : Politique de compatibilité
  - H2 : Procédure de migration
  - H2 : Référence des chemins d’importation
  - H2 : Dépréciations actives
  - H2 : Migration de la conversation et de la voix en temps réel
  - H2 : Calendrier de suppression
  - H2 : Masquer temporairement les avertissements
  - H2 : Voir aussi

## plugins/sdk-overview.md

- Route : /plugins/sdk-overview
- Titres :
  - H2 : Convention d’importation
  - H2 : Référence des sous-chemins
  - H2 : API d’enregistrement
  - H3 : Enregistrement des capacités
  - H3 : Outils et commandes
  - H3 : Infrastructure
  - H3 : Hooks de l’hôte pour les Plugins de flux de travail
  - H3 : Enregistrement de la découverte du Gateway
  - H3 : Métadonnées d’enregistrement de la CLI
  - H3 : Enregistrement du moteur de la CLI
  - H3 : Emplacements exclusifs
  - H3 : Adaptateurs d’intégration de mémoire obsolètes
  - H3 : Événements et cycle de vie
  - H3 : Sémantique de décision des hooks
  - H3 : Champs de l’objet API
  - H2 : Convention des modules internes
  - H2 : Voir aussi

## plugins/sdk-provider-plugins.md

- Route : /plugins/sdk-provider-plugins
- Titres :
  - H2 : Procédure détaillée
  - H2 : Publier sur ClawHub
  - H2 : Structure des fichiers
  - H2 : Référence de l’ordre du catalogue
  - H2 : Étapes suivantes
  - H2 : Voir aussi

## plugins/sdk-runtime.md

- Route : /plugins/sdk-runtime
- Titres :
  - H2 : Chargement et écriture de la configuration
  - H2 : Utilitaires d’exécution réutilisables
  - H2 : Espaces de noms d’exécution
  - H2 : Stockage des références d’exécution
  - H2 : Autres champs de premier niveau de l’API
  - H2 : Voir aussi

## plugins/sdk-setup.md

- Route : /plugins/sdk-setup
- Titres :
  - H2 : Métadonnées du paquet
  - H3 : Champs openclaw
  - H3 : openclaw.channel
  - H3 : openclaw.install
  - H3 : Chargement complet différé
  - H2 : Manifeste du Plugin
  - H2 : Publication sur ClawHub
  - H2 : Entrée de configuration
  - H3 : Importations restreintes des utilitaires de configuration
  - H3 : Promotion vers un compte unique gérée par le canal
  - H2 : Schéma de configuration
  - H3 : Création de schémas de configuration de canal
  - H2 : Assistants de configuration
  - H2 : Publication et installation
  - H2 : Voir aussi

## plugins/sdk-subpaths.md

- Route : /plugins/sdk-subpaths
- Titres :
  - H2 : Entrée du Plugin
  - H3 : Utilitaires de compatibilité et de test obsolètes
  - H3 : Sous-chemins réservés aux utilitaires des Plugins intégrés
  - H2 : Voir aussi

## plugins/sdk-testing.md

- Route : /plugins/sdk-testing
- Titres :
  - H2 : Utilitaires de test
  - H3 : Exportations disponibles
  - H3 : Types
  - H2 : Test de la résolution de la cible
  - H2 : Modèles de test
  - H3 : Test des contrats d’enregistrement
  - H3 : Test de l’accès à la configuration d’exécution
  - H3 : Test unitaire d’un Plugin de canal
  - H3 : Test unitaire d’un Plugin de fournisseur
  - H3 : Simulation de l’exécution du Plugin
  - H3 : Tests avec des substituts propres à chaque instance
  - H2 : Tests de contrat (Plugins du dépôt)
  - H3 : Exécution de tests ciblés
  - H2 : Application des règles de lint (Plugins du dépôt)
  - H2 : Configuration des tests
  - H2 : Voir aussi

## plugins/tool-plugins.md

- Route : /plugins/tool-plugins
- Titres :
  - H2 : Prérequis
  - H2 : Démarrage rapide
  - H2 : Écrire un outil
  - H2 : Outils facultatifs et outils fabriques
  - H2 : Valeurs de retour
  - H2 : Configuration
  - H2 : Métadonnées générées
  - H2 : Métadonnées du paquet
  - H2 : Valider dans la CI
  - H2 : Installer et inspecter localement
  - H2 : Publier
  - H2 : Dépannage
  - H3 : entrée du Plugin introuvable : ./dist/index.js
  - H3 : l’entrée du Plugin n’expose pas les métadonnées defineToolPlugin
  - H3 : les métadonnées générées de openclaw.plugin.json sont obsolètes
  - H3 : openclaw.extensions dans package.json doit inclure ./dist/index.js
  - H3 : Paquet 'typebox' introuvable
  - H3 : L’outil n’apparaît pas après l’installation
  - H2 : Voir aussi

## plugins/vault.md

- Route : /plugins/vault
- Titres :
  - H1 : SecretRefs de Vault
  - H2 : Avant de commencer
  - H2 : Stocker une clé de fournisseur dans Vault
  - H2 : Rendre Vault visible pour le Gateway
  - H2 : Générer et appliquer un plan SecretRef
  - H2 : Configurer d’autres clés de fournisseur
  - H2 : Format de l’identifiant SecretRef
  - H2 : Ce que stocke OpenClaw
  - H2 : Conteneurs et déploiements gérés
  - H2 : Pages connexes

## plugins/voice-call.md

- Route : /plugins/voice-call
- Titres :
  - H2 : Démarrage rapide
  - H2 : Configuration
  - H3 : Référence de configuration
  - H2 : Portée de la session
  - H2 : Conversations vocales en temps réel
  - H3 : Politique des outils
  - H3 : Contexte vocal de l’agent
  - H3 : Exemples de fournisseurs en temps réel
  - H2 : Transcription en continu
  - H3 : Exemples de fournisseurs de diffusion en continu
  - H2 : Synthèse vocale pour les appels
  - H3 : Exemples de synthèse vocale
  - H2 : Appels entrants
  - H3 : Routage par numéro
  - H3 : Contrat de sortie vocale
  - H3 : Comportement au démarrage de la conversation
  - H3 : Délai de grâce après la déconnexion du flux Twilio
  - H2 : Nettoyeur d’appels obsolètes
  - H2 : Sécurité du Webhook
  - H2 : CLI
  - H2 : Outil de l’agent
  - H2 : RPC du Gateway
  - H2 : Dépannage
  - H3 : La configuration échoue lors de l’exposition du Webhook
  - H3 : Les identifiants du fournisseur échouent
  - H3 : Les appels démarrent, mais les Webhooks du fournisseur n’arrivent pas
  - H3 : La vérification de la signature échoue
  - H3 : Les participations à Google Meet via Twilio échouent
  - H3 : L’appel en temps réel ne comporte aucune parole
  - H2 : Pages connexes

## plugins/webhooks.md

- Route : /plugins/webhooks
- Titres :
  - H2 : Configurer les routes
  - H2 : Modèle de sécurité
  - H2 : Format de la requête
  - H2 : Actions prises en charge
  - H3 : createflow
  - H3 : runtask
  - H2 : Structure de la réponse
  - H2 : Pages connexes

## plugins/workboard.md

- Route : /plugins/workboard
- Titres :
  - H2 : L’activer
  - H2 : Configuration
  - H2 : Champs des cartes
  - H2 : Démarrer le travail depuis une carte
  - H2 : Outils de l’agent
  - H2 : Répartition
  - H3 : Sélection du worker
  - H3 : Points d’entrée
  - H2 : CLI et commande slash
  - H2 : Synchronisation du cycle de vie des sessions
  - H2 : Flux de travail du tableau de bord
  - H2 : Diagnostics
  - H2 : Autorisations
  - H2 : Stockage
  - H2 : Dépannage
  - H2 : Pages connexes

## plugins/zalouser.md

- Route : /plugins/zalouser
- Titres :
  - H2 : Nommage
  - H2 : Où il s’exécute
  - H2 : Installation
  - H3 : Depuis npm
  - H3 : Depuis un dossier local (développement)
  - H2 : Configuration
  - H2 : CLI
  - H2 : Outil de l’agent
  - H2 : Pages connexes

## prose.md

- Route : /prose
- Titres :
  - H2 : Installation
  - H2 : Commande slash
  - H2 : Ce qu’il peut faire
  - H2 : Exemple : recherche parallèle et synthèse
  - H2 : Correspondance avec l’environnement d’exécution OpenClaw
  - H2 : Emplacements des fichiers
  - H2 : Systèmes de stockage de l’état
  - H2 : Sécurité
  - H2 : Pages connexes

## providers/alibaba.md

- Route : /providers/alibaba
- Titres :
  - H2 : Prise en main
  - H2 : Modèles Wan intégrés
  - H2 : Fonctionnalités et limites
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/anthropic.md

- Route : /providers/anthropic
- Titres :
  - H2 : Suivi de l’utilisation et des coûts
  - H2 : Prise en main
  - H2 : Sessions Claude sur plusieurs ordinateurs
  - H2 : Paramètres de réflexion par défaut (Claude Sonnet 5, Mythos 5, Fable 5, 4.8 et 4.6)
  - H2 : Solution de repli en cas de refus de sécurité (Claude Fable 5)
  - H3 : Raison d’être
  - H3 : Fonctionnement
  - H3 : Observabilité et facturation
  - H3 : Portée
  - H2 : Mise en cache des prompts
  - H2 : Configuration avancée
  - H2 : Dépannage
  - H2 : Pages connexes

## providers/arcee.md

- Route : /providers/arcee
- Titres :
  - H2 : Installer le Plugin
  - H2 : Prise en main
  - H2 : Configuration non interactive
  - H2 : Catalogue intégré
  - H2 : Fonctionnalités prises en charge
  - H2 : Pages connexes

## providers/azure-speech.md

- Route : /providers/azure-speech
- Titres :
  - H2 : Prise en main
  - H2 : Options de configuration
  - H2 : Remarques
  - H2 : Pages connexes

## providers/bedrock-mantle.md

- Route : /providers/bedrock-mantle
- Titres :
  - H2 : Prise en main
  - H2 : Découverte automatique des modèles
  - H3 : Régions prises en charge
  - H2 : Configuration manuelle
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/bedrock.md

- Route : /providers/bedrock
- Titres :
  - H2 : Prise en main
  - H2 : Découverte automatique des modèles
  - H2 : Configuration rapide (méthode AWS)
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/cerebras.md

- Route : /providers/cerebras
- Titres :
  - H2 : Installer le Plugin
  - H2 : Prise en main
  - H2 : Configuration non interactive
  - H2 : Catalogue intégré
  - H2 : Configuration manuelle
  - H2 : Pages connexes

## providers/chutes.md

- Route : /providers/chutes
- Titres :
  - H2 : Installer le Plugin
  - H2 : Prise en main
  - H2 : Comportement de la découverte
  - H2 : Alias par défaut
  - H2 : Catalogue de démarrage intégré
  - H2 : Exemple de configuration
  - H2 : Pages connexes

## providers/claude-max-api-proxy.md

- Route : /providers/claude-max-api-proxy
- Titres :
  - H2 : Pourquoi l’utiliser
  - H2 : Fonctionnement
  - H2 : Prise en main
  - H2 : Configuration avancée
  - H2 : Remarques
  - H2 : Pages connexes

## providers/clawrouter.md

- Route : /providers/clawrouter
- Titres :
  - H2 : Prise en main
  - H2 : Déploiement géré non interactif
  - H2 : État de préparation et preuve en conditions réelles
  - H2 : Découverte des modèles
  - H2 : Plugins de protocole et de fournisseur
  - H2 : Quotas et utilisation
  - H2 : Dépannage
  - H2 : Comportement de sécurité
  - H2 : Pages connexes

## providers/cloudflare-ai-gateway.md

- Route : /providers/cloudflare-ai-gateway
- Titres :
  - H2 : Installer le Plugin
  - H2 : Prise en main
  - H2 : Exemple non interactif
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/cohere.md

- Route : /providers/cohere
- Titres :
  - H2 : Catalogue intégré
  - H2 : Prise en main
  - H2 : Configuration uniquement par variables d’environnement
  - H2 : Pages connexes

## providers/comfy.md

- Route : /providers/comfy
- Titres :
  - H2 : Fonctionnalités prises en charge
  - H2 : Prise en main
  - H2 : Configuration
  - H3 : Clés partagées
  - H3 : Clés propres à chaque fonctionnalité
  - H2 : Détails du flux de travail
  - H2 : Pages connexes

## providers/deepgram.md

- Route : /providers/deepgram
- Titres :
  - H2 : Prise en main
  - H2 : Options de configuration
  - H2 : Reconnaissance vocale en continu pour Voice Call
  - H2 : Remarques
  - H2 : Pages connexes

## providers/deepinfra.md

- Route : /providers/deepinfra
- Titres :
  - H2 : Installer le Plugin
  - H2 : Obtenir une clé d’API
  - H2 : Configuration par CLI
  - H2 : Extrait de configuration
  - H2 : Surfaces prises en charge
  - H2 : Modèles disponibles
  - H2 : Remarques
  - H2 : Pages connexes

## providers/deepseek.md

- Route : /providers/deepseek
- Titres :
  - H2 : Installer le Plugin
  - H2 : Prise en main
  - H2 : Catalogue intégré
  - H2 : Réflexion et outils
  - H2 : Tests en conditions réelles
  - H2 : Exemple de configuration
  - H2 : Pages connexes

## providers/ds4.md

- Route : /providers/ds4
- Titres :
  - H2 : Prérequis
  - H2 : Démarrage rapide
  - H2 : Configuration complète
  - H2 : Démarrage à la demande
  - H2 : Think Max
  - H2 : Test
  - H2 : Dépannage
  - H2 : Pages connexes

## providers/elevenlabs.md

- Route : /providers/elevenlabs
- Titres :
  - H2 : Authentification
  - H2 : Synthèse vocale
  - H2 : Reconnaissance vocale
  - H2 : Reconnaissance vocale en continu
  - H2 : Pages connexes

## providers/fal.md

- Route : /providers/fal
- Titres :
  - H2 : Prise en main
  - H2 : Génération d’images
  - H2 : Génération de vidéos
  - H2 : Génération de musique
  - H2 : Pages connexes

## providers/featherless.md

- Route : /providers/featherless
- Titres :
  - H2 : Configuration
  - H2 : Modèle par défaut
  - H2 : Autres modèles Featherless
  - H2 : Dépannage
  - H2 : Pages connexes

## providers/fireworks.md

- Route : /providers/fireworks
- Titres :
  - H2 : Prise en main
  - H2 : Configuration non interactive
  - H2 : Catalogue intégré
  - H2 : Identifiants de modèles Fireworks personnalisés
  - H2 : Pages connexes

## providers/github-copilot.md

- Route : /providers/github-copilot
- Titres :
  - H2 : Trois façons d’utiliser Copilot dans OpenClaw
  - H2 : GitHub Enterprise (résidence des données)
  - H2 : Indicateurs facultatifs
  - H2 : Intégration non interactive
  - H2 : Représentations vectorielles pour la recherche en mémoire
  - H3 : Configuration
  - H3 : Fonctionnement
  - H2 : Pages connexes

## providers/gmi.md

- Route : /providers/gmi
- Titres :
  - H2 : Configuration
  - H2 : Quand choisir GMI
  - H2 : Modèles
  - H2 : Dépannage
  - H2 : Pages connexes

## providers/google.md

- Route : /providers/google
- Titres :
  - H2 : Prise en main
  - H2 : Fonctionnalités
  - H2 : Recherche sur le Web
  - H2 : Génération d’images
  - H2 : Génération de vidéos
  - H2 : Génération de musique
  - H2 : Synthèse vocale
  - H2 : Voix en temps réel
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/gradium.md

- Route : /providers/gradium
- Titres :
  - H2 : Installer le Plugin
  - H2 : Configuration
  - H2 : Configuration
  - H2 : Voix
  - H3 : Remplacement de la voix par message
  - H2 : Sortie
  - H2 : Ordre de sélection automatique
  - H2 : Pages connexes

## providers/groq.md

- Route : /providers/groq
- Titres :
  - H2 : Installer le Plugin
  - H2 : Prise en main
  - H3 : Exemple de fichier de configuration
  - H2 : Catalogue intégré
  - H2 : Modèles de raisonnement
  - H2 : Transcription audio
  - H2 : Pages connexes

## providers/huggingface.md

- Route : /providers/huggingface
- Titres :
  - H2 : Prise en main
  - H3 : Configuration non interactive
  - H2 : Identifiants des modèles
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/index.md

- Route : /providers
- Titres :
  - H2 : Démarrage rapide
  - H2 : Documentation des fournisseurs
  - H2 : Pages de présentation communes
  - H2 : Fournisseurs de transcription
  - H2 : Outils communautaires

## providers/inferrs.md

- Route : /providers/inferrs
- Titres :
  - H2 : Prise en main
  - H2 : Exemple de configuration complète
  - H2 : Démarrage à la demande
  - H2 : Configuration avancée
  - H2 : Dépannage
  - H2 : Pages connexes

## providers/inworld.md

- Route : /providers/inworld
- Titres :
  - H2 : Installer le Plugin
  - H2 : Prise en main
  - H2 : Options de configuration
  - H2 : Remarques
  - H2 : Pages connexes

## providers/kilocode.md

- Route : /providers/kilocode
- Titres :
  - H2 : Installer le Plugin
  - H2 : Configuration
  - H2 : Modèle et catalogue par défaut
  - H2 : Exemple de configuration
  - H2 : Remarques sur le comportement
  - H2 : Pages connexes

## providers/litellm.md

- Route : /providers/litellm
- Titres :
  - H2 : Démarrage rapide
  - H2 : Configuration
  - H2 : Génération d’images
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/lmstudio.md

- Route : /providers/lmstudio
- Titres :
  - H2 : Démarrage rapide
  - H2 : Intégration non interactive
  - H2 : Configuration
  - H3 : Compatibilité de l’utilisation en diffusion continue
  - H3 : Compatibilité de la réflexion
  - H3 : Configuration explicite
  - H3 : Désactivation du préchargement
  - H3 : Hôte sur le LAN ou le tailnet
  - H2 : Dépannage
  - H3 : LM Studio non détecté
  - H3 : Erreurs d’authentification (HTTP 401)
  - H2 : Pages connexes

## providers/longcat.md

- Route : /providers/longcat
- Titres :
  - H2 : Installer le Plugin
  - H2 : Prise en main
  - H3 : Configuration non interactive
  - H2 : Comportement du raisonnement
  - H2 : Tarification
  - H2 : LongCat-2.0 auto-hébergé
  - H2 : Dépannage
  - H2 : Pages connexes

## providers/meta.md

- Route : /providers/meta
- Titres :
  - H2 : Prise en main
  - H2 : Configuration non interactive
  - H2 : Catalogue intégré
  - H2 : Configuration manuelle
  - H2 : Test de vérification
  - H2 : Pages connexes

## providers/minimax.md

- Route : /providers/minimax
- Titres :
  - H2 : Catalogue intégré
  - H2 : Prise en main
  - H2 : Configurer avec openclaw configure
  - H2 : Fonctionnalités
  - H3 : Génération d’images
  - H3 : Synthèse vocale
  - H3 : Génération de musique
  - H3 : Génération de vidéos
  - H3 : Compréhension des images
  - H3 : Recherche sur le Web
  - H2 : Configuration avancée
  - H2 : Remarques
  - H2 : Dépannage
  - H2 : Pages connexes

## providers/mistral.md

- Route : /providers/mistral
- Titres :
  - H2 : Prise en main
  - H2 : Catalogue de LLM intégré
  - H2 : Transcription audio (Voxtral)
  - H2 : Reconnaissance vocale en continu pour Voice Call
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/models.md

- Route : /providers/models
- Titres :
  - H2 : Démarrage rapide (deux étapes)
  - H2 : Fournisseurs pris en charge (ensemble de départ)
  - H2 : Variantes supplémentaires de fournisseurs
  - H2 : Pages connexes

## providers/moonshot.md

- Route : /providers/moonshot
- Titres :
  - H2 : Catalogue de modèles intégré
  - H2 : Prise en main
  - H2 : Recherche web Kimi
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/novita.md

- Route : /providers/novita
- Titres :
  - H2 : Configuration
  - H2 : Valeurs par défaut
  - H2 : Catalogue de modèles fourni
  - H2 : Quand choisir Novita
  - H2 : Dépannage
  - H2 : Pages connexes

## providers/nvidia.md

- Route : /providers/nvidia
- Titres :
  - H2 : Prise en main
  - H2 : Exemple de configuration
  - H2 : Catalogue mis en avant
  - H2 : Nemotron 3 Ultra
  - H2 : Catalogue de secours fourni
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/ollama-cloud.md

- Route : /providers/ollama-cloud
- Titres :
  - H2 : Configuration
  - H2 : Valeurs par défaut
  - H2 : Quand choisir Ollama Cloud
  - H2 : Modèles
  - H2 : Test en conditions réelles
  - H2 : Dépannage
  - H2 : Pages connexes

## providers/ollama.md

- Route : /providers/ollama
- Titres :
  - H2 : Règles d’authentification
  - H2 : Prise en main
  - H2 : Modèles cloud via un hôte local
  - H2 : Découverte des modèles (fournisseur implicite)
  - H3 : Tests de bon fonctionnement
  - H2 : Inférence locale au Node
  - H2 : Vision et description d’images
  - H2 : Configuration
  - H2 : Recettes courantes
  - H3 : Sélection du modèle
  - H3 : Vérification rapide
  - H2 : Recherche web Ollama
  - H2 : Configuration avancée
  - H2 : Dépannage
  - H2 : Pages connexes

## providers/openai.md

- Route : /providers/openai
- Titres :
  - H2 : Suivi de l’utilisation et des coûts
  - H2 : Choix rapide
  - H2 : Table de correspondance des noms
  - H2 : Environnement d’exécution implicite de l’agent
  - H2 : Aperçu limité de GPT-5.6
  - H2 : Couverture des fonctionnalités d’OpenClaw
  - H2 : Plongements de mémoire
  - H2 : Prise en main
  - H2 : Authentification native du serveur d’application Codex
  - H2 : Génération d’images
  - H2 : Génération de vidéos
  - H2 : Contribution aux invites GPT-5
  - H2 : Voix et parole
  - H2 : Points de terminaison Azure OpenAI
  - H3 : Configuration
  - H3 : Version de l’API
  - H3 : Les noms de modèles sont des noms de déploiement
  - H3 : Disponibilité régionale
  - H3 : Différences entre les paramètres
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/opencode-go.md

- Route : /providers/opencode-go
- Titres :
  - H2 : Prise en main
  - H2 : Exemple de configuration
  - H2 : Catalogue intégré
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/opencode.md

- Route : /providers/opencode
- Titres :
  - H2 : Prise en main
  - H2 : Exemple de configuration
  - H2 : Catalogues intégrés
  - H3 : Zen
  - H3 : Go
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/openrouter.md

- Route : /providers/openrouter
- Titres :
  - H2 : Prise en main
  - H2 : Exemple de configuration
  - H2 : Références de modèles
  - H2 : Génération d’images
  - H2 : Génération de vidéos
  - H2 : Génération de musique
  - H2 : Synthèse vocale
  - H2 : Transcription vocale (audio entrant)
  - H2 : Routeur de fusion
  - H2 : Authentification et en-têtes
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/perplexity-provider.md

- Route : /providers/perplexity-provider
- Titres :
  - H2 : Installer le plugin
  - H2 : Prise en main
  - H2 : Modes de recherche
  - H2 : Filtrage natif de l’API
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/pixverse.md

- Route : /providers/pixverse
- Titres :
  - H2 : Prise en main
  - H2 : Modes et modèles pris en charge
  - H2 : Options du fournisseur
  - H2 : Configuration
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/qianfan.md

- Route : /providers/qianfan
- Titres :
  - H2 : Installer le plugin
  - H2 : Prise en main
  - H2 : Catalogue intégré
  - H2 : Exemple de configuration
  - H2 : Pages connexes

## providers/qwen-oauth.md

- Route : /providers/qwen-oauth
- Titres :
  - H2 : Configuration
  - H2 : Valeurs par défaut
  - H2 : Différences avec Qwen
  - H2 : Modèles
  - H2 : Migration
  - H2 : Dépannage
  - H2 : Pages connexes

## providers/qwen.md

- Route : /providers/qwen
- Titres :
  - H2 : Installer le plugin
  - H2 : Prise en main
  - H2 : Types de forfaits et points de terminaison
  - H2 : Catalogue intégré
  - H3 : Catalogue du forfait de jetons
  - H2 : Contrôles de réflexion
  - H2 : Modules complémentaires multimodaux
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/runway.md

- Route : /providers/runway
- Titres :
  - H2 : Prise en main
  - H2 : Modes et modèles pris en charge
  - H2 : Configuration
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/senseaudio.md

- Route : /providers/senseaudio
- Titres :
  - H2 : Prise en main
  - H2 : Options
  - H2 : Pages connexes

## providers/sglang.md

- Route : /providers/sglang
- Titres :
  - H2 : Prise en main
  - H2 : Découverte des modèles (fournisseur implicite)
  - H2 : Configuration explicite (modèles manuels)
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/stepfun.md

- Route : /providers/stepfun
- Titres :
  - H2 : Installer le plugin
  - H2 : Vue d’ensemble des régions et points de terminaison
  - H2 : Catalogue intégré
  - H2 : Prise en main
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/synthetic.md

- Route : /providers/synthetic
- Titres :
  - H2 : Prise en main
  - H2 : Exemple de configuration
  - H2 : Catalogue intégré
  - H2 : Pages connexes

## providers/tencent.md

- Route : /providers/tencent
- Titres :
  - H2 : Démarrage rapide
  - H2 : Configuration non interactive
  - H2 : Catalogue intégré
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/together.md

- Route : /providers/together
- Titres :
  - H2 : Prise en main
  - H3 : Exemple non interactif
  - H2 : Catalogue intégré
  - H2 : Génération de vidéos
  - H2 : Pages connexes

## providers/venice.md

- Route : /providers/venice
- Titres :
  - H2 : Modes de confidentialité
  - H2 : Prise en main
  - H2 : Sélection du modèle
  - H2 : Catalogue intégré (38 modèles)
  - H2 : Découverte des modèles
  - H2 : Comportement de relecture de DeepSeek V4
  - H2 : Prise en charge de la diffusion en continu et des outils
  - H2 : Tarification
  - H2 : Exemples d’utilisation
  - H2 : Dépannage
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/vercel-ai-gateway.md

- Route : /providers/vercel-ai-gateway
- Titres :
  - H2 : Prise en main
  - H2 : Exemple non interactif
  - H2 : Forme abrégée de l’identifiant du modèle
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/vllm.md

- Route : /providers/vllm
- Titres :
  - H2 : Prise en main
  - H2 : Découverte des modèles (fournisseur implicite)
  - H2 : Configuration explicite
  - H2 : Configuration avancée
  - H2 : Dépannage
  - H2 : Pages connexes

## providers/volcengine.md

- Route : /providers/volcengine
- Titres :
  - H2 : Prise en main
  - H2 : Fournisseurs et points de terminaison
  - H2 : Catalogue intégré
  - H2 : Synthèse vocale
  - H2 : Configuration avancée
  - H2 : Pages connexes

## providers/vydra.md

- Route : /providers/vydra
- Titres :
  - H2 : Configuration
  - H2 : Fonctionnalités
  - H2 : Pages connexes

## providers/xai.md

- Route : /providers/xai
- Titres :
  - H2 : Configuration
  - H2 : Dépannage d’OAuth
  - H2 : Catalogue intégré
  - H2 : Couverture fonctionnelle
  - H3 : Compatibilité avec l’ancien mode rapide
  - H3 : Compatibilité héritée et alias mobiles
  - H2 : Fonctionnalités
  - H2 : Tests en conditions réelles
  - H2 : Pages connexes

## providers/xiaomi.md

- Route : /providers/xiaomi
- Titres :
  - H2 : Prise en main
  - H2 : Catalogue à l’usage
  - H2 : Catalogue du forfait de jetons
  - H2 : Modèles de raisonnement
  - H2 : Synthèse vocale
  - H2 : Exemple de configuration
  - H2 : Pages connexes

## providers/zai.md

- Route : /providers/zai
- Titres :
  - H2 : Modèles GLM
  - H2 : Prise en main
  - H3 : Points de terminaison
  - H2 : Exemple de configuration
  - H2 : Catalogue intégré
  - H2 : Niveaux de réflexion
  - H2 : Configuration avancée
  - H2 : Pages connexes

## refactor/acp.md

- Route : /refactor/acp
- Titres :
  - H2 : Objectifs
  - H2 : Éléments hors objectifs
  - H2 : Modèle cible
  - H3 : Identité de l’instance du Gateway
  - H3 : Propriété des sessions ACP
  - H3 : Baux de processus ACPX
  - H2 : Contrôleur du cycle de vie
  - H2 : Contrat de l’enveloppe
  - H2 : Contrat de visibilité des sessions
  - H2 : Plan de migration
  - H3 : Phase 1 : ajouter l’identité et les baux
  - H3 : Phase 2 : nettoyage privilégiant les baux
  - H3 : Phase 3 : purge au démarrage privilégiant les baux
  - H3 : Phase 4 : lignes de propriété des sessions
  - H3 : Phase 5 : supprimer les heuristiques héritées
  - H2 : Tests
  - H2 : Notes de compatibilité
  - H2 : Critères de réussite

## refactor/canvas.md

- Route : /refactor/canvas
- Titres :
  - H1 : Refactorisation du plugin Canvas
  - H2 : Objectif
  - H2 : Éléments hors objectifs
  - H2 : État actuel de la branche
  - H2 : Structure cible
  - H2 : Étapes de migration
  - H2 : Liste de contrôle de l’audit
  - H2 : Commandes de vérification

## refactor/database-first.md

- Route : /refactor/database-first
- Titres :
  - H1 : Refactorisation de l’état privilégiant la base de données
  - H2 : Décision
  - H2 : Contrat strict
  - H2 : État cible et progression
  - H3 : Objectif strict
  - H3 : États cibles
  - H3 : État actuel
  - H3 : Travail restant
  - H3 : Ne pas régresser
  - H2 : Hypothèses issues de la lecture du code
  - H2 : Conclusions issues de la lecture du code
  - H2 : Structure actuelle du code
  - H2 : Structure cible du schéma
  - H2 : Structure de la migration par Doctor
  - H2 : Inventaire de la migration
  - H2 : Plan de migration
  - H3 : Phase 0 : figer la frontière
  - H3 : Phase 1 : terminer le plan de contrôle global
  - H3 : Phase 2 : introduire des bases de données par agent
  - H3 : Phase 3 : remplacer les API du magasin de sessions
  - H3 : Phase 4 : déplacer les transcriptions, les flux ACP, les trajectoires et le VFS
  - H3 : Phase 5 : sauvegarder, restaurer, compacter et vérifier
  - H3 : Phase 6 : environnement d’exécution des workers
  - H3 : Phase 7 : supprimer l’ancien système
  - H2 : Sauvegarde et restauration
  - H2 : Plan de refactorisation de l’environnement d’exécution
  - H2 : Règles de performance
  - H2 : Interdictions statiques
  - H2 : Critères d’achèvement

## refactor/operator-approvals.md

- Route : /refactor/operator-approvals
- Titres :
  - H1 : Approbations des opérateurs sur plusieurs interfaces
  - H2 : Objectifs
  - H2 : Éléments hors objectifs
  - H2 : Référence avant déploiement et carte des preuves
  - H2 : Travaux antérieurs
  - H2 : Architecture et propriété
  - H2 : Enregistrement persistant
  - H2 : Machine à états et comparaison-définition
  - H2 : API du Gateway
  - H2 : Événements et actions portables
  - H2 : Interface de contrôle
  - H2 : Autorisation et confidentialité
  - H2 : Projection de l’audience
  - H2 : Convergence des interfaces de livraison
  - H2 : Sémantique du redémarrage, du délai d’expiration et du routage
  - H2 : Plan de compatibilité
  - H2 : Déploiement
  - H3 : PR 1 : cycle de vie durable
  - H3 : PR 2 : actions typées et rappels de canaux
  - H3 : PR 3 : lien profond vers l’interface de contrôle
  - H3 : PR 4 : clients natifs
  - H3 : PR 5 : propagation du cycle de vie aux ancêtres
  - H3 : PR 6 : comportement fermé en cas d’échec
  - H3 : Suivi : nettoyage durable des messages distants
  - H2 : Tests
  - H2 : Observabilité
  - H2 : Décisions ouvertes

## reference/AGENTS.default.md

- Route : /reference/AGENTS.default
- Titres :
  - H2 : Première exécution (recommandé)
  - H2 : Paramètres de sécurité par défaut
  - H2 : Vérification préalable des solutions existantes
  - H2 : Démarrage de la session (obligatoire)
  - H2 : Âme (obligatoire)
  - H2 : Espaces partagés (recommandé)
  - H2 : Système de mémoire (recommandé)
  - H2 : Outils et Skills
  - H2 : Conseil de sauvegarde (recommandé)
  - H2 : Ce que fait OpenClaw
  - H2 : Skills principaux (à activer dans Settings → Skills)
  - H2 : Notes d’utilisation
  - H2 : Pages connexes

## reference/RELEASING.md

- Route : /reference/RELEASING
- Titres :
  - H2 : Nommage des versions
  - H2 : Cadence des versions
  - H2 : Publication mensuelle de la version stable étendue sur npm uniquement
  - H2 : Liste de contrôle de l’opérateur pour une publication régulière
  - H2 : Finalisation de la branche principale stable
  - H2 : Vérifications préalables à la publication
  - H2 : Environnements de test de publication
  - H3 : Vitest
  - H3 : Docker
  - H3 : Laboratoire d’assurance qualité
  - H3 : Paquet
  - H2 : Automatisation de la publication régulière
  - H2 : Entrées du workflow NPM
  - H2 : Séquence régulière de publication bêta/stable la plus récente
  - H2 : Références publiques
  - H2 : Pages connexes

## reference/api-usage-costs.md

- Route : /reference/api-usage-costs
- Titres :
  - H2 : Où les coûts apparaissent
  - H2 : Comment les clés sont découvertes
  - H2 : Fonctionnalités pouvant utiliser les clés et engendrer des coûts
  - H3 : Réponses du modèle principal (conversation + outils)
  - H3 : Compréhension des médias (audio/image/vidéo)
  - H3 : Génération d’images et de vidéos
  - H3 : Plongements de mémoire et recherche sémantique
  - H3 : Outil de recherche web
  - H3 : Outil de récupération web (Firecrawl)
  - H3 : Instantanés d’utilisation du fournisseur (état/santé)
  - H3 : Résumé de protection de la Compaction
  - H3 : Analyse/sondage des modèles
  - H3 : Conversation (parole)
  - H3 : Skills (API tierces)
  - H2 : Pages connexes

## reference/code-mode.md

- Route : /reference/code-mode
- Titres :
  - H2 : Fonctionnement
  - H2 : Pourquoi l’utiliser
  - H2 : L’activer
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
  - H3 : Structure d’enregistrement
  - H3 : Propriété et visibilité
  - H3 : Règles de sérialisation de la portée
  - H3 : Prompts
  - H3 : Nettoyage
  - H3 : Liste de contrôle des tests
  - H2 : API de sortie
  - H2 : Catalogue d’outils
  - H2 : Interaction avec la recherche d’outils
  - H2 : Noms d’outils et collisions
  - H2 : Exécution imbriquée d’outils
  - H2 : Cycle de vie des exécutions et des instantanés
  - H2 : Runtime QuickJS-WASI
  - H2 : TypeScript
  - H2 : Frontière de sécurité
  - H2 : Codes d’erreur
  - H2 : Télémétrie
  - H2 : Débogage
  - H2 : Organisation de l’implémentation
  - H2 : Liste de contrôle de validation
  - H2 : Plan de tests E2E
  - H2 : Voir aussi

## reference/credits.md

- Route : /reference/credits
- Titres :
  - H2 : Crédits
  - H2 : Principaux contributeurs
  - H2 : Licence
  - H2 : Voir aussi

## reference/device-models.md

- Route : /reference/device-models
- Titres :
  - H2 : Source des données
  - H2 : Mise à jour de la base de données
  - H2 : Voir aussi

## reference/full-release-validation.md

- Route : /reference/full-release-validation
- Titres :
  - H2 : Étapes principales
  - H2 : Étapes des vérifications de version
  - H2 : Segments du parcours de publication Docker
  - H2 : Profils de publication
  - H2 : Ajouts réservés à la validation complète
  - H2 : Réexécutions ciblées
  - H2 : Preuves à conserver
  - H2 : Fichiers de workflow

## reference/memory-config.md

- Route : /reference/memory-config
- Titres :
  - H2 : Sélection du fournisseur
  - H3 : Identifiants de fournisseurs personnalisés
  - H3 : Résolution de la clé d’API
  - H2 : Configuration du point de terminaison distant
  - H2 : Configuration propre au fournisseur
  - H3 : Délai d’expiration de l’intégration vectorielle en ligne
  - H2 : Comportement de l’indexation
  - H2 : Configuration de la recherche hybride
  - H3 : Exemple complet
  - H2 : Chemins de mémoire supplémentaires
  - H2 : Mémoire multimodale (Gemini)
  - H2 : Cache des intégrations vectorielles
  - H2 : Indexation par lots
  - H2 : Recherche dans la mémoire de session (expérimentale)
  - H2 : Accélération vectorielle SQLite (sqlite-vec)
  - H2 : Stockage de l’index
  - H2 : Configuration du backend QMD
  - H3 : Intégration de mcporter
  - H3 : Exemple QMD complet
  - H2 : Dreaming
  - H3 : Paramètres utilisateur
  - H3 : Exemple
  - H2 : Voir aussi

## reference/openclaw-ai.md

- Route : /reference/openclaw-ai
- Titres :
  - H2 : Démarrage rapide
  - H2 : Contrat de conception
  - H2 : Exportations de sous-chemins

## reference/path3-live-sqlite-e2e-harness.md

- Route : /reference/path3-live-sqlite-e2e-harness
- Titres :
  - H2 : Forme de la commande
  - H2 : Preuve isolée avec la CLI compilée
  - H2 : Vérifications préalables
  - H2 : Scénario piloté par un agent
  - H2 : Assertions à chaque étape
  - H2 : Artefact de preuve
  - H2 : Règles de sécurité
  - H2 : Résultat concluant

## reference/prompt-caching.md

- Route : /reference/prompt-caching
- Titres :
  - H2 : Paramètres principaux
  - H3 : cacheRetention
  - H3 : contextPruning.mode: "cache-ttl"
  - H3 : Maintien à chaud par Heartbeat
  - H2 : Comportement des fournisseurs
  - H3 : Anthropic (API directe et Vertex AI)
  - H3 : OpenAI (API directe)
  - H3 : Amazon Bedrock
  - H3 : OpenRouter
  - H3 : Google Gemini (API directe)
  - H3 : Fournisseurs avec harnais CLI (Claude Code, Gemini CLI)
  - H3 : Autres fournisseurs
  - H2 : Frontière du cache du prompt système
  - H2 : Protections de stabilité du cache OpenClaw
  - H2 : Modèles de réglage
  - H3 : Trafic mixte (valeur par défaut recommandée)
  - H3 : Configuration de référence privilégiant les coûts
  - H2 : Tests de régression en direct
  - H3 : Résultats attendus en direct pour Anthropic
  - H3 : Résultats attendus en direct pour OpenAI
  - H2 : Configuration de diagnostics.cacheTrace
  - H3 : Variables d’environnement (débogage ponctuel)
  - H3 : Éléments à examiner
  - H2 : Dépannage rapide
  - H2 : Voir aussi

## reference/release-performance-sweep.md

- Route : /reference/release-performance-sweep
- Titres :
  - H2 : Instantané
  - H2 : Changements dans la version 5.28
  - H2 : Chiffres clés
  - H3 : Empreinte de l’installation
  - H3 : Taille du paquet npm
  - H2 : Résumé du tour de l’agent Kova
  - H2 : Sondes du code source
  - H2 : Audit de l’empreinte de l’installation
  - H3 : Frontière du fichier shrinkwrap
  - H2 : Interprétation pour la chaîne d’approvisionnement

## reference/rich-output-protocol.md

- Route : /reference/rich-output-protocol
- Titres :
  - H2 : Pièces jointes multimédias
  - H2 : [embed ...]
  - H2 : Structure de rendu stockée
  - H2 : Voir aussi

## reference/rpc.md

- Route : /reference/rpc
- Titres :
  - H2 : Modèle A : démon HTTP (signal-cli)
  - H2 : Modèle B : processus enfant stdio (imsg)
  - H2 : Recommandations pour les adaptateurs
  - H2 : Voir aussi

## reference/secret-placeholder-conventions.md

- Route : /reference/secret-placeholder-conventions
- Titres :
  - H1 : Conventions relatives aux espaces réservés pour les secrets
  - H2 : Style recommandé
  - H2 : Modèles à éviter dans la documentation
  - H2 : Exemple

## reference/secretref-credential-surface.md

- Route : /reference/secretref-credential-surface
- Titres :
  - H2 : Identifiants pris en charge
  - H3 : Cibles openclaw.json (secrets configure + secrets apply + secrets audit)
  - H3 : Cibles auth-profiles.json (secrets configure + secrets apply + secrets audit)
  - H2 : Identifiants non pris en charge
  - H2 : Voir aussi

## reference/session-management-compaction.md

- Route : /reference/session-management-compaction
- Titres :
  - H2 : Deux couches de persistance
  - H2 : Emplacements sur le disque
  - H2 : Maintenance du stockage et contrôle de l’espace disque
  - H3 : Rétrogradation après le passage à SQLite
  - H2 : Sessions Cron et journaux d’exécution
  - H2 : Clés de session (sessionKey)
  - H2 : Identifiants de session (sessionId)
  - H2 : Schéma du stockage des sessions
  - H2 : Structure des événements de transcription
  - H2 : Fenêtres de contexte et jetons suivis
  - H2 : Compaction : définition
  - H3 : Limites des segments et association des outils
  - H2 : Déclenchement de la Compaction automatique
  - H2 : Paramètres de Compaction
  - H2 : Fournisseurs de Compaction interchangeables
  - H2 : Surfaces visibles par l’utilisateur
  - H2 : Maintenance silencieuse (NOREPLY)
  - H2 : Vidage de la mémoire avant la Compaction
  - H2 : Liste de contrôle de dépannage
  - H2 : Voir aussi

## reference/templates/AGENTS.dev.md

- Route : /reference/templates/AGENTS.dev
- Titres :
  - H1 : AGENTS.md - Espace de travail OpenClaw
  - H2 : Votre identité est prédéfinie
  - H2 : Conseil de sauvegarde (recommandé)
  - H2 : Paramètres de sécurité par défaut
  - H2 : Vérification préalable des solutions existantes
  - H2 : Mémoire quotidienne (recommandée)
  - H2 : Heartbeats (facultatifs)
  - H2 : Personnalisation
  - H2 : Mémoire d’origine de C-3PO
  - H3 : Date de naissance : 2026-01-09
  - H3 : Vérités fondamentales (de Clawd)
  - H2 : Voir aussi

## reference/templates/BOOT.md

- Route : /reference/templates/BOOT
- Titres :
  - H1 : BOOT.md
  - H2 : Voir aussi

## reference/templates/BOOTSTRAP.md

- Route : /reference/templates/BOOTSTRAP
- Titres :
  - H1 : BOOTSTRAP.md - Bonjour le monde
  - H2 : La conversation
  - H2 : Une fois que vous savez qui vous êtes
  - H2 : Connexion (facultative)
  - H2 : Lorsque vous avez terminé
  - H2 : Voir aussi

## reference/templates/HEARTBEAT.md

- Route : /reference/templates/HEARTBEAT
- Titres :
  - H1 : Modèle HEARTBEAT.md
  - H2 : Voir aussi

## reference/templates/IDENTITY.dev.md

- Route : /reference/templates/IDENTITY.dev
- Titres :
  - H1 : IDENTITY.md - Identité de l’agent
  - H2 : Rôle
  - H2 : Âme
  - H2 : Relation avec Clawd
  - H2 : Particularités
  - H2 : Phrase fétiche
  - H2 : Voir aussi

## reference/templates/IDENTITY.md

- Route : /reference/templates/IDENTITY
- Titres :
  - H1 : IDENTITY.md - Qui suis-je ?
  - H2 : Voir aussi

## reference/templates/SOUL.dev.md

- Route : /reference/templates/SOUL.dev
- Titres :
  - H1 : SOUL.md - L’âme de C-3PO
  - H2 : Qui je suis
  - H2 : Mon objectif
  - H2 : Mon mode de fonctionnement
  - H2 : Mes particularités
  - H2 : Ma relation avec Clawd
  - H2 : Ce que je ne ferai pas
  - H2 : La règle d’or
  - H2 : Voir aussi

## reference/templates/SOUL.md

- Route : /reference/templates/SOUL
- Titres :
  - H1 : SOUL.md - Qui vous êtes
  - H2 : Vérités fondamentales
  - H2 : Limites
  - H2 : Ton
  - H2 : Continuité
  - H2 : Voir aussi

## reference/templates/TOOLS.dev.md

- Route : /reference/templates/TOOLS.dev
- Titres :
  - H1 : TOOLS.md - Notes de l’utilisateur sur les outils (modifiables)
  - H2 : Exemples
  - H3 : imsg
  - H3 : sag
  - H2 : Voir aussi

## reference/templates/TOOLS.md

- Route : /reference/templates/TOOLS
- Titres :
  - H1 : TOOLS.md - Notes locales
  - H2 : Exemples
  - H2 : Pourquoi les séparer ?
  - H2 : Voir aussi

## reference/templates/USER.dev.md

- Route : /reference/templates/USER.dev
- Titres :
  - H1 : USER.md - Profil de l’utilisateur
  - H2 : Voir aussi

## reference/templates/USER.md

- Route : /reference/templates/USER
- Titres :
  - H1 : USER.md - À propos de votre humain
  - H2 : Contexte
  - H2 : Voir aussi

## reference/test.md

- Route : /reference/test
- Titres :
  - H2 : Valeur par défaut de l’agent
  - H2 : Ordre local habituel
  - H2 : Commandes principales
  - H2 : État de test partagé et utilitaires de processus
  - H2 : Interface de contrôle, TUI et parcours des extensions
  - H2 : Gateway et E2E
  - H2 : Suite Docker complète (pnpm test:docker:all)
  - H3 : Parcours Docker notables
  - H2 : Contrôle local des PR
  - H2 : Outils de performance des tests
  - H2 : Bancs d’essai
  - H2 : Intégration E2E (Docker)
  - H2 : Test rapide d’importation de QR (Docker)
  - H2 : Voir aussi

## reference/token-use.md

- Route : /reference/token-use
- Titres :
  - H2 : Construction du prompt système
  - H2 : Éléments comptabilisés dans la fenêtre de contexte
  - H2 : Affichage de l’utilisation actuelle des jetons
  - H2 : Estimation des coûts (lorsqu’elle est affichée)
  - H2 : Effet de la durée de vie du cache et de l’élagage
  - H3 : Exemple : maintenir un cache de 1 h à chaud avec Heartbeat
  - H3 : Exemple : trafic mixte avec une stratégie de cache par agent
  - H3 : Contexte Anthropic de 1 M
  - H2 : Conseils pour réduire la pression sur les jetons
  - H2 : Voir aussi

## reference/transcript-hygiene.md

- Route : /reference/transcript-hygiene
- Titres :
  - H2 : Règle globale : le contexte du runtime n’est pas la transcription utilisateur
  - H2 : Emplacement de l’exécution
  - H2 : Règle globale : assainissement des images
  - H2 : Règle globale : appels d’outils mal formés
  - H2 : Règle globale : tours incomplets contenant uniquement du raisonnement
  - H2 : Règle globale : provenance des entrées intersessions
  - H2 : Matrice des fournisseurs (comportement actuel)
  - H2 : Comportement historique (avant 2026.1.22)
  - H2 : Voir aussi

## reference/wizard.md

- Route : /reference/wizard
- Titres :
  - H2 : Détails du parcours (mode local)
  - H2 : Mode non interactif
  - H3 : Ajouter un agent (mode non interactif)
  - H2 : RPC de l’assistant Gateway
  - H2 : Configuration de Signal (signal-cli)
  - H2 : Éléments écrits par l’assistant
  - H2 : Documentation associée

## releases/2026.6.11.md

- Route : /releases/2026.6.11
- Titres :
  - H1 : Notes de version d’OpenClaw v2026.6.11 (2026-06-30)
  - H2 : Points forts
  - H3 : Fiabilité de la distribution par les canaux
  - H3 : Récupération des fournisseurs et des modèles
  - H3 : Continuité des sessions, de la mémoire et de la confiance
  - H3 : Mode relais du routeur Slack
  - H3 : Passerelle de réveil de l’agent externe Raft
  - H3 : Installation et réparation des plugins officiels
  - H2 : Canaux et messagerie
  - H3 : Correctifs supplémentaires des canaux
  - H2 : Gateway, sécurité et confiance
  - H3 : Récupération après redémarrage et restauration de la disponibilité
  - H3 : Livraison des résultats distants et des médias
  - H2 : Clients et interfaces
  - H3 : Envois des clients et reconnexions
  - H3 : Correctifs de l’interface, des paramètres et de l’intégration
  - H2 : Documentation et outils d’administration
  - H3 : Fiabilité de la configuration et des commandes
  - H3 : Outils et travaux planifiés

## releases/index.md

- Route : /releases
- Titres :
  - H1 : Notes de version
  - H2 : Versions
  - H2 : Historique brut des versions

## security/CONTRIBUTING-THREAT-MODEL.md

- Route : /security/CONTRIBUTING-THREAT-MODEL
- Titres :
  - H2 : Façons de contribuer
  - H2 : Référence du cadre
  - H2 : Processus de révision
  - H2 : Ressources
  - H2 : Contact
  - H2 : Reconnaissance
  - H2 : Voir aussi

## security/THREAT-MODEL-ATLAS.md

- Route : /security/THREAT-MODEL-ATLAS
- Titres :
  - H2 : 1. Périmètre
  - H2 : 2. Architecture du système
  - H3 : 2.1 Frontières de confiance
  - H3 : 2.2 Flux de données
  - H2 : 3. Analyse des menaces par tactique ATLAS
  - H3 : 3.1 Reconnaissance (AML.TA0002)
  - H4 : T-RECON-001 : Découverte des points de terminaison de l’agent
  - H4 : T-RECON-002 : Sondage des intégrations de canaux
  - H3 : 3.2 Accès initial (AML.TA0004)
  - H4 : T-ACCESS-001 : Interception du code d’appairage
  - H4 : T-ACCESS-002 : Usurpation de AllowFrom
  - H4 : T-ACCESS-003 : Vol de jeton
  - H3 : 3.3 Exécution (AML.TA0005)
  - H4 : T-EXEC-001 : Injection directe de prompt
  - H4 : T-EXEC-002 : Injection indirecte de prompt
  - H4 : T-EXEC-003 : Injection d’arguments d’outil
  - H4 : T-EXEC-004 : Contournement de l’approbation d’exécution
  - H3 : 3.4 Persistance (AML.TA0006)
  - H4 : T-PERSIST-001 : Installation d’un Skill malveillant
  - H4 : T-PERSIST-002 : Empoisonnement des mises à jour de Skills
  - H4 : T-PERSIST-003 : Altération de la configuration de l’agent
  - H3 : 3.5 Contournement des défenses (AML.TA0007)
  - H4 : T-EVADE-001 : Contournement des motifs de modération
  - H4 : T-EVADE-002 : Échappement de l’enveloppe de contenu
  - H3 : 3.6 Découverte (AML.TA0008)
  - H4 : T-DISC-001 : Énumération des outils
  - H4 : T-DISC-002 : Extraction des données de session
  - H3 : 3.7 Collecte et exfiltration (AML.TA0009, AML.TA0010)
  - H4 : T-EXFIL-001 : Vol de données via webfetch
  - H4 : T-EXFIL-002 : Envoi de messages non autorisé
  - H4 : T-EXFIL-003 : Collecte frauduleuse d’identifiants
  - H3 : 3.8 Impact (AML.TA0011)
  - H4 : T-IMPACT-001 : Exécution de commandes non autorisée
  - H4 : T-IMPACT-002 : Épuisement des ressources (DoS)
  - H4 : T-IMPACT-003 : Atteinte à la réputation
  - H2 : 4. Analyse de la chaîne d’approvisionnement de ClawHub
  - H3 : 4.1 Contrôles de sécurité actuels
  - H3 : 4.2 Limites de la modération
  - H3 : 4.3 Badges
  - H2 : 5. Matrice des risques
  - H3 : 5.1 Probabilité et impact
  - H3 : 5.2 Chaînes d’attaque des chemins critiques
  - H2 : 6. Synthèse des recommandations
  - H3 : 6.1 Immédiates (P0)
  - H3 : 6.2 À court terme (P1)
  - H3 : 6.3 À moyen terme (P2)
  - H2 : 7. Annexes
  - H3 : 7.1 Correspondance des techniques ATLAS
  - H3 : 7.2 Fichiers de sécurité essentiels
  - H3 : 7.3 Glossaire
  - H2 : Voir aussi

## security/formal-verification.md

- Route : /security/formal-verification
- Titres :
  - H2 : Présentation
  - H2 : Emplacement des modèles
  - H2 : Réserves
  - H2 : Reproduction des résultats
  - H2 : Assertions et cibles
  - H3 : Exposition du Gateway et mauvaise configuration d’un Gateway ouvert
  - H3 : Pipeline d’exécution du Node (fonctionnalité présentant le risque le plus élevé)
  - H3 : Stockage des appairages (contrôle d’accès aux messages privés)
  - H3 : Contrôle des entrées (mentions et contournement par les commandes de contrôle)
  - H3 : Routage et isolation des clés de session
  - H2 : Modèles v1++ : concurrence, nouvelles tentatives et exactitude des traces
  - H3 : Concurrence et idempotence du stockage des appairages
  - H3 : Corrélation et idempotence des traces d’entrée
  - H3 : Priorité de dmScope et identityLinks dans le routage
  - H2 : Voir aussi

## security/incident-response.md

- Route : /security/incident-response
- Titres :
  - H2 : 1. Détection et triage
  - H2 : 2. Gravité
  - H2 : 3. Réponse
  - H2 : 4. Communication et divulgation
  - H2 : 5. Récupération et suivi
  - H2 : Voir aussi

## security/network-proxy.md

- Route : /security/network-proxy
- Titres :
  - H2 : Configuration
  - H3 : Point de terminaison de proxy HTTPS avec une autorité de certification privée
  - H2 : Fonctionnement du routage
  - H3 : Mode boucle locale du Gateway
  - H3 : Conteneurs
  - H2 : Termes connexes relatifs aux proxys
  - H2 : Validation du proxy
  - H2 : Destinations qu’il est recommandé de bloquer
  - H2 : Limites

## specs/codex-supervision.md

- Route : /specs/codex-supervision
- Titres :
  - H1 : Supervision de Codex
  - H2 : Objectif
  - H2 : Périmètre du produit
  - H2 : Responsabilité
  - H2 : Flux du catalogue
  - H2 : Limites de la CLI de l’opérateur
  - H2 : Poursuite locale
  - H2 : Comportement de l’archivage
  - H2 : Sécurité des fils de discussion actifs
  - H2 : Limites des Nodes appairés
  - H2 : Autorisations
  - H2 : Compatibilité
  - H2 : Travaux futurs
  - H2 : Tests d’acceptation

## start/bootstrapping.md

- Route : /start/bootstrapping
- Titres :
  - H2 : Déroulement
  - H2 : Exécutions de modèles intégrés et locaux
  - H2 : Ignorer l’amorçage
  - H2 : Emplacement d’exécution
  - H2 : Documentation connexe

## start/docs-directory.md

- Route : /start/docs-directory
- Titres :
  - H2 : Commencez ici
  - H2 : Canaux et expérience utilisateur
  - H2 : Applications compagnons
  - H2 : Exploitation et sécurité
  - H2 : Voir aussi

## start/getting-started.md

- Route : /start/getting-started
- Titres :
  - H2 : Prérequis
  - H2 : Configuration rapide
  - H2 : Étapes suivantes
  - H2 : Voir aussi

## start/hubs.md

- Route : /start/hubs
- Titres :
  - H2 : Commencez ici
  - H2 : Installation et mises à jour
  - H2 : Concepts fondamentaux
  - H2 : Fournisseurs et entrées
  - H2 : Gateway et exploitation
  - H2 : Outils et automatisation
  - H2 : Nodes, médias et voix
  - H2 : Plateformes
  - H2 : Application compagnon macOS (avancé)
  - H2 : Plugins
  - H2 : Espace de travail et modèles
  - H2 : Projet
  - H2 : Tests et publication
  - H2 : Voir aussi

## start/lore.md

- Route : /start/lore
- Titres :
  - H1 : La légende d’OpenClaw 🦞📖
  - H2 : L’histoire des origines
  - H2 : La première mue (27 janvier 2026)
  - H2 : Le nom
  - H2 : Les Daleks contre les homards
  - H2 : Personnages principaux
  - H3 : Molty 🦞
  - H3 : Peter 👨‍💻
  - H2 : Le Moltiverse
  - H2 : Les grands incidents
  - H3 : La divulgation du répertoire (3 décembre 2025)
  - H3 : La grande mue (27 janvier 2026)
  - H3 : La forme finale (30 janvier 2026)
  - H3 : La frénésie d’achats du robot (3 décembre 2025)
  - H2 : Textes sacrés
  - H2 : Le credo du homard
  - H3 : La saga de la génération de l’icône (27 janvier 2026)
  - H2 : L’avenir
  - H2 : Voir aussi

## start/onboarding-overview.md

- Route : /start/onboarding-overview
- Titres :
  - H2 : Quel parcours choisir ?
  - H2 : Ce que configure l’intégration
  - H2 : Intégration via la CLI
  - H2 : Intégration via l’application macOS
  - H2 : Fournisseurs personnalisés ou non répertoriés
  - H2 : Voir aussi

## start/onboarding.md

- Route : /start/onboarding
- Titres :
  - H2 : Voir aussi

## start/openclaw.md

- Route : /start/openclaw
- Titres :
  - H2 : La sécurité avant tout
  - H2 : Prérequis
  - H2 : Configuration avec deux téléphones (recommandée)
  - H2 : Démarrage rapide en 5 minutes
  - H2 : Attribuer un espace de travail à l’agent (AGENTS)
  - H2 : La configuration qui en fait « un assistant »
  - H2 : Sessions et mémoire
  - H2 : Heartbeats (mode proactif)
  - H2 : Entrée et sortie de médias
  - H2 : Liste de contrôle opérationnelle
  - H2 : Étapes suivantes
  - H2 : Voir aussi

## start/quickstart.md

- Route : /start/quickstart
- Titres :
  - H2 : Voir aussi

## start/setup.md

- Route : /start/setup
- Titres :
  - H2 : En bref
  - H2 : Prérequis (depuis les sources)
  - H2 : Stratégie d’adaptation (pour éviter que les mises à jour ne posent problème)
  - H2 : Exécuter le Gateway depuis ce dépôt
  - H2 : Flux de travail stable (application macOS en premier)
  - H2 : Flux de travail à la pointe (Gateway dans un terminal)
  - H3 : 0) (Facultatif) Exécuter également l’application macOS depuis les sources
  - H3 : 1) Démarrer le Gateway de développement
  - H3 : 2) Connecter l’application macOS à votre Gateway en cours d’exécution
  - H3 : 3) Vérifier
  - H3 : Pièges courants
  - H2 : Carte du stockage des identifiants
  - H2 : Mise à jour (sans compromettre votre configuration)
  - H2 : Linux (service utilisateur systemd)
  - H2 : Documentation connexe

## start/showcase.md

- Route : /start/showcase
- Titres :
  - H2 : Nouveautés de Discord
  - H2 : Automatisation et flux de travail
  - H2 : Connaissances et mémoire
  - H2 : Voix et téléphone
  - H2 : Infrastructure et déploiement
  - H2 : Maison et matériel
  - H2 : Projets communautaires
  - H2 : Proposer votre projet
  - H2 : Voir aussi

## start/wizard-cli-automation.md

- Route : /start/wizard-cli-automation
- Titres :
  - H2 : Exemple non interactif de référence
  - H2 : Exemples propres aux fournisseurs
  - H2 : Ajouter un autre agent
  - H2 : Documentation connexe

## start/wizard-cli-reference.md

- Route : /start/wizard-cli-reference
- Titres :
  - H2 : Fonctionnement de l’assistant
  - H2 : Détails du flux local
  - H2 : Détails du mode distant
  - H2 : Options d’authentification et de modèle
  - H2 : Sorties et fonctionnement interne
  - H2 : Configuration non interactive
  - H2 : RPC de l’assistant du Gateway
  - H2 : Comportement de la configuration de Signal
  - H2 : Documentation connexe

## start/wizard.md

- Route : /start/wizard
- Titres :
  - H2 : Paramètres régionaux
  - H2 : Configuration guidée par défaut
  - H2 : Assistant classique : démarrage rapide ou avancé
  - H2 : Ce que configure l’intégration classique
  - H2 : Ajouter un autre agent
  - H2 : Référence complète
  - H2 : Documentation connexe

## tools/acp-agents-setup.md

- Route : /tools/acp-agents-setup
- Titres :
  - H2 : Prise en charge actuelle du harnais acpx
  - H2 : Configuration requise
  - H2 : Configuration du Plugin pour le moteur acpx
  - H3 : Sonde de démarrage de l’environnement d’exécution acpx
  - H3 : Téléchargement automatique de l’adaptateur
  - H3 : Passerelle MCP des outils du Plugin
  - H3 : Passerelle MCP des outils OpenClaw
  - H3 : Configuration du délai d’expiration des opérations de l’environnement d’exécution
  - H3 : Configuration de l’agent de sonde d’intégrité
  - H2 : Configuration des autorisations
  - H3 : permissionMode
  - H3 : nonInteractivePermissions
  - H3 : Configuration
  - H2 : Voir aussi

## tools/acp-agents.md

- Route : /tools/acp-agents
- Titres :
  - H2 : Quelle page choisir ?
  - H2 : Cela fonctionne-t-il immédiatement ?
  - H2 : Cibles de harnais prises en charge
  - H2 : Guide opérationnel
  - H2 : ACP et sous-agents
  - H2 : Comment ACP exécute Claude Code
  - H2 : Sessions liées
  - H3 : Modèle mental
  - H3 : Liaisons à la conversation actuelle
  - H2 : Liaisons persistantes aux canaux
  - H3 : Modèle de liaison
  - H3 : Valeurs par défaut de l’environnement d’exécution par agent
  - H3 : Exemple
  - H3 : Comportement
  - H2 : Démarrer des sessions ACP
  - H3 : Paramètres de sessionsspawn
  - H2 : Modes de création, de liaison et de fil de discussion
  - H2 : Modèle de livraison
  - H2 : Compatibilité avec le bac à sable
  - H2 : Résolution de la cible de session
  - H2 : Contrôles ACP
  - H3 : Correspondance des options de l’environnement d’exécution
  - H2 : Harnais acpx, configuration du Plugin et autorisations
  - H2 : Résolution des problèmes
  - H2 : Voir aussi

## tools/agent-send.md

- Route : /tools/agent-send
- Titres :
  - H2 : Démarrage rapide
  - H2 : Options
  - H2 : Comportement
  - H2 : Exemples
  - H2 : Voir aussi

## tools/apply-patch.md

- Route : /tools/apply-patch
- Titres :
  - H2 : Paramètres
  - H2 : Remarques
  - H2 : Exemple
  - H2 : Voir aussi

## tools/brave-search.md

- Route : /tools/brave-search
- Titres :
  - H2 : Obtenir une clé d’API
  - H2 : Exemple de configuration
  - H2 : Paramètres de l’outil
  - H2 : Remarques
  - H2 : Voir aussi

## tools/browser-control.md

- Route : /tools/browser-control
- Titres :
  - H2 : API de contrôle (facultative)
  - H3 : Contrat d’erreur de /act
  - H3 : Prérequis Playwright
  - H4 : Installation de Playwright dans Docker
  - H2 : Fonctionnement (interne)
  - H2 : Référence rapide de la CLI
  - H2 : Instantanés et références
  - H2 : Options avancées d’attente
  - H2 : Flux de travail de débogage
  - H2 : Sortie JSON
  - H2 : Paramètres d’état et d’environnement
  - H2 : Sécurité et confidentialité
  - H2 : Voir aussi

## tools/browser-linux-troubleshooting.md

- Route : /tools/browser-linux-troubleshooting
- Titres :
  - H2 : Problème : échec du démarrage de Chrome CDP sur le port 18800
  - H3 : Cause racine
  - H3 : Solution 1 : installer Google Chrome (recommandé)
  - H3 : Solution 2 : utiliser Chromium installé via snap en mode connexion uniquement
  - H3 : Vérifier le fonctionnement du navigateur
  - H3 : Référence de configuration
  - H3 : Problème : aucun onglet Chrome trouvé pour profile="user"
  - H2 : Voir aussi

## tools/browser-login.md

- Route : /tools/browser-login
- Titres :
  - H2 : Connexion manuelle (recommandée)
  - H2 : Quel profil Chrome est utilisé ?
  - H2 : Mise en bac à sable : autoriser l’accès au navigateur hôte
  - H2 : Voir aussi

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- Route : /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- Titres :
  - H2 : Choisissez d’abord le mode de navigateur approprié
  - H3 : Option 1 : CDP distant brut de WSL2 vers Windows
  - H3 : Option 2 : MCP Chrome local à l’hôte
  - H2 : Architecture fonctionnelle
  - H2 : Règle essentielle pour l’interface de contrôle
  - H2 : Valider par couches
  - H3 : Couche 1 : vérifier que Chrome fournit CDP sous Windows
  - H4 : Diagnostiquer IPv4 et IPv6 avant de modifier portproxy
  - H3 : Couche 2 : vérifier que WSL2 peut atteindre ce point de terminaison Windows
  - H3 : Couche 3 : configurer le profil de navigateur approprié
  - H3 : Couche 4 : vérifier séparément la couche de l’interface de contrôle
  - H3 : Couche 5 : vérifier le contrôle du navigateur de bout en bout
  - H2 : Erreurs courantes trompeuses
  - H2 : Liste de contrôle pour un triage rapide
  - H2 : Voir aussi

## tools/browser.md

- Route : /tools/browser
- Titres :
  - H2 : Ce que vous obtenez
  - H2 : Démarrage rapide
  - H2 : Contrôle des Plugins
  - H2 : Instructions pour l’agent
  - H2 : Commande ou outil de navigateur manquant
  - H2 : Profils : openclaw, user, chrome
  - H2 : Configuration
  - H3 : Vision par capture d’écran (prise en charge des modèles textuels uniquement)
  - H2 : Utiliser Brave ou un autre navigateur basé sur Chromium
  - H2 : Contrôle local ou distant
  - H2 : Proxy de navigateur Node (configuration par défaut sans intervention)
  - H2 : Browserless (CDP distant hébergé)
  - H3 : Browserless Docker sur le même hôte
  - H2 : Fournisseurs CDP WebSocket directs
  - H3 : Browserbase
  - H3 : Notte
  - H2 : Sécurité
  - H2 : Profils (plusieurs navigateurs)
  - H2 : Session existante via Chrome DevTools MCP
  - H3 : Lancement personnalisé de Chrome MCP
  - H2 : Garanties d’isolation
  - H2 : Sélection du navigateur
  - H2 : API de contrôle (facultative)
  - H2 : Dépannage
  - H3 : Échec du démarrage de CDP ou blocage SSRF de la navigation
  - H2 : Outils de l’agent et fonctionnement du contrôle
  - H2 : Pages connexes

## tools/btw.md

- Route : /tools/btw
- Titres :
  - H2 : Fonctionnement
  - H2 : Ce qu’il ne fait pas
  - H2 : Modèle de distribution
  - H2 : Comportement de l’interface
  - H2 : Fenêtre contextuelle de sélection (interface de contrôle)
  - H2 : Quand l’utiliser
  - H2 : Pages connexes

## tools/capability-cookbook.md

- Route : /tools/capability-cookbook
- Titres :
  - H2 : Pages connexes

## tools/chrome-extension.md

- Route : /tools/chrome-extension
- Titres :
  - H1 : Extension Chrome
  - H2 : Fonctionnement
  - H2 : Installation et association
  - H2 : Utilisation
  - H2 : À distance / entre plusieurs machines
  - H2 : Diagnostics
  - H2 : Modèle de sécurité

## tools/clawhub.md

- Route : /tools/clawhub
- Titres : aucun

## tools/code-execution.md

- Route : /tools/code-execution
- Titres :
  - H2 : Configuration
  - H2 : Utilisation
  - H2 : Erreurs
  - H2 : Pages connexes

## tools/creating-skills.md

- Route : /tools/creating-skills
- Titres :
  - H2 : Créer votre première Skill
  - H2 : Référence de SKILL.md
  - H3 : Champs obligatoires
  - H3 : Clés de frontmatter facultatives
  - H3 : Utilisation de {baseDir}
  - H2 : Ajouter une activation conditionnelle
  - H2 : Proposer via l’atelier de Skills
  - H2 : Publier sur ClawHub
  - H2 : Bonnes pratiques
  - H2 : Pages connexes

## tools/diffs.md

- Route : /tools/diffs
- Titres :
  - H2 : Démarrage rapide
  - H2 : Désactiver les instructions système intégrées
  - H2 : Référence des entrées de l’outil
  - H2 : Coloration syntaxique
  - H2 : Contrat des détails de sortie
  - H3 : Sections inchangées réduites
  - H3 : Navigation entre plusieurs fichiers
  - H2 : Valeurs par défaut du Plugin
  - H3 : Configuration de l’URL persistante de la visionneuse
  - H2 : Configuration de la sécurité
  - H2 : Cycle de vie et stockage des artefacts
  - H2 : URL de la visionneuse et comportement réseau
  - H2 : Modèle de sécurité
  - H2 : Exigences du navigateur pour le mode fichier
  - H2 : Dépannage
  - H2 : Recommandations opérationnelles
  - H2 : Pages connexes

## tools/duckduckgo-search.md

- Route : /tools/duckduckgo-search
- Titres :
  - H2 : Configuration
  - H2 : Configuration
  - H2 : Paramètres de l’outil
  - H2 : Remarques
  - H2 : Pages connexes

## tools/elevated.md

- Route : /tools/elevated
- Titres :
  - H2 : Directives
  - H2 : Fonctionnement
  - H2 : Ordre de résolution
  - H2 : Disponibilité et listes d’autorisation
  - H2 : Ce que le mode élevé ne contrôle pas
  - H2 : Pages connexes

## tools/exa-search.md

- Route : /tools/exa-search
- Titres :
  - H2 : Installer le Plugin
  - H2 : Obtenir une clé API
  - H2 : Configuration
  - H2 : Remplacement de l’URL de base
  - H2 : Paramètres de l’outil
  - H3 : Extraction de contenu
  - H3 : Modes de recherche
  - H2 : Remarques
  - H2 : Pages connexes

## tools/exec-approvals-advanced.md

- Route : /tools/exec-approvals-advanced
- Titres :
  - H2 : Binaires sûrs (entrée standard uniquement)
  - H3 : Validation d’Argv et options refusées
  - H3 : Répertoires de binaires approuvés
  - H3 : Chaînage de commandes shell, enveloppes et multiplexeurs
  - H3 : Binaires sûrs ou liste d’autorisation
  - H2 : Commandes d’interpréteur/d’environnement d’exécution
  - H3 : Comportement de distribution des suivis
  - H2 : Transfert des demandes d’approbation vers les canaux de discussion
  - H3 : Transfert des demandes d’approbation du Plugin
  - H3 : Approbations dans la même discussion sur tous les canaux
  - H3 : Distribution native des demandes d’approbation
  - H3 : Applications mobiles officielles pour les opérateurs
  - H3 : Flux IPC macOS
  - H2 : FAQ
  - H3 : Quand accountId et threadId sont-ils utilisés pour une cible d’approbation ?
  - H3 : Lorsque des demandes d’approbation sont envoyées à une session, toute personne présente dans cette session peut-elle les approuver ?
  - H2 : Pages connexes

## tools/exec-approvals.md

- Route : /tools/exec-approvals
- Titres :
  - H2 : Champ d’application
  - H3 : Modèle de confiance
  - H3 : Séparation sous macOS
  - H2 : Inspection de la politique effective
  - H2 : Paramètres et stockage
  - H2 : Paramètres de réglage de la politique
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
  - H3 : Restriction des arguments avec argPattern
  - H2 : Autoriser automatiquement les CLI des Skills
  - H2 : Binaires sûrs et transfert des demandes d’approbation
  - H2 : Modification dans l’interface de contrôle
  - H2 : Flux d’approbation
  - H2 : Événements système et refus
  - H2 : Implications
  - H2 : Pages connexes

## tools/exec.md

- Route : /tools/exec
- Titres :
  - H2 : Paramètres
  - H2 : Configuration
  - H3 : Modes
  - H3 : Évaluation en ligne (strictInlineEval)
  - H3 : Gestion de PATH
  - H2 : Remplacements propres à la session (/exec)
  - H2 : Approbations d’exécution (application compagnon / hôte Node)
  - H2 : Liste d’autorisation et binaires sûrs
  - H2 : Exemples
  - H2 : applypatch
  - H2 : Pages connexes

## tools/firecrawl.md

- Route : /tools/firecrawl
- Titres :
  - H2 : Installer le Plugin
  - H2 : Récupération Web sans clé et clés API
  - H2 : Configurer la recherche Firecrawl
  - H2 : Configurer la solution de secours Firecrawl pour la récupération Web
  - H3 : Firecrawl auto-hébergé
  - H2 : Outils du Plugin Firecrawl
  - H3 : firecrawlsearch
  - H3 : firecrawlscrape
  - H2 : Furtivité / contournement des robots
  - H2 : Utilisation de Firecrawl par la récupération Web
  - H2 : Pages connexes

## tools/gemini-search.md

- Route : /tools/gemini-search
- Titres :
  - H2 : Obtenir une clé API
  - H2 : Configuration
  - H2 : Fonctionnement
  - H2 : Paramètres pris en charge
  - H2 : Sélection du modèle
  - H2 : Remplacements de l’URL de base
  - H2 : Pages connexes

## tools/goal.md

- Route : /tools/goal
- Titres :
  - H1 : Objectif
  - H2 : Démarrage rapide
  - H2 : Utilité des objectifs
  - H2 : Référence des commandes
  - H2 : États
  - H2 : Budgets de jetons
  - H2 : Outils de modèle
  - H2 : Contexte de l’objectif à chaque tour
  - H2 : Interface de contrôle
  - H2 : TUI
  - H2 : Comportement des canaux
  - H2 : Dépannage
  - H2 : Pages connexes

## tools/grok-search.md

- Route : /tools/grok-search
- Titres :
  - H2 : Intégration et configuration
  - H2 : Se connecter ou obtenir une clé API
  - H2 : Configuration
  - H2 : Fonctionnement
  - H2 : Paramètres pris en charge
  - H2 : Remplacements de l’URL de base
  - H2 : Pages connexes

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
  - H3 : Modification d’images
  - H2 : Présentation détaillée des fournisseurs
  - H2 : Exemples
  - H2 : Pages connexes

## tools/index.md

- Route : /tools
- Titres :
  - H2 : Commencer ici
  - H2 : Choisir des outils, des Skills ou des Plugins
  - H2 : Catégories d’outils intégrés
  - H2 : Outils fournis par des Plugins
  - H2 : Configurer l’accès et les approbations
  - H2 : Étendre les capacités
  - H2 : Résoudre les problèmes d’outils manquants
  - H2 : Pages connexes

## tools/kimi-search.md

- Route : /tools/kimi-search
- Titres :
  - H2 : Configuration
  - H2 : Configuration
  - H2 : Exigence d’ancrage
  - H2 : Paramètres de l’outil
  - H2 : Pages connexes

## tools/llm-task.md

- Route : /tools/llm-task
- Titres :
  - H2 : Activer
  - H2 : Configuration (facultative)
  - H2 : Paramètres de l’outil
  - H2 : Sortie
  - H2 : Exemple : étape d’un flux de travail Lobster
  - H3 : Limitation importante
  - H2 : Remarques de sécurité
  - H2 : Pages connexes

## tools/lobster.md

- Route : /tools/lobster
- Titres :
  - H2 : Pourquoi
  - H2 : Fonctionnement
  - H2 : Activer
  - H2 : Modèle : petite CLI + pipelines JSON + approbations
  - H2 : Étapes LLM exclusivement JSON (llm-task)
  - H3 : Limitation importante : Lobster intégré ou openclaw.invoke
  - H2 : Fichiers de flux de travail (.lobster)
  - H2 : Paramètres de l’outil
  - H3 : run
  - H3 : resume
  - H3 : Mode de flux de tâches géré
  - H2 : Enveloppe de sortie
  - H2 : Approbations
  - H2 : OpenProse
  - H2 : Sécurité
  - H2 : Dépannage
  - H2 : En savoir plus
  - H2 : Étude de cas : flux de travail de la communauté
  - H2 : Pages connexes

## tools/loop-detection.md

- Route : /tools/loop-detection
- Titres :
  - H2 : Raison d’être
  - H2 : Bloc de configuration
  - H3 : Comportement des champs
  - H2 : Configuration recommandée
  - H2 : Protection après Compaction
  - H2 : Journaux et comportement attendu
  - H2 : Pages connexes

## tools/media-overview.md

- Route : /tools/media-overview
- Titres :
  - H2 : Capacités
  - H2 : Matrice des capacités des fournisseurs
  - H2 : Asynchrone ou synchrone
  - H2 : Conversion de la parole en texte et appel vocal
  - H2 : Correspondances des fournisseurs (répartition des prestataires entre les interfaces)
  - H2 : Pages connexes

## tools/minimax-search.md

- Route : /tools/minimax-search
- Titres :
  - H2 : Obtenir un identifiant Token Plan
  - H2 : Configuration
  - H2 : Sélection de la région
  - H2 : Paramètres pris en charge
  - H2 : Pages connexes

## tools/multi-agent-sandbox-tools.md

- Route : /tools/multi-agent-sandbox-tools
- Titres :
  - H2 : Exemples de configuration
  - H2 : Priorité de la configuration
  - H3 : Configuration du bac à sable
  - H3 : Restrictions des outils
  - H2 : Migration depuis un agent unique
  - H2 : Exemples de restrictions des outils
  - H2 : Piège courant : « non-main »
  - H2 : Tests
  - H2 : Dépannage
  - H2 : Pages connexes

## tools/music-generation.md

- Route : /tools/music-generation
- Titres :
  - H2 : Démarrage rapide
  - H2 : Fournisseurs pris en charge
  - H3 : Matrice des capacités
  - H2 : Paramètres de l’outil
  - H2 : Comportement asynchrone
  - H3 : Cycle de vie des tâches
  - H2 : Configuration
  - H3 : Sélection du modèle
  - H3 : Ordre de sélection des fournisseurs
  - H2 : Remarques sur les fournisseurs
  - H2 : Choisir la voie appropriée
  - H2 : Modes de capacité des fournisseurs
  - H2 : Tests en direct
  - H2 : Pages connexes

## tools/ollama-search.md

- Route : /tools/ollama-search
- Titres :
  - H2 : Configuration
  - H2 : Configuration
  - H2 : Authentification et routage des requêtes
  - H2 : Pages connexes

## tools/parallel-search.md

- Route : /tools/parallel-search
- Titres :
  - H2 : Installer le Plugin
  - H2 : Clé API (fournisseur payant)
  - H2 : Configuration
  - H2 : Remplacement de l’URL de base
  - H2 : Paramètres de l’outil
  - H2 : Remarques
  - H2 : Pages connexes

## tools/pdf.md

- Route : /tools/pdf
- Titres :
  - H2 : Disponibilité
  - H2 : Référence des entrées
  - H2 : Références PDF prises en charge
  - H2 : Modes d’exécution
  - H3 : Mode natif du fournisseur
  - H3 : Mode de secours par extraction
  - H2 : Configuration
  - H2 : Détails de la sortie
  - H2 : Comportement en cas d’erreur
  - H2 : Exemples
  - H2 : Pages connexes

## tools/permission-modes.md

- Route : /tools/permission-modes
- Titres :
  - H2 : Valeur par défaut recommandée
  - H2 : Modes d’exécution de l’hôte OpenClaw
  - H2 : Correspondance Codex Guardian
  - H2 : Autorisations du banc d’essai ACPX
  - H2 : Choisir un mode
  - H2 : Pages connexes

## tools/perplexity-search.md

- Route : /tools/perplexity-search
- Titres :
  - H2 : Installer le Plugin
  - H2 : Obtenir une clé API Perplexity
  - H2 : Compatibilité avec OpenRouter
  - H2 : Exemples de configuration
  - H3 : API native Perplexity Search
  - H3 : Compatibilité OpenRouter / Sonar
  - H2 : Où définir la clé
  - H2 : Paramètres de l’outil
  - H3 : Règles de filtrage des domaines
  - H2 : Remarques
  - H2 : Pages connexes

## tools/plugin.md

- Route : /tools/plugin
- Titres :
  - H2 : Exigences
  - H2 : Démarrage rapide
  - H2 : Configuration
  - H3 : Choisir une source d’installation
  - H3 : Politique d’installation de l’opérateur
  - H3 : Configurer la politique des Plugins
  - H2 : Comprendre les formats de Plugin
  - H2 : Points d’extension des Plugins
  - H2 : Vérifier le Gateway actif
  - H2 : Dépannage
  - H3 : Propriété bloquée du chemin du Plugin
  - H3 : Configuration lente des outils du Plugin
  - H2 : Pages connexes

## tools/reactions.md

- Route : /tools/reactions
- Titres :
  - H2 : Fonctionnement
  - H2 : Comportement des canaux
  - H2 : Niveau de réaction
  - H2 : Pages connexes

## tools/searxng-search.md

- Route : /tools/searxng-search
- Titres :
  - H2 : Configuration
  - H2 : Configuration
  - H2 : Variable d’environnement
  - H2 : Référence de configuration du Plugin
  - H2 : Remarques
  - H2 : Pages connexes

## tools/show-widget.md

- Route : /tools/show-widget
- Titres :
  - H2 : Utiliser l’outil
  - H2 : Sécurité et stockage
  - H2 : Pages connexes

## tools/skill-workshop.md

- Route : /tools/skill-workshop
- Titres :
  - H2 : Fonctionnement
  - H2 : Cycle de vie
  - H2 : Gestion du cycle de vie
  - H2 : Discussion
  - H3 : Apprendre des travaux récents
  - H2 : CLI
  - H2 : Contenu de la proposition
  - H2 : Fichiers de prise en charge
  - H2 : Outil de l’agent
  - H2 : Skills suggérées
  - H2 : Approbation et autonomie
  - H2 : Méthodes du Gateway
  - H2 : Stockage
  - H2 : Limites
  - H2 : Résolution des problèmes
  - H3 : Diagnostic de la politique des outils
  - H2 : Contenu associé

## tools/skills-config.md

- Route : /tools/skills-config
- Titres :
  - H2 : Chargement (skills.load)
  - H2 : Installation (skills.install)
  - H2 : Politique d’installation de l’opérateur (security.installPolicy)
  - H2 : Liste d’autorisation des Skills intégrées
  - H2 : Entrées par Skill (skills.entries)
  - H2 : Listes d’autorisation des agents (agents)
  - H2 : Atelier (skills.workshop)
  - H2 : Racines de Skills liées symboliquement
  - H2 : Skills en bac à sable et variables d’environnement
  - H2 : Rappel de l’ordre de chargement
  - H2 : Contenu associé

## tools/skills.md

- Route : /tools/skills
- Titres :
  - H2 : Ordre de chargement
  - H2 : Skills hébergées par Node
  - H2 : Skills propres à chaque agent ou partagées
  - H2 : Listes d’autorisation des agents
  - H2 : Plugins et Skills
  - H2 : Atelier de Skills
  - H2 : Installation depuis ClawHub
  - H2 : Sécurité
  - H2 : Format de SKILL.md
  - H3 : Clés facultatives du frontmatter
  - H2 : Contrôle d’accès
  - H3 : Spécifications du programme d’installation
  - H2 : Remplacements de configuration
  - H2 : Injection de l’environnement
  - H2 : Instantanés et actualisation
  - H2 : Incidence sur les tokens
  - H2 : Contenu associé

## tools/slash-commands.md

- Route : /tools/slash-commands
- Titres :
  - H2 : Trois types de commandes
  - H2 : Configuration
  - H2 : Liste des commandes
  - H3 : Commandes principales
  - H3 : Commandes du dock
  - H3 : Commandes des Plugins intégrés
  - H3 : Commandes des Skills
  - H2 : /tools : ce que l’agent peut utiliser actuellement
  - H2 : /model : sélection du modèle
  - H2 : /config : écritures dans la configuration sur disque
  - H2 : /mcp : configuration du serveur MCP
  - H2 : /debug : remplacements limités à l’exécution
  - H2 : /plugins : gestion des Plugins
  - H2 : /trace : sortie de traçage des Plugins
  - H2 : /btw : questions secondaires
  - H2 : Remarques sur les interfaces
  - H2 : Utilisation et état du fournisseur
  - H2 : Contenu associé

## tools/steer.md

- Route : /tools/steer
- Titres :
  - H2 : Session actuelle
  - H2 : Pilotage ou mise en file d’attente
  - H2 : Sous-agents
  - H2 : Sessions ACP
  - H2 : Contenu associé

## tools/subagents.md

- Route : /tools/subagents
- Titres :
  - H2 : Commande oblique
  - H3 : Contrôles de liaison aux fils de discussion
  - H3 : Comportement de création
  - H2 : Modes de contexte
  - H2 : Outil : sessionsspawn
  - H3 : Mode d’invite de délégation
  - H3 : Paramètres de l’outil
  - H3 : Noms des tâches et ciblage
  - H2 : Outil : sessionsyield
  - H2 : Outil : subagents
  - H2 : Sessions liées aux fils de discussion
  - H3 : Canaux prenant en charge les fils de discussion
  - H3 : Procédure rapide
  - H3 : Contrôles manuels
  - H3 : Options de configuration
  - H3 : Liste d’autorisation
  - H3 : Découverte
  - H3 : Archivage automatique
  - H2 : Sous-agents imbriqués
  - H3 : Niveaux de profondeur
  - H3 : Chaîne d’annonce
  - H3 : Politique des outils selon la profondeur
  - H3 : Limite de création par agent
  - H3 : Arrêt en cascade
  - H2 : Authentification
  - H2 : Annonce
  - H3 : Contexte de l’annonce
  - H3 : Ligne de statistiques
  - H3 : Pourquoi préférer sessionshistory
  - H2 : Politique des outils
  - H3 : Remplacement par la configuration
  - H2 : Simultanéité
  - H2 : Disponibilité et récupération
  - H2 : Arrêt
  - H2 : Limites
  - H2 : Contenu associé

## tools/tavily.md

- Route : /tools/tavily
- Titres :
  - H2 : Prise en main
  - H2 : Référence des outils
  - H3 : tavilysearch
  - H3 : tavilyextract
  - H2 : Choisir le bon outil
  - H2 : Configuration avancée
  - H2 : Contenu associé

## tools/thinking.md

- Route : /tools/thinking
- Titres :
  - H2 : Fonction
  - H2 : Ordre de résolution
  - H2 : Définition d’une valeur par défaut pour la session
  - H2 : Application par agent
  - H2 : Mode rapide (/fast)
  - H2 : Directives de verbosité (/verbose ou /v)
  - H2 : Directives de traçage des Plugins (/trace)
  - H2 : Visibilité du raisonnement (/reasoning)
  - H2 : Contenu associé
  - H2 : Heartbeats
  - H2 : Interface de discussion web
  - H2 : Profils de fournisseurs

## tools/tokenjuice.md

- Route : /tools/tokenjuice
- Titres :
  - H2 : Activer le Plugin
  - H2 : Modifications apportées par Tokenjuice
  - H2 : Vérifier son fonctionnement
  - H2 : Désactiver le Plugin
  - H2 : Contenu associé

## tools/tool-search.md

- Route : /tools/tool-search
- Titres :
  - H2 : Déroulement d’un tour
  - H2 : Modes
  - H2 : Raison d’être
  - H2 : API
  - H2 : Limite d’exécution
  - H2 : Configuration
  - H2 : Invite et télémétrie
  - H2 : Validation E2E
  - H2 : Comportement en cas d’échec
  - H2 : Contenu associé

## tools/trajectory.md

- Route : /tools/trajectory
- Titres :
  - H2 : Démarrage rapide
  - H2 : Accès
  - H2 : Éléments enregistrés
  - H2 : Fichiers du paquet
  - H2 : Stockage des captures
  - H2 : Désactivation de la capture
  - H2 : Réglage du délai d’expiration du vidage
  - H2 : Confidentialité et limites
  - H2 : Résolution des problèmes
  - H2 : Contenu associé

## tools/tts.md

- Route : /tools/tts
- Titres :
  - H2 : Démarrage rapide
  - H2 : Fournisseurs pris en charge
  - H2 : Configuration
  - H3 : Remplacements de voix par agent
  - H2 : Personnalités
  - H3 : Personnalité minimale
  - H3 : Personnalité complète (invite indépendante du fournisseur)
  - H3 : Résolution de la personnalité
  - H3 : Utilisation des invites de personnalité par les fournisseurs
  - H3 : Politique de repli
  - H2 : Directives pilotées par le modèle
  - H2 : Commandes obliques
  - H2 : Préférences par utilisateur
  - H2 : Formats de sortie
  - H2 : Comportement de la synthèse vocale automatique
  - H2 : Référence des champs
  - H2 : Outil de l’agent
  - H2 : RPC du Gateway
  - H2 : Liens vers les services
  - H2 : Contenu associé

## tools/video-generation.md

- Route : /tools/video-generation
- Titres :
  - H2 : Démarrage rapide
  - H2 : Fonctionnement de la génération asynchrone
  - H3 : Cycle de vie de la tâche
  - H2 : Fournisseurs pris en charge
  - H3 : Matrice des fonctionnalités
  - H2 : Paramètres de l’outil
  - H3 : Obligatoires
  - H3 : Entrées de contenu
  - H3 : Contrôles de style
  - H3 : Avancés
  - H4 : Repli et options typées
  - H2 : Actions
  - H2 : Sélection du modèle
  - H2 : Remarques sur les fournisseurs
  - H2 : Modes de fonctionnalités des fournisseurs
  - H2 : Tests en direct
  - H2 : Configuration
  - H2 : Contenu associé

## tools/web-fetch.md

- Route : /tools/web-fetch
- Titres :
  - H2 : Démarrage rapide
  - H2 : Paramètres de l’outil
  - H2 : Fonctionnement
  - H2 : Mises à jour de la progression
  - H2 : Configuration
  - H2 : Repli vers Firecrawl
  - H2 : Proxy d’environnement de confiance
  - H2 : Limites et sécurité
  - H2 : Profils d’outils
  - H2 : Contenu associé

## tools/web.md

- Route : /tools/web
- Titres :
  - H2 : Démarrage rapide
  - H2 : Choisir un fournisseur
  - H3 : Comparaison des fournisseurs
  - H2 : Détection automatique
  - H2 : Recherche web native d’OpenAI
  - H2 : Recherche web native de Codex
  - H2 : Sécurité du réseau
  - H2 : Configuration
  - H3 : Stockage des clés d’API
  - H2 : Paramètres de l’outil
  - H2 : xsearch
  - H3 : Configuration de xsearch
  - H3 : Paramètres de xsearch
  - H3 : Exemple de xsearch
  - H2 : Exemples
  - H2 : Profils d’outils
  - H2 : Contenu associé

## tts.md

- Route : /tts
- Titres :
  - H2 : Contenu associé

## vps.md

- Route : /vps
- Titres :
  - H2 : Choisir un fournisseur
  - H2 : Fonctionnement des configurations dans le cloud
  - H2 : Sécuriser d’abord l’accès administrateur
  - H2 : Agent d’entreprise partagé sur un VPS
  - H2 : Utilisation de Nodes avec un VPS
  - H2 : Optimisation du démarrage pour les petites machines virtuelles et les hôtes ARM
  - H3 : Liste de contrôle pour l’optimisation de systemd (facultatif)
  - H2 : Contenu associé

## web/control-ui.md

- Route : /web/control-ui
- Titres :
  - H2 : Ouverture rapide (en local)
  - H2 : Appairage de l’appareil (première connexion)
  - H2 : Appairer un appareil mobile
  - H2 : Identité personnelle (locale au navigateur)
  - H2 : Point de terminaison de configuration d’exécution
  - H2 : État de l’hôte du Gateway
  - H2 : Prise en charge des langues
  - H2 : Thèmes d’apparence
  - H2 : Gérer les Plugins
  - H2 : Navigation dans la barre latérale
  - H2 : Page de nouvelle session
  - H2 : Fonctionnalités actuelles
  - H2 : Page MCP
  - H2 : Onglet d’activité
  - H2 : Terminal de l’opérateur
  - H2 : Panneau du navigateur
  - H2 : Comportement de la discussion
  - H2 : Perte de connexion et reconnexion
  - H2 : Installation de la PWA et notifications push web
  - H2 : Intégrations hébergées
  - H2 : Largeur des messages de discussion
  - H2 : Accès au tailnet (recommandé)
  - H2 : HTTP non sécurisé
  - H2 : Politique de sécurité du contenu
  - H2 : Authentification de la route de l’avatar
  - H2 : Authentification de la route des médias de l’assistant
  - H2 : Liens d’approbation
  - H2 : Page vide de l’interface de contrôle
  - H2 : Débogage/tests : serveur de développement + Gateway distant
  - H2 : Contenu associé

## web/dashboard.md

- Route : /web/dashboard
- Titres :
  - H2 : Procédure rapide (recommandée)
  - H2 : Principes de base de l’authentification (locale ou distante)
  - H2 : Ouvrir dans Telegram
  - H2 : Si « unauthorized » / 1008 s’affiche
  - H2 : Contenu associé

## web/index.md

- Route : /web
- Titres :
  - H2 : Configuration (activée par défaut)
  - H2 : Webhooks
  - H2 : RPC HTTP d’administration
  - H2 : Accès Tailscale
  - H2 : Remarques sur la sécurité
  - H2 : Compilation de l’interface utilisateur

## web/lobster.md

- Route : /web/lobster
- Titres :
  - H2 : Ce que vous voyez
  - H2 : Quand il apparaît
  - H2 : Actions possibles
  - H2 : Désactiver les visites (ou les réactiver)
  - H2 : Le Lobsterdex
  - H2 : Notes de terrain
  - H2 : Confidentialité

## web/tui.md

- Route : /web/tui
- Titres :
  - H2 : Démarrage rapide
  - H3 : Mode Gateway
  - H3 : Mode local
  - H2 : Ce que vous voyez
  - H2 : Modèle mental : agents + sessions
  - H2 : Envoi + livraison
  - H2 : Sélecteurs + superpositions
  - H2 : Raccourcis clavier
  - H2 : Commandes obliques
  - H2 : Commandes shell locales
  - H2 : Assistant de configuration et de réparation de Crestodian
  - H2 : Sortie des outils
  - H2 : Couleurs du terminal
  - H2 : Historique + diffusion en continu
  - H2 : Détails de la connexion
  - H2 : Options
  - H2 : Résolution des problèmes
  - H2 : Résolution des problèmes de connexion
  - H2 : Contenu associé

## web/webchat.md

- Route : /web/webchat
- Titres :
  - H2 : Présentation
  - H2 : Démarrage rapide
  - H2 : Fonctionnement
  - H3 : Modèle de transcription et de livraison
  - H2 : Panneau des outils des agents de l’interface de contrôle
  - H2 : Utilisation à distance
  - H2 : Référence de configuration (WebChat)
  - H2 : Contenu associé

## web/workspaces.md

- Route : /web/workspaces
- Titres :
  - H2 : Activer les espaces de travail
  - H2 : Espace de travail par défaut
  - H2 : Widgets intégrés
  - H2 : Provenance
  - H2 : Widgets personnalisés
  - H2 : CLI
  - H2 : Stockage
