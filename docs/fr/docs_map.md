---
read_when: Finding which docs page covers a topic before reading the page
summary: Carte des titres générée pour les pages de documentation OpenClaw
title: Carte de la documentation
x-i18n:
    generated_at: "2026-07-01T08:01:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4432132487530461411880c0d073c223e02b550cb2deb874fae2f7cfe737888
    source_path: docs_map.md
    workflow: 16
---

# Carte de la documentation OpenClaw

Ce fichier est généré à partir des titres `docs/**/*.md` et `docs/**/*.mdx` pour aider les agents à naviguer dans l’arborescence de la documentation.
Ne le modifiez pas à la main ; exécutez `pnpm docs:map:gen`.

## agent-runtime-architecture.md

- Route : /agent-runtime-architecture
- Titres :
  - H2 : Agencement de l’environnement d’exécution
  - H2 : Limites
  - H2 : Manifestes
  - H2 : Sélection de l’environnement d’exécution
  - H2 : Articles connexes

## announcements/bluebubbles-imessage.md

- Route : /announcements/bluebubbles-imessage
- Titres :
  - H1 : Suppression de BlueBubbles et chemin iMessage imsg
  - H2 : Ce qui a changé
  - H2 : Que faire
  - H2 : Notes de migration
  - H2 : Voir aussi

## auth-credential-semantics.md

- Route : /auth-credential-semantics
- Titres :
  - H2 : Codes de motif de sonde stables
  - H2 : Identifiants par jeton
  - H3 : Règles d’éligibilité
  - H3 : Règles de résolution
  - H2 : Portabilité des copies d’agent
  - H2 : Routes d’authentification uniquement par configuration
  - H2 : Filtrage explicite de l’ordre d’authentification
  - H2 : Résolution de la cible de sonde
  - H2 : Découverte des identifiants CLI externes
  - H2 : Garde de politique OAuth SecretRef
  - H2 : Messagerie compatible avec l’héritage
  - H2 : Articles connexes

## automation/auth-monitoring.md

- Route : /automation/auth-monitoring
- Titres :
  - H2 : Articles connexes

## automation/clawflow.md

- Route : /automation/clawflow
- Titres :
  - H2 : Articles connexes

## automation/cron-jobs.md

- Route : /automation/cron-jobs
- Titres :
  - H2 : Démarrage rapide
  - H2 : Fonctionnement de Cron
  - H2 : Types de planification
  - H3 : Le jour du mois et le jour de la semaine utilisent une logique OU
  - H2 : Styles d’exécution
  - H3 : Charges utiles de commande
  - H3 : Options de charge utile pour les tâches isolées
  - H2 : Livraison et sortie
  - H2 : Langue de sortie
  - H2 : Exemples CLI
  - H2 : Webhooks
  - H3 : Authentification
  - H2 : Intégration Gmail PubSub
  - H3 : Configuration avec l’assistant (recommandé)
  - H3 : Démarrage automatique du Gateway
  - H3 : Configuration manuelle ponctuelle
  - H3 : Remplacement du modèle Gmail
  - H2 : Gestion des tâches
  - H2 : Configuration
  - H2 : Dépannage
  - H3 : Échelle de commandes
  - H2 : Articles connexes

## automation/cron-vs-heartbeat.md

- Route : /automation/cron-vs-heartbeat
- Titres :
  - H2 : Articles connexes

## automation/gmail-pubsub.md

- Route : /automation/gmail-pubsub
- Titres :
  - H2 : Articles connexes

## automation/hooks.md

- Route : /automation/hooks
- Titres :
  - H2 : Choisir la bonne surface
  - H2 : Démarrage rapide
  - H2 : Types d’événements
  - H2 : Écriture de hooks
  - H3 : Structure d’un hook
  - H3 : Format HOOK.md
  - H3 : Implémentation du gestionnaire
  - H3 : Points clés du contexte d’événement
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
  - H2 : Référence CLI
  - H2 : Bonnes pratiques
  - H2 : Dépannage
  - H3 : Hook non découvert
  - H3 : Hook non éligible
  - H3 : Hook non exécuté
  - H2 : Articles connexes

## automation/index.md

- Route : /automation
- Titres :
  - H2 : Guide de décision rapide
  - H3 : Tâches planifiées (Cron) ou Heartbeat
  - H2 : Concepts fondamentaux
  - H3 : Tâches planifiées (Cron)
  - H3 : Tâches
  - H3 : Engagements inférés
  - H3 : Flux de tâches
  - H3 : Ordres permanents
  - H3 : Hooks
  - H3 : Heartbeat
  - H2 : Comment ils fonctionnent ensemble
  - H2 : Articles connexes

## automation/poll.md

- Route : /automation/poll
- Titres :
  - H2 : Articles connexes

## automation/standing-orders.md

- Route : /automation/standing-orders
- Titres :
  - H2 : Pourquoi les ordres permanents
  - H2 : Fonctionnement
  - H2 : Anatomie d’un ordre permanent
  - H2 : Ordres permanents et tâches Cron
  - H2 : Exemples
  - H3 : Exemple 1 : contenu et réseaux sociaux (cycle hebdomadaire)
  - H3 : Exemple 2 : opérations financières (déclenchées par événement)
  - H3 : Exemple 3 : surveillance et alertes (continu)
  - H2 : Modèle exécuter-vérifier-rapporter
  - H2 : Architecture multiprogramme
  - H2 : Bonnes pratiques
  - H3 : À faire
  - H3 : À éviter
  - H2 : Articles connexes

## automation/taskflow.md

- Route : /automation/taskflow
- Titres :
  - H2 : Quand utiliser TaskFlow
  - H2 : Modèle fiable de flux de travail planifié
  - H2 : Modes de synchronisation
  - H3 : Mode géré
  - H3 : Mode miroir
  - H2 : État durable et suivi des révisions
  - H2 : Comportement d’annulation
  - H2 : Commandes CLI
  - H2 : Relation entre les flux et les tâches
  - H2 : Articles connexes

## automation/tasks.md

- Route : /automation/tasks
- Titres :
  - H2 : TL;DR
  - H2 : Démarrage rapide
  - H2 : Ce qui crée une tâche
  - H2 : Cycle de vie d’une tâche
  - H2 : Livraison et notifications
  - H3 : Politiques de notification
  - H2 : Référence CLI
  - H2 : Tableau des tâches dans le chat (/tasks)
  - H2 : Intégration de l’état (pression des tâches)
  - H2 : Stockage et maintenance
  - H3 : Où résident les tâches
  - H3 : Maintenance automatique
  - H2 : Relation des tâches avec les autres systèmes
  - H2 : Articles connexes

## automation/troubleshooting.md

- Route : /automation/troubleshooting
- Titres :
  - H2 : Articles connexes

## automation/webhook.md

- Route : /automation/webhook
- Titres :
  - H2 : Articles connexes

## brave-search.md

- Route : /brave-search
- Titres :
  - H2 : Articles connexes

## channels/access-groups.md

- Route : /channels/access-groups
- Titres :
  - H2 : Groupes statiques d’expéditeurs de messages
  - H2 : Groupes de référence issus de listes d’autorisation
  - H2 : Chemins de canaux de message pris en charge
  - H2 : Diagnostics de Plugin
  - H2 : Audiences des canaux Discord
  - H2 : Notes de sécurité
  - H2 : Dépannage

## channels/ambient-room-events.md

- Route : /channels/ambient-room-events
- Titres :
  - H2 : Configuration recommandée
  - H2 : Ce qui change
  - H2 : Exemple Discord
  - H2 : Exemple Slack
  - H2 : Exemple Telegram
  - H2 : Politique propre à l’agent
  - H2 : Modes de réponse visibles
  - H2 : Historique
  - H2 : Dépannage
  - H2 : Articles connexes

## channels/bot-loop-protection.md

- Route : /channels/bot-loop-protection
- Titres :
  - H1 : Protection contre les boucles de bot
  - H2 : Valeurs par défaut
  - H2 : Configurer les valeurs par défaut partagées
  - H2 : Remplacer par canal ou compte
  - H2 : Prise en charge des canaux

## channels/broadcast-groups.md

- Route : /channels/broadcast-groups
- Titres :
  - H2 : Vue d’ensemble
  - H2 : Cas d’utilisation
  - H2 : Configuration
  - H3 : Configuration de base
  - H3 : Stratégie de traitement
  - H3 : Exemple complet
  - H2 : Fonctionnement
  - H3 : Flux de messages
  - H3 : Isolation de session
  - H3 : Exemple : sessions isolées
  - H2 : Bonnes pratiques
  - H2 : Compatibilité
  - H3 : Fournisseurs
  - H3 : Routage
  - H2 : Dépannage
  - H2 : Exemples
  - H2 : Référence API
  - H3 : Schéma de configuration
  - H3 : Champs
  - H2 : Limitations
  - H2 : Améliorations futures
  - H2 : Articles connexes

## channels/channel-routing.md

- Route : /channels/channel-routing
- Titres :
  - H1 : Canaux et routage
  - H2 : Termes clés
  - H2 : Préfixes de cibles sortantes
  - H2 : Formes des clés de session (exemples)
  - H2 : Épinglage de la route DM principale
  - H2 : Enregistrement entrant protégé
  - H2 : Règles de routage (comment un agent est choisi)
  - H2 : Groupes de diffusion (exécuter plusieurs agents)
  - H2 : Vue d’ensemble de la configuration
  - H2 : Stockage des sessions
  - H2 : Comportement WebChat
  - H2 : Contexte de réponse
  - H2 : Articles connexes

## channels/clickclack.md

- Route : /channels/clickclack
- Titres :
  - H2 : Configuration rapide
  - H2 : Plusieurs bots
  - H2 : Cibles
  - H2 : Autorisations
  - H2 : Dépannage

## channels/discord.md

- Route : /channels/discord
- Titres :
  - H2 : Configuration rapide
  - H2 : Recommandé : configurer un espace de travail de guilde
  - H2 : Modèle d’exécution
  - H2 : Canaux de forum
  - H2 : Composants interactifs
  - H2 : Contrôle d’accès et routage
  - H3 : Routage d’agents basé sur les rôles
  - H2 : Commandes natives et autorisation des commandes
  - H2 : Détails des fonctionnalités
  - H2 : Outils et barrières d’action
  - H2 : Interface utilisateur Components v2
  - H2 : Voix
  - H3 : Canaux vocaux
  - H3 : Suivre les utilisateurs en vocal
  - H3 : Messages vocaux
  - H2 : Dépannage
  - H2 : Référence de configuration
  - H2 : Sécurité et opérations
  - H2 : Articles connexes

## channels/feishu.md

- Route : /channels/feishu
- Titres :
  - H2 : Démarrage rapide
  - H2 : Contrôle d’accès
  - H3 : Messages directs
  - H3 : Discussions de groupe
  - H2 : Exemples de configuration de groupe
  - H3 : Autoriser tous les groupes, aucune @mention requise
  - H3 : Autoriser tous les groupes, toujours exiger une @mention
  - H3 : Autoriser uniquement des groupes spécifiques
  - H3 : Restreindre les expéditeurs au sein d’un groupe
  - H2 : Obtenir les ID de groupe/utilisateur
  - H3 : ID de groupe (chatid, format : ocxxx)
  - H3 : ID utilisateur (openid, format : ouxxx)
  - H2 : Commandes courantes
  - H2 : Dépannage
  - H3 : Le bot ne répond pas dans les discussions de groupe
  - H3 : Le bot ne reçoit pas les messages
  - H3 : La configuration QR ne réagit pas dans l’application mobile Feishu
  - H3 : App Secret divulgué
  - H2 : Configuration avancée
  - H3 : Comptes multiples
  - H3 : Limites de messages
  - H3 : Streaming
  - H3 : Optimisation du quota
  - H3 : Sessions ACP
  - H4 : Liaison ACP persistante
  - H4 : Lancer ACP depuis le chat
  - H3 : Routage multi-agent
  - H2 : Isolation d’agent par utilisateur (création dynamique d’agent)
  - H3 : Configuration rapide
  - H3 : Fonctionnement
  - H3 : Options de configuration
  - H3 : Portée de session
  - H3 : Déploiement multi-utilisateur typique
  - H3 : Vérification
  - H3 : Notes
  - H2 : Référence de configuration
  - H2 : Types de messages pris en charge
  - H3 : Recevoir
  - H3 : Envoyer
  - H3 : Fils de discussion et réponses
  - H2 : Articles connexes

## channels/googlechat.md

- Route : /channels/googlechat
- Titres :
  - H2 : Installer
  - H2 : Configuration rapide (débutant)
  - H2 : Ajouter à Google Chat
  - H2 : URL publique (Webhook uniquement)
  - H3 : Option A : Tailscale Funnel (recommandé)
  - H3 : Option B : proxy inverse (Caddy)
  - H3 : Option C : Cloudflare Tunnel
  - H2 : Fonctionnement
  - H2 : Cibles
  - H2 : Points clés de la configuration
  - H2 : Dépannage
  - H3 : 405 Method Not Allowed
  - H3 : Autres problèmes
  - H2 : Articles connexes

## channels/group-messages.md

- Route : /channels/group-messages
- Titres :
  - H2 : Comportement
  - H2 : Exemple de configuration (WhatsApp)
  - H3 : Commande d’activation (propriétaire uniquement)
  - H2 : Mode d’utilisation
  - H2 : Test / vérification
  - H2 : Considérations connues
  - H2 : Articles connexes

## channels/groups.md

- Route : /channels/groups
- Titres :
  - H2 : Introduction débutant (2 minutes)
  - H2 : Réponses visibles
  - H2 : Visibilité du contexte et listes d’autorisation
  - H2 : Clés de session
  - H2 : Modèle : DM personnels + groupes publics (agent unique)
  - H2 : Libellés d’affichage
  - H2 : Politique de groupe
  - H2 : Verrouillage par mention (par défaut)
  - H2 : Définir la portée des modèles de mention configurés
  - H2 : Restrictions d’outils de groupe/canal (facultatif)
  - H2 : Listes d’autorisation de groupes
  - H2 : Activation (propriétaire uniquement)
  - H2 : Champs de contexte
  - H2 : Spécificités iMessage
  - H2 : Invites système WhatsApp
  - H2 : Spécificités WhatsApp
  - H2 : Articles connexes

## channels/imessage-from-bluebubbles.md

- Route : /channels/imessage-from-bluebubbles
- Titres :
  - H2 : Liste de contrôle de migration
  - H2 : Quand cette migration est pertinente
  - H2 : Ce que fait imsg
  - H2 : Avant de commencer
  - H2 : Traduction de configuration
  - H2 : Piège du registre de groupe
  - H2 : Étape par étape
  - H2 : Parité des actions en un coup d’œil
  - H2 : Appairage, sessions et liaisons ACP
  - H2 : Aucun canal de retour arrière
  - H2 : Articles connexes

## channels/imessage.md

- Route : /channels/imessage
- Titres :
  - H2 : Configuration rapide
  - H2 : Exigences et autorisations (macOS)
  - H2 : Activation de l’API privée imsg
  - H3 : Configuration
  - H3 : Lorsque vous ne pouvez pas désactiver SIP
  - H2 : Contrôle d’accès et routage
  - H2 : Liaisons de conversation ACP
  - H2 : Modèles de déploiement
  - H2 : Médias, découpage et cibles de livraison
  - H2 : Actions de l’API privée
  - H2 : Écritures de configuration
  - H2 : Fusion des DM envoyés séparément (commande + URL dans une seule composition)
  - H3 : Scénarios et ce que voit l’agent
  - H2 : Récupération entrante après le redémarrage d’un pont ou du Gateway
  - H3 : Signal visible par l’opérateur
  - H3 : Migration
  - H2 : Dépannage
  - H2 : Pointeurs de référence de configuration
  - H2 : Articles connexes

## channels/index.md

- Route : /channels
- Titres :
  - H2 : Notes de livraison
  - H2 : Canaux pris en charge
  - H2 : Notes

## channels/irc.md

- Route : /channels/irc
- Titres :
  - H2 : Démarrage rapide
  - H2 : Valeurs de sécurité par défaut
  - H2 : Contrôle d’accès
  - H3 : Piège courant : allowFrom concerne les DM, pas les canaux
  - H2 : Déclenchement des réponses (mentions)
  - H2 : Note de sécurité (recommandé pour les canaux publics)
  - H3 : Mêmes outils pour tout le monde dans le canal
  - H3 : Outils différents selon l’expéditeur (le propriétaire a plus de pouvoir)
  - H2 : NickServ
  - H2 : Variables d’environnement
  - H2 : Dépannage
  - H2 : Articles connexes

## channels/line.md

- Route : /channels/line
- Titres :
  - H2 : Installer
  - H2 : Configuration
  - H2 : Configurer
  - H2 : Contrôle d'accès
  - H2 : Comportement des messages
  - H2 : Données de canal (messages enrichis)
  - H2 : Prise en charge d'ACP
  - H2 : Médias sortants
  - H2 : Dépannage
  - H2 : Associé

## channels/location.md

- Route : /channels/location
- Titres :
  - H2 : Formatage du texte
  - H2 : Champs de contexte
  - H2 : Notes de canal
  - H2 : Associé

## channels/matrix-migration.md

- Route : /channels/matrix-migration
- Titres :
  - H2 : Ce que la migration fait automatiquement
  - H2 : Ce que la migration ne peut pas faire automatiquement
  - H2 : Flux de mise à niveau recommandé
  - H2 : Fonctionnement de la migration chiffrée
  - H2 : Messages courants et leur signification
  - H3 : Messages de mise à niveau et de détection
  - H3 : Messages de récupération d'état chiffré
  - H3 : Messages de récupération manuelle
  - H3 : Messages d'installation de Plugin personnalisé
  - H2 : Si l'historique chiffré ne revient toujours pas
  - H2 : Si vous voulez repartir de zéro pour les futurs messages
  - H2 : Associé

## channels/matrix-presentation.md

- Route : /channels/matrix-presentation
- Titres :
  - H2 : Contenu de l'événement
  - H2 : Comportement de secours
  - H2 : Blocs pris en charge
  - H2 : Interactions
  - H2 : Relation avec les métadonnées d'approbation
  - H2 : Messages multimédias

## channels/matrix-push-rules.md

- Route : /channels/matrix-push-rules
- Titres :
  - H2 : Prérequis
  - H2 : Étapes
  - H2 : Notes multi-bots
  - H2 : Notes du homeserver
  - H2 : Associé

## channels/matrix.md

- Route : /channels/matrix
- Titres :
  - H2 : Installer
  - H2 : Configuration
  - H3 : Configuration interactive
  - H3 : Configuration minimale
  - H3 : Auto-join
  - H3 : Formats de cibles allowlist
  - H3 : Normalisation de l'ID de compte
  - H3 : Identifiants mis en cache
  - H3 : Variables d'environnement
  - H2 : Exemple de configuration
  - H2 : Aperçus en streaming
  - H2 : Messages vocaux
  - H2 : Métadonnées d'approbation
  - H3 : Règles push auto-hébergées pour des aperçus finalisés silencieux
  - H2 : Salons bot à bot
  - H2 : Chiffrement et vérification
  - H3 : Activer le chiffrement
  - H3 : Signaux d'état et de confiance
  - H3 : Vérifier cet appareil avec une clé de récupération
  - H3 : Amorcer ou réparer la signature croisée
  - H3 : Sauvegarde des clés de salon
  - H3 : Lister, demander et répondre aux vérifications
  - H3 : Notes multi-comptes
  - H2 : Gestion du profil
  - H2 : Fils
  - H3 : Routage de session (sessionScope)
  - H3 : Réponses en fil (threadReplies)
  - H3 : Héritage des fils et commandes slash
  - H2 : Liaisons de conversation ACP
  - H3 : Configuration de liaison de fil
  - H2 : Réactions
  - H2 : Contexte d'historique
  - H2 : Visibilité du contexte
  - H2 : Politique de DM et de salon
  - H2 : Réparation de salon direct
  - H2 : Approbations exec
  - H2 : Commandes slash
  - H2 : Multi-compte
  - H2 : Homeservers privés/LAN
  - H2 : Proxy du trafic Matrix
  - H2 : Résolution des cibles
  - H2 : Référence de configuration
  - H3 : Compte et connexion
  - H3 : Chiffrement
  - H3 : Accès et politique
  - H3 : Comportement des réponses
  - H3 : Paramètres de réaction
  - H3 : Outillage et remplacements par salon
  - H3 : Paramètres d'approbation exec
  - H2 : Associé

## channels/mattermost.md

- Route : /channels/mattermost
- Titres :
  - H2 : Installer
  - H2 : Configuration rapide
  - H2 : Commandes slash natives
  - H2 : Variables d'environnement (compte par défaut)
  - H2 : Modes de discussion
  - H2 : Fils et sessions
  - H2 : Contrôle d'accès (DM)
  - H2 : Canaux (groupes)
  - H2 : Cibles pour livraison sortante
  - H2 : Nouvelle tentative de canal DM
  - H2 : Streaming d'aperçus
  - H2 : Réactions (outil de message)
  - H2 : Boutons interactifs (outil de message)
  - H3 : Intégration API directe (scripts externes)
  - H2 : Adaptateur d'annuaire
  - H2 : Multi-compte
  - H2 : Dépannage
  - H2 : Associé

## channels/msteams.md

- Route : /channels/msteams
- Titres :
  - H2 : Plugin groupé
  - H2 : Configuration rapide
  - H2 : Objectifs
  - H2 : Écritures de configuration
  - H2 : Contrôle d'accès (DM + groupes)
  - H3 : Fonctionnement
  - H3 : Étape 1 : Créer un Azure Bot
  - H3 : Étape 2 : Obtenir les identifiants
  - H3 : Étape 3 : Configurer le point de terminaison de messagerie
  - H3 : Étape 4 : Activer le canal Teams
  - H3 : Étape 5 : Créer le manifeste de l'application Teams
  - H3 : Étape 6 : Configurer OpenClaw
  - H3 : Étape 7 : Exécuter le Gateway
  - H2 : Authentification fédérée (certificat plus identité managée)
  - H3 : Option A : Authentification basée sur certificat
  - H3 : Option B : Azure Managed Identity
  - H3 : Configuration d'AKS Workload Identity
  - H3 : Comparaison des types d'authentification
  - H2 : Développement local (tunneling)
  - H2 : Tester le bot
  - H2 : Variables d'environnement
  - H2 : Action d'informations sur les membres
  - H2 : Contexte d'historique
  - H2 : Autorisations RSC Teams actuelles (manifeste)
  - H2 : Exemple de manifeste Teams (expurgé)
  - H3 : Réserves sur le manifeste (champs obligatoires)
  - H3 : Mettre à jour une application existante
  - H2 : Capacités : RSC uniquement vs Graph
  - H3 : Avec Teams RSC uniquement (application installée, aucune autorisation Graph API)
  - H3 : Avec Teams RSC + autorisations d'application Microsoft Graph
  - H3 : RSC vs Graph API
  - H2 : Médias + historique activés par Graph (requis pour les canaux)
  - H2 : Limitations connues
  - H3 : Délais d'expiration des Webhook
  - H3 : Prise en charge du cloud Teams et de l'URL de service
  - H3 : Formatage
  - H2 : Configuration
  - H2 : Routage et sessions
  - H2 : Style de réponse : fils vs publications
  - H3 : Priorité de résolution
  - H3 : Préservation du contexte de fil
  - H2 : Pièces jointes et images
  - H2 : Envoyer des fichiers dans les discussions de groupe
  - H3 : Pourquoi les discussions de groupe ont besoin de SharePoint
  - H3 : Configuration
  - H3 : Comportement de partage
  - H3 : Comportement de secours
  - H3 : Emplacement de stockage des fichiers
  - H2 : Sondages (Adaptive Cards)
  - H2 : Cartes de présentation
  - H2 : Formats de cibles
  - H2 : Messagerie proactive
  - H2 : ID d'équipe et de canal (piège courant)
  - H2 : Canaux privés
  - H2 : Dépannage
  - H3 : Problèmes courants
  - H3 : Erreurs de téléversement de manifeste
  - H3 : Les autorisations RSC ne fonctionnent pas
  - H2 : Références
  - H2 : Associé

## channels/nextcloud-talk.md

- Route : /channels/nextcloud-talk
- Titres :
  - H2 : Plugin groupé
  - H2 : Configuration rapide (débutant)
  - H2 : Notes
  - H2 : Contrôle d'accès (DM)
  - H2 : Salles (groupes)
  - H2 : Capacités
  - H2 : Référence de configuration (Nextcloud Talk)
  - H2 : Associé

## channels/nostr.md

- Route : /channels/nostr
- Titres :
  - H2 : Plugin groupé
  - H3 : Installations anciennes/personnalisées
  - H3 : Configuration non interactive
  - H2 : Configuration rapide
  - H2 : Référence de configuration
  - H2 : Métadonnées de profil
  - H2 : Contrôle d'accès
  - H3 : Politiques de DM
  - H3 : Exemple d'allowlist
  - H2 : Formats de clés
  - H2 : Relais
  - H2 : Prise en charge du protocole
  - H2 : Tests
  - H3 : Relais local
  - H3 : Test manuel
  - H2 : Dépannage
  - H3 : Messages non reçus
  - H3 : Réponses non envoyées
  - H3 : Réponses en double
  - H2 : Sécurité
  - H2 : Limitations (MVP)
  - H2 : Associé

## channels/pairing.md

- Route : /channels/pairing
- Titres :
  - H2 : 1) Jumelage DM (accès à la discussion entrante)
  - H3 : Approuver un expéditeur
  - H3 : Groupes d'expéditeurs réutilisables
  - H3 : Où se trouve l'état
  - H2 : 2) Jumelage d'appareil Node (nœuds iOS/Android/macOS/sans interface)
  - H3 : Jumeler via Telegram (recommandé pour iOS)
  - H3 : Approuver un appareil Node
  - H3 : Approbation automatique facultative de nœuds par CIDR de confiance
  - H3 : Stockage de l'état de jumelage Node
  - H3 : Notes
  - H2 : Documents associés

## channels/qa-channel.md

- Route : /channels/qa-channel
- Titres :
  - H2 : Ce qu'il fait
  - H2 : Configuration
  - H2 : Exécuteurs
  - H2 : Associé

## channels/qqbot.md

- Route : /channels/qqbot
- Titres :
  - H2 : Installer
  - H2 : Configuration
  - H2 : Configurer
  - H3 : Configuration multi-comptes
  - H3 : Discussions de groupe
  - H3 : Voix (STT / TTS)
  - H2 : Formats de cibles
  - H2 : Commandes slash
  - H2 : Architecture du moteur
  - H2 : Intégration par code QR
  - H2 : Dépannage
  - H2 : Associé

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
  - H2 : Ce que c'est
  - H2 : Écritures de configuration
  - H2 : Le modèle de numéro (important)
  - H2 : Chemin de configuration A : lier un compte Signal existant (QR)
  - H2 : Chemin de configuration B : enregistrer un numéro de bot dédié (SMS, Linux)
  - H2 : Mode démon externe (httpUrl)
  - H2 : Mode conteneur (bbernhard/signal-cli-rest-api)
  - H2 : Contrôle d'accès (DM + groupes)
  - H2 : Fonctionnement (comportement)
  - H2 : Médias + limites
  - H2 : Saisie + accusés de lecture
  - H2 : Réactions (outil de message)
  - H2 : Réactions d'approbation
  - H2 : Cibles de livraison (CLI/cron)
  - H2 : Dépannage
  - H2 : Notes de sécurité
  - H2 : Référence de configuration (Signal)
  - H2 : Associé

## channels/slack.md

- Route : /channels/slack
- Titres :
  - H2 : Choisir Socket Mode ou les URL de requêtes HTTP
  - H3 : Mode relais
  - H2 : Installer
  - H2 : Configuration rapide
  - H2 : Réglage du transport Socket Mode
  - H2 : Liste de contrôle du manifeste et des portées
  - H3 : Paramètres de manifeste supplémentaires
  - H2 : Modèle de jeton
  - H2 : Actions et garde-fous
  - H2 : Contrôle d'accès et routage
  - H2 : Fils, sessions et étiquettes de réponse
  - H2 : Réactions d'accusé de réception
  - H3 : Emoji (ackReaction)
  - H3 : Portée (messages.ackReactionScope)
  - H2 : Streaming de texte
  - H2 : Secours par réaction de saisie
  - H2 : Médias, segmentation et livraison
  - H2 : Commandes et comportement slash
  - H2 : Réponses interactives
  - H3 : Soumissions modales détenues par le Plugin
  - H2 : Approbations natives dans Slack
  - H2 : Événements et comportement opérationnel
  - H2 : Référence de configuration
  - H2 : Dépannage
  - H2 : Référence de vision des pièces jointes
  - H3 : Types de médias pris en charge
  - H3 : Pipeline entrant
  - H3 : Héritage des pièces jointes de la racine du fil
  - H3 : Gestion de plusieurs pièces jointes
  - H3 : Limites de taille, de téléchargement et de modèle
  - H3 : Limites connues
  - H3 : Documentation associée
  - H2 : Associé

## channels/sms.md

- Route : /channels/sms
- Titres :
  - H2 : Avant de commencer
  - H2 : Configuration rapide
  - H2 : Exemples de configuration
  - H3 : Fichier de configuration
  - H3 : Variables d'environnement
  - H3 : Jeton d'authentification SecretRef
  - H3 : Numéro privé avec allowlist uniquement
  - H3 : Expéditeur du service de messagerie
  - H3 : Cible sortante par défaut
  - H2 : Contrôle d'accès
  - H2 : Envoyer des SMS
  - H2 : Vérifier la configuration
  - H3 : Test de bout en bout depuis macOS iMessage/SMS
  - H2 : Sécurité du Webhook
  - H2 : Configuration multi-comptes
  - H2 : Dépannage
  - H3 : Twilio renvoie 403 ou OpenClaw rejette le Webhook
  - H3 : Aucune demande de jumelage n'apparaît
  - H3 : Les envois sortants échouent
  - H3 : Les messages arrivent, mais l'agent ne répond pas

## channels/synology-chat.md

- Route : /channels/synology-chat
- Titres :
  - H2 : Plugin groupé
  - H2 : Configuration rapide
  - H2 : Variables d'environnement
  - H2 : Politique DM et contrôle d'accès
  - H2 : Livraison sortante
  - H2 : Multi-compte
  - H2 : Notes de sécurité
  - H2 : Dépannage
  - H2 : Associé

## channels/telegram.md

- Route : /channels/telegram
- Titres :
  - H2 : Configuration rapide
  - H2 : Paramètres côté Telegram
  - H2 : Contrôle d'accès et activation
  - H3 : Identité de bot de groupe
  - H2 : Comportement à l'exécution
  - H2 : Référence des fonctionnalités
  - H2 : Contrôles des réponses d'erreur
  - H2 : Dépannage
  - H2 : Référence de configuration
  - H2 : Associé

## channels/tlon.md

