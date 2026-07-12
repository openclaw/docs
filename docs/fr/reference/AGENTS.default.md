---
read_when:
    - Démarrage d’une nouvelle session d’agent OpenClaw
    - Activation ou audit des Skills par défaut
summary: Instructions d’agent OpenClaw par défaut et liste des Skills pour la configuration de l’assistant personnel
title: AGENTS.md par défaut
x-i18n:
    generated_at: "2026-07-12T03:03:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 645342f8c6e2805135817cf4bbc2c8bd1d57066054ed671eda93876b2762ffb1
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## Première exécution (recommandée)

Les agents OpenClaw utilisent un répertoire d’espace de travail. Valeur par défaut : `~/.openclaw/workspace` (configurable via `agents.defaults.workspace`, prend en charge `~`).

1. Créez l’espace de travail :

```bash
mkdir -p ~/.openclaw/workspace
```

2. Copiez-y les modèles d’espace de travail par défaut :

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Facultatif : utilisez la liste de Skills d’assistant personnel de ce fichier au lieu du modèle générique :

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Facultatif : indiquez un autre espace de travail :

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Paramètres de sécurité par défaut

- Ne déversez pas le contenu de répertoires ni des secrets dans le chat.
- N’exécutez pas de commandes destructrices sans demande explicite.
- Avant de modifier la configuration ou les planificateurs (crontab, unités systemd, configurations nginx, fichiers rc du shell), examinez d’abord l’état existant et, par défaut, préservez-le ou fusionnez les changements.
- N’envoyez pas de réponses partielles ou diffusées en continu vers des services de messagerie externes (uniquement les réponses finales).

## Vérification préalable des solutions existantes

Avant de proposer ou de créer un système, une fonctionnalité, un flux de travail, un outil, une intégration ou une automatisation sur mesure, recherchez des projets open source, des bibliothèques maintenues, des plugins OpenClaw existants ou des plateformes gratuites qui répondent déjà suffisamment au besoin. Privilégiez-les lorsqu’ils sont adéquats. Ne développez une solution sur mesure que si les options existantes sont inadaptées, trop coûteuses, non maintenues, peu sûres, non conformes, ou si l’utilisateur le demande explicitement. Évitez de recommander des services payants sauf si l’utilisateur approuve explicitement la dépense. Gardez cette vérification légère : il s’agit d’un contrôle préalable, pas d’une mission de recherche.

## Début de session (obligatoire)

- Lisez `SOUL.md`, `USER.md`, ainsi que les fichiers d’aujourd’hui et d’hier dans `memory/` avant de répondre.
- Lisez `MEMORY.md` lorsqu’il est présent.

## Personnalité (obligatoire)

- `SOUL.md` définit l’identité, le ton et les limites. Maintenez-le à jour.
- Si vous modifiez `SOUL.md`, informez-en l’utilisateur.
- Vous êtes une nouvelle instance à chaque session ; la continuité réside dans ces fichiers.

## Espaces partagés (recommandé)

- Vous ne parlez pas au nom de l’utilisateur ; soyez prudent dans les discussions de groupe ou les canaux publics.
- Ne partagez pas de données privées, de coordonnées ni de notes internes.

## Système de mémoire (recommandé)

- Journal quotidien : `memory/YYYY-MM-DD.md` (créez `memory/` si nécessaire).
- Mémoire à long terme : `MEMORY.md` pour les faits, préférences et décisions durables.
- Le fichier `memory.md` en minuscules sert uniquement de source pour la réparation d’un ancien format ; ne conservez pas volontairement les deux fichiers à la racine.
- Au début de la session, lisez les fichiers d’aujourd’hui et d’hier ainsi que `MEMORY.md` lorsqu’il est présent.
- Avant d’écrire dans les fichiers de mémoire, lisez-les d’abord ; n’ajoutez que des mises à jour concrètes, jamais de marqueurs vides.
- Consignez : les décisions, préférences, contraintes et tâches en suspens.
- Évitez les secrets, sauf demande explicite.

## Outils et Skills

- Les outils se trouvent dans les Skills ; suivez le fichier `SKILL.md` de chaque Skill lorsque vous en avez besoin.
- Conservez les notes propres à l’environnement dans `TOOLS.md` (notes destinées aux Skills).

## Conseil de sauvegarde (recommandé)

