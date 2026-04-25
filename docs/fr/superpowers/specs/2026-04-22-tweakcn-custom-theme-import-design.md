---
x-i18n:
    generated_at: "2026-04-25T13:57:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: cccaaa1b3e472279b7548ad5af5d50162db9e99a731e06be796de64ee9f8c8d8
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 15
---

# Conception de l’import de thème personnalisé Tweakcn

Statut : approuvé dans le terminal le 2026-04-22

## Résumé

Ajouter exactement un emplacement de thème personnalisé du Control UI, local au navigateur, pouvant être importé depuis un lien de partage tweakcn. Les familles de thèmes intégrées existantes restent `claw`, `knot` et `dash`. La nouvelle famille `custom` se comporte comme une famille de thèmes OpenClaw normale et prend en charge les modes `light`, `dark` et `system` lorsque la charge utile tweakcn importée inclut à la fois des ensembles de jetons clairs et sombres.

Le thème importé est stocké uniquement dans le profil de navigateur actuel avec le reste des paramètres du Control UI. Il n’est pas écrit dans la configuration du Gateway et ne se synchronise pas entre appareils ou navigateurs.

## Problème

Le système de thèmes du Control UI est actuellement fermé autour de trois familles de thèmes codées en dur :

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

Les utilisateurs peuvent basculer entre les familles intégrées et les variantes de mode, mais ils ne peuvent pas importer un thème depuis tweakcn sans modifier le CSS du dépôt. Le résultat demandé est plus limité qu’un système de thèmes général : conserver les trois thèmes intégrés et ajouter un emplacement importé contrôlé par l’utilisateur, qui peut être remplacé à partir d’un lien tweakcn.

## Objectifs

- Conserver inchangées les familles de thèmes intégrées existantes.
- Ajouter exactement un emplacement importé, pas une bibliothèque de thèmes.
- Accepter un lien de partage tweakcn ou une URL directe `https://tweakcn.com/r/themes/{id}`.
- Conserver le thème importé uniquement dans le stockage local du navigateur.
- Faire fonctionner l’emplacement importé avec les contrôles de mode existants `light`, `dark` et `system`.
- Garder un comportement d’échec sûr : un mauvais import ne casse jamais le thème actif de l’interface.

## Hors objectifs

- Pas de bibliothèque multi-thèmes ni de liste locale au navigateur des imports.
- Pas de persistance côté Gateway ni de synchronisation entre appareils.
- Pas d’éditeur CSS arbitraire ni d’éditeur JSON brut de thème.
- Pas de chargement automatique des ressources de police distantes depuis tweakcn.
- Pas de tentative de prise en charge des charges utiles tweakcn qui n’exposent qu’un seul mode.
- Pas de refactorisation générale du theming du dépôt au-delà des points d’extension requis pour le Control UI.

## Décisions utilisateur déjà prises

- Conserver les trois thèmes intégrés.
- Ajouter un emplacement d’import alimenté par tweakcn.
- Stocker le thème importé dans le navigateur, pas dans la configuration du Gateway.
- Prendre en charge `light`, `dark` et `system` pour le thème importé.
- Écraser l’emplacement personnalisé avec le prochain import est le comportement prévu.

## Approche recommandée

Ajouter un quatrième identifiant de famille de thème, `custom`, au modèle de thème du Control UI. La famille `custom` ne devient sélectionnable que lorsqu’un import tweakcn valide est présent. La charge utile importée est normalisée dans un enregistrement de thème personnalisé spécifique à OpenClaw et stockée dans le stockage local du navigateur avec le reste des paramètres d’interface.

À l’exécution, OpenClaw rend une balise `<style>` gérée qui définit les blocs de variables CSS personnalisées résolus :

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

Cela garde les variables du thème personnalisé limitées à la famille `custom` et évite que des variables CSS inline ne fuient dans les familles intégrées.

## Architecture

### Modèle de thème

Mettre à jour `ui/src/ui/theme.ts` :

- Étendre `ThemeName` pour inclure `custom`.
- Étendre `ResolvedTheme` pour inclure `custom` et `custom-light`.
- Étendre `VALID_THEME_NAMES`.
- Mettre à jour `resolveTheme()` afin que `custom` reflète le comportement existant de la famille :
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> `custom` ou `custom-light` selon la préférence du système d’exploitation

Aucun alias hérité n’est ajouté pour `custom`.

### Modèle de persistance

Étendre la persistance de `UiSettings` dans `ui/src/ui/storage.ts` avec une charge utile de thème personnalisé facultative :

