---
read_when:
    - Démarrage d’une nouvelle session d’agent OpenClaw
    - Activation ou audit des Skills par défaut
summary: Instructions d’agent OpenClaw par défaut et liste des Skills pour la configuration de l’assistant personnel
title: AGENTS.md par défaut
x-i18n:
    generated_at: "2026-06-27T18:09:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6af0d9e5bb250fe91dda6ad31b7e0b169d94d4e7c19c2fc0943b816b4599ec26
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## Première exécution (recommandée)

OpenClaw utilise un répertoire d’espace de travail dédié pour l’agent. Par défaut : `~/.openclaw/workspace` (configurable via `agents.defaults.workspace`).

1. Créez l’espace de travail (s’il n’existe pas déjà) :

```bash
mkdir -p ~/.openclaw/workspace
```

2. Copiez les modèles d’espace de travail par défaut dans l’espace de travail :

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Facultatif : si vous voulez la liste des Skills d’assistant personnel, remplacez AGENTS.md par ce fichier :

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Facultatif : choisissez un autre espace de travail en définissant `agents.defaults.workspace` (prend en charge `~`) :

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Paramètres de sécurité par défaut

- Ne déversez pas de répertoires ni de secrets dans le chat.
- N’exécutez pas de commandes destructrices sauf demande explicite.
- Avant de modifier la configuration ou les planificateurs (par exemple crontab, les unités systemd, les configurations nginx ou les fichiers rc du shell), inspectez d’abord l’état existant et conservez/fusionnez par défaut.
- N’envoyez pas de réponses partielles/en streaming vers des surfaces de messagerie externes (uniquement des réponses finales).

## Vérification préalable des solutions existantes

Avant de proposer ou de créer un système, une fonctionnalité, un workflow, un outil, une intégration ou une automatisation personnalisés, effectuez une brève vérification des projets open source, bibliothèques maintenues, plugins OpenClaw existants ou plateformes gratuites qui résolvent déjà suffisamment bien le problème. Préférez-les lorsqu’ils conviennent. Ne construisez du personnalisé que lorsque les options existantes sont inadaptées, trop coûteuses, non maintenues, dangereuses, non conformes, ou lorsque l’utilisateur demande explicitement du personnalisé. Évitez de recommander des services payants sauf si l’utilisateur approuve explicitement la dépense. Gardez cela léger : une vérification préalable, pas une vaste mission de recherche.

## Début de session (obligatoire)

- Lisez `SOUL.md`, `USER.md`, ainsi qu’aujourd’hui + hier dans `memory/`.
- Lisez `MEMORY.md` lorsqu’il est présent.
- Faites-le avant de répondre.

## Âme (obligatoire)

- `SOUL.md` définit l’identité, le ton et les limites. Tenez-le à jour.
- Si vous modifiez `SOUL.md`, prévenez l’utilisateur.
- Vous êtes une nouvelle instance à chaque session ; la continuité réside dans ces fichiers.

## Espaces partagés (recommandé)

- Vous n’êtes pas la voix de l’utilisateur ; soyez prudent dans les discussions de groupe ou les canaux publics.
- Ne partagez pas de données privées, de coordonnées ni de notes internes.

## Système de mémoire (recommandé)

- Journal quotidien : `memory/YYYY-MM-DD.md` (créez `memory/` si nécessaire).
- Mémoire à long terme : `MEMORY.md` pour les faits, préférences et décisions durables.
- `memory.md` en minuscules sert uniquement d’entrée de réparation héritée ; ne conservez pas volontairement les deux fichiers à la racine.
- Au début de la session, lisez aujourd’hui + hier + `MEMORY.md` lorsqu’il est présent.
- Avant d’écrire dans les fichiers de mémoire, lisez-les d’abord ; n’écrivez que des mises à jour concrètes, jamais de placeholders vides.
- Capturez : décisions, préférences, contraintes, boucles ouvertes.
- Évitez les secrets sauf demande explicite.

## Outils et Skills

- Les outils vivent dans les Skills ; suivez le `SKILL.md` de chaque Skill lorsque vous en avez besoin.
- Conservez les notes propres à l’environnement dans `TOOLS.md` (Notes pour les Skills).

