---
read_when:
    - Vous voulez que les agents affichent les modifications de code ou de Markdown sous forme de diffs
    - Vous voulez une URL de visualiseur prête pour le canevas ou un fichier de diff rendu
    - Il vous faut des artefacts de diff temporaires et contrôlés avec des valeurs par défaut sécurisées
sidebarTitle: Diffs
summary: Visionneuse de diff en lecture seule et moteur de rendu de fichiers pour les agents (outil Plugin facultatif)
title: Différences
x-i18n:
    generated_at: "2026-04-30T07:51:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d8938b11f6bc612168057b7f4f5ceaafb22c2445e015fb746795b2e93f033e5
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` est un outil de Plugin facultatif avec de brèves consignes système intégrées et un Skills compagnon qui transforme le contenu des changements en artefact diff en lecture seule pour les agents.

Il accepte soit :

- le texte `before` et `after`
- un `patch` unifié

Il peut retourner :

- une URL de visualiseur Gateway pour une présentation canvas
- un chemin de fichier rendu (PNG ou PDF) pour la livraison par message
- les deux sorties en un seul appel

Lorsqu’il est activé, le Plugin ajoute en préfixe des consignes d’utilisation concises dans l’espace du prompt système et expose également un Skills détaillé pour les cas où l’agent a besoin d’instructions plus complètes.

## Démarrage rapide

<Steps>
  <Step title="Enable the plugin">
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
  <Step title="Pick a mode">
    <Tabs>
      <Tab title="view">
        Flux donnant la priorité au canvas : les agents appellent `diffs` avec `mode: "view"` et ouvrent `details.viewerUrl` avec `canvas present`.
      </Tab>
      <Tab title="file">
        Livraison de fichier dans le chat : les agents appellent `diffs` avec `mode: "file"` et envoient `details.filePath` avec `message` en utilisant `path` ou `filePath`.
      </Tab>
      <Tab title="both">
        Combiné : les agents appellent `diffs` avec `mode: "both"` pour obtenir les deux artefacts en un seul appel.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Désactiver les consignes système intégrées

Si vous souhaitez garder l’outil `diffs` activé mais désactiver ses consignes intégrées de prompt système, définissez `plugins.entries.diffs.hooks.allowPromptInjection` sur `false` :

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

Cela bloque le hook `before_prompt_build` du Plugin diffs tout en gardant le Plugin, l’outil et le Skills compagnon disponibles.

Si vous souhaitez désactiver à la fois les consignes et l’outil, désactivez plutôt le Plugin.

## Flux de travail type d’un agent

<Steps>
  <Step title="Call diffs">
    L’agent appelle l’outil `diffs` avec l’entrée.
  </Step>
  <Step title="Read details">
    L’agent lit les champs `details` dans la réponse.
  </Step>
  <Step title="Present">
    L’agent ouvre soit `details.viewerUrl` avec `canvas present`, envoie `details.filePath` avec `message` en utilisant `path` ou `filePath`, ou fait les deux.
  </Step>
</Steps>

## Exemples d’entrée

<Tabs>
  <Tab title="Before and after">
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

Tous les champs sont facultatifs, sauf indication contraire.

<ParamField path="before" type="string">
  Texte d’origine. Obligatoire avec `after` lorsque `patch` est omis.
</ParamField>
<ParamField path="after" type="string">
  Texte mis à jour. Obligatoire avec `before` lorsque `patch` est omis.
</ParamField>
<ParamField path="patch" type="string">
  Texte de diff unifié. Mutuellement exclusif avec `before` et `after`.
</ParamField>
<ParamField path="path" type="string">
  Nom de fichier d’affichage pour le mode avant et après.
</ParamField>
<ParamField path="lang" type="string">
  Indice de remplacement de langue pour le mode avant et après. Les valeurs inconnues reviennent au texte brut.
</ParamField>
<ParamField path="title" type="string">
  Remplacement du titre du visualiseur.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Mode de sortie. Valeur par défaut : valeur par défaut du Plugin `defaults.mode`. Alias obsolète : `"image"` se comporte comme `"file"` et reste accepté pour la rétrocompatibilité.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Thème du visualiseur. Valeur par défaut : valeur par défaut du Plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Disposition du diff. Valeur par défaut : valeur par défaut du Plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Développer les sections inchangées lorsque le contexte complet est disponible. Option par appel uniquement (pas une clé par défaut du Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Format du fichier rendu. Valeur par défaut : valeur par défaut du Plugin `defaults.fileFormat`.
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
  TTL de l’artefact en secondes pour les sorties visualiseur et fichier autonome. Maximum 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Remplacement de l’origine de l’URL du visualiseur. Remplace `viewerBaseUrl` du Plugin. Doit être `http` ou `https`, sans requête ni fragment.
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    Toujours acceptés pour la rétrocompatibilité :

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - `before` et `after` : chacun 512 KiB maximum.
    - `patch` : 2 MiB maximum.
    - `path` : 2048 octets maximum.
    - `lang` : 128 octets maximum.
    - `title` : 1024 octets maximum.
    - Plafond de complexité des patchs : 128 fichiers et 120000 lignes au total maximum.
    - `patch` avec `before` ou `after` est rejeté.
    - Limites de sécurité des fichiers rendus (s’appliquent au PNG et au PDF) :
      - `fileQuality: "standard"` : 8 MP max (8 000 000 pixels rendus).
      - `fileQuality: "hq"` : 14 MP max (14 000 000 pixels rendus).
      - `fileQuality: "print"` : 24 MP max (24 000 000 pixels rendus).
      - Le PDF a également un maximum de 50 pages.

  </Accordion>
</AccordionGroup>

## Contrat des détails de sortie

L’outil retourne des métadonnées structurées sous `details`.

<AccordionGroup>
  <Accordion title="Viewer fields">
    Champs partagés pour les modes qui créent un visualiseur :

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
    Champs de fichier lorsqu’un PNG ou un PDF est rendu :

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (même valeur que `filePath`, pour la compatibilité avec l’outil de message)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Compatibility aliases">
    Également retournés pour les appelants existants :

    - `format` (même valeur que `fileFormat`)
    - `imagePath` (même valeur que `filePath`)
    - `imageBytes` (même valeur que `fileBytes`)
    - `imageQuality` (même valeur que `fileQuality`)
    - `imageScale` (même valeur que `fileScale`)
    - `imageMaxWidth` (même valeur que `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Résumé du comportement des modes :

