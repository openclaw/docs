---
permalink: /security/formal-verification/
read_when:
    - Examen des garanties ou des limites du modèle de sécurité formel
    - Reproduction ou mise à jour des vérifications du modèle de sécurité TLA+/TLC
summary: Modèles de sécurité vérifiés automatiquement pour les parcours les plus à risque d’OpenClaw.
title: Vérification formelle (modèles de sécurité)
x-i18n:
    generated_at: "2026-07-12T15:50:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 86342f6e2f54c08d5e0f8a08d0d488459650a6ace35e985ff886f847540202c9
    source_path: security/formal-verification.md
    workflow: 16
---

Les modèles de sécurité formels d’OpenClaw (TLA+/TLC à ce jour) fournissent un argument vérifié par machine selon lequel certains parcours présentant les risques les plus élevés — autorisation, isolation des sessions, contrôle des outils et sécurité en cas de mauvaise configuration — appliquent la politique prévue, selon des hypothèses explicitement énoncées.

> Remarque : certains liens plus anciens peuvent faire référence à l’ancien nom du projet.

## Présentation

Une suite exécutable de tests de non-régression de sécurité pilotés par des attaquants :

- Chaque assertion dispose d’une vérification de modèle exécutable sur un espace d’états fini.
- De nombreuses assertions disposent d’un modèle négatif associé qui produit une trace de contre-exemple pour une catégorie réaliste de bogues.

Ceci ne constitue **pas** une preuve qu’OpenClaw est sécurisé à tous égards et ne vérifie pas l’intégralité de l’implémentation TypeScript.

## Emplacement des modèles

