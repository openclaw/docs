---
read_when:
    - Vous souhaitez installer un bundle compatible avec Codex, Claude ou Cursor
    - Vous devez comprendre comment OpenClaw associe le contenu des bundles aux fonctionnalités natives.
    - Vous déboguez la détection des bundles ou des fonctionnalités manquantes
summary: Installez et utilisez les bundles Codex, Claude et Cursor comme plugins OpenClaw
title: Bundles de Plugins
x-i18n:
    generated_at: "2026-07-12T02:50:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d44006866238f53ee2e3e8126cc4f7ed6f7413534257775f7904c9b877778c59
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw peut installer des plugins provenant de trois écosystèmes externes : **Codex**, **Claude**
et **Cursor**. Ils sont appelés **paquets** : des ensembles de contenu et de métadonnées
qu’OpenClaw associe à des fonctionnalités natives telles que les Skills, les hooks et les outils MCP.

<Info>
  Les paquets ne sont **pas** identiques aux plugins OpenClaw natifs. Les plugins natifs s’exécutent
  dans le processus et peuvent enregistrer n’importe quelle capacité. Les paquets sont des ensembles
  de contenu avec une association sélective des fonctionnalités et une frontière de confiance plus restreinte.
</Info>

## Pourquoi les paquets existent

De nombreux plugins utiles sont publiés au format Codex, Claude ou Cursor. Au lieu
d’obliger leurs auteurs à les réécrire sous forme de plugins OpenClaw natifs, OpenClaw
détecte ces formats et associe leur contenu pris en charge à l’ensemble des fonctionnalités
natives. Vous pouvez installer un ensemble de commandes Claude ou un paquet de Skills Codex
et l’utiliser immédiatement.

## Installer un paquet

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

    `<source>` est un chemin ou dépôt local de place de marché, ou une source git/GitHub.

  </Step>

  <Step title="Vérifier la détection">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Les paquets affichent `Format: bundle`, ainsi qu’une valeur `Bundle format:` égale à `codex`,
    `claude` ou `cursor`.

  </Step>

  <Step title="Redémarrer et utiliser">
    ```bash
    openclaw gateway restart
    ```

    Les fonctionnalités associées (Skills, hooks, outils MCP, valeurs par défaut LSP) sont disponibles lors de la session suivante.

  </Step>
</Steps>

## Éléments des paquets associés par OpenClaw

Toutes les fonctionnalités des paquets ne s’exécutent pas encore dans OpenClaw. Voici celles
qui fonctionnent et celles qui sont détectées, mais pas encore connectées.

### Actuellement pris en charge

| Fonctionnalité     | Association                                                                                                      | Formats concernés |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------ |
| Contenu de Skills  | Les racines de Skills du paquet sont chargées comme des Skills OpenClaw normales                                 | Tous les formats   |
| Commandes          | `commands/` et `.cursor/commands/` sont traités comme des racines de Skills                                      | Claude, Cursor     |
| Ensembles de hooks | Structures OpenClaw de type `HOOK.md` + `handler.ts`                                                             | Codex              |
| Outils MCP         | La configuration MCP du paquet est fusionnée avec les paramètres OpenClaw intégrés ; les serveurs stdio et HTTP pris en charge sont chargés | Tous les formats |
| Serveurs LSP       | Le fichier Claude `.lsp.json` et les chemins `lspServers` déclarés dans le manifeste sont fusionnés avec les valeurs LSP OpenClaw intégrées par défaut | Claude |
| Paramètres         | Le fichier Claude `settings.json` est importé comme valeurs OpenClaw intégrées par défaut                        | Claude             |

#### Contenu de Skills

- Les racines de Skills des paquets sont chargées comme des racines de Skills OpenClaw normales.
- Les racines Claude `commands/` sont traitées comme des racines de Skills supplémentaires.
- Les racines Cursor `.cursor/commands/` sont traitées comme des racines de Skills supplémentaires.

Les fichiers de commandes Markdown Claude et les commandes Markdown Cursor fonctionnent tous
avec le chargeur normal de Skills OpenClaw.

#### Ensembles de hooks

Les racines de hooks des paquets fonctionnent **uniquement** lorsqu’elles utilisent la structure
normale des ensembles de hooks OpenClaw : `HOOK.md` accompagné de `handler.ts` ou `handler.js`.
Aujourd’hui, cela concerne principalement le cas compatible avec Codex.

#### MCP pour OpenClaw intégré

- Les paquets activés peuvent fournir une configuration de serveur MCP.
- OpenClaw fusionne la configuration MCP des paquets dans les paramètres OpenClaw intégrés
  effectifs sous la clé `mcpServers`.
- OpenClaw expose les outils MCP de paquets pris en charge pendant les tours de l’agent
  OpenClaw intégré en lançant des serveurs stdio ou en se connectant à des serveurs HTTP.
