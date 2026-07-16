---
read_when:
    - Vous devez installer Node.js avant d’installer OpenClaw
    - Vous avez installé OpenClaw, mais `openclaw` renvoie « command not found »
    - Échec de `npm install -g` en raison de problèmes d’autorisations ou de PATH
summary: Installer et configurer Node.js pour OpenClaw — versions requises, options d’installation et résolution des problèmes liés au PATH
title: Node.js
x-i18n:
    generated_at: "2026-07-16T13:28:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef4df255c24a11a549c757b597a07b00852e60973a5e513bdcf60796037a462a
    source_path: install/node.md
    workflow: 16
---

OpenClaw nécessite **Node 22.22.3+, Node 24.15+ ou Node 25.9+**. **Node 24 est l’environnement d’exécution par défaut et recommandé** pour les installations, l’intégration continue et les processus de publication ; Node 22 reste pris en charge par l’intermédiaire de la version LTS active. Node 23 n’est pas pris en charge. Le [script d’installation](/fr/install#alternative-install-methods) détecte et installe automatiquement Node — utilisez cette page si vous souhaitez configurer Node vous-même (versions, PATH, installations globales).

## Vérifier votre version

```bash
node -v
```

`v24.15.0` ou une version 24.x plus récente est la version par défaut recommandée. `v22.22.3` ou une version 22.x plus récente correspond à la voie Node 22 LTS prise en charge ; Node `v25.9.0+` est également pris en charge. Node 23 n’est pas pris en charge. Si Node est absent ou en dehors de la plage prise en charge, choisissez une méthode d’installation ci-dessous.

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
  Initialisez votre gestionnaire de versions dans le fichier de démarrage de votre shell (`~/.zshrc` ou `~/.bashrc`). Si vous omettez cette étape, `openclaw` risque de ne pas être trouvé dans les nouvelles sessions de terminal, car le PATH n’inclura pas le répertoire des exécutables de Node.
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
        Ajoutez la sortie de `npm prefix -g` au PATH de votre système via Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Erreurs d’autorisation avec `npm install -g` (Linux)

Si vous voyez des erreurs `EACCES`, remplacez le préfixe global de npm par un répertoire dans lequel l’utilisateur peut écrire :

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Ajoutez la ligne `export PATH=...` à votre fichier `~/.bashrc` ou `~/.zshrc` pour rendre cette modification permanente.

## Voir aussi

- [Présentation de l’installation](/fr/install) - toutes les méthodes d’installation
- [Mise à jour](/fr/install/updating) - maintenir OpenClaw à jour
- [Bien démarrer](/fr/start/getting-started) - premières étapes après l’installation
