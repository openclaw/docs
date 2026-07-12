---
read_when:
    - Vous souhaitez utiliser un abonnement Claude Max avec des outils compatibles avec OpenAI
    - Vous souhaitez un serveur d’API local qui encapsule la CLI Claude Code
    - Vous souhaitez comparer l’accès à Anthropic par abonnement et par clé API
summary: Proxy communautaire permettant d’exposer les identifiants d’abonnement Claude sous forme de point de terminaison compatible avec OpenAI
title: Proxy d’API Claude Max
x-i18n:
    generated_at: "2026-07-12T03:01:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** est un paquet npm communautaire (et non un plugin OpenClaw) qui
expose un abonnement Claude Max/Pro sous forme de point de terminaison d’API compatible
avec OpenAI, afin que vous puissiez connecter tout outil compatible avec OpenAI à votre
abonnement plutôt que d’utiliser une clé d’API Anthropic.

<Warning>
Compatibilité technique uniquement ; cette méthode n’est pas officiellement approuvée. Anthropic a
déjà bloqué certaines utilisations d’abonnements en dehors de Claude Code ; vérifiez
les règles de facturation actuelles d’Anthropic avant de vous appuyer sur cette solution.

La documentation Claude Code d’Anthropic décrit `claude -p` comme une utilisation
programmatique/avec l’Agent SDK. Depuis la mise à jour de l’assistance Anthropic du 15 juin 2026,
Claude Agent SDK, `claude -p` et l’utilisation d’applications tierces sont décomptés des
limites d’utilisation de l’abonnement de la session connectée (le forfait de crédits distinct
précédemment annoncé pour l’Agent SDK est suspendu). Consultez l’[article sur le forfait
Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan),
les articles sur les forfaits [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
et [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan),
ainsi que le [fournisseur Anthropic](/fr/providers/anthropic) pour connaître les propres
indications d’OpenClaw sur la facturation de la CLI Claude.
</Warning>

## Pourquoi utiliser cette solution

| Approche                       | Mode de facturation                                      | Idéal pour                                             |
| ------------------------------ | -------------------------------------------------------- | ------------------------------------------------------ |
| Clé d’API Anthropic            | Paiement par jeton via Claude Console                    | Applications de production, automatisation partagée, volume |
| Proxy d’abonnement Claude      | Règles du forfait et des crédits Claude Code / `claude -p` | Expérimentations personnelles avec des outils compatibles |

Ce proxy permet d’utiliser un abonnement Claude Max ou Pro avec des outils compatibles
avec OpenAI. Il ne s’agit pas d’une formule illimitée à tarif fixe : il hérite des limites
d’utilisation de Claude Code. Les clés d’API restent le mode de facturation le plus clair
pour une utilisation en production.

## Fonctionnement

```text
Votre application -> claude-max-api-proxy -> Claude Code CLI / claude -p -> Anthropic
     (format OpenAI)                    (convertit le format)              (utilise votre connexion)
```

Le proxy lance la CLI Claude Code en tant que sous-processus pour chaque requête, convertit
les requêtes de conversation au format OpenAI en invites pour la CLI, puis diffuse en continu
(ou renvoie) la réponse au format OpenAI.

## Prise en main

<Steps>
  <Step title="Installer le proxy">
    Nécessite Node.js 20+ et une CLI Claude Code authentifiée.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    claude auth login   # if not already authenticated
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
    curl http://localhost:3456/health
    curl http://localhost:3456/v1/models

    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="Configurer OpenClaw">
    Configurez OpenClaw pour utiliser le proxy comme point de terminaison personnalisé compatible avec OpenAI :

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

<Note>
Les identifiants de modèles ci-dessous appartiennent au catalogue du proxy, et non aux
références de modèles Anthropic d’OpenClaw. Chaque identifiant correspond à un alias de modèle
de la CLI Claude Code (`opus`, `sonnet`, `haiku`) ; le modèle sous-jacent change donc chaque fois
qu’Anthropic met à jour cet alias dans la CLI. Consultez le fichier README actuel du proxy avant
de vous appuyer sur une correspondance précise.
</Note>

| ID du modèle      | Alias de la CLI | Correspondance actuelle |
| ----------------- | --------------- | ----------------------- |
| `claude-opus-4`   | `opus`          | Claude Opus 4.5         |
| `claude-sonnet-4` | `sonnet`        | Claude Sonnet 4         |
| `claude-haiku-4`  | `haiku`         | Claude Haiku 4          |

## Configuration avancée

<AccordionGroup>
  <Accordion title="Remarques sur le proxy compatible avec OpenAI">
    Cette solution utilise la route générique personnalisée `/v1` compatible avec OpenAI
    d’OpenClaw, soit le même chemin que pour tout autre moteur auto-hébergé compatible avec OpenAI :

    - La mise en forme des requêtes propre à l’API OpenAI native ne s’applique pas.
    - `/fast` et `service_tier` ne s’appliquent qu’au trafic direct vers `api.anthropic.com` ;
      les routes du proxy laissent `service_tier` inchangé (consultez le
      [mode rapide du fournisseur Anthropic](/fr/providers/anthropic#advanced-configuration)).
    - Aucune mise en forme de charge utile pour `store` de Responses, les indications de cache
      d’invites ou la compatibilité avec le raisonnement OpenAI.
    - Les en-têtes d’attribution OpenAI/Codex d’OpenClaw (`originator`, `version`,
      `User-Agent`) sont envoyés uniquement avec le trafic OAuth natif vers `api.openai.com`,
      et non vers les cibles `OPENAI_BASE_URL` personnalisées telles que ce proxy.

  </Accordion>

  <Accordion title="Démarrage automatique sous macOS avec LaunchAgent">
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

## Remarques

- Hérite du comportement de facturation, des crédits d’utilisation et des limites de débit de `claude -p` dans Claude Code.
- Se lie uniquement à `127.0.0.1` ; n’envoie de données à aucun serveur tiers en dehors de l’appel propre à la CLI vers Anthropic.
- Les réponses diffusées en continu sont prises en charge.
- Les échecs d’authentification ne sont pas vérifiés au démarrage et n’apparaissent qu’au moment de l’exécution effective d’une requête de conversation ; si la CLI n’est pas authentifiée, attendez-vous à ce que la première requête échoue plutôt qu’à ce que le serveur refuse de démarrer.

<Note>
Pour une intégration Anthropic native avec la CLI Claude ou des clés d’API, consultez le [fournisseur Anthropic](/fr/providers/anthropic). Pour les abonnements OpenAI/Codex, consultez le [fournisseur OpenAI](/fr/providers/openai).
</Note>

## Ressources associées

<CardGroup cols={2}>
  <Card title="Fournisseur Anthropic" href="/fr/providers/anthropic" icon="bolt">
    Intégration native d’OpenClaw avec la CLI Claude ou des clés d’API.
  </Card>
  <Card title="Fournisseur OpenAI" href="/fr/providers/openai" icon="robot">
    Pour les abonnements OpenAI/Codex.
  </Card>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Présentation de tous les fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de la configuration.
  </Card>
</CardGroup>
