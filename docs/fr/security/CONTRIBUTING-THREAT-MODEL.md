---
read_when:
    - Vous souhaitez contribuer en signalant des problèmes de sécurité ou des scénarios de menace
    - Examiner ou mettre à jour le modèle de menace
summary: Comment contribuer au modèle de menace d’OpenClaw
title: Contribuer au modèle de menace
x-i18n:
    generated_at: "2026-07-12T15:59:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4e2e5cd95e8a2bf5ee4bd167afedfadf9aa876e4260e2d0bfb5f414cd4255410
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

Le [modèle de menace](/fr/security/THREAT-MODEL-ATLAS) est un document évolutif. Les contributions de toutes et tous sont les bienvenues ; aucune expérience en sécurité ou avec MITRE ATLAS n’est nécessaire.

<Note>
Cette procédure sert à enrichir le modèle de menace, et non à signaler des vulnérabilités actives. Si vous avez découvert une vulnérabilité exploitable, suivez plutôt les instructions de divulgation responsable figurant sur la [page Trust](https://trust.openclaw.ai).
</Note>

## Moyens de contribuer

**Ajouter une menace.** Ouvrez un ticket sur [openclaw/trust](https://github.com/openclaw/trust/issues) en décrivant le scénario d’attaque avec vos propres mots. Les informations suivantes sont utiles, mais facultatives :

- Le scénario d’attaque et la manière dont il pourrait être exploité.
- Les composants concernés (CLI, Gateway, canaux, ClawHub, serveurs MCP, etc.).
- Votre estimation de la gravité (faible / moyenne / élevée / critique).
- Des liens vers des recherches, des CVE ou des exemples réels associés.

Lors de l’examen, les responsables attribuent la correspondance ATLAS, l’identifiant de menace et le niveau de risque.

**Suggérer une mesure d’atténuation.** Ouvrez un ticket ou une PR faisant référence à la menace. Soyez précis et proposez une action concrète : « limiter chaque expéditeur à 10 messages par minute au niveau du Gateway » est plus utile que « mettre en œuvre une limitation du débit ».

**Proposer une chaîne d’attaque.** Les chaînes d’attaque montrent comment plusieurs menaces se combinent pour former un scénario réaliste. Décrivez les étapes et la manière dont une personne malveillante les enchaînerait ; un court récit vaut mieux qu’un modèle formel.

**Corriger ou améliorer le contenu existant.** Fautes de frappe, clarifications, informations obsolètes, meilleurs exemples : les PR sont les bienvenues, sans qu’un ticket soit nécessaire.

## Référence du cadre

Les menaces sont associées à [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), un cadre consacré aux menaces propres à l’IA et à l’apprentissage automatique, telles que l’injection de prompt, l’utilisation abusive d’outils et l’exploitation d’agents. Il n’est pas nécessaire de connaître ATLAS pour contribuer ; les responsables associent les propositions au cadre lors de l’examen.

**Identifiants de menace.** Chaque menace reçoit un identifiant tel que `T-EXEC-003`, attribué par les responsables lors de l’examen.

| Code    | Catégorie                                           |
| ------- | --------------------------------------------------- |
| RECON   | Reconnaissance - collecte d’informations            |
| ACCESS  | Accès initial - obtention d’un accès                 |
| EXEC    | Exécution - réalisation d’actions malveillantes     |
| PERSIST | Persistance - maintien de l’accès                    |
| EVADE   | Contournement des défenses - éviter la détection    |
| DISC    | Découverte - collecte d’informations sur le système |
| EXFIL   | Exfiltration - vol de données                       |
| IMPACT  | Impact - dommages ou perturbations                   |

**Niveaux de risque.** Si vous n’êtes pas certain du niveau, décrivez simplement l’impact ; les responsables l’évalueront.

| Niveau       | Signification                                                          |
| ------------ | ---------------------------------------------------------------------- |
| **Critique** | Compromission complète du système, ou probabilité élevée + impact critique |
| **Élevé**    | Dommages importants probables, ou probabilité moyenne + impact critique |
| **Moyen**    | Risque modéré, ou faible probabilité + impact élevé                    |
| **Faible**   | Impact improbable et limité                                            |

## Processus d’examen

1. **Triage** - les nouvelles propositions sont examinées sous 48 heures.
2. **Évaluation** - les responsables vérifient la faisabilité, attribuent la correspondance ATLAS et l’identifiant de menace, puis valident le niveau de risque.
3. **Documentation** - vérification de la mise en forme et de l’exhaustivité.
4. **Fusion** - ajout au modèle de menace et à sa visualisation.

## Ressources

- [Site web d’ATLAS](https://atlas.mitre.org/)
- [Techniques ATLAS](https://atlas.mitre.org/techniques/)
- [Études de cas ATLAS](https://atlas.mitre.org/studies/)

## Contact

- **Vulnérabilités de sécurité :** consultez la [page Trust](https://trust.openclaw.ai) pour connaître les instructions de signalement, ou écrivez à `security@openclaw.ai`.
- **Questions sur le modèle de menace :** ouvrez un ticket sur [openclaw/trust](https://github.com/openclaw/trust/issues).
- **Discussion générale :** canal Discord `#security`.

## Reconnaissance

Les personnes qui contribuent au modèle de menace sont citées dans ses remerciements et dans les notes de version. Les contributions importantes sont également reconnues dans le tableau d’honneur de la sécurité d’OpenClaw.

## Contenu associé

- [Modèle de menace](/fr/security/THREAT-MODEL-ATLAS)
- [Réponse aux incidents](/fr/security/incident-response)
- [Vérification formelle](/fr/security/formal-verification)