- `customTheme?: ImportedCustomTheme`

Forme stockée recommandée :

```ts
type ImportedCustomTheme = {
  sourceUrl: string;
  themeId: string;
  label: string;
  importedAt: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

Remarques :

- `sourceUrl` stocke l’entrée utilisateur d’origine après normalisation.
- `themeId` est l’identifiant de thème tweakcn extrait de l’URL.
- `label` est le champ tweakcn `name` lorsqu’il est présent, sinon `Custom`.
- `light` et `dark` sont déjà des mappages de jetons OpenClaw normalisés, pas des charges utiles tweakcn brutes.
- La charge utile importée vit à côté des autres paramètres locaux au navigateur et est sérialisée dans le même document de stockage local.
- Si les données de thème personnalisé stockées sont absentes ou invalides au chargement, ignorer la charge utile et revenir à `theme: "claw"` lorsque la famille persistée était `custom`.

### Application à l’exécution

Ajouter un gestionnaire étroit de feuille de style de thème personnalisé dans le runtime du Control UI, détenu près de `ui/src/ui/app-settings.ts` et `ui/src/ui/theme.ts`.

Responsabilités :

- Créer ou mettre à jour une balise stable `<style id="openclaw-custom-theme">` dans `document.head`.
- Émettre du CSS uniquement lorsqu’une charge utile de thème personnalisé valide existe.
- Supprimer le contenu de la balise de style lorsque la charge utile est effacée.
- Conserver le CSS des familles intégrées dans `ui/src/styles/base.css` ; ne pas injecter les jetons importés dans la feuille de style versionnée.

Ce gestionnaire s’exécute chaque fois que les paramètres sont chargés, enregistrés, importés ou effacés.

### Sélecteurs du mode clair

L’implémentation doit privilégier `data-theme-mode="light"` pour le style clair inter-familles plutôt que de traiter `custom-light` comme un cas particulier. Si un sélecteur existant est fixé sur `data-theme="light"` et doit s’appliquer à chaque famille claire, l’élargir dans le cadre de ce travail.

## UX d’import

Mettre à jour `ui/src/ui/views/config.ts` dans la section `Appearance` :

- Ajouter une carte de thème `Custom` à côté de `Claw`, `Knot` et `Dash`.
- Afficher la carte comme désactivée lorsqu’aucun thème personnalisé importé n’existe.
- Ajouter un panneau d’import sous la grille des thèmes avec :
  - un champ texte pour un lien de partage tweakcn ou une URL `/r/themes/{id}`
  - un bouton `Import`
  - un chemin `Replace` lorsqu’une charge utile personnalisée existe déjà
  - une action `Clear` lorsqu’une charge utile personnalisée existe déjà
- Afficher le libellé du thème importé et l’hôte source lorsqu’une charge utile existe.
- Si le thème actif est `custom`, l’import d’un remplacement s’applique immédiatement.
- Si le thème actif n’est pas `custom`, l’import stocke seulement la nouvelle charge utile jusqu’à ce que l’utilisateur sélectionne la carte `Custom`.

Le sélecteur de thème des paramètres rapides dans `ui/src/ui/views/config-quick.ts` doit aussi afficher `Custom` uniquement lorsqu’une charge utile existe.

## Analyse d’URL et récupération distante

Le chemin d’import dans le navigateur accepte :

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

L’implémentation doit normaliser les deux formes vers :

- `https://tweakcn.com/r/themes/{id}`

Le navigateur récupère ensuite directement le point de terminaison normalisé `/r/themes/{id}`.

Utiliser un validateur de schéma étroit pour la charge utile externe. Un schéma zod est préféré, car il s’agit d’une frontière externe non fiable.

Champs distants requis :

- niveau supérieur `name` comme chaîne facultative
- `cssVars.theme` comme objet facultatif
- `cssVars.light` comme objet
- `cssVars.dark` comme objet

Si `cssVars.light` ou `cssVars.dark` est absent, rejeter l’import. C’est volontaire : le comportement produit approuvé est une prise en charge complète des modes, pas une synthèse au mieux d’un côté manquant.

## Mappage des jetons

Ne pas refléter aveuglément les variables tweakcn. Normaliser un sous-ensemble borné en jetons OpenClaw et dériver le reste dans un helper.

### Jetons importés directement