- Route : /channels/tlon
- Titres :
  - H2 : Plugin groupé
  - H2 : Configuration
  - H2 : Vaisseaux privés/LAN
  - H2 : Canaux de groupe
  - H2 : Contrôle d'accès
  - H2 : Propriétaire et système d'approbation
  - H2 : Paramètres d'acceptation automatique
  - H2 : Cibles de livraison (CLI/cron)
  - H2 : Skill groupée
  - H2 : Capacités
  - H2 : Dépannage
  - H2 : Référence de configuration
  - H2 : Notes
  - H2 : Associé

## channels/troubleshooting.md

- Route : /channels/troubleshooting
- Titres :
  - H2 : Échelle de commandes
  - H2 : Après une mise à jour
  - H2 : WhatsApp
  - H3 : Signatures d'échec WhatsApp
  - H2 : Telegram
  - H3 : Signatures d'échec Telegram
  - H2 : Discord
  - H3 : Signatures d'échec Discord
  - H2 : Slack
  - H3 : Signatures d'échec Slack
  - H2 : iMessage
  - H3 : Signatures d'échec iMessage
  - H2 : Signal
  - H3 : Signatures d'échec Signal
  - H2 : QQ Bot
  - H3 : Signatures d'échec QQ Bot
  - H2 : Matrix
  - H3 : Signatures d'échec Matrix
  - H2 : Associé

## channels/twitch.md

- Route : /channels/twitch
- Titres :
  - H2 : Plugin intégré
  - H2 : Configuration rapide (débutant)
  - H2 : Qu’est-ce que c’est
  - H2 : Configuration (détaillée)
  - H3 : Générer les identifiants
  - H3 : Configurer le bot
  - H3 : Contrôle d’accès (recommandé)
  - H2 : Actualisation du jeton (facultatif)
  - H2 : Prise en charge de plusieurs comptes
  - H2 : Contrôle d’accès
  - H2 : Dépannage
  - H2 : Configuration
  - H3 : Configuration du compte
  - H3 : Options du fournisseur
  - H2 : Actions d’outil
  - H2 : Sécurité et opérations
  - H2 : Limites
  - H2 : Connexe

## channels/wechat.md

- Route : /channels/wechat
- Titres :
  - H2 : Nommage
  - H2 : Fonctionnement
  - H2 : Installer
  - H2 : Connexion
  - H2 : Contrôle d’accès
  - H2 : Compatibilité
  - H2 : Processus sidecar
  - H2 : Dépannage
  - H2 : Documents connexes

## channels/whatsapp.md

- Route : /channels/whatsapp
- Titres :
  - H2 : Installation (à la demande)
  - H2 : Configuration rapide
  - H2 : Modèles de déploiement
  - H2 : Modèle d’exécution
  - H2 : Invites d’approbation
  - H2 : Hooks de Plugin et confidentialité
  - H2 : Contrôle d’accès et activation
  - H2 : Liaisons ACP configurées
  - H2 : Comportement des numéros personnels et des conversations avec soi-même
  - H2 : Normalisation des messages et contexte
  - H2 : Livraison, découpage et médias
  - H2 : Citation des réponses
  - H2 : Niveau de réaction
  - H2 : Réactions d’accusé de réception
  - H2 : Réactions d’état du cycle de vie
  - H2 : Multi-compte et identifiants
  - H2 : Outils, actions et écritures de configuration
  - H2 : Dépannage
  - H2 : Prompts système
  - H2 : Pointeurs de référence de configuration
  - H2 : Connexe

## channels/yuanbao.md

- Route : /channels/yuanbao
- Titres :
  - H2 : Démarrage rapide
  - H3 : Configuration interactive (alternative)
  - H2 : Contrôle d’accès
  - H3 : Messages directs
  - H3 : Conversations de groupe
  - H2 : Exemples de configuration
  - H3 : Configuration de base avec politique de DM ouverte
  - H3 : Restreindre les DM à des utilisateurs spécifiques
  - H3 : Désactiver l’exigence de @mention dans les groupes
  - H3 : Optimiser la livraison des messages sortants
  - H3 : Ajuster la stratégie de fusion de texte
  - H2 : Commandes courantes
  - H2 : Dépannage
  - H3 : Le bot ne répond pas dans les conversations de groupe
  - H3 : Le bot ne reçoit pas les messages
  - H3 : Le bot envoie des réponses vides ou de repli
  - H3 : App Secret divulgué
  - H2 : Configuration avancée
  - H3 : Comptes multiples
  - H3 : Limites de messages
  - H3 : Streaming
  - H3 : Contexte de l’historique des conversations de groupe
  - H3 : Mode réponse à
  - H3 : Injection d’indice Markdown
  - H3 : Mode débogage
  - H3 : Routage multi-agent
  - H2 : Référence de configuration
  - H2 : Types de messages pris en charge
  - H3 : Recevoir
  - H3 : Envoyer
  - H3 : Fils et réponses
  - H2 : Connexe

## channels/zalo.md

- Route : /channels/zalo
- Titres :
  - H2 : Plugin intégré
  - H2 : Configuration rapide (débutant)
  - H2 : Qu’est-ce que c’est
  - H2 : Configuration (chemin rapide)
  - H3 : 1) Créer un jeton de bot (Zalo Bot Platform)
  - H3 : 2) Configurer le jeton (env ou configuration)
  - H2 : Fonctionnement (comportement)
  - H2 : Limites
  - H2 : Contrôle d’accès (DM)
  - H3 : Accès aux DM
  - H2 : Contrôle d’accès (groupes)
  - H2 : Long-polling vs Webhook
  - H2 : Types de messages pris en charge
  - H2 : Capacités
  - H2 : Cibles de livraison (CLI/Cron)
  - H2 : Dépannage
  - H2 : Référence de configuration (Zalo)
  - H2 : Connexe

## channels/zaloclawbot.md

- Route : /channels/zaloclawbot
- Titres :
  - H2 : Compatibilité
  - H2 : Prérequis
  - H2 : Installer avec onboard (recommandé)
  - H2 : Installation manuelle
  - H3 : 1. Installer le Plugin
  - H3 : 2. Activer le Plugin dans la configuration
  - H3 : 3. Générer le code QR et se connecter
  - H3 : 4. Redémarrer le Gateway
  - H2 : Fonctionnement
  - H2 : Sous le capot
  - H2 : Dépannage

## channels/zalouser.md

- Route : /channels/zalouser
- Titres :
  - H2 : Plugin intégré
  - H2 : Configuration rapide (débutant)
  - H2 : Qu’est-ce que c’est
  - H2 : Nommage
  - H2 : Recherche d’ID (annuaire)
  - H2 : Limites
  - H2 : Contrôle d’accès (DM)
  - H2 : Accès aux groupes (facultatif)
  - H3 : Contrôle par mention de groupe
  - H2 : Multi-compte
  - H2 : Variables d’environnement
  - H2 : Saisie, réactions et accusés de livraison
  - H2 : Dépannage
  - H2 : Connexe

## ci.md

- Route : /ci
- Titres :
  - H2 : Vue d’ensemble du pipeline
  - H2 : Ordre d’échec rapide
  - H2 : Contexte de PR et preuves
  - H2 : Périmètre et routage
  - H2 : Transfert de l’activité ClawSweeper
  - H2 : Déclenchements manuels
  - H2 : Runners
  - H2 : Budget d’enregistrement des runners
  - H2 : Équivalents locaux
  - H2 : Performance OpenClaw
  - H2 : Validation complète de version
  - H2 : Shards live et E2E
  - H2 : Acceptation des paquets
  - H3 : Jobs
  - H3 : Sources candidates
  - H3 : Profils de suite
  - H3 : Fenêtres de compatibilité héritées
  - H3 : Exemples
  - H2 : Smoke d’installation
  - H2 : E2E Docker local
  - H3 : Paramètres réglables
  - H3 : Workflow live/E2E réutilisable
  - H3 : Morceaux du chemin de publication
  - H2 : Préversion de Plugin
  - H2 : QA Lab
  - H2 : CodeQL
  - H3 : Catégories de sécurité
  - H3 : Shards de sécurité propres à la plateforme
  - H3 : Catégories de qualité critique
  - H2 : Workflows de maintenance
  - H3 : Agent de documentation
  - H3 : Agent de performance des tests
  - H3 : PR dupliquées après fusion
  - H2 : Portes de vérification locales et routage des changements
  - H2 : Validation Testbox
  - H2 : Connexe

## clawhub/cli.md

- Route : /clawhub/cli
- Titres :
  - H1 : CLI ClawHub
  - H2 : Découvrir et installer
  - H2 : Publier et maintenir
  - H2 : Connexe

## clawhub/publishing.md

- Route : /clawhub/publishing
- Titres :
  - H1 : Publication sur ClawHub
  - H2 : Propriétaires
  - H2 : Skills
  - H2 : Plugins
  - H2 : Flux de publication
  - H2 : FAQ
  - H3 : La portée du paquet doit correspondre au propriétaire sélectionné

## cli/acp.md

- Route : /cli/acp
- Titres :
  - H2 : Ce que ce n’est pas
  - H2 : Matrice de compatibilité
  - H2 : Limitations connues
  - H2 : Utilisation
  - H2 : Client ACP (débogage)
  - H2 : Test smoke du protocole
  - H2 : Comment l’utiliser
  - H2 : Sélectionner des agents
  - H2 : Utiliser depuis acpx (Codex, Claude, autres clients ACP)
  - H2 : Configuration de l’éditeur Zed
  - H2 : Mappage des sessions
  - H2 : Options
  - H3 : Options du client acp
  - H2 : Connexe

## cli/agent.md

- Route : /cli/agent
- Titres :
  - H1 : openclaw agent
  - H2 : Options
  - H2 : Exemples
  - H2 : Notes
  - H2 : État de livraison JSON
  - H2 : Connexe

## cli/agents.md

- Route : /cli/agents
- Titres :
  - H1 : openclaw agents
  - H2 : Exemples
  - H2 : Liaisons de routage
  - H3 : Format --bind
  - H3 : Comportement de portée des liaisons
  - H2 : Surface de commande
  - H3 : agents
  - H3 : agents list
  - H3 : agents add [name]
  - H3 : agents bindings
  - H3 : agents bind
  - H3 : agents unbind
  - H3 : agents delete
  - H2 : Fichiers d’identité
  - H2 : Définir l’identité
  - H2 : Connexe

## cli/approvals.md

- Route : /cli/approvals
- Titres :
  - H1 : openclaw approvals
  - H2 : openclaw exec-policy
  - H2 : Commandes courantes
  - H2 : Remplacer les approbations depuis un fichier
  - H2 : Exemple « Ne jamais demander » / YOLO
  - H2 : Assistants de liste d’autorisation
  - H2 : Options courantes
  - H2 : Notes
  - H2 : Connexe

## cli/backup.md

- Route : /cli/backup
- Titres :
  - H1 : openclaw backup
  - H2 : Notes
  - H2 : Ce qui est sauvegardé
  - H2 : Comportement en cas de configuration invalide
  - H2 : Taille et performances
  - H2 : Connexe

## cli/browser.md

- Route : /cli/browser
- Titres :
  - H1 : openclaw browser
  - H2 : Indicateurs courants
  - H2 : Démarrage rapide (local)
  - H2 : Dépannage rapide
  - H2 : Cycle de vie
  - H2 : Si la commande est absente
  - H2 : Profils
  - H2 : Onglets
  - H2 : Snapshot / capture d’écran / actions
  - H2 : État et stockage
  - H2 : Débogage
  - H2 : Chrome existant via MCP
  - H2 : Contrôle de navigateur distant (proxy d’hôte Node)
  - H2 : Connexe

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
  - H2 : Résoudre les noms en ID
  - H2 : Connexe

## cli/clawbot.md

- Route : /cli/clawbot
- Titres :
  - H1 : openclaw clawbot
  - H2 : Migration
  - H2 : Connexe

## cli/commitments.md

- Route : /cli/commitments
- Titres :
  - H2 : Utilisation
  - H2 : Options
  - H2 : Exemples
  - H2 : Sortie
  - H2 : Connexe

## cli/completion.md

- Route : /cli/completion
- Titres :
  - H1 : openclaw completion
  - H2 : Utilisation
  - H2 : Options
  - H2 : Notes
  - H2 : Connexe

## cli/config.md

- Route : /cli/config
- Titres :
  - H2 : Options racine
  - H2 : Exemples
  - H3 : schéma de configuration
  - H3 : Chemins
  - H2 : Valeurs
  - H2 : modes de config set
  - H2 : config patch
  - H2 : Indicateurs du générateur de fournisseur
  - H2 : Essai à blanc
  - H3 : Forme de la sortie JSON
  - H2 : Sécurité d’écriture
  - H2 : Sous-commandes
  - H2 : Valider
  - H2 : Connexe

## cli/configure.md

- Route : /cli/configure
- Titres :
  - H1 : openclaw configure
  - H2 : Options
  - H2 : Exemples
  - H2 : Connexe

## cli/crestodian.md

- Route : /cli/crestodian
- Titres :
  - H1 : openclaw crestodian
  - H2 : Ce qu’affiche Crestodian
  - H2 : Exemples
  - H2 : Démarrage sécurisé
  - H2 : Opérations et approbation
  - H2 : Amorçage de configuration
  - H2 : Planificateur assisté par modèle
  - H2 : Passage à un agent
  - H2 : Mode de récupération des messages
  - H2 : Connexe

## cli/cron.md

- Route : /cli/cron
- Titres :
  - H1 : openclaw cron
  - H2 : Créer rapidement des jobs
  - H2 : Sessions
  - H2 : Livraison
  - H3 : Propriété de la livraison
  - H3 : Livraison des échecs
  - H2 : Planification
  - H3 : Jobs ponctuels
  - H3 : Jobs récurrents
  - H3 : Exécutions manuelles
  - H2 : Modèles
  - H3 : Priorité du modèle cron isolé
  - H3 : Mode rapide
  - H3 : Nouvelles tentatives de changement de modèle live
  - H2 : Sortie d’exécution et refus
  - H3 : Suppression des accusés obsolètes
  - H3 : Suppression silencieuse des jetons
  - H3 : Refus structurés
  - H2 : Rétention
  - H2 : Migration d’anciens jobs
  - H2 : Modifications courantes
  - H2 : Commandes d’administration courantes
  - H2 : Connexe

## cli/daemon.md

- Route : /cli/daemon
- Titres :
  - H1 : openclaw daemon
  - H2 : Utilisation
  - H2 : Sous-commandes
  - H2 : Options courantes
  - H2 : Préférer
  - H2 : Connexe

## cli/dashboard.md

- Route : /cli/dashboard
- Titres :
  - H1 : openclaw dashboard
  - H2 : Connexe

## cli/devices.md

- Route : /cli/devices
- Titres :
  - H1 : openclaw devices
  - H2 : Commandes
  - H3 : openclaw devices list
  - H3 : openclaw devices remove
  - H3 : openclaw devices clear --yes [--pending]
  - H3 : openclaw devices approve [requestId] [--latest]
  - H2 : Approbation de première exécution Paperclip / openclawgateway
  - H3 : openclaw devices reject
  - H3 : openclaw devices rotate --device --role [--scope ]
  - H3 : openclaw devices revoke --device --role
  - H2 : Options courantes
  - H2 : Notes
  - H2 : Liste de contrôle de récupération après dérive du jeton
  - H2 : Connexe

## cli/directory.md

- Route : /cli/directory
- Titres :
  - H1 : openclaw directory
  - H2 : Indicateurs courants
  - H2 : Notes
  - H2 : Utiliser les résultats avec l’envoi de messages
  - H2 : Formats d’ID (par canal)
  - H2 : Soi-même (« me »)
  - H2 : Pairs (contacts/utilisateurs)
  - H2 : Groupes
  - H2 : Connexe

## cli/dns.md

- Route : /cli/dns
- Titres :
  - H1 : openclaw dns
  - H2 : Configuration
  - H2 : dns setup
  - H2 : Connexe

## cli/docs.md

- Route : /cli/docs
- Titres :
  - H1 : openclaw docs
  - H2 : Utilisation
  - H2 : Exemples
  - H2 : Fonctionnement
  - H2 : Sortie
  - H2 : Codes de sortie
  - H2 : Connexe

## cli/doctor.md

- Route : /cli/doctor
- Titres :
  - H1 : openclaw doctor
  - H2 : Pourquoi l’utiliser
  - H2 : Exemples
  - H2 : Options
  - H2 : Mode lint
  - H2 : Contrôles d’intégrité structurés
  - H2 : Sélection des contrôles
  - H2 : Mode post-mise à niveau
  - H2 : macOS : remplacements d’env launchctl
  - H2 : Connexe

## cli/flows.md

- Route : /cli/flows
- Titres :
  - H1 : openclaw tasks flow
  - H2 : Sous-commandes
  - H3 : Valeurs de filtre d’état
  - H2 : Exemples
  - H2 : Connexe

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
  - H4 : Distant via SSH (parité avec l’app Mac)
  - H3 : gateway call
  - H2 : Gérer le service Gateway
  - H3 : Installer avec un wrapper
  - H2 : Découvrir les gateways (Bonjour)
  - H3 : gateway discover
  - H2 : Connexe

## cli/health.md

- Route : /cli/health
- Titres :
  - H1 : openclaw health
  - H2 : Options
  - H2 : Connexe

## cli/hooks.md

- Route : /cli/hooks
- Titres :
  - H1 : openclaw hooks
  - H2 : Lister tous les hooks
  - H2 : Obtenir les informations d’un hook
  - H2 : Vérifier l’éligibilité des hooks
  - H2 : Activer un hook
  - H2 : Désactiver un hook
  - H2 : Notes
  - H2 : Installer des packs de hooks
  - H2 : Mettre à jour des packs de hooks
  - H2 : Hooks intégrés
  - H3 : session-memory
  - H3 : bootstrap-extra-files
  - H3 : command-logger
  - H3 : boot-md
  - H2 : Associé

## cli/index.md

- Route : /cli
- Titres :
  - H2 : Pages de commandes
  - H2 : Indicateurs globaux
  - H2 : Modes de sortie
  - H2 : Arborescence des commandes
  - H2 : Commandes slash de chat
  - H2 : Suivi de l’utilisation
  - H2 : Associé

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
  - H2 : Associé

## cli/logs.md

- Route : /cli/logs
- Titres :
  - H1 : openclaw logs
  - H2 : Options
  - H2 : Options RPC Gateway partagées
  - H2 : Exemples
  - H2 : Notes
  - H2 : Associé

## cli/mcp.md

- Route : /cli/mcp
- Titres :
  - H2 : Choisir le bon chemin MCP
  - H2 : OpenClaw comme serveur MCP
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
  - H2 : OpenClaw comme registre de clients MCP
  - H3 : Définitions de serveurs MCP enregistrées
  - H3 : Recettes de serveurs courantes
  - H3 : Formes de sortie JSON
  - H3 : Transport stdio
  - H3 : Transport SSE / HTTP
  - H3 : Flux de travail OAuth
  - H3 : Transport HTTP streamable
  - H2 : Interface de contrôle
  - H2 : Limites actuelles
  - H2 : Associé

## cli/memory.md

- Route : /cli/memory
- Titres :
  - H1 : openclaw memory
  - H2 : Exemples
  - H2 : Options
  - H2 : Dreaming
  - H2 : Associé

## cli/message.md

- Route : /cli/message
- Titres :
  - H1 : openclaw message
  - H2 : Utilisation
  - H2 : Indicateurs courants
  - H2 : Comportement de SecretRef
  - H2 : Actions
  - H3 : Cœur
  - H3 : Threads
  - H3 : Emojis
  - H3 : Stickers
  - H3 : Rôles / Canaux / Membres / Voix
  - H3 : Événements
  - H3 : Modération (Discord)
  - H3 : Diffusion
  - H2 : Exemples
  - H2 : Associé

## cli/migrate.md

- Route : /cli/migrate
- Titres :
  - H1 : openclaw migrate
  - H2 : Commandes
  - H2 : Modèle de sécurité
  - H2 : Fournisseur Claude
  - H3 : Ce que Claude importe
  - H3 : État d’archive et de révision manuelle
  - H2 : Fournisseur Codex
  - H3 : Ce que Codex importe
  - H3 : État Codex en révision manuelle
  - H2 : Fournisseur Hermes
  - H3 : Ce que Hermes importe
  - H3 : Clés .env prises en charge
  - H3 : État archive uniquement
  - H3 : Après application
  - H2 : Contrat de Plugin
  - H2 : Intégration de l’onboarding
  - H2 : Associé

## cli/models.md

- Route : /cli/models
- Titres :
  - H1 : openclaw models
  - H2 : Commandes courantes
  - H3 : Analyse des modèles
  - H3 : État des modèles
  - H2 : Alias + fallbacks
  - H2 : Profils d’authentification
  - H2 : Associé

## cli/node.md

- Route : /cli/node
- Titres :
  - H1 : openclaw node
  - H2 : Pourquoi utiliser un hôte de nœud ?
  - H2 : Proxy de navigateur (zéro configuration)
  - H2 : Exécuter (premier plan)
  - H2 : Authentification Gateway pour l’hôte de nœud
  - H2 : Service (arrière-plan)
  - H2 : Appairage
  - H2 : Approbations d’exécution
  - H2 : Associé

## cli/nodes.md

- Route : /cli/nodes
- Titres :
  - H1 : openclaw nodes
  - H2 : Commandes courantes
  - H2 : Invoquer
  - H2 : Associé

## cli/onboard.md

- Route : /cli/onboard
- Titres :
  - H1 : openclaw onboard
  - H2 : Guides associés
  - H2 : Exemples
  - H2 : Paramètres régionaux
  - H3 : Choix de point de terminaison Z.AI non interactifs
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
  - H2 : Associé

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
  - H2 : Associé

## cli/plugins.md

- Route : /cli/plugins
- Titres :
  - H2 : Commandes
  - H3 : Auteur
  - H3 : Échafaudage de fournisseur
  - H3 : Installer
  - H4 : Raccourci de marketplace
  - H3 : Lister
  - H3 : Index de Plugin
  - H3 : Désinstaller
  - H3 : Mettre à jour
  - H3 : Inspecter
  - H3 : Doctor
  - H3 : Registre
  - H3 : Marketplace
  - H2 : Associé

## cli/policy.md

- Route : /cli/policy
- Titres :
  - H1 : openclaw policy
  - H2 : Démarrage rapide
  - H3 : Référence des règles de politique
  - H4 : Superpositions de portée
  - H4 : Canaux
  - H4 : Serveurs MCP
  - H4 : Fournisseurs de modèles
  - H4 : Réseau
  - H4 : Accès entrant et accès aux canaux
  - H4 : Gateway
  - H4 : Espace de travail de l’agent
  - H4 : Posture du bac à sable
  - H4 : Gestion des données
  - H4 : Secrets
  - H4 : Approbations d’exécution
  - H4 : Profils d’authentification
  - H4 : Métadonnées des outils
  - H4 : Posture des outils
  - H2 : Configurer la politique
  - H2 : Accepter l’état de la politique
  - H2 : Findings
  - H2 : Réparer
  - H2 : Codes de sortie
  - H2 : Associé

## cli/proxy.md

- Route : /cli/proxy
- Titres :
  - H1 : openclaw proxy
  - H2 : Commandes
  - H2 : Valider
  - H2 : Préréglages de requête
  - H2 : Notes
  - H2 : Associé

## cli/qr.md

- Route : /cli/qr
- Titres :
  - H1 : openclaw qr
  - H2 : Utilisation
  - H2 : Options
  - H2 : Notes
  - H2 : Associé

## cli/reset.md

- Route : /cli/reset
- Titres :
  - H1 : openclaw reset
  - H2 : Associé

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
  - H3 : Pour un agent spécifique seulement
  - H2 : Pourquoi c’est nécessaire
  - H2 : Migration du registre
  - H2 : Configuration
  - H2 : Associé

## cli/secrets.md

- Route : /cli/secrets
- Titres :
  - H1 : openclaw secrets
  - H2 : Recharger l’instantané d’exécution
  - H2 : Audit
  - H2 : Configurer (assistant interactif)
  - H2 : Appliquer un plan enregistré
  - H2 : Pourquoi il n’y a pas de sauvegardes de rollback
  - H2 : Exemple
  - H2 : Associé

## cli/security.md

- Route : /cli/security
- Titres :
  - H1 : openclaw security
  - H2 : Audit
  - H2 : Sortie JSON
  - H2 : Ce que --fix modifie
  - H2 : Associé

## cli/sessions.md

- Route : /cli/sessions
- Titres :
  - H1 : openclaw sessions
  - H2 : Maintenance de nettoyage
  - H2 : Compacter une session
  - H3 : RPC sessions.compact
  - H2 : Associé

## cli/setup.md

- Route : /cli/setup
- Titres :
  - H1 : openclaw setup
  - H2 : Options
  - H3 : Mode de référence
  - H2 : Exemples
  - H2 : Notes
  - H2 : Associé

## cli/skills.md

- Route : /cli/skills
- Titres :
  - H1 : openclaw skills
  - H2 : Commandes
  - H2 : Atelier de Skills
  - H2 : Associé

## cli/status.md

- Route : /cli/status
- Titres :
  - H2 : Associé

## cli/system.md

- Route : /cli/system
- Titres :
  - H1 : openclaw system
  - H2 : Commandes courantes
  - H2 : Événement système
  - H2 : system heartbeat last|enable|disable
  - H2 : Présence système
  - H2 : Notes
  - H2 : Associé

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
  - H2 : Associé

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
  - H2 : Associé

## cli/uninstall.md

- Route : /cli/uninstall
- Titres :
  - H1 : openclaw uninstall
  - H2 : Associé

## cli/update.md

- Route : /cli/update
- Titres :
  - H1 : openclaw update
  - H2 : Utilisation
  - H2 : Options
  - H2 : update status
  - H2 : update repair
  - H2 : update wizard
  - H2 : Ce qu’elle fait
  - H3 : Forme de réponse du plan de contrôle
  - H2 : Flux de checkout Git
  - H3 : Sélection du canal
  - H3 : Étapes de mise à jour
  - H2 : Raccourci --update
  - H2 : Associé

## cli/voicecall.md

- Route : /cli/voicecall
- Titres :
  - H1 : openclaw voicecall
  - H2 : Sous-commandes
  - H2 : Configuration et smoke
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
  - H2 : Logs et métriques
  - H3 : tail
  - H3 : latency
  - H2 : Exposition des Webhooks
  - H3 : expose
  - H2 : Associé

## cli/webhooks.md

- Route : /cli/webhooks
- Titres :
  - H1 : openclaw webhooks
  - H2 : Sous-commandes
  - H2 : webhooks gmail setup
  - H3 : Obligatoire
  - H3 : Options Pub/Sub
  - H3 : Options de livraison OpenClaw
  - H3 : Options gog watch serve
  - H3 : Exposition Tailscale
  - H3 : Sortie
  - H2 : webhooks gmail run
  - H2 : Flux de bout en bout
  - H2 : Associé

## cli/wiki.md

- Route : /cli/wiki
- Titres :
  - H1 : openclaw wiki
  - H2 : À quoi cela sert
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
  - H2 : Associé

## cli/workboard.md

- Route : /cli/workboard
- Titres :
  - H2 : Utilisation
  - H2 : list
  - H2 : create
  - H2 : show
  - H2 : dispatch
  - H2 : Parité des commandes slash
  - H2 : Permissions
  - H2 : Dépannage
  - H3 : Aucune carte n’apparaît
  - H3 : Dispatch indique données uniquement
  - H3 : Dispatch ne démarre rien
  - H2 : Associé

## concepts/active-memory.md

- Route : /concepts/active-memory
- Titres :
  - H2 : Démarrage rapide
  - H2 : Recommandations de vitesse
  - H3 : Configuration Cerebras
  - H2 : Comment la voir
  - H2 : Bascule de session
  - H2 : Quand elle s’exécute
  - H2 : Types de sessions
  - H2 : Où elle s’exécute
  - H2 : Pourquoi l’utiliser
  - H2 : Fonctionnement
  - H2 : Modes de requête
  - H2 : Styles de prompt
  - H2 : Politique de fallback de modèle
  - H2 : Outils de mémoire
  - H3 : memory-core intégré
  - H3 : Mémoire LanceDB
  - H3 : Lossless Claw
  - H2 : Échappatoires avancées
  - H2 : Persistance de transcription
  - H2 : Configuration
  - H2 : Configuration recommandée
  - H3 : Délai de grâce de démarrage à froid
  - H2 : Débogage
  - H2 : Problèmes courants
  - H2 : Pages associées

## concepts/agent-loop.md

- Route : /concepts/agent-loop
- Titres :
  - H2 : Points d’entrée
  - H2 : Fonctionnement (niveau général)
  - H2 : Mise en file d’attente + concurrence
  - H2 : Préparation de session + espace de travail
  - H2 : Assemblage du prompt + prompt système
  - H2 : Points de hook (où vous pouvez intercepter)
  - H3 : Hooks internes (hooks Gateway)
  - H3 : Hooks de Plugin (cycle de vie agent + Gateway)
  - H2 : Streaming + réponses partielles
  - H2 : Exécution d’outils + outils de messagerie
  - H2 : Mise en forme de la réponse + suppression
  - H2 : Compaction + nouvelles tentatives
  - H2 : Flux d’événements (aujourd’hui)
  - H2 : Gestion des canaux de chat
  - H2 : Délais d’expiration
  - H2 : Où les choses peuvent se terminer tôt
  - H2 : Associé

## concepts/agent-runtimes.md

- Route : /concepts/agent-runtimes
- Titres :
  - H2 : Surfaces Codex
  - H2 : Propriété du runtime
  - H2 : Sélection du runtime
  - H2 : Runtime d’agent GitHub Copilot
  - H2 : Contrat de compatibilité
  - H2 : Libellés d’état
  - H2 : Associé

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
  - H2 : Associé

## concepts/agent.md

- Route : /concepts/agent
- Titres :
  - H2 : Espace de travail (requis)
  - H2 : Fichiers de bootstrap (injectés)
  - H2 : Outils intégrés
  - H2 : Skills
  - H2 : Limites d’exécution
  - H2 : Sessions
  - H2 : Pilotage pendant le streaming
  - H2 : Références de modèle
  - H2 : Configuration (minimale)
  - H2 : Connexe

## concepts/architecture.md

- Route : /concepts/architecture
- Titres :
  - H2 : Vue d’ensemble
  - H2 : Composants et flux
  - H3 : Gateway (daemon)
  - H3 : Clients (application Mac / CLI / administration web)
  - H3 : Nœuds (macOS / iOS / Android / sans interface)
  - H3 : WebChat
  - H2 : Cycle de vie de la connexion (client unique)
  - H2 : Protocole filaire (résumé)
  - H2 : Appairage + confiance locale
  - H2 : Typage du protocole et génération de code
  - H2 : Accès distant
  - H2 : Instantané opérationnel
  - H2 : Invariants
  - H2 : Connexe

## concepts/channel-docking.md

- Route : /concepts/channel-docking
- Titres :
  - H2 : Exemple
  - H2 : Pourquoi l’utiliser
  - H2 : Configuration requise
  - H2 : Commandes
  - H2 : Ce qui change
  - H2 : Ce qui ne change pas
  - H2 : Dépannage

