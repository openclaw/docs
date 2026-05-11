---
read_when:
    - Vous souhaitez installer un paquet compatible avec Codex, Claude ou Cursor
    - Vous devez comprendre comment OpenClaw associe le contenu du bundle à des fonctionnalités natives
    - Vous déboguez la détection des bundles ou des capacités manquantes
summary: Installer et utiliser les paquets Codex, Claude et Cursor en tant que Plugins OpenClaw
title: Ensembles de Plugins
x-i18n:
    generated_at: "2026-05-11T20:44:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f92bb91369f0f5ddd8d960962e875323bb53173b4faebe4ef453d2f2a08826
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw peut installer des plugins issus de trois écosystèmes externes : **Codex**, **Claude**
et **Cursor**. Ils sont appelés **bundles** : des packs de contenu et de métadonnées
qu’OpenClaw mappe vers des fonctionnalités natives comme les Skills, les hooks et les outils MCP.

<Info>
  Les bundles ne sont **pas** identiques aux plugins OpenClaw natifs. Les plugins natifs s’exécutent
  dans le processus et peuvent enregistrer n’importe quelle capacité. Les bundles sont des packs de contenu avec
  un mappage sélectif des fonctionnalités et une limite de confiance plus étroite.
</Info>

## Pourquoi les bundles existent

De nombreux plugins utiles sont publiés au format Codex, Claude ou Cursor. Au lieu
d’exiger des auteurs qu’ils les réécrivent en plugins OpenClaw natifs, OpenClaw
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

    Les bundles apparaissent comme `Format: bundle` avec un sous-type `codex`, `claude` ou `cursor`.

  </Step>

  <Step title="Redémarrer et utiliser">
    ```bash
    openclaw gateway restart
    ```

    Les fonctionnalités mappées (Skills, hooks, outils MCP, valeurs par défaut LSP) sont disponibles dans la session suivante.

  </Step>
</Steps>

## Ce qu’OpenClaw mappe depuis les bundles

Toutes les fonctionnalités des bundles ne s’exécutent pas dans OpenClaw aujourd’hui. Voici ce qui fonctionne et ce
qui est détecté mais pas encore raccordé.

### Pris en charge actuellement

| Fonctionnalité | Méthode de mappage                                                                         | S’applique à   |
| -------------- | ------------------------------------------------------------------------------------------ | -------------- |
| Contenu de Skills | Les racines de Skills du bundle se chargent comme des Skills OpenClaw normales           | Tous les formats |
| Commandes      | `commands/` et `.cursor/commands/` traités comme des racines de Skills                     | Claude, Cursor |
| Packs de hooks | Agencements OpenClaw `HOOK.md` + `handler.ts`                                              | Codex          |
| Outils MCP     | Configuration MCP du bundle fusionnée dans les paramètres Pi intégrés ; serveurs stdio et HTTP pris en charge chargés | Tous les formats |
| Serveurs LSP   | `.lsp.json` Claude et `lspServers` déclarés dans le manifeste fusionnés dans les valeurs par défaut LSP de Pi intégré | Claude         |
| Paramètres     | `settings.json` Claude importé comme valeurs par défaut Pi intégrées                       | Claude         |

#### Contenu de Skills

- les racines de Skills du bundle se chargent comme des racines de Skills OpenClaw normales
- les racines `commands` Claude sont traitées comme des racines de Skills supplémentaires
- les racines `.cursor/commands` Cursor sont traitées comme des racines de Skills supplémentaires

Cela signifie que les fichiers de commandes Markdown Claude fonctionnent via le chargeur de Skills OpenClaw normal.
Les commandes Markdown Cursor fonctionnent par le même chemin.

#### Packs de hooks

- les racines de hooks du bundle fonctionnent **uniquement** lorsqu’elles utilisent l’agencement normal des packs de hooks OpenClaw.
  Aujourd’hui, il s’agit principalement du cas compatible Codex :
  - `HOOK.md`
  - `handler.ts` ou `handler.js`

