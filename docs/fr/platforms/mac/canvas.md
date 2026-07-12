---
read_when:
    - Implémentation du panneau Canvas de macOS
    - Ajout de contrôles d’agent pour l’espace de travail visuel
    - Débogage du chargement du canevas WKWebView
summary: Panneau Canvas contrôlé par l’agent, intégré via WKWebView et un schéma d’URL personnalisé
title: Canevas
x-i18n:
    generated_at: "2026-07-12T15:30:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 21955803c39debfbc34851a0c40a69c1f3c6ca009526d9929a4c429ad0b09084
    source_path: platforms/mac/canvas.md
    workflow: 16
---

L’app macOS intègre un **panneau Canvas** contrôlé par un agent à l’aide de `WKWebView`, un
espace de travail visuel léger pour HTML/CSS/JS, A2UI et de petites interfaces
utilisateur interactives.

## Emplacement de Canvas

L’état de Canvas est stocké dans Application Support :

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Le panneau Canvas sert ces fichiers au moyen d’un schéma d’URL personnalisé,
`openclaw-canvas://<session>/<path>` :

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

Si aucun fichier `index.html` n’existe à la racine, l’application affiche une page
de structure intégrée.

## Comportement du panneau

- Panneau sans bordure et redimensionnable, ancré près de la barre de menus (ou du curseur de la souris).
- Mémorise la taille et la position pour chaque session.
- Se recharge automatiquement lorsque les fichiers Canvas locaux changent.
- Un seul panneau Canvas est visible à la fois (la session change si nécessaire).

Canvas peut être désactivé depuis Settings -> **Autoriser Canvas**. Lorsqu’il est désactivé,
les commandes Canvas du Node renvoient `CANVAS_DISABLED`.

## Surface de l’API de l’agent

Canvas est exposé via le WebSocket du Gateway, ce qui permet à l’agent d’afficher ou de masquer le
panneau, d’accéder à un chemin ou à une URL, d’évaluer du JavaScript et de capturer une
image instantanée :

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`canvas.navigate` accepte les chemins Canvas locaux, les URL `http(s)` et les URL
`file://`. Le passage de `"/"` affiche la structure locale ou le fichier `index.html`.

Les cibles hébergées par le Gateway sous `/__openclaw__/canvas/` et
`/__openclaw__/a2ui/` sont résolues au moyen de l’URL Canvas délimitée actuelle de la
session du Node. L’application actualise cette capacité de courte durée avant la navigation ;
vous n’avez pas besoin de construire ni de copier vous-même une URL de capacité.

## A2UI dans Canvas

A2UI est hébergé par l’hôte Canvas du Gateway et rendu dans le panneau Canvas.
Lorsque le Gateway annonce un hôte Canvas, l’application macOS accède automatiquement
à la page de l’hôte A2UI lors de la première ouverture.

L’URL annoncée est délimitée par une capacité, par exemple
`http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`.
Traitez-la comme des identifiants éphémères, et non comme un lien stable.

### Commandes A2UI (v0.8)

Canvas accepte les messages A2UI v0.8 du serveur vers le client : `beginRendering`,
`surfaceUpdate`, `dataModelUpdate`, `deleteSurface`. `createSurface` (v0.9) n’est
pas encore pris en charge.

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"Si vous pouvez lire ceci, l’envoi A2UI fonctionne."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Test de bon fonctionnement rapide :

```bash
openclaw nodes canvas a2ui push --node <id> --text "Bonjour depuis A2UI"
```

## Déclenchement d’exécutions d’agent depuis Canvas

Canvas peut déclencher de nouvelles exécutions d’agent au moyen de liens profonds `openclaw://agent?...` :

```js
window.location.href = "openclaw://agent?message=Examinez%20cette%20conception";
```

Paramètres de requête pris en charge :

| Paramètre                  | Signification                                          |
| -------------------------- | ------------------------------------------------------ |
| `message`                  | Invite d’agent préremplie.                             |
| `sessionKey`               | Identifiant de session stable.                         |
| `thinking`                 | Profil de réflexion facultatif.                        |
| `deliver`, `to`, `channel` | Cible de livraison.                                    |
| `timeoutSeconds`           | Délai d’expiration facultatif de l’exécution.          |
| `key`                      | Jeton de sécurité généré par l’application pour les appelants locaux de confiance. |

L’application demande une confirmation sauf si une clé valide est fournie. Les liens
sans clé affichent le message et l’URL avant l’approbation et ignorent les champs
d’acheminement de la livraison ; les liens avec clé utilisent le chemin d’exécution normal du Gateway.

## Remarques sur la sécurité

- Le schéma Canvas bloque la traversée de répertoires ; les fichiers doivent se trouver sous la racine de la session.
- Le contenu Canvas local utilise un schéma personnalisé (aucun serveur de bouclage requis).
- Les URL `http(s)` externes ne sont autorisées que lorsqu’une navigation explicite y mène.
- Les pages web ordinaires servent uniquement au rendu. Les actions de l’agent ne sont acceptées que depuis le
  schéma Canvas appartenant à l’application ou le document A2UI du Gateway délimité précisément par une capacité
  et sélectionné par l’application ; les sous-cadres, les redirections, les capacités périmées et les requêtes
  modifiées ne peuvent pas déclencher d’actions.

## Voir aussi

- [Application macOS](/fr/platforms/macos)
- [WebChat](/fr/web/webchat)
