---
read_when:
    - Vous souhaitez installer un bundle compatible avec Codex, Claude ou Cursor
    - Vous devez comprendre comment OpenClaw associe le contenu des bundles aux fonctionnalités natives
    - Vous déboguez la détection des bundles ou des fonctionnalités manquantes
summary: Installez et utilisez les bundles Codex, Claude et Cursor en tant que plugins OpenClaw
title: Lots de Plugins
x-i18n:
    generated_at: "2026-07-12T15:31:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d44006866238f53ee2e3e8126cc4f7ed6f7413534257775f7904c9b877778c59
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw peut installer des plugins provenant de trois écosystèmes externes : **Codex**, **Claude**
et **Cursor**. Ils sont appelés **bundles** : des ensembles de contenu et de métadonnées
qu’OpenClaw associe à des fonctionnalités natives telles que les skills, les hooks et les outils MCP.

<Info>
  Les bundles ne sont **pas** identiques aux plugins OpenClaw natifs. Les plugins natifs s’exécutent
  dans le processus et peuvent enregistrer n’importe quelle capacité. Les bundles sont des ensembles de contenu avec
  une association sélective des fonctionnalités et une frontière de confiance plus restreinte.
</Info>

## Pourquoi les bundles existent

De nombreux plugins utiles sont publiés au format Codex, Claude ou Cursor. Au lieu
d’obliger leurs auteurs à les réécrire sous forme de plugins OpenClaw natifs, OpenClaw
détecte ces formats et associe leur contenu pris en charge à l’ensemble de fonctionnalités
natives. Vous pouvez installer un ensemble de commandes Claude ou un bundle de skills Codex et l’utiliser
immédiatement.

## Installer un bundle

<Steps>
  <Step title="Installer depuis un répertoire, une archive ou une place de marché">
    ```bash
    # Répertoire local
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Place de marché Claude
    openclaw plugins marketplace list <source>
    openclaw plugins install <plugin> --marketplace <source>
    ```

    `<source>` est un chemin ou dépôt de place de marché local, ou une source git/GitHub.

  </Step>

  <Step title="Vérifier la détection">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Les bundles affichent `Format: bundle` ainsi qu’une valeur `Bundle format:` égale à `codex`,
    `claude` ou `cursor`.

  </Step>

  <Step title="Redémarrer et utiliser">
    ```bash
    openclaw gateway restart
    ```

    Les fonctionnalités associées (skills, hooks, outils MCP et valeurs par défaut LSP) sont disponibles lors de la session suivante.

  </Step>
</Steps>

## Ce qu’OpenClaw associe depuis les bundles

Toutes les fonctionnalités des bundles ne s’exécutent pas encore dans OpenClaw. Voici celles qui fonctionnent et celles qui
sont détectées, mais pas encore connectées.

### Actuellement pris en charge

| Fonctionnalité     | Association                                                                                                  | S’applique à         |
| ------------------ | ------------------------------------------------------------------------------------------------------------ | -------------------- |
| Contenu de skill   | Les racines de skills du bundle se chargent comme des skills OpenClaw normaux                                | Tous les formats     |
| Commandes          | `commands/` et `.cursor/commands/` sont traités comme des racines de skills                                  | Claude, Cursor       |
| Ensembles de hooks | Structures OpenClaw de type `HOOK.md` + `handler.ts`                                                         | Codex                |
| Outils MCP         | Configuration MCP du bundle fusionnée dans les paramètres OpenClaw intégrés ; serveurs stdio et HTTP pris en charge chargés | Tous les formats |
| Serveurs LSP       | Fichier Claude `.lsp.json` et `lspServers` déclarés dans le manifeste fusionnés dans les valeurs par défaut LSP d’OpenClaw intégré | Claude |
| Paramètres         | Fichier Claude `settings.json` importé comme valeurs par défaut d’OpenClaw intégré                           | Claude               |

#### Contenu de skill

- Les racines de skills du bundle se chargent comme des racines de skills OpenClaw normales.
- Les racines Claude `commands/` sont traitées comme des racines de skills supplémentaires.
- Les racines Cursor `.cursor/commands/` sont traitées comme des racines de skills supplémentaires.

Les fichiers de commandes Markdown Claude et les commandes Markdown Cursor fonctionnent tous deux via le
chargeur de skills OpenClaw normal.

#### Ensembles de hooks

Les racines de hooks d’un bundle fonctionnent **uniquement** lorsqu’elles utilisent la structure normale d’un ensemble de hooks
OpenClaw : `HOOK.md` accompagné de `handler.ts` ou `handler.js`. Aujourd’hui, cela concerne principalement
le cas compatible avec Codex.

#### MCP pour OpenClaw intégré

- Les bundles activés peuvent fournir une configuration de serveur MCP.
- OpenClaw fusionne la configuration MCP du bundle dans les paramètres effectifs d’OpenClaw
  intégré sous la clé `mcpServers`.
