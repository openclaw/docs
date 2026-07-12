---
read_when:
    - Vous souhaitez qu’un agent contrôle depuis votre téléphone votre véritable navigateur Chrome dans lequel vous êtes connecté
    - Vous voyez sans cesse l’invite Chrome « Allow remote debugging? » alors que personne n’est devant l’ordinateur
    - Vous souhaitez comprendre le modèle de sécurité de la prise de contrôle du navigateur via l’extension
summary: 'Extension Chrome : permettez à OpenClaw de piloter votre session Chrome connectée sans invite de débogage à distance'
title: Extension Chrome
x-i18n:
    generated_at: "2026-07-12T03:22:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb3f7d4bd9d933e0e876d21a1edf07bafbdc18d0196ce636981bd11ad5f2facd
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Extension Chrome

L’extension Chrome d’OpenClaw permet à un agent de contrôler vos **onglets Chrome
connectés** sans lancer de navigateur géré distinct et **sans** l’invite bloquante
« Allow remote debugging? » de Chrome.

C’est important lorsque vous pilotez OpenClaw depuis un téléphone (Telegram,
WhatsApp, etc.) : le [profil `user`](/fr/tools/browser#profiles-openclaw-user-chrome)
se connecte au port de débogage distant de Chrome, ce qui affiche une boîte de
dialogue de consentement sur l’ordinateur sur laquelle personne ne peut cliquer
en votre absence. L’extension utilise plutôt l’API `chrome.debugger` ; le seul
indice visible dans la page est donc la bannière révocable « OpenClaw started
debugging this browser » de Chrome.

Cette architecture est également utilisée par les extensions Chrome Claude
d’Anthropic et Codex d’OpenAI.

## Fonctionnement

Trois composants :

- **Service de contrôle du navigateur** (Gateway ou hôte Node) : l’API appelée
  par l’outil `browser`.
- **Relais de l’extension** (WebSocket local loopback) : un petit serveur lancé
  sur `127.0.0.1` par le service de contrôle. Il fournit à OpenClaw un point de
  terminaison Chrome DevTools Protocol et communique avec l’extension. Les deux
  parties s’authentifient avec un jeton local à l’hôte (voir ci-dessous).
- **Extension Chrome OpenClaw** (MV3) : se connecte aux onglets avec
  `chrome.debugger`, transfère le trafic CDP et gère le **groupe d’onglets
  OpenClaw**.

OpenClaw ne voit et ne contrôle que les onglets appartenant au **groupe d’onglets
OpenClaw**. Le groupe constitue la limite de consentement : faites-y glisser un
onglet pour le partager, puis faites-le glisser hors du groupe (ou cliquez sur
le bouton de la barre d’outils) pour révoquer immédiatement l’accès.

## Installation et association

1. Affichez le chemin de l’extension décompressée :

   ```bash
   openclaw browser extension path
   ```

2. Ouvrez `chrome://extensions`, activez **Developer mode**, cliquez sur **Load
   unpacked**, puis sélectionnez le répertoire affiché.

3. Affichez la chaîne d’association :

   ```bash
   openclaw browser extension pair
   ```

4. Cliquez sur l’icône OpenClaw dans la barre d’outils et collez la chaîne
   d’association dans la fenêtre contextuelle. Le badge passe à **ON** lorsque
   l’extension se connecte au relais.

Le jeton d’association est un **secret local à l’hôte**, créé lors de la
première utilisation et stocké sous `credentials/` dans le répertoire d’état
(mode `0600`). Chaque machine exécutant un navigateur — l’hôte du Gateway et
chaque hôte Node de navigateur — possède son propre jeton ; aucun identifiant
n’a donc besoin de transiter entre les machines. Pour le renouveler, supprimez
le fichier `browser-extension-relay.secret`, puis recommencez l’association.

## Utilisation

Sélectionnez le profil intégré `chrome` dans un appel à l’outil `browser`, ou
définissez-le comme profil par défaut :

```bash
openclaw config set browser.defaultProfile chrome
```

```json5
{
  browser: {
    profiles: {
      chrome: { driver: "extension", color: "#FF4500" },
    },
  },
}
```

- Partager un onglet : cliquez sur le bouton OpenClaw de la barre d’outils dans
  cet onglet (il rejoint le groupe d’onglets OpenClaw), ou faites glisser
  n’importe quel onglet dans le groupe.
- L’agent peut également ouvrir de nouveaux onglets ; ceux-ci rejoignent
  automatiquement le groupe.
- Révoquer l’accès : cliquez à nouveau sur le bouton, faites glisser l’onglet
  hors du groupe ou fermez la bannière de débogage de Chrome. L’agent perd
  immédiatement l’accès à cet onglet.

## Accès distant / entre machines

Chrome n’a pas besoin de s’exécuter sur l’hôte du Gateway. Trois topologies sont
prises en charge :

- **Même hôte** (Gateway et Chrome sur une même machine) : effectuez
  l’association sur cette machine avec `openclaw browser extension pair`. Le
  relais est accessible uniquement en local loopback.
- **Connexion directe à un Gateway distant** (Chrome sur votre ordinateur
  portable, Gateway sur un VPS et **rien d’autre sur l’ordinateur portable**) :
  sur le Gateway, exécutez
  `openclaw browser extension pair --gateway-url wss://your-gateway.example.com`.
  Cette commande affiche une chaîne
  `wss://…/browser/extension#<secret>` ; chargez l’extension sur l’ordinateur
  portable et associez-la. L’extension se connecte **directement au Gateway**
  via `wss://` — aucune installation d’OpenClaw, aucun Node, aucune CLI et aucun
  port entrant ouvert ne sont nécessaires sur l’ordinateur portable. Il s’agit
  du mode d’hébergement géré.
- **Via un hôte Node de navigateur** (Chrome sur une machine qui exécute déjà un
  Node OpenClaw) : exécutez `pair` sur le Node et effectuez l’association
  localement ; le Gateway transmet les actions du navigateur au Node via sa
  liaison Node authentifiée existante.

Le secret d’association est propre à chaque hôte (celui du Gateway dans le cas
d’une connexion directe) et est validé par la route `/browser/extension` du
Gateway. Pour la connexion directe, exposez le Gateway via TLS (`wss://`) afin
de chiffrer le secret d’association et le trafic CDP.
Le secret reste dans le fragment d’URL de la chaîne d’association et est
présenté lors de la négociation WebSocket comme identifiant de sous-protocole ;
les journaux d’accès habituels du proxy ne le reçoivent donc pas dans l’URL de
la requête. Vérifiez que tout proxy inverse conserve l’en-tête standard
`Sec-WebSocket-Protocol`.

## Diagnostic

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

`doctor` indique que la vérification du **relais de l’extension Chrome** échoue
jusqu’à ce que la fenêtre contextuelle de l’extension affiche **Connected**.

## Modèle de sécurité

- Le relais se lie uniquement à l’interface locale loopback ; les deux côtés de
  la connexion WebSocket sont authentifiés avec le jeton dérivé, et l’origine
  du côté de l’extension est vérifiée comme étant `chrome-extension://`.
- L’association directe au Gateway n’accepte pas le jeton du relais dans l’URL
  de la requête ; l’extension intégrée le transmet plutôt dans la liste des
  sous-protocoles WebSocket.
- L’agent ne peut voir et contrôler que les onglets du **groupe d’onglets
  OpenClaw**. Vos autres onglets restent privés.
- Contrairement au profil `user` (Chrome MCP), qui expose l’intégralité de votre
  navigateur connecté une fois l’invite de débogage distant approuvée,
  l’extension limite la surface partagée à un groupe d’onglets que vous pouvez
  contrôler d’un coup d’œil.

Voir aussi : [Navigateur](/fr/tools/browser) pour découvrir le modèle complet des
profils ainsi que les profils gérés `openclaw` et `user` de Chrome MCP.
