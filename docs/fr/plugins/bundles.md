---
read_when:
    - Vous souhaitez installer un paquet compatible avec Codex, Claude ou Cursor
    - Vous devez comprendre comment OpenClaw associe le contenu du paquet à des fonctionnalités natives
    - Vous déboguez la détection des bundles ou des capacités manquantes
summary: Installer et utiliser les bundles Codex, Claude et Cursor comme Plugins OpenClaw
title: Ensembles de Plugin
x-i18n:
    generated_at: "2026-04-30T07:37:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d03643c3029f5c6c81fab3aa1c00accba94da64a834e381b29db8f405d6bdee
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw peut installer des plugins issus de trois écosystèmes externes : **Codex**, **Claude**,
et **Cursor**. On les appelle des **lots** — des packs de contenu et de métadonnées
qu’OpenClaw associe à des fonctionnalités natives comme les Skills, les hooks et les outils MCP.

<Info>
  Les lots ne sont **pas** identiques aux plugins OpenClaw natifs. Les plugins natifs s’exécutent
  dans le processus et peuvent enregistrer n’importe quelle capacité. Les lots sont des packs de contenu avec
  une correspondance sélective des fonctionnalités et une frontière de confiance plus étroite.
</Info>

## Pourquoi les lots existent

De nombreux plugins utiles sont publiés au format Codex, Claude ou Cursor. Au lieu
d’obliger les auteurs à les réécrire comme plugins OpenClaw natifs, OpenClaw
détecte ces formats et associe leur contenu pris en charge au jeu de fonctionnalités
natif. Cela signifie que vous pouvez installer un pack de commandes Claude ou un lot de Skills Codex
et l’utiliser immédiatement.

## Installer un lot

<Steps>
  <Step title="Installer depuis un répertoire, une archive ou une place de marché">
    ```bash
    # Répertoire local
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Place de marché Claude
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Vérifier la détection">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Les lots apparaissent comme `Format: bundle` avec un sous-type `codex`, `claude` ou `cursor`.

  </Step>

  <Step title="Redémarrer et utiliser">
    ```bash
    openclaw gateway restart
    ```

    Les fonctionnalités associées (Skills, hooks, outils MCP, valeurs par défaut LSP) sont disponibles dans la session suivante.

  </Step>
</Steps>

## Ce qu’OpenClaw mappe depuis les lots

Toutes les fonctionnalités de lots ne s’exécutent pas dans OpenClaw aujourd’hui. Voici ce qui fonctionne et ce qui
est détecté mais pas encore câblé.

### Pris en charge actuellement

| Fonctionnalité | Correspondance                                                                             | S’applique à   |
| -------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Contenu Skill  | Les racines de Skills du lot se chargent comme des Skills OpenClaw normaux                  | Tous les formats |
| Commandes      | `commands/` et `.cursor/commands/` sont traités comme des racines de Skills                 | Claude, Cursor |
| Packs de hooks | Agencements OpenClaw de type `HOOK.md` + `handler.ts`                                       | Codex          |
| Outils MCP     | La config MCP du lot est fusionnée dans les paramètres Pi intégrés ; serveurs stdio et HTTP pris en charge chargés | Tous les formats |
| Serveurs LSP   | `.lsp.json` Claude et `lspServers` déclarés dans le manifeste fusionnés dans les valeurs par défaut LSP du Pi intégré | Claude         |
| Paramètres     | `settings.json` Claude importé comme valeurs par défaut du Pi intégré                       | Claude         |

#### Contenu Skill

- les racines de Skills du lot se chargent comme des racines de Skills OpenClaw normales
- les racines `commands` Claude sont traitées comme des racines de Skills supplémentaires
- les racines `.cursor/commands` Cursor sont traitées comme des racines de Skills supplémentaires

Cela signifie que les fichiers de commandes Markdown Claude fonctionnent via le chargeur de Skills
OpenClaw normal. Le Markdown de commandes Cursor fonctionne par le même chemin.

#### Packs de hooks

- les racines de hooks du lot fonctionnent **uniquement** lorsqu’elles utilisent l’agencement normal des packs de hooks
  OpenClaw. Aujourd’hui, il s’agit principalement du cas compatible Codex :
  - `HOOK.md`
  - `handler.ts` ou `handler.js`

#### MCP pour Pi

- les lots activés peuvent fournir une configuration de serveur MCP
- OpenClaw fusionne la configuration MCP du lot dans les paramètres effectifs du Pi intégré sous
  `mcpServers`
- OpenClaw expose les outils MCP de lots pris en charge pendant les tours de l’agent Pi intégré en
  lançant des serveurs stdio ou en se connectant à des serveurs HTTP
- les profils d’outils `coding` et `messaging` incluent les outils MCP de lots par
  défaut ; utilisez `tools.deny: ["bundle-mcp"]` pour vous en désinscrire pour un agent ou un Gateway
- les paramètres Pi locaux au projet s’appliquent toujours après les valeurs par défaut du lot, afin que les paramètres
  de l’espace de travail puissent remplacer les entrées MCP du lot si nécessaire
- les catalogues d’outils MCP de lots sont triés de manière déterministe avant l’enregistrement, afin que
  les changements d’ordre `listTools()` en amont ne perturbent pas les blocs d’outils du cache de prompts

##### Transports

Les serveurs MCP peuvent utiliser un transport stdio ou HTTP :

**Stdio** lance un processus enfant :

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** se connecte à un serveur MCP en cours d’exécution via `sse` par défaut, ou `streamable-http` lorsque demandé :

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` peut être défini sur `"streamable-http"` ou `"sse"` ; lorsqu’il est omis, OpenClaw utilise `sse`
- `type: "http"` est une forme aval native de la CLI ; utilisez `transport: "streamable-http"` dans la configuration OpenClaw. `openclaw mcp set` et `openclaw doctor --fix` normalisent l’alias courant.
- seuls les schémas d’URL `http:` et `https:` sont autorisés
- les valeurs `headers` prennent en charge l’interpolation `${ENV_VAR}`
- une entrée de serveur contenant à la fois `command` et `url` est rejetée
- les identifiants d’URL (userinfo et paramètres de requête) sont expurgés des
  descriptions d’outils et des journaux
