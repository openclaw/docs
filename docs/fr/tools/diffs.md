---
read_when:
    - Vous souhaitez que les agents présentent les modifications de code ou de Markdown sous forme de diffs
    - Vous souhaitez une URL de visualiseur prête pour le canevas ou un fichier de différences rendu
    - Vous avez besoin d’artefacts de diff contrôlés et temporaires, avec des valeurs par défaut sécurisées
sidebarTitle: Diffs
summary: Visionneuse de différences en lecture seule et moteur de rendu de fichiers pour les agents (outil de plugin facultatif)
title: Diffs
x-i18n:
    generated_at: "2026-07-12T16:02:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f28a8ac4191f72376ba5c8823337bd337e3fac236ea4ecc2204e6dcf2930e607
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` est un outil de Plugin intégré facultatif qui transforme un texte avant/après ou un correctif unifié en un artefact de différences en lecture seule. Il ajoute également de brèves instructions destinées à l’agent au début du prompt système et fournit une Skill complémentaire contenant des instructions plus détaillées.

Entrée : texte `before` + `after`, ou un `patch` unifié (mutuellement exclusifs).

Sortie : une URL de visualisation du Gateway pour une présentation dans le canevas, un chemin de fichier PNG/PDF rendu pour l’envoi de messages, ou les deux.

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
        Flux privilégiant le canevas : les agents appellent `diffs` avec `mode: "view"` et ouvrent `details.viewerUrl` avec `canvas present`.
      </Tab>
      <Tab title="file">
        Envoi de fichiers dans la conversation : les agents appellent `diffs` avec `mode: "file"` et envoient `details.filePath` avec `message` en utilisant `path` ou `filePath`.
      </Tab>
      <Tab title="both">
        Mode combiné (par défaut) : les agents appellent `diffs` avec `mode: "both"` pour obtenir les deux artefacts en un seul appel.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Désactiver les instructions système intégrées

Pour conserver l’outil tout en supprimant les instructions ajoutées au début du prompt système, définissez `plugins.entries.diffs.hooks.allowPromptInjection` sur `false` :

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

Cela bloque le hook `before_prompt_build` du Plugin tout en maintenant l’outil et la Skill disponibles. Pour désactiver à la fois les instructions et l’outil, désactivez plutôt le Plugin.

## Référence des entrées de l’outil

Tous les champs sont facultatifs, sauf indication contraire.

<ParamField path="before" type="string">
  Texte d’origine. Requis avec `after` lorsque `patch` est omis.
</ParamField>
<ParamField path="after" type="string">
  Texte mis à jour. Requis avec `before` lorsque `patch` est omis.
</ParamField>
<ParamField path="patch" type="string">
  Texte de différences unifié. Mutuellement exclusif avec `before` et `after`.
</ParamField>
<ParamField path="path" type="string">
  Nom de fichier affiché pour le mode avant/après.
</ParamField>
<ParamField path="lang" type="string">
  Indication de remplacement de la langue pour le mode avant/après. Les valeurs inconnues et les langues ne faisant pas partie de l’ensemble par défaut du visualiseur utilisent du texte brut, sauf si le Plugin Diff Viewer Language Pack est installé.
</ParamField>
<ParamField path="title" type="string">
  Remplacement du titre du visualiseur.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Mode de sortie. Utilise par défaut la valeur `defaults.mode` du Plugin (`both`). Alias obsolète : `"image"` se comporte exactement comme `"file"`.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Thème du visualiseur. Utilise par défaut la valeur `defaults.theme` du Plugin.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Disposition des différences. Utilise par défaut la valeur `defaults.layout` du Plugin.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Développe les sections inchangées lorsque le contexte complet est disponible. Option propre à chaque appel uniquement (ce n’est pas une clé par défaut du Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Format du fichier rendu. Utilise par défaut la valeur `defaults.fileFormat` du Plugin.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Préréglage de qualité pour le rendu PNG/PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Remplacement du facteur d’échelle de l’appareil (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Largeur maximale du rendu en pixels CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  Durée de vie de l’artefact, en secondes, pour le visualiseur et les fichiers autonomes générés. Maximum : `21600`.
</ParamField>
<ParamField path="baseUrl" type="string">
  Remplacement de l’origine de l’URL du visualiseur. Remplace la valeur `viewerBaseUrl` du Plugin. Doit utiliser `http` ou `https`, sans requête ni fragment.
</ParamField>

<AccordionGroup>
  <Accordion title="Validation et limites">
    - `before`/`after` : 512 Kio maximum chacun.
    - `patch` : 2 Mio maximum.
    - `path` : 2048 octets maximum.
    - `lang` : 128 octets maximum.
    - `title` : 1024 octets maximum.
    - Limite de complexité du correctif : 128 fichiers maximum et 120000 lignes au total.
    - L’utilisation de `patch` avec `before`/`after` est rejetée.
    - Limites de sécurité des fichiers rendus (PNG et PDF) :
      - `fileQuality: "standard"` : 8 MP maximum (8,000,000 pixels rendus).
      - `fileQuality: "hq"` : 14 MP maximum.
      - `fileQuality: "print"` : 24 MP maximum.
      - Le format PDF est également limité à 50 pages.

  </Accordion>
</AccordionGroup>

## Coloration syntaxique

Langages intégrés :

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` et `toml`.

