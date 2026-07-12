---
read_when:
    - Tester les parcours d’intégration ou de configuration avec un plugin empaqueté localement
    - Vérification d’un paquet de Plugin avant sa publication
    - Remplacement de l’installation automatique d’un Plugin par un artefact de test
sidebarTitle: Install overrides
summary: Tester les remplacements de Plugins empaquetés avec les flux d’installation lors de la configuration
title: Remplacements prioritaires d’installation des Plugins
x-i18n:
    generated_at: "2026-07-12T15:43:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: adc823f49ea9f8fa86e6a89933e43fdc309d808ac24397770495dbe81cb4b0d7
    source_path: plugins/install-overrides.md
    workflow: 16
---

Les substitutions d’installation de Plugin permettent aux responsables d’indiquer aux installations de plugins effectuées lors de la configuration un paquet npm spécifique ou une archive npm locale au format tarball, plutôt que la source du catalogue, intégrée ou npm par défaut. Elles sont réservées aux tests E2E et à la validation des paquets ; les utilisateurs ordinaires installent les plugins avec
[`openclaw plugins install`](/fr/cli/plugins).

<Warning>
Les substitutions exécutent le code du Plugin provenant de la source que vous fournissez. Utilisez-les uniquement dans un répertoire d’état isolé ou sur une machine de test jetable.
</Warning>

## Environnement

Les substitutions sont désactivées sauf si les deux variables sont définies :

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

La table de substitutions est un objet JSON indexé par identifiant de Plugin. Les valeurs prennent en charge :

| Préfixe               | Source                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `npm:<registry-spec>` | Paquets du registre, versions exactes ou étiquettes                                                                 |
| `npm-pack:<path.tgz>` | Archives tarball locales produites par `npm pack` ; les chemins relatifs sont résolus depuis le répertoire de travail actuel |

## Comportement

Lorsqu’un flux de configuration installe un Plugin dont l’identifiant figure dans la table, OpenClaw utilise la source de substitution au lieu de la source du catalogue, intégrée ou npm par défaut. Cela s’applique à l’intégration initiale et à tout autre flux utilisant le programme d’installation partagé des plugins lors de la configuration.

- Les substitutions imposent toujours l’identifiant de Plugin attendu : une archive tarball associée à `codex` doit installer un Plugin dont l’identifiant de manifeste est `codex`.
- Les substitutions n’héritent pas du statut de source officielle approuvée. Même lorsque l’entrée du catalogue représente normalement un paquet appartenant à OpenClaw, une substitution est traitée comme une donnée de test fournie par l’opérateur.
- Les fichiers `.env` de l’espace de travail ne peuvent pas activer les substitutions d’installation ; les deux variables d’environnement figurent dans la liste des variables dotenv d’espace de travail bloquées. Définissez-les dans le shell de confiance, la tâche CI ou la commande de test distante qui lance OpenClaw.

## Tests E2E des paquets

Utilisez un répertoire d’état isolé afin que les installations de paquets et les enregistrements d’installation ne modifient pas votre état OpenClaw habituel :

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Vérifiez le paquet installé dans le répertoire d’état :

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

Pour les tests E2E d’un fournisseur réel, chargez la véritable clé d’API depuis un shell de confiance ou un secret CI avant de lancer la commande de test. N’affichez pas les clés ; indiquez uniquement la source et si la clé était présente.