| Mode     | Ce qui est renvoyé                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Champs de visionneuse uniquement.                                                                                      |
| `"file"` | Champs de fichier uniquement, sans artefact de visionneuse.                                                            |
| `"both"` | Champs de visionneuse plus champs de fichier. Si le rendu du fichier échoue, la visionneuse est quand même renvoyée avec l’alias `fileError` et `imageError`. |

## Sections inchangées réduites

- La visionneuse peut afficher des lignes comme `N unmodified lines`.
- Les contrôles de développement sur ces lignes sont conditionnels et ne sont pas garantis pour chaque type d’entrée.
- Les contrôles de développement apparaissent lorsque le diff rendu dispose de données de contexte extensibles, ce qui est typique pour les entrées avant et après.
- Pour de nombreuses entrées de patch unifié, les corps de contexte omis ne sont pas disponibles dans les blocs de patch analysés, donc la ligne peut apparaître sans contrôles de développement. C’est le comportement attendu.
- `expandUnchanged` s’applique uniquement lorsqu’un contexte extensible existe.

## Valeurs par défaut du Plugin

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

Les paramètres explicites de l’outil remplacent ces valeurs par défaut.

### Configuration persistante de l’URL de la visionneuse

<ParamField path="viewerBaseUrl" type="string">
  Solution de repli appartenant au Plugin pour les liens de visionneuse renvoyés lorsqu’un appel d’outil ne transmet pas `baseUrl`. Doit être `http` ou `https`, sans requête ni fragment.
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
  `false` : les requêtes non-local loopback vers les routes de visionneuse sont refusées. `true` : les visionneuses distantes sont autorisées si le chemin avec jeton est valide.
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
- Les métadonnées d’artefact de visionneuse contiennent :
  - identifiant d’artefact aléatoire (20 caractères hexadécimaux)
  - jeton aléatoire (48 caractères hexadécimaux)
  - `createdAt` et `expiresAt`
  - chemin `viewer.html` stocké
- La durée de vie par défaut des artefacts est de 30 minutes lorsqu’elle n’est pas spécifiée.
- La durée de vie maximale acceptée pour la visionneuse est de 6 heures.
- Le nettoyage s’exécute de manière opportuniste après la création d’un artefact.
- Les artefacts expirés sont supprimés.
- Le nettoyage de repli supprime les dossiers obsolètes de plus de 24 heures lorsque les métadonnées sont manquantes.

## URL de la visionneuse et comportement réseau

Route de la visionneuse :

- `/plugins/diffs/view/{artifactId}/{token}`

Ressources de la visionneuse :

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Le document de la visionneuse résout ces ressources relativement à l’URL de la visionneuse, donc un préfixe de chemin `baseUrl` facultatif est également conservé pour les requêtes de ressources.

Comportement de construction de l’URL :

- Si `baseUrl` d’appel d’outil est fourni, il est utilisé après validation stricte.
- Sinon, si `viewerBaseUrl` du plugin est configuré, il est utilisé.
- Sans aucun des deux remplacements, l’URL de la visionneuse utilise par défaut le local loopback `127.0.0.1`.
- Si le mode de liaison du Gateway est `custom` et que `gateway.customBindHost` est défini, cet hôte est utilisé.

