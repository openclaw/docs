---
read_when:
    - Vous souhaitez installer un paquet compatible avec Codex, Claude ou Cursor
    - Vous devez comprendre comment OpenClaw fait correspondre le contenu du paquet à des fonctionnalités natives
    - Vous déboguez la détection de bundle ou des capacités manquantes
summary: Installer et utiliser les packs Codex, Claude et Cursor en tant que plugins OpenClaw
title: Ensembles de Plugins
x-i18n:
    generated_at: "2026-05-02T07:13:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b949ad70881714a30ab136261441687b439e39b516638ffa052efeab6b75bd4
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw peut installer des Plugins issus de trois écosystèmes externes : **Codex**, **Claude**,
et **Cursor**. Ils sont appelés **bundles** : des packs de contenu et de métadonnées que
OpenClaw mappe vers des fonctionnalités natives comme les Skills, les hooks et les outils MCP.

<Info>
  Les bundles ne sont **pas** identiques aux Plugins OpenClaw natifs. Les Plugins natifs s’exécutent
  dans le processus et peuvent enregistrer n’importe quelle capacité. Les bundles sont des packs de contenu avec
  un mappage sélectif des fonctionnalités et une frontière de confiance plus étroite.
</Info>

## Pourquoi les bundles existent

De nombreux Plugins utiles sont publiés au format Codex, Claude ou Cursor. Au lieu
d’exiger que les auteurs les réécrivent comme des Plugins OpenClaw natifs, OpenClaw
détecte ces formats et mappe leur contenu pris en charge vers l’ensemble de fonctionnalités
natif. Cela signifie que vous pouvez installer un pack de commandes Claude ou un bundle de Skills Codex
et l’utiliser immédiatement.

## Installer un bundle

<Steps>
  <Step title="Installer depuis un répertoire, une archive ou une marketplace">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Vérifier la détection">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Les bundles s’affichent comme `Format: bundle` avec un sous-type `codex`, `claude` ou `cursor`.

  </Step>

  <Step title="Redémarrer et utiliser">
    ```bash
    openclaw gateway restart
    ```

    Les fonctionnalités mappées (Skills, hooks, outils MCP, valeurs par défaut LSP) sont disponibles à la session suivante.

  </Step>
</Steps>

## Ce qu’OpenClaw mappe depuis les bundles

Toutes les fonctionnalités des bundles ne s’exécutent pas dans OpenClaw aujourd’hui. Voici ce qui fonctionne et ce qui
est détecté mais pas encore câblé.

### Pris en charge maintenant

| Fonctionnalité | Mappage                                                                                     | S’applique à   |
| -------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Contenu de Skill | Les racines de Skills du bundle se chargent comme des Skills OpenClaw normaux              | Tous les formats |
| Commandes      | `commands/` et `.cursor/commands/` sont traités comme des racines de Skills                 | Claude, Cursor |
| Packs de hooks | Structures OpenClaw de type `HOOK.md` + `handler.ts`                                       | Codex          |
| Outils MCP     | La configuration MCP du bundle est fusionnée dans les paramètres Pi intégrés ; les serveurs stdio et HTTP pris en charge sont chargés | Tous les formats |
| Serveurs LSP   | Le fichier Claude `.lsp.json` et les `lspServers` déclarés dans le manifeste sont fusionnés dans les valeurs par défaut LSP du Pi intégré | Claude         |
| Paramètres     | Le fichier Claude `settings.json` est importé comme paramètres Pi intégrés par défaut       | Claude         |

#### Contenu de Skill

- les racines de Skills du bundle se chargent comme des racines de Skills OpenClaw normales
- les racines Claude `commands` sont traitées comme des racines de Skills supplémentaires
- les racines Cursor `.cursor/commands` sont traitées comme des racines de Skills supplémentaires

Cela signifie que les fichiers de commandes Markdown Claude fonctionnent via le chargeur de Skills
OpenClaw normal. Les commandes Markdown Cursor fonctionnent par le même chemin.

#### Packs de hooks

- les racines de hooks de bundle fonctionnent **uniquement** lorsqu’elles utilisent la structure normale de pack de hooks
  OpenClaw. Aujourd’hui, il s’agit principalement du cas compatible avec Codex :
  - `HOOK.md`
  - `handler.ts` ou `handler.js`

