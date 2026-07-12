---
read_when:
    - Démarrage d’une nouvelle session d’agent OpenClaw
    - Activation ou audit des Skills par défaut
summary: Instructions d’agent OpenClaw par défaut et liste des Skills pour la configuration de l’assistant personnel
title: AGENTS.md par défaut
x-i18n:
    generated_at: "2026-07-12T15:55:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 645342f8c6e2805135817cf4bbc2c8bd1d57066054ed671eda93876b2762ffb1
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## Première exécution (recommandée)

Les agents OpenClaw utilisent un répertoire d’espace de travail. Par défaut : `~/.openclaw/workspace` (configurable via `agents.defaults.workspace`, prend en charge `~`).

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

3. Facultatif : utilisez la liste de Skills d’assistant personnel de ce fichier à la place du modèle générique :

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

- Ne déversez pas le contenu de répertoires ni de secrets dans le chat.
- N’exécutez pas de commandes destructrices sans demande explicite.
- Avant de modifier la configuration ou les planificateurs (crontab, unités systemd, configurations nginx, fichiers rc du shell), examinez d’abord l’état existant et, par défaut, préservez-le ou fusionnez les modifications.
- N’envoyez pas de réponses partielles ou en streaming sur des services de messagerie externes (uniquement des réponses finales).

## Vérification préalable des solutions existantes

Avant de proposer ou de créer un système, une fonctionnalité, un workflow, un outil, une intégration ou une automatisation personnalisés, vérifiez s’il existe des projets open source, des bibliothèques maintenues, des plugins OpenClaw existants ou des plateformes gratuites qui répondent déjà suffisamment au besoin. Privilégiez-les lorsqu’ils sont adéquats. Ne développez une solution personnalisée que si les options existantes sont inadaptées, trop coûteuses, non maintenues, peu sûres, non conformes, ou si l’utilisateur en fait explicitement la demande. Évitez de recommander des services payants, sauf si l’utilisateur approuve explicitement la dépense. Limitez cette étape à une vérification préalable légère, et non à une mission de recherche.

## Début de session (obligatoire)

- Lisez `SOUL.md`, `USER.md`, ainsi que les entrées d’aujourd’hui et d’hier dans `memory/` avant de répondre.
- Lisez `MEMORY.md` lorsqu’il est présent.

## Identité (obligatoire)

- `SOUL.md` définit l’identité, le ton et les limites. Maintenez-le à jour.
- Si vous modifiez `SOUL.md`, informez-en l’utilisateur.
- Vous êtes une nouvelle instance à chaque session ; la continuité réside dans ces fichiers.

## Espaces partagés (recommandé)

- Vous n'êtes pas la voix de l'utilisateur ; soyez prudent dans les discussions de groupe ou les canaux publics.
- Ne partagez pas de données privées, de coordonnées ni de notes internes.

## Système de mémoire (recommandé)

- Journal quotidien : `memory/YYYY-MM-DD.md` (créez `memory/` si nécessaire).
- Mémoire à long terme : `MEMORY.md` pour les faits, préférences et décisions durables.
- Le fichier `memory.md` en minuscules sert uniquement d'entrée pour la réparation héritée ; ne conservez pas intentionnellement les deux fichiers à la racine.
- Au début de la session, lisez les fichiers d'aujourd'hui et d'hier, ainsi que `MEMORY.md` lorsqu'il est présent.
- Avant d'écrire dans les fichiers de mémoire, lisez-les d'abord ; écrivez uniquement des mises à jour concrètes, jamais de contenus de substitution vides.
- Consignez : les décisions, les préférences, les contraintes et les points en suspens.
- Évitez les secrets, sauf demande explicite.

## Outils et Skills

- Les outils se trouvent dans les Skills ; suivez le fichier `SKILL.md` de chaque Skill lorsque vous en avez besoin.
- Conservez les notes propres à l'environnement dans `TOOLS.md` (notes pour les Skills).

## Conseil de sauvegarde (recommandé)