Les modèles sont maintenus dans un dépôt distinct : [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

<Note>
Ce dépôt est actuellement inaccessible (GitHub renvoie « Repository not found » au moment de la rédaction). S’il reste inaccessible pour vous, demandez son emplacement actuel dans les canaux des responsables d’OpenClaw avant de supposer que les modèles ont été supprimés.
</Note>

## Réserves

- Il s’agit de modèles, et non de l’implémentation TypeScript complète — une divergence entre le modèle et le code est possible.
- Les résultats sont limités par l’espace d’états exploré par TLC. Un résultat vert n’implique pas une sécurité au-delà des hypothèses et des limites modélisées.
- Certaines assertions reposent sur des hypothèses explicites concernant l’environnement (par exemple, un déploiement correct et des entrées de configuration correctes).

## Reproduction des résultats

Clonez le dépôt des modèles et exécutez TLC :

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ requis (TLC s’exécute sur la JVM).
# Le dépôt fournit une version épinglée de tla2tools.jar ainsi que bin/tlc et des cibles Make.

make <target>
```

Il n’existe pas encore d’intégration CI avec ce dépôt ; une future itération pourrait ajouter des modèles exécutés par la CI avec des artefacts publics (traces de contre-exemples, journaux d’exécution) ou un workflow hébergé « exécuter ce modèle » pour les petites vérifications bornées.

## Assertions et cibles

### Exposition du Gateway et mauvaise configuration d’un Gateway ouvert

**Assertion :** une liaison au-delà de l’interface de bouclage sans authentification peut permettre une compromission à distance et accroît l’exposition ; un jeton ou un mot de passe bloque les attaquants non authentifiés, selon les hypothèses du modèle.

| Résultat       | Cibles                                                           |
| -------------- | ---------------------------------------------------------------- |
| Vert           | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| Rouge (attendu) | `make gateway-exposure-v2-negative`                              |

Consultez également `docs/gateway-exposure-matrix.md` dans le dépôt des modèles.

### Pipeline d’exécution du Node (capacité présentant le risque le plus élevé)

**Assertion :** `exec host=node` exige (a) une liste d’autorisation des commandes du Node ainsi que des commandes déclarées et (b) une approbation en temps réel lorsqu’elle est configurée ; dans le modèle, les approbations sont associées à des jetons afin d’empêcher leur réutilisation.

| Résultat       | Cibles                                                          |
| -------------- | --------------------------------------------------------------- |
| Vert           | `make nodes-pipeline`, `make approvals-token`                   |
| Rouge (attendu) | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### Stockage d’appairage (contrôle des messages privés)

**Affirmation :** les demandes d’appairage respectent la durée de vie (TTL) et les limites du nombre de demandes en attente.

| Résultat       | Cibles                                               |
| -------------- | ---------------------------------------------------- |
| Vert           | `make pairing`, `make pairing-cap`                   |
| Rouge (attendu) | `make pairing-negative`, `make pairing-cap-negative` |

### Contrôle des entrées (mentions et contournement par commande de contrôle)

**Affirmation :** dans les contextes de groupe exigeant une mention, une commande de contrôle non autorisée ne peut pas contourner le contrôle des mentions.

| Résultat       | Cibles                         |
| -------------- | ------------------------------ |
| Vert           | `make ingress-gating`          |
| Rouge (attendu) | `make ingress-gating-negative` |

### Isolation du routage et des clés de session

**Affirmation :** les messages privés provenant de pairs distincts ne sont pas regroupés dans la même session, sauf s’ils sont explicitement liés ou configurés ainsi.

| Résultat       | Cibles                            |
| -------------- | --------------------------------- |
| Vert           | `make routing-isolation`          |
| Rouge (attendu) | `make routing-isolation-negative` |

## Modèles v1++ : concurrence, nouvelles tentatives et exactitude des traces

Modèles complémentaires qui renforcent la fidélité face aux modes de défaillance réels : mises à jour non atomiques, nouvelles tentatives et diffusion des messages.

### Concurrence et idempotence du magasin d’association

**Affirmation :** le magasin d’association garantit `MaxPending` et l’idempotence même en cas d’entrelacements — la vérification suivie de l’écriture doit être atomique ou verrouillée, et l’actualisation ne doit pas créer de doublons. Concrètement : les requêtes simultanées ne peuvent pas dépasser `MaxPending` pour un canal, et les requêtes ou actualisations répétées pour le même `(channel, sender)` ne créent pas de lignes en attente actives en double.

| Résultat       | Cibles                                                                                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vert           | `make pairing-race` (vérification atomique ou verrouillée de la limite), `make pairing-idempotency`, `make pairing-refresh`, `make pairing-refresh-race`                    |
| Rouge (attendu) | `make pairing-race-negative` (course sur la limite avec début/validation non atomiques), `make pairing-idempotency-negative`, `make pairing-refresh-negative`, `make pairing-refresh-race-negative` |

### Corrélation des traces et idempotence à l’entrée

**Affirmation :** l’ingestion préserve la corrélation des traces lors de la diffusion et reste idempotente en cas de nouvelles tentatives du fournisseur. Lorsqu’un événement externe devient plusieurs messages internes, chaque partie conserve la même identité de trace et d’événement ; les nouvelles tentatives n’entraînent pas de double traitement ; si les identifiants d’événement du fournisseur sont absents, la déduplication utilise une clé de repli sûre (par exemple l’identifiant de trace) afin d’éviter d’écarter des événements distincts.

| Résultat          | Cibles                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Vert              | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| Rouge (attendu)   | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### Priorité de dmScope dans le routage et identityLinks

**Affirmation :** le routage maintient les sessions de messages privés isolées par défaut et ne les fusionne que lorsque cela est explicitement configuré, selon la priorité du canal et les liens d’identité. Les remplacements de `dmScope` propres à un canal prévalent sur les valeurs globales par défaut ; `identityLinks` ne fusionne les sessions qu’au sein de groupes explicitement liés, et non entre des interlocuteurs sans lien.

| Résultat       | Cibles                                                                    |
| -------------- | ------------------------------------------------------------------------- |
| Vert           | `make routing-precedence`, `make routing-identitylinks`                   |
| Rouge (attendu) | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## Pages connexes

- [Modèle de menace](/fr/security/THREAT-MODEL-ATLAS)
- [Contribuer au modèle de menace](/fr/security/CONTRIBUTING-THREAT-MODEL)
- [Réponse aux incidents](/fr/security/incident-response)
