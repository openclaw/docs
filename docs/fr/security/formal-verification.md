---
permalink: /security/formal-verification/
read_when:
    - Examiner les garanties ou limites du modèle de sécurité formel
    - Reproduction ou mise à jour des vérifications du modèle de sécurité TLA+/TLC
summary: Modèles de sécurité vérifiés par machine pour les chemins les plus à risque d’OpenClaw.
title: Vérification formelle (modèles de sécurité)
x-i18n:
    generated_at: "2026-05-06T07:38:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298b92f27abb8321be807fe4d95c7cd568a0fb8f543d168863b2adb9b3ddcde4
    source_path: security/formal-verification.md
    workflow: 16
---

Cette page suit les **modèles de sécurité formels** d’OpenClaw (TLA+/TLC aujourd’hui ; davantage si nécessaire).

> Remarque : certains anciens liens peuvent faire référence au nom précédent du projet.

**Objectif (cap) :** fournir un argument vérifié par machine selon lequel OpenClaw applique sa
politique de sécurité prévue (autorisation, isolation des sessions, filtrage des outils et
sécurité face aux mauvaises configurations), sous des hypothèses explicites.

**Ce que c’est (aujourd’hui) :** une **suite de régression de sécurité** exécutable et pilotée par l’attaquant :

- Chaque revendication dispose d’une vérification de modèle exécutable sur un espace d’états fini.
- De nombreuses revendications disposent d’un **modèle négatif** associé qui produit une trace de contre-exemple pour une classe de bogues réaliste.

**Ce que ce n’est pas (encore) :** une preuve que « OpenClaw est sécurisé à tous égards » ou que l’implémentation TypeScript complète est correcte.

## Où se trouvent les modèles

Les modèles sont maintenus dans un dépôt séparé : [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Mises en garde importantes

- Ce sont des **modèles**, pas l’implémentation TypeScript complète. Une dérive entre le modèle et le code est possible.
- Les résultats sont bornés par l’espace d’états exploré par TLC ; « vert » n’implique pas une sécurité au-delà des hypothèses et limites modélisées.
- Certaines revendications reposent sur des hypothèses environnementales explicites (par exemple, déploiement correct, entrées de configuration correctes).

## Reproduire les résultats

Aujourd’hui, les résultats sont reproduits en clonant localement le dépôt des modèles et en exécutant TLC (voir ci-dessous). Une future itération pourrait proposer :

- des modèles exécutés par CI avec des artefacts publics (traces de contre-exemples, journaux d’exécution)
- un workflow hébergé « exécuter ce modèle » pour de petites vérifications bornées

Premiers pas :

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### Exposition du Gateway et mauvaise configuration d’un gateway ouvert

**Revendication :** une liaison au-delà de la boucle locale sans authentification peut rendre une compromission distante possible / accroît l’exposition ; un token/mot de passe bloque les attaquants non authentifiés (selon les hypothèses du modèle).

- Exécutions vertes :
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Rouge (attendu) :
  - `make gateway-exposure-v2-negative`

Voir aussi : `docs/gateway-exposure-matrix.md` dans le dépôt des modèles.

### Pipeline d’exécution Node (capacité présentant le risque le plus élevé)

**Revendication :** `exec host=node` exige (a) une liste d’autorisation des commandes node plus des commandes déclarées et (b) une approbation en direct lorsqu’elle est configurée ; les approbations sont tokenisées pour empêcher la relecture (dans le modèle).

- Exécutions vertes :
  - `make nodes-pipeline`
  - `make approvals-token`
- Rouge (attendu) :
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Store d’appariement (filtrage des DM)

**Revendication :** les demandes d’appariement respectent la TTL et les plafonds de demandes en attente.

- Exécutions vertes :
  - `make pairing`
  - `make pairing-cap`
- Rouge (attendu) :
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Filtrage d’entrée (mentions + contournement par commande de contrôle)

**Revendication :** dans les contextes de groupe exigeant une mention, une « commande de contrôle » non autorisée ne peut pas contourner le filtrage par mention.

- Vert :
  - `make ingress-gating`
- Rouge (attendu) :
  - `make ingress-gating-negative`

### Isolation du routage / de la clé de session

**Revendication :** les messages directs provenant de pairs distincts ne se regroupent pas dans la même session sauf s’ils sont explicitement liés/configurés.

- Vert :
  - `make routing-isolation`
- Rouge (attendu) :
  - `make routing-isolation-negative`

## v1++ : modèles bornés supplémentaires (concurrence, nouvelles tentatives, exactitude des traces)

Ce sont des modèles de suivi qui renforcent la fidélité autour des modes de défaillance réels (mises à jour non atomiques, nouvelles tentatives et diffusion des messages).

### Concurrence / idempotence du store d’appariement

**Revendication :** un store d’appariement doit appliquer `MaxPending` et l’idempotence même en présence d’entrelacements (c’est-à-dire que « vérifier puis écrire » doit être atomique / verrouillé ; l’actualisation ne doit pas créer de doublons).

Ce que cela signifie :

- En cas de demandes concurrentes, vous ne pouvez pas dépasser `MaxPending` pour un canal.
- Les demandes/actualisations répétées pour le même `(channel, sender)` ne doivent pas créer de lignes en attente actives en double.

- Exécutions vertes :
  - `make pairing-race` (vérification atomique/verrouillée du plafond)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Rouge (attendu) :
  - `make pairing-race-negative` (course de plafond begin/commit non atomique)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Corrélation / idempotence des traces d’entrée

**Revendication :** l’ingestion doit préserver la corrélation des traces lors de la diffusion et rester idempotente lors des nouvelles tentatives du fournisseur.

Ce que cela signifie :

- Lorsqu’un événement externe devient plusieurs messages internes, chaque partie conserve la même identité de trace/événement.
- Les nouvelles tentatives n’entraînent pas de double traitement.
- Si les ID d’événements du fournisseur sont absents, la déduplication se rabat sur une clé sûre (par exemple, l’ID de trace) afin d’éviter de supprimer des événements distincts.

- Vert :
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Rouge (attendu) :
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Précédence routing dmScope + identityLinks

**Revendication :** le routage doit garder les sessions de messages directs isolées par défaut, et ne regrouper les sessions que lorsqu’elles sont explicitement configurées (précédence des canaux + liens d’identité).

Ce que cela signifie :

- Les remplacements `dmScope` spécifiques au canal doivent l’emporter sur les valeurs par défaut globales.
- `identityLinks` ne doit regrouper que les groupes explicitement liés, pas des pairs non liés.

- Vert :
  - `make routing-precedence`
  - `make routing-identitylinks`
- Rouge (attendu) :
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## Connexe

- [Modèle de menace](/fr/security/THREAT-MODEL-ATLAS)
- [Contribuer au modèle de menace](/fr/security/CONTRIBUTING-THREAT-MODEL)