## concepts/commitments.md

- Route : /concepts/commitments
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

- Route : /concepts/compaction
- Titres :
  - H2 : Fonctionnement
  - H2 : Auto-Compaction
  - H2 : Compaction manuelle
  - H2 : Configuration
  - H3 : Utiliser un autre modèle
  - H3 : Conservation des identifiants
  - H3 : Garde sur les octets de transcript actif
  - H3 : Transcripts successeurs
  - H3 : Avis de Compaction
  - H3 : Vidage de la mémoire
  - H2 : Fournisseurs de Compaction extensibles
  - H2 : Compaction et élagage
  - H2 : Dépannage
  - H2 : Connexe

## concepts/context-engine.md

- Route : /concepts/context-engine
- Titres :
  - H2 : Démarrage rapide
  - H2 : Fonctionnement
  - H3 : Cycle de vie du sous-agent (facultatif)
  - H3 : Ajout à l’invite système
  - H2 : Le moteur hérité
  - H2 : Moteurs de Plugin
  - H3 : L’interface ContextEngine
  - H3 : Paramètres d’exécution
  - H3 : Exigences de l’hôte
  - H3 : Isolation des échecs
  - H3 : ownsCompaction
  - H2 : Référence de configuration
  - H2 : Relation avec la Compaction et la mémoire
  - H2 : Conseils
  - H2 : Connexe

## concepts/context.md

- Route : /concepts/context
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
  - H2 : Commandes, directives et « raccourcis inline »
  - H2 : Sessions, Compaction et élagage (ce qui persiste)
  - H2 : Ce que /context signale réellement
  - H2 : Connexe

## concepts/delegate-architecture.md

- Route : /concepts/delegate-architecture
- Titres :
  - H2 : Qu’est-ce qu’un délégué ?
  - H2 : Pourquoi des délégués ?
  - H2 : Niveaux de capacités
  - H3 : Niveau 1 : lecture seule + brouillon
  - H3 : Niveau 2 : envoyer pour le compte de
  - H3 : Niveau 3 : proactif
  - H2 : Prérequis : isolation et durcissement
  - H3 : Blocages stricts (non négociables)
  - H3 : Restrictions d’outils
  - H3 : Isolation du bac à sable
  - H3 : Piste d’audit
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

- Route : /concepts/dreaming
- Titres :
  - H2 : Ce que Dreaming écrit
  - H2 : Modèle par phases
  - H2 : Ingestion du transcript de session
  - H2 : Journal de Dreaming
  - H2 : Signaux de classement profonds
  - H2 : Couverture du rapport d’essai fantôme QA
  - H2 : Planification
  - H2 : Démarrage rapide
  - H2 : Commande slash
  - H2 : Flux de travail CLI
  - H2 : Valeurs par défaut clés
  - H2 : Interface Dreams
  - H2 : Dreaming ne s’exécute jamais : l’état indique bloqué
  - H2 : Connexe

## concepts/experimental-features.md

- Route : /concepts/experimental-features
- Titres :
  - H2 : Indicateurs actuellement documentés
  - H2 : Mode allégé pour modèle local
  - H3 : Pourquoi ces trois outils
  - H3 : Quand l’activer
  - H3 : Quand le laisser désactivé
  - H3 : Activer
  - H2 : Expérimental ne veut pas dire caché
  - H2 : Connexe

## concepts/features.md

- Route : /concepts/features
- Titres :
  - H2 : Points forts
  - H2 : Liste complète
  - H2 : Connexe

## concepts/mantis-slack-desktop-runbook.md

- Route : /concepts/mantis-slack-desktop-runbook
- Titres :
  - H2 : Modèle de stockage
  - H2 : Dispatch GitHub
  - H2 : CLI locale
  - H2 : Modes d’hydratation
  - H2 : Interprétation du timing
  - H2 : Liste de contrôle des preuves
  - H2 : Gestion des échecs
  - H2 : Connexe

## concepts/mantis.md

- Route : /concepts/mantis
- Titres :
  - H2 : Objectifs
  - H2 : Non-objectifs
  - H2 : Propriété
  - H2 : Forme de commande
  - H2 : Cycle de vie d’exécution
  - H2 : MVP Discord
  - H2 : Éléments QA existants
  - H2 : Modèle de preuves
  - H2 : Navigateur et VNC
  - H2 : Machines
  - H2 : Secrets
  - H2 : Artefacts GitHub et commentaires de PR
  - H2 : Notes de déploiement privé
  - H2 : Ajouter un scénario
  - H2 : Extension des fournisseurs
  - H2 : Questions ouvertes

## concepts/markdown-formatting.md

- Route : /concepts/markdown-formatting
- Titres :
  - H2 : Objectifs
  - H2 : Pipeline
  - H2 : Exemple d’IR
  - H2 : Où il est utilisé
  - H2 : Gestion des tableaux
  - H2 : Règles de découpage
  - H2 : Politique de liens
  - H2 : Spoilers
  - H2 : Comment ajouter ou mettre à jour un formateur de canal
  - H2 : Pièges courants
  - H2 : Connexe

## concepts/memory-builtin.md

- Route : /concepts/memory-builtin
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

- Route : /concepts/memory-honcho
- Titres :
  - H2 : Ce qu’elle fournit
  - H2 : Outils disponibles
  - H2 : Premiers pas
  - H2 : Configuration
  - H2 : Migrer la mémoire existante
  - H2 : Fonctionnement
  - H2 : Honcho et la mémoire intégrée
  - H2 : Commandes CLI
  - H2 : Lectures complémentaires
  - H2 : Connexe

## concepts/memory-qmd.md

- Route : /concepts/memory-qmd
- Titres :
  - H2 : Ce qu’elle ajoute par rapport à l’intégrée
  - H2 : Premiers pas
  - H3 : Prérequis
  - H3 : Activer
  - H2 : Fonctionnement du sidecar
  - H2 : Performances de recherche et compatibilité
  - H2 : Remplacements de modèle
  - H2 : Indexer des chemins supplémentaires
  - H2 : Indexer les transcripts de session
  - H2 : Portée de la recherche
  - H2 : Citations
  - H2 : Quand l’utiliser
  - H2 : Dépannage
  - H2 : Configuration
  - H2 : Connexe

## concepts/memory-search.md

- Route : /concepts/memory-search
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
  - H2 : Lectures complémentaires
  - H2 : Connexe

## concepts/memory.md

- Route : /concepts/memory
- Titres :
  - H2 : Fonctionnement
  - H2 : Ce qui va où
  - H2 : Mémoires sensibles aux actions
  - H2 : Engagements inférés
  - H2 : Outils de mémoire
  - H2 : Plugin compagnon Memory Wiki
  - H2 : Recherche de mémoire
  - H2 : Backends de mémoire
  - H2 : Couche wiki de connaissances
  - H2 : Vidage automatique de la mémoire
  - H2 : Dreaming
  - H2 : Remplissage rétrospectif ancré et promotion en direct
  - H2 : CLI
  - H2 : Lectures complémentaires
  - H2 : Connexe

## concepts/message-lifecycle-refactor.md

- Route : /concepts/message-lifecycle-refactor
- Titres :
  - H2 : Problèmes
  - H2 : Objectifs
  - H2 : Non-objectifs
  - H2 : Modèle de référence
  - H2 : Modèle central
  - H2 : Termes des messages
  - H3 : Message
  - H3 : Cible
  - H3 : Relation
  - H3 : Origine
  - H3 : Accusé de réception
  - H2 : Contexte de réception
  - H2 : Contexte d’envoi
  - H2 : Contexte en direct
  - H2 : Surface d’adaptateur
  - H2 : Réduction du SDK public
  - H2 : Relation avec l’entrant de canal
  - H2 : Garde-fous de compatibilité
  - H2 : Stockage interne
  - H2 : Classes d’échecs
  - H2 : Mappage des canaux
  - H2 : Plan de migration
  - H3 : Phase 1 : domaine de message interne
  - H3 : Phase 2 : noyau d’envoi durable
  - H3 : Phase 3 : pont entrant de canal
  - H3 : Phase 4 : pont de dispatcher préparé
  - H3 : Phase 5 : cycle de vie en direct unifié
  - H3 : Phase 6 : SDK public
  - H3 : Phase 7 : tous les expéditeurs
  - H3 : Phase 8 : supprimer la compatibilité nommée par tour
  - H2 : Plan de test
  - H2 : Questions ouvertes
  - H2 : Critères d’acceptation
  - H2 : Connexe

## concepts/messages.md

- Route : /concepts/messages
- Titres :
  - H2 : Flux de messages (vue d’ensemble)
  - H2 : Déduplication entrante
  - H2 : Anti-rebond entrant
  - H2 : Sessions et appareils
  - H2 : Métadonnées des résultats d’outil
  - H2 : Corps entrants et contexte d’historique
  - H2 : Mise en file d’attente et suivis
  - H2 : Propriété d’exécution du canal
  - H2 : Streaming, découpage et regroupement
  - H2 : Visibilité du raisonnement et tokens
  - H2 : Préfixes, fils et réponses
  - H2 : Réponses silencieuses
  - H2 : Connexe

## concepts/model-failover.md

- Route : /concepts/model-failover
- Titres :
  - H2 : Flux d’exécution
  - H2 : Politique de source de sélection
  - H2 : Cache de saut en cas d’échec d’authentification
  - H2 : Avis de bascule visibles par l’utilisateur
  - H2 : Stockage de l’authentification (clés + OAuth)
  - H2 : ID de profil
  - H2 : Ordre de rotation
  - H3 : Affinité de session (compatible avec le cache)
  - H3 : Abonnement OpenAI Codex plus sauvegarde par clé API
  - H2 : Délais de récupération
  - H2 : Désactivations de facturation
  - H2 : Bascule de modèle
  - H3 : Règles de chaîne de candidats
  - H3 : Quelles erreurs font avancer la bascule
  - H3 : Saut du délai de récupération ou comportement de sonde
  - H2 : Remplacements de session et changement de modèle en direct
  - H2 : Observabilité et résumés d’échecs
  - H2 : Configuration connexe

## concepts/model-providers.md

- Route : /concepts/model-providers
- Titres :
  - H2 : Règles rapides
  - H2 : Comportement de fournisseur appartenant au Plugin
  - H2 : Rotation des clés API
  - H2 : Plugins de fournisseurs officiels
  - H3 : OpenAI
  - H3 : Anthropic
  - H3 : OpenAI ChatGPT/Codex OAuth
  - H3 : Autres options hébergées de type abonnement
  - H3 : OpenCode
  - H3 : Google Gemini (clé API)
  - H3 : Google Vertex et Gemini CLI
  - H3 : Z.AI (GLM)
  - H3 : Vercel AI Gateway
  - H3 : Autres Plugins de fournisseurs groupés
  - H4 : Particularités à connaître
  - H2 : Fournisseurs via models.providers (URL personnalisée/de base)
  - H3 : Moonshot AI (Kimi)
  - H3 : Codage Kimi
  - H3 : Volcano Engine (Doubao)
  - H3 : BytePlus (International)
  - H3 : Synthetic
  - H3 : MiniMax
  - H3 : LM Studio
  - H3 : Ollama
  - H3 : vLLM
  - H3 : SGLang
  - H3 : Proxys locaux (LM Studio, vLLM, LiteLLM, etc.)
  - H2 : Exemples CLI
  - H2 : Connexe

## concepts/models.md

- Route : /concepts/models
- Titres :
  - H2 : Fonctionnement de la sélection de modèle
  - H2 : Source de sélection et comportement de bascule
  - H2 : Politique de modèle rapide
  - H2 : Intégration initiale (recommandée)
  - H2 : Clés de configuration (vue d’ensemble)
  - H3 : Modifications sûres de la liste d’autorisation
  - H2 : « Le modèle n’est pas autorisé » (et pourquoi les réponses s’arrêtent)
  - H2 : Changer de modèle dans le chat (/model)
  - H2 : Commandes CLI
  - H3 : models list
  - H3 : models status
  - H2 : Analyse (modèles gratuits OpenRouter)
  - H2 : Registre des modèles (models.json)
  - H2 : Connexe

## concepts/multi-agent.md

- Route : /concepts/multi-agent
- Titres :
  - H2 : Qu’est-ce qu’« un agent » ?
  - H2 : Chemins (carte rapide)
  - H3 : Mode agent unique (par défaut)
  - H2 : Assistant d’agent
  - H2 : Démarrage rapide
  - H2 : Plusieurs agents = plusieurs personnes, plusieurs personnalités
  - H2 : Recherche de mémoire QMD inter-agents
  - H2 : Un numéro WhatsApp, plusieurs personnes (séparation des DM)
  - H2 : Règles de routage (comment les messages choisissent un agent)
  - H2 : Plusieurs comptes / numéros de téléphone
  - H2 : Concepts
  - H2 : Exemples de plateformes
  - H2 : Modèles courants
  - H2 : Bac à sable et configuration d’outils par agent
  - H2 : Connexe

## concepts/oauth.md

- Route : /concepts/oauth
- Titres :
  - H2 : Le collecteur de tokens (pourquoi il existe)
  - H2 : Stockage (où vivent les tokens)
  - H2 : Compatibilité des tokens hérités Anthropic
  - H2 : Migration Anthropic Claude CLI
  - H2 : Échange OAuth (fonctionnement de la connexion)
  - H3 : setup-token Anthropic
  - H3 : OpenAI Codex (OAuth ChatGPT)
  - H2 : Actualisation + expiration
  - H2 : Plusieurs comptes (profils) + routage
  - H3 : 1) Préféré : agents séparés
  - H3 : 2) Avancé : plusieurs profils dans un même agent
  - H2 : Connexe

## concepts/parallel-specialist-lanes.md

- Itinéraire : /concepts/parallel-specialist-lanes
- Titres :
  - H2 : Principes fondamentaux
  - H2 : Déploiement recommandé
  - H3 : Phase 1 : contrats de voie + travail lourd en arrière-plan
  - H3 : Phase 2 : contrôles de priorité et de concurrence
  - H3 : Phase 3 : coordinateur / contrôleur de trafic
  - H2 : Modèle minimal de contrat de voie
  - H2 : Voir aussi

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
  - H3 : Détails des champs du fournisseur
  - H3 : Exemples de fournisseurs
  - H2 : Associé

## gateway/configuration-examples.md

- Route : /gateway/configuration-examples
- Titres :
  - H2 : Démarrage rapide
  - H3 : Minimum absolu
  - H3 : Configuration de départ recommandée
  - H2 : Exemple développé (options principales)
  - H3 : Dépôt de Skills frère lié par symlink
  - H2 : Modèles courants
  - H3 : Base Skills partagée avec une seule dérogation
  - H3 : Configuration multiplateforme
  - H3 : Approbation automatique du réseau de nœuds de confiance
  - H3 : Mode DM sécurisé (boîte de réception partagée / DM multi-utilisateurs)
  - H3 : Clé API Anthropic + repli MiniMax
  - H3 : Bot de travail (accès restreint)
  - H3 : Modèles locaux uniquement
  - H2 : Conseils
  - H2 : Associé

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
  - H3 : Points de terminaison compatibles OpenAI
  - H3 : Isolation multi-instance
  - H3 : gateway.tls
  - H3 : gateway.reload
  - H2 : Hooks
  - H3 : Intégration Gmail
  - H2 : Hôte de Plugin Canvas
  - H2 : Découverte
  - H3 : mDNS (Bonjour)
  - H3 : Étendu (DNS-SD)
  - H2 : Environnement
  - H3 : env (variables d’environnement en ligne)
  - H3 : Substitution de variables d’environnement
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
  - H2 : Variables de modèle de modèle média
  - H2 : Inclusions de configuration ($include)
  - H2 : Associé

## gateway/configuration.md

- Route : /gateway/configuration
- Titres :
  - H2 : Configuration minimale
  - H2 : Modifier la configuration
  - H2 : Validation stricte
  - H2 : Tâches courantes
  - H2 : Rechargement à chaud de la configuration
  - H3 : Modes de rechargement
  - H3 : Ce qui s’applique à chaud et ce qui nécessite un redémarrage
  - H3 : Planification du rechargement
  - H2 : RPC de configuration (mises à jour programmatiques)
  - H2 : Variables d’environnement
  - H2 : Référence complète
  - H2 : Associé

## gateway/diagnostics.md

- Route : /gateway/diagnostics
- Titres :
  - H2 : Démarrage rapide
  - H2 : Commande de chat
  - H2 : Contenu de l’export
  - H2 : Modèle de confidentialité
  - H2 : Enregistreur de stabilité
  - H2 : Options utiles
  - H2 : Désactiver les diagnostics
  - H2 : Associé

## gateway/discovery.md

- Route : /gateway/discovery
- Titres :
  - H2 : Termes
  - H2 : Pourquoi nous conservons à la fois le direct et SSH
  - H2 : Entrées de découverte (comment les clients apprennent où se trouve la Gateway)
  - H3 : 1) Découverte Bonjour / DNS-SD
  - H4 : Détails de la balise de service
  - H3 : 2) Tailnet (interréseau)
  - H3 : 3) Cible manuelle / SSH
  - H2 : Sélection du transport (politique client)
  - H2 : Appairage + auth (transport direct)
  - H2 : Responsabilités par composant
  - H2 : Associé

## gateway/doctor.md

- Route : /gateway/doctor
- Titres :
  - H2 : Démarrage rapide
  - H3 : Modes sans interface et automatisation
  - H2 : Mode lint en lecture seule
  - H2 : Ce qu’il fait (résumé)
  - H2 : Rétroremplissage et réinitialisation de l’UI des rêves
  - H2 : Comportement détaillé et justification
  - H2 : Associé

## gateway/external-apps.md

- Route : /gateway/external-apps
- Titres :
  - H2 : Ce qui est disponible aujourd’hui
  - H2 : Chemin recommandé
  - H2 : Code d’application vs code de Plugin
  - H2 : Associé

## gateway/gateway-lock.md

- Route : /gateway/gateway-lock
- Titres :
  - H2 : Pourquoi
  - H2 : Mécanisme
  - H2 : Surface d’erreur
  - H2 : Notes opérationnelles
  - H2 : Associé

## gateway/health.md

- Route : /gateway/health
- Titres :
  - H2 : Vérifications rapides
  - H2 : Diagnostics approfondis
  - H2 : Configuration du moniteur de santé
  - H2 : Surveillance du temps de disponibilité
  - H3 : Exemples de configuration de service de surveillance
  - H2 : Lorsqu’un élément échoue
  - H2 : Commande « health » dédiée
  - H2 : Associé

## gateway/heartbeat.md

- Route : /gateway/heartbeat
- Titres :
  - H2 : Démarrage rapide (débutant)
  - H2 : Valeurs par défaut
  - H2 : À quoi sert l’invite de Heartbeat
  - H2 : Contrat de réponse
  - H2 : Configuration
  - H3 : Portée et précédence
  - H3 : Heartbeats par agent
  - H3 : Exemple d’heures actives
  - H3 : Configuration 24/7
  - H3 : Exemple multicomptes
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
  - H2 : Livraison du raisonnement (facultative)
  - H2 : Sensibilisation aux coûts
  - H2 : Débordement du contexte après Heartbeat
  - H2 : Associé

## gateway/index.md

- Route : /gateway
- Titres :
  - H2 : Démarrage local en 5 minutes
  - H2 : Modèle d’exécution
  - H2 : Points de terminaison compatibles OpenAI
  - H3 : Précédence du port et de la liaison
  - H3 : Modes de rechargement à chaud
  - H2 : Ensemble de commandes opérateur
  - H2 : Plusieurs gateways (même hôte)
  - H2 : Accès distant
  - H2 : Supervision et cycle de vie du service
  - H2 : Chemin rapide du profil dev
  - H2 : Référence rapide du protocole (vue opérateur)
  - H2 : Vérifications opérationnelles
  - H3 : Vivacité
  - H3 : Préparation
  - H3 : Récupération des écarts
  - H2 : Signatures d’échec courantes
  - H2 : Garanties de sécurité
  - H2 : Associé

## gateway/local-model-services.md

- Route : /gateway/local-model-services
- Titres :
  - H2 : Fonctionnement
  - H2 : Forme de la configuration
  - H2 : Champs
  - H2 : Exemple Inferrs
  - H2 : Exemple ds4
  - H2 : Notes opérationnelles
  - H2 : Associé

## gateway/local-models.md

- Route : /gateway/local-models
- Titres :
  - H2 : Configuration matérielle minimale
  - H2 : Choisir un backend
  - H2 : Recommandé : LM Studio + grand modèle local (Responses API)
  - H3 : Configuration hybride : principal hébergé, repli local
  - H3 : Priorité au local avec filet de sécurité hébergé
  - H3 : Hébergement régional / routage des données
  - H2 : Autres proxys locaux compatibles OpenAI
  - H2 : Backends plus petits ou plus stricts
  - H2 : Dépannage
  - H2 : Associé

## gateway/logging.md

- Route : /gateway/logging
- Titres :
  - H1 : Journalisation
  - H2 : Journaliseur basé sur des fichiers
  - H2 : Capture de la console
  - H2 : Caviardage
  - H2 : Journaux WebSocket de la Gateway
  - H3 : Style des journaux WS
  - H2 : Formatage de la console (journalisation de sous-système)
  - H2 : Associé

## gateway/multiple-gateways.md

- Route : /gateway/multiple-gateways
- Titres :
  - H2 : Meilleure configuration recommandée
  - H2 : Démarrage rapide de Rescue-Bot
  - H2 : Pourquoi cela fonctionne
  - H2 : Ce que modifie --profile rescue onboard
  - H2 : Configuration multi-gateway générale
  - H2 : Liste de contrôle d’isolation
  - H2 : Mappage des ports (dérivé)
  - H2 : Notes navigateur/CDP (piège courant)
  - H2 : Exemple env manuel
  - H2 : Vérifications rapides
  - H2 : Associé

## gateway/network-model.md

- Route : /gateway/network-model
- Titres :
  - H2 : Associé

## gateway/openai-http-api.md

- Route : /gateway/openai-http-api
- Titres :
  - H2 : Authentification
  - H2 : Frontière de sécurité (important)
  - H2 : Quand utiliser ce point de terminaison
  - H2 : Contrat de modèle agent-first
  - H2 : Activer le point de terminaison
  - H2 : Désactiver le point de terminaison
  - H2 : Comportement de session
  - H2 : Pourquoi cette surface est importante
  - H2 : Liste des modèles et routage des agents
  - H2 : Streaming (SSE)
  - H2 : Contrat d’outil de chat
  - H3 : Champs de requête pris en charge
  - H3 : Variantes non prises en charge
  - H3 : Forme de réponse d’outil non streaming
  - H3 : Forme de réponse d’outil en streaming
  - H3 : Boucle de suivi d’outil
  - H2 : Configuration rapide d’Open WebUI
  - H2 : Exemples
  - H2 : Associé

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
  - H2 : Associé

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
  - H3 : OpenShell par agent avec gateway personnalisée
  - H2 : Gestion du cycle de vie
  - H3 : Quand recréer
  - H2 : Renforcement de la sécurité
  - H2 : Limitations actuelles
  - H2 : Fonctionnement
  - H2 : Associé

## gateway/opentelemetry.md

- Route : /gateway/opentelemetry
- Titres :
  - H2 : Comment l’ensemble s’articule
  - H2 : Démarrage rapide
  - H2 : Signaux exportés
  - H2 : Référence de configuration
  - H3 : Variables d’environnement
  - H2 : Confidentialité et capture de contenu
  - H2 : Échantillonnage et vidage
  - H2 : Métriques exportées
  - H3 : Utilisation des modèles
  - H3 : Flux de messages
  - H3 : Parole
  - H3 : Files d’attente et sessions
  - H3 : Télémétrie de vivacité de session
  - H3 : Cycle de vie du harnais
  - H3 : Exécution des outils
  - H3 : Exec
  - H3 : Internes de diagnostics (mémoire et boucle d’outils)
  - H2 : Spans exportés
  - H2 : Catalogue des événements de diagnostic
  - H2 : Sans exportateur
  - H2 : Désactiver
  - H2 : Associé

## gateway/operator-scopes.md

- Route : /gateway/operator-scopes
- Titres :
  - H2 : Rôles
  - H2 : Niveaux de portée
  - H2 : La portée de méthode n’est que la première barrière
  - H2 : Approbations d’appairage d’appareils
  - H2 : Approbations d’appairage de nœuds
  - H2 : Authentification par secret partagé

## gateway/pairing.md

- Route : /gateway/pairing
- Titres :
  - H2 : Concepts
  - H2 : Fonctionnement de l’appairage
  - H2 : Workflow CLI (adapté au sans interface)
  - H2 : Surface API (protocole Gateway)
  - H2 : Contrôle des commandes Node (2026.3.31+)
  - H2 : Frontières de confiance des événements Node (2026.3.31+)
  - H2 : Approbation automatique (application macOS)
  - H2 : Approbation automatique des appareils CIDR de confiance
  - H2 : Approbation automatique de mise à niveau des métadonnées
  - H2 : Assistants d’appairage QR
  - H2 : Localité et en-têtes transférés
  - H2 : Stockage (local, privé)
  - H2 : Comportement du transport
  - H2 : Associé

## gateway/prometheus.md

- Route : /gateway/prometheus
- Titres :
  - H2 : Démarrage rapide
  - H2 : Métriques exportées
  - H2 : Politique des libellés
  - H2 : Recettes PromQL
  - H2 : Choisir entre l’export Prometheus et OpenTelemetry
  - H2 : Dépannage
  - H2 : Associé

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
  - H3 : Capacités/commandes/permissions (nœud)
  - H2 : Présence
  - H3 : Événement d’activité en arrière-plan du nœud
  - H2 : Portée des événements de diffusion
  - H2 : Familles courantes de méthodes RPC
  - H3 : Familles courantes d’événements
  - H3 : Méthodes d’aide du nœud
  - H3 : RPC du registre des tâches
  - H3 : Méthodes d’aide opérateur
  - H3 : Vues models.list
  - H2 : Approbations d’exécution
  - H2 : Repli de livraison agent
  - H2 : Versionnement
  - H3 : Constantes client
  - H2 : Auth
  - H2 : Identité de l’appareil + appairage
  - H3 : Diagnostics de migration d’authentification des appareils
  - H2 : TLS + épinglage
  - H2 : Portée
  - H2 : Associé

## gateway/remote-gateway-readme.md

- Route : /gateway/remote-gateway-readme
- Titres :
  - H1 : Exécuter OpenClaw.app avec une Gateway distante
  - H2 : Vue d’ensemble
  - H2 : Configuration rapide
  - H3 : Étape 1 : ajouter la configuration SSH
  - H3 : Étape 2 : copier la clé SSH
  - H3 : Étape 3 : configurer l’authentification de la Gateway distante
  - H3 : Étape 4 : démarrer le tunnel SSH
  - H3 : Étape 5 : redémarrer OpenClaw.app
  - H2 : Démarrage automatique du tunnel à la connexion
  - H3 : Créer le fichier PLIST
  - H3 : Charger le Launch Agent
  - H2 : Dépannage
  - H2 : Fonctionnement
  - H2 : Associé

## gateway/remote.md

- Route : /gateway/remote
- Titres :
  - H2 : L’idée centrale
  - H2 : Configurations VPN et tailnet courantes
  - H3 : Gateway toujours actif dans votre tailnet
  - H3 : L’ordinateur de bureau domestique exécute le Gateway
  - H3 : L’ordinateur portable exécute le Gateway
  - H2 : Flux de commandes (ce qui s’exécute où)
  - H2 : Tunnel SSH (CLI + outils)
  - H2 : Valeurs par défaut distantes de la CLI
  - H2 : Priorité des identifiants
  - H2 : Accès distant à l’interface de chat
  - H2 : Mode distant de l’application macOS
  - H2 : Règles de sécurité (distant/VPN)
  - H3 : macOS : tunnel SSH persistant via LaunchAgent
  - H4 : Étape 1 : ajouter la configuration SSH
  - H4 : Étape 2 : copier la clé SSH (une fois)
  - H4 : Étape 3 : configurer le jeton du Gateway
  - H4 : Étape 4 : créer le LaunchAgent
  - H4 : Étape 5 : charger le LaunchAgent
  - H4 : Dépannage
  - H2 : Connexe

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- Route : /gateway/sandbox-vs-tool-policy-vs-elevated
- Titres :
  - H2 : Débogage rapide
  - H2 : Sandbox : où les outils s’exécutent
  - H3 : Montages liés (vérification de sécurité rapide)
  - H2 : Politique d’outils : quels outils existent/sont appelables
  - H3 : Groupes d’outils (raccourcis)
  - H2 : Élevé : « exécuter sur l’hôte » pour exec uniquement
  - H2 : Correctifs courants pour la « prison de sandbox »
  - H3 : « Outil X bloqué par la politique d’outils du sandbox »
  - H3 : « Je pensais que c’était main, pourquoi est-ce sandboxé ? »
  - H2 : Connexe

## gateway/sandboxing.md

- Route : /gateway/sandboxing
- Titres :
  - H2 : Ce qui est sandboxé
  - H2 : Modes
  - H2 : Portée
  - H2 : Backend
  - H3 : Choisir un backend
  - H3 : Backend Docker
  - H3 : Backend SSH
  - H3 : Backend OpenShell
  - H4 : Modes d’espace de travail
  - H4 : Cycle de vie OpenShell
  - H2 : Accès à l’espace de travail
  - H2 : Montages liés personnalisés
  - H2 : Images et configuration
  - H2 : setupCommand (configuration unique du conteneur)
  - H2 : Politique d’outils et échappatoires
  - H2 : Remplacements multi-agent
  - H2 : Exemple minimal d’activation
  - H2 : Connexe

## gateway/secrets-plan-contract.md

- Route : /gateway/secrets-plan-contract
- Titres :
  - H2 : Forme du fichier de plan
  - H2 : Upserts et suppressions de fournisseurs
  - H2 : Portée de cible prise en charge
  - H2 : Comportement du type de cible
  - H2 : Règles de validation des chemins
  - H2 : Comportement en cas d’échec
  - H2 : Comportement de consentement du fournisseur exec
  - H2 : Notes sur la portée d’exécution et d’audit
  - H2 : Vérifications opérateur
  - H2 : Documents connexes

## gateway/secrets.md

- Route : /gateway/secrets
- Titres :
  - H2 : Objectifs et modèle d’exécution
  - H2 : Limite d’accès des agents
  - H2 : Filtrage de la surface active
  - H2 : Diagnostics de la surface d’authentification du Gateway
  - H2 : Prévalidation de référence d’intégration
  - H2 : Contrat SecretRef
  - H2 : Configuration des fournisseurs
  - H2 : Clés d’API adossées à des fichiers
  - H2 : Exemples d’intégration exec
  - H2 : Variables d’environnement du serveur MCP
  - H2 : Matériel d’authentification SSH du sandbox
  - H2 : Surface d’identifiants prise en charge
  - H2 : Comportement requis et priorité
  - H2 : Déclencheurs d’activation
  - H2 : Signaux dégradés et rétablis
  - H2 : Résolution du chemin de commande
  - H2 : Flux de travail d’audit et de configuration
  - H2 : Politique de sécurité à sens unique
  - H2 : Notes de compatibilité d’authentification héritée
  - H2 : Note sur l’interface Web
  - H2 : Connexe