- OpenClaw expose les outils MCP de bundle pris en charge pendant les tours d’agent OpenClaw
  intégré en lançant des serveurs stdio ou en se connectant à des serveurs HTTP.
- Les profils d’outils `coding` et `messaging` incluent par défaut les outils MCP des bundles ;
  utilisez `tools.deny: ["bundle-mcp"]` pour les désactiver pour un agent ou un Gateway.
- Les paramètres locaux au projet de l’agent intégré continuent de s’appliquer après les valeurs par défaut du bundle, afin que
  les paramètres de l’espace de travail puissent remplacer les entrées MCP du bundle si nécessaire.
- Les catalogues d’outils MCP des bundles sont triés de manière déterministe avant l’enregistrement, afin que
  les changements d’ordre de `listTools()` en amont ne perturbent pas les blocs d’outils du cache de prompts.

##### Transports

Les serveurs MCP peuvent utiliser le transport stdio ou HTTP.

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

**HTTP** se connecte à un serveur MCP en cours d’exécution, en utilisant `sse` par défaut sauf si
`streamable-http` est demandé :

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

- `transport` accepte `"streamable-http"` ou `"sse"` ; si cette propriété est omise, la valeur par défaut est `sse`.
- `type: "http"` est une structure en aval native de la CLI ; utilisez `transport: "streamable-http"` dans la configuration OpenClaw. `openclaw mcp set` et `openclaw doctor --fix` normalisent cet alias courant.
- Seuls les schémas d’URL `http:` et `https:` sont autorisés.
- Les valeurs de `headers` prennent en charge l’interpolation `${ENV_VAR}`.
- Une entrée de serveur comportant à la fois `command` et `url` est rejetée.
- Les identifiants d’URL (informations utilisateur et paramètres de requête) sont masqués dans les descriptions
  des outils et les journaux.
- `connectionTimeoutMs` remplace le délai d’expiration de connexion par défaut de 30 secondes pour
  les transports stdio et HTTP. Le délai d’expiration des requêtes est de 60 secondes par défaut et
  peut être remplacé avec `requestTimeoutMs`.

##### Nommage des outils

OpenClaw enregistre les outils MCP des bundles avec des noms compatibles avec les fournisseurs, sous la forme
`serverName__toolName`. Par exemple, un serveur identifié par la clé `"vigil-harbor"` et exposant un
outil `memory_search` est enregistré sous le nom `vigil-harbor__memory_search`.

- Les caractères ne faisant pas partie de `A-Za-z0-9_-` sont remplacés par `-`.
- Les fragments qui commenceraient par un caractère autre qu’une lettre reçoivent un préfixe alphabétique, afin que les clés
  de serveur numériques telles que `12306` deviennent des préfixes d’outils compatibles avec les fournisseurs.
- Les préfixes de serveur sont limités à 30 caractères.
- Les noms complets des outils sont limités à 64 caractères.
- Les noms de serveur vides utilisent `mcp` comme valeur de repli.
- Les noms nettoyés en collision sont différenciés au moyen de suffixes numériques.
- L’ordre final des outils exposés est déterministe selon leur nom sûr, ce qui préserve la stabilité du cache
  au fil des tours répétés de l’agent intégré.
- Le filtrage des profils considère chaque outil provenant d’un même serveur MCP de bundle comme
  appartenant au plugin `bundle-mcp`, afin que les listes d’autorisation et d’interdiction des profils puissent référencer
  soit les noms individuels des outils exposés, soit la clé de plugin `bundle-mcp`.

#### Paramètres d’OpenClaw intégré

Le fichier Claude `settings.json` est importé comme paramètres par défaut d’OpenClaw intégré lorsque
le bundle est activé. OpenClaw nettoie les clés de remplacement du shell avant de les appliquer :

- `shellPath`
- `shellCommandPrefix`

#### LSP d’OpenClaw intégré

- Les bundles Claude activés peuvent fournir une configuration de serveur LSP.
- OpenClaw charge `.lsp.json` ainsi que tous les chemins `lspServers` déclarés dans le manifeste.
- La configuration LSP du bundle est fusionnée dans les valeurs par défaut LSP effectives d’OpenClaw
  intégré.
- Seuls les serveurs LSP pris en charge et basés sur stdio peuvent être exécutés actuellement ; les transports non pris en charge
  apparaissent tout de même dans `openclaw plugins inspect <id>`.

### Détecté, mais non exécuté

Les éléments suivants sont reconnus et affichés dans les diagnostics, mais OpenClaw ne les exécute pas :

