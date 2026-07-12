---
read_when:
    - Vous devez installer Node.js avant d’installer OpenClaw
    - Vous avez installé OpenClaw, mais `openclaw` renvoie « commande introuvable »
    - Échec de `npm install -g` en raison de problèmes d’autorisations ou de `PATH`
summary: Installer et configurer Node.js pour OpenClaw — exigences de version, options d’installation et résolution des problèmes liés au PATH
title: Node.js
x-i18n:
    generated_at: "2026-07-12T02:57:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410686b714fe2830a0c6d77a52850eab5720a97747b9579bd730808db23a9dda
    source_path: install/node.md
    workflow: 16
---

OpenClaw nécessite **Node 22.19+, Node 23.11+ ou Node 24+**. **Node 24 est l’environnement d’exécution par défaut et recommandé** pour les installations, la CI et les processus de publication ; Node 22 reste pris en charge par l’intermédiaire de la branche LTS active. Le [script d’installation](/fr/install#alternative-install-methods) détecte et installe automatiquement Node — utilisez cette page lorsque vous souhaitez configurer Node vous-même (versions, PATH, installations globales).

## Vérifier votre version

```bash
node -v
```

`v24.x.x` ou une version ultérieure est la valeur par défaut recommandée. `v22.19.x` ou une version ultérieure constitue la voie prise en charge pour Node 22 LTS (passez à Node 24 lorsque cela vous convient). Les versions de Node 23 antérieures à `v23.11.0` ne sont pas prises en charge. Si Node est absent ou se trouve en dehors de la plage prise en charge, choisissez une méthode d’installation ci-dessous.

## Installer Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (recommandé) :

    ```bash
    brew install node
    ```

    Vous pouvez également télécharger le programme d’installation pour macOS depuis [nodejs.org](https://nodejs.org/).

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

    Vous pouvez également utiliser un gestionnaire de versions (voir ci-dessous).

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

    Vous pouvez également télécharger le programme d’installation pour Windows depuis [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Utiliser un gestionnaire de versions (nvm, fnm, mise, asdf)">
  Les gestionnaires de versions permettent de passer facilement d’une version de Node à une autre. Options courantes :

- [**fnm**](https://github.com/Schniz/fnm) - rapide et multiplateforme
- [**nvm**](https://github.com/nvm-sh/nvm) - largement utilisé sous macOS/Linux
- [**mise**](https://mise.jdx.dev/) - multilangage (Node, Python, Ruby, etc.)

Exemple avec fnm :

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Initialisez votre gestionnaire de versions dans le fichier de démarrage de votre shell (`~/.zshrc` ou `~/.bashrc`). Si vous ignorez cette étape, la commande `openclaw` risque d’être introuvable dans les nouvelles sessions de terminal, car le PATH n’inclura pas le répertoire des exécutables de Node.
  </Warning>
</Accordion>

## Résolution des problèmes

### `openclaw: command not found`

Cela signifie presque toujours que le répertoire global des exécutables de npm ne figure pas dans votre PATH.

<Steps>
  <Step title="Trouver votre préfixe npm global">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Vérifier s’il figure dans votre PATH">
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
        Ajoutez la sortie de `npm prefix -g` au PATH système via Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Erreurs d’autorisation lors de `npm install -g` (Linux)

Si vous rencontrez des erreurs `EACCES`, remplacez le préfixe global de npm par un répertoire dans lequel l’utilisateur peut écrire :

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Ajoutez la ligne `export PATH=...` à votre fichier `~/.bashrc` ou `~/.zshrc` pour rendre cette modification permanente.

## Pages connexes

- [Vue d’ensemble de l’installation](/fr/install) - toutes les méthodes d’installation
- [Mise à jour](/fr/install/updating) - maintenir OpenClaw à jour
- [Bien démarrer](/fr/start/getting-started) - premières étapes après l’installation