## gateway/security/audit-checks.md

- Route : /gateway/security/audit-checks
- Titres :
  - H2 : Connexe

## gateway/security/exposure-runbook.md

- Route : /gateway/security/exposure-runbook
- Titres :
  - H2 : Choisir le modèle d’exposition
  - H2 : Inventaire de prévol
  - H2 : Vérifications de référence
  - H2 : Base minimale sûre
  - H2 : Exposition des DM et des groupes
  - H2 : Vérifications du proxy inverse
  - H2 : Revue des outils et du sandbox
  - H2 : Validation après modification
  - H2 : Plan de restauration
  - H2 : Liste de contrôle de revue

## gateway/security/index.md

- Route : /gateway/security
- Titres :
  - H2 : D’abord la portée : modèle de sécurité d’assistant personnel
  - H2 : Vérification rapide : audit de sécurité openclaw
  - H3 : Verrouillage des dépendances du package publié
  - H3 : Déploiement et confiance envers l’hôte
  - H3 : Opérations de fichiers sécurisées
  - H3 : Espace de travail Slack partagé : risque réel
  - H3 : Agent partagé par l’entreprise : modèle acceptable
  - H2 : Concept de confiance du Gateway et du nœud
  - H2 : Matrice des limites de confiance
  - H2 : Non-vulnérabilités par conception
  - H2 : Base renforcée en 60 secondes
  - H2 : Règle rapide pour boîte de réception partagée
  - H2 : Modèle de visibilité du contexte
  - H2 : Ce que l’audit vérifie (haut niveau)
  - H2 : Carte de stockage des identifiants
  - H2 : Liste de contrôle d’audit de sécurité
  - H2 : Glossaire de l’audit de sécurité
  - H2 : Interface Control UI via HTTP
  - H2 : Résumé des indicateurs non sécurisés ou dangereux
  - H2 : Configuration du proxy inverse
  - H2 : Notes HSTS et origine
  - H2 : Les journaux de session locaux résident sur disque
  - H2 : Exécution Node (system.run)
  - H2 : Skills dynamiques (observateur / nœuds distants)
  - H2 : Le modèle de menace
  - H2 : Concept central : contrôle d’accès avant intelligence
  - H2 : Modèle d’autorisation des commandes
  - H2 : Risque des outils du plan de contrôle
  - H2 : Plugins
  - H2 : Modèle d’accès aux DM : appairage, liste d’autorisation, ouvert, désactivé
  - H2 : Isolation des sessions DM (mode multi-utilisateur)
  - H3 : Mode DM sécurisé (recommandé)
  - H2 : Listes d’autorisation pour les DM et les groupes
  - H2 : Injection de prompt (ce que c’est, pourquoi c’est important)
  - H2 : Nettoyage des jetons spéciaux du contenu externe
  - H2 : Indicateurs de contournement dangereux du contenu externe
  - H3 : L’injection de prompt ne nécessite pas de DM publics
  - H3 : Backends LLM auto-hébergés
  - H3 : Robustesse du modèle (note de sécurité)
  - H2 : Raisonnement et sortie verbeuse dans les groupes
  - H2 : Exemples de durcissement de configuration
  - H3 : Permissions de fichiers
  - H3 : Exposition réseau (liaison, port, pare-feu)
  - H3 : Publication de ports Docker avec UFW
  - H3 : Découverte mDNS/Bonjour
  - H3 : Verrouiller le WebSocket du Gateway (authentification locale)
  - H3 : En-têtes d’identité Tailscale Serve
  - H3 : Contrôle du navigateur via l’hôte du nœud (recommandé)
  - H3 : Secrets sur disque
  - H3 : Fichiers .env de l’espace de travail
  - H3 : Journaux et transcriptions (caviardage et conservation)
  - H3 : DM : appairage par défaut
  - H3 : Groupes : exiger une mention partout
  - H3 : Numéros séparés (WhatsApp, Signal, Telegram)
  - H3 : Mode lecture seule (via sandbox et outils)
  - H3 : Base sécurisée (copier/coller)
  - H2 : Sandboxing (recommandé)
  - H3 : Garde-fou de délégation aux sous-agents
  - H2 : Risques du contrôle du navigateur
  - H3 : Politique SSRF du navigateur (stricte par défaut)
  - H2 : Profils d’accès par agent (multi-agent)
  - H3 : Exemple : accès complet (sans sandbox)
  - H3 : Exemple : outils en lecture seule + espace de travail en lecture seule
  - H3 : Exemple : aucun accès au système de fichiers/shell (messagerie fournisseur autorisée)
  - H2 : Réponse aux incidents
  - H3 : Contenir
  - H3 : Rotation (supposer une compromission si des secrets ont fuité)
  - H3 : Auditer
  - H3 : Collecter pour un rapport
  - H2 : Analyse des secrets
  - H2 : Signaler des problèmes de sécurité

## gateway/security/secure-file-operations.md

- Route : /gateway/security/secure-file-operations
- Titres :
  - H2 : Par défaut : aucun assistant Python
  - H2 : Ce qui reste protégé sans Python
  - H2 : Ce que Python ajoute
  - H2 : Conseils pour Plugin et le cœur

## gateway/security/shrinkwrap.md

- Route : /gateway/security/shrinkwrap
- Titres :
  - H2 : La version simple
  - H2 : Pourquoi OpenClaw l’utilise
  - H2 : Détails techniques

## gateway/tailscale.md

- Route : /gateway/tailscale
- Titres :
  - H2 : Modes
  - H2 : Authentification
  - H2 : Exemples de configuration
  - H3 : Tailnet uniquement (Serve)
  - H3 : Tailnet uniquement (lier à l’IP du tailnet)
  - H3 : Internet public (Funnel + mot de passe partagé)
  - H2 : Exemples CLI
  - H2 : Notes
  - H2 : Contrôle du navigateur (Gateway distant + navigateur local)
  - H2 : Prérequis + limites Tailscale
  - H2 : En savoir plus
  - H2 : Connexe

## gateway/tools-invoke-http-api.md

- Route : /gateway/tools-invoke-http-api
- Titres :
  - H2 : Authentification
  - H2 : Limite de sécurité (important)
  - H2 : Corps de la requête
  - H2 : Comportement de politique + routage
  - H2 : Réponses
  - H2 : Exemple
  - H2 : Connexe

## gateway/troubleshooting.md

- Route : /gateway/troubleshooting
- Titres :
  - H2 : Échelle de commandes
  - H2 : Après une mise à jour
  - H2 : Installations à cerveau divisé et garde de configuration plus récente
  - H2 : Incompatibilité de protocole après restauration
  - H2 : Lien symbolique de Skill ignoré comme échappement de chemin
  - H2 : Anthropic 429 : utilisation supplémentaire requise pour un contexte long
  - H2 : Réponses bloquées par un 403 en amont
  - H2 : Le backend local compatible OpenAI réussit les sondes directes, mais les exécutions d’agent échouent
  - H2 : Aucune réponse
  - H2 : Connectivité de l’interface de contrôle du tableau de bord
  - H3 : Carte rapide des codes de détail d’authentification
  - H2 : Le service Gateway ne s’exécute pas
  - H2 : Le gateway macOS cesse silencieusement de répondre, puis reprend quand vous touchez le tableau de bord
  - H2 : Le Gateway quitte pendant une forte utilisation de mémoire
  - H2 : Le Gateway a rejeté une configuration invalide
  - H2 : Avertissements des sondes du Gateway
  - H2 : Canal connecté, messages non transmis
  - H2 : Livraison Cron et Heartbeat
  - H2 : Nœud appairé, échec de l’outil
  - H2 : Échec de l’outil navigateur
  - H2 : Si vous avez effectué une mise à niveau et que quelque chose s’est soudainement cassé
  - H2 : Connexe

## gateway/trusted-proxy-auth.md

- Route : /gateway/trusted-proxy-auth
- Titres :
  - H2 : Quand l’utiliser
  - H2 : Quand NE PAS l’utiliser
  - H2 : Fonctionnement
  - H2 : Comportement d’appairage de Control UI
  - H2 : Configuration
  - H3 : Référence de configuration
  - H2 : Terminaison TLS et HSTS
  - H3 : Conseils de déploiement
  - H2 : Exemples de configuration de proxy
  - H2 : Configuration mixte de jetons
  - H2 : En-tête des portées opérateur
  - H2 : Liste de contrôle de sécurité
  - H2 : Audit de sécurité
  - H2 : Dépannage
  - H2 : Migration depuis l’authentification par jeton
  - H2 : Connexe

## help/debugging.md

- Route : /help/debugging
- Titres :
  - H2 : Remplacements de débogage à l’exécution
  - H2 : Sortie de trace de session
  - H2 : Trace du cycle de vie du Plugin
  - H2 : Démarrage CLI et profilage des commandes
  - H2 : Mode surveillance du Gateway
  - H2 : Profil de développement + gateway de développement (--dev)
  - H2 : Journalisation de flux brut (OpenClaw)
  - H2 : Journalisation des fragments bruts compatibles OpenAI
  - H2 : Notes de sécurité
  - H2 : Débogage dans VSCode
  - H3 : Configuration
  - H3 : Notes
  - H2 : Connexe

## help/environment.md

- Route : /help/environment
- Titres :
  - H2 : Priorité (de la plus élevée à la plus faible)
  - H2 : Identifiants de fournisseur et .env de l’espace de travail
  - H2 : Bloc env de configuration
  - H2 : Importation de l’env du shell
  - H2 : Instantanés du shell exec
  - H2 : Variables d’environnement injectées à l’exécution
  - H2 : Variables d’environnement de l’interface utilisateur
  - H2 : Substitution de variables d’environnement dans la configuration
  - H2 : Références de secret vs chaînes ${ENV}
  - H2 : Variables d’environnement liées aux chemins
  - H2 : Journalisation
  - H3 : OPENCLAWHOME
  - H2 : Utilisateurs nvm : échecs TLS de webfetch
  - H2 : Variables d’environnement héritées
  - H2 : Connexe

## help/faq-first-run.md

- Route : /help/faq-first-run
- Titres :
  - H2 : Démarrage rapide et configuration au premier lancement
  - H2 : Connexe

## help/faq-models.md

- Route : /help/faq-models
- Titres :
  - H2 : Modèles : valeurs par défaut, sélection, alias, changement
  - H2 : Basculement de modèle et « Tous les modèles ont échoué »
  - H2 : Profils d’authentification : ce qu’ils sont et comment les gérer
  - H2 : Connexe

## help/faq.md

- Route : /help/faq
- Titres :
  - H2 : Les 60 premières secondes si quelque chose est cassé
  - H2 : Démarrage rapide et configuration au premier lancement
  - H2 : Qu’est-ce qu’OpenClaw ?
  - H2 : Skills et automatisation
  - H2 : Sandboxing et mémoire
  - H2 : Où les éléments résident sur disque
  - H2 : Bases de la configuration
  - H2 : Gateways distants et nœuds
  - H2 : Variables d’environnement et chargement .env
  - H2 : Sessions et chats multiples
  - H2 : Modèles, basculement et profils d’authentification
  - H2 : Gateway : ports, « déjà en cours d’exécution » et mode distant
  - H2 : Journalisation et débogage
  - H2 : Médias et pièces jointes
  - H2 : Sécurité et contrôle d’accès
  - H2 : Commandes de chat, abandon de tâches et « il ne s’arrête pas »
  - H2 : Divers
  - H2 : Connexe

## help/index.md

- Route : /help
- Titres :
  - H2 : FAQ
  - H2 : Diagnostics
  - H2 : Tests
  - H2 : Communauté et méta

## help/scripts.md

- Route : /help/scripts
- Titres :
  - H2 : Conventions
  - H2 : Scripts de surveillance d’authentification
  - H2 : Assistant de lecture GitHub
  - H2 : Lors de l’ajout de scripts
  - H2 : Connexe

## help/testing-live.md

- Route : /help/testing-live
- Titres :
  - H2 : Live : commandes de smoke test locales
  - H2 : Live : balayage des capacités du nœud Android
  - H2 : Live : smoke test de modèle (clés de profil)
  - H3 : Couche 1 : complétion directe du modèle (sans Gateway)
  - H3 : Couche 2 : Gateway + smoke test de l’agent de développement (ce que fait réellement « @openclaw »)
  - H2 : Live : smoke test du backend CLI (Claude, Gemini ou autres CLI locales)
  - H2 : Live : accessibilité du proxy APNs HTTP/2
  - H2 : Live : smoke test de liaison ACP (/acp spawn ... --bind here)
  - H2 : Live : smoke test du harnais Codex app-server
  - H3 : Recettes live recommandées
  - H2 : Live : matrice des modèles (ce que nous couvrons)
  - H3 : Ensemble de smoke tests moderne (appel d’outils + image)
  - H3 : Référence : appel d’outils (Read + Exec optionnel)
  - H3 : Vision : envoi d’image (pièce jointe → message multimodal)
  - H3 : Agrégateurs / gateways alternatives
  - H2 : Identifiants (ne jamais committer)
  - H2 : Deepgram live (transcription audio)
  - H2 : Plan de codage BytePlus live
  - H2 : Média de workflow ComfyUI live
  - H2 : Génération d’images live
  - H2 : Génération de musique live
  - H2 : Génération de vidéos live
  - H2 : Harnais média live
  - H2 : Associé

## help/testing-updates-plugins.md

- Route : /help/testing-updates-plugins
- Titres :
  - H2 : Ce que nous protégeons
  - H2 : Preuve locale pendant le développement
  - H2 : Voies Docker
  - H2 : Acceptation de package
  - H2 : Valeur par défaut de publication
  - H2 : Compatibilité héritée
  - H2 : Ajouter une couverture
  - H2 : Triage des échecs

## help/testing.md

- Route : /help/testing
- Titres :
  - H2 : Démarrage rapide
  - H2 : Répertoires temporaires de test
  - H2 : Exécuteurs spécifiques QA
  - H3 : Identifiants Telegram partagés via Convex (v1)
  - H3 : Ajouter un canal à la QA
  - H2 : Suites de tests (ce qui s’exécute où)
  - H3 : Unitaire / intégration (par défaut)
  - H3 : Stabilité (Gateway)
  - H3 : E2E (agrégat du dépôt)
  - H3 : E2E (smoke test Gateway)
  - H3 : E2E (navigateur simulé de Control UI)
  - H3 : E2E : smoke test du backend OpenShell
  - H3 : Live (fournisseurs réels + modèles réels)
  - H2 : Quelle suite dois-je exécuter ?
  - H2 : Tests live (touchant au réseau)
  - H2 : Exécuteurs Docker (vérifications optionnelles « fonctionne sous Linux »)
  - H2 : Sanity check des docs
  - H2 : Régression hors ligne (compatible CI)
  - H2 : Évaluations de fiabilité des agents (skills)
  - H2 : Tests de contrat (forme des plugins et canaux)
  - H3 : Commandes
  - H3 : Contrats de canaux
  - H3 : Contrats d’état des fournisseurs
  - H3 : Contrats de fournisseurs
  - H3 : Quand exécuter
  - H2 : Ajouter des régressions (guide)
  - H2 : Associé

## help/troubleshooting.md

- Route : /help/troubleshooting
- Titres :
  - H2 : Les 60 premières secondes
  - H2 : L’assistant semble limité ou des outils manquent
  - H2 : Contexte long Anthropic 429
  - H2 : Le backend local compatible OpenAI fonctionne directement mais échoue dans OpenClaw
  - H2 : L’installation du Plugin échoue avec des extensions openclaw manquantes
  - H2 : La politique d’installation bloque les installations ou mises à jour de plugins
  - H2 : Plugin présent mais bloqué par une propriété suspecte
  - H2 : Arbre de décision
  - H2 : Associé

## index.md

- Route : /
- Titres :
  - H1 : OpenClaw 🦞
  - H2 : Qu’est-ce qu’OpenClaw ?
  - H2 : Fonctionnement
  - H2 : Capacités clés
  - H2 : Démarrage rapide
  - H2 : Tableau de bord
  - H2 : Configuration (optionnelle)
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
  - H2 : Associé

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
  - H2 : Associé

## install/bun.md

- Route : /install/bun
- Titres :
  - H2 : Installer
  - H2 : Scripts de cycle de vie
  - H2 : Mises en garde
  - H2 : Associé

## install/clawdock.md

- Route : /install/clawdock
- Titres :
  - H2 : Installer
  - H2 : Ce que vous obtenez
  - H3 : Opérations de base
  - H3 : Accès au conteneur
  - H3 : Interface web et appairage
  - H3 : Configuration et maintenance
  - H3 : Utilitaires
  - H2 : Parcours de première utilisation
  - H2 : Configuration et secrets
  - H2 : Associé

## install/development-channels.md

- Route : /install/development-channels
- Titres :
  - H2 : Changer de canaux
  - H2 : Ciblage ponctuel d’une version ou d’un tag
  - H2 : Essai à blanc
  - H2 : Plugins et canaux
  - H2 : Vérifier l’état actuel
  - H2 : Bonnes pratiques de tag
  - H2 : Disponibilité de l’application macOS
  - H2 : Associé

## install/digitalocean.md

- Route : /install/digitalocean
- Titres :
  - H2 : Prérequis
  - H2 : Configuration
  - H2 : Persistance et sauvegardes
  - H2 : Conseils pour 1 Go de RAM
  - H2 : Dépannage
  - H2 : Étapes suivantes
  - H2 : Associé

## install/docker-vm-runtime.md

- Route : /install/docker-vm-runtime
- Titres :
  - H2 : Intégrer les binaires requis dans l’image
  - H2 : Construire et lancer
  - H2 : Ce qui persiste et où
  - H2 : Mises à jour
  - H2 : Associé

## install/docker.md

- Route : /install/docker
- Titres :
  - H2 : Docker me convient-il ?
  - H2 : Prérequis
  - H2 : Gateway conteneurisée
  - H3 : Parcours manuel
  - H3 : Variables d’environnement
  - H3 : Observabilité
  - H3 : Vérifications de santé
  - H3 : LAN vs loopback
  - H3 : Fournisseurs locaux de l’hôte
  - H3 : Backend CLI Claude dans Docker
  - H3 : Bonjour / mDNS
  - H3 : Stockage et persistance
  - H3 : Assistants shell (optionnel)
  - H3 : Exécution sur un VPS ?
  - H2 : Bac à sable de l’agent
  - H3 : Activation rapide
  - H2 : Dépannage
  - H2 : Associé

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
  - H2 : 4) Configurer nginx pour proxyfier OpenClaw vers le port 8000
  - H2 : 5) Accéder à OpenClaw et accorder les privilèges
  - H2 : Configuration du canal distant
  - H2 : Accès distant
  - H2 : Mise à jour
  - H2 : Associé

## install/fly.md

- Route : /install/fly
- Titres :
  - H2 : Ce dont vous avez besoin
  - H2 : Parcours rapide pour débutants
  - H2 : Dépannage
  - H3 : « L’application n’écoute pas à l’adresse attendue »
  - H3 : Échec des vérifications de santé / connexion refusée
  - H3 : OOM / problèmes de mémoire
  - H3 : Problèmes de verrouillage du Gateway
  - H3 : Configuration non lue
  - H3 : Écriture de la configuration via SSH
  - H3 : État non persistant
  - H2 : Mises à jour
  - H3 : Commande de mise à jour de machine
  - H2 : Déploiement privé (renforcé)
  - H3 : Quand utiliser un déploiement privé
  - H3 : Configuration
  - H3 : Accéder à un déploiement privé
  - H3 : Webhooks avec déploiement privé
  - H3 : Avantages de sécurité
  - H2 : Notes
  - H2 : Coût
  - H2 : Étapes suivantes
  - H2 : Associé

## install/gcp.md

- Route : /install/gcp
- Titres :
  - H2 : Que faisons-nous (en termes simples) ?
  - H2 : Parcours rapide (opérateurs expérimentés)
  - H2 : Ce dont vous avez besoin
  - H2 : Dépannage
  - H2 : Comptes de service (bonne pratique de sécurité)
  - H2 : Étapes suivantes
  - H2 : Associé

## install/hetzner.md

- Route : /install/hetzner
- Titres :
  - H2 : Objectif
  - H2 : Que faisons-nous (en termes simples) ?
  - H2 : Parcours rapide (opérateurs expérimentés)
  - H2 : Ce dont vous avez besoin
  - H2 : Infrastructure as Code (Terraform)
  - H2 : Étapes suivantes
  - H2 : Associé

## install/hostinger.md

- Route : /install/hostinger
- Titres :
  - H2 : Prérequis
  - H2 : Option A : OpenClaw en 1 clic
  - H2 : Option B : OpenClaw sur VPS
  - H2 : Vérifier votre configuration
  - H2 : Dépannage
  - H2 : Étapes suivantes
  - H2 : Associé

## install/index.md

- Route : /install
- Titres :
  - H2 : Exigences système
  - H2 : Recommandé : script d’installation
  - H2 : Méthodes d’installation alternatives
  - H3 : Programme d’installation avec préfixe local (install-cli.sh)
  - H3 : npm, pnpm ou bun
  - H3 : Depuis les sources
  - H3 : Installer depuis le checkout main GitHub
  - H3 : Conteneurs et gestionnaires de packages
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
  - H2 : Associé

## install/kubernetes.md

- Route : /install/kubernetes
- Titres :
  - H2 : Pourquoi pas Helm ?
  - H2 : Ce dont vous avez besoin
  - H2 : Démarrage rapide
  - H2 : Test local avec Kind
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
  - H3 : Exposer au-delà du transfert de port
  - H2 : Redéployer
  - H2 : Démantèlement
  - H2 : Notes d’architecture
  - H2 : Structure des fichiers
  - H2 : Associé

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
  - H2 : 5) Se connecter en SSH à la VM
  - H2 : 6) Installer OpenClaw
  - H2 : 7) Configurer les canaux
  - H2 : 8) Exécuter la VM sans interface graphique
  - H2 : Bonus : intégration iMessage
  - H2 : Enregistrer une image de référence
  - H2 : Exécution 24/7
  - H2 : Dépannage
  - H2 : Docs associées

## install/migrating-claude.md

- Route : /install/migrating-claude
- Titres :
  - H2 : Deux façons d’importer
  - H2 : Ce qui est importé
  - H2 : Ce qui reste uniquement archivé
  - H2 : Sélection de la source
  - H2 : Parcours recommandé
  - H2 : Gestion des conflits
  - H2 : Sortie JSON pour l’automatisation
  - H2 : Dépannage
  - H2 : Associé

## install/migrating-hermes.md

- Route : /install/migrating-hermes
- Titres :
  - H2 : Deux façons d’importer
  - H2 : Ce qui est importé
  - H2 : Ce qui reste uniquement archivé
  - H2 : Parcours recommandé
  - H2 : Gestion des conflits
  - H2 : Secrets
  - H2 : Sortie JSON pour l’automatisation
  - H2 : Dépannage
  - H2 : Associé

## install/migrating.md

- Route : /install/migrating
- Titres :
  - H2 : Importer depuis un autre système d’agent
  - H2 : Déplacer OpenClaw vers une nouvelle machine
  - H3 : Étapes de migration
  - H3 : Pièges courants
  - H3 : Liste de vérification
  - H2 : Mettre à niveau un plugin sur place
  - H2 : Associé

## install/nix.md

- Route : /install/nix
- Titres :
  - H2 : Ce que vous obtenez
  - H2 : Démarrage rapide
  - H2 : Comportement du runtime en mode Nix
  - H3 : Ce qui change en mode Nix
  - H3 : Chemins de configuration et d’état
  - H3 : Découverte du PATH du service
  - H2 : Associé

## install/node.md

- Route : /install/node
- Titres :
  - H2 : Vérifier votre version
  - H2 : Installer Node
  - H2 : Dépannage
  - H3 : openclaw : commande introuvable
  - H3 : Erreurs d’autorisation sur npm install -g (Linux)
  - H2 : Associé

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
  - H2 : Associé

## install/podman.md

- Route : /install/podman
- Titres :
  - H2 : Prérequis
  - H2 : Démarrage rapide
  - H2 : Podman et Tailscale
  - H2 : Systemd (Quadlet, optionnel)
  - H2 : Configuration, env et stockage
  - H2 : Commandes utiles
  - H2 : Dépannage
  - H2 : Associé

## install/railway.mdx

- Route : /install/railway
- Titres :
  - H1 : Railway
  - H2 : Liste de vérification rapide (nouveaux utilisateurs)
  - H2 : Déploiement en un clic
  - H2 : Ce que vous obtenez
  - H2 : Paramètres Railway requis
  - H3 : Réseau public
  - H3 : Volume (requis)
  - H3 : Variables
  - H2 : Connecter un canal
  - H2 : Sauvegardes et migration
  - H2 : Étapes suivantes

## install/raspberry-pi.md

- Route : /install/raspberry-pi
- Titres :
  - H2 : Compatibilité matérielle
  - H2 : Prérequis
  - H2 : Configuration
  - H2 : Conseils de performance
  - H2 : Configuration de modèle recommandée
  - H2 : Notes sur les binaires ARM
  - H2 : Persistance et sauvegardes
  - H2 : Dépannage
  - H2 : Étapes suivantes
  - H2 : Associé

## install/render.mdx

- Route : /install/render
- Titres :
  - H1 : Render
  - H2 : Prérequis
  - H2 : Déployer avec un Blueprint Render
  - H2 : Comprendre le Blueprint
  - H2 : Choisir une offre
  - H2 : Après le déploiement
  - H3 : Accéder à l’interface Control UI
  - H2 : Fonctionnalités du tableau de bord Render
  - H3 : Journaux
  - H3 : Accès au shell
  - H3 : Variables d’environnement
  - H3 : Déploiement automatique
  - H2 : Domaine personnalisé
  - H2 : Mise à l’échelle
  - H2 : Sauvegardes et migration
  - H2 : Dépannage
  - H3 : Le service ne démarre pas
  - H3 : Démarrages à froid lents (offre gratuite)
  - H3 : Perte de données après redéploiement
  - H3 : Échecs des vérifications d’état
  - H2 : Étapes suivantes

## install/uninstall.md

- Route : /install/uninstall
- Titres :
  - H2 : Chemin simple (CLI toujours installée)
  - H2 : Suppression manuelle du service (CLI non installée)
  - H3 : macOS (launchd)
  - H3 : Linux (unité utilisateur systemd)
  - H3 : Windows (tâche planifiée)
  - H2 : Installation normale vs checkout source
  - H3 : Installation normale (install.sh / npm / pnpm / bun)
  - H3 : Checkout source (git clone)
  - H2 : Associé

## install/updating.md

- Route : /install/updating
- Titres :
  - H2 : Recommandé : openclaw update
  - H2 : Basculer entre installations npm et git
  - H2 : Alternative : relancer l’installateur
  - H2 : Alternative : npm, pnpm ou bun manuel
  - H3 : Sujets avancés d’installation npm
  - H2 : Mise à jour automatique
  - H2 : Après la mise à jour
  - H3 : Exécuter doctor
  - H3 : Redémarrer le Gateway
  - H3 : Vérifier
  - H2 : Restauration
  - H3 : Épingler une version (npm)
  - H3 : Épingler un commit (source)
  - H2 : Si vous êtes bloqué
  - H2 : Associé

## install/upstash.md

- Route : /install/upstash
- Titres :
  - H2 : Prérequis
  - H2 : Créer une Box
  - H2 : Se connecter avec un tunnel SSH
  - H2 : Installer OpenClaw
  - H2 : Exécuter l’intégration
  - H2 : Démarrer le Gateway
  - H2 : Redémarrage automatique
  - H2 : Dépannage
  - H2 : Associé

## logging.md

- Route : /logging
- Titres :
  - H2 : Emplacement des journaux
  - H2 : Comment lire les journaux
  - H3 : CLI : suivi en direct (recommandé)
  - H3 : Control UI (web)
  - H3 : Journaux par canal uniquement
  - H2 : Formats de journaux
  - H3 : Journaux de fichiers (JSONL)
  - H3 : Sortie console
  - H3 : Journaux WebSocket du Gateway
  - H2 : Configurer la journalisation
  - H3 : Niveaux de journalisation
  - H3 : Diagnostics ciblés du transport de modèle
  - H3 : Corrélation des traces
  - H3 : Taille et durée des appels de modèle
  - H3 : Styles de console
  - H3 : Masquage
  - H2 : Diagnostics et OpenTelemetry
  - H2 : Conseils de dépannage
  - H2 : Associé

## maturity/scorecard.md

- Route : /maturity/scorecard
- Titres :
  - H1 : Tableau de bord de maturité
  - H2 : À quoi sert cette page
  - H2 : En un coup d’œil
  - H2 : Plages de score
  - H2 : Explorateur de surfaces
  - H2 : Synthèse des preuves QA
  - H3 : Préparation par domaine

## maturity/taxonomy.md

- Route : /maturity/taxonomy
- Titres :
  - H1 : Taxonomie de maturité
  - H2 : Comment lire cette page
  - H2 : Niveaux de maturité
  - H2 : Domaines produit
  - H2 : Détails
  - H3 : Cœur
  - H3 : Plateforme
  - H3 : Canal
  - H3 : Fournisseur et outil

## network.md

- Route : /network
- Titres :
  - H2 : Modèle central
  - H2 : Appairage + identité
  - H2 : Découverte + transports
  - H2 : Nœuds + transports
  - H2 : Sécurité
  - H2 : Associé

## nodes/audio.md

- Route : /nodes/audio
- Titres :
  - H2 : Ce qui fonctionne
  - H2 : Détection automatique (par défaut)
  - H2 : Exemples de configuration
  - H3 : Fournisseur + repli CLI (OpenAI + CLI Whisper)
  - H3 : Fournisseur uniquement avec filtrage par portée
  - H3 : Fournisseur uniquement (Deepgram)
  - H3 : Fournisseur uniquement (Mistral Voxtral)
  - H3 : Fournisseur uniquement (SenseAudio)
  - H3 : Renvoyer la transcription au chat (opt-in)
  - H2 : Notes et limites
  - H3 : Prise en charge de l’environnement proxy
  - H2 : Détection des mentions dans les groupes
  - H2 : Pièges
  - H2 : Associé

## nodes/camera.md

- Route : /nodes/camera
- Titres :
  - H2 : Nœud iOS
  - H3 : Paramètre utilisateur (activé par défaut)
  - H3 : Commandes (via Gateway node.invoke)
  - H3 : Exigence de premier plan
  - H3 : Assistant CLI
  - H2 : Nœud Android
  - H3 : Paramètre utilisateur Android (activé par défaut)
  - H3 : Autorisations
  - H3 : Exigence de premier plan Android
  - H3 : Commandes Android (via Gateway node.invoke)
  - H3 : Garde-fou de charge utile
  - H2 : Application macOS
  - H3 : Paramètre utilisateur (désactivé par défaut)
  - H3 : Assistant CLI (node invoke)
  - H2 : Sécurité + limites pratiques
  - H2 : Vidéo d’écran macOS (niveau OS)
  - H2 : Associé