Considérez cet espace de travail comme la mémoire de l’assistant : transformez-le en dépôt git (idéalement privé) afin de sauvegarder `AGENTS.md` et les fichiers de mémoire.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add workspace"
# Facultatif : ajouter un dépôt distant privé et pousser les changements
```

## Fonctionnement d’OpenClaw

- Exécute un Gateway de canaux de messagerie (WhatsApp, Telegram, Discord, Signal, iMessage, Slack, entre autres) ainsi qu’un agent intégré, afin que l’assistant puisse lire et écrire des conversations, récupérer du contexte et exécuter des Skills via la machine hôte.
- L’application macOS gère les autorisations (enregistrement de l’écran, notifications, microphone) et fournit la CLI `openclaw` au moyen de son binaire intégré.
- Par défaut, les conversations directes sont regroupées dans la session `main` de l’agent ; les groupes et les canaux/salons disposent de leurs propres clés de session. Consultez [Routage des canaux](/fr/channels/channel-routing) pour connaître le format exact des clés. Les Heartbeats maintiennent les tâches en arrière-plan actives.

## Skills principaux (à activer dans Settings → Skills)

Exemple de liste pour un espace de travail d’assistant personnel ; remplacez les Skills selon votre configuration.

- **mcporter** - environnement d’exécution/CLI de serveur d’outils pour gérer les services externes utilisés par les Skills.
- **Peekaboo** - captures d’écran macOS rapides avec analyse visuelle facultative par IA.
- **camsnap** - capture d’images, de séquences ou d’alertes de mouvement provenant de caméras de sécurité RTSP/ONVIF.
- **oracle** - CLI d’agent compatible avec OpenAI, avec relecture des sessions et contrôle du navigateur.
- **eightctl** - contrôle de votre sommeil depuis le terminal.
- **imsg** - envoi, lecture et diffusion en continu d’iMessage et de SMS.
- **wacli** - CLI WhatsApp : synchronisation, recherche et envoi.
- **discord** - actions Discord : réactions, autocollants, sondages. Utilisez les cibles `user:<id>` ou `channel:<id>` (les identifiants numériques seuls sont ambigus).
- **gog** - CLI Google Suite : Gmail, Calendar, Drive, Contacts.
- **spotify-player** - client Spotify pour terminal permettant de rechercher, mettre en file d’attente et contrôler la lecture.
- **sag** - synthèse vocale ElevenLabs avec une expérience de type `say` sur Mac ; diffuse le son vers les haut-parleurs par défaut.
- **Sonos CLI** - contrôle des enceintes Sonos (découverte/état/lecture/volume/regroupement) depuis des scripts.
- **blucli** - lecture, regroupement et automatisation des lecteurs BluOS depuis des scripts.
- **OpenHue CLI** - contrôle de l’éclairage Philips Hue pour les scènes et les automatisations.
- **OpenAI Whisper** - reconnaissance vocale locale pour la dictée rapide et la transcription des messages vocaux.
- **Gemini CLI** - accès aux modèles Google Gemini depuis le terminal pour des questions-réponses rapides.
- **agent-tools** - boîte à outils utilitaire pour les automatisations et les scripts auxiliaires.

## Notes d’utilisation

- Privilégiez la CLI `openclaw` pour les scripts ; l’application de bureau gère les autorisations.
- Effectuez les installations depuis l’onglet Skills ; le bouton d’installation est masqué lorsqu’un binaire requis est déjà présent.
- Maintenez les Heartbeats activés afin que l’assistant puisse programmer des rappels, surveiller les boîtes de réception et déclencher des captures de caméra.
- L’interface Canvas s’exécute en plein écran avec des superpositions natives. Évitez de placer des commandes essentielles dans les coins supérieur gauche, supérieur droit ou le long du bord inférieur ; ajoutez plutôt des marges de mise en page explicites au lieu de vous appuyer sur les marges de zone sûre.
- Pour les vérifications pilotées par navigateur, utilisez la CLI `openclaw browser` (Plugin `browser` intégré) avec le profil Chrome/Brave/Edge/Chromium géré par OpenClaw.
- Gestion : `status`, `doctor [--deep]`, `start [--headless]`, `stop`, `tabs`, `tab [new|select|close]`, `open <url>`, `focus <id>`, `close <id>`.
- Inspection : `screenshot [--full-page|--ref|--labels]`, `snapshot [--format ai|aria|--interactive|--efficient]`, `console`, `errors`, `requests`, `pdf`, `responsebody`.
- Actions : `navigate`, `click <ref>`, `type <ref> <text>`, `press`, `hover`, `drag`, `select`, `upload`, `download`, `fill`, `dialog`, `wait`, `evaluate --fn <js>`, `highlight`. Les actions nécessitent une référence `ref` issue de `snapshot` (les sélecteurs CSS ne sont pas acceptés pour les actions) ; utilisez `evaluate` lorsque vous avez besoin d’un ciblage de type `document.querySelector`.
- Ajoutez `--json` à toute commande d’inspection pour obtenir une sortie lisible par une machine.

## Voir aussi

- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Environnement d’exécution de l’agent](/fr/concepts/agent)
- [Routage des canaux](/fr/channels/channel-routing)
