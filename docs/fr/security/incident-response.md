---
read_when:
    - Répondre à un rapport de sécurité ou à un incident de sécurité suspecté
    - Préparer une divulgation coordonnée ou une version de sécurité corrigée
    - Examen des attentes en matière de suivi après incident
summary: Comment OpenClaw qualifie les incidents de sécurité, y répond et en assure le suivi
title: Réponse aux incidents
x-i18n:
    generated_at: "2026-05-06T07:38:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 546b69242fc4674e3d27e79e4c7b5cfecb83bcb17e8edb2a4b62f1a7498fb84f
    source_path: security/incident-response.md
    workflow: 16
---

## 1. Détection et triage

Nous surveillons les signaux de sécurité provenant de :

- Avis de sécurité GitHub (GHSA) et rapports de vulnérabilité privés.
- Issues/discussions GitHub publiques lorsque les rapports ne sont pas sensibles.
- Signaux automatisés (par exemple Dependabot, CodeQL, avis npm et analyse des secrets).

Triage initial :

1. Confirmer le composant affecté, la version et l’impact sur la limite de confiance.
2. Classer comme problème de sécurité ou durcissement/aucune action à entreprendre selon le périmètre et les règles hors périmètre du fichier `SECURITY.md` du dépôt.
3. Un responsable d’incident répond en conséquence.

## 2. Évaluation

Guide de sévérité :

- **Critique :** Compromission de package/release/dépôt, exploitation active, ou contournement non authentifié de limite de confiance avec contrôle à fort impact ou exposition de données.
- **Élevée :** Contournement vérifié de limite de confiance nécessitant des préconditions limitées (par exemple une action à fort impact authentifiée mais non autorisée), ou exposition d’identifiants sensibles appartenant à OpenClaw.
- **Moyenne :** Faiblesse de sécurité significative avec impact pratique, mais exploitabilité contrainte ou prérequis importants.
- **Faible :** Constats de défense en profondeur, déni de service à portée étroite, ou écarts de durcissement/parité sans contournement démontré de limite de confiance.

## 3. Réponse

1. Accuser réception auprès du rapporteur (en privé lorsque c’est sensible).
2. Reproduire sur les releases prises en charge et sur le dernier `main`, puis implémenter et valider un correctif avec une couverture de régression.
3. Pour les incidents critiques/élevés, préparer des release(s) corrigées aussi rapidement que possible en pratique.
4. Pour les incidents moyens/faibles, corriger dans le flux de release normal et documenter les conseils d’atténuation.

## 4. Communication

Nous communiquons via :

- Les avis de sécurité GitHub dans le dépôt affecté.
- Les notes de release/entrées de changelog pour les versions corrigées.
- Un suivi direct avec le rapporteur sur l’état et la résolution.

Politique de divulgation :

- Les incidents critiques/élevés doivent faire l’objet d’une divulgation coordonnée, avec émission d’un CVE lorsque cela est approprié.
- Les constats de durcissement à faible risque peuvent être documentés dans les notes de release ou les avis sans CVE, selon l’impact et l’exposition des utilisateurs.

## 5. Récupération et suivi

Après l’expédition du correctif :

1. Vérifier les remédiations dans la CI et les artefacts de release.
2. Exécuter une courte revue post-incident (chronologie, cause racine, lacune de détection, plan de prévention).
3. Ajouter des tâches de suivi de durcissement/tests/docs et les suivre jusqu’à leur achèvement.