## nodes/images.md

- Route : /nodes/images
- Titres :
  - H2 : Objectifs
  - H2 : Surface CLI
  - H2 : Comportement du canal WhatsApp Web
  - H2 : Pipeline de réponse automatique
  - H2 : Médias entrants vers les commandes
  - H2 : Limites et erreurs
  - H2 : Notes pour les tests
  - H2 : Associé

## nodes/index.md

- Route : /nodes
- Titres :
  - H2 : Appairage + état
  - H2 : Hôte de nœud distant (system.run)
  - H3 : Ce qui s’exécute où
  - H3 : Démarrer un hôte de nœud (premier plan)
  - H3 : Gateway distant via tunnel SSH (liaison loopback)
  - H3 : Démarrer un hôte de nœud (service)
  - H3 : Appairer + nommer
  - H3 : Autoriser les commandes
  - H3 : Pointer exec vers le nœud
  - H2 : Appel des commandes
  - H2 : Politique de commandes
  - H2 : Configuration (openclaw.json)
  - H2 : Captures d’écran (instantanés canvas)
  - H3 : Contrôles Canvas
  - H3 : A2UI (Canvas)
  - H2 : Photos + vidéos (caméra de nœud)
  - H2 : Enregistrements d’écran (nœuds)
  - H2 : Emplacement (nœuds)
  - H2 : SMS (nœuds Android)
  - H2 : Commandes d’appareil Android + données personnelles
  - H2 : Commandes système (hôte de nœud / nœud Mac)
  - H2 : Liaison de nœud exec
  - H2 : Carte des autorisations
  - H2 : Hôte de nœud headless (multiplateforme)
  - H2 : Mode nœud Mac

## nodes/location-command.md

- Route : /nodes/location-command
- Titres :
  - H2 : TL;DR
  - H2 : Pourquoi un sélecteur (pas seulement un interrupteur)
  - H2 : Modèle de paramètres
  - H2 : Mappage des autorisations (node.permissions)
  - H2 : Commande : location.get
  - H2 : Comportement en arrière-plan
  - H2 : Intégration modèle/outillage
  - H2 : Texte UX (suggéré)
  - H2 : Associé

## nodes/media-understanding.md

- Route : /nodes/media-understanding
- Titres :
  - H2 : Objectifs
  - H2 : Comportement de haut niveau
  - H2 : Vue d’ensemble de la configuration
  - H3 : Entrées de modèle
  - H3 : Identifiants du fournisseur (apiKey)
  - H2 : Valeurs par défaut et limites
  - H3 : Détection automatique de la compréhension des médias (par défaut)
  - H3 : Prise en charge de l’environnement proxy (modèles fournisseur)
  - H2 : Capacités (facultatif)
  - H2 : Matrice de prise en charge des fournisseurs (intégrations OpenClaw)
  - H2 : Conseils de sélection de modèle
  - H2 : Politique des pièces jointes
  - H2 : Exemples de configuration
  - H2 : Sortie d’état
  - H2 : Notes
  - H2 : Associé

## nodes/talk.md

- Route : /nodes/talk
- Titres :
  - H2 : Comportement (macOS)
  - H2 : Directives vocales dans les réponses
  - H2 : Configuration (/.openclaw/openclaw.json)
  - H2 : Interface macOS
  - H2 : Interface Android
  - H2 : Notes
  - H2 : Associé

## nodes/troubleshooting.md

- Route : /nodes/troubleshooting
- Titres :
  - H2 : Échelle de commandes
  - H2 : Exigences de premier plan
  - H2 : Matrice des autorisations
  - H2 : Appairage versus approbations
  - H2 : Codes d’erreur courants des nœuds
  - H2 : Boucle de récupération rapide
  - H2 : Associé

## nodes/voicewake.md

- Route : /nodes/voicewake
- Titres :
  - H2 : Stockage (hôte Gateway)
  - H2 : Protocole
  - H3 : Méthodes
  - H3 : Méthodes de routage (déclencheur → cible)
  - H3 : Événements
  - H2 : Comportement client
  - H3 : Application macOS
  - H3 : Nœud iOS
  - H3 : Nœud Android
  - H2 : Associé

## openclaw-agent-runtime.md

- Route : /openclaw-agent-runtime
- Titres :
  - H2 : Vérification des types et linting
  - H2 : Exécuter les tests Agent Runtime
  - H2 : Tests manuels
  - H2 : Réinitialisation complète
  - H2 : Références
  - H2 : Associé

## perplexity.md

- Route : /perplexity
- Titres :
  - H2 : Associé

## plan/codex-context-engine-harness.md

- Route : /plan/codex-context-engine-harness
- Titres :
  - H2 : État
  - H2 : Objectif
  - H2 : Non-objectifs
  - H2 : Architecture actuelle
  - H2 : Lacune actuelle
  - H2 : Comportement souhaité
  - H2 : Contraintes de conception
  - H3 : Le serveur d’application Codex reste canonique pour l’état natif du fil
  - H3 : L’assemblage du moteur de contexte doit être projeté dans les entrées Codex
  - H3 : La stabilité du cache de prompt est importante
  - H3 : La sémantique de sélection du runtime ne change pas
  - H2 : Plan d’implémentation
  - H3 : 1. Exporter ou déplacer les helpers de tentative réutilisables du moteur de contexte
  - H3 : 2. Ajouter un helper de projection de contexte Codex
  - H3 : 3. Raccorder le bootstrap avant le démarrage du fil Codex
  - H3 : 4. Raccorder l’assemblage avant thread/start / thread/resume et turn/start
  - H3 : 5. Préserver le formatage stable du cache de prompt
  - H3 : 6. Raccorder le post-tour après la mise en miroir de la transcription
  - H3 : 7. Normaliser l’usage et le contexte runtime du cache de prompt
  - H3 : 8. Politique de Compaction
  - H4 : /compact et Compaction OpenClaw explicite
  - H4 : Événements contextCompaction natifs de Codex pendant le tour
  - H3 : 9. Réinitialisation de session et comportement de liaison
  - H3 : 10. Gestion des erreurs
  - H2 : Plan de test
  - H3 : Tests unitaires
  - H3 : Tests existants à mettre à jour
  - H3 : Tests d’intégration / live
  - H2 : Observabilité
  - H2 : Migration / compatibilité
  - H2 : Questions ouvertes
  - H2 : Critères d’acceptation

## plan/ui-channels.md

- Route : /plan/ui-channels
- Titres :
  - H2 : État
  - H2 : Problème
  - H2 : Objectifs
  - H2 : Non-objectifs
  - H2 : Modèle cible
  - H2 : Métadonnées de livraison
  - H2 : Contrat de capacité runtime
  - H2 : Mappage des canaux
  - H2 : Étapes de refactorisation
  - H2 : Tests
  - H2 : Questions ouvertes
  - H2 : Associé

## platforms/android.md

- Route : /platforms/android
- Titres :
  - H2 : Instantané de prise en charge
  - H2 : Contrôle système
  - H2 : Runbook de connexion
  - H3 : Prérequis
  - H3 : 1) Démarrer le Gateway
  - H3 : 2) Vérifier la découverte (facultatif)
  - H4 : Découverte Tailnet (Vienne ⇄ Londres) via DNS-SD unicast
  - H3 : 3) Se connecter depuis Android
  - H3 : Signaux de présence alive
  - H3 : 4) Approuver l’appairage (CLI)
  - H3 : 5) Vérifier que le nœud est connecté
  - H3 : 6) Chat + historique
  - H3 : 7) Canvas + caméra
  - H4 : Hôte Gateway Canvas (recommandé pour le contenu web)
  - H3 : 8) Voix + surface étendue des commandes Android
  - H2 : Points d’entrée de l’assistant
  - H2 : Transfert des notifications
  - H2 : Associé

## platforms/digitalocean.md

- Route : /platforms/digitalocean
- Titres :
  - H2 : Associé

## platforms/easyrunner.md

- Route : /platforms/easyrunner
- Titres :
  - H2 : Avant de commencer
  - H2 : Application Compose
  - H2 : Configurer OpenClaw
  - H2 : Vérifier
  - H2 : Mises à jour et sauvegardes
  - H2 : Dépannage

## platforms/index.md

- Route : /platforms
- Titres :
  - H2 : Choisissez votre OS
  - H2 : VPS et hébergement
  - H2 : Liens communs
  - H2 : Installation du service Gateway (CLI)
  - H2 : Associé

## platforms/ios.md

- Route : /platforms/ios
- Titres :
  - H2 : Ce qu’il fait
  - H2 : Exigences
  - H2 : Démarrage rapide (appairer + connecter)
  - H2 : Push adossé à un relais pour les builds officiels
  - H2 : Signaux de présence en arrière-plan
  - H2 : Flux d’authentification et de confiance
  - H2 : Chemins de découverte
  - H3 : Bonjour (LAN)
  - H3 : Tailnet (inter-réseaux)
  - H3 : Hôte/port manuel
  - H2 : Canvas + A2UI
  - H2 : Relation avec Computer Use
  - H3 : Évaluation / instantané Canvas
  - H2 : Réveil vocal + mode conversation
  - H2 : Erreurs courantes
  - H2 : Docs associés

## platforms/linux.md

- Route : /platforms/linux
- Titres :
  - H2 : Parcours rapide débutant (VPS)
  - H2 : Installer
  - H2 : Gateway
  - H2 : Installation du service Gateway (CLI)
  - H2 : Contrôle système (unité utilisateur systemd)
  - H2 : Pression mémoire et arrêts OOM
  - H2 : Associé

## platforms/mac/bundled-gateway.md

- Route : /platforms/mac/bundled-gateway
- Titres :
  - H2 : Installer la CLI (requis pour le mode local)
  - H2 : Launchd (Gateway comme LaunchAgent)
  - H2 : Compatibilité de version
  - H2 : Répertoire d’état sur macOS
  - H2 : Déboguer la connectivité de l’application
  - H2 : Vérification smoke
  - H2 : Associé

## platforms/mac/canvas.md

- Route : /platforms/mac/canvas
- Titres :
  - H2 : Où réside Canvas
  - H2 : Comportement du panneau
  - H2 : Surface API agent
  - H2 : A2UI dans Canvas
  - H3 : Commandes A2UI (v0.8)
  - H2 : Déclencher des exécutions d’agent depuis Canvas
  - H2 : Notes de sécurité
  - H2 : Associé

## platforms/mac/child-process.md

- Route : /platforms/mac/child-process
- Titres :
  - H2 : Comportement par défaut (launchd)
  - H2 : Builds de développement non signés
  - H2 : Mode attachement uniquement
  - H2 : Mode distant
  - H2 : Pourquoi nous préférons launchd
  - H2 : Associé

## platforms/mac/dev-setup.md

- Route : /platforms/mac/dev-setup
- Titres :
  - H1 : configuration de développement macOS
  - H2 : Prérequis
  - H2 : 1. Installer les dépendances
  - H2 : 2. Compiler et empaqueter l’application
  - H2 : 3. Installer la CLI
  - H2 : Dépannage
  - H3 : Échec de la compilation : incompatibilité de la chaîne d’outils ou du SDK
  - H3 : L’application plante lors de l’octroi d’une autorisation
  - H3 : Gateway « Starting... » indéfiniment
  - H2 : Connexe

## platforms/mac/health.md

- Route : /platforms/mac/health
- Titres :
  - H1 : Contrôles de santé sur macOS
  - H2 : Barre de menus
  - H2 : Paramètres
  - H2 : Fonctionnement de la sonde
  - H2 : En cas de doute
  - H2 : Connexe

## platforms/mac/icon.md

- Route : /platforms/mac/icon
- Titres :
  - H1 : États de l’icône de la barre de menus
  - H2 : Connexe

## platforms/mac/logging.md

- Route : /platforms/mac/logging
- Titres :
  - H1 : Journalisation (macOS)
  - H2 : Journal de diagnostic rotatif dans un fichier (volet Débogage)
  - H2 : Données privées de journalisation unifiée sur macOS
  - H2 : Activer pour OpenClaw (ai.openclaw)
  - H2 : Désactiver après le débogage
  - H2 : Connexe

## platforms/mac/menu-bar.md

- Route : /platforms/mac/menu-bar
- Titres :
  - H2 : Ce qui est affiché
  - H2 : Modèle d’état
  - H2 : Énumération IconState (Swift)
  - H3 : ActivityKind → glyphe
  - H3 : Correspondance visuelle
  - H2 : Sous-menu contextuel
  - H2 : Texte de la ligne d’état (menu)
  - H2 : Ingestion des événements
  - H2 : Remplacement de débogage
  - H2 : Liste de vérification des tests
  - H2 : Connexe

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
  - H2 : Connexe

## platforms/mac/permissions.md

- Route : /platforms/mac/permissions
- Titres :
  - H2 : Exigences pour des autorisations stables
  - H2 : Autorisations d’accessibilité pour les runtimes Node et CLI
  - H2 : Liste de récupération lorsque les invites disparaissent
  - H2 : Autorisations des fichiers et dossiers (Bureau/Documents/Téléchargements)
  - H2 : Connexe

## platforms/mac/remote.md

- Route : /platforms/mac/remote
- Titres :
  - H2 : Modes
  - H2 : Transports distants
  - H2 : Prérequis sur l’hôte distant
  - H2 : Configuration de l’application macOS
  - H2 : Chat web
  - H2 : Autorisations
  - H2 : Notes de sécurité
  - H2 : Flux de connexion WhatsApp (distant)
  - H2 : Dépannage
  - H2 : Sons de notification
  - H2 : Connexe

## platforms/mac/signing.md

- Route : /platforms/mac/signing
- Titres :
  - H1 : signature mac (compilations de débogage)
  - H2 : Utilisation
  - H3 : Note sur la signature ad hoc
  - H2 : Métadonnées de compilation pour À propos
  - H2 : Pourquoi
  - H2 : Connexe

## platforms/mac/skills.md

- Route : /platforms/mac/skills
- Titres :
  - H2 : Source de données
  - H2 : Actions d’installation
  - H2 : Clés d’environnement/API
  - H2 : Mode distant
  - H2 : Connexe

## platforms/mac/voice-overlay.md

- Route : /platforms/mac/voice-overlay
- Titres :
  - H1 : Cycle de vie de la superposition vocale (macOS)
  - H2 : Intention actuelle
  - H2 : Implémenté (9 déc. 2025)
  - H2 : Prochaines étapes
  - H2 : Liste de vérification du débogage
  - H2 : Étapes de migration (suggérées)
  - H2 : Connexe

## platforms/mac/voicewake.md

- Route : /platforms/mac/voicewake
- Titres :
  - H1 : Réveil vocal et Push-to-Talk
  - H2 : Exigences
  - H2 : Modes
  - H2 : Comportement à l’exécution (mot de réveil)
  - H2 : Invariants du cycle de vie
  - H2 : Mode d’échec de superposition persistante (précédent)
  - H2 : Spécificités du Push-to-Talk
  - H2 : Paramètres destinés à l’utilisateur
  - H2 : Comportement de transfert
  - H2 : Charge utile de transfert
  - H2 : Vérification rapide
  - H2 : Connexe

## platforms/mac/webchat.md

- Route : /platforms/mac/webchat
- Titres :
  - H2 : Lancement et débogage
  - H2 : Comment c’est câblé
  - H2 : Surface de sécurité
  - H2 : Limitations connues
  - H2 : Connexe

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
  - H2 : Connexe

## platforms/macos.md

- Route : /platforms/macos
- Titres :
  - H2 : Télécharger
  - H2 : Première exécution
  - H2 : Choisir un mode Gateway
  - H2 : Ce que l’application possède
  - H2 : Pages détaillées macOS
  - H2 : Connexe

## platforms/oracle.md

- Route : /platforms/oracle
- Titres :
  - H2 : Connexe

## platforms/raspberry-pi.md

- Route : /platforms/raspberry-pi
- Titres :
  - H2 : Connexe

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
  - H2 : Démarrage automatique du Gateway avant la connexion Windows
  - H2 : Exposer les services WSL sur le LAN
  - H2 : Dépannage
  - H3 : L’icône de la zone de notification n’apparaît pas
  - H3 : La configuration locale échoue
  - H3 : L’application indique qu’un appairage est requis
  - H3 : Le chat web ne peut pas joindre un Gateway distant
  - H3 : Les commandes screen.snapshot, camera ou audio échouent
  - H3 : La connectivité Git ou GitHub échoue
  - H2 : Connexe

## plugins/adding-capabilities.md

- Route : /plugins/adding-capabilities
- Titres :
  - H2 : Quand créer une capacité
  - H2 : La séquence standard
  - H2 : Ce qui va où
  - H2 : Points d’extension des fournisseurs et des harnais
  - H2 : Liste de vérification des fichiers
  - H2 : Exemple détaillé : génération d’images
  - H2 : Fournisseurs d’embeddings
  - H2 : Liste de vérification de revue
  - H2 : Connexe

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
  - H2 : Connexe

## plugins/agent-tools.md

- Route : /plugins/agent-tools
- Titres :
  - H2 : Connexe

## plugins/architecture-internals.md

- Route : /plugins/architecture-internals
- Titres :
  - H2 : Pipeline de chargement
  - H3 : Comportement manifest-first
  - H3 : Limite du cache des Plugins
  - H2 : Modèle de registre
  - H2 : Rappels de liaison de conversation
  - H2 : Hooks d’exécution des fournisseurs
  - H3 : Ordre et utilisation des hooks
  - H3 : Exemple de fournisseur
  - H3 : Exemples intégrés
  - H2 : Assistants d’exécution
  - H3 : api.runtime.imageGeneration
  - H2 : Routes HTTP du Gateway
  - H2 : Chemins d’importation du SDK Plugin
  - H2 : Schémas des outils de messagerie
  - H2 : Résolution de la cible de canal
  - H2 : Répertoires adossés à la configuration
  - H2 : Catalogues de fournisseurs
  - H2 : Inspection de canal en lecture seule
  - H2 : Packs de packages
  - H3 : Métadonnées du catalogue de canaux
  - H2 : Plugins du moteur de contexte
  - H2 : Ajouter une nouvelle capacité
  - H3 : Liste de vérification de capacité
  - H3 : Modèle de capacité
  - H2 : Connexe

## plugins/architecture.md

- Route : /plugins/architecture
- Titres :
  - H2 : Modèle public de capacités
  - H3 : Position de compatibilité externe
  - H3 : Formes de Plugin
  - H3 : Hooks hérités
  - H3 : Signaux de compatibilité
  - H2 : Vue d’ensemble de l’architecture
  - H3 : Instantané des métadonnées de Plugin et table de correspondance
  - H3 : Planification de l’activation
  - H3 : Plugins de canal et outil de messagerie partagé
  - H2 : Modèle de propriété des capacités
  - H3 : Superposition des capacités
  - H3 : Exemple de Plugin d’entreprise multicapacités
  - H3 : Exemple de capacité : compréhension vidéo
  - H2 : Contrats et application
  - H3 : Ce qui appartient à un contrat
  - H2 : Modèle d’exécution
  - H2 : Limite d’exportation
  - H2 : Internes et référence
  - H2 : Connexe

## plugins/building-extensions.md

- Route : /plugins/building-extensions
- Titres :
  - H2 : Connexe

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
  - H2 : Prochaines étapes
  - H2 : Connexe

## plugins/bundles.md

- Route : /plugins/bundles
- Titres :
  - H2 : Pourquoi les bundles existent
  - H2 : Installer un bundle
  - H2 : Ce qu’OpenClaw mappe depuis les bundles
  - H3 : Pris en charge actuellement
  - H4 : Contenu des Skills
  - H4 : Packs de hooks
  - H4 : MCP pour OpenClaw intégré
  - H4 : Paramètres OpenClaw intégrés
  - H4 : LSP OpenClaw intégré
  - H3 : Détecté mais non exécuté
  - H2 : Formats de bundle
  - H2 : Priorité de détection
  - H2 : Dépendances d’exécution et nettoyage
  - H2 : Sécurité
  - H2 : Dépannage
  - H2 : Connexe

## plugins/cli-backend-plugins.md

- Route : /plugins/cli-backend-plugins
- Titres :
  - H2 : Ce que le Plugin possède
  - H2 : Plugin backend minimal
  - H2 : Forme de configuration
  - H2 : Hooks backend avancés
  - H3 : ownsNativeCompaction : désactivation de la Compaction OpenClaw
  - H2 : Pont d’outil MCP
  - H2 : Configuration utilisateur
  - H2 : Vérification
  - H2 : Liste de vérification
  - H2 : Connexe

## plugins/codex-computer-use.md

- Route : /plugins/codex-computer-use
- Titres :
  - H2 : OpenClaw.app et Peekaboo
  - H2 : Application iOS
  - H2 : MCP cua-driver direct
  - H2 : Configuration rapide
  - H2 : Commandes
  - H2 : Choix de la place de marché
  - H2 : Place de marché macOS groupée
  - H2 : Limite du catalogue distant
  - H2 : Référence de configuration
  - H2 : Ce qu’OpenClaw vérifie
  - H2 : Autorisations macOS
  - H2 : Dépannage
  - H2 : Connexe

## plugins/codex-harness-reference.md

- Route : /plugins/codex-harness-reference
- Titres :
  - H2 : Surface de configuration du Plugin
  - H2 : Transport du serveur d’application
  - H2 : Modes d’approbation et de bac à sable
  - H2 : Exécution native en bac à sable
  - H2 : Isolation de l’authentification et de l’environnement
  - H2 : Outils dynamiques
  - H2 : Délais d’expiration
  - H2 : Découverte des modèles
  - H2 : Fichiers d’amorçage de l’espace de travail
  - H2 : Remplacements d’environnement
  - H2 : Connexe

## plugins/codex-harness-runtime.md

- Route : /plugins/codex-harness-runtime
- Titres :
  - H2 : Vue d’ensemble
  - H2 : Liaisons de fil et changements de modèle
  - H2 : Réponses visibles et Heartbeats
  - H2 : Limites des hooks
  - H2 : Contrat de prise en charge V1
  - H2 : Autorisations natives et sollicitations MCP
  - H2 : Pilotage de la file d’attente
  - H2 : Téléversement des retours Codex
  - H2 : Compaction et miroir de transcription
  - H2 : Médias et livraison
  - H2 : Connexe

## plugins/codex-harness.md

- Route : /plugins/codex-harness
- Titres :
  - H2 : Exigences
  - H2 : Démarrage rapide
  - H2 : Configuration
  - H2 : Vérifier le runtime Codex
  - H2 : Routage et sélection de modèle
  - H2 : Modèles de déploiement
  - H3 : Déploiement Codex de base
  - H3 : Déploiement à fournisseurs mixtes
  - H3 : Déploiement Codex à fermeture en cas d’échec
  - H2 : Politique du serveur d’application
  - H2 : Commandes et diagnostics
  - H3 : Inspecter les fils Codex localement
  - H2 : Plugins Codex natifs
  - H2 : Computer Use
  - H2 : Limites d’exécution
  - H2 : Dépannage
  - H2 : Connexe

## plugins/codex-native-plugins.md

- Route : /plugins/codex-native-plugins
- Titres :
  - H2 : Exigences
  - H2 : Démarrage rapide
  - H2 : Gérer les Plugins depuis le chat
  - H2 : Fonctionnement de la configuration native des Plugins
  - H2 : Limite de prise en charge V1
  - H2 : Inventaire des applications et propriété
  - H2 : Configuration d’application du fil
  - H2 : Politique des actions destructrices
  - H2 : Dépannage
  - H2 : Connexe

## plugins/community.md

- Route : /plugins/community
- Titres :
  - H2 : Trouver des Plugins
  - H2 : Publier des Plugins
  - H2 : Connexe

## plugins/compatibility.md

- Route : /plugins/compatibility
- Titres :
  - H2 : Registre de compatibilité
  - H2 : Package d’inspection des Plugins
  - H3 : Voie d’acceptation du mainteneur
  - H2 : Politique d’obsolescence
  - H2 : Zones de compatibilité actuelles
  - H3 : Alias plats des rappels entrants WhatsApp
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
  - H2 : Mise en miroir de transcription
  - H2 : Questions annexes (/btw)
  - H2 : Doctor
  - H2 : Limitations
  - H2 : Autorisations et askuser
  - H3 : Jeton GitHub de niveau session
  - H2 : Connexe

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
  - H2 : OAuth et prévol
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
  - H3 : Les contrôles de configuration Twilio échouent
  - H3 : L’appel Twilio démarre mais n’entre jamais dans la réunion
  - H2 : Notes
  - H2 : Connexe

## plugins/hooks.md

- Route : /plugins/hooks
- Titres :
  - H2 : Démarrage rapide
  - H2 : Catalogue des hooks
  - H2 : Déboguer les hooks d’exécution
  - H2 : Politique d’appel d’outil
  - H3 : Hook d’environnement Exec
  - H3 : Persistance des résultats d’outil
  - H2 : Hooks de prompt et de modèle
  - H3 : Extensions de session et injections au tour suivant
  - H2 : Hooks de message
  - H2 : Hooks d’installation
  - H2 : Cycle de vie du Gateway
  - H2 : Dépréciations à venir
  - H2 : Connexe

## plugins/install-overrides.md

- Route : /plugins/install-overrides
- Titres :
  - H2 : Environnement
  - H2 : Comportement
  - H2 : E2E de paquet

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
  - H2 : Connexe

## plugins/manifest.md

- Route : /plugins/manifest
- Titres :
  - H2 : Ce que fait ce fichier
  - H2 : Exemple minimal
  - H2 : Exemple enrichi
  - H2 : Référence des champs de premier niveau
  - H2 : Référence des métadonnées de fournisseur de génération
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
  - H2 : Manifeste versus package.json
  - H3 : Champs package.json qui affectent la découverte
  - H2 : Précédence de découverte (identifiants de Plugin en double)
  - H2 : Exigences JSON Schema
  - H2 : Comportement de validation
  - H2 : Notes
  - H2 : Connexe

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
  - H3 : La longueur d’entrée dépasse la longueur de contexte
  - H3 : Modèle d’embedding non pris en charge
  - H3 : Le Plugin se charge mais aucune mémoire n’apparaît
  - H2 : Connexe

## plugins/memory-wiki.md

- Route : /plugins/memory-wiki
- Titres :
  - H2 : Ce qu’il ajoute
  - H2 : Comment il s’intègre à la mémoire
  - H2 : Modèle hybride recommandé
  - H2 : Modes de coffre
  - H3 : isolated
  - H3 : bridge
  - H3 : unsafe-local
  - H2 : Agencement du coffre
  - H2 : Importations Open Knowledge Format
  - H2 : Assertions structurées et preuves
  - H2 : Métadonnées d’entité destinées à l’agent
  - H2 : Pipeline de compilation
  - H2 : Tableaux de bord et rapports de santé
  - H2 : Recherche et récupération
  - H2 : Outils de l’agent
  - H2 : Comportement du prompt et du contexte
  - H2 : Configuration
  - H3 : Exemple : QMD + mode bridge
  - H2 : CLI
  - H2 : Prise en charge d’Obsidian
  - H2 : Flux de travail recommandé
  - H2 : Docs connexes

## plugins/message-presentation.md

- Route : /plugins/message-presentation
- Titres :
  - H2 : Contrat
  - H2 : Exemples de producteurs
  - H2 : Contrat du moteur de rendu
  - H2 : Flux de rendu du noyau
  - H2 : Règles de dégradation
  - H2 : Mappage des fournisseurs
  - H2 : Presentation vs InteractiveReply
  - H2 : Épingle de livraison
  - H2 : Liste de vérification pour les auteurs de Plugin
  - H2 : Docs connexes

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
  - H2 : Connexe

## plugins/plugin-inventory.md

- Route : /plugins/plugin-inventory
- Titres :
  - H1 : Inventaire des plugins
  - H2 : Définitions
  - H2 : Installer un Plugin
  - H2 : Paquet npm du noyau
  - H2 : Paquets externes officiels
  - H2 : Uniquement checkout source

## plugins/plugin-permission-requests.md

- Route : /plugins/plugin-permission-requests
- Titres :
  - H2 : Choisir le bon garde
  - H2 : Demander une approbation avant un appel d’outil
  - H2 : Comportement de décision
  - H2 : Acheminer les prompts d’approbation
  - H2 : Permissions natives Codex
  - H2 : Dépannage
  - H2 : Connexe

## plugins/reference.md

- Route : /plugins/reference
- Titres :
  - H1 : Référence des plugins

## plugins/reference/acpx.md

- Route : /plugins/reference/acpx
- Titres :
  - H1 : Plugin ACPx
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

## plugins/reference/admin-http-rpc.md

- Route : /plugins/reference/admin-http-rpc
- Titres :
  - H1 : Plugin Admin Http Rpc
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

## plugins/reference/alibaba.md

- Route : /plugins/reference/alibaba
- Titres :
  - H1 : Plugin Alibaba
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

## plugins/reference/amazon-bedrock-mantle.md

- Route : /plugins/reference/amazon-bedrock-mantle
- Titres :
  - H1 : Plugin Amazon Bedrock Mantle
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

## plugins/reference/amazon-bedrock.md

- Route : /plugins/reference/amazon-bedrock
- Titres :
  - H1 : Plugin Amazon Bedrock
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

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
  - H2 : Docs connexes

## plugins/reference/arcee.md

- Route : /plugins/reference/arcee
- Titres :
  - H1 : Plugin Arcee
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

## plugins/reference/azure-speech.md

- Route : /plugins/reference/azure-speech
- Titres :
  - H1 : Plugin Azure Speech
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

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
  - H2 : Docs connexes

## plugins/reference/browser.md

- Route : /plugins/reference/browser
- Titres :
  - H1 : Plugin Browser
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

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
  - H2 : Docs connexes

## plugins/reference/chutes.md

- Route : /plugins/reference/chutes
- Titres :
  - H1 : Plugin Chutes
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

## plugins/reference/clickclack.md

- Route : /plugins/reference/clickclack
- Titres :
  - H1 : Plugin Clickclack
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

## plugins/reference/cloudflare-ai-gateway.md

- Route : /plugins/reference/cloudflare-ai-gateway
- Titres :
  - H1 : Plugin Cloudflare AI Gateway
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

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
  - H2 : Docs connexes

## plugins/reference/cohere.md

- Route : /plugins/reference/cohere
- Titres :
  - H1 : Plugin Cohere
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

## plugins/reference/comfy.md

- Route : /plugins/reference/comfy
- Titres :
  - H1 : Plugin ComfyUI
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

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
  - H2 : Docs connexes

## plugins/reference/deepgram.md

- Route : /plugins/reference/deepgram
- Titres :
  - H1 : Plugin Deepgram
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

## plugins/reference/deepinfra.md

- Route : /plugins/reference/deepinfra
- Titres :
  - H1 : Plugin DeepInfra
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

## plugins/reference/deepseek.md

- Route : /plugins/reference/deepseek
- Titres :
  - H1 : Plugin DeepSeek
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

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
  - H2 : Docs connexes

## plugins/reference/document-extract.md

- Route : /plugins/reference/document-extract
- Titres :
  - H1 : Plugin Document Extract
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