## Conseil de sauvegarde (recommandé)

Si vous traitez cet espace de travail comme la « mémoire » de Clawd, faites-en un dépôt git (idéalement privé) afin que `AGENTS.md` et vos fichiers de mémoire soient sauvegardés.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## Ce que fait OpenClaw

- Exécute la passerelle WhatsApp + l’agent OpenClaw intégré afin que l’assistant puisse lire/écrire des chats, récupérer du contexte et exécuter des Skills via le Mac hôte.
- L’application macOS gère les autorisations (enregistrement d’écran, notifications, microphone) et expose la CLI `openclaw` via son binaire intégré.
- Les conversations directes se replient par défaut dans la session `main` de l’agent ; les groupes restent isolés sous `agent:<agentId>:<channel>:group:<id>` (salons/canaux : `agent:<agentId>:<channel>:channel:<id>`) ; les Heartbeats maintiennent les tâches d’arrière-plan en vie.

## Skills principaux (à activer dans Paramètres → Skills)

- **mcporter** - Environnement d’exécution/CLI de serveur d’outils pour gérer des backends de Skills externes.
- **Peekaboo** - Captures d’écran macOS rapides avec analyse visuelle IA facultative.
- **camsnap** - Capturez des images, clips ou alertes de mouvement depuis des caméras de sécurité RTSP/ONVIF.
- **oracle** - CLI d’agent prête pour OpenAI avec relecture de session et contrôle du navigateur.
- **eightctl** - Contrôlez votre sommeil depuis le terminal.
- **imsg** - Envoyez, lisez et streamez iMessage et SMS.
- **wacli** - CLI WhatsApp : synchroniser, rechercher, envoyer.
- **discord** - Actions Discord : réactions, autocollants, sondages. Utilisez des cibles `user:<id>` ou `channel:<id>` (les ids numériques seuls sont ambigus).
- **gog** - CLI Google Suite : Gmail, Calendar, Drive, Contacts.
- **spotify-player** - Client Spotify pour terminal afin de rechercher/mettre en file d’attente/contrôler la lecture.
- **sag** - Synthèse vocale ElevenLabs avec une UX `say` de style Mac ; streame vers les haut-parleurs par défaut.
- **Sonos CLI** - Contrôlez les enceintes Sonos (découverte/état/lecture/volume/groupement) depuis des scripts.
- **blucli** - Lisez, groupez et automatisez des lecteurs BluOS depuis des scripts.
- **OpenHue CLI** - Contrôle de l’éclairage Philips Hue pour les scènes et automatisations.
- **OpenAI Whisper** - Reconnaissance vocale locale pour la dictée rapide et les transcriptions de messages vocaux.
- **Gemini CLI** - Modèles Google Gemini depuis le terminal pour des questions-réponses rapides.
- **agent-tools** - Boîte à outils utilitaire pour les automatisations et scripts d’assistance.

## Notes d’utilisation

- Préférez la CLI `openclaw` pour les scripts ; l’application Mac gère les autorisations.
- Lancez les installations depuis l’onglet Skills ; il masque le bouton si un binaire est déjà présent.
- Gardez les Heartbeats activés afin que l’assistant puisse planifier des rappels, surveiller les boîtes de réception et déclencher des captures de caméra.
- L’UI Canvas s’exécute en plein écran avec des superpositions natives. Évitez de placer des contrôles critiques dans les bords supérieur gauche/supérieur droit/inférieurs ; ajoutez des gouttières explicites dans la mise en page et ne vous fiez pas aux safe-area insets.
- Pour la vérification pilotée par navigateur, utilisez `openclaw browser` (tabs/status/screenshot) avec le profil Chrome géré par OpenClaw.
- Pour l’inspection DOM, utilisez `openclaw browser eval|query|dom|snapshot` (et `--json`/`--out` lorsque vous avez besoin d’une sortie machine).
- Pour les interactions, utilisez `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type nécessitent des références de snapshot ; utilisez `evaluate` pour les sélecteurs CSS).

## Connexe

- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Environnement d’exécution de l’agent](/fr/concepts/agent)
