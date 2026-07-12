---
read_when:
    - Vous souhaitez comprendre ce que signifie le « contexte » dans OpenClaw
    - Vous cherchez à comprendre pourquoi le modèle « sait » quelque chose (ou l’a oublié)
    - Vous souhaitez réduire la surcharge de contexte (/context, /status, /compact)
summary: 'Contexte : ce que le modèle voit, comment il est construit et comment l’inspecter'
title: Contexte
x-i18n:
    generated_at: "2026-07-12T02:46:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3d342a601a447487640587f746cc80a133ede338a880741f53c3e01f20ed1
    source_path: concepts/context.md
    workflow: 16
---

Le « contexte » est **tout ce qu’OpenClaw envoie au modèle pour une exécution**. Il est limité par la **fenêtre de contexte** du modèle (limite de jetons).

Modèle mental pour débuter :

- **Invite système** (construite par OpenClaw) : règles, outils, liste des Skills, heure/environnement d’exécution et fichiers injectés depuis l’espace de travail.
- **Historique de la conversation** : vos messages et ceux de l’assistant pour cette session.
- **Appels/résultats d’outils et pièces jointes** : sortie de commandes, lectures de fichiers, images/audio, etc.

Le contexte n’est _pas la même chose_ que la « mémoire » : la mémoire peut être stockée sur disque et rechargée ultérieurement ; le contexte correspond à ce qui se trouve dans la fenêtre actuelle du modèle.

## Démarrage rapide (inspecter le contexte)

- `/status` → aperçu rapide du « niveau de remplissage de ma fenêtre » et des paramètres de la session.
- `/context list` → éléments injectés et tailles approximatives (par fichier et totaux).
- `/context detail` → ventilation plus détaillée : tailles par fichier, par schéma d’outil et par entrée de Skill, taille de l’invite système et nombre de messages de transcription pouvant être compactés.
- `/context map` → image en arborescence de type WinDirStat représentant les contributeurs suivis du contexte de la session actuelle.
- `/usage tokens` → ajoute aux réponses normales un pied de page indiquant l’utilisation pour chaque réponse.
- `/compact` → résume l’historique ancien dans une entrée compacte afin de libérer de l’espace dans la fenêtre.

Voir aussi : [Commandes obliques](/fr/tools/slash-commands), [Utilisation et coût des jetons](/fr/reference/token-use), [Compaction](/fr/concepts/compaction).

## Exemple de sortie

Les valeurs varient selon le modèle, le fournisseur, la politique des outils et le contenu de votre espace de travail.

### `/context list`

```text
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```text
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

### `/context map`

Envoie une image générée à partir du dernier rapport d’exécution mis en cache et de la transcription de la session. Avant qu’un message normal ait produit un rapport d’exécution dans la session, `/context map` renvoie un message d’indisponibilité au lieu d’afficher une estimation. La surface des rectangles est proportionnelle au nombre de caractères d’invite suivis :

- transcription de la conversation (messages de l’utilisateur, réponses de l’assistant, résultats des outils, résumés de Compaction), ainsi que le contexte d’exécution propre à chaque tour et les ajouts d’invite des hooks qui ne parviennent qu’au modèle
- fichiers injectés depuis l’espace de travail
- texte de base de l’invite système
- entrées d’invite des Skills
- schémas JSON des outils

Le groupe de la conversation grandit au fil de la session ; la carte évolue donc à chaque tour. Après une Compaction, il se réduit en une tuile de résumés.

`/context list`, `/context detail` et `/context json` peuvent toujours inspecter une estimation calculée à la demande lorsqu’aucun rapport d’exécution n’est mis en cache.

## Éléments comptabilisés dans la fenêtre de contexte

Tout ce que reçoit le modèle est comptabilisé, notamment :

- Invite système (toutes les sections).
- Historique de la conversation.
- Appels d’outils et résultats des outils.
- Pièces jointes/transcriptions (images/audio/fichiers).
- Résumés de Compaction et artefacts d’élagage.
- « Enveloppes » du fournisseur ou en-têtes masqués (non visibles, mais néanmoins comptabilisés).

## Construction de l’invite système par OpenClaw

L’invite système est **gérée par OpenClaw** et reconstruite à chaque exécution. Elle comprend :

- Liste des outils et descriptions succinctes.
- Liste des Skills (métadonnées uniquement ; voir ci-dessous).
- Emplacement de l’espace de travail.
- Heure (UTC et heure locale de l’utilisateur convertie, si configurée).
- Métadonnées de l’environnement d’exécution (hôte/système d’exploitation/modèle/raisonnement).
- Fichiers d’amorçage de l’espace de travail injectés sous **Contexte du projet**.

Ventilation complète : [Invite système](/fr/concepts/system-prompt).

## Fichiers injectés depuis l’espace de travail (Contexte du projet)

Par défaut, OpenClaw injecte un ensemble fixe de fichiers de l’espace de travail (s’ils sont présents) :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (première exécution uniquement)

Les fichiers volumineux sont tronqués individuellement selon `agents.defaults.bootstrapMaxChars` (valeur par défaut : `20000` caractères). OpenClaw applique également à l’ensemble des fichiers une limite totale d’injection d’amorçage avec `agents.defaults.bootstrapTotalMaxChars` (valeur par défaut : `60000` caractères). `/context` affiche les tailles **brutes et injectées**, ainsi que la présence éventuelle d’une troncature.

