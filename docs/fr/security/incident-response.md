---
read_when:
    - Répondre à un signalement de sécurité ou à un incident de sécurité présumé
    - Préparation d’une divulgation coordonnée ou d’une version de sécurité corrigée
    - Examen des attentes en matière de suivi après incident
summary: Comment OpenClaw trie, traite et assure le suivi des incidents de sécurité
title: Réponse aux incidents
x-i18n:
    generated_at: "2026-07-12T16:00:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 30f2d754408e95133ee86254ce193c0d8aab293040df55e0c1cec0c4d7644c56
    source_path: security/incident-response.md
    workflow: 16
---

## 1. Détection et triage

Les signaux de sécurité proviennent des sources suivantes :

- Avis de sécurité GitHub (GHSA) et signalements privés de vulnérabilités.
- Issues/discussions GitHub publiques lorsque les signalements ne sont pas sensibles.
- Signaux automatisés : Dependabot, CodeQL, avis npm, analyse des secrets.

Triage initial :

1. Confirmer le composant et la version affectés, ainsi que l'impact sur la frontière de confiance.
2. Déterminer s'il s'agit d'un problème de sécurité ou d'un renforcement ne nécessitant aucune action, en appliquant les règles de périmètre et d'exclusion de `SECURITY.md`.
3. Un responsable de l'incident intervient en conséquence.

## 2. Gravité

| Gravité  | Définition                                                                                                                                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Critique | Compromission d'un paquet, d'une version publiée ou d'un dépôt, exploitation active ou contournement non authentifié d'une frontière de confiance permettant un contrôle à fort impact ou l'exposition de données.        |
| Élevée   | Contournement vérifié d'une frontière de confiance nécessitant des conditions préalables limitées (par exemple, une action authentifiée mais non autorisée à fort impact), ou exposition d'identifiants sensibles appartenant à OpenClaw. |
| Moyenne  | Faiblesse de sécurité importante ayant un impact concret, mais dont l'exploitabilité est limitée ou qui nécessite des conditions préalables substantielles.                                                               |
| Faible   | Constatations relevant de la défense en profondeur, déni de service à portée limitée ou lacunes de renforcement ou de parité sans contournement démontré d'une frontière de confiance.                                   |

## 3. Réponse

1. Accuser réception auprès de la personne ayant effectué le signalement (en privé lorsque celui-ci est sensible).
2. Reproduire le problème sur les versions prises en charge et la dernière version de `main`, puis implémenter et valider un correctif avec une couverture des régressions.
3. Critique/élevée : préparer les versions corrigées aussi rapidement que possible.
4. Moyenne/faible : intégrer le correctif au cycle normal de publication et documenter les mesures d'atténuation.

## 4. Communication et divulgation

Communiquer au moyen des avis de sécurité GitHub dans le dépôt concerné, des notes de version ou entrées du journal des modifications pour les versions corrigées, ainsi que d'un suivi direct auprès de la personne ayant effectué le signalement concernant l'état et la résolution.

Les incidents critiques ou de gravité élevée font l'objet d'une divulgation coordonnée, avec attribution d'un CVE lorsque cela est approprié. Les constatations de renforcement à faible risque peuvent être documentées dans les notes de version ou les avis sans CVE, selon leur impact et l'exposition des utilisateurs.

## 5. Rétablissement et suivi

Après la publication du correctif :

1. Vérifier les mesures correctives dans la CI et les artefacts de publication.
2. Effectuer une brève analyse post-incident : chronologie, cause racine, lacune de détection et plan de prévention.
3. Ajouter des tâches de suivi concernant le renforcement, les tests et la documentation, puis en assurer le suivi jusqu'à leur achèvement.

## Pages connexes

- [Politique de sécurité](https://github.com/openclaw/openclaw/blob/main/SECURITY.md) — périmètre des signalements et modèle de confiance.
- [Modèle de menaces](/fr/security/THREAT-MODEL-ATLAS)