## plugins/reference/duckduckgo.md

- Route : /plugins/reference/duckduckgo
- Titres :
  - H1 : Plugin DuckDuckGo
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

## plugins/reference/elevenlabs.md

- Route : /plugins/reference/elevenlabs
- Titres :
  - H1 : Plugin Elevenlabs
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

## plugins/reference/exa.md

- Route : /plugins/reference/exa
- Titres :
  - H1 : Plugin Exa
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

## plugins/reference/fal.md

- Route : /plugins/reference/fal
- Titres :
  - H1 : Plugin fal
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

## plugins/reference/feishu.md

- Route : /plugins/reference/feishu
- Titres :
  - H1 : Plugin Feishu
  - H2 : Distribution
  - H2 : Surface
  - H2 : Docs connexes

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
  - H2 : Docs connexes

## plugins/reference/fireworks.md

- Route : /plugins/reference/fireworks
- Titres :
  - H1 : Plugin Fireworks
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/github-copilot.md

- Route : /plugins/reference/github-copilot
- Titres :
  - H1 : Plugin GitHub Copilot
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/gmi.md

- Route : /plugins/reference/gmi
- Titres :
  - H1 : Plugin Gmi
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/google-meet.md

- Route : /plugins/reference/google-meet
- Titres :
  - H1 : Plugin Google Meet
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/google.md

- Route : /plugins/reference/google
- Titres :
  - H1 : Plugin Google
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/googlechat.md

- Route : /plugins/reference/googlechat
- Titres :
  - H1 : Plugin Google Chat
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/gradium.md

- Route : /plugins/reference/gradium
- Titres :
  - H1 : Plugin Gradium
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/groq.md

- Route : /plugins/reference/groq
- Titres :
  - H1 : Plugin Groq
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/huggingface.md

- Route : /plugins/reference/huggingface
- Titres :
  - H1 : Plugin Hugging Face
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/imessage.md

- Route : /plugins/reference/imessage
- Titres :
  - H1 : Plugin iMessage
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/inworld.md

- Route : /plugins/reference/inworld
- Titres :
  - H1 : Plugin Inworld
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/irc.md

- Route : /plugins/reference/irc
- Titres :
  - H1 : Plugin IRC
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/kilocode.md

- Route : /plugins/reference/kilocode
- Titres :
  - H1 : Plugin Kilocode
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/kimi.md

- Route : /plugins/reference/kimi
- Titres :
  - H1 : Plugin Kimi
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/line.md

- Route : /plugins/reference/line
- Titres :
  - H1 : Plugin LINE
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/litellm.md

- Route : /plugins/reference/litellm
- Titres :
  - H1 : Plugin LiteLLM
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/llama-cpp.md

- Route : /plugins/reference/llama-cpp
- Titres :
  - H1 : Plugin Llama Cpp
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

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
  - H2 : Documentation connexe

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
  - H2 : Documentation connexe

## plugins/reference/mattermost.md

- Route : /plugins/reference/mattermost
- Titres :
  - H1 : Plugin Mattermost
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

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
  - H2 : Documentation connexe

## plugins/reference/memory-wiki.md

- Route : /plugins/reference/memory-wiki
- Titres :
  - H1 : Plugin Memory Wiki
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

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
  - H2 : Documentation connexe

## plugins/reference/mistral.md

- Route : /plugins/reference/mistral
- Titres :
  - H1 : Plugin Mistral
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/moonshot.md

- Route : /plugins/reference/moonshot
- Titres :
  - H1 : Plugin Moonshot
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/msteams.md

- Route : /plugins/reference/msteams
- Titres :
  - H1 : Plugin Microsoft Teams
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/nextcloud-talk.md

- Route : /plugins/reference/nextcloud-talk
- Titres :
  - H1 : Plugin Nextcloud Talk
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/nostr.md

- Route : /plugins/reference/nostr
- Titres :
  - H1 : Plugin Nostr
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/novita.md

- Route : /plugins/reference/novita
- Titres :
  - H1 : Plugin Novita
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/nvidia.md

- Route : /plugins/reference/nvidia
- Titres :
  - H1 : Plugin NVIDIA
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/oc-path.md

- Route : /plugins/reference/oc-path
- Titres :
  - H1 : Plugin Oc Path
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/ollama.md

- Route : /plugins/reference/ollama
- Titres :
  - H1 : Plugin Ollama
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

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
  - H2 : Documentation connexe

## plugins/reference/opencode-go.md

- Route : /plugins/reference/opencode-go
- Titres :
  - H1 : Plugin OpenCode Go
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/opencode.md

- Route : /plugins/reference/opencode
- Titres :
  - H1 : Plugin OpenCode
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/openrouter.md

- Route : /plugins/reference/openrouter
- Titres :
  - H1 : Plugin OpenRouter
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

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
  - H2 : Documentation connexe

## plugins/reference/pixverse.md

- Route : /plugins/reference/pixverse
- Titres :
  - H1 : Plugin PixVerse
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/policy.md

- Route : /plugins/reference/policy
- Titres :
  - H1 : Plugin Policy
  - H2 : Distribution
  - H2 : Surface
  - H2 : Comportement
  - H2 : Documentation connexe

## plugins/reference/qa-channel.md

- Route : /plugins/reference/qa-channel
- Titres :
  - H1 : Plugin QA Channel
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

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
  - H2 : Documentation connexe

## plugins/reference/qqbot.md

- Route : /plugins/reference/qqbot
- Titres :
  - H1 : Plugin QQ Bot
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/qwen.md

- Route : /plugins/reference/qwen
- Titres :
  - H1 : Plugin Qwen
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/raft.md

- Route : /plugins/reference/raft
- Titres :
  - H1 : Plugin Raft
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/runway.md

- Route : /plugins/reference/runway
- Titres :
  - H1 : Plugin Runway
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

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
  - H2 : Documentation connexe

## plugins/reference/sglang.md

- Route : /plugins/reference/sglang
- Titres :
  - H1 : Plugin SGLang
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/signal.md

- Route : /plugins/reference/signal
- Titres :
  - H1 : Plugin Signal
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/slack.md

- Route : /plugins/reference/slack
- Titres :
  - H1 : Plugin Slack
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/sms.md

- Route : /plugins/reference/sms
- Titres :
  - H1 : Plugin Sms
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/stepfun.md

- Route : /plugins/reference/stepfun
- Titres :
  - H1 : Plugin StepFun
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/synology-chat.md

- Route : /plugins/reference/synology-chat
- Titres :
  - H1 : Plugin Synology Chat
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/synthetic.md

- Route : /plugins/reference/synthetic
- Titres :
  - H1 : Plugin Synthetic
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/tavily.md

- Route : /plugins/reference/tavily
- Titres :
  - H1 : Plugin Tavily
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/telegram.md

- Route : /plugins/reference/telegram
- Titres :
  - H1 : Plugin Telegram
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/tencent.md

- Route : /plugins/reference/tencent
- Titres :
  - H1 : Plugin Tencent
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/tlon.md

- Route : /plugins/reference/tlon
- Titres :
  - H1 : Plugin Tlon
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/together.md

- Route : /plugins/reference/together
- Titres :
  - H1 : Plugin Together
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

## plugins/reference/tokenjuice.md

- Route : /plugins/reference/tokenjuice
- Titres :
  - H1 : Plugin Tokenjuice
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation connexe

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
  - H2 : Documentation connexe

## plugins/reference/venice.md

- Route : /plugins/reference/venice
- En-têtes :
  - H1 : Plugin Venice
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/vercel-ai-gateway.md

- Route : /plugins/reference/vercel-ai-gateway
- En-têtes :
  - H1 : Plugin Vercel AI Gateway
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/vllm.md

- Route : /plugins/reference/vllm
- En-têtes :
  - H1 : Plugin vLLM
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/voice-call.md

- Route : /plugins/reference/voice-call
- En-têtes :
  - H1 : Plugin d’appel vocal
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/volcengine.md

- Route : /plugins/reference/volcengine
- En-têtes :
  - H1 : Plugin Volcengine
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/voyage.md

- Route : /plugins/reference/voyage
- En-têtes :
  - H1 : Plugin Voyage
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/vydra.md

- Route : /plugins/reference/vydra
- En-têtes :
  - H1 : Plugin Vydra
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/web-readability.md

- Route : /plugins/reference/web-readability
- En-têtes :
  - H1 : Plugin de lisibilité Web
  - H2 : Distribution
  - H2 : Surface

## plugins/reference/webhooks.md

- Route : /plugins/reference/webhooks
- En-têtes :
  - H1 : Plugin Webhooks
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/whatsapp.md

- Route : /plugins/reference/whatsapp
- En-têtes :
  - H1 : Plugin WhatsApp
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/workboard.md

- Route : /plugins/reference/workboard
- En-têtes :
  - H1 : Plugin Workboard
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/xai.md

- Route : /plugins/reference/xai
- En-têtes :
  - H1 : Plugin xAI
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/xiaomi.md

- Route : /plugins/reference/xiaomi
- En-têtes :
  - H1 : Plugin Xiaomi
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/zai.md

- Route : /plugins/reference/zai
- En-têtes :
  - H1 : Plugin Z.AI
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/zalo.md

- Route : /plugins/reference/zalo
- En-têtes :
  - H1 : Plugin Zalo
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/reference/zalouser.md

- Route : /plugins/reference/zalouser
- En-têtes :
  - H1 : Plugin personnel Zalo
  - H2 : Distribution
  - H2 : Surface
  - H2 : Documentation associée

## plugins/sdk-agent-harness.md

- Route : /plugins/sdk-agent-harness
- En-têtes :
  - H2 : Quand utiliser un harness
  - H2 : Ce que le noyau possède encore
  - H2 : Enregistrer un harness
  - H2 : Politique de sélection
  - H2 : Association fournisseur et harness
  - H3 : Middleware de résultats d’outils
  - H3 : Classification du résultat terminal
  - H3 : Effets secondaires côté fin d’agent
  - H3 : Saisie utilisateur et surfaces d’outils
  - H3 : Mode harness Codex natif
  - H2 : Rigueur du runtime
  - H2 : Sessions natives et miroir de transcription
  - H2 : Résultats d’outils et de médias
  - H2 : Limites actuelles
  - H2 : Associé

## plugins/sdk-channel-inbound.md

- Route : /plugins/sdk-channel-inbound
- En-têtes :
  - H2 : Assistants du noyau
  - H2 : Migration

## plugins/sdk-channel-ingress.md

- Route : /plugins/sdk-channel-ingress
- En-têtes :
  - H1 : API d’entrée de canal
  - H2 : Résolveur de runtime
  - H2 : Résultat
  - H2 : Groupes d’accès
  - H2 : Modes d’événement
  - H2 : Routes et activation
  - H2 : Rédaction
  - H2 : Vérification

## plugins/sdk-channel-message.md

- Route : /plugins/sdk-channel-message
- En-têtes : aucun

## plugins/sdk-channel-outbound.md

- Route : /plugins/sdk-channel-outbound
- En-têtes :
  - H2 : Adaptateur
  - H2 : Adaptateurs sortants existants
  - H2 : Envois durables
  - H2 : Distribution de compatibilité

## plugins/sdk-channel-plugins.md

- Route : /plugins/sdk-channel-plugins
- En-têtes :
  - H2 : Fonctionnement des Plugins de canal
  - H2 : Approbations et capacités de canal
  - H2 : Politique de mention entrante
  - H2 : Guide pas à pas
  - H2 : Structure des fichiers
  - H2 : Sujets avancés
  - H2 : Étapes suivantes
  - H2 : Associé

## plugins/sdk-channel-turn.md

- Route : /plugins/sdk-channel-turn
- En-têtes : aucun

## plugins/sdk-entrypoints.md

- Route : /plugins/sdk-entrypoints
- En-têtes :
  - H2 : defineToolPlugin
  - H2 : definePluginEntry
  - H2 : defineChannelPluginEntry
  - H2 : defineSetupPluginEntry
  - H2 : Mode d’enregistrement
  - H2 : Formes de Plugin
  - H2 : Associé

## plugins/sdk-migration.md

- Route : /plugins/sdk-migration
- En-têtes :
  - H2 : Ce qui change
  - H2 : Pourquoi cela a changé
  - H2 : Plan de migration pour la voix conversationnelle et en temps réel
  - H2 : Politique de compatibilité
  - H2 : Comment migrer
  - H2 : Référence des chemins d’import
  - H2 : Dépréciations actives
  - H2 : Calendrier de suppression
  - H2 : Supprimer temporairement les avertissements
  - H2 : Associé

## plugins/sdk-overview.md

- Route : /plugins/sdk-overview
- En-têtes :
  - H2 : Convention d’import
  - H2 : Référence des sous-chemins
  - H2 : API d’enregistrement
  - H3 : Enregistrement de capacité
  - H3 : Outils et commandes
  - H3 : Infrastructure
  - H3 : Hooks d’hôte pour les Plugins de workflow
  - H3 : Enregistrement de découverte Gateway
  - H3 : Métadonnées d’enregistrement CLI
  - H3 : Enregistrement du backend CLI
  - H3 : Emplacements exclusifs
  - H3 : Adaptateurs d’intégration mémoire dépréciés
  - H3 : Événements et cycle de vie
  - H3 : Sémantique de décision des hooks
  - H3 : Champs d’objet API
  - H2 : Convention des modules internes
  - H2 : Associé

## plugins/sdk-provider-plugins.md

- Route : /plugins/sdk-provider-plugins
- En-têtes :
  - H2 : Guide pas à pas
  - H2 : Publier sur ClawHub
  - H2 : Structure des fichiers
  - H2 : Référence de l’ordre du catalogue
  - H2 : Étapes suivantes
  - H2 : Associé

## plugins/sdk-runtime.md

- Route : /plugins/sdk-runtime
- En-têtes :
  - H2 : Chargement et écritures de configuration
  - H2 : Utilitaires de runtime réutilisables
  - H2 : Espaces de noms de runtime
  - H2 : Stockage des références de runtime
  - H2 : Autres champs api de premier niveau
  - H2 : Associé

## plugins/sdk-setup.md

- Route : /plugins/sdk-setup
- En-têtes :
  - H2 : Métadonnées de package
  - H3 : Champs openclaw
  - H3 : openclaw.channel
  - H3 : openclaw.install
  - H3 : Chargement complet différé
  - H2 : Manifeste de Plugin
  - H2 : Publication ClawHub
  - H2 : Entrée de configuration
  - H3 : Imports étroits d’assistants de configuration
  - H3 : Promotion de compte unique possédée par le canal
  - H2 : Schéma de configuration
  - H3 : Construire des schémas de configuration de canal
  - H2 : Assistants de configuration
  - H2 : Publication et installation
  - H2 : Associé

## plugins/sdk-subpaths.md

- Route : /plugins/sdk-subpaths
- En-têtes :
  - H2 : Entrée de Plugin
  - H3 : Compatibilité et assistants de test dépréciés
  - H3 : Sous-chemins d’assistants réservés aux Plugins groupés
  - H2 : Associé

## plugins/sdk-testing.md

- Route : /plugins/sdk-testing
- En-têtes :
  - H2 : Utilitaires de test
  - H3 : Exports disponibles
  - H3 : Types
  - H2 : Test de la résolution de cible
  - H2 : Modèles de test
  - H3 : Tester les contrats d’enregistrement
  - H3 : Tester l’accès à la configuration du runtime
  - H3 : Tester unitairement un Plugin de canal
  - H3 : Tester unitairement un Plugin de fournisseur
  - H3 : Simuler le runtime de Plugin
  - H3 : Tester avec des stubs par instance
  - H2 : Tests de contrat (Plugins dans le dépôt)
  - H3 : Exécuter des tests ciblés
  - H2 : Application du lint (Plugins dans le dépôt)
  - H2 : Configuration de test
  - H2 : Associé

## plugins/tool-plugins.md

- Route : /plugins/tool-plugins
- En-têtes :
  - H2 : Exigences
  - H2 : Démarrage rapide
  - H2 : Écrire un outil
  - H2 : Outils optionnels et fabriques d’outils
  - H2 : Valeurs de retour
  - H2 : Configuration
  - H2 : Métadonnées générées
  - H2 : Métadonnées de package
  - H2 : Valider dans la CI
  - H2 : Installer et inspecter localement
  - H2 : Publier
  - H2 : Dépannage
  - H3 : entrée de Plugin introuvable : ./dist/index.js
  - H3 : l’entrée de Plugin n’expose pas les métadonnées defineToolPlugin
  - H3 : les métadonnées générées openclaw.plugin.json sont obsolètes
  - H3 : package.json openclaw.extensions doit inclure ./dist/index.js
  - H3 : Impossible de trouver le package 'typebox'
  - H3 : L’outil n’apparaît pas après l’installation
  - H2 : Voir aussi

## plugins/voice-call.md

- Route : /plugins/voice-call
- En-têtes :
  - H2 : Démarrage rapide
  - H2 : Configuration
  - H2 : Portée de session
  - H2 : Conversations vocales en temps réel
  - H3 : Politique d’outils
  - H3 : Contexte vocal de l’agent
  - H3 : Exemples de fournisseurs temps réel
  - H2 : Transcription en streaming
  - H3 : Exemples de fournisseurs de streaming
  - H2 : TTS pour les appels
  - H3 : Exemples TTS
  - H2 : Appels entrants
  - H3 : Routage par numéro
  - H3 : Contrat de sortie vocale
  - H3 : Comportement de démarrage de conversation
  - H3 : Délai de grâce de déconnexion du flux Twilio
  - H2 : Nettoyeur d’appels obsolètes
  - H2 : Sécurité Webhook
  - H2 : CLI
  - H2 : Outil d’agent
  - H2 : RPC Gateway
  - H2 : Dépannage
  - H3 : La configuration échoue à exposer le Webhook
  - H3 : Les identifiants du fournisseur échouent
  - H3 : Les appels démarrent, mais les Webhooks du fournisseur n’arrivent pas
  - H3 : La vérification de signature échoue
  - H3 : Les connexions Google Meet Twilio échouent
  - H3 : L’appel en temps réel n’a pas de parole
  - H2 : Associé

## plugins/webhooks.md

- Route : /plugins/webhooks
- En-têtes :
  - H2 : Où il s’exécute
  - H2 : Configurer les routes
  - H2 : Modèle de sécurité
  - H2 : Format de requête
  - H2 : Actions prises en charge
  - H3 : createflow
  - H3 : runtask
  - H2 : Forme de réponse
  - H2 : Documentation associée

## plugins/workboard.md

- Route : /plugins/workboard
- En-têtes :
  - H2 : État par défaut
  - H2 : Ce que contiennent les cartes
  - H2 : Exécutions de cartes et tâches
  - H2 : Coordination des agents
  - H3 : Sélection du worker de distribution
  - H3 : Prompt du worker et cycle de vie
  - H3 : Points d’entrée de distribution
  - H2 : CLI et commande slash
  - H2 : Synchronisation du cycle de vie des sessions
  - H2 : Workflow du tableau de bord
  - H2 : Autorisations
  - H2 : Configuration
  - H2 : Dépannage
  - H3 : L’onglet indique que Workboard est indisponible
  - H3 : Les cartes ne s’enregistrent pas
  - H3 : Le démarrage d’une carte n’ouvre pas la session attendue
  - H3 : La distribution ne démarre pas de worker
  - H2 : Associé

## plugins/zalouser.md

- Route : /plugins/zalouser
- En-têtes :
  - H2 : Nommage
  - H2 : Où il s’exécute
  - H2 : Installer
  - H3 : Option A : installer depuis npm
  - H3 : Option B : installer depuis un dossier local (dev)
  - H2 : Configuration
  - H2 : CLI
  - H2 : Outil d’agent
  - H2 : Associé

## prose.md

- Route : /prose
- En-têtes :
  - H2 : Installer
  - H2 : Commande slash
  - H2 : Ce qu’il peut faire
  - H2 : Exemple : recherche et synthèse parallèles
  - H2 : Correspondance avec le runtime OpenClaw
  - H2 : Emplacements des fichiers
  - H2 : Backends d’état
  - H2 : Sécurité
  - H2 : Associé

## providers/alibaba.md

- Route : /providers/alibaba
- En-têtes :
  - H2 : Bien démarrer
  - H2 : Modèles Wan intégrés
  - H2 : Capacités et limites
  - H2 : Configuration avancée
  - H2 : Associé

## providers/anthropic.md

- Route : /providers/anthropic
- En-têtes :
  - H2 : Bien démarrer
  - H2 : Valeurs par défaut de réflexion (Claude Fable 5, 4.8 et 4.6)
  - H2 : Mise en cache des prompts
  - H2 : Configuration avancée
  - H2 : Dépannage
  - H2 : Associé

## providers/arcee.md

- Route : /providers/arcee
- En-têtes :
  - H2 : Installer le Plugin
  - H2 : Bien démarrer
  - H2 : Configuration non interactive
  - H2 : Catalogue intégré
  - H2 : Fonctionnalités prises en charge
  - H2 : Associé

## providers/azure-speech.md

- Route : /providers/azure-speech
- En-têtes :
  - H2 : Bien démarrer
  - H2 : Options de configuration
  - H2 : Notes
  - H2 : Associé

## providers/bedrock-mantle.md

- Route : /providers/bedrock-mantle
- En-têtes :
  - H2 : Bien démarrer
  - H2 : Découverte automatique des modèles
  - H3 : Régions prises en charge
  - H2 : Configuration manuelle
  - H2 : Configuration avancée
  - H2 : Associé

## providers/bedrock.md

- Route : /providers/bedrock
- En-têtes :
  - H2 : Bien démarrer
  - H2 : Découverte automatique des modèles
  - H2 : Configuration rapide (chemin AWS)
  - H2 : Configuration avancée
  - H2 : Associé

## providers/cerebras.md

- Route : /providers/cerebras
- En-têtes :
  - H2 : Installer le Plugin
  - H2 : Bien démarrer
  - H2 : Configuration non interactive
  - H2 : Catalogue intégré
  - H2 : Configuration manuelle
  - H2 : Associé

## providers/chutes.md

- Route : /providers/chutes
- En-têtes :
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
  - H2: Pourquoi l’utiliser ?
  - H2: Fonctionnement
  - H2: Démarrage
  - H2: Catalogue intégré
  - H2: Configuration avancée
  - H2: Notes
  - H2: Voir aussi

## providers/cloudflare-ai-gateway.md

- Itinéraire : /providers/cloudflare-ai-gateway
- Titres :
  - H2: Installer le plugin
  - H2: Démarrage
  - H2: Exemple non interactif
  - H2: Configuration avancée
  - H2: Voir aussi

## providers/cohere.md

- Itinéraire : /providers/cohere
- Titres :
  - H2: Démarrer
  - H2: Configuration uniquement par l’environnement
  - H2: Voir aussi

## providers/comfy.md

- Itinéraire : /providers/comfy
- Titres :
  - H2: Ce qu’il prend en charge
  - H2: Démarrage
  - H2: Configuration
  - H3: Clés partagées
  - H3: Clés par capacité
  - H2: Détails du workflow
  - H2: Voir aussi

## providers/deepgram.md

- Itinéraire : /providers/deepgram
- Titres :
  - H2: Démarrage
  - H2: Options de configuration
  - H2: STT en streaming pour les appels vocaux
  - H2: Notes
  - H2: Voir aussi

## providers/deepinfra.md

- Itinéraire : /providers/deepinfra
- Titres :
  - H2: Installer le plugin
  - H2: Obtenir une clé API
  - H2: Configuration CLI
  - H2: Extrait de configuration
  - H2: Surfaces OpenClaw prises en charge
  - H2: Modèles disponibles
  - H2: Notes
  - H2: Voir aussi

## providers/deepseek.md

- Itinéraire : /providers/deepseek
- Titres :
  - H2: Installer le plugin
  - H2: Démarrage
  - H2: Catalogue intégré
  - H2: Raisonnement et outils
  - H2: Tests en direct
  - H2: Exemple de configuration
  - H2: Voir aussi

## providers/ds4.md

- Itinéraire : /providers/ds4
- Titres :
  - H2: Prérequis
  - H2: Démarrage rapide
  - H2: Configuration complète
  - H2: Démarrage à la demande
  - H2: Think Max
  - H2: Test
  - H2: Dépannage
  - H2: Voir aussi

## providers/elevenlabs.md

- Itinéraire : /providers/elevenlabs
- Titres :
  - H2: Authentification
  - H2: Synthèse vocale
  - H2: Reconnaissance vocale
  - H2: STT en streaming
  - H2: Voir aussi

## providers/fal.md

- Itinéraire : /providers/fal
- Titres :
  - H2: Démarrage
  - H2: Génération d’images
  - H2: Génération de vidéos
  - H2: Génération de musique
  - H2: Voir aussi

## providers/fireworks.md

- Itinéraire : /providers/fireworks
- Titres :
  - H2: Démarrage
  - H2: Configuration non interactive
  - H2: Catalogue intégré
  - H2: ID de modèles Fireworks personnalisés
  - H2: Voir aussi

## providers/github-copilot.md

- Itinéraire : /providers/github-copilot
- Titres :
  - H2: Trois façons d’utiliser Copilot dans OpenClaw
  - H2: Indicateurs facultatifs
  - H2: Intégration non interactive
  - H2: Embeddings de recherche mémoire
  - H3: Configuration
  - H3: Fonctionnement
  - H2: Voir aussi

## providers/gmi.md

- Itinéraire : /providers/gmi
- Titres :
  - H2: Configuration
  - H2: Valeurs par défaut
  - H2: Quand choisir GMI
  - H2: Modèles
  - H2: Dépannage
  - H2: Voir aussi

## providers/google.md

- Itinéraire : /providers/google
- Titres :
  - H2: Démarrage
  - H2: Capacités
  - H2: Recherche Web
  - H2: Génération d’images
  - H2: Génération de vidéos
  - H2: Génération de musique
  - H2: Synthèse vocale
  - H2: Voix en temps réel
  - H2: Configuration avancée
  - H2: Voir aussi

## providers/gradium.md

- Itinéraire : /providers/gradium
- Titres :
  - H2: Installer le plugin
  - H2: Configuration
  - H2: Configuration
  - H2: Voix
  - H3: Remplacement de voix par message
  - H2: Sortie
  - H2: Ordre de sélection automatique
  - H2: Voir aussi

## providers/groq.md

- Itinéraire : /providers/groq
- Titres :
  - H2: Installer le plugin
  - H2: Démarrage
  - H3: Exemple de fichier de configuration
  - H2: Catalogue intégré
  - H2: Modèles de raisonnement
  - H2: Transcription audio
  - H2: Voir aussi

## providers/huggingface.md

- Itinéraire : /providers/huggingface
- Titres :
  - H2: Démarrage
  - H3: Configuration non interactive
  - H2: ID de modèles
  - H2: Configuration avancée
  - H2: Voir aussi

## providers/index.md

- Itinéraire : /providers
- Titres :
  - H2: Démarrage rapide
  - H2: Documentation des fournisseurs
  - H2: Pages de vue d’ensemble partagées
  - H2: Fournisseurs de transcription
  - H2: Outils communautaires

## providers/inferrs.md

- Itinéraire : /providers/inferrs
- Titres :
  - H2: Démarrage
  - H2: Exemple de configuration complète
  - H2: Démarrage à la demande
  - H2: Configuration avancée
  - H2: Dépannage
  - H2: Voir aussi

## providers/inworld.md

- Itinéraire : /providers/inworld
- Titres :
  - H2: Installer le plugin
  - H2: Démarrage
  - H2: Options de configuration
  - H2: Notes
  - H2: Voir aussi

## providers/kilocode.md

- Itinéraire : /providers/kilocode
- Titres :
  - H2: Installer le plugin
  - H2: Démarrage
  - H2: Modèle par défaut
  - H2: Catalogue intégré
  - H2: Exemple de configuration
  - H2: Voir aussi

## providers/litellm.md

- Itinéraire : /providers/litellm
- Titres :
  - H2: Démarrage rapide
  - H2: Configuration
  - H3: Variables d’environnement
  - H3: Fichier de configuration
  - H2: Configuration avancée
  - H3: Génération d’images
  - H2: Voir aussi

## providers/lmstudio.md

- Itinéraire : /providers/lmstudio
- Titres :
  - H2: Démarrage rapide
  - H2: Intégration non interactive
  - H2: Configuration
  - H3: Compatibilité de l’utilisation en streaming
  - H3: Compatibilité du raisonnement
  - H3: Configuration explicite
  - H2: Dépannage
  - H3: LM Studio non détecté
  - H3: Erreurs d’authentification (HTTP 401)
  - H3: Chargement de modèle juste-à-temps
  - H3: Hôte LM Studio sur LAN ou tailnet
  - H2: Voir aussi

## providers/minimax.md

- Itinéraire : /providers/minimax
- Titres :
  - H2: Catalogue intégré
  - H2: Démarrage
  - H2: Configurer via openclaw configure
  - H2: Capacités
  - H3: Génération d’images
  - H3: Synthèse vocale
  - H3: Génération de musique
  - H3: Génération de vidéos
  - H3: Compréhension d’images
  - H3: Recherche Web
  - H2: Configuration avancée
  - H2: Notes
  - H2: Dépannage
  - H2: Voir aussi

## providers/mistral.md

- Itinéraire : /providers/mistral
- Titres :
  - H2: Démarrage
  - H2: Catalogue LLM intégré
  - H2: Transcription audio (Voxtral)
  - H2: STT en streaming pour les appels vocaux
  - H2: Configuration avancée
  - H2: Voir aussi

## providers/models.md

- Itinéraire : /providers/models
- Titres :
  - H2: Démarrage rapide (deux étapes)
  - H2: Fournisseurs pris en charge (ensemble de départ)
  - H2: Variantes de fournisseurs supplémentaires
  - H2: Voir aussi

## providers/moonshot.md

- Itinéraire : /providers/moonshot
- Titres :
  - H2: Catalogue de modèles intégré
  - H2: Démarrage
  - H2: Recherche Web Kimi
  - H2: Configuration avancée
  - H2: Voir aussi

## providers/novita.md

- Itinéraire : /providers/novita
- Titres :
  - H2: Configuration
  - H2: Valeurs par défaut
  - H2: Quand choisir Novita
  - H2: Modèles
  - H2: Dépannage
  - H2: Voir aussi

## providers/nvidia.md

- Itinéraire : /providers/nvidia
- Titres :
  - H2: Démarrage
  - H2: Exemple de configuration
  - H2: Catalogue mis en avant
  - H2: Nemotron 3 Ultra
  - H2: Catalogue de secours inclus
  - H2: Configuration avancée
  - H2: Voir aussi

## providers/ollama-cloud.md

- Itinéraire : /providers/ollama-cloud
- Titres :
  - H2: Configuration
  - H2: Valeurs par défaut
  - H2: Quand choisir Ollama Cloud
  - H2: Modèles
  - H2: Test en direct
  - H2: Dépannage
  - H2: Voir aussi

## providers/ollama.md