- `connectionTimeoutMs` remplace le délai de connexion par défaut de 30 secondes pour
  les transports stdio et HTTP

##### Nommage des outils

OpenClaw enregistre les outils MCP de lots avec des noms sûrs pour les fournisseurs sous la forme
`serverName__toolName`. Par exemple, un serveur avec la clé `"vigil-harbor"` exposant un outil
`memory_search` est enregistré comme `vigil-harbor__memory_search`.

- les caractères hors de `A-Za-z0-9_-` sont remplacés par `-`
- les préfixes de serveur sont limités à 30 caractères
- les noms d’outils complets sont limités à 64 caractères
- les noms de serveurs vides se replient sur `mcp`
- les noms nettoyés en collision sont distingués avec des suffixes numériques
- l’ordre final des outils exposés est déterministe par nom sûr afin de conserver les tours Pi
  répétés stables pour le cache
- le filtrage de profils traite tous les outils d’un même serveur MCP de lot comme appartenant au plugin
  `bundle-mcp`, afin que les listes d’autorisation et de refus de profils puissent inclure soit
  des noms d’outils exposés individuels, soit la clé de plugin `bundle-mcp`

#### Paramètres du Pi intégré

- `settings.json` Claude est importé comme paramètres Pi intégrés par défaut lorsque le
  lot est activé
- OpenClaw nettoie les clés de remplacement de shell avant de les appliquer

Clés nettoyées :

- `shellPath`
- `shellCommandPrefix`

#### LSP du Pi intégré

- les lots Claude activés peuvent fournir une configuration de serveur LSP
- OpenClaw charge `.lsp.json` ainsi que tous les chemins `lspServers` déclarés dans le manifeste
- la configuration LSP du lot est fusionnée dans les valeurs par défaut LSP effectives du Pi intégré
- seuls les serveurs LSP pris en charge et adossés à stdio sont exécutables aujourd’hui ; les transports
  non pris en charge apparaissent tout de même dans `openclaw plugins inspect <id>`

### Détecté mais non exécuté

Ces éléments sont reconnus et affichés dans les diagnostics, mais OpenClaw ne les exécute pas :

