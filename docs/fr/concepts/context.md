---
read_when:
    - Vous voulez comprendre ce que signifie « contexte » dans OpenClaw
    - Vous diagnostiquez pourquoi le modèle « sait » quelque chose (ou l’a oublié)
    - Vous voulez réduire la surcharge de contexte (/context, /status, /compact)
summary: 'Contexte : ce que voit le modèle, comment il est construit et comment l’inspecter'
title: Contexte
x-i18n:
    generated_at: "2026-05-11T20:31:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc2dae290e63f82111d865ae066567ef58ec3f48eb62b409b76ee9e6ff65d696
    source_path: concepts/context.md
    workflow: 16
---

« Contexte » désigne **tout ce qu’OpenClaw envoie au modèle pour une exécution**. Il est limité par la **fenêtre de contexte** du modèle (limite de tokens).

Modèle mental pour débutant :

- **Prompt système** (construit par OpenClaw) : règles, outils, liste des Skills, heure/runtime et fichiers d’espace de travail injectés.
- **Historique de conversation** : vos messages + les messages de l’assistant pour cette session.
- **Appels/résultats d’outils + pièces jointes** : sortie de commande, lectures de fichiers, images/audio, etc.

Le contexte n’est _pas la même chose_ que la « mémoire » : la mémoire peut être stockée sur disque et rechargée plus tard ; le contexte est ce qui se trouve dans la fenêtre actuelle du modèle.

## Démarrage rapide (inspecter le contexte)

- `/status` → vue rapide « à quel point ma fenêtre est-elle pleine ? » + paramètres de session.
- `/context list` → ce qui est injecté + tailles approximatives (par fichier + totaux).
- `/context detail` → répartition plus détaillée : tailles par fichier, par schéma d’outil, par entrée de Skill, et taille du prompt système.
- `/context map` → image treemap façon WinDirStat des contributeurs suivis au contexte de la session actuelle.
- `/usage tokens` → ajoute un pied de page d’utilisation par réponse aux réponses normales.
- `/compact` → résume l’ancien historique dans une entrée compacte pour libérer de l’espace dans la fenêtre.

Voir aussi : [Commandes slash](/fr/tools/slash-commands), [Utilisation des tokens et coûts](/fr/reference/token-use), [Compaction](/fr/concepts/compaction).

## Exemple de sortie

Les valeurs varient selon le modèle, le fournisseur, la politique d’outils et ce qui se trouve dans votre espace de travail.

### `/context list`

```
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

```
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

Envoie une image générée à partir du dernier rapport d’exécution mis en cache. Avant qu’un message normal ait produit un rapport d’exécution dans la session, `/context map` renvoie un message d’indisponibilité au lieu de générer une estimation. La surface des rectangles est proportionnelle aux caractères de prompt suivis :

- fichiers d’espace de travail injectés
- texte de base du prompt système
- entrées de prompt des Skills
- schémas JSON des outils

`/context list`, `/context detail` et `/context json` peuvent toujours inspecter une estimation à la demande lorsqu’aucun rapport d’exécution n’est mis en cache.

## Ce qui compte dans la fenêtre de contexte

Tout ce que le modèle reçoit compte, notamment :

- Le prompt système (toutes les sections).
- L’historique de conversation.
- Les appels d’outils + résultats d’outils.
- Les pièces jointes/transcriptions (images/audio/fichiers).
- Les résumés de Compaction et artefacts d’élagage.
- Les « wrappers » ou en-têtes masqués du fournisseur (non visibles, mais comptabilisés).

## Comment OpenClaw construit le prompt système

Le prompt système est **détenu par OpenClaw** et reconstruit à chaque exécution. Il inclut :

- Liste des outils + descriptions courtes.
- Liste des Skills (métadonnées uniquement ; voir ci-dessous).
- Emplacement de l’espace de travail.
- Heure (UTC + heure utilisateur convertie si configurée).
- Métadonnées runtime (hôte/OS/modèle/raisonnement).
- Fichiers de bootstrap d’espace de travail injectés sous **Contexte du projet**.

Répartition complète : [Prompt système](/fr/concepts/system-prompt).

## Fichiers d’espace de travail injectés (Contexte du projet)

Par défaut, OpenClaw injecte un ensemble fixe de fichiers d’espace de travail (s’ils sont présents) :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (première exécution uniquement)

Les gros fichiers sont tronqués fichier par fichier avec `agents.defaults.bootstrapMaxChars` (par défaut `12000` caractères). OpenClaw applique aussi un plafond total d’injection de bootstrap sur l’ensemble des fichiers avec `agents.defaults.bootstrapTotalMaxChars` (par défaut `60000` caractères). `/context` affiche les tailles **brutes vs injectées** et indique si une troncature a eu lieu.

