---
permalink: /security/formal-verification/
read_when:
    - Examen des garanties ou des limites du modèle de sécurité formel
    - Reproduction ou mise à jour des vérifications du modèle de sécurité TLA+/TLC
summary: Modèles de sécurité vérifiés automatiquement pour les chemins les plus à risque d’OpenClaw.
title: Vérification formelle (modèles de sécurité)
x-i18n:
    generated_at: "2026-07-12T03:19:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86342f6e2f54c08d5e0f8a08d0d488459650a6ace35e985ff886f847540202c9
    source_path: security/formal-verification.md
    workflow: 16
---

Les modèles de sécurité formels d’OpenClaw (TLA+/TLC actuellement) fournissent un argument vérifié par machine selon lequel certains parcours présentant les risques les plus élevés — autorisation, isolation des sessions, contrôle de l’accès aux outils et sûreté en cas de mauvaise configuration — appliquent la politique prévue, selon des hypothèses explicitement énoncées.

> Remarque : certains liens plus anciens peuvent faire référence au précédent nom du projet.

## Présentation

Une suite exécutable de tests de non-régression de sécurité pilotés par un attaquant :

- Chaque affirmation dispose d’une vérification de modèle exécutable sur un espace d’états fini.
- De nombreuses affirmations sont associées à un modèle négatif qui produit une trace de contre-exemple pour une catégorie réaliste de bogues.

Il ne s’agit **pas** d’une preuve qu’OpenClaw est sécurisé à tous égards, et cette suite ne vérifie pas l’intégralité de l’implémentation TypeScript.

## Emplacement des modèles

