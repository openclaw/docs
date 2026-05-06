---
read_when:
    - Débogage des scripts de développement propres à Node ou des échecs du mode de surveillance
    - Investigation des plantages du chargeur tsx/esbuild dans OpenClaw
summary: Notes et solutions de contournement pour le plantage Node + tsx "__name is not a function"
title: Plantage de Node + tsx
x-i18n:
    generated_at: "2026-05-06T17:54:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 808f04959c70c96c983fb2517234d4c06712049d7afebb9b1b4b340df75d7d70
    source_path: debug/node-issue.md
    workflow: 16
---

# Crash Node + tsx « \_\_name is not a function »

## Résumé

Exécuter OpenClaw via Node avec `tsx` échoue au démarrage avec :

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Cela a commencé après le passage des scripts de développement de Bun à `tsx` (commit `2871657e`, 2026-01-06). Le même chemin d’exécution fonctionnait avec Bun.

## Environnement

- Node : v25.x (observé sur v25.3.0)
- tsx : 4.21.0
- OS : macOS (reproduction probablement aussi sur d’autres plateformes qui exécutent Node 25)

## Reproduction (Node uniquement)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Reproduction minimale dans le dépôt

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Vérification de version Node

- Node 25.3.0 : échoue
- Node 22.22.0 (Homebrew `node@22`) : échoue
- Node 24 : pas encore installé ici ; vérification nécessaire

## Notes / hypothèse

- `tsx` utilise esbuild pour transformer TS/ESM. Le `keepNames` d’esbuild émet un helper `__name` et encapsule les définitions de fonctions avec `__name(...)`.
- Le crash indique que `__name` existe mais n’est pas une fonction à l’exécution, ce qui implique que le helper est manquant ou écrasé pour ce module dans le chemin du chargeur Node 25.
- Des problèmes similaires liés au helper `__name` ont été signalés dans d’autres consommateurs d’esbuild lorsque le helper est manquant ou réécrit.

## Historique de régression

- `2871657e` (2026-01-06) : les scripts sont passés de Bun à tsx pour rendre Bun optionnel.
- Avant cela (chemin Bun), `openclaw status` et `gateway:watch` fonctionnaient.

## Contournements

- Utiliser Bun pour les scripts de développement (retour temporaire actuel).
- Utiliser `tsgo` pour la vérification de types du dépôt, puis exécuter la sortie construite :

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Note historique : `tsc` a été utilisé ici pendant le débogage de ce problème Node/tsx, mais les voies de vérification de types du dépôt utilisent maintenant `tsgo`.
- Désactiver le keepNames d’esbuild dans le chargeur TS si possible (empêche l’insertion du helper `__name`) ; tsx ne l’expose pas actuellement.
- Tester Node LTS (22/24) avec `tsx` pour voir si le problème est spécifique à Node 25.

## Références

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Étapes suivantes

- Reproduire sur Node 22/24 pour confirmer la régression Node 25.
- Tester la nightly de `tsx` ou épingler une version antérieure s’il existe une régression connue.
- Si la reproduction se produit sur Node LTS, ouvrir une reproduction minimale en amont avec la trace de pile `__name`.

## Lié

- [Installation de Node.js](/fr/install/node)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
