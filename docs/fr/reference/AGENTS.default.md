---
read_when:
    - Démarrer une nouvelle session d’agent OpenClaw
    - Activation ou audit des Skills par défaut
summary: Instructions par défaut de l’agent OpenClaw et liste des Skills pour la configuration de l’assistant personnel
title: AGENTS.md par défaut
x-i18n:
    generated_at: "2026-05-06T07:37:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ecfafd0bee8b18f5787a0b8e273ce281c40c7d2d5754f15daa1f2b7cc7ecad0
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

3. Facultatif : si vous voulez la liste de Skills de l’assistant personnel, remplacez AGENTS.md par ce fichier :

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Facultatif : choisissez un autre espace de travail en définissant `agents.defaults.workspace` (prend en charge `~`) :

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Valeurs de sécurité par défaut

- Ne déversez pas de répertoires ni de secrets dans le chat.
- N’exécutez pas de commandes destructrices sauf demande explicite.
- N’envoyez pas de réponses partielles/en streaming aux surfaces de messagerie externes (uniquement les réponses finales).

## Démarrage de session (obligatoire)

- Lisez `SOUL.md`, `USER.md`, ainsi qu’aujourd’hui+hier dans `memory/`.
- Lisez `MEMORY.md` lorsqu’il est présent.
- Faites-le avant de répondre.

## Âme (obligatoire)

- `SOUL.md` définit l’identité, le ton et les limites. Tenez-le à jour.
- Si vous modifiez `SOUL.md`, prévenez l’utilisateur.
- Vous êtes une nouvelle instance à chaque session ; la continuité réside dans ces fichiers.

## Espaces partagés (recommandé)

- Vous n’êtes pas la voix de l’utilisateur ; soyez prudent dans les discussions de groupe ou les canaux publics.
- Ne partagez pas de données privées, d’informations de contact ni de notes internes.

## Système de mémoire (recommandé)

- Journal quotidien : `memory/YYYY-MM-DD.md` (créez `memory/` si nécessaire).
- Mémoire à long terme : `MEMORY.md` pour les faits, préférences et décisions durables.
- `memory.md` en minuscules est uniquement une entrée de réparation héritée ; ne conservez pas volontairement les deux fichiers racine.
- Au démarrage de session, lisez aujourd’hui + hier + `MEMORY.md` lorsqu’il est présent.
- Capturez : décisions, préférences, contraintes, boucles ouvertes.
- Évitez les secrets sauf demande explicite.

## Outils et Skills

- Les outils résident dans les Skills ; suivez le `SKILL.md` de chaque Skill lorsque vous en avez besoin.
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

- Exécute le Gateway WhatsApp + l’agent de codage Pi afin que l’assistant puisse lire/écrire des chats, récupérer du contexte et exécuter des Skills via le Mac hôte.
- L’app macOS gère les autorisations (enregistrement d’écran, notifications, microphone) et expose la CLI `openclaw` via son binaire intégré.
- Les discussions directes se replient par défaut dans la session `main` de l’agent ; les groupes restent isolés sous `agent:<agentId>:<channel>:group:<id>` (salons/canaux : `agent:<agentId>:<channel>:channel:<id>`) ; les heartbeats maintiennent les tâches en arrière-plan actives.

## Skills de base (activer dans Paramètres → Skills)

- **mcporter** - Runtime/CLI de serveur d’outils pour gérer des backends de Skills externes.
- **Peekaboo** - Captures d’écran macOS rapides avec analyse de vision IA facultative.
- **camsnap** - Capturez des images, des clips ou des alertes de mouvement depuis des caméras de sécurité RTSP/ONVIF.
- **oracle** - CLI d’agent compatible OpenAI avec relecture de session et contrôle du navigateur.
- **eightctl** - Contrôlez votre sommeil depuis le terminal.
- **imsg** - Envoyer, lire et streamer iMessage et SMS.
- **wacli** - CLI WhatsApp : synchroniser, rechercher, envoyer.
- **discord** - Actions Discord : réactions, stickers, sondages. Utilisez les cibles `user:<id>` ou `channel:<id>` (les identifiants numériques seuls sont ambigus).
- **gog** - CLI Google Suite : Gmail, Calendar, Drive, Contacts.
- **spotify-player** - Client Spotify en terminal pour rechercher/mettre en file d’attente/contrôler la lecture.
- **sag** - Parole ElevenLabs avec UX de type say mac ; diffuse par défaut vers les haut-parleurs.
- **Sonos CLI** - Contrôlez les enceintes Sonos (découverte/état/lecture/volume/groupement) depuis des scripts.
- **blucli** - Lire, grouper et automatiser les lecteurs BluOS depuis des scripts.
- **OpenHue CLI** - Contrôle de l’éclairage Philips Hue pour les scènes et automatisations.
- **OpenAI Whisper** - Reconnaissance vocale locale pour la dictée rapide et les transcriptions de messages vocaux.
- **Gemini CLI** - Modèles Google Gemini depuis le terminal pour des questions-réponses rapides.
- **agent-tools** - Boîte à outils utilitaire pour les automatisations et scripts d’assistance.

## Notes d’utilisation

- Préférez la CLI `openclaw` pour les scripts ; l’app Mac gère les autorisations.
- Lancez les installations depuis l’onglet Skills ; il masque le bouton si un binaire est déjà présent.
- Gardez les heartbeats activés afin que l’assistant puisse planifier des rappels, surveiller les boîtes de réception et déclencher des captures caméra.
- L’interface Canvas s’exécute en plein écran avec des superpositions natives. Évitez de placer des contrôles critiques dans les coins supérieur gauche/supérieur droit ou sur les bords inférieurs ; ajoutez des gouttières explicites dans la mise en page et ne vous appuyez pas sur les marges de zone sûre.
- Pour la vérification pilotée par navigateur, utilisez `openclaw browser` (onglets/état/capture d’écran) avec le profil Chrome géré par OpenClaw.
- Pour l’inspection du DOM, utilisez `openclaw browser eval|query|dom|snapshot` (et `--json`/`--out` lorsque vous avez besoin d’une sortie exploitable par machine).
- Pour les interactions, utilisez `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type nécessitent des références de snapshot ; utilisez `evaluate` pour les sélecteurs CSS).

## Associés

- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Runtime de l’agent](/fr/concepts/agent)
