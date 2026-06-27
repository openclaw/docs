---
read_when:
    - Première configuration à partir de zéro
    - Vous voulez le chemin le plus rapide vers un chat fonctionnel
summary: Installez OpenClaw et lancez votre première conversation en quelques minutes.
title: Bien démarrer
x-i18n:
    generated_at: "2026-06-27T18:13:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 769682cfa35a361cc4adc49f010fed18cf897ce66e1404d07b631e4dede64de8
    source_path: start/getting-started.md
    workflow: 16
---

Installez OpenClaw, lancez l’onboarding et discutez avec votre assistant IA — le tout en
environ 5 minutes. À la fin, vous aurez un Gateway en cours d’exécution, une authentification configurée
et une session de chat fonctionnelle.

## Ce dont vous avez besoin

- **Node.js** — Node 24 recommandé (Node 22.19+ également pris en charge)
- **Une clé d’API** d’un fournisseur de modèles (Anthropic, OpenAI, Google, etc.) — l’onboarding vous la demandera

<Tip>
Vérifiez votre version de Node avec `node --version`.
**Utilisateurs Windows :** l’application native Windows Hub est le chemin bureau le plus simple. L’installateur
PowerShell et les chemins WSL2 Gateway sont également pris en charge. Consultez [Windows](/fr/platforms/windows).
Besoin d’installer Node ? Consultez [Configuration de Node](/fr/install/node).
</Tip>

## Configuration rapide

<Steps>
  <Step title="Install OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Install Script Process"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    Autres méthodes d’installation (Docker, Nix, npm) : [Installer](/fr/install).
    </Note>

  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    L’assistant vous guide dans le choix d’un fournisseur de modèles, la définition d’une clé d’API
    et la configuration du Gateway. Cela prend environ 2 minutes.

    Consultez [Onboarding (CLI)](/fr/start/wizard) pour la référence complète.

  </Step>
  <Step title="Verify the Gateway is running">
    ```bash
    openclaw gateway status
    ```

    Vous devriez voir le Gateway à l’écoute sur le port 18789.

  </Step>
  <Step title="Open the dashboard">
    ```bash
    openclaw dashboard
    ```

    Cela ouvre la Control UI dans votre navigateur. Si elle se charge, tout fonctionne.

  </Step>
  <Step title="Send your first message">
    Saisissez un message dans le chat de la Control UI et vous devriez recevoir une réponse de l’IA.

    Vous voulez plutôt discuter depuis votre téléphone ? Le canal le plus rapide à configurer est
    [Telegram](/fr/channels/telegram) (un simple jeton de bot). Consultez [Canaux](/fr/channels)
    pour toutes les options.

  </Step>
</Steps>

<Accordion title="Advanced: mount a custom Control UI build">
  Si vous maintenez une version localisée ou personnalisée du tableau de bord, faites pointer
  `gateway.controlUi.root` vers un répertoire contenant vos ressources statiques générées
  et `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
```

Définissez ensuite :

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

Redémarrez le Gateway et rouvrez le tableau de bord :

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Que faire ensuite

<Columns>
  <Card title="Connect a channel" href="/fr/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo, et plus encore.
  </Card>
  <Card title="Pairing and safety" href="/fr/channels/pairing" icon="shield">
    Contrôlez qui peut envoyer des messages à votre agent.
  </Card>
  <Card title="Configure the Gateway" href="/fr/gateway/configuration" icon="settings">
    Modèles, outils, sandbox et paramètres avancés.
  </Card>
  <Card title="Browse tools" href="/fr/tools" icon="wrench">
    Navigateur, exec, recherche web, Skills et plugins.
  </Card>
</Columns>

<Accordion title="Advanced: environment variables">
  Si vous exécutez OpenClaw avec un compte de service ou souhaitez des chemins personnalisés :

- `OPENCLAW_HOME` — répertoire personnel pour la résolution des chemins internes
- `OPENCLAW_STATE_DIR` — remplace le répertoire d’état
- `OPENCLAW_CONFIG_PATH` — remplace le chemin du fichier de configuration

Référence complète : [Variables d’environnement](/fr/help/environment).
</Accordion>

## Associés

- [Vue d’ensemble de l’installation](/fr/install)
- [Vue d’ensemble des canaux](/fr/channels)
- [Configuration](/fr/start/setup)