Depuis chaque bloc de mode tweakcn :

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`

Depuis `cssVars.theme` partagé lorsqu’il est présent :

- `font-sans`
- `font-mono`

Si un bloc de mode remplace `font-sans`, `font-mono` ou `radius`, la valeur locale au mode l’emporte.

### Jetons dérivés pour OpenClaw

L’importeur dérive des variables propres à OpenClaw à partir des couleurs de base importées :

- `--bg-accent`
- `--bg-elevated`
- `--bg-hover`
- `--panel`
- `--panel-strong`
- `--panel-hover`
- `--chrome`
- `--chrome-strong`
- `--text`
- `--text-strong`
- `--chat-text`
- `--muted`
- `--muted-strong`
- `--accent-hover`
- `--accent-muted`
- `--accent-subtle`
- `--accent-glow`
- `--focus`
- `--focus-ring`
- `--focus-glow`
- `--secondary`
- `--secondary-foreground`
- `--danger`
- `--danger-muted`
- `--danger-subtle`

Les règles de dérivation vivent dans un helper pur afin de pouvoir être testées indépendamment. Les formules exactes de mélange des couleurs sont un détail d’implémentation, mais le helper doit satisfaire deux contraintes :

- préserver une lisibilité du contraste proche de l’intention du thème importé
- produire une sortie stable pour la même charge utile importée

### Jetons ignorés en v1

Ces jetons tweakcn sont volontairement ignorés dans la première version :

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

Cela garde le périmètre concentré sur les jetons dont le Control UI actuel a réellement besoin.

### Polices

Les chaînes de pile de polices sont importées lorsqu’elles sont présentes, mais OpenClaw ne charge pas de ressources de police distantes en v1. Si la pile importée référence des polices indisponibles dans le navigateur, le comportement normal de repli s’applique.

## Comportement en cas d’échec

Les mauvais imports doivent échouer de manière fermée.

- Format d’URL invalide : afficher une erreur de validation inline, ne pas récupérer.
- Hôte ou forme de chemin non pris en charge : afficher une erreur de validation inline, ne pas récupérer.
- Échec réseau, réponse non OK ou JSON mal formé : afficher une erreur inline, conserver intacte la charge utile stockée actuelle.
- Échec de schéma ou absence des blocs light/dark : afficher une erreur inline, conserver intacte la charge utile stockée actuelle.
- Action d’effacement :
  - supprime la charge utile personnalisée stockée
  - supprime le contenu de la balise de style personnalisée gérée
  - si `custom` est actif, rebascule la famille de thème sur `claw`
- Charge utile personnalisée stockée invalide au premier chargement :
  - ignorer la charge utile stockée
  - ne pas émettre de CSS personnalisé
  - si la famille de thème persistée était `custom`, revenir à `claw`

À aucun moment un import échoué ne doit laisser le document actif avec des variables CSS personnalisées partielles appliquées.

## Fichiers censés changer dans l’implémentation

Fichiers principaux :

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

Nouveaux helpers probables :

- `ui/src/ui/custom-theme.ts`
- `ui/src/ui/custom-theme-import.ts`

Tests :

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- nouveaux tests ciblés pour l’analyse d’URL et la normalisation de la charge utile

## Tests

Couverture minimale de l’implémentation :

- analyser une URL de lien de partage en identifiant de thème tweakcn
- normaliser `/themes/{id}` et `/r/themes/{id}` vers l’URL de récupération
- rejeter les hôtes non pris en charge et les identifiants mal formés
- valider la forme de la charge utile tweakcn
- mapper une charge utile tweakcn valide vers des mappages de jetons OpenClaw `light` et `dark` normalisés
- charger et enregistrer la charge utile personnalisée dans les paramètres locaux au navigateur
- résoudre `custom` pour `light`, `dark` et `system`
- désactiver la sélection `Custom` lorsqu’aucune charge utile n’existe
- appliquer immédiatement le thème importé lorsque `custom` est déjà actif
- revenir à `claw` lorsque le thème personnalisé actif est effacé

Objectif de vérification manuelle :

- importer un thème tweakcn connu depuis les paramètres
- basculer entre `light`, `dark` et `system`
- basculer entre `custom` et les familles intégrées
- recharger la page et confirmer que le thème personnalisé importé persiste localement

## Notes de déploiement

Cette fonctionnalité est volontairement limitée. Si les utilisateurs demandent plus tard plusieurs thèmes importés, le renommage, l’export ou la synchronisation entre appareils, traiter cela comme une conception de suivi. Ne pas préconstruire une abstraction de bibliothèque de thèmes dans cette implémentation.
