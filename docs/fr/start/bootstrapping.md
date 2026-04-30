---
read_when:
    - Comprendre ce qui se passe lors de la première exécution de l’agent
    - Explication de l’emplacement des fichiers d’amorçage
    - Débogage de la configuration de l’identité lors de l’intégration
sidebarTitle: Bootstrapping
summary: Rituel d’amorçage de l’agent qui initialise l’espace de travail et les fichiers d’identité
title: Amorçage de l’agent
x-i18n:
    generated_at: "2026-04-30T07:49:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: de829f82016ae1e4dcd7714502ca8d11755556fed18b985a7e2bada4149a2d46
    source_path: start/bootstrapping.md
    workflow: 16
---

L’amorçage est le rituel de **première exécution** qui prépare l’espace de travail d’un agent et
collecte les détails d’identité. Il se produit après l’onboarding, lorsque l’agent démarre
pour la première fois.

## Ce que fait l’amorçage

Lors de la première exécution de l’agent, OpenClaw amorce l’espace de travail (par défaut
`~/.openclaw/workspace`) :

- Initialise `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Exécute un court rituel de questions-réponses (une question à la fois).
- Écrit l’identité et les préférences dans `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Supprime `BOOTSTRAP.md` une fois terminé afin qu’il ne s’exécute qu’une seule fois.

Pour les exécutions de modèles intégrés/locaux, OpenClaw maintient `BOOTSTRAP.md` hors du
contexte système privilégié. Lors de la première exécution interactive principale, il transmet tout de même
le contenu du fichier dans l’invite utilisateur afin que les modèles qui n’appellent pas de manière fiable l’outil
`read` puissent terminer le rituel. Si l’exécution actuelle ne peut pas accéder en toute sécurité à
l’espace de travail, l’agent reçoit une note d’amorçage limitée au lieu d’un message d’accueil générique.

## Ignorer l’amorçage

Pour ignorer cela pour un espace de travail préinitialisé, exécutez `openclaw onboard --skip-bootstrap`.

## Où il s’exécute

L’amorçage s’exécute toujours sur l’**hôte du Gateway**. Si l’app macOS se connecte à
un Gateway distant, l’espace de travail et les fichiers d’amorçage résident sur cette machine
distante.

<Note>
Lorsque le Gateway s’exécute sur une autre machine, modifiez les fichiers de l’espace de travail sur l’hôte du gateway
(par exemple, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentation associée

- Onboarding de l’app macOS : [Onboarding](/fr/start/onboarding)
- Organisation de l’espace de travail : [Espace de travail de l’agent](/fr/concepts/agent-workspace)