- Itinéraire : /providers/ollama
- Titres :
  - H2: Règles d’authentification
  - H2: Démarrage
  - H2: Modèles cloud
  - H2: Découverte de modèles (fournisseur implicite)
  - H2: Vision et description d’image
  - H2: Configuration
  - H2: Recettes courantes
  - H3: Sélection de modèle
  - H3: Vérification rapide
  - H2: Recherche Web Ollama
  - H2: Configuration avancée
  - H2: Dépannage
  - H2: Voir aussi

## providers/openai.md

- Itinéraire : /providers/openai
- Titres :
  - H2: Choix rapide
  - H2: Correspondance des noms
  - H2: Aperçu limité de GPT-5.6
  - H2: Couverture des fonctionnalités OpenClaw
  - H2: Embeddings mémoire
  - H2: Démarrage
  - H2: Authentification native du serveur d’app Codex
  - H2: Génération d’images
  - H2: Génération de vidéos
  - H2: Contribution aux prompts GPT-5
  - H2: Voix et parole
  - H2: Points de terminaison Azure OpenAI
  - H3: Configuration
  - H3: Version de l’API
  - H3: Les noms de modèles sont des noms de déploiement
  - H3: Disponibilité régionale
  - H3: Différences de paramètres
  - H2: Configuration avancée
  - H2: Voir aussi

## providers/opencode-go.md

- Itinéraire : /providers/opencode-go
- Titres :
  - H2: Catalogue intégré
  - H2: Démarrage
  - H2: Exemple de configuration
  - H2: Configuration avancée
  - H2: Voir aussi

## providers/opencode.md

- Itinéraire : /providers/opencode
- Titres :
  - H2: Démarrage
  - H2: Exemple de configuration
  - H2: Catalogues intégrés
  - H3: Zen
  - H3: Go
  - H2: Configuration avancée
  - H2: Voir aussi

## providers/openrouter.md

- Itinéraire : /providers/openrouter
- Titres :
  - H2: Démarrage
  - H2: Exemple de configuration
  - H2: Références de modèles
  - H2: Génération d’images
  - H2: Génération de vidéos
  - H2: Génération de musique
  - H2: Synthèse vocale
  - H2: Reconnaissance vocale (audio entrant)
  - H2: Routeur de fusion
  - H2: Authentification et en-têtes
  - H2: Configuration avancée
  - H2: Voir aussi

## providers/perplexity-provider.md

- Itinéraire : /providers/perplexity-provider
- Titres :
  - H2: Installer le plugin
  - H2: Démarrage
  - H2: Modes de recherche
  - H2: Filtrage de l’API native
  - H2: Configuration avancée
  - H2: Voir aussi

## providers/pixverse.md

- Itinéraire : /providers/pixverse
- Titres :
  - H2: Démarrage
  - H2: Modes et modèles pris en charge
  - H2: Options du fournisseur
  - H2: Configuration
  - H2: Configuration avancée
  - H2: Voir aussi

## providers/qianfan.md

- Itinéraire : /providers/qianfan
- Titres :
  - H2: Installer le plugin
  - H2: Démarrage
  - H2: Catalogue intégré
  - H2: Exemple de configuration
  - H2: Voir aussi

## providers/qwen-oauth.md

- Itinéraire : /providers/qwen-oauth
- Titres :
  - H2: Configuration
  - H2: Valeurs par défaut
  - H2: Différences avec Qwen
  - H2: Quand choisir Qwen OAuth / Portal
  - H2: Modèles
  - H2: Migration
  - H2: Dépannage
  - H2: Voir aussi

## providers/qwen.md

- Itinéraire : /providers/qwen
- Titres :
  - H2: Installer le plugin
  - H2: Démarrage
  - H2: Types d’offres et points de terminaison
  - H2: Catalogue intégré
  - H2: Contrôles du raisonnement
  - H2: Modules multimodaux complémentaires
  - H2: Configuration avancée
  - H2: Voir aussi

## providers/runway.md

- Itinéraire : /providers/runway
- Titres :
  - H2: Démarrage
  - H2: Modes et modèles pris en charge
  - H2: Configuration
  - H2: Configuration avancée
  - H2: Voir aussi

## providers/senseaudio.md

- Itinéraire : /providers/senseaudio
- Titres :
  - H2: Démarrage
  - H2: Options
  - H2: Voir aussi

## providers/sglang.md

- Itinéraire : /providers/sglang
- Titres :
  - H2: Démarrage
  - H2: Découverte de modèles (fournisseur implicite)
  - H2: Configuration explicite (modèles manuels)
  - H2: Configuration avancée
  - H2: Voir aussi

## providers/stepfun.md

- Itinéraire : /providers/stepfun
- Titres :
  - H2: Installer le plugin
  - H2: Vue d’ensemble des régions et des points de terminaison
  - H2: Catalogue intégré
  - H2: Démarrage
  - H2: Configuration avancée
  - H2: Voir aussi

## providers/synthetic.md

- Itinéraire : /providers/synthetic
- Titres :
  - H2: Démarrage
  - H2: Exemple de configuration
  - H2: Catalogue intégré
  - H2: Voir aussi

## providers/tencent.md

- Itinéraire : /providers/tencent
- Titres :
  - H2: Démarrage rapide
  - H2: Configuration non interactive
  - H2: Catalogue intégré
  - H2: Tarification par paliers
  - H2: Configuration avancée
  - H2: Voir aussi

## providers/together.md

- Itinéraire : /providers/together
- Titres :
  - H2: Démarrage
  - H3: Exemple non interactif
  - H2: Catalogue intégré
  - H2: Génération de vidéos
  - H2: Voir aussi

## providers/venice.md

- Itinéraire : /providers/venice
- Titres :
  - H2: Pourquoi Venice dans OpenClaw
  - H2: Modes de confidentialité
  - H2: Fonctionnalités
  - H2: Démarrage
  - H2: Sélection de modèle
  - H2: Comportement de relecture DeepSeek V4
  - H2: Catalogue intégré (41 au total)
  - H2: Découverte de modèles
  - H2: Streaming et prise en charge des outils
  - H2: Tarification
  - H3: Venice (anonymisé) vs API directe
  - H2: Exemples d’utilisation
  - H2: Dépannage
  - H2: Configuration avancée
  - H2: Voir aussi

## providers/vercel-ai-gateway.md

- Itinéraire : /providers/vercel-ai-gateway
- Titres :
  - H2: Démarrage
  - H2: Exemple non interactif
  - H2: Raccourci d’ID de modèle
  - H2: Configuration avancée
  - H2: Voir aussi

## providers/vllm.md

- Itinéraire : /providers/vllm
- Titres :
  - H2: Démarrage
  - H2: Découverte de modèles (fournisseur implicite)
  - H2: Configuration explicite (modèles manuels)
  - H2: Configuration avancée
  - H2: Dépannage
  - H2: Voir aussi

## providers/volcengine.md

- Route : /providers/volcengine
- Titres :
  - H2 : Premiers pas
  - H2 : Fournisseurs et points de terminaison
  - H2 : Catalogue intégré
  - H2 : Synthèse vocale
  - H2 : Configuration avancée
  - H2 : Articles connexes

## providers/vydra.md

- Route : /providers/vydra
- Titres :
  - H2 : Configuration
  - H2 : Capacités
  - H2 : Articles connexes

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
  - H2 : Articles connexes

## providers/xiaomi.md

- Route : /providers/xiaomi
- Titres :
  - H2 : Premiers pas
  - H2 : Catalogue à l’usage
  - H2 : Catalogue Token Plan
  - H2 : Synthèse vocale
  - H2 : Exemple de configuration
  - H2 : Articles connexes

## providers/zai.md

- Route : /providers/zai
- Titres :
  - H2 : Modèles GLM
  - H2 : Premiers pas
  - H2 : Exemple de configuration
  - H2 : Catalogue intégré
  - H2 : Configuration avancée
  - H2 : Articles connexes

## refactor/access.md

- Route : /refactor/access
- Titres : aucun

## refactor/acp.md

- Route : /refactor/acp
- Titres :
  - H2 : Objectifs
  - H2 : Non-objectifs
  - H2 : Modèle cible
  - H3 : Identité de l’instance Gateway
  - H3 : Propriété des sessions ACP
  - H3 : Baux de processus ACPX
  - H2 : Contrôleur de cycle de vie
  - H2 : Contrat du wrapper
  - H2 : Contrat de visibilité des sessions
  - H2 : Plan de migration
  - H3 : Phase 1 : ajouter l’identité et les baux
  - H3 : Phase 2 : nettoyage fondé d’abord sur les baux
  - H3 : Phase 3 : purge au démarrage fondée d’abord sur les baux
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
  - H2 : Non-objectifs
  - H2 : État actuel de la branche
  - H2 : Forme cible
  - H2 : Étapes de migration
  - H2 : Liste de contrôle d’audit
  - H2 : Commandes de vérification

## refactor/database-first.md

- Route : /refactor/database-first
- Titres :
  - H1 : Refactorisation d’état Database-First
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
  - H2 : Inventaire des migrations
  - H2 : Plan de migration
  - H3 : Phase 0 : figer la frontière
  - H3 : Phase 1 : terminer le plan de contrôle global
  - H3 : Phase 2 : introduire les bases de données par agent
  - H3 : Phase 3 : remplacer les API du magasin de sessions
  - H3 : Phase 4 : déplacer les transcriptions, les flux ACP, les trajectoires et le VFS
  - H3 : Phase 5 : sauvegarder, restaurer, passer Vacuum et vérifier
  - H3 : Phase 6 : runtime worker
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
  - H2 : Réglages de sécurité par défaut
  - H2 : Vérification préalable des solutions existantes
  - H2 : Démarrage de session (obligatoire)
  - H2 : Âme (obligatoire)
  - H2 : Espaces partagés (recommandé)
  - H2 : Système de mémoire (recommandé)
  - H2 : Outils et Skills
  - H2 : Conseil de sauvegarde (recommandé)
  - H2 : Ce que fait OpenClaw
  - H2 : Skills de base (à activer dans Paramètres → Skills)
  - H2 : Notes d’utilisation
  - H2 : Articles connexes

## reference/RELEASING.md

- Route : /reference/RELEASING
- Titres :
  - H2 : Nommage des versions
  - H2 : Cadence de publication
  - H2 : Liste de contrôle de l’opérateur de publication
  - H2 : Clôture de la branche main stable
  - H2 : Vérification préalable de publication
  - H2 : Boîtes de test de publication
  - H3 : Vitest
  - H3 : Docker
  - H3 : QA Lab
  - H3 : Package
  - H2 : Automatisation de publication
  - H2 : Entrées du workflow NPM
  - H2 : Séquence de publication npm stable
  - H2 : Références publiques
  - H2 : Articles connexes

## reference/api-usage-costs.md

- Route : /reference/api-usage-costs
- Titres :
  - H2 : Où les coûts apparaissent (chat + CLI)
  - H2 : Comment les clés sont découvertes
  - H2 : Fonctionnalités pouvant consommer des clés
  - H3 : 1) Réponses du modèle principal (chat + outils)
  - H3 : 2) Compréhension des médias (audio/image/vidéo)
  - H3 : 3) Génération d’images et de vidéos
  - H3 : 4) Embeddings mémoire + recherche sémantique
  - H3 : 5) Outil de recherche Web
  - H3 : 5) Outil de récupération Web (Firecrawl)
  - H3 : 6) Instantanés d’utilisation des fournisseurs (statut/santé)
  - H3 : 7) Résumé de protection Compaction
  - H3 : 8) Scan / sonde du modèle
  - H3 : 9) Conversation (voix)
  - H3 : 10) Skills (API tierces)
  - H2 : Articles connexes

## reference/application-modernization-plan.md

- Route : /reference/application-modernization-plan
- Titres :
  - H2 : Objectif
  - H2 : Principes
  - H2 : Phase 1 : audit de référence
  - H2 : Phase 2 : nettoyage produit et UX
  - H2 : Phase 3 : renforcement de l’architecture frontend
  - H2 : Phase 4 : performances et fiabilité
  - H2 : Phase 5 : durcissement des types, contrats et tests
  - H2 : Phase 6 : documentation et préparation de publication
  - H2 : Première tranche recommandée
  - H2 : Mise à jour de la compétence frontend

## reference/code-mode.md

- Route : /reference/code-mode
- Titres :
  - H2 : Qu’est-ce que c’est ?
  - H2 : Pourquoi est-ce utile ?
  - H2 : Comment l’activer
  - H2 : Tour technique
  - H2 : État du runtime
  - H2 : Périmètre
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
  - H3 : Règles de sérialisation du périmètre
  - H3 : Prompts
  - H3 : Nettoyage
  - H3 : Liste de contrôle des tests
  - H2 : API de sortie
  - H2 : Catalogue d’outils
  - H2 : Interaction avec Tool Search
  - H2 : Noms d’outils et collisions
  - H2 : Exécution d’outils imbriqués
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
  - H2 : Articles connexes

## reference/credits.md

- Route : /reference/credits
- Titres :
  - H2 : Le nom
  - H2 : Crédits
  - H2 : Contributeurs principaux
  - H2 : Licence
  - H2 : Articles connexes

## reference/device-models.md

- Route : /reference/device-models
- Titres :
  - H2 : Source des données
  - H2 : Mise à jour de la base de données
  - H2 : Articles connexes

## reference/full-release-validation.md

- Route : /reference/full-release-validation
- Titres :
  - H2 : Étapes de premier niveau
  - H2 : Étapes des contrôles de publication
  - H2 : Segments du chemin de publication Docker
  - H2 : Profils de publication
  - H2 : Ajouts réservés au complet
  - H2 : Relances ciblées
  - H2 : Preuves à conserver
  - H2 : Fichiers de workflow

## reference/memory-config.md

- Route : /reference/memory-config
- Titres :
  - H2 : Sélection du fournisseur
  - H3 : Identifiants de fournisseurs personnalisés
  - H3 : Résolution des clés API
  - H2 : Configuration du point de terminaison distant
  - H2 : Configuration propre au fournisseur
  - H3 : Délai d’expiration des embeddings en ligne
  - H2 : Configuration de la recherche hybride
  - H3 : Exemple complet
  - H2 : Chemins mémoire supplémentaires
  - H2 : Mémoire multimodale (Gemini)
  - H2 : Cache d’embeddings
  - H2 : Indexation par lots
  - H2 : Recherche mémoire de session (expérimental)
  - H2 : Accélération vectorielle SQLite (sqlite-vec)
  - H2 : Stockage de l’index
  - H2 : Configuration du backend QMD
  - H3 : Exemple QMD complet
  - H2 : Dreaming
  - H3 : Paramètres utilisateur
  - H3 : Exemple
  - H2 : Articles connexes

## reference/prompt-caching.md

- Route : /reference/prompt-caching
- Titres :
  - H2 : Réglages principaux
  - H3 : cacheRetention (valeur par défaut globale, modèle et par agent)
  - H3 : contextPruning.mode : "cache-ttl"
  - H3 : Maintien à chaud Heartbeat
  - H2 : Comportement des fournisseurs
  - H3 : Anthropic (API directe)
  - H3 : OpenAI (API directe)
  - H3 : Anthropic Vertex
  - H3 : Amazon Bedrock
  - H3 : Modèles OpenRouter
  - H3 : Autres fournisseurs
  - H3 : API directe Google Gemini
  - H3 : Utilisation de Gemini CLI
  - H2 : Frontière du cache du prompt système
  - H2 : Garde-fous de stabilité du cache OpenClaw
  - H2 : Modèles d’ajustement
  - H3 : Trafic mixte (par défaut recommandé)
  - H3 : Base de référence axée sur les coûts
  - H2 : Diagnostics du cache
  - H2 : Tests de régression en direct
  - H3 : Attentes en direct Anthropic
  - H3 : Attentes en direct OpenAI
  - H3 : Configuration diagnostics.cacheTrace
  - H3 : Bascules d’environnement (débogage ponctuel)
  - H3 : Éléments à inspecter
  - H2 : Dépannage rapide
  - H2 : Articles connexes

## reference/release-performance-sweep.md

- Route : /reference/release-performance-sweep
- Titres :
  - H2 : Instantané
  - H2 : Chronologie de l’empreinte d’installation
  - H2 : Ce qui a changé dans 5.28
  - H2 : Chiffres clés
  - H3 : Empreinte d’installation
  - H3 : Taille du package npm
  - H2 : Résumé du tour d’agent Kova
  - H2 : Sondes source
  - H2 : Audit de l’empreinte d’installation
  - H3 : Frontière shrinkwrap
  - H2 : Interprétation de la chaîne d’approvisionnement

## reference/rich-output-protocol.md

- Route : /reference/rich-output-protocol
- Titres :
  - H2 : [embed ...]
  - H2 : Forme de rendu stockée
  - H2 : Articles connexes

## reference/rpc.md

- Route : /reference/rpc
- Titres :
  - H2 : Motif A : daemon HTTP (signal-cli)
  - H2 : Motif B : processus enfant stdio (imsg)
  - H2 : Consignes pour les adaptateurs
  - H2 : Articles connexes

## reference/secret-placeholder-conventions.md

- Route : /reference/secret-placeholder-conventions
- Titres :
  - H1 : Conventions de placeholders de secrets
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
  - H2 : Articles connexes

## reference/session-management-compaction.md

- Route : /reference/session-management-compaction
- Titres :
  - H2 : Source de vérité : le Gateway
  - H2 : Deux couches de persistance
  - H2 : Emplacements sur disque
  - H2 : Maintenance du magasin et contrôles disque
  - H2 : Sessions Cron et journaux d’exécution
  - H2 : Clés de session (sessionKey)
  - H2 : Identifiants de session (sessionId)
  - H2 : Schéma du magasin de sessions (sessions.json)
  - H2 : Structure de transcription (.jsonl)
  - H2 : Fenêtres de contexte vs jetons suivis
  - H2 : Compaction : définition
  - H2 : Frontières des segments de Compaction et appariement des outils
  - H2 : Quand l’auto-Compaction se produit (runtime OpenClaw)
  - H2 : Paramètres de Compaction (reserveTokens, keepRecentTokens)
  - H2 : Fournisseurs de Compaction enfichables
  - H2 : Surfaces visibles par l’utilisateur
  - H2 : Maintenance silencieuse (NOREPLY)
  - H2 : « Vidage mémoire » avant Compaction (implémenté)
  - H2 : Liste de contrôle de dépannage
  - H2 : Articles connexes

## reference/templates/AGENTS.dev.md

- Route : /reference/templates/AGENTS.dev
- Titres :
  - H1 : AGENTS.md - Espace de travail OpenClaw
  - H2 : Première exécution (une seule fois)
  - H2 : Conseil de sauvegarde (recommandé)
  - H2 : Réglages de sécurité par défaut
  - H2 : Vérification préalable des solutions existantes
  - H2 : Mémoire quotidienne (recommandé)
  - H2 : Heartbeats (facultatif)
  - H2 : Personnaliser
  - H2 : Mémoire d’origine C-3PO
  - H3 : Jour de naissance : 2026-01-09
  - H3 : Vérités fondamentales (de Clawd)
  - H2 : Articles connexes

## reference/templates/BOOT.md

- Route : /reference/templates/BOOT
- Titres :
  - H1 : BOOT.md
  - H2 : Articles connexes

## reference/templates/BOOTSTRAP.md

- Route : /reference/templates/BOOTSTRAP
- Titres :
  - H1 : BOOTSTRAP.md - Bonjour, le monde
  - H2 : La conversation
  - H2 : Après avoir su qui vous êtes
  - H2 : Se connecter (facultatif)
  - H2 : Quand vous avez terminé
  - H2 : Articles connexes

## reference/templates/HEARTBEAT.md

- Route : /reference/templates/HEARTBEAT
- Titres :
  - H1 : Modèle HEARTBEAT.md
  - H2 : Articles connexes

## reference/templates/IDENTITY.dev.md

- Route : /reference/templates/IDENTITY.dev
- Titres :
  - H1 : IDENTITY.md - Identité de l’agent
  - H2 : Rôle
  - H2 : Âme
  - H2 : Relation avec Clawd
  - H2 : Particularités
  - H2 : Phrase fétiche
  - H2 : Articles connexes

## reference/templates/IDENTITY.md

- Route : /reference/templates/IDENTITY
- Titres :
  - H1 : IDENTITY.md - Qui suis-je ?
  - H2 : Articles connexes

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
  - H2 : Associé

## reference/templates/SOUL.md

- Route : /reference/templates/SOUL
- Titres :
  - H1 : SOUL.md - Qui vous êtes
  - H2 : Vérités fondamentales
  - H2 : Limites
  - H2 : Ambiance
  - H2 : Continuité
  - H2 : Associé

## reference/templates/TOOLS.dev.md

- Route : /reference/templates/TOOLS.dev
- Titres :
  - H1 : TOOLS.md - Notes sur les outils utilisateur (modifiables)
  - H2 : Exemples
  - H3 : imsg
  - H3 : sag
  - H2 : Associé

## reference/templates/TOOLS.md

- Route : /reference/templates/TOOLS
- Titres :
  - H1 : TOOLS.md - Notes locales
  - H2 : Ce qui va ici
  - H2 : Exemples
  - H2 : Pourquoi séparer ?
  - H2 : Associé

## reference/templates/USER.dev.md

- Route : /reference/templates/USER.dev
- Titres :
  - H1 : USER.md - Profil utilisateur
  - H2 : Associé

## reference/templates/USER.md

- Route : /reference/templates/USER
- Titres :
  - H1 : USER.md - À propos de votre humain
  - H2 : Contexte
  - H2 : Associé

## reference/test.md

- Route : /reference/test
- Titres :
  - H2 : Porte locale des PR
  - H2 : Banc de latence des modèles (clés locales)
  - H2 : Banc de démarrage de la CLI
  - H2 : Banc de démarrage du Gateway
  - H2 : Banc de redémarrage du Gateway
  - H2 : Onboarding E2E (Docker)
  - H2 : Test rapide d’import QR (Docker)
  - H2 : Associé

## reference/token-use.md

- Route : /reference/token-use
- Titres :
  - H2 : Comment le prompt système est construit
  - H2 : Ce qui compte dans la fenêtre de contexte
  - H2 : Comment voir l’utilisation actuelle des tokens
  - H2 : Estimation des coûts (lorsqu’elle est affichée)
  - H2 : TTL du cache et impact de l’élagage
  - H3 : Exemple : garder un cache d’1 h chaud avec Heartbeat
  - H3 : Exemple : trafic mixte avec stratégie de cache par agent
  - H3 : Contexte Anthropic 1M
  - H2 : Conseils pour réduire la pression sur les tokens
  - H2 : Associé

## reference/transcript-hygiene.md

- Route : /reference/transcript-hygiene
- Titres :
  - H2 : Règle globale : le contexte d’exécution n’est pas le transcript utilisateur
  - H2 : Où cela s’exécute
  - H2 : Règle globale : nettoyage des images
  - H2 : Règle globale : appels d’outils mal formés
  - H2 : Règle globale : tours incomplets de raisonnement seul
  - H2 : Règle globale : provenance des entrées intersessions
  - H2 : Matrice des providers (comportement actuel)
  - H2 : Comportement historique (avant 2026.1.22)
  - H2 : Associé

## reference/wizard.md

- Route : /reference/wizard
- Titres :
  - H2 : Détails du flux (mode local)
  - H2 : Mode non interactif
  - H3 : Ajouter un agent (non interactif)
  - H2 : RPC de l’assistant Gateway
  - H2 : Configuration de Signal (signal-cli)
  - H2 : Ce que l’assistant écrit
  - H2 : Docs associées

## releases/2026.6.11.md

- Route : /releases/2026.6.11
- Titres :
  - H1 : Notes de version OpenClaw v2026.6.11 (2026-06-30)
  - H2 : Points forts
  - H3 : Fiabilité de la livraison par canal
  - H3 : Récupération des providers et des modèles
  - H3 : Continuité des sessions, de la mémoire et de la confiance
  - H3 : Mode relais du routeur Slack
  - H3 : Pont de réveil de l’agent externe Raft
  - H3 : Installation et réparation des Plugins officiels
  - H2 : Canaux et messagerie
  - H3 : Correctifs de canaux supplémentaires
  - H2 : Gateway, sécurité et confiance
  - H3 : Récupération après redémarrage et disponibilité
  - H3 : Livraison des résultats distants et des médias
  - H2 : Clients et interfaces
  - H3 : Envois clients et reconnexions
  - H3 : Correctifs d’interface, de paramètres et d’onboarding
  - H2 : Docs et outils d’administration
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
  - H3 : Ajouter une menace
  - H3 : Suggérer une mitigation
  - H3 : Proposer une chaîne d’attaque
  - H3 : Corriger ou améliorer le contenu existant
  - H2 : Ce que nous utilisons
  - H3 : Cadre MITRE ATLAS
  - H3 : ID de menaces
  - H3 : Niveaux de risque
  - H2 : Processus de revue
  - H2 : Ressources
  - H2 : Contact
  - H2 : Reconnaissance
  - H2 : Associé

## security/THREAT-MODEL-ATLAS.md

- Route : /security/THREAT-MODEL-ATLAS
- Titres :
  - H2 : Cadre MITRE ATLAS
  - H3 : Attribution du cadre
  - H3 : Contribuer à ce modèle de menace
  - H2 : 1. Introduction
  - H3 : 1.1 Objectif
  - H3 : 1.2 Portée
  - H3 : 1.3 Hors périmètre
  - H2 : 2. Architecture système
  - H3 : 2.1 Limites de confiance
  - H3 : 2.2 Flux de données
  - H2 : 3. Analyse des menaces par tactique ATLAS
  - H3 : 3.1 Reconnaissance (AML.TA0002)
  - H4 : T-RECON-001 : Découverte des points de terminaison d’agent
  - H4 : T-RECON-002 : Sondage de l’intégration des canaux
  - H3 : 3.2 Accès initial (AML.TA0004)
  - H4 : T-ACCESS-001 : Interception du code d’appairage
  - H4 : T-ACCESS-002 : Usurpation AllowFrom
  - H4 : T-ACCESS-003 : Vol de token
  - H3 : 3.3 Exécution (AML.TA0005)
  - H4 : T-EXEC-001 : Injection directe de prompt
  - H4 : T-EXEC-002 : Injection indirecte de prompt
  - H4 : T-EXEC-003 : Injection d’arguments d’outil
  - H4 : T-EXEC-004 : Contournement de l’approbation Exec
  - H3 : 3.4 Persistance (AML.TA0006)
  - H4 : T-PERSIST-001 : Installation de Skill malveillante
  - H4 : T-PERSIST-002 : Empoisonnement de mise à jour de Skill
  - H4 : T-PERSIST-003 : Altération de configuration d’agent
  - H3 : 3.5 Évasion de défense (AML.TA0007)
  - H4 : T-EVADE-001 : Contournement des motifs de modération
  - H4 : T-EVADE-002 : Échappement du wrapper de contenu
  - H3 : 3.6 Découverte (AML.TA0008)
  - H4 : T-DISC-001 : Énumération des outils
  - H4 : T-DISC-002 : Extraction des données de session
  - H3 : 3.7 Collecte et exfiltration (AML.TA0009, AML.TA0010)
  - H4 : T-EXFIL-001 : Vol de données via webfetch
  - H4 : T-EXFIL-002 : Envoi de messages non autorisé
  - H4 : T-EXFIL-003 : Collecte d’identifiants
  - H3 : 3.8 Impact (AML.TA0011)
  - H4 : T-IMPACT-001 : Exécution de commande non autorisée
  - H4 : T-IMPACT-002 : Épuisement des ressources (DoS)
  - H4 : T-IMPACT-003 : Atteinte à la réputation
  - H2 : 4. Analyse de la chaîne d’approvisionnement ClawHub
  - H3 : 4.1 Contrôles de sécurité actuels
  - H3 : 4.2 Motifs d’indicateurs de modération
  - H3 : 4.3 Améliorations prévues
  - H2 : 5. Matrice des risques
  - H3 : 5.1 Probabilité vs impact
  - H3 : 5.2 Chaînes d’attaque du chemin critique
  - H2 : 6. Synthèse des recommandations
  - H3 : 6.1 Immédiat (P0)
  - H3 : 6.2 Court terme (P1)
  - H3 : 6.3 Moyen terme (P2)
  - H2 : 7. Annexes
  - H3 : 7.1 Correspondance des techniques ATLAS
  - H3 : 7.2 Fichiers de sécurité clés
  - H3 : 7.3 Glossaire
  - H2 : Associé

## security/formal-verification.md

- Route : /security/formal-verification
- Titres :
  - H2 : Où se trouvent les modèles
  - H2 : Avertissements importants
  - H2 : Reproduire les résultats
  - H3 : Exposition du Gateway et mauvaise configuration d’un gateway ouvert
  - H3 : Pipeline exec de Node (capacité à risque maximal)
  - H3 : Magasin d’appairage (gating DM)
  - H3 : Gating d’entrée (mentions + contournement de commande de contrôle)
  - H3 : Isolation des clés de routage/session
  - H2 : v1++ : modèles bornés supplémentaires (concurrence, nouvelles tentatives, exactitude des traces)
  - H3 : Concurrence / idempotence du magasin d’appairage
  - H3 : Corrélation / idempotence des traces d’entrée
  - H3 : Précédence dmScope du routage + identityLinks
  - H2 : Associé

## security/incident-response.md

- Route : /security/incident-response
- Titres :
  - H2 : 1. Détection et triage
  - H2 : 2. Évaluation
  - H2 : 3. Réponse
  - H2 : 4. Communication
  - H2 : 5. Récupération et suivi

## security/network-proxy.md

- Route : /security/network-proxy
- Titres :
  - H2 : Pourquoi utiliser un proxy
  - H2 : Comment OpenClaw achemine le trafic
  - H2 : Termes de proxy associés
  - H2 : Configuration
  - H3 : Mode local loopback du Gateway
  - H2 : Exigences du proxy
  - H2 : Destinations bloquées recommandées
  - H2 : Validation
  - H2 : Confiance de l’AC du proxy
  - H2 : Limites

## specs/claw-supervisor.md

- Route : /specs/claw-supervisor
- Titres :
  - H1 : Claw Supervisor
  - H2 : Objectif
  - H2 : Modèle produit
  - H2 : Architecture
  - H2 : Contrat serveur d’app Codex
  - H2 : Registre de sessions
  - H2 : Surface MCP pour Codex
  - H2 : Surface de contrôle Claw
  - H2 : Flux de lancement
  - H2 : Déploiement
  - H2 : Sécurité
  - H2 : Plan d’implémentation
  - H2 : Tests d’acceptation
  - H2 : Questions ouvertes

## start/bootstrapping.md

- Route : /start/bootstrapping
- Titres :
  - H2 : Ce que fait le bootstrapping
  - H2 : Ignorer le bootstrapping
  - H2 : Où il s’exécute
  - H2 : Docs associées

## start/docs-directory.md

- Route : /start/docs-directory
- Titres :
  - H2 : Commencez ici
  - H2 : Providers et UX
  - H2 : Apps compagnons
  - H2 : Opérations et sécurité
  - H2 : Associé

## start/getting-started.md

- Route : /start/getting-started
- Titres :
  - H2 : Ce dont vous avez besoin
  - H2 : Configuration rapide
  - H2 : Que faire ensuite
  - H2 : Associé