Considérez cet espace de travail comme la mémoire de l'assistant : faites-en un dépôt git (idéalement privé) afin que `AGENTS.md` et les fichiers de mémoire soient sauvegardés.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Ajouter l'espace de travail"
# Facultatif : ajouter un dépôt distant privé et y envoyer les modifications
```

## Fonctionnalités d’OpenClaw

- Exécute un Gateway de canaux de messagerie (WhatsApp, Telegram, Discord, Signal, iMessage, Slack, entre autres) ainsi qu’un agent intégré, afin que l’assistant puisse lire et écrire dans les conversations, récupérer le contexte et exécuter des Skills via la machine hôte.
- L’application macOS gère les autorisations (enregistrement de l’écran, notifications, microphone) et expose la CLI `openclaw` au moyen de son binaire intégré.
- Par défaut, les conversations directes sont regroupées dans la session `main` de l’agent ; les groupes et les canaux/salons disposent de leurs propres clés de session. Consultez [Routage des canaux](/fr/channels/channel-routing) pour connaître le format exact des clés. Les Heartbeats maintiennent les tâches en arrière-plan actives.

## Skills principales (à activer dans Settings → Skills)

Exemple de liste pour un espace de travail d’assistant personnel ; remplacez ces Skills par celles qui correspondent à votre configuration.

- **mcporter** - environnement d’exécution/CLI de serveur d’outils pour gérer les backends externes de Skills.
- **Peekaboo** - captures d’écran macOS rapides avec analyse visuelle par IA facultative.
- **camsnap** - capture d’images, de clips ou d’alertes de mouvement depuis des caméras de sécurité RTSP/ONVIF.
- **oracle** - CLI d’agent compatible avec OpenAI, avec relecture de session et contrôle du navigateur.
- **eightctl** - contrôlez votre sommeil depuis le terminal.
- **imsg** - envoyez, lisez et diffusez en continu des iMessage et des SMS.
- **wacli** - CLI WhatsApp : synchronisez, recherchez et envoyez.
- **discord** - actions Discord : réactions, autocollants, sondages. Utilisez les cibles `user:<id>` ou `channel:<id>` (les identifiants numériques seuls sont ambigus).
- **gog** - CLI Google Suite : Gmail, Calendar, Drive, Contacts.
- **spotify-player** - client Spotify pour terminal permettant de rechercher, de mettre en file d’attente et de contrôler la lecture.
- **sag** - synthèse vocale ElevenLabs avec une expérience de commande « say » de style macOS ; diffuse le son sur les haut-parleurs par défaut.
- **Sonos CLI** - contrôlez les haut-parleurs Sonos (découverte/état/lecture/volume/regroupement) depuis des scripts.
- **blucli** - lancez la lecture, regroupez et automatisez les lecteurs BluOS depuis des scripts.
- **OpenHue CLI** - contrôle de l’éclairage Philips Hue pour les scènes et les automatisations.
- **OpenAI Whisper** - transcription vocale locale pour la dictée rapide et la transcription des messages vocaux.
- **Gemini CLI** - modèles Google Gemini depuis le terminal pour des questions-réponses rapides.
- **agent-tools** - boîte à outils utilitaire pour les automatisations et les scripts auxiliaires.

## Notes d’utilisation

- Privilégiez la CLI `openclaw` pour les scripts ; l’application de bureau gère les autorisations.
- Lancez les installations depuis l’onglet Skills ; le bouton d’installation est masqué lorsqu’un binaire requis est déjà présent.
- Maintenez les Heartbeats activés afin que l’assistant puisse planifier des rappels, surveiller les boîtes de réception et déclencher des captures de caméra.
- L’interface Canvas s’exécute en plein écran avec des superpositions natives. Évitez de placer des commandes essentielles dans les coins supérieur gauche et supérieur droit ou le long du bord inférieur ; ajoutez plutôt des marges de mise en page explicites au lieu de vous appuyer sur les marges de zone sûre.
- Pour les vérifications pilotées par navigateur, utilisez la CLI `openclaw browser` (Plugin `browser` intégré) avec le profil Chrome/Brave/Edge/Chromium géré par OpenClaw.
- Gestion : `status`, `doctor [--deep]`, `start [--headless]`, `stop`, `tabs`, `tab [new|select|close]`, `open <url>`, `focus <id>`, `close <id>`.
- Inspection : `screenshot [--full-page|--ref|--labels]`, `snapshot [--format ai|aria|--interactive|--efficient]`, `console`, `errors`, `requests`, `pdf`, `responsebody`.
- Actions : `navigate`, `click <ref>`, `type <ref> <text>`, `press`, `hover`, `drag`, `select`, `upload`, `download`, `fill`, `dialog`, `wait`, `evaluate --fn <js>`, `highlight`. Les actions nécessitent une `ref` provenant de `snapshot` (les sélecteurs CSS ne sont pas acceptés pour les actions) ; utilisez `evaluate` lorsqu’un ciblage de type `document.querySelector` est nécessaire.
- Ajoutez `--json` à toute commande d’inspection pour obtenir une sortie lisible par machine.

## Pages connexes

- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Environnement d’exécution de l’agent](/fr/concepts/agent)
- [Routage des canaux](/fr/channels/channel-routing)