- Les profils d’outils `coding` et `messaging` incluent par défaut les outils MCP des paquets ;
  utilisez `tools.deny: ["bundle-mcp"]` pour les désactiver pour un agent ou un Gateway.
- Les paramètres locaux au projet de l’agent intégré continuent de s’appliquer après les valeurs
  par défaut des paquets, ce qui permet aux paramètres de l’espace de travail de remplacer les
  entrées MCP des paquets si nécessaire.
- Les catalogues d’outils MCP des paquets sont triés de manière déterministe avant leur
  enregistrement, afin que les changements d’ordre de `listTools()` en amont ne perturbent pas
  les blocs d’outils du cache de prompts.

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

**HTTP** se connecte à un serveur MCP en cours d’exécution et utilise `sse` par défaut, sauf si
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

- `transport` accepte `"streamable-http"` ou `"sse"` ; en cas d’omission, la valeur par défaut est `sse`.
- `type: "http"` est une structure en aval native de la CLI ; utilisez `transport: "streamable-http"` dans la configuration OpenClaw. `openclaw mcp set` et `openclaw doctor --fix` normalisent l’alias courant.
- Seuls les schémas d’URL `http:` et `https:` sont autorisés.
- Les valeurs de `headers` prennent en charge l’interpolation `${ENV_VAR}`.
- Une entrée de serveur contenant à la fois `command` et `url` est rejetée.
- Les identifiants présents dans les URL (informations utilisateur et paramètres de requête)
  sont masqués dans les descriptions d’outils et les journaux.
- `connectionTimeoutMs` remplace le délai de connexion par défaut de 30 secondes pour
  les transports stdio et HTTP. Le délai d’expiration des requêtes est de 60 secondes par défaut
  et peut être remplacé avec `requestTimeoutMs`.

##### Nommage des outils

OpenClaw enregistre les outils MCP des paquets avec des noms compatibles avec les fournisseurs,
sous la forme `serverName__toolName`. Par exemple, un serveur associé à la clé `"vigil-harbor"`
et exposant un outil `memory_search` est enregistré sous le nom `vigil-harbor__memory_search`.

- Les caractères qui ne font pas partie de `A-Za-z0-9_-` sont remplacés par `-`.
- Les fragments qui commenceraient par un caractère autre qu’une lettre reçoivent un préfixe
  alphabétique, afin que les clés de serveur numériques telles que `12306` produisent des préfixes
  d’outils compatibles avec les fournisseurs.
- Les préfixes de serveur sont limités à 30 caractères.
- Les noms complets des outils sont limités à 64 caractères.
- Les noms de serveur vides utilisent `mcp` comme valeur de repli.
- Les noms nettoyés identiques sont différenciés au moyen de suffixes numériques.
- L’ordre final des outils exposés est déterministe selon leur nom compatible, ce qui assure
  la stabilité du cache lors des tours répétés de l’agent intégré.
- Le filtrage des profils considère chaque outil d’un même serveur MCP de paquet comme
  appartenant au plugin `bundle-mcp`, afin que les listes d’autorisation ou de refus des profils
  puissent faire référence soit aux noms individuels des outils exposés, soit à la clé de plugin
  `bundle-mcp`.

#### Paramètres OpenClaw intégrés

Le fichier Claude `settings.json` est importé comme paramètres OpenClaw intégrés par défaut
lorsque le paquet est activé. OpenClaw nettoie les clés de remplacement du shell avant de
les appliquer :

- `shellPath`
- `shellCommandPrefix`

#### LSP OpenClaw intégré

- Les paquets Claude activés peuvent fournir une configuration de serveur LSP.
- OpenClaw charge `.lsp.json` ainsi que tous les chemins `lspServers` déclarés dans le manifeste.
- La configuration LSP des paquets est fusionnée avec les valeurs LSP OpenClaw intégrées
  effectives par défaut.
- Seuls les serveurs LSP pris en charge et reposant sur stdio peuvent actuellement être exécutés ;
  les transports non pris en charge apparaissent tout de même dans `openclaw plugins inspect <id>`.

### Détecté, mais non exécuté

Les éléments suivants sont reconnus et affichés dans les diagnostics, mais OpenClaw ne les exécute pas :

- `agents`, automatisation `hooks/hooks.json` et `outputStyles` de Claude
- `.cursor/agents`, `.cursor/hooks.json` et `.cursor/rules` de Cursor
- Métadonnées Codex `.app.json` au-delà du signalement des capacités

## Formats de paquets