#### MCP pour Pi

- les bundles activés peuvent fournir une configuration de serveur MCP
- OpenClaw fusionne la configuration MCP du bundle dans les paramètres effectifs de Pi intégré sous
  `mcpServers`
- OpenClaw expose les outils MCP de bundle pris en charge pendant les tours de l’agent Pi intégré en
  lançant des serveurs stdio ou en se connectant à des serveurs HTTP
- les profils d’outils `coding` et `messaging` incluent les outils MCP de bundle par
  défaut ; utilisez `tools.deny: ["bundle-mcp"]` pour les désactiver pour un agent ou un Gateway
- les paramètres Pi locaux au projet s’appliquent toujours après les valeurs par défaut du bundle ; les paramètres
  de l’espace de travail peuvent donc remplacer les entrées MCP du bundle si nécessaire
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

- `transport` peut être défini sur `"streamable-http"` ou `"sse"` ; s’il est omis, OpenClaw utilise `sse`
- `type: "http"` est une forme aval native de la CLI ; utilisez `transport: "streamable-http"` dans la configuration OpenClaw. `openclaw mcp set` et `openclaw doctor --fix` normalisent l’alias courant.
- seuls les schémas d’URL `http:` et `https:` sont autorisés
- les valeurs de `headers` prennent en charge l’interpolation `${ENV_VAR}`
- une entrée de serveur comportant à la fois `command` et `url` est rejetée
- les identifiants d’URL (userinfo et paramètres de requête) sont expurgés des
  descriptions d’outils et des journaux
- `connectionTimeoutMs` remplace le délai de connexion par défaut de 30 secondes pour
  les transports stdio et HTTP

##### Nommage des outils

OpenClaw enregistre les outils MCP de bundle avec des noms compatibles avec les fournisseurs, sous la forme
`serverName__toolName`. Par exemple, un serveur avec la clé `"vigil-harbor"` exposant un outil
`memory_search` est enregistré sous `vigil-harbor__memory_search`.

- les caractères hors de `A-Za-z0-9_-` sont remplacés par `-`
- les fragments qui commenceraient par un caractère non alphabétique reçoivent un préfixe alphabétique, de sorte que les clés
  de serveur numériques comme `12306` deviennent des préfixes d’outils compatibles avec les fournisseurs
- les préfixes de serveur sont limités à 30 caractères
- les noms d’outils complets sont limités à 64 caractères
- les noms de serveur vides utilisent `mcp` comme valeur de repli
- les noms assainis en collision sont différenciés par des suffixes numériques
- l’ordre final des outils exposés est déterministe par nom compatible afin que les tours Pi
  répétés restent stables pour le cache
- le filtrage par profil traite tous les outils d’un même serveur MCP de bundle comme appartenant au plugin
  `bundle-mcp`, de sorte que les listes d’autorisation et de refus de profil peuvent inclure soit
  des noms d’outils exposés individuels, soit la clé de plugin `bundle-mcp`

#### Paramètres Pi intégrés

- `settings.json` Claude est importé comme paramètres Pi intégrés par défaut lorsque le
  bundle est activé
- OpenClaw assainit les clés de remplacement du shell avant de les appliquer

Clés assainies :

- `shellPath`
- `shellCommandPrefix`

#### LSP Pi intégré

- les bundles Claude activés peuvent fournir une configuration de serveur LSP
- OpenClaw charge `.lsp.json` ainsi que tout chemin `lspServers` déclaré dans le manifeste
- la configuration LSP du bundle est fusionnée dans les valeurs par défaut LSP effectives de Pi intégré
- seuls les serveurs LSP pris en charge reposant sur stdio sont exécutables aujourd’hui ; les transports non pris en charge
  apparaissent tout de même dans `openclaw plugins inspect <id>`

### Détecté mais non exécuté

