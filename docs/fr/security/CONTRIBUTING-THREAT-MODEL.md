---
read_when:
    - Vous souhaitez soumettre des constats de sécurité ou des scénarios de menace
    - Examiner ou mettre à jour le modèle de menace
summary: Comment contribuer au modèle de menaces d’OpenClaw
title: Contribuer au modèle de menace
x-i18n:
    generated_at: "2026-05-06T18:00:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: a23ca088d7893180a83c02d6971bbf1c32affa724e43019fd40276eaadc52278
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Merci d'aider à rendre OpenClaw plus sécurisé. Ce modèle de menace est un document vivant et nous accueillons les contributions de toute personne - vous n'avez pas besoin d'être expert en sécurité.

## Façons de contribuer

### Ajouter une menace

Vous avez repéré un vecteur d'attaque ou un risque que nous n'avons pas couvert ? Ouvrez une issue sur [openclaw/trust](https://github.com/openclaw/trust/issues) et décrivez-la avec vos propres mots. Vous n'avez pas besoin de connaître de cadres ni de remplir tous les champs - décrivez simplement le scénario.

**Utile à inclure (mais non obligatoire) :**

- Le scénario d'attaque et la façon dont il pourrait être exploité
- Les parties d'OpenClaw qui sont affectées (CLI, Gateway, canaux, ClawHub, serveurs MCP, etc.)
- Le niveau de gravité que vous estimez (faible / moyen / élevé / critique)
- Tout lien vers des recherches connexes, des CVE ou des exemples réels

Nous nous chargerons de la correspondance ATLAS, des ID de menace et de l'évaluation des risques pendant la revue. Si vous souhaitez inclure ces détails, parfait - mais ce n'est pas attendu.

> **Ceci sert à ajouter des éléments au modèle de menace, pas à signaler des vulnérabilités actives.** Si vous avez trouvé une vulnérabilité exploitable, consultez notre [page Trust](https://trust.openclaw.ai) pour les instructions de divulgation responsable.

### Suggérer une mesure d'atténuation

Vous avez une idée pour traiter une menace existante ? Ouvrez une issue ou une PR faisant référence à la menace. Les mesures d'atténuation utiles sont spécifiques et actionnables - par exemple, « limitation du débit par expéditeur à 10 messages/minute au niveau du Gateway » est mieux que « implémenter une limitation du débit ».

### Proposer une chaîne d'attaque

Les chaînes d'attaque montrent comment plusieurs menaces se combinent dans un scénario d'attaque réaliste. Si vous voyez une combinaison dangereuse, décrivez les étapes et la manière dont un attaquant les enchaînerait. Un court récit de la façon dont l'attaque se déroule en pratique a plus de valeur qu'un modèle formel.

### Corriger ou améliorer le contenu existant

Fautes de frappe, clarifications, informations obsolètes, meilleurs exemples - les PR sont les bienvenues, aucune issue n'est nécessaire.

## Ce que nous utilisons

### Cadre MITRE ATLAS

Ce modèle de menace est basé sur [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), un cadre conçu spécifiquement pour les menaces IA/ML comme l'injection de prompt, le mauvais usage des outils et l'exploitation d'agents. Vous n'avez pas besoin de connaître ATLAS pour contribuer - nous faisons correspondre les soumissions au cadre pendant la revue.

### ID de menace

Chaque menace reçoit un ID comme `T-EXEC-003`. Les catégories sont :

| Code    | Catégorie                                  |
| ------- | ------------------------------------------ |
| RECON   | Reconnaissance - collecte d'informations   |
| ACCESS  | Accès initial - obtention d'une entrée     |
| EXEC    | Exécution - lancement d'actions malveillantes |
| PERSIST | Persistance - maintien de l'accès          |
| EVADE   | Évasion défensive - évitement de la détection |
| DISC    | Découverte - apprentissage de l'environnement |
| EXFIL   | Exfiltration - vol de données              |
| IMPACT  | Impact - dommage ou perturbation           |

Les ID sont attribués par les mainteneurs pendant la revue. Vous n'avez pas besoin d'en choisir un.

### Niveaux de risque

| Niveau       | Signification                                                     |
| ------------ | ----------------------------------------------------------------- |
| **Critique** | Compromission complète du système, ou forte probabilité + impact critique |
| **Élevé**    | Dommages importants probables, ou probabilité moyenne + impact critique |
| **Moyen**    | Risque modéré, ou faible probabilité + impact élevé               |
| **Faible**   | Peu probable et impact limité                                     |

Si vous n'êtes pas sûr du niveau de risque, décrivez simplement l'impact et nous l'évaluerons.

## Processus de revue

1. **Triage** - Nous examinons les nouvelles soumissions sous 48 heures
2. **Évaluation** - Nous vérifions la faisabilité, attribuons la correspondance ATLAS et l'ID de menace, validons le niveau de risque
3. **Documentation** - Nous nous assurons que tout est formaté et complet
4. **Fusion** - Ajout au modèle de menace et à la visualisation

## Ressources

- [Site Web ATLAS](https://atlas.mitre.org/)
- [Techniques ATLAS](https://atlas.mitre.org/techniques/)
- [Études de cas ATLAS](https://atlas.mitre.org/studies/)
- [Modèle de menace OpenClaw](/fr/security/THREAT-MODEL-ATLAS)

## Contact

- **Vulnérabilités de sécurité :** consultez notre [page Trust](https://trust.openclaw.ai) pour les instructions de signalement
- **Questions sur le modèle de menace :** ouvrez une issue sur [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Discussion générale :** canal Discord #security

## Reconnaissance

Les contributeurs au modèle de menace sont reconnus dans les remerciements du modèle de menace, les notes de publication et le tableau d'honneur de la sécurité OpenClaw pour les contributions significatives.

## Connexe

- [Modèle de menace](/fr/security/THREAT-MODEL-ATLAS)
- [Vérification formelle](/fr/security/formal-verification)
