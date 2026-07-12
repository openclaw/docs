---
read_when:
    - Vous souhaitez utiliser un abonnement Claude Max avec des outils compatibles avec OpenAI
    - Vous souhaitez un serveur d’API local qui encapsule la CLI Claude Code
    - Vous souhaitez comparer l’accès à Anthropic par abonnement et celui par clé API
summary: Proxy communautaire permettant d’exposer les identifiants d’abonnement Claude sous la forme d’un endpoint compatible avec OpenAI
title: Proxy d’API Claude Max
x-i18n:
    generated_at: "2026-07-12T15:43:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** est un paquet npm communautaire (et non un plugin OpenClaw) qui
expose un abonnement Claude Max/Pro sous la forme d’un point de terminaison d’API compatible avec OpenAI, afin que
vous puissiez connecter n’importe quel outil compatible avec OpenAI à votre abonnement au lieu d’utiliser une
clé d’API Anthropic.

<Warning>
Compatibilité technique uniquement, il ne s’agit pas d’une méthode officiellement approuvée. Anthropic a
déjà bloqué certaines utilisations d’abonnements en dehors de Claude Code ; vérifiez
les règles de facturation actuelles d’Anthropic avant de vous appuyer sur cette méthode.

La documentation Claude Code d’Anthropic décrit `claude -p` comme une utilisation de l’Agent SDK/programmatique.
Depuis la mise à jour de l’assistance d’Anthropic du 15 juin 2026, Claude Agent SDK,
`claude -p` et l’utilisation d’applications tierces sont décomptés des limites d’utilisation de
l’abonnement de la session connectée (le programme de crédits distinct pour l’Agent SDK annoncé précédemment est
suspendu). Consultez l’[article sur le programme Agent SDK
](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) d’Anthropic,
les articles sur les offres [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
et [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan),
ainsi que le [fournisseur Anthropic](/fr/providers/anthropic) pour consulter les
propres notes d’OpenClaw sur la facturation de la CLI Claude.
</Warning>

## Pourquoi l’utiliser

| Approche                  | Mode de facturation                                      | Idéal pour                                   |
| ------------------------- | -------------------------------------------------------- | -------------------------------------------- |
| Clé d’API Anthropic       | Paiement par jeton via Claude Console                    | Applications de production, automatisation partagée, volume |
| Proxy d’abonnement Claude | Règles de l’offre et des crédits de Claude Code / `claude -p` | Expérimentations personnelles avec des outils compatibles |

Ce proxy permet d’utiliser un abonnement Claude Max ou Pro avec des outils
compatibles avec OpenAI. Il ne s’agit pas d’une formule forfaitaire illimitée : il hérite des limites
d’utilisation de Claude Code. Les clés d’API restent le mode de facturation le plus clair pour une utilisation en production.

## Fonctionnement

```text
Votre application -> claude-max-api-proxy -> CLI Claude Code / claude -p -> Anthropic
     (format OpenAI)                   (convertit le format)             (utilise votre connexion)
```

Le proxy lance la CLI Claude Code comme sous-processus pour chaque requête, convertit
les requêtes de conversation au format OpenAI en invites pour la CLI, puis diffuse (ou renvoie)
la réponse au format OpenAI.

## Bien démarrer

<Steps>
  <Step title="Installer le proxy">
    Nécessite Node.js 20+ et une CLI Claude Code authentifiée.

    ```bash
    npm install -g claude-max-api-proxy

    # Vérifier que la CLI Claude est authentifiée
    claude --version
    claude auth login   # si elle n’est pas déjà authentifiée
    ```

  </Step>
  <Step title="Démarrer le serveur">
    ```bash
    claude-max-api
    # Le serveur s’exécute à l’adresse http://localhost:3456
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
        "messages": [{"role": "user", "content": "Bonjour !"}]
      }'
    ```

  </Step>
  <Step title="Configurer OpenClaw">
    Configurez le proxy dans OpenClaw comme point de terminaison personnalisé compatible avec OpenAI :

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
références de modèles Anthropic d’OpenClaw. Chaque identifiant correspond à un alias de modèle de la CLI Claude Code (`opus`, `sonnet`,
`haiku`) ; le modèle sous-jacent change donc chaque fois qu’Anthropic met à jour cet
alias dans la CLI. Consultez le README actuel du proxy avant de vous appuyer sur une
correspondance spécifique.
</Note>

| Identifiant du modèle | Alias de la CLI | Correspondance actuelle |
| --------------------- | --------------- | ----------------------- |
| `claude-opus-4`   | `opus`    | Claude Opus 4.5 |
| `claude-sonnet-4` | `sonnet`  | Claude Sonnet 4 |
| `claude-haiku-4`  | `haiku`   | Claude Haiku 4  |

## Configuration avancée

<AccordionGroup>
  <Accordion title="Remarques sur le proxy compatible avec OpenAI">
    Cette configuration utilise la route générique personnalisée `/v1` d’OpenClaw compatible avec OpenAI, la même
    que pour tout autre service principal auto-hébergé compatible avec OpenAI :

    - La mise en forme des requêtes propre à l’API OpenAI native ne s’applique pas.
    - `/fast` et `service_tier` s’appliquent uniquement au trafic direct vers `api.anthropic.com` ;
      les routes du proxy ne modifient pas `service_tier` (voir le
      [mode rapide du fournisseur Anthropic](/fr/providers/anthropic#advanced-configuration)).
    - Aucune mise en forme de charge utile pour `store` de Responses, les indications de cache d’invite ou la compatibilité du raisonnement OpenAI.
    - Les en-têtes d’attribution OpenAI/Codex d’OpenClaw (`originator`, `version`,
      `User-Agent`) sont envoyés uniquement avec le trafic OAuth natif vers `api.openai.com`, et non
      vers les cibles `OPENAI_BASE_URL` personnalisées telles que ce proxy.

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

- Hérite du comportement de Claude Code concernant la facturation, les crédits d’utilisation et les limites de débit de `claude -p`.
- Écoute uniquement sur `127.0.0.1` ; n’envoie aucune donnée à un serveur tiers autre que l’appel propre de la CLI à Anthropic.
- Les réponses diffusées en continu sont prises en charge.
- Les échecs d’authentification ne sont pas vérifiés au démarrage et n’apparaissent qu’une fois qu’une requête de conversation est réellement exécutée ; si la CLI n’est pas authentifiée, attendez-vous à ce que la première requête échoue plutôt que le serveur refuse de démarrer.

<Note>
Pour l’intégration Anthropic native avec la CLI Claude ou des clés d’API, consultez le [fournisseur Anthropic](/fr/providers/anthropic). Pour les abonnements OpenAI/Codex, consultez le [fournisseur OpenAI](/fr/providers/openai).
</Note>

## Pages connexes

<CardGroup cols={2}>
  <Card title="Fournisseur Anthropic" href="/fr/providers/anthropic" icon="bolt">
    Intégration OpenClaw native avec la CLI Claude ou des clés d’API.
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
