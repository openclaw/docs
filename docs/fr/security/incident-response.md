---
read_when:
    - Répondre à un signalement de sécurité ou à un incident de sécurité suspecté
    - Préparation d’une divulgation coordonnée ou d’une version de sécurité corrigée
    - Examen des attentes de suivi après incident
summary: Comment OpenClaw qualifie, traite et assure le suivi des incidents de sécurité
title: Réponse aux incidents
x-i18n:
    generated_at: "2026-05-03T21:38:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef39b037cf3574a61fd67b356654f1ea0b91d84f89345c22aae93c1db7694df8
    source_path: security/incident-response.md
    workflow: 16
---

# Réponse aux incidents

## 1. Détection et triage

Nous surveillons les signaux de sécurité provenant de :

- GitHub Security Advisories (GHSA) et rapports de vulnérabilité privés.
- Problèmes/discussions GitHub publics lorsque les rapports ne sont pas sensibles.
- Signaux automatisés (par exemple Dependabot, CodeQL, avis npm et analyse des secrets).

Triage initial :

1. Confirmer le composant affecté, la version et l’impact sur la frontière de confiance.
2. Classer comme problème de sécurité ou renforcement/sans action en utilisant le périmètre et les règles hors périmètre du fichier `SECURITY.md` du dépôt.
3. Un responsable d’incident répond en conséquence.

## 2. Évaluation

Guide de sévérité :

- **Critique :** Compromission d’un paquet, d’une version ou d’un dépôt, exploitation active, ou contournement non authentifié d’une frontière de confiance avec contrôle à fort impact ou exposition de données.
- **Élevée :** Contournement vérifié d’une frontière de confiance nécessitant des préconditions limitées (par exemple une action authentifiée mais non autorisée à fort impact), ou exposition d’identifiants sensibles détenus par OpenClaw.
- **Moyenne :** Faiblesse de sécurité significative avec impact pratique, mais exploitabilité limitée ou prérequis substantiels.
- **Faible :** Constats de défense en profondeur, déni de service à périmètre étroit, ou lacunes de renforcement/parité sans contournement démontré d’une frontière de confiance.

## 3. Réponse

1. Accuser réception auprès du rapporteur (en privé lorsque c’est sensible).
2. Reproduire sur les versions prises en charge et sur le dernier `main`, puis implémenter et valider un correctif avec couverture de régression.
3. Pour les incidents critiques/élevés, préparer les versions corrigées aussi rapidement que possible.
4. Pour les incidents moyens/faibles, corriger dans le flux de publication normal et documenter les consignes d’atténuation.

## 4. Communication

Nous communiquons via :

- GitHub Security Advisories dans le dépôt affecté.
- Notes de version/entrées de changelog pour les versions corrigées.
- Suivi direct avec le rapporteur concernant l’état et la résolution.

Politique de divulgation :

- Les incidents critiques/élevés doivent faire l’objet d’une divulgation coordonnée, avec attribution d’un CVE lorsque c’est approprié.
- Les constats de renforcement à faible risque peuvent être documentés dans les notes de version ou les avis sans CVE, selon l’impact et l’exposition des utilisateurs.

## 5. Récupération et suivi

Après la publication du correctif :

1. Vérifier les remédiations dans la CI et les artefacts de publication.
2. Mener une courte revue post-incident (chronologie, cause racine, lacune de détection, plan de prévention).
3. Ajouter des tâches de suivi de renforcement/tests/docs et les suivre jusqu’à leur achèvement.
