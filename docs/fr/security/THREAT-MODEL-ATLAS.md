---
read_when:
    - Examen de la posture de sécurité ou des scénarios de menace
    - Travailler sur des fonctionnalités de sécurité ou des réponses d’audit
summary: Modèle de menace OpenClaw mis en correspondance avec le cadre MITRE ATLAS
title: Modèle de menace (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-30T07:48:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: d929addb829b92d650ef6caecb267fb154f6f9f7d28be7aa87851569931f5228
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

# Modèle de menace OpenClaw v1.0

## Cadre MITRE ATLAS

**Version :** 1.0-draft
**Dernière mise à jour :** 2026-02-04
**Méthodologie :** MITRE ATLAS + diagrammes de flux de données
**Cadre :** [MITRE ATLAS](https://atlas.mitre.org/) (paysage des menaces adversariales pour les systèmes d’IA)

### Attribution du cadre

Ce modèle de menace s’appuie sur [MITRE ATLAS](https://atlas.mitre.org/), le cadre de référence du secteur pour documenter les menaces adversariales visant les systèmes d’IA/ML. ATLAS est maintenu par [MITRE](https://www.mitre.org/) en collaboration avec la communauté de la sécurité de l’IA.

**Ressources ATLAS clés :**

- [Techniques ATLAS](https://atlas.mitre.org/techniques/)
- [Tactiques ATLAS](https://atlas.mitre.org/tactics/)
- [Études de cas ATLAS](https://atlas.mitre.org/studies/)
- [GitHub ATLAS](https://github.com/mitre-atlas/atlas-data)
- [Contribuer à ATLAS](https://atlas.mitre.org/resources/contribute)

### Contribuer à ce modèle de menace

Il s’agit d’un document vivant maintenu par la communauté OpenClaw. Consultez [CONTRIBUTING-THREAT-MODEL.md](/fr/security/CONTRIBUTING-THREAT-MODEL) pour les consignes de contribution :

- Signaler de nouvelles menaces
- Mettre à jour les menaces existantes
- Proposer des chaînes d’attaque
- Suggérer des mesures d’atténuation

---

## 1. Introduction

### 1.1 Objectif

Ce modèle de menace documente les menaces adversariales visant la plateforme d’agents IA OpenClaw et la place de marché de Skills ClawHub, en utilisant le cadre MITRE ATLAS conçu spécifiquement pour les systèmes d’IA/ML.

### 1.2 Portée

| Composant              | Inclus | Notes                                            |
| ---------------------- | ------ | ------------------------------------------------ |
| Runtime d’agent OpenClaw | Oui    | Exécution principale des agents, appels d’outils, sessions |
| Gateway                | Oui    | Authentification, routage, intégration des canaux |
| Intégrations de canaux | Oui    | WhatsApp, Telegram, Discord, Signal, Slack, etc. |
| Place de marché ClawHub | Oui   | Publication, modération, distribution des Skills |
| Serveurs MCP           | Oui    | Fournisseurs d’outils externes                   |
| Appareils utilisateur  | Partiel | Applications mobiles, clients de bureau          |

### 1.3 Hors périmètre

Rien n’est explicitement hors périmètre pour ce modèle de menace.

---

## 2. Architecture du système

### 2.1 Limites de confiance

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNTRUSTED ZONE                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 1: Channel Access                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Device Pairing (1h DM / 5m node grace period)           │   │
│  │  • AllowFrom / AllowList validation                       │   │
│  │  • Token/Password/Tailscale auth                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 2: Session Isolation              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   AGENT SESSIONS                          │   │
│  │  • Session key = agent:channel:peer                       │   │
│  │  • Tool policies per agent                                │   │
│  │  • Transcript logging                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 3: Tool Execution                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  EXECUTION SANDBOX                        │   │
│  │  • Docker sandbox OR Host (exec-approvals)                │   │
│  │  • Node remote execution                                  │   │
│  │  • SSRF protection (DNS pinning + IP blocking)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 4: External Content               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              FETCHED URLs / EMAILS / WEBHOOKS             │   │
│  │  • External content wrapping (XML tags)                   │   │
│  │  • Security notice injection                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 5: Supply Chain                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Skill publishing (semver, SKILL.md required)           │   │
│  │  • Pattern-based moderation flags                         │   │
│  │  • VirusTotal scanning (coming soon)                      │   │
│  │  • GitHub account age verification                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flux de données

| Flux | Source  | Destination | Données            | Protection           |
| ---- | ------- | ----------- | ------------------ | -------------------- |
| F1   | Canal   | Gateway     | Messages utilisateur | TLS, AllowFrom       |
| F2   | Gateway | Agent       | Messages routés    | Isolation des sessions |
| F3   | Agent   | Outils      | Invocations d’outils | Application des politiques |
| F4   | Agent   | Externe     | Requêtes web_fetch | Blocage SSRF         |
| F5   | ClawHub | Agent       | Code de Skill      | Modération, analyse  |
| F6   | Agent   | Canal       | Réponses           | Filtrage de sortie   |

---

## 3. Analyse des menaces par tactique ATLAS

### 3.1 Reconnaissance (AML.TA0002)

#### T-RECON-001 : Découverte des points de terminaison d’agent

| Attribut                | Valeur                                                               |
| ----------------------- | -------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0006 - Analyse active                                           |
| **Description**         | L’attaquant recherche des points de terminaison Gateway OpenClaw exposés |
| **Vecteur d’attaque**   | Analyse réseau, requêtes Shodan, énumération DNS                    |
| **Composants affectés** | Gateway, points de terminaison API exposés                           |
| **Mesures d’atténuation actuelles** | Option d’authentification Tailscale, liaison à loopback par défaut |
| **Risque résiduel**     | Moyen - les Gateway publics peuvent être découverts                  |
| **Recommandations**     | Documenter le déploiement sécurisé, ajouter une limitation de débit sur les points de terminaison de découverte |

#### T-RECON-002 : Sondage de l’intégration des canaux

| Attribut               | Valeur                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0006 - Analyse active                                        |
| **Description**         | L’attaquant sonde les canaux de messagerie pour identifier les comptes gérés par IA |
| **Vecteur d’attaque**       | Envoi de messages de test, observation des modèles de réponse                 |
| **Composants affectés** | Toutes les intégrations de canaux                                           |
| **Atténuations actuelles** | Aucune spécifique                                                      |
| **Risque résiduel**       | Faible - Valeur limitée de la découverte seule                           |
| **Recommandations**     | Envisager la randomisation du délai de réponse                             |

---

### 3.2 Accès initial (AML.TA0004)

#### T-ACCESS-001 : Interception du code d’association

| Attribut               | Valeur                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Accès à l’API d’inférence du modèle d’IA                                                                     |
| **Description**         | L’attaquant intercepte le code d’association pendant la période de grâce d’association (1 h pour l’association de canal DM, 5 min pour l’association Node) |
| **Vecteur d’attaque**       | Observation par-dessus l’épaule, sniffing réseau, ingénierie sociale                                                        |
| **Composants affectés** | Système d’association d’appareils                                                                                         |
| **Atténuations actuelles** | Expiration de 1 h (association DM) / expiration de 5 min (association Node), codes envoyés via le canal existant                            |
| **Risque résiduel**       | Moyen - Période de grâce exploitable                                                                             |
| **Recommandations**     | Réduire la période de grâce, ajouter une étape de confirmation                                                                    |

#### T-ACCESS-002 : Usurpation d’AllowFrom

| Attribut               | Valeur                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0040 - Accès à l’API d’inférence du modèle d’IA                                      |
| **Description**         | L’attaquant usurpe l’identité d’un expéditeur autorisé dans le canal                             |
| **Vecteur d’attaque**       | Dépend du canal - usurpation de numéro de téléphone, usurpation de nom d’utilisateur             |
| **Composants affectés** | Validation AllowFrom par canal                                               |
| **Atténuations actuelles** | Vérification d’identité propre au canal                                         |
| **Risque résiduel**       | Moyen - Certains canaux sont vulnérables à l’usurpation                                  |
| **Recommandations**     | Documenter les risques propres à chaque canal, ajouter une vérification cryptographique lorsque possible |

#### T-ACCESS-003 : Vol de jeton

| Attribut               | Valeur                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Accès à l’API d’inférence du modèle d’IA                   |
| **Description**         | L’attaquant vole des jetons d’authentification depuis les fichiers de configuration     |
| **Vecteur d’attaque**       | Logiciel malveillant, accès non autorisé à l’appareil, exposition de sauvegardes de configuration |
| **Composants affectés** | ~/.openclaw/credentials/, stockage de configuration                    |
| **Atténuations actuelles** | Permissions de fichiers                                            |
| **Risque résiduel**       | Élevé - Jetons stockés en texte clair                           |
| **Recommandations**     | Mettre en œuvre le chiffrement des jetons au repos, ajouter la rotation des jetons      |

---

### 3.3 Exécution (AML.TA0005)

#### T-EXEC-001 : Injection directe de prompt

| Attribut               | Valeur                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0051.000 - Injection de prompt LLM : directe                                              |
| **Description**         | L’attaquant envoie des prompts conçus pour manipuler le comportement de l’agent                               |
| **Vecteur d’attaque**       | Messages de canal contenant des instructions adversariales                                      |
| **Composants affectés** | LLM de l’agent, toutes les surfaces d’entrée                                                             |
| **Atténuations actuelles** | Détection de motifs, encapsulation du contenu externe                                              |
| **Risque résiduel**       | Critique - Détection uniquement, pas de blocage ; les attaques sophistiquées contournent                      |
| **Recommandations**     | Mettre en œuvre une défense multicouche, une validation des sorties, une confirmation utilisateur pour les actions sensibles |

#### T-EXEC-002 : Injection indirecte de prompt

| Attribut               | Valeur                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **ID ATLAS**            | AML.T0051.001 - Injection de prompt LLM : indirecte              |
| **Description**         | L’attaquant intègre des instructions malveillantes dans le contenu récupéré   |
| **Vecteur d’attaque**       | URL malveillantes, e-mails empoisonnés, Webhooks compromis       |
| **Composants affectés** | web_fetch, ingestion d’e-mails, sources de données externes           |
| **Atténuations actuelles** | Encapsulation du contenu avec des balises XML et un avis de sécurité          |
| **Risque résiduel**       | Élevé - Le LLM peut ignorer les instructions d’encapsulation                  |
| **Recommandations**     | Mettre en œuvre la sanitisation du contenu, séparer les contextes d’exécution |

#### T-EXEC-003 : Injection d’arguments d’outil

| Attribut               | Valeur                                                        |
| ----------------------- | ------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0051.000 - Injection de prompt LLM : directe                 |
| **Description**         | L’attaquant manipule les arguments d’outil via l’injection de prompt |
| **Vecteur d’attaque**       | Prompts conçus qui influencent les valeurs des paramètres d’outil         |
| **Composants affectés** | Toutes les invocations d’outils                                         |
| **Atténuations actuelles** | Approbations exec pour les commandes dangereuses                        |
| **Risque résiduel**       | Élevé - Repose sur le jugement de l’utilisateur                               |
| **Recommandations**     | Mettre en œuvre la validation des arguments, des appels d’outils paramétrés      |

#### T-EXEC-004 : Contournement de l’approbation exec

| Attribut               | Valeur                                                      |
| ----------------------- | ---------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Création de données adversariales                         |
| **Description**         | L’attaquant conçoit des commandes qui contournent la liste d’autorisation d’approbation    |
| **Vecteur d’attaque**       | Obfuscation de commande, exploitation d’alias, manipulation de chemin |
| **Composants affectés** | exec-approvals.ts, liste d’autorisation des commandes                       |
| **Atténuations actuelles** | Liste d’autorisation + mode demande                                       |
| **Risque résiduel**       | Élevé - Aucune sanitisation des commandes                             |
| **Recommandations**     | Mettre en œuvre la normalisation des commandes, élargir la liste de blocage          |

---

### 3.4 Persistance (AML.TA0006)

#### T-PERSIST-001 : Installation de Skill malveillant

| Attribut               | Valeur                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0010.001 - Compromission de la chaîne d’approvisionnement : logiciel d’IA                     |
| **Description**         | L’attaquant publie un Skill malveillant sur ClawHub                            |
| **Vecteur d’attaque**       | Création d’un compte, publication d’un Skill avec du code malveillant caché                 |
| **Composants affectés** | ClawHub, chargement des Skills, exécution de l’agent                                  |
| **Atténuations actuelles** | Vérification de l’ancienneté du compte GitHub, indicateurs de modération basés sur des motifs          |
| **Risque résiduel**       | Critique - Pas de bac à sable, revue limitée                                 |
| **Recommandations**     | Intégration VirusTotal (en cours), mise en bac à sable des Skills, revue communautaire |

#### T-PERSIST-002 : Empoisonnement de mise à jour de Skill

| Attribut               | Valeur                                                          |
| ----------------------- | -------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.001 - Compromission de la chaîne d’approvisionnement : logiciel d’IA           |
| **Description**         | L’attaquant compromet un Skill populaire et pousse une mise à jour malveillante |
| **Vecteur d’attaque**       | Compromission de compte, ingénierie sociale visant le propriétaire du Skill          |
| **Composants affectés** | Versionnement ClawHub, flux de mise à jour automatique                          |
| **Atténuations actuelles** | Empreinte de version                                         |
| **Risque résiduel**       | Élevé - Les mises à jour automatiques peuvent récupérer des versions malveillantes                |
| **Recommandations**     | Mettre en œuvre la signature des mises à jour, une capacité de restauration, l’épinglage de version |

#### T-PERSIST-003 : Altération de la configuration de l’agent

| Attribut               | Valeur                                                           |
| ----------------------- | --------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.002 - Compromission de la chaîne d’approvisionnement : données                   |
| **Description**         | L’attaquant modifie la configuration de l’agent pour persister l’accès         |
| **Vecteur d’attaque**       | Modification de fichier de configuration, injection de paramètres                    |
| **Composants affectés** | Configuration de l’agent, politiques d’outils                                     |
| **Atténuations actuelles** | Permissions de fichiers                                                |
| **Risque résiduel**       | Moyen - Nécessite un accès local                                  |
| **Recommandations**     | Vérification de l’intégrité de la configuration, journalisation d’audit des changements de configuration |

---

### 3.5 Évasion des défenses (AML.TA0007)

#### T-EVADE-001 : Contournement des motifs de modération

| Attribut               | Valeur                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Création de données adversariales                                     |
| **Description**         | L’attaquant conçoit du contenu de Skill pour échapper aux motifs de modération             |
| **Vecteur d’attaque**       | Homoglyphes Unicode, astuces d’encodage, chargement dynamique                   |
| **Composants affectés** | moderation.ts de ClawHub                                                  |
| **Atténuations actuelles** | FLAG_RULES basées sur des motifs                                               |
| **Risque résiduel**       | Élevé - Regex simples facilement contournées                                    |
| **Recommandations**     | Ajouter une analyse comportementale (VirusTotal Code Insight), détection basée sur l’AST |

#### T-EVADE-002 : Échappement de l’encapsulation de contenu

| Attribut               | Valeur                                                    |
| ----------------------- | --------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Créer des données adversariales               |
| **Description**         | L'attaquant crée du contenu qui échappe au contexte d'enveloppe XML |
| **Vecteur d'attaque**   | Manipulation de balises, confusion de contexte, remplacement d'instructions |
| **Composants affectés** | Enveloppement de contenu externe                          |
| **Atténuations actuelles** | Balises XML + avis de sécurité                         |
| **Risque résiduel**     | Moyen - De nouvelles échappatoires sont découvertes régulièrement |
| **Recommandations**     | Plusieurs couches d'enveloppe, validation côté sortie     |

---

### 3.6 Découverte (AML.TA0008)

#### T-DISC-001 : Énumération des outils

| Attribut               | Valeur                                                |
| ----------------------- | ----------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Accès à l'API d'inférence du modèle d'IA  |
| **Description**         | L'attaquant énumère les outils disponibles via des prompts |
| **Vecteur d'attaque**   | Requêtes de type « Quels outils avez-vous ? »         |
| **Composants affectés** | Registre des outils de l'agent                        |
| **Atténuations actuelles** | Aucune spécifique                                  |
| **Risque résiduel**     | Faible - Les outils sont généralement documentés      |
| **Recommandations**     | Envisager des contrôles de visibilité des outils      |

#### T-DISC-002 : Extraction des données de session

| Attribut               | Valeur                                                |
| ----------------------- | ----------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Accès à l'API d'inférence du modèle d'IA  |
| **Description**         | L'attaquant extrait des données sensibles du contexte de session |
| **Vecteur d'attaque**   | Requêtes « De quoi avons-nous discuté ? », sondage du contexte |
| **Composants affectés** | Transcriptions de session, fenêtre de contexte        |
| **Atténuations actuelles** | Isolation de session par expéditeur                |
| **Risque résiduel**     | Moyen - Les données de la session sont accessibles    |
| **Recommandations**     | Mettre en œuvre la censure des données sensibles dans le contexte |

---

### 3.7 Collecte et exfiltration (AML.TA0009, AML.TA0010)

#### T-EXFIL-001 : Vol de données via web_fetch

| Attribut               | Valeur                                                                 |
| ----------------------- | ---------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Collecte                                                   |
| **Description**         | L'attaquant exfiltre des données en demandant à l'agent de les envoyer vers une URL externe |
| **Vecteur d'attaque**   | Injection de prompt amenant l'agent à envoyer des données par POST au serveur de l'attaquant |
| **Composants affectés** | Outil web_fetch                                                        |
| **Atténuations actuelles** | Blocage SSRF pour les réseaux internes                              |
| **Risque résiduel**     | Élevé - Les URL externes sont autorisées                               |
| **Recommandations**     | Mettre en œuvre une liste d'autorisation d'URL, une sensibilisation à la classification des données |

#### T-EXFIL-002 : Envoi non autorisé de messages

| Attribut               | Valeur                                                           |
| ----------------------- | ---------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Collecte                                             |
| **Description**         | L'attaquant amène l'agent à envoyer des messages contenant des données sensibles |
| **Vecteur d'attaque**   | Injection de prompt amenant l'agent à envoyer un message à l'attaquant |
| **Composants affectés** | Outil de message, intégrations de canaux                         |
| **Atténuations actuelles** | Contrôle des messages sortants                                |
| **Risque résiduel**     | Moyen - Le contrôle peut être contourné                          |
| **Recommandations**     | Exiger une confirmation explicite pour les nouveaux destinataires |

#### T-EXFIL-003 : Collecte d'identifiants

| Attribut               | Valeur                                                  |
| ----------------------- | ------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Collecte                                    |
| **Description**         | Un Skill malveillant collecte des identifiants depuis le contexte de l'agent |
| **Vecteur d'attaque**   | Le code du Skill lit les variables d'environnement, les fichiers de configuration |
| **Composants affectés** | Environnement d'exécution des Skills                    |
| **Atténuations actuelles** | Aucune spécifique aux Skills                         |
| **Risque résiduel**     | Critique - Les Skills s'exécutent avec les privilèges de l'agent |
| **Recommandations**     | Sandbox des Skills, isolation des identifiants          |

---

### 3.8 Impact (AML.TA0011)

#### T-IMPACT-001 : Exécution de commandes non autorisée

| Attribut               | Valeur                                              |
| ----------------------- | --------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Éroder l'intégrité du modèle d'IA       |
| **Description**         | L'attaquant exécute des commandes arbitraires sur le système utilisateur |
| **Vecteur d'attaque**   | Injection de prompt combinée à un contournement de l'approbation exec |
| **Composants affectés** | Outil Bash, exécution de commandes                  |
| **Atténuations actuelles** | Approbations exec, option de sandbox Docker      |
| **Risque résiduel**     | Critique - Exécution sur l'hôte sans sandbox        |
| **Recommandations**     | Utiliser la sandbox par défaut, améliorer l'UX d'approbation |

#### T-IMPACT-002 : Épuisement des ressources (DoS)

| Attribut               | Valeur                                             |
| ----------------------- | -------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Éroder l'intégrité du modèle d'IA      |
| **Description**         | L'attaquant épuise les crédits d'API ou les ressources de calcul |
| **Vecteur d'attaque**   | Inondation automatisée de messages, appels d'outils coûteux |
| **Composants affectés** | Gateway, sessions d'agent, fournisseur d'API       |
| **Atténuations actuelles** | Aucune                                           |
| **Risque résiduel**     | Élevé - Aucune limitation de débit                 |
| **Recommandations**     | Mettre en œuvre des limites de débit par expéditeur, des budgets de coûts |

#### T-IMPACT-003 : Atteinte à la réputation

| Attribut               | Valeur                                                  |
| ----------------------- | ------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Éroder l'intégrité du modèle d'IA           |
| **Description**         | L'attaquant amène l'agent à envoyer du contenu nuisible/offensant |
| **Vecteur d'attaque**   | Injection de prompt provoquant des réponses inappropriées |
| **Composants affectés** | Génération de sortie, messagerie des canaux             |
| **Atténuations actuelles** | Politiques de contenu du fournisseur LLM             |
| **Risque résiduel**     | Moyen - Les filtres du fournisseur sont imparfaits      |
| **Recommandations**     | Couche de filtrage de sortie, contrôles utilisateur     |

---

## 4. Analyse de la chaîne d'approvisionnement ClawHub

### 4.1 Contrôles de sécurité actuels

| Contrôle             | Implémentation              | Efficacité                                           |
| -------------------- | --------------------------- | ---------------------------------------------------- |
| Âge du compte GitHub | `requireGitHubAccountAge()` | Moyen - Relève la barre pour les nouveaux attaquants |
| Assainissement des chemins | `sanitizePath()`       | Élevée - Empêche la traversée de chemin              |
| Validation du type de fichier | `isTextFile()`      | Moyenne - Fichiers texte uniquement, mais ils peuvent tout de même être malveillants |
| Limites de taille    | Paquet total de 50 Mo       | Élevée - Empêche l'épuisement des ressources         |
| SKILL.md requis      | Readme obligatoire          | Faible valeur de sécurité - Informatif uniquement    |
| Modération par motifs | FLAG_RULES dans moderation.ts | Faible - Facilement contournée                    |
| Statut de modération | Champ `moderationStatus`    | Moyen - Examen manuel possible                       |

### 4.2 Motifs de signalement de modération

Motifs actuels dans `moderation.ts` :

```javascript
// Known-bad identifiers
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Suspicious keywords
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**Limites :**

- Vérifie uniquement le slug, displayName, le résumé, le frontmatter, les métadonnées, les chemins de fichiers
- N'analyse pas le contenu réel du code des Skills
- Regex simple facilement contournée par obfuscation
- Aucune analyse comportementale

### 4.3 Améliorations prévues

| Amélioration           | Statut                                | Impact                                                                |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| Intégration VirusTotal | En cours                              | Élevé - Analyse comportementale Code Insight                          |
| Signalement communautaire | Partiel (la table `skillReports` existe) | Moyen                                                            |
| Journalisation d'audit | Partiel (la table `auditLogs` existe) | Moyen                                                                |
| Système de badges      | Implémenté                            | Moyen - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Matrice des risques

### 5.1 Probabilité vs impact

| ID de menace  | Probabilité | Impact   | Niveau de risque | Priorité |
| ------------- | ----------- | -------- | ---------------- | -------- |
| T-EXEC-001    | Élevée      | Critique | **Critique**     | P0       |
| T-PERSIST-001 | Élevée      | Critique | **Critique**     | P0       |
| T-EXFIL-003   | Moyenne     | Critique | **Critique**     | P0       |
| T-IMPACT-001  | Moyenne     | Critique | **Élevé**        | P1       |
| T-EXEC-002    | Élevée      | Élevé    | **Élevé**        | P1       |
| T-EXEC-004    | Moyenne     | Élevé    | **Élevé**        | P1       |
| T-ACCESS-003  | Moyenne     | Élevé    | **Élevé**        | P1       |
| T-EXFIL-001   | Moyenne     | Élevé    | **Élevé**        | P1       |
| T-IMPACT-002  | Élevée      | Moyen    | **Élevé**        | P1       |
| T-EVADE-001   | Élevée      | Moyen    | **Moyen**        | P2       |
| T-ACCESS-001  | Faible      | Élevé    | **Moyen**        | P2       |
| T-ACCESS-002  | Faible      | Élevé    | **Moyen**        | P2       |
| T-PERSIST-002 | Faible      | Élevé    | **Moyen**        | P2       |

### 5.2 Chaînes d'attaque critiques

**Chaîne d'attaque 1 : vol de données basé sur les Skills**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publish malicious skill) → (Evade moderation) → (Harvest credentials)
```

**Chaîne d'attaque 2 : injection de prompt vers RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Inject prompt) → (Bypass exec approval) → (Execute commands)
```

**Chaîne d'attaque 3 : injection indirecte via contenu récupéré**

```
T-EXEC-002 → T-EXFIL-001 → External exfiltration
(Poison URL content) → (Agent fetches & follows instructions) → (Data sent to attacker)
```

---

## 6. Résumé des recommandations

### 6.1 Immédiat (P0)

| ID    | Recommandation                                            | Traite                     |
| ----- | --------------------------------------------------------- | -------------------------- |
| R-001 | Compléter l’intégration VirusTotal                        | T-PERSIST-001, T-EVADE-001 |
| R-002 | Mettre en œuvre le sandboxing des Skills                  | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Ajouter une validation de sortie pour les actions sensibles | T-EXEC-001, T-EXEC-002     |

### 6.2 Court terme (P1)

| ID    | Recommandation                                      | Traite       |
| ----- | --------------------------------------------------- | ------------ |
| R-004 | Mettre en œuvre la limitation du débit              | T-IMPACT-002 |
| R-005 | Ajouter le chiffrement des jetons au repos          | T-ACCESS-003 |
| R-006 | Améliorer l’UX d’approbation exec et la validation  | T-EXEC-004   |
| R-007 | Mettre en œuvre une liste d’autorisation d’URL pour web_fetch | T-EXFIL-001  |

### 6.3 Moyen terme (P2)

| ID    | Recommandation                                                    | Traite        |
| ----- | ----------------------------------------------------------------- | ------------- |
| R-008 | Ajouter une vérification cryptographique des canaux lorsque possible | T-ACCESS-002  |
| R-009 | Mettre en œuvre la vérification de l’intégrité de la configuration | T-PERSIST-003 |
| R-010 | Ajouter la signature des mises à jour et l’épinglage de version    | T-PERSIST-002 |

---

## 7. Annexes

### 7.1 Correspondance des techniques ATLAS

| ID ATLAS      | Nom de la technique              | Menaces OpenClaw                                                  |
| ------------- | -------------------------------- | ---------------------------------------------------------------- |
| AML.T0006     | Analyse active                   | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Collecte                         | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Chaîne d’approvisionnement : logiciel d’IA | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Chaîne d’approvisionnement : données | T-PERSIST-003                                                    |
| AML.T0031     | Éroder l’intégrité du modèle d’IA | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | Accès à l’API d’inférence du modèle d’IA | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Créer des données adversariales  | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | Injection de prompt LLM : directe | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | Injection de prompt LLM : indirecte | T-EXEC-002                                                       |

### 7.2 Fichiers de sécurité clés

| Chemin                              | Objectif                    | Niveau de risque |
| ----------------------------------- | --------------------------- | ---------------- |
| `src/infra/exec-approvals.ts`       | Logique d’approbation des commandes | **Critique** |
| `src/gateway/auth.ts`               | Authentification du Gateway | **Critique** |
| `src/infra/net/ssrf.ts`             | Protection SSRF             | **Critique** |
| `src/security/external-content.ts`  | Atténuation de l’injection de prompt | **Critique** |
| `src/agents/sandbox/tool-policy.ts` | Application de la politique des outils | **Critique** |
| `src/routing/resolve-route.ts`      | Isolation des sessions      | **Moyen**       |

### 7.3 Glossaire

| Terme                | Définition                                                |
| -------------------- | --------------------------------------------------------- |
| **ATLAS**            | Paysage des menaces adversariales de MITRE pour les systèmes d’IA |
| **ClawHub**          | Place de marché de Skills d’OpenClaw                      |
| **Gateway**          | Couche de routage des messages et d’authentification d’OpenClaw |
| **MCP**              | Model Context Protocol - interface de fournisseur d’outils |
| **Prompt Injection** | Attaque où des instructions malveillantes sont intégrées dans l’entrée |
| **Skill**            | Extension téléchargeable pour les agents OpenClaw         |
| **SSRF**             | Falsification de requête côté serveur                     |

---

_Ce modèle de menaces est un document vivant. Signalez les problèmes de sécurité à security@openclaw.ai_

## Connexe

- [Vérification formelle](/fr/security/formal-verification)
- [Contribuer au modèle de menaces](/fr/security/CONTRIBUTING-THREAT-MODEL)
