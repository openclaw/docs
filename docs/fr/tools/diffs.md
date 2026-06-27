---
read_when:
    - Vous voulez que les agents affichent les modifications de code ou de Markdown sous forme de diffs
    - Vous voulez une URL de visionneuse prête pour le canevas ou un fichier de diff rendu
    - Vous avez besoin d’artefacts de diff contrôlés et temporaires avec des valeurs par défaut sécurisées
sidebarTitle: Diffs
summary: Visionneuse de diff en lecture seule et moteur de rendu de fichiers pour agents (outil de Plugin facultatif)
title: Différences
x-i18n:
    generated_at: "2026-06-27T18:17:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea3d8e9e026e10b2f3658b795c07ea21062896ab0d45a8cb2dc7e0e9ed9aa658
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` est un outil de Plugin optionnel avec de brèves instructions système intégrées et un Skills compagnon qui transforme le contenu de changements en artefact diff en lecture seule pour les agents.

Il accepte soit :

- du texte `before` et `after`
- un `patch` unifié

Il peut renvoyer :

- une URL de visualiseur Gateway pour une présentation canvas
- un chemin de fichier rendu (PNG ou PDF) pour l’envoi par message
- les deux sorties en un seul appel

Lorsqu’il est activé, le Plugin ajoute des instructions d’utilisation concises dans l’espace du prompt système et expose aussi un Skills détaillé pour les cas où l’agent a besoin d’instructions plus complètes.

## Démarrage rapide

<Steps>
  <Step title="Installer le Plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Activer le Plugin">
    ```json5
    {
      plugins: {
        entries: {
          diffs: {
            enabled: true,
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Choisir un mode">
    <Tabs>
      <Tab title="view">
        Flux centrés sur canvas : les agents appellent `diffs` avec `mode: "view"` et ouvrent `details.viewerUrl` avec `canvas present`.
      </Tab>
      <Tab title="file">
        Envoi de fichier dans le chat : les agents appellent `diffs` avec `mode: "file"` et envoient `details.filePath` avec `message` en utilisant `path` ou `filePath`.
      </Tab>
      <Tab title="both">
        Combiné : les agents appellent `diffs` avec `mode: "both"` pour obtenir les deux artefacts en un seul appel.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Désactiver les instructions système intégrées

Si vous souhaitez garder l’outil `diffs` activé mais désactiver ses instructions intégrées de prompt système, définissez `plugins.entries.diffs.hooks.allowPromptInjection` sur `false` :

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

Cela bloque le hook `before_prompt_build` du plugin diffs tout en gardant disponibles le Plugin, l’outil et le Skills compagnon.

Si vous souhaitez désactiver à la fois les instructions et l’outil, désactivez plutôt le Plugin.

## Flux de travail typique de l’agent

<Steps>
  <Step title="Appeler diffs">
    L’agent appelle l’outil `diffs` avec une entrée.
  </Step>
  <Step title="Lire details">
    L’agent lit les champs `details` dans la réponse.
  </Step>
  <Step title="Présenter">
    L’agent ouvre `details.viewerUrl` avec `canvas present`, envoie `details.filePath` avec `message` en utilisant `path` ou `filePath`, ou fait les deux.
  </Step>
</Steps>

## Exemples d’entrée

<Tabs>
  <Tab title="Avant et après">
    ```json
    {
      "before": "# Hello\n\nOne",
      "after": "# Hello\n\nTwo",
      "path": "docs/example.md",
      "mode": "view"
    }
    ```
  </Tab>
  <Tab title="Patch">
    ```json
    {
      "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
      "mode": "both"
    }
    ```
  </Tab>
</Tabs>

## Référence de l’entrée de l’outil

Tous les champs sont optionnels, sauf indication contraire.

<ParamField path="before" type="string">
  Texte d’origine. Requis avec `after` lorsque `patch` est omis.
</ParamField>
<ParamField path="after" type="string">
  Texte mis à jour. Requis avec `before` lorsque `patch` est omis.
</ParamField>
<ParamField path="patch" type="string">
  Texte de diff unifié. Mutuellement exclusif avec `before` et `after`.
</ParamField>
<ParamField path="path" type="string">
  Nom de fichier affiché pour le mode avant et après.
</ParamField>
<ParamField path="lang" type="string">
  Indice de remplacement de langue pour le mode avant et après. Les valeurs inconnues et les langues en dehors de l’ensemble par défaut du visualiseur reviennent au texte brut, sauf si le
  Plugin Diff Viewer Language Pack est installé.
</ParamField>

<ParamField path="title" type="string">
  Remplacement du titre du visualiseur.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Mode de sortie. Utilise par défaut la valeur par défaut du Plugin `defaults.mode`. Alias obsolète : `"image"` se comporte comme `"file"` et reste accepté pour la rétrocompatibilité.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Thème du visualiseur. Utilise par défaut la valeur par défaut du Plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Disposition du diff. Utilise par défaut la valeur par défaut du Plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Développe les sections inchangées lorsque le contexte complet est disponible. Option uniquement par appel (pas une clé par défaut du Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Format de fichier rendu. Utilise par défaut la valeur par défaut du Plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Préréglage de qualité pour le rendu PNG ou PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Remplacement de l’échelle de l’appareil (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Largeur de rendu maximale en pixels CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL de l’artefact en secondes pour les sorties du visualiseur et des fichiers autonomes. Maximum 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Remplacement de l’origine de l’URL du visualiseur. Remplace le `viewerBaseUrl` du Plugin. Doit être `http` ou `https`, sans requête ni fragment.
</ParamField>

<AccordionGroup>
  <Accordion title="Alias d’entrée hérités">
    Toujours acceptés pour la rétrocompatibilité :

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation et limites">
    - `before` et `after` font chacun au maximum 512 Kio.
    - `patch` fait au maximum 2 Mio.
    - `path` fait au maximum 2048 octets.
    - `lang` fait au maximum 128 octets.
    - `title` fait au maximum 1024 octets.
    - Plafond de complexité du patch : maximum 128 fichiers et 120000 lignes au total.
    - `patch` et `before` ou `after` ensemble sont rejetés.
    - Limites de sécurité des fichiers rendus (s’appliquent au PNG et au PDF) :
      - `fileQuality: "standard"` : maximum 8 MP (8 000 000 pixels rendus).
      - `fileQuality: "hq"` : maximum 14 MP (14 000 000 pixels rendus).
      - `fileQuality: "print"` : maximum 24 MP (24 000 000 pixels rendus).
      - Le PDF a également un maximum de 50 pages.

  </Accordion>
</AccordionGroup>

## Coloration syntaxique

OpenClaw inclut la coloration syntaxique pour les langages courants de code source, de configuration et de documentation :

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` et `toml`.

Les alias courants tels que `js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt` et `ps1` sont normalisés vers ces langages par défaut.

Installez le plugin Diff Viewer Language Pack pour mettre en évidence d’autres langages :

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Avec le pack de langage disponible, OpenClaw peut mettre en évidence beaucoup plus de langages. Si le pack n’est pas installé, les fichiers hors de la liste par défaut sont tout de même affichés sous forme de texte brut lisible. Exemples : Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI et fichiers diff.

Consultez le [plugin Diffs Language Pack](/fr/plugins/reference/diffs-language-pack) pour plus de détails et les [langages Shiki](https://shiki.style/languages) pour le catalogue amont des langages et alias de Shiki.

## Contrat des détails de sortie

L’outil renvoie des métadonnées structurées sous `details`.

<AccordionGroup>
  <Accordion title="Viewer fields">
    Champs partagés pour les modes qui créent une visionneuse :

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` lorsque disponible)

  </Accordion>
  <Accordion title="File fields">
    Champs de fichier lorsqu’un PNG ou un PDF est généré :

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (même valeur que `filePath`, pour la compatibilité avec l’outil de messages)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Compatibility aliases">
    Également renvoyés pour les appelants existants :

    - `format` (même valeur que `fileFormat`)
    - `imagePath` (même valeur que `filePath`)
    - `imageBytes` (même valeur que `fileBytes`)
    - `imageQuality` (même valeur que `fileQuality`)
    - `imageScale` (même valeur que `fileScale`)
    - `imageMaxWidth` (même valeur que `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Résumé du comportement des modes :

| Mode     | Ce qui est renvoyé                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Champs de visionneuse uniquement.                                                                                                    |
| `"file"` | Champs de fichier uniquement, sans artefact de visionneuse.                                                                                  |
| `"both"` | Champs de visionneuse plus champs de fichier. Si le rendu du fichier échoue, la visionneuse est tout de même renvoyée avec l’alias `fileError` et `imageError`. |

## Sections inchangées réduites

- La visionneuse peut afficher des lignes comme `N unmodified lines`.
- Les contrôles d’expansion sur ces lignes sont conditionnels et ne sont pas garantis pour chaque type d’entrée.
- Les contrôles d’expansion apparaissent lorsque le diff généré dispose de données de contexte extensibles, ce qui est typique pour une entrée avant/après.
- Pour de nombreuses entrées de correctif unifié, les corps de contexte omis ne sont pas disponibles dans les hunks du correctif analysé ; la ligne peut donc apparaître sans contrôles d’expansion. C’est le comportement attendu.
- `expandUnchanged` s’applique uniquement lorsqu’un contexte extensible existe.

## Valeurs par défaut du plugin

Définissez les valeurs par défaut à l’échelle du plugin dans `~/.openclaw/openclaw.json` :

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
            ttlSeconds: 21600,
          },
        },
      },
    },
  },
}
```

Valeurs par défaut prises en charge :

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`
- `ttlSeconds`

Les paramètres explicites de l’outil remplacent ces valeurs par défaut.

### Configuration de l’URL de visionneuse persistante

<ParamField path="viewerBaseUrl" type="string">
  Solution de repli détenue par le plugin pour les liens de visionneuse renvoyés lorsqu’un appel d’outil ne transmet pas `baseUrl`. Doit être `http` ou `https`, sans requête ni hash.
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## Configuration de sécurité

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false` : les requêtes non local loopback vers les routes de visionneuse sont refusées. `true` : les visionneuses distantes sont autorisées si le chemin tokenisé est valide.
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## Cycle de vie et stockage des artefacts

- Les artefacts sont stockés dans le sous-dossier temporaire : `$TMPDIR/openclaw-diffs`.
- Les métadonnées d’artefact de la visionneuse contiennent :
  - un ID d’artefact aléatoire (20 caractères hexadécimaux)
  - un jeton aléatoire (48 caractères hexadécimaux)
  - `createdAt` et `expiresAt`
  - le chemin `viewer.html` stocké
- La TTL d’artefact par défaut est de 30 minutes lorsqu’elle n’est pas spécifiée.
- La TTL maximale acceptée pour la visionneuse est de 6 heures.
- Le nettoyage s’exécute de manière opportuniste après la création d’un artefact.
- Les artefacts expirés sont supprimés.
- Le nettoyage de secours supprime les dossiers obsolètes de plus de 24 heures lorsque les métadonnées sont manquantes.

## URL de la visionneuse et comportement réseau

Route de la visionneuse :

- `/plugins/diffs/view/{artifactId}/{token}`

Ressources de la visionneuse :

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` lorsque le diff utilise une langue du pack de langue de la visionneuse de diff

Le document de la visionneuse résout ces ressources relativement à l’URL de la visionneuse ; un préfixe de chemin `baseUrl` facultatif est donc également conservé pour les deux requêtes de ressources.

Comportement de construction d’URL :

- Si le `baseUrl` d’appel d’outil est fourni, il est utilisé après validation stricte.
- Sinon, si le `viewerBaseUrl` du Plugin est configuré, il est utilisé.
- Sans l’une ou l’autre surcharge, l’URL de la visionneuse utilise par défaut le bouclage `127.0.0.1`.
- Si le mode de liaison du Gateway est `custom` et que `gateway.customBindHost` est défini, cet hôte est utilisé.

Règles de `baseUrl` :

- Doit être `http://` ou `https://`.
- Les requêtes et les fragments sont rejetés.
- L’origine avec un chemin de base facultatif est autorisée.

## Modèle de sécurité

<AccordionGroup>
  <Accordion title="Durcissement de la visionneuse">
    - Bouclage uniquement par défaut.
    - Chemins de visionneuse avec jeton et validation stricte de l’ID et du jeton.
    - CSP de réponse de la visionneuse :
      - `default-src 'none'`
      - scripts et ressources uniquement depuis self
      - pas de `connect-src` sortant
    - Limitation des échecs distants lorsque l’accès distant est activé :
      - 40 échecs par 60 secondes
      - verrouillage de 60 secondes (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Durcissement du rendu de fichiers">
    - Le routage des requêtes du navigateur de capture d’écran refuse tout par défaut.
    - Seules les ressources locales de la visionneuse provenant de `http://127.0.0.1/plugins/diffs/assets/*` sont autorisées.
    - Les requêtes réseau externes sont bloquées.

  </Accordion>
</AccordionGroup>

## Exigences du navigateur pour le mode fichier

`mode: "file"` et `mode: "both"` nécessitent un navigateur compatible Chromium.

Ordre de résolution :

<Steps>
  <Step title="Configuration">
    `browser.executablePath` dans la configuration OpenClaw.
  </Step>
  <Step title="Variables d’environnement">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Secours de plateforme">
    Découverte de commande/chemin de plateforme en secours.
  </Step>
</Steps>

Texte d’erreur courant :

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Corrigez en installant Chrome, Chromium, Edge ou Brave, ou en définissant l’une des options de chemin d’exécutable ci-dessus.

## Dépannage

<AccordionGroup>
  <Accordion title="Erreurs de validation des entrées">
    - `Provide patch or both before and after text.` — incluez à la fois `before` et `after`, ou fournissez `patch`.
    - `Provide either patch or before/after input, not both.` — ne mélangez pas les modes d’entrée.
    - `Invalid baseUrl: ...` — utilisez une origine `http(s)` avec un chemin facultatif, sans requête ni fragment.
    - `{field} exceeds maximum size (...)` — réduisez la taille de la charge utile.
    - Rejet d’un patch volumineux — réduisez le nombre de fichiers du patch ou le nombre total de lignes.

  </Accordion>
  <Accordion title="Accessibilité de la visionneuse">
    - L’URL de la visionneuse se résout par défaut en `127.0.0.1`.
    - Pour les scénarios d’accès distant, vous pouvez :
      - définir le `viewerBaseUrl` du Plugin, ou
      - passer `baseUrl` par appel d’outil, ou
      - utiliser `gateway.bind=custom` et `gateway.customBindHost`
    - Si `gateway.trustedProxies` inclut le bouclage pour un proxy sur le même hôte (par exemple Tailscale Serve), les requêtes brutes de visionneuse en bouclage sans en-têtes d’IP client transférée échouent en mode fermé par conception.
    - Pour cette topologie de proxy :
      - préférez `mode: "file"` ou `mode: "both"` lorsque vous avez seulement besoin d’une pièce jointe, ou
      - activez volontairement `security.allowRemoteViewer` et définissez le `viewerBaseUrl` du Plugin ou passez un `baseUrl` de proxy/public lorsque vous avez besoin d’une URL de visionneuse partageable
    - Activez `security.allowRemoteViewer` uniquement lorsque vous souhaitez un accès externe à la visionneuse.

  </Accordion>
  <Accordion title="La ligne des lignes non modifiées n’a pas de bouton de développement">
    Cela peut se produire pour une entrée de patch lorsque le patch ne contient pas de contexte extensible. C’est attendu et n’indique pas un échec de la visionneuse.
  </Accordion>
  <Accordion title="Artefact introuvable">
    - L’artefact a expiré en raison de la TTL.
    - Le jeton ou le chemin a changé.
    - Le nettoyage a supprimé les données obsolètes.

  </Accordion>
</AccordionGroup>

## Conseils opérationnels

- Préférez `mode: "view"` pour les revues interactives locales dans le canvas.
- Préférez `mode: "file"` pour les canaux de discussion sortants qui nécessitent une pièce jointe.
- Gardez `allowRemoteViewer` désactivé sauf si votre déploiement nécessite des URL de visionneuse distantes.
- Définissez un `ttlSeconds` court explicite pour les diffs sensibles.
- Évitez d’envoyer des secrets dans l’entrée de diff lorsque ce n’est pas nécessaire.
- Si votre canal compresse les images de manière agressive (par exemple Telegram ou WhatsApp), préférez la sortie PDF (`fileFormat: "pdf"`).

<Note>
Moteur de rendu de diff propulsé par [Diffs](https://diffs.com).
</Note>

## Connexe

- [Navigateur](/fr/tools/browser)
- [Plugins](/fr/tools/plugin)
- [Vue d’ensemble des outils](/fr/tools)