Lorsqu’une troncature se produit, le runtime peut injecter un bloc d’avertissement dans le prompt sous Contexte du projet. Configurez cela avec `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ; par défaut `once`).

## Skills : injectées vs chargées à la demande

Le prompt système inclut une **liste de Skills** compacte (nom + description + emplacement). Cette liste a un coût réel.

Les instructions des Skills ne sont _pas_ incluses par défaut. Le modèle est censé `read` le `SKILL.md` de la Skill **uniquement lorsque nécessaire**.

## Outils : il y a deux coûts

Les outils affectent le contexte de deux façons :

1. **Texte de la liste des outils** dans le prompt système (ce que vous voyez comme « Outillage »).
2. **Schémas d’outils** (JSON). Ils sont envoyés au modèle pour qu’il puisse appeler les outils. Ils comptent dans le contexte même si vous ne les voyez pas comme du texte brut.

`/context detail` détaille les plus gros schémas d’outils afin que vous puissiez voir ce qui domine.

## Commandes, directives et « raccourcis inline »

Les commandes slash sont gérées par le Gateway. Il existe quelques comportements différents :

- **Commandes autonomes** : un message qui contient seulement `/...` s’exécute comme une commande.
- **Directives** : `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` sont retirées avant que le modèle voie le message.
  - Les messages contenant uniquement une directive conservent les paramètres de session.
  - Les directives inline dans un message normal agissent comme des indications propres au message.
- **Raccourcis inline** (expéditeurs autorisés uniquement) : certains tokens `/...` dans un message normal peuvent s’exécuter immédiatement (exemple : « hey /status ») et sont retirés avant que le modèle voie le texte restant.

Détails : [Commandes slash](/fr/tools/slash-commands).

## Sessions, Compaction et élagage (ce qui persiste)

Ce qui persiste entre les messages dépend du mécanisme :

- **Historique normal** persiste dans la transcription de session jusqu’à ce qu’il soit compacté/élagué par la politique.
- **Compaction** conserve un résumé dans la transcription et garde intacts les messages récents.
- **Élagage** supprime les anciens résultats d’outils du prompt _en mémoire_ pour libérer de l’espace dans la fenêtre de contexte, mais ne réécrit pas la transcription de session : l’historique complet reste inspectable sur disque.

Docs : [Session](/fr/concepts/session), [Compaction](/fr/concepts/compaction), [Élagage de session](/fr/concepts/session-pruning).

Par défaut, OpenClaw utilise le moteur de contexte intégré `legacy` pour l’assemblage et la
Compaction. Si vous installez un Plugin qui fournit `kind: "context-engine"` et
que vous le sélectionnez avec `plugins.slots.contextEngine`, OpenClaw délègue plutôt
l’assemblage du contexte, `/compact` et les hooks de cycle de vie du contexte de sous-agent associés à ce
moteur. `ownsCompaction: false` ne revient pas automatiquement au moteur
`legacy` ; le moteur actif doit tout de même implémenter `compact()` correctement. Consultez
[Moteur de contexte](/fr/concepts/context-engine) pour l’interface
enfichable complète, les hooks de cycle de vie et la configuration.

## Ce que `/context` rapporte réellement

`/context` privilégie le dernier rapport de prompt système **construit par l’exécution** lorsqu’il est disponible :

- `System prompt (run)` = capturé depuis la dernière exécution intégrée (capable d’utiliser des outils) et conservé dans le magasin de session.
- `System prompt (estimate)` = calculé à la volée lorsqu’aucun rapport d’exécution n’existe (ou lors d’une exécution via un backend CLI qui ne génère pas le rapport).

Dans les deux cas, il rapporte les tailles et les principaux contributeurs ; il ne déverse **pas** le prompt système complet ni les schémas d’outils.

## Connexe

<CardGroup cols={2}>
  <Card title="Moteur de contexte" href="/fr/concepts/context-engine" icon="puzzle-piece">
    Injection de contexte personnalisée via des plugins.
  </Card>
  <Card title="Compaction" href="/fr/concepts/compaction" icon="compress">
    Résumer les longues conversations pour les garder dans la fenêtre du modèle.
  </Card>
  <Card title="Prompt système" href="/fr/concepts/system-prompt" icon="message-lines">
    Comment le prompt système est construit et ce qu’il injecte à chaque tour.
  </Card>
  <Card title="Boucle d’agent" href="/fr/concepts/agent-loop" icon="arrows-rotate">
    Le cycle complet d’exécution de l’agent, du message entrant à la réponse finale.
  </Card>
</CardGroup>
