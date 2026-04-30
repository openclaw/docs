---
read_when:
    - Vous souhaitez soumettre des constats de sécurité ou des scénarios de menace
    - Examen ou mise à jour du modèle de menace
summary: Comment contribuer au modèle de menaces d’OpenClaw
title: Contribuer au modèle de menace
x-i18n:
    generated_at: "2026-04-30T07:48:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75cf2b408a78fce5134d24a3f115490da2dacc4ba8a1a24415425c3e4420ca55
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

# Contribuer au modèle de menace d’OpenClaw

Merci de contribuer à rendre OpenClaw plus sûr. Ce modèle de menace est un document vivant et nous accueillons les contributions de toute personne ; il n’est pas nécessaire d’être expert en sécurité.

## Façons de contribuer

### Ajouter une menace

Vous avez repéré un vecteur d’attaque ou un risque que nous n’avons pas couvert ? Ouvrez une issue sur [openclaw/trust](https://github.com/openclaw/trust/issues) et décrivez-le avec vos propres mots. Vous n’avez pas besoin de connaître des frameworks ni de remplir tous les champs ; décrivez simplement le scénario.

**Utile à inclure (mais non obligatoire) :**

- Le scénario d’attaque et la manière dont il pourrait être exploité
- Les parties d’OpenClaw qui sont affectées (CLI, Gateway, canaux, ClawHub, serveurs MCP, etc.)
- Le niveau de gravité que vous estimez (faible / moyen / élevé / critique)
- Tout lien vers des recherches, CVE ou exemples réels liés

Nous gérerons la correspondance ATLAS, les identifiants de menace et l’évaluation du risque pendant la revue. Si vous souhaitez inclure ces détails, très bien, mais ce n’est pas attendu.

> **Ceci sert à enrichir le modèle de menace, pas à signaler des vulnérabilités actives.** Si vous avez trouvé une vulnérabilité exploitable, consultez notre [page Trust](https://trust.openclaw.ai) pour les instructions de divulgation responsable.

### Suggérer une atténuation

Vous avez une idée pour traiter une menace existante ? Ouvrez une issue ou une PR en référençant la menace. Les atténuations utiles sont spécifiques et actionnables ; par exemple, « limitation de débit par expéditeur à 10 messages/minute au niveau du Gateway » est préférable à « implémenter une limitation de débit ».

### Proposer une chaîne d’attaque

Les chaînes d’attaque montrent comment plusieurs menaces se combinent en un scénario d’attaque réaliste. Si vous voyez une combinaison dangereuse, décrivez les étapes et la manière dont un attaquant les enchaînerait. Un court récit décrivant comment l’attaque se déroule en pratique est plus précieux qu’un modèle formel.

### Corriger ou améliorer le contenu existant

Fautes de frappe, clarifications, informations obsolètes, meilleurs exemples : les PR sont bienvenues, aucune issue n’est nécessaire.

## Ce que nous utilisons

### MITRE ATLAS

Ce modèle de menace est construit sur [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), un framework conçu spécifiquement pour les menaces IA/ML comme l’injection de prompt, le mauvais usage des outils et l’exploitation d’agents. Vous n’avez pas besoin de connaître ATLAS pour contribuer ; nous associons les soumissions au framework pendant la revue.

### Identifiants de menace

Chaque menace reçoit un identifiant comme `T-EXEC-003`. Les catégories sont :

| Code    | Catégorie                                  |
| ------- | ------------------------------------------ |
| RECON   | Reconnaissance - collecte d’informations   |
| ACCESS  | Accès initial - obtention d’un accès        |
| EXEC    | Exécution - lancement d’actions malveillantes |
| PERSIST | Persistance - maintien de l’accès          |
| EVADE   | Évasion défensive - contournement de la détection |
| DISC    | Découverte - apprentissage de l’environnement |
| EXFIL   | Exfiltration - vol de données              |
| IMPACT  | Impact - dommages ou perturbation          |

Les identifiants sont attribués par les mainteneurs pendant la revue. Vous n’avez pas besoin d’en choisir un.

### Niveaux de risque

| Niveau       | Signification                                                    |
| ------------ | ---------------------------------------------------------------- |
| **Critique** | Compromission complète du système, ou forte probabilité + impact critique |
| **Élevé**    | Dommages importants probables, ou probabilité moyenne + impact critique |
| **Moyen**    | Risque modéré, ou faible probabilité + impact élevé              |
| **Faible**   | Peu probable et impact limité                                    |

Si vous n’êtes pas sûr du niveau de risque, décrivez simplement l’impact et nous l’évaluerons.

## Processus de revue

1. **Triage** - Nous examinons les nouvelles soumissions sous 48 heures
2. **Évaluation** - Nous vérifions la faisabilité, attribuons la correspondance ATLAS et l’identifiant de menace, et validons le niveau de risque
3. **Documentation** - Nous nous assurons que tout est formaté et complet
4. **Fusion** - Ajout au modèle de menace et à la visualisation

## Ressources

- [Site Web ATLAS](https://atlas.mitre.org/)
- [Techniques ATLAS](https://atlas.mitre.org/techniques/)
- [Études de cas ATLAS](https://atlas.mitre.org/studies/)
- [Modèle de menace OpenClaw](/fr/security/THREAT-MODEL-ATLAS)

## Contact

- **Vulnérabilités de sécurité :** Consultez notre [page Trust](https://trust.openclaw.ai) pour les instructions de signalement
- **Questions sur le modèle de menace :** Ouvrez une issue sur [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Discussion générale :** canal Discord #security

## Reconnaissance

Les contributeurs au modèle de menace sont reconnus dans les remerciements du modèle de menace, les notes de version et le panthéon de la sécurité OpenClaw pour les contributions importantes.

## Liens connexes

- [Modèle de menace](/fr/security/THREAT-MODEL-ATLAS)
- [Vérification formelle](/fr/security/formal-verification)