- Claude `agents`, automatisation `hooks/hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Métadonnées Codex `.app.json` au-delà du signalement des capacités

## Formats des bundles

<AccordionGroup>
  <Accordion title="Bundles Codex">
    Marqueurs : `.codex-plugin/plugin.json`

    Contenu facultatif : `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Les bundles Codex s’intègrent particulièrement bien à OpenClaw lorsqu’ils utilisent des racines de skills et des
    répertoires d’ensembles de hooks de style OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Bundles Claude">
    Deux modes de détection :

    - **Basé sur un manifeste :** `.claude-plugin/plugin.json`
    - **Sans manifeste :** structure Claude par défaut (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportement propre à Claude :

    - `commands/` est traité comme du contenu de skill
    - `settings.json` est importé dans les paramètres d’OpenClaw intégré (les clés de remplacement du shell sont nettoyées)
    - `.mcp.json` expose les outils stdio pris en charge à OpenClaw intégré
    - `.lsp.json` ainsi que les chemins `lspServers` déclarés dans le manifeste sont chargés dans les valeurs par défaut LSP d’OpenClaw intégré
    - `hooks/hooks.json` est détecté, mais non exécuté
    - Les chemins de composants personnalisés dans le manifeste sont additifs ; ils étendent les valeurs par défaut sans les remplacer

  </Accordion>

  <Accordion title="Bundles Cursor">
    Marqueurs : `.cursor-plugin/plugin.json`

    Contenu facultatif : `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` est traité comme du contenu de skill
    - `.cursor/rules/`, `.cursor/agents/` et `.cursor/hooks.json` sont uniquement détectés

  </Accordion>
</AccordionGroup>

## Ordre de priorité de la détection

OpenClaw recherche d’abord le format de plugin natif :

1. `openclaw.plugin.json` ou un fichier `package.json` valide comportant `openclaw.extensions` : traité comme un **plugin natif**
2. Marqueurs de bundle (`.codex-plugin/`, `.claude-plugin/` ou structure Claude/Cursor par défaut) : traité comme un **bundle**

Si un répertoire contient les deux, OpenClaw utilise le chemin natif. Cela empêche
l’installation partielle des paquets à double format en tant que bundles.

## Dépendances d’exécution et nettoyage

- Les bundles compatibles provenant de tiers ne bénéficient pas d’une réparation `npm install` au démarrage. Ils
  doivent être installés avec `openclaw plugins install` et fournir tout ce dont
  ils ont besoin dans le répertoire du plugin installé.
- Les plugins groupés appartenant à OpenClaw sont soit livrés sous forme allégée dans le cœur, soit
  téléchargeables via le programme d’installation des plugins. Le démarrage du Gateway n’exécute jamais de
  gestionnaire de paquets pour eux.
- `openclaw doctor --fix` supprime les enregistrements obsolètes d’installations locales de plugins groupés
  et peut récupérer les plugins téléchargeables absents de l’index local des plugins
  lorsque la configuration les référence encore.

## Sécurité

Les bundles ont une frontière de confiance plus restreinte que les plugins natifs :

- OpenClaw ne charge **pas** de modules d’exécution arbitraires provenant des bundles dans le processus.
- Les chemins des skills et des ensembles de hooks doivent rester dans la racine du plugin (avec vérification des limites).
- Les fichiers de paramètres sont lus avec les mêmes vérifications des limites.
- Les serveurs MCP stdio pris en charge peuvent être lancés comme sous-processus.

Cela rend les bundles plus sûrs par défaut, mais vous devez malgré tout considérer les bundles
tiers comme du contenu de confiance pour les fonctionnalités qu’ils exposent.

## Résolution des problèmes

<AccordionGroup>
  <Accordion title="Le bundle est détecté, mais les capacités ne s’exécutent pas">
    Exécutez `openclaw plugins inspect <id>`. Si une capacité est répertoriée, mais indiquée comme
    non connectée, il s’agit d’une limite du produit et non d’une installation défectueuse.
  </Accordion>

  <Accordion title="Les fichiers de commandes Claude n’apparaissent pas">
    Assurez-vous que le bundle est activé et que les fichiers Markdown se trouvent dans une racine
    `commands/` ou `skills/` détectée.
  </Accordion>

  <Accordion title="Les paramètres Claude ne s’appliquent pas">
    Seuls les paramètres d’OpenClaw intégré provenant de `settings.json` sont pris en charge. OpenClaw ne
    traite pas les paramètres du bundle comme des correctifs de configuration bruts.
  </Accordion>

  <Accordion title="Les hooks Claude ne s’exécutent pas">
    `hooks/hooks.json` est uniquement détecté. Si vous avez besoin de hooks exécutables, utilisez la
    structure d’ensemble de hooks OpenClaw ou fournissez un plugin natif.
  </Accordion>
</AccordionGroup>

## Pages connexes

- [Installer et configurer des plugins](/fr/tools/plugin)
- [Créer des plugins](/fr/plugins/building-plugins) - créer un plugin natif
- [Manifeste de plugin](/fr/plugins/manifest) - schéma du manifeste natif