#### MCP pour Pi

- les bundles activés peuvent contribuer une configuration de serveur MCP
- OpenClaw fusionne la configuration MCP du bundle dans les paramètres effectifs du Pi intégré comme
  `mcpServers`
- OpenClaw expose les outils MCP de bundle pris en charge pendant les tours d’agent Pi intégré en
  lançant des serveurs stdio ou en se connectant à des serveurs HTTP
- les profils d’outils `coding` et `messaging` incluent les outils MCP de bundle par
  défaut ; utilisez `tools.deny: ["bundle-mcp"]` pour les désactiver pour un agent ou un gateway
- les paramètres Pi locaux au projet s’appliquent toujours après les valeurs par défaut du bundle, afin que les paramètres
  de l’espace de travail puissent remplacer les entrées MCP de bundle si nécessaire
- les catalogues d’outils MCP de bundle sont triés de façon déterministe avant l’enregistrement, afin que
  les changements d’ordre `listTools()` en amont ne perturbent pas les blocs d’outils du cache d’invite

##### Transports

Les serveurs MCP peuvent utiliser le transport stdio ou HTTP :

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
- les valeurs de `headers` prennent en charge l’interpolation `${ENV_VAR}`
- une entrée de serveur avec à la fois `command` et `url` est rejetée
- les identifiants d’URL (userinfo et paramètres de requête) sont expurgés des descriptions
  d’outils et des journaux
- `connectionTimeoutMs` remplace le délai de connexion par défaut de 30 secondes pour
  les transports stdio et HTTP

##### Nommage des outils

OpenClaw enregistre les outils MCP de bundle avec des noms sûrs pour les fournisseurs au format
`serverName__toolName`. Par exemple, un serveur dont la clé est `"vigil-harbor"` exposant un outil
`memory_search` est enregistré sous `vigil-harbor__memory_search`.

- les caractères hors de `A-Za-z0-9_-` sont remplacés par `-`
- les préfixes de serveur sont limités à 30 caractères
- les noms complets d’outils sont limités à 64 caractères
- les noms de serveur vides se rabattent sur `mcp`
- les noms assainis en collision sont désambiguïsés avec des suffixes numériques
- l’ordre final des outils exposés est déterministe par nom sûr afin de garder les tours Pi répétés
  stables pour le cache
- le filtrage de profil traite tous les outils d’un serveur MCP de bundle comme appartenant au Plugin
  `bundle-mcp`, afin que les listes d’autorisation et de refus de profil puissent inclure soit
  les noms d’outils exposés individuellement, soit la clé de Plugin `bundle-mcp`

#### Paramètres Pi intégrés

- le fichier Claude `settings.json` est importé comme paramètres Pi intégrés par défaut lorsque le
  bundle est activé
- OpenClaw assainit les clés de substitution du shell avant de les appliquer

Clés assainies :

- `shellPath`
- `shellCommandPrefix`

#### LSP Pi intégré

- les bundles Claude activés peuvent contribuer une configuration de serveur LSP
- OpenClaw charge `.lsp.json` ainsi que les chemins `lspServers` déclarés dans le manifeste
- la configuration LSP du bundle est fusionnée dans les valeurs par défaut LSP effectives du Pi intégré
- seuls les serveurs LSP pris en charge et basés sur stdio sont exécutables aujourd’hui ; les transports
  non pris en charge apparaissent tout de même dans `openclaw plugins inspect <id>`

### Détecté mais non exécuté

Ces éléments sont reconnus et affichés dans les diagnostics, mais OpenClaw ne les exécute pas :