Ces éléments sont reconnus et affichés dans les diagnostics, mais OpenClaw ne les exécute pas :

- `agents`, automatisation `hooks.json`, `outputStyles` Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` Cursor
- métadonnées inline/app Codex au-delà du rapport de capacités

## Formats de bundles

<AccordionGroup>
  <Accordion title="Bundles Codex">
    Marqueurs : `.codex-plugin/plugin.json`

    Contenu facultatif : `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Les bundles Codex s’intègrent le mieux à OpenClaw lorsqu’ils utilisent des racines de Skills et des répertoires
    de packs de hooks au style OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundles Claude">
    Deux modes de détection :

    - **Basé sur un manifeste :** `.claude-plugin/plugin.json`
    - **Sans manifeste :** agencement Claude par défaut (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportement propre à Claude :

    - `commands/` est traité comme du contenu de Skills
    - `settings.json` est importé dans les paramètres Pi intégrés (les clés de remplacement du shell sont assainies)
    - `.mcp.json` expose les outils stdio pris en charge à Pi intégré
    - `.lsp.json` ainsi que les chemins `lspServers` déclarés dans le manifeste sont chargés dans les valeurs par défaut LSP de Pi intégré
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

OpenClaw vérifie d’abord le format de plugin natif :

1. `openclaw.plugin.json` ou `package.json` valide avec `openclaw.extensions` — traité comme **plugin natif**
2. Marqueurs de bundle (`.codex-plugin/`, `.claude-plugin/` ou agencement Claude/Cursor par défaut) — traités comme **bundle**

Si un répertoire contient les deux, OpenClaw utilise le chemin natif. Cela évite que les packages
à double format soient partiellement installés comme bundles.

## Dépendances d’exécution et nettoyage

- Les bundles compatibles tiers ne bénéficient pas d’une réparation `npm install` au démarrage. Ils
  doivent être installés via `openclaw plugins install` et fournir tout ce dont
  ils ont besoin dans le répertoire du plugin installé.
- Les plugins groupés appartenant à OpenClaw sont soit livrés de façon légère dans le cœur, soit
  téléchargeables via l’installateur de plugins. Le démarrage du Gateway n’exécute jamais de
  gestionnaire de packages pour eux.
- `openclaw doctor --fix` supprime les anciens répertoires de dépendances préparés et peut
  récupérer les plugins téléchargeables absents de l’index local des plugins lorsque
  la configuration les référence.

## Sécurité

Les bundles ont une limite de confiance plus étroite que les plugins natifs :

- OpenClaw ne charge **pas** de modules d’exécution arbitraires de bundle dans le processus
- les chemins des Skills et des packs de hooks doivent rester dans la racine du plugin (vérification de limite)
- les fichiers de paramètres sont lus avec les mêmes vérifications de limite
- les serveurs MCP stdio pris en charge peuvent être lancés comme sous-processus

Cela rend les bundles plus sûrs par défaut, mais vous devez tout de même traiter les bundles tiers
comme du contenu de confiance pour les fonctionnalités qu’ils exposent.

## Dépannage

<AccordionGroup>
  <Accordion title="Le bundle est détecté, mais les capacités ne s’exécutent pas">
    Exécutez `openclaw plugins inspect <id>`. Si une capacité est listée mais marquée comme
    non raccordée, c’est une limite du produit — pas une installation cassée.
  </Accordion>

  <Accordion title="Les fichiers de commandes Claude n’apparaissent pas">
    Assurez-vous que le bundle est activé et que les fichiers Markdown se trouvent dans une racine
    `commands/` ou `skills/` détectée.
  </Accordion>

  <Accordion title="Les paramètres Claude ne s’appliquent pas">
    Seuls les paramètres Pi intégrés provenant de `settings.json` sont pris en charge. OpenClaw ne
    traite pas les paramètres de bundle comme des correctifs de configuration bruts.
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
