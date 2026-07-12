---
read_when:
    - Vous souhaitez comprendre ce que signifie « contexte » dans OpenClaw
    - Vous cherchez à comprendre pourquoi le modèle « sait » quelque chose (ou l’a oublié)
    - Vous souhaitez réduire la surcharge de contexte (/context, /status, /compact)
summary: 'Contexte : ce que le modèle voit, comment il est construit et comment l’inspecter'
title: Contexte
x-i18n:
    generated_at: "2026-07-12T15:19:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1eb3d342a601a447487640587f746cc80a133ede338a880741f53c3e01f20ed1
    source_path: concepts/context.md
    workflow: 16
---

Le « contexte » correspond à **tout ce qu’OpenClaw envoie au modèle pour une exécution**. Il est limité par la **fenêtre de contexte** du modèle (limite de tokens).

Modèle mental pour débuter :

- **Invite système** (générée par OpenClaw) : règles, outils, liste de Skills, heure/environnement d’exécution et fichiers injectés depuis l’espace de travail.
- **Historique de la conversation** : vos messages + les messages de l’assistant pour cette session.
- **Appels/résultats d’outils + pièces jointes** : sortie des commandes, lecture de fichiers, images/audio, etc.

Le contexte n’est _pas la même chose_ que la « mémoire » : la mémoire peut être stockée sur disque et rechargée ultérieurement ; le contexte correspond au contenu de la fenêtre actuelle du modèle.

## Démarrage rapide (inspecter le contexte)

- `/status` → vue rapide du « niveau de remplissage de ma fenêtre » + paramètres de la session.
- `/context list` → éléments injectés + tailles approximatives (par fichier + totaux).
- `/context detail` → ventilation plus détaillée : tailles par fichier, par schéma d’outil et par entrée de Skill, taille de l’invite système et nombre de messages de transcription pouvant être compactés.
- `/context map` → image arborescente de type WinDirStat représentant les éléments suivis qui contribuent au contexte de la session actuelle.
- `/usage tokens` → ajoute aux réponses normales un pied de page indiquant l’utilisation pour chaque réponse.
- `/compact` → résume l’historique ancien dans une entrée compacte afin de libérer de l’espace dans la fenêtre.

Voir aussi : [Commandes slash](/fr/tools/slash-commands), [Utilisation et coûts des tokens](/fr/reference/token-use), [Compaction](/fr/concepts/compaction).

## Exemple de sortie

Les valeurs varient selon le modèle, le fournisseur, la stratégie d’utilisation des outils et le contenu de votre espace de travail.

### `/context list`

```text
🧠 Ventilation du contexte
Espace de travail : <workspaceDir>
Maximum d’amorçage/fichier : 12,000 caractères
Bac à sable : mode=non-main sandboxed=false
Invite système (exécution) : 38,412 caractères (~9,603 tok) (Contexte du projet : 23,901 caractères (~5,976 tok))

Fichiers injectés depuis l’espace de travail :
- AGENTS.md: OK | brut 1,742 caractères (~436 tok) | injecté 1,742 caractères (~436 tok)
- SOUL.md: OK | brut 912 caractères (~228 tok) | injecté 912 caractères (~228 tok)
- TOOLS.md: TRONQUÉ | brut 54,210 caractères (~13,553 tok) | injecté 20,962 caractères (~5,241 tok)
- IDENTITY.md: OK | brut 211 caractères (~53 tok) | injecté 211 caractères (~53 tok)
- USER.md: OK | brut 388 caractères (~97 tok) | injecté 388 caractères (~97 tok)
- HEARTBEAT.md: MANQUANT | brut 0 | injecté 0
- BOOTSTRAP.md: OK | brut 0 caractères (~0 tok) | injecté 0 caractères (~0 tok)

Liste des Skills (texte de l’invite système) : 2,184 caractères (~546 tok) (12 Skills)
Outils : read, edit, write, exec, process, browser, message, sessions_send, …
Liste des outils (texte de l’invite système) : 1,032 caractères (~258 tok)
Schémas des outils (JSON) : 31,988 caractères (~7,997 tok) (comptabilisés dans le contexte ; non affichés sous forme de texte)
Outils : (identiques à ceux ci-dessus)

Tokens de la session (en cache) : 14,250 au total / ctx=32,000
```