Lorsqu’une troncature se produit, l’environnement d’exécution peut injecter dans l’invite un bloc d’avertissement sous Contexte du projet. Configurez ce comportement avec `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ; valeur par défaut : `always`).

## Skills : injectés ou chargés à la demande

L’invite système comprend une **liste de Skills** compacte (nom, description et emplacement). Cette liste représente une surcharge réelle.

Les instructions des Skills ne sont _pas_ incluses par défaut. Le modèle est censé utiliser `read` sur le fichier `SKILL.md` du Skill **uniquement lorsque cela est nécessaire**.

## Outils : deux types de coûts

Les outils affectent le contexte de deux manières :

1. **Texte de la liste des outils** dans l’invite système (ce que vous voyez sous « Outils »).
2. **Schémas des outils** (JSON). Ils sont envoyés au modèle afin qu’il puisse appeler les outils. Ils sont comptabilisés dans le contexte, même si vous ne les voyez pas sous forme de texte brut.

`/context detail` ventile les schémas d’outils les plus volumineux afin que vous puissiez identifier les éléments prédominants.

## Commandes, directives et « raccourcis intégrés »

Les commandes obliques sont traitées par le Gateway. Plusieurs comportements existent :

- **Commandes autonomes** : un message contenant uniquement `/...` est exécuté comme une commande.
- **Directives** : `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue` sont retirées avant que le modèle ne voie le message.
  - Les messages contenant uniquement une directive conservent les paramètres de la session.
  - Les directives intégrées à un message normal servent d’indications propres à ce message.
- **Raccourcis intégrés** (expéditeurs figurant sur la liste d’autorisation uniquement) : certains jetons `/...` contenus dans un message normal peuvent s’exécuter immédiatement (exemple : « salut /status ») et sont retirés avant que le modèle ne voie le texte restant.

Détails : [Commandes obliques](/fr/tools/slash-commands).

## Sessions, Compaction et élagage (éléments persistants)

Les éléments qui persistent entre les messages dépendent du mécanisme :

- **Historique normal** : persiste dans la transcription de la session jusqu’à sa Compaction ou son élagage par la politique.
- **Compaction** : ajoute durablement un résumé à la transcription tout en conservant les messages récents intacts.
- **Élagage** : retire les anciens résultats d’outils de l’invite _en mémoire_ afin de libérer de l’espace dans la fenêtre de contexte, mais ne réécrit pas la transcription de la session ; l’historique complet reste consultable sur disque.

Documentation : [Session](/fr/concepts/session), [Compaction](/fr/concepts/compaction), [Élagage de session](/fr/concepts/session-pruning).

Par défaut, OpenClaw utilise le moteur de contexte `legacy` intégré pour l’assemblage et
la Compaction. Si vous installez un Plugin qui fournit `kind: "context-engine"` et
que vous le sélectionnez avec `plugins.slots.contextEngine`, OpenClaw délègue à ce
moteur l’assemblage du contexte, `/compact` et les hooks associés au cycle de vie
du contexte des sous-agents. `ownsCompaction: false` ne provoque aucun retour
automatique vers le moteur `legacy` ; le moteur actif doit tout de même implémenter
correctement `compact()`. Consultez [Moteur de contexte](/fr/concepts/context-engine)
pour découvrir l’intégralité de l’interface extensible, des hooks de cycle de vie
et de la configuration.

## Ce que `/context` indique réellement

`/context` privilégie le dernier rapport d’invite système **construit lors de l’exécution**, lorsqu’il est disponible :

- `System prompt (run)` = capturé lors de la dernière exécution intégrée (capable d’utiliser des outils) et conservé dans le stockage de la session.
- `System prompt (estimate)` = calculé à la volée lorsqu’aucun rapport d’exécution n’existe (ou lors d’une exécution par l’intermédiaire d’un backend CLI qui ne génère pas ce rapport).

Dans les deux cas, il indique les tailles et les principaux contributeurs ; il ne restitue **pas** l’intégralité de l’invite système ni les schémas des outils. En mode détaillé, il compare également la transcription de la session au même prédicat de messages de conversation réelle que celui utilisé par la Compaction. Il devient ainsi plus facile de distinguer une utilisation élevée de l’invite ou du cache d’un historique de conversation pouvant être compacté.

## Ressources associées

<CardGroup cols={2}>
  <Card title="Moteur de contexte" href="/fr/concepts/context-engine" icon="puzzle-piece">
    Injection de contexte personnalisée au moyen de Plugins.
  </Card>
  <Card title="Compaction" href="/fr/concepts/compaction" icon="compress">
    Résumé des conversations longues afin de les maintenir dans la fenêtre du modèle.
  </Card>
  <Card title="Invite système" href="/fr/concepts/system-prompt" icon="message-lines">
    Méthode de construction de l’invite système et éléments qu’elle injecte à chaque tour.
  </Card>
  <Card title="Boucle de l’agent" href="/fr/concepts/agent-loop" icon="arrows-rotate">
    Cycle complet d’exécution de l’agent, du message entrant à la réponse finale.
  </Card>
</CardGroup>
