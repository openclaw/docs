---
read_when:
    - Vous souhaitez installer un ensemble compatible avec Codex, Claude ou Cursor
    - Vous devez comprendre comment OpenClaw fait correspondre le contenu des bundles à des fonctionnalités natives
    - Vous déboguez la détection des bundles ou des capacités manquantes
summary: Installer et utiliser les bundles Codex, Claude et Cursor comme Plugins OpenClaw
title: Paquets de Plugin
x-i18n:
    generated_at: "2026-05-05T01:48:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bc06300e765e2faaf51800462003e242d29d4102ac9feaa47f86d4ad35bf157
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw peut installer des plugins depuis trois écosystèmes externes : **Codex**, **Claude**
et **Cursor**. Ceux-ci sont appelés **paquets** — des packs de contenu et de métadonnées
qu’OpenClaw mappe vers des fonctionnalités natives comme les Skills, les hooks et les outils MCP.

<Info>
  Les paquets ne sont **pas** identiques aux plugins OpenClaw natifs. Les plugins natifs s’exécutent
  dans le processus et peuvent enregistrer n’importe quelle capacité. Les paquets sont des packs de contenu avec
  un mappage sélectif des fonctionnalités et une frontière de confiance plus étroite.
</Info>

## Pourquoi les paquets existent

De nombreux plugins utiles sont publiés au format Codex, Claude ou Cursor. Au lieu
d’obliger les auteurs à les réécrire comme plugins OpenClaw natifs, OpenClaw
détecte ces formats et mappe leur contenu pris en charge vers l’ensemble de fonctionnalités
natives. Cela signifie que vous pouvez installer un pack de commandes Claude ou un paquet de Skills Codex
et l’utiliser immédiatement.

## Installer un paquet

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

    Les paquets apparaissent comme `Format: bundle` avec un sous-type `codex`, `claude` ou `cursor`.

  </Step>

  <Step title="Redémarrer et utiliser">
    ```bash
    openclaw gateway restart
    ```

    Les fonctionnalités mappées (Skills, hooks, outils MCP, valeurs par défaut LSP) sont disponibles dans la session suivante.

  </Step>
</Steps>

## Ce qu’OpenClaw mappe depuis les paquets

Toutes les fonctionnalités des paquets ne s’exécutent pas encore dans OpenClaw aujourd’hui. Voici ce qui fonctionne et ce
qui est détecté, mais pas encore câblé.

### Pris en charge maintenant

| Fonctionnalité       | Mode de mappage                                                                                 | S’applique à     |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Contenu de Skill | Les racines de Skills de paquets sont chargées comme des Skills OpenClaw normales                                           | Tous les formats    |
| Commandes      | `commands/` et `.cursor/commands/` traités comme des racines de Skills                                  | Claude, Cursor |
| Packs de hooks    | Agencements `HOOK.md` + `handler.ts` de style OpenClaw                                             | Codex          |
| Outils MCP     | La configuration MCP du paquet est fusionnée dans les paramètres Pi intégrés ; les serveurs stdio et HTTP pris en charge sont chargés | Tous les formats    |
| Serveurs LSP   | `.lsp.json` de Claude et les `lspServers` déclarés dans le manifeste sont fusionnés dans les valeurs par défaut LSP de Pi intégré  | Claude         |
| Paramètres      | `settings.json` de Claude importé comme valeurs par défaut de Pi intégré                                     | Claude         |

#### Contenu de Skill

- les racines de Skills de paquets sont chargées comme des racines de Skills OpenClaw normales
- les racines `commands` de Claude sont traitées comme des racines de Skills supplémentaires
- les racines `.cursor/commands` de Cursor sont traitées comme des racines de Skills supplémentaires

Cela signifie que les fichiers de commandes Markdown Claude fonctionnent via le chargeur de Skills OpenClaw
normal. Le Markdown des commandes Cursor fonctionne par le même chemin.

#### Packs de hooks

- les racines de hooks de paquets fonctionnent **uniquement** lorsqu’elles utilisent l’agencement normal des packs de hooks
  OpenClaw. Aujourd’hui, il s’agit principalement du cas compatible Codex :
  - `HOOK.md`
  - `handler.ts` ou `handler.js`