- Claude `agents`, l’automatisation `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- les métadonnées inline/app Codex au-delà du rapport de capacités

## Formats de bundle

<AccordionGroup>
  <Accordion title="Bundles Codex">
    Marqueurs : `.codex-plugin/plugin.json`

    Contenu facultatif : `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Les bundles Codex s’intègrent mieux à OpenClaw lorsqu’ils utilisent des racines de Skills et des répertoires
    de packs de hooks de style OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundles Claude">
    Deux modes de détection :

    - **Basé sur le manifeste :** `.claude-plugin/plugin.json`
    - **Sans manifeste :** structure Claude par défaut (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportement propre à Claude :

    - `commands/` est traité comme du contenu de Skills
    - `settings.json` est importé dans les paramètres Pi intégrés (les clés de substitution du shell sont assainies)
    - `.mcp.json` expose les outils stdio pris en charge au Pi intégré
    - `.lsp.json` ainsi que les chemins `lspServers` déclarés dans le manifeste sont chargés dans les valeurs par défaut LSP du Pi intégré
    - `hooks/hooks.json` est détecté mais non exécuté
    - les chemins de composants personnalisés dans le manifeste sont additifs (ils étendent les valeurs par défaut, ils ne les remplacent pas)

  </Accordion>

  <Accordion title="Bundles Cursor">
    Marqueurs : `.cursor-plugin/plugin.json`

    Contenu facultatif : `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` est traité comme du contenu de Skills
    - `.cursor/rules/`, `.cursor/agents/` et `.cursor/hooks.json` sont uniquement détectés

  </Accordion>
</AccordionGroup>

## Priorité de détection

OpenClaw vérifie d’abord le format de Plugin natif :

1. `openclaw.plugin.json` ou `package.json` valide avec `openclaw.extensions` — traité comme **Plugin natif**
2. Marqueurs de bundle (`.codex-plugin/`, `.claude-plugin/` ou structure Claude/Cursor par défaut) — traité comme **bundle**

Si un répertoire contient les deux, OpenClaw utilise le chemin natif. Cela évite
que les packages à double format soient partiellement installés comme bundles.

## Dépendances d’exécution et nettoyage

- Les bundles compatibles tiers ne bénéficient pas d’une réparation `npm install` au démarrage. Ils
  doivent être installés via `openclaw plugins install` et livrer tout ce dont
  ils ont besoin dans le répertoire du Plugin installé.
- Les Plugins groupés détenus par OpenClaw sont soit livrés en version légère dans le noyau, soit
  téléchargeables via l’installateur de Plugins. Le démarrage du Gateway n’exécute jamais de
  gestionnaire de packages pour eux.
- `openclaw doctor --fix` supprime les anciens répertoires de dépendances préparés et peut
  installer les Plugins téléchargeables configurés qui manquent dans l’index local
  des Plugins.

## Sécurité

Les bundles ont une frontière de confiance plus étroite que les Plugins natifs :

- OpenClaw ne charge **pas** de modules d’exécution arbitraires de bundle dans le processus
- Les chemins de Skills et de packs de hooks doivent rester à l’intérieur de la racine du Plugin (vérification de frontière)
- Les fichiers de paramètres sont lus avec les mêmes vérifications de frontière
- Les serveurs MCP stdio pris en charge peuvent être lancés comme sous-processus

Cela rend les bundles plus sûrs par défaut, mais vous devez tout de même considérer les bundles
tiers comme du contenu de confiance pour les fonctionnalités qu’ils exposent.

## Dépannage

<AccordionGroup>
  <Accordion title="Le bundle est détecté mais les capacités ne s’exécutent pas">
    Exécutez `openclaw plugins inspect <id>`. Si une capacité est listée mais marquée comme
    non câblée, il s’agit d’une limite du produit, pas d’une installation défectueuse.
  </Accordion>

  <Accordion title="Les fichiers de commandes Claude n’apparaissent pas">
    Assurez-vous que le bundle est activé et que les fichiers Markdown se trouvent dans une racine
    `commands/` ou `skills/` détectée.
  </Accordion>

  <Accordion title="Les paramètres Claude ne s’appliquent pas">
    Seuls les paramètres Pi intégrés issus de `settings.json` sont pris en charge. OpenClaw ne
    traite pas les paramètres de bundle comme des correctifs de configuration bruts.
  </Accordion>

  <Accordion title="Les hooks Claude ne s’exécutent pas">
    `hooks/hooks.json` est uniquement détecté. Si vous avez besoin de hooks exécutables, utilisez la
    structure de pack de hooks OpenClaw ou livrez un Plugin natif.
  </Accordion>
</AccordionGroup>

## Connexe

- [Installer et configurer les Plugins](/fr/tools/plugin)
- [Créer des Plugins](/fr/plugins/building-plugins) — créer un Plugin natif
- [Manifeste de Plugin](/fr/plugins/manifest) — schéma de manifeste natif
