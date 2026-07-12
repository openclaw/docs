---
read_when:
    - Analyse d’un plantage du chargeur tsx/esbuild mentionnant un helper __name manquant
summary: Plantage historique de Node + tsx « __name is not a function » et sa cause
title: Plantage de Node + tsx
x-i18n:
    generated_at: "2026-07-12T02:37:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97d2f62d24860cee65753027ba84c14c8d4ffb910ee17bb0032cf0409c427589
    source_path: debug/node-issue.md
    workflow: 16
---

# Plantage Node + tsx « \_\_name is not a function »

## État

Résolu. Ce plantage ne se reproduit pas avec la version actuelle de `tsx` épinglée dans
`package.json` (`4.22.3`), ni avec les versions actuelles de Node. Cette page est conservée au cas où une
future mise à niveau de `tsx`/esbuild le réintroduirait.

## Symptôme d’origine

L’exécution des scripts de développement d’OpenClaw via `tsx` échouait au démarrage avec :

```text
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (src/logging/subsystem.ts)
    at <caller> (src/agents/auth-profiles/constants.ts)
```

Les numéros de ligne sont omis ; les deux fichiers ont changé depuis le plantage d’origine
et les lignes concernées ne correspondent plus.

Ce problème est apparu après le passage des scripts de développement de Bun à `tsx` (`2871657e`,
2026-01-06), afin de rendre Bun facultatif. Le chemin équivalent basé sur Bun ne plantait pas.
Il a été observé initialement avec Node v25.3.0 sous macOS ; les autres plateformes exécutant
Node 25 étaient également considérées comme susceptibles d’être affectées.

## Cause

`tsx` transforme TS/ESM au moyen d’esbuild avec `keepNames: true` codé en dur dans
ses options de transformation. Ce paramètre conduit esbuild à encapsuler les déclarations de
fonctions/classes nommées dans un appel à une fonction auxiliaire `__name`, afin que `fn.name` soit préservé après la minification
et le regroupement. Le plantage signifie que la fonction auxiliaire était absente ou masquée au point d’appel
de ce module dans la combinaison de versions de `tsx`/Node concernée ; `__name(...)`
levait donc une exception au lieu de renvoyer la valeur encapsulée.

## Vérification actuelle de la reproduction

```bash
node --version
pnpm install
node --import tsx src/entry.ts status
```

Reproduction minimale isolée (charge uniquement le module figurant dans la trace de pile d’origine) :

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

Les deux commandes se terminent actuellement sans erreur. Si l’une d’elles lève à nouveau l’erreur `__name is not a
function`, relevez la version exacte de Node, la version de `tsx`
(`node_modules/tsx/package.json`) et la trace de pile complète avant de signaler le problème en amont.

## Solutions de contournement (si le plantage réapparaît)

- Exécutez les scripts de développement avec Bun au lieu de `node --import tsx`.
- Exécutez `pnpm tsgo` pour la vérification des types, puis exécutez la sortie compilée au lieu du
  code source via `tsx` :

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Essayez une autre version de `tsx` (`pnpm add -D tsx@<version>` constitue une modification de
  dépendance et nécessite une approbation conformément à la politique du dépôt) afin de déterminer par dichotomie si la version d’esbuild
  qu’elle intègre a réintroduit le bogue.
- Testez avec une autre version majeure/mineure de Node pour déterminer si l’échec est propre à une version.

## Références

- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Pages connexes

- [Installation de Node.js](/fr/install/node)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
