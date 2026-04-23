---
read_when:
    - Vous souhaitez des résultats d’outil `exec` ou `bash` plus courts dans OpenClaw
    - Vous souhaitez activer le Plugin intégré tokenjuice
    - Vous avez besoin de comprendre ce que tokenjuice modifie et ce qu’il laisse brut
summary: Compacter les résultats bruyants des outils exec et bash avec un Plugin intégré facultatif
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-23T07:12:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b9a1054c9b1cc62e43ac6d5904c7790f9b27d8e0d0700c9da6e287c00e91783
    source_path: tools/tokenjuice.md
    workflow: 15
---

# Tokenjuice

`tokenjuice` est un Plugin intégré facultatif qui compacte les résultats bruyants des outils `exec` et `bash`
après que la commande a déjà été exécutée.

Il modifie le `tool_result` renvoyé, pas la commande elle-même. Tokenjuice ne
réécrit pas l’entrée shell, ne relance pas les commandes et ne modifie pas les codes de sortie.

Aujourd’hui, cela s’applique aux exécutions intégrées sur Pi, où tokenjuice intercepte le chemin
`tool_result` intégré et réduit la sortie renvoyée dans la session.

## Activer le Plugin

Chemin rapide :

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Équivalent :

```bash
openclaw plugins enable tokenjuice
```

OpenClaw fournit déjà le Plugin. Il n’y a pas d’étape séparée `plugins install`
ou `tokenjuice install openclaw`.

Si vous préférez modifier directement la configuration :

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## Ce que tokenjuice modifie

- Compacte les résultats bruyants de `exec` et `bash` avant qu’ils ne soient réinjectés dans la session.
- Laisse l’exécution de la commande d’origine intacte.
- Préserve les lectures exactes de contenu de fichier et les autres commandes que tokenjuice doit laisser brutes.
- Reste en opt-in : désactivez le Plugin si vous voulez une sortie littérale partout.

## Vérifier que cela fonctionne

1. Activez le Plugin.
2. Démarrez une session qui peut appeler `exec`.
3. Exécutez une commande bruyante telle que `git status`.
4. Vérifiez que le résultat d’outil renvoyé est plus court et plus structuré que la sortie shell brute.

## Désactiver le Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Ou :

```bash
openclaw plugins disable tokenjuice
```
