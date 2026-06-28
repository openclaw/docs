---
read_when:
    - Ajuster l’interface utilisateur du menu Mac ou la logique d’état
summary: Logique d’état de la barre de menus et ce qui est présenté aux utilisateurs
title: Barre de menus
x-i18n:
    generated_at: "2026-05-06T07:31:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: c569ced20b2f6a639d52d373cc8b55a42d7c015a0b234d5154ce67ac03c2eaf6
    source_path: platforms/mac/menu-bar.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Ce qui est affiché

- Nous affichons l’état de travail actuel de l’agent dans l’icône de la barre de menus et dans la première ligne d’état du menu.
- L’état de santé est masqué pendant qu’un travail est actif ; il revient lorsque toutes les sessions sont inactives.
- Un sous-menu racine « Contexte » contient les sessions récentes au lieu de les développer directement dans le menu racine.
- Le bloc « Nodes » du menu racine liste uniquement les **appareils** (nœuds appairés via `node.list`), et non les entrées de client/présence.
- Une section racine « Utilisation » apparaît sous Contexte lorsque des instantanés d’utilisation du fournisseur sont disponibles, suivie des détails de coût d’utilisation lorsqu’ils sont disponibles.

## Modèle d’état

- Sessions : les événements arrivent avec `runId` (par exécution) plus `sessionKey` dans la charge utile. La session « principale » correspond à la clé `main` ; si elle est absente, nous nous rabattons sur la session mise à jour le plus récemment.
- Priorité : la session principale l’emporte toujours. Si la session principale est active, son état est affiché immédiatement. Si la session principale est inactive, la session non principale active le plus récemment est affichée. Nous ne basculons pas sans cesse au milieu d’une activité ; nous ne changeons que lorsque la session actuelle devient inactive ou que la session principale devient active.
- Types d’activité :
  - `job` : exécution de commande de haut niveau (`state: started|streaming|done|error`).
  - `tool` : `phase: start|result` avec `toolName` et `meta/args`.

## Énumération IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (surcharge de débogage)

### ActivityKind → glyphe

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- par défaut → 🛠️

### Correspondance visuelle

- `idle` : créature normale.
- `workingMain` : badge avec glyphe, teinte complète, animation de patte « travail en cours ».
- `workingOther` : badge avec glyphe, teinte atténuée, pas de déplacement rapide.
- `overridden` : utilise le glyphe/la teinte choisis, quelle que soit l’activité.

## Sous-menu Contexte

- Le menu racine affiche une ligne « Contexte » avec un nombre/état de sessions et ouvre un sous-menu.
- L’en-tête du sous-menu Contexte affiche le nombre de sessions actives des dernières 24 heures.
- Chaque ligne de session conserve sa barre de jetons, son âge, son aperçu, ses actions réflexion/détaillé, réinitialiser, compacter et supprimer.
- Les messages de chargement, de déconnexion et d’erreur de chargement de session apparaissent dans le sous-menu Contexte.
- Les détails d’utilisation du fournisseur et de coût d’utilisation restent au niveau racine sous Contexte afin de rester consultables d’un coup d’œil sans ouvrir le sous-menu.

## Texte de la ligne d’état (menu)

- Pendant qu’un travail est actif : `<Session role> · <activity label>`
  - Exemples : `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- En cas d’inactivité : revient au résumé de santé.

## Ingestion des événements

- Source : événements `agent` du control-channel (`ControlChannel.handleAgentEvent`).
- Champs analysés :
  - `stream: "job"` avec `data.state` pour le démarrage/l’arrêt.
  - `stream: "tool"` avec `data.phase`, `name`, `meta`/`args` facultatifs.
- Libellés :
  - `exec` : première ligne de `args.command`.
  - `read`/`write` : chemin raccourci.
  - `edit` : chemin plus type de modification déduit depuis `meta`/les compteurs de diff.
  - solution de repli : nom de l’outil.

## Surcharge de débogage

- Réglages ▸ Débogage ▸ sélecteur « Surcharge de l’icône » :
  - `System (auto)` (par défaut)
  - `Working: main` (par type d’outil)
  - `Working: other` (par type d’outil)
  - `Idle`
- Stocké via `@AppStorage("iconOverride")` ; mappé vers `IconState.overridden`.

## Liste de vérification des tests

- Déclencher une tâche de session principale : vérifier que l’icône bascule immédiatement et que la ligne d’état affiche le libellé principal.
- Déclencher une tâche de session non principale pendant que la session principale est inactive : l’icône/l’état affiche la session non principale ; reste stable jusqu’à sa fin.
- Démarrer la session principale pendant qu’une autre est active : l’icône bascule instantanément vers la session principale.
- Rafales rapides d’outils : s’assurer que le badge ne scintille pas (délai de grâce TTL sur les résultats d’outils).
- La ligne de santé réapparaît une fois toutes les sessions inactives.

## Connexe

- [application macOS](/fr/platforms/macos)
- [Icône de la barre de menus](/fr/platforms/mac/icon)