Les alias courants (`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1`, etc.) sont normalisés vers ces langages.

Installez le Plugin Diff Viewer Language Pack pour obtenir davantage de langages (Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff et plus encore) :

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Sans ce pack, les langues non prises en charge sont tout de même rendues sous forme de texte brut lisible. Consultez le [Plugin Diffs Language Pack](/fr/plugins/reference/diffs-language-pack) et les [langages Shiki](https://shiki.style/languages) pour connaître le catalogue en amont.

## Contrat des détails de sortie

Tous les résultats réussis incluent `changed` : une entrée avant/après identique renvoie `false` sans créer d’artefact ; les résultats rendus renvoient `true`.

<AccordionGroup>
  <Accordion title="Champs du visualiseur (modes view et both)">
    - `changed`
    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` lorsqu’ils sont disponibles)

  </Accordion>
  <Accordion title="Champs du fichier (modes file et both)">
    - `changed`
    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (même valeur que `filePath`, pour assurer la compatibilité avec l’outil de messagerie)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
</AccordionGroup>

| Mode     | Renvoie                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| `"view"` | Uniquement les champs du visualiseur.                                                                        |
| `"file"` | Uniquement les champs du fichier, sans artefact de visualisation.                                            |
| `"both"` | Les champs du visualiseur et ceux du fichier. Si le rendu du fichier échoue, le visualiseur est tout de même renvoyé avec `fileError`. |

### Sections inchangées réduites

Le visualiseur affiche des lignes telles que `N unmodified lines`. Les contrôles de développement n’apparaissent que lorsque le diff rendu contient des données de contexte pouvant être développées (cas typique d’une entrée avant/après). De nombreux correctifs unifiés omettent le contenu du contexte dans leurs blocs, de sorte que la ligne peut apparaître sans contrôle de développement — c’est attendu, ce n’est pas un bogue. `expandUnchanged` ne s’applique que lorsqu’un contexte pouvant être développé existe.

### Navigation entre plusieurs fichiers

Les correctifs qui modifient plusieurs fichiers commencent par une carte récapitulative des fichiers modifiés : nombres totaux `+N` / `-N`, nombres par fichier, badges indiquant les ajouts, suppressions et renommages, ainsi que liens d’ancrage permettant d’accéder directement à chaque fichier. Les fichiers PNG/PDF rendus conservent les nombres dans l’en-tête de chaque fichier, mais omettent les contrôles interactifs de changement de vue, car ceux-ci sont inopérants dans un fichier statique.

## Valeurs par défaut du Plugin

Définissez les valeurs par défaut communes au Plugin dans `~/.openclaw/openclaw.json` :

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

Clés `defaults` prises en charge : `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds`. Les paramètres explicites d’appel de l’outil remplacent ces valeurs.

### Configuration persistante de l’URL du visualiseur

<ParamField path="viewerBaseUrl" type="string">
  URL de repli gérée par le Plugin pour les liens du visualiseur renvoyés lorsqu’un appel d’outil ne transmet pas `baseUrl`. Doit utiliser `http` ou `https`, sans requête ni fragment.
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
  `false` : les requêtes ne provenant pas de l’interface de bouclage vers les routes du visualiseur sont refusées. `true` : les visualiseurs distants sont autorisés si le chemin contenant le jeton est valide.
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

- Les artefacts se trouvent sous `$TMPDIR/openclaw-diffs`.
- Les métadonnées de la visionneuse stockent un ID d’artefact aléatoire de 20 caractères hexadécimaux, un jeton aléatoire de 48 caractères hexadécimaux, `createdAt`/`expiresAt` et le chemin stocké vers `viewer.html`.
- Durée de vie par défaut des artefacts : 30 minutes. Durée de vie maximale acceptée : 6 heures.
- Le nettoyage s’exécute de manière opportuniste après chaque appel de création d’artefact ; les artefacts expirés sont supprimés.
- Le balayage de secours supprime les dossiers obsolètes datant de plus de 24 heures lorsque les métadonnées sont absentes.

## URL de la visionneuse et comportement réseau

Route de la visionneuse : `/plugins/diffs/view/{artifactId}/{token}`

Ressources de la visionneuse :

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` (uniquement lorsque le diff utilise une langue d’un pack linguistique)

Le document de la visionneuse résout ces ressources relativement à l’URL de la visionneuse ; un préfixe de chemin `baseUrl` facultatif s’applique donc également aux requêtes de ressources.

Ordre de résolution de l’URL : `baseUrl` de l’appel d’outil (après validation stricte) -> `viewerBaseUrl` du Plugin -> valeur par défaut de bouclage `127.0.0.1`. Si le mode de liaison du Gateway est `custom` et que `gateway.customBindHost` est défini, cet hôte est utilisé à la place de l’adresse de bouclage.

Règles de `baseUrl` : doit utiliser `http://` ou `https://` ; les chaînes de requête et les fragments sont rejetés ; une origine accompagnée d’un chemin de base facultatif est autorisée.

## Modèle de sécurité

<AccordionGroup>
  <Accordion title="Renforcement de la visionneuse">
    - Limitée à l’interface de bouclage par défaut.
    - Chemins de visionneuse protégés par jeton, avec validation stricte des formats d’ID et de jeton.
    - CSP de la réponse de la visionneuse : `default-src 'none'` ; scripts et ressources provenant uniquement de la même origine ; aucune connexion sortante via `connect-src`.
    - Limitation des échecs d’accès à distance lorsque l’accès distant est activé : 40 échecs en 60 secondes déclenchent un verrouillage de 60 secondes (`429 Too Many Requests`).

  </Accordion>
  <Accordion title="Renforcement du rendu de fichiers">
    - Le routage des requêtes du navigateur de capture d’écran refuse tout par défaut.
    - Seules les ressources locales de la visionneuse provenant de `http://127.0.0.1/plugins/diffs/assets/*` sont autorisées.
    - Les requêtes réseau externes sont bloquées.

  </Accordion>
</AccordionGroup>

## Exigences du navigateur pour le mode fichier

`mode: "file"` et `mode: "both"` nécessitent un navigateur compatible avec Chromium.

Ordre de résolution :

<Steps>
  <Step title="Configuration">
    `browser.executablePath` dans la configuration d’OpenClaw.
  </Step>
  <Step title="Variables d’environnement">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Solution de repli selon la plateforme">
    Chemins d’installation courants et recherches dans `PATH` pour Chrome, Chromium, Edge et Brave.
  </Step>
</Steps>

Texte d’erreur courant : `Diff PNG/PDF rendering requires a Chromium-compatible browser...`. Corrigez ce problème en installant Chrome, Chromium, Edge ou Brave, ou en définissant l’une des options de chemin d’exécutable ci-dessus.

## Résolution des problèmes

<AccordionGroup>
  <Accordion title="Erreurs de validation des entrées">
    - `Provide patch or both before and after text.` -- incluez à la fois `before` et `after`, ou fournissez `patch`.
    - `Provide either patch or before/after input, not both.` -- ne mélangez pas les modes d’entrée.
    - `Invalid baseUrl: ...` -- utilisez une origine `http(s)` avec un chemin facultatif, sans requête ni fragment.
    - `{field} exceeds maximum size (...)` -- réduisez la taille de la charge utile.
    - Rejet d’un correctif volumineux -- réduisez le nombre de fichiers du correctif ou le nombre total de lignes.

  </Accordion>
  <Accordion title="Accessibilité de la visionneuse">
    - Par défaut, l’URL de la visionneuse correspond à `127.0.0.1`.
    - Pour un accès distant, définissez soit `viewerBaseUrl` du plugin, transmettez `baseUrl` à chaque appel, ou utilisez `gateway.bind=custom` avec `gateway.customBindHost`.
    - Si `gateway.trustedProxies` inclut l’adresse de bouclage pour un proxy sur le même hôte (par exemple Tailscale Serve), les requêtes brutes de la visionneuse via l’adresse de bouclage sans en-têtes d’adresse IP cliente transférés échouent de manière sécurisée par conception.
    - Pour cette topologie de proxy, privilégiez `mode: "file"`/`"both"` pour une pièce jointe, ou activez délibérément `security.allowRemoteViewer` ainsi que `viewerBaseUrl` du plugin/un `baseUrl` de proxy afin d’obtenir un lien partageable vers la visionneuse.
    - Activez `security.allowRemoteViewer` uniquement lorsqu’un accès externe à la visionneuse est prévu.

  </Accordion>
  <Accordion title="La ligne des lignes non modifiées ne comporte aucun bouton de développement">
    Comportement attendu pour une entrée de correctif dépourvue de contexte extensible ; il ne s’agit pas d’une défaillance de la visionneuse.
  </Accordion>
  <Accordion title="Artefact introuvable">
    - L’artefact a expiré en raison de la durée de vie (TTL).
    - Le jeton ou le chemin a changé.
    - Le nettoyage a supprimé les données obsolètes.

  </Accordion>
</AccordionGroup>

## Conseils d’exploitation

- Préférez `mode: "view"` pour les revues interactives locales dans le canevas.
- Préférez `mode: "file"` pour les canaux de discussion sortants qui nécessitent une pièce jointe.
- Laissez `allowRemoteViewer` désactivé, sauf si votre déploiement nécessite des URL de visionneuse distante.
- Définissez une valeur courte explicite pour `ttlSeconds` dans le cas de diffs sensibles.
- Évitez d’inclure des secrets dans l’entrée du diff lorsqu’ils ne sont pas nécessaires.
- Si votre canal compresse fortement les images (par exemple Telegram ou WhatsApp), préférez une sortie PDF (`fileFormat: "pdf"`).

<Note>
Moteur de rendu des diffs propulsé par [Diffs](https://diffs.com).
</Note>

## Voir aussi

- [Navigateur](/fr/tools/browser)
- [Plugins](/fr/tools/plugin)
- [Vue d’ensemble des outils](/fr/tools)
