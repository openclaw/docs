---
read_when:
    - Tester les flux d’onboarding ou de configuration avec un Plugin empaqueté localement
    - Vérifier un package de Plugin avant de le publier
    - Remplacer une installation automatique de Plugin par un artefact de test
sidebarTitle: Install overrides
summary: Tester les remplacements de Plugin empaquetés avec les flux d’installation au moment de la configuration
title: Remplacements d’installation de Plugin
x-i18n:
    generated_at: "2026-06-27T17:49:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ac3d8074f0455a3287c22447d134bebf57805bc06302652172eb5f87e47e548
    source_path: plugins/install-overrides.md
    workflow: 16
---

Les remplacements d’installation de Plugin permettent aux mainteneurs de tester les installations de Plugins au moment de la configuration avec un package npm spécifique ou une archive tarball locale produite par `npm pack`. Ils sont réservés à la validation E2E et des packages. Les utilisateurs normaux doivent installer les plugins avec
[`openclaw plugins install`](/fr/cli/plugins).

<Warning>
Les remplacements exécutent le code du Plugin depuis la source que vous fournissez. Utilisez-les uniquement dans un répertoire d’état isolé ou sur une machine de test jetable.
</Warning>

## Environnement

Les remplacements sont désactivés sauf si les deux variables sont définies :

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

La carte des remplacements est du JSON indexé par identifiant de plugin. Les valeurs prennent en charge :

- `npm:<registry-spec>` pour les packages de registre et les versions exactes ou les tags
- `npm-pack:<path.tgz>` pour les archives tarball locales produites par `npm pack`

Les chemins relatifs `npm-pack:` sont résolus depuis le répertoire de travail actuel.

## Comportement

Lorsqu’un flux au moment de la configuration demande d’installer un Plugin dont l’identifiant figure dans la carte, OpenClaw utilise la source de remplacement au lieu de la source npm du catalogue, intégrée ou par défaut. Cela s’applique à l’onboarding et aux autres flux qui utilisent l’installateur de Plugin partagé au moment de la configuration.

Les remplacements imposent toujours l’identifiant de Plugin attendu. Une archive tarball associée à `codex` doit installer un Plugin dont l’identifiant de manifeste est `codex`.

Les remplacements n’héritent pas du statut officiel de source de confiance. Même lorsque l’entrée du catalogue représente normalement un package détenu par OpenClaw, un remplacement est traité comme une entrée de test fournie par l’opérateur.

Les fichiers `.env` de l’espace de travail ne peuvent pas activer les remplacements d’installation. Définissez ces variables dans le shell de confiance, la tâche CI ou la commande de test distante qui lance OpenClaw.

## E2E de package

Utilisez un répertoire d’état isolé afin que les installations de packages et les enregistrements d’installation ne touchent pas votre état OpenClaw normal :

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Vérifiez le package installé sous le répertoire d’état :

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

Pour l’E2E de fournisseur en direct, sourcez la vraie clé API depuis un shell de confiance ou un secret CI avant de lancer la commande de test. N’imprimez pas les clés ; indiquez uniquement la source et si la clé était présente.
