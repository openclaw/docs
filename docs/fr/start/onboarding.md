---
read_when:
    - Conception de l’assistant d’intégration macOS
    - Mise en place de l’authentification ou de l’identité
sidebarTitle: 'Onboarding: macOS App'
summary: Flux de configuration au premier lancement pour OpenClaw (application macOS)
title: Intégration (application macOS)
x-i18n:
    generated_at: "2026-06-27T18:14:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 73f902bcbb7ef782d4a5fbe442a8855a8fcb426d45167c4d2fc1fc050263b5f1
    source_path: start/onboarding.md
    workflow: 16
---

Ce document décrit le flux de configuration initiale **actuel**. L’objectif est une
expérience fluide au « jour 0 » : choisir où le Gateway s’exécute, connecter l’authentification, lancer
l’assistant, et laisser l’agent s’amorcer lui-même.
Pour une vue d’ensemble des parcours d’onboarding, consultez [Vue d’ensemble de l’onboarding](/fr/start/onboarding-overview).

<Steps>
<Step title="Approuver l’avertissement macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Approuver la recherche de réseaux locaux">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Accueil et avis de sécurité">
<Frame caption="Lisez l’avis de sécurité affiché et décidez en conséquence">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Modèle de confiance de sécurité :

- Par défaut, OpenClaw est un agent personnel : une seule frontière d’opérateur de confiance.
- Les configurations partagées/multi-utilisateurs nécessitent un verrouillage renforcé (séparer les frontières de confiance, limiter au minimum l’accès aux outils, et suivre [Sécurité](/fr/gateway/security)).
- L’onboarding local définit désormais par défaut les nouvelles configurations sur `tools.profile: "coding"` afin que les nouvelles configurations locales conservent les outils de système de fichiers/runtime sans imposer le profil `full` sans restriction.
- Si des hooks/webhooks ou d’autres flux de contenu non fiables sont activés, utilisez un niveau de modèle moderne et robuste, et conservez une politique d’outils/un sandboxing stricts.

</Step>
<Step title="Local vs distant">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Où le **Gateway** s’exécute-t-il ?

- **Ce Mac (local uniquement) :** l’onboarding peut configurer l’authentification et écrire les identifiants
  localement.
- **Distant (via SSH/Tailnet) :** l’onboarding ne configure **pas** l’authentification locale ;
  les identifiants doivent exister sur l’hôte du Gateway. Le champ du jeton de Gateway distant
  stocke le jeton utilisé par l’application macOS pour se connecter à ce Gateway ; les valeurs
  `gateway.remote.token` existantes qui ne sont pas en texte brut sont conservées jusqu’à ce que vous les remplaciez.
- **Configurer plus tard :** ignorer la configuration et laisser l’application non configurée.

<Tip>
**Conseil d’authentification du Gateway :**

- L’assistant génère désormais un **jeton** même pour loopback, les clients WS locaux doivent donc s’authentifier.
- Si vous désactivez l’authentification, tout processus local peut se connecter ; n’utilisez cela que sur des machines entièrement fiables.
- Utilisez un **jeton** pour l’accès multi-machines ou les liaisons non-loopback.

</Tip>
</Step>
<Step title="Autorisations">
<Frame caption="Choisissez les autorisations que vous souhaitez accorder à OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

L’onboarding demande les autorisations TCC nécessaires pour :

- Automatisation (AppleScript)
- Notifications
- Accessibilité
- Enregistrement de l’écran
- Microphone
- Reconnaissance vocale
- Caméra
- Localisation

</Step>
<Step title="CLI">
  <Info>Cette étape est facultative</Info>
  L’application peut installer la CLI globale `openclaw` via npm, pnpm ou bun.
  Elle privilégie d’abord npm, puis pnpm, puis bun si c’est le seul gestionnaire
  de paquets détecté. Pour le runtime du Gateway, Node reste la voie recommandée.
</Step>
<Step title="Chat d’onboarding (session dédiée)">
  Après la configuration, l’application ouvre une session de chat d’onboarding dédiée afin que l’agent puisse
  se présenter et guider les prochaines étapes. Cela garde les conseils de première exécution séparés
  de votre conversation normale. Consultez [Amorçage](/fr/start/bootstrapping) pour
  savoir ce qui se passe sur l’hôte du Gateway lors de la première exécution de l’agent.
</Step>
</Steps>

## Connexe

- [Vue d’ensemble de l’onboarding](/fr/start/onboarding-overview)
- [Premiers pas](/fr/start/getting-started)
