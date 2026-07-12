---
read_when:
    - Comprendre ce qui se passe lors de la première exécution de l’agent
    - Explication de l’emplacement des fichiers d’amorçage
    - Débogage de la configuration de l’identité lors de l’intégration
sidebarTitle: Bootstrapping
summary: Rituel d’amorçage de l’agent qui initialise l’espace de travail et les fichiers d’identité
title: Amorçage de l’agent
x-i18n:
    generated_at: "2026-07-12T16:00:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d8356684e8567b02f558ce2b455a20019e55579e5dcb4625bb441d66656098e0
    source_path: start/bootstrapping.md
    workflow: 16
---

L’amorçage est le rituel de première exécution qui initialise un nouvel espace de travail d’agent et
guide l’agent dans le choix d’une identité. Il s’exécute une seule fois, juste après
l’intégration, lors du premier véritable tour de l’agent.

## Déroulement

Lors de la première exécution dans un tout nouvel espace de travail (`~/.openclaw/workspace` par défaut),
OpenClaw :

- Initialise `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` et `BOOTSTRAP.md`.
- Demande à l’agent de suivre `BOOTSTRAP.md` : une conversation libre (et non un formulaire fixe de questions-réponses) pour choisir un nom, une personnalité et une ambiance.
- Consigne ce qu’il apprend dans `IDENTITY.md`, `USER.md` et `SOUL.md`.
- Supprime `BOOTSTRAP.md` une fois que l’espace de travail semble configuré, afin que le rituel ne s’exécute qu’une seule fois.

Un espace de travail est considéré comme configuré dès que `SOUL.md`, `IDENTITY.md` ou `USER.md`
diffère de son modèle initial, ou qu’un dossier `memory/` existe.

<Note>
`BOOTSTRAP.md` couvre l’intégralité de la conversation sur l’identité. Consultez son contenu dans le
[modèle BOOTSTRAP.md](/fr/reference/templates/BOOTSTRAP).
</Note>

## Exécutions avec des modèles intégrés et locaux

Pour les exécutions avec des modèles intégrés ou locaux, OpenClaw maintient `BOOTSTRAP.md` hors du
contexte système privilégié. Lors de la première exécution interactive principale, il
transmet néanmoins le contenu du fichier dans le prompt utilisateur, afin que les modèles qui
n’appellent pas systématiquement l’outil `read` puissent tout de même accomplir le rituel. Si l’exécution
actuelle ne peut pas accéder de manière sécurisée à l’espace de travail, l’agent reçoit une courte note
d’amorçage limité au lieu d’un message d’accueil générique.

## Ignorer l’amorçage

Pour ignorer cette étape dans un espace de travail préinitialisé, exécutez :

```bash
openclaw onboard --skip-bootstrap
```

## Lieu d’exécution

L’amorçage s’exécute toujours sur l’hôte du Gateway. Si l’application macOS se connecte à un
Gateway distant, l’espace de travail et ses fichiers d’amorçage résident sur cette machine
distante, et non sur le Mac.

<Note>
Lorsque le Gateway s’exécute sur une autre machine, modifiez les fichiers de l’espace de travail sur l’hôte du Gateway
(par exemple, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentation associée

- Intégration de l’application macOS : [Intégration](/fr/start/onboarding)
- Organisation de l’espace de travail : [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- Contenu du modèle : [Modèle BOOTSTRAP.md](/fr/reference/templates/BOOTSTRAP)
