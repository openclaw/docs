---
read_when:
    - Vous souhaitez que les agents affichent les modifications de code ou de Markdown sous forme de différences
    - Vous voulez une URL de visualiseur prête pour Canvas ou un fichier diff rendu.
    - Vous avez besoin d’artefacts de diff temporaires contrôlés avec des paramètres sécurisés par défaut.
sidebarTitle: Diffs
summary: Visionneuse de différences en lecture seule et moteur de rendu de fichiers pour les agents (outil de Plugin facultatif)
title: Différences
x-i18n:
    generated_at: "2026-04-26T11:39:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af098a294a4ba56e1a8df3b4f9650802fc53392634fee97b330f03b69e10781
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` est un outil Plugin facultatif avec une courte documentation système intégrée et un Skills compagnon qui transforme le contenu des modifications en un artefact de diff en lecture seule pour les agents.

Il accepte soit :

- le texte `before` et `after`
- un `patch` unifié

Il peut renvoyer :

- une URL de visualiseur Gateway pour la présentation sur canvas
- un chemin de fichier rendu (PNG ou PDF) pour la livraison dans les messages
- les deux sorties en un seul appel

Lorsqu’il est activé, le Plugin ajoute une documentation d’utilisation concise dans l’espace du prompt système et expose également un Skills détaillé pour les cas où l’agent a besoin d’instructions plus complètes.

## Démarrage rapide

<Steps>
  <Step title="Activer le plugin">
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
        Flux orientés Canvas : les agents appellent `diffs` avec `mode: "view"` et ouvrent `details.viewerUrl` avec `canvas present`.
      </Tab>
      <Tab title="file">
        Livraison de fichier dans le chat : les agents appellent `diffs` avec `mode: "file"` et envoient `details.filePath` avec `message` en utilisant `path` ou `filePath`.
      </Tab>
      <Tab title="both">
        Combiné : les agents appellent `diffs` avec `mode: "both"` pour obtenir les deux artefacts en un seul appel.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Désactiver la documentation système intégrée

Si vous voulez garder l’outil `diffs` activé tout en désactivant sa documentation intégrée dans le prompt système, définissez `plugins.entries.diffs.hooks.allowPromptInjection` sur `false` :

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

Cela bloque le hook `before_prompt_build` du plugin diffs tout en conservant le Plugin, l’outil et le Skills compagnon disponibles.

Si vous voulez désactiver à la fois la documentation et l’outil, désactivez plutôt le Plugin.

## Flux de travail type de l’agent

<Steps>
  <Step title="Appeler diffs">
    L’agent appelle l’outil `diffs` avec les données d’entrée.
  </Step>
  <Step title="Lire details">
    L’agent lit les champs `details` dans la réponse.
  </Step>
  <Step title="Présenter">
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

## Référence des entrées de l’outil

Tous les champs sont facultatifs sauf indication contraire.

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
  Nom de fichier affiché pour le mode before/after.
</ParamField>
<ParamField path="lang" type="string">
  Indication de langue de substitution pour le mode before/after. Les valeurs inconnues reviennent au texte brut.
</ParamField>
<ParamField path="title" type="string">
  Remplacement du titre du visualiseur.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Mode de sortie. Par défaut : valeur par défaut du Plugin `defaults.mode`. Alias obsolète : `"image"` se comporte comme `"file"` et reste accepté pour la compatibilité descendante.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Thème du visualiseur. Par défaut : valeur par défaut du Plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Mise en page du diff. Par défaut : valeur par défaut du Plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Développe les sections inchangées lorsque le contexte complet est disponible. Option uniquement par appel (pas une clé par défaut du Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Format du fichier rendu. Par défaut : valeur par défaut du Plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Préréglage de qualité pour le rendu PNG ou PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Remplacement de l’échelle de l’appareil (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Largeur maximale de rendu en pixels CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL de l’artefact en secondes pour le visualiseur et les sorties de fichiers autonomes. Maximum 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Remplacement de l’origine de l’URL du visualiseur. Remplace le Plugin `viewerBaseUrl`. Doit être en `http` ou `https`, sans requête ni hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Alias d’entrée hérités">
    Toujours acceptés pour la compatibilité descendante :

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation et limites">
    - `before` et `after` : 512 Kio max chacun.
    - `patch` : 2 Mio max.
    - `path` : 2048 octets max.
    - `lang` : 128 octets max.
    - `title` : 1024 octets max.
    - Plafond de complexité du patch : 128 fichiers max et 120000 lignes au total.
    - `patch` avec `before` ou `after` est rejeté.
    - Limites de sécurité des fichiers rendus (s’appliquent aux PNG et PDF) :
      - `fileQuality: "standard"` : 8 MP max (8 000 000 pixels rendus).
      - `fileQuality: "hq"` : 14 MP max (14 000 000 pixels rendus).
      - `fileQuality: "print"` : 24 MP max (24 000 000 pixels rendus).
      - Le PDF a également une limite de 50 pages.

  </Accordion>
</AccordionGroup>

## Contrat des détails de sortie

L’outil renvoie des métadonnées structurées sous `details`.

<AccordionGroup>
  <Accordion title="Champs du visualiseur">
    Champs partagés pour les modes qui créent un visualiseur :

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` lorsque disponibles)

  </Accordion>
  <Accordion title="Champs de fichier">
    Champs de fichier lorsqu’un PNG ou PDF est rendu :

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
  <Accordion title="Alias de compatibilité">
    Également renvoyés pour les appelants existants :

    - `format` (même valeur que `fileFormat`)
    - `imagePath` (même valeur que `filePath`)
    - `imageBytes` (même valeur que `fileBytes`)
    - `imageQuality` (même valeur que `fileQuality`)
    - `imageScale` (même valeur que `fileScale`)
    - `imageMaxWidth` (même valeur que `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Résumé du comportement par mode :

| Mode     | Ce qui est renvoyé                                                                                                     |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Champs du visualiseur uniquement.                                                                                      |
| `"file"` | Champs de fichier uniquement, sans artefact de visualiseur.                                                            |
| `"both"` | Champs du visualiseur plus champs de fichier. Si le rendu du fichier échoue, le visualiseur est quand même renvoyé avec `fileError` et l’alias `imageError`. |

## Sections inchangées réduites

- Le visualiseur peut afficher des lignes comme `N unmodified lines`.
- Les contrôles de développement sur ces lignes sont conditionnels et ne sont pas garantis pour tous les types d’entrée.
- Les contrôles de développement apparaissent lorsque le diff rendu contient des données de contexte développables, ce qui est typique pour les entrées before/after.
- Pour de nombreuses entrées de patch unifié, les corps de contexte omis ne sont pas disponibles dans les blocs du patch analysé, donc la ligne peut apparaître sans contrôles de développement. C’est un comportement attendu.
- `expandUnchanged` s’applique uniquement lorsqu’un contexte développable existe.

## Valeurs par défaut du Plugin

Définissez les valeurs par défaut à l’échelle du Plugin dans `~/.openclaw/openclaw.json` :

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

Valeurs par défaut prises en charge :

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

### Configuration persistante de l’URL du visualiseur

<ParamField path="viewerBaseUrl" type="string">
  Valeur de secours gérée par le Plugin pour les liens du visualiseur renvoyés lorsqu’un appel d’outil ne transmet pas `baseUrl`. Doit être en `http` ou `https`, sans requête ni hash.
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
  `false` : les requêtes non-loopback vers les routes du visualiseur sont refusées. `true` : les visualiseurs distants sont autorisés si le chemin avec jeton est valide.
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

- Les artefacts sont stockés dans le sous-dossier temporaire : `$TMPDIR/openclaw-diffs`.
- Les métadonnées des artefacts de visualiseur contiennent :
  - un ID d’artefact aléatoire (20 caractères hexadécimaux)
  - un jeton aléatoire (48 caractères hexadécimaux)
  - `createdAt` et `expiresAt`
  - le chemin stocké de `viewer.html`
- Le TTL d’artefact par défaut est de 30 minutes lorsqu’il n’est pas précisé.
- Le TTL maximal accepté pour le visualiseur est de 6 heures.
- Le nettoyage s’exécute de façon opportuniste après la création de l’artefact.
- Les artefacts expirés sont supprimés.
- Un nettoyage de secours supprime les dossiers périmés de plus de 24 heures lorsque les métadonnées sont absentes.

## URL du visualiseur et comportement réseau

Route du visualiseur :

- `/plugins/diffs/view/{artifactId}/{token}`

Ressources du visualiseur :

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Le document du visualiseur résout ces ressources relativement à l’URL du visualiseur, de sorte qu’un préfixe de chemin `baseUrl` facultatif est également préservé pour ces requêtes de ressources.

Comportement de construction de l’URL :

- Si `baseUrl` est fourni dans l’appel d’outil, il est utilisé après validation stricte.
- Sinon, si le Plugin `viewerBaseUrl` est configuré, il est utilisé.
- Sans l’un ou l’autre remplacement, l’URL du visualiseur utilise par défaut le loopback `127.0.0.1`.
- Si le mode de liaison Gateway est `custom` et que `gateway.customBindHost` est défini, cet hôte est utilisé.

Règles de `baseUrl` :

- Doit commencer par `http://` ou `https://`.
- Les paramètres de requête et le hash sont refusés.
- L’origine plus un chemin de base facultatif sont autorisés.

## Modèle de sécurité

<AccordionGroup>
  <Accordion title="Renforcement du visualiseur">
    - Loopback uniquement par défaut.
    - Chemins du visualiseur avec jeton et validation stricte de l’ID et du jeton.
    - CSP de réponse du visualiseur :
      - `default-src 'none'`
      - scripts et ressources uniquement depuis self
      - aucun `connect-src` sortant
    - Limitation des échecs distants lorsque l’accès distant est activé :
      - 40 échecs par 60 secondes
      - verrouillage de 60 secondes (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Renforcement du rendu de fichier">
    - Le routage des requêtes du navigateur de capture d’écran est refusé par défaut.
    - Seules les ressources locales du visualiseur provenant de `http://127.0.0.1/plugins/diffs/assets/*` sont autorisées.
    - Les requêtes réseau externes sont bloquées.

  </Accordion>
</AccordionGroup>

## Exigences du navigateur pour le mode fichier

`mode: "file"` et `mode: "both"` nécessitent un navigateur compatible Chromium.

Ordre de résolution :

<Steps>
  <Step title="Configuration">
    `browser.executablePath` dans la configuration OpenClaw.
  </Step>
  <Step title="Variables d’environnement">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Solution de secours par plateforme">
    Solution de secours via découverte de commande/chemin selon la plateforme.
  </Step>
</Steps>

Texte d’échec courant :

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Corrigez cela en installant Chrome, Chromium, Edge ou Brave, ou en définissant l’une des options de chemin d’exécutable ci-dessus.

## Dépannage

<AccordionGroup>
  <Accordion title="Erreurs de validation des entrées">
    - `Provide patch or both before and after text.` — incluez `before` et `after`, ou fournissez `patch`.
    - `Provide either patch or before/after input, not both.` — ne mélangez pas les modes d’entrée.
    - `Invalid baseUrl: ...` — utilisez une origine `http(s)` avec chemin facultatif, sans requête ni hash.
    - `{field} exceeds maximum size (...)` — réduisez la taille de la charge utile.
    - Rejet de patch volumineux — réduisez le nombre de fichiers du patch ou le nombre total de lignes.

  </Accordion>
  <Accordion title="Accessibilité du visualiseur">
    - L’URL du visualiseur pointe par défaut vers `127.0.0.1`.
    - Pour les scénarios d’accès distant, soit :
      - définissez le Plugin `viewerBaseUrl`, ou
      - transmettez `baseUrl` à chaque appel d’outil, ou
      - utilisez `gateway.bind=custom` et `gateway.customBindHost`
    - Si `gateway.trustedProxies` inclut loopback pour un proxy sur le même hôte (par exemple Tailscale Serve), les requêtes brutes loopback vers le visualiseur sans en-têtes d’IP client transférée échouent en mode fermé par conception.
    - Pour cette topologie de proxy :
      - préférez `mode: "file"` ou `mode: "both"` lorsque vous avez seulement besoin d’une pièce jointe, ou
      - activez intentionnellement `security.allowRemoteViewer` et définissez le Plugin `viewerBaseUrl` ou transmettez un `baseUrl` proxy/public lorsque vous avez besoin d’une URL de visualiseur partageable
    - Activez `security.allowRemoteViewer` uniquement lorsque vous prévoyez un accès externe au visualiseur.

  </Accordion>
  <Accordion title="La ligne des lignes non modifiées n’a pas de bouton de développement">
    Cela peut arriver avec une entrée patch lorsque le patch ne contient pas de contexte développable. C’est un comportement attendu et cela n’indique pas un échec du visualiseur.
  </Accordion>
  <Accordion title="Artefact introuvable">
    - L’artefact a expiré en raison du TTL.
    - Le jeton ou le chemin a été modifié.
    - Le nettoyage a supprimé des données périmées.

  </Accordion>
</AccordionGroup>

## Recommandations opérationnelles

- Préférez `mode: "view"` pour les revues interactives locales dans canvas.
- Préférez `mode: "file"` pour les canaux de chat sortants qui nécessitent une pièce jointe.
- Gardez `allowRemoteViewer` désactivé sauf si votre déploiement nécessite des URL de visualiseur distantes.
- Définissez un `ttlSeconds` court explicite pour les diffs sensibles.
- Évitez d’envoyer des secrets dans l’entrée du diff lorsque ce n’est pas nécessaire.
- Si votre canal compresse fortement les images (par exemple Telegram ou WhatsApp), préférez une sortie PDF (`fileFormat: "pdf"`).

<Note>
Moteur de rendu de diff propulsé par [Diffs](https://diffs.com).
</Note>

## Lié

- [Navigateur](/fr/tools/browser)
- [Plugins](/fr/tools/plugin)
- [Vue d’ensemble des outils](/fr/tools)