## start/hubs.md

- Route : /start/hubs
- Titres :
  - H2 : Commencez ici
  - H2 : Installation + mises à jour
  - H2 : Concepts clés
  - H2 : Providers + ingress
  - H2 : Gateway + opérations
  - H2 : Outils + automatisation
  - H2 : Nœuds, médias, voix
  - H2 : Plateformes
  - H2 : App compagnon macOS (avancé)
  - H2 : Plugins
  - H2 : Espace de travail + modèles
  - H2 : Projet
  - H2 : Tests + version
  - H2 : Associé

## start/lore.md

- Route : /start/lore
- Titres :
  - H1 : La légende d’OpenClaw 🦞📖
  - H2 : L’histoire d’origine
  - H2 : La première mue (27 janvier 2026)
  - H2 : Le nom
  - H2 : Les Daleks contre les homards
  - H2 : Personnages clés
  - H3 : Molty 🦞
  - H3 : Peter 👨‍💻
  - H2 : Le Moltiverse
  - H2 : Les grands incidents
  - H3 : Le vidage de répertoire (3 déc. 2025)
  - H3 : La grande mue (27 janv. 2026)
  - H3 : La forme finale (30 janvier 2026)
  - H3 : La virée shopping du robot (3 déc. 2025)
  - H2 : Textes sacrés
  - H2 : Le credo du homard
  - H3 : La saga de génération d’icônes (27 janv. 2026)
  - H2 : L’avenir
  - H2 : Associé

## start/onboarding-overview.md

- Route : /start/onboarding-overview
- Titres :
  - H2 : Quel parcours dois-je utiliser ?
  - H2 : Ce que l’onboarding configure
  - H2 : Onboarding CLI
  - H2 : Onboarding de l’app macOS
  - H2 : Providers personnalisés ou non répertoriés
  - H2 : Associé

## start/onboarding.md

- Route : /start/onboarding
- Titres :
  - H2 : Associé

## start/openclaw.md

- Route : /start/openclaw
- Titres :
  - H2 : ⚠️ La sécurité d’abord
  - H2 : Prérequis
  - H2 : La configuration à deux téléphones (recommandée)
  - H2 : Démarrage rapide en 5 minutes
  - H2 : Donner un espace de travail à l’agent (AGENTS)
  - H2 : La configuration qui en fait « un assistant »
  - H2 : Sessions et mémoire
  - H2 : Heartbeats (mode proactif)
  - H2 : Médias entrants et sortants
  - H2 : Liste de contrôle des opérations
  - H2 : Étapes suivantes
  - H2 : Associé

## start/quickstart.md

- Route : /start/quickstart
- Titres :
  - H2 : Associé

## start/setup.md

- Route : /start/setup
- Titres :
  - H2 : TL;DR
  - H2 : Prérequis (depuis la source)
  - H2 : Stratégie d’adaptation (pour que les mises à jour ne fassent pas mal)
  - H2 : Exécuter le Gateway depuis ce dépôt
  - H2 : Workflow stable (app macOS d’abord)
  - H2 : Workflow de pointe (Gateway dans un terminal)
  - H3 : 0) (Facultatif) Exécuter aussi l’app macOS depuis la source
  - H3 : 1) Démarrer le Gateway de développement
  - H3 : 2) Pointer l’app macOS vers votre Gateway en cours d’exécution
  - H3 : 3) Vérifier
  - H3 : Pièges courants
  - H2 : Carte du stockage des identifiants
  - H2 : Mise à jour (sans casser votre configuration)
  - H2 : Linux (service utilisateur systemd)
  - H2 : Docs associées

## start/showcase.md

- Route : /start/showcase
- Titres :
  - H2 : Tout frais depuis Discord
  - H2 : Automatisation et workflows
  - H2 : Connaissances et mémoire
  - H2 : Voix et téléphone
  - H2 : Infrastructure et déploiement
  - H2 : Maison et matériel
  - H2 : Projets de la communauté
  - H2 : Soumettre votre projet
  - H2 : Associé

## start/wizard-cli-automation.md

- Route : /start/wizard-cli-automation
- Titres :
  - H2 : Exemple non interactif de référence
  - H2 : Exemples propres aux providers
  - H2 : Ajouter un autre agent
  - H2 : Docs associées

## start/wizard-cli-reference.md

- Route : /start/wizard-cli-reference
- Titres :
  - H2 : Ce que fait l’assistant
  - H2 : Détails du flux local
  - H2 : Détails du mode distant
  - H2 : Options d’authentification et de modèle
  - H2 : Sorties et internes
  - H2 : Docs associées

## start/wizard.md

- Route : /start/wizard
- Titres :
  - H2 : Locale
  - H2 : QuickStart vs Advanced
  - H2 : Ce que l’onboarding configure
  - H2 : Ajouter un autre agent
  - H2 : Référence complète
  - H2 : Docs associées

## tools/acp-agents-setup.md

- Route : /tools/acp-agents-setup
- Titres :
  - H2 : Prise en charge du harnais acpx (actuelle)
  - H2 : Configuration requise
  - H2 : Configuration du Plugin pour le backend acpx
  - H3 : Configuration de la commande et de la version acpx
  - H3 : Installation automatique des dépendances
  - H3 : Pont MCP des outils de Plugin
  - H3 : Pont MCP des outils OpenClaw
  - H3 : Configuration du délai d’expiration des opérations d’exécution
  - H3 : Configuration de l’agent de sonde de santé
  - H2 : Configuration des permissions
  - H3 : permissionMode
  - H3 : nonInteractivePermissions
  - H3 : Configuration
  - H2 : Associés

## tools/acp-agents.md

- Route : /tools/acp-agents
- Titres :
  - H2 : Quelle page me faut-il ?
  - H2 : Cela fonctionne-t-il immédiatement ?
  - H2 : Cibles de harnais prises en charge
  - H2 : Runbook opérateur
  - H2 : ACP par rapport aux sous-agents
  - H2 : Comment ACP exécute Claude Code
  - H2 : Sessions liées
  - H3 : Modèle mental
  - H3 : Liaisons de conversation actuelle
  - H2 : Liaisons persistantes de canal
  - H3 : Modèle de liaison
  - H3 : Valeurs par défaut d’exécution par agent
  - H3 : Exemple
  - H3 : Comportement
  - H2 : Démarrer des sessions ACP
  - H3 : Paramètres sessionsspawn
  - H2 : Modes de liaison au démarrage et de fil
  - H2 : Modèle de livraison
  - H2 : Compatibilité du bac à sable
  - H2 : Résolution de la cible de session
  - H2 : Contrôles ACP
  - H3 : Correspondance des options d’exécution
  - H2 : Harnais acpx, configuration du Plugin et permissions
  - H2 : Dépannage
  - H2 : Associés

## tools/agent-send.md

- Route : /tools/agent-send
- Titres :
  - H2 : Démarrage rapide
  - H2 : Indicateurs
  - H2 : Comportement
  - H2 : Exemples
  - H2 : Associés

## tools/apply-patch.md

- Route : /tools/apply-patch
- Titres :
  - H2 : Paramètres
  - H2 : Notes
  - H2 : Exemple
  - H2 : Associés

## tools/brave-search.md

- Route : /tools/brave-search
- Titres :
  - H2 : Obtenir une clé d’API
  - H2 : Exemple de configuration
  - H2 : Paramètres de l’outil
  - H2 : Notes
  - H2 : Associés

## tools/browser-control.md

- Route : /tools/browser-control
- Titres :
  - H2 : API de contrôle (facultative)
  - H3 : Contrat d’erreur /act
  - H3 : Exigence Playwright
  - H4 : Installation de Playwright dans Docker
  - H2 : Fonctionnement (interne)
  - H2 : Référence rapide de la CLI
  - H2 : Instantanés et références
  - H2 : Améliorations d’attente
  - H2 : Flux de débogage
  - H2 : Sortie JSON
  - H2 : État et réglages d’environnement
  - H2 : Sécurité et confidentialité
  - H2 : Associés

## tools/browser-linux-troubleshooting.md

- Route : /tools/browser-linux-troubleshooting
- Titres :
  - H2 : Problème : « Failed to start Chrome CDP on port 18800 »
  - H3 : Cause racine
  - H3 : Solution 1 : installer Google Chrome (recommandé)
  - H3 : Solution 2 : utiliser Snap Chromium avec le mode Attach-Only
  - H3 : Vérifier que le navigateur fonctionne
  - H3 : Référence de configuration
  - H3 : Problème : « No Chrome tabs found for profile="user" »
  - H2 : Associés

## tools/browser-login.md

- Route : /tools/browser-login
- Titres :
  - H2 : Connexion manuelle (recommandée)
  - H2 : Quel profil Chrome est utilisé ?
  - H2 : X/Twitter : flux recommandé
  - H2 : Bac à sable + accès au navigateur hôte
  - H2 : Associés

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- Route : /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- Titres :
  - H2 : Choisir d’abord le bon mode de navigateur
  - H3 : Option 1 : CDP distant brut de WSL2 vers Windows
  - H3 : Option 2 : Chrome MCP local à l’hôte
  - H2 : Architecture fonctionnelle
  - H2 : Pourquoi cette configuration est déroutante
  - H2 : Règle critique pour l’interface de contrôle
  - H2 : Valider par couches
  - H3 : Couche 1 : vérifier que Chrome sert CDP sur Windows
  - H3 : Couche 2 : vérifier que WSL2 peut atteindre ce point de terminaison Windows
  - H3 : Couche 3 : configurer le bon profil de navigateur
  - H3 : Couche 4 : vérifier séparément la couche de l’interface de contrôle
  - H3 : Couche 5 : vérifier le contrôle du navigateur de bout en bout
  - H2 : Erreurs trompeuses fréquentes
  - H2 : Liste de contrôle de triage rapide
  - H2 : Conclusion pratique
  - H2 : Associés

## tools/browser.md

- Route : /tools/browser
- Titres :
  - H2 : Ce que vous obtenez
  - H2 : Démarrage rapide
  - H2 : Contrôle du Plugin
  - H2 : Conseils pour l’agent
  - H2 : Commande ou outil de navigateur manquant
  - H2 : Profils : openclaw contre utilisateur
  - H2 : Configuration
  - H3 : Vision par capture d’écran (prise en charge des modèles texte uniquement)
  - H2 : Utiliser Brave ou un autre navigateur basé sur Chromium
  - H2 : Contrôle local contre distant
  - H2 : Proxy de navigateur Node (valeur par défaut sans configuration)
  - H2 : Browserless (CDP distant hébergé)
  - H3 : Browserless Docker sur le même hôte
  - H2 : Fournisseurs CDP WebSocket directs
  - H3 : Browserbase
  - H3 : Notte
  - H2 : Sécurité
  - H2 : Profils (multi-navigateur)
  - H2 : Session existante via Chrome DevTools MCP
  - H3 : Lancement Chrome MCP personnalisé
  - H2 : Garanties d’isolation
  - H2 : Sélection du navigateur
  - H2 : API de contrôle (facultative)
  - H2 : Dépannage
  - H3 : Échec du démarrage CDP contre blocage SSRF de navigation
  - H2 : Outils d’agent + fonctionnement du contrôle
  - H2 : Associés

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
  - H3 : Interface de contrôle / web
  - H2 : Quand utiliser BTW
  - H2 : Quand ne pas utiliser BTW
  - H2 : Associés

## tools/capability-cookbook.md

- Route : /tools/capability-cookbook
- Titres :
  - H2 : Associés

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
  - H2 : Associés

## tools/creating-skills.md

- Route : /tools/creating-skills
- Titres :
  - H2 : Créer votre première skill
  - H2 : Référence SKILL.md
  - H3 : Champs requis
  - H3 : Clés de frontmatter facultatives
  - H3 : Utilisation de {baseDir}
  - H2 : Ajouter une activation conditionnelle
  - H2 : Proposer via Skill Workshop
  - H2 : Publication sur ClawHub
  - H2 : Bonnes pratiques
  - H2 : Associés

## tools/diffs.md

- Route : /tools/diffs
- Titres :
  - H2 : Démarrage rapide
  - H2 : Désactiver les consignes système intégrées
  - H2 : Flux de travail typique d’un agent
  - H2 : Exemples d’entrée
  - H2 : Référence d’entrée de l’outil
  - H2 : Coloration syntaxique
  - H2 : Contrat des détails de sortie
  - H2 : Sections inchangées réduites
  - H2 : Valeurs par défaut du Plugin
  - H3 : Configuration d’URL de visionneuse persistante
  - H2 : Configuration de sécurité
  - H2 : Cycle de vie et stockage des artefacts
  - H2 : URL de visionneuse et comportement réseau
  - H2 : Modèle de sécurité
  - H2 : Exigences du navigateur pour le mode fichier
  - H2 : Dépannage
  - H2 : Conseils opérationnels
  - H2 : Associés

## tools/duckduckgo-search.md

- Route : /tools/duckduckgo-search
- Titres :
  - H2 : Configuration
  - H2 : Config
  - H2 : Paramètres de l’outil
  - H2 : Notes
  - H2 : Associés

## tools/elevated.md

- Route : /tools/elevated
- Titres :
  - H2 : Directives
  - H2 : Fonctionnement
  - H2 : Ordre de résolution
  - H2 : Disponibilité et listes d’autorisation
  - H2 : Ce que elevated ne contrôle pas
  - H2 : Associés

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
  - H2 : Associés

## tools/exec-approvals-advanced.md

- Route : /tools/exec-approvals-advanced
- Titres :
  - H2 : Binaires sûrs (stdin uniquement)
  - H3 : Validation d’argv et indicateurs refusés
  - H3 : Répertoires de binaires approuvés
  - H3 : Chaînage shell, wrappers et multiplexeurs
  - H3 : Binaires sûrs contre liste d’autorisation
  - H2 : Commandes d’interpréteur/d’exécution
  - H3 : Comportement de livraison de suivi
  - H2 : Transfert d’approbation vers les canaux de discussion
  - H3 : Transfert d’approbation du Plugin
  - H3 : Approbations dans la même discussion sur n’importe quel canal
  - H3 : Livraison d’approbation native
  - H3 : Flux IPC macOS
  - H2 : FAQ
  - H3 : Quand accountId et threadId seraient-ils utilisés sur une cible d’approbation ?
  - H3 : Quand les approbations sont envoyées à une session, n’importe qui dans cette session peut-il les approuver ?
  - H2 : Associés

## tools/exec-approvals.md

- Route : /tools/exec-approvals
- Titres :
  - H2 : Inspection de la politique effective
  - H2 : Où elle s’applique
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
  - H3 : Configuration persistante « ne jamais demander » sur l’hôte Gateway
  - H3 : Raccourci local
  - H3 : Hôte Node
  - H3 : Raccourci limité à la session
  - H2 : Liste d’autorisation (par agent)
  - H3 : Restriction des arguments avec argPattern
  - H2 : Autoriser automatiquement les CLI de Skills
  - H2 : Binaires sûrs et transfert d’approbation
  - H2 : Modification dans l’interface de contrôle
  - H2 : Flux d’approbation
  - H2 : Événements système
  - H2 : Comportement d’approbation refusée
  - H2 : Implications
  - H2 : Associés

## tools/exec.md

- Route : /tools/exec
- Titres :
  - H2 : Paramètres
  - H2 : Config
  - H3 : Gestion de PATH
  - H2 : Remplacements de session (/exec)
  - H2 : Modèle d’autorisation
  - H2 : Approbations Exec (application compagnon / hôte Node)
  - H2 : Liste d’autorisation + binaires sûrs
  - H2 : Exemples
  - H2 : applypatch
  - H2 : Associés

## tools/firecrawl.md

- Route : /tools/firecrawl
- Titres :
  - H2 : Installer le Plugin
  - H2 : webfetch sans clé et clés d’API
  - H2 : Configurer la recherche Firecrawl
  - H2 : Configurer le repli webfetch Firecrawl
  - H3 : Firecrawl auto-hébergé
  - H2 : Outils du Plugin Firecrawl
  - H3 : firecrawlsearch
  - H3 : firecrawlscrape
  - H2 : Furtivité / contournement des bots
  - H2 : Comment webfetch utilise Firecrawl
  - H2 : Associés

## tools/gemini-search.md

- Route : /tools/gemini-search
- Titres :
  - H2 : Obtenir une clé d’API
  - H2 : Config
  - H2 : Fonctionnement
  - H2 : Paramètres pris en charge
  - H2 : Sélection du modèle
  - H2 : Remplacements d’URL de base
  - H2 : Associés

## tools/goal.md

- Route : /tools/goal
- Titres :
  - H1 : Objectif
  - H2 : Démarrage rapide
  - H2 : À quoi servent les objectifs
  - H2 : Référence des commandes
  - H2 : Statuts
  - H2 : Budgets de jetons
  - H2 : Outils de modèle
  - H2 : TUI
  - H2 : Comportement des canaux
  - H2 : Dépannage
  - H2 : Associés

## tools/grok-search.md

- Route : /tools/grok-search
- Titres :
  - H2 : Intégration et configuration
  - H2 : Se connecter ou obtenir une clé d’API
  - H2 : Config
  - H2 : Fonctionnement
  - H2 : Paramètres pris en charge
  - H2 : Remplacements d’URL de base
  - H2 : Associés

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
  - H3 : Modification d’image
  - H2 : Analyses détaillées des fournisseurs
  - H2 : Exemples
  - H2 : Associés

## tools/index.md

- Route : /tools
- Titres :
  - H2 : Commencer ici
  - H2 : Choisir des outils, Skills ou plugins
  - H2 : Catégories d’outils intégrés
  - H2 : Outils fournis par les Plugins
  - H2 : Configurer l’accès et les approbations
  - H2 : Étendre les capacités
  - H2 : Dépanner les outils manquants
  - H2 : Associés

## tools/kimi-search.md

- Route : /tools/kimi-search
- Titres :
  - H2 : Obtenir une clé d’API
  - H2 : Config
  - H2 : Fonctionnement
  - H2 : Paramètres pris en charge
  - H2 : Associés

## tools/llm-task.md

- Route : /tools/llm-task
- Titres :
  - H2 : Activer le Plugin
  - H2 : Config (facultative)
  - H2 : Paramètres de l’outil
  - H2 : Sortie
  - H2 : Exemple : étape de flux de travail Lobster
  - H3 : Limitation importante
  - H2 : Notes de sécurité
  - H2 : Associés

## tools/lobster.md

- Route : /tools/lobster
- Titres :
  - H2 : Hook
  - H2 : Pourquoi
  - H2 : Pourquoi un DSL plutôt que des programmes simples ?
  - H2 : Fonctionnement
  - H2 : Modèle : petite CLI + tuyaux JSON + approbations
  - H2 : Étapes LLM JSON uniquement (llm-task)
  - H3 : Limitation importante : Lobster intégré contre openclaw.invoke
  - H2 : Fichiers de flux de travail (.lobster)
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
  - H2 : Étude de cas : flux de travail communautaires
  - H2 : Associés

## tools/loop-detection.md

- Route : /tools/loop-detection
- Titres :
  - H2 : Pourquoi cela existe
  - H2 : Bloc de configuration
  - H3 : Comportement des champs
  - H2 : Configuration recommandée
  - H2 : Garde post-Compaction
  - H2 : Journaux et comportement attendu
  - H2 : Associés

## tools/media-overview.md

- Route : /tools/media-overview
- Titres :
  - H2 : Fonctionnalités
  - H2 : Matrice des fonctionnalités par fournisseur
  - H2 : Asynchrone vs synchrone
  - H2 : Transcription vocale et appel vocal
  - H2 : Correspondances des fournisseurs (comment les vendeurs se répartissent entre les surfaces)
  - H2 : Associé

## tools/minimax-search.md

- Route : /tools/minimax-search
- Titres :
  - H2 : Obtenir un identifiant Token Plan
  - H2 : Configuration
  - H2 : Sélection de région
  - H2 : Paramètres pris en charge
  - H2 : Associé

## tools/multi-agent-sandbox-tools.md

- Route : /tools/multi-agent-sandbox-tools
- Titres :
  - H2 : Exemples de configuration
  - H2 : Priorité de la configuration
  - H3 : Configuration du bac à sable
  - H3 : Restrictions d’outils
  - H2 : Migration depuis un agent unique
  - H2 : Exemples de restrictions d’outils
  - H2 : Piège courant : "non-main"
  - H2 : Tests
  - H2 : Dépannage
  - H2 : Associé

## tools/music-generation.md

- Route : /tools/music-generation
- Titres :
  - H2 : Démarrage rapide
  - H2 : Fournisseurs pris en charge
  - H3 : Matrice des fonctionnalités
  - H2 : Paramètres de l’outil
  - H2 : Comportement asynchrone
  - H3 : Cycle de vie des tâches
  - H2 : Configuration
  - H3 : Sélection du modèle
  - H3 : Ordre de sélection des fournisseurs
  - H2 : Notes sur les fournisseurs
  - H2 : Choisir le bon chemin
  - H2 : Modes de fonctionnalités des fournisseurs
  - H2 : Tests en direct
  - H2 : Associé

## tools/ollama-search.md

- Route : /tools/ollama-search
- Titres :
  - H2 : Installation
  - H2 : Configuration
  - H2 : Notes
  - H2 : Associé

## tools/parallel-search.md

- Route : /tools/parallel-search
- Titres :
  - H2 : Installer le Plugin
  - H2 : Clé API (fournisseur payant)
  - H2 : Configuration
  - H2 : Remplacement de l’URL de base
  - H2 : Paramètres de l’outil
  - H2 : Notes
  - H2 : Associé

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
  - H2 : Associé

## tools/permission-modes.md

- Route : /tools/permission-modes
- Titres :
  - H2 : Valeur par défaut recommandée
  - H2 : Modes d’exécution de l’hôte OpenClaw
  - H2 : Correspondance Codex Guardian
  - H2 : Autorisations du harnais ACPX
  - H2 : Choisir un mode
  - H2 : Associé

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
  - H3 : Règles de filtre de domaine
  - H2 : Notes
  - H2 : Associé

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
  - H2 : Hooks de Plugin
  - H2 : Vérifier le Gateway actif
  - H2 : Dépannage
  - H3 : Propriété du chemin de Plugin bloqué
  - H3 : Configuration lente des outils du Plugin
  - H2 : Associé

## tools/reactions.md

- Route : /tools/reactions
- Titres :
  - H2 : Fonctionnement
  - H2 : Comportement du canal
  - H2 : Niveau de réaction
  - H2 : Associé

## tools/searxng-search.md

- Route : /tools/searxng-search
- Titres :
  - H2 : Installation
  - H2 : Configuration
  - H2 : Variable d’environnement
  - H2 : Référence de configuration du Plugin
  - H2 : Notes
  - H2 : Associé

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
  - H2 : Méthodes Gateway
  - H2 : Stockage
  - H2 : Limites
  - H2 : Dépannage
  - H2 : Associé

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
  - H2 : Racines de Skills liées par symlink
  - H2 : Skills en bac à sable et variables d’environnement
  - H2 : Rappel de l’ordre de chargement
  - H2 : Associé

## tools/skills.md

- Route : /tools/skills
- Titres :
  - H2 : Ordre de chargement
  - H2 : Skills par agent vs Skills partagées
  - H2 : Listes d’autorisation des agents
  - H2 : Plugins et Skills
  - H2 : Skill Workshop
  - H2 : Installation depuis ClawHub
  - H2 : Sécurité
  - H2 : Format SKILL.md
  - H3 : Clés de frontmatter facultatives
  - H2 : Contrôle d’accès
  - H3 : Spécifications d’installation
  - H2 : Remplacements de configuration
  - H2 : Injection d’environnement
  - H2 : Instantanés et actualisation
  - H2 : Impact sur les tokens
  - H2 : Associé

## tools/slash-commands.md

- Route : /tools/slash-commands
- Titres :
  - H2 : Trois types de commandes
  - H2 : Configuration
  - H2 : Liste des commandes
  - H3 : Commandes cœur
  - H3 : Commandes Dock
  - H3 : Commandes des Plugins intégrés
  - H3 : Commandes de Skills
  - H2 : /tools — ce que l’agent peut utiliser maintenant
  - H2 : /model — sélection du modèle
  - H2 : /config — écritures de configuration sur disque
  - H2 : /mcp — configuration du serveur MCP
  - H2 : /debug — remplacements uniquement à l’exécution
  - H2 : /plugins — gestion des Plugins
  - H2 : /trace — sortie de trace du Plugin
  - H2 : /btw — questions annexes
  - H2 : Notes de surface
  - H2 : Utilisation et état du fournisseur
  - H2 : Associé

## tools/steer.md

- Route : /tools/steer
- Titres :
  - H2 : Session actuelle
  - H2 : Piloter vs mettre en file d’attente
  - H2 : Sous-agents
  - H2 : Sessions ACP
  - H2 : Associé

## tools/subagents.md

- Route : /tools/subagents
- Titres :
  - H2 : Commande slash
  - H3 : Contrôles de liaison au fil
  - H3 : Comportement de spawn
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
  - H3 : Limite de spawn par agent
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
  - H2 : Limitations
  - H2 : Associé

## tools/tavily.md

- Route : /tools/tavily
- Titres :
  - H2 : Premiers pas
  - H2 : Référence de l’outil
  - H3 : tavilysearch
  - H3 : tavilyextract
  - H2 : Choisir le bon outil
  - H2 : Configuration avancée
  - H2 : Associé

## tools/thinking.md

- Route : /tools/thinking
- Titres :
  - H2 : Ce qu’il fait
  - H2 : Ordre de résolution
  - H2 : Définir une valeur par défaut de session
  - H2 : Application par agent
  - H2 : Mode rapide (/fast)
  - H2 : Directives détaillées (/verbose ou /v)
  - H2 : Directives de trace de Plugin (/trace)
  - H2 : Visibilité du raisonnement (/reasoning)
  - H2 : Associé
  - H2 : Heartbeats
  - H2 : Interface de chat web
  - H2 : Profils de fournisseurs

## tools/tokenjuice.md

- Route : /tools/tokenjuice
- Titres :
  - H2 : Activer le Plugin
  - H2 : Ce que tokenjuice change
  - H2 : Vérifier qu’il fonctionne
  - H2 : Désactiver le Plugin
  - H2 : Associé

## tools/tool-search.md

- Route : /tools/tool-search
- Titres :
  - H2 : Déroulement d’un tour
  - H2 : Modes
  - H2 : Pourquoi cela existe
  - H2 : API
  - H2 : Limite d’exécution
  - H2 : Configuration
  - H2 : Invite et télémétrie
  - H2 : Validation E2E
  - H2 : Comportement en cas d’échec
  - H2 : Associé

## tools/trajectory.md

- Route : /tools/trajectory
- Titres :
  - H2 : Démarrage rapide
  - H2 : Accès
  - H2 : Ce qui est enregistré
  - H2 : Fichiers du bundle
  - H2 : Emplacement de capture
  - H2 : Désactiver la capture
  - H2 : Ajuster le délai d’expiration du flush
  - H2 : Confidentialité et limites
  - H2 : Dépannage
  - H2 : Associé

## tools/tts.md

- Route : /tools/tts
- Titres :
  - H2 : Démarrage rapide
  - H2 : Fournisseurs pris en charge
  - H2 : Configuration
  - H3 : Remplacements de voix par agent
  - H2 : Personas
  - H3 : Persona minimale
  - H3 : Persona complète (invite neutre vis-à-vis du fournisseur)
  - H3 : Résolution de persona
  - H3 : Comment les fournisseurs utilisent les invites de persona
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
  - H2 : Associé

## tools/video-generation.md

- Route : /tools/video-generation
- Titres :
  - H2 : Démarrage rapide
  - H2 : Fonctionnement de la génération asynchrone
  - H3 : Cycle de vie des tâches
  - H2 : Fournisseurs pris en charge
  - H3 : Matrice des fonctionnalités
  - H2 : Paramètres de l’outil
  - H3 : Obligatoire
  - H3 : Entrées de contenu
  - H3 : Contrôles de style
  - H3 : Avancé
  - H4 : Repli et options typées
  - H2 : Actions
  - H2 : Sélection du modèle
  - H2 : Notes sur les fournisseurs
  - H2 : Modes de fonctionnalités des fournisseurs
  - H2 : Tests en direct
  - H2 : Configuration
  - H2 : Associé

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
  - H2 : Associé

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
  - H2 : Associé

## tts.md

- Route : /tts
- Titres :
  - H2 : Associé

## vps.md

- Route : /vps
- Titres :
  - H2 : Choisir un fournisseur
  - H2 : Fonctionnement des configurations cloud
  - H2 : Renforcer d’abord l’accès administrateur
  - H2 : Agent d’entreprise partagé sur un VPS
  - H2 : Utiliser des nœuds avec un VPS
  - H2 : Réglage du démarrage pour les petites VM et les hôtes ARM
  - H3 : Liste de vérification de réglage systemd (facultatif)
  - H2 : Associé

## web/control-ui.md

- Route : /web/control-ui
- Titres :
  - H2 : Ouverture rapide (locale)
  - H2 : Appairage de l’appareil (première connexion)
  - H2 : Identité personnelle (locale au navigateur)
  - H2 : Point de terminaison de configuration d’exécution
  - H2 : Prise en charge des langues
  - H2 : Thèmes d’apparence
  - H2 : Ce qu’elle peut faire (aujourd’hui)
  - H2 : Page MCP
  - H2 : Onglet d’activité
  - H2 : Comportement du chat
  - H2 : Installation PWA et push web
  - H2 : Intégrations hébergées
  - H2 : Largeur des messages de chat
  - H2 : Accès Tailnet (recommandé)
  - H2 : HTTP non sécurisé
  - H2 : Politique de sécurité du contenu
  - H2 : Authentification de la route avatar
  - H2 : Authentification de la route média de l’assistant
  - H2 : Construction de l’interface utilisateur
  - H2 : Page Control UI vide
  - H2 : Débogage/tests : serveur de développement + Gateway distant
  - H2 : Associé

## web/dashboard.md

- Route : /web/dashboard
- Titres :
  - H2 : Chemin rapide (recommandé)
  - H2 : Bases de l’authentification (locale vs distante)
  - H2 : Si vous voyez "unauthorized" / 1008
  - H2 : Associé

## web/index.md

- Route : /web
- Titres :
  - H2 : Webhooks
  - H2 : RPC HTTP administrateur
  - H2 : Configuration (activée par défaut)
  - H2 : Accès Tailscale
  - H3 : Service intégré (recommandé)
  - H3 : Liaison Tailnet + token
  - H3 : Internet public (Funnel)
  - H2 : Notes de sécurité
  - H2 : Construction de l’interface utilisateur

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
  - H2 : Associé

## web/webchat.md

- Route : /web/webchat
- Titres :
  - H2 : Ce que c’est
  - H2 : Démarrage rapide
  - H2 : Fonctionnement (comportement)
  - H3 : Transcription et modèle de livraison
  - H2 : Panneau d’outils des agents de Control UI
  - H2 : Utilisation à distance
  - H2 : Référence de configuration (WebChat)
  - H2 : Associé
