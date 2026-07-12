---
read_when:
    - Répondre à un signalement de sécurité ou à un incident de sécurité présumé
    - Préparation d’une divulgation coordonnée ou d’une version de sécurité corrigée
    - Examen des attentes en matière de suivi après incident
summary: Comment OpenClaw trie, traite et assure le suivi des incidents de sécurité
title: Réponse aux incidents
x-i18n:
    generated_at: "2026-07-12T03:06:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 30f2d754408e95133ee86254ce193c0d8aab293040df55e0c1cec0c4d7644c56
    source_path: security/incident-response.md
    workflow: 16
---

## 1. Détection et triage

Les signaux de sécurité proviennent des sources suivantes :

- Avis de sécurité GitHub (GHSA) et signalements privés de vulnérabilités.
- Problèmes et discussions publics sur GitHub lorsque les signalements ne sont pas sensibles.
- Signaux automatisés : Dependabot, CodeQL, avis npm, analyse des secrets.

Triage initial :

1. Confirmer le composant et la version concernés, ainsi que l’incidence sur la frontière de confiance.
2. Déterminer s’il s’agit d’un problème de sécurité ou d’un cas de durcissement/ne nécessitant aucune action, en appliquant les règles de périmètre et d’exclusion de `SECURITY.md`.
3. Un responsable de l’incident intervient en conséquence.

## 2. Gravité

| Gravité  | Définition                                                                                                                                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Critique | Compromission d’un paquet, d’une version publiée ou du dépôt, exploitation active, ou contournement non authentifié d’une frontière de confiance permettant un contrôle à fort impact ou l’exposition de données.                    |
| Élevée   | Contournement avéré d’une frontière de confiance nécessitant des conditions préalables limitées (par exemple, une action authentifiée, mais non autorisée, à fort impact), ou exposition d’identifiants sensibles détenus par OpenClaw. |
| Moyenne  | Faiblesse de sécurité importante ayant une incidence concrète, mais dont l’exploitation est limitée ou nécessite des conditions préalables substantielles.                                                                          |
| Faible   | Constats relevant de la défense en profondeur, déni de service de portée restreinte, ou lacunes de durcissement ou de parité sans contournement démontré d’une frontière de confiance.                                               |

## 3. Réponse

1. Accuser réception auprès de la personne ayant effectué le signalement (en privé lorsque celui-ci est sensible).
2. Reproduire le problème sur les versions prises en charge et la dernière version de `main`, puis implémenter et valider un correctif avec une couverture de tests de non-régression.
3. Gravité critique/élevée : préparer les versions corrigées aussi rapidement que possible.
4. Gravité moyenne/faible : intégrer le correctif au cycle normal de publication et documenter les mesures d’atténuation.

## 4. Communication et divulgation

Communiquer par l’intermédiaire des avis de sécurité GitHub du dépôt concerné, des notes de version ou des entrées du journal des modifications pour les versions corrigées, ainsi que par un suivi direct auprès de la personne ayant effectué le signalement concernant l’état et la résolution du problème.

Les incidents de gravité critique ou élevée font l’objet d’une divulgation coordonnée, avec l’attribution d’un identifiant CVE lorsque cela est approprié. Les constats de durcissement à faible risque peuvent être documentés dans les notes de version ou les avis sans identifiant CVE, selon leur incidence et le degré d’exposition des utilisateurs.

## 5. Rétablissement et suivi

Après la publication du correctif :

1. Vérifier les mesures correctives dans la CI et les artefacts de publication.
2. Effectuer une brève analyse post-incident : chronologie, cause profonde, lacune de détection et plan de prévention.
3. Ajouter des tâches de suivi portant sur le durcissement, les tests et la documentation, puis en assurer le suivi jusqu’à leur achèvement.

## Pages associées

- [Politique de sécurité](https://github.com/openclaw/openclaw/blob/main/SECURITY.md) — périmètre des signalements et modèle de confiance.
- [Modèle de menace](/fr/security/THREAT-MODEL-ATLAS)