<AccordionGroup>
  <Accordion title="Paquets Codex">
    Marqueurs : `.codex-plugin/plugin.json`

    Contenu facultatif : `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Les paquets Codex s’intègrent au mieux à OpenClaw lorsqu’ils utilisent des racines de Skills
    et des répertoires d’ensembles de hooks au format OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Paquets Claude">
    Deux modes de détection :

    - **Avec manifeste :** `.claude-plugin/plugin.json`
    - **Sans manifeste :** structure Claude par défaut (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Comportement propre à Claude :

    - `commands/` est traité comme du contenu de Skills
    - `settings.json` est importé dans les paramètres OpenClaw intégrés (les clés de remplacement du shell sont nettoyées)
    - `.mcp.json` expose les outils stdio pris en charge à OpenClaw intégré
    - `.lsp.json` ainsi que les chemins `lspServers` déclarés dans le manifeste sont chargés dans les valeurs LSP OpenClaw intégrées par défaut
    - `hooks/hooks.json` est détecté, mais pas exécuté
    - Les chemins de composants personnalisés du manifeste sont additifs ; ils étendent les valeurs par défaut au lieu de les remplacer

  </Accordion>

  <Accordion title="Paquets Cursor">
    Marqueurs : `.cursor-plugin/plugin.json`

    Contenu facultatif : `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` est traité comme du contenu de Skills
    - `.cursor/rules/`, `.cursor/agents/` et `.cursor/hooks.json` sont uniquement détectés

  </Accordion>
</AccordionGroup>

## Priorité de détection

OpenClaw recherche d’abord le format de plugin natif :

1. `openclaw.plugin.json` ou un fichier `package.json` valide contenant `openclaw.extensions` : traité comme un **plugin natif**
2. Marqueurs de paquet (`.codex-plugin/`, `.claude-plugin/` ou structure Claude/Cursor par défaut) : traité comme un **paquet**

Si un répertoire contient les deux, OpenClaw utilise le chemin natif. Cela évite
que les paquets prenant en charge deux formats soient partiellement installés comme paquets.

## Dépendances d’exécution et nettoyage

- Les paquets compatibles tiers ne bénéficient pas d’une réparation `npm install` au démarrage.
  Ils doivent être installés avec `openclaw plugins install` et inclure tout ce dont ils ont
  besoin dans le répertoire du plugin installé.
- Les plugins groupés appartenant à OpenClaw sont soit fournis sous une forme légère dans le cœur,
  soit téléchargeables au moyen du programme d’installation de plugins. Le démarrage du Gateway
  n’exécute jamais de gestionnaire de paquets pour eux.
- `openclaw doctor --fix` supprime les enregistrements obsolètes d’installation locale de plugins
  groupés et peut récupérer les plugins téléchargeables absents de l’index local des plugins
  lorsque la configuration les référence encore.

## Sécurité

Les paquets ont une frontière de confiance plus restreinte que les plugins natifs :

- OpenClaw ne charge **pas** de modules d’exécution arbitraires provenant des paquets dans le processus.
- Les chemins des Skills et des ensembles de hooks doivent rester dans la racine du plugin, avec vérification des limites.
- Les fichiers de paramètres sont lus avec les mêmes vérifications des limites.
- Les serveurs MCP stdio pris en charge peuvent être lancés comme sous-processus.

Les paquets sont ainsi plus sûrs par défaut, mais vous devez tout de même considérer les
paquets tiers comme du contenu de confiance pour les fonctionnalités qu’ils exposent.

## Résolution des problèmes

<AccordionGroup>
  <Accordion title="Le paquet est détecté, mais ses capacités ne s’exécutent pas">
    Exécutez `openclaw plugins inspect <id>`. Si une capacité figure dans la liste, mais est marquée
    comme non connectée, il s’agit d’une limite du produit et non d’une installation défectueuse.
  </Accordion>

  <Accordion title="Les fichiers de commandes Claude n’apparaissent pas">
    Vérifiez que le paquet est activé et que les fichiers Markdown se trouvent dans une racine
    `commands/` ou `skills/` détectée.
  </Accordion>

  <Accordion title="Les paramètres Claude ne s’appliquent pas">
    Seuls les paramètres OpenClaw intégrés provenant de `settings.json` sont pris en charge. OpenClaw
    ne traite pas les paramètres des paquets comme des correctifs bruts de configuration.
  </Accordion>

  <Accordion title="Les hooks Claude ne s’exécutent pas">
    `hooks/hooks.json` est uniquement détecté. Si vous avez besoin de hooks exécutables, utilisez
    la structure d’ensemble de hooks OpenClaw ou fournissez un plugin natif.
  </Accordion>
</AccordionGroup>

## Pages connexes

- [Installer et configurer les plugins](/fr/tools/plugin)
- [Créer des plugins](/fr/plugins/building-plugins) - créer un plugin natif
- [Manifeste de plugin](/fr/plugins/manifest) - schéma du manifeste natif