### `/context detail`

```text
🧠 Ventilation du contexte (détaillée)
…
Principales Skills (taille de l’entrée d’invite) :
- frontend-design: 412 caractères (~103 tok)
- oracle: 401 caractères (~101 tok)
… (+10 Skills supplémentaires)

Principaux outils (taille du schéma) :
- browser: 9,812 caractères (~2,453 tok)
- exec: 6,240 caractères (~1,560 tok)
… (+N outils supplémentaires)
```

### `/context map`

Envoie une image générée à partir du dernier rapport d’exécution mis en cache et de la transcription de la session. Avant qu’un message normal n’ait produit un rapport d’exécution dans la session, `/context map` renvoie un message d’indisponibilité au lieu d’afficher une estimation. La surface des rectangles est proportionnelle au nombre de caractères suivis dans l’invite :

- transcription de la conversation (messages de l’utilisateur, réponses de l’assistant, résultats des outils, résumés de compaction), ainsi que le contexte d’exécution propre à chaque tour et les ajouts d’invite des hooks qui ne parviennent qu’au modèle
- fichiers injectés depuis l’espace de travail
- texte de base de l’invite système
- entrées d’invite des Skills
- schémas JSON des outils

Le groupe de conversation s’agrandit au fil de la session ; la carte évolue donc à chaque tour. Après une compaction, il se réduit à une tuile de résumés.

`/context list`, `/context detail` et `/context json` peuvent toujours inspecter une estimation à la demande lorsqu’aucun rapport d’exécution n’est mis en cache.

## Ce qui est comptabilisé dans la fenêtre de contexte

Tout ce que le modèle reçoit est comptabilisé, notamment :

- Invite système (toutes les sections).
- Historique de la conversation.
- Appels d’outils + résultats des outils.
- Pièces jointes/transcriptions (images/audio/fichiers).
- Résumés de compaction et artefacts d’élagage.
- « Enveloppes » du fournisseur ou en-têtes masqués (non visibles, mais néanmoins comptabilisés).

## Comment OpenClaw génère l’invite système

L’invite système est **gérée par OpenClaw** et reconstruite à chaque exécution. Elle comprend :

- Liste des outils + courtes descriptions.
- Liste des Skills (métadonnées uniquement ; voir ci-dessous).
- Emplacement de l’espace de travail.
- Heure (UTC + heure locale de l’utilisateur convertie si elle est configurée).
- Métadonnées de l’environnement d’exécution (hôte/SE/modèle/raisonnement).
- Fichiers d’amorçage injectés depuis l’espace de travail sous **Contexte du projet**.

Ventilation complète : [Invite système](/fr/concepts/system-prompt).

## Fichiers injectés depuis l’espace de travail (Contexte du projet)

Par défaut, OpenClaw injecte un ensemble fixe de fichiers de l’espace de travail (s’ils sont présents) :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (uniquement lors de la première exécution)

Les fichiers volumineux sont tronqués individuellement selon `agents.defaults.bootstrapMaxChars` (`20000` caractères par défaut). OpenClaw impose également une limite totale d’injection d’amorçage pour l’ensemble des fichiers avec `agents.defaults.bootstrapTotalMaxChars` (`60000` caractères par défaut). `/context` affiche les tailles **brutes par rapport aux tailles injectées** et indique si une troncature a eu lieu.

