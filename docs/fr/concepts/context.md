---
read_when:
    - Vous voulez comprendre ce que signifie « contexte » dans OpenClaw
    - Vous déboguez pourquoi le modèle « sait » quelque chose (ou l’a oublié)
    - Vous souhaitez réduire la surcharge de contexte (/context, /status, /compact)
summary: 'Contexte : ce que le modèle voit, comment il est construit et comment l’inspecter'
title: Contexte
x-i18n:
    generated_at: "2026-05-06T07:17:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd23094ef23928ee277c1b84ee17b9324aaea963d72a0c4c73da359409a5de9
    source_path: concepts/context.md
    workflow: 16
---

Le « contexte » est **tout ce qu’OpenClaw envoie au modèle pour une exécution**. Il est limité par la **fenêtre de contexte** du modèle (limite de tokens).

Modèle mental pour débuter :

- **Invite système** (construite par OpenClaw) : règles, outils, liste des compétences, heure/exécution, et fichiers de l’espace de travail injectés.
- **Historique de conversation** : vos messages + les messages de l’assistant pour cette session.
- **Appels/résultats d’outils + pièces jointes** : sortie de commande, lectures de fichiers, images/audio, etc.

Le contexte n’est _pas la même chose_ que la « mémoire » : la mémoire peut être stockée sur disque et rechargée plus tard ; le contexte est ce qui se trouve dans la fenêtre actuelle du modèle.

## Démarrage rapide (inspecter le contexte)

- `/status` → vue rapide « à quel point ma fenêtre est-elle remplie ? » + paramètres de session.
- `/context list` → ce qui est injecté + tailles approximatives (par fichier + totaux).
- `/context detail` → répartition plus détaillée : tailles par fichier, par schéma d’outil, par entrée de compétence, et taille de l’invite système.
- `/usage tokens` → ajouter un pied de page d’utilisation par réponse aux réponses normales.
- `/compact` → résumer l’ancien historique dans une entrée compacte pour libérer de l’espace dans la fenêtre.

Voir aussi : [Commandes slash](/fr/tools/slash-commands), [Utilisation des tokens et coûts](/fr/reference/token-use), [Compaction](/fr/concepts/compaction).

## Exemple de sortie

Les valeurs varient selon le modèle, le fournisseur, la politique d’outils et ce qui se trouve dans votre espace de travail.

### `/context list`

```
🧠 Répartition du contexte
Espace de travail : <workspaceDir>
Maximum d’amorçage/fichier : 12,000 caractères
Sandbox : mode=non-main sandboxed=false
Invite système (exécution) : 38,412 caractères (~9,603 tok) (Contexte du projet 23,901 caractères (~5,976 tok))

Fichiers de l’espace de travail injectés :
- AGENTS.md : OK | brut 1,742 caractères (~436 tok) | injecté 1,742 caractères (~436 tok)
- SOUL.md : OK | brut 912 caractères (~228 tok) | injecté 912 caractères (~228 tok)
- TOOLS.md : TRUNCATED | brut 54,210 caractères (~13,553 tok) | injecté 20,962 caractères (~5,241 tok)
- IDENTITY.md : OK | brut 211 caractères (~53 tok) | injecté 211 caractères (~53 tok)
- USER.md : OK | brut 388 caractères (~97 tok) | injecté 388 caractères (~97 tok)
- HEARTBEAT.md : MISSING | brut 0 | injecté 0
- BOOTSTRAP.md : OK | brut 0 caractères (~0 tok) | injecté 0 caractères (~0 tok)

Liste des Skills (texte de l’invite système) : 2,184 caractères (~546 tok) (12 Skills)
Outils : read, edit, write, exec, process, browser, message, sessions_send, …
Liste des outils (texte de l’invite système) : 1,032 caractères (~258 tok)
Schémas d’outils (JSON) : 31,988 caractères (~7,997 tok) (comptent dans le contexte ; non affichés comme texte)
Outils : (identiques à ci-dessus)

Tokens de session (mis en cache) : 14,250 au total / ctx=32,000
```

### `/context detail`

```
🧠 Répartition du contexte (détaillée)
…
Principaux Skills (taille de l’entrée d’invite) :
- frontend-design : 412 caractères (~103 tok)
- oracle : 401 caractères (~101 tok)
… (+10 autres Skills)

Principaux outils (taille du schéma) :
- browser : 9,812 caractères (~2,453 tok)
- exec : 6,240 caractères (~1,560 tok)
… (+N autres outils)
```

## Ce qui compte dans la fenêtre de contexte

Tout ce que le modèle reçoit compte, notamment :

- Invite système (toutes les sections).
- Historique de conversation.
- Appels d’outils + résultats d’outils.
- Pièces jointes/transcriptions (images/audio/fichiers).
- Résumés de Compaction et artefacts d’élagage.
- « Wrappers » ou en-têtes masqués du fournisseur (non visibles, mais tout de même comptés).

## Comment OpenClaw construit l’invite système

L’invite système est **propriété d’OpenClaw** et reconstruite à chaque exécution. Elle inclut :

- Liste des outils + courtes descriptions.
- Liste des Skills (métadonnées uniquement ; voir ci-dessous).
- Emplacement de l’espace de travail.
- Heure (UTC + heure utilisateur convertie si configurée).
- Métadonnées d’exécution (hôte/OS/modèle/raisonnement).
- Fichiers d’amorçage de l’espace de travail injectés sous **Contexte du projet**.

