---
read_when:
    - Vous devez effectuer des modifications structurées dans plusieurs fichiers
    - Vous souhaitez documenter ou déboguer des modifications basées sur des correctifs
summary: Appliquez des correctifs à plusieurs fichiers avec l’outil apply_patch
title: outil apply_patch
x-i18n:
    generated_at: "2026-07-12T15:56:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

Appliquez les modifications de fichiers à l’aide d’un format de correctif structuré. Cette méthode est idéale pour les modifications portant sur plusieurs fichiers
ou plusieurs blocs, lorsqu’un seul appel à `edit` serait fragile.

L’outil accepte une seule chaîne `input` qui encapsule une ou plusieurs opérations sur des fichiers :

```text
*** Begin Patch
*** Add File: path/to/file.txt
+ligne 1
+ligne 2
*** Update File: src/app.ts
@@ contexte de modification facultatif
-ancienne ligne
+nouvelle ligne
*** Delete File: obsolete.txt
*** End Patch
```

## Paramètres

- `input` (obligatoire) : contenu complet du correctif, y compris `*** Begin Patch` et `*** End Patch`.

## Remarques

- Les chemins du correctif prennent en charge les chemins relatifs (depuis le répertoire de l’espace de travail) et les chemins absolus.
- `tools.exec.applyPatch.workspaceOnly` vaut `true` par défaut (limité à l’espace de travail). Définissez-le sur `false` uniquement si vous souhaitez intentionnellement que `apply_patch` écrive ou supprime des éléments en dehors du répertoire de l’espace de travail.
- Utilisez `*** Move to:` dans un bloc `*** Update File:` pour renommer des fichiers.
- `*** End of File` marque, si nécessaire, une insertion uniquement en fin de fichier.
- Activé par défaut pour chaque modèle. Définissez `tools.exec.applyPatch.enabled: false`
  pour le désactiver, ou limitez-le à des modèles spécifiques avec
  `tools.exec.applyPatch.allowModels` (accepte les identifiants bruts comme `gpt-5.4` ou les identifiants complets
  comme `openai/gpt-5.4`).
- La configuration se trouve sous `tools.exec.applyPatch.*`.

## Exemple

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Éléments associés

<CardGroup cols={2}>
  <Card title="Différences" href="/fr/tools/diffs" icon="code-compare">
    Visionneuse de différences en lecture seule pour présenter les modifications.
  </Card>
  <Card title="Outil Exec" href="/fr/tools/exec" icon="terminal">
    Exécution de commandes d’interpréteur depuis l’agent.
  </Card>
  <Card title="Exécution de code" href="/fr/tools/code-execution" icon="square-code">
    Analyse Python distante en environnement isolé avec xAI.
  </Card>
</CardGroup>
