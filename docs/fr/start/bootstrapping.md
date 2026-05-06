---
read_when:
    - Comprendre ce qui se passe lors de la première exécution de l’agent
    - Expliquer où se trouvent les fichiers d’amorçage
    - Débogage de la configuration de l’identité d’intégration
sidebarTitle: Bootstrapping
summary: Rituel d’amorçage de l’agent qui initialise l’espace de travail et les fichiers d’identité
title: Amorçage de l’agent
x-i18n:
    generated_at: "2026-05-06T07:38:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: e25f05ca47184068b87f0bf8b7dea1c427f4ed48edde170a74888d586b8a606d
    source_path: start/bootstrapping.md
    workflow: 16
---

L’amorçage est le rituel de **première exécution** qui prépare un espace de travail d’agent et
collecte les détails d’identité. Il a lieu après l’intégration, lorsque l’agent démarre
pour la première fois.

## Ce que fait l’amorçage

Lors de la première exécution de l’agent, OpenClaw amorce l’espace de travail (par défaut
`~/.openclaw/workspace`) :

- Initialise `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Exécute un court rituel de questions-réponses (une question à la fois).
- Écrit l’identité et les préférences dans `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Supprime `BOOTSTRAP.md` une fois terminé afin qu’il ne s’exécute qu’une seule fois.

Pour les exécutions de modèles intégrés/locaux, OpenClaw garde `BOOTSTRAP.md` hors du
contexte système privilégié. Lors de la première exécution interactive principale, il transmet tout de même
le contenu du fichier dans le prompt utilisateur afin que les modèles qui n’appellent pas de manière fiable l’outil
`read` puissent terminer le rituel. Si l’exécution actuelle ne peut pas accéder en toute sécurité à
l’espace de travail, l’agent reçoit une note d’amorçage limitée au lieu d’un message de salutation générique.

## Ignorer l’amorçage

Pour l’ignorer avec un espace de travail préinitialisé, exécutez `openclaw onboard --skip-bootstrap`.

## Où il s’exécute

L’amorçage s’exécute toujours sur l’**hôte Gateway**. Si l’application macOS se connecte à
un Gateway distant, l’espace de travail et les fichiers d’amorçage résident sur cette machine
distante.

<Note>
Lorsque le Gateway s’exécute sur une autre machine, modifiez les fichiers de l’espace de travail sur l’hôte Gateway
(par exemple, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentation associée

- Intégration de l’application macOS : [Intégration](/fr/start/onboarding)
- Organisation de l’espace de travail : [Espace de travail de l’agent](/fr/concepts/agent-workspace)
