---
read_when:
    - Conception de l’assistant d’intégration macOS
    - Mise en œuvre de la configuration d’authentification ou d’identité
sidebarTitle: 'Onboarding: macOS App'
summary: Flux de configuration au premier lancement pour OpenClaw (application macOS)
title: Intégration (application macOS)
x-i18n:
    generated_at: "2026-05-06T07:38:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6dc7ebea5de7b1398d7b64c00245255c59af8a7ef51315cdd0ef1cb4898a41a4
    source_path: start/onboarding.md
    workflow: 16
---

Ce document décrit le flux de configuration au premier lancement **actuel**. L’objectif est une expérience
fluide de « jour 0 » : choisir où le Gateway s’exécute, connecter l’authentification, exécuter
l’assistant et laisser l’agent s’amorcer lui-même.
Pour un aperçu général des parcours d’onboarding, consultez [Aperçu de l’onboarding](/fr/start/onboarding-overview).

<Steps>
<Step title="Approuver l’avertissement macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Autoriser la recherche de réseaux locaux">
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
- Les configurations partagées/multi-utilisateurs nécessitent un verrouillage (séparer les frontières de confiance, garder l’accès aux outils minimal et suivre [Sécurité](/fr/gateway/security)).
- L’onboarding local définit désormais par défaut les nouvelles configurations sur `tools.profile: "coding"` afin que les nouvelles configurations locales conservent les outils de système de fichiers/d’exécution sans imposer le profil `full` sans restriction.
- Si des hooks/webhooks ou d’autres flux de contenu non fiable sont activés, utilisez un niveau de modèle moderne robuste et maintenez une politique d’outils/un sandboxing stricts.

</Step>
<Step title="Local ou distant">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Où le **Gateway** s’exécute-t-il ?

- **Ce Mac (local uniquement) :** l’onboarding peut configurer l’authentification et écrire les identifiants
  localement.
- **Distant (via SSH/Tailnet) :** l’onboarding ne configure **pas** l’authentification locale ;
  les identifiants doivent exister sur l’hôte du gateway.
- **Configurer plus tard :** ignorer la configuration et laisser l’app non configurée.

<Tip>
**Astuce d’authentification du Gateway :**

- L’assistant génère désormais un **jeton** même pour le loopback, les clients WS locaux doivent donc s’authentifier.
- Si vous désactivez l’authentification, n’importe quel processus local peut se connecter ; utilisez cela uniquement sur des machines entièrement fiables.
- Utilisez un **jeton** pour l’accès multi-machines ou les liaisons hors loopback.

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
- Appareil photo
- Localisation

</Step>
<Step title="CLI">
  <Info>Cette étape est facultative</Info>
  L’app peut installer la CLI globale `openclaw` via npm, pnpm ou bun.
  Elle privilégie d’abord npm, puis pnpm, puis bun si c’est le seul gestionnaire
  de paquets détecté. Pour l’exécution du Gateway, Node reste la méthode recommandée.
</Step>
<Step title="Chat d’onboarding (session dédiée)">
  Après la configuration, l’app ouvre une session de chat d’onboarding dédiée afin que l’agent puisse
  se présenter et guider les prochaines étapes. Cela sépare les conseils du premier lancement
  de votre conversation normale. Consultez [Amorçage](/fr/start/bootstrapping) pour
  savoir ce qui se passe sur l’hôte du gateway pendant la première exécution de l’agent.
</Step>
</Steps>

## Liens connexes

- [Aperçu de l’onboarding](/fr/start/onboarding-overview)
- [Premiers pas](/fr/start/getting-started)