Répartition complète : [Invite système](/fr/concepts/system-prompt).

## Fichiers de l’espace de travail injectés (Contexte du projet)

Par défaut, OpenClaw injecte un ensemble fixe de fichiers de l’espace de travail (s’ils sont présents) :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (première exécution uniquement)

Les gros fichiers sont tronqués par fichier à l’aide de `agents.defaults.bootstrapMaxChars` (`12000` caractères par défaut). OpenClaw applique aussi un plafond total d’injection d’amorçage sur l’ensemble des fichiers avec `agents.defaults.bootstrapTotalMaxChars` (`60000` caractères par défaut). `/context` affiche les tailles **brutes et injectées** ainsi que l’éventuelle troncature.

Lorsqu’une troncature se produit, l’exécution peut injecter un bloc d’avertissement dans l’invite sous Contexte du projet. Configurez cela avec `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ; valeur par défaut `once`).

## Skills : injectées ou chargées à la demande

L’invite système inclut une **liste des Skills** compacte (nom + description + emplacement). Cette liste a un coût réel.

Les instructions de Skill ne sont _pas_ incluses par défaut. Le modèle est censé `read` le fichier `SKILL.md` de la Skill **uniquement lorsque nécessaire**.

## Outils : il y a deux coûts

Les outils affectent le contexte de deux manières :

1. **Texte de la liste des outils** dans l’invite système (ce que vous voyez comme « Outillage »).
2. **Schémas d’outils** (JSON). Ils sont envoyés au modèle pour qu’il puisse appeler des outils. Ils comptent dans le contexte même si vous ne les voyez pas comme du texte brut.

`/context detail` répartit les plus grands schémas d’outils pour que vous puissiez voir ce qui domine.

## Commandes, directives et « raccourcis en ligne »

Les commandes slash sont gérées par le Gateway. Il existe quelques comportements différents :

- **Commandes autonomes** : un message qui contient uniquement `/...` s’exécute comme une commande.
- **Directives** : `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` sont supprimées avant que le modèle voie le message.
  - Les messages contenant uniquement une directive conservent les paramètres de session.
  - Les directives en ligne dans un message normal agissent comme des indications par message.
- **Raccourcis en ligne** (expéditeurs autorisés uniquement) : certains tokens `/...` à l’intérieur d’un message normal peuvent s’exécuter immédiatement (exemple : « hey /status »), puis sont supprimés avant que le modèle voie le texte restant.

Détails : [Commandes slash](/fr/tools/slash-commands).

## Sessions, Compaction et élagage (ce qui persiste)

Ce qui persiste entre les messages dépend du mécanisme :

- **Historique normal** persiste dans la transcription de session jusqu’à ce qu’il soit compacté/élagué par la politique.
- **Compaction** persiste un résumé dans la transcription et conserve les messages récents intacts.
- **Élagage** supprime les anciens résultats d’outils de l’invite _en mémoire_ pour libérer de l’espace dans la fenêtre de contexte, mais ne réécrit pas la transcription de session - l’historique complet reste consultable sur disque.

Docs : [Session](/fr/concepts/session), [Compaction](/fr/concepts/compaction), [Élagage de session](/fr/concepts/session-pruning).

Par défaut, OpenClaw utilise le moteur de contexte intégré `legacy` pour l’assemblage et
la Compaction. Si vous installez un Plugin qui fournit `kind: "context-engine"` et
le sélectionnez avec `plugins.slots.contextEngine`, OpenClaw délègue à ce moteur
l’assemblage du contexte, `/compact`, ainsi que les hooks de cycle de vie du contexte
des sous-agents associés. `ownsCompaction: false` ne provoque pas de retour automatique
au moteur `legacy` ; le moteur actif doit tout de même implémenter correctement
`compact()`. Consultez [Moteur de contexte](/fr/concepts/context-engine) pour l’interface
enfichable complète, les hooks de cycle de vie et la configuration.

## Ce que `/context` indique réellement

`/context` préfère le dernier rapport d’invite système **construit par l’exécution** lorsqu’il est disponible :

- `System prompt (run)` = capturé depuis la dernière exécution intégrée (capable d’utiliser des outils) et conservé dans le magasin de session.
- `System prompt (estimate)` = calculé à la volée lorsqu’aucun rapport d’exécution n’existe (ou lors de l’exécution via un backend CLI qui ne génère pas le rapport).

Dans les deux cas, il indique les tailles et les principaux contributeurs ; il ne vide **pas** l’invite système complète ni les schémas d’outils.

## Associé

<CardGroup cols={2}>
  <Card title="Moteur de contexte" href="/fr/concepts/context-engine" icon="puzzle-piece">
    Injection de contexte personnalisée via plugins.
  </Card>
  <Card title="Compaction" href="/fr/concepts/compaction" icon="compress">
    Résumer les longues conversations pour les maintenir dans la fenêtre du modèle.
  </Card>
  <Card title="Invite système" href="/fr/concepts/system-prompt" icon="message-lines">
    Comment l’invite système est construite et ce qu’elle injecte à chaque tour.
  </Card>
  <Card title="Boucle d’agent" href="/fr/concepts/agent-loop" icon="arrows-rotate">
    Le cycle complet d’exécution de l’agent, du message entrant à la réponse finale.
  </Card>
</CardGroup>
