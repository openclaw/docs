---
read_when:
    - Vous voulez utiliser l’abonnement Claude Max avec des outils compatibles OpenAI
    - Vous voulez un serveur d’API local qui encapsule la CLI Claude Code
    - Vous voulez évaluer l’accès à Anthropic par abonnement par rapport à l’accès basé sur une clé API
summary: Proxy communautaire pour exposer les identifiants d’abonnement Claude sous forme de point de terminaison compatible avec OpenAI
title: Proxy API Claude Max
x-i18n:
    generated_at: "2026-06-28T20:45:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d8800f7d5bd7adf9bff4825a45878a1bbde73b4d54afe4b5b4aa2b1b5523bee
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** est un outil communautaire qui expose votre abonnement Claude Max/Pro comme un point de terminaison d’API compatible OpenAI. Cela vous permet d’utiliser votre abonnement avec tout outil prenant en charge le format d’API OpenAI.

<Warning>
Ce chemin concerne uniquement la compatibilité technique. Anthropic a déjà bloqué par le passé certaines utilisations d’abonnement en dehors de Claude Code. Vous devez décider vous-même si vous souhaitez l’utiliser et vérifier les règles de facturation actuelles d’Anthropic avant de vous y fier.

La documentation de support actuelle d’Anthropic indique que `claude -p` correspond à une utilisation Agent SDK/programmatique. La mise à jour du support d’Anthropic du 15 juin 2026 a suspendu le plan de crédits Agent SDK distinct annoncé. Pour l’instant, Claude Agent SDK, `claude -p` et l’utilisation d’applications tierces consomment toujours les limites d’utilisation de l’abonnement connecté.

Avant de vous fier à ce chemin, consultez l’[article sur le plan Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) d’Anthropic, ainsi que les articles de support Claude Code pour les comptes [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan) ou [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).
</Warning>

## Pourquoi l’utiliser ?

| Approche                  | Voie de coût                                   | Idéal pour                                          |
| ------------------------- | ---------------------------------------------- | --------------------------------------------------- |
| API Anthropic             | Paiement par jeton via Claude Console ou cloud | Applications de production, automatisation partagée, volume |
| Proxy d’abonnement Claude | Règles de plan et de crédit Claude Code / `claude -p` | Expériences personnelles avec des outils compatibles |

Si vous disposez d’un abonnement Claude Max ou Pro et souhaitez l’utiliser avec des outils compatibles OpenAI, ce proxy peut convenir à certains workflows personnels. Ce n’est pas un chemin illimité à tarif forfaitaire. Les clés d’API restent la voie la plus claire en matière de politique et de facturation pour une utilisation en production.

## Fonctionnement

```
Votre application → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (format OpenAI)              (convertit le format)          (utilise votre connexion)
```

Le proxy :

1. Accepte les requêtes au format OpenAI sur `http://localhost:3456/v1/chat/completions`
2. Les convertit en commandes Claude Code CLI
3. Renvoie les réponses au format OpenAI (streaming pris en charge)

## Bien démarrer

<Steps>
  <Step title="Installer le proxy">
    Nécessite Node.js 22+ et Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="Démarrer le serveur">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Tester le proxy">
    ```bash
    # Health check
    curl http://localhost:3456/health

    # List models
    curl http://localhost:3456/v1/models

    # Chat completion
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="Configurer OpenClaw">
    Faites pointer OpenClaw vers le proxy comme point de terminaison personnalisé compatible OpenAI :

    ```json5
    {
      env: {
        OPENAI_API_KEY: "not-needed",
        OPENAI_BASE_URL: "http://localhost:3456/v1",
      },
      agents: {
        defaults: {
          model: { primary: "openai/claude-opus-4" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Catalogue intégré

| ID du modèle      | Correspond à    |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## Configuration avancée

<AccordionGroup>
  <Accordion title="Notes sur le mode proxy compatible OpenAI">
    Ce chemin utilise la même route compatible OpenAI en mode proxy que les autres backends `/v1` personnalisés :

    - La mise en forme native des requêtes propre à OpenAI ne s’applique pas
    - Pas de `service_tier`, pas de `store` Responses, pas d’indices de cache de prompt, ni de mise en forme de payload compatible avec le raisonnement OpenAI
    - Les en-têtes d’attribution OpenClaw masqués (`originator`, `version`, `User-Agent`) ne sont pas injectés sur l’URL du proxy

  </Accordion>

  <Accordion title="Démarrage automatique sur macOS avec LaunchAgent">
    Créez un LaunchAgent pour exécuter automatiquement le proxy :

    ```bash
    cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>Label</key>
      <string>com.claude-max-api</string>
      <key>RunAtLoad</key>
      <true/>
      <key>KeepAlive</key>
      <true/>
      <key>ProgramArguments</key>
      <array>
        <string>/usr/local/bin/node</string>
        <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
      </array>
      <key>EnvironmentVariables</key>
      <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
      </dict>
    </dict>
    </plist>
    EOF

    launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
    ```

  </Accordion>
</AccordionGroup>

## Notes

- Il s’agit d’un **outil communautaire**, non officiellement pris en charge par Anthropic ou OpenClaw
- Nécessite un abonnement Claude Max/Pro actif avec Claude Code CLI authentifié
- Hérite du comportement de facturation, de crédits d’utilisation et de limites de débit de Claude Code `claude -p`
- Le proxy s’exécute localement et n’envoie pas de données à des serveurs tiers
- Les réponses en streaming sont entièrement prises en charge

<Note>
Pour l’intégration Anthropic native avec Claude CLI ou des clés d’API, consultez le [fournisseur Anthropic](/fr/providers/anthropic). Pour les abonnements OpenAI/Codex, consultez le [fournisseur OpenAI](/fr/providers/openai).
</Note>

## Connexe

<CardGroup cols={2}>
  <Card title="Fournisseur Anthropic" href="/fr/providers/anthropic" icon="bolt">
    Intégration OpenClaw native avec Claude CLI ou des clés d’API.
  </Card>
  <Card title="Fournisseur OpenAI" href="/fr/providers/openai" icon="robot">
    Pour les abonnements OpenAI/Codex.
  </Card>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Vue d’ensemble de tous les fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de la configuration.
  </Card>
</CardGroup>