Règles de `baseUrl` :

- Doit être `http://` ou `https://`.
- Les requêtes et fragments sont rejetés.
- L’origine plus un chemin de base facultatif sont autorisés.

## Modèle de sécurité

<AccordionGroup>
  <Accordion title="Renforcement de la visionneuse">
    - local loopback uniquement par défaut.
    - Chemins de visionneuse avec jeton, avec validation stricte de l’identifiant et du jeton.
    - CSP de réponse de la visionneuse :
      - `default-src 'none'`
      - scripts et ressources uniquement depuis self
      - aucun `connect-src` sortant
    - Limitation des échecs distants lorsque l’accès distant est activé :
      - 40 échecs par 60 secondes
      - verrouillage de 60 secondes (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Durcissement du rendu de fichiers">
    - Le routage des requêtes du navigateur de capture d’écran refuse tout par défaut.
    - Seules les ressources locales du visualiseur depuis `http://127.0.0.1/plugins/diffs/assets/*` sont autorisées.
    - Les requêtes réseau externes sont bloquées.

  </Accordion>
</AccordionGroup>

## Exigences du navigateur pour le mode fichier

`mode: "file"` et `mode: "both"` nécessitent un navigateur compatible avec Chromium.

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
  <Step title="Solution de repli de la plateforme">
    Solution de repli de découverte de commande/chemin de la plateforme.
  </Step>
</Steps>

Texte d’erreur courant :

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Corrigez en installant Chrome, Chromium, Edge ou Brave, ou en définissant l’une des options de chemin d’exécutable ci-dessus.

## Dépannage

<AccordionGroup>
  <Accordion title="Erreurs de validation d’entrée">
    - `Provide patch or both before and after text.` — incluez à la fois `before` et `after`, ou fournissez `patch`.
    - `Provide either patch or before/after input, not both.` — ne mélangez pas les modes d’entrée.
    - `Invalid baseUrl: ...` — utilisez une origine `http(s)` avec un chemin facultatif, sans requête ni fragment.
    - `{field} exceeds maximum size (...)` — réduisez la taille de la charge utile.
    - Rejet d’un patch volumineux — réduisez le nombre de fichiers de patch ou le nombre total de lignes.

  </Accordion>
  <Accordion title="Accessibilité du visualiseur">
    - L’URL du visualiseur se résout vers `127.0.0.1` par défaut.
    - Pour les scénarios d’accès distant, au choix :
      - définissez `viewerBaseUrl` du plugin, ou
      - passez `baseUrl` à chaque appel d’outil, ou
      - utilisez `gateway.bind=custom` et `gateway.customBindHost`
    - Si `gateway.trustedProxies` inclut le bouclage pour un proxy sur le même hôte (par exemple Tailscale Serve), les requêtes brutes du visualiseur en bouclage sans en-têtes d’IP client transférée échouent fermées par conception.
    - Pour cette topologie de proxy :
      - privilégiez `mode: "file"` ou `mode: "both"` lorsque vous avez seulement besoin d’une pièce jointe, ou
      - activez intentionnellement `security.allowRemoteViewer` et définissez `viewerBaseUrl` du plugin ou passez un `baseUrl` de proxy/public lorsque vous avez besoin d’une URL de visualiseur partageable
    - Activez `security.allowRemoteViewer` uniquement lorsque vous souhaitez autoriser l’accès externe au visualiseur.

  </Accordion>
  <Accordion title="La ligne de lignes non modifiées n’a pas de bouton de développement">
    Cela peut se produire pour une entrée de patch lorsque le patch ne contient pas de contexte développable. C’est attendu et n’indique pas une défaillance du visualiseur.
  </Accordion>
  <Accordion title="Artefact introuvable">
    - L’artefact a expiré en raison de la durée de vie TTL.
    - Le jeton ou le chemin a changé.
    - Le nettoyage a supprimé des données obsolètes.

  </Accordion>
</AccordionGroup>

## Conseils opérationnels

- Privilégiez `mode: "view"` pour les revues interactives locales dans le canevas.
- Privilégiez `mode: "file"` pour les canaux de discussion sortants qui nécessitent une pièce jointe.
- Gardez `allowRemoteViewer` désactivé sauf si votre déploiement nécessite des URL de visualiseur distantes.
- Définissez un `ttlSeconds` court explicite pour les diffs sensibles.
- Évitez d’envoyer des secrets dans l’entrée de diff lorsque ce n’est pas nécessaire.
- Si votre canal compresse fortement les images (par exemple Telegram ou WhatsApp), privilégiez la sortie PDF (`fileFormat: "pdf"`).

<Note>
Moteur de rendu de diff fourni par [Diffs](https://diffs.com).
</Note>

## Connexe

- [Navigateur](/fr/tools/browser)
- [Plugins](/fr/tools/plugin)
- [Vue d’ensemble des outils](/fr/tools)