#### MCP pour Pi

- les paquets activés peuvent contribuer une configuration de serveur MCP
- OpenClaw fusionne la configuration MCP du paquet dans les paramètres Pi intégrés effectifs sous
  `mcpServers`
- OpenClaw expose les outils MCP de paquet pris en charge pendant les tours d’agent Pi intégré en
  lançant des serveurs stdio ou en se connectant à des serveurs HTTP
- les profils d’outils `coding` et `messaging` incluent les outils MCP de paquet par
  défaut ; utilisez `tools.deny: ["bundle-mcp"]` pour vous désinscrire pour un agent ou un gateway
- les paramètres Pi locaux au projet s’appliquent toujours après les valeurs par défaut du paquet, afin que les paramètres
  de l’espace de travail puissent remplacer les entrées MCP du paquet si nécessaire
- les catalogues d’outils MCP de paquets sont triés de façon déterministe avant l’enregistrement, afin que
  les changements d’ordre `listTools()` en amont ne fassent pas fluctuer les blocs d’outils du cache de prompts

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
- `type: "http"` est une forme descendante native de la CLI ; utilisez `transport: "streamable-http"` dans la configuration OpenClaw. `openclaw mcp set` et `openclaw doctor --fix` normalisent l’alias courant.
- seuls les schémas d’URL `http:` et `https:` sont autorisés
- les valeurs de `headers` prennent en charge l’interpolation `${ENV_VAR}`
- une entrée de serveur avec à la fois `command` et `url` est rejetée
- les identifiants d’URL (userinfo et paramètres de requête) sont expurgés des
  descriptions d’outils et des journaux
- `connectionTimeoutMs` remplace le délai de connexion par défaut de 30 secondes pour
  les transports stdio et HTTP

##### Nommage des outils

OpenClaw enregistre les outils MCP de paquets avec des noms compatibles avec les fournisseurs sous la forme
`serverName__toolName`. Par exemple, un serveur dont la clé est `"vigil-harbor"` et qui expose un
outil `memory_search` est enregistré sous `vigil-harbor__memory_search`.

- les caractères en dehors de `A-Za-z0-9_-` sont remplacés par `-`
- les préfixes de serveur sont limités à 30 caractères
- les noms complets d’outils sont limités à 64 caractères
- les noms de serveurs vides utilisent `mcp` comme valeur de repli
- les noms assainis en collision sont désambiguïsés avec des suffixes numériques
- l’ordre final des outils exposés est déterministe par nom sûr afin de garder les tours Pi
  répétés stables pour le cache
- le filtrage de profil traite tous les outils d’un serveur MCP de paquet comme appartenant au plugin
  `bundle-mcp`, afin que les listes d’autorisation et de refus des profils puissent inclure soit
  les noms individuels des outils exposés, soit la clé de plugin `bundle-mcp`

#### Paramètres Pi intégrés

- `settings.json` de Claude est importé comme paramètres Pi intégrés par défaut lorsque le
  paquet est activé
- OpenClaw assainit les clés de remplacement du shell avant de les appliquer

Clés assainies :

- `shellPath`
- `shellCommandPrefix`

#### LSP Pi intégré

- les paquets Claude activés peuvent contribuer une configuration de serveur LSP
- OpenClaw charge `.lsp.json` ainsi que tous les chemins `lspServers` déclarés dans le manifeste
- la configuration LSP du paquet est fusionnée dans les valeurs par défaut LSP de Pi intégré effectives
- seuls les serveurs LSP pris en charge et basés sur stdio sont exécutables aujourd’hui ; les transports
  non pris en charge apparaissent toujours dans `openclaw plugins inspect <id>`

### Détecté, mais non exécuté

Ces éléments sont reconnus et affichés dans les diagnostics, mais OpenClaw ne les exécute pas :

