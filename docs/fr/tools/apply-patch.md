---
read_when:
    - Vous devez effectuer des modifications structurées de fichiers dans plusieurs fichiers
    - Vous souhaitez documenter ou déboguer des modifications basées sur des correctifs
summary: Appliquer des correctifs multifichiers avec l’outil apply_patch
title: outil apply_patch
x-i18n:
    generated_at: "2026-05-06T07:39:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ff2f8e6ecd55ff1bdc553619ab3d590d0967efe7a9a90a31946ad15fd89a1dc
    source_path: tools/apply-patch.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Appliquez des modifications de fichiers à l’aide d’un format de patch structuré. C’est idéal pour les modifications portant sur plusieurs fichiers
ou plusieurs hunks, où un seul appel `edit` serait fragile.

L’outil accepte une seule chaîne `input` qui enveloppe une ou plusieurs opérations sur des fichiers :

```
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## Paramètres

- `input` (obligatoire) : contenu complet du patch, y compris `*** Begin Patch` et `*** End Patch`.

## Notes

- Les chemins de patch prennent en charge les chemins relatifs (depuis le répertoire de l’espace de travail) et les chemins absolus.
- `tools.exec.applyPatch.workspaceOnly` vaut `true` par défaut (contenu dans l’espace de travail). Définissez-le sur `false` uniquement si vous souhaitez intentionnellement que `apply_patch` écrive/supprime en dehors du répertoire de l’espace de travail.
- Utilisez `*** Move to:` dans un hunk `*** Update File:` pour renommer des fichiers.
- `*** End of File` marque une insertion uniquement en fin de fichier lorsque nécessaire.
- Disponible par défaut pour les modèles OpenAI et OpenAI Codex. Définissez
  `tools.exec.applyPatch.enabled: false` pour le désactiver.
- Vous pouvez éventuellement restreindre l’accès par modèle via
  `tools.exec.applyPatch.allowModels`.
- La configuration se trouve uniquement sous `tools.exec`.

## Exemple

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Liens connexes

<CardGroup cols={2}>
  <Card title="Diffs" href="/fr/tools/diffs" icon="code-compare">
    Visionneuse de diff en lecture seule pour présenter les changements.
  </Card>
  <Card title="Outil exec" href="/fr/tools/exec" icon="terminal">
    Exécution de commandes shell depuis l’agent.
  </Card>
  <Card title="Exécution de code" href="/fr/tools/code-execution" icon="square-code">
    Analyse Python distante en bac à sable avec xAI.
  </Card>
</CardGroup>
