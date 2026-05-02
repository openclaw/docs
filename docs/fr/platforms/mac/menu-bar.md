---
read_when:
    - Ajustement de l’interface utilisateur du menu Mac ou de la logique d’état
summary: Logique d’état de la barre de menus et ce qui est affiché aux utilisateurs
title: Barre de menus
x-i18n:
    generated_at: "2026-05-02T07:12:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 340b86a2e222fb1fe7fda4f0f0434127af1393a64348ea033ea284ba52866beb
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

# Logique de statut de la barre de menus

## Ce qui est affiché

- Nous affichons l’état de travail actuel de l’agent dans l’icône de la barre de menus et dans la première ligne de statut du menu.
- L’état de santé est masqué pendant que le travail est actif ; il réapparaît lorsque toutes les sessions sont inactives.
- Un sous-menu racine « Contexte » contient les sessions récentes au lieu de les développer directement dans le menu racine.
- Le bloc « Nœuds » du menu racine liste uniquement les **appareils** (nœuds appairés via `node.list`), pas les entrées client/présence.
- Une section racine « Utilisation » apparaît sous Contexte lorsque des instantanés d’utilisation des fournisseurs sont disponibles, suivie des détails de coût d’utilisation lorsqu’ils sont disponibles.

## Modèle d’état

- Sessions : les événements arrivent avec `runId` (par exécution) ainsi que `sessionKey` dans la charge utile. La session « principale » est la clé `main` ; si elle est absente, nous nous rabattons sur la session mise à jour le plus récemment.
- Priorité : la session principale l’emporte toujours. Si la session principale est active, son état est affiché immédiatement. Si la session principale est inactive, la session non principale active la plus récente est affichée. Nous n’alternons pas en pleine activité ; nous ne changeons que lorsque la session actuelle devient inactive ou que la session principale devient active.
- Types d’activité :
  - `job` : exécution de commande de haut niveau (`state: started|streaming|done|error`).
  - `tool` : `phase: start|result` avec `toolName` et `meta/args`.

## Énumération IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (forçage de débogage)

### ActivityKind → glyphe

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- valeur par défaut → 🛠️

### Correspondance visuelle

- `idle` : mascotte normale.
- `workingMain` : badge avec glyphe, teinte complète, animation de patte « en travail ».
- `workingOther` : badge avec glyphe, teinte atténuée, pas de déplacement rapide.
- `overridden` : utilise le glyphe/la teinte choisis quelle que soit l’activité.

## Sous-menu Contexte

- Le menu racine affiche une ligne « Contexte » avec un nombre/statut de sessions et ouvre un sous-menu.
- L’en-tête du sous-menu Contexte affiche le nombre de sessions actives des dernières 24 heures.
- Chaque ligne de session conserve sa barre de jetons, son âge, son aperçu, ses actions réflexion/verbeux, réinitialiser, compacter et supprimer.
- Les messages de chargement, de déconnexion et d’erreur de chargement de session apparaissent dans le sous-menu Contexte.
- Les détails d’utilisation des fournisseurs et de coût d’utilisation restent au niveau racine sous Contexte afin de rester consultables d’un coup d’œil sans ouvrir le sous-menu.

## Texte de la ligne de statut (menu)

- Pendant que le travail est actif : `<Session role> · <activity label>`
  - Exemples : `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- En cas d’inactivité : se rabat sur le résumé de santé.

## Ingestion des événements

- Source : événements `agent` du canal de contrôle (`ControlChannel.handleAgentEvent`).
- Champs analysés :
  - `stream: "job"` avec `data.state` pour démarrer/arrêter.
  - `stream: "tool"` avec `data.phase`, `name`, `meta`/`args` facultatifs.
- Libellés :
  - `exec` : première ligne de `args.command`.
  - `read`/`write` : chemin raccourci.
  - `edit` : chemin plus type de changement inféré à partir de `meta`/des nombres du diff.
  - recours : nom de l’outil.

## Forçage de débogage

- Réglages ▸ Débogage ▸ sélecteur « Forçage de l’icône » :
  - `System (auto)` (par défaut)
  - `Working: main` (par type d’outil)
  - `Working: other` (par type d’outil)
  - `Idle`
- Stocké via `@AppStorage("iconOverride")` ; mappé vers `IconState.overridden`.

## Liste de vérification des tests

- Déclencher une tâche de session principale : vérifier que l’icône change immédiatement et que la ligne de statut affiche le libellé principal.
- Déclencher une tâche de session non principale pendant que la principale est inactive : l’icône/le statut affiche la session non principale ; reste stable jusqu’à sa fin.
- Démarrer la session principale pendant qu’une autre est active : l’icône bascule instantanément vers la principale.
- Rafales rapides d’outils : s’assurer que le badge ne scintille pas (grâce TTL sur les résultats d’outils).
- La ligne de santé réapparaît une fois toutes les sessions inactives.

## Associé

- [application macOS](/fr/platforms/macos)
- [Icône de la barre de menus](/fr/platforms/mac/icon)
