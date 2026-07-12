---
read_when:
    - Conception de l’assistant d’intégration pour macOS
    - Mise en œuvre de la configuration de l’authentification ou de l’identité
sidebarTitle: 'Onboarding: macOS App'
summary: Parcours de configuration initiale d’OpenClaw (application macOS)
title: Intégration (application macOS)
x-i18n:
    generated_at: "2026-07-12T03:07:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cced671a375bd80cbdf920383add8cf01f75a85259963a4286e9ce49913d8b47
    source_path: start/onboarding.md
    workflow: 16
---

Le parcours de premier lancement de l’app macOS : choisissez où s’exécute le Gateway, connectez un backend d’IA vérifié, accordez les autorisations et passez le relais au rituel d’amorçage propre à l’agent.
Pour l’intégration via la CLI et une comparaison des deux parcours, consultez la [Présentation de l’intégration](/fr/start/onboarding-overview).

<Steps>
<Step title="Approuver l’avertissement de macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Autoriser la recherche de réseaux locaux">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Bienvenue et avis de sécurité">
<Frame caption="Lisez l’avis de sécurité affiché et prenez votre décision en conséquence">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Modèle de confiance de sécurité :

- Par défaut, OpenClaw est un agent personnel : une seule frontière de confiance pour un opérateur de confiance.
- Les configurations partagées ou multi-utilisateurs doivent être verrouillées : séparez les frontières de confiance, limitez au minimum l’accès aux outils et suivez les recommandations de [Sécurité](/fr/gateway/security).
- L’intégration locale définit par défaut `tools.profile: "coding"` dans les nouvelles configurations afin que les nouvelles installations conservent les outils du système de fichiers et d’exécution sans utiliser le profil `full` sans restriction.
- Si des hooks, des webhooks ou d’autres flux de contenu non fiable sont activés, utilisez un modèle moderne et performant, et appliquez une politique d’outils ainsi qu’un bac à sable stricts.

</Step>
<Step title="Local ou distant">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Où s’exécute le **Gateway** ?

- **Ce Mac (local uniquement) :** l’intégration configure l’authentification et enregistre les identifiants localement.
- **Distant (via SSH/Tailnet) :** l’intégration ne configure **pas** l’authentification locale ;
  les identifiants doivent déjà exister sur l’hôte du Gateway. Le champ du jeton
  du Gateway distant stocke le jeton utilisé par l’app macOS pour se connecter à ce Gateway ;
  les valeurs SecretRef existantes de `gateway.remote.token` sont conservées jusqu’à ce que vous
  les remplaciez.
- **Configurer plus tard :** ignorez la configuration et laissez l’app non configurée.

<Tip>
**Conseil sur l’authentification du Gateway :**

- Le mode d’authentification du Gateway est défini par défaut sur `token`, même pour les liaisons local loopback ; les clients WS locaux doivent donc s’authentifier.
- Définir `gateway.auth.mode: "none"` permet à n’importe quel processus local de se connecter ; n’utilisez cette option que sur des machines entièrement fiables.
- Utilisez un jeton pour les accès depuis plusieurs machines ou les liaisons autres que local loopback.

</Tip>
</Step>
<Step title="CLI">
  La configuration locale installe la CLI globale `openclaw` via npm, pnpm ou bun,
  en privilégiant npm. Node reste l’environnement d’exécution recommandé pour le Gateway
  lui-même. Les installations compatibles existantes sont réutilisées.
</Step>
<Step title="Connecter votre IA">
  Si un Gateway connecté dispose déjà d’un modèle d’agent configuré, cette
  page est entièrement ignorée et l’interface normale de l’agent s’ouvre. La configuration
  de Crestodian et du fournisseur ne s’exécute que pour un Gateway nouveau ou incomplet.

Une fois le Gateway prêt, l’intégration recherche les accès à l’IA dont vous disposez déjà :
une connexion à Claude Code ou Codex, ou `OPENAI_API_KEY` /
`ANTHROPIC_API_KEY`. La meilleure option est testée avec une véritable génération et
n’est enregistrée qu’après avoir répondu ; lorsqu’un test échoue, l’app essaie automatiquement
l’option suivante et indique pourquoi la précédente a échoué. Si plusieurs options
sont trouvées, vous pouvez passer de l’une à l’autre avant de continuer.

Gemini CLI reste disponible pour les agents normaux après la configuration, mais n’est pas
proposé ici, car il ne peut pas imposer la sonde d’inférence sans outil.

Vous pouvez également vous connecter via le propre parcours OAuth ou d’association d’appareil du fournisseur.
Les choix intégrés comprennent OpenAI/ChatGPT, OpenRouter, GitHub Copilot, Google
Gemini CLI, xAI, MiniMax Global et CN, ainsi que Chutes. La liste provient des
plugins de fournisseurs d’inférence de texte actifs du Gateway plutôt que d’une liste fixe de l’app ;
un autre fournisseur peut ainsi participer sans nécessiter l’ajout de code macOS propre à ce fournisseur.

Le sélecteur manuel de clé ou de jeton utilise le même registre de fournisseurs. Pour chaque parcours,
le fournisseur fournit son modèle initial et sa configuration ; OpenClaw vérifie
l’identifiant avec le même test en direct avant d’enregistrer son profil d’authentification. Le bouton Next
reste verrouillé jusqu’à ce qu’un backend ait réussi, de sorte que la première discussion avec l’agent ne peut pas
commencer sans inférence fonctionnelle. Une fois cette vérification en direct réussie, Crestodian devient
disponible pour vous aider à configurer le reste de l’espace de travail, le Gateway, les canaux et
les autres fonctionnalités facultatives ; il reste également accessible ultérieurement sous Settings → Crestodian.
</Step>
<Step title="Autorisations">

<Frame caption="Choisissez les autorisations que vous souhaitez accorder à OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

L’intégration demande les autorisations TCC suivantes : automatisation (AppleScript), notifications, accessibilité, enregistrement de l’écran, microphone, reconnaissance vocale, caméra et localisation.

</Step>
<Step title="Terminer">
  Une fois l’inférence validée, Crestodian prend en charge le reste de la configuration facultative et peut
  vous rediriger vers la discussion normale avec l’agent. Terminer le parcours des autorisations
  ouvre cette même discussion ; l’app ne crée pas d’espace de travail et ne lance pas de conversation distincte
  de configuration de l’agent avant Crestodian. Consultez
  [Amorçage](/fr/start/bootstrapping) pour savoir ce qui se passe sur l’hôte du Gateway
  lors du premier véritable tour de l’agent.
</Step>
</Steps>

## Pages connexes

- [Présentation de l’intégration](/fr/start/onboarding-overview)
- [Bien démarrer](/fr/start/getting-started)
