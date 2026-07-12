---
read_when:
    - Évaluation de la posture de sécurité ou des scénarios de menace
    - Travailler sur des fonctionnalités de sécurité ou des réponses à des audits
summary: Modèle de menace d’OpenClaw mis en correspondance avec le framework MITRE ATLAS
title: Modèle de menace (MITRE ATLAS)
x-i18n:
    generated_at: "2026-07-12T15:54:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c88ffdef850bd2afaf835baab2555304c914a0be1df6b6b9109e0f55d1448392
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

**Version :** 1.0-draft | **Cadre :** [MITRE ATLAS](https://atlas.mitre.org/) (paysage des menaces adverses pour les systèmes d’IA) + diagrammes de flux de données

Ce modèle de menace documente les menaces adverses visant la plateforme d’agents IA OpenClaw et la place de marché de Skills ClawHub. Il s’agit d’un document évolutif tenu à jour par la communauté OpenClaw. Consultez [Contribuer au modèle de menace](/fr/security/CONTRIBUTING-THREAT-MODEL) pour savoir comment signaler de nouvelles menaces, proposer des chaînes d’attaque ou suggérer des mesures d’atténuation.

**Principales ressources ATLAS :** [Techniques](https://atlas.mitre.org/techniques/) | [Tactiques](https://atlas.mitre.org/tactics/) | [Études de cas](https://atlas.mitre.org/studies/) | [ATLAS sur GitHub](https://github.com/mitre-atlas/atlas-data) | [Contribuer à ATLAS](https://atlas.mitre.org/resources/contribute)

---

## 1. Périmètre

| Composant                       | Inclus      | Remarques                                                    |
| ------------------------------- | ----------- | ------------------------------------------------------------ |
| Environnement d’exécution de l’agent OpenClaw | Oui         | Exécution principale de l’agent, appels d’outils, sessions   |
| Gateway                         | Oui         | Authentification, routage, intégration des canaux             |
| Intégrations de canaux          | Oui         | WhatsApp, Telegram, Discord, Signal, Slack, etc.              |
| Place de marché ClawHub         | Oui         | Publication, modération et distribution des Skills           |
| Serveurs MCP                    | Oui         | Fournisseurs d’outils externes                                |
| Appareils des utilisateurs      | Partiel     | Applications mobiles, clients de bureau                      |

Les signalements hors périmètre et les schémas de faux positifs (exposition à l’Internet public, chaînes reposant uniquement sur l’injection de prompt sans contournement d’une frontière, opérateurs ne se faisant mutuellement pas confiance et partageant un même hôte Gateway, entre autres) sont énumérés dans [`SECURITY.md`](https://github.com/openclaw/openclaw/blob/main/SECURITY.md) ; ce fichier constitue la source de référence actuelle pour le périmètre des signalements de vulnérabilités, et non cette page.

## 2. Architecture du système

### 2.1 Frontières de confiance

```text
┌─────────────────────────────────────────────────────────────────┐
│                    ZONE NON FIABLE                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│             FRONTIÈRE DE CONFIANCE 1 : Accès aux canaux         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Appairage des appareils (expiration : 1 h pour         │   │
│  │    l’appairage par message privé / 5 min pour un Node)    │   │
│  │  • Validation AllowFrom / liste d’autorisation            │   │
│  │  • Authentification par jeton / mot de passe / Tailscale  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│             FRONTIÈRE DE CONFIANCE 2 : Isolation des sessions   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   SESSIONS DES AGENTS                     │   │
│  │  • Clé de session = agent:channel:peer                    │   │
│  │  • Politiques d’outils propres à chaque agent             │   │
│  │  • Journalisation des transcriptions                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│             FRONTIÈRE DE CONFIANCE 3 : Exécution des outils     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  BAC À SABLE D’EXÉCUTION                  │   │
│  │  • Bac à sable Docker (par défaut) ou hôte                │   │
│  │    (approbations d’exécution)                             │   │
│  │  • Exécution à distance sur Node                          │   │
│  │  • Protection SSRF (épinglage DNS + blocage des adresses  │   │
│  │    IP)                                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│             FRONTIÈRE DE CONFIANCE 4 : Contenu externe          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │        URL RÉCUPÉRÉES / E-MAILS / WEBHOOKS               │   │
│  │  • Encapsulation du contenu externe (balises XML à        │   │
│  │    délimiteur aléatoire)                                  │   │
│  │  • Injection d’un avis de sécurité                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│             FRONTIÈRE DE CONFIANCE 5 : Chaîne logistique        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Publication de Skills (semver, SKILL.md obligatoire)   │   │
│  │  • Analyse de modération par motifs statiques et          │   │
│  │    techniques proches de l’AST                            │   │
│  │  • Évaluation agentique des risques par LLM + analyse     │   │
│  │    VirusTotal                                             │   │
│  │  • Vérification de l’ancienneté du compte GitHub          │   │
│  │    (14 jours)                                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flux de données

| Flux | Source  | Destination | Données                | Protection                    |
| ---- | ------- | ----------- | ---------------------- | ----------------------------- |
| F1   | Canal   | Gateway     | Messages des utilisateurs | TLS, AllowFrom              |
| F2   | Gateway | Agent       | Messages acheminés     | Isolation des sessions        |
| F3   | Agent   | Outils      | Appels d’outils        | Application des politiques    |
| F4   | Agent   | Externe     | Requêtes `web_fetch`   | Blocage SSRF                   |
| F5   | ClawHub | Agent       | Code des Skills        | Modération, analyse            |
| F6   | Agent   | Canal       | Réponses               | Filtrage des sorties           |

---

## 3. Analyse des menaces par tactique ATLAS

### 3.1 Reconnaissance (AML.TA0002)

#### T-RECON-001 : Découverte des points de terminaison des agents

| Attribut                | Valeur                                                               |
| ----------------------- | -------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0006 - Analyse active                                           |
| **Description**         | L’attaquant recherche des points de terminaison Gateway OpenClaw exposés |
| **Vecteur d’attaque**   | Analyse réseau, requêtes Shodan, énumération DNS                     |
| **Composants affectés** | Gateway, points de terminaison d’API exposés                         |
| **Mesures d’atténuation actuelles** | Option d’authentification Tailscale, liaison à l’interface de bouclage par défaut |
| **Risque résiduel**     | Moyen - les Gateway publics peuvent être découverts                  |
| **Recommandations**     | Documenter le déploiement sécurisé, ajouter une limitation du débit sur les points de terminaison de découverte |

#### T-RECON-002 : Sondage des intégrations de canaux

| Attribut                | Valeur                                                             |
| ----------------------- | ------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0006 - Analyse active                                         |
| **Description**         | L’attaquant sonde les canaux de messagerie pour identifier les comptes gérés par une IA |
| **Vecteur d’attaque**   | Envoi de messages de test, observation des schémas de réponse      |
| **Composants affectés** | Toutes les intégrations de canaux                                  |
| **Mesures d’atténuation actuelles** | Aucune mesure spécifique                               |
| **Risque résiduel**     | Faible - la découverte seule présente une valeur limitée           |
| **Recommandations**     | Envisager de rendre aléatoire le délai de réponse                   |

---

### 3.2 Accès initial (AML.TA0004)

#### T-ACCESS-001 : Interception du code d’appairage

| Attribut               | Valeur                                                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Accès à l’API d’inférence de modèles d’IA                                                                       |
| **Description**         | L’attaquant intercepte un code d’appairage pendant la fenêtre d’appairage (1 h pour l’appairage par DM/générique, 5 min pour l’appairage de Node) |
| **Vecteur d’attaque**   | Observation par-dessus l’épaule, interception du trafic réseau, ingénierie sociale                                         |
| **Composants affectés** | Système d’appairage des appareils                                                                                           |
| **Mesures d’atténuation actuelles** | Durée de vie de 1 h (appairage par DM/générique), durée de vie de 5 min (appairage de Node) ; codes envoyés via le canal existant |
| **Risque résiduel**     | Moyen - fenêtre d’appairage exploitable                                                                                     |
| **Recommandations**     | Réduire la fenêtre d’appairage, ajouter une étape de confirmation                                                          |

#### T-ACCESS-002 : Usurpation d’AllowFrom

| Attribut               | Valeur                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Accès à l’API d’inférence de modèles d’IA                                           |
| **Description**         | L’attaquant usurpe l’identité d’un expéditeur autorisé sur un canal                              |
| **Vecteur d’attaque**   | Selon le canal - usurpation de numéro de téléphone, usurpation de nom d’utilisateur              |
| **Composants affectés** | Validation AllowFrom propre à chaque canal                                                       |
| **Mesures d’atténuation actuelles** | Vérification de l’identité propre à chaque canal                                      |
| **Risque résiduel**     | Moyen - certains canaux restent vulnérables à l’usurpation                                       |
| **Recommandations**     | Documenter les risques propres à chaque canal, ajouter une vérification cryptographique lorsque cela est possible |

#### T-ACCESS-003 : Vol de jetons

| Attribut               | Valeur                                                                           |
| ----------------------- | -------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Accès à l’API d’inférence de modèles d’IA                            |
| **Description**         | L’attaquant vole des jetons d’authentification dans les fichiers de configuration ou d’identifiants |
| **Vecteur d’attaque**   | Logiciel malveillant, accès non autorisé à l’appareil, exposition d’une sauvegarde de configuration |
| **Composants affectés** | Stockage des identifiants des canaux/fournisseurs, stockage de la configuration  |
| **Mesures d’atténuation actuelles** | Autorisations des fichiers                                           |
| **Risque résiduel**     | Élevé - jetons stockés en clair sur le disque                                     |
| **Recommandations**     | Mettre en œuvre le chiffrement des jetons au repos, ajouter la rotation des jetons |

---

### 3.3 Exécution (AML.TA0005)

#### T-EXEC-001 : Injection directe dans le prompt

| Attribut               | Valeur                                                                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0051.000 - Injection dans le prompt d’un LLM : directe                                                                                               |
| **Description**         | L’attaquant envoie des prompts conçus pour manipuler le comportement de l’agent                                                                           |
| **Vecteur d’attaque**   | Messages de canal contenant des instructions adverses                                                                                                     |
| **Composants affectés** | LLM de l’agent, toutes les surfaces d’entrée                                                                                                              |
| **Mesures d’atténuation actuelles** | Détection de motifs, encapsulation du contenu externe ; considérée hors du périmètre des rapports de vulnérabilité en l’absence de contournement d’une frontière de sécurité (voir `SECURITY.md`) |
| **Risque résiduel**     | Critique - détection uniquement, aucun blocage ; les attaques sophistiquées la contournent                                                                |
| **Recommandations**     | Ajouter une validation des sorties et une confirmation de l’utilisateur pour les actions sensibles, en complément de la détection existante              |

#### T-EXEC-002 : Injection indirecte dans le prompt

| Attribut               | Valeur                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0051.001 - Injection dans le prompt d’un LLM : indirecte                                                                        |
| **Description**         | L’attaquant intègre des instructions malveillantes dans le contenu récupéré                                                          |
| **Vecteur d’attaque**   | URL malveillantes, e-mails empoisonnés, webhooks compromis                                                                           |
| **Composants affectés** | `web_fetch`, ingestion des e-mails, sources de données externes                                                                      |
| **Mesures d’atténuation actuelles** | Encapsulation du contenu avec des marqueurs de type XML à délimiteurs aléatoires, normalisation des homoglyphes/jetons spéciaux et avis de sécurité |
| **Risque résiduel**     | Élevé - le LLM peut tout de même ignorer les instructions de l’encapsulation                                                         |
| **Recommandations**     | Séparer les contextes d’exécution pour le contenu encapsulé                                                                          |

#### T-EXEC-003 : Injection d’arguments d’outil

| Attribut               | Valeur                                                                 |
| ----------------------- | ---------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0051.000 - Injection dans le prompt d’un LLM : directe            |
| **Description**         | L’attaquant manipule les arguments des outils par injection dans le prompt |
| **Vecteur d’attaque**   | Prompts conçus pour influencer les valeurs des paramètres des outils   |
| **Composants affectés** | Tous les appels d’outils                                                |
| **Mesures d’atténuation actuelles** | Approbations d’exécution pour les commandes dangereuses     |
| **Risque résiduel**     | Élevé - repose sur le jugement de l’utilisateur                         |
| **Recommandations**     | Validation des arguments, appels d’outils paramétrés                    |

#### T-EXEC-004 : Contournement de l’approbation d’exécution

| Attribut               | Valeur                                                                                                                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Création de données adverses                                                                                                                                                              |
| **Description**         | L’attaquant élabore des commandes qui contournent la liste d’autorisation d’approbation                                                                                                               |
| **Vecteur d’attaque**   | Obscurcissement des commandes, exploitation d’alias, manipulation des chemins                                                                                                                         |
| **Composants affectés** | `src/infra/exec-approvals*.ts`, liste d’autorisation des commandes                                                                                                                                    |
| **Mesures d’atténuation actuelles** | Liste d’autorisation + mode de demande, ainsi que normalisation des commandes (désencapsulation des wrappers de répartition, détection de l’évaluation en ligne, analyse des chaînes de commandes shell) |
| **Risque résiduel**     | Élevé - la normalisation réduit les possibilités de contournement par obscurcissement sans les éliminer ; les constats portant uniquement sur la parité entre les chemins d’exécution sont considérés comme du renforcement, et non comme des vulnérabilités (voir `SECURITY.md`) |
| **Recommandations**     | Continuer à étendre la couverture de la normalisation des commandes face aux nouvelles techniques d’obscurcissement                                                                                   |

---

### 3.4 Persistance (AML.TA0006)

#### T-PERSIST-001 : Installation d’une skill malveillante

| Attribut               | Valeur                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0010.001 - Compromission de la chaîne d’approvisionnement : logiciel d’IA                                                       |
| **Description**         | L’attaquant publie une skill malveillante sur ClawHub                                                                                 |
| **Vecteur d’attaque**   | Créer un compte, publier une skill contenant du code malveillant dissimulé                                                            |
| **Composants affectés** | ClawHub, chargement des skills, exécution de l’agent                                                                                  |
| **Mesures d’atténuation actuelles** | Vérification de l’ancienneté du compte GitHub, analyse statique de motifs/proche de l’AST, examen agentique des risques fondé sur un LLM, analyse VirusTotal |
| **Risque résiduel**     | Élevé - des couches de détection existent, mais les skills s’exécutent toujours avec les privilèges de l’agent et sans bac à sable d’exécution |
| **Recommandations**     | Exécution des skills dans un bac à sable, examen communautaire étendu                                                                |

#### T-PERSIST-002 : Empoisonnement d’une mise à jour de skill

| Attribut               | Valeur                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0010.001 - Compromission de la chaîne d’approvisionnement : logiciel d’IA       |
| **Description**         | L’attaquant compromet une skill populaire et diffuse une mise à jour malveillante     |
| **Vecteur d’attaque**   | Compromission du compte, ingénierie sociale visant le propriétaire de la skill        |
| **Composants affectés** | Gestion des versions de ClawHub, processus de mise à jour automatique                 |
| **Mesures d’atténuation actuelles** | Empreinte de version, nouvelle exécution de la modération/analyse pour les nouvelles versions |
| **Risque résiduel**     | Élevé - les mises à jour automatiques peuvent récupérer des versions malveillantes avant la fin de l’examen |
| **Recommandations**     | Signature des mises à jour, capacité de restauration, épinglage des versions          |

#### T-PERSIST-003 : Altération de la configuration de l’agent

| Attribut                | Valeur                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.002 - Compromission de la chaîne d’approvisionnement : données                |
| **Description**         | L’attaquant modifie la configuration de l’agent pour maintenir son accès                |
| **Vecteur d’attaque**   | Modification du fichier de configuration, injection de paramètres                       |
| **Composants affectés** | Configuration de l’agent, politiques des outils                                         |
| **Mesures actuelles**   | Autorisations des fichiers                                                              |
| **Risque résiduel**     | Moyen - nécessite un accès local                                                        |
| **Recommandations**     | Vérification de l’intégrité de la configuration, journalisation d’audit de ses changements |

---

### 3.5 Contournement des défenses (AML.TA0007)

#### T-EVADE-001 : contournement des mécanismes de modération

| Attribut                | Valeur                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Création de données adverses                                                                |
| **Description**         | L’attaquant élabore le contenu d’une compétence afin de contourner les contrôles de modération de ClawHub |
| **Vecteur d’attaque**   | Homoglyphes Unicode, astuces d’encodage, chargement dynamique                                            |
| **Composants affectés** | Pipeline de modération et d’analyse de ClawHub                                                          |
| **Mesures actuelles**   | Règles de motifs statiques, analyse de code proche de l’AST, examen des risques agentiques par LLM, VirusTotal |
| **Risque résiduel**     | Moyen - de nouvelles techniques d’obscurcissement peuvent encore échapper aux heuristiques multicouches |
| **Recommandations**     | Continuer à enrichir le corpus de motifs et de comportements à mesure que de nouveaux contournements sont découverts |

#### T-EVADE-002 : échappement de l’enveloppe de contenu

| Attribut                | Valeur                                                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Création de données adverses                                                                                       |
| **Description**         | L’attaquant élabore du contenu qui échappe au contexte de l’enveloppe de contenu externe                                      |
| **Vecteur d’attaque**   | Manipulation de balises, confusion du contexte, substitution des instructions                                                  |
| **Composants affectés** | Encapsulation du contenu externe                                                                                               |
| **Mesures actuelles**   | Marqueurs de style XML à délimiteurs aléatoires avec avis de sécurité, et détection de l’usurpation de marqueurs par homoglyphes ou variantes d’espacement |
| **Risque résiduel**     | Moyen - de nouvelles méthodes d’échappement sont régulièrement découvertes                                                    |
| **Recommandations**     | Validation en sortie en complément de l’encapsulation en entrée                                                               |

---

### 3.6 Découverte (AML.TA0008)

#### T-DISC-001 : énumération des outils

| Attribut                | Valeur                                                            |
| ----------------------- | ----------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Accès à l’API d’inférence du modèle d’IA              |
| **Description**         | L’attaquant énumère les outils disponibles au moyen de requêtes   |
| **Vecteur d’attaque**   | Requêtes du type « Quels outils avez-vous ? »                     |
| **Composants affectés** | Registre des outils de l’agent                                    |
| **Mesures actuelles**   | Aucune mesure spécifique                                          |
| **Risque résiduel**     | Faible - les outils sont généralement documentés                  |
| **Recommandations**     | Envisager des contrôles de visibilité des outils                  |

#### T-DISC-002 : extraction des données de session

| Attribut                | Valeur                                                              |
| ----------------------- | ------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Accès à l’API d’inférence du modèle d’IA                |
| **Description**         | L’attaquant extrait des données sensibles du contexte de la session |
| **Vecteur d’attaque**   | Requêtes du type « De quoi avons-nous discuté ? », sondage du contexte |
| **Composants affectés** | Transcriptions de session, fenêtre de contexte                       |
| **Mesures actuelles**   | Isolation des sessions par expéditeur (clé `agent:channel:peer`)     |
| **Risque résiduel**     | Moyen - les données de la session sont accessibles par conception   |
| **Recommandations**     | Masquage des données sensibles dans le contexte                      |

---

### 3.7 Collecte et exfiltration (AML.TA0009, AML.TA0010)

#### T-EXFIL-001 : vol de données via web_fetch

| Attribut                | Valeur                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Collecte                                                                           |
| **Description**         | L’attaquant exfiltre des données en demandant à l’agent de les envoyer à une URL externe       |
| **Vecteur d’attaque**   | Injection de prompt amenant l’agent à envoyer les données par POST à un serveur de l’attaquant |
| **Composants affectés** | Outil `web_fetch`                                                                              |
| **Mesures actuelles**   | Blocage SSRF des réseaux internes et privés (épinglage DNS et blocage d’adresses IP)            |
| **Risque résiduel**     | Élevé - les URL externes arbitraires restent autorisées                                        |
| **Recommandations**     | Liste d’URL autorisées, prise en compte de la classification des données                        |

#### T-EXFIL-002 : envoi de messages non autorisé

| Attribut                | Valeur                                                                      |
| ----------------------- | --------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Collecte                                                        |
| **Description**         | L’attaquant amène l’agent à envoyer des messages contenant des données sensibles |
| **Vecteur d’attaque**   | Injection de prompt amenant l’agent à envoyer un message à l’attaquant      |
| **Composants affectés** | Outil de messagerie, intégrations de canaux                                 |
| **Mesures actuelles**   | Contrôle des envois de messages sortants                                    |
| **Risque résiduel**     | Moyen - le contrôle peut être contourné                                     |
| **Recommandations**     | Confirmation explicite pour les nouveaux destinataires                      |

#### T-EXFIL-003 : collecte d’identifiants

| Attribut                | Valeur                                                                                                                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Collecte                                                                                                                                                                    |
| **Description**         | Une compétence malveillante collecte des identifiants dans le contexte de l’agent                                                                                                      |
| **Vecteur d’attaque**   | Le code de la compétence lit les variables d’environnement et les fichiers de configuration                                                                                            |
| **Composants affectés** | Environnement d’exécution de la compétence                                                                                                                                              |
| **Mesures actuelles**   | Analyse par ClawHub des motifs d’identifiants (secrets codés en dur, accès aux variables d’environnement contenant des identifiants associé à des envois réseau) ; aucune isolation de l’exécution des compétences à l’exécution |
| **Risque résiduel**     | Critique - les compétences s’exécutent avec les privilèges de l’agent                                                                                                                   |
| **Recommandations**     | Isolation de l’exécution des compétences, isolation des identifiants                                                                                                                    |

---

### 3.8 Impact (AML.TA0011)

#### T-IMPACT-001 : exécution de commandes non autorisée

| Attribut                | Valeur                                                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Altération de l’intégrité du modèle d’IA                                                                          |
| **Description**         | L’attaquant exécute des commandes arbitraires sur le système de l’utilisateur                                                 |
| **Vecteur d’attaque**   | Injection de prompt combinée au contournement de l’approbation d’exécution                                                    |
| **Composants affectés** | Outil Bash, exécution de commandes                                                                                             |
| **Mesures actuelles**   | Approbations d’exécution, option de bac à sable Docker (backend d’exécution par défaut)                                       |
| **Risque résiduel**     | Critique - l’exécution sur l’hôte est possible lorsque le bac à sable est désactivé                                           |
| **Recommandations**     | Améliorer l’expérience utilisateur des approbations ; les déploiements sans bac à sable restent un choix délibéré de l’opérateur, documenté comme tel |

#### T-IMPACT-002 : épuisement des ressources (DoS)

| Attribut                | Valeur                                                       |
| ----------------------- | ------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0031 - Altération de l’intégrité du modèle d’IA         |
| **Description**         | L’attaquant épuise les crédits d’API ou les ressources de calcul |
| **Vecteur d’attaque**   | Inondation automatisée de messages, appels d’outils coûteux  |
| **Composants affectés** | Gateway, sessions de l’agent, fournisseur d’API              |
| **Mesures actuelles**   | Aucune                                                       |
| **Risque résiduel**     | Élevé - aucune limitation de débit par expéditeur            |
| **Recommandations**     | Limites de débit par expéditeur, budgets de coûts            |

#### T-IMPACT-003 : atteinte à la réputation

| Attribut                | Valeur                                                                 |
| ----------------------- | ---------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Altération de l’intégrité du modèle d’IA                   |
| **Description**         | L’attaquant amène l’agent à envoyer du contenu préjudiciable ou offensant |
| **Vecteur d’attaque**   | Injection de prompt provoquant des réponses inappropriées              |
| **Composants affectés** | Génération de sortie, messagerie des canaux                            |
| **Mesures actuelles**   | Politiques de contenu du fournisseur de LLM                            |
| **Risque résiduel**     | Moyen - les filtres du fournisseur sont imparfaits                     |
| **Recommandations**     | Couche de filtrage des sorties, contrôles utilisateur                  |

---

## 4. Analyse de la chaîne d’approvisionnement de ClawHub

### 4.1 Contrôles de sécurité actuels

| Contrôle                       | Implémentation                                                                        | Efficacité                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Ancienneté du compte GitHub    | `requireGitHubAccountAge()` (minimum de 14 jours)                                     | Moyenne — relève le niveau de difficulté pour les nouveaux attaquants            |
| Assainissement des chemins     | `sanitizePath()`                                                                      | Élevée — empêche la traversée de chemins                                         |
| Validation du type de fichier  | `isTextFile()`                                                                        | Moyenne — seuls les fichiers texte sont analysés, mais restent exploitables      |
| Limites de taille              | Paquet de 50MB au total (`MAX_PUBLISH_TOTAL_BYTES`)                                   | Élevée — empêche l’épuisement des ressources                                     |
| SKILL.md requis                | Fichier readme obligatoire lors de la publication                                     | Faible valeur de sécurité — uniquement informatif                                |
| Analyse statique et proche AST | Moteur de motifs couvrant l’exécution, l’exfiltration, la collecte d’identifiants, l’obscurcissement, etc. | Moyenne à élevée — couvre de nombreux schémas d’abus connus, mais reste fondée sur des motifs |
| Évaluation agentique des risques par LLM | Verdict fondé sur une invite de sécurité lors de la publication                     | Moyenne à élevée — détecte des comportements manqués par les motifs statiques    |
| Analyse VirusTotal             | Intégrée aux flux de publication et de réanalyse des Skills et versions de paquets, conditionnée par la clé API de l’opérateur | Élevée lorsqu’elle est activée — détection par moteur statique                    |
| Statut de modération           | Champ `moderationStatus`                                                              | Moyenne — révision manuelle possible                                             |

### 4.2 Limites de la modération

L’analyse statique de ClawHub inspecte directement le contenu du code des Skills (et pas seulement le slug, les métadonnées ou le frontmatter), notamment les appels d’exécution dangereux, l’exécution dynamique de code, la collecte d’identifiants, les motifs d’exfiltration, les charges utiles obscurcies, etc. Lacunes connues :

- La détection fondée sur des motifs peut toujours être contournée par un obscurcissement suffisamment inédit.
- L’évaluation fondée sur un LLM et l’analyse VirusTotal dépendent de l’activation des clés API et de la configuration du côté de l’opérateur.
- Aucun bac à sable d’exécution n’isole un Skill des privilèges propres à l’agent une fois qu’il est installé.

### 4.3 Badges

Les Skills et les paquets portent des badges attribués par les modérateurs : `highlighted`, `official`, `deprecated`, `redactionApproved` (Skills uniquement). Les signalements de la communauté (`skillReports`) et la journalisation d’audit (`auditLogs`) prennent en charge les processus de modération.

---

## 5. Matrice des risques

### 5.1 Probabilité et impact

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

### 5.2 Chaînes d’attaque des chemins critiques

**Chaîne 1 : vol de données par un Skill**

```text
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publier un Skill malveillant) → (Échapper à la modération) → (Collecter des identifiants)
```

**Chaîne 2 : de l’injection d’invite à l’exécution de code à distance**

```text
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Injecter une invite) → (Contourner l’approbation d’exécution) → (Exécuter des commandes)
```

**Chaîne 3 : injection indirecte par du contenu récupéré**

```text
T-EXEC-002 → T-EXFIL-001 → Exfiltration externe
(Empoisonner le contenu d’une URL) → (L’agent récupère et suit les instructions) → (Les données sont envoyées à l’attaquant)
```

---

## 6. Résumé des recommandations

### 6.1 Immédiates (P0)

| ID    | Recommandation                                                | Menaces traitées            |
| ----- | ------------------------------------------------------------- | --------------------------- |
| R-002 | Mettre en œuvre un bac à sable pour l’exécution des Skills    | T-PERSIST-001, T-EXFIL-003  |
| R-003 | Ajouter une validation des sorties pour les actions sensibles | T-EXEC-001, T-EXEC-002      |

### 6.2 À court terme (P1)

| ID    | Recommandation                                                                  | Menaces traitées |
| ----- | ------------------------------------------------------------------------------- | ---------------- |
| R-004 | Mettre en œuvre une limitation du débit par expéditeur                          | T-IMPACT-002     |
| R-005 | Ajouter le chiffrement au repos des jetons                                      | T-ACCESS-003     |
| R-006 | Améliorer l’ergonomie de l’approbation d’exécution et continuer à étendre la normalisation des commandes | T-EXEC-004       |
| R-007 | Mettre en œuvre une liste d’autorisation d’URL pour `web_fetch`                 | T-EXFIL-001      |

### 6.3 À moyen terme (P2)

| ID    | Recommandation                                                         | Menaces traitées |
| ----- | ---------------------------------------------------------------------- | ---------------- |
| R-008 | Ajouter une vérification cryptographique des canaux lorsque c’est possible | T-ACCESS-002  |
| R-009 | Mettre en œuvre une vérification de l’intégrité de la configuration    | T-PERSIST-003    |
| R-010 | Ajouter la signature des mises à jour et l’épinglage des versions      | T-PERSIST-002    |

---

## 7. Annexes

### 7.1 Correspondance des techniques ATLAS

| ID ATLAS      | Nom de la technique                         | Menaces OpenClaw                                                 |
| ------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| AML.T0006     | Analyse active                              | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Collecte                                    | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Chaîne d’approvisionnement : logiciels d’IA | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Chaîne d’approvisionnement : données        | T-PERSIST-003                                                    |
| AML.T0031     | Altération de l’intégrité du modèle d’IA    | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | Accès à l’API d’inférence du modèle d’IA    | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Création de données adversariales           | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | Injection d’invite LLM : directe            | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | Injection d’invite LLM : indirecte          | T-EXEC-002                                                       |

### 7.2 Principaux fichiers de sécurité

| Chemin                              | Objectif                                           | Niveau de risque |
| ----------------------------------- | -------------------------------------------------- | ---------------- |
| `src/infra/exec-approvals.ts`       | Logique d’approbation des commandes                | **Critique**     |
| `src/gateway/auth.ts`               | Authentification du Gateway                        | **Critique**     |
| `src/infra/net/ssrf.ts`             | Protection contre les SSRF                         | **Critique**     |
| `src/security/external-content.ts`  | Atténuation des injections d’invite                | **Critique**     |
| `src/agents/sandbox/tool-policy.ts` | Politique d’autorisation et d’interdiction des outils du bac à sable | **Critique** |
| `src/routing/resolve-route.ts`      | Isolation et routage des sessions                  | **Moyen**        |

### 7.3 Glossaire

| Terme                | Définition                                                           |
| -------------------- | -------------------------------------------------------------------- |
| **ATLAS**            | Paysage des menaces adversariales du MITRE pour les systèmes d’IA    |
| **ClawHub**          | Place de marché des Skills d’OpenClaw                                |
| **Gateway**          | Couche de routage des messages et d’authentification d’OpenClaw      |
| **MCP**              | Model Context Protocol — interface de fournisseur d’outils           |
| **Injection d’invite** | Attaque dans laquelle des instructions malveillantes sont intégrées à l’entrée |
| **Skill**            | Extension téléchargeable pour les agents OpenClaw                    |
| **SSRF**             | Falsification de requête côté serveur                                 |

---

_Ce modèle de menaces est un document évolutif. Signalez les problèmes de sécurité à `security@openclaw.ai` ou consultez la [page de confiance](https://trust.openclaw.ai)._

## Pages connexes

- [Contribuer au modèle de menaces](/fr/security/CONTRIBUTING-THREAT-MODEL)
- [Réponse aux incidents](/fr/security/incident-response)
- [Proxy réseau](/fr/security/network-proxy)
- [Vérification formelle](/fr/security/formal-verification)