- `agents`, automatisation `hooks.json`, `outputStyles` de Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` de Cursor
- métadonnées inline/app Codex au-delà du signalement des capacités

## Formats de paquets

<AccordionGroup>
  <Accordion title="Paquets Codex">
    Marqueurs : `.codex-plugin/plugin.json`

    Contenu facultatif : `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Les paquets Codex s’intègrent le mieux à OpenClaw lorsqu’ils utilisent des racines de Skills et des répertoires
    de packs de hooks de style OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Paquets Claude">
    Deux modes de détection :

    - **Basé sur manifeste :** `.claude-plugin/plugin.json`
    - **Sans manifeste :** agencement Claude par défaut (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportement propre à Claude :

    - `commands/` est traité comme du contenu de Skills
    - `settings.json` est importé dans les paramètres Pi intégrés (les clés de remplacement du shell sont assainies)
    - `.mcp.json` expose les outils stdio pris en charge à Pi intégré
    - `.lsp.json` ainsi que les chemins `lspServers` déclarés dans le manifeste sont chargés dans les valeurs par défaut LSP de Pi intégré
    - `hooks/hooks.json` est détecté, mais non exécuté
    - Les chemins de composants personnalisés dans le manifeste sont additifs (ils étendent les valeurs par défaut, ils ne les remplacent pas)

  </Accordion>

  <Accordion title="Paquets Cursor">
    Marqueurs : `.cursor-plugin/plugin.json`

    Contenu facultatif : `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` est traité comme du contenu de Skills
    - `.cursor/rules/`, `.cursor/agents/` et `.cursor/hooks.json` sont uniquement détectés

  </Accordion>
</AccordionGroup>

## Priorité de détection

OpenClaw vérifie d’abord le format de plugin natif :

1. `openclaw.plugin.json` ou `package.json` valide avec `openclaw.extensions` — traité comme **plugin natif**
2. Marqueurs de paquet (`.codex-plugin/`, `.claude-plugin/` ou agencement Claude/Cursor par défaut) — traités comme **paquet**

Si un répertoire contient les deux, OpenClaw utilise le chemin natif. Cela empêche
les packages à double format d’être partiellement installés comme paquets.

## Dépendances d’exécution et nettoyage

- Les paquets compatibles tiers ne bénéficient pas d’une réparation `npm install` au démarrage. Ils
  doivent être installés via `openclaw plugins install` et embarquer tout ce dont
  ils ont besoin dans le répertoire du plugin installé.
- Les plugins groupés appartenant à OpenClaw sont soit livrés légers dans le cœur, soit
  téléchargeables via l’installateur de plugins. Le démarrage du Gateway n’exécute jamais de
  gestionnaire de packages pour eux.
- `openclaw doctor --fix` supprime les anciens répertoires de dépendances préparées et peut
  récupérer les plugins téléchargeables absents de l’index local des plugins lorsque
  la configuration les référence.

## Sécurité

Les paquets ont une frontière de confiance plus étroite que les plugins natifs :

- OpenClaw ne charge **pas** de modules d’exécution arbitraires de paquets dans le processus
- les chemins de Skills et de packs de hooks doivent rester à l’intérieur de la racine du plugin (frontière vérifiée)
- les fichiers de paramètres sont lus avec les mêmes contrôles de frontière
- les serveurs MCP stdio pris en charge peuvent être lancés comme sous-processus

Cela rend les paquets plus sûrs par défaut, mais vous devez tout de même traiter les paquets
tiers comme du contenu de confiance pour les fonctionnalités qu’ils exposent.

## Dépannage

<AccordionGroup>
  <Accordion title="Le paquet est détecté, mais les capacités ne s’exécutent pas">
    Exécutez `openclaw plugins inspect <id>`. Si une capacité est listée, mais indiquée comme
    non câblée, il s’agit d’une limite du produit — pas d’une installation cassée.
  </Accordion>

  <Accordion title="Les fichiers de commandes Claude n’apparaissent pas">
    Assurez-vous que le paquet est activé et que les fichiers Markdown se trouvent dans une racine
    `commands/` ou `skills/` détectée.
  </Accordion>

  <Accordion title="Les paramètres Claude ne s’appliquent pas">
    Seuls les paramètres Pi intégrés provenant de `settings.json` sont pris en charge. OpenClaw ne
    traite pas les paramètres de paquet comme des correctifs de configuration bruts.
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