- `agents`, automatisation `hooks.json`, `outputStyles` Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` Cursor
- métadonnées inline/app Codex au-delà du signalement des capacités

## Formats de lots

<AccordionGroup>
  <Accordion title="Lots Codex">
    Marqueurs : `.codex-plugin/plugin.json`

    Contenu facultatif : `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Les lots Codex s’intègrent le mieux à OpenClaw lorsqu’ils utilisent des racines de Skills et des répertoires
    de packs de hooks au style OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Lots Claude">
    Deux modes de détection :

    - **Avec manifeste :** `.claude-plugin/plugin.json`
    - **Sans manifeste :** agencement Claude par défaut (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportement propre à Claude :

    - `commands/` est traité comme du contenu Skill
    - `settings.json` est importé dans les paramètres du Pi intégré (les clés de remplacement de shell sont nettoyées)
    - `.mcp.json` expose les outils stdio pris en charge au Pi intégré
    - `.lsp.json` ainsi que les chemins `lspServers` déclarés dans le manifeste sont chargés dans les valeurs par défaut LSP du Pi intégré
    - `hooks/hooks.json` est détecté mais non exécuté
    - Les chemins de composants personnalisés dans le manifeste sont additifs (ils étendent les valeurs par défaut, sans les remplacer)

  </Accordion>

  <Accordion title="Lots Cursor">
    Marqueurs : `.cursor-plugin/plugin.json`

    Contenu facultatif : `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` est traité comme du contenu Skill
    - `.cursor/rules/`, `.cursor/agents/` et `.cursor/hooks.json` sont uniquement détectés

  </Accordion>
</AccordionGroup>

## Priorité de détection

OpenClaw vérifie d’abord le format de plugin natif :

1. `openclaw.plugin.json` ou `package.json` valide avec `openclaw.extensions` — traité comme **plugin natif**
2. Marqueurs de lots (`.codex-plugin/`, `.claude-plugin/`, ou agencement Claude/Cursor par défaut) — traités comme **lot**

Si un répertoire contient les deux, OpenClaw utilise le chemin natif. Cela empêche
les packages à double format d’être installés partiellement comme lots.

## Dépendances d’exécution et nettoyage

- Les lots compatibles tiers ne bénéficient pas d’une réparation `npm install` au démarrage. Ils
  doivent être installés via `openclaw plugins install` et livrer tout ce dont
  ils ont besoin dans le répertoire du plugin installé.
- Les plugins groupés packagés appartenant à OpenClaw ont une exception étroite : lorsqu’un tel plugin est
  activé, le démarrage du Gateway peut réparer les dépendances d’exécution déclarées manquantes
  avant l’importation. Les opérateurs peuvent inspecter ou réparer cette étape avec
  `openclaw plugins deps`.
- Le pipeline de publication reste responsable de livrer une charge utile de dépendances groupées complète
  lorsque c’est possible (voir la règle de vérification post-publication dans
  [Publication](/fr/reference/RELEASING)).

## Sécurité

Les lots ont une frontière de confiance plus étroite que les plugins natifs :

- OpenClaw ne charge **pas** de modules d’exécution arbitraires du lot dans le processus
- Les chemins de Skills et de packs de hooks doivent rester à l’intérieur de la racine du plugin (vérification de frontière)
- Les fichiers de paramètres sont lus avec les mêmes vérifications de frontière
- Les serveurs MCP stdio pris en charge peuvent être lancés comme sous-processus

Cela rend les lots plus sûrs par défaut, mais vous devez tout de même traiter les lots
tiers comme du contenu de confiance pour les fonctionnalités qu’ils exposent.

## Dépannage

<AccordionGroup>
  <Accordion title="Le lot est détecté, mais les capacités ne s’exécutent pas">
    Exécutez `openclaw plugins inspect <id>`. Si une capacité est listée mais marquée comme
    non câblée, il s’agit d’une limite du produit — pas d’une installation défectueuse.
  </Accordion>

  <Accordion title="Les fichiers de commandes Claude n’apparaissent pas">
    Assurez-vous que le lot est activé et que les fichiers Markdown se trouvent dans une racine
    `commands/` ou `skills/` détectée.
  </Accordion>

  <Accordion title="Les paramètres Claude ne s’appliquent pas">
    Seuls les paramètres du Pi intégré provenant de `settings.json` sont pris en charge. OpenClaw ne
    traite pas les paramètres de lots comme des correctifs de configuration bruts.
  </Accordion>

  <Accordion title="Les hooks Claude ne s’exécutent pas">
    `hooks/hooks.json` est uniquement détecté. Si vous avez besoin de hooks exécutables, utilisez
    l’agencement de pack de hooks OpenClaw ou livrez un plugin natif.
  </Accordion>
</AccordionGroup>

## Connexe

- [Installer et configurer les plugins](/fr/tools/plugin)
- [Créer des plugins](/fr/plugins/building-plugins) — créer un plugin natif
- [Manifeste de plugin](/fr/plugins/manifest) — schéma de manifeste natif
