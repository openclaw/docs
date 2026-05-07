---
read_when:
    - Vous devez installer Node.js avant d’installer OpenClaw
    - Vous avez installé OpenClaw, mais `openclaw` est introuvable
    - npm install -g échoue en raison de problèmes d’autorisations ou de PATH
summary: Installer et configurer Node.js pour OpenClaw - exigences de version, options d’installation et dépannage du PATH
title: Node.js
x-i18n:
    generated_at: "2026-05-07T13:21:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8ef8d00c8996741187000f55d07d15a2d09e89b6deb99cf687b6b9128ad266
    source_path: install/node.md
    workflow: 16
---

OpenClaw nécessite **Node 22.16 ou version ultérieure**. **Node 24 est le runtime par défaut et recommandé** pour les installations, la CI et les workflows de publication. Node 22 reste pris en charge via la ligne LTS active. Le [script d’installation](/fr/install#alternative-install-methods) détectera et installera Node automatiquement ; cette page s’adresse aux cas où vous voulez configurer Node vous-même et vous assurer que tout est correctement raccordé (versions, PATH, installations globales).

## Vérifier votre version

```bash
node -v
```

Si cette commande affiche `v24.x.x` ou une version ultérieure, vous utilisez la valeur par défaut recommandée. Si elle affiche `v22.16.x` ou une version ultérieure, vous utilisez le chemin Node 22 LTS pris en charge, mais nous recommandons tout de même de passer à Node 24 lorsque cela vous convient. Si Node n’est pas installé ou si la version est trop ancienne, choisissez une méthode d’installation ci-dessous.

## Installer Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (recommandé) :

    ```bash
    brew install node
    ```

    Ou téléchargez l’installateur macOS depuis [nodejs.org](https://nodejs.org/).

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian :**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL :**

    ```bash
    sudo dnf install nodejs
    ```

    Ou utilisez un gestionnaire de versions (voir ci-dessous).

  </Tab>
  <Tab title="Windows">
    **winget** (recommandé) :

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey :**

    ```powershell
    choco install nodejs-lts
    ```

    Ou téléchargez l’installateur Windows depuis [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Utiliser un gestionnaire de versions (nvm, fnm, mise, asdf)">
  Les gestionnaires de versions vous permettent de passer facilement d’une version de Node à une autre. Options populaires :

- [**fnm**](https://github.com/Schniz/fnm) - rapide, multiplateforme
- [**nvm**](https://github.com/nvm-sh/nvm) - largement utilisé sur macOS/Linux
- [**mise**](https://mise.jdx.dev/) - polyglotte (Node, Python, Ruby, etc.)

Exemple avec fnm :

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Assurez-vous que votre gestionnaire de versions est initialisé dans le fichier de démarrage de votre shell (`~/.zshrc` ou `~/.bashrc`). Si ce n’est pas le cas, `openclaw` peut ne pas être trouvé dans les nouvelles sessions de terminal, car le PATH n’inclura pas le répertoire bin de Node.
  </Warning>
</Accordion>

## Dépannage

### `openclaw: command not found`

Cela signifie presque toujours que le répertoire bin global de npm n’est pas dans votre PATH.

<Steps>
  <Step title="Trouver votre préfixe npm global">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Vérifier s’il est dans votre PATH">
    ```bash
    echo "$PATH"
    ```

    Recherchez `<npm-prefix>/bin` (macOS/Linux) ou `<npm-prefix>` (Windows) dans la sortie.

  </Step>
  <Step title="L’ajouter au fichier de démarrage de votre shell">
    <Tabs>
      <Tab title="macOS / Linux">
        Ajoutez ceci à `~/.zshrc` ou `~/.bashrc` :

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Ouvrez ensuite un nouveau terminal (ou exécutez `rehash` dans zsh / `hash -r` dans bash).
      </Tab>
      <Tab title="Windows">
        Ajoutez la sortie de `npm prefix -g` à votre PATH système via Paramètres → Système → Variables d’environnement.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Erreurs d’autorisation sur `npm install -g` (Linux)

Si vous voyez des erreurs `EACCES`, déplacez le préfixe global de npm vers un répertoire accessible en écriture par l’utilisateur :

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Ajoutez la ligne `export PATH=...` à votre `~/.bashrc` ou `~/.zshrc` pour rendre ce changement permanent.

## Articles connexes

- [Vue d’ensemble de l’installation](/fr/install) - toutes les méthodes d’installation
- [Mise à jour](/fr/install/updating) - garder OpenClaw à jour
- [Premiers pas](/fr/start/getting-started) - premières étapes après l’installation