Les modèles sont maintenus dans un dépôt distinct : [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

<Note>
Ce dépôt est actuellement inaccessible (GitHub renvoie « Repository not found » au moment de la rédaction). S’il est toujours inaccessible pour vous, demandez son emplacement actuel dans les canaux des responsables d’OpenClaw avant de supposer que les modèles ont été supprimés.
</Note>

## Limites

- Il s’agit de modèles, et non de l’implémentation TypeScript complète : une divergence entre le modèle et le code est possible.
- Les résultats sont limités par l’espace d’états exploré par TLC. Un résultat positif n’implique aucune garantie de sécurité au-delà des hypothèses et limites modélisées.
- Certaines affirmations reposent sur des hypothèses explicites concernant l’environnement, par exemple un déploiement correct et des données de configuration correctes.

## Reproduction des résultats

Clonez le dépôt des modèles et exécutez TLC :

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ requis (TLC s’exécute sur la JVM).
# Le dépôt inclut une version fixe de tla2tools.jar et fournit bin/tlc ainsi que des cibles Make.

make <target>
```

Il n’existe pas encore d’intégration CI avec ce dépôt. Une prochaine version pourrait ajouter des modèles exécutés par la CI avec des artefacts publics (traces de contre-exemples, journaux d’exécution), ou un workflow hébergé « exécuter ce modèle » pour les petites vérifications bornées.

## Affirmations et cibles

### Exposition du Gateway et mauvaise configuration d’un Gateway ouvert

**Affirmation :** une liaison au-delà de local loopback sans authentification peut permettre une compromission à distance et accroît l’exposition ; selon les hypothèses du modèle, un jeton ou un mot de passe bloque les attaquants non authentifiés.

| Résultat          | Cibles                                                           |
| ----------------- | ---------------------------------------------------------------- |
| Positif           | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| Négatif (attendu) | `make gateway-exposure-v2-negative`                              |

Consultez également `docs/gateway-exposure-matrix.md` dans le dépôt des modèles.

### Pipeline d’exécution du Node (capacité présentant le risque le plus élevé)

**Affirmation :** `exec host=node` nécessite (a) une liste d’autorisation des commandes du Node ainsi que des commandes déclarées et (b) une approbation en temps réel lorsqu’elle est configurée ; dans le modèle, les approbations utilisent des jetons pour empêcher leur réutilisation.

| Résultat          | Cibles                                                          |
| ----------------- | --------------------------------------------------------------- |
| Positif           | `make nodes-pipeline`, `make approvals-token`                   |
| Négatif (attendu) | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### Stockage des associations (contrôle des messages privés)

**Affirmation :** les demandes d’association respectent la durée de vie et les limites du nombre de demandes en attente.

| Résultat          | Cibles                                               |
| ----------------- | ---------------------------------------------------- |
| Positif           | `make pairing`, `make pairing-cap`                   |
| Négatif (attendu) | `make pairing-negative`, `make pairing-cap-negative` |

### Contrôle des entrées (mentions et contournement par des commandes de contrôle)

**Affirmation :** dans les contextes de groupe nécessitant une mention, une commande de contrôle non autorisée ne peut pas contourner le contrôle des mentions.

| Résultat          | Cibles                         |
| ----------------- | ------------------------------ |
| Positif           | `make ingress-gating`          |
| Négatif (attendu) | `make ingress-gating-negative` |

### Routage et isolation des clés de session

**Affirmation :** les messages privés provenant d’interlocuteurs distincts ne sont pas regroupés dans la même session, sauf s’ils sont explicitement liés ou configurés ainsi.

| Résultat          | Cibles                            |
| ----------------- | --------------------------------- |
| Positif           | `make routing-isolation`          |
| Négatif (attendu) | `make routing-isolation-negative` |

## Modèles v1++ : concurrence, nouvelles tentatives et exactitude des traces

Modèles complémentaires qui améliorent la fidélité concernant les modes de défaillance réels : mises à jour non atomiques, nouvelles tentatives et diffusion des messages.

### Concurrence et idempotence du stockage des associations

**Affirmation :** le stockage des associations applique `MaxPending` et l’idempotence, même en cas d’entrelacement des opérations : la vérification suivie de l’écriture doit être atomique ou verrouillée, et l’actualisation ne doit pas créer de doublons. Concrètement, les demandes simultanées ne peuvent pas dépasser `MaxPending` pour un canal, et les demandes ou actualisations répétées pour la même paire `(channel, sender)` ne créent pas de lignes actives en attente en double.

| Résultat          | Cibles                                                                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Positif           | `make pairing-race` (vérification atomique ou verrouillée de la limite), `make pairing-idempotency`, `make pairing-refresh`, `make pairing-refresh-race`                     |
| Négatif (attendu) | `make pairing-race-negative` (condition de concurrence non atomique entre le début et la validation de la limite), `make pairing-idempotency-negative`, `make pairing-refresh-negative`, `make pairing-refresh-race-negative` |

### Corrélation des traces d’entrée et idempotence

**Affirmation :** l’ingestion préserve la corrélation des traces pendant la diffusion et reste idempotente lors des nouvelles tentatives du fournisseur. Lorsqu’un événement externe devient plusieurs messages internes, chaque partie conserve la même identité de trace ou d’événement ; les nouvelles tentatives n’entraînent aucun double traitement ; si les identifiants d’événement du fournisseur sont absents, la déduplication utilise une clé de secours sûre, par exemple l’identifiant de trace, afin d’éviter d’écarter des événements distincts.

| Résultat          | Cibles                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Positif           | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| Négatif (attendu) | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### Priorité de `dmScope` dans le routage et `identityLinks`

**Affirmation :** par défaut, le routage maintient les sessions de messages privés isolées et ne regroupe les sessions qu’en cas de configuration explicite, selon la priorité des canaux et les liens d’identité. Les valeurs de `dmScope` propres à un canal prévalent sur les valeurs globales par défaut ; `identityLinks` ne regroupe les sessions qu’au sein de groupes explicitement liés, sans regrouper des interlocuteurs sans rapport.

| Résultat          | Cibles                                                                    |
| ----------------- | ------------------------------------------------------------------------- |
| Positif           | `make routing-precedence`, `make routing-identitylinks`                   |
| Négatif (attendu) | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## Voir aussi

- [Modèle de menace](/fr/security/THREAT-MODEL-ATLAS)
- [Contribuer au modèle de menace](/fr/security/CONTRIBUTING-THREAT-MODEL)
- [Réponse aux incidents](/fr/security/incident-response)
