---
read_when:
    - Vous voulez des résultats d’outils `exec` ou `bash` plus courts dans OpenClaw
    - Vous voulez activer le Plugin tokenjuice intégré
    - Vous devez comprendre ce que tokenjuice modifie et ce qu’il laisse brut
summary: Compacter les résultats bruyants des outils exec et bash avec un Plugin intégré facultatif
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-25T14:00:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04328cc7a13ccd64f8309ddff867ae893387f93c26641dfa1a4013a4c3063962
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` est un Plugin intégré facultatif qui compacte les résultats bruyants des outils `exec` et `bash`
une fois la commande déjà exécutée.

Il modifie le `tool_result` renvoyé, et non la commande elle-même. Tokenjuice ne
réécrit pas l’entrée du shell, ne réexécute pas les commandes et ne modifie pas les codes de sortie.

Aujourd’hui, cela s’applique aux exécutions embarquées PI et aux outils dynamiques OpenClaw dans le harnais app-server de Codex.
Tokenjuice s’accroche au middleware de résultat d’outil d’OpenClaw et
réduit la sortie avant qu’elle ne soit réinjectée dans la session active du harnais.

## Activer le Plugin

Voie rapide :

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Équivalent :

```bash
openclaw plugins enable tokenjuice
```

OpenClaw fournit déjà le Plugin. Il n’y a pas d’étape distincte `plugins install`
ou `tokenjuice install openclaw`.

Si vous préférez modifier directement la configuration :

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
- Préserve les lectures exactes du contenu des fichiers et les autres commandes que tokenjuice doit laisser brutes.
- Reste optionnel : désactivez le Plugin si vous voulez une sortie verbatim partout.

## Vérifier que cela fonctionne

1. Activez le Plugin.
2. Démarrez une session pouvant appeler `exec`.
3. Exécutez une commande bruyante telle que `git status`.
4. Vérifiez que le résultat d’outil renvoyé est plus court et plus structuré que la sortie brute du shell.

## Désactiver le Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Ou :

```bash
openclaw plugins disable tokenjuice
```

## Lié

- [Outil Exec](/fr/tools/exec)
- [Niveaux de réflexion](/fr/tools/thinking)
- [Moteur de contexte](/fr/concepts/context-engine)
