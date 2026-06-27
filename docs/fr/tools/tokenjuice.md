---
read_when:
    - Vous voulez des résultats d’outils `exec` ou `bash` plus courts dans OpenClaw
    - Vous voulez installer ou activer le plugin Tokenjuice
    - Vous devez comprendre ce que tokenjuice modifie et ce qu’il laisse brut
summary: Compactez les résultats bruyants des outils exec et bash avec le Plugin optionnel Tokenjuice
title: Tokenjuice
x-i18n:
    generated_at: "2026-06-27T18:21:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 183ab08d2a1150b446245514423b893cff9a85581980c15600cc16aec10eeae7
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` est un plugin externe facultatif qui compacte les résultats bruyants des outils `exec` et `bash`
après l’exécution de la commande.

Il modifie le `tool_result` renvoyé, pas la commande elle-même. Tokenjuice ne
réécrit pas l’entrée shell, ne relance pas les commandes et ne modifie pas les codes de sortie.

Aujourd’hui, cela s’applique aux exécutions embarquées OpenClaw et aux outils dynamiques OpenClaw dans le harnais app-server Codex. Tokenjuice se branche au middleware de résultats d’outils d’OpenClaw et
réduit la sortie avant qu’elle ne retourne dans la session active du harnais.

## Activer le plugin

Installez-le une fois :

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

Puis activez-le :

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Équivalent :

```bash
openclaw plugins enable tokenjuice
```

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
- Garde l’exécution de la commande d’origine inchangée.
- Préserve les lectures exactes de contenu de fichier et les autres commandes que tokenjuice doit laisser brutes.
- Reste optionnel : désactivez le plugin si vous voulez une sortie textuelle exacte partout.

## Vérifier qu’il fonctionne

1. Activez le plugin.
2. Démarrez une session pouvant appeler `exec`.
3. Exécutez une commande bruyante comme `git status`.
4. Vérifiez que le résultat d’outil renvoyé est plus court et plus structuré que la sortie shell brute.

## Désactiver le plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Ou :

```bash
openclaw plugins disable tokenjuice
```

## Connexe

- [Outil Exec](/fr/tools/exec)
- [Niveaux de réflexion](/fr/tools/thinking)
- [Moteur de contexte](/fr/concepts/context-engine)
