---
read_when:
    - Vous souhaitez des résultats d’outil `exec` ou `bash` plus courts dans OpenClaw
    - Vous souhaitez installer ou activer le plugin Tokenjuice
    - Vous devez comprendre ce que Tokenjuice modifie et ce qu’il laisse brut
summary: Compactez les résultats verbeux des outils exec et bash avec le Plugin Tokenjuice facultatif
title: Tokenjuice
x-i18n:
    generated_at: "2026-07-12T16:01:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 96b110563a2600429dd9f0d38997cf7cc5ae4952b7f146a6ab64c96f2f202440
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` est un plugin externe facultatif qui compacte les résultats bruyants des outils `exec` et `bash`
après l’exécution de la commande.

Il modifie le `tool_result` renvoyé, et non la commande elle-même. Tokenjuice ne
réécrit pas l’entrée du shell, ne réexécute pas les commandes et ne modifie pas les codes de sortie.

Actuellement, cela s’applique aux exécutions intégrées d’OpenClaw et aux outils dynamiques d’OpenClaw dans le
harness app-server de Codex. Tokenjuice s’intègre au middleware de résultats d’outils d’OpenClaw et
réduit la sortie avant son renvoi dans la session active du harness.

## Activer le plugin

Installez-le une fois :

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

Puis activez-le :

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Équivalent :

```bash
openclaw plugins enable tokenjuice
```

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

## Ce que modifie tokenjuice

- Compacte les résultats bruyants de `exec` et `bash` avant leur réinjection dans la session.
- Ne modifie en rien l’exécution de la commande d’origine.
- Applique une politique d’inventaire sûre : les lectures exactes du contenu des fichiers restent brutes, les commandes autonomes d’inventaire du dépôt peuvent être compactées et les séquences de commandes mixtes non sûres restent brutes.
- Reste facultatif : désactivez le plugin si vous souhaitez obtenir partout une sortie à l’identique.

## Vérifier son fonctionnement

1. Activez le plugin.
2. Démarrez une session pouvant appeler `exec`.
3. Exécutez une commande produisant une sortie volumineuse, telle que `git status`.
4. Vérifiez que le résultat d’outil renvoyé est plus court et plus structuré que la sortie brute du shell.

## Désactiver le plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Ou :

```bash
openclaw plugins disable tokenjuice
```

## Pages connexes

- [Outil Exec](/fr/tools/exec)
- [Niveaux de raisonnement](/fr/tools/thinking)
- [Moteur de contexte](/fr/concepts/context-engine)
