---
read_when:
    - Implémentation du panneau Canvas macOS
    - Ajout de contrôles d’agent pour l’espace de travail visuel
    - Débogage des chargements de canevas WKWebView
summary: Panneau Canvas contrôlé par agent intégré via WKWebView + schéma d’URL personnalisé
title: Canevas
x-i18n:
    generated_at: "2026-06-28T00:13:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 45f0e1b27fbe58e85d57dbf35a6eb44d47df30569b8b10ed24e8bd240b4b5686
    source_path: platforms/mac/canvas.md
    workflow: 16
---

L’application macOS intègre un **panneau Canvas** contrôlé par l’agent à l’aide de `WKWebView`. Il
s’agit d’un espace de travail visuel léger pour HTML/CSS/JS, A2UI et les petites surfaces
d’interface utilisateur interactives.

## Où se trouve Canvas

L’état de Canvas est stocké sous Application Support :

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Le panneau Canvas sert ces fichiers via un **schéma d’URL personnalisé** :

- `openclaw-canvas://<session>/<path>`

Exemples :

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Si aucun `index.html` n’existe à la racine, l’application affiche une **page d’échafaudage intégrée**.

## Comportement du panneau

- Panneau sans bordure et redimensionnable, ancré près de la barre des menus (ou du curseur de la souris).
- Mémorise la taille et la position par session.
- Se recharge automatiquement lorsque les fichiers Canvas locaux changent.
- Un seul panneau Canvas est visible à la fois (la session est changée si nécessaire).

Canvas peut être désactivé depuis Réglages → **Autoriser Canvas**. Lorsqu’il est désactivé, les commandes
de nœud canvas renvoient `CANVAS_DISABLED`.

## Surface d’API de l’agent

Canvas est exposé via le **WebSocket Gateway**, afin que l’agent puisse :

- afficher/masquer le panneau
- naviguer vers un chemin ou une URL
- évaluer du JavaScript
- capturer une image instantanée

Exemples CLI :

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Notes :

- `canvas.navigate` accepte les **chemins Canvas locaux**, les URL `http(s)` et les URL `file://`.
- Si vous passez `"/"`, Canvas affiche l’échafaudage local ou `index.html`.

## A2UI dans Canvas

A2UI est hébergé par l’hôte canvas du Gateway et rendu dans le panneau Canvas.
Lorsque le Gateway annonce un hôte Canvas, l’application macOS navigue automatiquement vers la
page hôte A2UI à la première ouverture.

URL par défaut de l’hôte A2UI :

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Commandes A2UI (v0.8)

Canvas accepte actuellement les messages serveur→client **A2UI v0.8** :

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) n’est pas pris en charge.

Exemple CLI :

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Test rapide :

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Déclenchement de runs d’agent depuis Canvas

Canvas peut déclencher de nouveaux runs d’agent via des liens profonds :

- `openclaw://agent?...`

Exemple (en JS) :

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Paramètres de requête pris en charge :

- `message` : invite d’agent préremplie.
- `sessionKey` : identifiant de session stable.
- `thinking` : profil de réflexion facultatif.
- `deliver`, `to` ou `channel` : cible de livraison.
- `timeoutSeconds` : délai d’expiration facultatif du run.
- `key` : jeton de sécurité généré par l’application pour les appelants locaux de confiance.

L’application demande une confirmation sauf si une clé valide est fournie. Les liens sans clé
affichent le message et l’URL avant approbation, et ignorent les champs de routage de livraison ;
les liens avec clé utilisent le chemin normal de run Gateway.

## Notes de sécurité

- Le schéma Canvas bloque la traversée de répertoires ; les fichiers doivent se trouver sous la racine de session.
- Le contenu Canvas local utilise un schéma personnalisé (aucun serveur local loopback requis).
- Les URL `http(s)` externes ne sont autorisées que lorsqu’elles font l’objet d’une navigation explicite.

## Connexe

- [Application macOS](/fr/platforms/macos)
- [WebChat](/fr/web/webchat)
