---
read_when:
    - Comprendre ce qui se passe lors de la première exécution de l’agent
    - Expliquer où se trouvent les fichiers d’amorçage
    - Débogage de la configuration de l’identité d’onboarding
sidebarTitle: Bootstrapping
summary: Rituel d’amorçage de l’agent qui initialise l’espace de travail et les fichiers d’identité
title: Amorçage de l’agent
x-i18n:
    generated_at: "2026-04-25T13:57:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 435eb2a14707623903ab7873774cc8d4489b960719cf6a525d547983f8338027
    source_path: start/bootstrapping.md
    workflow: 15
---

L’amorçage est le rituel de **première exécution** qui prépare un espace de travail d’agent et collecte les informations d’identité. Il a lieu après l’onboarding, lorsque l’agent démarre pour la première fois.

## Ce que fait l’amorçage

Lors de la première exécution de l’agent, OpenClaw initialise l’espace de travail (par défaut `~/.openclaw/workspace`) :

- Initialise `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Exécute un court rituel de questions-réponses (une question à la fois).
- Écrit l’identité et les préférences dans `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Supprime `BOOTSTRAP.md` une fois terminé afin qu’il ne s’exécute qu’une seule fois.

## Ignorer l’amorçage

Pour ignorer cette étape dans un espace de travail préinitialisé, exécutez `openclaw onboard --skip-bootstrap`.

## Où il s’exécute

L’amorçage s’exécute toujours sur l’**hôte Gateway**. Si l’application macOS se connecte à une Gateway distante, l’espace de travail et les fichiers d’amorçage se trouvent sur cette machine distante.

<Note>
Lorsque la Gateway s’exécute sur une autre machine, modifiez les fichiers de l’espace de travail sur l’hôte Gateway (par exemple, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentation connexe

- Onboarding de l’application macOS : [Onboarding](/fr/start/onboarding)
- Structure de l’espace de travail : [Espace de travail de l’agent](/fr/concepts/agent-workspace)