Lorsqu’une troncature se produit, l’environnement d’exécution peut injecter un bloc d’avertissement dans le prompt sous Project Context. Configurez ce comportement avec `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ; valeur par défaut : `always`).

## Skills : injectées ou chargées à la demande

Le prompt système comprend une **liste de Skills** compacte (nom + description + emplacement). Cette liste entraîne un coût réel.

Les instructions des Skills ne sont _pas_ incluses par défaut. Le modèle est censé `read` le fichier `SKILL.md` de la Skill **uniquement lorsque cela est nécessaire**.

## Outils : deux types de coûts

Les outils affectent le contexte de deux manières :

1. Le **texte de la liste des outils** dans le prompt système (ce que vous voyez sous « Tooling »).
2. Les **schémas des outils** (JSON). Ils sont envoyés au modèle afin qu’il puisse appeler les outils. Ils sont comptabilisés dans le contexte, même si vous ne les voyez pas sous forme de texte brut.

`/context detail` décompose les schémas d’outils les plus volumineux afin que vous puissiez identifier ceux qui occupent le plus de place.

## Commandes, directives et « raccourcis intégrés »

Les commandes à barre oblique sont gérées par le Gateway. Il existe plusieurs comportements distincts :

- **Commandes autonomes** : un message contenant uniquement `/...` est exécuté comme une commande.
- **Directives** : `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue` sont retirées avant que le modèle ne voie le message.
  - Les messages contenant uniquement des directives conservent les paramètres de session.
  - Les directives intégrées à un message normal servent d’indications propres à ce message.
- **Raccourcis intégrés** (expéditeurs autorisés uniquement) : certains jetons `/...` dans un message normal peuvent être exécutés immédiatement (exemple : « hey /status ») et sont retirés avant que le modèle ne voie le texte restant.

Détails : [Commandes slash](/fr/tools/slash-commands).

## Sessions, Compaction et élagage (ce qui persiste)

Ce qui persiste entre les messages dépend du mécanisme :

- **L’historique normal** persiste dans la transcription de la session jusqu’à ce qu’il soit compacté ou élagué conformément à la politique.
- **La Compaction** conserve un résumé dans la transcription et maintient intacts les messages récents.
- **L’élagage** supprime les anciens résultats d’outils de l’invite _en mémoire_ afin de libérer de l’espace dans la fenêtre de contexte, mais ne réécrit pas la transcription de la session : l’historique complet reste consultable sur le disque.

Documentation : [Session](/fr/concepts/session), [Compaction](/fr/concepts/compaction), [Élagage de session](/fr/concepts/session-pruning).

Par défaut, OpenClaw utilise le moteur de contexte intégré `legacy` pour l’assemblage et
la Compaction. Si vous installez un Plugin qui fournit `kind: "context-engine"` et
que vous le sélectionnez avec `plugins.slots.contextEngine`, OpenClaw délègue à ce
moteur l’assemblage du contexte, `/compact` et les hooks connexes du cycle de vie du contexte des sous-agents.
`ownsCompaction: false` ne revient pas automatiquement au moteur historique ;
le moteur actif doit toujours implémenter correctement `compact()`. Consultez
[Moteur de contexte](/fr/concepts/context-engine) pour découvrir l’interface
enfichable complète, les hooks de cycle de vie et la configuration.

## Ce que `/context` indique réellement

`/context` utilise de préférence le dernier rapport d’invite système **généré lors de l’exécution** lorsqu’il est disponible :

- `System prompt (run)` = capturé lors de la dernière exécution intégrée (capable d’utiliser des outils) et conservé dans le stockage de session.
- `System prompt (estimate)` = calculé à la volée lorsqu’aucun rapport d’exécution n’existe (ou lors de l’utilisation d’un backend CLI qui ne génère pas ce rapport).

Dans les deux cas, il indique les tailles et les principaux contributeurs ; il ne fournit **pas** l’intégralité du prompt système ni les schémas des outils. En mode détaillé, il compare également la transcription de la session à l’aide du même prédicat de messages de conversation réelle que celui utilisé par la Compaction, afin de distinguer plus facilement une utilisation élevée du prompt/cache d’un historique de conversation pouvant faire l’objet d’une Compaction.

## Voir aussi

<CardGroup cols={2}>
  <Card title="Moteur de contexte" href="/fr/concepts/context-engine" icon="puzzle-piece">
    Injection de contexte personnalisé via des plugins.
  </Card>
  <Card title="Compaction" href="/fr/concepts/compaction" icon="compress">
    Résumé des longues conversations pour les maintenir dans la fenêtre du modèle.
  </Card>
  <Card title="Prompt système" href="/fr/concepts/system-prompt" icon="message-lines">
    Comment le prompt système est construit et ce qu’il injecte à chaque tour.
  </Card>
  <Card title="Boucle de l’agent" href="/fr/concepts/agent-loop" icon="arrows-rotate">
    Le cycle complet d’exécution de l’agent, du message entrant à la réponse finale.
  </Card>
</CardGroup>
